import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { getWhatsAppScheduler } from '@/lib/whatsapp/scheduler'
import { AdvisorService } from '@/lib/supabase/services'
import { z } from 'zod'

// Request validation schema
const sendContentSchema = z.object({
  contentId: z.string().uuid(),
  phoneNumber: z.string().optional(),
  immediate: z.boolean().default(false)
})

// POST /api/whatsapp/send-content - Send content via WhatsApp
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
    const validation = sendContentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { contentId, phoneNumber, immediate } = validation.data

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

    // Get scheduler instance
    const scheduler = getWhatsAppScheduler()

    if (immediate) {
      // Send immediately
      const result = await scheduler.sendImmediate(
        advisor.id,
        contentId,
        targetPhone
      )

      if (result.status === 'failed') {
        return NextResponse.json(
          { 
            error: 'Failed to send message',
            details: result.error 
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        messageId: result.whatsappMessageId,
        timestamp: result.timestamp
      })
    } else {
      // Schedule for 6 AM delivery
      const results = await scheduler.scheduleDailyContent()

      return NextResponse.json({
        success: true,
        scheduled: results.scheduled,
        failed: results.failed,
        errors: results.errors,
        message: `Content scheduled for 6 AM IST delivery`
      })
    }
  } catch (error) {
    console.error('WhatsApp send content error:', error)
    return NextResponse.json(
      { error: 'Failed to send content', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/whatsapp/send-content - Get delivery statistics
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

    // Get advisor details
    const advisorService = new AdvisorService()
    const advisor = await advisorService.getAdvisorByClerkId(userId)

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor profile not found' },
        { status: 404 }
      )
    }

    // Get delivery stats
    const scheduler = getWhatsAppScheduler()
    const stats = await scheduler.getDeliveryStats(advisor.id)

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('WhatsApp stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get statistics', details: error.message },
      { status: 500 }
    )
  }
}