import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Pancake POS status codes mapping.
 * See OpenAPI spec: status enum [0,17,11,12,13,20,1,8,9,2,3,16,4,15,5,6,7]
 */
export enum PancakeOrderStatus {
  NEW = 0,
  WAITING_CONFIRM = 17,
  WAITING_STOCK = 11,
  WAITING_PRINT = 12,
  PRINTED = 13,
  ORDERED = 20,
  CONFIRMED = 1,
  PACKING = 8,
  WAITING_SHIP = 9,
  SHIPPED = 2,
  RECEIVED = 3,
  COLLECTED = 16,
  RETURNING = 4,
  PARTIAL_RETURN = 15,
  RETURNED = 5,
  CANCELLED = 6,
  DELETED = 7,
}

export interface PancakeOrderItem {
  product_id: string;
  variation_id: string;
  quantity: number;
  discount_each_product?: number;
  is_bonus_product?: boolean;
  is_discount_percent?: boolean;
  is_wholesale?: boolean;
  one_time_product?: boolean;
  variation_info?: {
    name?: string;
    retail_price?: number;
    weight?: number;
    detail?: string | null;
    fields?: string | null;
    display_id?: string | null;
    product_display_id?: string | null;
  };
}

export interface PancakeCreateOrderPayload {
  shop_id: number;
  bill_full_name: string;
  bill_phone_number: string;
  bill_email?: string;
  items: PancakeOrderItem[];
  shipping_address: {
    full_name: string;
    phone_number: string;
    address: string;
    full_address: string;
    province_id?: string;
    district_id?: string;
    commune_id?: string;
  };
  shipping_fee: number;
  total_discount: number;
  note?: string;
  note_print?: string;
  is_free_shipping?: boolean;
  received_at_shop?: boolean;
  warehouse_id?: string;
  custom_id?: string;
  status: PancakeOrderStatus;
  cash?: number;
}

export interface PancakeVariation {
  id: string;
  product_id: string;
  shop_id: number;
  custom_id: string;
  display_id: number;
  barcode: string | null;
  name: string;
  retail_price: number;
  wholesale_price: number;
  import_price: number;
  weight: number;
  remain_quantity: number;
  actual_remain_quantity: number;
}

