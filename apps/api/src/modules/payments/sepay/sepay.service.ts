import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);

  private readonly bankName: string;
  private readonly accountNumber: string;
  private readonly accountHolder: string;
  private readonly prefix: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.bankName = this.configService.get<string>("SEPAY_BANK_NAME", "");
    this.accountNumber = this.configService.get<string>(
      "SEPAY_ACCOUNT_NUMBER",
      "",
    );
    this.accountHolder = this.configService.get<string>(
      "SEPAY_ACCOUNT_HOLDER",
      "",
    );
    this.prefix = this.configService.get<string>("SEPAY_PREFIX", "PC");
    this.apiKey = this.configService.get<string>("SEPAY_API_KEY", "");
  }

  /**
   * Generate a VietQR URL for SePay payment.
   * Format: https://qr.sepay.vn/img?acc={account}&bank={bank}&amount={total}&des={content}
   */
  generateQRUrl(order: {
    orderNumber: string;
    total: number;
  }): string {
    const content = `${this.prefix} ${order.orderNumber}`;
    const params = new URLSearchParams({
      acc: this.accountNumber,
      bank: this.bankName,
      amount: String(order.total),
      des: content,
    });

    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  /**
   * Get payment info for display on the frontend.
   */
  getPaymentInfo(order: { orderNumber: string; total: number }) {
    const content = `${this.prefix} ${order.orderNumber}`;
    return {
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      accountHolder: this.accountHolder,
      amount: order.total,
      content,
      qrUrl: this.generateQRUrl(order),
    };
  }

  /**
   * Extract order number from a bank transfer content string.
   * Looks for the pattern ENZ-YYYYMMDD-XXXX in the content.
   */
  extractOrderNumber(content: string): string | null {
    if (!content) return null;

    // Match ENZ-YYYYMMDD-XXXX pattern
    const match = content.match(/ENZ-\d{8}-\d{4}/);
    return match ? match[0] : null;
  }

  /**
   * Verify the webhook authenticity by checking the API key.
   * SePay sends the API key in the Authorization header.
   */
  verifyWebhook(authorizationHeader: string | undefined): boolean {
    if (!this.apiKey) {
      this.logger.warn(
        "SEPAY_API_KEY is not configured. Webhook verification skipped.",
      );
      return true;
    }

    if (!authorizationHeader) {
      return false;
    }

    // SePay sends: "Apikey {key}"
    const headerKey = authorizationHeader.replace(/^Apikey\s+/i, "").trim();
    return headerKey === this.apiKey;
  }
}
