import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/db/client';
import { addCrawlJob, getCrawlJobStatus } from '@/db/queue';
import { extractDomain, normalizeUrl } from '@/utils/url-utils';
import { urlSchema } from '@/utils/validation';

const startCrawlSchema = z.object({
  url: urlSchema,
  maxDepth: z.number().int().min(0).max(10).default(3),
  maxPages: z.number().int().min(1).max(1000).default(100),
});

export async function crawlRoutes(fastify: FastifyInstance) {
  // Start a new crawl job
  fastify.post('/start', async (request, reply) => {
    const body = startCrawlSchema.parse(request.body);

    const normalizedUrl = normalizeUrl(body.url);
    const domain = extractDomain(normalizedUrl);

    if (!domain) {
      return reply.code(400).send({
        error: 'Invalid URL',
        message: 'Could not extract domain from URL',
      });
    }

    // Create or get site
    let site = await prisma.site.findUnique({
      where: { url: normalizedUrl },
    });

    if (!site) {
      site = await prisma.site.create({
        data: {
          url: normalizedUrl,
          domain,
          status: 'PENDING',
        },
      });
    }

    // Create crawl job
    const crawlJob = await prisma.crawlJob.create({
      data: {
        siteId: site.id,
        maxDepth: body.maxDepth,
        maxPages: body.maxPages,
        status: 'PENDING',
      },
    });

    // Add to queue
    await addCrawlJob({
      jobId: crawlJob.id,
      siteId: site.id,
      baseUrl: normalizedUrl,
      maxDepth: body.maxDepth,
      maxPages: body.maxPages,
    });

    // Update site status
    await prisma.site.update({
      where: { id: site.id },
      data: { status: 'ACTIVE' },
    });

    return reply.code(201).send({
      jobId: crawlJob.id,
      siteId: site.id,
      url: normalizedUrl,
      status: 'PENDING',
      maxDepth: body.maxDepth,
      maxPages: body.maxPages,
    });
  });

  // Get crawl job status
  fastify.get('/:jobId/status', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };

    const crawlJob = await prisma.crawlJob.findUnique({
      where: { id: jobId },
      include: {
        site: {
          select: {
            url: true,
            domain: true,
          },
        },
      },
    });

    if (!crawlJob) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Crawl job not found',
      });
    }

    // Get queue job status
    const queueJob = await getCrawlJobStatus(jobId);

    let queueStatus = null;
    if (queueJob) {
      const state = await queueJob.getState();
      queueStatus = {
        state,
        progress: queueJob.progress,
        attemptsMade: queueJob.attemptsMade,
        failedReason: queueJob.failedReason,
      };
    }

    return reply.send({
      jobId: crawlJob.id,
      siteId: crawlJob.siteId,
      site: crawlJob.site,
      status: crawlJob.status,
      maxDepth: crawlJob.maxDepth,
      maxPages: crawlJob.maxPages,
      pagesProcessed: crawlJob.pagesProcessed,
      startedAt: crawlJob.startedAt,
      completedAt: crawlJob.completedAt,
      errorMessage: crawlJob.errorMessage,
      createdAt: crawlJob.createdAt,
      queue: queueStatus,
    });
  });
}
