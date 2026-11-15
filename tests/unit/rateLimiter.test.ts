import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rateLimiterService } from '../../server/src/services/rateLimiter.service';
import { redisClient } from '../../server/src/config/redis';

describe('Distributed Rate Limiting Engine (Redis Lua)', () => {
  const testSenderId = 'test-sender-' + Date.now();
  const testLimit = 5;

  beforeAll(async () => {
    // Clear any test keys
    const window = rateLimiterService.getUTCHourWindow();
    await redisClient.del(`ratelimit:sender:${testSenderId}:${window}`);
    await redisClient.del(`slack:notified:${testSenderId}:${window}`);
  });

  afterAll(async () => {
    const window = rateLimiterService.getUTCHourWindow();
    await redisClient.del(`ratelimit:sender:${testSenderId}:${window}`);
    await redisClient.del(`slack:notified:${testSenderId}:${window}`);
  });

  it('generates consistent UTC hour window string', () => {
    const fixedDate = new Date('2026-11-15T14:30:00.000Z');
    const window = rateLimiterService.getUTCHourWindow(fixedDate);
    expect(window).toBe('2026111514');
  });

  it('calculates the exact start of the subsequent UTC hour window', () => {
    const fixedDate = new Date('2026-11-15T14:30:00.000Z');
    const nextWindow = rateLimiterService.getStartOfNextUTCHour(fixedDate);
    expect(nextWindow.toISOString()).toBe('2026-11-15T15:00:00.000Z');
  });

  it('allows sends within the configured hourly limit', async () => {
    for (let i = 1; i <= testLimit; i++) {
      const result = await rateLimiterService.consumeSenderQuota(testSenderId, testLimit);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(i);
    }
  });

  it('strictly blocks and triggers auto-deferral when hourly limit is reached', async () => {
    const blockedResult = await rateLimiterService.consumeSenderQuota(testSenderId, testLimit);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.currentCount).toBe(testLimit);
    expect(blockedResult.nextEligibleTime.getTime()).toBeGreaterThan(Date.now());
  });

  it('deduplicates Slack alerts so only one alert fires per hour window', async () => {
    const window = rateLimiterService.getUTCHourWindow();

    // First attempt: should allow alert
    const firstAlert = await rateLimiterService.shouldSendSlackAlert(testSenderId, window);
    expect(firstAlert).toBe(true);

    // Second attempt within same hour: MUST be blocked to avoid Slack notification spam
    const secondAlert = await rateLimiterService.shouldSendSlackAlert(testSenderId, window);
    expect(secondAlert).toBe(false);
  });

  it('enforces minimum delay slots across concurrent workers', async () => {
    const senderA = 'delay-sender-' + Date.now();
    const minDelaySeconds = 2;

    // Slot 1: Immediate
    const slot1 = await rateLimiterService.acquireMinimumDelaySlot(senderA, minDelaySeconds);
    expect(slot1.delayMs).toBe(0);

    // Slot 2: Must be deferred by ~2000ms
    const slot2 = await rateLimiterService.acquireMinimumDelaySlot(senderA, minDelaySeconds);
    expect(slot2.delayMs).toBeGreaterThan(1500);
    expect(slot2.delayMs).toBeLessThanOrEqual(2500);
  });
});

