import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { schedulingService } from '../../server/src/services/scheduling.service';
import { initDatabase, prisma } from '../../server/src/config/database';
import { emailQueue } from '../../server/src/queue/email.queue';
import { redisClient } from '../../server/src/config/redis';

describe('Transactional Outbox Scheduling & BullMQ Engine', () => {
  let tenantId: string;
  let userId: string;
  let senderId: string;

  beforeAll(async () => {
    await initDatabase();

    // Setup Test Tenant & User
    let tenant = await prisma.tenant.findFirst({
      where: { name: 'Outbox Labs Demo Workspace' },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({ data: { name: 'Outbox Labs Demo Workspace' } });
    }
    tenantId = tenant.id;

    let user = await prisma.user.findFirst({ where: { tenantId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'integration-test@outboxlabs.com',
          name: 'Integration Test User',
          tenantId,
        },
      });
    }
    userId = user.id;

    let sender = await prisma.senderAccount.findFirst({ where: { tenantId } });
    senderId = sender!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    redisClient.disconnect();
  });

  it('atomically schedules a batch into PostgreSQL and enqueues delayed jobs into BullMQ', async () => {
    const scheduledTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in future

    const result = await schedulingService.scheduleBatch({
      tenantId,
      userId,
      senderId,
      title: 'Automated Test Campaign',
      subject: 'Outreach Test Verification',
      bodyContent: '<p>Hi {{name}}, verifying automated delivery.</p>',
      recipients: [
        { email: 'lead1@datadog.com', name: 'Lead One' },
        { email: 'lead2@stripe.com', name: 'Lead Two' },
      ],
      scheduledAt: scheduledTime,
      minDelaySeconds: 2,
    });

    expect(result.success).toBe(true);
    expect(result.totalCount).toBe(2);
    expect(result.enqueuedCount).toBe(2);

    // Verify records exist in PostgreSQL
    const dbEmails = await prisma.scheduledEmail.findMany({
      where: { campaignId: result.campaignId },
      orderBy: { scheduledAt: 'asc' },
    });

    expect(dbEmails).toHaveLength(2);
    expect(dbEmails[0].recipientEmail).toBe('lead1@datadog.com');
    expect(dbEmails[1].recipientEmail).toBe('lead2@stripe.com');

    // Verify 2-second staggering offset between recipients
    const timeDelta =
      new Date(dbEmails[1].scheduledAt).getTime() - new Date(dbEmails[0].scheduledAt).getTime();
    expect(timeDelta).toBe(2000);

    // Verify BullMQ delayed jobs
    const job1 = await emailQueue.getJob(dbEmails[0].bullMqJobId!);
    expect(job1).toBeDefined();
    const state1 = await job1!.getState();
    expect(state1).toBe('delayed');
  });

  it('cancels a scheduled job and removes it from BullMQ queue', async () => {
    const scheduledTime = new Date(Date.now() + 60 * 60 * 1000);

    const batch = await schedulingService.scheduleBatch({
      tenantId,
      userId,
      senderId,
      subject: 'Cancellation Test',
      bodyContent: 'Will be cancelled',
      recipients: [{ email: 'cancel-me@figma.com' }],
      scheduledAt: scheduledTime,
    });

    const email = (await prisma.scheduledEmail.findMany({
      where: { campaignId: batch.campaignId },
    }))[0];

    // Cancel email
    const cancelled = await schedulingService.cancelScheduledEmail(tenantId, email.id);
    expect(cancelled.status).toBe('CANCELLED');

    // Verify BullMQ job is removed
    const job = await emailQueue.getJob(email.bullMqJobId!);
    expect(job).toBeUndefined();
  });
});

