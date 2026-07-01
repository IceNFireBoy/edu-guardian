import { Request, Response, NextFunction } from 'express';
import cache from '../utils/cache';

/**
 * Caches successful JSON responses for GET routes. Keyed by the full URL
 * (including query string) so different filters are cached independently.
 *
 * Only apply this to PUBLIC, non-user-specific reads — the response is shared
 * across all callers. See utils/cache.ts for the storage backend.
 */
export const cacheRoute = (ttlSeconds: number, keyPrefix = 'route:') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Never cache anything but reads.
    if (req.method !== 'GET') return next();

    const key = `${keyPrefix}${req.originalUrl}`;

    const cached = await cache.get<{ status: number; body: unknown }>(key);
    if (cached) {
      res.status(cached.status).json(cached.body);
      return;
    }

    // Intercept res.json so we can store the payload once the handler produces it.
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Fire-and-forget: caching must not delay the response.
        void cache.set(key, { status: res.statusCode, body }, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate every cached route under a prefix. Call after a write that changes
 * what those reads return (e.g. creating a badge invalidates the badge catalog).
 */
export const invalidateRouteCache = async (routePrefix: string): Promise<void> => {
  await cache.delByPrefix(`route:${routePrefix}`);
};
