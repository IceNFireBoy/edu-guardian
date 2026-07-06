/**
 * Tiny TTL cache over localStorage. Used to keep AI-generated flashcards and
 * quizzes on the device so reopening a note costs ZERO API calls (protects the
 * per-user AI quota and the shared rate limits from repeat-view spikes).
 * All operations are failure-tolerant: quota errors or corrupted entries just
 * behave like a cache miss.
 */

interface CacheEnvelope<T> {
  exp: number;
  v: T;
}

export const readLocalCache = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.v;
  } catch {
    return null;
  }
};

export const writeLocalCache = <T>(key: string, value: T, ttlMs: number): void => {
  try {
    localStorage.setItem(key, JSON.stringify({ exp: Date.now() + ttlMs, v: value }));
  } catch {
    /* storage full or blocked — skip caching */
  }
};

export const clearLocalCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

export const DAY_MS = 24 * 60 * 60 * 1000;
