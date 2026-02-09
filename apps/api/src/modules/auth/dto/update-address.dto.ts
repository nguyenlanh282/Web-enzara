import {
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  Matches,
} from "class-validator";

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0[3-9])\d{8}$/, {
    message: "So dien thoai khong hop le",
  })
  phone?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  address?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
