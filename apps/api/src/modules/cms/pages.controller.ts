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
import { PagesService } from './pages.service';
import { CreatePageDto, UpdatePageDto } from './dto/create-page.dto';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '../../common/interceptors/cache-ttl.decorator';
import { CacheInvalidationService } from '../../common/services/cache-invalidation.service';

@Controller('pages')
export class PagesController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pagesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('slugs')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(3600)
  async getSlugs() {
    return this.pagesService.getAllSlugs();
  }

  @Get(':slug')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(900)
  findBySlug(@Param('slug') slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreatePageDto) {
    const result = await this.pagesService.create(dto);
    await this.cacheInvalidation.invalidatePages();
    return result;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    const result = await this.pagesService.update(id, dto);
    await this.cacheInvalidation.invalidatePages();
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async delete(@Param('id') id: string) {
    const result = await this.pagesService.delete(id);
    await this.cacheInvalidation.invalidatePages();
    return result;
  }
}
