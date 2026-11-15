import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export function createRedisInstance(): Redis {
  if (env.REDIS_URL) {
    const isTls = env.REDIS_URL.startsWith('rediss://');
    return new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    });
  }

  const redisOptions: RedisOptions = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
  };

  return new Redis(redisOptions);
}

export const redisClient = createRedisInstance();

redisClient.on('connect', () => {
  logger.info(`Connected to Redis at ${env.REDIS_URL ? 'remote URL' : `${env.REDIS_HOST}:${env.REDIS_PORT}`}`);
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis Connection Error');
});

export const getRedisConnection = () => createRedisInstance();

