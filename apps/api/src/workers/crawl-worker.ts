import { Worker, Job } from 'bullmq';
import { env } from '@/config/env';
import { logger } from '@site-knowledge-graph/shared';
import { CrawlJobData } from '@/db/queue';
import { CrawlerService } from '@/services/crawler/crawler.service';
import { closeBrowser } from '@/services/crawler/fetcher';

export const crawlWorker = new Worker<CrawlJobData>(
  'crawl-jobs',
  async (job: Job<CrawlJobData>) => {
    const { jobId, siteId, baseUrl, maxDepth, maxPages } = job.data;

    logger.info({ jobId, siteId, baseUrl }, 'Processing crawl job');

    const crawler = new CrawlerService({
      jobId,
      siteId,
      baseUrl,
      maxDepth,
      maxPages,
    });

    await crawler.crawl();

    logger.info({ jobId }, 'Crawl job completed');
  },
  {
    connection: {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT, 10),
      password: env.REDIS_PASSWORD || undefined,
    },
    concurrency: 1, // Process one job at a time
    limiter: {
      max: 1,
      duration: 5000, // Max 1 job per 5 seconds
    },
  }
);

crawlWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Worker: Job completed');
});

crawlWorker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'Worker: Job failed');
});

crawlWorker.on('error', (error) => {
  logger.error({ error }, 'Worker error');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker');
  await crawlWorker.close();
  await closeBrowser();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker');
  await crawlWorker.close();
  await closeBrowser();
  process.exit(0);
});

export async function startCrawlWorker(): Promise<void> {
  logger.info('Crawl worker started and ready to process jobs');
}

export async function stopCrawlWorker(): Promise<void> {
  await crawlWorker.close();
  await closeBrowser();
  logger.info('Crawl worker stopped');
}
