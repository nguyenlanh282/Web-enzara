import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { PostStatus } from "@prisma/client";

export class PostFilterDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
