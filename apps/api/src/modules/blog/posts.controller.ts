import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { PostsService } from "./posts.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { PostFilterDto } from "./dto/post-filter.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { Request } from "express";
import { CacheInvalidationService } from "../../common/services/cache-invalidation.service";

@Controller("admin/posts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Get()
  findAll(@Query() filter: PostFilterDto) {
    return this.postsService.findAll(filter);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.postsService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreatePostDto, @Req() req: Request) {
    const user = req.user as { id: string };
    const result = await this.postsService.createPost(dto, user.id);
    await this.cacheInvalidation.invalidateBlog();
    return result;
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdatePostDto) {
    const result = await this.postsService.updatePost(id, dto);
    await this.cacheInvalidation.invalidateBlog();
    return result;
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async delete(@Param("id") id: string) {
    const result = await this.postsService.deletePost(id);
    await this.cacheInvalidation.invalidateBlog();
    return result;
  }
}
