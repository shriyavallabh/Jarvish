/**
 * Metrics Collector for JARVISH Platform
 * Collects and exports metrics for Prometheus monitoring
 */

import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';

// Initialize default metrics (CPU, memory, etc.)
export const initializeMetrics = () => {
  // Clear any existing metrics
  register.clear();
  
  // Enable default Node.js metrics
  const collectDefaultMetrics = require('prom-client').collectDefaultMetrics;
  collectDefaultMetrics({ register });
};

// Business Metrics
export const metrics = {
  // User Metrics
  userRegistrations: new Counter({
    name: 'jarvish_user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['type', 'source']
  }),
  
  activeUsers: new Gauge({
    name: 'jarvish_active_users',
    help: 'Number of active users',
    labelNames: ['tier', 'region']
  }),
  
  // Content Metrics
  contentGenerated: new Counter({
    name: 'jarvish_content_generated_total',
    help: 'Total content pieces generated',
    labelNames: ['type', 'status', 'advisor_id']
  }),
  
  contentGenerationDuration: new Histogram({
    name: 'jarvish_content_generation_duration_seconds',
    help: 'Content generation duration in seconds',
    labelNames: ['type', 'complexity'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
  }),
  
  contentApprovalRate: new Gauge({
    name: 'jarvish_content_approval_rate',
    help: 'Content approval rate percentage',
    labelNames: ['advisor_id', 'content_type']
  }),
  
  // WhatsApp Delivery Metrics (SLA Critical)
  whatsappMessages: new Counter({
    name: 'jarvish_whatsapp_messages_total',
    help: 'Total WhatsApp messages sent',
    labelNames: ['status', 'template', 'advisor_id']
  }),
  
  whatsappDeliveryRate: new Gauge({
    name: 'jarvish_whatsapp_delivery_rate',
    help: 'WhatsApp delivery success rate (SLA: 99%)',
    labelNames: ['hour', 'day']
  }),
  
  whatsappDeliveryLatency: new Histogram({
    name: 'jarvish_whatsapp_delivery_latency_seconds',
    help: 'WhatsApp message delivery latency',
    labelNames: ['priority', 'template'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]
  }),
  
  // API Performance Metrics
  apiRequests: new Counter({
    name: 'jarvish_api_requests_total',
    help: 'Total API requests',
    labelNames: ['method', 'endpoint', 'status']
  }),
  
  apiDuration: new Histogram({
    name: 'jarvish_api_duration_seconds',
    help: 'API request duration (SLA: P95 < 1.5s)',
    labelNames: ['method', 'endpoint'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 1.5, 2, 5, 10]
  }),
  
  apiErrors: new Counter({
    name: 'jarvish_api_errors_total',
    help: 'Total API errors',
    labelNames: ['method', 'endpoint', 'error_type']
  }),
  
  // Database Performance Metrics
  dbQueries: new Counter({
    name: 'jarvish_db_queries_total',
    help: 'Total database queries',
    labelNames: ['operation', 'table', 'status']
  }),
  
  dbQueryDuration: new Histogram({
    name: 'jarvish_db_query_duration_seconds',
    help: 'Database query duration',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
  }),
  
  dbConnectionPool: new Gauge({
    name: 'jarvish_db_connection_pool_size',
    help: 'Database connection pool size',
    labelNames: ['state']
  }),
  
  // Queue Metrics
  queueSize: new Gauge({
    name: 'jarvish_queue_size',
    help: 'Current queue size',
    labelNames: ['queue_name', 'priority']
  }),
  
  queueProcessingTime: new Histogram({
    name: 'jarvish_queue_processing_time_seconds',
    help: 'Queue job processing time',
    labelNames: ['queue_name', 'job_type'],
    buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300]
  }),
  
  queueErrors: new Counter({
    name: 'jarvish_queue_errors_total',
    help: 'Total queue processing errors',
    labelNames: ['queue_name', 'error_type']
  }),
  
  // Compliance Metrics
  complianceChecks: new Counter({
    name: 'jarvish_compliance_checks_total',
    help: 'Total compliance checks performed',
    labelNames: ['check_type', 'result']
  }),
  
  complianceViolations: new Counter({
    name: 'jarvish_compliance_violations_total',
    help: 'Total compliance violations detected',
    labelNames: ['violation_type', 'severity']
  }),
  
  complianceProcessingTime: new Histogram({
    name: 'jarvish_compliance_processing_time_seconds',
    help: 'Compliance check processing time',
    labelNames: ['check_type'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 1.5, 2, 5]
  }),
  
  // Business KPIs
  revenue: new Gauge({
    name: 'jarvish_revenue_total',
    help: 'Total revenue',
    labelNames: ['currency', 'tier']
  }),
  
  subscriptions: new Gauge({
    name: 'jarvish_subscriptions_active',
    help: 'Active subscriptions',
    labelNames: ['tier', 'billing_cycle']
  }),
  
  churnRate: new Gauge({
    name: 'jarvish_churn_rate',
    help: 'Customer churn rate',
    labelNames: ['tier', 'cohort']
  }),
  
  // System Health Metrics
  systemHealth: new Gauge({
    name: 'jarvish_system_health',
    help: 'Overall system health score (0-100)',
    labelNames: ['component']
  }),
  
  slaCompliance: new Gauge({
    name: 'jarvish_sla_compliance',
    help: 'SLA compliance percentage',
    labelNames: ['sla_type', 'period']
  })
};

