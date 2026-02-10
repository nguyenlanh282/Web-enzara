import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MenusService } from './menus.service';
import { UpsertMenuDto } from './dto/upsert-menu.dto';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '../../common/interceptors/cache-ttl.decorator';
import { CacheInvalidationService } from '../../common/services/cache-invalidation.service';

@Controller('menus')
export class MenusController {
  constructor(
    private readonly menusService: MenusService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Get(':position')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(1800)
  findByPosition(@Param('position') position: string) {
    return this.menusService.findByPosition(position);
  }

  @Put(':position')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  upsert(
    @Param('position') position: string,
    @Body() dto: UpsertMenuDto,
  ) {
    const result = this.menusService.upsert(position, dto);
    this.cacheInvalidation.invalidateMenus();
    return result;
  }
}
