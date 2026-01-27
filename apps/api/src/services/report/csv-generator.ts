import { SiteReport } from './types';

export function generatePagesCSV(report: SiteReport): string {
  const headers = ['URL', 'Title', 'Depth', 'Status', 'Fetch Method', 'Entity Count', 'Chunk Count', 'Crawled At'];

  const rows = report.pages.map(page => [
    page.url,
    page.title || '',
    page.depth.toString(),
    page.status,
    page.fetchMethod || '',
    page.entityCount.toString(),
    page.chunkCount.toString(),
    page.crawledAt ? new Date(page.crawledAt).toISOString() : '',
  ]);

  return formatCSV([headers, ...rows]);
}

export function generateEntitiesCSV(report: SiteReport): string {
  const headers = [
    'Name',
    'Type',
    'Source',
    'Confidence',
    'Mention Count',
    'Relations Count',
    'Pages Mentioned',
    'Aliases',
  ];

  const rows = report.entities.map(entity => [
    entity.name,
    entity.type,
    entity.source,
    entity.confidence.toString(),
    entity.mentionCount.toString(),
    entity.relationsCount.toString(),
    entity.pagesMentioned.join('; '),
    entity.aliases.join('; '),
  ]);

  return formatCSV([headers, ...rows]);
}

export function generateRelationshipsCSV(report: SiteReport): string {
  const headers = [
    'From Entity',
    'From Type',
    'Relation Type',
    'To Entity',
    'To Type',
    'Weight',
    'Source',
  ];

  const rows = report.relationships.map(rel => [
    rel.fromEntityName,
    rel.fromEntityType,
    rel.relationType,
    rel.toEntityName,
    rel.toEntityType,
    rel.weight.toString(),
    rel.source,
  ]);

  return formatCSV([headers, ...rows]);
}

function formatCSV(rows: string[][]): string {
  return rows
    .map(row =>
      row
        .map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escaped = cell.replace(/"/g, '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(',')
    )
    .join('\n');
}
