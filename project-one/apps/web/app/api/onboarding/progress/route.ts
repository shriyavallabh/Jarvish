import { NextRequest, NextResponse } from 'next/server'
import { OnboardingProgressService } from '@/lib/services/onboarding-progress'
import { prisma } from '@/lib/utils/database'

const progressService = new OnboardingProgressService()

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

    // Get current progress
    const progress = await progressService.getProgress(advisorId)

    if (!progress) {
      // Initialize progress if not exists
      const newProgress = await progressService.initializeProgress(advisorId)
      
      return NextResponse.json({
        progress: newProgress,
        nextStep: await progressService.getNextStep(advisorId),
        allSteps: progressService.getOnboardingSteps(),
      })
    }

    // Get next step
    const nextStep = await progressService.getNextStep(advisorId)
    const nextStepDetails = nextStep ? await progressService.getStepDetails(nextStep) : null

    return NextResponse.json({
      progress,
      nextStep,
      nextStepDetails,
      allSteps: progressService.getOnboardingSteps(),
      isComplete: progress.completionPercentage === 100,
    })
  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve onboarding progress' },
      { status: 500 }
    )
  }
}

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

    if (!body.step) {
      return NextResponse.json(
        { error: 'Step name is required' },
        { status: 400 }
      )
    }

    // Update progress
    const updatedProgress = await progressService.updateProgress(advisorId, body.step)

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'ONBOARDING_STEP_COMPLETED',
        advisorId,
        success: true,
        metadata: {
          step: body.step,
          completionPercentage: updatedProgress.completionPercentage,
        },
        createdAt: new Date(),
      },
    })

    // Get next step
    const nextStep = await progressService.getNextStep(advisorId)
    const nextStepDetails = nextStep ? await progressService.getStepDetails(nextStep) : null

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      nextStep,
      nextStepDetails,
      message: `Step '${body.step}' completed successfully`,
      isComplete: updatedProgress.completionPercentage === 100,
    })
  } catch (error: any) {
    console.error('Update progress error:', error)

    if (error.message.includes('Invalid onboarding step')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update onboarding progress' },
      { status: 500 }
    )
  }
}

// Get progress for multiple steps
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

    // Get progress
    const progress = await progressService.getProgress(advisorId)
    
    if (!progress) {
      return NextResponse.json(
        { error: 'No onboarding progress found' },
        { status: 404 }
      )
    }

    // Check specific steps if provided
    if (body.steps && Array.isArray(body.steps)) {
      const stepStatuses = {}
      
      for (const step of body.steps) {
        stepStatuses[step] = {
          completed: await progressService.isStepCompleted(advisorId, step),
          details: await progressService.getStepDetails(step),
        }
      }

      return NextResponse.json({
        progress,
        stepStatuses,
        allSteps: progressService.getOnboardingSteps(),
      })
    }

    // Return detailed progress
    const allSteps = progressService.getOnboardingSteps()
    const stepDetails = {}
    
    for (const step of allSteps) {
      stepDetails[step] = {
        completed: progress.completedSteps.includes(step),
        details: await progressService.getStepDetails(step),
      }
    }

    return NextResponse.json({
      progress,
      stepDetails,
      nextStep: await progressService.getNextStep(advisorId),
      remainingSteps: allSteps.filter(s => !progress.completedSteps.includes(s)),
    })
  } catch (error) {
    console.error('Get step statuses error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve step statuses' },
      { status: 500 }
    )
  }
}