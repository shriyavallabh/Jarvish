/**
 * Health Check API Endpoint
 * Provides comprehensive health status for all system components
 */

import { NextRequest, NextResponse } from 'next/server';
import healthChecker from '@/lib/monitoring/health-checker';
import { Logger } from '@/lib/monitoring/logger';
import { metrics } from '@/lib/monitoring/metrics-collector';

// Create logger for this endpoint
const logger = new Logger({ component: 'health-api' });

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check for detailed parameter
    const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
    const cached = request.nextUrl.searchParams.get('cached') === 'true';
    
    // Get health status
    const healthStatus = cached 
      ? healthChecker.getCachedHealthStatus()
      : await healthChecker.getHealthStatus();
    
    // Track health check metrics
    metrics.apiRequests.inc({ 
      method: 'GET', 
      endpoint: '/api/health', 
      status: '200' 
    });
    
    const duration = Date.now() - startTime;
    metrics.apiDuration.observe(
      { method: 'GET', endpoint: '/api/health' },
      duration / 1000
    );
    
    // Log health check
    logger.info('Health check performed', {
      status: healthStatus.status,
      duration,
      cached,
      detailed
    });
    
    // Return appropriate response based on health status
    const statusCode = 
      healthStatus.status === 'healthy' ? 200 :
      healthStatus.status === 'degraded' ? 200 :
      503; // Service unavailable for unhealthy
    
    // Simple response for load balancers
    if (!detailed) {
      return NextResponse.json(
        {
          status: healthStatus.status,
          timestamp: healthStatus.timestamp
        },
        { status: statusCode }
      );
    }
    
    // Detailed response for monitoring systems
    return NextResponse.json(healthStatus, { status: statusCode });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Track error metrics
    metrics.apiRequests.inc({ 
      method: 'GET', 
      endpoint: '/api/health', 
      status: '500' 
    });
    metrics.apiErrors.inc({ 
      method: 'GET', 
      endpoint: '/api/health', 
      error_type: 'server_error' 
    });
    
    // Log error
    logger.error('Health check failed', error as Error, { duration });
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

// Liveness probe endpoint (simple check)
export async function HEAD(request: NextRequest) {
  try {
    // Check if system is ready for traffic
    const isReady = healthChecker.isSystemReady();
    
    if (isReady) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (error) {
    logger.error('Liveness check failed', error as Error);
    return new NextResponse(null, { status: 503 });
  }
}