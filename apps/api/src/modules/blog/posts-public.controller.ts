import { Controller, Get, Post, Param, Query } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { PostFilterDto } from "./dto/post-filter.dto";

@Controller("posts")
export class PostsPublicController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findPublished(
    @Query() filter: PostFilterDto,
    @Query("categorySlug") categorySlug?: string,
  ) {
    return this.postsService.findPublished({ ...filter, categorySlug });
  }

  @Get("recent")
  findRecent() {
    return this.postsService.findRecent(4);
  }

  @Get("popular")
  findPopular() {
    return this.postsService.findPopular(4);
  }

  @Get("slugs")
  async getSlugs() {
    return this.postsService.getAllSlugs();
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Post(":slug/view")
  incrementViewCount(@Param("slug") slug: string) {
    this.postsService.incrementViewCount(slug);
    return { success: true };
  }
}
