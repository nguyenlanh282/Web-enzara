import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Optional,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { ValidateVoucherDto } from "./dto/validate-voucher.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Request } from "express";

/**
 * Optional JWT auth guard that does not throw if no token is present.
 * If a valid token exists, req.user will be populated. Otherwise req.user is undefined.
 */
class OptionalJwtAuthGuard extends JwtAuthGuard {
  handleRequest(err: any, user: any) {
    // Do not throw on missing/invalid token -- just return undefined
    return user || undefined;
  }
}

@Controller("orders")
export class OrdersPublicController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /api/orders
   * Create a new order. Works for both guest and authenticated users.
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  createOrder(@Body() dto: CreateOrderDto, @Req() req: Request) {
    const user = req.user as { id: string } | undefined;
    return this.ordersService.createOrder(dto, user?.id);
  }

  /**
   * GET /api/orders/my
   * List authenticated customer's orders.
   */
  @Get("my")
  @UseGuards(JwtAuthGuard)
  getMyOrders(
    @Req() req: Request,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const user = req.user as { id: string };
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.ordersService.getCustomerOrders(user.id, pageNum, limitNum);
  }

  /**
   * GET /api/orders/:id
   * Get order by ID.
   */
  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param("id") id: string) {
    return this.ordersService.findById(id);
  }

  /**
   * GET /api/orders/:orderNumber/tracking
   * Get order by order number (public tracking).
   */
  @Get(":orderNumber/tracking")
  tracking(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  /**
   * PUT /api/orders/:id/cancel
   * Cancel order. Only allowed if PENDING.
   */
  @Put(":id/cancel")
  @UseGuards(OptionalJwtAuthGuard)
  cancelOrder(
    @Param("id") id: string,
    @Body() dto: CancelOrderDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string } | undefined;
    return this.ordersService.cancelOrder(id, dto.reason, user?.id);
  }

  /**
   * GET /api/orders/:id/payment-status
   * Check payment status (for SePay polling from the frontend).
   */
  @Get(":id/payment-status")
  async getPaymentStatus(@Param("id") id: string) {
    const order = await this.ordersService.findById(id);
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      paidAt: order.paidAt,
    };
  }

  /**
   * POST /api/vouchers/validate
   * Validate a voucher and calculate the discount.
   */
  @Post("/vouchers/validate")
  validateVoucher(@Body() dto: ValidateVoucherDto) {
    return this.ordersService.validateVoucher(dto.code, dto.subtotal);
  }
}
