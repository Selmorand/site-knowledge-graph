# Site Knowledge Graph

A cloud-deployed application (hosted on Railway) for crawling websites (with permission), extracting structured content, and building knowledge graphs for question generation.

## Overview

This project enables users to:

1. Crawl websites ethically with explicit owner permission
2. Extract and structure content from web pages
3. Build knowledge graphs from extracted content
4. Generate question-answer pairs for learning or testing

Deployed on Railway with managed PostgreSQL and Redis services for reliable cloud operation.

## Features

### Phase 0 (Current): Foundation

- TypeScript monorepo structure
- Fastify API server
- PostgreSQL database with Prisma ORM
- Redis for caching and job queuing
- Railway cloud deployment
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
- Git
- Railway account (for deployment)

## Quick Start

### Local Development

```bash
# 1. Clone the repository
git clone <repository-url>
cd site-knowledge-graph

# 2. Install dependencies
npm install

# 3. Configure environment
# Copy .env.example to .env and add Railway database URLs
cp .env.example .env

# 4. Generate Prisma client
npm run db:generate --workspace=apps/api

# 5. Run migrations (connects to Railway database)
npm run db:migrate --workspace=apps/api

# 6. Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### Railway Deployment

The application is configured for automatic deployment on Railway:

1. Connect your GitHub repository to Railway
2. Add PostgreSQL and Redis services in Railway
3. Railway will automatically set DATABASE_URL and Redis environment variables
4. Push to main branch to trigger deployment

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

See `.env.example` and `.env.production.example` for all available configuration options.

Key variables:

- `DATABASE_URL` - PostgreSQL connection string (provided by Railway)
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` - Redis connection (provided by Railway)
- `PORT` - API server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/error)
- `API_SECRET` - Secret key for API authentication (generate a strong random value)

## Development Guidelines

- Follow TypeScript strict mode
- Validate all inputs with Zod
- Use Pino logger for all logging
- Write tests for new features
- Follow the phase-based development plan

See `claude.md` for detailed development rules and architectural principles.

## Database

The application uses PostgreSQL (hosted on Railway) with the following core tables:

- **Sites**: Websites to be crawled
- **Pages**: Individual pages from sites
- **CrawlJobs**: Crawling job tracking

View full schema in `data-model.md` or explore with Prisma Studio.

## Cloud Services

- **PostgreSQL**: Managed by Railway (automatic backups and scaling)
- **Redis**: Managed by Railway (cache/queue)
- **API Hosting**: Railway (automatic deployments from Git)

## Troubleshooting

### Database Connection Issues

1. Verify your `DATABASE_URL` in `.env` is correct
2. Ensure Railway database service is running
3. Check Railway dashboard for service status

### Database Schema Issues

```bash
# Reset database schema
npm run db:push --workspace=apps/api

# Regenerate Prisma client
npm run db:generate --workspace=apps/api
```

### Local Port Conflicts

If port 3000 is in use locally, update `PORT` in your `.env` file

### Railway Deployment Issues

1. Check build logs in Railway dashboard
2. Verify all environment variables are set
3. Ensure `NODE_ENV` is set to `production` in Railway

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
