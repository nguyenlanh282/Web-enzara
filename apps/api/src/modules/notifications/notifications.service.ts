import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly telegramService: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Log notification to database
   */
  private async logNotification(
    channel: string,
    recipient: string,
    subject: string | null,
    content: string,
    status: string,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.prisma.notificationLog.create({
        data: {
          channel,
          recipient,
          subject,
          content,
          status,
          metadata: metadata || null,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log notification:', error);
    }
  }

  /**
   * Send order confirmation (email to customer + telegram to admin)
   */
  async sendOrderConfirmation(order: any): Promise<void> {
    try {
      const email =
        order.shippingEmail || order.customer?.email || order.shippingPhone;

      if (email && email.includes('@')) {
        const subject = `Đơn hàng #${order.orderNumber} đã được đặt thành công`;
        const html = this.emailService.orderConfirmationHtml(order);

        await this.emailService.sendEmail(email, subject, html).catch((err) => {
          this.logger.error('Failed to send order confirmation email:', err);
          this.logNotification(
            'email',
            email,
            subject,
            'Order confirmation',
            'failed',
            { error: err.message },
          );
        });

        await this.logNotification(
          'email',
          email,
          subject,
          'Order confirmation',
          'sent',
        );
      }

      await this.telegramService.notifyNewOrder(order).catch((err) => {
        this.logger.error('Failed to send Telegram notification:', err);
      });

      await this.logNotification(
        'telegram',
        'admin',
        null,
        'New order notification',
        'sent',
      );
    } catch (error) {
      this.logger.error('Failed to send order confirmation:', error);
    }
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccess(order: any): Promise<void> {
    try {
      const email =
        order.shippingEmail || order.customer?.email || order.shippingPhone;

      if (email && email.includes('@')) {
        const subject = `Thanh toán đơn hàng #${order.orderNumber} thành công`;
        const html = this.emailService.paymentSuccessHtml(order);

        await this.emailService.sendEmail(email, subject, html).catch((err) => {
          this.logger.error('Failed to send payment success email:', err);
        });

        await this.logNotification(
          'email',
          email,
          subject,
          'Payment success',
          'sent',
        );
      }

      await this.telegramService.notifyPaymentSuccess(order).catch((err) => {
        this.logger.error('Failed to send Telegram notification:', err);
      });

      await this.logNotification(
        'telegram',
        'admin',
        null,
        'Payment success notification',
        'sent',
      );
    } catch (error) {
      this.logger.error('Failed to send payment success notification:', error);
    }
  }

  /**
   * Send shipping update notification
   */
  async sendShippingUpdate(order: any): Promise<void> {
    try {
      const email =
        order.shippingEmail || order.customer?.email || order.shippingPhone;

      if (email && email.includes('@')) {
        const subject = `Đơn hàng #${order.orderNumber} đang được giao`;
        const html = this.emailService.shippingUpdateHtml(order);

        await this.emailService.sendEmail(email, subject, html).catch((err) => {
          this.logger.error('Failed to send shipping update email:', err);
        });

        await this.logNotification(
          'email',
          email,
          subject,
          'Shipping update',
          'sent',
        );
      }
    } catch (error) {
      this.logger.error('Failed to send shipping update:', error);
    }
  }

  /**
   * Send delivery confirmation notification
   */
  async sendDeliveryConfirmation(order: any): Promise<void> {
    try {
      const email =
        order.shippingEmail || order.customer?.email || order.shippingPhone;

      if (email && email.includes('@')) {
        const subject = `Đơn hàng #${order.orderNumber} đã giao thành công`;
        const html = this.emailService.deliveryConfirmationHtml(order);

        await this.emailService.sendEmail(email, subject, html).catch((err) => {
          this.logger.error('Failed to send delivery confirmation email:', err);
        });

        await this.logNotification(
          'email',
          email,
          subject,
          'Delivery confirmation',
          'sent',
        );
      }
    } catch (error) {
      this.logger.error('Failed to send delivery confirmation:', error);
    }
  }

  /**
   * Send order cancellation notification
   */
  async sendOrderCancellation(order: any): Promise<void> {
    try {
      const email =
        order.shippingEmail || order.customer?.email || order.shippingPhone;

      if (email && email.includes('@')) {
        const subject = `Đơn hàng #${order.orderNumber} đã bị hủy`;
        const html = this.emailService.orderCancellationHtml(order);

        await this.emailService.sendEmail(email, subject, html).catch((err) => {
          this.logger.error('Failed to send cancellation email:', err);
        });

        await this.logNotification(
          'email',
          email,
          subject,
          'Order cancellation',
          'sent',
        );
      }

      await this.telegramService.notifyOrderCancellation(order).catch((err) => {
        this.logger.error('Failed to send Telegram notification:', err);
      });

      await this.logNotification(
        'telegram',
        'admin',
        null,
        'Order cancellation notification',
        'sent',
      );
    } catch (error) {
      this.logger.error('Failed to send order cancellation notification:', error);
    }
  }

  /**
   * Send low stock alert (Telegram only)
   */
  async sendLowStockAlert(product: any): Promise<void> {
    try {
      await this.telegramService.notifyLowStock(product).catch((err) => {
        this.logger.error('Failed to send low stock alert:', err);
      });

      await this.logNotification(
        'telegram',
        'admin',
        null,
        `Low stock alert: ${product.name}`,
        'sent',
      );
    } catch (error) {
      this.logger.error('Failed to send low stock alert:', error);
    }
  }
}
