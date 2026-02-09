import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrderFilterDto } from "./dto/order-filter.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { AddTimelineDto } from "./dto/add-timeline.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { Request } from "express";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() filter: OrderFilterDto) {
    return this.ordersService.findAll(filter);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findById(id);
  }

  @Put(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.ordersService.updateStatus(id, dto.status, dto.note, user.id);
  }

  @Post(":id/timeline")
  addTimeline(
    @Param("id") id: string,
    @Body() dto: AddTimelineDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.ordersService.addTimeline(id, dto.status, dto.note, user.id);
  }
}
