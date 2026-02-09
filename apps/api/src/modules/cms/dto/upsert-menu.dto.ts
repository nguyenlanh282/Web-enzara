import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpsertMenuDto {
  @IsString()
  name: string;

  @IsArray()
  items: any[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
