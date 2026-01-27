# Project Overview

## Problem Statement

Developers, educators, and researchers often need to:

1. Extract structured knowledge from websites they own or have permission to access
2. Build knowledge graphs to understand relationships between concepts
3. Generate quiz questions and learning materials from content

Existing solutions either:
- Require expensive third-party services
- Don't respect website ownership and ethical crawling
- Lack integration between crawling, graph building, and question generation
- Send data to external servers (privacy concerns)

## Solution

`site-knowledge-graph` is a **local-first, privacy-respecting** application that:

- Crawls websites ethically (with permission, respecting robots.txt)
- Extracts and structures content
- Builds knowledge graphs automatically
- Generates question-answer pairs
- Keeps all data local (no external API calls for storage)

## Goals

### Primary Goals

1. **Ethical Crawling**: Respect website owners, robots.txt, and rate limits
2. **Local-First**: All data processing happens on user's machine
3. **Type-Safe**: Comprehensive TypeScript coverage with strict mode
4. **Extensible**: Clean architecture allowing feature additions
5. **Production-Ready**: Real code, no placeholders, comprehensive error handling

### Secondary Goals

- Fast performance with efficient caching
- Easy setup with Docker
- Clear documentation for each phase
- Reusable shared utilities and types

## Non-Goals

### What This Project Is NOT

1. **Not a web scraper service**: Users must have permission to crawl sites
2. **Not cloud-based**: Designed for local deployment only
3. **Not a general-purpose crawler**: Focused on knowledge extraction, not archiving
4. **Not a SaaS**: No user accounts, payments, or hosted infrastructure
5. **Not immediate**: Built in phases, not all features available at once

### Explicitly Out of Scope

- Real-time crawling
- Distributed crawling across machines
- JavaScript-heavy SPA crawling (Phase 0-1)
- Image processing and OCR
- Multi-language translation
- Web UI (API-first approach)

## Phased Roadmap

### Phase 0: Foundation ✅

**Status**: Complete

**Duration**: Initial setup

**Deliverables**:
- Project structure (monorepo with workspaces)
- TypeScript configuration
- Fastify API server (skeleton)
- PostgreSQL + Redis with Docker
- Prisma ORM setup
- Database schema (Site, Page, CrawlJob)
- Development tooling (ESLint, Prettier)
- Documentation files

**Success Criteria**:
- All code compiles
- API server starts and responds to health checks
- Database migrations run successfully
- Docker containers start without errors

### Phase 1: Crawling Engine

**Status**: Not Started

**Duration**: ~2-3 weeks

**Goals**:
- Implement ethical web crawling
- Extract content from HTML pages
- Store and deduplicate pages

**Key Features**:
- URL queue management with Redis
- robots.txt parser and validator
- Rate limiting per domain
- HTML content extraction
- Content hashing for deduplication
- Canonical URL handling
- Sitemap.xml parsing
- Crawl job status tracking

**New Endpoints**:
- `POST /api/sites` - Register a site for crawling
- `POST /api/sites/:id/crawl` - Start crawl job
- `GET /api/sites/:id/status` - Get crawl status
- `GET /api/pages` - List crawled pages
- `GET /api/pages/:id` - Get page details

**Success Criteria**:
- Can crawl a 50-page site in < 5 minutes
- Respects robots.txt 100% of the time
- No duplicate pages stored
- Handles network errors gracefully

### Phase 2: Knowledge Graph

**Status**: Not Started

**Duration**: ~3-4 weeks

**Goals**:
- Extract entities and relationships from pages
- Build and query knowledge graphs

**Key Features**:
- Entity extraction (people, places, concepts, dates)
- Relationship detection between entities
- Graph database schema (extend Prisma)
- Entity deduplication and linking
- Graph traversal and querying
- Export graph in standard formats (JSON-LD, RDF)

**New Models**:
- Entity (person, organization, concept, etc.)
- Relationship (entity-to-entity connections)
- EntityMention (page references to entities)

**New Endpoints**:
- `POST /api/sites/:id/extract` - Extract entities from crawled pages
- `GET /api/entities` - List entities
- `GET /api/entities/:id` - Entity details with relationships
- `GET /api/graph` - Query graph with filters
- `GET /api/graph/export` - Export graph data

**Success Criteria**:
- Extracts entities with >80% accuracy
- Links related entities correctly
- Graph queries return results in <500ms

### Phase 3: Question Generation

**Status**: Not Started

**Duration**: ~2-3 weeks

**Goals**:
- Generate question-answer pairs from knowledge graph
- Support multiple question types
- Export for use in learning systems

**Key Features**:
- LLM integration (local or API-based)
- Question generation from entity relationships
- Answer extraction and validation
- Multiple question types (factual, conceptual, application)
- Difficulty scoring
- Export to standard formats (JSON, CSV, Moodle XML)

**New Models**:
- Question
- Answer
- QuestionType

**New Endpoints**:
- `POST /api/sites/:id/generate-questions` - Generate Q&A pairs
- `GET /api/questions` - List questions
- `GET /api/questions/:id` - Question details
- `GET /api/questions/export` - Export in various formats

**Success Criteria**:
- Generates 100+ questions from 50-page site
- Questions are grammatically correct
- Answers are factually accurate based on source content
- Supports at least 3 export formats

## Future Considerations (Post Phase 3)

- Phase 4: Web UI with React
- Phase 5: Advanced crawling (JavaScript rendering, authentication)
- Phase 6: Collaborative features (share graphs, questions)
- Phase 7: Machine learning improvements (custom entity extraction)

## Technical Decisions

### Why Fastify?

- Excellent TypeScript support
- High performance
- Rich plugin ecosystem
- Schema validation built-in

### Why PostgreSQL?

- Strong relational integrity for site/page relationships
- JSONB support for flexible metadata
- Full-text search capabilities
- Mature ecosystem and tooling

### Why Prisma?

- Type-safe database queries
- Automatic migrations
- Great developer experience
- Client generation from schema

### Why Redis?

- Fast queue management for crawl jobs
- Caching layer for frequent queries
- Simple pub/sub for future real-time features

### Why Monorepo?

- Share types between packages
- Consistent tooling and dependencies
- Easier refactoring across boundaries
- Single source of truth

## Success Metrics

### Phase 0
- ✅ Project compiles without errors
- ✅ API responds to health checks
- ✅ Database migrations run successfully

### Phase 1
- Crawl 100 pages in <10 minutes
- Zero robots.txt violations
- <1% duplicate pages stored

### Phase 2
- Extract entities from 100 pages in <5 minutes
- Entity accuracy >80%
- Graph queries <500ms

### Phase 3
- Generate 100 questions in <2 minutes
- Question quality >85% (human evaluation)
- Support 3+ export formats

## Timeline Estimate

- Phase 0: Complete
- Phase 1: 2-3 weeks
- Phase 2: 3-4 weeks
- Phase 3: 2-3 weeks

**Total**: ~8-10 weeks for MVP (all 3 phases)

## Next Steps

With Phase 0 complete, the next immediate tasks for Phase 1 are:

1. Implement robots.txt parser
2. Create URL queue in Redis
3. Build HTTP client with rate limiting
4. Implement HTML content extractor
5. Add crawl job worker process

Refer to `claude.md` for development rules before starting Phase 1.
