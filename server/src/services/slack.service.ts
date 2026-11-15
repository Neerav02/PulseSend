import { env } from '../config/env';
import { prisma } from '../config/database';
import { encrypt, decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';

export interface SlackRateLimitAlertData {
  tenantId: string;
  senderEmail: string;
  limit: number;
  currentCount: number;
  rescheduledTo: Date;
  affectedRecipient: string;
}

export class SlackService {
  /**
   * Generates the Slack OAuth v2 authorization URL
   */
  getAuthorizationUrl(state: string): string {
    if (!env.SLACK_CLIENT_ID) {
      // Return simulated auth URL for local dev
      return `${env.FRONTEND_URL}/settings/slack?mock=true&state=${state}`;
    }

    const scopes = ['chat:write', 'channels:read', 'incoming-webhook'];
    return (
      `https://slack.com/oauth/v2/authorize?client_id=${env.SLACK_CLIENT_ID}` +
      `&scope=${scopes.join(',')}` +
      `&redirect_uri=${encodeURIComponent(env.SLACK_REDIRECT_URI)}` +
      `&state=${state}`
    );
  }

  /**
   * Exchanges authorization code for an OAuth access token
   */
  async exchangeCode(tenantId: string, code: string): Promise<any> {
    if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
      logger.info('Slack credentials not configured. Provisioning simulated Slack integration.');
      return this.saveIntegration(tenantId, {
        teamId: 'T_MOCK_PULSESEND',
        teamName: 'PulseSend Dev Workspace',
        channelId: 'C_MOCK_ALERTS',
        channelName: '#outreach-alerts',
        accessToken: 'xoxb-mock-token-for-dev',
        botUserId: 'U_MOCK_BOT',
      });
    }

    try {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.SLACK_CLIENT_ID,
          client_secret: env.SLACK_CLIENT_SECRET,
          code,
          redirect_uri: env.SLACK_REDIRECT_URI,
        }),
      });

      const data = (await response.json()) as any;
      if (!data.ok) {
        throw new Error(`Slack OAuth error: ${data.error || 'Unknown error'}`);
      }

      return this.saveIntegration(tenantId, {
        teamId: data.team?.id || 'T_UNKNOWN',
        teamName: data.team?.name || 'Slack Team',
        channelId: data.incoming_webhook?.channel_id || null,
        channelName: data.incoming_webhook?.channel || '#alerts',
        accessToken: data.access_token,
        botUserId: data.bot_user_id || null,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to exchange Slack OAuth code');
      throw error;
    }
  }

  private async saveIntegration(
    tenantId: string,
    data: {
      teamId: string;
      teamName: string;
      channelId: string | null;
      channelName: string | null;
      accessToken: string;
      botUserId: string | null;
    }
  ) {
    const encryptedToken = encrypt(data.accessToken);

    return prisma.slackIntegration.upsert({
      where: { tenantId },
      update: {
        slackTeamId: data.teamId,
        slackTeamName: data.teamName,
        slackChannelId: data.channelId,
        slackChannelName: data.channelName,
        accessTokenEncrypted: encryptedToken,
        botUserId: data.botUserId,
        notifyOnRateLimit: true,
      },
      create: {
        tenantId,
        slackTeamId: data.teamId,
        slackTeamName: data.teamName,
        slackChannelId: data.channelId,
        slackChannelName: data.channelName,
        accessTokenEncrypted: encryptedToken,
        botUserId: data.botUserId,
        notifyOnRateLimit: true,
      },
    });
  }

  /**
   * Dispatches an alert to the tenant's connected Slack workspace
   */
  async sendRateLimitAlert(data: SlackRateLimitAlertData): Promise<boolean> {
    try {
      const integration = await prisma.slackIntegration.findUnique({
        where: { tenantId: data.tenantId },
      });

      if (!integration || !integration.notifyOnRateLimit) {
        return false;
      }

      const token = decrypt(integration.accessTokenEncrypted);
      const channel = integration.slackChannelId || '#general';

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚠️ PulseSend: Hourly Sending Limit Reached',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sender Mailbox:*\n\`${data.senderEmail}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Hourly Quota:*\n${data.currentCount} / ${data.limit} emails`,
            },
            {
              type: 'mrkdwn',
              text: `*Auto-Deferred To:*\n${data.rescheduledTo.toUTCString()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Next Affected Lead:*\n${data.affectedRecipient}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🛡️ *Zero-drop Guarantee:* Outbound emails are automatically held in BullMQ and will resume at the start of the next UTC hour window.',
            },
          ],
        },
      ];

      if (token.startsWith('xoxb-mock-token')) {
        logger.info(
          { sender: data.senderEmail, channel, team: integration.slackTeamName },
          '[Slack Mock Alert Dispatched] Hourly limit reached alert logged successfully'
        );
      } else {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channel,
            text: `⚠️ PulseSend Rate Limit Reached for ${data.senderEmail}`,
            blocks,
          }),
        });
      }

      await prisma.slackIntegration.update({
        where: { id: integration.id },
        data: { lastNotifiedAt: new Date() },
      });

      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to dispatch Slack rate limit alert');
      return false;
    }
  }

  async sendTestNotification(tenantId: string): Promise<{ success: boolean; message: string }> {
    const integration = await prisma.slackIntegration.findUnique({
      where: { tenantId },
    });

    if (!integration) {
      return { success: false, message: 'No Slack workspace connected for this tenant.' };
    }

    const token = decrypt(integration.accessTokenEncrypted);
    const channel = integration.slackChannelId || '#general';

    if (token.startsWith('xoxb-mock-token')) {
      return {
        success: true,
        message: `Simulated test alert sent to ${integration.slackTeamName} (${integration.slackChannelName})`,
      };
    }

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel,
        text: '🚀 *PulseSend Verification:* Your Slack integration is active and listening for rate-limit alerts.',
      }),
    });

    const data = (await res.json()) as any;
    if (!data.ok) {
      return { success: false, message: `Slack error: ${data.error}` };
    }

    return { success: true, message: `Test message sent to ${integration.slackChannelName} successfully!` };
  }

  async getStatus(tenantId: string) {
    const integration = await prisma.slackIntegration.findUnique({
      where: { tenantId },
    });

    if (!integration) {
      return { connected: false };
    }

    return {
      connected: true,
      teamName: integration.slackTeamName,
      channelName: integration.slackChannelName,
      notifyOnRateLimit: integration.notifyOnRateLimit,
      lastNotifiedAt: integration.lastNotifiedAt,
    };
  }

  async disconnect(tenantId: string) {
    await prisma.slackIntegration.deleteMany({
      where: { tenantId },
    });
    return { success: true };
  }
}

export const slackService = new SlackService();
