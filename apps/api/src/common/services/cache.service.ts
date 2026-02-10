import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private connected = false;

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn("REDIS_URL not set – caching disabled");
      return;
    }

    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
        lazyConnect: true,
      });

      this.client.on("error", (err) => {
        if (this.connected) {
          this.logger.warn(`Redis error: ${err.message}`);
          this.connected = false;
        }
      });

      this.client.on("connect", () => {
        this.connected = true;
      });

      await this.client.connect();
      this.logger.log("Redis connected");
    } catch (err) {
      this.logger.warn(`Redis connection failed: ${(err as Error).message} – caching disabled`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  get isAvailable(): boolean {
    return !!this.client && this.connected;
  }

  /**
   * Get a cached value. Returns null on miss or if Redis unavailable.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable) return null;
    try {
      const raw = await this.client!.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set a value with TTL in seconds.
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.isAvailable) return;
    try {
      await this.client!.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Silently fail – caching is best-effort
    }
  }

  /**
   * Delete a specific key.
   */
  async del(key: string): Promise<void> {
    if (!this.isAvailable) return;
    try {
      await this.client!.del(key);
    } catch {
      // Silently fail
    }
  }

  /**
   * Delete all keys matching a pattern (e.g. "cache:products:*").
   * Uses SCAN to avoid blocking.
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isAvailable) return;
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client!.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client!.del(...keys);
        }
      } while (cursor !== "0");
    } catch {
      // Silently fail
    }
  }
}
