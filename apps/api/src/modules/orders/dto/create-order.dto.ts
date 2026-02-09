import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsEnum,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod } from "@prisma/client";

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  shippingName: string;

  @IsString()
  shippingPhone: string;

  @IsOptional()
  @IsString()
  shippingEmail?: string;

  @IsString()
  shippingProvince: string;

  @IsString()
  shippingDistrict: string;

  @IsString()
  shippingWard: string;

  @IsString()
  shippingAddress: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  voucherCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsToRedeem?: number;
}
