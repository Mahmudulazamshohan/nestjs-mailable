interface CacheEntry<V> {
  value: V;
  createdAt: number;
}

/**
 * LRU (Least Recently Used) cache with optional TTL.
 * Implemented using a Map to maintain insertion order for efficient eviction.
 */
export class LruCache<K, V> {
  private readonly cache = new Map<K, CacheEntry<V>>();

  constructor(
    private readonly maxSize: number,
    private readonly ttl?: number,
  ) {}

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    // Promote to most recently used by re-inserting at end
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first entry in Map)
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
    this.cache.set(key, { value, createdAt: Date.now() });
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    if (!this.ttl) return false;
    return Date.now() - entry.createdAt > this.ttl;
  }
}
