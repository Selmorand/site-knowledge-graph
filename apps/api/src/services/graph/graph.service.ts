import { prisma } from '@/db/client';
import { logger } from '@site-knowledge-graph/shared';
import { extractEntitiesFromJsonLd, extractRelationshipsFromJsonLd } from './schema-extractor';
import {
  extractChunksFromHtml,
  extractEntitiesFromHeadings,
  extractEntitiesFromNavigation,
  extractEntitiesFromBreadcrumbs,
} from './content-extractor';
import { EntityResolver } from './entity-resolver';
import { RelationBuilder } from './relation-builder';

export class GraphService {
  private siteId: string;

  constructor(siteId: string) {
    this.siteId = siteId;
  }

  async buildGraph(): Promise<{
    entitiesCreated: number;
    relationsCreated: number;
    pagesProcessed: number;
  }> {
    logger.info({ siteId: this.siteId }, 'Starting graph build');

    const resolver = new EntityResolver(this.siteId);
    await resolver.loadExistingEntities();

    const relationBuilder = new RelationBuilder(this.siteId);

    // Get all completed pages for this site
    const pages = await prisma.page.findMany({
      where: {
        siteId: this.siteId,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        url: true,
        htmlContent: true,
        renderedHtml: true,
        textContent: true,
        metadata: true,
      },
    });

    logger.info({ pageCount: pages.length }, 'Processing pages for graph building');

    let pagesProcessed = 0;

    for (const page of pages) {
      try {
        logger.info({ url: page.url, pageId: page.id }, 'Processing page for graph');
        await this.processPage(page, resolver, relationBuilder);
        pagesProcessed++;

        logger.info({
          url: page.url,
          pagesProcessed,
          total: pages.length
        }, 'Page processed successfully');

        if (pagesProcessed % 10 === 0) {
          logger.info({ pagesProcessed, total: pages.length }, 'Graph build progress');
        }
      } catch (error) {
        logger.error({ error, pageId: page.id, url: page.url }, 'Failed to process page for graph');
      }
    }

    // Save all relations
    await relationBuilder.saveRelations();

    const stats = {
      entitiesCreated: resolver.getAllEntities().length,
      relationsCreated: relationBuilder.getRelationCount(),
      pagesProcessed,
    };

    logger.info(stats, 'Graph build completed');

    return stats;
  }

  private async processPage(
    page: any,
    resolver: EntityResolver,
    relationBuilder: RelationBuilder
  ): Promise<void> {
    const pageEntities: string[] = [];

    // 1. Extract entities from JSON-LD (highest priority)
    if (page.metadata?.jsonLd && Array.isArray(page.metadata.jsonLd)) {
      const schemaEntities = extractEntitiesFromJsonLd(page.metadata.jsonLd);

      for (const extracted of schemaEntities) {
        const resolved = await resolver.resolveEntity(extracted);
        pageEntities.push(resolved.id);

        // Create entity mention
        await this.createEntityMention(
          resolved.id,
          page.id,
          extracted.context || page.textContent?.substring(0, 200) || ''
        );
      }

      // Extract relationships from JSON-LD
      const schemaRelations = extractRelationshipsFromJsonLd(page.metadata.jsonLd);
      for (const rel of schemaRelations) {
        const fromEntity = resolver.getAllEntities().find(e => e.name === rel.fromEntity);
        const toEntity = resolver.getAllEntities().find(e => e.name === rel.toEntity);

        if (fromEntity && toEntity) {
          relationBuilder.addRelation({
            fromEntityId: fromEntity.id,
            toEntityId: toEntity.id,
            relationType: rel.relationType,
            weight: 1.0,
            source: 'SCHEMA',
          });
        }
      }
    }

    // 2. Extract entities from headings
    if (page.metadata?.headings) {
      const headingEntities = extractEntitiesFromHeadings(page.metadata);

      for (const extracted of headingEntities) {
        const resolved = await resolver.resolveEntity(extracted);

        if (!pageEntities.includes(resolved.id)) {
          pageEntities.push(resolved.id);

          await this.createEntityMention(
            resolved.id,
            page.id,
            extracted.name
          );
        }
      }
    }

    // 3. Extract from navigation and breadcrumbs
    const html = page.renderedHtml || page.htmlContent;
    if (html) {
      const navEntities = extractEntitiesFromNavigation(html);
      const breadcrumbEntities = extractEntitiesFromBreadcrumbs(html);

      const structuralEntities = [...navEntities, ...breadcrumbEntities];

      for (const extracted of structuralEntities) {
        const resolved = await resolver.resolveEntity(extracted);

        if (!pageEntities.includes(resolved.id)) {
          pageEntities.push(resolved.id);

          await this.createEntityMention(
            resolved.id,
            page.id,
            extracted.name
          );
        }
      }

      // 4. Create content chunks
      const chunks = extractChunksFromHtml(html);
      for (const chunkData of chunks.slice(0, 20)) { // Limit to 20 chunks per page
        await prisma.contentChunk.create({
          data: {
            pageId: page.id,
            headingPath: chunkData.headingPath,
            text: chunkData.text,
            position: chunkData.position,
          },
        });
      }
    }

    // 5. Build co-occurrence relationships
    if (pageEntities.length > 1) {
      relationBuilder.buildCoOccurrenceRelations(pageEntities);
    }
  }

  private async createEntityMention(
    entityId: string,
    pageId: string,
    context: string,
    chunkId?: string
  ): Promise<void> {
    try {
      await prisma.entityMention.create({
        data: {
          entityId,
          pageId,
          chunkId,
          contextSnippet: context.substring(0, 500),
          position: 0,
        },
      });
    } catch (error) {
      // Ignore duplicate mentions
      logger.debug({ error, entityId, pageId }, 'Entity mention already exists');
    }
  }
}
