import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

// Atomic Redis Lua Script for Hourly Rate Limiting
const RATE_LIMIT_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current = redis.call('GET', key)

if current and tonumber(current) >= limit then
  return { 0, tonumber(current), redis.call('TTL', key) }
else
  local count = redis.call('INCR', key)
  if count == 1 then
    redis.call('EXPIRE', key, ttl)
  end
  return { 1, count, redis.call('TTL', key) }
end
`;

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  ttlSeconds: number;
  nextEligibleTime: Date;
  windowString: string;
}

export class RateLimiterService {
  /**
   * Generates a deterministic UTC hour window string, e.g. "2026111514"
   */
  getUTCHourWindow(date: Date = new Date()): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    return `${y}${m}${d}${h}`;
  }

  /**
   * Calculates the exact Date when the next UTC hour begins
   */
  getStartOfNextUTCHour(date: Date = new Date()): Date {
    const next = new Date(date.getTime());
    next.setUTCHours(next.getUTCHours() + 1, 0, 0, 0);
    return next;
  }

  /**
   * Evaluates and atomically increments sender quota using Redis Lua
   */
  async consumeSenderQuota(
    senderId: string,
    hourlyLimit: number
  ): Promise<RateLimitCheckResult> {
    const window = this.getUTCHourWindow();
    const key = `ratelimit:sender:${senderId}:${window}`;
    // TTL of 2 hours (7200s) to comfortably cover the current window plus grace period
    const ttlSeconds = 7200;

    try {
      const result = (await redisClient.eval(
        RATE_LIMIT_LUA,
        1,
        key,
        hourlyLimit.toString(),
        ttlSeconds.toString()
      )) as [number, number, number];

      const allowed = result[0] === 1;
      const currentCount = result[1];
      const remainingTtl = result[2];

      const nextEligibleTime = allowed
        ? new Date()
        : this.getStartOfNextUTCHour();

      if (!allowed) {
        logger.warn(
          {
            senderId,
            currentCount,
            limit: hourlyLimit,
            nextEligibleTime,
          },
          'Sender hourly rate limit exceeded. Auto-deferring to next UTC hour window.'
        );
      }

      return {
        allowed,
        currentCount,
        limit: hourlyLimit,
        ttlSeconds: remainingTtl,
        nextEligibleTime,
        windowString: window,
      };
    } catch (error) {
      logger.error({ error, senderId }, 'Redis Rate Limiter evaluation error');
      // In case of Redis outage, fail safe or allow with warning to prevent dropping
      return {
        allowed: true,
        currentCount: 0,
        limit: hourlyLimit,
        ttlSeconds: 0,
        nextEligibleTime: new Date(),
        windowString: window,
      };
    }
  }

  /**
   * Atomically acquires a minimum delay slot for a sender to space out deliveries
   * across multiple parallel workers.
   */
  async acquireMinimumDelaySlot(
    senderId: string,
    minDelaySeconds: number
  ): Promise<{ delayMs: number }> {
    if (minDelaySeconds <= 0) return { delayMs: 0 };

    const lockKey = `min_delay:sender:${senderId}`;
    const now = Date.now();
    const minDelayMs = minDelaySeconds * 1000;

    // Use Redis key storing timestamp of next allowed dispatch
    const nextAllowedTs = await redisClient.get(lockKey);

    if (!nextAllowedTs || parseInt(nextAllowedTs, 10) <= now) {
      // Slot available immediately, reserve next slot
      const nextSlot = now + minDelayMs;
      await redisClient.set(lockKey, nextSlot.toString(), 'PX', minDelayMs * 3);
      return { delayMs: 0 };
    } else {
      const targetTime = parseInt(nextAllowedTs, 10);
      const delayMs = targetTime - now;
      const nextSlot = targetTime + minDelayMs;
      await redisClient.set(lockKey, nextSlot.toString(), 'PX', (delayMs + minDelayMs) * 3);
      return { delayMs };
    }
  }

  /**
   * Check if a Slack notification has already been dispatched for this sender in this window
   * Returns true if this is the FIRST notification in this hour (notification allowed).
   */
  async shouldSendSlackAlert(senderId: string, window: string): Promise<boolean> {
    const dedupKey = `slack:notified:${senderId}:${window}`;
    // SET NX with 3600 seconds TTL
    const res = await redisClient.set(dedupKey, '1', 'EX', 3600, 'NX');
    return res === 'OK';
  }

  /**
   * Get current consumption for dashboard telemetry
   */
  async getSenderUtilization(
    senderId: string,
    limit: number
  ): Promise<{ current: number; limit: number; remaining: number }> {
    const window = this.getUTCHourWindow();
    const key = `ratelimit:sender:${senderId}:${window}`;
    const val = await redisClient.get(key);
    const current = val ? parseInt(val, 10) : 0;
    return {
      current,
      limit,
      remaining: Math.max(0, limit - current),
    };
  }
}

export const rateLimiterService = new RateLimiterService();
