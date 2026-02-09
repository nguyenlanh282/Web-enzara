import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly chatId: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID') || '';
  }

  /**
   * Send message via Telegram Bot API
   */
  async sendMessage(text: string, parseMode: string = 'HTML'): Promise<void> {
    if (!this.botToken || !this.chatId) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured, skipping Telegram notification',
      );
      return;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: this.chatId,
            text,
            parse_mode: parseMode,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${error}`);
      }

      this.logger.log('Telegram message sent successfully');
    } catch (error) {
      this.logger.error('Failed to send Telegram message:', error);
      throw error;
    }
  }

  /**
   * Notify new order
   */
  async notifyNewOrder(order: any): Promise<void> {
    const text = `
🛒 <b>Đơn hàng mới #${order.orderNumber}</b>

👤 Khách hàng: ${order.shippingName}
📞 SĐT: ${order.shippingPhone}
💰 Tổng tiền: ${new Intl.NumberFormat('vi-VN').format(order.total)}đ
💳 Thanh toán: ${order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod === 'SEPAY_QR' ? 'QR Code' : 'Chuyển khoản'}

📦 Sản phẩm:
${order.items.map((item: any) => `  • ${item.productName}${item.variantName ? ` (${item.variantName})` : ''} x${item.quantity}`).join('\n')}

📍 Địa chỉ: ${order.shippingAddress}, ${order.shippingWard}, ${order.shippingDistrict}, ${order.shippingProvince}
    `.trim();

    return this.sendMessage(text);
  }

  /**
   * Notify payment success
   */
  async notifyPaymentSuccess(order: any): Promise<void> {
    const text = `
💰 <b>Thanh toán thành công #${order.orderNumber}</b>

Khách hàng: ${order.shippingName}
Số tiền: ${new Intl.NumberFormat('vi-VN').format(order.total)}đ
    `.trim();

    return this.sendMessage(text);
  }

  /**
   * Notify order cancellation
   */
  async notifyOrderCancellation(order: any): Promise<void> {
    const text = `
❌ <b>Đơn hàng #${order.orderNumber} đã bị hủy</b>

Khách hàng: ${order.shippingName}
Tổng tiền: ${new Intl.NumberFormat('vi-VN').format(order.total)}đ
${order.cancelReason ? `Lý do: ${order.cancelReason}` : ''}
    `.trim();

    return this.sendMessage(text);
  }

  /**
   * Notify low stock
   */
  async notifyLowStock(product: any): Promise<void> {
    const text = `
⚠️ <b>Cảnh báo tồn kho thấp</b>

Sản phẩm: ${product.name}
Còn lại: ${product.stockQuantity} sản phẩm
SKU: ${product.sku || 'N/A'}
    `.trim();

    return this.sendMessage(text);
  }
}
