import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AdminCustomersService } from "./admin-customers.service";
import { AdjustLoyaltyDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("admin/loyalty")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class AdminLoyaltyController {
  constructor(private readonly service: AdminCustomersService) {}

  @Get("overview")
  getOverview() {
    return this.service.getLoyaltyOverview();
  }

  @Get("transactions")
  getTransactions(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getRecentTransactions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post("adjust")
  adjustPoints(@Body() dto: AdjustLoyaltyDto) {
    return this.service.adjustLoyaltyPoints(
      dto.userId,
      dto.points,
      dto.description,
    );
  }
}
