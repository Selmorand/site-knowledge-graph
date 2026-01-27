export const APP_NAME = 'site-knowledge-graph';
export const APP_VERSION = '0.1.0';

export const DEFAULT_CRAWL_MAX_DEPTH = 3;
export const DEFAULT_CRAWL_MAX_PAGES = 100;
export const DEFAULT_REQUEST_TIMEOUT = 30000; // 30 seconds

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
