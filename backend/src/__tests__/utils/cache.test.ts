import { describe, it, expect, vi } from 'vitest';
import cache from '../../utils/cache';

// Exercises the default in-memory backend (no REDIS_URL) — the path used on the
// current free-tier deployment. Redis behaviour is identical from the caller's
// perspective; only the storage differs.
describe('cache (in-memory fallback)', () => {
  it('wrap() computes once, then serves subsequent calls from cache', async () => {
    const producer = vi.fn(async () => ({ n: 42 }));
    const key = `test:wrap:${Date.now()}:${Math.random()}`;

    const a = await cache.wrap(key, 60, producer);
    const b = await cache.wrap(key, 60, producer);

    expect(a).toEqual({ n: 42 });
    expect(b).toEqual({ n: 42 });
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it('wrap() re-computes after the TTL expires', async () => {
    const producer = vi.fn(async () => 'value');
    const key = `test:ttl:${Date.now()}:${Math.random()}`;

    await cache.wrap(key, 0.05, producer); // 50ms TTL
    await new Promise((r) => setTimeout(r, 80));
    await cache.wrap(key, 0.05, producer);

    expect(producer).toHaveBeenCalledTimes(2);
  });

  it('delByPrefix() invalidates every matching key', async () => {
    const producer = vi.fn(async () => 'v');
    const key = `route:/api/v1/badges/${Math.random()}`;

    await cache.wrap(key, 60, producer);
    await cache.delByPrefix('route:/api/v1/badges');
    await cache.wrap(key, 60, producer);

    expect(producer).toHaveBeenCalledTimes(2);
  });
});
