import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('products')
export class ReviewsPublicController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':productId/reviews')
  findByProduct(
    @Param('productId') productId: string,
    @Query() filter: ReviewFilterDto,
  ) {
    return this.reviewsService.findByProduct(productId, filter);
  }

  @Get(':productId/reviews/summary')
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
