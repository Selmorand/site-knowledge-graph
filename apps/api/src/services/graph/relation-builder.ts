import { prisma } from '@/db/client';
import { EntitySource } from '@prisma/client';
import { logger } from '@site-knowledge-graph/shared';

export interface EntityRelationData {
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  weight: number;
  source: EntitySource;
}

export class RelationBuilder {
  private relationMap: Map<string, EntityRelationData> = new Map();

  constructor(_siteId: string) {
    // siteId kept for potential future use
  }

  addRelation(data: EntityRelationData): void {
    const key = this.makeKey(data.fromEntityId, data.toEntityId, data.relationType);

    const existing = this.relationMap.get(key);

    if (existing) {
      // Increase weight for repeated relationships
      existing.weight += data.weight;

      // Prefer SCHEMA source
      if (data.source === 'SCHEMA') {
        existing.source = 'SCHEMA';
      }
    } else {
      this.relationMap.set(key, { ...data });
    }
  }

  addMentionRelation(fromEntityId: string, toEntityId: string, source: EntitySource = 'STRUCTURE'): void {
    this.addRelation({
      fromEntityId,
      toEntityId,
      relationType: 'mentioned_with',
      weight: 0.5,
      source,
    });
  }

  async saveRelations(): Promise<void> {
    const relations = Array.from(this.relationMap.values());

    logger.info({ count: relations.length }, 'Saving entity relations');

    for (const relation of relations) {
      try {
        await prisma.entityRelation.upsert({
          where: {
            fromEntityId_toEntityId_relationType: {
              fromEntityId: relation.fromEntityId,
              toEntityId: relation.toEntityId,
              relationType: relation.relationType,
            },
          },
          update: {
            weight: relation.weight,
            source: relation.source,
          },
          create: {
            fromEntityId: relation.fromEntityId,
            toEntityId: relation.toEntityId,
            relationType: relation.relationType,
            weight: relation.weight,
            source: relation.source,
          },
        });
      } catch (error) {
        logger.error({ error, relation }, 'Failed to save relation');
      }
    }

    logger.info({ count: relations.length }, 'Entity relations saved');
  }

  private makeKey(fromId: string, toId: string, type: string): string {
    return `${fromId}:${toId}:${type}`;
  }

  buildCoOccurrenceRelations(entityIds: string[]): void {
    // Create relationships between entities that appear together
    for (let i = 0; i < entityIds.length; i++) {
      for (let j = i + 1; j < entityIds.length; j++) {
        // Bidirectional co-occurrence
        this.addMentionRelation(entityIds[i], entityIds[j], 'STRUCTURE');
        this.addMentionRelation(entityIds[j], entityIds[i], 'STRUCTURE');
      }
    }
  }

  getRelationCount(): number {
    return this.relationMap.size;
  }
}
