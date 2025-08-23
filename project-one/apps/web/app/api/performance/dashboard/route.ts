/**
 * JARVISH Performance Monitoring Dashboard API
 * Real-time performance metrics and SLA monitoring endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { cacheManager } from '@/lib/performance/cache-manager';
import { queryOptimizer } from '@/lib/performance/query-optimizer';
import { createOptimizedApi, OptimizationPresets } from '@/lib/performance/api-optimizer';

async function handlePerformanceDashboard(req: NextRequest) {
  try {
    // Get latest performance report
    const latestReport = performanceMonitor.getLatestReport();
    
    // Get real-time SLA status
    const slaStatus = await performanceMonitor.getSLAStatus();
    
    // Get system health metrics
    const systemHealth = {
      database: await queryOptimizer.healthCheck(),
      cache: await cacheManager.healthCheck(),
      queryStats: queryOptimizer.getQueryStats(),
      cacheStats: await cacheManager.getStats()
    };

    // Get current metrics summary
    const currentMetrics = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };

    const dashboardData = {
      timestamp: new Date().toISOString(),
      sla: {
        overall: slaStatus.overall,
        targets: slaStatus.targets.map(target => ({
          name: target.name,
          target: target.target,
          current: target.currentValue,
          compliance: target.compliance,
          status: target.status
        }))
      },
      systemHealth: {
        overall: systemHealth.database.primary && systemHealth.cache ? 'healthy' : 'unhealthy',
        components: {
          database: {
            primary: systemHealth.database.primary,
            replica: systemHealth.database.replica,
            activeConnections: systemHealth.queryStats.activeConnections,
            averageLatency: systemHealth.queryStats.averageLatency,
            slowQueries: systemHealth.queryStats.slowQueries
          },
          cache: {
            healthy: systemHealth.cache,
            hitRate: systemHealth.cacheStats.hitRate,
            totalKeys: systemHealth.cacheStats.totalKeys,
            memoryUsage: systemHealth.cacheStats.memoryUsage
          }
        }
      },
      performance: {
        api: {
          p95ResponseTime: latestReport?.metrics?.api?.p95ResponseTime || 0,
          requestsPerSecond: latestReport?.metrics?.api?.requestsPerSecond || 0,
          errorRate: latestReport?.metrics?.api?.errorRate || 0
        },
        frontend: {
          fcp: latestReport?.metrics?.frontend?.fcp || 0,
          lcp: latestReport?.metrics?.frontend?.lcp || 0,
          cls: latestReport?.metrics?.frontend?.cls || 0,
          bundleSize: latestReport?.metrics?.frontend?.bundleSize || 0
        },
        whatsapp: {
          deliveryRate: latestReport?.metrics?.whatsapp?.deliveryRate || 0,
          avgDeliveryTime: latestReport?.metrics?.whatsapp?.avgDeliveryTime || 0,
          queueSize: latestReport?.metrics?.whatsapp?.queueSize || 0
        }
      },
      alerts: latestReport?.recommendations?.filter(rec => rec.includes('CRITICAL')) || [],
      recommendations: latestReport?.recommendations || [],
      system: currentMetrics
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Performance dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data', details: error.message },
      { status: 500 }
    );
  }
}

// Apply API optimization
export const GET = createOptimizedApi(handlePerformanceDashboard, OptimizationPresets.ADMIN_ANALYTICS);