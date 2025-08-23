import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { getDeliveryScheduler } from '@/lib/services/delivery-scheduler'
import { getWhatsAppCloudAPI } from '@/lib/services/whatsapp-cloud-api'
import { AdvisorService } from '@/lib/supabase/services'
import { z } from 'zod'

// Request validation schema
const sendMessageSchema = z.object({
  contentId: z.string().uuid(),
  phoneNumber: z.string().optional(),
  immediate: z.boolean().default(false),
  templateName: z.string().optional(),
  parameters: z.record(z.string()).optional(),
  mediaUrl: z.string().url().optional()
})

// POST /api/whatsapp/send - Send WhatsApp message
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const validation = sendMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { contentId, phoneNumber, immediate, templateName, parameters, mediaUrl } = validation.data

    // Get advisor details
    const advisorService = new AdvisorService()
    const advisor = await advisorService.getAdvisorByClerkId(userId)

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor profile not found' },
        { status: 404 }
      )
    }

    // Use advisor's phone if not provided
    const targetPhone = phoneNumber || advisor.mobile

    // Validate phone number
    const whatsappAPI = getWhatsAppCloudAPI()
    if (!whatsappAPI.validateIndianPhoneNumber(targetPhone)) {
      return NextResponse.json(
        { error: 'Invalid Indian phone number format' },
        { status: 400 }
      )
    }

    if (immediate) {
      // Send immediately using WhatsApp Cloud API
      try {
        const response = await whatsappAPI.sendTemplate(
          targetPhone,
          templateName || 'daily_market_update_v1',
          advisor.language_preference || 'en',
          parameters || {},
          mediaUrl
        )

        if (!response.messages || response.messages.length === 0) {
          throw new Error('No message ID returned from WhatsApp')
        }

        // Log successful delivery
        console.log('Immediate message sent:', {
          advisorId: advisor.id,
          phoneNumber: targetPhone,
          messageId: response.messages[0].id
        })

        return NextResponse.json({
          success: true,
          messageId: response.messages[0].id,
          timestamp: new Date().toISOString(),
          deliveryStatus: 'sent'
        })
      } catch (error) {
        console.error('Immediate send failed:', error)
        return NextResponse.json(
          { 
            error: 'Failed to send message immediately',
            details: error.message 
          },
          { status: 500 }
        )
      }
    } else {
      // Use delivery scheduler for queue-based sending
      const scheduler = getDeliveryScheduler()
      
      try {
        const result = await scheduler.sendImmediate(
          advisor.id,
          contentId,
          targetPhone
        )

        if (result.status === 'failed') {
          return NextResponse.json(
            { 
              error: 'Failed to queue message for delivery',
              details: result.error 
            },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          jobId: result.jobId,
          messageId: result.whatsappMessageId,
          timestamp: result.deliveredAt?.toISOString(),
          deliveryStatus: result.status,
          processingTime: result.processingTime
        })
      } catch (error) {
        console.error('Scheduled send failed:', error)
        return NextResponse.json(
          { 
            error: 'Failed to schedule message delivery',
            details: error.message 
          },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// GET /api/whatsapp/send - Get delivery statistics
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '7d' // 7 days default
    const includeDetails = searchParams.get('details') === 'true'

    // Get advisor details
    const advisorService = new AdvisorService()
    const advisor = await advisorService.getAdvisorByClerkId(userId)

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor profile not found' },
        { status: 404 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Get delivery statistics
    const scheduler = getDeliveryScheduler()
    const slaMetrics = await scheduler.getSLAMetrics()

    // Get WhatsApp number health
    const whatsappAPI = getWhatsAppCloudAPI()
    const numberHealth = await whatsappAPI.getNumberHealth()

    // Build response
    const response: any = {
      success: true,
      advisor: {
        id: advisor.id,
        businessName: advisor.business_name,
        tier: advisor.subscription_tier
      },
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      metrics: {
        totalScheduled: slaMetrics.totalScheduled,
        totalDelivered: slaMetrics.totalDelivered,
        totalFailed: slaMetrics.totalFailed,
        deliveryRate: Math.round(slaMetrics.deliveryRate * 10000) / 100, // Percentage with 2 decimals
        avgDeliveryTime: slaMetrics.avgDeliveryTime,
        slaStatus: slaMetrics.slaStatus
      },
      numberHealth: {
        qualityRating: numberHealth.qualityRating,
        messagingLimit: numberHealth.messagingLimit,
        status: numberHealth.status
      }
    }

    // Include detailed breakdown if requested
    if (includeDetails) {
      response.details = {
        violations: slaMetrics.violations,
        peakConcurrency: slaMetrics.peakConcurrency,
        recentFailures: slaMetrics.violations
          .filter(v => v.metric === 'failure_rate')
          .slice(-5)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('WhatsApp stats error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get statistics',
        details: error.message 
      },
      { status: 500 }
    )
  }
}