// Helper function to track API requests
export const trackApiRequest = (
  method: string,
  endpoint: string,
  status: number,
  duration: number
) => {
  metrics.apiRequests.inc({ method, endpoint, status: status.toString() });
  metrics.apiDuration.observe({ method, endpoint }, duration / 1000);
  
  if (status >= 400) {
    const errorType = status >= 500 ? 'server_error' : 'client_error';
    metrics.apiErrors.inc({ method, endpoint, error_type: errorType });
  }
};

// Helper function to track WhatsApp delivery
export const trackWhatsAppDelivery = (
  status: 'sent' | 'delivered' | 'failed',
  template: string,
  advisorId: string,
  latency?: number
) => {
  metrics.whatsappMessages.inc({ status, template, advisor_id: advisorId });
  
  if (latency) {
    metrics.whatsappDeliveryLatency.observe(
      { priority: 'normal', template },
      latency / 1000
    );
  }
};

// Helper function to track database queries
export const trackDatabaseQuery = (
  operation: string,
  table: string,
  duration: number,
  success: boolean
) => {
  const status = success ? 'success' : 'error';
  metrics.dbQueries.inc({ operation, table, status });
  metrics.dbQueryDuration.observe({ operation, table }, duration / 1000);
};

// Helper function to track content generation
export const trackContentGeneration = (
  type: string,
  status: 'success' | 'failed' | 'rejected',
  advisorId: string,
  duration: number
) => {
  metrics.contentGenerated.inc({ type, status, advisor_id: advisorId });
  
  if (status === 'success') {
    metrics.contentGenerationDuration.observe(
      { type, complexity: 'standard' },
      duration / 1000
    );
  }
};

// Helper function to update SLA compliance
export const updateSlaCompliance = () => {
  // Calculate WhatsApp delivery SLA (99% target)
  const deliveredCount = metrics.whatsappMessages.get({ status: 'delivered' }) || 0;
  const totalCount = metrics.whatsappMessages.get() || 1;
  const deliveryRate = (deliveredCount / totalCount) * 100;
  
  metrics.slaCompliance.set(
    { sla_type: 'whatsapp_delivery', period: 'daily' },
    deliveryRate
  );
  
  metrics.whatsappDeliveryRate.set(
    { hour: new Date().getHours().toString(), day: new Date().getDay().toString() },
    deliveryRate
  );
};

// Export metrics for Prometheus scraping
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

// Export content type for Prometheus
export const getMetricsContentType = (): string => {
  return register.contentType;
};

/**
 * Performance Benchmarking Extensions
 * Advanced metrics for SLA validation and performance optimization
 */

