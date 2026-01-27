import { FastifyInstance } from 'fastify';
import { prisma } from '@/db/client';
import { addCrawlJob } from '@/db/queue';
import { extractDomain, normalizeUrl } from '@/utils/url-utils';
import { GraphService } from '@/services/graph/graph.service';
import { renderHomePage } from './pages/home';
import { renderProgressPage } from './pages/progress';

export async function uiRoutes(fastify: FastifyInstance) {
  // Home page - URL input form
  fastify.get('/', async (_request, reply) => {
    const html = renderHomePage();
    return reply.type('text/html').send(html);
  });

  // Handle form submission - start analysis
  fastify.post('/ui/analyze', async (request, reply) => {
    const body = request.body as any;

    const url = body.url?.trim();
    const maxDepth = parseInt(body.maxDepth, 10) || 3;
    const maxPages = parseInt(body.maxPages, 10) || 50;

    fastify.log.info({
      bodyRaw: body,
      url,
      maxDepth,
      maxPages
    }, 'Form submission received');

    // Validate URL
    if (!url) {
      const html = renderHomePage('Please enter a website URL');
      return reply.type('text/html').send(html);
    }

    try {
      const normalizedUrl = normalizeUrl(url);
      const domain = extractDomain(normalizedUrl);

      if (!domain) {
        const html = renderHomePage('Invalid URL format. Please include http:// or https://');
        return reply.type('text/html').send(html);
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
          maxDepth,
          maxPages,
          status: 'PENDING',
        },
      });

      // Add to queue
      await addCrawlJob({
        jobId: crawlJob.id,
        siteId: site.id,
        baseUrl: normalizedUrl,
        maxDepth,
        maxPages,
      });

      // Update site status
      await prisma.site.update({
        where: { id: site.id },
        data: { status: 'ACTIVE' },
      });

      // Redirect to progress page
      return reply.redirect(303, `/run/${crawlJob.id}`);
    } catch (error: any) {
      const html = renderHomePage(`Error: ${error.message}`);
      return reply.type('text/html').send(html);
    }
  });

  // Progress page - shows crawl and graph building progress
  fastify.get('/run/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };

    try {
      const crawlJob = await prisma.crawlJob.findUnique({
        where: { id: jobId },
        include: {
          site: true,
        },
      });

      if (!crawlJob) {
        return reply.code(404).send('Job not found');
      }

      // Determine current phase
      let phase: 'crawling' | 'building-graph' | 'completed' | 'error' = 'crawling';

      if (crawlJob.status === 'FAILED' || crawlJob.status === 'CANCELLED') {
        phase = 'error';
      } else if (crawlJob.status === 'COMPLETED') {
        // Check if any pages were actually crawled
        const pageCount = await prisma.page.count({
          where: {
            siteId: crawlJob.siteId,
            status: 'COMPLETED'
          },
        });

        if (pageCount === 0) {
          // No pages crawled - treat as error
          phase = 'error';
          // Use the error message from the crawl job if available, otherwise use a generic one
          if (!crawlJob.errorMessage) {
            crawlJob.errorMessage = 'No pages were successfully crawled. Possible reasons:\n  • The URL may be invalid or unreachable\n  • The site may be blocking crawlers\n  • Network connectivity issues\n\nPlease check the URL and try again.';
          }
        } else {
          // Check if graph is built
          const entityCount = await prisma.entity.count({
            where: { siteId: crawlJob.siteId },
          });

          if (entityCount > 0) {
            phase = 'completed';
          } else {
            // Build graph in background
            phase = 'building-graph';

            // Trigger graph build asynchronously (only once)
            const graphBuildKey = `graph-build-${crawlJob.siteId}`;
            if (!(global as any)[graphBuildKey]) {
              (global as any)[graphBuildKey] = true;

              setImmediate(async () => {
                try {
                  const graphService = new GraphService(crawlJob.siteId);
                  await graphService.buildGraph();
                } catch (error) {
                  console.error('Graph build error:', error);
                } finally {
                  delete (global as any)[graphBuildKey];
                }
              });
            }
          }
        }
      }

      const html = renderProgressPage({
        jobId: crawlJob.id,
        siteId: crawlJob.siteId,
        url: crawlJob.site.url,
        status: crawlJob.status,
        pagesProcessed: crawlJob.pagesProcessed,
        maxPages: crawlJob.maxPages,
        phase,
        error: crawlJob.errorMessage || undefined,
      });

      return reply.type('text/html').send(html);
    } catch (error: any) {
      return reply.code(500).send(`Error: ${error.message}`);
    }
  });

  // Report page wrapper (redirects to existing report route)
  fastify.get('/report/:siteId', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };
    return reply.redirect(303, `/api/report/${siteId}`);
  });
}
