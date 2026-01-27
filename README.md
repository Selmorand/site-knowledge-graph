# Site Knowledge Graph

A local-first application for crawling websites (with permission), extracting structured content, and building knowledge graphs for question generation.

## Overview

This project enables users to:

1. Crawl websites ethically with explicit owner permission
2. Extract and structure content from web pages
3. Build knowledge graphs from extracted content
4. Generate question-answer pairs for learning or testing

All data stays local on your machine. No external services required.

## Features

### Phase 0 (Current): Foundation

- TypeScript monorepo structure
- Fastify API server
- PostgreSQL database with Prisma ORM
- Redis for caching and job queuing
- Docker infrastructure
- Health monitoring endpoints

### Planned Features

- **Phase 1**: Web crawling engine with robots.txt respect and rate limiting
- **Phase 2**: Knowledge graph construction and entity relationship mapping
- **Phase 3**: AI-powered question and answer generation

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **API**: Fastify
- **Database**: PostgreSQL
- **Cache**: Redis
- **ORM**: Prisma
- **Validation**: Zod
- **Logging**: Pino

## Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Git

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd site-knowledge-graph

# Run setup script
# On macOS/Linux:
bash scripts/setup.sh

# On Windows:
.\scripts\setup.ps1
```

### 2. Start Development

```bash
# Start the API server
npm run dev

# In another terminal, view database
npm run db:studio
```

The API will be available at `http://localhost:3000`

## Manual Setup

If you prefer manual setup:

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start Docker services
npm run infra:up

# 4. Generate Prisma client
npm run db:generate --workspace=apps/api

# 5. Run migrations
npm run db:migrate --workspace=apps/api

# 6. Start development server
npm run dev
```

## Available Scripts

### Development

- `npm run dev` - Start API server in development mode
- `npm run build` - Build all packages
- `npm run lint` - Lint all code
- `npm run format` - Format code with Prettier

### Database

- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:generate` - Generate Prisma client

### Infrastructure

- `npm run infra:up` - Start Docker containers (PostgreSQL + Redis)
- `npm run infra:down` - Stop Docker containers

## Project Structure

```
site-knowledge-graph/
├── apps/
│   └── api/              # Fastify API server
│       ├── src/
│       │   ├── routes/   # API route handlers
│       │   ├── services/ # Business logic
│       │   ├── db/       # Database clients
│       │   ├── config/   # Configuration
│       │   └── utils/    # Utilities
│       └── prisma/       # Database schema
│
├── packages/
│   └── shared/           # Shared types and utilities
│       ├── types/        # TypeScript types
│       ├── constants/    # Constants
│       └── logger.ts     # Logging utility
│
├── infra/
│   └── docker-compose.yml # Docker services
│
├── scripts/              # Setup scripts
│
└── docs/                 # Documentation
    ├── claude.md         # Development guide
    ├── project.md        # Project overview
    ├── structure.md      # Architecture details
    └── data-model.md     # Database design
```

## API Endpoints

### Health & Status

- `GET /` - API information
- `GET /api/health` - Health check with service status
- `GET /api/ping` - Simple ping endpoint

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` / `REDIS_PORT` - Redis connection
- `PORT` - API server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/error)

## Development Guidelines

- Follow TypeScript strict mode
- Validate all inputs with Zod
- Use Pino logger for all logging
- Write tests for new features
- Follow the phase-based development plan

See `claude.md` for detailed development rules and architectural principles.

## Database

The application uses PostgreSQL with the following core tables:

- **Sites**: Websites to be crawled
- **Pages**: Individual pages from sites
- **CrawlJobs**: Crawling job tracking

View full schema in `data-model.md` or explore with Prisma Studio.

## Docker Services

- **PostgreSQL**: Port 5432 (database)
- **Redis**: Port 6379 (cache/queue)

Manage with `npm run infra:up` and `npm run infra:down`

## Troubleshooting

### Docker Issues

```bash
# Restart containers
npm run infra:down
npm run infra:up

# View logs
docker-compose -f infra/docker-compose.yml logs
```

### Database Issues

```bash
# Reset database
npm run db:push --workspace=apps/api

# Regenerate client
npm run db:generate --workspace=apps/api
```

### Port Conflicts

If ports 3000, 5432, or 6379 are in use, update `.env` and `infra/docker-compose.yml`

## License

MIT

## Contributing

This is a phased development project. Please refer to `project.md` for the current phase and roadmap before contributing.

## Ethical Use

This tool is designed for ethical use only:

- Always obtain explicit permission before crawling
- Respect robots.txt directives
- Use reasonable rate limiting
- Don't overload servers
- Comply with website terms of service
