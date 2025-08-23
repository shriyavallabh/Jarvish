/**
 * JARVISH Cache Management System
 * Multi-layer caching with Redis for optimal performance
 * Supports API response caching, database query caching, and session caching
 */

import Redis from 'ioredis';
import { trackDatabaseQuery, metrics } from '../monitoring/metrics-collector';

interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  defaultTtl: number;
  maxMemory: string;
  compression: boolean;
}

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
}

export class CacheManager {
  private redis: Redis;
  private localCache: Map<string, CacheItem> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    l1Hits: 0, // Local cache hits
    l2Hits: 0, // Redis cache hits
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
      defaultTtl: 3600, // 1 hour
      maxMemory: '256mb',
      compression: true,
      ...config,
    };

    this.initializeRedis();
    this.setupLocalCacheCleanup();
  }

  private initializeRedis(): void {
    this.redis = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      console.log('Redis cache connected');
    });

    this.redis.on('error', (error) => {
      console.error('Redis cache error:', error);
      metrics.apiErrors.inc({ 
        method: 'cache', 
        endpoint: 'redis', 
        error_type: 'connection_error' 
      });
    });
  }

  private setupLocalCacheCleanup(): void {
    // Clean up expired local cache items every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.localCache.entries()) {
        if (now - item.timestamp > item.ttl * 1000) {
          this.localCache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Get data from cache (L1: local, L2: Redis)
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      // L1 Cache: Check local memory first
      const localItem = this.localCache.get(key);
      if (localItem && Date.now() - localItem.timestamp < localItem.ttl * 1000) {
        this.stats.hits++;
        this.stats.l1Hits++;
        metrics.apiDuration.observe(
          { method: 'cache_get', endpoint: 'local' },
          (Date.now() - startTime) / 1000
        );
        return this.decompressData(localItem.data, localItem.compressed);
      }

      // L2 Cache: Check Redis
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        this.stats.hits++;
        this.stats.l2Hits++;

        const parsedValue = JSON.parse(redisValue);
        const data = this.decompressData(parsedValue.data, parsedValue.compressed);

        // Populate L1 cache for faster future access
        this.localCache.set(key, {
          data: parsedValue.data,
          timestamp: Date.now(),
          ttl: Math.min(300, parsedValue.ttl || this.config.defaultTtl), // Max 5 min in local
          compressed: parsedValue.compressed,
        });

        metrics.apiDuration.observe(
          { method: 'cache_get', endpoint: 'redis' },
          (Date.now() - startTime) / 1000
        );

        return data;
      }

      // Cache miss
      this.stats.misses++;
      metrics.apiDuration.observe(
        { method: 'cache_get', endpoint: 'miss' },
        (Date.now() - startTime) / 1000
      );

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      metrics.apiErrors.inc({ 
        method: 'cache_get', 
        endpoint: 'error', 
        error_type: 'retrieval_error' 
      });
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   */
  async set(
    key: string, 
    data: any, 
    ttl: number = this.config.defaultTtl
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      const compressed = this.config.compression && this.shouldCompress(data);
      const processedData = compressed ? this.compressData(data) : data;

      const cacheItem: CacheItem = {
        data: processedData,
        timestamp: Date.now(),
        ttl,
        compressed,
      };

      // Set in Redis
      await this.redis.setex(key, ttl, JSON.stringify(cacheItem));

      // Set in local cache (with shorter TTL)
      this.localCache.set(key, {
        ...cacheItem,
        ttl: Math.min(300, ttl), // Max 5 minutes in local cache
      });

      metrics.apiDuration.observe(
        { method: 'cache_set', endpoint: 'redis' },
        (Date.now() - startTime) / 1000
      );

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      metrics.apiErrors.inc({ 
        method: 'cache_set', 
        endpoint: 'error', 
        error_type: 'storage_error' 
      });
      return false;
    }
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      this.localCache.delete(key);
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      this.localCache.clear();
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get or set pattern with automatic caching
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.config.defaultTtl
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Bulk get operation
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results = await Promise.all(keys.map(key => this.get<T>(key)));
    return results;
  }

  /**
   * Bulk set operation
   */
  async mset(items: { key: string; data: any; ttl?: number }[]): Promise<boolean> {
    try {
      await Promise.all(
        items.map(item => 
          this.set(item.key, item.data, item.ttl || this.config.defaultTtl)
        )
      );
      return true;
    } catch (error) {
      console.error('Bulk set error:', error);
      return false;
    }
  }

  /**
   * Cache with tag-based invalidation
   */
  async setWithTags(
    key: string, 
    data: any, 
    tags: string[], 
    ttl: number = this.config.defaultTtl
  ): Promise<boolean> {
    const success = await this.set(key, data, ttl);
    if (success) {
      // Store key-tag relationships
      for (const tag of tags) {
        await this.redis.sadd(`tag:${tag}`, key);
        await this.redis.expire(`tag:${tag}`, ttl + 3600); // Tag expires 1 hour after data
      }
    }
    return success;
  }

  /**
   * Invalidate all keys with specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.delete(key)));
        await this.redis.del(`tag:${tag}`);
      }
      return keys.length;
    } catch (error) {
      console.error('Tag invalidation error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const memoryUsage = this.parseMemoryInfo(info);
      const totalKeys = await this.redis.dbsize();
      
      const hitRate = this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
        : 0;

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: Math.round(hitRate * 100) / 100,
        totalKeys,
        memoryUsage,
      };
    } catch (error) {
      console.error('Stats error:', error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 0,
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  private shouldCompress(data: any): boolean {
    const serialized = JSON.stringify(data);
    return serialized.length > 1024; // Compress if > 1KB
  }

  private compressData(data: any): string {
    // Simple compression placeholder - in production use zlib
    return JSON.stringify(data);
  }

  private decompressData(data: any, compressed?: boolean): any {
    if (compressed && typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  }

  private parseMemoryInfo(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Update metrics for monitoring
   */
  updateMetrics(): void {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;

    metrics.systemHealth.set({ component: 'cache' }, hitRate);
  }
}

