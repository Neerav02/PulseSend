import { prisma } from '../config/database';
import { addEmailJobToQueue, emailQueue } from '../queue/email.queue';
import { logger } from '../utils/logger';
import { EmailStatus } from '../config/database';

export interface RecipientInput {
  email: string;
  name?: string;
  customData?: Record<string, string>;
}

export interface ScheduleBatchInput {
  tenantId: string;
  userId: string;
  senderId: string;
  title?: string;
  subject: string;
  bodyContent: string;
  recipients: RecipientInput[];
  scheduledAt: Date;
  minDelaySeconds?: number;
  hourlyLimitOverride?: number;
}

export class SchedulingService {
  /**
   * Sanitizes and validates recipient list, removing duplicates and invalid syntax
   */
  validateRecipients(recipients: RecipientInput[]): {
    valid: RecipientInput[];
    duplicates: string[];
    invalid: string[];
  } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seen = new Set<string>();
    const valid: RecipientInput[] = [];
    const duplicates: string[] = [];
    const invalid: string[] = [];

    for (const r of recipients) {
      const email = r.email.trim().toLowerCase();
      if (!emailRegex.test(email)) {
        invalid.push(r.email);
        continue;
      }
      if (seen.has(email)) {
        duplicates.push(email);
        continue;
      }
      seen.add(email);
      valid.push({
        ...r,
        email,
      });
    }

    return { valid, duplicates, invalid };
  }

  /**
   * Schedules a batch of emails using the Transactional Outbox pattern
   */
  async scheduleBatch(input: ScheduleBatchInput) {
    // 1. Verify Sender
    const sender = await prisma.senderAccount.findFirst({
      where: { id: input.senderId, tenantId: input.tenantId, isActive: true },
    });

    if (!sender) {
      throw new Error('Selected sender mailbox is invalid or disabled for this workspace.');
    }

    // 2. Validate recipients
    const { valid, duplicates, invalid } = this.validateRecipients(input.recipients);
    if (valid.length === 0) {
      throw new Error('No valid recipient emails provided in batch.');
    }

    const minDelaySeconds =
      input.minDelaySeconds !== undefined ? Math.max(0, input.minDelaySeconds) : 2;
    const baseTime = new Date(input.scheduledAt).getTime();

    logger.info(
      {
        total: input.recipients.length,
        valid: valid.length,
        duplicates: duplicates.length,
        invalid: invalid.length,
        minDelaySeconds,
      },
      'Processing email batch scheduling'
    );

    // 3. ACID Transaction: Persist Campaign and all ScheduledEmail records
    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.emailCampaign.create({
        data: {
          tenantId: input.tenantId,
          createdById: input.userId,
          title: input.title || `Campaign: ${input.subject.slice(0, 30)}`,
          status: 'SCHEDULED',
          totalRecipients: valid.length,
          scheduledAt: new Date(baseTime),
        },
      });

      // Prepare records with sequential delay offsets
      const emailRecords = valid.map((recipient, index) => {
        // Stagger each recipient by minDelaySeconds
        const offsetMs = index * minDelaySeconds * 1000;
        const individualScheduledAt = new Date(baseTime + offsetMs);

        return {
          tenantId: input.tenantId,
          campaignId: campaign.id,
          senderId: sender.id,
          recipientEmail: recipient.email,
          recipientName: recipient.name || null,
          subject: input.subject,
          bodyContent: input.bodyContent,
          status: EmailStatus.SCHEDULED,
          scheduledAt: individualScheduledAt,
        };
      });

      // Create in DB
      await tx.scheduledEmail.createMany({
        data: emailRecords,
      });

      // Query back created emails to retrieve generated UUIDs
      const createdEmails = await tx.scheduledEmail.findMany({
        where: { campaignId: campaign.id },
        select: { id: true, scheduledAt: true },
      });

      return { campaign, createdEmails };
    });

    // 4. Enqueue delayed jobs into BullMQ
    // Even if Redis is momentarily slow, DB records are already locked in PostgreSQL
    const enqueuedJobs = await Promise.allSettled(
      result.createdEmails.map(async (email: any) => {
        const job = await addEmailJobToQueue({
          scheduledEmailId: email.id,
          tenantId: input.tenantId,
          senderId: sender.id,
          campaignId: result.campaign.id,
          scheduledAt: new Date(email.scheduledAt).toISOString(),
          minDelaySeconds,
        });

        // Store BullMQ Job ID back to DB
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: { bullMqJobId: job.id },
        });

        return job.id;
      })
    );

    const successfulEnqueueCount = enqueuedJobs.filter((j) => j.status === 'fulfilled').length;

    return {
      success: true,
      campaignId: result.campaign.id,
      totalCount: valid.length,
      enqueuedCount: successfulEnqueueCount,
      duplicatesCount: duplicates.length,
      invalidCount: invalid.length,
    };
  }

  /**
   * Cancels a scheduled email
   */
  async cancelScheduledEmail(tenantId: string, emailId: string) {
    const email = await prisma.scheduledEmail.findFirst({
      where: { id: emailId, tenantId },
    });

    if (!email) {
      throw new Error('Scheduled email not found');
    }

    if (email.status === EmailStatus.SENT) {
      throw new Error('Cannot cancel an email that has already been sent');
    }

    // Remove from BullMQ
    if (email.bullMqJobId) {
      try {
        const job = await emailQueue.getJob(email.bullMqJobId);
        if (job) {
          await job.remove();
        }
      } catch (err) {
        logger.warn({ err, emailId }, 'Failed to remove job from BullMQ queue');
      }
    }

    // Update in DB
    return prisma.scheduledEmail.update({
      where: { id: emailId },
      data: { status: EmailStatus.CANCELLED },
    });
  }
}

export const schedulingService = new SchedulingService();
