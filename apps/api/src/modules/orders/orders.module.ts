import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersPublicController } from "./orders-public.controller";
import { OrdersService } from "./orders.service";
import { PrismaService } from "../../common/services/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { PancakeModule } from "../pancake/pancake.module";
import { ShippingModule } from "../shipping/shipping.module";

@Module({
  imports: [AuthModule, NotificationsModule, LoyaltyModule, PancakeModule, ShippingModule],
  controllers: [OrdersController, OrdersPublicController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
