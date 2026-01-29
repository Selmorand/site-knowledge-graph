import { Queue, Job } from 'bullmq';
import { logger } from '@site-knowledge-graph/shared';
import { getRedisConnectionConfig } from './redis';

export interface CrawlJobData {
  jobId: string;
  siteId: string;
  baseUrl: string;
  maxDepth: number;
  maxPages: number;
}

export const crawlQueue = new Queue<CrawlJobData>('crawl-jobs', {
  connection: getRedisConnectionConfig(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 100,
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
});

crawlQueue.on('error', (error) => {
  logger.error({ error }, 'Crawl queue error');
});

export async function addCrawlJob(data: CrawlJobData): Promise<Job<CrawlJobData>> {
  logger.info({ jobId: data.jobId, siteId: data.siteId }, 'Adding crawl job to queue');

  return crawlQueue.add(`crawl-${data.jobId}`, data, {
    jobId: data.jobId,
  });
}

export async function getCrawlJobStatus(jobId: string): Promise<Job<CrawlJobData> | undefined> {
  return crawlQueue.getJob(jobId);
}

export async function disconnectQueue(): Promise<void> {
  await crawlQueue.close();
  logger.info('Crawl queue disconnected');
}
