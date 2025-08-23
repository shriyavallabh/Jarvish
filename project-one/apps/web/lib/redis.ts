/**
 * Redis Client
 * Provides caching and session management
 * Using mock implementation for development/testing
 */

interface RedisClient {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, options?: { ex?: number }) => Promise<void>
  del: (key: string) => Promise<void>
  exists: (key: string) => Promise<boolean>
  expire: (key: string, seconds: number) => Promise<void>
  ttl: (key: string) => Promise<number>
  keys: (pattern: string) => Promise<string[]>
  flushall: () => Promise<void>
}

// In-memory store for development/testing
const memoryStore: Map<string, { value: string; expiry?: number }> = new Map()

/**
 * Mock Redis client for development/testing
 */
class MockRedisClient implements RedisClient {
  async get(key: string): Promise<string | null> {
    const item = memoryStore.get(key)
    if (!item) return null
    
    if (item.expiry && Date.now() > item.expiry) {
      memoryStore.delete(key)
      return null
    }
    
    return item.value
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    const expiry = options?.ex ? Date.now() + (options.ex * 1000) : undefined
    memoryStore.set(key, { value, expiry })
  }

  async del(key: string): Promise<void> {
    memoryStore.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    const item = memoryStore.get(key)
    if (!item) return false
    
    if (item.expiry && Date.now() > item.expiry) {
      memoryStore.delete(key)
      return false
    }
    
    return true
  }

  async expire(key: string, seconds: number): Promise<void> {
    const item = memoryStore.get(key)
    if (item) {
      item.expiry = Date.now() + (seconds * 1000)
    }
  }

  async ttl(key: string): Promise<number> {
    const item = memoryStore.get(key)
    if (!item || !item.expiry) return -1
    
    const ttl = Math.floor((item.expiry - Date.now()) / 1000)
    return ttl > 0 ? ttl : -1
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return Array.from(memoryStore.keys()).filter(key => regex.test(key))
  }

  async flushall(): Promise<void> {
    memoryStore.clear()
  }
}

// Export singleton instance
export const redis: RedisClient = new MockRedisClient()

/**
 * Production Redis client (commented out for now)
 * Uncomment and configure when deploying to production
 */
/*
import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
})

client.on('error', (err) => console.error('Redis Client Error', err))

// Connect to Redis
await client.connect()

export const redis = client
*/