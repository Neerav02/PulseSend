import { Client } from '@elastic/elasticsearch';
import { env } from './env';
import { logger } from '../utils/logger';

export const esClient = new Client({
  node: env.ELASTICSEARCH_NODE,
  maxRetries: 0,
  requestTimeout: 1000,
});

let isElasticsearchConnected = false;

export async function checkElasticsearchHealth(): Promise<boolean> {
  try {
    await esClient.ping();
    isElasticsearchConnected = true;
    return true;
  } catch (error) {
    isElasticsearchConnected = false;
    logger.warn('Elasticsearch is currently unreachable. Fallback mode enabled.');
    return false;
  }
}

export function isEsAvailable(): boolean {
  return isElasticsearchConnected;
}
