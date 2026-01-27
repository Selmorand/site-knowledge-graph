import { URL } from 'url';

export function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);

    // Remove trailing slash
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';

    // Remove default ports
    if ((url.protocol === 'http:' && url.port === '80') ||
        (url.protocol === 'https:' && url.port === '443')) {
      url.port = '';
    }

    // Sort query parameters
    url.searchParams.sort();

    // Remove fragment
    url.hash = '';

    return url.toString();
  } catch (error) {
    return urlString;
  }
}

export function isSameDomain(url1: string, url2: string): boolean {
  try {
    const domain1 = new URL(url1).hostname;
    const domain2 = new URL(url2).hostname;

    return domain1 === domain2 ||
           domain1 === `www.${domain2}` ||
           domain2 === `www.${domain1}`;
  } catch (error) {
    return false;
  }
}

export function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) {
    return '';
  }
}

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch (error) {
    return relativeUrl;
  }
}
