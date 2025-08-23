/**
 * WhatsApp Mass Distribution Configuration
 * Manages multiple phone numbers and distribution settings
 */

module.exports = {
  // WhatsApp Business API Configuration
  api: {
    version: 'v20.0',
    baseUrl: 'https://graph.facebook.com',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    businessId: process.env.WHATSAPP_BUSINESS_ID,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'jarvish_verify_token_2024'
  },
  
  // Phone Number Pool Configuration
  phoneNumbers: [
    {
      id: 'primary_1',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID_1,
      displayNumber: process.env.WHATSAPP_DISPLAY_NUMBER_1 || '+919999999001',
      role: 'primary',
      dailyLimit: 100000,
      messagesPerSecond: 80,
      priority: 1,
      enabled: true
    },
    {
      id: 'primary_2',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID_2,
      displayNumber: process.env.WHATSAPP_DISPLAY_NUMBER_2 || '+919999999002',
      role: 'primary',
      dailyLimit: 100000,
      messagesPerSecond: 80,
      priority: 2,
      enabled: true
    },
    {
      id: 'backup_1',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID_3,
      displayNumber: process.env.WHATSAPP_DISPLAY_NUMBER_3 || '+919999999003',
      role: 'backup',
      dailyLimit: 50000,
      messagesPerSecond: 50,
      priority: 3,
      enabled: true
    }
  ].filter(phone => phone.phoneNumberId), // Only include configured numbers
  
  // Distribution Settings
  distribution: {
    timezone: 'Asia/Kolkata',
    dailyDeliveryTime: '06:00:00',
    deliveryWindow: 300000, // 5 minutes in milliseconds
    
    // Batching Configuration
    batchSize: 50, // Messages per batch
    batchDelay: 500, // Delay between batches in ms
    maxConcurrentBatches: 10,
    
    // Retry Configuration
    maxRetries: 3,
    retryDelay: 5000, // Initial retry delay
    retryBackoff: 'exponential', // exponential or linear
    
    // SLA Configuration
    slaTarget: 0.99, // 99% delivery success
    slaAlertThreshold: 0.97, // Alert if below 97%
    
    // Rate Limiting
    globalRateLimit: 200, // Messages per second across all numbers
    perNumberRateLimit: 80, // Messages per second per number
    
    // Quality Protection
    qualityThresholds: {
      blockRateLimit: 0.02, // 2% block rate
      reportRateLimit: 0.01, // 1% report rate
      minQualityRating: 'MEDIUM'
    }
  },
  
  // Template Configuration
  templates: {
    // Template rotation strategy
    rotationStrategy: 'performance', // performance, scheduled, or manual
    rotationThreshold: 0.02, // Rotate if block rate exceeds 2%
    
    // Template categories
    categories: {
      daily_update: {
        name: 'Daily Market Update',
        category: 'UTILITY',
        languages: ['en_US', 'hi_IN', 'mr_IN'],
        priority: 1
      },
      market_insight: {
        name: 'Market Insight',
        category: 'UTILITY',
        languages: ['en_US', 'hi_IN'],
        priority: 2
      },
      stock_tips: {
        name: 'Stock Tips',
        category: 'MARKETING',
        languages: ['en_US', 'hi_IN'],
        priority: 3,
        requiresOptIn: true
      }
    },
    
    // Approval buffer time (in days)
    approvalBuffer: 5,
    
    // Template performance tracking
    trackPerformance: true,
    performanceWindow: 7 // days
  },
  
  // Queue Configuration
  queues: {
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000
    },
    
    // Queue-specific settings
    settings: {
      'mass-distribution': {
        concurrency: 50,
        limiter: {
          max: 100,
          duration: 1000
        }
      },
      'batch-processing': {
        concurrency: 10,
        limiter: {
          max: 50,
          duration: 1000
        }
      },
      'distribution-retry': {
        concurrency: 5,
        limiter: {
          max: 20,
          duration: 1000
        }
      }
    }
  },
  
  // Monitoring Configuration
  monitoring: {
    enabled: true,
    updateInterval: 5000, // 5 seconds
    
    // Alert thresholds
    alerts: {
      queueDepth: 1000,
      failureRate: 0.05,
      processingTime: 10000, // 10 seconds
      phoneQualityDrop: true,
      slaViolation: true
    },
    
    // Metrics retention
    metricsRetention: {
      realtime: 3600, // 1 hour in seconds
      hourly: 86400 * 7, // 7 days
      daily: 86400 * 30 // 30 days
    }
  },
  
  // Subscriber Tiers Configuration
  subscriberTiers: {
    PREMIUM: {
      priority: 1,
      deliveryWindow: '05:59:00-06:01:00',
      retryAttempts: 5,
      features: ['priority_delivery', 'custom_content', 'analytics']
    },
    PRO: {
      priority: 2,
      deliveryWindow: '06:00:00-06:03:00',
      retryAttempts: 3,
      features: ['early_delivery', 'analytics']
    },
    BASIC: {
      priority: 3,
      deliveryWindow: '06:00:00-06:05:00',
      retryAttempts: 2,
      features: ['standard_delivery']
    }
  },
  
  // Content Types Configuration
  contentTypes: {
    market_update: {
      name: 'Market Update',
      template: 'daily_market_update',
      schedule: 'daily',
      time: '06:00',
      enabled: true
    },
    stock_tips: {
      name: 'Stock Tips',
      template: 'stock_tips_daily',
      schedule: 'daily',
      time: '06:00',
      enabled: true,
      requiresSubscription: 'PRO'
    },
    weekly_analysis: {
      name: 'Weekly Analysis',
      template: 'weekly_market_analysis',
      schedule: 'weekly',
      day: 'monday',
      time: '06:00',
      enabled: true,
      requiresSubscription: 'PREMIUM'
    }
  },
  
  // Webhook Configuration
  webhooks: {
    messageStatus: {
      url: process.env.WEBHOOK_STATUS_URL,
      enabled: true,
      events: ['sent', 'delivered', 'read', 'failed']
    },
    qualityAlerts: {
      url: process.env.WEBHOOK_QUALITY_URL,
      enabled: true,
      events: ['quality_degraded', 'number_flagged']
    },
    slaAlerts: {
      url: process.env.WEBHOOK_SLA_URL,
      enabled: true,
      events: ['sla_violation', 'sla_at_risk']
    }
  },
  
  // Scaling Configuration
  scaling: {
    // Auto-scaling based on subscriber count
    autoScale: true,
    thresholds: {
      150: { phones: 1, batchSize: 50 },
      500: { phones: 2, batchSize: 100 },
      1000: { phones: 3, batchSize: 150 },
      2000: { phones: 3, batchSize: 200 }
    }
  },
  
  // Compliance Configuration
  compliance: {
    // SEBI compliance for financial content
    validateContent: true,
    requiredDisclosures: true,
    
    // User consent management
    requireExplicitOptIn: true,
    optOutKeywords: ['STOP', 'UNSUBSCRIBE', 'OPTOUT'],
    
    // Data retention
    messageRetention: 90, // days
    subscriberDataRetention: 365 // days
  },
  
  // Development/Testing Configuration
  development: {
    mockDelivery: process.env.NODE_ENV === 'development',
    testPhoneNumbers: process.env.TEST_PHONE_NUMBERS?.split(',') || [],
    debugLogging: process.env.DEBUG === 'true',
    simulateFailures: false,
    failureRate: 0.05 // 5% simulated failure rate
  }
};

/**
 * Get configuration for current environment
 */
function getConfig() {
  const config = module.exports;
  
  // Apply environment-specific overrides
  if (process.env.NODE_ENV === 'production') {
    config.development.mockDelivery = false;
    config.development.debugLogging = false;
    config.development.simulateFailures = false;
  }
  
  // Validate required configuration
  if (!config.api.accessToken) {
    console.warn('WARNING: WhatsApp access token not configured');
  }
  
  if (!config.api.businessId) {
    console.warn('WARNING: WhatsApp business ID not configured');
  }
  
  if (config.phoneNumbers.length === 0) {
    console.warn('WARNING: No WhatsApp phone numbers configured');
  }
  
  return config;
}

module.exports.getConfig = getConfig;