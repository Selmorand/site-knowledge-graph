export interface SiteReport {
  site: SiteInfo;
  crawlStats: CrawlStats;
  pages: PageInfo[];
  chunks: ChunkInfo[];
  entities: EntityInfo[];
  relationships: RelationshipInfo[];
  summaries: ReportSummaries;
  metadata: ReportMetadata;
}

export interface SiteInfo {
  id: string;
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
  status: string;
  lastCrawledAt: Date | null;
}

export interface CrawlStats {
  totalPages: number;
  maxDepth: number;
  pagesCompleted: number;
  pagesPending: number;
  pagesError: number;
  crawlDuration: number | null;
  lastCrawlJobStatus: string | null;
  fetchMethods: {
    http: number;
    playwright: number;
  };
}

export interface PageInfo {
  id: string;
  url: string;
  title: string | null;
  depth: number;
  status: string;
  fetchMethod: string | null;
  crawledAt: Date | null;
  entityCount: number;
  chunkCount: number;
}

export interface ChunkInfo {
  id: string;
  pageUrl: string;
  headingPath: string[];
  text: string;
  position: number;
}

export interface EntityInfo {
  id: string;
  name: string;
  type: string;
  aliases: string[];
  source: string;
  confidence: number;
  mentionCount: number;
  pagesMentioned: string[];
  relationsCount: number;
}

export interface RelationshipInfo {
  id: string;
  fromEntityName: string;
  fromEntityType: string;
  toEntityName: string;
  toEntityType: string;
  relationType: string;
  weight: number;
  source: string;
}

export interface ReportSummaries {
  content: {
    totalChunks: number;
    avgChunkLength: number;
    totalTextLength: number;
  };
  structure: {
    avgDepth: number;
    maxDepthReached: number;
    pagesPerDepthLevel: Record<number, number>;
  };
  coverage: {
    pagesWithEntities: number;
    pagesWithoutEntities: number;
    orphanEntities: number;
    mostConnectedEntity: string | null;
  };
}

export interface ReportMetadata {
  toolName: string;
  toolVersion: string;
  generatedAt: Date;
  reportId: string;
}
