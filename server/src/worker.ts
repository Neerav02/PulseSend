import { etherealService } from './services/ethereal.service';
import { initDatabase } from './config/database';
import { startEmailWorker } from './queue/email.worker';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.info('Starting PulseSend Background Worker Fleet...');
  await initDatabase();
  await etherealService.init();
  startEmailWorker();
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Worker process fatal error');
  process.exit(1);
});
