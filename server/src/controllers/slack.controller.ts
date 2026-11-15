import { Request, Response } from 'express';
import { slackService } from '../services/slack.service';

export class SlackController {
  async connect(req: Request, res: Response) {
    const state = req.tenantId!;
    const url = slackService.getAuthorizationUrl(state);
    res.redirect(url);
  }

  async callback(req: Request, res: Response) {
    const { code, state, mock } = req.query;

    const tenantId = (state as string) || req.tenantId!;

    try {
      await slackService.exchangeCode(tenantId, (code as string) || 'mock_code');
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/slack?connected=true`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/slack?error=slack_failed`);
    }
  }

  async getStatus(req: Request, res: Response) {
    const status = await slackService.getStatus(req.tenantId!);
    res.json({
      success: true,
      data: status,
    });
  }

  async sendTestNotification(req: Request, res: Response) {
    const result = await slackService.sendTestNotification(req.tenantId!);
    res.json(result);
  }

  async disconnect(req: Request, res: Response) {
    await slackService.disconnect(req.tenantId!);
    res.json({
      success: true,
      message: 'Slack integration disconnected successfully',
    });
  }
}

export const slackController = new SlackController();
