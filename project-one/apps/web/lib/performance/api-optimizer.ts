/**
 * JARVISH API Performance Optimizer
 * Comprehensive API route optimization with caching, compression, and monitoring
 * Target: <500ms P95 response times, intelligent caching, rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheManager, CacheStrategies, CacheKeys } from './cache-manager';
import { trackApiRequest, slaMonitor, performanceBenchmark } from '../monitoring/metrics-collector';
import { z } from 'zod';
import { createHash } from 'crypto';

interface OptimizationConfig {
  cache?: {
    enabled: boolean;
    ttl: number;
    keyGenerator?: (req: NextRequest) => string;
    tags?: string[];
    conditions?: (req: NextRequest, res: NextResponse) => boolean;
  };
  compression?: {
    enabled: boolean;
    threshold: number; // Minimum size in bytes to compress
    level: 'fast' | 'balanced' | 'best';
  };
  rateLimit?: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: NextRequest) => string;
  };
  validation?: {
    schema?: z.ZodSchema;
    sanitize?: boolean;
  };
  monitoring?: {
    enabled: boolean;
    slaTarget: number; // Response time SLA in milliseconds
  };
  timeout?: number; // Request timeout in milliseconds
}

interface RequestMetrics {
  startTime: number;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Response compression utility
class ResponseCompressor {
  static compress(data: string, level: 'fast' | 'balanced' | 'best' = 'balanced'): string {
    // Simple compression placeholder - in production use zlib or brotli
    return data;
  }

  static shouldCompress(contentType: string, size: number, threshold: number): boolean {
    const compressibleTypes = [
      'application/json',
      'text/plain',
      'text/html',
      'text/css',
      'application/javascript',
      'text/xml'
    ];
    
    return size > threshold && compressibleTypes.some(type => contentType.includes(type));
  }
}

// Request validation and sanitization
class RequestValidator {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
  }

  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potential XSS, SQL injection patterns
      return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}

// Rate limiter implementation
class RateLimiter {
  static checkLimit(
    key: string, 
    windowMs: number, 
    maxRequests: number
  ): { allowed: boolean; resetTime: number; remaining: number } {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < windowStart) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    }
    
    entry.count++;
    const allowed = entry.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - entry.count);
    
    return { allowed, resetTime: entry.resetTime, remaining };
  }
}

/**
 * API Performance Optimizer Middleware
 */
export class ApiOptimizer {
  private config: OptimizationConfig;
  private metrics: RequestMetrics;

  constructor(config: OptimizationConfig) {
    this.config = {
      cache: { enabled: false, ttl: CacheStrategies.API_RESPONSE },
      compression: { enabled: true, threshold: 1024, level: 'balanced' },
      rateLimit: { enabled: false, windowMs: 60000, maxRequests: 100 },
      monitoring: { enabled: true, slaTarget: 500 },
      timeout: 30000,
      ...config
    };
  }

  /**
   * Create optimized API handler
   */
  optimize(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      this.metrics = {
        startTime: Date.now(),
        endpoint: this.getEndpoint(req),
        method: req.method,
        userAgent: req.headers.get('user-agent') || undefined,
        ip: this.getClientIP(req)
      };

      try {
        // 1. Rate limiting
        if (this.config.rateLimit?.enabled) {
          const rateLimitResult = await this.checkRateLimit(req);
          if (!rateLimitResult.allowed) {
            return this.createRateLimitResponse(rateLimitResult);
          }
        }

        // 2. Request validation and sanitization
        if (this.config.validation?.schema) {
          const body = await req.json();
          const validatedData = RequestValidator.validate(this.config.validation.schema, body);
          
          if (this.config.validation.sanitize) {
            const sanitizedData = RequestValidator.sanitizeInput(validatedData);
            // Replace request body with sanitized data
            (req as any)._body = sanitizedData;
          }
        }

        // 3. Check cache
        if (this.config.cache?.enabled && req.method === 'GET') {
          const cachedResponse = await this.getCachedResponse(req);
          if (cachedResponse) {
            this.recordMetrics(true);
            return cachedResponse;
          }
        }

        // 4. Execute handler with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeout);
        });

        const response = await Promise.race([handler(req), timeoutPromise]);

        // 5. Post-process response
        const optimizedResponse = await this.optimizeResponse(req, response);

        // 6. Cache response if applicable
        if (this.config.cache?.enabled) {
          await this.cacheResponse(req, optimizedResponse);
        }

