import { app } from './app';
import { env } from './config/env';
import { etherealService } from './services/ethereal.service';
import { elasticsearchService } from './services/elasticsearch.service';
import { reconciliationService } from './services/reconciliation.service';
import { startEmailWorker } from './queue/email.worker';
import { prisma, initDatabase } from './config/database';
import { redisClient } from './config/redis';
import { encrypt } from './utils/encryption';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.info('Initializing PulseSend Core Services...');

  // 0. Initialize PostgreSQL Tables and DDL
  await initDatabase();

  // 0.5. Seed Default Tenant & Senders if database is fresh
  try {
    let defaultTenant = await prisma.tenant.findFirst();
    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({
        data: { name: 'PulseSend Production Workspace' },
      });
      logger.info('Created default production workspace');
    }

    const existingSender = await prisma.senderAccount.findFirst({
      where: { tenantId: defaultTenant.id },
    });
    if (!existingSender) {
      const sampleSenders = [
        {
          displayName: 'PulseSend Enterprise Growth',
          email: 'outreach@pulsesend.io',
          hourlyLimit: 50,
          smtpHost: 'smtp.ethereal.email',
          smtpPort: 587,
          smtpUser: 'ethereal_user_sales',
          smtpPassword: encrypt('demo_password_123'),
        },
        {
          displayName: 'PulseSend Partnerships',
          email: 'partnerships@pulsesend.io',
          hourlyLimit: 60,
          smtpHost: 'smtp.ethereal.email',
          smtpPort: 587,
          smtpUser: 'ethereal_user_partnerships',
          smtpPassword: encrypt('demo_password_123'),
        },
        {
          displayName: 'PulseSend Scale Engine',
          email: 'scale@pulsesend.io',
          hourlyLimit: 50,
          smtpHost: 'smtp.ethereal.email',
          smtpPort: 587,
          smtpUser: 'ethereal_user_growth',
          smtpPassword: encrypt('demo_password_123'),
        },
      ];
      for (const s of sampleSenders) {
        await prisma.senderAccount.create({
          data: {
            tenantId: defaultTenant.id,
            displayName: s.displayName,
            email: s.email,
            hourlyLimit: s.hourlyLimit,
            smtpHost: s.smtpHost,
            smtpPort: s.smtpPort,
            smtpUser: s.smtpUser,
            smtpPassword: s.smtpPassword,
          },
        });
      }
      logger.info('Pre-seeded sample sender mailboxes for live evaluation.');
    }
  } catch (err) {
    logger.warn({ err }, 'Auto-seed check encountered non-fatal error');
  }

  // 1. Initialize Ethereal SMTP transport
  await etherealService.init();

  // 2. Initialize Elasticsearch index mappings
  await elasticsearchService.initIndex();

  // 3. Boot-time Queue Reconciliation (Recovers pending jobs without cron)
  await reconciliationService.reconcileQueueOnStartup();

  // 3.5. Start BullMQ Email Worker fleet
  if (process.env.RUN_WORKER !== 'false') {
    startEmailWorker();
    logger.info('⚙️ PulseSend BullMQ Worker Fleet active');
  }

  // 4. Start HTTP Server
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 PulseSend API Gateway listening on http://localhost:${env.PORT}`);
    logger.info(`📊 Bull Board Queue Monitor available at http://localhost:${env.PORT}/admin/queues`);
    logger.info(`🔍 Health check probe available at http://localhost:${env.PORT}/health`);
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down PulseSend gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      redisClient.disconnect();
      logger.info('Database and Redis connections closed. Exit complete.');
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal error during server bootstrap');
  process.exit(1);
});