@Injectable()
export class PancakeService {
  private readonly logger = new Logger(PancakeService.name);

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly shopId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>(
      "PANCAKE_API_URL",
      "https://pos.pages.fm/api/v1",
    );
    this.apiKey = this.configService.get<string>("PANCAKE_API_KEY", "");
    this.shopId = this.configService.get<string>("PANCAKE_SHOP_ID", "");
  }

  get isConfigured(): boolean {
    return !!(this.apiKey && this.shopId);
  }

  private buildUrl(path: string, extraParams?: Record<string, string>): string {
    const separator = path.includes("?") ? "&" : "?";
    const params = new URLSearchParams({ api_key: this.apiKey, ...extraParams });
    return `${this.apiUrl}${path}${separator}${params.toString()}`;
  }

  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
  ): Promise<T> {
    if (!this.isConfigured) {
      throw new Error(
        "Pancake POS is not configured. Set PANCAKE_API_KEY and PANCAKE_SHOP_ID.",
      );
    }

    const url = this.buildUrl(path);

    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    this.logger.debug(`Pancake API ${method} ${path}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      this.logger.error(
        `Pancake API error: ${response.status} ${response.statusText} - ${text.substring(0, 500)}`,
      );
      throw new Error(
        `Pancake API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data as T;
  }

  // ─── Orders ────────────────────────────────────────────

  async createOrder(payload: PancakeCreateOrderPayload) {
    if (!this.isConfigured) {
      this.logger.warn("Pancake POS not configured. Skipping createOrder.");
      return { success: false, pancakeOrderId: null };
    }

    try {
      const result = await this.request<any>(
        "POST",
        `/shops/${this.shopId}/orders`,
        payload,
      );

      const pancakeOrderId = result?.id?.toString() || null;
      this.logger.log(
        `Order created in Pancake POS: ${pancakeOrderId} (custom_id: ${payload.custom_id})`,
      );

      return { success: true, pancakeOrderId, data: result };
    } catch (error) {
      this.logger.error(
        `Failed to create order in Pancake POS: ${error.message}`,
      );
      return { success: false, pancakeOrderId: null, error: error.message };
    }
  }

  async getOrder(pancakeOrderId: string) {
    return this.request<any>(
      "GET",
      `/shops/${this.shopId}/orders/${pancakeOrderId}`,
    );
  }

  async updateOrder(
    pancakeOrderId: string,
    payload: Partial<PancakeCreateOrderPayload>,
  ) {
    if (!this.isConfigured) {
      this.logger.warn("Pancake POS not configured. Skipping updateOrder.");
      return { success: false };
    }

    try {
      const result = await this.request<any>(
        "PUT",
        `/shops/${this.shopId}/orders/${pancakeOrderId}`,
        payload,
      );

      this.logger.log(`Order ${pancakeOrderId} updated in Pancake POS`);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(
        `Failed to update order ${pancakeOrderId} in Pancake POS: ${error.message}`,
      );
      return { success: false, error: error.message };
    }
  }

  async updateOrderStatus(pancakeOrderId: string, status: PancakeOrderStatus) {
    return this.updateOrder(pancakeOrderId, { status });
  }

  async listOrders(params?: { page?: number; page_size?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", params.page.toString());
    if (params?.page_size) qs.set("page_size", params.page_size.toString());
    const queryStr = qs.toString() ? `?${qs.toString()}` : "";

    return this.request<any>(
      "GET",
      `/shops/${this.shopId}/orders${queryStr}`,
    );
  }

  // ─── Products & Variations ─────────────────────────────

  async getProductBySku(sku: string) {
    return this.request<any>(
      "GET",
      `/shops/${this.shopId}/products/${encodeURIComponent(sku)}`,
    );
  }

  async getVariations(params?: { page?: number; page_size?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", params.page.toString());
    if (params?.page_size) qs.set("page_size", params.page_size.toString());
    const queryStr = qs.toString() ? `?${qs.toString()}` : "";

    return this.request<any>(
      "GET",
      `/shops/${this.shopId}/products/variations${queryStr}`,
    );
  }

  async updateVariationQuantity(
    variationId: string,
    data: {
      actual_remain_quantity?: number;
      remain_quantity?: number;
    },
  ) {
    return this.request<any>(
      "POST",
      `/shops/${this.shopId}/variations/${variationId}/update_quantity`,
      data,
    );
  }

  // ─── Inventory ─────────────────────────────────────────

  async getInventoryHistories(params?: {
    page?: number;
    page_size?: number;
    warehouse_id?: string;
    startDate?: number;
    endDate?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", params.page.toString());
    if (params?.page_size) qs.set("page_size", params.page_size.toString());
    if (params?.warehouse_id) qs.set("warehouse_id", params.warehouse_id);
    if (params?.startDate) qs.set("startDate", params.startDate.toString());
    if (params?.endDate) qs.set("endDate", params.endDate.toString());
    const queryStr = qs.toString() ? `?${qs.toString()}` : "";

    return this.request<any>(
      "GET",
      `/shops/${this.shopId}/inventory_histories${queryStr}`,
    );
  }

  async getInventoryAnalytics(params: {
    startDate: number;
    endDate: number;
    type: "actual" | "remain";
    page?: number;
    page_size?: number;
  }) {
    const qs = new URLSearchParams({
      startDate: params.startDate.toString(),
      endDate: params.endDate.toString(),
      type: params.type,
    });
    if (params.page) qs.set("page", params.page.toString());
    if (params.page_size) qs.set("page_size", params.page_size.toString());

    return this.request<any>(
      "GET",
      `/shops/${this.shopId}/inventory_analytics/inventory?${qs.toString()}`,
    );
  }
}
