/**
 * Performance Metrics API Route Tests
 * Tests for the metrics collection and export endpoints
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/performance/metrics/route';
import { performanceMonitor } from '@/lib/performance/performance-monitor';

// Mock performance monitor
jest.mock('@/lib/performance/performance-monitor', () => ({
  performanceMonitor: {
    exportMetrics: jest.fn(),
    recordMetric: jest.fn()
  }
}));

// Mock API optimizer
jest.mock('@/lib/performance/api-optimizer', () => ({
  createOptimizedApi: jest.fn((handler) => handler),
  OptimizationPresets: {
    ADMIN_ANALYTICS: {},
    HIGH_FREQUENCY: {}
  }
}));

describe('Performance Metrics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/performance/metrics', () => {
    it('should return JSON metrics by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance/metrics');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('metrics');
      expect(data.metrics).toHaveProperty('system');
      expect(data.metrics).toHaveProperty('api');
      expect(data.metrics).toHaveProperty('frontend');
      expect(data.metrics).toHaveProperty('database');
      expect(data.metrics).toHaveProperty('whatsapp');
    });

    it('should return Prometheus format when requested', async () => {
      const prometheusMetrics = `# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total 12450
# HELP api_response_time_seconds API response time
# TYPE api_response_time_seconds histogram
api_response_time_seconds_bucket{le="0.1"} 5000`;

      (performanceMonitor.exportMetrics as jest.Mock).mockReturnValue(prometheusMetrics);

      const request = new NextRequest('http://localhost:3000/api/performance/metrics?format=prometheus');
      
      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain; version=0.0.4; charset=utf-8');
      expect(text).toContain('# HELP api_requests_total');
      expect(text).toContain('api_requests_total 12450');
    });

    it('should export CSV format when requested', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance/metrics?format=csv');
      
      const response = await GET(request);
      const csvData = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename=performance-metrics.csv');
      expect(csvData).toContain('system.uptime');
    });

    it('should filter metrics by category', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance/metrics?category=api');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.category).toBe('api');
      expect(data.metrics).toHaveProperty('api');
      expect(Object.keys(data.metrics)).toHaveLength(1);
    });

    it('should support different time ranges', async () => {
      const timeRanges = ['5m', '15m', '1h', '6h', '24h', '7d'];

      for (const range of timeRanges) {
        const request = new NextRequest(`http://localhost:3000/api/performance/metrics?range=${range}`);
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.timeRange).toBe(range);
      }
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in performanceMonitor
      (performanceMonitor.exportMetrics as jest.Mock).mockImplementation(() => {
        throw new Error('Metrics collection failed');
      });

      const request = new NextRequest('http://localhost:3000/api/performance/metrics?format=prometheus');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to collect metrics');
      expect(data.details).toBe('Metrics collection failed');
    });
  });

  describe('POST /api/performance/metrics', () => {
    it('should record a metric successfully', async () => {
      const body = {
        metric: 'api.latency',
        value: 245,
        tags: { endpoint: '/api/advisor/dashboard', method: 'GET' }
      };

      const request = new NextRequest('http://localhost:3000/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recorded.metric).toBe('api.latency');
      expect(data.recorded.value).toBe(245);
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('api.latency', 245, body.tags);
    });

    it('should validate required fields', async () => {
      const invalidBodies = [
        { value: 100 }, // Missing metric
        { metric: 'test' }, // Missing value
        {} // Empty body
      ];

      for (const body of invalidBodies) {
        const request = new NextRequest('http://localhost:3000/api/performance/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields: metric, value');
      }
    });

    it('should handle recording errors', async () => {
      (performanceMonitor.recordMetric as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to record metric');
      });

      const body = {
        metric: 'test.metric',
        value: 100
      };

      const request = new NextRequest('http://localhost:3000/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to record metric');
      expect(data.details).toBe('Failed to record metric');
    });

    it('should record metrics with zero values', async () => {
      const body = {
        metric: 'errors.count',
        value: 0,
        tags: { type: 'critical' }
      };

      const request = new NextRequest('http://localhost:3000/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recorded.value).toBe(0);
      expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('errors.count', 0, body.tags);
    });
  });

  describe('Metrics Data Structure', () => {
    it('should return complete system metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance/metrics?category=system');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.system).toHaveProperty('uptime');
      expect(data.metrics.system).toHaveProperty('memory');
      expect(data.metrics.system.memory).toHaveProperty('heapUsed');
      expect(data.metrics.system.memory).toHaveProperty('heapTotal');
      expect(data.metrics.system.memory).toHaveProperty('usage');
      expect(data.metrics.system).toHaveProperty('cpu');
      expect(data.metrics.system).toHaveProperty('platform');
      expect(data.metrics.system).toHaveProperty('nodeVersion');
    });

    it('should return API performance metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance/metrics?category=api');
      
      const response = await GET(request);
      const data = await response.json();

      const apiMetrics = data.metrics.api;
      
      expect(apiMetrics.requests).toHaveProperty('total');
      expect(apiMetrics.requests).toHaveProperty('successful');
      expect(apiMetrics.requests).toHaveProperty('failed');
      expect(apiMetrics.requests).toHaveProperty('rate');
      
      expect(apiMetrics.responseTime).toHaveProperty('p50');
      expect(apiMetrics.responseTime).toHaveProperty('p95');
      expect(apiMetrics.responseTime).toHaveProperty('p99');
      expect(apiMetrics.responseTime.p95).toBeLessThan(1500); // SLA requirement
      
      expect(apiMetrics.endpoints).toBeDefined();
      expect(apiMetrics.errors).toHaveProperty('4xx');
      expect(apiMetrics.errors).toHaveProperty('5xx');
      expect(apiMetrics.statusCodes).toHaveProperty('200');
    });

    it('should return frontend Web Vitals metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance/metrics?category=frontend');
      
      const response = await GET(request);
      const data = await response.json();

      const frontendMetrics = data.metrics.frontend;
      
      expect(frontendMetrics.webVitals).toHaveProperty('fcp');
      expect(frontendMetrics.webVitals).toHaveProperty('lcp');
      expect(frontendMetrics.webVitals).toHaveProperty('cls');
      expect(frontendMetrics.webVitals).toHaveProperty('fid');
      expect(frontendMetrics.webVitals).toHaveProperty('ttfb');
      
      expect(frontendMetrics.webVitals.lcp.p95).toBeLessThan(3500); // Performance target
      
      expect(frontendMetrics.bundles).toHaveProperty('totalSize');
      expect(frontendMetrics.pages).toBeDefined();
      expect(frontendMetrics.devices).toHaveProperty('mobile');
      expect(frontendMetrics.browsers).toHaveProperty('chrome');
    });

    it('should return WhatsApp delivery metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance/metrics?category=whatsapp');
      
      const response = await GET(request);
      const data = await response.json();

      const whatsappMetrics = data.metrics.whatsapp;
      
      expect(whatsappMetrics.messages).toHaveProperty('sent');
      expect(whatsappMetrics.messages).toHaveProperty('delivered');
      expect(whatsappMetrics.messages).toHaveProperty('deliveryRate');
      expect(whatsappMetrics.messages.deliveryRate).toBeGreaterThanOrEqual(98); // 99% SLA
      
      expect(whatsappMetrics.deliveryTime).toHaveProperty('average');
      expect(whatsappMetrics.deliveryTime).toHaveProperty('p95');
      
      expect(whatsappMetrics.queue).toHaveProperty('size');
      expect(whatsappMetrics.queue).toHaveProperty('throughput');
      
      expect(whatsappMetrics.errors).toHaveProperty('rateLimited');
      expect(whatsappMetrics.errors).toHaveProperty('invalidNumbers');
    });
  });

  describe('CSV Export', () => {
    it('should properly flatten nested metrics for CSV', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance/metrics?format=csv');
      
      const response = await GET(request);
      const csvData = await response.text();

      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      const values = lines[1].split(',');

      expect(headers).toContain('api.requests.total');
      expect(headers).toContain('frontend.webVitals.lcp.p95');
      expect(headers).toContain('whatsapp.messages.deliveryRate');
      
      expect(headers.length).toBe(values.length);
    });

    it('should handle special characters in CSV values', async () => {
      const request = new NextRequest('http://localhost:3000/api/performance/metrics?format=csv');
      
      const response = await GET(request);
      const csvData = await response.text();

      // Should properly quote values with commas
      expect(csvData).toMatch(/"[^"]*,[^"]*"/);
    });
  });
});