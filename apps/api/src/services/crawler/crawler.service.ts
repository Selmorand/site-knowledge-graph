import { prisma } from '@/db/client';
import { logger } from '@site-knowledge-graph/shared';
import { parseSitemap, extractLinksFromHtml } from './url-discovery';
import { fetchPage } from './fetcher';
import { extractContent } from './content-extractor';
import { generateContentHash } from '@/utils/hash';
import { normalizeUrl, extractDomain, resolveUrl } from '@/utils/url-utils';

export interface CrawlOptions {
  jobId: string;
  siteId: string;
  baseUrl: string;
  maxDepth: number;
  maxPages: number;
}

interface UrlToProcess {
  url: string;
  depth: number;
}

export class CrawlerService {
  private options: CrawlOptions;
  private urlQueue: UrlToProcess[] = [];
  private processedUrls: Set<string> = new Set();
  private pagesProcessed = 0;
  private baseDomain: string;
  private errors: Array<{ url: string; error: string }> = [];

  constructor(options: CrawlOptions) {
    this.options = options;
    this.baseDomain = extractDomain(options.baseUrl);
  }

  private buildErrorSummary(): string {
    if (this.errors.length === 0) {
      return 'No pages were successfully crawled.';
    }

    // Group errors by type
    const errorTypes: Record<string, number> = {};
    const sampleErrors: string[] = [];

    for (const { url, error } of this.errors) {
      errorTypes[error] = (errorTypes[error] || 0) + 1;

      if (sampleErrors.length < 3) {
        sampleErrors.push(`${url}: ${error}`);
      }
    }

    const summary = [
      `Failed to crawl ${this.errors.length} URL(s).`,
      '',
      'Common errors:',
      ...Object.entries(errorTypes).map(([error, count]) => `  • ${error} (${count}x)`),
      '',
      'Sample failures:',
      ...sampleErrors.map(err => `  • ${err}`),
    ];

    return summary.join('\n');
  }

