import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '../../common/interceptors/cache-ttl.decorator';

@Controller('reviews')
@UseInterceptors(HttpCacheInterceptor)
export class ReviewsFeaturedController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('featured')
  @CacheTTL(600)
  getFeatured(@Query('limit') limit?: string) {
    return this.reviewsService.getFeaturedReviews(limit ? parseInt(limit) : 6);
  }
}
