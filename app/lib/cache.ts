/**
 * 缓存管理器：LRU 缓存、TTL 缓存、本地存储封装、统计监控、并发安全
 * 专为 Vercel Serverless 环境优化，支持内存缓存与持久化备份
 */

interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccess: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheItem<V>>;
  private maxSize: number;
  private defaultTTL: number;
  private stats: { hits: number; misses: number; evictions: number; sets: number; deletes: number };
  private onEvict?: (key: K, value: V) => void;

  constructor(maxSize: number = 100, defaultTTL: number = 3600, onEvict?: (key: K, value: V) => void) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.onEvict = onEvict;
    this.stats = { hits: 0, misses: 0, evictions: 0, sets: 0, deletes: 0 };
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return undefined;
    }
    
    if (Date.now() - item.timestamp > item.ttl * 1000) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return undefined;
    }
    
    item.hits++;
    item.lastAccess = Date.now();
    this.stats.hits++;
    
    // LRU 更新访问顺序
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.value;
  }

  set(key: K, value: V, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
      lastAccess: Date.now(),
    });
    this.stats.sets++;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    const item = this.cache.get(key);
    if (item) {
      this.stats.deletes++;
      this.onEvict?.(key, item.value);
    }
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, sets: 0, deletes: 0 };
  }

  size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    return Array.from(this.cache.values()).map(item => item.value);
  }

  entries(): [K, V][] {
    return Array.from(this.cache.entries()).map(([key, item]) => [key, item.value]);
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: (this.cache.size / this.maxSize * 100).toFixed(2) + '%',
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      avgTTL: this.defaultTTL,
    };
  }

  cleanup(): number {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        this.cache.delete(key);
        this.onEvict?.(key, item.value);
        expiredCount++;
      }
    }
    
    return expiredCount;
  }

  private evictLRU(): void {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccess < oldestTime) {
        oldestTime = item.lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey !== undefined) {
      const item = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.onEvict?.(oldestKey, item!.value);
    }
  }
}

export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiresAt: number }>;
  private cleanupInterval: NodeJS.Timeout | null;
  private onExpire?: (key: K, value: V) => void;

  constructor(defaultTTL: number = 3600, cleanupIntervalMs: number = 60000, onExpire?: (key: K, value: V) => void) {
    this.cache = new Map();
    this.onExpire = onExpire;
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.onExpire?.(key, item.value);
      return undefined;
    }
    
    return item.value;
  }

  set(key: K, value: V, ttl?: number): void {
    const ttlMs = (ttl || 3600) * 1000;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  cleanup(): number {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        this.onExpire?.(key, item.value);
        expiredCount++;
      }
    }
    
    return expiredCount;
  }

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export function createLocalStorageWrapper<T>(key: string, defaultValue: T, encrypt?: boolean) {
  return {
    get(): T {
      try {
        const stored = localStorage.getItem(key);
        if (stored === null) return defaultValue;
        return JSON.parse(stored);
      } catch (e) {
        console.warn(`LocalStorage read error for ${key}:`, e);
        return defaultValue;
      }
    },
    
    set(value: T): void {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.error('LocalStorage quota exceeded. Clearing old data...');
          localStorage.removeItem(key);
        } else {
          console.error('LocalStorage write error:', e);
        }
      }
    },
    
    remove(): void {
      localStorage.removeItem(key);
    },
    
    exists(): boolean {
      return localStorage.getItem(key) !== null;
    },
    
    getSize(): number {
      const stored = localStorage.getItem(key);
      return stored ? new Blob([stored]).size : 0;
    },
  };
}

export function createMemoryCache<T>(maxSize: number = 50, ttl: number = 300): LRUCache<string, T> {
  return new LRUCache<string, T>(maxSize, ttl);
      }
