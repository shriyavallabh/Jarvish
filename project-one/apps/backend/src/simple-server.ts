import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import complianceRoutes from './routes/compliance';
import whatsappTemplateRoutes from './routes/whatsapp-templates';
import imageProcessingRoutes from './routes/image-processing';
import basicBillingRoutes from './routes/basic-billing';
import monitoringRoutes from './routes/monitoring.routes';
import analyticsRoutes from './routes/analytics.routes';
import webhookRoutes from './routes/webhooks.routes';
import { performanceMiddleware, requestLoggerMiddleware, healthMetricsMiddleware } from './middleware/performance.middleware';
import monitoringService from './services/monitoring-service';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Performance monitoring middleware
app.use(requestLoggerMiddleware);
app.use(performanceMiddleware);
app.use(healthMetricsMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Mount compliance routes
app.use('/api/compliance', complianceRoutes);
app.use('/api/v1/compliance', complianceRoutes);

// Mount WhatsApp template routes
app.use('/api/whatsapp', whatsappTemplateRoutes);
app.use('/api/v1/whatsapp', whatsappTemplateRoutes);

// Mount image processing routes
app.use('/api/images', imageProcessingRoutes);
app.use('/api/v1/images', imageProcessingRoutes);

// Mount billing routes
app.use('/api/billing', basicBillingRoutes);
app.use('/api/v1/billing', basicBillingRoutes);

// Mount monitoring routes
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);

// Mount analytics routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Mount webhook routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Basic API info
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Jarvish API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth (coming soon)',
      content: '/api/v1/content (coming soon)',
      compliance: {
        check: 'POST /api/compliance/check - Real-time compliance checking',
        generate: 'POST /api/compliance/generate - Generate compliant content',
        stats: 'GET /api/compliance/stats - Usage statistics',
        batch: 'POST /api/compliance/batch - Batch compliance check',
        rules: 'GET /api/compliance/rules - Get compliance rules',
        fix: 'POST /api/compliance/fix - Auto-fix compliance issues',
        health: 'GET /api/compliance/health - Service health check'
      },
      whatsapp: {
        templates: 'GET /api/whatsapp/templates - Get all templates with stats',
        approved: 'GET /api/whatsapp/templates/approved - Get approved templates',
        image: 'GET /api/whatsapp/templates/image - Get image templates (1200x628)',
        create: 'POST /api/whatsapp/templates - Create new template',
        financial: 'POST /api/whatsapp/templates/financial - Create financial template',
        send: 'POST /api/whatsapp/send-template - Send template message',
        health: 'GET /api/whatsapp/health - WhatsApp API health'
      },
      images: {
        processGpt: 'POST /api/images/process-gpt - Process GPT-image-1 to 1200x628',
        processUrl: 'POST /api/images/process-url - Process image from URL',
        whatsappFormats: 'POST /api/images/whatsapp-formats - Generate all WhatsApp formats',
        batchProcess: 'POST /api/images/batch-process - Process multiple images',
        metadata: 'POST /api/images/metadata - Get image metadata',
        storageStats: 'GET /api/images/storage-stats - Storage statistics',
        cleanup: 'POST /api/images/cleanup - Clean up old images',
        health: 'GET /api/images/health - Image processing health'
      },
      billing: {
        plans: 'GET /api/billing/plans - Get subscription plans',
        pricing: 'GET /api/billing/pricing - Get pricing with comparisons',
        comparison: 'GET /api/billing/comparison - Get detailed plan comparison',
        invoicePreview: 'POST /api/billing/invoice-preview - Generate invoice preview',
        validatePromo: 'POST /api/billing/validate-promo - Validate promo codes',
        usage: 'POST /api/billing/usage - Get usage statistics',
        canChangePlan: 'POST /api/billing/can-change-plan - Check plan change eligibility',
        stats: 'GET /api/billing/stats - Get billing statistics',
        health: 'GET /api/billing/health - Billing service health'
      },
      monitoring: {
        health: 'GET /api/monitoring/health - Comprehensive system health',
        systemMetrics: 'GET /api/monitoring/metrics/system - System performance metrics',
        businessMetrics: 'GET /api/monitoring/metrics/business - Business analytics and KPIs',
        performance: 'GET /api/monitoring/metrics/performance - API performance analytics',
        alerts: 'GET /api/monitoring/alerts - Current alerts and alert rules',
        dashboard: 'GET /api/monitoring/dashboard - Complete dashboard data',
        reports: 'GET /api/monitoring/reports/daily - Daily monitoring reports',
        logPerformance: 'POST /api/monitoring/log-performance - Log API performance'
      },
      analytics: {
        advisors: 'GET /api/analytics/advisors - Advisor performance metrics',
        content: 'GET /api/analytics/content - Content performance analytics',
        revenue: 'GET /api/analytics/revenue - Revenue analytics and forecasting',
        churnPrediction: 'GET /api/analytics/churn-prediction - Advisor churn risk analysis',
        platformInsights: 'GET /api/analytics/platform-insights - Platform and feature adoption insights',
        businessIntelligence: 'GET /api/analytics/business-intelligence - Comprehensive BI report',
        dashboard: 'GET /api/analytics/dashboard - Real-time analytics dashboard',
        export: 'POST /api/analytics/export - Export analytics data (CSV/JSON)'
      },
      webhooks: {
        whatsappVerify: 'GET /api/webhooks/whatsapp - WhatsApp webhook verification',
        whatsappEvent: 'POST /api/webhooks/whatsapp - WhatsApp webhook events',
        razorpayEvent: 'POST /api/webhooks/razorpay - Razorpay payment webhooks',
        health: 'GET /api/webhooks/health - Webhook configuration health'
      },
    },
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`
🚀 Jarvish Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
🔗 Base URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
🔑 API Base: http://localhost:${PORT}/api/v1
📈 Monitoring: http://localhost:${PORT}/api/monitoring/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Start monitoring service
  try {
    await monitoringService.start();
    console.log('✅ Monitoring service started successfully');
  } catch (error) {
    console.error('❌ Failed to start monitoring service:', error);
  }
});