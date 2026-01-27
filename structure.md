# Project Structure

This document explains the responsibility of each folder and how future phases integrate into the architecture.

## Root Structure

```
site-knowledge-graph/
├── apps/              # Application code
├── packages/          # Shared libraries
├── infra/            # Infrastructure configuration
├── scripts/          # Utility scripts
├── .env.example      # Environment template
├── package.json      # Root package config (workspaces)
├── tsconfig.base.json # Base TypeScript config
└── *.md              # Documentation
```

## Apps Directory

Location: `apps/`

**Purpose**: Executable applications

**Current**:
- `api/` - Fastify REST API server

**Future Phases**:
- `worker/` (Phase 1) - Background job processor for crawling
- `web/` (Post Phase 3) - React web interface

### apps/api

The main API server built with Fastify.

```
apps/api/
├── src/
│   ├── routes/        # HTTP route handlers
│   ├── services/      # Business logic layer
│   ├── db/           # Database clients
│   ├── config/       # Configuration management
│   ├── utils/        # API-specific utilities
│   └── index.ts      # Application entry point
├── prisma/
│   └── schema.prisma # Database schema definition
├── package.json      # Dependencies
└── tsconfig.json     # TypeScript config
```

**Responsibilities**:

- **routes/**: Define HTTP endpoints, validate requests, call services
  - Keep thin - validation and delegation only
  - Return proper HTTP status codes
  - Example: `health.routes.ts`, `sites.routes.ts` (Phase 1)

- **services/**: Business logic and orchestration
  - Database operations through Prisma
  - External service calls
  - Complex business rules
  - Example: `health.service.ts`, `crawl.service.ts` (Phase 1)

- **db/**: Database connection and client management
  - Prisma client initialization
  - Redis client initialization
  - Connection lifecycle (connect/disconnect)

- **config/**: Application configuration
  - Environment variable validation
  - Configuration object creation
  - Secrets management

- **utils/**: Utility functions specific to API
  - Request validation helpers
  - Response formatters
  - Error handling utilities

**Future Additions** (Phase 1+):
- `routes/sites.routes.ts` - Site management endpoints
- `routes/pages.routes.ts` - Page query endpoints
- `routes/crawl.routes.ts` - Crawl job management
- `services/crawl.service.ts` - Crawl orchestration
- `services/site.service.ts` - Site CRUD operations

## Packages Directory

Location: `packages/`

**Purpose**: Shared code reusable across apps

**Current**:
- `shared/` - Types, constants, utilities

**Future Phases**:
- `crawler/` (Phase 1) - Core crawling logic
- `extractor/` (Phase 2) - Entity and relationship extraction
- `graph/` (Phase 2) - Knowledge graph operations
- `question-gen/` (Phase 3) - Question generation engine

### packages/shared

Shared utilities, types, and constants.

```
packages/shared/
├── src/
│   ├── types/        # TypeScript type definitions
│   ├── constants/    # Application constants
│   ├── logger.ts     # Logging utility
│   └── index.ts      # Package exports
├── package.json
└── tsconfig.json
```

**Responsibilities**:

- **types/**: Shared TypeScript interfaces and types
  - `common.ts` - Generic types (Result, PaginatedResponse)
  - `site.ts` - Site/Page/CrawlJob enums and interfaces
  - Domain model types shared across apps

- **constants/**: Application-wide constants
  - Configuration defaults
  - HTTP status codes
  - Cache TTL values
  - Magic numbers and strings

- **logger.ts**: Centralized logging utility
  - Pino logger instance
  - Log formatting
  - Environment-aware configuration

**Why Shared?**
- API and worker (Phase 1) need same types
- Ensures consistency across codebase
- Single source of truth for domain models

**Future Additions**:
- `types/entity.ts` (Phase 2) - Entity and relationship types
- `types/question.ts` (Phase 3) - Question/answer types
- Validation schemas shared between apps

### Future: packages/crawler (Phase 1)

```
packages/crawler/
├── src/
│   ├── queue/        # URL queue management
│   ├── fetcher/      # HTTP client with rate limiting
│   ├── parser/       # HTML parsing and content extraction
│   ├── robots/       # robots.txt handling
│   └── index.ts
```

**Responsibilities**:
- URL normalization and validation
- robots.txt parsing and caching
- HTTP requests with retry logic
- HTML to text extraction
- Content deduplication

**Why Separate Package?**
- Complex logic isolated from API
- Reusable in different contexts (CLI, worker)
- Easier to test independently
- Clear boundary for crawling domain

## Infrastructure Directory

Location: `infra/`

**Purpose**: Infrastructure as code and service configuration

```
infra/
└── docker-compose.yml  # PostgreSQL + Redis containers
```

**Future Additions**:
- `kubernetes/` - K8s manifests for production
- `nginx/` - Reverse proxy configuration
- `monitoring/` - Prometheus/Grafana setup

## Scripts Directory

Location: `scripts/`

**Purpose**: Development and deployment automation

**Current**:
- `setup.sh` - Initial project setup (Linux/macOS)
- `setup.ps1` - Initial project setup (Windows)

**Future Additions**:
- `seed-db.ts` - Database seeding for development
- `backup.sh` - Database backup automation
- `deploy.sh` - Production deployment
- `benchmark.ts` - Performance testing

## How Future Phases Plug In

### Phase 1: Crawling Engine

**New Folders**:
- `apps/worker/` - Background job processor
- `packages/crawler/` - Crawling logic

**Integration Points**:
- API creates CrawlJob records
- Worker picks up jobs from Redis queue
- Worker uses `@site-knowledge-graph/crawler`
- Worker updates job status in database
- Shared types in `packages/shared`

**Data Flow**:
```
User -> API (POST /sites/:id/crawl)
     -> Creates CrawlJob
     -> Pushes to Redis queue
     -> Worker picks job
     -> Crawler processes URLs
     -> Stores Pages in DB
     -> Updates CrawlJob status
```

### Phase 2: Knowledge Graph

**New Folders**:
- `packages/extractor/` - NLP and entity extraction
- `packages/graph/` - Graph operations and queries

**Integration Points**:
- New Prisma models (Entity, Relationship, EntityMention)
- API endpoints for graph queries
- Worker processes pages for entity extraction
- Graph package provides query DSL

**Data Flow**:
```
Pages (from Phase 1)
  -> Extractor finds entities
  -> Creates Entity records
  -> Finds relationships
  -> Creates Relationship records
  -> Stores EntityMention for provenance
```

### Phase 3: Question Generation

**New Folders**:
- `packages/question-gen/` - LLM integration and generation

**Integration Points**:
- New Prisma models (Question, Answer)
- API endpoints for generation and export
- Uses graph from Phase 2
- Optional LLM API integration

**Data Flow**:
```
Entities + Relationships (from Phase 2)
  -> Question generator creates prompts
  -> LLM generates questions
  -> Validator checks answers
  -> Stores Question records
  -> Exports in multiple formats
```

## Architectural Principles

### Separation of Concerns

- **routes/** - HTTP layer (thin)
- **services/** - Business logic (orchestration)
- **packages/** - Domain logic (reusable)
- **db/** - Data access (isolated)

### Dependency Flow

```
routes -> services -> packages -> db
```

Never:
- routes directly accessing database
- packages importing from apps
- circular dependencies

### Shared Code Strategy

**Include in `packages/shared`**:
- Types used by 2+ apps
- Constants used application-wide
- Utilities with no external dependencies

**Extract to dedicated package**:
- Complex domain logic
- 500+ lines of code
- Needs independent testing
- Reusable across projects

### Testing Strategy (Future)

```
packages/*/
  tests/
    unit/      # Pure function tests
    integration/ # With test database

apps/*/
  tests/
    e2e/       # Full API tests
```

## Configuration Management

**Environment Variables**:
- Defined in `.env.example`
- Validated in `apps/api/src/config/env.ts`
- Never committed (in `.gitignore`)

**Application Config**:
- Constants in `packages/shared/src/constants/`
- Environment-specific in `apps/*/src/config/`

## Database Schema Location

**Primary**: `apps/api/prisma/schema.prisma`

**Why here?**
- API owns data access
- Migrations run from API
- Prisma client generated in API

**Phase 2 Note**:
- Graph models added to same schema
- Consider multi-schema if graph becomes very large

## Build and Development

**Development**:
```bash
npm run dev  # Starts API with hot reload
```

**Build**:
```bash
npm run build  # Builds all packages and apps
```

**Workspace Benefits**:
- Hoisted dependencies (faster installs)
- Cross-package references
- Single command builds all
- Consistent tooling

## Summary

The project structure is designed for:

1. **Clarity**: Each folder has clear responsibility
2. **Scalability**: Easy to add phases without restructuring
3. **Maintainability**: Separation of concerns prevents spaghetti
4. **Reusability**: Packages can be used independently
5. **Type Safety**: Shared types ensure consistency

As phases progress, the structure grows organically without breaking existing code.