// Performance Benchmark Metrics
export const performanceMetrics = {
  // Frontend Performance Metrics
  frontendVitals: new Histogram({
    name: 'jarvish_frontend_web_vitals',
    help: 'Web Vitals performance metrics',
    labelNames: ['metric_type', 'page', 'device_type'],
    buckets: [0.1, 0.5, 1, 2, 3, 4, 5, 10, 15, 20]
  }),

  bundleSize: new Gauge({
    name: 'jarvish_bundle_size_bytes',
    help: 'JavaScript bundle size in bytes',
    labelNames: ['bundle_type', 'route']
  }),

  pageLoadTime: new Histogram({
    name: 'jarvish_page_load_time_seconds',
    help: 'Complete page load time',
    labelNames: ['page', 'user_agent', 'connection_type'],
    buckets: [0.5, 1, 2, 3, 5, 8, 10, 15]
  }),

  // SLA-Specific Metrics
  slaViolations: new Counter({
    name: 'jarvish_sla_violations_total',
    help: 'Total SLA violations detected',
    labelNames: ['sla_type', 'severity', 'component']
  }),

  whatsappSlaCompliance: new Histogram({
    name: 'jarvish_whatsapp_sla_compliance_duration',
    help: 'WhatsApp delivery SLA compliance tracking',
    labelNames: ['time_window', 'advisor_tier'],
    buckets: [60, 120, 180, 240, 300, 360, 420, 480, 540, 600] // 5-minute windows
  }),

  complianceSlaCompliance: new Histogram({
    name: 'jarvish_compliance_sla_duration_seconds',
    help: 'Compliance checking SLA duration tracking',
    labelNames: ['complexity', 'content_type'],
    buckets: [0.1, 0.5, 1, 1.5, 2, 3, 5, 10]
  }),

  // Resource Utilization Metrics
  memoryUsage: new Gauge({
    name: 'jarvish_memory_usage_bytes',
    help: 'Memory usage by component',
    labelNames: ['component', 'heap_type']
  }),

  cpuUsage: new Gauge({
    name: 'jarvish_cpu_usage_percentage',
    help: 'CPU usage by component',
    labelNames: ['component', 'core']
  }),

  diskIo: new Counter({
    name: 'jarvish_disk_io_total',
    help: 'Disk I/O operations',
    labelNames: ['operation', 'device']
  }),

  networkThroughput: new Gauge({
    name: 'jarvish_network_throughput_bytes_per_second',
    help: 'Network throughput',
    labelNames: ['direction', 'interface']
  }),

  // Business Performance Metrics
  conversionRate: new Gauge({
    name: 'jarvish_conversion_rate',
    help: 'Conversion rate metrics',
    labelNames: ['funnel_step', 'source', 'tier']
  }),

  userEngagement: new Histogram({
    name: 'jarvish_user_engagement_duration_seconds',
    help: 'User engagement duration',
    labelNames: ['page', 'action', 'user_tier'],
    buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600]
  }),

  contentQualityScore: new Gauge({
    name: 'jarvish_content_quality_score',
    help: 'AI-generated content quality score',
    labelNames: ['content_type', 'advisor_tier']
  }),

  // Cache Performance Metrics
  cacheHitRatio: new Gauge({
    name: 'jarvish_cache_hit_ratio',
    help: 'Cache hit ratio by cache type',
    labelNames: ['cache_type', 'key_pattern']
  }),

  cacheEvictions: new Counter({
    name: 'jarvish_cache_evictions_total',
    help: 'Cache eviction events',
    labelNames: ['cache_type', 'eviction_reason']
  })
};

// Advanced SLA Monitoring
export const slaMonitor = {
  // WhatsApp Delivery SLA Tracker
  trackWhatsAppSla: (
    deliveryWindow: number, // seconds
    successfulDeliveries: number,
    totalAttempts: number,
    advisorTier: string
  ) => {
    const successRate = (successfulDeliveries / totalAttempts) * 100;
    
    performanceMetrics.whatsappSlaCompliance.observe(
      { time_window: `${deliveryWindow}s`, advisor_tier: advisorTier },
      deliveryWindow
    );

    if (successRate < 99) {
      performanceMetrics.slaViolations.inc({
        sla_type: 'whatsapp_delivery',
        severity: successRate < 95 ? 'critical' : 'warning',
        component: 'whatsapp_service'
      });
    }

    metrics.slaCompliance.set(
      { sla_type: 'whatsapp_delivery', period: 'real_time' },
      successRate
    );
  },

  // Compliance Checking SLA Tracker
  trackComplianceSla: (
    processingTime: number, // milliseconds
    complexity: string,
    contentType: string
  ) => {
    performanceMetrics.complianceSlaCompliance.observe(
      { complexity, content_type: contentType },
      processingTime / 1000
    );

    if (processingTime > 1500) {
      performanceMetrics.slaViolations.inc({
        sla_type: 'compliance_checking',
        severity: processingTime > 3000 ? 'critical' : 'warning',
        component: 'ai_compliance_service'
      });
    }

    metrics.slaCompliance.set(
      { sla_type: 'compliance_checking', period: 'real_time' },
      processingTime < 1500 ? 100 : 0
    );
  },

  // API Response SLA Tracker
  trackApiSla: (
    endpoint: string,
    responseTime: number, // milliseconds
    statusCode: number
  ) => {
    const isSlaSatisfied = responseTime < 500 && statusCode < 400;
    
    if (!isSlaSatisfied) {
      performanceMetrics.slaViolations.inc({
        sla_type: 'api_response_time',
        severity: responseTime > 1000 ? 'critical' : 'warning',
        component: endpoint
      });
    }

    metrics.slaCompliance.set(
      { sla_type: 'api_response', period: 'real_time' },
      isSlaSatisfied ? 100 : 0
    );
  }
};

