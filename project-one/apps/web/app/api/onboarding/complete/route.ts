import { NextRequest, NextResponse } from 'next/server'
import { OnboardingCompletionService } from '@/lib/services/onboarding-completion'
import { prisma } from '@/lib/utils/database'

const completionService = new OnboardingCompletionService()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Extract advisor ID from request
    const advisorId = body.advisorId || req.headers.get('x-advisor-id')
    
    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 401 }
      )
    }

    // Complete onboarding
    const result = await completionService.completeOnboarding(advisorId)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      advisor: {
        id: result.advisor.id,
        isActive: result.advisor.isActive,
        onboardingCompleted: result.advisor.onboardingCompleted,
        tier: result.advisor.subscription_tier || 'basic',
      },
      warnings: result.warnings,
      nextSteps: [
        'Start creating SEBI-compliant content',
        'Connect your WhatsApp Business account',
        'Schedule your first content delivery',
        'Explore analytics dashboard',
      ],
    })
  } catch (error: any) {
    console.error('Onboarding completion error:', error)

    // Log failure
    const advisorId = req.headers.get('x-advisor-id')
    if (advisorId) {
      await prisma.auditLog.create({
        data: {
          action: 'ONBOARDING_COMPLETION_API_FAILED',
          advisorId,
          success: false,
          error: error.message,
          createdAt: new Date(),
        },
      })
    }

    // Handle specific errors
    if (error.message.includes('Missing steps')) {
      return NextResponse.json(
        { 
          error: error.message,
          type: 'incomplete',
        },
        { status: 400 }
      )
    }

    if (error.message === 'Advisor not found') {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Extract advisor ID from request
    const advisorId = req.headers.get('x-advisor-id')
    
    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 401 }
      )
    }

    // Get completion status
    const status = await completionService.getCompletionStatus(advisorId)

    return NextResponse.json({
      status,
      canComplete: status.completionPercentage >= 86, // All required steps except 'completion'
    })
  } catch (error) {
    console.error('Get completion status error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve completion status' },
      { status: 500 }
    )
  }
}

// Verify completion requirements
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const advisorId = body.advisorId || req.headers.get('x-advisor-id')
    
    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 401 }
      )
    }

    // Verify completion requirements
    const verification = await completionService.verifyCompletion(advisorId)

    // Check if ready to complete (only 'completion' step missing)
    const readyToComplete = 
      verification.missingSteps.length === 1 && 
      verification.missingSteps[0] === 'completion'

    return NextResponse.json({
      isComplete: verification.isComplete,
      readyToComplete,
      missingSteps: verification.missingSteps.filter(s => s !== 'completion'),
      completionPercentage: verification.completionPercentage,
      message: readyToComplete 
        ? 'Ready to complete onboarding'
        : `Please complete the following steps: ${verification.missingSteps.filter(s => s !== 'completion').join(', ')}`,
    })
  } catch (error) {
    console.error('Verify completion error:', error)
    return NextResponse.json(
      { error: 'Failed to verify completion requirements' },
      { status: 500 }
    )
  }
}

// Reset onboarding (admin/testing only)
export async function DELETE(req: NextRequest) {
  try {
    // Check for admin token
    const adminToken = req.headers.get('x-admin-token')
    
    if (adminToken !== process.env.ADMIN_API_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const advisorId = searchParams.get('advisorId')
    
    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 400 }
      )
    }

    // Reset onboarding
    await completionService.resetOnboarding(advisorId)

    return NextResponse.json({
      success: true,
      message: 'Onboarding reset successfully',
    })
  } catch (error) {
    console.error('Reset onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to reset onboarding' },
      { status: 500 }
    )
  }
}