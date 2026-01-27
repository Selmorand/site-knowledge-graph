import { prisma } from '@/db/client';
import { EntityType, EntitySource } from '@prisma/client';
import { logger } from '@site-knowledge-graph/shared';
import { ExtractedEntity } from './schema-extractor';
import {
  normalizeEntityName,
  shouldMergeEntities,
  selectCanonicalName,
} from '@/utils/entity-utils';

export interface ResolvedEntity {
  id: string;
  name: string;
  type: EntityType;
  aliases: string[];
  source: EntitySource;
  confidence: number;
}

export class EntityResolver {
  private siteId: string;
  private entityCache: Map<string, ResolvedEntity> = new Map();

  constructor(siteId: string) {
    this.siteId = siteId;
  }

  async loadExistingEntities(): Promise<void> {
    const entities = await prisma.entity.findMany({
      where: { siteId: this.siteId },
    });

    for (const entity of entities) {
      const key = this.makeKey(entity.name, entity.type);
      this.entityCache.set(key, {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        aliases: entity.aliases,
        source: entity.source,
        confidence: entity.confidence,
      });
    }

    logger.info(
      { siteId: this.siteId, count: entities.length },
      'Loaded existing entities into cache'
    );
  }

  async resolveEntity(extracted: ExtractedEntity): Promise<ResolvedEntity> {
    // Check cache for exact match
    const exactKey = this.makeKey(extracted.name, extracted.type);
    if (this.entityCache.has(exactKey)) {
      return this.entityCache.get(exactKey)!;
    }

    // Check for similar entities that should be merged
    const similar = this.findSimilarEntity(extracted.name, extracted.type);

    if (similar) {
      // Merge with existing entity
      return this.mergeWithExisting(similar, extracted);
    }

    // Create new entity
    return this.createNewEntity(extracted);
  }

  private findSimilarEntity(name: string, type: EntityType): ResolvedEntity | null {
    for (const entity of this.entityCache.values()) {
      if (entity.type !== type) continue;

      // Check if names should be merged
      if (shouldMergeEntities(name, entity.name)) {
        return entity;
      }

      // Check aliases
      for (const alias of entity.aliases) {
        if (shouldMergeEntities(name, alias)) {
          return entity;
        }
      }
    }

    return null;
  }

  private async mergeWithExisting(
    existing: ResolvedEntity,
    extracted: ExtractedEntity
  ): Promise<ResolvedEntity> {
    // Add new name/aliases if not already present
    const allNames = [existing.name, ...existing.aliases, extracted.name, ...extracted.aliases];
    const uniqueNames = [...new Set(allNames.map(normalizeEntityName))];

    // Select canonical name (prefer schema source, then longest)
    const canonical = extracted.source === 'SCHEMA'
      ? extracted.name
      : selectCanonicalName(uniqueNames);

    const aliases = uniqueNames.filter(n => normalizeEntityName(n) !== normalizeEntityName(canonical));

    // Update confidence (use highest)
    const newConfidence = Math.max(existing.confidence, extracted.confidence);

    // Prefer SCHEMA source over others
    const newSource = existing.source === 'SCHEMA' || extracted.source === 'SCHEMA'
      ? 'SCHEMA'
      : existing.source;

    // Update in database
    const updated = await prisma.entity.update({
      where: { id: existing.id },
      data: {
        name: canonical,
        aliases,
        confidence: newConfidence,
        source: newSource,
      },
    });

    // Update cache
    const resolved: ResolvedEntity = {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      aliases: updated.aliases,
      source: updated.source,
      confidence: updated.confidence,
    };

    this.entityCache.set(this.makeKey(canonical, updated.type), resolved);

    logger.debug(
      { existingName: existing.name, extractedName: extracted.name, canonical },
      'Merged entities'
    );

    return resolved;
  }

  private async createNewEntity(extracted: ExtractedEntity): Promise<ResolvedEntity> {
    const entity = await prisma.entity.create({
      data: {
        siteId: this.siteId,
        name: extracted.name,
        type: extracted.type,
        aliases: extracted.aliases,
        source: extracted.source,
        confidence: extracted.confidence,
      },
    });

    const resolved: ResolvedEntity = {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      aliases: entity.aliases,
      source: entity.source,
      confidence: entity.confidence,
    };

    this.entityCache.set(this.makeKey(entity.name, entity.type), resolved);

    logger.debug({ name: entity.name, type: entity.type }, 'Created new entity');

    return resolved;
  }

  private makeKey(name: string, type: EntityType): string {
    return `${type}:${normalizeEntityName(name)}`;
  }

  getEntityByName(name: string, type: EntityType): ResolvedEntity | null {
    const key = this.makeKey(name, type);
    return this.entityCache.get(key) || null;
  }

  getAllEntities(): ResolvedEntity[] {
    return Array.from(this.entityCache.values());
  }
}
