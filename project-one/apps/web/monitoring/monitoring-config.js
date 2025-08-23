/**
 * Monitoring and Alerting Configuration
 * Comprehensive observability for production environment
 */

const config = {
  // DataDog Configuration
  datadog: {
    apiKey: process.env.DATADOG_API_KEY,
    appKey: process.env.DATADOG_APP_KEY,
    site: 'datadoghq.com',
    service: 'jarvish',
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
    
    // Custom metrics
    metrics: {
      'content.generation.time': {
        type: 'histogram',
        tags: ['content_type', 'language']
      },
      'compliance.validation.time': {
        type: 'histogram',
        tags: ['stage', 'result']
      },
      'whatsapp.delivery.rate': {
        type: 'gauge',
        tags: ['status']
      },
      'advisor.active.count': {
        type: 'gauge',
        tags: ['plan']
      },
      'revenue.mrr': {
        type: 'gauge',
        tags: ['currency']
      }
    }
  },

  // Sentry Error Tracking
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      'Http',
      'Express',
      'Postgres',
      'Redis'
    ],
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
      }
      return event;
    }
  },

  // Alert Thresholds
  alerts: {
    // Performance Alerts
    performance: {
      pageLoad: {
        critical: 3000,  // ms
        warning: 2000,
        metric: 'browser.page.load_time'
      },
      apiResponse: {
        critical: 1500,  // ms
        warning: 1000,
        metric: 'api.response_time'
      },
      contentGeneration: {
        critical: 3500,  // ms
        warning: 3000,
        metric: 'content.generation.time'
      },
      complianceCheck: {
        critical: 1500,  // ms
        warning: 1200,
        metric: 'compliance.validation.time'
      }
    },

    // Availability Alerts
    availability: {
      uptime: {
        critical: 99.0,  // percentage
        warning: 99.5,
        metric: 'system.uptime'
      },
      errorRate: {
        critical: 1.0,   // percentage
        warning: 0.5,
        metric: 'api.error_rate'
      },
      whatsappDelivery: {
        critical: 98.0,  // percentage
        warning: 99.0,
        metric: 'whatsapp.delivery.rate'
      }
    },

    // Resource Alerts
    resources: {
      cpu: {
        critical: 80,    // percentage
        warning: 70,
        metric: 'system.cpu.usage'
      },
      memory: {
        critical: 90,    // percentage
        warning: 80,
        metric: 'system.memory.usage'
      },
      disk: {
        critical: 85,    // percentage
        warning: 75,
        metric: 'system.disk.usage'
      },
      database: {
        connections: {
          critical: 90,  // percentage of max
          warning: 80,
          metric: 'database.connections.active'
        },
        queryTime: {
          critical: 1000, // ms
          warning: 500,
          metric: 'database.query.time'
        }
      }
    },

    // Business Alerts
    business: {
      dailySignups: {
        critical: 5,     // minimum daily signups
        warning: 10,
        metric: 'business.signups.daily'
      },
      churnRate: {
        critical: 5.0,   // percentage
        warning: 3.0,
        metric: 'business.churn.rate'
      },
      paymentFailures: {
        critical: 5,     // count per hour
        warning: 2,
        metric: 'payment.failures.hourly'
      },
      contentCompliance: {
        critical: 95.0,  // percentage compliant
        warning: 98.0,
        metric: 'content.compliance.rate'
      }
    }
  },

  // Health Check Endpoints
  healthChecks: [
    {
      name: 'Application Health',
      url: '/api/health',
      interval: 30,      // seconds
      timeout: 5,        // seconds
      expectedStatus: 200
    },
    {
      name: 'Database Health',
      url: '/api/health/database',
      interval: 60,
      timeout: 10,
      expectedStatus: 200
    },
    {
      name: 'Redis Health',
      url: '/api/health/redis',
      interval: 60,
      timeout: 5,
      expectedStatus: 200
    },
    {
      name: 'WhatsApp API',
      url: '/api/health/whatsapp',
      interval: 300,    // 5 minutes
      timeout: 10,
      expectedStatus: 200
    },
    {
      name: 'OpenAI API',
      url: '/api/health/openai',
      interval: 600,    // 10 minutes
      timeout: 15,
      expectedStatus: 200
    }
  ],

  // Custom Dashboards
  dashboards: {
    executive: {
      widgets: [
        'revenue.mrr',
        'advisor.active.count',
        'business.churn.rate',
        'system.uptime',
        'whatsapp.delivery.rate'
      ]
    },
    technical: {
      widgets: [
        'api.response_time',
        'api.error_rate',
        'system.cpu.usage',
        'system.memory.usage',
        'database.connections.active'
      ]
    },
    compliance: {
      widgets: [
        'content.compliance.rate',
        'compliance.validation.time',
        'audit.events.count',
        'security.violations.count'
      ]
    }
  },

  // Notification Channels
  notifications: {
    channels: [
      {
        type: 'email',
        addresses: ['tech@jarvish.ai', 'cto@jarvish.ai'],
        severity: ['critical', 'warning']
      },
      {
        type: 'slack',
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#alerts',
        severity: ['critical', 'warning']
      },
      {
        type: 'pagerduty',
        serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
        severity: ['critical']
      },
      {
        type: 'sms',
        numbers: ['+919876543210'],
        severity: ['critical'],
        provider: 'twilio'
      }
    ],
    
    // Escalation Policy
    escalation: {
      levels: [
        {
          level: 1,
          delay: 0,        // immediate
          contacts: ['oncall-primary']
        },
        {
          level: 2,
          delay: 15,       // minutes
          contacts: ['oncall-secondary', 'team-lead']
        },
        {
          level: 3,
          delay: 30,       // minutes
          contacts: ['cto', 'engineering-team']
        },
        {
          level: 4,
          delay: 60,       // minutes
          contacts: ['ceo', 'board']
        }
      ]
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    
    // Log Retention
    retention: {
      application: 30,     // days
      security: 90,        // days
      audit: 2555,        // days (7 years for SEBI)
      performance: 7       // days
    },
    
    // Log Shipping
    shipping: {
      enabled: true,
      destination: 'elasticsearch',
      endpoint: process.env.ELASTICSEARCH_URL,
      index: 'jarvish-logs',
      batchSize: 100,
      flushInterval: 5000  // ms
    }
  },

  // APM (Application Performance Monitoring)
  apm: {
    enabled: true,
    serviceName: 'jarvish',
    serverUrl: process.env.APM_SERVER_URL,
    
    // Transaction Sampling
    transactionSampleRate: 0.1,
    
    // Distributed Tracing
    distributedTracing: true,
    
    // Custom Spans
    captureSpans: true,
    
    // Error Tracking
    captureErrors: true,
    
    // Metrics Collection
    metricsInterval: '30s'
  }
};

