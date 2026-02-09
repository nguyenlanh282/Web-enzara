import { Controller, Get, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsFeaturedController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    return this.reviewsService.getFeaturedReviews(limit ? parseInt(limit) : 6);
  }
}
