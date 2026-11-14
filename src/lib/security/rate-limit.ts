/**
 * In-memory sliding-window rate limiter for production edge and API route protection.
 * Protects against credential brute-forcing, token exhaustion, and API spam.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private cache = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  /**
   * Check if a request is allowed under the rate limit.
   * @param key Unique identifier (e.g., client IP or advocate ID + action)
   * @param maxRequests Maximum allowed requests within the time window
   * @param windowSeconds Time window in seconds
   * @returns Object containing allowed status, remaining requests, and reset timestamp
   */
  public check(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): { allowed: boolean; remaining: number; resetSeconds: number } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const cutoff = now - windowMs;

    // Periodic cleanup every 5 minutes to prevent memory leaks
    if (now - this.lastCleanup > 300000) {
      this.cleanup(windowMs);
      this.lastCleanup = now;
    }

    let record = this.cache.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.cache.set(key, record);
    }

    // Filter out timestamps outside the active window
    record.timestamps = record.timestamps.filter(t => t > cutoff);

    if (record.timestamps.length >= maxRequests) {
      const oldestTimestamp = record.timestamps[0];
      const resetSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: Math.max(1, resetSeconds)
      };
    }

    // Record the current timestamp
    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: maxRequests - record.timestamps.length,
      resetSeconds: windowSeconds
    };
  }

  /**
   * Reset rate limit for a specific key (e.g. after successful login)
   */
  public reset(key: string): void {
    this.cache.delete(key);
  }

  private cleanup(windowMs: number): void {
    const cutoff = Date.now() - windowMs;
    for (const [key, record] of this.cache.entries()) {
      record.timestamps = record.timestamps.filter(t => t > cutoff);
      if (record.timestamps.length === 0) {
        this.cache.delete(key);
      }
    }
  }
}

export const rateLimiter = new InMemoryRateLimiter();

/**
 * Standard client IP resolver for Next.js Request
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
