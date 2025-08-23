import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { ContentDeliveryService, AdvisorService } from '@/lib/supabase/services'

// GET /api/whatsapp/status/[id] - Check message delivery status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const deliveryId = params.id

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Delivery ID required' },
        { status: 400 }
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

    // Get delivery status
    const deliveryService = new ContentDeliveryService()
    const delivery = await deliveryService.getDeliveryById(deliveryId)

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (delivery.advisor_id !== advisor.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to delivery' },
        { status: 403 }
      )
    }

    // Format response
    const response = {
      id: delivery.id,
      status: delivery.delivery_status,
      whatsappMessageId: delivery.whatsapp_message_id,
      scheduledTime: delivery.scheduled_time,
      sentAt: delivery.sent_at,
      deliveredAt: delivery.delivered_at,
      readAt: delivery.read_at,
      failureReason: delivery.failure_reason,
      content: {
        id: delivery.content_id,
        title: delivery.content?.title,
        category: delivery.content?.category
      }
    }

    return NextResponse.json({
      success: true,
      delivery: response
    })
  } catch (error) {
    console.error('WhatsApp status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check status', details: error.message },
      { status: 500 }
    )
  }
}