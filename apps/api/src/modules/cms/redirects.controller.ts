import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RedirectsService } from './redirects.service';
import {
  CreateRedirectDto,
  UpdateRedirectDto,
} from './dto/create-redirect.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@Controller('redirects')
export class RedirectsController {
  constructor(private readonly redirectsService: RedirectsService) {}

  @Get()
  findAll() {
    return this.redirectsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.redirectsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateRedirectDto) {
    return this.redirectsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRedirectDto) {
    return this.redirectsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.redirectsService.delete(id);
  }
}
