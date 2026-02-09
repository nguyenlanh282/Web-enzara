import { IsArray, IsString } from 'class-validator';

export class CheckWishlistDto {
  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}
