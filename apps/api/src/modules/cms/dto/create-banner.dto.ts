import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateBannerDto {
  @IsString()
  title: string;

  @IsString()
  image: string;

  @IsString()
  @IsOptional()
  mobileImage?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  position: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  mobileImage?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
