import { Controller, Get, Post, Param, Query, UseInterceptors } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { PostFilterDto } from "./dto/post-filter.dto";
import { HttpCacheInterceptor } from "../../common/interceptors/http-cache.interceptor";
import { CacheTTL } from "../../common/interceptors/cache-ttl.decorator";

@Controller("posts")
@UseInterceptors(HttpCacheInterceptor)
export class PostsPublicController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @CacheTTL(300)
  findPublished(
    @Query() filter: PostFilterDto,
    @Query("categorySlug") categorySlug?: string,
  ) {
    return this.postsService.findPublished({ ...filter, categorySlug });
  }

  @Get("recent")
  @CacheTTL(300)
  findRecent() {
    return this.postsService.findRecent(4);
  }

  @Get("popular")
  @CacheTTL(600)
  findPopular() {
    return this.postsService.findPopular(4);
  }

  @Get("slugs")
  @CacheTTL(3600)
  async getSlugs() {
    return this.postsService.getAllSlugs();
  }

  @Get(":slug")
  @CacheTTL(300)
  findBySlug(@Param("slug") slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Post(":slug/view")
  incrementViewCount(@Param("slug") slug: string) {
    this.postsService.incrementViewCount(slug);
    return { success: true };
  }
}
