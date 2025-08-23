import { NextRequest, NextResponse } from 'next/server'
import { ContentDeliveryService } from '@/lib/supabase/services'
import crypto from 'crypto'

// POST /api/webhooks/whatsapp - Handle WhatsApp delivery updates
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Verify webhook signature
    const signature = request.headers.get('x-hub-signature-256')
    if (signature && process.env.WHATSAPP_APP_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
        .update(rawBody)
        .digest('hex')
      
      if (signature !== `sha256=${expectedSignature}`) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Handle different webhook events
    const { entry } = body

    if (!entry || !Array.isArray(entry)) {
      return NextResponse.json({ success: true })
    }

    const deliveryService = new ContentDeliveryService()

    // Process each entry
    for (const item of entry) {
      const { changes } = item

      if (!changes || !Array.isArray(changes)) continue

      for (const change of changes) {
        const { value } = change

        // Handle status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await processStatusUpdate(deliveryService, status)
          }
        }

        // Handle messages (for future two-way communication)
        if (value.messages) {
          for (const message of value.messages) {
            await processIncomingMessage(message)
          }
        }

        // Handle errors
        if (value.errors) {
          for (const error of value.errors) {
            await processError(deliveryService, error)
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Process status updates
async function processStatusUpdate(
  deliveryService: ContentDeliveryService,
  status: any
) {
  try {
    const { 
      id: whatsappMessageId, 
      status: deliveryStatus, 
      timestamp,
      recipient_id,
      errors
    } = status

    // Map WhatsApp status to our delivery status
    let mappedStatus: 'sent' | 'delivered' | 'read' | 'failed'
    let failureReason: string | null = null

    switch (deliveryStatus) {
      case 'sent':
        mappedStatus = 'sent'
        break
      case 'delivered':
        mappedStatus = 'delivered'
        break
      case 'read':
        mappedStatus = 'read'
        break
      case 'failed':
        mappedStatus = 'failed'
        failureReason = errors?.[0]?.title || 'Delivery failed'
        break
      default:
        return // Ignore unknown statuses
    }

    // Find delivery by WhatsApp message ID
    const delivery = await deliveryService.getDeliveryByWhatsAppId(whatsappMessageId)
    
    if (delivery) {
      // Update delivery status
      await deliveryService.updateDeliveryStatus(
        delivery.id,
        mappedStatus,
        failureReason ? { failure_reason: failureReason } : undefined
      )

      console.log('Delivery status updated:', {
        deliveryId: delivery.id,
        whatsappMessageId,
        status: mappedStatus,
        timestamp: new Date(parseInt(timestamp) * 1000)
      })
    } else {
      console.warn('Delivery not found for WhatsApp message:', whatsappMessageId)
    }
  } catch (error) {
    console.error('Error processing status update:', error)
  }
}

// Process incoming messages (for future implementation)
async function processIncomingMessage(message: any) {
  try {
    const { from, id, timestamp, text, type } = message

    console.log('Incoming message:', {
      from,
      messageId: id,
      timestamp: new Date(parseInt(timestamp) * 1000),
      type,
      text: text?.body
    })

    // Handle different message types
    if (type === 'text' && text?.body) {
      const messageText = text.body.toLowerCase()

      // Handle quick replies
      if (messageText === 'help') {
        // Send help message
        console.log('Help requested from:', from)
      } else if (messageText === 'stop' || messageText === 'unsubscribe') {
        // Handle unsubscribe
        console.log('Unsubscribe requested from:', from)
      }
    }

    // TODO: Implement message handling logic
    // - Store messages in database
    // - Trigger automated responses
    // - Notify advisors of client messages
  } catch (error) {
    console.error('Error processing incoming message:', error)
  }
}

// Process errors
async function processError(
  deliveryService: ContentDeliveryService,
  error: any
) {
  try {
    const { code, title, message, error_data } = error

    console.error('WhatsApp error received:', {
      code,
      title,
      message,
      details: error_data?.details
    })

    // Handle specific error codes
    if (code === 131051) {
      // Message expired
      console.log('Message expired, marking as failed')
    } else if (code === 131052) {
      // User not on WhatsApp
      console.log('User not on WhatsApp')
    }

    // TODO: Implement error handling logic
    // - Update delivery records
    // - Trigger retry mechanisms
    // - Alert administrators for critical errors
  } catch (err) {
    console.error('Error processing WhatsApp error:', err)
  }
}

// GET /api/webhooks/whatsapp - Verify webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify the webhook
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}