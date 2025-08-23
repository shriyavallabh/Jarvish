/**
 * JARVISH Performance Monitoring System
 * Real-time performance tracking and SLA validation
 * Monitors: Dashboard FCP <1.2s, API P95 <1.5s, WhatsApp 99% delivery
 */

import { performance } from 'perf_hooks';
import { cacheManager, CacheStrategies } from './cache-manager';
import { queryOptimizer } from './query-optimizer';
import { metrics } from '../monitoring/metrics-collector';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface SLATarget {
  name: string;
  target: number;
  currentValue: number;
  compliance: number; // percentage
  status: 'healthy' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
}

interface PerformanceReport {
  timestamp: number;
  slaTargets: SLATarget[];
  metrics: {
    frontend: FrontendMetrics;
    api: ApiMetrics;
    database: DatabaseMetrics;
    cache: CacheMetrics;
    whatsapp: WhatsAppMetrics;
  };
  recommendations: string[];
}

interface FrontendMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  bundleSize: number;
  cacheHitRate: number;
}

interface ApiMetrics {
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  activeConnections: number;
}

interface DatabaseMetrics {
  avgQueryTime: number;
  slowQueries: number;
  connectionPoolUtilization: number;
  cacheHitRate: number;
  deadlocks: number;
}

interface CacheMetrics {
  hitRate: number;
  memoryUsage: number;
  evictionRate: number;
  avgResponseTime: number;
  totalKeys: number;
}

interface WhatsAppMetrics {
  deliveryRate: number;
  avgDeliveryTime: number;
  queueSize: number;
  failureRate: number;
  rateLimitHits: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private alertThresholds: Map<string, { warning: number; critical: number }>;
  private lastReport?: PerformanceReport;

  constructor() {
    this.setupAlertThresholds();
    this.initializeMonitoring();
  }

  private setupAlertThresholds(): void {
    this.alertThresholds = new Map([
      // Frontend Performance
      ['fcp', { warning: 1000, critical: 1200 }], // First Contentful Paint
      ['lcp', { warning: 2000, critical: 2500 }], // Largest Contentful Paint
      
      // API Performance  
      ['api_p95', { warning: 1200, critical: 1500 }], // API P95 response time
      ['api_error_rate', { warning: 2, critical: 5 }], // Error rate percentage
      
      // Database Performance
      ['db_query_time', { warning: 80, critical: 100 }], // Average query time
      ['db_slow_queries', { warning: 5, critical: 10 }], // Slow queries percentage
      
      // Cache Performance
      ['cache_hit_rate', { warning: 70, critical: 60 }], // Cache hit rate percentage
      
      // WhatsApp Performance
      ['whatsapp_delivery', { warning: 97, critical: 95 }], // Delivery rate percentage
      ['whatsapp_delivery_time', { warning: 300, critical: 600 }] // Delivery time seconds
    ]);
  }

  private initializeMonitoring(): void {
    // Monitor performance metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Generate comprehensive report every 5 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 300000);

    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Performance monitoring started');
    
    // Collect initial baseline
    this.collectMetrics();
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('Performance monitoring stopped');
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for alerts
    this.checkAlerts(metric);
    
    // Update Prometheus metrics
    this.updatePrometheusMetrics(metric);
  }

  /**
   * Get Web Vitals from client-side
   */
  recordWebVitals(vitals: {
    fcp?: number;
    lcp?: number;
    cls?: number;
    fid?: number;
    ttfb?: number;
  }): void {
    Object.entries(vitals).forEach(([name, value]) => {
      if (value !== undefined) {
        this.recordMetric(`frontend.${name}`, value, { source: 'web_vitals' });
      }
    });
  }

