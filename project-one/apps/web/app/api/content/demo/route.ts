import { NextRequest, NextResponse } from 'next/server'
import { DemoContentService } from '@/lib/services/demo-content'
import { OnboardingProgressService } from '@/lib/services/onboarding-progress'
import { prisma } from '@/lib/utils/database'

const demoService = new DemoContentService()
const progressService = new OnboardingProgressService()

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

    // Check if preferences are set
    const preferences = await prisma.contentPreferences.findUnique({
      where: { advisorId },
    })

    if (!preferences) {
      return NextResponse.json(
        { 
          error: 'Please set your content preferences before generating demo content',
          nextStep: 'preferences',
        },
        { status: 400 }
      )
    }

    // Create audit log for demo request
    await prisma.auditLog.create({
      data: {
        action: 'DEMO_CONTENT_REQUESTED',
        advisorId,
        success: true,
        metadata: {
          languages: preferences.languages,
          topics: preferences.topics,
        },
        createdAt: new Date(),
      },
    })

    // Generate demo content with performance tracking
    const startTime = Date.now()
    const demoResult = await demoService.generateDemo(advisorId)
    const responseTime = Date.now() - startTime

    // Ensure response time is under 3.5 seconds
    if (responseTime > 3500) {
      console.warn(`Demo generation took ${responseTime}ms for advisor ${advisorId}`)
    }

    // Update onboarding progress
    await progressService.updateProgress(advisorId, 'demo-content')

    // Create success audit log
    await prisma.auditLog.create({
      data: {
        action: 'DEMO_CONTENT_GENERATED',
        advisorId,
        success: true,
        metadata: {
          complianceScore: demoResult.validation.complianceScore,
          isCompliant: demoResult.validation.isCompliant,
          responseTimeMs: responseTime,
        },
        createdAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      demo: demoResult,
      message: demoResult.validation.isCompliant 
        ? 'Demo content generated successfully'
        : 'Demo content generated with compliance warnings',
    })
  } catch (error: any) {
    console.error('Demo content generation error:', error)

    // Log failure
    const advisorId = req.headers.get('x-advisor-id')
    if (advisorId) {
      await prisma.auditLog.create({
        data: {
          action: 'DEMO_CONTENT_FAILED',
          advisorId,
          success: false,
          error: error.message,
          createdAt: new Date(),
        },
      })
    }

    // Handle specific errors
    if (error.message.includes('preferences not found')) {
      return NextResponse.json(
        { 
          error: error.message,
          nextStep: 'preferences',
        },
        { status: 400 }
      )
    }

    if (error.message.includes('Advisor not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate demo content. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Extract advisor ID from request
    const advisorId = req.headers.get('x-advisor-id')
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 401 }
      )
    }

    // Get demo history
    const demoHistory = await demoService.getDemoHistory(advisorId, limit)

    return NextResponse.json({
      success: true,
      demos: demoHistory,
      count: demoHistory.length,
    })
  } catch (error) {
    console.error('Get demo history error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve demo history' },
      { status: 500 }
    )
  }
}

// Regenerate demo content
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

    // Check regeneration limit (e.g., 5 demos per hour)
    const recentDemos = await prisma.demoContent.findMany({
      where: {
        advisorId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    })

    if (recentDemos.length >= 5) {
      return NextResponse.json(
        { 
          error: 'Demo generation limit exceeded. Please try again later.',
          retryAfter: 3600, // seconds
        },
        { status: 429 }
      )
    }

    // Generate new demo
    const demoResult = await demoService.generateDemo(advisorId)

    return NextResponse.json({
      success: true,
      demo: demoResult,
      message: 'New demo content generated successfully',
      remainingDemos: 5 - recentDemos.length - 1,
    })
  } catch (error: any) {
    console.error('Regenerate demo error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate demo content' },
      { status: 500 }
    )
  }
}