// Cache strategies for different data types
export const CacheStrategies = {
  // API responses - short TTL for real-time data
  API_RESPONSE: 300, // 5 minutes

  // Database query results - medium TTL
  DB_QUERY: 1800, // 30 minutes

  // Static content - long TTL
  STATIC_CONTENT: 86400, // 24 hours

  // User sessions - medium TTL
  USER_SESSION: 3600, // 1 hour

  // WhatsApp templates - long TTL
  WHATSAPP_TEMPLATES: 43200, // 12 hours

  // Compliance rules - very long TTL
  COMPLIANCE_RULES: 86400, // 24 hours

  // Analytics data - short TTL for accuracy
  ANALYTICS: 600, // 10 minutes
};

// Cache key patterns
export const CacheKeys = {
  userSession: (userId: string) => `session:${userId}`,
  advisorProfile: (advisorId: string) => `advisor:${advisorId}`,
  contentTemplate: (templateId: string) => `template:${templateId}`,
  whatsappTemplate: (templateName: string) => `whatsapp:${templateName}`,
  complianceRules: (ruleType: string) => `compliance:${ruleType}`,
  analyticsData: (advisorId: string, period: string) => `analytics:${advisorId}:${period}`,
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${Buffer.from(params).toString('base64')}`,
};

// Global cache instance
export const cacheManager = new CacheManager();

// Middleware helper for automatic API caching
export const withCache = (
  keyGenerator: (req: any) => string,
  ttl: number = CacheStrategies.API_RESPONSE
) => {
  return (handler: Function) => {
    return async (req: any, res: any) => {
      const cacheKey = keyGenerator(req);
      
      // Try to get from cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Execute handler and cache result
      const originalJson = res.json;
      res.json = function(data: any) {
        cacheManager.set(cacheKey, data, ttl);
        return originalJson.call(this, data);
      };

      return handler(req, res);
    };
  };
};