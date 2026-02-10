import {
  IsInt,
  IsString,
  IsOptional,
  Min,
} from "class-validator";

export class CalculateFeeDto {
  @IsInt()
  toDistrictId: number;

  @IsString()
  toWardCode: string;

  @IsInt()
  @Min(1)
  weight: number; // grams

  @IsOptional()
  @IsInt()
  @Min(0)
  insuranceValue?: number; // VND (declared value for insurance)

  @IsOptional()
  @IsInt()
  serviceTypeId?: number; // 2 = standard (default)
}

export class GetDistrictsDto {
  @IsInt()
  provinceId: number;
}

export class GetWardsDto {
  @IsInt()
  districtId: number;
}
