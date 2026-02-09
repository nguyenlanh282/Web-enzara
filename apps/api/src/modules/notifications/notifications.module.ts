import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';
import { PrismaService } from '../../common/services/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [AdminNotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    TelegramService,
    AdminNotificationsService,
    PrismaService,
  ],
  exports: [NotificationsService, EmailService, AdminNotificationsService],
})
export class NotificationsModule {}
