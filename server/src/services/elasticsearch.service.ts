import { esClient, checkElasticsearchHealth, isEsAvailable } from '../config/elasticsearch';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export const EMAIL_INDEX = 'pulsesend-emails-v1';

export class ElasticsearchService {
  async initIndex(): Promise<void> {
    const isHealthy = await checkElasticsearchHealth();
    if (!isHealthy) {
      logger.info('Skipping Elasticsearch index initialization (offline). Postgres fallback active.');
      return;
    }

    try {
      const exists = await esClient.indices.exists({ index: EMAIL_INDEX });
      if (!exists) {
        await esClient.indices.create({
          index: EMAIL_INDEX,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              tenantId: { type: 'keyword' },
              campaignId: { type: 'keyword' },
              senderId: { type: 'keyword' },
              senderEmail: { type: 'keyword' },
              recipientEmail: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              recipientName: { type: 'text' },
              subject: { type: 'text' },
              bodyContent: { type: 'text' },
              status: { type: 'keyword' },
              sentAt: { type: 'date' },
              scheduledAt: { type: 'date' },
              etherealPreviewUrl: { type: 'keyword' },
            },
          },
        });
        logger.info(`Elasticsearch index '${EMAIL_INDEX}' initialized.`);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Elasticsearch index');
    }
  }

  async indexEmail(email: {
    id: string;
    tenantId: string;
    campaignId?: string | null;
    senderId: string;
    senderEmail?: string;
    recipientEmail: string;
    recipientName?: string | null;
    subject: string;
    bodyContent: string;
    status: string;
    sentAt?: Date | null;
    scheduledAt: Date;
    etherealPreviewUrl?: string | null;
  }): Promise<void> {
    if (!isEsAvailable()) return;

    try {
      await esClient.index({
        index: EMAIL_INDEX,
        id: email.id,
        document: {
          id: email.id,
          tenantId: email.tenantId,
          campaignId: email.campaignId,
          senderId: email.senderId,
          senderEmail: email.senderEmail,
          recipientEmail: email.recipientEmail,
          recipientName: email.recipientName,
          subject: email.subject,
          bodyContent: email.bodyContent,
          status: email.status,
          sentAt: email.sentAt || new Date(),
          scheduledAt: email.scheduledAt,
          etherealPreviewUrl: email.etherealPreviewUrl,
        },
      });
    } catch (error) {
      logger.warn({ error, id: email.id }, 'Elasticsearch indexing failed. Postgres remains authoritative.');
    }
  }

  async searchEmails(tenantId: string, query: string, page = 1, limit = 20) {
    const from = (page - 1) * limit;

    // Check if Elasticsearch is available
    if (isEsAvailable() && query && query.trim().length > 0) {
      try {
        const esRes = await esClient.search({
          index: EMAIL_INDEX,
          from,
          size: limit,
          query: {
            bool: {
              must: [{ term: { tenantId } }],
              should: [
                { wildcard: { 'recipientEmail.keyword': `*${query}*` } },
                { match: { recipientEmail: { query, boost: 3 } } },
                { match: { subject: { query, fuzziness: 'AUTO', boost: 2 } } },
                { match: { bodyContent: { query, fuzziness: 'AUTO' } } },
              ],
              minimum_should_match: 1,
            },
          },
          sort: [{ sentAt: { order: 'desc' } }],
        });

        const hits = esRes.hits.hits.map((h: any) => h._source);
        const total = typeof esRes.hits.total === 'number' ? esRes.hits.total : esRes.hits.total?.value || 0;

        return {
          source: 'elasticsearch',
          total,
          page,
          pages: Math.ceil(total / limit),
          data: hits,
        };
      } catch (err) {
        logger.warn('Elasticsearch query failed, falling back to PostgreSQL ILIKE query');
      }
    }

    // Graceful PostgreSQL Fallback
    const where: any = { tenantId };
    if (query && query.trim().length > 0) {
      where.OR = [
        { recipientEmail: { contains: query, mode: 'insensitive' } },
        { subject: { contains: query, mode: 'insensitive' } },
        { bodyContent: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.scheduledEmail.count({ where }),
      prisma.scheduledEmail.findMany({
        where,
        include: { sender: { select: { email: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: from,
        take: limit,
      }),
    ]);

    return {
      source: 'postgresql-fallback',
      total,
      page,
      pages: Math.ceil(total / limit),
      data: data.map((d) => ({
        ...d,
        senderEmail: d.sender.email,
      })),
    };
  }
}

export const elasticsearchService = new ElasticsearchService();

