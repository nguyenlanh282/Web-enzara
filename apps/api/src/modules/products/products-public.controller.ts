import { Controller, Get, Post, Param, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductFilterDto } from "./dto/product-filter.dto";

@Controller("products")
export class ProductsPublicController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findPublic(filter);
  }

  @Get("featured")
  findFeatured(@Query("limit") limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.findFeatured(limitNum);
  }

  @Get("search")
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
  async getSlugs() {
    return this.productsService.getAllSlugs();
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(":slug/suggestions")
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
