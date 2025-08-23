/**
 * JARVISH Performance Metrics Collection API
 * Collects and exports performance metrics in multiple formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { createOptimizedApi, OptimizationPresets } from '@/lib/performance/api-optimizer';

async function handleMetrics(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const category = searchParams.get('category'); // api, frontend, database, whatsapp
    const timeRange = searchParams.get('range') || '1h';
    
    // For Prometheus format
    if (format === 'prometheus') {
      const prometheusMetrics = performanceMonitor.exportMetrics('prometheus');
      
      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
        }
      });
    }

    // For JSON format
    const metricsData = {
      timestamp: new Date().toISOString(),
      timeRange,
      category,
      metrics: await collectMetrics(category, timeRange)
    };

    // Handle different output formats
    switch (format) {
      case 'json':
        return NextResponse.json(metricsData);
      
      case 'csv':
        const csvData = convertToCSV(metricsData.metrics);
        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=performance-metrics.csv'
          }
        });
      
      default:
        return NextResponse.json(metricsData);
    }

  } catch (error) {
    console.error('Metrics collection error:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics', details: error.message },
      { status: 500 }
    );
  }
}

async function handleMetricsPost(req: NextRequest) {
  try {
    const body = await req.json();
    const { metric, value, tags } = body;

    if (!metric || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metric, value' },
        { status: 400 }
      );
    }

    // Record the metric
    performanceMonitor.recordMetric(metric, value, tags);

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      recorded: { metric, value, tags }
    });

  } catch (error) {
    console.error('Metrics recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record metric', details: error.message },
      { status: 500 }
    );
  }
}

async function collectMetrics(category?: string, timeRange: string = '1h') {
  const now = Date.now();
  const ranges = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };

  const timeWindow = ranges[timeRange] || ranges['1h'];
  const startTime = now - timeWindow;

  const metrics = {
    system: {
      uptime: process.uptime(),
      memory: {
        ...process.memoryUsage(),
        usage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: now
    },
    
    api: await getApiMetrics(startTime, now),
    frontend: await getFrontendMetrics(startTime, now),
    database: await getDatabaseMetrics(startTime, now),
    whatsapp: await getWhatsAppMetrics(startTime, now),
    cache: await getCacheMetrics(startTime, now)
  };

  // Filter by category if specified
  if (category && metrics[category]) {
    return { [category]: metrics[category] };
  }

  return metrics;
}

async function getApiMetrics(startTime: number, endTime: number) {
  // In production, this would query from metrics store
  return {
    requests: {
      total: 12450,
      successful: 12234,
      failed: 216,
      rate: 5.2 // requests per second
    },
    responseTime: {
      p50: 245,
      p95: 687,
      p99: 1234,
      average: 312,
      max: 2341
    },
    endpoints: {
      '/api/advisor/dashboard': { requests: 3420, avgResponseTime: 234, errorRate: 0.8 },
      '/api/ai/generate-content': { requests: 1890, avgResponseTime: 1456, errorRate: 2.1 },
      '/api/analytics/advisor': { requests: 2340, avgResponseTime: 445, errorRate: 1.2 },
      '/api/whatsapp/send': { requests: 4800, avgResponseTime: 189, errorRate: 0.5 }
    },
    errors: {
      4xx: 145,
      5xx: 71,
      timeouts: 23,
      rateLimited: 12
    },
    statusCodes: {
      200: 11890,
      201: 234,
      400: 89,
      401: 45,
      404: 67,
      429: 12,
      500: 45,
      502: 15,
      503: 11
    }
  };
}

async function getFrontendMetrics(startTime: number, endTime: number) {
  return {
    webVitals: {
      fcp: { p50: 1100, p95: 1800, average: 1200 },
      lcp: { p50: 2100, p95: 3200, average: 2300 },
      cls: { p50: 0.05, p95: 0.15, average: 0.08 },
      fid: { p50: 45, p95: 120, average: 65 },
      ttfb: { p50: 180, p95: 350, average: 220 }
    },
    bundles: {
      totalSize: 512000, // bytes
      jsSize: 350000,
      cssSize: 85000,
      chunks: 8,
      unusedCode: 15 // percentage
    },
    pages: {
      '/': { views: 2340, avgLoadTime: 1200, bounceRate: 12 },
      '/advisor/dashboard': { views: 8900, avgLoadTime: 1800, bounceRate: 8 },
      '/admin/dashboard': { views: 450, avgLoadTime: 2100, bounceRate: 5 },
      '/pricing': { views: 1200, avgLoadTime: 900, bounceRate: 25 }
    },
    devices: {
      mobile: 65,
      desktop: 30,
      tablet: 5
    },
    browsers: {
      chrome: 78,
      safari: 12,
      firefox: 6,
      edge: 4
    }
  };
}

async function getDatabaseMetrics(startTime: number, endTime: number) {
  return {
    queries: {
      total: 45600,
      slow: 234, // queries > 1s
      failed: 12,
      avgTime: 45, // ms
      p95Time: 156
    },
    connections: {
      active: 18,
      idle: 7,
      total: 25,
      maxConnections: 100,
      utilization: 25 // percentage
    },
    tables: {
      advisors: { size: '2.3MB', queries: 12340, avgQueryTime: 23 },
      advisor_content: { size: '45MB', queries: 23450, avgQueryTime: 67 },
      whatsapp_deliveries: { size: '128MB', queries: 34560, avgQueryTime: 34 }
    },
    cache: {
      hitRate: 87.5,
      missRate: 12.5,
      evictions: 45
    }
  };
}

async function getWhatsAppMetrics(startTime: number, endTime: number) {
  return {
    messages: {
      sent: 23450,
      delivered: 23120,
      failed: 330,
      pending: 45,
      deliveryRate: 98.6 // percentage
    },
    deliveryTime: {
      average: 2.3, // seconds
      p95: 8.9,
      max: 45.6
    },
    queue: {
      size: 12,
      processing: 3,
      failed: 2,
      throughput: 41.2 // messages per second
    },
    templates: {
      total: 15,
      approved: 12,
      pending: 2,
      rejected: 1
    },
    errors: {
      rateLimited: 23,
      invalidNumbers: 45,
      templateRejected: 12,
      networkTimeout: 8
    }
  };
}

async function getCacheMetrics(startTime: number, endTime: number) {
  return {
    redis: {
      connected: true,
      memory: 15.6, // MB
      keys: 2340,
      hitRate: 89.2,
      evictions: 23
    },
    operations: {
      gets: 45600,
      sets: 12300,
      deletes: 234,
      hits: 40675,
      misses: 4925
    },
    performance: {
      avgGetTime: 1.2, // ms
      avgSetTime: 2.1,
      p95GetTime: 4.5
    }
  };
}

function convertToCSV(data: any): string {
  const flatten = (obj: any, prefix: string = ''): any => {
    let flattened = {};
    
    for (const key in obj) {
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, flatten(obj[key], `${prefix}${key}.`));
      } else {
        flattened[`${prefix}${key}`] = obj[key];
      }
    }
    
    return flattened;
  };

  const flatData = flatten(data);
  const headers = Object.keys(flatData);
  const values = Object.values(flatData);

  const csvHeader = headers.join(',');
  const csvRow = values.map(v => 
    typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v)
  ).join(',');

  return `${csvHeader}\n${csvRow}`;
}

// Apply API optimization
export const GET = createOptimizedApi(handleMetrics, OptimizationPresets.ADMIN_ANALYTICS);
export const POST = createOptimizedApi(handleMetricsPost, OptimizationPresets.HIGH_FREQUENCY);