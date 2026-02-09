import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
} from "@nestjs/common";

@Controller("webhook")
export class PancakeWebhookController {
  private readonly logger = new Logger(PancakeWebhookController.name);

  /**
   * POST /api/webhook/pancake
   * Stub webhook handler for Pancake POS.
   * Will be implemented when Pancake API documentation is available.
   */
  @Post("pancake")
  @HttpCode(200)
  async handlePancakeWebhook(@Body() payload: any) {
    this.logger.log(
      `Received Pancake webhook: ${JSON.stringify(payload).substring(0, 200)}`,
    );

    this.logger.warn("Pancake webhook handling is not yet implemented");

    return {
      success: true,
      message: "Pancake webhook received (handler pending implementation)",
    };
  }
}
