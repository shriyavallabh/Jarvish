// Billing & Subscription API Routes
// Complete Razorpay integration for Jarvish subscription management

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import billingService from '../services/billing-service';

// Type imports for proper TypeScript support
interface Customer {
  id: string;
  name: string;
  email: string;
  contact: string;
  notes?: Record<string, string>;
}

interface CreateOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  customerId?: string;
}

interface CreateSubscriptionRequest {
  planId: string;
  totalCount: number;
  customerId: string;
  quantity?: number;
  startAt?: number;
  expireBy?: number;
  notes?: Record<string, string>;
}

interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

const router = Router();

// Request validation schemas
const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  contact: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  notes: z.record(z.string()).optional()
});

const CreateOrderSchema = z.object({
  amount: z.number().min(100), // minimum ₹1
  currency: z.string().default('INR'),
  receipt: z.string().min(1),
  notes: z.record(z.string()).optional(),
  customerId: z.string().optional()
});

const CreateSubscriptionSchema = z.object({
  planId: z.string().min(1),
  totalCount: z.number().min(1).max(120), // max 10 years monthly
  customerId: z.string().min(1),
  quantity: z.number().min(1).optional().default(1),
  startAt: z.number().optional(), // timestamp
  expireBy: z.number().optional(), // timestamp
  notes: z.record(z.string()).optional()
});

const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1)
});

/**
 * GET /api/billing/plans
 * Get all subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await billingService.getSubscriptionPlans();
    
    res.json({
      success: true,
      data: {
        plans: plans.map(plan => ({
          ...plan,
          priceINR: plan.price / 100, // Convert paise to rupees for display
          features: plan.features
        }))
      }
    });

  } catch (error: any) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans'
    });
  }
});

/**
 * GET /api/billing/plans/:planId
 * Get specific plan details
 */
router.get('/plans/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const plan = billingService.getPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...plan,
        priceINR: plan.price / 100
      }
    });

  } catch (error: any) {
    console.error('Error fetching plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan details'
    });
  }
});

/**
 * POST /api/billing/customers
 * Create new customer
 */
router.post('/customers', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateCustomerSchema.parse(req.body);
    
    const customer = await billingService.createCustomer(validatedData as Omit<Customer, 'id'>);
    
    res.json({
      success: true,
      data: customer
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/billing/customers/:customerId
 * Get customer details
 */
router.get('/customers/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const customer = await billingService.getCustomer(customerId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });

  } catch (error: any) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    });
  }
});

/**
 * POST /api/billing/orders
 * Create payment order
 */
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateOrderSchema.parse(req.body);
    
    const order = await billingService.createOrder(validatedData as CreateOrderRequest);
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        createdAt: order.created_at
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/billing/subscriptions
 * Create new subscription
 */
router.post('/subscriptions', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateSubscriptionSchema.parse(req.body);
    
    const subscription = await billingService.createSubscription(validatedData as CreateSubscriptionRequest);
    
    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        customerId: subscription.customer_id,
        status: subscription.status,
        currentStart: subscription.current_start,
        currentEnd: subscription.current_end,
        chargeAt: subscription.charge_at,
        startAt: subscription.start_at,
        endAt: subscription.end_at
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/billing/subscriptions/:subscriptionId
 * Get subscription details
 */
router.get('/subscriptions/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await billingService.getSubscription(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        customerId: subscription.customer_id,
        status: subscription.status,
        currentStart: subscription.current_start,
        currentEnd: subscription.current_end,
        chargeAt: subscription.charge_at,
        totalCount: subscription.total_count,
        paidCount: subscription.paid_count,
        remainingCount: subscription.remaining_count
      }
    });

  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

/**
 * DELETE /api/billing/subscriptions/:subscriptionId
 * Cancel subscription
 */
router.delete('/subscriptions/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { cancelAtCycleEnd = true } = req.query;
    
    const subscription = await billingService.cancelSubscription(
      subscriptionId, 
      cancelAtCycleEnd === 'true'
    );
    
    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelledAt: subscription.cancelled_at,
        endAt: subscription.end_at
      }
    });

  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/billing/verify-payment
 * Verify payment signature
 */
router.post('/verify-payment', async (req: Request, res: Response) => {
  try {
    const validatedData = VerifyPaymentSchema.parse(req.body);
    
    const isValid = billingService.verifyPaymentSignature(validatedData as VerifyPaymentRequest);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }

    res.json({
      success: true,
      data: {
        verified: true,
        orderId: validatedData.orderId,
        paymentId: validatedData.paymentId
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed'
    });
  }
});

/**
 * GET /api/billing/usage/:customerId/:planId
 * Get usage statistics for customer
 */
router.get('/usage/:customerId/:planId', async (req: Request, res: Response) => {
  try {
    const { customerId, planId } = req.params;
    
    const usage = await billingService.calculateUsage(customerId, planId);
    
    res.json({
      success: true,
      data: usage
    });

  } catch (error: any) {
    console.error('Error fetching usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics'
    });
  }
});

/**
 * GET /api/billing/stats
 * Get billing statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query;
    
    const stats = await billingService.getBillingStats(customerId as string);
    
    res.json({
      success: true,
      data: {
        ...stats,
        totalRevenueINR: stats.totalRevenue / 100 // Convert to rupees
      }
    });

  } catch (error: any) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing statistics'
    });
  }
});

/**
 * POST /api/billing/webhook
 * Handle Razorpay webhooks
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing signature'
      });
    }

    // Verify webhook signature
    const isValid = billingService.verifyWebhookSignature(payload, signature);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    // Process the webhook event
    await billingService.processWebhookEvent(req.body);
    
    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

/**
 * GET /api/billing/health
 * Check billing service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test basic service connectivity
    const plans = await billingService.getSubscriptionPlans();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        totalPlans: plans.length,
        availablePlans: plans.map(p => p.name),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Billing health check failed:', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: 'Billing service unavailable',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;