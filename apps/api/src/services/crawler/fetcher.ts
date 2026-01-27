import { chromium, Browser } from 'playwright';
import { logger } from '@site-knowledge-graph/shared';

export interface FetchResult {
  html: string;
  renderedHtml?: string;
  method: 'HTTP' | 'PLAYWRIGHT';
  statusCode: number;
}

const SPA_INDICATORS = [
  'data-reactroot',
  'data-react-helmet',
  'ng-version',
  'data-vue-',
  '__NEXT_DATA__',
  'nuxt',
];

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    logger.info('Launching Playwright browser');
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    logger.info('Playwright browser closed');
  }
}

function hasSpaIndicators(html: string): boolean {
  return SPA_INDICATORS.some((indicator) => html.includes(indicator));
}

function isContentSufficient(html: string): boolean {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return false;

  const bodyContent = bodyMatch[1];
  const textContent = bodyContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  return textContent.length > 100;
}

async function fetchWithHttp(url: string): Promise<{ html: string; statusCode: number }> {
  logger.debug({ url }, 'Fetching with HTTP');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SiteKnowledgeGraph/1.0 (Web Crawler)',
      },
      redirect: 'follow', // Automatically follow redirects
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error(`Non-HTML content type: ${contentType}`);
    }

    const html = await response.text();
    return { html, statusCode: response.status };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout (60s)');
    }
    throw error;
  }
}

async function fetchWithPlaywright(url: string): Promise<{ html: string; renderedHtml: string; statusCode: number }> {
  logger.info({ url }, 'Fetching with Playwright');

  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: 'SiteKnowledgeGraph/1.0 (Web Crawler)',
  });

  const page = await context.newPage();

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    const statusCode = response?.status() || 0;

    if (statusCode !== 200) {
      throw new Error(`HTTP ${statusCode}`);
    }

    // Wait a bit more for dynamic content
    await page.waitForTimeout(2000);

    const renderedHtml = await page.content();

    return { html: renderedHtml, renderedHtml, statusCode };
  } finally {
    await context.close();
  }
}

export async function fetchPage(url: string): Promise<FetchResult> {
  try {
    // First attempt: HTTP fetch
    const { html, statusCode } = await fetchWithHttp(url);

    // Check if we need Playwright fallback
    const needsPlaywright = hasSpaIndicators(html) || !isContentSufficient(html);

    if (needsPlaywright) {
      logger.info({ url }, 'HTTP fetch insufficient, using Playwright fallback');

      const playwrightResult = await fetchWithPlaywright(url);
      return {
        html,
        renderedHtml: playwrightResult.renderedHtml,
        method: 'PLAYWRIGHT',
        statusCode: playwrightResult.statusCode,
      };
    }

    // HTTP fetch was sufficient
    return {
      html,
      method: 'HTTP',
      statusCode,
    };
  } catch (error) {
    logger.error({ error, url }, 'Failed to fetch page');
    throw error;
  }
}
