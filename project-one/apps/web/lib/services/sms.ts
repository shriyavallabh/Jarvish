/**
 * SMS Service for sending OTP and notifications
 * This will integrate with SMS providers like Twilio, MSG91, or 2Factor
 * For now, using mock implementation for testing
 */

interface SMSPayload {
  to: string
  message: string
  template?: string
  variables?: Record<string, string>
}

interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
  provider?: string
}

/**
 * Send SMS using configured provider
 * In production, this will use actual SMS gateway
 */
export async function sendSMS(payload: SMSPayload): Promise<SMSResponse> {
  try {
    // Validate mobile number
    if (!isValidIndianMobile(payload.to)) {
      throw new Error('Invalid mobile number format')
    }
    
    // Check message length (Indian SMS limit is 160 characters)
    if (payload.message.length > 160) {
      console.warn('SMS message exceeds 160 characters, will be sent as multiple parts')
    }
    
    // In production, this would call actual SMS API
    // For now, simulate sending
    if (process.env.NODE_ENV === 'test') {
      // Mock implementation for testing
      console.log(`[SMS Mock] Sending to ${payload.to}: ${payload.message}`)
      
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        provider: 'mock',
      }
    }
    
    // Production implementation would go here
    // Example with Twilio:
    /*
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
    
    const message = await client.messages.create({
      body: payload.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: payload.to,
    })
    
    return {
      success: true,
      messageId: message.sid,
      provider: 'twilio',
    }
    */
    
    // Example with MSG91 (popular in India):
    /*
    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flow_id: process.env.MSG91_FLOW_ID,
        sender: process.env.MSG91_SENDER_ID,
        mobiles: payload.to.replace('+', ''),
        message: payload.message,
      }),
    })
    
    const data = await response.json()
    
    return {
      success: data.type === 'success',
      messageId: data.request_id,
      provider: 'msg91',
    }
    */
    
    // Fallback for development
    console.log(`[SMS Dev] Would send to ${payload.to}: ${payload.message}`)
    
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
      provider: 'development',
    }
  } catch (error: any) {
    console.error('SMS sending failed:', error)
    
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Validate Indian mobile number format
 */
function isValidIndianMobile(mobile: string): boolean {
  // Indian mobile numbers:
  // - Start with +91 or 91 (country code)
  // - Followed by 6-9 (first digit of mobile)
  // - Followed by 9 more digits
  const indianMobileRegex = /^(\+91|91)?[6-9]\d{9}$/
  
  // Remove any spaces or hyphens
  const cleaned = mobile.replace(/[\s-]/g, '')
  
  return indianMobileRegex.test(cleaned)
}

/**
 * Get SMS delivery status
 * Used for tracking and analytics
 */
export async function getSMSStatus(messageId: string, provider: string = 'mock'): Promise<{
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  deliveredAt?: Date
  error?: string
}> {
  // In production, this would query the SMS provider's API
  // For now, return mock status
  
  if (process.env.NODE_ENV === 'test' || provider === 'mock') {
    return {
      status: 'delivered',
      deliveredAt: new Date(),
    }
  }
  
  // Production implementation would check actual delivery status
  return {
    status: 'sent',
  }
}

/**
 * Send bulk SMS for notifications
 * Used for scheduled content delivery
 */
export async function sendBulkSMS(
  recipients: string[],
  message: string,
  options?: {
    scheduleTime?: Date
    priority?: 'high' | 'normal'
    trackDelivery?: boolean
  }
): Promise<{
  success: boolean
  sent: number
  failed: number
  messageIds: string[]
}> {
  const results = await Promise.allSettled(
    recipients.map(to => sendSMS({ to, message }))
  )
  
  const messageIds: string[] = []
  let sent = 0
  let failed = 0
  
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++
      if (result.value.messageId) {
        messageIds.push(result.value.messageId)
      }
    } else {
      failed++
    }
  })
  
  return {
    success: failed === 0,
    sent,
    failed,
    messageIds,
  }
}