  /**
   * Collect comprehensive performance metrics
   */
  private async collectMetrics(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      // Frontend Metrics (simulated - in production would come from RUM)
      await this.collectFrontendMetrics();
      
      // API Metrics
      await this.collectApiMetrics();
      
      // Database Metrics
      await this.collectDatabaseMetrics();
      
      // Cache Metrics
      await this.collectCacheMetrics();
      
      // WhatsApp Metrics
      await this.collectWhatsAppMetrics();
      
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  private async collectFrontendMetrics(): Promise<void> {
    // In production, these would come from Real User Monitoring (RUM)
    const bundleStats = await this.getBundleStats();
    
    this.recordMetric('frontend.bundle_size', bundleStats.totalSize, { type: 'javascript' });
    this.recordMetric('frontend.bundle_chunks', bundleStats.chunkCount, { type: 'count' });
    
    // Simulated Web Vitals for server-side monitoring
    this.recordMetric('frontend.estimated_fcp', 800 + Math.random() * 400, { source: 'estimated' });
    this.recordMetric('frontend.estimated_lcp', 1500 + Math.random() * 1000, { source: 'estimated' });
  }

  private async collectApiMetrics(): Promise<void> {
    const apiStats = await this.getApiStats();
    
    this.recordMetric('api.requests_per_second', apiStats.requestsPerSecond);
    this.recordMetric('api.p95_response_time', apiStats.p95ResponseTime);
    this.recordMetric('api.error_rate', apiStats.errorRate);
    this.recordMetric('api.active_connections', apiStats.activeConnections);
  }

  private async collectDatabaseMetrics(): Promise<void> {
    const dbStats = queryOptimizer.getQueryStats();
    const dbHealth = await queryOptimizer.healthCheck();
    
    this.recordMetric('database.avg_query_time', dbStats.averageLatency);
    this.recordMetric('database.slow_queries', dbStats.slowQueries);
    this.recordMetric('database.total_queries', dbStats.totalQueries);
    this.recordMetric('database.cache_hit_rate', dbStats.cacheHitRate);
    this.recordMetric('database.active_connections', dbStats.activeConnections);
    this.recordMetric('database.health', dbHealth.primary ? 1 : 0, { type: 'primary' });
    
    if (dbHealth.replica !== undefined) {
      this.recordMetric('database.health', dbHealth.replica ? 1 : 0, { type: 'replica' });
    }
  }

  private async collectCacheMetrics(): Promise<void> {
    const cacheStats = await cacheManager.getStats();
    const cacheHealth = await cacheManager.healthCheck();
    
    this.recordMetric('cache.hit_rate', cacheStats.hitRate);
    this.recordMetric('cache.total_keys', cacheStats.totalKeys);
    this.recordMetric('cache.memory_usage', cacheStats.memoryUsage);
    this.recordMetric('cache.health', cacheHealth ? 1 : 0);
  }

  private async collectWhatsAppMetrics(): Promise<void> {
    const whatsappStats = await this.getWhatsAppStats();
    
    this.recordMetric('whatsapp.delivery_rate', whatsappStats.deliveryRate);
    this.recordMetric('whatsapp.avg_delivery_time', whatsappStats.avgDeliveryTime);
    this.recordMetric('whatsapp.queue_size', whatsappStats.queueSize);
    this.recordMetric('whatsapp.failure_rate', whatsappStats.failureRate);
  }

  /**
   * Generate comprehensive performance report
   */
  private async generatePerformanceReport(): Promise<PerformanceReport> {
    const timestamp = Date.now();
    
    // Calculate SLA compliance
    const slaTargets: SLATarget[] = [
      await this.calculateSLATarget('Dashboard FCP', 'fcp', 1200),
      await this.calculateSLATarget('Dashboard LCP', 'lcp', 2500),
      await this.calculateSLATarget('API P95 Response', 'api_p95', 1500),
      await this.calculateSLATarget('Database Query Time', 'db_query_time', 100),
      await this.calculateSLATarget('Cache Hit Rate', 'cache_hit_rate', 80),
      await this.calculateSLATarget('WhatsApp Delivery', 'whatsapp_delivery', 99),
    ];

    // Collect current metrics
    const frontendMetrics = await this.getCurrentFrontendMetrics();
    const apiMetrics = await this.getCurrentApiMetrics();
    const databaseMetrics = await this.getCurrentDatabaseMetrics();
    const cacheMetrics = await this.getCurrentCacheMetrics();
    const whatsappMetrics = await this.getCurrentWhatsAppMetrics();

    // Generate recommendations
    const recommendations = this.generateRecommendations(slaTargets);

    const report: PerformanceReport = {
      timestamp,
      slaTargets,
      metrics: {
        frontend: frontendMetrics,
        api: apiMetrics,
        database: databaseMetrics,
        cache: cacheMetrics,
        whatsapp: whatsappMetrics
      },
      recommendations
    };

    this.lastReport = report;
    
    // Cache report for dashboard access
    await cacheManager.set('performance:latest_report', report, CacheStrategies.API_RESPONSE);
    
    console.log('Performance report generated:', {
      slaCompliance: slaTargets.map(s => ({ name: s.name, compliance: s.compliance, status: s.status })),
      recommendationCount: recommendations.length
    });

    return report;
  }

  private async calculateSLATarget(name: string, metricKey: string, target: number): Promise<SLATarget> {
    const recentMetrics = this.getRecentMetrics(metricKey, 300000); // Last 5 minutes
    const threshold = this.alertThresholds.get(metricKey) || { warning: target * 0.8, critical: target };
    
    let currentValue = 0;
    let compliance = 100;
    
    if (recentMetrics.length > 0) {
      currentValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
      
      // Calculate compliance percentage
      if (metricKey.includes('rate') || metricKey === 'whatsapp_delivery') {
        // For rates, higher is better
        compliance = Math.min(100, (currentValue / target) * 100);
      } else {
        // For response times, lower is better
        compliance = Math.max(0, Math.min(100, ((target - currentValue) / target) * 100));
      }
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (currentValue >= threshold.critical) status = 'critical';
    else if (currentValue >= threshold.warning) status = 'warning';

    return {
      name,
      target,
      currentValue: Math.round(currentValue * 100) / 100,
      compliance: Math.round(compliance * 100) / 100,
      status,
      threshold
    };
  }

  private generateRecommendations(slaTargets: SLATarget[]): string[] {
    const recommendations: string[] = [];

    for (const target of slaTargets) {
      if (target.status === 'critical') {
        recommendations.push(`CRITICAL: ${target.name} is ${target.currentValue} (target: ${target.target}). Immediate action required.`);
        
        // Specific recommendations based on metric type
        if (target.name.includes('FCP') || target.name.includes('LCP')) {
          recommendations.push('- Optimize bundle size and implement code splitting');
          recommendations.push('- Enable service worker for static asset caching');
          recommendations.push('- Optimize critical CSS delivery');
        } else if (target.name.includes('API')) {
          recommendations.push('- Review slow database queries and add indexes');
          recommendations.push('- Increase Redis cache TTL for frequent requests');
          recommendations.push('- Consider API response compression');
        } else if (target.name.includes('Database')) {
          recommendations.push('- Analyze slow queries and optimize indexes');
          recommendations.push('- Consider connection pool size adjustment');
          recommendations.push('- Review database server resources');
        } else if (target.name.includes('WhatsApp')) {
          recommendations.push('- Check WhatsApp API rate limits and queue configuration');
          recommendations.push('- Review message template approval status');
          recommendations.push('- Monitor third-party service dependencies');
        }
      } else if (target.status === 'warning') {
        recommendations.push(`WARNING: ${target.name} approaching threshold. Current: ${target.currentValue}, Target: ${target.target}`);
      }
    }

    // General optimization recommendations
    if (recommendations.length === 0) {
      recommendations.push('System performance is within SLA targets. Consider proactive optimizations:');
      recommendations.push('- Implement advanced caching strategies');
      recommendations.push('- Optimize database queries and indexes');
      recommendations.push('- Monitor bundle size growth');
      recommendations.push('- Review API endpoint performance patterns');
    }

    return recommendations;
  }

  private checkAlerts(metric: PerformanceMetric): void {
    const threshold = this.alertThresholds.get(metric.name);
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      this.sendAlert('critical', metric, threshold.critical);
    } else if (metric.value >= threshold.warning) {
      this.sendAlert('warning', metric, threshold.warning);
    }
  }

  private sendAlert(level: 'warning' | 'critical', metric: PerformanceMetric, threshold: number): void {
    const alert = {
      level,
      metric: metric.name,
      value: metric.value,
      threshold,
      timestamp: metric.timestamp,
      tags: metric.tags
    };

    console.log(`PERFORMANCE ALERT [${level.toUpperCase()}]:`, alert);
    
    // In production, send to alerting system (PagerDuty, Slack, etc.)
    metrics.alertsTriggered.inc({ level, metric: metric.name });
  }

  private updatePrometheusMetrics(metric: PerformanceMetric): void {
    const labels = { metric: metric.name, ...metric.tags };
    
    if (metric.name.includes('response_time') || metric.name.includes('duration')) {
      metrics.apiDuration.observe(labels, metric.value / 1000); // Convert to seconds
    } else if (metric.name.includes('rate') || metric.name.includes('percentage')) {
      metrics.systemHealth.set(labels, metric.value);
    } else {
      metrics.systemHealth.set(labels, metric.value);
    }
  }

  // Helper methods for collecting specific metrics
  private getRecentMetrics(name: string, timeWindow: number): PerformanceMetric[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => m.name === name && m.timestamp > cutoff);
  }

