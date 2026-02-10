import { Injectable } from "@nestjs/common";
import { CacheService } from "./cache.service";

/**
 * Provides domain-specific cache invalidation methods.
 * Call these after admin write operations (create/update/delete).
 */
@Injectable()
export class CacheInvalidationService {
  constructor(private readonly cache: CacheService) {}

  async invalidateProducts() {
    await Promise.all([
      this.cache.delPattern("cache:/api/products*"),
      this.cache.delPattern("cache:/api/categories*"),
    ]);
  }

  async invalidateCategories() {
    await Promise.all([
      this.cache.delPattern("cache:/api/categories*"),
      this.cache.delPattern("cache:/api/products*"),
    ]);
  }

  async invalidateBanners() {
    await this.cache.delPattern("cache:/api/banners*");
  }

  async invalidateSettings() {
    await this.cache.delPattern("cache:/api/settings*");
  }

  async invalidateMenus() {
    await this.cache.delPattern("cache:/api/menus*");
  }

  async invalidatePages() {
    await this.cache.delPattern("cache:/api/pages*");
  }

  async invalidateBlog() {
    await Promise.all([
      this.cache.delPattern("cache:/api/posts*"),
      this.cache.delPattern("cache:/api/post-categories*"),
    ]);
  }

  async invalidateFlashSales() {
    await this.cache.delPattern("cache:/api/flash-sales*");
  }

  async invalidateReviews(productId?: string) {
    await Promise.all([
      this.cache.delPattern("cache:/api/reviews*"),
      productId
        ? this.cache.delPattern(`cache:/api/products/${productId}/reviews*`)
        : this.cache.delPattern("cache:/api/products/*/reviews*"),
    ]);
  }

  /** Invalidate everything (nuclear option) */
  async invalidateAll() {
    await this.cache.delPattern("cache:*");
  }
}
