import { IsString, IsNumber, Min } from "class-validator";
import { Transform } from "class-transformer";

export class ValidateVoucherDto {
  @IsString()
  code: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  subtotal: number;
}