  private async getBundleStats(): Promise<{ totalSize: number; chunkCount: number }> {
    // In production, this would analyze the build output
    return {
      totalSize: 512000, // 512KB
      chunkCount: 8
    };
  }

  private async getApiStats(): Promise<{
    requestsPerSecond: number;
    p95ResponseTime: number;
    errorRate: number;
    activeConnections: number;
  }> {
    const recentApiMetrics = this.getRecentMetrics('api.response_time', 60000);
    const responseTimes = recentApiMetrics.map(m => m.value).sort((a, b) => a - b);
    const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
    
    return {
      requestsPerSecond: recentApiMetrics.length,
      p95ResponseTime: responseTimes[p95Index] || 0,
      errorRate: 0.5, // Simulated
      activeConnections: 45 // Simulated
    };
  }

  private async getWhatsAppStats(): Promise<{
    deliveryRate: number;
    avgDeliveryTime: number;
    queueSize: number;
    failureRate: number;
  }> {
    // In production, query from WhatsApp delivery service
    return {
      deliveryRate: 98.5,
      avgDeliveryTime: 2.3,
      queueSize: 12,
      failureRate: 1.5
    };
  }

  // Current metrics getters
  private async getCurrentFrontendMetrics(): Promise<FrontendMetrics> {
    return {
      fcp: this.getLatestMetricValue('frontend.fcp') || 800,
      lcp: this.getLatestMetricValue('frontend.lcp') || 1500,
      cls: this.getLatestMetricValue('frontend.cls') || 0.1,
      fid: this.getLatestMetricValue('frontend.fid') || 100,
      bundleSize: this.getLatestMetricValue('frontend.bundle_size') || 512000,
      cacheHitRate: this.getLatestMetricValue('frontend.cache_hit_rate') || 85
    };
  }

