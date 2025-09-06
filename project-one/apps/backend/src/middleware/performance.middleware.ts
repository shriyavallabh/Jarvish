// Performance Monitoring Middleware
// Automatic API performance tracking and metrics collection

import { Request, Response, NextFunction } from 'express';
import monitoringService from '../services/monitoring-service';

interface RequestWithTiming extends Request {
  startTime?: number;
}

/**
 * Performance monitoring middleware
 * Automatically tracks response times and logs slow requests
 */
export const performanceMiddleware = (req: RequestWithTiming, res: Response, next: NextFunction) => {
  // Record start time
  req.startTime = Date.now();

  // Override res.end to capture metrics
  const originalEnd = res.end.bind(res);
  
  res.end = function(chunk?: any, encoding?: BufferEncoding, cb?: () => void) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    // Log performance metrics
    monitoringService.recordPerformance({
      endpoint: req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      userId: req.headers['x-user-id'] as string // If available
    });

    // Call original end method with proper arguments
    if (typeof chunk === 'function') {
      return originalEnd(chunk);
    } else if (typeof encoding === 'function') {
      return originalEnd(chunk, encoding);
    } else {
      return originalEnd(chunk, encoding, cb);
    }
  } as any;

  next();
};

/**
 * Request logging middleware
 * Logs all incoming requests with timestamps
 */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  console.log(`📥 ${new Date().toISOString()} ${req.method} ${req.path}`, {
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
    ip: req.ip || req.connection.remoteAddress,
    contentLength: req.headers['content-length'] || '0'
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    
    const statusIcon = status >= 500 ? '❌' : 
                      status >= 400 ? '⚠️' : 
                      status >= 300 ? '🔄' : '✅';
    
    console.log(`📤 ${statusIcon} ${req.method} ${req.path} ${status} ${duration}ms`);
  });

  next();
};

/**
 * Health check middleware
 * Adds basic health metrics to all responses
 */
export const healthMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add health metrics to response headers
  res.setHeader('X-System-Uptime', Math.floor(process.uptime()));
  res.setHeader('X-Memory-Usage', Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100);
  res.setHeader('X-Response-Time', Date.now());

  next();
};