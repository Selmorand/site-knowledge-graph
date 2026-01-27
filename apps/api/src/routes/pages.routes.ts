import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/db/client';
import { paginationSchema } from '@/utils/validation';

const pagesQuerySchema = paginationSchema.extend({
  siteId: z.string().optional(),
  status: z.enum(['PENDING', 'CRAWLED', 'PROCESSING', 'COMPLETED', 'ERROR']).optional(),
  search: z.string().optional(),
});

export async function pagesRoutes(fastify: FastifyInstance) {
  // List pages with filtering and pagination
  fastify.get('/', async (request, reply) => {
    const query = pagesQuerySchema.parse(request.query);

    const where: any = {};

    if (query.siteId) {
      where.siteId = query.siteId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { url: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        select: {
          id: true,
          url: true,
          title: true,
          metaDescription: true,
          canonicalUrl: true,
          status: true,
          depth: true,
          fetchMethod: true,
          crawledAt: true,
          createdAt: true,
          site: {
            select: {
              id: true,
              url: true,
              domain: true,
            },
          },
        },
        orderBy: { crawledAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.page.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return reply.send({
      data: pages,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  });

  // Get single page details
  fastify.get('/:pageId', async (request, reply) => {
    const { pageId } = request.params as { pageId: string };

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        site: {
          select: {
            id: true,
            url: true,
            domain: true,
            title: true,
          },
        },
      },
    });

    if (!page) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Page not found',
      });
    }

    return reply.send(page);
  });
}
