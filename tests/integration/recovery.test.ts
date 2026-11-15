import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { reconciliationService } from '../../server/src/services/reconciliation.service';
import { initDatabase, prisma, EmailStatus } from '../../server/src/config/database';
import { emailQueue } from '../../server/src/queue/email.queue';
import { redisClient } from '../../server/src/config/redis';

describe('Crash Restart Recovery & Reconciliation Engine', () => {
  let tenantId: string;
  let senderId: string;

  beforeAll(async () => {
    await initDatabase();
    const tenant = await prisma.tenant.findFirst();
    tenantId = tenant!.id;
    const sender = await prisma.senderAccount.findFirst({ where: { tenantId } });
    senderId = sender!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    redisClient.disconnect();
  });

  it('restores orphaned pending jobs from PostgreSQL into BullMQ after an interrupted crash', async () => {
    const futureTime = new Date(Date.now() + 30 * 60 * 1000);

    // Simulate an un-queued email in DB (e.g. server crashed before enqueueing)
    await prisma.scheduledEmail.createMany({
      data: [
        {
          tenantId,
          senderId,
          recipientEmail: 'recovery-lead@linear.app',
          subject: 'Crash Recovery Verification',
          bodyContent: 'Verifying that jobs survive unexpected host reboots',
          status: EmailStatus.SCHEDULED,
          scheduledAt: futureTime,
        },
      ],
    });

    const unqueuedEmail = await prisma.scheduledEmail.findFirst({
      where: { recipientEmail: 'recovery-lead@linear.app' },
    });
    expect(unqueuedEmail!.bullMqJobId).toBeNull();

    // Run Startup Reconciliation
    const recoveryResult = await reconciliationService.reconcileQueueOnStartup();
    expect(recoveryResult.recoveredCount).toBeGreaterThanOrEqual(1);

    // Verify record now has a valid BullMQ job
    const recoveredEmail = await prisma.scheduledEmail.findUnique({
      where: { id: unqueuedEmail!.id },
    });
    expect(recoveredEmail!.bullMqJobId).toBeDefined();

    const job = await emailQueue.getJob(recoveredEmail!.bullMqJobId!);
    expect(job).toBeDefined();
    const state = await job!.getState();
    expect(state).toBe('delayed');
  });
});
