import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { schedulingService } from '../../server/src/services/scheduling.service';
import { initDatabase, prisma, EmailStatus } from '../../server/src/config/database';
import { emailQueue } from '../../server/src/queue/email.queue';
import { startEmailWorker } from '../../server/src/queue/email.worker';
import { etherealService } from '../../server/src/services/ethereal.service';
import { redisClient } from '../../server/src/config/redis';

describe('End-to-End Worker Execution & Delivery Pipeline', () => {
  let tenantId: string;
  let userId: string;
  let senderId: string;
  let workerInstance: any;

  beforeAll(async () => {
    await initDatabase();
    await etherealService.init();

    const tenant = await prisma.tenant.findFirst({
      where: { name: 'Outbox Labs Demo Workspace' },
    });
    tenantId = tenant!.id;

    const user = await prisma.user.findFirst({ where: { tenantId } });
    userId = user!.id;

    const sender = await prisma.senderAccount.findFirst({ where: { tenantId } });
    senderId = sender!.id;

    // Start worker instance for test
    workerInstance = startEmailWorker();
  });

  afterAll(async () => {
    if (workerInstance) {
      await workerInstance.close();
    }
    await prisma.$disconnect();
    redisClient.disconnect();
  });

  it('schedules an email, processes via BullMQ worker, and records Ethereal delivery in PostgreSQL', async () => {
    // Schedule for 1 second in the future
    const scheduledTime = new Date(Date.now() + 1000);

    const batch = await schedulingService.scheduleBatch({
      tenantId,
      userId,
      senderId,
      title: 'Worker E2E Verification',
      subject: 'Autonomous SDE Internship Delivery Test',
      bodyContent: '<p>Verifying full end-to-end transmission to Ethereal SMTP.</p>',
      recipients: [{ email: 'reachinbox-lead@linear.app', name: 'ReachInbox Lead' }],
      scheduledAt: scheduledTime,
      minDelaySeconds: 1,
    });

    expect(batch.success).toBe(true);
    expect(batch.enqueuedCount).toBe(1);

    // Retrieve scheduled email record
    const createdEmails = await prisma.scheduledEmail.findMany({
      where: { campaignId: batch.campaignId },
    });
    expect(createdEmails).toHaveLength(1);
    const emailId = createdEmails[0].id;

    // Poll for worker completion (up to 15 seconds)
    let finalEmail: any = null;
    const maxWaitTime = 15000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      finalEmail = await prisma.scheduledEmail.findUnique({
        where: { id: emailId },
      });

      if (finalEmail && finalEmail.status === EmailStatus.SENT) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    expect(finalEmail).toBeDefined();
    expect(finalEmail.status).toBe(EmailStatus.SENT);
    expect(finalEmail.sentAt).toBeDefined();
    expect(finalEmail.etherealPreviewUrl).toBeDefined();
    expect(finalEmail.etherealPreviewUrl).toContain('ethereal.email');
  }, 20000);
});
