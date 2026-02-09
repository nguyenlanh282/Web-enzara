import { IsString, IsNumber, Min } from 'class-validator';

export class AddFlashSaleItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}
