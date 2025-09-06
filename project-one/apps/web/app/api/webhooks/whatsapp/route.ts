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

// Process incoming messages (with consent handling)
async function processIncomingMessage(message: any) {
  try {
    const { from, id, timestamp, text, type, interactive } = message

    console.log('Incoming message:', {
      from,
      messageId: id,
      timestamp: new Date(parseInt(timestamp) * 1000),
      type,
      text: text?.body,
      interactive: interactive
    })

    // Import consent manager
    const { ConsentManager } = await import('@/lib/services/consent-manager')
    const consentManager = new ConsentManager()

    // Handle button replies (consent buttons)
    if (type === 'interactive' && interactive?.type === 'button_reply') {
      const buttonText = interactive.button_reply.title
      
      if (buttonText === 'YES' || buttonText === 'NO') {
        // Record consent from button click
        await consentManager.recordWhatsAppConsent(from, buttonText)
        console.log(`Consent recorded: ${from} clicked ${buttonText}`)
        
        // Send confirmation if opted in
        if (buttonText === 'YES') {
          // Import WhatsApp service for sending confirmation
          const { WhatsAppService } = await import('@/lib/services/whatsapp-service')
          const whatsappService = new WhatsAppService()
          await whatsappService.sendWelcomeMessage({
            phone: from,
            name: 'Advisor',
            plan: 'Standard',
            deliveryTime: '06:00'
          })
        }
      }
    }

    // Handle text messages
    if (type === 'text' && text?.body) {
      const messageText = text.body.toLowerCase().trim()

      // Handle consent messages
      if (messageText === 'yes' || messageText === 'start' || messageText === 'subscribe') {
        await consentManager.recordWhatsAppConsent(from, 'YES')
        console.log(`Consent recorded: ${from} replied YES`)
      } else if (messageText === 'stop' || messageText === 'unsubscribe' || messageText === 'no') {
        await consentManager.handleOptOut(from, 'whatsapp_stop')
        console.log(`Opt-out recorded: ${from} replied STOP`)
      } else if (messageText === 'help') {
        // Send help message
        console.log('Help requested from:', from)
      }
    }

    // Store message in database for audit
    // TODO: Implement message storage if needed
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