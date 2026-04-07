import { LruCache } from '../cache/lru-cache';

describe('LruCache', () => {
  describe('basic get/set', () => {
    it('should store and retrieve a value', () => {
      const cache = new LruCache<string, number>(10);
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('should return undefined for missing keys', () => {
      const cache = new LruCache<string, number>(10);
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should update an existing key', () => {
      const cache = new LruCache<string, number>(10);
      cache.set('a', 1);
      cache.set('a', 99);
      expect(cache.get('a')).toBe(99);
    });

    it('should track size correctly', () => {
      const cache = new LruCache<string, number>(10);
      expect(cache.size).toBe(0);
      cache.set('a', 1);
      cache.set('b', 2);
      expect(cache.size).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict the least recently used entry when full', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Insert 4th item — 'a' (oldest) should be evicted
      cache.set('d', 4);

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
      expect(cache.size).toBe(3);
    });

    it('should promote accessed entries, protecting them from eviction', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Access 'a' — promotes it to MRU; 'b' becomes LRU
      cache.get('a');
      cache.set('d', 4);

      expect(cache.get('b')).toBeUndefined(); // 'b' was LRU, evicted
      expect(cache.get('a')).toBe(1);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should promote on update, protecting updated entry from eviction', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Update 'a' — promotes it; 'b' becomes LRU
      cache.set('a', 10);
      cache.set('d', 4);

      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('a')).toBe(10);
    });

    it('should evict in insertion order when no accesses have occurred', () => {
      const cache = new LruCache<string, number>(2);
      cache.set('first', 1);
      cache.set('second', 2);
      cache.set('third', 3); // evicts 'first'
      cache.set('fourth', 4); // evicts 'second'

      expect(cache.get('first')).toBeUndefined();
      expect(cache.get('second')).toBeUndefined();
      expect(cache.get('third')).toBe(3);
      expect(cache.get('fourth')).toBe(4);
    });

    it('should maintain correct size after evictions', () => {
      const cache = new LruCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      expect(cache.size).toBe(2);
    });
  });

  describe('TTL expiry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return a value before TTL expires', () => {
      const cache = new LruCache<string, string>(10, 1000);
      cache.set('key', 'value');

      jest.advanceTimersByTime(999);

      expect(cache.get('key')).toBe('value');
    });

    it('should return undefined after TTL expires', () => {
      const cache = new LruCache<string, string>(10, 1000);
      cache.set('key', 'value');

      jest.advanceTimersByTime(1001);

      expect(cache.get('key')).toBeUndefined();
    });

    it('should remove expired entry from size count', () => {
      const cache = new LruCache<string, string>(10, 500);
      cache.set('key', 'value');
      expect(cache.size).toBe(1);

      jest.advanceTimersByTime(600);
      cache.get('key'); // triggers lazy eviction

      expect(cache.size).toBe(0);
    });

    it('should not expire entries when no TTL is set', () => {
      const cache = new LruCache<string, string>(10);
      cache.set('key', 'value');

      jest.advanceTimersByTime(999999);

      expect(cache.get('key')).toBe('value');
    });

    it('should expire individual entries independently', () => {
      const cache = new LruCache<string, string>(10, 500);
      cache.set('early', 'v1');

      jest.advanceTimersByTime(300);
      cache.set('late', 'v2');

      jest.advanceTimersByTime(300); // early is 600ms old, late is 300ms old

      expect(cache.get('early')).toBeUndefined();
      expect(cache.get('late')).toBe('v2');
    });
  });

  describe('has()', () => {
    it('should return true for existing keys', () => {
      const cache = new LruCache<string, number>(10);
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
    });

    it('should return false for missing keys', () => {
      const cache = new LruCache<string, number>(10);
      expect(cache.has('missing')).toBe(false);
    });

    it('should return false for expired keys', () => {
      jest.useFakeTimers();
      const cache = new LruCache<string, number>(10, 100);
      cache.set('a', 1);

      jest.advanceTimersByTime(200);

      expect(cache.has('a')).toBe(false);
      jest.useRealTimers();
    });
  });

  describe('delete()', () => {
    it('should remove an existing key and return true', () => {
      const cache = new LruCache<string, number>(10);
      cache.set('a', 1);

      expect(cache.delete('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.size).toBe(0);
    });

    it('should return false when deleting a missing key', () => {
      const cache = new LruCache<string, number>(10);
      expect(cache.delete('missing')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should remove all entries', () => {
      const cache = new LruCache<string, number>(10);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBeUndefined();
    });

    it('should allow setting new entries after clear', () => {
      const cache = new LruCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();

      cache.set('c', 3);
      cache.set('d', 4);

      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
      expect(cache.size).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle maxSize of 1', () => {
      const cache = new LruCache<string, number>(1);
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.size).toBe(1);
    });

    it('should support non-string keys', () => {
      const cache = new LruCache<number, string>(10);
      cache.set(1, 'one');
      cache.set(2, 'two');

      expect(cache.get(1)).toBe('one');
      expect(cache.get(2)).toBe('two');
    });

    it('should handle storing falsy values', () => {
      const cache = new LruCache<string, number | null | boolean>(10);
      cache.set('zero', 0);
      cache.set('null', null);
      cache.set('false', false);

      expect(cache.get('zero')).toBe(0);
      expect(cache.get('null')).toBeNull();
      expect(cache.get('false')).toBe(false);
    });

    it('should maintain correct order after multiple updates to same key', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Repeatedly update 'a' — it should stay as MRU
      cache.set('a', 10);
      cache.set('a', 20);
      cache.set('a', 30);

      // Add new entry — 'b' should be evicted (LRU), not 'a'
      cache.set('d', 4);

      expect(cache.get('a')).toBe(30);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });
  });
});
