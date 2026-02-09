import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('balance')
  getBalance(@CurrentUser('id') userId: string) {
    return this.loyaltyService.getBalance(userId);
  }

  @Get('history')
  getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.loyaltyService.getHistory(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post('redeem')
  async redeem(
    @CurrentUser('id') userId: string,
    @Body() dto: RedeemPointsDto,
  ) {
    const record = await this.loyaltyService.redeemPoints(
      userId,
      dto.points,
      'Doi diem lay giam gia',
    );

    const discount = this.loyaltyService.getRedemptionValue(dto.points);
    const balance = await this.loyaltyService.getBalance(userId);

    return {
      discount,
      remainingBalance: balance.currentBalance,
    };
  }
}
