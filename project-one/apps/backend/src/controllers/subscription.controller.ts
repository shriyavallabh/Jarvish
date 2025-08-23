import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Validation schemas
const CreateSubscriptionSchema = z.object({
  planType: z.enum(['BASIC_499', 'STANDARD_999', 'PREMIUM_1999', 'ENTERPRISE_CUSTOM']),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
});

const RazorpayWebhookSchema = z.object({
  entity: z.string(),
  event: z.string(),
  payload: z.object({
    subscription: z.object({
      entity: z.object({
        id: z.string(),
        status: z.string(),
        current_start: z.number().optional(),
        current_end: z.number().optional(),
        customer_id: z.string().optional(),
      }),
    }).optional(),
    payment: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        order_id: z.string().optional(),
        subscription_id: z.string().optional(),
        method: z.string().optional(),
      }),
    }).optional(),
  }),
});

// Plan configurations
const PLAN_CONFIG = {
  BASIC_499: {
    amount: 499,
    features: {
      whatsappMessages: true,
      whatsappImages: true,
      whatsappStatus: false,
      linkedinPosts: false,
      dailyLimit: 1,
    },
  },
  STANDARD_999: {
    amount: 999,
    features: {
      whatsappMessages: true,
      whatsappImages: true,
      whatsappStatus: true,
      linkedinPosts: false,
      dailyLimit: 2,
    },
  },
  PREMIUM_1999: {
    amount: 1999,
    features: {
      whatsappMessages: true,
      whatsappImages: true,
      whatsappStatus: true,
      linkedinPosts: true,
      dailyLimit: 5,
    },
  },
  ENTERPRISE_CUSTOM: {
    amount: 0, // Custom pricing
    features: {
      whatsappMessages: true,
      whatsappImages: true,
      whatsappStatus: true,
      linkedinPosts: true,
      dailyLimit: -1, // Unlimited
    },
  },
};

export class SubscriptionController {
  // Create subscription
  async createSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CreateSubscriptionSchema.parse(req.body);
      const userId = (req as any).user.id;

