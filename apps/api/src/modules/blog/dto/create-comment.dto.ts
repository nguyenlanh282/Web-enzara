import { IsString, IsEmail, IsOptional } from "class-validator";

export class CreateCommentDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
