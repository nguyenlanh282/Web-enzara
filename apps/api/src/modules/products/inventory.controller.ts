import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { PrismaService } from "../../common/services/prisma.service";
import { PancakeService } from "../pancake/pancake.service";

@Controller("admin/inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pancakeService: PancakeService,
  ) {}

  /**
   * GET /api/admin/inventory
   * List all products with stock levels, sorted by stock ascending (low stock first).
   */
  @Get()
  async getInventory(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("lowStock") lowStock?: string,
    @Query("sort") sort?: string,
  ) {
    const p = Math.max(1, parseInt(page || "1", 10));
    const l = Math.min(100, Math.max(1, parseInt(limit || "50", 10)));
    const lowStockThreshold = 10;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (lowStock === "true") {
      where.stockQuantity = { lte: lowStockThreshold };
    }

    const orderBy: any =
      sort === "name"
        ? { name: "asc" }
        : sort === "stock-desc"
          ? { stockQuantity: "desc" }
          : { stockQuantity: "asc" };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          stockQuantity: true,
          basePrice: true,
          salePrice: true,
          pancakeId: true,
          isActive: true,
          images: {
            select: { url: true },
            take: 1,
            orderBy: { isPrimary: "desc" },
          },
          variants: {
            select: {
              id: true,
              name: true,
              sku: true,
              stockQuantity: true,
              pancakeId: true,
            },
            where: { isActive: true },
          },
          category: { select: { name: true } },
        },
        orderBy,
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page: p,
      totalPages: Math.ceil(total / l),
    };
  }

  /**
   * GET /api/admin/inventory/summary
   * Overview stats for inventory dashboard.
   */
  @Get("summary")
  async getSummary() {
    const lowStockThreshold = 10;

    const [
      totalProducts,
      outOfStock,
      lowStock,
      totalStockValue,
      pancakeMapped,
    ] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({
        where: { isActive: true, stockQuantity: { lte: 0 } },
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: { gt: 0, lte: lowStockThreshold },
        },
      }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _sum: { stockQuantity: true },
      }),
      this.prisma.product.count({
        where: { isActive: true, pancakeId: { not: null } },
      }),
    ]);

    return {
      totalProducts,
      outOfStock,
      lowStock,
      totalStock: totalStockValue._sum.stockQuantity || 0,
      pancakeMapped,
    };
  }

  /**
   * POST /api/admin/inventory/:id/adjust
   * Manually adjust stock for a product or variant.
   * Also syncs to Pancake POS if the product is mapped.
   */
  @Post(":id/adjust")
  async adjustStock(
    @Param("id") id: string,
    @Body()
    body: {
      quantity: number;
      type: "set" | "add" | "subtract";
      variantId?: string;
      reason?: string;
    },
  ) {
    const { quantity, type, variantId, reason } = body;

    if (variantId) {
      // Adjust variant stock
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant) {
        return { success: false, message: "Bien the khong ton tai" };
      }

      let newStock = variant.stockQuantity;
      if (type === "set") newStock = quantity;
      else if (type === "add") newStock += quantity;
      else if (type === "subtract") newStock = Math.max(0, newStock - quantity);

      await this.prisma.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity: newStock },
      });

      // Sync to Pancake if mapped
      if (variant.pancakeId && this.pancakeService.isConfigured) {
        try {
          await this.pancakeService.updateVariationQuantity(
            variant.pancakeId,
            { actual_remain_quantity: newStock },
          );
        } catch (err) {
          this.logger.warn(
            `Failed to sync variant stock to Pancake: ${err.message}`,
          );
        }
      }

      return {
        success: true,
        productId: id,
        variantId,
        oldStock: variant.stockQuantity,
        newStock,
        reason,
      };
    }

    // Adjust product stock
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      return { success: false, message: "San pham khong ton tai" };
    }

    let newStock = product.stockQuantity;
    if (type === "set") newStock = quantity;
    else if (type === "add") newStock += quantity;
    else if (type === "subtract") newStock = Math.max(0, newStock - quantity);

    await this.prisma.product.update({
      where: { id },
      data: { stockQuantity: newStock },
    });

    // Sync to Pancake if mapped
    if (product.pancakeId && this.pancakeService.isConfigured) {
      try {
        await this.pancakeService.updateVariationQuantity(product.pancakeId, {
          actual_remain_quantity: newStock,
        });
      } catch (err) {
        this.logger.warn(
          `Failed to sync product stock to Pancake: ${err.message}`,
        );
      }
    }

    return {
      success: true,
      productId: id,
      oldStock: product.stockQuantity,
      newStock,
      reason,
    };
  }

  /**
   * GET /api/admin/inventory/low-stock
   * Get products with stock at or below threshold.
   */
  @Get("low-stock")
  async getLowStock(@Query("threshold") threshold?: string) {
    const t = parseInt(threshold || "10", 10);

    const items = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { lte: t },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        pancakeId: true,
        images: {
          select: { url: true },
          take: 1,
          orderBy: { isPrimary: "desc" },
        },
        category: { select: { name: true } },
      },
      orderBy: { stockQuantity: "asc" },
      take: 50,
    });

    return { items, threshold: t };
  }
}
