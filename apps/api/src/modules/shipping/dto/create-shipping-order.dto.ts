import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  Min,
} from "class-validator";

export enum GhnRequiredNote {
  CHOTHUHANG = "CHOTHUHANG",
  CHOXEMHANGKHONGTHU = "CHOXEMHANGKHONGTHU",
  KHONGCHOXEMHANG = "KHONGCHOXEMHANG",
}

export class CreateShippingOrderDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsInt()
  serviceTypeId?: number; // default 2 = standard

  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number; // grams, default 500

  @IsOptional()
  @IsEnum(GhnRequiredNote)
  requiredNote?: GhnRequiredNote;

  @IsOptional()
  @IsString()
  note?: string;
}
