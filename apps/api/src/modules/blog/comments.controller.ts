import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get("api/posts/:slug/comments")
  findByPost(@Param("slug") slug: string) {
    return this.commentsService.findByPostSlug(slug);
  }

  @Post("api/posts/:slug/comments")
  create(@Param("slug") slug: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(slug, dto);
  }

  @Get("api/admin/comments")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll() {
    return this.commentsService.findAll();
  }

  @Put("api/admin/comments/:id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  approve(@Param("id") id: string) {
    return this.commentsService.approve(id);
  }

  @Delete("api/admin/comments/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  delete(@Param("id") id: string) {
    return this.commentsService.delete(id);
  }
}
