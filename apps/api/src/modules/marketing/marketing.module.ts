import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { FlashSalesController } from './flash-sales.controller';
import { FlashSalesService } from './flash-sales.service';
import { NewsletterController } from './newsletter.controller';
import { ContactController } from './contact.controller';
import { PrismaService } from '../../common/services/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VouchersController, FlashSalesController, NewsletterController, ContactController],
  providers: [VouchersService, FlashSalesService, PrismaService],
  exports: [VouchersService, FlashSalesService],
})
export class MarketingModule {}
