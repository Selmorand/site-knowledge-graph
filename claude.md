# Claude Development Guide

## Project Intent

`site-knowledge-graph` is a **local-first application** designed to crawl websites with explicit owner permission, extract structured content, and prepare data for knowledge graph generation and question-answer pair creation.

This project is developed in **phases** to ensure clean, maintainable architecture at each step.

## Architectural Rules

### Core Principles

1. **Permission First**: Never crawl a website without explicit owner permission
2. **Type Safety**: TypeScript everywhere with strict mode enabled
3. **Validation**: Use Zod for all input validation
4. **Clean Architecture**: Separate concerns across layers (routes, services, data)
5. **No Pseudo-code**: All code must compile and run
6. **Local-First**: Data stays on the user's machine

### Technology Standards

- **Runtime**: Node.js LTS (v20+)
- **Language**: TypeScript with strict configuration
- **API Framework**: Fastify (chosen for performance and TypeScript support)
- **Database**: PostgreSQL (relational integrity for site/page relationships)
- **Cache/Queue**: Redis (for job management and caching)
- **ORM**: Prisma (type-safe database access)
- **Validation**: Zod (runtime type validation)

### Code Standards

- ESLint + Prettier for consistent formatting
- Monorepo structure with workspaces
- Shared types and utilities in `packages/shared`
- Environment variables validated with Zod
- Structured logging with Pino

## Phase-Based Development Philosophy

### Phase 0: Foundation (Current)

**Status**: Complete

**Goal**: Establish project skeleton with no business logic

**Deliverables**:
- Project structure
- Database schema (Site, Page, CrawlJob)
- API server (basic health checks only)
- Docker infrastructure
- Development tooling

**Rules**:
- No crawling logic
- No AI/ML logic
- Everything compiles
- Basic health checks only

### Phase 1: Crawling Engine (Next)

**Goal**: Implement ethical web crawling

**Key Features**:
- Respect robots.txt
- Rate limiting
- URL normalization
- Content extraction (HTML → text)
- Duplicate detection via content hashing

**Not Included**:
- Knowledge graph generation
- AI processing
- Question generation

### Phase 2: Knowledge Graph

**Goal**: Build entity and relationship extraction

**Key Features**:
- Entity recognition
- Relationship mapping
- Graph database schema
- Graph querying

### Phase 3: Question Generation

**Goal**: Generate Q&A pairs from knowledge graph

**Key Features**:
- LLM integration
- Question/answer generation
- Quality scoring
- Export functionality

## Hard Rules

### Security & Ethics

- **Never** bypass robots.txt
- **Never** crawl without permission
- **Always** include rate limiting
- **Always** respect server resources
- **Never** store sensitive data without encryption

### Development

- **Never** commit placeholder code
- **Never** use `any` type without justification
- **Always** validate external input
- **Always** handle errors gracefully
- **Always** log important operations

### Database

- **Always** use transactions for multi-step operations
- **Always** include timestamps (createdAt, updatedAt)
- **Always** use proper indexes
- **Never** expose raw database errors to clients

### API Design

- **Always** version APIs
- **Always** validate request bodies
- **Always** return consistent error formats
- **Never** expose internal implementation details

## Working with Claude Code

When continuing development:

1. **Read this file first** to understand context and constraints
2. **Check the current phase** in project.md
3. **Review the data model** in data-model.md
4. **Understand the structure** in structure.md
5. **Follow the rules** above strictly

When adding features:

- Stay within the current phase scope
- Update relevant documentation
- Add tests for new functionality
- Ensure TypeScript compilation
- Update CHANGELOG if present

## Quick Reference

### Start Development

```bash
# Setup (first time)
npm run infra:up
npm install
npm run db:migrate

# Development
npm run dev
```

### Common Commands

```bash
npm run build          # Build all packages
npm run lint           # Lint codebase
npm run format         # Format code
npm run db:studio      # Open Prisma Studio
npm run infra:up       # Start Docker services
npm run infra:down     # Stop Docker services
```

### Project Structure

```
apps/api/          - Fastify API server
packages/shared/   - Shared types and utilities
infra/            - Docker infrastructure
scripts/          - Setup and utility scripts
```

## Current Phase Status

**Phase 0**: Complete - Foundation established
**Next**: Phase 1 - Crawling engine implementation

Refer to `project.md` for detailed phase roadmap.
