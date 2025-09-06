// Webhook Routes
// Handles WhatsApp Business API webhooks

import { Router, Request, Response } from 'express';
import whatsappAPIService from '../services/whatsapp-api.service';
import { createLogger } from 'winston';

const router = Router();

const logger = createLogger({
  level: 'info',
  defaultMeta: { service: 'webhooks' }
});

/**
 * GET /api/webhooks/whatsapp
 * WhatsApp webhook verification
 */
router.get('/whatsapp', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Log verification attempt
    logger.info('WhatsApp webhook verification attempt', {
      mode,
      hasToken: !!token,
      hasChallenge: !!challenge
    });

    // Verify the webhook
    if (mode === 'subscribe' && token) {
      if (whatsappAPIService.verifyWebhookToken(token as string)) {
        logger.info('Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        logger.warn('Invalid verification token');
        res.status(403).send('Forbidden');
      }
    } else {
      res.status(400).send('Bad Request');
    }
  } catch (error: any) {
    logger.error('Webhook verification error', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /api/webhooks/whatsapp
 * WhatsApp webhook events
 */
router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Log incoming webhook
    logger.info('WhatsApp webhook received', {
      hasEntry: !!body.entry,
      entryCount: body.entry?.length || 0
    });

    // Process the webhook event
    if (body.object === 'whatsapp_business_account') {
      await whatsappAPIService.processWebhookEvent(body);
      
      // Respond quickly to acknowledge receipt
      res.status(200).send('EVENT_RECEIVED');
    } else {
      logger.warn('Unknown webhook object type', { object: body.object });
      res.status(404).send('Not Found');
    }
  } catch (error: any) {
    logger.error('Webhook processing error', error);
    
    // Still return 200 to prevent WhatsApp from retrying
    res.status(200).send('ERROR_PROCESSED');
  }
});

/**
 * POST /api/webhooks/razorpay
 * Razorpay payment webhooks
 */
router.post('/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = req.body;

    logger.info('Razorpay webhook received', {
      event: body.event,
      hasSignature: !!signature
    });

    // Verify signature (implement actual verification)
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Handle different event types
    switch (body.event) {
      case 'payment.captured':
        logger.info('Payment captured', { 
          paymentId: body.payload.payment.entity.id,
          amount: body.payload.payment.entity.amount 
        });
        break;

      case 'subscription.activated':
        logger.info('Subscription activated', {
          subscriptionId: body.payload.subscription.entity.id
        });
        break;

      case 'subscription.charged':
        logger.info('Subscription charged', {
          subscriptionId: body.payload.subscription.entity.id
        });
        break;

      case 'subscription.cancelled':
        logger.info('Subscription cancelled', {
          subscriptionId: body.payload.subscription.entity.id
        });
        break;

      default:
        logger.info('Unhandled Razorpay event', { event: body.event });
    }

    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    logger.error('Razorpay webhook error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/webhooks/health
 * Webhook health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      webhooks: {
        whatsapp: 'configured',
        razorpay: 'configured'
      },
      timestamp: new Date().toISOString()
    }
  });
});

export default router;