# Data Model

This document explains the database schema, relationships, and why certain design decisions were made.

## Overview

The Phase 0 database schema includes three core tables:

1. **Site** - Websites to be crawled
2. **Page** - Individual pages from sites
3. **CrawlJob** - Crawl job tracking and status

## Entity Relationship Diagram

```
┌─────────────┐
│    Site     │
│             │
│ id          │◄────┐
│ url         │     │
│ domain      │     │
│ status      │     │
│ ...         │     │
└─────────────┘     │
       │            │
       │ 1          │ 1
       │            │
       │ N          │ N
       │            │
       ▼            │
┌─────────────┐    │
│    Page     │    │
│             │    │
│ id          │    │
│ siteId      │────┘
│ url         │
│ contentHash │
│ status      │
│ ...         │
└─────────────┘

       │
       │ 1
       │
       │ N
       │
       ▼
┌─────────────┐
│  CrawlJob   │
│             │
│ id          │
│ siteId      │────┘
│ status      │
│ maxDepth    │
│ ...         │
└─────────────┘
```

## Schema Details

### Site

Represents a website that has been registered for crawling.

```prisma
model Site {
  id            String      @id @default(cuid())
  url           String      @unique
  domain        String
  title         String?
  description   String?
  status        SiteStatus  @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  lastCrawledAt DateTime?

  pages         Page[]
  crawlJobs     CrawlJob[]

  @@index([domain])
  @@index([status])
}
```

**Fields**:

- `id` - CUID for globally unique identifier
- `url` - Full URL of the site (e.g., "https://example.com")
- `domain` - Extracted domain (e.g., "example.com") for grouping
- `title` - Site title from homepage metadata
- `description` - Site description from homepage metadata
- `status` - Current state (PENDING, ACTIVE, PAUSED, COMPLETED, ERROR)
- `createdAt` - When site was registered
- `updatedAt` - Last modification timestamp
- `lastCrawledAt` - When site was last successfully crawled

**Relationships**:
- One site has many pages (1:N)
- One site has many crawl jobs (1:N)

**Indexes**:
- `domain` - For finding all sites on same domain
- `status` - For filtering active/completed sites

**Design Decisions**:
- `url` is unique to prevent duplicate registrations
- `domain` extracted for rate limiting per domain
- `status` enum for type-safe state management
- Nullable `title`/`description` (not always extractable)

### Page

Represents an individual web page that has been or will be crawled.

```prisma
model Page {
  id           String     @id @default(cuid())
  siteId       String
  url          String     @unique
  canonicalUrl String?
  title        String?
  contentHash  String?
  htmlContent  String?    @db.Text
  textContent  String?    @db.Text
  status       PageStatus @default(PENDING)
  depth        Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  crawledAt    DateTime?

  site         Site       @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId])
  @@index([status])
  @@index([contentHash])
}
```

**Fields**:

- `id` - CUID for page identifier
- `siteId` - Foreign key to parent site
- `url` - Full URL of the page (unique)
- `canonicalUrl` - Canonical URL if different from `url`
- `title` - Page title from `<title>` tag
- `contentHash` - SHA-256 hash of content for deduplication
- `htmlContent` - Raw HTML (stored as TEXT for large content)
- `textContent` - Extracted plain text (for search/processing)
- `status` - Crawl state (PENDING, CRAWLED, PROCESSING, COMPLETED, ERROR)
- `depth` - Distance from root page (0 = homepage)
- `createdAt` - When page was discovered
- `updatedAt` - Last modification
- `crawledAt` - When page was successfully fetched

**Relationships**:
- Many pages belong to one site (N:1)
- Cascade delete: if site deleted, all pages deleted

**Indexes**:
- `siteId` - For finding all pages of a site
- `status` - For querying pending/completed pages
- `contentHash` - For duplicate detection

**Design Decisions**:
- `url` is unique to prevent duplicates
- `canonicalUrl` handles URL variations pointing to same content
- `contentHash` enables fast duplicate detection without content comparison
- Both `htmlContent` and `textContent` stored for different use cases
- `depth` tracks crawl breadth (useful for limiting depth)
- `@db.Text` for potentially large HTML/text content

### CrawlJob

Tracks crawling jobs with status and progress.

```prisma
model CrawlJob {
  id             String         @id @default(cuid())
  siteId         String
  status         CrawlJobStatus @default(PENDING)
  maxDepth       Int            @default(3)
  maxPages       Int            @default(100)
  pagesProcessed Int            @default(0)
  startedAt      DateTime?
  completedAt    DateTime?
  errorMessage   String?        @db.Text
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  site           Site           @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId])
  @@index([status])
}
```

**Fields**:

