import Redis, { RedisOptions } from "ioredis";

/**
 * Robust Hybrid Cache Manager supporting Redis with In-Memory fallback.
 * Implements Cache-Aside pattern, tag/prefix invalidation, and telemetry metrics.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export class HybridCacheService {
  private redisClient: Redis | null = null;
  private isRedisConnected = false;
  private memoryCache = new Map<string, CacheEntry<any>>();
  private hitCount = 0;
  private missCount = 0;
  private redisUrl: string | undefined;

  constructor() {
    this.redisUrl = process.env.REDIS_URL;
    this.initRedis();

    // In-memory periodic cleanup every 5 minutes
    setInterval(() => this.cleanupExpiredMemory(), 5 * 60 * 1000).unref();
  }

  private initRedis() {
    if (!this.redisUrl) {
      console.log(
        "[Cache] REDIS_URL not configured. Operating in high-performance in-memory cache mode.",
      );
      return;
    }

    try {
      const options: RedisOptions = {
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => {
          if (times > 5) {
            console.warn(
              "[Cache] Redis reconnect attempts exceeded limit. Falling back to in-memory cache.",
            );
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        enableReadyCheck: true,
        lazyConnect: true,
      };

      this.redisClient = new Redis(this.redisUrl, options);

      this.redisClient.on("connect", () => {
        this.isRedisConnected = true;
        console.log("[Cache] Successfully connected to Redis distributed cache.");
      });

      this.redisClient.on("ready", () => {
        this.isRedisConnected = true;
      });

      this.redisClient.on("error", (err) => {
        this.isRedisConnected = false;
        console.warn(
          `[Cache] Redis connection issue (${err.message}). Using local cache fallback.`,
        );
      });

      this.redisClient.on("close", () => {
        this.isRedisConnected = false;
      });

      // Non-blocking connection attempt
      this.redisClient.connect().catch((err) => {
        this.isRedisConnected = false;
        console.warn(
          `[Cache] Initial Redis connection failed: ${err.message}. Running on local cache.`,
        );
      });
    } catch (err: any) {
      console.warn(`[Cache] Failed to initialize Redis client: ${err?.message}`);
      this.redisClient = null;
      this.isRedisConnected = false;
    }
  }

  /**
   * Get cached value by key (async for Redis, synchronous fallback)
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. Try Redis if connected
    if (this.redisClient && this.isRedisConnected) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw !== null) {
          this.hitCount++;
          return JSON.parse(raw) as T;
        }
      } catch (err: any) {
        console.warn(`[Cache] Redis GET error for key "${key}":`, err.message);
      }
    }

    // 2. Memory Cache fallback
    const entry = this.memoryCache.get(key);
    if (!entry) {
      this.missCount++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry.value as T;
  }

  /**
   * Set cached value with TTL (default 1 hour = 3600 seconds)
   * Supports tags for grouping and mass invalidation
   */
  async set<T>(key: string, value: T, ttlSeconds = 3600, tags: string[] = []): Promise<void> {
    const serialized = JSON.stringify(value);

    // 1. Write to Redis if connected
    if (this.redisClient && this.isRedisConnected) {
      try {
        const pipeline = this.redisClient.pipeline();
        pipeline.setex(key, ttlSeconds, serialized);

        // Store tags for quick invalidation
        for (const tag of tags) {
          const tagSetKey = `tag:${tag}`;
          pipeline.sadd(tagSetKey, key);
          pipeline.expire(tagSetKey, ttlSeconds + 300);
        }

        await pipeline.exec();
      } catch (err: any) {
        console.warn(`[Cache] Redis SET error for key "${key}":`, err.message);
      }
    }

    // 2. Mirror in Memory Cache
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  /**
   * Invalidate a single key
   */
  async delete(key: string): Promise<boolean> {
    let deleted = false;

    if (this.redisClient && this.isRedisConnected) {
      try {
        const res = await this.redisClient.del(key);
        if (res > 0) deleted = true;
      } catch (err: any) {
        console.warn(`[Cache] Redis DEL error:`, err.message);
      }
    }

    if (this.memoryCache.delete(key)) {
      deleted = true;
    }

    return deleted;
  }

  /**
   * Invalidate all keys matching a prefix (e.g., "courses:", "schedules:", "exams:")
   */
  async invalidatePattern(prefix: string): Promise<number> {
    let count = 0;

    // Invalidate in Redis
    if (this.redisClient && this.isRedisConnected) {
      try {
        const keys = await this.redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          const pipeline = this.redisClient.pipeline();
          keys.forEach((k) => pipeline.del(k));
          await pipeline.exec();
          count += keys.length;
        }
      } catch (err: any) {
        console.warn(`[Cache] Redis invalidatePattern error:`, err.message);
      }
    }

    // Invalidate in Memory
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Invalidate all keys associated with a specific tag
   */
  async invalidateTag(tag: string): Promise<number> {
    let count = 0;

    // Redis tag invalidation
    if (this.redisClient && this.isRedisConnected) {
      try {
        const tagSetKey = `tag:${tag}`;
        const keys = await this.redisClient.smembers(tagSetKey);
        if (keys.length > 0) {
          const pipeline = this.redisClient.pipeline();
          keys.forEach((k) => pipeline.del(k));
          pipeline.del(tagSetKey);
          await pipeline.exec();
          count += keys.length;
        }
      } catch (err: any) {
        console.warn(`[Cache] Redis invalidateTag error:`, err.message);
      }
    }

    // Memory tag invalidation
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.includes(tag)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    if (this.redisClient && this.isRedisConnected) {
      try {
        await this.redisClient.flushdb();
      } catch (err: any) {
        console.warn(`[Cache] Redis FLUSHDB error:`, err.message);
      }
    }
    this.memoryCache.clear();
  }

  /**
   * Telemetry stats
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    return {
      provider: this.isRedisConnected
        ? "Redis Distributed Cache"
        : "In-Memory High-Performance Cache",
      isRedisConnected: this.isRedisConnected,
      memorySize: this.memoryCache.size,
      hits: this.hitCount,
      misses: this.missCount,
      hitRatio: totalRequests > 0 ? (this.hitCount / totalRequests).toFixed(3) : "0.000",
    };
  }

  private cleanupExpiredMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const serverCache = new HybridCacheService();
