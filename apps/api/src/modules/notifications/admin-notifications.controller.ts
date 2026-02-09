import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminNotificationsService } from "./admin-notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("admin/notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class AdminNotificationsController {
  constructor(
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  @Get()
  getNotifications(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminNotificationsService.getNotifications(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get("unread-count")
  async getUnreadCount() {
    const count = await this.adminNotificationsService.getUnreadCount();
    return { count };
  }

  @Put("read-all")
  markAllAsRead() {
    return this.adminNotificationsService.markAllAsRead();
  }

  @Put(":id/read")
  markAsRead(@Param("id") id: string) {
    return this.adminNotificationsService.markAsRead(id);
  }
}
