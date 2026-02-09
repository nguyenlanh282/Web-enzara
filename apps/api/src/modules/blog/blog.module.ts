import { Module } from "@nestjs/common";
import { PostsController } from "./posts.controller";
import { PostsPublicController } from "./posts-public.controller";
import { CategoriesController } from "./categories.controller";
import { CommentsController } from "./comments.controller";
import { PostsService } from "./posts.service";
import { CategoriesService } from "./categories.service";
import { CommentsService } from "./comments.service";
import { PrismaService } from "../../common/services/prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [
    PostsController,
    PostsPublicController,
    CategoriesController,
    CommentsController,
  ],
  providers: [PostsService, CategoriesService, CommentsService, PrismaService],
  exports: [PostsService],
})
export class BlogModule {}