  async crawl(): Promise<void> {
    logger.info({ jobId: this.options.jobId, baseUrl: this.options.baseUrl }, 'Starting crawl');

    try {
      // Update job status to RUNNING
      await prisma.crawlJob.update({
        where: { id: this.options.jobId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      // Step 1: Discover URLs from sitemap
      await this.discoverFromSitemap();

      // Step 2: Add base URL if not already in queue
      const normalizedBaseUrl = normalizeUrl(this.options.baseUrl);
      if (!this.urlQueue.some(item => item.url === normalizedBaseUrl)) {
        this.urlQueue.unshift({ url: normalizedBaseUrl, depth: 0 });
      }

      // Step 3: Process URLs from queue
      await this.processUrlQueue();

      // Mark job as completed
      // If no pages were processed, include error details
      const errorMessage = this.pagesProcessed === 0 && this.errors.length > 0
        ? this.buildErrorSummary()
        : null;

      await prisma.crawlJob.update({
        where: { id: this.options.jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          pagesProcessed: this.pagesProcessed,
          errorMessage,
        },
      });

      logger.info(
        { jobId: this.options.jobId, pagesProcessed: this.pagesProcessed, errorCount: this.errors.length },
        'Crawl completed successfully'
      );
    } catch (error) {
      logger.error({ error, jobId: this.options.jobId }, 'Crawl failed');

      await prisma.crawlJob.update({
        where: { id: this.options.jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          pagesProcessed: this.pagesProcessed,
        },
      });

      throw error;
    }
  }

  private async discoverFromSitemap(): Promise<void> {
    const sitemapUrl = resolveUrl(this.options.baseUrl, '/sitemap.xml');
    logger.info({ sitemapUrl }, 'Discovering URLs from sitemap');

    const urls = await parseSitemap(sitemapUrl, this.baseDomain);

    logger.info({ count: urls.length }, 'Found URLs in sitemap');

    // Add to queue with depth 0 (sitemap URLs are considered root level)
    for (const url of urls) {
      if (!this.processedUrls.has(url) && this.urlQueue.length < this.options.maxPages) {
        this.urlQueue.push({ url, depth: 0 });
      }
    }
  }

  private async processUrlQueue(): Promise<void> {
    while (this.urlQueue.length > 0 && this.pagesProcessed < this.options.maxPages) {
      const urlItem = this.urlQueue.shift();
      if (!urlItem) continue;

      const { url, depth } = urlItem;

      // Skip if already processed
      if (this.processedUrls.has(url)) {
        logger.debug({ url }, 'Skipping already processed URL');
        continue;
      }

      // Skip if depth exceeds limit
      if (depth > this.options.maxDepth) {
        logger.debug({ url, depth, maxDepth: this.options.maxDepth }, 'Skipping URL - depth exceeds limit');
        continue;
      }

      logger.info({
        url,
        depth,
        queueRemaining: this.urlQueue.length,
        progress: `${this.pagesProcessed}/${this.options.maxPages}`
      }, 'Processing URL from queue');

      try {
        await this.processPage(url, depth);
        this.pagesProcessed++;

        // Update job progress
        await prisma.crawlJob.update({
          where: { id: this.options.jobId },
          data: { pagesProcessed: this.pagesProcessed },
        });

        logger.info(
          { url, depth, progress: `${this.pagesProcessed}/${this.options.maxPages}` },
          'Page processed'
        );

        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.errors.push({ url, error: errorMessage });
        logger.error({ error, url }, 'Failed to process page');
        // Continue with other pages
      }

      this.processedUrls.add(url);
    }
  }

  private async processPage(url: string, depth: number): Promise<void> {
    // Check if page already exists
    const existingPage = await prisma.page.findUnique({ where: { url } });

    // Fetch the page
    const fetchResult = await fetchPage(url);

    // Extract content
    const htmlToExtract = fetchResult.renderedHtml || fetchResult.html;
    const extracted = extractContent(htmlToExtract, url);

    // Generate content hash
    const contentHash = generateContentHash(extracted.textContent || '');

    // Skip if content unchanged
    if (existingPage && existingPage.contentHash === contentHash) {
      logger.debug({ url }, 'Page content unchanged, skipping');
      return;
    }

    // Resolve canonical URL
    const canonicalUrl = extracted.canonicalUrl
      ? normalizeUrl(resolveUrl(url, extracted.canonicalUrl))
      : null;

    // Store page
    await prisma.page.upsert({
      where: { url },
      update: {
        title: extracted.title,
        metaDescription: extracted.metaDescription,
        canonicalUrl,
        contentHash,
        htmlContent: fetchResult.html,
        renderedHtml: fetchResult.renderedHtml,
        textContent: extracted.textContent,
        fetchMethod: fetchResult.method,
        metadata: extracted.metadata as any,
        status: 'COMPLETED',
        depth,
        crawledAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        siteId: this.options.siteId,
        url,
        title: extracted.title,
        metaDescription: extracted.metaDescription,
        canonicalUrl,
        contentHash,
        htmlContent: fetchResult.html,
        renderedHtml: fetchResult.renderedHtml,
        textContent: extracted.textContent,
        fetchMethod: fetchResult.method,
        metadata: extracted.metadata as any,
        status: 'COMPLETED',
        depth,
        crawledAt: new Date(),
      },
    });

    // Extract and queue internal links if within depth limit
    if (depth < this.options.maxDepth) {
      const links = extractLinksFromHtml(htmlToExtract, url, this.baseDomain);

      logger.info({
        url,
        depth,
        linksFound: links.length,
        maxDepth: this.options.maxDepth,
        queueSize: this.urlQueue.length
      }, 'Extracted links from page');

      let addedCount = 0;
      for (const link of links) {
        if (this.processedUrls.has(link)) {
          continue; // Already processed
        }
        if (this.urlQueue.some(item => item.url === link)) {
          continue; // Already in queue
        }
        if (this.urlQueue.length + this.pagesProcessed >= this.options.maxPages) {
          logger.info({ maxPages: this.options.maxPages }, 'Reached max pages limit, stopping link discovery');
          break; // Reached max pages
        }

        this.urlQueue.push({ url: link, depth: depth + 1 });
        addedCount++;
      }

      logger.info({
        linksAdded: addedCount,
        queueSize: this.urlQueue.length
      }, 'Added new links to queue');
    } else {
      logger.info({ depth, maxDepth: this.options.maxDepth }, 'Depth limit reached, not extracting links');
    }
  }
}
