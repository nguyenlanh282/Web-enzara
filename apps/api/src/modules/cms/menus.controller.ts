import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MenusService } from './menus.service';
import { UpsertMenuDto } from './dto/upsert-menu.dto';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get(':position')
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
    return this.menusService.upsert(position, dto);
  }
}