      // Check if user already has an active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
      });

      if (existingSubscription) {
        return res.status(400).json({
          error: 'User already has an active subscription',
          subscription: existingSubscription,
        });
      }

      const planConfig = PLAN_CONFIG[validated.planType];
      let amount = planConfig.amount;

      // Adjust amount based on billing cycle
      if (validated.billingCycle === 'QUARTERLY') {
        amount = amount * 3 * 0.95; // 5% discount
      } else if (validated.billingCycle === 'YEARLY') {
        amount = amount * 12 * 0.85; // 15% discount
      }

      // Create Razorpay subscription
      const razorpayPlan = await razorpay.plans.create({
        period: validated.billingCycle === 'MONTHLY' ? 'monthly' : 
                validated.billingCycle === 'QUARTERLY' ? 'monthly' : 'yearly',
        interval: validated.billingCycle === 'QUARTERLY' ? 3 : 1,
        item: {
          name: `${validated.planType} Plan`,
          description: `Jarvish ${validated.planType} subscription`,
          amount: Math.round(amount * 100), // Razorpay expects amount in paise
          currency: 'INR',
        },
      });

      // Get or create Razorpay customer
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      let razorpayCustomer;
      try {
        razorpayCustomer = await razorpay.customers.create({
          name: user!.name,
          email: user!.email,
          contact: user!.phoneNumber || undefined,
        });
      } catch (error) {
        console.error('Error creating Razorpay customer:', error);
      }

      // Create Razorpay subscription
      const razorpaySubscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlan.id,
        customer_id: razorpayCustomer?.id,
        total_count: validated.billingCycle === 'MONTHLY' ? 12 : 
                     validated.billingCycle === 'QUARTERLY' ? 4 : 1,
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId,
          planType: validated.planType,
        },
      });

      // Calculate expiry date
      const expiresAt = new Date();
      if (validated.billingCycle === 'MONTHLY') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (validated.billingCycle === 'QUARTERLY') {
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      // Create subscription in database
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planType: validated.planType,
          status: 'TRIALING', // Will be activated after payment
          amount,
          currency: 'INR',
          billingCycle: validated.billingCycle,
          razorpaySubscriptionId: razorpaySubscription.id,
          razorpayPlanId: razorpayPlan.id,
          razorpayCustomerId: razorpayCustomer?.id,
          startedAt: new Date(),
          expiresAt,
          trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day trial
          ...planConfig.features,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'SUBSCRIPTION_ALERT',
          title: 'Subscription Created',
          message: `Your ${validated.planType} subscription has been created. Complete payment to activate.`,
          actionUrl: razorpaySubscription.short_url,
          actionLabel: 'Complete Payment',
        },
      });

      res.status(201).json({
        success: true,
        data: {
          subscription,
          paymentLink: razorpaySubscription.short_url,
          razorpaySubscriptionId: razorpaySubscription.id,
        },
        message: 'Subscription created. Please complete payment to activate.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  // Get subscription status
  async getSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!subscription) {
        return res.json({
          success: true,
          data: {
            hasSubscription: false,
            message: 'No active subscription found',
          },
        });
      }

      // Check if subscription has expired
      if (subscription.expiresAt < new Date() && subscription.status === 'ACTIVE') {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' },
        });
        subscription.status = 'EXPIRED';
      }

      // Get usage stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayDeliveries = await prisma.contentDelivery.count({
        where: {
          userId,
          createdAt: { gte: today },
        },
      });

      res.json({
        success: true,
        data: {
          hasSubscription: true,
          subscription: {
            ...subscription,
            daysRemaining: Math.ceil((subscription.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            usageToday: todayDeliveries,
            dailyLimit: subscription.dailyLimit,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Handle Razorpay webhook
  async handleRazorpayWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      const webhookSignature = req.headers['x-razorpay-signature'] as string;

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        console.error('Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const validated = RazorpayWebhookSchema.parse(req.body);
      const { event, payload } = validated;

      switch (event) {
        case 'subscription.activated':
          await this.handleSubscriptionActivated(payload.subscription!.entity);
          break;

        case 'subscription.charged':
          await this.handleSubscriptionCharged(payload.subscription!.entity, payload.payment!.entity);
          break;

        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(payload.subscription!.entity);
          break;

        case 'subscription.paused':
          await this.handleSubscriptionPaused(payload.subscription!.entity);
          break;

        case 'subscription.resumed':
          await this.handleSubscriptionResumed(payload.subscription!.entity);
          break;

        case 'payment.captured':
          await this.handlePaymentCaptured(payload.payment!.entity);
          break;

        case 'payment.failed':
          await this.handlePaymentFailed(payload.payment!.entity);
          break;

        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      res.json({ status: 'ok' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid webhook payload', details: error.errors });
      }
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Handle subscription activated
  private async handleSubscriptionActivated(subscriptionData: any) {
    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionData.id },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          startedAt: new Date(subscriptionData.current_start * 1000),
          expiresAt: new Date(subscriptionData.current_end * 1000),
        },
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: subscription.userId,
          type: 'SUBSCRIPTION_ALERT',
          title: 'Subscription Activated',
          message: 'Your subscription has been activated successfully!',
        },
      });
    }
  }

  // Handle subscription charged
  private async handleSubscriptionCharged(subscriptionData: any, paymentData: any) {
    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionData.id },
    });

    if (subscription) {
      // Update subscription period
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          startedAt: new Date(subscriptionData.current_start * 1000),
          expiresAt: new Date(subscriptionData.current_end * 1000),
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: paymentData.amount / 100, // Convert from paise to rupees
          currency: paymentData.currency,
          status: 'SUCCESS',
          paymentMethod: paymentData.method,
          razorpayPaymentId: paymentData.id,
          razorpayOrderId: paymentData.order_id,
          paidAt: new Date(),
        },
      });
    }
  }

  // Handle subscription cancelled
  private async handleSubscriptionCancelled(subscriptionData: any) {
    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionData.id },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: subscription.userId,
          type: 'SUBSCRIPTION_ALERT',
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled. You can continue using the service until the current period ends.',
        },
      });
    }
  }

  // Handle subscription paused
  private async handleSubscriptionPaused(subscriptionData: any) {
    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionData.id },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'PAUSED',
          pausedAt: new Date(),
        },
      });
    }
  }

  // Handle subscription resumed
  private async handleSubscriptionResumed(subscriptionData: any) {
    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionData.id },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          pausedAt: null,
        },
      });
    }
  }

  // Handle payment captured
  private async handlePaymentCaptured(paymentData: any) {
    if (paymentData.subscription_id) {
      const subscription = await prisma.subscription.findUnique({
        where: { razorpaySubscriptionId: paymentData.subscription_id },
      });

      if (subscription) {
        // Check if payment already exists
        const existingPayment = await prisma.payment.findUnique({
          where: { razorpayPaymentId: paymentData.id },
        });

        if (!existingPayment) {
          await prisma.payment.create({
            data: {
              subscriptionId: subscription.id,
              amount: paymentData.amount / 100,
              currency: paymentData.currency,
              status: 'SUCCESS',
              paymentMethod: paymentData.method,
              razorpayPaymentId: paymentData.id,
              razorpayOrderId: paymentData.order_id,
              paidAt: new Date(),
            },
          });
        }
      }
    }
  }

  // Handle payment failed
  private async handlePaymentFailed(paymentData: any) {
    if (paymentData.subscription_id) {
      const subscription = await prisma.subscription.findUnique({
        where: { razorpaySubscriptionId: paymentData.subscription_id },
      });

      if (subscription) {
        // Update subscription status
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'PAST_DUE' },
        });

        // Create payment record
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: paymentData.amount / 100,
            currency: paymentData.currency,
            status: 'FAILED',
            paymentMethod: paymentData.method,
            razorpayPaymentId: paymentData.id,
            razorpayOrderId: paymentData.order_id,
            failedAt: new Date(),
          },
        });

        // Send notification
        await prisma.notification.create({
          data: {
            userId: subscription.userId,
            type: 'PAYMENT_ALERT',
            title: 'Payment Failed',
            message: 'Your subscription payment failed. Please update your payment method to continue service.',
            actionUrl: '/subscription/payment',
            actionLabel: 'Update Payment',
          },
        });
      }
    }
  }

  // Cancel subscription
  async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        },
      });

      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      // Cancel in Razorpay
      if (subscription.razorpaySubscriptionId) {
        try {
          await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, {
            cancel_at_cycle_end: true, // Cancel at the end of current billing cycle
          });
        } catch (error) {
          console.error('Error cancelling Razorpay subscription:', error);
        }
      }

      // Update subscription status
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: updatedSubscription,
        message: 'Subscription cancelled. You can continue using the service until the current period ends.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get subscription plans
  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = Object.entries(PLAN_CONFIG).map(([key, config]) => ({
        id: key,
        name: key.replace('_', ' '),
        monthlyPrice: config.amount,
        quarterlyPrice: config.amount * 3 * 0.95,
        yearlyPrice: config.amount * 12 * 0.85,
        features: config.features,
      }));

      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SubscriptionController();