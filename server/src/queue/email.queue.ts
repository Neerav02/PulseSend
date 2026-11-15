import { Queue, QueueEvents } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const EMAIL_QUEUE_NAME = 'email-dispatch-queue';

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, { connection });

emailQueueEvents.on('completed', ({ jobId }) => {
  logger.debug({ jobId }, 'BullMQ job completed');
});

emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.warn({ jobId, failedReason }, 'BullMQ job failed');
});

export interface EmailJobData {
  scheduledEmailId: string;
  tenantId: string;
  senderId: string;
  campaignId?: string | null;
  scheduledAt: string; // ISO string
  minDelaySeconds: number;
}

/**
 * Enqueues a delayed email job into BullMQ with deterministic deduplication Job ID
 */
export async function addEmailJobToQueue(data: EmailJobData, delayOverrideMs?: number) {
  const targetTime = new Date(data.scheduledAt).getTime();
  const now = Date.now();
  const delay = delayOverrideMs !== undefined ? delayOverrideMs : Math.max(0, targetTime - now);
  
  // Deterministic Job ID ensures idempotency and duplicate prevention
  const jobId = `email-${data.scheduledEmailId}`;

  const job = await emailQueue.add('send-email', data, {
    delay,
    jobId,
  });

  logger.info(
    {
      jobId: job.id,
      scheduledEmailId: data.scheduledEmailId,
      delayMs: delay,
      targetTime: new Date(now + delay).toISOString(),
    },
    'Delayed email job enqueued into BullMQ'
  );

  return job;
}

