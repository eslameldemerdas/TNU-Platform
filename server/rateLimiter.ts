import { Redis } from "@upstash/redis";

// In-memory fallback buckets (used only when Redis is unavailable)
interface MemoryBucket {
  count: number;
  resetAt: number;
}
const MEMORY_BUCKETS = new Map<string, MemoryBucket>();

let redis: Redis | null = null;
let isRedisConnected = false;

async function getRedisClient(): Promise<Redis | null> {
  if (redis && isRedisConnected) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    redis = new Redis({ url, token });
    await redis.ping();
    isRedisConnected = true;
    return redis;
  } catch (err: any) {
    console.warn(`[RateLimiter] Upstash Redis init failed: ${err?.message}. Using in-memory fallback.`);
    return null;
  }
}

/**
 * Check if a request is within rate limits.
 * Uses Redis atomic INCR+TTL when available; falls back to in-memory Map.
 *
 * Thresholds (unchanged from prior in-memory implementation):
 *   - Login:    5 attempts per 15 minutes
 *   - Signup:   5 attempts per 15 minutes
 *   - File upload / AI: 5–20 attempts per 1 minute (configured by caller)
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<{ allowed: boolean; remainingSeconds: number }> {
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const redisClient = await getRedisClient();

  if (redisClient && isRedisConnected) {
    try {
      // Atomically set counter to 1 only if key does not yet exist
      const wasSet = await redisClient.set(key, "1", { ex: ttlSeconds, nx: true });
      if (wasSet === "OK") {
        return { allowed: true, remainingSeconds: 0 };
      }

      // Key exists — increment and check
      const count = await redisClient.incr(key);
      if (count > maxAttempts) {
        const ttl = await redisClient.ttl(key);
        return { allowed: false, remainingSeconds: Math.max(ttl, 0) };
      }
      return { allowed: true, remainingSeconds: 0 };
    } catch (err: any) {
      console.warn(`[RateLimiter] Redis error for key "${key}":`, err.message);
      isRedisConnected = false;
    }
  }

  // In-memory fallback
  const now = Date.now();
  let bucket = MEMORY_BUCKETS.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    MEMORY_BUCKETS.set(key, bucket);
  }
  if (bucket.count >= maxAttempts) {
    return { allowed: false, remainingSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, remainingSeconds: 0 };
}

/**
 * Reset the rate-limit counter for a key (called on successful auth).
 */
export async function resetRateLimit(key: string): Promise<void> {
  const redisClient = await getRedisClient();
  if (redisClient && isRedisConnected) {
    try {
      await redisClient.del(key);
    } catch (err: any) {
      console.warn(`[RateLimiter] Redis DEL error for key "${key}":`, err.message);
    }
  }
  MEMORY_BUCKETS.delete(key);
}
