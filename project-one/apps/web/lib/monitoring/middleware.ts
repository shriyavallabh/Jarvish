/**
 * Monitoring Middleware for Next.js
 * Tracks all requests, performance, and errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Monitoring configuration
const MONITORING_CONFIG = {
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
  enablePerformanceTracking: process.env.ENABLE_PERFORMANCE_TRACKING !== 'false',
  enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
  slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '3000'), // ms
  excludePaths: [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/api/health',
    '/api/metrics'
  ]
};

export interface RequestContext {
  correlationId: string;
  requestId: string;
  userId?: string;
  sessionId?: string;
  startTime: number;
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Extract user context from request
 */
function extractUserContext(request: NextRequest): Partial<RequestContext> {
  const headers = request.headers;
  
  return {
    userId: headers.get('x-user-id') || undefined,
    sessionId: headers.get('x-session-id') || undefined,
    userAgent: headers.get('user-agent') || undefined,
    ip: headers.get('x-forwarded-for') || 
        headers.get('x-real-ip') || 
        request.ip || 
        undefined
  };
}

/**
 * Check if path should be monitored
 */
function shouldMonitorPath(path: string): boolean {
  return !MONITORING_CONFIG.excludePaths.some(excludePath => 
    path.startsWith(excludePath)
  );
}

/**
 * Main monitoring middleware
 */
export function monitoringMiddleware(request: NextRequest) {
  // Skip monitoring for excluded paths
  if (!shouldMonitorPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  // Create request context
  const correlationId = request.headers.get('x-correlation-id') || uuidv4();
  const requestId = uuidv4();
  const startTime = Date.now();
  
  const context: RequestContext = {
    correlationId,
    requestId,
    startTime,
    path: request.nextUrl.pathname,
    method: request.method,
    ...extractUserContext(request)
  };
  
  // Clone the response to add headers
  const response = NextResponse.next();
  
  // Add correlation ID to response headers
  response.headers.set('x-correlation-id', correlationId);
  response.headers.set('x-request-id', requestId);
  
  // Add performance timing headers
  response.headers.set('x-response-time', `${Date.now() - startTime}ms`);
  
  // Log request if enabled
  if (MONITORING_CONFIG.enableRequestLogging) {
    logRequest(context);
  }
  
  // Track performance if enabled
  if (MONITORING_CONFIG.enablePerformanceTracking) {
    trackPerformance(context, Date.now() - startTime);
  }
  
  return response;
}

/**
 * Log request details
 */
function logRequest(context: RequestContext): void {
  // In production, this would send to your logging service
  if (process.env.NODE_ENV === 'development') {
    console.log('Request:', {
      correlationId: context.correlationId,
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      userId: context.userId,
      ip: context.ip
    });
  }
}

/**
 * Track performance metrics
 */
function trackPerformance(context: RequestContext, duration: number): void {
  // Check for slow requests
  if (duration > MONITORING_CONFIG.slowRequestThreshold) {
    logSlowRequest(context, duration);
  }
  
  // In production, this would send to your metrics service
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance:', {
      path: context.path,
      duration: `${duration}ms`,
      slow: duration > MONITORING_CONFIG.slowRequestThreshold
    });
  }
}

/**
 * Log slow request for investigation
 */
function logSlowRequest(context: RequestContext, duration: number): void {
  console.warn('Slow request detected:', {
    ...context,
    duration: `${duration}ms`,
    threshold: `${MONITORING_CONFIG.slowRequestThreshold}ms`
  });
}

/**
 * Error boundary wrapper for API routes
 */
export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options?: {
    name?: string;
    skipLogging?: boolean;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    const correlationId = uuidv4();
    
    try {
      // Execute the handler
      const result = await handler(...args);
      
      // Track success metrics
      if (!options?.skipLogging) {
        const duration = Date.now() - startTime;
        console.log('Handler success:', {
          name: options?.name || handler.name,
          correlationId,
          duration: `${duration}ms`
        });
      }
      
      return result;
    } catch (error) {
      // Track error metrics
      const duration = Date.now() - startTime;
      console.error('Handler error:', {
        name: options?.name || handler.name,
        correlationId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Re-throw the error
      throw error;
    }
  }) as T;
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  
  constructor() {
    this.startTime = Date.now();
  }
  
  mark(name: string): void {
    this.marks.set(name, Date.now());
  }
  
  measure(name: string, startMark?: string): number {
    const endTime = Date.now();
    const startTime = startMark ? this.marks.get(startMark) : this.startTime;
    
    if (!startTime) {
      throw new Error(`Mark '${startMark}' not found`);
    }
    
    return endTime - startTime;
  }
  
  getMarks(): Record<string, number> {
    const result: Record<string, number> = {};
    this.marks.forEach((time, name) => {
      result[name] = time - this.startTime;
    });
    return result;
  }
  
  reset(): void {
    this.startTime = Date.now();
    this.marks.clear();
  }
}

/**
 * Distributed tracing utility
 */
export class TraceSpan {
  private spanId: string;
  private traceId: string;
  private parentSpanId?: string;
  private startTime: number;
  private endTime?: number;
  private tags: Record<string, any> = {};
  private events: Array<{ name: string; timestamp: number; attributes?: any }> = [];
  
  constructor(name: string, traceId?: string, parentSpanId?: string) {
    this.spanId = uuidv4();
    this.traceId = traceId || uuidv4();
    this.parentSpanId = parentSpanId;
    this.startTime = Date.now();
    this.tags.name = name;
  }
  
  setTag(key: string, value: any): void {
    this.tags[key] = value;
  }
  
  addEvent(name: string, attributes?: any): void {
    this.events.push({
      name,
      timestamp: Date.now(),
      attributes
    });
  }
  
  end(): void {
    this.endTime = Date.now();
    this.export();
  }
  
  private export(): void {
    // In production, this would send to your tracing service
    if (process.env.NODE_ENV === 'development') {
      console.log('Trace span:', {
        spanId: this.spanId,
        traceId: this.traceId,
        parentSpanId: this.parentSpanId,
        name: this.tags.name,
        duration: this.endTime ? this.endTime - this.startTime : null,
        tags: this.tags,
        events: this.events
      });
    }
  }
}

/**
 * Create a new trace span
 */
export function createSpan(name: string, traceId?: string, parentSpanId?: string): TraceSpan {
  return new TraceSpan(name, traceId, parentSpanId);
}

export default monitoringMiddleware;