// Performance Benchmarking Functions
export const performanceBenchmark = {
  // Track Web Vitals
  recordWebVitals: (
    metric: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB',
    value: number,
    page: string,
    deviceType: string = 'desktop'
  ) => {
    performanceMetrics.frontendVitals.observe(
      { metric_type: metric, page, device_type: deviceType },
      value / 1000 // Convert to seconds
    );

    // Check for Web Vitals SLA violations
    const thresholds = {
      FCP: 1800, // 1.8s
      LCP: 2500, // 2.5s
      FID: 100,  // 100ms
      CLS: 0.1,  // 0.1 score
      TTFB: 600  // 600ms
    };

    if (value > thresholds[metric]) {
      performanceMetrics.slaViolations.inc({
        sla_type: 'web_vitals',
        severity: value > thresholds[metric] * 2 ? 'critical' : 'warning',
        component: `frontend_${metric.toLowerCase()}`
      });
    }
  },

  // Track Bundle Performance
  recordBundleMetrics: (
    bundleType: string,
    route: string,
    sizeBytes: number,
    loadTime: number
  ) => {
    performanceMetrics.bundleSize.set(
      { bundle_type: bundleType, route },
      sizeBytes
    );

    performanceMetrics.pageLoadTime.observe(
      { page: route, user_agent: 'automated', connection_type: '4g' },
      loadTime / 1000
    );
  },

  // Track Resource Utilization
  recordResourceUsage: () => {
    const usage = process.memoryUsage();
    
    performanceMetrics.memoryUsage.set(
      { component: 'nodejs', heap_type: 'used' },
      usage.heapUsed
    );
    
    performanceMetrics.memoryUsage.set(
      { component: 'nodejs', heap_type: 'total' },
      usage.heapTotal
    );

    performanceMetrics.memoryUsage.set(
      { component: 'nodejs', heap_type: 'external' },
      usage.external
    );
  },

  // Content Quality Tracking
  recordContentQuality: (
    contentType: string,
    qualityScore: number,
    advisorTier: string
  ) => {
    performanceMetrics.contentQualityScore.set(
      { content_type: contentType, advisor_tier: advisorTier },
      qualityScore
    );
  }
};

// Real-time SLA Dashboard Data
export const getSlaMetrics = async () => {
  const [whatsappSla, complianceSla, apiSla] = await Promise.all([
    metrics.slaCompliance.get({ sla_type: 'whatsapp_delivery', period: 'real_time' }),
    metrics.slaCompliance.get({ sla_type: 'compliance_checking', period: 'real_time' }),
    metrics.slaCompliance.get({ sla_type: 'api_response', period: 'real_time' })
  ]);

  return {
    whatsappDelivery: {
      current: whatsappSla,
      target: 99,
      status: whatsappSla >= 99 ? 'healthy' : whatsappSla >= 95 ? 'warning' : 'critical'
    },
    complianceChecking: {
      current: complianceSla,
      target: 100, // <1.5s response time
      status: complianceSla >= 95 ? 'healthy' : complianceSla >= 90 ? 'warning' : 'critical'
    },
    apiResponse: {
      current: apiSla,
      target: 95, // <500ms P95
      status: apiSla >= 95 ? 'healthy' : apiSla >= 90 ? 'warning' : 'critical'
    }
  };
};

// System Health Score Calculator
export const calculateSystemHealth = async (): Promise<number> => {
  const slaMetrics = await getSlaMetrics();
  const weights = {
    whatsapp: 0.4,
    compliance: 0.3,
    api: 0.3
  };

  const healthScore = 
    (slaMetrics.whatsappDelivery.current * weights.whatsapp) +
    (slaMetrics.complianceChecking.current * weights.compliance) +
    (slaMetrics.apiResponse.current * weights.api);

  metrics.systemHealth.set(
    { component: 'overall' },
    Math.round(healthScore)
  );

  return healthScore;
};

// Performance Alert Triggers
export const checkPerformanceThresholds = async () => {
  const slaMetrics = await getSlaMetrics();
  const alerts = [];

  // WhatsApp delivery alerts
  if (slaMetrics.whatsappDelivery.current < 95) {
    alerts.push({
      type: 'sla_violation',
      severity: 'critical',
      component: 'whatsapp_delivery',
      message: `WhatsApp delivery SLA at ${slaMetrics.whatsappDelivery.current}% (target: 99%)`
    });
  }

  // Compliance checking alerts
  if (slaMetrics.complianceChecking.current < 90) {
    alerts.push({
      type: 'sla_violation',
      severity: 'warning',
      component: 'compliance_checking',
      message: `Compliance checking SLA degraded to ${slaMetrics.complianceChecking.current}%`
    });
  }

  // API response alerts
  if (slaMetrics.apiResponse.current < 90) {
    alerts.push({
      type: 'sla_violation',
      severity: 'warning',
      component: 'api_response',
      message: `API response time SLA at ${slaMetrics.apiResponse.current}%`
    });
  }

  return alerts;
};

// Resource monitoring setup
setInterval(() => {
  performanceBenchmark.recordResourceUsage();
  calculateSystemHealth();
}, 30000); // Every 30 seconds

// Initialize metrics on module load
initializeMetrics();