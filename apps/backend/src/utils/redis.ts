import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Create Redis client instance
export const redis = new Redis(process.env.REDIS_URL || redisConfig);

// Redis event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Cache utilities
export const cache = {
  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  // Set cache with expiration
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  },

  // Delete cached data
  async del(key: string | string[]): Promise<void> {
    try {
      if (Array.isArray(key)) {
        await redis.del(...key);
      } else {
        await redis.del(key);
      }
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  },

  // Clear cache by pattern
  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache clear pattern error for ${pattern}:`, error);
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },
};

// Session management utilities
export const session = {
  // Store session
  async store(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
    await cache.set(`session:${sessionId}`, data, ttlSeconds);
  },

  // Get session
  async get(sessionId: string): Promise<any> {
    return await cache.get(`session:${sessionId}`);
  },

  // Delete session
  async destroy(sessionId: string): Promise<void> {
    await cache.del(`session:${sessionId}`);
  },

  // Extend session TTL
  async touch(sessionId: string, ttlSeconds: number = 86400): Promise<void> {
    await redis.expire(`session:${sessionId}`, ttlSeconds);
  },
};

// Rate limiting utilities
export const rateLimiter = {
  // Check rate limit
  async check(key: string, limit: number, windowSeconds: number = 60): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const multi = redis.multi();
    const now = Date.now();
    const window = `${Math.floor(now / (windowSeconds * 1000))}`;
    const redisKey = `rate:${key}:${window}`;

    multi.incr(redisKey);
    multi.expire(redisKey, windowSeconds);

    const results = await multi.exec();
    const count = results?.[0]?.[1] as number || 0;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: new Date(Math.ceil(now / (windowSeconds * 1000)) * windowSeconds * 1000),
    };
  },

  // Reset rate limit
  async reset(key: string): Promise<void> {
    const pattern = `rate:${key}:*`;
    await cache.clearPattern(pattern);
  },
};

// Pub/Sub utilities
export const pubsub = {
  // Publish message
  async publish(channel: string, message: any): Promise<void> {
    try {
      await redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error(`Publish error for channel ${channel}:`, error);
    }
  },

  // Subscribe to channel
  subscribe(channel: string, callback: (message: any) => void): void {
    const subscriber = new Redis(process.env.REDIS_URL || redisConfig);
    
    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`Subscribe error for channel ${channel}:`, err);
      }
    });

    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          console.error(`Message parse error for channel ${channel}:`, error);
        }
      }
    });
  },
};

// Queue utilities for background jobs
export const queue = {
  // Add job to queue
  async add(queueName: string, data: any, delay: number = 0): Promise<void> {
    const jobId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const key = `queue:${queueName}`;
    
    if (delay > 0) {
      await redis.zadd(key, Date.now() + delay, JSON.stringify({ id: jobId, data }));
    } else {
      await redis.lpush(key, JSON.stringify({ id: jobId, data }));
    }
  },

  // Get job from queue
  async get(queueName: string): Promise<{ id: string; data: any } | null> {
    const key = `queue:${queueName}`;
    const job = await redis.rpop(key);
    
    if (job) {
      return JSON.parse(job);
    }
    
    // Check delayed queue
    const now = Date.now();
    const delayedJobs = await redis.zrangebyscore(key, 0, now, 'LIMIT', 0, 1);
    
    if (delayedJobs.length > 0) {
      await redis.zrem(key, delayedJobs[0]);
      return JSON.parse(delayedJobs[0]);
    }
    
    return null;
  },

  // Get queue size
  async size(queueName: string): Promise<number> {
    const key = `queue:${queueName}`;
    const listSize = await redis.llen(key);
    const delayedSize = await redis.zcard(key);
    return listSize + delayedSize;
  },
};

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

export default redis;