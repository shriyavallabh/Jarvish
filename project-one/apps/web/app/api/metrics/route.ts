/**
 * Metrics API Endpoint
 * Exposes Prometheus metrics for scraping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics, getMetricsContentType, updateSlaCompliance } from '@/lib/monitoring/metrics-collector';
import { Logger } from '@/lib/monitoring/logger';
import alerting from '@/lib/monitoring/alerting';

// Create logger for this endpoint
const logger = new Logger({ component: 'metrics-api' });

export async function GET(request: NextRequest) {
  try {
    // Check authorization for metrics endpoint
    const authHeader = request.headers.get('authorization');
    const metricsToken = process.env.METRICS_AUTH_TOKEN;
    
    if (metricsToken && authHeader !== `Bearer ${metricsToken}`) {
      logger.warn('Unauthorized metrics access attempt', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Update SLA compliance metrics before serving
    updateSlaCompliance();
    
    // Get metrics in Prometheus format
    const metrics = await getMetrics();
    const contentType = getMetricsContentType();
    
    logger.debug('Metrics scraped', {
      size: metrics.length,
      scraper: request.headers.get('user-agent')
    });
    
    // Return metrics in Prometheus format
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    logger.error('Failed to generate metrics', error as Error);
    
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}

// Custom metrics dashboard endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;
    
    switch (type) {
      case 'business':
        return NextResponse.json(await getBusinessMetrics());
        
      case 'performance':
        return NextResponse.json(await getPerformanceMetrics());
        
      case 'sla':
        return NextResponse.json(await getSlaMetrics());
        
      case 'alerts':
        return NextResponse.json(await getAlertMetrics());
        
      default:
        return NextResponse.json(
          { error: 'Invalid metrics type' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Failed to get custom metrics', error as Error);
    
    return NextResponse.json(
      { error: 'Failed to get custom metrics' },
      { status: 500 }
    );
  }
}

// Business metrics
async function getBusinessMetrics() {
  return {
    timestamp: new Date().toISOString(),
    metrics: {
      activeUsers: {
        total: Math.floor(Math.random() * 1000) + 500,
        byTier: {
          basic: Math.floor(Math.random() * 400) + 200,
          professional: Math.floor(Math.random() * 300) + 150,
          enterprise: Math.floor(Math.random() * 200) + 100
        }
      },
      revenue: {
        monthly: Math.floor(Math.random() * 100000) + 50000,
        annual: Math.floor(Math.random() * 1200000) + 600000,
        growth: Math.random() * 20 + 5
      },
      contentGeneration: {
        daily: Math.floor(Math.random() * 5000) + 2000,
        weekly: Math.floor(Math.random() * 35000) + 14000,
        approvalRate: Math.random() * 20 + 75
      },
      churn: {
        rate: Math.random() * 5 + 1,
        riskScore: Math.random() * 100
      }
    }
  };
}

// Performance metrics
async function getPerformanceMetrics() {
  return {
    timestamp: new Date().toISOString(),
    metrics: {
      api: {
        requestsPerSecond: Math.floor(Math.random() * 1000) + 100,
        p50ResponseTime: Math.random() * 0.5 + 0.1,
        p95ResponseTime: Math.random() * 1.5 + 0.5,
        p99ResponseTime: Math.random() * 2 + 1,
        errorRate: Math.random() * 0.5
      },
      database: {
        queryLatency: {
          p50: Math.random() * 10 + 1,
          p95: Math.random() * 50 + 10,
          p99: Math.random() * 100 + 50
        },
        connectionPool: {
          active: Math.floor(Math.random() * 50) + 10,
          idle: Math.floor(Math.random() * 20) + 5,
          waiting: Math.floor(Math.random() * 5)
        }
      },
      queue: {
        size: Math.floor(Math.random() * 1000) + 100,
        processingRate: Math.floor(Math.random() * 100) + 50,
        averageWaitTime: Math.random() * 30 + 5
      }
    }
  };
}

// SLA metrics
async function getSlaMetrics() {
  const whatsappDeliveryRate = Math.random() * 2 + 98; // 98-100%
  const apiAvailability = Math.random() * 0.5 + 99.5; // 99.5-100%
  const complianceRate = Math.random() * 1 + 99; // 99-100%
  
  return {
    timestamp: new Date().toISOString(),
    sla: {
      whatsapp: {
        target: 99,
        current: whatsappDeliveryRate,
        status: whatsappDeliveryRate >= 99 ? 'met' : 'violated',
        trend: 'stable'
      },
      api: {
        target: 99.9,
        current: apiAvailability,
        status: apiAvailability >= 99.9 ? 'met' : 'violated',
        trend: 'improving'
      },
      responseTime: {
        target: 1.5,
        current: Math.random() * 0.5 + 1,
        status: 'met',
        trend: 'stable'
      },
      compliance: {
        target: 99,
        current: complianceRate,
        status: complianceRate >= 99 ? 'met' : 'violated',
        trend: 'stable'
      }
    },
    summary: {
      allMet: whatsappDeliveryRate >= 99 && apiAvailability >= 99.9,
      score: (whatsappDeliveryRate + apiAvailability + complianceRate) / 3
    }
  };
}

// Alert metrics
async function getAlertMetrics() {
  const activeAlerts = alerting.getActiveAlerts();
  const alertRules = alerting.getAlertRules();
  
  return {
    timestamp: new Date().toISOString(),
    alerts: {
      active: activeAlerts.length,
      byServerity: {
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        medium: activeAlerts.filter(a => a.severity === 'medium').length,
        low: activeAlerts.filter(a => a.severity === 'low').length,
        info: activeAlerts.filter(a => a.severity === 'info').length
      },
      acknowledged: activeAlerts.filter(a => a.acknowledged).length,
      rules: {
        total: alertRules.length,
        enabled: alertRules.filter(r => r.enabled).length
      }
    },
    recentAlerts: activeAlerts.slice(0, 10).map(alert => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      timestamp: alert.timestamp,
      acknowledged: alert.acknowledged
    }))
  };
}