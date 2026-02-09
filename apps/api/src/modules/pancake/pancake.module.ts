import { Module } from "@nestjs/common";
import { PancakeService } from "./pancake.service";
import { PancakeWebhookController } from "./pancake-webhook.controller";
import { PrismaService } from "../../common/services/prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PancakeWebhookController],
  providers: [PancakeService, PrismaService],
  exports: [PancakeService],
})
export class PancakeModule {}
