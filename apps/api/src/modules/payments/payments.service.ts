import { Injectable, Logger } from "@nestjs/common";
import { SepayService } from "./sepay/sepay.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly sepayService: SepayService) {}

  /**
   * Generate payment information for an order.
   * Currently supports SePay QR payments.
   */
  getPaymentInfo(order: { orderNumber: string; total: number }) {
    return this.sepayService.getPaymentInfo(order);
  }

  /**
   * Generate a QR URL for SePay payment.
   */
  generateQRUrl(order: { orderNumber: string; total: number }) {
    return this.sepayService.generateQRUrl(order);
  }
}
