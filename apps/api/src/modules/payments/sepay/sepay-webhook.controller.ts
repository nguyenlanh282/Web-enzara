import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  UnauthorizedException,
  HttpCode,
} from "@nestjs/common";
import { SepayService } from "./sepay.service";
import { OrdersService } from "../../orders/orders.service";

/**
 * SePay webhook payload structure.
 * Based on SePay documentation for bank transfer webhooks.
 */
interface SepayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  transferType: string;
  transferAmount: number;
  accumulated: number;
  code: string | null;
  content: string;
  referenceCode: string;
  description: string;
}

@Controller("webhook")
export class SepayWebhookController {
  private readonly logger = new Logger(SepayWebhookController.name);

  constructor(
    private readonly sepayService: SepayService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * POST /api/webhook/sepay
   * Handle SePay payment webhook.
   * 1. Verify webhook authenticity
   * 2. Extract order number from transfer content
   * 3. Find order and verify amount
   * 4. Update payment status
   */
  @Post("sepay")
  @HttpCode(200)
  async handleSepayWebhook(
    @Headers("authorization") authorization: string | undefined,
    @Body() payload: SepayWebhookPayload,
  ) {
    this.logger.log(
      `Received SePay webhook: ${JSON.stringify({
        id: payload.id,
        amount: payload.transferAmount,
        content: payload.content,
      })}`,
    );

    // 1. Verify webhook authenticity
    if (!this.sepayService.verifyWebhook(authorization)) {
      this.logger.warn("SePay webhook verification failed");
      throw new UnauthorizedException("Invalid API key");
    }

    // Only process incoming transfers (credit)
    if (payload.transferType !== "in") {
      this.logger.log(
        `Skipping non-incoming transfer type: ${payload.transferType}`,
      );
      return { success: true, message: "Skipped non-incoming transfer" };
    }

    // 2. Extract order number from transfer content
    const orderNumber = this.sepayService.extractOrderNumber(
      payload.content || payload.description || "",
    );

    if (!orderNumber) {
      this.logger.warn(
        `Could not extract order number from content: "${payload.content}"`,
      );
      return {
        success: true,
        message: "No order number found in transfer content",
      };
    }

    this.logger.log(
      `Extracted order number: ${orderNumber}, amount: ${payload.transferAmount}`,
    );

    // 3. Find order and verify amount
    try {
      const order = await this.ordersService.findByOrderNumber(orderNumber);

      const orderTotal = Number(order.total);
      if (payload.transferAmount < orderTotal) {
        this.logger.warn(
          `Transfer amount ${payload.transferAmount} is less than order total ${orderTotal} for order ${orderNumber}`,
        );
        return {
          success: true,
          message: "Transfer amount is less than order total",
        };
      }

      // 4. Update payment status
      const sepayTxId = String(payload.id || payload.referenceCode);
      await this.ordersService.confirmPayment(
        order.id,
        sepayTxId,
        new Date(payload.transactionDate || Date.now()),
      );

      this.logger.log(
        `Payment confirmed for order ${orderNumber} (TX: ${sepayTxId})`,
      );

      return { success: true, message: "Payment confirmed" };
    } catch (error: any) {
      this.logger.error(
        `Error processing SePay webhook for order ${orderNumber}: ${error.message}`,
      );
      return { success: true, message: "Order not found or already processed" };
    }
  }
}
