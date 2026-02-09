import { IsString, IsEmail } from "class-validator";

export class VerifyEmailDto {
  @IsString()
  token: string;

  @IsEmail()
  email: string;
}
