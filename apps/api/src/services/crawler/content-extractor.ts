import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import { logger } from '@site-knowledge-graph/shared';

export interface ExtractedContent {
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  textContent: string | null;
  metadata: {
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
    };
    jsonLd: unknown[];
    author?: string;
    language?: string;
  };
}

export function extractContent(html: string, url: string): ExtractedContent {
  try {
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').first().text().trim() || null;

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;

    // Extract canonical URL
    const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || null;

    // Extract headings
    const headings = {
      h1: $('h1').map((_, el) => $(el).text().trim()).get(),
      h2: $('h2').map((_, el) => $(el).text().trim()).get(),
      h3: $('h3').map((_, el) => $(el).text().trim()).get(),
    };

    // Extract JSON-LD
    const jsonLd: unknown[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonText = $(el).html();
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          jsonLd.push(parsed);
        }
      } catch (error) {
        logger.debug({ error }, 'Failed to parse JSON-LD');
      }
    });

    // Extract other metadata
    const author = $('meta[name="author"]').attr('content')?.trim();
    const language = $('html').attr('lang')?.trim() || $('meta[http-equiv="content-language"]').attr('content')?.trim();

    // Use Readability for main content extraction
    let textContent: string | null = null;
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document, {
        charThreshold: 100,
      });
      const article = reader.parse();

      if (article) {
        textContent = article.textContent;
      }
    } catch (error) {
      logger.debug({ error, url }, 'Readability parsing failed, using fallback');

      // Fallback: extract text from body
      const bodyText = $('body')
        .clone()
        .find('script, style, nav, header, footer, aside')
        .remove()
        .end()
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      textContent = bodyText || null;
    }

    return {
      title,
      metaDescription,
      canonicalUrl,
      textContent,
      metadata: {
        headings,
        jsonLd,
        author,
        language,
      },
    };
  } catch (error) {
    logger.error({ error, url }, 'Content extraction failed');
    throw error;
  }
}
