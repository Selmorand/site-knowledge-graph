import { prisma } from '@/db/client';
import { logger } from '@site-knowledge-graph/shared';
import { SiteReport } from './types';
import { APP_NAME, APP_VERSION } from '@site-knowledge-graph/shared';

export class ReportAssembler {
  private siteId: string;

  constructor(siteId: string) {
    this.siteId = siteId;
  }

  async buildReport(): Promise<SiteReport> {
    logger.info({ siteId: this.siteId }, 'Building site report');

    const [site, pages, chunks, entities, relationships, crawlJobs] = await Promise.all([
      this.fetchSiteInfo(),
      this.fetchPages(),
      this.fetchChunks(),
      this.fetchEntities(),
      this.fetchRelationships(),
      this.fetchCrawlJobs(),
    ]);

    const crawlStats = this.calculateCrawlStats(pages, crawlJobs);
    const summaries = this.calculateSummaries(pages, chunks, entities);

    const report: SiteReport = {
      site,
      crawlStats,
      pages,
      chunks,
      entities,
      relationships,
      summaries,
      metadata: {
        toolName: APP_NAME,
        toolVersion: APP_VERSION,
        generatedAt: new Date(),
        reportId: `${this.siteId}-${Date.now()}`,
      },
    };

    logger.info({ siteId: this.siteId }, 'Site report built successfully');

    return report;
  }

  private async fetchSiteInfo() {
    const site = await prisma.site.findUnique({
      where: { id: this.siteId },
    });

    if (!site) {
      throw new Error(`Site not found: ${this.siteId}`);
    }

    return {
      id: site.id,
      url: site.url,
      domain: site.domain,
      title: site.title,
      description: site.description,
      status: site.status,
      lastCrawledAt: site.lastCrawledAt,
    };
  }

  private async fetchPages() {
    const pages = await prisma.page.findMany({
      where: { siteId: this.siteId },
      select: {
        id: true,
        url: true,
        title: true,
        depth: true,
        status: true,
        fetchMethod: true,
        crawledAt: true,
        _count: {
          select: {
            entityMentions: true,
            chunks: true,
          },
        },
      },
      orderBy: { depth: 'asc' },
    });

    return pages.map((page) => ({
      id: page.id,
      url: page.url,
      title: page.title,
      depth: page.depth,
      status: page.status,
      fetchMethod: page.fetchMethod,
      crawledAt: page.crawledAt,
      entityCount: page._count.entityMentions,
      chunkCount: page._count.chunks,
    }));
  }

  private async fetchChunks() {
    const chunks = await prisma.contentChunk.findMany({
      where: {
        page: {
          siteId: this.siteId,
        },
      },
      select: {
        id: true,
        headingPath: true,
        text: true,
        position: true,
        page: {
          select: {
            url: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return chunks.map((chunk) => ({
      id: chunk.id,
      pageUrl: chunk.page.url,
      headingPath: chunk.headingPath,
      text: chunk.text,
      position: chunk.position,
    }));
  }

  private async fetchEntities() {
    const entities = await prisma.entity.findMany({
      where: { siteId: this.siteId },
      select: {
        id: true,
        name: true,
        type: true,
        aliases: true,
        source: true,
        confidence: true,
        _count: {
          select: {
            mentions: true,
            relationsFrom: true,
            relationsTo: true,
          },
        },
        mentions: {
          select: {
            page: {
              select: {
                url: true,
              },
            },
          },
        },
      },
      orderBy: { confidence: 'desc' },
    });

    return entities.map((entity) => {
      const uniquePages = new Set(entity.mentions.map((m) => m.page.url));

      return {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        aliases: entity.aliases,
        source: entity.source,
        confidence: entity.confidence,
        mentionCount: entity._count.mentions,
        pagesMentioned: Array.from(uniquePages),
        relationsCount: entity._count.relationsFrom + entity._count.relationsTo,
      };
    });
  }

  private async fetchRelationships() {
    const relationships = await prisma.entityRelation.findMany({
      where: {
        fromEntity: {
          siteId: this.siteId,
        },
      },
      select: {
        id: true,
        relationType: true,
        weight: true,
        source: true,
        fromEntity: {
          select: {
            name: true,
            type: true,
          },
        },
        toEntity: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { weight: 'desc' },
    });

    return relationships.map((rel) => ({
      id: rel.id,
      fromEntityName: rel.fromEntity.name,
      fromEntityType: rel.fromEntity.type,
      toEntityName: rel.toEntity.name,
      toEntityType: rel.toEntity.type,
      relationType: rel.relationType,
      weight: rel.weight,
      source: rel.source,
    }));
  }

  private async fetchCrawlJobs() {
    return prisma.crawlJob.findMany({
      where: { siteId: this.siteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateCrawlStats(pages: any[], crawlJobs: any[]) {
    const completed = pages.filter((p) => p.status === 'COMPLETED').length;
    const pending = pages.filter((p) => p.status === 'PENDING').length;
    const error = pages.filter((p) => p.status === 'ERROR').length;

    const httpCount = pages.filter((p) => p.fetchMethod === 'HTTP').length;
    const playwrightCount = pages.filter((p) => p.fetchMethod === 'PLAYWRIGHT').length;

    const maxDepth = Math.max(...pages.map((p) => p.depth), 0);

    const latestJob = crawlJobs[0];
    let duration = null;

    if (latestJob?.startedAt && latestJob?.completedAt) {
      duration =
        new Date(latestJob.completedAt).getTime() - new Date(latestJob.startedAt).getTime();
    }

    return {
      totalPages: pages.length,
      maxDepth,
      pagesCompleted: completed,
      pagesPending: pending,
      pagesError: error,
      crawlDuration: duration,
      lastCrawlJobStatus: latestJob?.status || null,
      fetchMethods: {
        http: httpCount,
        playwright: playwrightCount,
      },
    };
  }

  private calculateSummaries(pages: any[], chunks: any[], entities: any[]) {
    // Content summary
    const totalChunks = chunks.length;
    const totalTextLength = chunks.reduce((sum, chunk) => sum + chunk.text.length, 0);
    const avgChunkLength = totalChunks > 0 ? Math.round(totalTextLength / totalChunks) : 0;

    // Structure summary
    const depthCounts: Record<number, number> = {};
    for (const page of pages) {
      depthCounts[page.depth] = (depthCounts[page.depth] || 0) + 1;
    }

    const totalDepth = pages.reduce((sum, page) => sum + page.depth, 0);
    const avgDepth = pages.length > 0 ? totalDepth / pages.length : 0;
    const maxDepthReached = Math.max(...pages.map((p) => p.depth), 0);

    // Coverage summary
    const pagesWithEntities = pages.filter((p) => p.entityCount > 0).length;
    const pagesWithoutEntities = pages.length - pagesWithEntities;
    const orphanEntities = entities.filter((e) => e.relationsCount === 0).length;

    const mostConnected = entities.reduce(
      (max, entity) => (entity.relationsCount > (max?.relationsCount || 0) ? entity : max),
      null as any
    );

    return {
      content: {
        totalChunks,
        avgChunkLength,
        totalTextLength,
      },
      structure: {
        avgDepth: Math.round(avgDepth * 100) / 100,
        maxDepthReached,
        pagesPerDepthLevel: depthCounts,
      },
      coverage: {
        pagesWithEntities,
        pagesWithoutEntities,
        orphanEntities,
        mostConnectedEntity: mostConnected?.name || null,
      },
    };
  }
}
