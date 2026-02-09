import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { CheckWishlistDto } from './dto/check-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.wishlistService.getWishlist(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post()
  addToWishlist(
    @CurrentUser('id') userId: string,
    @Body() dto: AddToWishlistDto,
  ) {
    return this.wishlistService.addToWishlist(userId, dto.productId);
  }

  @Delete(':productId')
  removeFromWishlist(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(userId, productId);
  }

  @Post('check')
  async checkWishlist(
    @CurrentUser('id') userId: string,
    @Body() dto: CheckWishlistDto,
  ) {
    const wishlisted = await this.wishlistService.checkWishlist(
      userId,
      dto.productIds,
    );
    return { wishlisted };
  }

  @Get('count')
  async getWishlistCount(@CurrentUser('id') userId: string) {
    const count = await this.wishlistService.getWishlistCount(userId);
    return { count };
  }
}
