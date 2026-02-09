import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { Prisma } from "@prisma/client";

const CHANNEL = "ADMIN_INBOX";

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get paginated admin notifications, newest first.
   */
  async getNotifications(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where: { channel: CHANNEL },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.notificationLog.count({
        where: { channel: CHANNEL },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get count of unread admin notifications.
   */
  async getUnreadCount(): Promise<number> {
    return this.prisma.notificationLog.count({
      where: { channel: CHANNEL, status: "UNREAD" },
    });
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string) {
    const notification = await this.prisma.notificationLog.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.prisma.notificationLog.update({
      where: { id },
      data: { status: "READ" },
    });
  }

  /**
   * Mark all unread admin notifications as read.
   */
  async markAllAsRead() {
    const result = await this.prisma.notificationLog.updateMany({
      where: { channel: CHANNEL, status: "UNREAD" },
      data: { status: "READ" },
    });

    return { updated: result.count };
  }

  /**
   * Create an admin inbox notification.
   */
  async createNotification(
    subject: string,
    content: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.notificationLog.create({
      data: {
        channel: CHANNEL,
        recipient: "admin",
        subject,
        content,
        status: "UNREAD",
        metadata: metadata !== undefined
          ? (metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }
}
