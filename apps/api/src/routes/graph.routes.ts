import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/db/client';
import { GraphService } from '@/services/graph/graph.service';
import { paginationSchema } from '@/utils/validation';

const buildGraphSchema = z.object({
  siteId: z.string(),
});

const entitiesQuerySchema = paginationSchema.extend({
  siteId: z.string().optional(),
  type: z.enum(['ORGANIZATION', 'SERVICE', 'PRODUCT', 'PERSON', 'LOCATION', 'TOPIC']).optional(),
  search: z.string().optional(),
});

const relationsQuerySchema = paginationSchema.extend({
  entityId: z.string().optional(),
  relationType: z.string().optional(),
});

export async function graphRoutes(fastify: FastifyInstance) {
  // Build knowledge graph from crawled pages
  fastify.post('/build', async (request, reply) => {
    const body = buildGraphSchema.parse(request.body);

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: body.siteId },
    });

    if (!site) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    const graphService = new GraphService(body.siteId);
    const stats = await graphService.buildGraph();

    return reply.send({
      siteId: body.siteId,
      success: true,
      ...stats,
    });
  });

  // List entities with filtering
  fastify.get('/entities', async (request, reply) => {
    const query = entitiesQuerySchema.parse(request.query);

    const where: any = {};

    if (query.siteId) {
      where.siteId = query.siteId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { aliases: { has: query.search } },
      ];
    }

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          aliases: true,
          source: true,
          confidence: true,
          createdAt: true,
          _count: {
            select: {
              mentions: true,
              relationsFrom: true,
              relationsTo: true,
            },
          },
        },
        orderBy: { confidence: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.entity.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return reply.send({
      data: entities,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  });

  // Get entity details with relations
  fastify.get('/entities/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        mentions: {
          take: 10,
          include: {
            page: {
              select: {
                id: true,
                url: true,
                title: true,
              },
            },
          },
        },
        relationsFrom: {
          include: {
            toEntity: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        relationsTo: {
          include: {
            fromEntity: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        site: {
          select: {
            id: true,
            url: true,
            domain: true,
          },
        },
      },
    });

    if (!entity) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Entity not found',
      });
    }

    return reply.send(entity);
  });

  // List entity relations
  fastify.get('/relations', async (request, reply) => {
    const query = relationsQuerySchema.parse(request.query);

    const where: any = {};

    if (query.entityId) {
      where.OR = [
        { fromEntityId: query.entityId },
        { toEntityId: query.entityId },
      ];
    }

    if (query.relationType) {
      where.relationType = query.relationType;
    }

    const [relations, total] = await Promise.all([
      prisma.entityRelation.findMany({
        where,
        include: {
          fromEntity: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          toEntity: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: { weight: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.entityRelation.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return reply.send({
      data: relations,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  });

  // Get graph summary statistics
  fastify.get('/summary', async (request, reply) => {
    const { siteId } = request.query as { siteId?: string };

    const where: any = siteId ? { siteId } : {};

    const [
      totalEntities,
      totalRelations,
      entityCountByType,
      topRelationTypes,
      mostConnectedEntities,
    ] = await Promise.all([
      prisma.entity.count({ where }),
      prisma.entityRelation.count(),
      prisma.entity.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
      prisma.entityRelation.groupBy({
        by: ['relationType'],
        _count: { relationType: true },
        orderBy: { _count: { relationType: 'desc' } },
        take: 10,
      }),
      prisma.entity.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          _count: {
            select: {
              relationsFrom: true,
              relationsTo: true,
            },
          },
        },
        orderBy: [
          { relationsFrom: { _count: 'desc' } },
          { relationsTo: { _count: 'desc' } },
        ],
        take: 10,
      }),
    ]);

    // Find orphan entities (no relationships)
    const orphanEntities = await prisma.entity.findMany({
      where: {
        ...where,
        AND: [
          { relationsFrom: { none: {} } },
          { relationsTo: { none: {} } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
      take: 10,
    });

    return reply.send({
      totalEntities,
      totalRelations,
      entityCountByType: entityCountByType.map(e => ({
        type: e.type,
        count: e._count.type,
      })),
      topRelationTypes: topRelationTypes.map(r => ({
        type: r.relationType,
        count: r._count.relationType,
      })),
      mostConnectedEntities: mostConnectedEntities.map(e => ({
        ...e,
        connectionCount: e._count.relationsFrom + e._count.relationsTo,
      })),
      orphanEntities,
    });
  });
}
