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
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '../../common/interceptors/cache-ttl.decorator';
import { CacheInvalidationService } from '../../common/services/cache-invalidation.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Get(':group')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(1800)
  getByGroup(@Param('group') group: string) {
    return this.settingsService.getByGroup(group);
  }

  @Put(':group')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  updateGroup(
    @Param('group') group: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    const result = this.settingsService.upsertGroup(group, dto.settings);
    this.cacheInvalidation.invalidateSettings();
    return result;
  }
}
