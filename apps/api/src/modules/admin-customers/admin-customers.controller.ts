import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AdminCustomersService } from "./admin-customers.service";
import { CustomerFilterDto, AdjustLoyaltyDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("admin/customers")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class AdminCustomersController {
  constructor(private readonly service: AdminCustomersService) {}

  @Get()
  findAll(@Query() filter: CustomerFilterDto) {
    return this.service.findAll(filter);
  }

  @Get("search")
  search(@Query("q") q: string) {
    return this.service.searchCustomers(q || "");
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Patch(":id/status")
  toggleStatus(@Param("id") id: string) {
    return this.service.toggleStatus(id);
  }
}
