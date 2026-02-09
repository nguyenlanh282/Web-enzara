import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ||
      'Enzara <noreply@enzara.vn>';
  }

  /**
   * Send email via Resend API
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY not configured, skipping email send');
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Welcome email template
   */
  welcomeHtml(fullName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #047857; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Enzara</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <div style="margin: 0 0 20px;">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#10b981"/>
                        <path d="M9 12l2 2 4-4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px;">Chao mung ${fullName}!</h2>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.5;">
                      Cam on ban da dang ky tai khoan tai Enzara. Chung toi rat vui duoc chao don ban!
                    </p>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.5;">
                      Ban da duoc tang <strong style="color: #047857;">100 diem tich luy</strong> de bat dau trai nghiem mua sam cung Enzara.
                    </p>
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Hay kham pha cac san pham tay rua sinh thai cua chung toi ngay hom nay!
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      &copy; 2024 Enzara - San pham tay rua sinh thai Viet Nam
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Email verification template
   */
  emailVerificationHtml(verifyUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #047857; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Enzara</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px;">Xac minh dia chi email</h2>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.5;">
                      Vui long nhan nut ben duoi de xac minh dia chi email cua ban.
                    </p>
                    <div style="margin: 30px 0; text-align: center;">
                      <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background-color: #047857; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px;">
                        Xac minh email
                      </a>
                    </div>
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Link nay se het han sau 24 gio.
                    </p>
                    <p style="margin: 12px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Neu ban khong dang ky tai khoan tai Enzara, vui long bo qua email nay.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      &copy; 2024 Enzara - San pham tay rua sinh thai Viet Nam
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Order confirmation email template
   */
  orderConfirmationHtml(order: any): string {
    const itemsHtml = order.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.productName}${item.variantName ? ` (${item.variantName})` : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${new Intl.NumberFormat('vi-VN').format(item.price)}đ</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${new Intl.NumberFormat('vi-VN').format(item.total)}đ</td>
      </tr>
    `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #047857; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Enzara</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px;">Đơn hàng #${order.orderNumber} đã được đặt thành công</h2>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.5;">
                      Cảm ơn bạn đã đặt hàng tại Enzara! Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background-color: #f9fafb;">
                          <th style="padding: 12px 8px; text-align: left; font-size: 14px; color: #6b7280;">Sản phẩm</th>
                          <th style="padding: 12px 8px; text-align: center; font-size: 14px; color: #6b7280;">SL</th>
                          <th style="padding: 12px 8px; text-align: right; font-size: 14px; color: #6b7280;">Đơn giá</th>
                          <th style="padding: 12px 8px; text-align: right; font-size: 14px; color: #6b7280;">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tạm tính:</td>
                        <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 14px;">${new Intl.NumberFormat('vi-VN').format(order.subtotal)}đ</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Giảm giá:</td>
                        <td style="padding: 8px 0; text-align: right; color: #047857; font-size: 14px;">-${new Intl.NumberFormat('vi-VN').format(order.discountAmount)}đ</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phí vận chuyển:</td>
                        <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 14px;">${new Intl.NumberFormat('vi-VN').format(order.shippingFee)}đ</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 0; color: #111827; font-size: 18px; font-weight: bold; border-top: 2px solid #e5e7eb;">Tổng cộng:</td>
                        <td style="padding: 12px 0 0; text-align: right; color: #047857; font-size: 18px; font-weight: bold; border-top: 2px solid #e5e7eb;">${new Intl.NumberFormat('vi-VN').format(order.total)}đ</td>
                      </tr>
                    </table>

                    <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                      <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px;">Thông tin giao hàng</h3>
                      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        <strong>${order.shippingName}</strong><br>
                        ${order.shippingPhone}<br>
                        ${order.shippingAddress}, ${order.shippingWard}, ${order.shippingDistrict}, ${order.shippingProvince}
                      </p>
                    </div>

                    <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      © 2024 Enzara - Sản phẩm tẩy rửa sinh thái Việt Nam
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Payment success email template
   */
  paymentSuccessHtml(order: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #047857; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Enzara</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <div style="margin: 0 0 20px;">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#10b981"/>
                        <path d="M9 12l2 2 4-4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px;">Thanh toán thành công!</h2>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.5;">
                      Đơn hàng #${order.orderNumber} của bạn đã được thanh toán thành công. Chúng tôi sẽ xử lý và giao hàng sớm nhất có thể.
                    </p>
                    <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Tổng thanh toán</p>
                      <p style="margin: 8px 0 0; color: #047857; font-size: 32px; font-weight: bold;">${new Intl.NumberFormat('vi-VN').format(order.total)}đ</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      © 2024 Enzara - Sản phẩm tẩy rửa sinh thái Việt Nam
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Shipping update email template
   */
  shippingUpdateHtml(order: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #047857; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Enzara</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px;">Đơn hàng #${order.orderNumber} đang được giao</h2>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.5;">
                      Đơn hàng của bạn đang trên đường giao đến. Vui lòng chuẩn bị nhận hàng.
                    </p>
                    <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                      <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px;">Địa chỉ giao hàng</h3>
                      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        <strong>${order.shippingName}</strong><br>
                        ${order.shippingPhone}<br>
                        ${order.shippingAddress}, ${order.shippingWard}, ${order.shippingDistrict}, ${order.shippingProvince}
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      © 2024 Enzara - Sản phẩm tẩy rửa sinh thái Việt Nam
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Delivery confirmation email template
   */
  deliveryConfirmationHtml(order: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #047857; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Enzara</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <div style="margin: 0 0 20px;">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#10b981"/>
                        <path d="M9 12l2 2 4-4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px;">Đơn hàng #${order.orderNumber} đã giao thành công</h2>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.5;">
                      Cảm ơn bạn đã mua sắm tại Enzara! Hy vọng bạn hài lòng với sản phẩm của chúng tôi.
                    </p>
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Nếu bạn có bất kỳ vấn đề nào với đơn hàng, vui lòng liên hệ với chúng tôi.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      © 2024 Enzara - Sản phẩm tẩy rửa sinh thái Việt Nam
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Order cancellation email template
   */
  /**
   * Password reset email template
   */
  passwordResetHtml(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #047857; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Enzara</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px;">Đặt lại mật khẩu</h2>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.5;">
                      Bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tạo mật khẩu mới.
                    </p>
                    <div style="margin: 30px 0; text-align: center;">
                      <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #047857; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px;">
                        Đặt lại mật khẩu
                      </a>
                    </div>
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Link này sẽ hết hạn sau 1 giờ.
                    </p>
                    <p style="margin: 12px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      © 2024 Enzara - Sản phẩm tẩy rửa sinh thái Việt Nam
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Order cancellation email template
   */
  orderCancellationHtml(order: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background-color: #047857; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Enzara</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px;">Đơn hàng #${order.orderNumber} đã bị hủy</h2>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 1.5;">
                      Đơn hàng của bạn đã được hủy${order.cancelReason ? ` với lý do: ${order.cancelReason}` : ''}.
                    </p>
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      © 2024 Enzara - Sản phẩm tẩy rửa sinh thái Việt Nam
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
