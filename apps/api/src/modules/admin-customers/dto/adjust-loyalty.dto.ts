import { IsString, IsInt, IsNotEmpty } from "class-validator";

export class AdjustLoyaltyDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  points: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}
