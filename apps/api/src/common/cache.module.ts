import { Global, Module } from "@nestjs/common";
import { CacheService } from "./services/cache.service";
import { CacheInvalidationService } from "./services/cache-invalidation.service";

@Global()
@Module({
  providers: [CacheService, CacheInvalidationService],
  exports: [CacheService, CacheInvalidationService],
})
export class CacheModule {}
