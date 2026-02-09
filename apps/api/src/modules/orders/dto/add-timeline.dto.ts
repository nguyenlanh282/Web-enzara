import { IsString, IsOptional } from "class-validator";

export class AddTimelineDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  note?: string;
}
