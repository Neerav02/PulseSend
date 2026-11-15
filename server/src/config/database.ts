import { Pool, PoolClient } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

/**
 * Initializes database tables, types, and indexes
 */
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info('Initializing PostgreSQL tables and schema indexes...');

    await client.query(`
      -- Extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- 1. Tenants Table
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Users Table
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        google_id VARCHAR(255) UNIQUE,
        role VARCHAR(32) DEFAULT 'MEMBER',
        tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Sender Accounts Table
      CREATE TABLE IF NOT EXISTS sender_accounts (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        smtp_host VARCHAR(255) DEFAULT 'smtp.ethereal.email',
        smtp_port INTEGER DEFAULT 587,
        smtp_user VARCHAR(255) NOT NULL,
        smtp_password TEXT NOT NULL,
        hourly_limit INTEGER DEFAULT 50,
        current_hour_sent INTEGER DEFAULT 0,
        current_hour_window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_tenant_sender_email UNIQUE (tenant_id, email)
      );

      -- 4. Email Campaigns Table
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
        created_by_id VARCHAR(64) REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        status VARCHAR(32) DEFAULT 'SCHEDULED',
        total_recipients INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. Scheduled Emails Table
      CREATE TABLE IF NOT EXISTS scheduled_emails (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
        campaign_id VARCHAR(64) REFERENCES email_campaigns(id) ON DELETE SET NULL,
        sender_id VARCHAR(64) REFERENCES sender_accounts(id) ON DELETE CASCADE,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255),
        subject TEXT NOT NULL,
        body_content TEXT NOT NULL,
        status VARCHAR(32) DEFAULT 'SCHEDULED',
        bull_mq_job_id VARCHAR(255) UNIQUE,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        delivery_attempts INTEGER DEFAULT 0,
        last_attempt_at TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        ethereal_preview_url TEXT,
        failure_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. Email Delivery Attempts Table
      CREATE TABLE IF NOT EXISTS email_delivery_attempts (
        id VARCHAR(64) PRIMARY KEY,
        scheduled_email_id VARCHAR(64) REFERENCES scheduled_emails(id) ON DELETE CASCADE,
        attempt_number INTEGER NOT NULL,
        status VARCHAR(32) NOT NULL,
        smtp_response_code VARCHAR(32),
        error_message TEXT,
        duration_ms INTEGER,
        attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. Slack Integrations Table
      CREATE TABLE IF NOT EXISTS slack_integrations (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(64) UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
        slack_team_id VARCHAR(64) NOT NULL,
        slack_team_name VARCHAR(255) NOT NULL,
        slack_channel_id VARCHAR(64),
        slack_channel_name VARCHAR(255),
        access_token_encrypted TEXT NOT NULL,
        bot_user_id VARCHAR(64),
        notify_on_rate_limit BOOLEAN DEFAULT TRUE,
        notify_on_failure BOOLEAN DEFAULT TRUE,
        last_notified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 8. Audit Logs Table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(64) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Performance Indexes
      CREATE INDEX IF NOT EXISTS idx_sched_status_time ON scheduled_emails(status, scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_sched_tenant_created ON scheduled_emails(tenant_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sched_sender_status ON scheduled_emails(sender_id, status);
      CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON email_campaigns(tenant_id);
    `);

    logger.info('PostgreSQL schema initialized successfully.');
  } finally {
    client.release();
  }
}

export enum EmailStatus {
  CREATED = 'CREATED',
  SCHEDULED = 'SCHEDULED',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRY_PENDING = 'RETRY_PENDING',
  RATE_LIMITED_DEFERRED = 'RATE_LIMITED_DEFERRED',
  CANCELLED = 'CANCELLED',
  DELIVERY_UNKNOWN = 'DELIVERY_UNKNOWN',
}

/**
 * Fluent Typed Database Data Access Layer
 */
