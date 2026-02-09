import {
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  Matches,
} from "class-validator";

export class CreateAddressDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @Matches(/^(0[3-9])\d{8}$/, {
    message: "So dien thoai khong hop le",
  })
  phone: string;

  @IsString()
  province: string;

  @IsString()
  district: string;

  @IsString()
  ward: string;

  @IsString()
  @MinLength(5)
  address: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
