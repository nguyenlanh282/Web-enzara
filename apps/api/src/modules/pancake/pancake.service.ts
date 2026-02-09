import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PancakeService {
  private readonly logger = new Logger(PancakeService.name);

  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>(
      "PANCAKE_API_URL",
      "https://pos.pages.fm/api/v1",
    );
    this.apiKey = this.configService.get<string>("PANCAKE_API_KEY", "");
  }

  /**
   * Create an order in Pancake POS.
   * Stub: Pancake API integration is pending.
   */
  async createOrder(orderData: {
    orderNumber: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
    }>;
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    total: number;
  }) {
    this.logger.warn(
      `Pancake POS integration pending. Skipping createOrder for ${orderData.orderNumber}`,
    );

    return {
      success: false,
      message: "Pancake POS integration is pending",
      pancakeOrderId: null,
    };
  }

  /**
   * Update order status in Pancake POS.
   * Stub: Pancake API integration is pending.
   */
  async updateOrderStatus(pancakeOrderId: string, status: string) {
    this.logger.warn(
      `Pancake POS integration pending. Skipping updateOrderStatus for ${pancakeOrderId}`,
    );

    return {
      success: false,
      message: "Pancake POS integration is pending",
    };
  }

  /**
   * Fetch products from Pancake POS.
   * Stub: Pancake API integration is pending.
   */
  async getProducts(page: number = 1, limit: number = 50) {
    this.logger.warn(
      "Pancake POS integration pending. Returning empty product list.",
    );

    return {
      success: false,
      message: "Pancake POS integration is pending",
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  /**
   * Sync a single product from Pancake POS to the local database.
   * Stub: Pancake API integration is pending.
   */
  async syncProduct(pancakeProductId: string) {
    this.logger.warn(
      `Pancake POS integration pending. Skipping syncProduct for ${pancakeProductId}`,
    );

    return {
      success: false,
      message: "Pancake POS integration is pending",
    };
  }
}
