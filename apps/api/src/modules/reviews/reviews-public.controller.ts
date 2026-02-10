import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '../../common/interceptors/cache-ttl.decorator';

@Controller('products')
export class ReviewsPublicController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':productId/reviews')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(300)
  findByProduct(
    @Param('productId') productId: string,
    @Query() filter: ReviewFilterDto,
  ) {
    return this.reviewsService.findByProduct(productId, filter);
  }

  @Get(':productId/reviews/summary')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(300)
  getRatingSummary(@Param('productId') productId: string) {
    return this.reviewsService.getRatingSummary(productId);
  }

  @Get(':productId/reviews/can-review')
  @UseGuards(JwtAuthGuard)
  canReview(@Param('productId') productId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.reviewsService.canReview(productId, user.id);
  }

  @Post(':productId/reviews')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.reviewsService.create(productId, user.id, dto);
  }
}
