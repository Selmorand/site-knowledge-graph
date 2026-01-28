import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@site-knowledge-graph/shared';

// Log Redis configuration for debugging
console.log('=== REDIS CONFIG DEBUG ===');
console.log('REDIS_HOST:', env.REDIS_HOST);
console.log('REDIS_PORT:', env.REDIS_PORT);
console.log('REDIS_PASSWORD:', env.REDIS_PASSWORD ? '[REDACTED]' : 'undefined');
console.log('========================');

logger.info(`Initializing Redis: host=${env.REDIS_HOST}, port=${env.REDIS_PORT}, hasPassword=${!!env.REDIS_PASSWORD}`);

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT, 10),
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('=== REDIS ERROR ===');
  console.error('Message:', error.message);
  console.error('Code:', (error as any).code);
  console.error('Errno:', (error as any).errno);
  console.error('Host:', env.REDIS_HOST);
  console.error('Port:', env.REDIS_PORT);
  console.error('==================');

  logger.error(`Redis connection error: ${error.message} (code: ${(error as any).code})`);
});

redis.on('close', () => {
  logger.info('Redis connection closed');
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.ping();
    logger.info('Redis ping successful');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis disconnected');
}
