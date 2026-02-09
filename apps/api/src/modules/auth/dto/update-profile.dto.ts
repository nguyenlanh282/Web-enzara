import { IsString, MinLength, IsOptional, Matches } from "class-validator";

export class UpdateProfileDto {
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
}
