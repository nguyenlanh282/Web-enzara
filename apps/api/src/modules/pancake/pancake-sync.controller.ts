import {
  Controller,
  Post,
  Get,
  Logger,
  UseGuards,
  Query,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { PancakeService } from "./pancake.service";
import { PrismaService } from "../../common/services/prisma.service";

@Controller("admin/pancake")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
export class PancakeSyncController {
  private readonly logger = new Logger(PancakeSyncController.name);

  constructor(
    private readonly pancakeService: PancakeService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /api/admin/pancake/status
   * Check Pancake POS connection status and product mapping stats.
   */
  @Get("status")
  async getStatus() {
    const isConfigured = this.pancakeService.isConfigured;

    const [totalProducts, mappedProducts, totalVariants, mappedVariants] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { pancakeId: { not: null } } }),
        this.prisma.productVariant.count(),
        this.prisma.productVariant.count({
          where: { pancakeId: { not: null } },
        }),
      ]);

    return {
      configured: isConfigured,
      products: { total: totalProducts, mapped: mappedProducts },
      variants: { total: totalVariants, mapped: mappedVariants },
    };
  }

  /**
   * POST /api/admin/pancake/sync-inventory
   * Pull inventory levels from Pancake POS and update local stock.
   * Matches products/variants by their pancakeId field.
   */
  @Post("sync-inventory")
  async syncInventory() {
    if (!this.pancakeService.isConfigured) {
      return {
        success: false,
        message: "Pancake POS is not configured",
      };
    }

    this.logger.log("Starting inventory sync from Pancake POS...");

    let page = 1;
    const pageSize = 100;
    let totalSynced = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    try {
      // Fetch all variations from Pancake POS (paginated)
      while (true) {
        const response = await this.pancakeService.getVariations({
          page,
          page_size: pageSize,
        });

        const variations = response?.data || response || [];
        if (!Array.isArray(variations) || variations.length === 0) break;

        for (const variation of variations) {
          const pancakeId = variation.id?.toString();
          if (!pancakeId) continue;

          // Try to match by variant pancakeId first
          const localVariant = await this.prisma.productVariant.findUnique({
            where: { pancakeId },
          });

          if (localVariant) {
            const newStock =
              variation.actual_remain_quantity ?? variation.remain_quantity ?? 0;

            if (localVariant.stockQuantity !== newStock) {
              await this.prisma.productVariant.update({
                where: { id: localVariant.id },
                data: { stockQuantity: newStock },
              });
              totalSynced++;
            } else {
              totalSkipped++;
            }
            continue;
          }

          // Try to match by product pancakeId (for products without variants)
          const productPancakeId = variation.product_id?.toString();
          if (productPancakeId) {
            const localProduct = await this.prisma.product.findUnique({
              where: { pancakeId: productPancakeId },
            });

            if (localProduct) {
              const newStock =
                variation.actual_remain_quantity ??
                variation.remain_quantity ??
                0;

              if (localProduct.stockQuantity !== newStock) {
                await this.prisma.product.update({
                  where: { id: localProduct.id },
                  data: { stockQuantity: newStock },
                });
                totalSynced++;
              } else {
                totalSkipped++;
              }
            }
          }
        }

        // If fewer results than page size, we've reached the end
        if (variations.length < pageSize) break;
        page++;
      }
    } catch (error) {
      errors.push(error.message);
      this.logger.error(`Inventory sync error: ${error.message}`);
    }

    const result = {
      success: errors.length === 0,
      synced: totalSynced,
      unchanged: totalSkipped,
      pages: page,
      errors,
    };

    this.logger.log(
      `Inventory sync completed: ${totalSynced} updated, ${totalSkipped} unchanged`,
    );

    return result;
  }

  /**
   * GET /api/admin/pancake/products
   * List products from Pancake POS for reference/mapping.
   */
  @Get("products")
  async listPancakeProducts(
    @Query("page") page?: string,
    @Query("page_size") pageSize?: string,
  ) {
    if (!this.pancakeService.isConfigured) {
      return { success: false, message: "Pancake POS is not configured" };
    }

    return this.pancakeService.getVariations({
      page: page ? parseInt(page, 10) : 1,
      page_size: pageSize ? parseInt(pageSize, 10) : 50,
    });
  }

  /**
   * GET /api/admin/pancake/orders
   * List recent orders from Pancake POS.
   */
  @Get("orders")
  async listPancakeOrders(
    @Query("page") page?: string,
    @Query("page_size") pageSize?: string,
  ) {
    if (!this.pancakeService.isConfigured) {
      return { success: false, message: "Pancake POS is not configured" };
    }

    return this.pancakeService.listOrders({
      page: page ? parseInt(page, 10) : 1,
      page_size: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  /**
   * GET /api/admin/pancake/inventory-history
   * Get inventory history from Pancake POS.
   */
  @Get("inventory-history")
  async getInventoryHistory(
    @Query("page") page?: string,
    @Query("page_size") pageSize?: string,
    @Query("warehouse_id") warehouseId?: string,
  ) {
    if (!this.pancakeService.isConfigured) {
      return { success: false, message: "Pancake POS is not configured" };
    }

    return this.pancakeService.getInventoryHistories({
      page: page ? parseInt(page, 10) : 1,
      page_size: pageSize ? parseInt(pageSize, 10) : 30,
      warehouse_id: warehouseId,
    });
  }
}