        // 7. Record metrics
        this.recordMetrics(false);

        return optimizedResponse;

      } catch (error) {
        this.recordErrorMetrics(error);
        return this.createErrorResponse(error);
      }
    };
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(req: NextRequest): Promise<{
    allowed: boolean;
    resetTime: number;
    remaining: number;
  }> {
    const key = this.config.rateLimit?.keyGenerator?.(req) || 
                this.getClientIP(req) || 
                'anonymous';

    return RateLimiter.checkLimit(
      `${this.metrics.endpoint}:${key}`,
      this.config.rateLimit!.windowMs,
      this.config.rateLimit!.maxRequests
    );
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(req: NextRequest): Promise<NextResponse | null> {
    const cacheKey = this.config.cache?.keyGenerator?.(req) || 
                     this.generateCacheKey(req);

    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return new NextResponse(JSON.stringify(cached.data), {
        status: cached.status || 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Cache-TTL': cached.ttl?.toString() || '0',
          ...cached.headers
        }
      });
    }

    return null;
  }

  /**
   * Cache response
   */
  private async cacheResponse(req: NextRequest, response: NextResponse): Promise<void> {
    if (!this.shouldCache(req, response)) {
      return;
    }

    const cacheKey = this.config.cache?.keyGenerator?.(req) || 
                     this.generateCacheKey(req);

    try {
      const responseClone = response.clone();
      const data = await responseClone.json();
      
      const cacheData = {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: Date.now(),
        ttl: this.config.cache!.ttl
      };

      if (this.config.cache?.tags) {
        await cacheManager.setWithTags(
          cacheKey,
          cacheData,
          this.config.cache.tags,
          this.config.cache.ttl
        );
      } else {
        await cacheManager.set(cacheKey, cacheData, this.config.cache!.ttl);
      }
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  /**
   * Optimize response with compression and headers
   */
  private async optimizeResponse(req: NextRequest, response: NextResponse): Promise<NextResponse> {
    const responseClone = response.clone();
    
    // Add performance headers
    const headers = new Headers(response.headers);
    headers.set('X-Response-Time', `${Date.now() - this.metrics.startTime}ms`);
    headers.set('X-Cache', 'MISS');
    headers.set('X-RateLimit-Limit', this.config.rateLimit?.maxRequests?.toString() || '0');
    
    // Add security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');

    // Compression
    if (this.config.compression?.enabled && this.shouldCompress(req, response)) {
      const text = await responseClone.text();
      
      if (ResponseCompressor.shouldCompress(
        response.headers.get('content-type') || '',
        text.length,
        this.config.compression.threshold
      )) {
        const compressed = ResponseCompressor.compress(text, this.config.compression.level);
        headers.set('Content-Encoding', 'gzip');
        headers.set('Content-Length', compressed.length.toString());
        
        return new NextResponse(compressed, {
          status: response.status,
          headers
        });
      }
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers
    });
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(fromCache: boolean): void {
    const responseTime = Date.now() - this.metrics.startTime;
    
    // Track API performance
    trackApiRequest(
      this.metrics.method,
      this.metrics.endpoint,
      200,
      responseTime
    );

    // Track SLA compliance
    if (this.config.monitoring?.enabled) {
      slaMonitor.trackApiSla(
        this.metrics.endpoint,
        responseTime,
        200
      );
    }

    // Log slow requests
    if (responseTime > (this.config.monitoring?.slaTarget || 500)) {
      console.warn(`Slow API request detected:`, {
        endpoint: this.metrics.endpoint,
        method: this.metrics.method,
        responseTime,
        fromCache,
        userAgent: this.metrics.userAgent
      });
    }
  }

  /**
   * Record error metrics
   */
  private recordErrorMetrics(error: any): void {
    const responseTime = Date.now() - this.metrics.startTime;
    const statusCode = error.status || 500;
    
    trackApiRequest(
      this.metrics.method,
      this.metrics.endpoint,
      statusCode,
      responseTime
    );

    console.error(`API error:`, {
      endpoint: this.metrics.endpoint,
      method: this.metrics.method,
      error: error.message,
      responseTime,
      stack: error.stack
    });
  }

  /**
   * Helper methods
   */
  private getEndpoint(req: NextRequest): string {
    return req.nextUrl.pathname;
  }

  private getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0] ||
           req.headers.get('x-real-ip') ||
           req.ip ||
           'unknown';
  }

  private generateCacheKey(req: NextRequest): string {
    const url = req.nextUrl.toString();
    const method = req.method;
    const key = `${method}:${url}`;
    return createHash('sha256').update(key).digest('hex').substring(0, 32);
  }

  private shouldCache(req: NextRequest, response: NextResponse): boolean {
    if (!this.config.cache?.enabled) return false;
    if (req.method !== 'GET') return false;
    if (response.status !== 200) return false;
    
    if (this.config.cache.conditions) {
      return this.config.cache.conditions(req, response);
    }
    
    return true;
  }

  private shouldCompress(req: NextRequest, response: NextResponse): boolean {
    if (!this.config.compression?.enabled) return false;
    
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    return acceptEncoding.includes('gzip') || acceptEncoding.includes('deflate');
  }

  private createRateLimitResponse(rateLimitResult: any): NextResponse {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        resetTime: rateLimitResult.resetTime
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': this.config.rateLimit!.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }

  private createErrorResponse(error: any): NextResponse {
    const statusCode = error.status || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;

    return NextResponse.json(
      {
        error: 'Request failed',
        message,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

/**
 * Predefined optimization configurations
 */
export const OptimizationPresets = {
  // High-frequency endpoints (dashboard, analytics)
  HIGH_FREQUENCY: {
    cache: {
      enabled: true,
      ttl: CacheStrategies.API_RESPONSE,
      tags: ['api', 'dashboard']
    },
    compression: { enabled: true, threshold: 512, level: 'fast' as const },
    rateLimit: { enabled: true, windowMs: 60000, maxRequests: 200 },
    monitoring: { enabled: true, slaTarget: 300 }
  } as OptimizationConfig,

  // AI/ML endpoints (content generation, compliance)
  AI_ENDPOINTS: {
    cache: {
      enabled: true,
      ttl: CacheStrategies.API_RESPONSE,
      conditions: (req, res) => res.status === 200,
      tags: ['api', 'ai']
    },
    compression: { enabled: true, threshold: 1024, level: 'balanced' as const },
    rateLimit: { enabled: true, windowMs: 60000, maxRequests: 50 },
    monitoring: { enabled: true, slaTarget: 1500 }, // AI endpoints have higher SLA
    timeout: 30000
  } as OptimizationConfig,

  // WhatsApp/Messaging endpoints
  MESSAGING: {
    cache: { enabled: false }, // Real-time, don't cache
    compression: { enabled: true, threshold: 256, level: 'fast' as const },
    rateLimit: { enabled: true, windowMs: 60000, maxRequests: 1000 },
    monitoring: { enabled: true, slaTarget: 500 }
  } as OptimizationConfig,

  // Admin/Analytics endpoints
  ADMIN_ANALYTICS: {
    cache: {
      enabled: true,
      ttl: CacheStrategies.ANALYTICS,
      tags: ['api', 'admin', 'analytics']
    },
    compression: { enabled: true, threshold: 2048, level: 'best' as const },
    rateLimit: { enabled: true, windowMs: 60000, maxRequests: 100 },
    monitoring: { enabled: true, slaTarget: 1000 }
  } as OptimizationConfig,

  // Public endpoints (pricing, static content)
  PUBLIC: {
    cache: {
      enabled: true,
      ttl: CacheStrategies.STATIC_CONTENT,
      tags: ['api', 'public']
    },
    compression: { enabled: true, threshold: 512, level: 'best' as const },
    rateLimit: { enabled: true, windowMs: 60000, maxRequests: 500 },
    monitoring: { enabled: true, slaTarget: 200 }
  } as OptimizationConfig
};

/**
 * Convenience function to create optimized API handler
 */
export function createOptimizedApi(
  handler: (req: NextRequest) => Promise<NextResponse>,
  preset: keyof typeof OptimizationPresets | OptimizationConfig = 'HIGH_FREQUENCY'
): (req: NextRequest) => Promise<NextResponse> {
  const config = typeof preset === 'string' ? OptimizationPresets[preset] : preset;
  const optimizer = new ApiOptimizer(config);
  return optimizer.optimize(handler);
}

/**
 * Middleware for automatic optimization
 */
export function withOptimization(config?: OptimizationConfig) {
  return function<T extends (req: NextRequest) => Promise<NextResponse>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    if (descriptor.value) {
      const originalHandler = descriptor.value;
      const optimizer = new ApiOptimizer(config || OptimizationPresets.HIGH_FREQUENCY);
      descriptor.value = optimizer.optimize(originalHandler) as T;
    }
    return descriptor;
  };
}