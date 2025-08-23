import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest('hex')

    const isAuthentic = expectedSign === razorpay_signature

    if (!isAuthentic) {
      return NextResponse.json(
        { error: 'Invalid signature', success: false },
        { status: 400 }
      )
    }

    // Update user metadata to mark as subscribed
    const user = await currentUser()
    if (user) {
      // TODO: Update user subscription status in database
      // await updateUserSubscription({
      //   userId,
      //   subscriptionStatus: 'active',
      //   subscriptionStartDate: new Date(),
      //   subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      //   paymentId: razorpay_payment_id,
      //   orderId: razorpay_order_id,
      // })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment', success: false },
      { status: 500 }
    )
  }
}