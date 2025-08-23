import { NextRequest, NextResponse } from 'next/server'
import { emailVerificationService } from '@/lib/services/email-verification'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }
    
    // Verify the email
    const result = await emailVerificationService.verifyEmail(token)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    // Return success with next step
    return NextResponse.json({
      success: true,
      message: result.message,
      userId: result.userId,
      nextStep: result.nextStep,
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Resend verification email
    const result = await emailVerificationService.resendVerificationEmail(userId)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          retryAfter: result.retryAfter,
        },
        { status: result.retryAfter ? 429 : 400 } // 429 for rate limiting
      )
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('Resend verification email error:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}