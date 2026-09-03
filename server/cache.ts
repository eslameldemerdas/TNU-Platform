import { Redis } from "@upstash/redis";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export class HybridCacheService {
  private redis: Redis | null = null;
  private isRedisConnected = false;
  private initError: string | null = null;
  private memoryCache = new Map<string, CacheEntry<any>>();
  private hitCount = 0;
  private missCount = 0;

  constructor() {
    this.initRedis();
    setInterval(() => this.cleanupExpiredMemory(), 5 * 60 * 1000).unref();
  }

  private async initRedis() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.log(
        "[Cache] UPSTASH_REDIS_REST_URL/TOKEN not configured. Operating in high-performance in-memory cache mode.",
      );
      return;
    }

    try {
      this.redis = new Redis({ url, token });
      await this.redis.ping();
      this.isRedisConnected = true;
      console.log("[Cache] Successfully connected to Upstash Redis distributed cache via REST API.");
    } catch (err: any) {
      this.isRedisConnected = false;
      this.redis = null;
      this.initError = err?.message || "Unknown error";
      console.warn(
        `[Cache] Upstash Redis initialization failed: ${this.initError}. Running on local in-memory cache.`,
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis && this.isRedisConnected) {
      try {
        const raw = await this.redis.get(key);
        if (raw !== null && raw !== undefined) {
          this.hitCount++;
          return raw as T;
        }
      } catch (err: any) {
        console.warn(`[Cache] Redis GET error for key "${key}":`, err.message);
        this.isRedisConnected = false;
      }
    }

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

  async set<T>(key: string, value: T, ttlSeconds = 3600, tags: string[] = []): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.redis && this.isRedisConnected) {
      try {
        const pipeline = this.redis.pipeline();
        pipeline.setex(key, ttlSeconds, serialized);
        for (const tag of tags) {
          const tagSetKey = `tag:${tag}`;
          pipeline.sadd(tagSetKey, key);
          pipeline.expire(tagSetKey, ttlSeconds + 300);
        }
        await pipeline.exec();
      } catch (err: any) {
        console.warn(`[Cache] Redis SET error for key "${key}":`, err.message);
        this.isRedisConnected = false;
      }
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  async delete(key: string): Promise<boolean> {
    let deleted = false;

    if (this.redis && this.isRedisConnected) {
      try {
        const res = await this.redis.del(key);
        if (typeof res === "number" && res > 0) deleted = true;
      } catch (err: any) {
        console.warn(`[Cache] Redis DEL error:`, err.message);
      }
    }

    if (this.memoryCache.delete(key)) deleted = true;
    return deleted;
  }

  async invalidatePattern(prefix: string): Promise<number> {
    let count = 0;

    if (this.redis && this.isRedisConnected) {
      try {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys && keys.length > 0) {
          const pipeline = this.redis.pipeline();
          keys.forEach((k: string) => pipeline.del(k));
          await pipeline.exec();
          count += keys.length;
        }
      } catch (err: any) {
        console.warn(`[Cache] Redis invalidatePattern error:`, err.message);
      }
    }

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    return count;
  }

  async invalidateTag(tag: string): Promise<number> {
    let count = 0;

    if (this.redis && this.isRedisConnected) {
      try {
        const tagSetKey = `tag:${tag}`;
        const keys = await this.redis.smembers(tagSetKey);
        if (keys && keys.length > 0) {
          const pipeline = this.redis.pipeline();
          keys.forEach((k: string) => pipeline.del(k));
          pipeline.del(tagSetKey);
          await pipeline.exec();
          count += keys.length;
        }
      } catch (err: any) {
        console.warn(`[Cache] Redis invalidateTag error:`, err.message);
      }
    }

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.includes(tag)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    return count;
  }

  async clear(): Promise<void> {
    if (this.redis && this.isRedisConnected) {
      try {
        await this.redis.flushdb();
      } catch (err: any) {
        console.warn(`[Cache] Redis FLUSHDB error:`, err.message);
      }
    }
    this.memoryCache.clear();
  }

  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    return {
      provider: this.isRedisConnected
        ? "Upstash Redis Distributed Cache (REST API)"
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
