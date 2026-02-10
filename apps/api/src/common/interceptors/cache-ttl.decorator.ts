import { SetMetadata } from "@nestjs/common";

export const CACHE_TTL_KEY = "cache_ttl";

/**
 * Decorator to set cache TTL (in seconds) on a controller method.
 * Used with HttpCacheInterceptor.
 *
 * @example
 *   @CacheTTL(300)  // 5 minutes
 *   @Get()
 *   findAll() { ... }
 */
export const CacheTTL = (seconds: number) =>
  SetMetadata(CACHE_TTL_KEY, seconds);
