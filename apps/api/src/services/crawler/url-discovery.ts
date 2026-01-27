import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import { logger } from '@site-knowledge-graph/shared';
import { normalizeUrl, resolveUrl, isValidUrl } from '@/utils/url-utils';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export async function parseSitemap(sitemapUrl: string, baseDomain: string): Promise<string[]> {
  try {
    logger.info({ sitemapUrl }, 'Fetching sitemap');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(sitemapUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn({ sitemapUrl, status: response.status }, 'Sitemap fetch failed');
      return [];
    }

    const xmlContent = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const result = parser.parse(xmlContent);

    // Handle sitemap index
    if (result.sitemapindex) {
      logger.info({ sitemapUrl }, 'Found sitemap index');
      const sitemaps = Array.isArray(result.sitemapindex.sitemap)
        ? result.sitemapindex.sitemap
        : [result.sitemapindex.sitemap];

      const allUrls: string[] = [];
      for (const sitemap of sitemaps) {
        const childSitemapUrl = sitemap.loc;
        if (childSitemapUrl) {
          try {
            const sitemapHostname = new URL(childSitemapUrl).hostname;
            const isInternal =
              sitemapHostname === baseDomain ||
              sitemapHostname === `www.${baseDomain}` ||
              baseDomain === `www.${sitemapHostname}`;

            if (isInternal) {
              const childUrls = await parseSitemap(childSitemapUrl, baseDomain);
              allUrls.push(...childUrls);
            }
          } catch (error) {
            // Invalid URL, skip
          }
        }
      }

      return allUrls;
    }

    // Handle regular sitemap
    if (result.urlset && result.urlset.url) {
      const urls = Array.isArray(result.urlset.url)
        ? result.urlset.url
        : [result.urlset.url];

      return urls
        .map((url: { loc: string }) => url.loc)
        .filter((url: string) => {
          if (!url) return false;
          try {
            const urlHostname = new URL(url).hostname;
            return (
              urlHostname === baseDomain ||
              urlHostname === `www.${baseDomain}` ||
              baseDomain === `www.${urlHostname}`
            );
          } catch (error) {
            return false;
          }
        })
        .map((url: string) => normalizeUrl(url));
    }

    return [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn({ sitemapUrl }, 'Sitemap fetch timeout (30s)');
    } else {
      logger.warn({ error, sitemapUrl }, 'Failed to parse sitemap');
    }
    return [];
  }
}

export function extractLinksFromHtml(html: string, baseUrl: string, baseDomain: string): string[] {
  try {
    const $ = cheerio.load(html);
    const links: Set<string> = new Set();
    let totalHrefs = 0;
    let skippedNonHttp = 0;
    let skippedExternal = 0;

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      totalHrefs++;

      // Skip non-http(s) links
      if (href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('javascript:') ||
          href.startsWith('#')) {
        skippedNonHttp++;
        return;
      }

      const absoluteUrl = resolveUrl(baseUrl, href);

      if (!isValidUrl(absoluteUrl)) {
        skippedNonHttp++;
        return;
      }

      // Compare hostnames directly (handles www. differences)
      try {
        const linkHostname = new URL(absoluteUrl).hostname;
        const isInternal =
          linkHostname === baseDomain ||
          linkHostname === `www.${baseDomain}` ||
          baseDomain === `www.${linkHostname}`;

        if (!isInternal) {
          skippedExternal++;
          logger.debug({
            href,
            absoluteUrl,
            baseDomain,
            linkHostname
          }, 'Skipping external link');
          return;
        }
      } catch (error) {
        skippedNonHttp++;
        return;
      }

      links.add(normalizeUrl(absoluteUrl));
    });

    logger.info({
      baseUrl,
      baseDomain,
      totalHrefs,
      skippedNonHttp,
      skippedExternal,
      internalLinksFound: links.size
    }, 'Link extraction summary');

    return Array.from(links);
  } catch (error) {
    logger.warn({ error, baseUrl }, 'Failed to extract links from HTML');
    return [];
  }
}
