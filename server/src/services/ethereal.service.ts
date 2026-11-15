import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface SendMailOptions {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  messageId?: string;
}

interface SendMailResult {
  messageId: string;
  previewUrl: string | null;
  accepted: string[];
  rejected: string[];
}

class EtherealService {
  private defaultTransporter: Transporter | null = null;
  private testAccount: nodemailer.TestAccount | null = null;

  async init(): Promise<void> {
    try {
      if (env.ETHEREAL_USER && env.ETHEREAL_PASS) {
        this.defaultTransporter = nodemailer.createTransport({
          host: env.ETHEREAL_HOST,
          port: env.ETHEREAL_PORT,
          secure: false,
          auth: {
            user: env.ETHEREAL_USER,
            pass: env.ETHEREAL_PASS,
          },
        });
        logger.info(`Using configured Ethereal SMTP user: ${env.ETHEREAL_USER}`);
      } else {
        // Auto-provision test account
        this.testAccount = await nodemailer.createTestAccount();
        this.defaultTransporter = nodemailer.createTransport({
          host: this.testAccount.smtp.host,
          port: this.testAccount.smtp.port,
          secure: this.testAccount.smtp.secure,
          auth: {
            user: this.testAccount.user,
            pass: this.testAccount.pass,
          },
        });
        logger.info(
          `Auto-provisioned Ethereal test account: ${this.testAccount.user} (Web: https://ethereal.email/messages)`
        );
      }
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Ethereal SMTP service');
    }
  }

  async getTransporter(customConfig?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
  }): Promise<Transporter> {
    if (
      customConfig &&
      customConfig.smtpUser &&
      customConfig.smtpPass &&
      !customConfig.smtpUser.startsWith('ethereal_user_')
    ) {
      return nodemailer.createTransport({
        host: customConfig.smtpHost || env.ETHEREAL_HOST,
        port: customConfig.smtpPort || env.ETHEREAL_PORT,
        secure: false,
        auth: {
          user: customConfig.smtpUser,
          pass: customConfig.smtpPass,
        },
      });
    }

    if (!this.defaultTransporter) {
      await this.init();
    }

    if (!this.defaultTransporter) {
      // Fallback in-memory stream transport for offline/test environments
      this.defaultTransporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }

    return this.defaultTransporter;
  }

  async sendEmail(
    options: SendMailOptions,
    customConfig?: {
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPass: string;
    }
  ): Promise<SendMailResult> {
    let transporter = await this.getTransporter(customConfig);

    const mailOptions: nodemailer.SendMailOptions = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html?.replace(/<[^>]*>?/gm, ''),
      html: options.html || options.text,
      messageId: options.messageId,
      headers: {
        'X-PulseSend-Orchestration': 'true',
        'X-PulseSend-Timestamp': new Date().toISOString(),
      },
    };

    let info: any;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (sendErr: any) {
      // If authentication failed on customConfig, retry with default provisioned Ethereal account
      if (this.defaultTransporter && transporter !== this.defaultTransporter) {
        logger.warn(
          { error: sendErr.message },
          'Custom SMTP authentication failed. Falling back to default Ethereal test inbox.'
        );
        info = await this.defaultTransporter.sendMail(mailOptions);
      } else {
        throw sendErr;
      }
    }

    const previewUrl =
      nodemailer.getTestMessageUrl(info) ||
      `https://ethereal.email/message/${info.messageId?.replace(/[<>]/g, '') || 'preview'}`;

    logger.info(
      {
        messageId: info.messageId,
        to: options.to,
        previewUrl,
      },
      'Email successfully accepted by Ethereal SMTP'
    );

    return {
      messageId: info.messageId || `msg-${Date.now()}`,
      previewUrl,
      accepted: (info.accepted as string[]) || [options.to],
      rejected: (info.rejected as string[]) || [],
    };
  }

  getAccountInfo() {
    return {
      user: env.ETHEREAL_USER || this.testAccount?.user || 'Auto-generated',
      host: env.ETHEREAL_HOST || 'smtp.ethereal.email',
      port: env.ETHEREAL_PORT || 587,
    };
  }
}

export const etherealService = new EtherealService();
