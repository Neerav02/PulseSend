import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or server dir
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5433/dispatch_db?schema=public'),

  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6380').transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional(),

  ELASTICSEARCH_NODE: z.string().default('http://localhost:9200'),

  SESSION_SECRET: z.string().default('pulsesend_session_secret_super_secure_key_12345'),
  ENCRYPTION_SECRET: z.string().default('pulsesend_aes256_encryption_master_key_32chars!!'),

  WORKER_CONCURRENCY: z.string().default('5').transform((val) => parseInt(val, 10)),
  DEFAULT_MIN_DELAY_SECONDS: z.string().default('2').transform((val) => parseInt(val, 10)),

  ETHEREAL_USER: z.string().optional(),
  ETHEREAL_PASS: z.string().optional(),
  ETHEREAL_HOST: z.string().default('smtp.ethereal.email'),
  ETHEREAL_PORT: z.string().default('587').transform((val) => parseInt(val, 10)),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:5000/api/auth/google/callback'),

  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().optional(),
  SLACK_REDIRECT_URI: z.string().default('http://localhost:5000/api/integrations/slack/callback'),
});

export const env = envSchema.parse(process.env);

