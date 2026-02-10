import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { AdminReplyDto } from './dto/admin-reply.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CacheInvalidationService } from '../../common/services/cache-invalidation.service';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Get()
  findAll(@Query() filter: ReviewFilterDto) {
    return this.reviewsService.findAll(filter);
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    const result = await this.reviewsService.approve(id);
    await this.cacheInvalidation.invalidateReviews();
    return result;
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string) {
    const result = await this.reviewsService.reject(id);
    await this.cacheInvalidation.invalidateReviews();
    return result;
  }

  @Put(':id/reply')
  async reply(@Param('id') id: string, @Body() dto: AdminReplyDto) {
    const result = await this.reviewsService.reply(id, dto.adminReply);
    await this.cacheInvalidation.invalidateReviews();
    return result;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.reviewsService.delete(id);
    await this.cacheInvalidation.invalidateReviews();
    return result;
  }
}
