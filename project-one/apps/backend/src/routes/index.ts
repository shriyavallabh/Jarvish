import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import subscriptionRoutes from './subscription.routes';
import distributionRoutes from './distribution.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/distribution', distributionRoutes);

// API documentation endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Jarvish Content Distribution API v2.0',
    version: '2.0.0',
    type: 'Content Distribution Platform',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        refresh: 'POST /api/v1/auth/refresh',
        logout: 'POST /api/v1/auth/logout',
        profile: 'GET /api/v1/auth/profile',
        updateProfile: 'PATCH /api/v1/auth/profile',
        changePassword: 'POST /api/v1/auth/change-password',
      },
      admin: {
        content: {
          create: 'POST /api/v1/admin/content/create',
          approve: 'PUT /api/v1/admin/content/:id/approve',
          schedule: 'POST /api/v1/admin/content/schedule',
          list: 'GET /api/v1/admin/content',
          delete: 'DELETE /api/v1/admin/content/:id',
          bulkApprove: 'POST /api/v1/admin/content/bulk-approve',
        },
        ai: {
          generateContent: 'POST /api/v1/admin/content/generate-ai',
          scrapeAndGenerate: 'POST /api/v1/admin/content/scrape-and-generate',
          updatePrompts: 'PUT /api/v1/admin/content/prompts',
        },
        analytics: {
          contentAnalytics: 'GET /api/v1/admin/content/analytics',
          dashboard: 'GET /api/v1/admin/stats/dashboard',
          contentPerformance: 'GET /api/v1/admin/reports/content-performance',
        },
        media: {
          uploadImage: 'POST /api/v1/admin/content/upload-image',
        },
      },
      subscriptions: {
        plans: 'GET /api/v1/subscriptions/plans',
        create: 'POST /api/v1/subscriptions/create',
        status: 'GET /api/v1/subscriptions/status',
        cancel: 'POST /api/v1/subscriptions/cancel',
        changePlan: 'POST /api/v1/subscriptions/change-plan',
        payments: 'GET /api/v1/subscriptions/payments',
        usage: 'GET /api/v1/subscriptions/usage',
        webhooks: {
          razorpay: 'POST /api/v1/subscriptions/webhook/razorpay',
        },
      },
      distribution: {
        status: 'GET /api/v1/distribution/status',
        sendDaily: 'POST /api/v1/distribution/send-daily-content',
        queue: 'GET /api/v1/distribution/queue',
        deliveries: 'GET /api/v1/distribution/deliveries',
        retryFailed: 'POST /api/v1/distribution/retry-failed',
        cancelQueue: 'DELETE /api/v1/distribution/queue/:id',
        webhooks: {
          whatsapp: 'POST /api/v1/distribution/webhook/whatsapp',
        },
      },
    },
    authentication: {
      type: 'Bearer token in Authorization header',
      roles: ['SUBSCRIBER', 'ADMIN', 'SUPER_ADMIN'],
      subscriptionPlans: ['BASIC_499', 'STANDARD_999', 'PREMIUM_1999', 'ENTERPRISE_CUSTOM'],
    },
    features: {
      contentTypes: ['WHATSAPP_MESSAGE', 'WHATSAPP_IMAGE', 'WHATSAPP_STATUS', 'LINKEDIN_POST'],
      languages: ['EN', 'HI', 'GU', 'MR', 'TA', 'TE', 'KN', 'ML', 'BN', 'PA'],
      aiModels: ['gpt-4', 'gpt-3.5-turbo'],
      scheduling: '6 AM IST daily distribution',
      webScraping: 'Automated content generation from web sources',
    },
    integrations: {
      payments: 'Razorpay',
      messaging: 'WhatsApp Business API',
      ai: 'OpenAI GPT-4',
      social: 'LinkedIn API',
    },
    documentation: process.env.API_DOCS_URL || 'https://api.jarvish.ai/docs',
  });
});

export default router;