  private async getCurrentApiMetrics(): Promise<ApiMetrics> {
    return {
      p50ResponseTime: this.getLatestMetricValue('api.p50_response_time') || 200,
      p95ResponseTime: this.getLatestMetricValue('api.p95_response_time') || 800,
      p99ResponseTime: this.getLatestMetricValue('api.p99_response_time') || 1200,
      requestsPerSecond: this.getLatestMetricValue('api.requests_per_second') || 50,
      errorRate: this.getLatestMetricValue('api.error_rate') || 0.5,
      activeConnections: this.getLatestMetricValue('api.active_connections') || 45
    };
  }

  private async getCurrentDatabaseMetrics(): Promise<DatabaseMetrics> {
    const dbStats = queryOptimizer.getQueryStats();
    return {
      avgQueryTime: dbStats.averageLatency,
      slowQueries: dbStats.slowQueries,
      connectionPoolUtilization: (dbStats.activeConnections / 20) * 100, // Assuming max 20 connections
      cacheHitRate: dbStats.cacheHitRate,
      deadlocks: 0 // Would need to query PostgreSQL stats
    };
  }

  private async getCurrentCacheMetrics(): Promise<CacheMetrics> {
    const cacheStats = await cacheManager.getStats();
    return {
      hitRate: cacheStats.hitRate,
      memoryUsage: cacheStats.memoryUsage,
      evictionRate: 0, // Would need Redis stats
      avgResponseTime: 2, // Typical cache response time
      totalKeys: cacheStats.totalKeys
    };
  }

  private async getCurrentWhatsAppMetrics(): Promise<WhatsAppMetrics> {
    const whatsappStats = await this.getWhatsAppStats();
    return whatsappStats;
  }

  private getLatestMetricValue(name: string): number | undefined {
    const recentMetrics = this.getRecentMetrics(name, 300000); // Last 5 minutes
    return recentMetrics.length > 0 ? recentMetrics[recentMetrics.length - 1].value : undefined;
  }

  /**
   * Get latest performance report
   */
  getLatestReport(): PerformanceReport | undefined {
    return this.lastReport;
  }

  /**
   * Get real-time SLA status
   */
  async getSLAStatus(): Promise<{ overall: number; targets: SLATarget[] }> {
    if (!this.lastReport) {
      await this.generatePerformanceReport();
    }
    
    const targets = this.lastReport!.slaTargets;
    const overall = targets.reduce((sum, target) => sum + target.compliance, 0) / targets.length;
    
    return { overall: Math.round(overall * 100) / 100, targets };
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format: 'prometheus' | 'json' = 'json'): string {
    if (format === 'prometheus') {
      return this.metrics
        .map(m => `${m.name.replace(/\./g, '_')}{${this.tagsToPrometheusLabels(m.tags)}} ${m.value} ${m.timestamp}`)
        .join('\n');
    }
    
    return JSON.stringify(this.metrics, null, 2);
  }

  private tagsToPrometheusLabels(tags?: Record<string, string>): string {
    if (!tags) return '';
    return Object.entries(tags)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions for easy metric recording
export const recordApiResponse = (endpoint: string, method: string, duration: number, statusCode: number): void => {
  performanceMonitor.recordMetric('api.response_time', duration, { endpoint, method });
  performanceMonitor.recordMetric('api.status_code', statusCode, { endpoint, method });
};

export const recordDatabaseQuery = (operation: string, table: string, duration: number, success: boolean): void => {
  performanceMonitor.recordMetric('database.query_time', duration, { operation, table });
  performanceMonitor.recordMetric('database.query_success', success ? 1 : 0, { operation, table });
};

export const recordWhatsAppDelivery = (status: 'delivered' | 'failed', deliveryTime?: number): void => {
  performanceMonitor.recordMetric('whatsapp.delivery_status', status === 'delivered' ? 1 : 0);
  if (deliveryTime) {
    performanceMonitor.recordMetric('whatsapp.delivery_time', deliveryTime);
  }
};

// Auto-start monitoring
if (process.env.NODE_ENV === 'production') {
  performanceMonitor.start();
}