- `id` - CUID for job identifier
- `siteId` - Foreign key to site being crawled
- `status` - Job state (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
- `maxDepth` - Maximum crawl depth (prevents infinite crawling)
- `maxPages` - Maximum pages to crawl (resource limit)
- `pagesProcessed` - Counter of pages crawled so far
- `startedAt` - When crawl began (nullable until started)
- `completedAt` - When crawl finished (nullable until completed)
- `errorMessage` - Error details if job failed
- `createdAt` - When job was created
- `updatedAt` - Last status update

**Relationships**:
- Many jobs belong to one site (N:1)
- Cascade delete: if site deleted, all jobs deleted

**Indexes**:
- `siteId` - For finding all jobs for a site
- `status` - For querying running/pending jobs

**Design Decisions**:
- Separate from Page to track job-level metadata
- `maxDepth` and `maxPages` configurable per job
- `pagesProcessed` for progress tracking
- `startedAt` and `completedAt` for duration calculation
- `errorMessage` for debugging failed jobs

## Enums

### SiteStatus

```prisma
enum SiteStatus {
  PENDING    # Registered but not crawled
  ACTIVE     # Currently being crawled
  PAUSED     # Crawling paused
  COMPLETED  # Successfully crawled
  ERROR      # Crawl failed
}
```

### PageStatus

```prisma
enum PageStatus {
  PENDING    # Discovered but not fetched
  CRAWLED    # Fetched but not processed
  PROCESSING # Being processed for entities (Phase 2)
  COMPLETED  # Fully processed
  ERROR      # Failed to fetch or process
}
```

### CrawlJobStatus

```prisma
enum CrawlJobStatus {
  PENDING    # Job created, not started
  RUNNING    # Currently crawling
  COMPLETED  # Successfully finished
  FAILED     # Error occurred
  CANCELLED  # Manually stopped
}
```

## Why Graph Tables Are Deferred

The current schema does **not** include:

- Entity (person, organization, concept)
- Relationship (entity-to-entity connections)
- EntityMention (page references to entities)

**Reasons**:

1. **Phase 0 is foundation only** - No business logic yet
2. **Crawling comes first (Phase 1)** - Need pages before extracting entities
3. **Schema will change** - Entity extraction approach unclear until Phase 2
4. **Simpler initial setup** - Fewer tables = easier to validate foundation
5. **Avoid over-engineering** - Don't build what we don't need yet

**Phase 2 Additions**:

When implementing knowledge graphs, the schema will add:

```prisma
model Entity {
  id        String     @id @default(cuid())
  name      String
  type      EntityType # PERSON, ORGANIZATION, LOCATION, CONCEPT, etc.
  metadata  Json?
  createdAt DateTime   @default(now())

  mentions       EntityMention[]
  relationships  Relationship[]  @relation("source")
  relatedFrom    Relationship[]  @relation("target")
}

model Relationship {
  id         String   @id @default(cuid())
  sourceId   String
  targetId   String
  type       String   # "works_for", "located_in", "related_to"
  confidence Float    # 0.0 to 1.0

  source     Entity   @relation("source", fields: [sourceId])
  target     Entity   @relation("target", fields: [targetId])
}

model EntityMention {
  id        String   @id @default(cuid())
  entityId  String
  pageId    String
  context   String   # Surrounding text
  position  Int      # Character offset in page

  entity    Entity   @relation(fields: [entityId])
  page      Page     @relation(fields: [pageId])
}
```

This will be added in Phase 2 when entity extraction is implemented.

## Indexes and Performance

**Current Indexes**:

- `Site.domain` - Fast lookup by domain (for rate limiting)
- `Site.status` - Filter sites by status
- `Page.siteId` - Find all pages for a site
- `Page.status` - Query pages by crawl status
- `Page.contentHash` - Duplicate detection
- `CrawlJob.siteId` - Find jobs for a site
- `CrawlJob.status` - Query active/pending jobs

**Future Indexes** (Phase 1+):
- `Page.url` - Already unique, but explicit index for lookups
- Full-text search on `Page.textContent`
- Composite index on `(siteId, depth)` for breadth-first crawling

## Data Integrity

**Cascading Deletes**:

- Deleting a Site deletes all associated Pages and CrawlJobs
- Prevents orphaned records
- Use with caution in production

**Unique Constraints**:

- `Site.url` - One record per site URL
- `Page.url` - One record per page URL

**Not Null Constraints**:

- All timestamps (createdAt, updatedAt)
- All foreign keys (siteId)
- All status fields (default values provided)

## Prisma Client Generation

After schema changes:

```bash
npx prisma generate  # Generate TypeScript client
npx prisma migrate dev --name description  # Create and apply migration
```

The generated client provides:
- Type-safe queries
- Auto-complete in IDE
- Runtime validation

## Migration Strategy

**Development**:
- Use `prisma migrate dev` for iterative changes
- Migrations stored in `apps/api/prisma/migrations/`

**Production** (Future):
- Use `prisma migrate deploy` for applying migrations
- Never use `db push` (data loss risk)
- Always backup before migration

## Summary

The Phase 0 schema provides:

1. **Core entities** for site crawling (Site, Page, CrawlJob)
2. **Proper relationships** with foreign keys and cascade
3. **Performance indexes** for common queries
4. **Type safety** through Prisma enums
5. **Extensibility** for future phases

Graph-related tables are intentionally deferred to Phase 2 to avoid over-engineering and focus on getting the foundation right first.
