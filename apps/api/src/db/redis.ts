import Redis, { RedisOptions } from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@site-knowledge-graph/shared';

// Determine Redis configuration from environment
// Priority: REDIS_URL > REDIS_HOST/PORT > REDISHOST/PORT (Railway)
function createRedisClient(): Redis {
  if (env.REDIS_URL) {
    // Use connection string (Railway or other cloud providers)
    console.log('=== REDIS CONFIG DEBUG ===');
    console.log('Using REDIS_URL connection string');
    console.log('========================');
    logger.info('Initializing Redis with connection string');
    return new Redis(env.REDIS_URL);
  } else {
    // Use individual config (local development or legacy)
    const host = env.REDIS_HOST || env.REDISHOST || 'localhost';
    const port = parseInt(env.REDIS_PORT || env.REDISPORT || '6379', 10);
    const password = env.REDIS_PASSWORD || env.REDISPASSWORD || undefined;

    console.log('=== REDIS CONFIG DEBUG ===');
    console.log('REDIS_HOST:', host);
    console.log('REDIS_PORT:', port);
    console.log('REDIS_PASSWORD:', password ? '[REDACTED]' : 'undefined');
    console.log('========================');

    logger.info(`Initializing Redis: host=${host}, port=${port}, hasPassword=${!!password}`);

    return new Redis({
      host,
      port,
      password,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }
}

export const redis = createRedisClient();

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('=== REDIS ERROR ===');
  console.error('Message:', error.message);
  console.error('Code:', (error as any).code);
  console.error('Errno:', (error as any).errno);
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

// Export Redis connection config for BullMQ and other clients
export function getRedisConnectionConfig(): RedisOptions {
  // BullMQ requires an object, not a string, so we parse REDIS_URL if present
  if (env.REDIS_URL) {
    // Parse redis://user:password@host:port format
    const url = new URL(env.REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      username: url.username !== 'default' ? url.username : undefined,
    };
  }

  return {
    host: env.REDIS_HOST || env.REDISHOST || 'localhost',
    port: parseInt(env.REDIS_PORT || env.REDISPORT || '6379', 10),
    password: env.REDIS_PASSWORD || env.REDISPASSWORD || undefined,
  };
}
