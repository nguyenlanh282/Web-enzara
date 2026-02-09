import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AdminNotificationsService } from "../notifications/admin-notifications.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderFilterDto } from "./dto/order-filter.dto";
import {
  Prisma,
  OrderStatus,
  PaymentStatus,
  VoucherType,
} from "@prisma/client";
import { generateOrderNumber } from "./helpers/order-number.generator";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  /**
   * Create a new order within a Prisma transaction.
   * 1. Validate items exist and have stock
   * 2. Calculate prices from DB (never trust client prices)
   * 3. Validate voucher if provided
   * 4. Calculate shipping fee
   * 5. Generate order number
   * 6. Create order + items + initial timeline
   * 7. Decrement stock
   * 8. Increment voucher usedCount
   */
  async createOrder(dto: CreateOrderDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Order must have at least one item");
    }

    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Validate items and gather product data
      const orderItems: Array<{
        productId: string;
        variantId: string | null;
        productName: string;
        variantName: string | null;
        sku: string | null;
        price: number;
        quantity: number;
        total: number;
      }> = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, isActive: true },
          include: {
            variants: {
              where: item.variantId
                ? { id: item.variantId, isActive: true }
                : undefined,
            },
          },
        });

        if (!product) {
          throw new BadRequestException(
            `Product with ID ${item.productId} not found or inactive`,
          );
        }

        let price: number;
        let variantName: string | null = null;
        let sku: string | null = product.sku;
        let stockSource: "product" | "variant" = "product";
        let availableStock = product.stockQuantity;
        let variantId: string | null = null;

        if (item.variantId) {
          const variant = product.variants.find(
            (v) => v.id === item.variantId,
          );
          if (!variant) {
            throw new BadRequestException(
              `Variant with ID ${item.variantId} not found or inactive`,
            );
          }
          // Use variant sale price if available, otherwise variant price
          price = variant.salePrice
            ? Number(variant.salePrice)
            : Number(variant.price);
          variantName = variant.name;
          sku = variant.sku || product.sku;
          stockSource = "variant";
          availableStock = variant.stockQuantity;
          variantId = variant.id;
        } else {
          // Use product sale price if available, otherwise base price
          price = product.salePrice
            ? Number(product.salePrice)
            : Number(product.basePrice);
        }

        if (availableStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}"${variantName ? ` (${variantName})` : ""}. Available: ${availableStock}, Requested: ${item.quantity}`,
          );
        }

        const lineTotal = price * item.quantity;

        orderItems.push({
          productId: product.id,
          variantId,
          productName: product.name,
          variantName,
          sku,
          price,
          quantity: item.quantity,
          total: lineTotal,
        });
      }

      // 2. Calculate subtotal from DB prices
      const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

      // 3. Validate voucher if provided
      let discountAmount = 0;
      let voucherId: string | null = null;

      if (dto.voucherCode) {
        const voucher = await tx.voucher.findUnique({
          where: { code: dto.voucherCode },
        });

        if (!voucher) {
          throw new BadRequestException("Voucher not found");
        }

        const now = new Date();
        if (!voucher.isActive) {
          throw new BadRequestException("Voucher is not active");
        }
        if (now < voucher.startDate || now > voucher.endDate) {
          throw new BadRequestException("Voucher is expired or not yet valid");
        }
        if (
          voucher.usageLimit !== null &&
          voucher.usedCount >= voucher.usageLimit
        ) {
          throw new BadRequestException("Voucher usage limit reached");
        }
        if (
          voucher.minOrderAmount !== null &&
          subtotal < Number(voucher.minOrderAmount)
        ) {
          throw new BadRequestException(
            `Minimum order amount for this voucher is ${Number(voucher.minOrderAmount).toLocaleString("vi-VN")}`,
          );
        }

        // Check per-user limit if user is authenticated
        if (userId && voucher.perUserLimit > 0) {
          const userUsageCount = await tx.order.count({
            where: {
              customerId: userId,
              voucherId: voucher.id,
              status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
            },
          });
          if (userUsageCount >= voucher.perUserLimit) {
            throw new BadRequestException(
              "You have reached the usage limit for this voucher",
            );
          }
        }

        // Calculate discount
        switch (voucher.type) {
          case VoucherType.PERCENTAGE: {
            discountAmount = Math.floor(
              (subtotal * Number(voucher.value)) / 100,
            );
            if (
              voucher.maxDiscount !== null &&
              discountAmount > Number(voucher.maxDiscount)
            ) {
              discountAmount = Number(voucher.maxDiscount);
            }
            break;
          }
          case VoucherType.FIXED_AMOUNT: {
            discountAmount = Number(voucher.value);
            if (discountAmount > subtotal) {
              discountAmount = subtotal;
            }
            break;
          }
          case VoucherType.FREE_SHIPPING: {
            // FREE_SHIPPING discount is applied to shipping fee later
            // Set discountAmount to 0 here; shipping fee will be 0
            discountAmount = 0;
            break;
          }
        }

        voucherId = voucher.id;
      }

      // 4. Calculate shipping fee (free if subtotal >= 500000, else 30000)
      let shippingFee = subtotal >= 500000 ? 0 : 30000;

      // Apply FREE_SHIPPING voucher
      if (dto.voucherCode && voucherId) {
        const voucher = await tx.voucher.findUnique({
          where: { id: voucherId },
        });
        if (voucher && voucher.type === VoucherType.FREE_SHIPPING) {
          shippingFee = 0;
        }
      }

      // 4b. Apply loyalty points redemption
      // 5. Generate order number (moved up for use in loyalty description)
      const orderNumber = await generateOrderNumber(tx);

      let loyaltyDiscount = 0;
      if (dto.pointsToRedeem && dto.pointsToRedeem > 0 && userId) {
        const balance = await this.loyaltyService.getBalance(userId);
        if (dto.pointsToRedeem > balance.currentBalance) {
          throw new BadRequestException(
            `Khong du diem. So du hien tai: ${balance.currentBalance} diem`,
          );
        }

        // Calculate loyalty discount: points * 10 = VND, but can't exceed subtotal after voucher
        const afterVoucher = subtotal - discountAmount;
        loyaltyDiscount = Math.min(
          dto.pointsToRedeem * 10,
          Math.max(0, afterVoucher),
        );

        // Only redeem if there's actual discount value
        if (loyaltyDiscount > 0) {
          await this.loyaltyService.redeemPoints(
            userId,
            dto.pointsToRedeem,
            'Su dung diem cho don hang #' + orderNumber,
          );
        }
      }

      // Combine voucher + loyalty into discountAmount for storage
      const totalDiscount = discountAmount + loyaltyDiscount;

      // Calculate total
      const total = subtotal - totalDiscount + shippingFee;

      // 6. Create order + items + initial timeline
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: userId || null,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          subtotal,
          discountAmount: totalDiscount,
          shippingFee,
          total,
          voucherId,
          shippingName: dto.shippingName,
          shippingPhone: dto.shippingPhone,
          shippingEmail: dto.shippingEmail || null,
          shippingAddress: dto.shippingAddress,
          shippingWard: dto.shippingWard,
          shippingDistrict: dto.shippingDistrict,
          shippingProvince: dto.shippingProvince,
          note: dto.note || null,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              price: item.price,
              quantity: item.quantity,
              total: item.total,
            })),
          },
          timeline: {
            create: {
              status: OrderStatus.PENDING,
              note: "Order created",
              createdBy: userId || null,
            },
          },
        },
        include: {
          items: true,
          timeline: { orderBy: { createdAt: "asc" } },
        },
      });

      // 7. Decrement stock
      for (const item of dto.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });
        }

        // Also increment soldCount on product level if variant was used
        if (item.variantId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { soldCount: { increment: item.quantity } },
          });
        }
      }

      // 8. Increment voucher usedCount
      if (voucherId) {
        await tx.voucher.update({
          where: { id: voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return order;
    });

    // 9. Send order confirmation notifications (non-blocking)
    this.notificationsService.sendOrderConfirmation(order).catch((err) => {
      this.logger.error('Failed to send order confirmation:', err);
    });

    // 10. Create admin inbox notification (non-blocking)
    const itemsSummary = order.items
      .map((item) => `${item.productName} x${item.quantity}`)
      .join(', ');
    this.adminNotificationsService
      .createNotification(
        `Don hang moi #${order.orderNumber}`,
        `Khach hang: ${order.shippingName} - ${order.shippingPhone}. San pham: ${itemsSummary}. Tong: ${Number(order.total).toLocaleString('vi-VN')}d`,
        { orderId: order.id, orderNumber: order.orderNumber },
      )
      .catch((err) => {
        this.logger.error('Failed to create admin notification:', err);
      });

    return order;
  }

  /**
   * Find all orders with pagination and filters (admin).
   */
  async findAll(filter: OrderFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.paymentStatus) {
      where.paymentStatus = filter.paymentStatus;
    }

    if (filter.search) {
      where.OR = [
        { orderNumber: { contains: filter.search, mode: "insensitive" } },
        { shippingPhone: { contains: filter.search } },
        { shippingName: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.createdAt.lte = new Date(filter.endDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          items: true,
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single order by ID with full details.
   */
  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        timeline: { orderBy: { createdAt: "asc" } },
        voucher: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * Find an order by its order number.
   */
  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with number ${orderNumber} not found`,
      );
    }

    return order;
  }

  /**
   * Update order status and add a timeline entry.
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    userId?: string,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Determine additional timestamp fields based on status
    const statusTimestamps: Prisma.OrderUpdateInput = {};
    switch (status) {
      case OrderStatus.SHIPPING:
        statusTimestamps.shippedAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        statusTimestamps.deliveredAt = new Date();
        // COD orders are considered paid on delivery
        if (
          order.paymentMethod === "COD" &&
          order.paymentStatus === PaymentStatus.PENDING
        ) {
          statusTimestamps.paymentStatus = PaymentStatus.PAID;
          statusTimestamps.paidAt = new Date();
        }
        break;
      case OrderStatus.CANCELLED:
        statusTimestamps.cancelledAt = new Date();
        if (note) {
          statusTimestamps.cancelReason = note;
        }
        break;
    }

    const [updatedOrder] = await Promise.all([
      this.prisma.order.update({
        where: { id },
        data: {
          status,
          ...statusTimestamps,
        },
        include: {
          items: true,
          timeline: { orderBy: { createdAt: "asc" } },
        },
      }),
      this.prisma.orderTimeline.create({
        data: {
          orderId: id,
          status,
          note: note || null,
          createdBy: userId || null,
        },
      }),
    ]);

    // If cancelled, restore stock and voucher usage
    if (status === OrderStatus.CANCELLED) {
      await this.restoreStockAndVoucher(order.id);
    }

    // Send notifications based on status (non-blocking)
    if (status === OrderStatus.SHIPPING) {
      this.notificationsService.sendShippingUpdate(updatedOrder).catch((err) => {
        this.logger.error('Failed to send shipping update:', err);
      });
    } else if (status === OrderStatus.DELIVERED) {
      this.notificationsService.sendDeliveryConfirmation(updatedOrder).catch((err) => {
        this.logger.error('Failed to send delivery confirmation:', err);
      });

      // Earn loyalty points on delivery (non-blocking)
      if (updatedOrder.customerId) {
        const basePoints = Math.floor(Number(updatedOrder.total) / 100);
        if (basePoints > 0) {
          this.loyaltyService
            .earnPoints(
              updatedOrder.customerId,
              basePoints,
              `Tich diem don hang #${updatedOrder.orderNumber}`,
              updatedOrder.id,
            )
            .catch((err) => {
              this.logger.error('Failed to earn loyalty points:', err);
            });
        }
      }
    } else if (status === OrderStatus.CANCELLED) {
      this.notificationsService.sendOrderCancellation(updatedOrder).catch((err) => {
        this.logger.error('Failed to send order cancellation notification:', err);
      });
    }

    return updatedOrder;
  }

  /**
   * Confirm payment for an order (used by SePay webhook).
   */
  async confirmPayment(id: string, sepayTxId: string, paidAt: Date) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      this.logger.warn(
        `Order ${order.orderNumber} already marked as paid. Skipping.`,
      );
      return order;
    }

    const [updatedOrder] = await Promise.all([
      this.prisma.order.update({
        where: { id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          sepayTxId,
          paidAt,
        },
      }),
      this.prisma.orderTimeline.create({
        data: {
          orderId: id,
          status: "PAYMENT_CONFIRMED",
          note: `Payment confirmed via SePay (TX: ${sepayTxId})`,
        },
      }),
    ]);

    // Send payment success notification (non-blocking)
    this.notificationsService.sendPaymentSuccess(updatedOrder).catch((err) => {
      this.logger.error('Failed to send payment success notification:', err);
    });

    return updatedOrder;
  }

  /**
   * Add a timeline entry to an order.
   */
  async addTimeline(
    orderId: string,
    status: string,
    note?: string,
    createdBy?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return this.prisma.orderTimeline.create({
      data: {
        orderId,
        status,
        note: note || null,
        createdBy: createdBy || null,
      },
    });
  }

  /**
   * Cancel an order. Only allowed if status is PENDING.
   * Restores stock and voucher usage.
   */
  async cancelOrder(id: string, reason?: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        "Only orders with PENDING status can be cancelled",
      );
    }

    // Verify ownership if userId is provided and is a customer
    if (userId && order.customerId && order.customerId !== userId) {
      throw new BadRequestException("You can only cancel your own orders");
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason || null,
        },
        include: {
          items: true,
          timeline: { orderBy: { createdAt: "asc" } },
        },
      });

      // Add timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId: id,
          status: OrderStatus.CANCELLED,
          note: reason || "Order cancelled by user",
          createdBy: userId || null,
        },
      });

      // Restore stock
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
        // Decrement soldCount
        await tx.product.update({
          where: { id: item.productId },
          data: {
            soldCount: { decrement: item.quantity },
          },
        });
      }

      // Restore voucher usage
      if (order.voucherId) {
        await tx.voucher.update({
          where: { id: order.voucherId },
          data: { usedCount: { decrement: 1 } },
        });
      }

      return updatedOrder;
    });

    // Send order cancellation notification (non-blocking)
    this.notificationsService.sendOrderCancellation(updatedOrder).catch((err) => {
      this.logger.error('Failed to send order cancellation notification:', err);
    });

    return updatedOrder;
  }

  /**
   * Get a customer's orders with pagination.
   */
  async getCustomerOrders(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where: { customerId: userId } }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Validate a voucher and calculate discount.
   */
  async validateVoucher(code: string, subtotal: number) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      return { valid: false, discount: 0, message: "Voucher not found" };
    }

    const now = new Date();

    if (!voucher.isActive) {
      return { valid: false, discount: 0, message: "Voucher is not active" };
    }

    if (now < voucher.startDate || now > voucher.endDate) {
      return {
        valid: false,
        discount: 0,
        message: "Voucher is expired or not yet valid",
      };
    }

    if (
      voucher.usageLimit !== null &&
      voucher.usedCount >= voucher.usageLimit
    ) {
      return {
        valid: false,
        discount: 0,
        message: "Voucher usage limit reached",
      };
    }

    if (
      voucher.minOrderAmount !== null &&
      subtotal < Number(voucher.minOrderAmount)
    ) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order amount is ${Number(voucher.minOrderAmount).toLocaleString("vi-VN")}`,
      };
    }

    let discount = 0;
    let message = "";

    switch (voucher.type) {
      case VoucherType.PERCENTAGE: {
        discount = Math.floor((subtotal * Number(voucher.value)) / 100);
        if (
          voucher.maxDiscount !== null &&
          discount > Number(voucher.maxDiscount)
        ) {
          discount = Number(voucher.maxDiscount);
        }
        message = `Discount ${Number(voucher.value)}%`;
        break;
      }
      case VoucherType.FIXED_AMOUNT: {
        discount = Number(voucher.value);
        if (discount > subtotal) {
          discount = subtotal;
        }
        message = `Discount ${discount.toLocaleString("vi-VN")}`;
        break;
      }
      case VoucherType.FREE_SHIPPING: {
        discount = 0;
        message = "Free shipping";
        break;
      }
    }

    return {
      valid: true,
      discount,
      type: voucher.type,
      message,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        type: voucher.type,
        value: Number(voucher.value),
      },
    };
  }

  /**
   * Restore stock and voucher usage for a cancelled/refunded order.
   * Used internally when updating status to CANCELLED outside of cancelOrder().
   */
  private async restoreStockAndVoucher(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    for (const item of order.items) {
      if (item.variantId) {
        await this.prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      } else {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { soldCount: { decrement: item.quantity } },
      });
    }

    if (order.voucherId) {
      await this.prisma.voucher.update({
        where: { id: order.voucherId },
        data: { usedCount: { decrement: 1 } },
      });
    }
  }
}
