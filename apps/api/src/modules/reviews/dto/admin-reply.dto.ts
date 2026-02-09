import { IsString } from 'class-validator';

export class AdminReplyDto {
  @IsString()
  adminReply: string;
}
