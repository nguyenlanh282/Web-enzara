import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { CacheService } from "../services/cache.service";
import { CACHE_TTL_KEY } from "./cache-ttl.decorator";

/**
 * Intercepts GET requests and caches responses in Redis.
 * Only caches when:
 * - Request method is GET
 * - Handler has @CacheTTL() decorator
 * - Redis is available
 *
 * Cache key format: cache:<url-with-query>
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cache: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const ttl = this.reflector.get<number | undefined>(
      CACHE_TTL_KEY,
      context.getHandler(),
    );

    // No @CacheTTL → skip caching
    if (!ttl) return next.handle();

    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== "GET") return next.handle();

    // Don't cache authenticated requests (admin data, user-specific data)
    if (request.headers.authorization) return next.handle();

    const key = `cache:${request.url}`;

    // Try cache hit
    const cached = await this.cache.get(key);
    if (cached !== null) {
      return of(cached);
    }

    // Cache miss → execute handler, then cache result
    return next.handle().pipe(
      tap(async (data) => {
        await this.cache.set(key, data, ttl);
      }),
    );
  }
}
