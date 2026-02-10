import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GhnShippingService } from "./ghn.service";
import { PrismaService } from "../../common/services/prisma.service";
import {
  CalculateFeeDto,
  GetDistrictsDto,
  GetWardsDto,
} from "./dto/calculate-fee.dto";
import {
  CreateShippingOrderDto,
  GhnRequiredNote,
} from "./dto/create-shipping-order.dto";
import { OrderStatus, PaymentMethod, ShippingMethod } from "@prisma/client";

// ============================================
// PUBLIC ENDPOINTS (no auth needed)
// ============================================

@Controller("shipping")
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);

  constructor(private readonly ghn: GhnShippingService) {}

  /** List all GHN provinces */
  @Get("provinces")
  async getProvinces() {
    const data = await this.ghn.getProvinces();
    return data.map((p) => ({
      id: p.ProvinceID,
      name: p.ProvinceName,
      code: p.Code,
    }));
  }

  /** List districts for a province */
  @Get("districts")
  async getDistricts(@Query("provinceId") provinceId: string) {
    const id = Number(provinceId);
    if (!id) throw new BadRequestException("provinceId is required");
    const data = await this.ghn.getDistricts(id);
    return data.map((d) => ({
      id: d.DistrictID,
      name: d.DistrictName,
      code: d.Code,
      provinceId: d.ProvinceID,
    }));
  }

  /** List wards for a district */
  @Get("wards")
  async getWards(@Query("districtId") districtId: string) {
    const id = Number(districtId);
    if (!id) throw new BadRequestException("districtId is required");
    const data = await this.ghn.getWards(id);
    return data.map((w) => ({
      code: w.WardCode,
      name: w.WardName,
      districtId: w.DistrictID,
    }));
  }

  /** Calculate shipping fee */
  @Post("calculate-fee")
  async calculateFee(@Body() dto: CalculateFeeDto) {
    const serviceTypeId = dto.serviceTypeId || 2; // standard

    const fee = await this.ghn.calculateFee({
      service_type_id: serviceTypeId,
      to_district_id: dto.toDistrictId,
      to_ward_code: dto.toWardCode,
      weight: dto.weight,
      insurance_value: dto.insuranceValue || 0,
    });

    return {
      total: fee.total,
      serviceFee: fee.service_fee,
      insuranceFee: fee.insurance_fee,
    };
  }

  /** Get available shipping services for a district */
  @Get("services")
  async getAvailableServices(@Query("toDistrictId") toDistrictId: string) {
    const id = Number(toDistrictId);
    if (!id) throw new BadRequestException("toDistrictId is required");
    const services = await this.ghn.getAvailableServices(id);
    return services.map((s) => ({
      serviceId: s.service_id,
      shortName: s.short_name,
      serviceTypeId: s.service_type_id,
    }));
  }
}

// ============================================
// ADMIN ENDPOINTS
// ============================================

@Controller("admin/shipping")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
export class AdminShippingController {
  private readonly logger = new Logger(AdminShippingController.name);

  constructor(
    private readonly ghn: GhnShippingService,
    private readonly prisma: PrismaService,
  ) {}

  /** Create GHN shipping order for an existing order */
  @Post("create-order")
  async createShippingOrder(@Body() dto: CreateShippingOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.trackingNumber) {
      throw new BadRequestException(
        `Order already has tracking number: ${order.trackingNumber}`,
      );
    }

    // Determine COD amount
    const codAmount =
      order.paymentMethod === PaymentMethod.COD ? Number(order.total) : 0;

    // Build GHN items
    const ghnItems = order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      weight: Math.round((dto.weight || 500) / order.items.length),
      price: Number(item.price),
    }));

    const result = await this.ghn.createShippingOrder({
      to_name: order.shippingName,
      to_phone: order.shippingPhone,
      to_address: order.shippingAddress,
      to_ward_code: order.shippingWard,
      to_district_id: Number(order.shippingDistrict),
      service_type_id: dto.serviceTypeId || 2,
      weight: dto.weight || 500,
      cod_amount: codAmount,
      insurance_value: Number(order.subtotal),
      content: `Don hang ${order.orderNumber}`,
      note: dto.note || order.note || undefined,
      required_note: dto.requiredNote || GhnRequiredNote.CHOTHUHANG,
      items: ghnItems,
    });

    // Save tracking number and shipping method
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: result.order_code,
        shippingMethod: ShippingMethod.GHN,
        status: OrderStatus.SHIPPING,
      },
    });

    // Add timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: OrderStatus.SHIPPING,
        note: `Da tao don GHN: ${result.order_code}`,
      },
    });

    return {
      orderCode: result.order_code,
      totalFee: result.total_fee,
      expectedDelivery: result.expected_delivery_time,
    };
  }

  /** Get GHN tracking detail for an order */
  @Get("tracking/:orderId")
  async getTracking(@Param("orderId") orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { trackingNumber: true, shippingMethod: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (!order.trackingNumber) {
      throw new BadRequestException("Order has no tracking number");
    }

    const detail = await this.ghn.getOrderDetail(order.trackingNumber);

    return {
      orderCode: detail.order_code,
      status: detail.status,
      expectedDelivery: detail.leadtime,
      updatedAt: detail.updated_date,
      logs: detail.log,
    };
  }

  /** Cancel a GHN shipping order */
  @Post("cancel/:orderId")
  async cancelShipping(@Param("orderId") orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, trackingNumber: true },
    });

    if (!order || !order.trackingNumber) {
      throw new NotFoundException("Order or tracking number not found");
    }

    await this.ghn.cancelOrder([order.trackingNumber]);

    await this.prisma.order.update({
      where: { id: order.id },
      data: { trackingNumber: null, shippingMethod: null },
    });

    return { success: true };
  }

  /** GHN connection status */
  @Get("status")
  async getStatus() {
    return {
      configured: this.ghn.isConfigured,
      fromDistrictId: this.ghn["fromDistrictId"],
      fromWardCode: this.ghn["fromWardCode"],
    };
  }
}
