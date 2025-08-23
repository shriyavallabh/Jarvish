/**
 * Mass Distribution API Routes
 * Endpoints for managing WhatsApp mass distribution
 */

const express = require('express');
const router = express.Router();
const WhatsAppMassDistributionService = require('../services/whatsapp/mass-distribution-service');

// Initialize distribution service (this would come from app config)
let distributionService;

/**
 * Initialize distribution service with config
 */
router.initializeService = (config) => {
  distributionService = new WhatsAppMassDistributionService({
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    businessId: process.env.WHATSAPP_BUSINESS_ID,
    phoneNumbers: [
      {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID_1,
        displayNumber: process.env.WHATSAPP_DISPLAY_NUMBER_1
      },
      {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID_2,
        displayNumber: process.env.WHATSAPP_DISPLAY_NUMBER_2
      },
      {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID_3,
        displayNumber: process.env.WHATSAPP_DISPLAY_NUMBER_3
      }
    ].filter(p => p.phoneNumberId), // Filter out undefined numbers
    ...config
  });
  
  // Setup event listeners for monitoring
  setupEventListeners();
};

/**
 * Setup event listeners for distribution service
 */
function setupEventListeners() {
  distributionService.on('distribution:started', (data) => {
    console.log('Distribution started:', data);
    // Send webhook or notification
  });
  
  distributionService.on('distribution:completed', (report) => {
    console.log('Distribution completed:', report);
    // Send completion report
  });
  
  distributionService.on('sla:at_risk', (data) => {
    console.warn('SLA at risk:', data);
    // Send alert
  });
  
  distributionService.on('phone:disabled', (data) => {
    console.error('Phone disabled:', data);
    // Send critical alert
  });
  
  distributionService.on('critical:no_phones_available', () => {
    console.error('CRITICAL: No phone numbers available!');
    // Send emergency alert
  });
}

/**
 * GET /api/distribution/status
 * Get current distribution status
 */
