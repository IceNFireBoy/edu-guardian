/**
 * Graceful caching layer.
 *
 * By default this is an in-process LRU with TTL — zero external infrastructure,
 * which suits the current Render free-tier deployment. If `REDIS_URL` is set the
 * cache transparently upgrades to Redis (shared across instances) with no
 * call-site changes. Every operation is failure-tolerant: a cache miss, a Redis
 * blip, or a serialization error never breaks a request — it just falls back to
 * recomputing the value.
 *
 * Set `CACHE_DISABLED=true` to bypass caching entirely (useful in tests).
 */

interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPrefix(prefix: string): Promise<void>;
}

/** In-process store: Map with lazy TTL expiry and a simple size-bounded LRU. */
class MemoryStore implements CacheStore {
  private store = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly maxEntries = 1000) {}

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    // Touch for recency (Map preserves insertion order → re-insert = most recent)
    this.store.delete(key);
    this.store.set(key, entry);
    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value as string | undefined;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

/** Redis-backed store (used only when REDIS_URL is configured). */
class RedisStore implements CacheStore {
  constructor(private readonly client: any) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    // SCAN (not KEYS) so we never block Redis on a large keyspace.
    let cursor = '0';
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
      cursor = next;
      if (keys.length) await this.client.del(...keys);
    } while (cursor !== '0');
  }
}

class Cache {
  private readonly enabled: boolean;
  private storePromise: Promise<CacheStore>;

  constructor() {
    this.enabled = process.env.CACHE_DISABLED !== 'true';
    this.storePromise = this.initStore();
  }

  private async initStore(): Promise<CacheStore> {
    const url = process.env.REDIS_URL;
    if (url) {
      try {
        const IORedis = (await import('ioredis')).default;
        const client = new IORedis(url, { maxRetriesPerRequest: 2 });
        client.on('error', (e: Error) => console.error('[cache] Redis error:', e.message));
        console.log('[cache] Using Redis backend');
        return new RedisStore(client);
      } catch (err) {
        console.warn(
          '[cache] REDIS_URL set but Redis is unavailable; using in-memory cache:',
          (err as Error).message
        );
      }
    }
    return new MemoryStore();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;
    try {
      const store = await this.storePromise;
      return await store.get<T>(key);
    } catch (err) {
      console.warn('[cache] get failed:', (err as Error).message);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.enabled) return;
    try {
      const store = await this.storePromise;
      await store.set(key, value, ttlSeconds);
    } catch (err) {
      console.warn('[cache] set failed:', (err as Error).message);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const store = await this.storePromise;
      await store.del(key);
    } catch (err) {
      console.warn('[cache] del failed:', (err as Error).message);
    }
  }

  /** Invalidate every key sharing a prefix (e.g. all cached badge routes). */
  async delByPrefix(prefix: string): Promise<void> {
    try {
      const store = await this.storePromise;
      await store.delByPrefix(prefix);
    } catch (err) {
      console.warn('[cache] delByPrefix failed:', (err as Error).message);
    }
  }

  /**
   * Return the cached value for `key`, or run `producer`, cache its result for
   * `ttlSeconds`, and return it. Never throws on cache errors — it degrades to
   * simply calling `producer`.
   */
  async wrap<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    if (!this.enabled) return producer();
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) return cached;
    const value = await producer();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

// Single shared instance for the whole process.
export const cache = new Cache();
export default cache;
