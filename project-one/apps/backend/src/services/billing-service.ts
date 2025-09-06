// Razorpay Billing & Subscription Service
// Complete billing solution for Jarvish subscription tiers

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { cache } from '../utils/redis';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in paise (INR)
  currency: 'INR';
  interval: 'monthly' | 'yearly';
  features: string[];
  description: string;
  maxGenerations: number;
  maxLints: number;
  priority: 'basic' | 'standard' | 'pro';
}

interface Customer {
  id: string;
  name: string;
  email: string;
  contact: string;
  notes?: Record<string, string>;
}

interface CreateOrderRequest {
  amount: number; // in paise
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
  startAt?: number; // timestamp
  expireBy?: number; // timestamp
  addons?: Array<{
    item: { name: string; amount: number; currency: string };
  }>;
  notes?: Record<string, string>;
}

interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

class BillingService {
  private razorpay: Razorpay;
  private webhookSecret: string;

  // Subscription Plans Configuration
  private readonly PLANS: Record<string, SubscriptionPlan> = {
    basic: {
      id: 'plan_basic_monthly',
      name: 'Basic Plan',
      price: 299900, // ₹2,999
      currency: 'INR',
      interval: 'monthly',
      features: [
        'AI-powered content generation',
        'SEBI compliance checking',
        'WhatsApp delivery automation',
        '10 content generations/day',
        '20 compliance checks/day',
        'Email support'
      ],
      description: 'Perfect for individual advisors starting with AI content',
      maxGenerations: 10,
      maxLints: 20,
      priority: 'basic'
    },
    standard: {
      id: 'plan_standard_monthly',
      name: 'Standard Plan',
      price: 599900, // ₹5,999
      currency: 'INR',
      interval: 'monthly',
      features: [
        'All Basic features',
        'Multi-language content (Hindi/Marathi)',
        'Advanced analytics',
        '25 content generations/day',
        '50 compliance checks/day',
        'WhatsApp Status format',
        'Priority support'
      ],
      description: 'For growing advisory practices with diverse client base',
      maxGenerations: 25,
      maxLints: 50,
      priority: 'standard'
    },
    pro: {
      id: 'plan_pro_monthly',
      name: 'Pro Plan',
      price: 1199900, // ₹11,999
      currency: 'INR',
      interval: 'monthly',
      features: [
        'All Standard features',
        'Unlimited content generation',
        'Unlimited compliance checks',
        'Branded content overlays',
        'Custom templates',
        'LinkedIn post generation',
        'API access',
        'Dedicated account manager',
        '99.9% delivery SLA'
      ],
      description: 'For established firms requiring enterprise features',
      maxGenerations: -1, // unlimited
      maxLints: -1, // unlimited
      priority: 'pro'
    }
  };

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    });
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  }

  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Object.values(this.PLANS);
  }

  /**
   * Get plan by ID
   */
  getPlanById(planId: string): SubscriptionPlan | null {
    return Object.values(this.PLANS).find(plan => plan.id === planId) || null;
  }

  /**
   * Create Razorpay customer
   */
  async createCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
    try {
      const customer = await this.razorpay.customers.create({
        name: customerData.name,
        email: customerData.email,
        contact: customerData.contact,
        notes: customerData.notes || {}
      });

      const result: Customer = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        contact: customer.contact,
        notes: customer.notes
      };

      // Cache customer data
      await cache.set(`customer:${customer.id}`, JSON.stringify(result), 3600);

      return result;
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      // Check cache first
      const cached = await cache.get<string>(`customer:${customerId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const customer = await this.razorpay.customers.fetch(customerId);
      
      const result: Customer = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        contact: customer.contact,
        notes: customer.notes
      };

      // Cache for 1 hour
      await cache.set(`customer:${customerId}`, JSON.stringify(result), 3600);

      return result;
    } catch (error: any) {
      console.error('Failed to fetch customer:', error);
      return null;
    }
  }

  /**
   * Create payment order for one-time payments
   */
  async createOrder(orderData: CreateOrderRequest): Promise<any> {
    try {
      const order = await this.razorpay.orders.create({
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        notes: orderData.notes || {}
      });

      // Cache order for verification
      await cache.set(`order:${order.id}`, JSON.stringify(order), 3600);

      return order;
    } catch (error: any) {
      console.error('Failed to create order:', error);
      throw new Error(`Order creation failed: ${error.message}`);
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(subscriptionData: CreateSubscriptionRequest): Promise<any> {
    try {
      const plan = this.getPlanById(subscriptionData.planId);
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      const subscription = await this.razorpay.subscriptions.create({
        plan_id: subscriptionData.planId,
        total_count: subscriptionData.totalCount,
        customer_id: subscriptionData.customerId,
        quantity: subscriptionData.quantity || 1,
        start_at: subscriptionData.startAt,
        expire_by: subscriptionData.expireBy,
        addons: subscriptionData.addons || [],
        notes: {
          ...subscriptionData.notes,
          plan_name: plan.name,
          max_generations: plan.maxGenerations.toString(),
          max_lints: plan.maxLints.toString()
        }
      });

      // Cache subscription data
      await cache.set(`subscription:${subscription.id}`, JSON.stringify(subscription), 3600);

      return subscription;
    } catch (error: any) {
      console.error('Failed to create subscription:', error);
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      // Check cache first
      const cached = await cache.get<string>(`subscription:${subscriptionId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
      
      // Cache for 1 hour
      await cache.set(`subscription:${subscriptionId}`, JSON.stringify(subscription), 3600);

      return subscription;
    } catch (error: any) {
      console.error('Failed to fetch subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true): Promise<any> {
    try {
      const subscription = await this.razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
      
      // Clear cache
      await cache.del(`subscription:${subscriptionId}`);

      return subscription;
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      throw new Error(`Subscription cancellation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(paymentData: VerifyPaymentRequest): boolean {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', this.razorpay.key_secret)
        .update(`${paymentData.orderId}|${paymentData.paymentId}`)
        .digest('hex');

      return generatedSignature === paymentData.signature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: any): Promise<void> {
    try {
      console.log(`Processing webhook event: ${event.event}`);

      switch (event.event) {
        case 'subscription.activated':
          await this.handleSubscriptionActivated(event.payload.subscription.entity);
          break;

        case 'subscription.charged':
          await this.handleSubscriptionCharged(event.payload.payment.entity);
          break;

        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(event.payload.subscription.entity);
          break;

        case 'subscription.completed':
          await this.handleSubscriptionCompleted(event.payload.subscription.entity);
          break;

        case 'payment.failed':
          await this.handlePaymentFailed(event.payload.payment.entity);
          break;

        default:
          console.log(`Unhandled webhook event: ${event.event}`);
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  private async handleSubscriptionActivated(subscription: any): Promise<void> {
    console.log(`Subscription activated: ${subscription.id}`);
    // Update user subscription status in database
    // Send welcome email
    // Enable features based on plan
  }

  private async handleSubscriptionCharged(payment: any): Promise<void> {
    console.log(`Subscription charged: ${payment.id}`);
    // Record payment in database
    // Update billing history
    // Send invoice email
  }

  private async handleSubscriptionCancelled(subscription: any): Promise<void> {
    console.log(`Subscription cancelled: ${subscription.id}`);
    // Update user subscription status
    // Send cancellation confirmation
    // Schedule feature downgrade
  }

  private async handleSubscriptionCompleted(subscription: any): Promise<void> {
    console.log(`Subscription completed: ${subscription.id}`);
    // Handle end of subscription
    // Send renewal reminder
  }

  private async handlePaymentFailed(payment: any): Promise<void> {
    console.log(`Payment failed: ${payment.id}`);
    // Send payment failure notification
    // Update subscription status
    // Retry payment if applicable
  }

  /**
   * Get billing statistics
   */
  async getBillingStats(customerId?: string): Promise<{
    totalRevenue: number;
    activeSubscriptions: number;
    failedPayments: number;
    churnRate: number;
  }> {
    try {
      // This would typically come from database queries
      // For now, return mock data structure
      return {
        totalRevenue: 0,
        activeSubscriptions: 0,
        failedPayments: 0,
        churnRate: 0
      };
    } catch (error) {
      console.error('Failed to get billing stats:', error);
      throw error;
    }
  }

  /**
   * Calculate plan usage
   */
  async calculateUsage(customerId: string, planId: string): Promise<{
    generationsUsed: number;
    lintsUsed: number;
    generationsRemaining: number;
    lintsRemaining: number;
    resetDate: Date;
  }> {
    const plan = this.getPlanById(planId);
    if (!plan) {
      throw new Error('Invalid plan');
    }

    // This would get actual usage from database
    // For now, return mock structure
    return {
      generationsUsed: 0,
      lintsUsed: 0,
      generationsRemaining: plan.maxGenerations === -1 ? -1 : plan.maxGenerations,
      lintsRemaining: plan.maxLints === -1 ? -1 : plan.maxLints,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
  }
}

export default new BillingService();