export const prisma = {
  $queryRaw: async (query: any, ...values: any[]) => {
    const sql = Array.isArray(query) ? query.join(' ') : String(query);
    return pool.query(sql, values);
  },

  $disconnect: async () => {
    await pool.end();
  },

  $transaction: async <T>(arg: ((client: any) => Promise<T>) | Promise<any>[]): Promise<any> => {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await arg(prisma);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  tenant: {
    findFirst: async (args?: any) => {
      let query = 'SELECT * FROM tenants';
      const values: any[] = [];
      if (args?.where?.name) {
        query += ' WHERE name = $1';
        values.push(args.where.name);
      }
      query += ' LIMIT 1';
      const res = await pool.query(query, values);
      return res.rows[0] || null;
    },
    create: async (args: any) => {
      const id = uuidv4();
      const res = await pool.query(
        'INSERT INTO tenants (id, name) VALUES ($1, $2) RETURNING *',
        [id, args.data.name]
      );
      return res.rows[0];
    },
  },

  user: {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      let query = 'SELECT * FROM users WHERE ';
      const values: any[] = [];
      if (args.where.id) {
        query += 'id = $1';
        values.push(args.where.id);
      } else if (args.where.email) {
        query += 'email = $1';
        values.push(args.where.email);
      }
      const res = await pool.query(query, values);
      if (!res.rows[0]) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        email: r.email,
        name: r.name,
        avatarUrl: r.avatar_url,
        googleId: r.google_id,
        role: r.role,
        tenantId: r.tenant_id,
        createdAt: r.created_at,
      };
    },
    findFirst: async (args: any) => {
      let query = 'SELECT * FROM users';
      const values: any[] = [];
      if (args?.where?.tenantId) {
        query += ' WHERE tenant_id = $1';
        values.push(args.where.tenantId);
      }
      query += ' LIMIT 1';
      const res = await pool.query(query, values);
      if (!res.rows[0]) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        email: r.email,
        name: r.name,
        avatarUrl: r.avatar_url,
        googleId: r.google_id,
        role: r.role,
        tenantId: r.tenant_id,
        createdAt: r.created_at,
      };
    },
    create: async (args: any) => {
      const id = uuidv4();
      const d = args.data;
      const res = await pool.query(
        `INSERT INTO users (id, email, name, avatar_url, google_id, role, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [id, d.email, d.name, d.avatarUrl, d.googleId, d.role || 'MEMBER', d.tenantId]
      );
      const r = res.rows[0];
      return {
        id: r.id,
        email: r.email,
        name: r.name,
        avatarUrl: r.avatar_url,
        googleId: r.google_id,
        role: r.role,
        tenantId: r.tenant_id,
        createdAt: r.created_at,
      };
    },
  },

  senderAccount: {
    findMany: async (args: any) => {
      let query = 'SELECT * FROM sender_accounts WHERE tenant_id = $1';
      const values: any[] = [args.where.tenantId];
      if (args.where.isActive !== undefined) {
        query += ' AND is_active = $2';
        values.push(args.where.isActive);
      }
      query += ' ORDER BY created_at DESC';
      const res = await pool.query(query, values);
      return res.rows.map((r) => ({
        id: r.id,
        tenantId: r.tenant_id,
        email: r.email,
        displayName: r.display_name,
        smtpHost: r.smtp_host,
        smtpPort: r.smtp_port,
        smtpUser: r.smtp_user,
        smtpPassword: r.smtp_password,
        hourlyLimit: r.hourly_limit,
        currentHourSent: r.current_hour_sent,
        isActive: r.is_active,
        createdAt: r.created_at,
      }));
    },
    findFirst: async (args: any) => {
      let query = 'SELECT * FROM sender_accounts WHERE tenant_id = $1';
      const values: any[] = [args.where.tenantId];
      let paramIdx = 2;
      if (args.where.id) {
        query += ` AND id = $${paramIdx++}`;
        values.push(args.where.id);
      }
      if (args.where.email) {
        query += ` AND email = $${paramIdx++}`;
        values.push(args.where.email);
      }
      if (args.where.isActive !== undefined) {
        query += ` AND is_active = $${paramIdx++}`;
        values.push(args.where.isActive);
      }
      query += ' LIMIT 1';
      const res = await pool.query(query, values);
      if (!res.rows[0]) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        email: r.email,
        displayName: r.display_name,
        smtpHost: r.smtp_host,
        smtpPort: r.smtp_port,
        smtpUser: r.smtp_user,
        smtpPassword: r.smtp_password,
        hourlyLimit: r.hourly_limit,
        currentHourSent: r.current_hour_sent,
        isActive: r.is_active,
        createdAt: r.created_at,
      };
    },
    create: async (args: any) => {
      const id = uuidv4();
      const d = args.data;
      const res = await pool.query(
        `INSERT INTO sender_accounts 
         (id, tenant_id, email, display_name, smtp_host, smtp_port, smtp_user, smtp_password, hourly_limit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          id,
          d.tenantId,
          d.email,
          d.displayName,
          d.smtpHost || 'smtp.ethereal.email',
          d.smtpPort || 587,
          d.smtpUser,
          d.smtpPassword,
          d.hourlyLimit || 50,
        ]
      );
      const r = res.rows[0];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        email: r.email,
        displayName: r.display_name,
        hourlyLimit: r.hourly_limit,
      };
    },
  },

  emailCampaign: {
    count: async (args: any) => {
      const res = await pool.query(
        'SELECT COUNT(*) FROM email_campaigns WHERE tenant_id = $1',
        [args.where.tenantId]
      );
      return parseInt(res.rows[0].count, 10);
    },
    create: async (args: any) => {
      const id = uuidv4();
      const d = args.data;
      const res = await pool.query(
        `INSERT INTO email_campaigns (id, tenant_id, created_by_id, title, status, total_recipients, scheduled_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [id, d.tenantId, d.createdById, d.title, d.status || 'SCHEDULED', d.totalRecipients || 0, d.scheduledAt]
      );
      const r = res.rows[0];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        createdById: r.created_by_id,
        title: r.title,
        status: r.status,
        totalRecipients: r.total_recipients,
        scheduledAt: r.scheduled_at,
        createdAt: r.created_at,
      };
    },
  },

  scheduledEmail: {
    count: async (args: any) => {
      let query = 'SELECT COUNT(*) FROM scheduled_emails WHERE tenant_id = $1';
      const values: any[] = [args.where.tenantId];
      if (args.where.status) {
        if (typeof args.where.status === 'object' && args.where.status.in) {
          query += ` AND status = ANY($2)`;
          values.push(args.where.status.in);
        } else {
          query += ` AND status = $2`;
          values.push(args.where.status);
        }
      }
      const res = await pool.query(query, values);
      return parseInt(res.rows[0].count, 10);
    },

    findMany: async (args: any) => {
      let query = `
        SELECT se.*, sa.email AS sender_email, sa.display_name AS sender_display_name,
               ec.title AS campaign_title
        FROM scheduled_emails se
        LEFT JOIN sender_accounts sa ON se.sender_id = sa.id
        LEFT JOIN email_campaigns ec ON se.campaign_id = ec.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let idx = 1;

      if (args.where?.tenantId) {
        query += ` AND se.tenant_id = $${idx++}`;
        values.push(args.where.tenantId);
      }

      if (args.where?.campaignId) {
        query += ` AND se.campaign_id = $${idx++}`;
        values.push(args.where.campaignId);
      }

      if (args.where?.senderId) {
        query += ` AND se.sender_id = $${idx++}`;
        values.push(args.where.senderId);
      }

      if (args.where?.status) {
        if (typeof args.where.status === 'object' && args.where.status.in) {
          query += ` AND se.status = ANY($${idx++})`;
          values.push(args.where.status.in);
        } else {
          query += ` AND se.status = $${idx++}`;
          values.push(args.where.status);
        }
      }

      if (args.where?.lastAttemptAt?.lt) {
        query += ` AND se.last_attempt_at < $${idx++}`;
        values.push(args.where.lastAttemptAt.lt);
      }

      if (args.where?.OR) {
        const orClauses: string[] = [];
        for (const condition of args.where.OR) {
          const key = Object.keys(condition)[0];
          const val = condition[key].contains;
          const colName =
            key === 'recipientEmail'
              ? 'se.recipient_email'
              : key === 'subject'
              ? 'se.subject'
              : 'se.body_content';
          orClauses.push(`${colName} ILIKE $${idx++}`);
          values.push(`%${val}%`);
        }
        query += ` AND (${orClauses.join(' OR ')})`;
      }

      query += ' ORDER BY se.scheduled_at ASC';

      if (args.take) {
        query += ` LIMIT ${parseInt(args.take, 10)}`;
      }
      if (args.skip) {
        query += ` OFFSET ${parseInt(args.skip, 10)}`;
      }

      const res = await pool.query(query, values);
      return res.rows.map((r) => ({
        id: r.id,
        tenantId: r.tenant_id,
        campaignId: r.campaign_id,
        senderId: r.sender_id,
        recipientEmail: r.recipient_email,
        recipientName: r.recipient_name,
        subject: r.subject,
        bodyContent: r.body_content,
        status: r.status,
        bullMqJobId: r.bull_mq_job_id,
        scheduledAt: r.scheduled_at,
        deliveryAttempts: r.delivery_attempts,
        lastAttemptAt: r.last_attempt_at,
        sentAt: r.sent_at,
        etherealPreviewUrl: r.ethereal_preview_url,
        failureReason: r.failure_reason,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        sender: {
          email: r.sender_email,
          displayName: r.sender_display_name,
        },
        campaign: {
          title: r.campaign_title,
        },
      }));
    },

    findUnique: async (args: { where: { id: string }; include?: any }) => {
      const res = await pool.query(
        `SELECT se.*, sa.email AS sender_email, sa.display_name AS sender_display_name,
                sa.smtp_host, sa.smtp_port, sa.smtp_user, sa.smtp_password, sa.hourly_limit
         FROM scheduled_emails se
         JOIN sender_accounts sa ON se.sender_id = sa.id
         WHERE se.id = $1`,
        [args.where.id]
      );
      if (!res.rows[0]) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        campaignId: r.campaign_id,
        senderId: r.sender_id,
        recipientEmail: r.recipient_email,
        recipientName: r.recipient_name,
        subject: r.subject,
        bodyContent: r.body_content,
        status: r.status,
        bullMqJobId: r.bull_mq_job_id,
        scheduledAt: r.scheduled_at,
        deliveryAttempts: r.delivery_attempts,
        lastAttemptAt: r.last_attempt_at,
        sentAt: r.sent_at,
        etherealPreviewUrl: r.ethereal_preview_url,
        failureReason: r.failure_reason,
        createdAt: r.created_at,
        sender: {
          id: r.sender_id,
          email: r.sender_email,
          displayName: r.sender_display_name,
          smtpHost: r.smtp_host,
          smtpPort: r.smtp_port,
          smtpUser: r.smtp_user,
          smtpPassword: r.smtp_password,
          hourlyLimit: r.hourly_limit,
        },
      };
    },

    findFirst: async (args: any) => {
      let query = `
        SELECT se.*, sa.email AS sender_email, sa.display_name AS sender_display_name
        FROM scheduled_emails se
        LEFT JOIN sender_accounts sa ON se.sender_id = sa.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let idx = 1;
      if (args?.where?.id) {
        query += ` AND se.id = $${idx++}`;
        values.push(args.where.id);
      }
      if (args?.where?.tenantId) {
        query += ` AND se.tenant_id = $${idx++}`;
        values.push(args.where.tenantId);
      }
      if (args?.where?.recipientEmail) {
        query += ` AND se.recipient_email = $${idx++}`;
        values.push(args.where.recipientEmail);
      }
      query += ' ORDER BY se.created_at DESC LIMIT 1';
      const res = await pool.query(query, values);
      if (!res.rows[0]) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        status: r.status,
        recipientEmail: r.recipient_email,
        subject: r.subject,
        bullMqJobId: r.bull_mq_job_id,
        scheduledAt: r.scheduled_at,
        etherealPreviewUrl: r.ethereal_preview_url,
        sender: {
          email: r.sender_email,
          displayName: r.sender_display_name,
        },
      };
    },

    createMany: async (args: { data: any[] }) => {
      for (const d of args.data) {
        const id = uuidv4();
        await pool.query(
          `INSERT INTO scheduled_emails 
           (id, tenant_id, campaign_id, sender_id, recipient_email, recipient_name, subject, body_content, status, scheduled_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
            d.tenantId,
            d.campaignId,
            d.senderId,
            d.recipientEmail,
            d.recipientName,
            d.subject,
            d.bodyContent,
            d.status,
            d.scheduledAt,
          ]
        );
      }
    },

    update: async (args: any) => {
      const d = args.data;
      const sets: string[] = ['updated_at = NOW()'];
      const values: any[] = [];
      let idx = 1;

      if (d.status !== undefined) {
        sets.push(`status = $${idx++}`);
        values.push(d.status);
      }
      if (d.bullMqJobId !== undefined) {
        sets.push(`bull_mq_job_id = $${idx++}`);
        values.push(d.bullMqJobId);
      }
      if (d.scheduledAt !== undefined) {
        sets.push(`scheduled_at = $${idx++}`);
        values.push(d.scheduledAt);
      }
      if (d.sentAt !== undefined) {
        sets.push(`sent_at = $${idx++}`);
        values.push(d.sentAt);
      }
      if (d.etherealPreviewUrl !== undefined) {
        sets.push(`ethereal_preview_url = $${idx++}`);
        values.push(d.etherealPreviewUrl);
      }
      if (d.failureReason !== undefined) {
        sets.push(`failure_reason = $${idx++}`);
        values.push(d.failureReason);
      }
      if (d.deliveryAttempts?.increment !== undefined) {
        sets.push(`delivery_attempts = delivery_attempts + 1`);
      }
      if (d.lastAttemptAt !== undefined) {
        sets.push(`last_attempt_at = $${idx++}`);
        values.push(d.lastAttemptAt);
      }

      values.push(args.where.id);
      const query = `UPDATE scheduled_emails SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await pool.query(query, values);
      const r = res.rows[0];
      if (!r) return null;
      return {
        id: r.id,
        tenantId: r.tenant_id,
        campaignId: r.campaign_id,
        senderId: r.sender_id,
        recipientEmail: r.recipient_email,
        recipientName: r.recipient_name,
        subject: r.subject,
        bodyContent: r.body_content,
        status: r.status,
        bullMqJobId: r.bull_mq_job_id,
        scheduledAt: r.scheduled_at,
        deliveryAttempts: r.delivery_attempts,
        lastAttemptAt: r.last_attempt_at,
        sentAt: r.sent_at,
        etherealPreviewUrl: r.ethereal_preview_url,
        failureReason: r.failure_reason,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    },
  },

  emailDeliveryAttempt: {
    create: async (args: any) => {
      const id = uuidv4();
      const d = args.data;
      await pool.query(
        `INSERT INTO email_delivery_attempts 
         (id, scheduled_email_id, attempt_number, status, smtp_response_code, error_message, duration_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, d.scheduledEmailId, d.attemptNumber, d.status, d.smtpResponseCode, d.errorMessage, d.durationMs]
      );
    },
  },

  slackIntegration: {
    findUnique: async (args: { where: { tenantId: string } }) => {
      const res = await pool.query(
        'SELECT * FROM slack_integrations WHERE tenant_id = $1 LIMIT 1',
        [args.where.tenantId]
      );
      if (!res.rows[0]) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        slackTeamId: r.slack_team_id,
        slackTeamName: r.slack_team_name,
        slackChannelId: r.slack_channel_id,
        slackChannelName: r.slack_channel_name,
        accessTokenEncrypted: r.access_token_encrypted,
        botUserId: r.bot_user_id,
        notifyOnRateLimit: r.notify_on_rate_limit,
        notifyOnFailure: r.notify_on_failure,
        lastNotifiedAt: r.last_notified_at,
      };
    },
    upsert: async (args: any) => {
      const d = args.create;
      const id = uuidv4();
      const res = await pool.query(
        `INSERT INTO slack_integrations 
         (id, tenant_id, slack_team_id, slack_team_name, slack_channel_id, slack_channel_name, access_token_encrypted, bot_user_id, notify_on_rate_limit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (tenant_id) DO UPDATE SET
           slack_team_id = EXCLUDED.slack_team_id,
           slack_team_name = EXCLUDED.slack_team_name,
           slack_channel_id = EXCLUDED.slack_channel_id,
           slack_channel_name = EXCLUDED.slack_channel_name,
           access_token_encrypted = EXCLUDED.access_token_encrypted,
           updated_at = NOW()
         RETURNING *`,
        [
          id,
          d.tenantId,
          d.slackTeamId,
          d.slackTeamName,
          d.slackChannelId,
          d.slackChannelName,
          d.accessTokenEncrypted,
          d.botUserId,
          d.notifyOnRateLimit !== undefined ? d.notifyOnRateLimit : true,
        ]
      );
      return res.rows[0];
    },
    update: async (args: any) => {
      await pool.query(
        'UPDATE slack_integrations SET last_notified_at = $1, updated_at = NOW() WHERE id = $2',
        [args.data.lastNotifiedAt, args.where.id]
      );
    },
    deleteMany: async (args: any) => {
      await pool.query('DELETE FROM slack_integrations WHERE tenant_id = $1', [args.where.tenantId]);
    },
  },
};
