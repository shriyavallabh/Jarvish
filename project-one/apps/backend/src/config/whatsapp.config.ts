// WhatsApp Business API Configuration
// Complete setup for WhatsApp Cloud API integration

export const whatsappConfig = {
  // API Configuration
  api: {
    version: 'v17.0',
    baseUrl: 'https://graph.facebook.com',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'jarvish_verify_token_2025',
  },

  // Message Templates
  templates: {
    // Template names registered with WhatsApp
    dailyUpdate: 'daily_market_update',
    investmentTip: 'investment_tip',
    complianceAlert: 'compliance_advisory',
    taxPlanning: 'tax_planning_reminder',
    sipReminder: 'sip_investment_reminder',
    
    // Template categories
    categories: {
      MARKETING: 'MARKETING',
      UTILITY: 'UTILITY',
      AUTHENTICATION: 'AUTHENTICATION',
    }
  },

  // Media Configuration
  media: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    supportedImageFormats: ['image/jpeg', 'image/png'],
    imageOptimization: {
      width: 1200,
      height: 628,
      quality: 85,
    }
  },

  // Delivery Configuration
  delivery: {
    defaultTime: '06:00', // IST
    timezone: 'Asia/Kolkata',
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    batchSize: 100, // Messages per batch
    rateLimitPerSecond: 80, // WhatsApp rate limit
  },

  // Quality Management
  quality: {
    minQualityScore: 'YELLOW', // Minimum acceptable quality rating
    pauseOnRed: true, // Pause template if quality drops to RED
    monitoringInterval: 3600000, // Check quality every hour
  },

  // Webhook Configuration
  webhook: {
    url: process.env.WHATSAPP_WEBHOOK_URL || 'https://api.jarvish.ai/webhooks/whatsapp',
    events: [
      'messages',
      'message_template_status_update',
      'phone_number_name_update',
      'quality_update',
      'account_update',
    ]
  },

  // Error Messages
  errors: {
    INVALID_PHONE: 'Invalid phone number format',
    TEMPLATE_NOT_FOUND: 'WhatsApp template not found',
    RATE_LIMIT_EXCEEDED: 'WhatsApp API rate limit exceeded',
    INVALID_MEDIA: 'Invalid media format or size',
    DELIVERY_FAILED: 'Message delivery failed',
    QUALITY_DEGRADED: 'Template quality score too low',
  }
};

// WhatsApp API Endpoints
export const whatsappEndpoints = {
  sendMessage: (phoneNumberId: string) => 
    `/${phoneNumberId}/messages`,
  
  uploadMedia: (phoneNumberId: string) => 
    `/${phoneNumberId}/media`,
  
  getMediaUrl: (mediaId: string) => 
    `/${mediaId}`,
  
  createTemplate: (businessId: string) => 
    `/${businessId}/message_templates`,
  
  getTemplates: (businessId: string) => 
    `/${businessId}/message_templates`,
  
  getPhoneNumber: (phoneNumberId: string) => 
    `/${phoneNumberId}`,
  
  registerWebhook: (phoneNumberId: string) => 
    `/${phoneNumberId}/subscribed_apps`,
};

// Template Payload Builders
export const templateBuilders = {
  // Daily Market Update Template
  dailyMarketUpdate: (params: {
    recipientPhone: string;
    advisorName: string;
    marketSummary: string;
    imageUrl?: string;
  }) => ({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: params.recipientPhone,
    type: 'template',
    template: {
      name: whatsappConfig.templates.dailyUpdate,
      language: { code: 'en' },
      components: [
        {
          type: 'header',
          parameters: params.imageUrl ? [
            {
              type: 'image',
              image: { link: params.imageUrl }
            }
          ] : []
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.advisorName },
            { type: 'text', text: params.marketSummary }
          ]
        }
      ]
    }
  }),

  // Investment Tip Template
  investmentTip: (params: {
    recipientPhone: string;
    tipTitle: string;
    tipContent: string;
    disclaimer: string;
  }) => ({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: params.recipientPhone,
    type: 'template',
    template: {
      name: whatsappConfig.templates.investmentTip,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.tipTitle },
            { type: 'text', text: params.tipContent },
            { type: 'text', text: params.disclaimer }
          ]
        }
      ]
    }
  }),

  // SIP Reminder Template
  sipReminder: (params: {
    recipientPhone: string;
    clientName: string;
    sipDate: string;
    amount: string;
    fundName: string;
  }) => ({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: params.recipientPhone,
    type: 'template',
    template: {
      name: whatsappConfig.templates.sipReminder,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.clientName },
            { type: 'text', text: params.sipDate },
            { type: 'text', text: params.amount },
            { type: 'text', text: params.fundName }
          ]
        }
      ]
    }
  })
};

// Validation Functions
export const validators = {
  isValidPhoneNumber: (phone: string): boolean => {
    // Indian phone number validation (with or without +91)
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  formatPhoneNumber: (phone: string): string => {
    // Format to WhatsApp required format (with country code, no +)
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned;
    } else if (cleaned.length === 10) {
      return '91' + cleaned;
    }
    return cleaned;
  },

  isValidImageUrl: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },

  isWithinRateLimit: (messageCount: number, timeWindow: number): boolean => {
    const messagesPerSecond = messageCount / (timeWindow / 1000);
    return messagesPerSecond <= whatsappConfig.delivery.rateLimitPerSecond;
  }
};

// Helper Functions
export const helpers = {
  // Build API URL
  getApiUrl: (endpoint: string): string => {
    const { baseUrl, version } = whatsappConfig.api;
    return `${baseUrl}/${version}${endpoint}`;
  },

  // Get headers for API requests
  getHeaders: () => ({
    'Authorization': `Bearer ${whatsappConfig.api.accessToken}`,
    'Content-Type': 'application/json',
  }),

  // Calculate next delivery time
  getNextDeliveryTime: (time: string = whatsappConfig.delivery.defaultTime): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const delivery = new Date();
    
    delivery.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (delivery <= now) {
      delivery.setDate(delivery.getDate() + 1);
    }
    
    return delivery;
  },

  // Format message for logging
  formatMessageLog: (message: any): string => {
    return JSON.stringify({
      to: message.to,
      type: message.type,
      template: message.template?.name,
      timestamp: new Date().toISOString()
    });
  }
};

export default whatsappConfig;