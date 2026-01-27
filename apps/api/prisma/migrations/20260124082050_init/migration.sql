-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('PENDING', 'CRAWLED', 'PROCESSING', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "CrawlJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FetchMethod" AS ENUM ('HTTP', 'PLAYWRIGHT');

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" "SiteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCrawledAt" TIMESTAMP(3),

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "title" TEXT,
    "metaDescription" TEXT,
    "contentHash" TEXT,
    "htmlContent" TEXT,
    "renderedHtml" TEXT,
    "textContent" TEXT,
    "fetchMethod" "FetchMethod",
    "metadata" JSONB,
    "status" "PageStatus" NOT NULL DEFAULT 'PENDING',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "crawledAt" TIMESTAMP(3),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_jobs" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "status" "CrawlJobStatus" NOT NULL DEFAULT 'PENDING',
    "maxDepth" INTEGER NOT NULL DEFAULT 3,
    "maxPages" INTEGER NOT NULL DEFAULT 100,
    "pagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_url_key" ON "sites"("url");

-- CreateIndex
CREATE INDEX "sites_domain_idx" ON "sites"("domain");

-- CreateIndex
CREATE INDEX "sites_status_idx" ON "sites"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pages_url_key" ON "pages"("url");

-- CreateIndex
CREATE INDEX "pages_siteId_idx" ON "pages"("siteId");

-- CreateIndex
CREATE INDEX "pages_status_idx" ON "pages"("status");

-- CreateIndex
CREATE INDEX "pages_contentHash_idx" ON "pages"("contentHash");

-- CreateIndex
CREATE INDEX "crawl_jobs_siteId_idx" ON "crawl_jobs"("siteId");

-- CreateIndex
CREATE INDEX "crawl_jobs_status_idx" ON "crawl_jobs"("status");

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_jobs" ADD CONSTRAINT "crawl_jobs_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
