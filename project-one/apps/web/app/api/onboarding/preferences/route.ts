import { NextRequest, NextResponse } from 'next/server'
import { ContentPreferencesService } from '@/lib/services/content-preferences'
import { OnboardingProgressService } from '@/lib/services/onboarding-progress'
import { prisma } from '@/lib/utils/database'

const preferencesService = new ContentPreferencesService()
const progressService = new OnboardingProgressService()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Extract advisor ID from request (in production, this would come from auth token)
    const advisorId = body.advisorId || req.headers.get('x-advisor-id')
    
    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 401 }
      )
    }

    // Validate required fields
    const requiredFields = ['languages', 'contentTypes', 'frequency', 'topics', 'deliveryTime']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          fields: missingFields,
        },
        { status: 400 }
      )
    }

    // Set preferences
    const preferences = await preferencesService.setPreferences(advisorId, {
      languages: body.languages,
      contentTypes: body.contentTypes,
      frequency: body.frequency,
      topics: body.topics,
      deliveryTime: body.deliveryTime,
    })

    // Update onboarding progress
    await progressService.updateProgress(advisorId, 'preferences')

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PREFERENCES_SET',
        advisorId,
        success: true,
        metadata: {
          languages: body.languages,
          frequency: body.frequency,
        },
        createdAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      preferences,
      message: 'Content preferences saved successfully',
    })
  } catch (error: any) {
    console.error('Preferences API error:', error)

    // Handle specific validation errors
    if (error.message.includes('tier allows maximum')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    if (error.message.includes('Invalid') || error.message.includes('Unsupported')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save preferences' },
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

    // Get preferences
    const preferences = await preferencesService.getPreferences(advisorId)

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      )
    }

    // Get advisor tier for limits
    const advisor = await prisma.advisors.findUnique({
      where: { id: advisorId },
    })

    const tier = advisor?.subscription_tier || 'basic'
    const limits = preferencesService.getTierLimits(tier)

    return NextResponse.json({
      preferences,
      limits,
      tier,
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve preferences' },
      { status: 500 }
    )
  }
}

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

    // Update preferences
    const preferences = await preferencesService.setPreferences(advisorId, {
      languages: body.languages,
      contentTypes: body.contentTypes,
      frequency: body.frequency,
      topics: body.topics,
      deliveryTime: body.deliveryTime,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PREFERENCES_UPDATED',
        advisorId,
        success: true,
        metadata: body,
        createdAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      preferences,
      message: 'Preferences updated successfully',
    })
  } catch (error: any) {
    console.error('Update preferences error:', error)
    
    if (error.message.includes('tier allows maximum')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}