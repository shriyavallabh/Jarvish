// Advanced Billing API Route with Razorpay Integration
// Handles subscriptions, payments, and billing management

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay (lazy initialization)
let razorpay: Razorpay | null = null;

function getRazorpay() {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
}

// Subscription plans
const PLANS = {
  basic: {
    id: 'plan_basic_monthly',
    name: 'Basic Plan',
    amount: 99900, // ₹999 in paise
    currency: 'INR',
    period: 'monthly',
    features: {
      contentLimit: 30,
      whatsappMessages: 1000,
      languages: ['en'],
      support: 'email'
    }
  },
  standard: {
    id: 'plan_standard_monthly',
    name: 'Standard Plan',
    amount: 249900, // ₹2,499 in paise
    currency: 'INR',
    period: 'monthly',
    features: {
      contentLimit: 100,
      whatsappMessages: 5000,
      languages: ['en', 'hi'],
      support: 'priority'
    }
  },
  pro: {
    id: 'plan_pro_monthly',
    name: 'Professional Plan',
    amount: 499900, // ₹4,999 in paise
    currency: 'INR',
    period: 'monthly',
    features: {
      contentLimit: -1, // Unlimited
      whatsappMessages: -1, // Unlimited
      languages: ['en', 'hi', 'mr'],
      support: 'dedicated'
    }
  }
};

// Verify Razorpay signature
function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
}

