import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  MinLength,
} from 'class-validator';

export class CreateRedirectDto {
  @IsString()
  @MinLength(1)
  fromPath: string;

  @IsString()
  @MinLength(1)
  toPath: string;

  @IsInt()
  @IsOptional()
  @IsIn([301, 302])
  type?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRedirectDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  fromPath?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  toPath?: string;

  @IsInt()
  @IsOptional()
  @IsIn([301, 302])
  type?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
