// Monitoring & Analytics Service
// Comprehensive system monitoring and business analytics for Jarvish

import EventEmitter from 'events';
import { createLogger, format, transports } from 'winston';
import fs from 'fs/promises';
import path from 'path';

// Metrics Collection Interfaces
interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  activeConnections: number;
}

interface BusinessMetrics {
  timestamp: Date;
  advisors: {
    activeToday: number;
    contentGenerated: number;
    complianceChecks: number;
    whatsappDeliveries: number;
  };
  sla: {
    deliverySuccess: number;
    complianceResponseTime: number;
    systemUptime: number;
  };
  subscription: {
    activeSubscriptions: number;
    revenue: number;
    churnRate: number;
  };
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  comparison: 'gt' | 'lt' | 'eq';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface PerformanceMetrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
}

class MonitoringService extends EventEmitter {
  private logger;
  private metricsPath: string;
  private systemMetrics: SystemMetrics[] = [];
  private businessMetrics: BusinessMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private alertRules: AlertRule[] = [];
  private isRunning = false;
  private metricsInterval?: NodeJS.Timeout;

  constructor() {
    super();
    
    // Create Winston logger
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'logs/jarvish-error.log', level: 'error' }),
        new transports.File({ filename: 'logs/jarvish-combined.log' }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });

    this.metricsPath = path.join(process.cwd(), 'metrics');
    this.initializeDirectories();
    this.setupDefaultAlertRules();
  }

  /**
   * Initialize monitoring directories
   */
  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.metricsPath, { recursive: true });
      await fs.mkdir('logs', { recursive: true });
      this.logger.info('Monitoring directories initialized');
    } catch (error) {
      this.logger.error('Failed to initialize directories:', error);
    }
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        metric: 'cpu.usage',
        threshold: 80,
        comparison: 'gt',
        severity: 'high',
        enabled: true
      },
      {
        id: 'low_memory',
        name: 'Low Memory Available',
        metric: 'memory.percentage',
        threshold: 85,
        comparison: 'gt',
        severity: 'critical',
        enabled: true
      },
      {
        id: 'slow_compliance_check',
        name: 'Slow Compliance Check',
        metric: 'sla.complianceResponseTime',
        threshold: 1500,
        comparison: 'gt',
        severity: 'medium',
        enabled: true
      },
      {
        id: 'delivery_sla_breach',
        name: 'WhatsApp Delivery SLA Breach',
        metric: 'sla.deliverySuccess',
        threshold: 99,
        comparison: 'lt',
        severity: 'critical',
        enabled: true
      },
      {
        id: 'high_churn_rate',
        name: 'High Advisor Churn Rate',
        metric: 'subscription.churnRate',
        threshold: 10,
        comparison: 'gt',
        severity: 'high',
        enabled: true
      }
    ];
  }

  /**
   * Start monitoring service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Monitoring service already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting Jarvish monitoring service...');

    // Collect metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.collectBusinessMetrics();
    }, 30000);

    // Initial collection
    await this.collectSystemMetrics();
    await this.collectBusinessMetrics();

    this.logger.info('✅ Jarvish monitoring service started successfully');
    this.emit('started');
  }

  /**
   * Stop monitoring service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    await this.saveMetricsToDisk();
    this.logger.info('Monitoring service stopped');
    this.emit('stopped');
  }

  /**
   * Collect system performance metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const cpuUsage = process.cpuUsage();
      const memUsage = process.memoryUsage();

      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          loadAverage: [0, 0, 0] // Would use os.loadavg() in real implementation
        },
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        },
        uptime: process.uptime(),
        activeConnections: 0 // Would track actual connections
      };

      this.systemMetrics.push(metrics);
      
      // Keep only last 1000 records in memory
      if (this.systemMetrics.length > 1000) {
        this.systemMetrics = this.systemMetrics.slice(-1000);
      }

      // Check alerts for system metrics
      await this.checkAlerts(metrics);

    } catch (error) {
      this.logger.error('Failed to collect system metrics:', error);
    }
  }

  /**
   * Collect business metrics
   */
  private async collectBusinessMetrics(): Promise<void> {
    try {
      // Mock business metrics - would integrate with actual database
      const metrics: BusinessMetrics = {
        timestamp: new Date(),
        advisors: {
          activeToday: Math.floor(Math.random() * 150) + 50, // 50-200 active advisors
          contentGenerated: Math.floor(Math.random() * 500) + 100,
          complianceChecks: Math.floor(Math.random() * 1000) + 200,
          whatsappDeliveries: Math.floor(Math.random() * 800) + 150
        },
        sla: {
          deliverySuccess: 99.2 + (Math.random() * 0.7), // 99.2-99.9%
          complianceResponseTime: 800 + (Math.random() * 400), // 800-1200ms
          systemUptime: 99.8 + (Math.random() * 0.19) // 99.8-99.99%
        },
        subscription: {
          activeSubscriptions: Math.floor(Math.random() * 100) + 80,
          revenue: Math.floor(Math.random() * 500000) + 200000, // ₹2L-₹7L
          churnRate: Math.random() * 8 + 2 // 2-10%
        }
      };

      this.businessMetrics.push(metrics);
      
      // Keep only last 1000 records
      if (this.businessMetrics.length > 1000) {
        this.businessMetrics = this.businessMetrics.slice(-1000);
      }

      // Check business metric alerts
      await this.checkAlerts(metrics);

      this.logger.info('Business metrics collected', {
        activeAdvisors: metrics.advisors.activeToday,
        deliverySuccess: metrics.sla.deliverySuccess.toFixed(2) + '%',
        complianceRT: metrics.sla.complianceResponseTime.toFixed(0) + 'ms'
      });

    } catch (error) {
      this.logger.error('Failed to collect business metrics:', error);
    }
  }

  /**
   * Record API performance metrics
   */
  recordPerformance(data: Omit<PerformanceMetrics, 'timestamp'>): void {
    const metric: PerformanceMetrics = {
      ...data,
      timestamp: new Date()
    };

    this.performanceMetrics.push(metric);

    // Keep only last 5000 performance records
    if (this.performanceMetrics.length > 5000) {
      this.performanceMetrics = this.performanceMetrics.slice(-5000);
    }

    // Log slow requests
    if (metric.responseTime > 2000) {
      this.logger.warn('Slow API response detected', {
        endpoint: metric.endpoint,
        method: metric.method,
        responseTime: metric.responseTime,
        statusCode: metric.statusCode
      });
    }
  }

  /**
   * Check alert rules and trigger notifications
   */
  private async checkAlerts(metrics: SystemMetrics | BusinessMetrics): Promise<void> {
    for (const rule of this.alertRules.filter(r => r.enabled)) {
      const value = this.extractMetricValue(metrics, rule.metric);
      if (value === null) continue;

      const isTriggered = this.evaluateThreshold(value, rule.threshold, rule.comparison);
      
      if (isTriggered) {
        const alert = {
          rule: rule.name,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          severity: rule.severity,
          timestamp: new Date()
        };

        this.logger.warn('Alert triggered', alert);
        this.emit('alert', alert);

        // Send notifications for critical alerts
        if (rule.severity === 'critical') {
          await this.sendCriticalAlert(alert);
        }
      }
    }
  }

  /**
   * Extract metric value from nested object
   */
  private extractMetricValue(metrics: any, path: string): number | null {
    try {
      const keys = path.split('.');
      let value = metrics;
      
      for (const key of keys) {
        value = value[key];
        if (value === undefined) return null;
      }
      
      return typeof value === 'number' ? value : null;
    } catch {
      return null;
    }
  }

  /**
   * Evaluate threshold conditions
   */
  private evaluateThreshold(value: number, threshold: number, comparison: string): boolean {
    switch (comparison) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  /**
   * Send critical alert notifications
   */
  private async sendCriticalAlert(alert: any): Promise<void> {
    try {
      // In production, integrate with Slack, PagerDuty, etc.
      console.log('🚨 CRITICAL ALERT:', alert);
      
      // Log to dedicated critical alerts file
      await fs.appendFile(
        path.join('logs', 'critical-alerts.log'),
        JSON.stringify({ ...alert, timestamp: new Date().toISOString() }) + '\n'
      );
    } catch (error) {
      this.logger.error('Failed to send critical alert:', error);
    }
  }

  /**
   * Get current system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    memory: { used: number; percentage: number };
    activeAlerts: number;
  } {
    const latest = this.systemMetrics[this.systemMetrics.length - 1];
    if (!latest) {
      return {
        status: 'critical',
        uptime: 0,
        memory: { used: 0, percentage: 0 },
        activeAlerts: 0
      };
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (latest.memory.percentage > 85 || latest.cpu.usage > 80) {
      status = 'critical';
    } else if (latest.memory.percentage > 70 || latest.cpu.usage > 60) {
      status = 'warning';
    }

    return {
      status,
      uptime: latest.uptime,
      memory: {
        used: latest.memory.used,
        percentage: latest.memory.percentage
      },
      activeAlerts: this.alertRules.filter(r => r.enabled).length
    };
  }

  /**
   * Get business analytics summary
   */
  getBusinessAnalytics(): {
    advisors: { active: number; growth: string };
    sla: { delivery: string; compliance: string };
    revenue: { current: number; growth: string };
  } {
    const latest = this.businessMetrics[this.businessMetrics.length - 1];
    if (!latest) {
      return {
        advisors: { active: 0, growth: '0%' },
        sla: { delivery: '0%', compliance: '0ms' },
        revenue: { current: 0, growth: '0%' }
      };
    }

    // Calculate growth (simplified - would use historical data)
    const advisorGrowth = '+15%'; // Mock calculation
    const revenueGrowth = '+23%'; // Mock calculation

    return {
      advisors: {
        active: latest.advisors.activeToday,
        growth: advisorGrowth
      },
      sla: {
        delivery: latest.sla.deliverySuccess.toFixed(2) + '%',
        compliance: latest.sla.complianceResponseTime.toFixed(0) + 'ms'
      },
      revenue: {
        current: latest.subscription.revenue,
        growth: revenueGrowth
      }
    };
  }

  /**
   * Get performance analytics for endpoints
   */
  getPerformanceAnalytics(): {
    slowestEndpoints: Array<{ endpoint: string; avgResponseTime: number }>;
    errorRate: number;
    throughput: number;
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        slowestEndpoints: [],
        errorRate: 0,
        throughput: 0
      };
    }

    // Calculate slowest endpoints
    const endpointTimes: Record<string, number[]> = {};
    let errorCount = 0;

    for (const metric of this.performanceMetrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointTimes[key]) {
        endpointTimes[key] = [];
      }
      endpointTimes[key].push(metric.responseTime);

      if (metric.statusCode >= 400) {
        errorCount++;
      }
    }

    const slowestEndpoints = Object.entries(endpointTimes)
      .map(([endpoint, times]) => ({
        endpoint,
        avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 5);

    return {
      slowestEndpoints,
      errorRate: (errorCount / this.performanceMetrics.length) * 100,
      throughput: this.performanceMetrics.length / 60 // requests per minute (simplified)
    };
  }

  /**
   * Export metrics to files
   */
  private async saveMetricsToDisk(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      await Promise.all([
        fs.writeFile(
          path.join(this.metricsPath, `system-${timestamp}.json`),
          JSON.stringify(this.systemMetrics, null, 2)
        ),
        fs.writeFile(
          path.join(this.metricsPath, `business-${timestamp}.json`),
          JSON.stringify(this.businessMetrics, null, 2)
        ),
        fs.writeFile(
          path.join(this.metricsPath, `performance-${timestamp}.json`),
          JSON.stringify(this.performanceMetrics, null, 2)
        )
      ]);

      this.logger.info('Metrics exported to disk successfully');
    } catch (error) {
      this.logger.error('Failed to save metrics to disk:', error);
    }
  }
}

export default new MonitoringService();