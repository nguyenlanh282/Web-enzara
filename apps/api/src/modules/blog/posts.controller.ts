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

@Controller("admin/posts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query() filter: PostFilterDto) {
    return this.postsService.findAll(filter);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.postsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.postsService.createPost(dto, user.id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.updatePost(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  delete(@Param("id") id: string) {
    return this.postsService.deletePost(id);
  }
}
