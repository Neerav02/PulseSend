import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { rateLimiterService } from '../services/rateLimiter.service';
import { etherealService } from '../services/ethereal.service';
import { encrypt, decrypt } from '../utils/encryption';

const createSenderSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  smtpHost: z.string().default('smtp.ethereal.email'),
  smtpPort: z.number().default(587),
  smtpUser: z.string().min(1),
  smtpPassword: z.string().min(1),
  hourlyLimit: z.number().min(1).default(50),
});

export class SenderController {
  async list(req: Request, res: Response) {
    const senders = await prisma.senderAccount.findMany({
      where: { tenantId: req.tenantId!, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Augment with real-time Redis utilization
    const withUtilization = await Promise.all(
      senders.map(async (sender) => {
        const util = await rateLimiterService.getSenderUtilization(sender.id, sender.hourlyLimit);
        return {
          id: sender.id,
          email: sender.email,
          displayName: sender.displayName,
          smtpHost: sender.smtpHost,
          smtpPort: sender.smtpPort,
          smtpUser: sender.smtpUser,
          hourlyLimit: sender.hourlyLimit,
          currentHourSent: util.current,
          remaining: util.remaining,
          isActive: sender.isActive,
          createdAt: sender.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: withUtilization,
    });
  }

  async create(req: Request, res: Response) {
    const validated = createSenderSchema.parse(req.body);

    const existing = await prisma.senderAccount.findFirst({
      where: { tenantId: req.tenantId!, email: validated.email },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A sender mailbox with this email already exists in this workspace.',
      });
    }

    const encryptedPass = encrypt(validated.smtpPassword);

    const sender = await prisma.senderAccount.create({
      data: {
        tenantId: req.tenantId!,
        email: validated.email,
        displayName: validated.displayName,
        smtpHost: validated.smtpHost,
        smtpPort: validated.smtpPort,
        smtpUser: validated.smtpUser,
        smtpPassword: encryptedPass,
        hourlyLimit: validated.hourlyLimit,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: sender.id,
        email: sender.email,
        displayName: sender.displayName,
        hourlyLimit: sender.hourlyLimit,
      },
    });
  }

  async testConnection(req: Request, res: Response) {
    const { id } = req.params;

    const sender = await prisma.senderAccount.findFirst({
      where: { id, tenantId: req.tenantId! },
    });

    if (!sender) {
      return res.status(404).json({
        success: false,
        error: 'Sender not found',
      });
    }

    try {
      const result = await etherealService.sendEmail(
        {
          from: `"${sender.displayName}" <${sender.email}>`,
          to: 'test-ping@ethereal.email',
          subject: 'PulseSend: SMTP Verification Ping',
          text: 'This is an automated SMTP connection verification test for PulseSend.',
        },
        {
          smtpHost: sender.smtpHost,
          smtpPort: sender.smtpPort,
          smtpUser: sender.smtpUser,
          smtpPass: decrypt(sender.smtpPassword),
        }
      );

      res.json({
        success: true,
        message: 'SMTP handshake and test submission succeeded!',
        previewUrl: result.previewUrl,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: `SMTP Connection Failed: ${error.message}`,
      });
    }
  }
}

export const senderController = new SenderController();
