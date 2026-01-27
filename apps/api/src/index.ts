import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import { env } from '@/config/env';
import { logger } from '@site-knowledge-graph/shared';
import { connectDatabase, disconnectDatabase } from '@/db/client';
import { connectRedis, disconnectRedis } from '@/db/redis';
import { disconnectQueue } from '@/db/queue';
import { healthRoutes } from '@/routes/health.routes';
import { crawlRoutes } from '@/routes/crawl.routes';
import { pagesRoutes } from '@/routes/pages.routes';
import { graphRoutes } from '@/routes/graph.routes';
import { reportRoutes } from '@/routes/report.routes';
import { questionsRoutes } from '@/routes/questions.routes';
import { uiRoutes } from '@/ui/ui.routes';
import { startCrawlWorker, stopCrawlWorker } from '@/workers/crawl-worker';
import { closeBrowser } from '@/services/crawler/fetcher';

const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
  },
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true,
    });

    // Register form body parser (for HTML form submissions)
    await fastify.register(formbody);

    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Register UI routes (browser interface)
    await fastify.register(uiRoutes);

    // Register API routes (internal use only)
    await fastify.register(healthRoutes, { prefix: '/api' });
    await fastify.register(crawlRoutes, { prefix: '/api/crawl' });
    await fastify.register(pagesRoutes, { prefix: '/api/pages' });
    await fastify.register(graphRoutes, { prefix: '/api/graph' });
    await fastify.register(reportRoutes, { prefix: '/api/report' });
    await fastify.register(questionsRoutes, { prefix: '/api' });

    // Start crawl worker
    await startCrawlWorker();

    // Start server
    const port = parseInt(env.PORT, 10);
    await fastify.listen({ port, host: '0.0.0.0' });

    logger.info(`Server running on http://localhost:${port}`);
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down server...');
  try {
    await stopCrawlWorker();
    await closeBrowser();
    await fastify.close();
    await disconnectQueue();
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('Server shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
