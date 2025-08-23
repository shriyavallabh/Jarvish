import { NextRequest, NextResponse } from 'next/server'
import { MobileVerificationService } from '@/lib/services/mobile-verification'
import { auth } from '@clerk/nextjs'
import { z } from 'zod'

// Request validation schemas
const generateOTPSchema = z.object({
  mobile: z.string().regex(/^(\+91|91)?[6-9]\d{9}$/, 'Invalid Indian mobile number'),
})

const verifyOTPSchema = z.object({
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
})

const mobileService = new MobileVerificationService()

/**
 * POST /api/auth/mobile-verify
 * Generate and send OTP to mobile number
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validation = generateOTPSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }
    
    const { mobile } = validation.data
    
    // Generate and send OTP
    const result = await mobileService.generateOTP(userId, mobile)
    
    if (!result.success) {
      // Check for rate limiting
      if (result.error?.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Too many requests',
            message: 'Please wait before requesting another OTP',
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to send OTP',
          message: result.message,
        },
        { status: 500 }
      )
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresInMinutes: result.expiresInMinutes,
    })
  } catch (error: any) {
    console.error('Mobile verification error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/mobile-verify
 * Verify OTP
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validation = verifyOTPSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }
    
    const { otp } = validation.data
    
    // Get client IP for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'
    
    // Verify OTP
    const result = await mobileService.verifyOTP(userId, otp, ipAddress)
    
    if (!result.success) {
      // Check for specific error types
      if (result.message.includes('expired')) {
        return NextResponse.json(
          { 
            error: 'OTP expired',
            message: 'The OTP has expired. Please request a new one',
          },
          { status: 410 } // Gone
        )
      }
      
      if (result.message.includes('Maximum attempts')) {
        return NextResponse.json(
          { 
            error: 'Too many attempts',
            message: 'Maximum verification attempts exceeded. Please request a new OTP',
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Verification failed',
          message: result.message,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: 400 }
      )
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully',
      nextStep: 'profile-completion',
    })
  } catch (error: any) {
    console.error('OTP verification error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/auth/mobile-verify
 * Resend OTP
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validation = generateOTPSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }
    
    const { mobile } = validation.data
    
    // Resend OTP
    const result = await mobileService.resendOTP(userId, mobile)
    
    if (!result.success) {
      // Check for cooldown period
      if (result.waitTimeSeconds) {
        return NextResponse.json(
          { 
            error: 'Too soon to resend',
            message: result.message,
            waitTimeSeconds: result.waitTimeSeconds,
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to resend OTP',
          message: result.message,
        },
        { status: 500 }
      )
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully',
    })
  } catch (error: any) {
    console.error('OTP resend error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}