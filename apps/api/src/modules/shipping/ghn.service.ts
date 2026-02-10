import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// --- GHN Types ---

export interface GhnProvince {
  ProvinceID: number;
  ProvinceName: string;
  Code: string;
}

export interface GhnDistrict {
  DistrictID: number;
  ProvinceID: number;
  DistrictName: string;
  Code: string;
  Type: number;
  SupportType: number;
}

export interface GhnWard {
  WardCode: string;
  DistrictID: number;
  WardName: string;
}

export interface GhnAvailableService {
  service_id: number;
  short_name: string;
  service_type_id: number;
}

export interface GhnFeeResult {
  total: number;
  service_fee: number;
  insurance_fee: number;
  pick_station_fee: number;
  coupon_value: number;
  r2s_fee: number;
}

export interface GhnCalculateFeeParams {
  service_type_id: number;
  to_district_id: number;
  to_ward_code: string;
  weight: number; // grams
  height?: number; // cm
  length?: number; // cm
  width?: number; // cm
  insurance_value?: number; // VND
  coupon?: string;
}

export interface GhnCreateOrderParams {
  to_name: string;
  to_phone: string;
  to_address: string;
  to_ward_code: string;
  to_district_id: number;
  service_type_id: number;
  weight: number;
  height?: number;
  length?: number;
  width?: number;
  cod_amount: number;
  insurance_value?: number;
  content?: string;
  note?: string;
  required_note: "CHOTHUHANG" | "CHOXEMHANGKHONGTHU" | "KHONGCHOXEMHANG";
  payment_type_id?: number; // 1 = seller pays, 2 = buyer pays
  items: GhnOrderItem[];
}

export interface GhnOrderItem {
  name: string;
  quantity: number;
  weight: number;
  price: number;
}

export interface GhnCreateOrderResult {
  order_code: string;
  sort_code: string;
  trans_type: string;
  ward_encode: string;
  district_encode: string;
  fee: {
    main_service: number;
    insurance: number;
    station_do: number;
    station_pu: number;
    return: number;
    r2s: number;
    coupon: number;
    cod_fee: number;
    total: number;
  };
  total_fee: number;
  expected_delivery_time: string;
}

export interface GhnOrderDetail {
  order_code: string;
  status: string;
  log: Array<{
    status: string;
    updated_date: string;
  }>;
  leadtime: string;
  updated_date: string;
}

// --- Service ---

@Injectable()
export class GhnShippingService {
  private readonly logger = new Logger(GhnShippingService.name);
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly shopId: string;
  private readonly fromDistrictId: number;
  private readonly fromWardCode: string;

  // Simple in-memory cache for master data
  private provinceCache: GhnProvince[] | null = null;
  private districtCache: Map<number, GhnDistrict[]> = new Map();
  private wardCache: Map<number, GhnWard[]> = new Map();

  constructor(private readonly config: ConfigService) {
    this.apiUrl =
      config.get<string>("GHN_API_URL") ||
      "https://online-gateway.ghn.vn/shiip/public-api";
    this.token = config.get<string>("GHN_TOKEN") || "";
    this.shopId = config.get<string>("GHN_SHOP_ID") || "";
    this.fromDistrictId = Number(config.get<string>("GHN_FROM_DISTRICT_ID")) || 0;
    this.fromWardCode = config.get<string>("GHN_FROM_WARD_CODE") || "";
  }

  get isConfigured(): boolean {
    return !!(this.token && this.shopId);
  }

  // --- Private helpers ---

  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Token: this.token,
    };
    // ShopId header needed for shop-scoped endpoints
    if (this.shopId) {
      headers["ShopId"] = this.shopId;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (json.code !== 200) {
      this.logger.error(`GHN API error [${path}]: ${json.message}`, json);
      throw new Error(json.message || "GHN API error");
    }

    return json.data as T;
  }

  // --- Master Data ---

  async getProvinces(): Promise<GhnProvince[]> {
    if (this.provinceCache) return this.provinceCache;
    const data = await this.request<GhnProvince[]>(
      "GET",
      "/master-data/province",
    );
    this.provinceCache = data;
    return data;
  }

  async getDistricts(provinceId: number): Promise<GhnDistrict[]> {
    if (this.districtCache.has(provinceId)) {
      return this.districtCache.get(provinceId)!;
    }
    const data = await this.request<GhnDistrict[]>(
      "POST",
      "/master-data/district",
      { province_id: provinceId },
    );
    this.districtCache.set(provinceId, data);
    return data;
  }

  async getWards(districtId: number): Promise<GhnWard[]> {
    if (this.wardCache.has(districtId)) {
      return this.wardCache.get(districtId)!;
    }
    const data = await this.request<GhnWard[]>(
      "POST",
      "/master-data/ward",
      { district_id: districtId },
    );
    this.wardCache.set(districtId, data);
    return data;
  }

  // --- Fee Calculation ---

  async getAvailableServices(
    toDistrictId: number,
  ): Promise<GhnAvailableService[]> {
    return this.request<GhnAvailableService[]>(
      "POST",
      "/v2/shipping-order/available-services",
      {
        shop_id: Number(this.shopId),
        from_district: this.fromDistrictId,
        to_district: toDistrictId,
      },
    );
  }

  async calculateFee(params: GhnCalculateFeeParams): Promise<GhnFeeResult> {
    return this.request<GhnFeeResult>(
      "POST",
      "/v2/shipping-order/fee",
      {
        service_type_id: params.service_type_id,
        from_district_id: this.fromDistrictId,
        from_ward_code: this.fromWardCode,
        to_district_id: params.to_district_id,
        to_ward_code: params.to_ward_code,
        weight: params.weight,
        height: params.height || 10,
        length: params.length || 20,
        width: params.width || 15,
        insurance_value: params.insurance_value || 0,
        coupon: params.coupon || null,
      },
    );
  }

  // --- Shipping Orders ---

  async createShippingOrder(
    params: GhnCreateOrderParams,
  ): Promise<GhnCreateOrderResult> {
    return this.request<GhnCreateOrderResult>(
      "POST",
      "/v2/shipping-order/create",
      {
        ...params,
        payment_type_id: params.payment_type_id || 1, // seller pays shipping
        from_district_id: this.fromDistrictId,
        from_ward_code: this.fromWardCode,
      },
    );
  }

  async getOrderDetail(orderCode: string): Promise<GhnOrderDetail> {
    return this.request<GhnOrderDetail>(
      "POST",
      "/v2/shipping-order/detail",
      { order_code: orderCode },
    );
  }

  async cancelOrder(orderCodes: string[]): Promise<void> {
    await this.request(
      "POST",
      "/v2/switch-status/cancel",
      { order_codes: orderCodes },
    );
  }
}
