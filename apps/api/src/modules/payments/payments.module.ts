import { Module } from "@nestjs/common";
import { SepayWebhookController } from "./sepay/sepay-webhook.controller";
import { PaymentsService } from "./payments.service";
import { SepayService } from "./sepay/sepay.service";
import { PrismaService } from "../../common/services/prisma.service";
import { OrdersModule } from "../orders/orders.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [OrdersModule, AuthModule],
  controllers: [SepayWebhookController],
  providers: [PaymentsService, SepayService, PrismaService],
  exports: [PaymentsService, SepayService],
})
export class PaymentsModule {}
