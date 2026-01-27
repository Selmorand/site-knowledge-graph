import * as cheerio from 'cheerio';
import { logger } from '@site-knowledge-graph/shared';
import { EntityType } from '@prisma/client';
import { ExtractedEntity } from './schema-extractor';

export interface ContentChunkData {
  headingPath: string[];
  text: string;
  position: number;
}

export function extractChunksFromHtml(html: string): ContentChunkData[] {
  const chunks: ContentChunkData[] = [];

  try {
    const $ = cheerio.load(html);

    // Remove scripts, styles, nav, header, footer
    $('script, style, nav, header, footer, aside').remove();

    const headingStack: string[] = [];
    let position = 0;

    // Process main content
    $('body').find('*').each((_, element) => {
      const tagName = element.tagName.toLowerCase();

      // Track heading hierarchy
      if (/^h[1-3]$/.test(tagName)) {
        const level = parseInt(tagName[1]);
        const text = $(element).text().trim();

        // Update heading stack
        headingStack.splice(level - 1);
        headingStack[level - 1] = text;
      }

      // Create chunks from paragraphs or divs with substantial text
      if (tagName === 'p' || tagName === 'div' || tagName === 'section') {
        const text = $(element).clone().children().remove().end().text().trim();

        if (text.length > 50) {
          chunks.push({
            headingPath: [...headingStack].filter(Boolean),
            text,
            position: position++,
          });
        }
      }
    });
  } catch (error) {
    logger.debug({ error }, 'Failed to extract chunks from HTML');
  }

  return chunks;
}

export function extractEntitiesFromHeadings(metadata: any): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  if (!metadata?.headings) return entities;

  const { h1, h2, h3 } = metadata.headings;

  // H1 headings are often page topics or main entities
  if (Array.isArray(h1)) {
    for (const heading of h1) {
      if (heading && heading.trim().length > 2) {
        entities.push({
          name: heading.trim(),
          type: 'TOPIC',
          source: 'STRUCTURE',
          confidence: 0.8,
          aliases: [],
        });
      }
    }
  }

  // H2 and H3 can be services, products, or sub-topics
  const subheadings = [...(h2 || []), ...(h3 || [])];
  for (const heading of subheadings) {
    if (heading && heading.trim().length > 2) {
      // Simple heuristics for type detection
      const lower = heading.toLowerCase();
      let type: EntityType = 'TOPIC';

      if (lower.includes('service') || lower.includes('solution')) {
        type = 'SERVICE';
      } else if (lower.includes('product')) {
        type = 'PRODUCT';
      }

      entities.push({
        name: heading.trim(),
        type,
        source: 'STRUCTURE',
        confidence: 0.6,
        aliases: [],
      });
    }
  }

  return entities;
}

export function extractEntitiesFromNavigation(html: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  try {
    const $ = cheerio.load(html);

    // Extract from navigation menus
    $('nav a, [role="navigation"] a').each((_, element) => {
      const text = $(element).text().trim();

      if (text && text.length > 2 && text.length < 50) {
        // Nav items are often services or topics
        const lower = text.toLowerCase();
        let type: EntityType = 'SERVICE';

        if (lower.includes('about') || lower.includes('contact') || lower.includes('team')) {
          type = 'TOPIC';
        }

        entities.push({
          name: text,
          type,
          source: 'STRUCTURE',
          confidence: 0.5,
          aliases: [],
        });
      }
    });
  } catch (error) {
    logger.debug({ error }, 'Failed to extract entities from navigation');
  }

  return entities;
}

export function extractEntitiesFromBreadcrumbs(html: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  try {
    const $ = cheerio.load(html);

    // Look for breadcrumb patterns
    $('[itemtype*="BreadcrumbList"] a, .breadcrumb a, [aria-label="breadcrumb"] a').each((_, element) => {
      const text = $(element).text().trim();

      if (text && text.length > 2 && text.length < 50) {
        entities.push({
          name: text,
          type: 'TOPIC',
          source: 'STRUCTURE',
          confidence: 0.7,
          aliases: [],
        });
      }
    });
  } catch (error) {
    logger.debug({ error }, 'Failed to extract entities from breadcrumbs');
  }

  return entities;
}
