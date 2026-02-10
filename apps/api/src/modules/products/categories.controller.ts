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

@Controller("admin/categories")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class CategoriesAdminController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const result = await this.categoriesService.create(createCategoryDto);
    await this.cacheInvalidation.invalidateCategories();
    return result;
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    const result = await this.categoriesService.update(id, updateCategoryDto);
    await this.cacheInvalidation.invalidateCategories();
    return result;
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const result = await this.categoriesService.remove(id);
    await this.cacheInvalidation.invalidateCategories();
    return result;
  }
}

@Controller("categories")
export class CategoriesPublicController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(900)
  findTree() {
    return this.categoriesService.findTree();
  }

  @Get("slugs")
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(3600)
  async getSlugs() {
    return this.categoriesService.getAllSlugs();
  }

  @Get(":slug")
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(300)
  findBySlug(@Param("slug") slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
