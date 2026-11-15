import { prisma } from '../config/database';
import { emailQueue, addEmailJobToQueue } from '../queue/email.queue';
import { logger } from '../utils/logger';
import { EmailStatus } from '../config/database';

export class ReconciliationService {
  /**
   * Restores un-enqueued or lost delayed jobs on server/worker boot
   */
  async reconcileQueueOnStartup(): Promise<{ recoveredCount: number; zombieCount: number }> {
    logger.info('Starting boot-time queue reconciliation...');

    let recoveredCount = 0;
    let zombieCount = 0;

    try {
      // 1. Recover pending / deferred scheduled emails due within the next 48 hours
      const eligibleEmails = await prisma.scheduledEmail.findMany({
        where: {
          status: {
            in: [
              EmailStatus.SCHEDULED,
              EmailStatus.QUEUED,
              EmailStatus.RATE_LIMITED_DEFERRED,
            ],
          },
        },
        take: 1000, // Bounded batch
        orderBy: { scheduledAt: 'asc' },
      });

      for (const email of eligibleEmails) {
        let jobExists = false;

        if (email.bullMqJobId) {
          try {
            const job = await emailQueue.getJob(email.bullMqJobId);
            if (job) {
              const state = await job.getState();
              if (state === 'delayed' || state === 'waiting' || state === 'active') {
                jobExists = true;
              }
            }
          } catch (err) {
            jobExists = false;
          }
        }

        if (!jobExists) {
          const delay = Math.max(0, new Date(email.scheduledAt).getTime() - Date.now());
          const newJob = await addEmailJobToQueue(
            {
              scheduledEmailId: email.id,
              tenantId: email.tenantId,
              senderId: email.senderId,
              campaignId: email.campaignId,
              scheduledAt: new Date(email.scheduledAt).toISOString(),
              minDelaySeconds: 2,
            },
            delay
          );

          await prisma.scheduledEmail.update({
            where: { id: email.id },
            data: { bullMqJobId: newJob.id },
          });

          recoveredCount++;
        }
      }

      // 2. Identify zombie PROCESSING jobs that were interrupted by a crash (> 10 mins ago)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const zombieJobs = await prisma.scheduledEmail.findMany({
        where: {
          status: EmailStatus.PROCESSING,
          lastAttemptAt: { lt: tenMinutesAgo },
        },
        take: 100,
      });

      for (const zombie of zombieJobs) {
        logger.warn(
          { id: zombie.id, attempts: zombie.deliveryAttempts },
          'Detected zombie PROCESSING email from pre-crash session. Resetting to RETRY_PENDING.'
        );

        await prisma.scheduledEmail.update({
          where: { id: zombie.id },
          data: {
            status: EmailStatus.RETRY_PENDING,
            failureReason: 'Worker crashed or restarted during SMTP transmission',
          },
        });

        // Re-enqueue
        await addEmailJobToQueue({
          scheduledEmailId: zombie.id,
          tenantId: zombie.tenantId,
          senderId: zombie.senderId,
          campaignId: zombie.campaignId,
          scheduledAt: new Date().toISOString(),
          minDelaySeconds: 2,
        });

        zombieCount++;
      }

      logger.info(
        { recoveredCount, zombieCount },
        'Boot-time queue reconciliation completed successfully.'
      );

      return { recoveredCount, zombieCount };
    } catch (error) {
      logger.error({ error }, 'Queue reconciliation encountered an error');
      return { recoveredCount, zombieCount };
    }
  }
}

export const reconciliationService = new ReconciliationService();
