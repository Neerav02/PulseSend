import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { schedulingService } from '../services/scheduling.service';
import { elasticsearchService } from '../services/elasticsearch.service';
import { EmailStatus } from '../config/database';

const scheduleSchema = z.object({
  senderId: z.string().uuid(),
  title: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  bodyContent: z.string().min(1, 'Email body is required'),
  recipients: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        customData: z.record(z.string()).optional(),
      })
    )
    .min(1, 'At least one recipient is required'),
  scheduledAt: z.string().datetime().or(z.date()),
  minDelaySeconds: z.number().min(0).default(2),
  hourlyLimitOverride: z.number().positive().optional(),
});

export class EmailController {
  async schedule(req: Request, res: Response) {
    const validated = scheduleSchema.parse(req.body);

    const result = await schedulingService.scheduleBatch({
      tenantId: req.tenantId!,
      userId: req.user!.id,
      senderId: validated.senderId,
      title: validated.title,
      subject: validated.subject,
      bodyContent: validated.bodyContent,
      recipients: validated.recipients as any,
      scheduledAt: new Date(validated.scheduledAt),
      minDelaySeconds: validated.minDelaySeconds,
      hourlyLimitOverride: validated.hourlyLimitOverride,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  }

  async getScheduled(req: Request, res: Response) {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as EmailStatus | undefined;
    const senderId = req.query.senderId as string | undefined;

    const where: any = {
      tenantId: req.tenantId!,
      status: status
        ? status
        : {
            in: [
              EmailStatus.SCHEDULED,
              EmailStatus.QUEUED,
              EmailStatus.RATE_LIMITED_DEFERRED,
              EmailStatus.PROCESSING,
              EmailStatus.RETRY_PENDING,
            ],
          },
    };

    if (senderId) {
      where.senderId = senderId;
    }

    const [total, data] = await Promise.all([
      prisma.scheduledEmail.count({ where }),
      prisma.scheduledEmail.findMany({
        where,
        include: {
          sender: { select: { email: true, displayName: true } },
          campaign: { select: { title: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async getSent(req: Request, res: Response) {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const senderId = req.query.senderId as string | undefined;

    const where: any = {
      tenantId: req.tenantId!,
      status: EmailStatus.SENT,
    };

    if (senderId) {
      where.senderId = senderId;
    }

    const [total, data] = await Promise.all([
      prisma.scheduledEmail.count({ where }),
      prisma.scheduledEmail.findMany({
        where,
        include: {
          sender: { select: { email: true, displayName: true } },
          attempts: { orderBy: { attemptedAt: 'desc' }, take: 1 },
        },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async getDetails(req: Request, res: Response) {
    const { id } = req.params;

    const email = await prisma.scheduledEmail.findFirst({
      where: { id, tenantId: req.tenantId! },
      include: {
        sender: true,
        campaign: true,
        attempts: { orderBy: { attemptedAt: 'asc' } },
        queueEvents: { orderBy: { recordedAt: 'asc' } },
      },
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email record not found',
      });
    }

    res.json({
      success: true,
      data: email,
    });
  }

  async cancel(req: Request, res: Response) {
    const { id } = req.params;

    await schedulingService.cancelScheduledEmail(req.tenantId!, id);

    res.json({
      success: true,
      message: 'Scheduled email cancelled successfully',
    });
  }

  async search(req: Request, res: Response) {
    const query = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await elasticsearchService.searchEmails(req.tenantId!, query, page, limit);

    res.json({
      success: true,
      ...result,
    });
  }
}

export const emailController = new EmailController();
