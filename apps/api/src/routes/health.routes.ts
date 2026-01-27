import { FastifyInstance } from 'fastify';
import { checkHealth } from '@/services/health.service';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request, reply) => {
    const health = await checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    return reply.code(statusCode).send(health);
  });

  fastify.get('/ping', async (_request, reply) => {
    return reply.send({ message: 'pong', timestamp: new Date().toISOString() });
  });
}
