import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsPublicController } from './reviews-public.controller';
import { ReviewsFeaturedController } from './reviews-featured.controller';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../common/services/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [AuthModule, LoyaltyModule],
  controllers: [ReviewsController, ReviewsPublicController, ReviewsFeaturedController],
  providers: [ReviewsService, PrismaService],
})
export class ReviewsModule {}