// Export monitoring utilities
module.exports = {
  config,
  
  // Initialize monitoring
  initialize() {
    // Initialize DataDog
    if (config.datadog.apiKey) {
      const StatsD = require('node-dogstatsd').StatsD;
      const dogstatsd = new StatsD();
      global.metrics = dogstatsd;
    }
    
    // Initialize Sentry
    if (config.sentry.dsn) {
      const Sentry = require('@sentry/node');
      Sentry.init(config.sentry);
    }
    
    // Start health checks
    this.startHealthChecks();
    
    console.log('✅ Monitoring initialized');
  },
  
  // Start health check monitoring
  startHealthChecks() {
    config.healthChecks.forEach(check => {
      setInterval(async () => {
        try {
          const start = Date.now();
          const response = await fetch(check.url);
          const duration = Date.now() - start;
          
          if (response.status === check.expectedStatus) {
            this.recordMetric('health.check.success', 1, { check: check.name });
          } else {
            this.recordMetric('health.check.failure', 1, { check: check.name });
            this.sendAlert('critical', `Health check failed: ${check.name}`);
          }
          
          this.recordMetric('health.check.duration', duration, { check: check.name });
        } catch (error) {
          this.recordMetric('health.check.error', 1, { check: check.name });
          this.sendAlert('critical', `Health check error: ${check.name} - ${error.message}`);
        }
      }, check.interval * 1000);
    });
  },
  
  // Record custom metric
  recordMetric(name, value, tags = {}) {
    if (global.metrics) {
      global.metrics.gauge(name, value, tags);
    }
    
    // Also log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Metric: ${name}=${value}`, tags);
    }
  },
  
  // Send alert
  sendAlert(severity, message, details = {}) {
    const alert = {
      severity,
      message,
      details,
      timestamp: new Date().toISOString(),
      service: 'jarvish',
      environment: process.env.NODE_ENV
    };
    
    // Send to appropriate channels based on severity
    config.notifications.channels
      .filter(channel => channel.severity.includes(severity))
      .forEach(channel => {
        this.sendToChannel(channel, alert);
      });
  },
  
  // Send alert to specific channel
  sendToChannel(channel, alert) {
    switch (channel.type) {
      case 'slack':
        // Send to Slack
        fetch(channel.webhook, {
          method: 'POST',
          body: JSON.stringify({
            text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
            attachments: [{
              color: alert.severity === 'critical' ? 'danger' : 'warning',
              fields: Object.entries(alert.details).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true
              }))
            }]
          })
        });
        break;
        
      case 'email':
        // Send email alert
        // Implementation depends on email service
        break;
        
      case 'pagerduty':
        // Trigger PagerDuty incident
        // Implementation depends on PagerDuty integration
        break;
        
      case 'sms':
        // Send SMS alert
        // Implementation depends on SMS provider
        break;
    }
  },
  
  // Check alert thresholds
  checkThresholds() {
    Object.entries(config.alerts).forEach(([category, metrics]) => {
      Object.entries(metrics).forEach(([metric, thresholds]) => {
        // Check each threshold
        // This would typically query your metrics backend
      });
    });
  }
};