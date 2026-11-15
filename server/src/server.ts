import { app } from './app';
import { env } from './config/env';
import { etherealService } from './services/ethereal.service';
import { elasticsearchService } from './services/elasticsearch.service';
import { reconciliationService } from './services/reconciliation.service';
import { prisma, initDatabase } from './config/database';
import { redisClient } from './config/redis';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.info('Initializing PulseSend Core Services...');

  // 0. Initialize PostgreSQL Tables and DDL
  await initDatabase();

  // 1. Initialize Ethereal SMTP transport
  await etherealService.init();

  // 2. Initialize Elasticsearch index mappings
  await elasticsearchService.initIndex();

  // 3. Boot-time Queue Reconciliation (Recovers pending jobs without cron)
  await reconciliationService.reconcileQueueOnStartup();

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
