import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { rateLimiterService } from '../services/rateLimiter.service';
import { EmailStatus } from '../config/database';

export class AnalyticsController {
  async getDashboardStats(req: Request, res: Response) {
    const tenantId = req.tenantId!;

    const [
      scheduledCount,
      sentCount,
      deferredCount,
      failedCount,
      campaignsCount,
      senders,
      recentActivity,
    ] = await Promise.all([
      prisma.scheduledEmail.count({
        where: {
          tenantId,
          status: { in: [EmailStatus.SCHEDULED, EmailStatus.QUEUED] },
        },
      }),
      prisma.scheduledEmail.count({
        where: { tenantId, status: EmailStatus.SENT },
      }),
      prisma.scheduledEmail.count({
        where: { tenantId, status: EmailStatus.RATE_LIMITED_DEFERRED },
      }),
      prisma.scheduledEmail.count({
        where: { tenantId, status: EmailStatus.FAILED },
      }),
      prisma.emailCampaign.count({
        where: { tenantId },
      }),
      prisma.senderAccount.findMany({
        where: { tenantId, isActive: true },
      }),
      prisma.scheduledEmail.findMany({
        where: { tenantId },
        include: { sender: { select: { email: true, displayName: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
    ]);

    // Compute real-time fuel gauge data for active senders
    const senderGauges = await Promise.all(
      senders.map(async (s) => {
        const util = await rateLimiterService.getSenderUtilization(s.id, s.hourlyLimit);
        const percent = Math.min(100, Math.round((util.current / s.hourlyLimit) * 100));
        return {
          id: s.id,
          email: s.email,
          displayName: s.displayName,
          hourlyLimit: s.hourlyLimit,
          consumed: util.current,
          remaining: util.remaining,
          percent,
        };
      })
    );

    res.json({
      success: true,
      data: {
        metrics: {
          scheduledCount,
          sentCount,
          deferredCount,
          failedCount,
          campaignsCount,
        },
        senderGauges,
        recentActivity,
        serverTimeUtc: new Date().toISOString(),
      },
    });
  }
}

export const analyticsController = new AnalyticsController();
