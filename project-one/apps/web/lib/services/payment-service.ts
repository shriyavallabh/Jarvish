/**
 * Payment Service
 * Handles Razorpay integration, subscriptions, and billing
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';

interface SubscriptionPlan {
  id: string;
  name: 'BASIC' | 'STANDARD' | 'PRO';
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    advisors?: number;
    content_per_day?: number;
    whatsapp_messages?: number;
    ai_model?: string;
    support_level?: string;
  };
}

interface PaymentDetails {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Invoice {
  id: string;
  advisor_id: string;
  amount: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'failed';
  due_date: Date;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export class PaymentService {
  private razorpay: Razorpay;
  private supabase: any;
  private readonly WEBHOOK_SECRET: string;

  // Subscription plans with Indian pricing
  private readonly PLANS: Record<string, SubscriptionPlan> = {
    BASIC: {
      id: 'plan_basic_monthly',
      name: 'BASIC',
      price: 999, // ₹999/month
      interval: 'monthly',
      features: [
        '50 pieces of content/month',
        'Basic AI model',
        'Email support',
        '100 WhatsApp messages/day',
        'Single language'
      ],
      limits: {
        content_per_day: 2,
        whatsapp_messages: 100,
        ai_model: 'gpt-4o-mini',
        support_level: 'email'
      }
    },
    STANDARD: {
      id: 'plan_standard_monthly',
      name: 'STANDARD',
      price: 2499, // ₹2,499/month
      interval: 'monthly',
      features: [
        '150 pieces of content/month',
        'Advanced AI model',
        'Priority support',
        '500 WhatsApp messages/day',
        'Multi-language support',
        'Analytics dashboard'
      ],
      limits: {
        content_per_day: 5,
        whatsapp_messages: 500,
        ai_model: 'gpt-4o-mini',
        support_level: 'priority'
      }
    },
    PRO: {
      id: 'plan_pro_monthly',
      name: 'PRO',
      price: 4999, // ₹4,999/month
      interval: 'monthly',
      features: [
        'Unlimited content',
        'Premium AI model (GPT-4)',
        'Dedicated support',
        'Unlimited WhatsApp messages',
        'All languages',
        'Advanced analytics',
        'Custom branding',
        'API access'
      ],
      limits: {
        content_per_day: -1, // Unlimited
        whatsapp_messages: -1,
        ai_model: 'gpt-4',
        support_level: 'dedicated'
      }
    }
  };

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });

    this.WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Create a new subscription
   */
  async createSubscription(
    advisorId: string,
    planName: 'BASIC' | 'STANDARD' | 'PRO',
    email?: string,
    mobile?: string,
    interval: 'monthly' | 'yearly' = 'monthly'
  ) {
    try {
      // Validate plan
      if (!['BASIC', 'STANDARD', 'PRO'].includes(planName)) {
        throw new Error('Invalid plan type');
      }
      
      const plan = this.PLANS[planName];
      
      // Calculate price with yearly discount
      let finalPrice = plan.price;
      if (interval === 'yearly') {
        finalPrice = plan.price * 10; // 2 months free on yearly
      }

      // Create subscription params
      const subscriptionParams: any = {
        plan_id: `${plan.id}_${email}`,
        customer_notify: 1,
        quantity: 1,
        total_count: 1,
        notes: {
          advisor_id: advisorId,
          plan_type: planName
        }
      };

      // Add notification info if provided
      if (email || mobile) {
        subscriptionParams.notify_info = {
          notify_email: email,
          notify_phone: mobile
        };
      }

      // Create Razorpay subscription
      const subscription = await this.razorpay.subscriptions.create(subscriptionParams);

      // Store subscription in database
      const { data, error } = await this.supabase
        .from('subscriptions')
        .insert({
          advisor_id: advisorId,
          razorpay_subscription_id: subscription.id,
          plan_name: planName,
          interval,
          status: subscription.status,
          current_start: new Date(subscription.current_start * 1000),
          current_end: new Date(subscription.current_end * 1000),
          amount: finalPrice,
          created_at: new Date()
        });

      if (error) throw error;

      // Clear cached subscription data
      await redis.del(`subscription:${advisorId}`);

      return {
        subscription_id: subscription.id,
        payment_link: subscription.short_url || `https://rzp.io/${subscription.id}`,
        status: 'created'
      };

    } catch (error: any) {
      console.error('Subscription creation failed:', error);
      
      // Check for specific error types
      if (error.message?.includes('Invalid plan')) {
        throw new Error('Invalid plan type');
      }
      
      throw new Error('Subscription creation failed');
    }
  }

  /**
   * Create a payment order for one-time or subscription payment
   */
  async createOrder(
    advisorId: string,
    amount: number,
    currency: string = 'INR',
    notes?: Record<string, any>
  ) {
    try {
      const order = await this.razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt: `rcpt_${Date.now()}`,
        notes: {
          advisor_id: advisorId,
          ...notes
        }
      });

      // Store order in database
      await this.supabase
        .from('payment_orders')
        .insert({
          advisor_id: advisorId,
          razorpay_order_id: order.id,
          amount: amount,
          currency,
          status: 'created',
          created_at: new Date()
        });

      return {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      };

    } catch (error) {
      console.error('Order creation failed:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(paymentDetails: PaymentDetails): boolean {
    const text = `${paymentDetails.razorpay_order_id}|${paymentDetails.razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    return signature === paymentDetails.razorpay_signature;
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(paymentDetails: PaymentDetails, advisorId: string) {
    try {
      // Verify signature
      if (!this.verifyPaymentSignature(paymentDetails)) {
        throw new Error('Invalid payment signature');
      }

      // Fetch payment details from Razorpay
      const payment = await this.razorpay.payments.fetch(
        paymentDetails.razorpay_payment_id
      );

      // Update order status
      await this.supabase
        .from('payment_orders')
        .update({
          status: 'paid',
          razorpay_payment_id: payment.id,
          paid_at: new Date()
        })
        .eq('razorpay_order_id', paymentDetails.razorpay_order_id);

      // Create payment record
      await this.supabase
        .from('payments')
        .insert({
          advisor_id: advisorId,
          razorpay_payment_id: payment.id,
          razorpay_order_id: paymentDetails.razorpay_order_id,
          amount: payment.amount / 100, // Convert from paise
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          created_at: new Date()
        });

      // Update subscription if applicable
      if (payment.notes?.subscription_id) {
        await this.updateSubscriptionStatus(
          payment.notes.subscription_id,
          'active'
        );
      }

      // Send confirmation email
      await this.sendPaymentConfirmation(advisorId, payment);

      return {
        success: true,
        payment_id: payment.id,
        amount: payment.amount / 100
      };

    } catch (error) {
      console.error('Payment processing failed:', error);
      throw new Error('Failed to process payment');
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    status: 'active' | 'cancelled' | 'expired' | 'paused'
  ) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .update({ 
          status,
          updated_at: new Date()
        })
        .eq('razorpay_subscription_id', subscriptionId);

      if (error) throw error;

      // Clear cache
      if (data?.[0]) {
        await redis.del(`subscription:${data[0].advisor_id}`);
      }

      return { success: true, status };

    } catch (error) {
      console.error('Subscription update failed:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(advisorId: string, reason?: string) {
    try {
      // Get current subscription
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('advisor_id', advisorId)
        .eq('status', 'active')
        .single();

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Cancel in Razorpay
      const cancelled = await this.razorpay.subscriptions.cancel(
        subscription.razorpay_subscription_id,
        {
          cancel_at_cycle_end: true // Cancel at end of billing period
        }
      );

      // Update database
      await this.updateSubscriptionStatus(
        subscription.razorpay_subscription_id,
        'cancelled'
      );

      // Log cancellation reason
      await this.supabase
        .from('subscription_cancellations')
        .insert({
          advisor_id: advisorId,
          subscription_id: subscription.id,
          reason,
          cancelled_at: new Date()
        });

      return {
        success: true,
        cancelled_at: new Date(),
        effective_date: subscription.current_end
      };

    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Generate invoice
   */
  async generateInvoice(advisorId: string, subscriptionId: string): Promise<Invoice> {
    try {
      // Get subscription details
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const plan = this.PLANS[subscription.plan_name];
      
      // Calculate tax (18% GST)
      const subtotal = plan.price;
      const tax = subtotal * 0.18;
      const total = subtotal + tax;

      // Create invoice
      const invoice: Invoice = {
        id: `INV-${Date.now()}`,
        advisor_id: advisorId,
        amount: subtotal,
        tax,
        total,
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        items: [
          {
            description: `${plan.name} Plan - ${subscription.interval}`,
            quantity: 1,
            unit_price: subtotal,
            total: subtotal
          }
        ]
      };

      // Store invoice
      const { data, error } = await this.supabase
        .from('invoices')
        .insert({
          ...invoice,
          subscription_id: subscriptionId,
          created_at: new Date()
        });

      if (error) throw error;

      // Generate PDF (placeholder for actual implementation)
      await this.generateInvoicePDF(invoice);

      return invoice;

    } catch (error) {
      console.error('Invoice generation failed:', error);
      throw new Error('Failed to generate invoice');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(advisorId: string) {
    try {
      // Check cache first
      const cached = await redis.get(`subscription:${advisorId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('advisor_id', advisorId)
        .eq('status', 'active')
        .single();

      if (!subscription) {
        return null;
      }

      const plan = this.PLANS[subscription.plan_name];
      
      const details = {
        ...subscription,
        plan_details: plan,
        days_remaining: Math.ceil(
          (new Date(subscription.current_end).getTime() - Date.now()) / 
          (1000 * 60 * 60 * 24)
        )
      };

      // Cache for 1 hour
      await redis.setex(
        `subscription:${advisorId}`,
        3600,
        JSON.stringify(details)
      );

      return details;

    } catch (error) {
      console.error('Failed to get subscription:', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(advisorId: string, limit: number = 10) {
    try {
      const { data: payments } = await this.supabase
        .from('payments')
        .select('*')
        .eq('advisor_id', advisorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return payments || [];

    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw new Error('Failed to retrieve payment history');
    }
  }

  /**
   * Process webhook events
   */
  async processWebhook(body: any, signature: string) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', this.WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      const event = body.event;
      const payload = body.payload;

      switch (event) {
        case 'subscription.activated':
          await this.handleSubscriptionActivated(payload.subscription);
          break;

        case 'subscription.charged':
          await this.handleSubscriptionCharged(payload.subscription, payload.payment);
          break;

        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(payload.subscription);
          break;

        case 'subscription.expired':
          await this.handleSubscriptionExpired(payload.subscription);
          break;

        case 'payment.failed':
          await this.handlePaymentFailed(payload.payment);
          break;

        default:
          console.log('Unhandled webhook event:', event);
      }

      return { success: true, event };

    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw new Error('Failed to process webhook');
    }
  }

  /**
   * Handle subscription activated
   */
  private async handleSubscriptionActivated(subscription: any) {
    await this.updateSubscriptionStatus(subscription.id, 'active');
    
    // Grant access to features
    const { data: advisor } = await this.supabase
      .from('subscriptions')
      .select('advisor_id, plan_name')
      .eq('razorpay_subscription_id', subscription.id)
      .single();

    if (advisor) {
      await this.grantPlanAccess(advisor.advisor_id, advisor.plan_name);
    }
  }

  /**
   * Handle subscription charged
   */
  private async handleSubscriptionCharged(subscription: any, payment: any) {
    // Record payment
    await this.supabase
      .from('payments')
      .insert({
        advisor_id: subscription.notes?.advisor_id,
        razorpay_payment_id: payment.id,
        razorpay_subscription_id: subscription.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: 'captured',
        created_at: new Date()
      });

    // Generate and send invoice
    if (subscription.notes?.advisor_id) {
      await this.generateInvoice(
        subscription.notes.advisor_id,
        subscription.id
      );
    }
  }

  /**
   * Handle subscription cancelled
   */
  private async handleSubscriptionCancelled(subscription: any) {
    await this.updateSubscriptionStatus(subscription.id, 'cancelled');
    
    // Revoke access after current period ends
    // This will be handled by a scheduled job
  }

  /**
   * Handle subscription expired
   */
  private async handleSubscriptionExpired(subscription: any) {
    await this.updateSubscriptionStatus(subscription.id, 'expired');
    
    // Revoke access immediately
    const { data: advisor } = await this.supabase
      .from('subscriptions')
      .select('advisor_id')
      .eq('razorpay_subscription_id', subscription.id)
      .single();

    if (advisor) {
      await this.revokeAccess(advisor.advisor_id);
    }
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(payment: any) {
    // Record failed payment
    await this.supabase
      .from('payment_failures')
      .insert({
        advisor_id: payment.notes?.advisor_id,
        razorpay_payment_id: payment.id,
        amount: payment.amount / 100,
        error_code: payment.error_code,
        error_description: payment.error_description,
        failed_at: new Date()
      });

    // Send notification to advisor
    // Implement retry logic
  }

  /**
   * Grant plan access
   */
  private async grantPlanAccess(advisorId: string, planName: string) {
    const plan = this.PLANS[planName];
    
    await this.supabase
      .from('advisor_settings')
      .update({
        plan_name: planName,
        plan_limits: plan.limits,
        features_enabled: plan.features,
        updated_at: new Date()
      })
      .eq('advisor_id', advisorId);

    // Clear cache
    await redis.del(`advisor:settings:${advisorId}`);
  }

  /**
   * Revoke access
   */
  private async revokeAccess(advisorId: string) {
    await this.supabase
      .from('advisor_settings')
      .update({
        plan_name: 'FREE',
        plan_limits: {
          content_per_day: 0,
          whatsapp_messages: 0
        },
        features_enabled: [],
        updated_at: new Date()
      })
      .eq('advisor_id', advisorId);

    // Clear cache
    await redis.del(`advisor:settings:${advisorId}`);
  }

  /**
   * Send payment confirmation
   */
  private async sendPaymentConfirmation(advisorId: string, payment: any) {
    // Implement email service integration
    console.log('Sending payment confirmation to advisor:', advisorId);
  }

  /**
   * Generate invoice PDF
   */
  private async generateInvoicePDF(invoice: Invoice) {
    // Implement PDF generation
    console.log('Generating invoice PDF:', invoice.id);
  }

  /**
   * Check subscription limits
   */
  async checkSubscriptionLimits(advisorId: string, resource: string): Promise<boolean> {
    const subscription = await this.getSubscription(advisorId);
    
    if (!subscription) {
      return false; // No active subscription
    }

    const limits = subscription.plan_details.limits;
    
    // Get current usage
    const usage = await this.getCurrentUsage(advisorId);

    switch (resource) {
      case 'content':
        return limits.content_per_day === -1 || 
               usage.content_today < limits.content_per_day;
      
      case 'whatsapp':
        return limits.whatsapp_messages === -1 || 
               usage.whatsapp_today < limits.whatsapp_messages;
      
      default:
        return true;
    }
  }

  /**
   * Get current usage
   */
  private async getCurrentUsage(advisorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: contentCount } = await this.supabase
      .from('advisor_content')
      .select('id', { count: 'exact' })
      .eq('advisor_id', advisorId)
      .gte('created_at', today.toISOString());

    const { data: whatsappCount } = await this.supabase
      .from('whatsapp_deliveries')
      .select('id', { count: 'exact' })
      .eq('advisor_id', advisorId)
      .gte('created_at', today.toISOString());

    return {
      content_today: contentCount || 0,
      whatsapp_today: whatsappCount || 0
    };
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(paymentData: {
    razorpay_subscription_id?: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    razorpay_order_id?: string;
  }) {
    try {
      // Verify signature
      const text = paymentData.razorpay_order_id 
        ? `${paymentData.razorpay_order_id}|${paymentData.razorpay_payment_id}`
        : `${paymentData.razorpay_subscription_id}|${paymentData.razorpay_payment_id}`;
      
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest('hex');
      
      if (generated_signature !== paymentData.razorpay_signature) {
        throw new Error('Invalid payment signature');
      }

      // Update subscription status
      if (paymentData.razorpay_subscription_id) {
        await this.supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('razorpay_subscription_id', paymentData.razorpay_subscription_id);
      }

      // Store payment record
      await this.supabase
        .from('payments')
        .insert({
          payment_id: paymentData.razorpay_payment_id,
          subscription_id: paymentData.razorpay_subscription_id,
          order_id: paymentData.razorpay_order_id,
          signature: paymentData.razorpay_signature,
          status: 'captured',
          created_at: new Date()
        });

      return {
        success: true,
        subscription_id: paymentData.razorpay_subscription_id
      };
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Handle Razorpay webhook events
   */
  async handleWebhook(event: any, signature: string) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', this.WEBHOOK_SECRET)
        .update(JSON.stringify(event))
        .digest('hex');
      
      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const { entity } = event.payload.subscription || event.payload.payment || {};
      
      switch (event.event) {
        case 'subscription.activated':
          await this.supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_start: new Date(entity.current_start * 1000),
              current_end: new Date(entity.current_end * 1000)
            })
            .eq('razorpay_subscription_id', entity.id);
          break;
          
        case 'subscription.cancelled':
          await this.supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date()
            })
            .eq('razorpay_subscription_id', entity.id);
          break;
          
        case 'payment.captured':
          await this.supabase
            .from('payments')
            .update({ status: 'captured' })
            .eq('payment_id', entity.id);
          break;
          
        case 'payment.failed':
          await this.supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('payment_id', entity.id);
          break;
      }

      // Log webhook event
      await this.supabase
        .from('webhook_logs')
        .insert({
          event_type: event.event,
          payload: event,
          processed_at: new Date()
        });

      return { processed: true };
    } catch (error: any) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, advisorId: string) {
    try {
      // Verify ownership
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('razorpay_subscription_id', subscriptionId)
        .eq('advisor_id', advisorId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found or unauthorized');
      }

      // Cancel in Razorpay
      const cancelled = await this.razorpay.subscriptions.cancel(subscriptionId);

      // Update database
      await this.supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date()
        })
        .eq('razorpay_subscription_id', subscriptionId);

      // Clear cache
      await redis.del(`subscription:${advisorId}`);

      return {
        success: true,
        message: 'Subscription cancelled successfully'
      };
    } catch (error: any) {
      console.error('Subscription cancellation failed:', error);
      throw error;
    }
  }

  /**
   * Get invoices for an advisor
   */
  async getInvoices(advisorId: string, limit: number = 10) {
    try {
      // Get subscription
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('advisor_id', advisorId)
        .single();

      if (!subscription) {
        throw new Error('No subscription found');
      }

      // Get invoices from Razorpay
      const invoices = await this.razorpay.invoices.all({
        subscription_id: subscription.razorpay_subscription_id,
        count: limit
      });

      return invoices.items.map((invoice: any) => ({
        id: invoice.id,
        amount: invoice.amount / 100,
        status: invoice.status,
        date: new Date(invoice.created_at * 1000),
        pdf_url: invoice.short_url
      }));
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
      throw error;
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(subscriptionId: string, advisorId: string, methodDetails: any) {
    try {
      // Verify ownership
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('razorpay_subscription_id', subscriptionId)
        .eq('advisor_id', advisorId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found or unauthorized');
      }

      // Update in Razorpay
      await this.razorpay.subscriptions.update(subscriptionId, {
        customer_notify: 1
      });

      return {
        success: true,
        message: 'Payment method updated'
      };
    } catch (error: any) {
      console.error('Failed to update payment method:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount?: number, reason?: string) {
    try {
      // Get payment details
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (amount && amount > payment.amount / 100) {
        throw new Error('Refund amount exceeds payment amount');
      }

      // Process refund
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: amount ? amount * 100 : undefined, // Convert to paise
        notes: {
          reason: reason || 'Customer request'
        }
      });

      // Store refund record
      await this.supabase
        .from('refunds')
        .insert({
          payment_id: paymentId,
          refund_id: refund.id,
          amount: refund.amount / 100,
          reason,
          status: refund.status,
          created_at: new Date()
        });

      return {
        success: true,
        refund_id: refund.id,
        amount: refund.amount / 100
      };
    } catch (error: any) {
      console.error('Refund processing failed:', error);
      throw error;
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(advisorId: string) {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('advisor_id', advisorId)
        .eq('status', 'active')
        .single();

      if (!subscription) {
        return {
          has_active_subscription: false,
          message: 'No active subscription'
        };
      }

      return {
        has_active_subscription: true,
        subscription_id: subscription.razorpay_subscription_id,
        plan: subscription.plan_name,
        valid_till: subscription.current_end,
        auto_renew: true
      };
    } catch (error: any) {
      console.error('Failed to get subscription status:', error);
      throw error;
    }
  }

  /**
   * Check usage limits
   */
  async checkUsageLimits(advisorId: string, resource: string) {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('advisor_id', advisorId)
        .eq('status', 'active')
        .single();

      if (!subscription) {
        throw new Error('No active subscription');
      }

      const plan = this.PLANS[subscription.plan_name];
      const usage = await this.getUsageForToday(advisorId);

      switch (resource) {
        case 'content':
          const contentLimit = plan.limits.content_per_day;
          if (contentLimit !== -1 && usage.content_today >= contentLimit) {
            return {
              allowed: false,
              message: `Daily content limit (${contentLimit}) reached`
            };
          }
          break;
          
        case 'whatsapp':
          const whatsappLimit = plan.limits.whatsapp_messages;
          if (whatsappLimit !== -1 && usage.whatsapp_today >= whatsappLimit) {
            return {
              allowed: false,
              message: `Daily WhatsApp message limit (${whatsappLimit}) reached`
            };
          }
          break;
      }

      return {
        allowed: true,
        remaining: plan.limits.content_per_day === -1 ? 
          'unlimited' : 
          plan.limits.content_per_day - usage.content_today
      };
    } catch (error: any) {
      console.error('Failed to check usage limits:', error);
      throw error;
    }
  }

  /**
   * Generate invoice document
   */
  async generateInvoice(advisorId: string, month: string, year: string) {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('advisor_id', advisorId)
        .single();

      if (!subscription) {
        throw new Error('No subscription found');
      }

      const { data: advisor } = await this.supabase
        .from('advisors')
        .select('*')
        .eq('id', advisorId)
        .single();

      const plan = this.PLANS[subscription.plan_name];

      // Generate invoice data
      const invoice: Invoice = {
        id: `INV-${Date.now()}`,
        advisor_id: advisorId,
        amount: plan.price,
        tax: plan.price * 0.18, // 18% GST
        total: plan.price * 1.18,
        status: 'paid',
        due_date: new Date(),
        items: [{
          description: `${plan.name} Plan - ${month}/${year}`,
          quantity: 1,
          unit_price: plan.price,
          total: plan.price
        }]
      };

      // Store invoice
      await this.supabase
        .from('invoices')
        .insert(invoice);

      return invoice;
    } catch (error: any) {
      console.error('Failed to generate invoice:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription plan
   */
  async upgradeSubscription(subscriptionId: string, advisorId: string, newPlan: string) {
    try {
      // Verify ownership and current plan
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('razorpay_subscription_id', subscriptionId)
        .eq('advisor_id', advisorId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found or unauthorized');
      }

      const currentPlanIndex = ['BASIC', 'STANDARD', 'PRO'].indexOf(subscription.plan_name);
      const newPlanIndex = ['BASIC', 'STANDARD', 'PRO'].indexOf(newPlan);

      if (newPlanIndex <= currentPlanIndex) {
        throw new Error('Can only upgrade to a higher plan');
      }

      // Update in Razorpay
      const plan = this.PLANS[newPlan];
      await this.razorpay.subscriptions.update(subscriptionId, {
        plan_id: plan.id,
        quantity: 1
      });

      // Update database
      await this.supabase
        .from('subscriptions')
        .update({
          plan_name: newPlan,
          amount: plan.price,
          updated_at: new Date()
        })
        .eq('razorpay_subscription_id', subscriptionId);

      // Clear cache
      await redis.del(`subscription:${advisorId}`);

      return {
        success: true,
        message: `Upgraded to ${newPlan} plan`
      };
    } catch (error: any) {
      console.error('Subscription upgrade failed:', error);
      throw error;
    }
  }

  /**
   * Generate monthly revenue report
   */
  async generateRevenueReport(month: number, year: number) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Get all payments for the month
      const { data: payments } = await this.supabase
        .from('payments')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'captured');

      // Get all active subscriptions
      const { data: subscriptions } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active');

      // Calculate metrics
      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const activeSubscriptions = subscriptions?.length || 0;
      const mrr = subscriptions?.reduce((sum, s) => sum + s.amount, 0) || 0;

      // Group by plan
      const revenueByPlan: any = {};
      subscriptions?.forEach(sub => {
        if (!revenueByPlan[sub.plan_name]) {
          revenueByPlan[sub.plan_name] = {
            count: 0,
            revenue: 0
          };
        }
        revenueByPlan[sub.plan_name].count++;
        revenueByPlan[sub.plan_name].revenue += sub.amount;
      });

      return {
        month: `${month}/${year}`,
        total_revenue: totalRevenue,
        mrr,
        active_subscriptions: activeSubscriptions,
        revenue_by_plan: revenueByPlan,
        growth_rate: 0, // Would need previous month data
        churn_rate: 0, // Would need churn tracking
        arpu: activeSubscriptions > 0 ? mrr / activeSubscriptions : 0
      };
    } catch (error: any) {
      console.error('Failed to generate revenue report:', error);
      throw error;
    }
  }
}