import { Module } from "@nestjs/common";
import { AdminCustomersController } from "./admin-customers.controller";
import { AdminLoyaltyController } from "./admin-loyalty.controller";
import { AdminCustomersService } from "./admin-customers.service";
import { PrismaService } from "../../common/services/prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AdminCustomersController, AdminLoyaltyController],
  providers: [AdminCustomersService, PrismaService],
})
export class AdminCustomersModule {}
