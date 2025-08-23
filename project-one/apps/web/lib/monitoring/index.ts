/**
 * Monitoring System Initialization
 * Central initialization and management of all monitoring components
 */

import { initializeMetrics, metrics, trackApiRequest, trackWhatsAppDelivery, trackDatabaseQuery, trackContentGeneration } from './metrics-collector';
import healthChecker from './health-checker';
import logger, { Logger, loggingMiddleware, logError, logAudit } from './logger';
import alerting from './alerting';

// Monitoring configuration
interface MonitoringConfig {
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  enableAlerting: boolean;
  enableLogging: boolean;
  metricsPort?: number;
  healthCheckInterval?: number;
  alertCheckInterval?: number;
}

class MonitoringSystem {
  private static instance: MonitoringSystem;
  private config: MonitoringConfig;
  private initialized: boolean = false;
  
  private constructor() {
    this.config = {
      enableMetrics: process.env.ENABLE_METRICS !== 'false',
      enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
      enableAlerting: process.env.ENABLE_ALERTING !== 'false',
      enableLogging: process.env.ENABLE_LOGGING !== 'false',
      metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
      alertCheckInterval: parseInt(process.env.ALERT_CHECK_INTERVAL || '30000')
    };
  }
  
  static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }
  
  /**
   * Initialize the monitoring system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Monitoring system already initialized');
      return;
    }
    
    try {
      logger.info('Initializing monitoring system', { config: this.config });
      
      // Initialize metrics collection
      if (this.config.enableMetrics) {
        initializeMetrics();
        logger.info('Metrics collection initialized');
      }
      
      // Initialize health checks
      if (this.config.enableHealthChecks) {
        // Health checker initializes automatically
        logger.info('Health checks initialized');
      }
      
      // Initialize alerting
      if (this.config.enableAlerting) {
        // Alerting system initializes automatically
        logger.info('Alerting system initialized');
      }
      
      // Set up graceful shutdown
      this.setupGracefulShutdown();
      
      this.initialized = true;
      logger.info('Monitoring system initialized successfully');
      
      // Track initialization metric
      metrics.systemHealth.set({ component: 'monitoring' }, 100);
      
    } catch (error) {
      logger.error('Failed to initialize monitoring system', error as Error);
      throw error;
    }
  }
  
  /**
   * Set up graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        // Cleanup health checker
        if (this.config.enableHealthChecks) {
          healthChecker.cleanup();
        }
        
        // Log final metrics
        if (this.config.enableMetrics) {
          await this.logFinalMetrics();
        }
        
        logger.info('Monitoring system shut down successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error as Error);
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
  
  /**
   * Log final metrics before shutdown
   */
  private async logFinalMetrics(): Promise<void> {
    const finalMetrics = {
      totalRequests: await metrics.apiRequests.get(),
      totalErrors: await metrics.apiErrors.get(),
      whatsappMessages: await metrics.whatsappMessages.get(),
      contentGenerated: await metrics.contentGenerated.get()
    };
    
    logger.info('Final metrics', finalMetrics);
  }
  
  /**
   * Get monitoring status
   */
  getStatus(): any {
    return {
      initialized: this.initialized,
      config: this.config,
      health: this.config.enableHealthChecks ? healthChecker.getCachedHealthStatus() : null,
      alerts: this.config.enableAlerting ? alerting.getActiveAlerts() : null
    };
  }
  
  /**
   * Track custom metric
   */
  trackCustomMetric(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.config.enableMetrics) return;
    
    // This would track custom metrics based on the metric name
    logger.debug('Custom metric tracked', { name, value, labels });
  }
  
  /**
   * Create a child logger with context
   */
  createLogger(context: Record<string, any>): Logger {
    return new Logger(context);
  }
}

// Export singleton instance
const monitoringSystem = MonitoringSystem.getInstance();

// Export monitoring utilities
export {
  monitoringSystem,
  metrics,
  healthChecker,
  logger,
  alerting,
  Logger,
  loggingMiddleware,
  trackApiRequest,
  trackWhatsAppDelivery,
  trackDatabaseQuery,
  trackContentGeneration,
  logError,
  logAudit
};

// Initialize monitoring on module load if not in test environment
if (process.env.NODE_ENV !== 'test') {
  monitoringSystem.initialize().catch(error => {
    console.error('Failed to initialize monitoring:', error);
  });
}

export default monitoringSystem;