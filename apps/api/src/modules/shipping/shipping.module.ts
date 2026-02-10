import { Module } from "@nestjs/common";
import { GhnShippingService } from "./ghn.service";
import {
  ShippingController,
  AdminShippingController,
} from "./shipping.controller";
import { PrismaService } from "../../common/services/prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ShippingController, AdminShippingController],
  providers: [GhnShippingService, PrismaService],
  exports: [GhnShippingService],
})
export class ShippingModule {}
