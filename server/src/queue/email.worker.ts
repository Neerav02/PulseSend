import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { rateLimiterService } from '../services/rateLimiter.service';
import { etherealService } from '../services/ethereal.service';
import { elasticsearchService } from '../services/elasticsearch.service';
import { slackService } from '../services/slack.service';
import { addEmailJobToQueue, EMAIL_QUEUE_NAME, EmailJobData } from './email.queue';
import { decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';
import { EmailStatus } from '../config/database';
import { getRedisConnection } from '../config/redis';

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { scheduledEmailId, tenantId, senderId, minDelaySeconds } = job.data;
      const startTime = Date.now();

      logger.info(
        { jobId: job.id, emailId: scheduledEmailId },
        'Worker starting execution of email job'
      );

      // 1. Optimistic Locking: Transition from SCHEDULED/QUEUED -> PROCESSING
      const email = await prisma.scheduledEmail.findUnique({
        where: { id: scheduledEmailId },
        include: { sender: true },
      });

      if (!email) {
        logger.warn({ emailId: scheduledEmailId }, 'Scheduled email not found in database. Skipping.');
        return 'SKIPPED_NOT_FOUND';
      }

      if (email.status === EmailStatus.SENT || email.status === EmailStatus.CANCELLED) {
        logger.info(
          { emailId: scheduledEmailId, status: email.status },
          'Email already completed or cancelled. Skipping duplicate execution.'
        );
        return 'SKIPPED_ALREADY_FINISHED';
      }

      // Mark as PROCESSING in database
      await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: {
          status: EmailStatus.PROCESSING,
          deliveryAttempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      // 2. Distributed Rate Limiting Check (Atomic Redis Lua)
      const sender = email.sender;
      const rateLimitResult = await rateLimiterService.consumeSenderQuota(
        sender.id,
        sender.hourlyLimit
      );

      if (!rateLimitResult.allowed) {
        // Rate limit hit: defer to start of next UTC hour
        const nextTime = rateLimitResult.nextEligibleTime;
        const delayMs = Math.max(0, nextTime.getTime() - Date.now());

        logger.warn(
          {
            emailId: email.id,
            sender: sender.email,
            limit: sender.hourlyLimit,
            nextWindow: nextTime.toISOString(),
          },
          'Sender hourly quota exhausted. Deferring email job to next UTC hour window.'
        );

        // Update DB status
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: EmailStatus.RATE_LIMITED_DEFERRED,
            scheduledAt: nextTime,
          },
        });

        // Deduplicated Slack Alert
        const shouldAlert = await rateLimiterService.shouldSendSlackAlert(
          sender.id,
          rateLimitResult.windowString
        );

        if (shouldAlert) {
          await slackService.sendRateLimitAlert({
            tenantId,
            senderEmail: sender.email,
            limit: sender.hourlyLimit,
            currentCount: rateLimitResult.currentCount,
            rescheduledTo: nextTime,
            affectedRecipient: email.recipientEmail,
          });
        }

        // Reschedule in BullMQ for next window
        await addEmailJobToQueue(job.data, delayMs);

        return 'DEFERRED_RATE_LIMIT';
      }

      // 3. Minimum Inter-Email Delay Throttle
      if (minDelaySeconds > 0) {
        const { delayMs } = await rateLimiterService.acquireMinimumDelaySlot(
          sender.id,
          minDelaySeconds
        );
        if (delayMs > 0) {
          logger.debug({ delayMs, sender: sender.email }, 'Enforcing minimum inter-email delay');
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      // 4. SMTP Transmission via Ethereal Email
      try {
        const domain = sender.email.split('@')[1] || 'pulsesend.io';
        const customMessageId = `<pulsesend-${email.id}@${domain}>`;

        const smtpResult = await etherealService.sendEmail(
          {
            from: `"${sender.displayName}" <${sender.email}>`,
            to: email.recipientEmail,
            subject: email.subject,
            html: email.bodyContent,
            messageId: customMessageId,
          },
          {
            smtpHost: sender.smtpHost,
            smtpPort: sender.smtpPort,
            smtpUser: sender.smtpUser,
            smtpPass: decrypt(sender.smtpPassword),
          }
        );

        const durationMs = Date.now() - startTime;

        // 5. Atomic Update to SENT
        await prisma.$transaction([
          prisma.scheduledEmail.update({
            where: { id: email.id },
            data: {
              status: EmailStatus.SENT,
              sentAt: new Date(),
              etherealPreviewUrl: smtpResult.previewUrl,
              failureReason: null,
            },
          }),
          prisma.emailDeliveryAttempt.create({
            data: {
              scheduledEmailId: email.id,
              attemptNumber: email.deliveryAttempts + 1,
              status: 'SUCCESS',
              smtpResponseCode: '250 OK',
              durationMs,
            },
          }),
        ]);

        // 6. Index in Elasticsearch (Asynchronous, doesn't block DB record)
        elasticsearchService.indexEmail({
          id: email.id,
          tenantId: email.tenantId,
          campaignId: email.campaignId,
          senderId: sender.id,
          senderEmail: sender.email,
          recipientEmail: email.recipientEmail,
          recipientName: email.recipientName,
          subject: email.subject,
          bodyContent: email.bodyContent,
          status: 'SENT',
          sentAt: new Date(),
          scheduledAt: email.scheduledAt,
          etherealPreviewUrl: smtpResult.previewUrl,
        });

        logger.info(
          {
            emailId: email.id,
            to: email.recipientEmail,
            previewUrl: smtpResult.previewUrl,
            durationMs,
          },
          'Email dispatched successfully'
        );

        return 'SENT';
      } catch (deliveryError: any) {
        const durationMs = Date.now() - startTime;
        logger.error({ error: deliveryError, emailId: email.id }, 'SMTP transmission failed');

        const isMaxAttempts = email.deliveryAttempts >= 3;

        await prisma.$transaction([
          prisma.scheduledEmail.update({
            where: { id: email.id },
            data: {
              status: isMaxAttempts ? EmailStatus.FAILED : EmailStatus.RETRY_PENDING,
              failureReason: deliveryError.message || 'SMTP Socket Error',
            },
          }),
          prisma.emailDeliveryAttempt.create({
            data: {
              scheduledEmailId: email.id,
              attemptNumber: email.deliveryAttempts + 1,
              status: 'FAILED',
              errorMessage: deliveryError.message || 'Unknown error',
              durationMs,
            },
          }),
        ]);

        throw deliveryError; // Triggers BullMQ exponential backoff retry
      }
    },
    {
      connection: getRedisConnection() as any,
      concurrency: env.WORKER_CONCURRENCY,
    }
  );

  worker.on('active', (job) => {
    logger.debug({ jobId: job.id }, 'Worker picked up job');
  });

  worker.on('failed', (job, err) => {
    logger.warn({ jobId: job?.id, error: err.message }, 'Job failed in worker');
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'BullMQ Worker error');
  });

  logger.info(
    `Email Worker started with concurrency: ${env.WORKER_CONCURRENCY} on queue '${EMAIL_QUEUE_NAME}'`
  );

  return worker;
}
