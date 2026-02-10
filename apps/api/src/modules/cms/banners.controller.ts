import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/create-banner.dto';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '../../common/interceptors/cache-ttl.decorator';
import { CacheInvalidationService } from '../../common/services/cache-invalidation.service';

@Controller('banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  /** Public: active banners filtered by position and date range */
  @Get()
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(600)
  findActive(@Query('position') position?: string) {
    return this.bannersService.findActive(position);
  }

  /** Admin: list all banners */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll() {
    return this.bannersService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateBannerDto) {
    const result = this.bannersService.create(dto);
    this.cacheInvalidation.invalidateBanners();
    return result;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    const result = this.bannersService.update(id, dto);
    this.cacheInvalidation.invalidateBanners();
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  delete(@Param('id') id: string) {
    const result = this.bannersService.delete(id);
    this.cacheInvalidation.invalidateBanners();
    return result;
  }
}
