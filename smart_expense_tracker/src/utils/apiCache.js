// src/utils/apiCache.js

class APICache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.pending = new Map(); // <-- Tambahan penting
    this.defaultTTL = 5 * 60 * 1000;
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + ttl);
    // console.log(`✅ Cache set: ${key} (TTL: ${ttl / 1000}s)`);
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    const expiry = this.timestamps.get(key);
    const now = Date.now();

    if (now > expiry) {
      console.log(`⏰ Cache expired: ${key}`);
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    const remaining = Math.round((expiry - now) / 1000);
    // console.log(`✅ Cache hit: ${key} (remaining: ${remaining}s)`);
    return this.cache.get(key);
  }

  invalidate(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    console.log(`🗑️ Cache invalidated: ${key}`);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.pending.clear();
    console.log(`🗑️ All cache cleared`);
  }

  getKeys() {
    return Array.from(this.cache.keys());
  }
}

export const apiCache = new APICache();

/**
 * Caching with pending promise protection
 */
export async function cachedAPICall(key, apiFunction, ttl) {
  // 1. Check cache
  const cached = apiCache.get(key);
  if (cached) return cached;

  // 2. Check pending promise
  if (apiCache.pending.has(key)) {
    console.log(`⏳ Awaiting pending API: ${key}`);
    return apiCache.pending.get(key);
  }

  // 3. Create new API request
  // console.log(`🔄 Cache miss: ${key} - Calling API...`);
  const request = (async () => {
    try {
      const result = await apiFunction();
      apiCache.set(key, result, ttl);
      apiCache.pending.delete(key);
      return result;
    } catch (err) {
      apiCache.pending.delete(key);
      throw err;
    }
  })();

  apiCache.pending.set(key, request);

  return request;
}

/**
 * Invalidate helper
 */
export function invalidatePattern(pattern) {
  const keys = apiCache.getKeys();
  for (const key of keys) {
    if (key.startsWith(pattern)) {
      apiCache.invalidate(key);
    }
  }
}
