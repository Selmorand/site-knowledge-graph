import { prisma } from '@/db/client';
import { redis } from '@/db/redis';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
  };
}

export async function checkHealth(): Promise<HealthStatus> {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const [dbCheck, redisCheck] = checks;

  const isHealthy = checks.every((check) => check.status === 'fulfilled');

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbCheck.status === 'fulfilled',
      redis: redisCheck.status === 'fulfilled',
    },
  };
}
