import { logger } from '@site-knowledge-graph/shared';
import { EntityType, EntitySource } from '@prisma/client';

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  source: EntitySource;
  confidence: number;
  aliases: string[];
  context?: string;
}

// Map Schema.org types to our internal EntityType
const SCHEMA_TYPE_MAP: Record<string, EntityType> = {
  Organization: 'ORGANIZATION',
  Corporation: 'ORGANIZATION',
  LocalBusiness: 'ORGANIZATION',
  Service: 'SERVICE',
  Product: 'PRODUCT',
  Person: 'PERSON',
  Place: 'LOCATION',
  PostalAddress: 'LOCATION',
  City: 'LOCATION',
  Country: 'LOCATION',
};

function mapSchemaType(schemaType: string): EntityType | null {
  // Handle full URIs
  const typeName = schemaType.replace('https://schema.org/', '').replace('http://schema.org/', '');

  return SCHEMA_TYPE_MAP[typeName] || null;
}

function extractEntityFromSchemaObject(schemaObj: any): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  if (!schemaObj || typeof schemaObj !== 'object') {
    return entities;
  }

  const type = schemaObj['@type'];
  const name = schemaObj.name || schemaObj.legalName;

  if (type && name) {
    const entityType = mapSchemaType(type);

    if (entityType) {
      const aliases: string[] = [];

      if (schemaObj.alternateName) {
        if (Array.isArray(schemaObj.alternateName)) {
          aliases.push(...schemaObj.alternateName);
        } else {
          aliases.push(schemaObj.alternateName);
        }
      }

      if (schemaObj.legalName && schemaObj.legalName !== name) {
        aliases.push(schemaObj.legalName);
      }

      entities.push({
        name,
        type: entityType,
        source: 'SCHEMA',
        confidence: 1.0, // Schema.org data is highest confidence
        aliases: aliases.filter(Boolean),
        context: schemaObj.description,
      });
    }
  }

  // Recursively extract from nested objects
  for (const key of Object.keys(schemaObj)) {
    const value = schemaObj[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        entities.push(...extractEntityFromSchemaObject(item));
      }
    } else if (typeof value === 'object' && value !== null) {
      entities.push(...extractEntityFromSchemaObject(value));
    }
  }

  return entities;
}

export function extractEntitiesFromJsonLd(jsonLdBlocks: any[]): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  for (const block of jsonLdBlocks) {
    try {
      const extracted = extractEntityFromSchemaObject(block);
      entities.push(...extracted);
    } catch (error) {
      logger.debug({ error, block }, 'Failed to extract entities from JSON-LD block');
    }
  }

  return entities;
}

export function extractRelationshipsFromJsonLd(jsonLdBlocks: any[]): Array<{
  fromEntity: string;
  toEntity: string;
  relationType: string;
}> {
  const relationships: Array<{
    fromEntity: string;
    toEntity: string;
    relationType: string;
  }> = [];

  for (const block of jsonLdBlocks) {
    try {
      if (block['@type'] === 'Service' && block.provider) {
        const serviceName = block.name;
        const providerName = typeof block.provider === 'object'
          ? block.provider.name
          : block.provider;

        if (serviceName && providerName) {
          relationships.push({
            fromEntity: serviceName,
            toEntity: providerName,
            relationType: 'offered_by',
          });
        }
      }

      if (block['@type'] === 'Product' && block.manufacturer) {
        const productName = block.name;
        const manufacturerName = typeof block.manufacturer === 'object'
          ? block.manufacturer.name
          : block.manufacturer;

        if (productName && manufacturerName) {
          relationships.push({
            fromEntity: productName,
            toEntity: manufacturerName,
            relationType: 'provided_by',
          });
        }
      }
    } catch (error) {
      logger.debug({ error }, 'Failed to extract relationships from JSON-LD');
    }
  }

  return relationships;
}
