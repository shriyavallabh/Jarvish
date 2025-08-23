import { z } from 'zod'

// WhatsApp Cloud API Types
export interface WhatsAppMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'text' | 'template' | 'image' | 'document'
  text?: {
    body: string
    preview_url?: boolean
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: Array<{
      type: 'header' | 'body' | 'button'
      parameters?: Array<{
        type: 'text' | 'image' | 'document' | 'video'
        text?: string
        image?: {
          link: string
        }
        document?: {
          link: string
          filename: string
        }
      }>
      sub_type?: string
      index?: string | number
    }>
  }
  image?: {
    link: string
    caption?: string
  }
}

export interface WhatsAppResponse {
  messaging_product: 'whatsapp'
  contacts: Array<{
    input: string
    wa_id: string
  }>
  messages: Array<{
    id: string
  }>
}

export interface WhatsAppStatus {
  messaging_product: 'whatsapp'
  statuses: Array<{
    id: string
    status: 'sent' | 'delivered' | 'read' | 'failed'
    timestamp: string
    recipient_id: string
    errors?: Array<{
      code: number
      title: string
      message: string
      error_data?: {
        details: string
      }
    }>
  }>
}

export interface WhatsAppTemplate {
  id: string
  name: string
  language: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
    text?: string
    example?: {
      header_text?: string[]
      body_text?: string[][]
      header_handle?: string[]
    }
  }>
  rejected_reason?: string
}

// WhatsApp Cloud API Client
export class WhatsAppClient {
  private readonly baseUrl: string
  private readonly phoneNumberId: string
  private readonly accessToken: string
  private readonly businessAccountId: string

  constructor() {
    // Use Meta's Graph API for WhatsApp Cloud API
    this.baseUrl = 'https://graph.facebook.com/v18.0'
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''

    if (!this.phoneNumberId || !this.accessToken || !this.businessAccountId) {
      throw new Error('WhatsApp configuration missing')
    }
  }

  // Send a template message
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: WhatsAppMessage['template']['components']
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    }

    return this.sendMessage(message)
  }

  // Send a text message (for customer service windows)
  async sendText(to: string, body: string, previewUrl: boolean = false): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'text',
      text: {
        body,
        preview_url: previewUrl
      }
    }

    return this.sendMessage(message)
  }

  // Send an image message
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'image',
      image: {
        link: imageUrl,
        caption
      }
    }

    return this.sendMessage(message)
  }

  // Core message sending logic
  private async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('WhatsApp API Error:', error)
        throw new Error(error.error?.message || 'Failed to send WhatsApp message')
      }

      const data = await response.json()
      return data as WhatsAppResponse
    } catch (error) {
      console.error('WhatsApp send error:', error)
      throw error
    }
  }

  // Get template details
  async getTemplate(templateName: string): Promise<WhatsAppTemplate | null> {
    const url = `${this.baseUrl}/${this.businessAccountId}/message_templates?name=${templateName}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('WhatsApp API Error:', error)
        return null
      }

      const data = await response.json()
      return data.data?.[0] || null
    } catch (error) {
      console.error('WhatsApp template fetch error:', error)
      return null
    }
  }

  // List all templates
  async listTemplates(limit: number = 100): Promise<WhatsAppTemplate[]> {
    const url = `${this.baseUrl}/${this.businessAccountId}/message_templates?limit=${limit}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('WhatsApp API Error:', error)
        return []
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('WhatsApp templates fetch error:', error)
      return []
    }
  }

  // Create a new template
  async createTemplate(template: {
    name: string
    category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
    language: string
    components: Array<{
      type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
      format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
      text?: string
      example?: {
        header_text?: string[]
        body_text?: string[][]
      }
    }>
  }): Promise<{ id: string; status: string }> {
    const url = `${this.baseUrl}/${this.businessAccountId}/message_templates`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('WhatsApp API Error:', error)
        throw new Error(error.error?.message || 'Failed to create template')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('WhatsApp template creation error:', error)
      throw error
    }
  }

  // Upload media for templates
  async uploadMedia(file: Buffer, mimeType: string): Promise<string> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/media`

    try {
      const formData = new FormData()
      formData.append('file', new Blob([file], { type: mimeType }))
      formData.append('messaging_product', 'whatsapp')

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('WhatsApp API Error:', error)
        throw new Error(error.error?.message || 'Failed to upload media')
      }

      const data = await response.json()
      return data.id
    } catch (error) {
      console.error('WhatsApp media upload error:', error)
      throw error
    }
  }

  // Format phone number to WhatsApp format
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Add country code if not present (assuming India)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned
    }
    
    return cleaned
  }

  // Validate Indian phone number
  validateIndianPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '')
    
    // Check if it's a valid Indian mobile number
    // Should be 10 digits or 12 digits with country code (91)
    if (cleaned.length === 10) {
      return /^[6-9]\d{9}$/.test(cleaned)
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return /^91[6-9]\d{9}$/.test(cleaned)
    }
    
    return false
  }
}

// Singleton instance
let whatsappClient: WhatsAppClient | null = null

export function getWhatsAppClient(): WhatsAppClient {
  if (!whatsappClient) {
    whatsappClient = new WhatsAppClient()
  }
  return whatsappClient
}