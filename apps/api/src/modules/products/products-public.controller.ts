import { Controller, Get, Post, Param, Query, UseInterceptors } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductFilterDto } from "./dto/product-filter.dto";
import { HttpCacheInterceptor } from "../../common/interceptors/http-cache.interceptor";
import { CacheTTL } from "../../common/interceptors/cache-ttl.decorator";

@Controller("products")
@UseInterceptors(HttpCacheInterceptor)
export class ProductsPublicController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @CacheTTL(120)
  findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findPublic(filter);
  }

  @Get("featured")
  @CacheTTL(300)
  findFeatured(@Query("limit") limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.findFeatured(limitNum);
  }

  @Get("search")
  @CacheTTL(60)
  search(
    @Query("q") query: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.productsService.searchProducts(query, limitNum, pageNum);
  }

  @Get("suggestions/for-cart")
  @CacheTTL(120)
  async getCartSuggestions(
    @Query("productIds") productIds: string,
    @Query("limit") limit?: string,
  ) {
    const ids = productIds
      ? productIds.split(",").filter((id) => id.trim())
      : [];
    const limitNum = limit ? parseInt(limit, 10) : 4;
    return this.productsService.getCartSuggestions(ids, limitNum);
  }

  @Get("slugs")
  @CacheTTL(3600)
  async getSlugs() {
    return this.productsService.getAllSlugs();
  }

  @Get(":slug")
  @CacheTTL(120)
  findBySlug(@Param("slug") slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(":slug/suggestions")
  @CacheTTL(300)
  async getSuggestions(
    @Param("slug") slug: string,
    @Query("limit") limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 8;
    return this.productsService.getSuggestions(slug, limitNum);
  }

  @Post(":slug/view")
  incrementView(@Param("slug") slug: string) {
    this.productsService.incrementViewCount(slug);
    return { success: true };
  }
}
