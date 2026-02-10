import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { HttpCacheInterceptor } from "../../common/interceptors/http-cache.interceptor";
import { CacheTTL } from "../../common/interceptors/cache-ttl.decorator";
import { CacheInvalidationService } from "../../common/services/cache-invalidation.service";

@Controller()
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Get("api/post-categories")
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(900)
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post("api/admin/post-categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateCategoryDto) {
    const result = this.categoriesService.create(dto);
    this.cacheInvalidation.invalidateBlog();
    return result;
  }

  @Put("api/admin/post-categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    const result = this.categoriesService.update(id, dto);
    this.cacheInvalidation.invalidateBlog();
    return result;
  }

  @Delete("api/admin/post-categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  delete(@Param("id") id: string) {
    const result = this.categoriesService.delete(id);
    this.cacheInvalidation.invalidateBlog();
    return result;
  }
}