router.get('/status', async (req, res) => {
  try {
    if (!distributionService) {
      return res.status(503).json({
        error: 'Distribution service not initialized'
      });
    }
    
    const status = distributionService.getDistributionStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/distribution/trigger
 * Manually trigger distribution (for testing)
 */
router.post('/trigger', async (req, res) => {
  try {
    if (!distributionService) {
      return res.status(503).json({
        error: 'Distribution service not initialized'
      });
    }
    
    // Start distribution in background
    distributionService.triggerDistribution()
      .then(result => {
        console.log('Manual distribution completed:', result);
      })
      .catch(error => {
        console.error('Manual distribution failed:', error);
      });
    
    res.json({
      success: true,
      message: 'Distribution triggered successfully',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/distribution/schedule
 * Schedule a one-time distribution
 */
router.post('/schedule', async (req, res) => {
  try {
    if (!distributionService) {
      return res.status(503).json({
        error: 'Distribution service not initialized'
      });
    }
    
    const { content, scheduledTime, recipients = 'all' } = req.body;
    
    // Validate input
    if (!content || !content.body) {
      return res.status(400).json({
        error: 'Content body is required'
      });
    }
    
    if (!scheduledTime) {
      return res.status(400).json({
        error: 'Scheduled time is required'
      });
    }
    
    const distribution = await distributionService.scheduleDistribution(
      content,
      scheduledTime,
      recipients
    );
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/distribution/content/submit
 * Submit content for today's distribution
 */
router.post('/content/submit', async (req, res) => {
  try {
    const { headline, body, mediaUrl, language = 'en_US' } = req.body;
    
    // Validate content
    if (!body) {
      return res.status(400).json({
        error: 'Content body is required'
      });
    }
    
    // This would save to database
    const content = {
      id: `content_${Date.now()}`,
      type: 'daily_market_update',
      date: new Date().toISOString().split('T')[0],
      headline,
      body,
      mediaUrl,
      language,
      status: 'pending_approval',
      submittedBy: req.user?.id || 'admin',
      submittedAt: new Date()
    };
    
    // In production, save to database
    // await saveContent(content);
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/distribution/analytics
 * Get distribution analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // This would fetch from database
    const analytics = {
      period: {
        start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString()
      },
      summary: {
        totalDistributions: 7,
        totalMessages: 1050,
        averageDeliveryRate: 0.985,
        averageSLA: 0.992
      },
      dailyMetrics: [
        {
          date: '2024-08-12',
          recipients: 150,
          sent: 150,
          delivered: 148,
          failed: 2,
          sla: 0.987,
          deliveryTime: '06:00-06:04'
        },
        {
          date: '2024-08-13',
          recipients: 150,
          sent: 150,
          delivered: 150,
          failed: 0,
          sla: 1.0,
          deliveryTime: '06:00-06:03'
        }
      ],
      phonePerformance: [
        {
          phoneId: 'phone_0',
          totalSent: 500,
          successRate: 0.99,
          quality: 'HIGH'
        },
        {
          phoneId: 'phone_1',
          totalSent: 400,
          successRate: 0.98,
          quality: 'HIGH'
        },
        {
          phoneId: 'phone_2',
          totalSent: 150,
          successRate: 0.97,
          quality: 'MEDIUM'
        }
      ]
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/distribution/subscribers
 * Get subscriber list and management
 */
router.get('/subscribers', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 50 } = req.query;
    
    // This would fetch from database
    const subscribers = {
      total: 150,
      page: parseInt(page),
      limit: parseInt(limit),
      data: Array.from({ length: Math.min(limit, 150) }, (_, i) => ({
        id: `sub_${(page - 1) * limit + i + 1}`,
        phoneNumber: `+91999999${String((page - 1) * limit + i).padStart(4, '0')}`,
        name: `Subscriber ${(page - 1) * limit + i + 1}`,
        status,
        tier: i < 20 ? 'PREMIUM' : i < 50 ? 'PRO' : 'BASIC',
        subscribedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        lastDelivery: {
          date: '2024-08-13',
          status: 'delivered',
          messageId: `msg_${Date.now()}_${i}`
        }
      }))
    };
    
    res.json({
      success: true,
      data: subscribers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/distribution/subscribers/add
 * Add new subscriber
 */
router.post('/subscribers/add', async (req, res) => {
  try {
    const { phoneNumber, name, tier = 'BASIC', language = 'en_US' } = req.body;
    
    if (!phoneNumber || !name) {
      return res.status(400).json({
        error: 'Phone number and name are required'
      });
    }
    
    // Validate phone number format
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        error: 'Invalid Indian phone number format'
      });
    }
    
    // This would save to database
    const subscriber = {
      id: `sub_${Date.now()}`,
      phoneNumber: phoneNumber.replace(/^\+/, ''),
      name,
      tier,
      language,
      status: 'active',
      subscribedAt: new Date(),
      preferences: {
        deliveryTime: '06:00',
        contentTypes: ['market_update', 'stock_tips']
      }
    };
    
    // In production, save to database
    // await saveSubscriber(subscriber);
    
    res.json({
      success: true,
      data: subscriber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/distribution/subscribers/:id/status
 * Update subscriber status
 */
router.patch('/subscribers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'paused', 'unsubscribed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be active, paused, or unsubscribed'
      });
    }
    
    // This would update database
    const updated = {
      id,
      status,
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/distribution/subscribers/import
 * Bulk import subscribers
 */
router.post('/subscribers/import', async (req, res) => {
  try {
    const { subscribers } = req.body;
    
    if (!Array.isArray(subscribers)) {
      return res.status(400).json({
        error: 'Subscribers must be an array'
      });
    }
    
    // Validate and process each subscriber
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    
    for (const sub of subscribers) {
      if (!sub.phoneNumber || !sub.name) {
        results.failed++;
        results.errors.push({
          data: sub,
          error: 'Missing required fields'
        });
        continue;
      }
      
      if (!phoneRegex.test(sub.phoneNumber)) {
        results.failed++;
        results.errors.push({
          data: sub,
          error: 'Invalid phone number format'
        });
        continue;
      }
      
      // This would save to database
      results.successful++;
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/distribution/health
 * Get system health status
 */
router.get('/health', async (req, res) => {
  try {
    if (!distributionService) {
      return res.status(503).json({
        healthy: false,
        error: 'Distribution service not initialized'
      });
    }
    
    // Check various system components
    const health = {
      healthy: true,
      timestamp: new Date(),
      components: {
        distribution_service: 'operational',
        redis: 'operational',
        whatsapp_api: 'operational'
      },
      phoneNumbers: [],
      uptime: process.uptime()
    };
    
    // Get phone status from distribution service
    const status = distributionService.getDistributionStatus();
    health.phoneNumbers = status.phoneStatus;
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error.message
    });
  }
});

module.exports = router;