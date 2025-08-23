import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { SubscriptionService, AdvisorService } from '@/lib/supabase/services'

const subscriptionService = new SubscriptionService()
const advisorService = new AdvisorService()

// Verify Razorpay webhook signature
function verifySignature(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  
  return expectedSignature === signature
}

// POST /api/webhooks/razorpay - Handle Razorpay payment events
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature')
    const body = await request.text()

    if (!signature || !verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const { event: eventType, payload } = event

    switch (eventType) {
      case 'subscription.activated': {
        const { subscription } = payload
        const { id, customer_email, plan_id, status, current_start, current_end } = subscription.entity

        // Map Razorpay plan to our tiers
        let planType: 'basic' | 'standard' | 'pro' = 'basic'
        if (plan_id.includes('standard')) planType = 'standard'
        if (plan_id.includes('pro')) planType = 'pro'

        // Find advisor by email
        // In production, you'd store customer_id mapping
        const advisor = await advisorService.getAdvisorByClerkId(customer_email) // This needs adjustment
        
        if (advisor) {
          await subscriptionService.createSubscription({
            advisor_id: advisor.id,
            plan_type: planType,
            status: 'active',
            razorpay_subscription_id: id,
            starts_at: new Date(current_start * 1000).toISOString(),
            expires_at: new Date(current_end * 1000).toISOString()
          })
        }
        break
      }

      case 'subscription.cancelled': {
        const { subscription } = payload
        const { id } = subscription.entity

        // Find and cancel subscription
        // In production, you'd query by razorpay_subscription_id
        console.log('Subscription cancelled:', id)
        break
      }

      case 'payment.captured': {
        const { payment } = payload
        const { id, email, amount, currency, status } = payment.entity

        console.log('Payment captured:', {
          id,
          email,
          amount: amount / 100, // Convert from paise to rupees
          currency,
          status
        })
        break
      }

      case 'payment.failed': {
        const { payment } = payload
        const { id, email, error_description } = payment.entity

        console.log('Payment failed:', {
          id,
          email,
          error: error_description
        })
        break
      }

      default:
        console.log('Unhandled Razorpay event:', eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Razorpay webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}