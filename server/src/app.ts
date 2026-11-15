import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { env } from './config/env';
import { emailQueue } from './queue/email.queue';
import { apiRouter } from './routes/api.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { prisma } from './config/database';
import { redisClient } from './config/redis';
import { isEsAvailable } from './config/elasticsearch';

export const app = express();

// Security & Parsing Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Bull Board and iframe previews
  })
);

app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// Bull Board Dashboard (/admin/queues)
// ==========================================
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue) as any],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// ==========================================
// Health & Telemetry Probe
// ==========================================
app.get('/health', async (req, res) => {
  let dbStatus = 'healthy';
  let redisStatus = 'healthy';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = 'degraded';
  }

  try {
    await redisClient.ping();
  } catch (err) {
    redisStatus = 'degraded';
  }

  const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      postgres: dbStatus,
      redis: redisStatus,
      elasticsearch: isEsAvailable() ? 'connected' : 'offline (fallback active)',
    },
  });
});

// ==========================================
// Main API Routes
// ==========================================
app.use('/api', apiRouter);

// Centralized Error Handling
app.use(errorMiddleware);