// GET - Fetch billing information
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'subscription';
    const advisorId = searchParams.get('advisorId');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'subscription': {
        if (!advisorId) {
          return NextResponse.json(
            { error: 'Advisor ID required' },
            { status: 400 }
          );
        }

        // Get current subscription
        const { data: subscription } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('advisor_id', advisorId)
          .eq('status', 'active')
          .single();

        // Get usage stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [contentCount, messageCount] = await Promise.all([
          supabaseAdmin
            .from('content')
            .select('*', { count: 'exact', head: true })
            .eq('advisor_id', advisorId)
            .gte('created_at', startOfMonth.toISOString()),
          
          supabaseAdmin
            .from('whatsapp_messages')
            .select('*', { count: 'exact', head: true })
            .eq('advisor_id', advisorId)
            .gte('created_at', startOfMonth.toISOString())
        ]);

        const plan = subscription ? PLANS[subscription.tier as keyof typeof PLANS] : null;
        const usage = {
          content: {
            used: contentCount.count || 0,
            limit: plan?.features.contentLimit || 0
          },
          messages: {
            used: messageCount.count || 0,
            limit: plan?.features.whatsappMessages || 0
          }
        };

        return NextResponse.json({
          success: true,
          data: {
            subscription,
            plan,
            usage,
            availablePlans: PLANS
          }
        });
      }

      case 'invoices': {
        if (!advisorId) {
          return NextResponse.json(
            { error: 'Advisor ID required' },
            { status: 400 }
          );
        }

        // Get payment history
        const { data: payments } = await supabaseAdmin
          .from('payments')
          .select('*')
          .eq('advisor_id', advisorId)
          .order('created_at', { ascending: false })
          .limit(50);

        return NextResponse.json({
          success: true,
          data: payments
        });
      }

      case 'plans': {
        // Return available plans
        return NextResponse.json({
          success: true,
          data: PLANS
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Billing GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}

// POST - Create subscription or payment
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, advisorId, planId, paymentDetails } = body;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'create-subscription': {
        if (!advisorId || !planId) {
          return NextResponse.json(
            { error: 'Advisor ID and Plan ID required' },
            { status: 400 }
          );
        }

        const plan = PLANS[planId as keyof typeof PLANS];
        if (!plan) {
          return NextResponse.json(
            { error: 'Invalid plan' },
            { status: 400 }
          );
        }

        // Get advisor details
        const { data: advisor } = await supabaseAdmin
          .from('advisors')
          .select('*')
          .eq('id', advisorId)
          .single();

        if (!advisor) {
          return NextResponse.json(
            { error: 'Advisor not found' },
            { status: 404 }
          );
        }

        // Create Razorpay customer if not exists
        let customerId = advisor.razorpay_customer_id;
        if (!customerId) {
          const customer = await getRazorpay()?.customers.create({
            name: advisor.name,
            email: advisor.email,
            contact: advisor.phone,
            notes: {
              advisor_id: advisorId
            }
          });
          customerId = customer.id;

          // Save customer ID
          await supabaseAdmin
            .from('advisors')
            .update({ razorpay_customer_id: customerId })
            .eq('id', advisorId);
        }

        // Create Razorpay subscription
        const subscription = await getRazorpay()?.subscriptions.create({
          plan_id: plan.id,
          customer_notify: 1,
          total_count: 120, // 10 years max
          notes: {
            advisor_id: advisorId,
            plan: planId
          }
        });

        // Save subscription to database
        const { data: dbSubscription } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            advisor_id: advisorId,
            plan_id: plan.id,
            tier: planId,
            status: 'inactive', // Will be activated after payment
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            razorpay_subscription_id: subscription.id,
            razorpay_customer_id: customerId,
            amount: plan.amount / 100,
            currency: plan.currency
          })
          .select()
          .single();

        return NextResponse.json({
          success: true,
          data: {
            subscription: dbSubscription,
            razorpaySubscription: subscription,
            paymentLink: subscription.short_url
          }
        });
      }

      case 'create-order': {
        if (!advisorId || !planId) {
          return NextResponse.json(
            { error: 'Advisor ID and Plan ID required' },
            { status: 400 }
          );
        }

        const plan = PLANS[planId as keyof typeof PLANS];
        if (!plan) {
          return NextResponse.json(
            { error: 'Invalid plan' },
            { status: 400 }
          );
        }

        // Create Razorpay order
        const order = await getRazorpay()?.orders.create({
          amount: plan.amount,
          currency: plan.currency,
          notes: {
            advisor_id: advisorId,
            plan: planId
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
          }
        });
      }

      case 'verify-payment': {
        const { orderId, paymentId, signature } = paymentDetails || {};

        if (!orderId || !paymentId || !signature) {
          return NextResponse.json(
            { error: 'Payment details required' },
            { status: 400 }
          );
        }

        // Verify signature
        const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid payment signature' },
            { status: 400 }
          );
        }

        // Fetch payment details from Razorpay
        const payment = await getRazorpay()?.payments.fetch(paymentId);

        // Save payment to database
        const { data: dbPayment } = await supabaseAdmin
          .from('payments')
          .insert({
            advisor_id: advisorId,
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            metadata: payment.notes
          })
          .select()
          .single();

        // Activate subscription if payment is successful
        if (payment.status === 'captured') {
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('advisor_id', advisorId)
            .eq('razorpay_order_id', orderId);

          // Update advisor subscription status
          await supabaseAdmin
            .from('advisors')
            .update({
              subscription_status: 'active',
              subscription_tier: payment.notes.plan || 'basic'
            })
            .eq('id', advisorId);
        }

        return NextResponse.json({
          success: true,
          data: {
            payment: dbPayment,
            verified: true
          }
        });
      }

      case 'cancel-subscription': {
        if (!advisorId) {
          return NextResponse.json(
            { error: 'Advisor ID required' },
            { status: 400 }
          );
        }

        // Get active subscription
        const { data: subscription } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('advisor_id', advisorId)
          .eq('status', 'active')
          .single();

        if (!subscription || !subscription.razorpay_subscription_id) {
          return NextResponse.json(
            { error: 'No active subscription found' },
            { status: 404 }
          );
        }

        // Cancel Razorpay subscription
        await getRazorpay()?.subscriptions.cancel(subscription.razorpay_subscription_id);

        // Update database
        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        // Update advisor status
        await supabaseAdmin
          .from('advisors')
          .update({ subscription_status: 'inactive' })
          .eq('id', advisorId);

        return NextResponse.json({
          success: true,
          message: 'Subscription cancelled successfully'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Billing POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Billing operation failed' },
      { status: 500 }
    );
  }
}

// Export runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 30;