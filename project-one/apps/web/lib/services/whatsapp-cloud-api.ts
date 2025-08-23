import { z } from 'zod'

// WhatsApp Cloud API Configuration
export interface WhatsAppConfig {
  phoneNumberId: string
  businessAccountId: string
  accessToken: string
  verifyToken: string
  apiVersion: string
  qualityRatingThreshold: number
  maxRetries: number
  retryDelayMs: number
}

// Message Status Types
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

// Quality Rating Types
export type QualityRating = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'

// Template Status Types
export type TemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED'

// WhatsApp Cloud API Response Types
export interface CloudAPIResponse {
  messaging_product: 'whatsapp'
  contacts?: Array<{
    input: string
    wa_id: string
  }>
  messages?: Array<{
    id: string
    message_status?: string
  }>
  error?: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

// Template Component Types
export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  example?: {
    header_text?: string[]
    body_text?: string[][]
    header_handle?: string[]
  }
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phone_number?: string
  }>
}

// Template Definition
export interface WhatsAppTemplate {
  id: string
  name: string
  language: string
  status: TemplateStatus
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
  components: TemplateComponent[]
  quality_score?: {
    score: QualityRating
    date: string
  }
  rejected_reason?: string
  last_updated: string
}

// Message Template Request
export interface TemplateMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'template'
  template: {
    name: string
    language: {
      code: string
    }
    components?: Array<{
      type: 'header' | 'body' | 'button'
      sub_type?: string
      index?: string | number
      parameters?: Array<{
        type: 'text' | 'image' | 'document' | 'video' | 'currency' | 'date_time'
        text?: string
        image?: {
          link?: string
          id?: string
        }
        document?: {
          link?: string
          id?: string
          filename?: string
        }
        video?: {
          link?: string
          id?: string
        }
        currency?: {
          fallback_value: string
          code: string
          amount_1000: number
        }
        date_time?: {
          fallback_value: string
        }
      }>
    }>
  }
}

// Delivery Metrics
export interface DeliveryMetrics {
  sent: number
  delivered: number
  read: number
  failed: number
  total: number
  successRate: number
  avgDeliveryTime: number
  qualityRating: QualityRating
}

// Number Health Status
export interface NumberHealth {
  phoneNumberId: string
  displayNumber: string
  qualityRating: QualityRating
  messagingLimit: {
    current: number
    max: number
  }
  status: 'ACTIVE' | 'FLAGGED' | 'RESTRICTED' | 'DISABLED'
  lastChecked: Date
}

/**
 * WhatsApp Cloud API Client
 * Handles all interactions with Meta's WhatsApp Business Cloud API
 */
export class WhatsAppCloudAPI {
  private config: WhatsAppConfig
  private baseUrl: string
  private numberHealth: Map<string, NumberHealth> = new Map()
  private templateCache: Map<string, WhatsAppTemplate> = new Map()
  private rateLimitState: Map<string, { count: number; resetTime: Date }> = new Map()

  constructor(config?: Partial<WhatsAppConfig>) {
    this.config = {
      phoneNumberId: config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      businessAccountId: config?.businessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      accessToken: config?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '',
      verifyToken: config?.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN || '',
      apiVersion: config?.apiVersion || 'v18.0',
      qualityRatingThreshold: config?.qualityRatingThreshold || 2, // Yellow threshold
      maxRetries: config?.maxRetries || 3,
      retryDelayMs: config?.retryDelayMs || 5000
    }

    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}`
    this.validateConfig()
  }

  private validateConfig() {
    if (!this.config.phoneNumberId || !this.config.accessToken || !this.config.businessAccountId) {
      throw new Error('WhatsApp Cloud API configuration is incomplete')
    }
  }

  /**
   * Send a template message with parameters
   */
  async sendTemplate(
    phoneNumber: string,
    templateName: string,
    languageCode: string = 'en',
    parameters?: Record<string, any>,
    mediaUrl?: string
  ): Promise<CloudAPIResponse> {
    // Format phone number for WhatsApp
    const formattedPhone = this.formatPhoneNumber(phoneNumber)
    
    // Get template from cache or fetch
    let template = this.templateCache.get(`${templateName}_${languageCode}`)
    if (!template) {
      template = await this.getTemplate(templateName, languageCode)
      if (!template) {
        throw new Error(`Template ${templateName} not found or not approved`)
      }
    }

    // Check template status
    if (template.status !== 'APPROVED') {
      throw new Error(`Template ${templateName} is not approved. Status: ${template.status}`)
    }

    // Build components with parameters
    const components = this.buildTemplateComponents(template, parameters, mediaUrl)

    // Create message payload
    const message: TemplateMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    }

    // Send message with retry logic
    return this.sendWithRetry(message)
  }

  /**
   * Send message with exponential backoff retry
   */
  private async sendWithRetry(message: TemplateMessage, attempt = 1): Promise<CloudAPIResponse> {
    try {
      // Check rate limit
      await this.checkRateLimit(this.config.phoneNumberId)

      const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      })

      const data = await response.json() as CloudAPIResponse

      if (!response.ok) {
        // Handle specific error codes
        if (data.error) {
          if (data.error.code === 131056) {
            // Rate limit exceeded
            throw new Error('Rate limit exceeded. Please wait before sending more messages.')
          } else if (data.error.code === 131051) {
            // Message expired
            throw new Error('Message window expired. User needs to initiate conversation.')
          } else if (data.error.code === 131052) {
            // User not on WhatsApp
            throw new Error('Recipient is not on WhatsApp.')
          }
        }

        throw new Error(data.error?.message || 'Failed to send WhatsApp message')
      }

      // Update rate limit tracking
      this.updateRateLimit(this.config.phoneNumberId)

      return data
    } catch (error) {
      console.error(`WhatsApp send attempt ${attempt} failed:`, error)
      
      if (attempt < this.config.maxRetries) {
        // Exponential backoff
        const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1)
        await this.delay(delay)
        return this.sendWithRetry(message, attempt + 1)
      }
      
      throw error
    }
  }

  /**
   * Build template components with parameter substitution
   */
  private buildTemplateComponents(
    template: WhatsAppTemplate,
    parameters?: Record<string, any>,
    mediaUrl?: string
  ): Array<any> {
    const components: Array<any> = []

    // Ensure components array exists
    if (!template.components || !Array.isArray(template.components)) {
      return components
    }

    for (const component of template.components) {
      if (component.type === 'HEADER' && mediaUrl) {
        // Add media header
        components.push({
          type: 'header',
          parameters: [{
            type: 'image',
            image: {
              link: mediaUrl
            }
          }]
        })
      } else if (component.type === 'BODY' && parameters) {
        // Add body with text parameters
        const bodyParams: Array<any> = []
        
        // Extract parameter placeholders from template text
        const placeholders = component.text?.match(/\{\{(\d+)\}\}/g) || []
        
        for (const placeholder of placeholders) {
          const index = parseInt(placeholder.replace(/\{\{|\}\}/g, ''))
          const paramKey = `param${index}`
          bodyParams.push({
            type: 'text',
            text: parameters[paramKey] || ''
          })
        }

        if (bodyParams.length > 0) {
          components.push({
            type: 'body',
            parameters: bodyParams
          })
        }
      }
    }

    return components
  }

  /**
   * Get template details from API
   */
  async getTemplate(name: string, language: string = 'en'): Promise<WhatsAppTemplate | null> {
    // Check cache first
    const cacheKey = `${name}_${language}`
    const cachedTemplate = this.templateCache.get(cacheKey)
    if (cachedTemplate) {
      return cachedTemplate
    }

    try {
      const url = `${this.baseUrl}/${this.config.businessAccountId}/message_templates?name=${name}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch template:', await response.text())
        return null
      }

      const data = await response.json()
      const templates = data.data || []
      
      // Find template with matching language
      const template = templates.find((t: any) => 
        t.name === name && t.language === language
      )

      if (template) {
        const whatsappTemplate: WhatsAppTemplate = {
          id: template.id,
          name: template.name,
          language: template.language,
          status: template.status,
          category: template.category,
          components: template.components || [],
          quality_score: template.quality_score,
          rejected_reason: template.rejected_reason,
          last_updated: template.last_updated || new Date().toISOString()
        }

        // Cache the template
        this.templateCache.set(cacheKey, whatsappTemplate)
        
        return whatsappTemplate
      }

      return null
    } catch (error) {
      console.error('Error fetching template:', error)
      return null
    }
  }

  /**
   * Create a new message template
   */
  async createTemplate(template: {
    name: string
    category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
    language: string
    components: TemplateComponent[]
  }): Promise<{ id: string; status: string }> {
    const url = `${this.baseUrl}/${this.config.businessAccountId}/message_templates`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: template.name,
          category: template.category,
          language: template.language,
          components: template.components
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to create template')
      }

      const data = await response.json()
      return {
        id: data.id,
        status: data.status || 'PENDING'
      }
    } catch (error) {
      console.error('Template creation error:', error)
      throw error
    }
  }

  /**
   * Get phone number quality rating and health
   */
  async getNumberHealth(phoneNumberId?: string): Promise<NumberHealth> {
    const numberId = phoneNumberId || this.config.phoneNumberId
    
    // Check cache first
    const cached = this.numberHealth.get(numberId)
    if (cached && (Date.now() - cached.lastChecked.getTime()) < 3600000) { // 1 hour cache
      return cached
    }

    try {
      const url = `${this.baseUrl}/${numberId}?fields=display_phone_number,quality_rating,messaging_limit,status`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch number health')
      }

      const data = await response.json()
      
      const health: NumberHealth = {
        phoneNumberId: numberId,
        displayNumber: data.display_phone_number,
        qualityRating: this.mapQualityRating(data.quality_rating),
        messagingLimit: {
          current: data.messaging_limit?.current || 0,
          max: data.messaging_limit?.max || 1000
        },
        status: data.status || 'ACTIVE',
        lastChecked: new Date()
      }

      // Cache the result
      this.numberHealth.set(numberId, health)
      
      return health
    } catch (error) {
      console.error('Error fetching number health:', error)
      
      // Return default health status
      return {
        phoneNumberId: numberId,
        displayNumber: 'Unknown',
        qualityRating: 'UNKNOWN',
        messagingLimit: { current: 0, max: 1000 },
        status: 'ACTIVE',
        lastChecked: new Date()
      }
    }
  }

  /**
   * Upload media for use in templates
   */
  async uploadMedia(file: Buffer, mimeType: string): Promise<string> {
    const url = `${this.baseUrl}/${this.config.phoneNumberId}/media`

    try {
      const formData = new FormData()
      formData.append('file', new Blob([file], { type: mimeType }))
      formData.append('messaging_product', 'whatsapp')
      formData.append('type', mimeType.split('/')[0]) // image, video, document

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to upload media')
      }

      const data = await response.json()
      return data.id // Media ID for use in messages
    } catch (error) {
      console.error('Media upload error:', error)
      throw error
    }
  }

  /**
   * Get delivery metrics for analytics
   */
  async getDeliveryMetrics(startDate: Date, endDate: Date): Promise<DeliveryMetrics> {
    // This would typically query WhatsApp Business Management API
    // For now, returning mock metrics
    return {
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      total: 0,
      successRate: 0,
      avgDeliveryTime: 0,
      qualityRating: 'GREEN'
    }
  }

  /**
   * Format phone number to WhatsApp format (with country code)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Add India country code if not present
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned
    }
    
    return cleaned
  }

  /**
   * Validate Indian phone number
   */
  validateIndianPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '')
    
    // Check if it's a valid Indian mobile number
    if (cleaned.length === 10) {
      return /^[6-9]\d{9}$/.test(cleaned)
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return /^91[6-9]\d{9}$/.test(cleaned)
    }
    
    return false
  }

  /**
   * Check and enforce rate limits
   */
  private async checkRateLimit(phoneNumberId: string): Promise<void> {
    const state = this.rateLimitState.get(phoneNumberId)
    
    if (state) {
      // Check if we need to reset the counter
      if (Date.now() > state.resetTime.getTime()) {
        this.rateLimitState.set(phoneNumberId, {
          count: 0,
          resetTime: new Date(Date.now() + 3600000) // 1 hour window
        })
      } else if (state.count >= 80) { // 80 messages per hour safety limit
        const waitTime = state.resetTime.getTime() - Date.now()
        throw new Error(`Rate limit reached. Wait ${Math.ceil(waitTime / 1000)} seconds.`)
      }
    } else {
      // Initialize rate limit tracking
      this.rateLimitState.set(phoneNumberId, {
        count: 0,
        resetTime: new Date(Date.now() + 3600000)
      })
    }
  }

  /**
   * Update rate limit counter
   */
  private updateRateLimit(phoneNumberId: string): void {
    const state = this.rateLimitState.get(phoneNumberId)
    if (state) {
      state.count++
    }
  }

  /**
   * Map quality rating from API
   */
  private mapQualityRating(rating: string | undefined): QualityRating {
    switch (rating?.toUpperCase()) {
      case 'GREEN':
        return 'GREEN'
      case 'YELLOW':
        return 'YELLOW'
      case 'RED':
        return 'RED'
      default:
        return 'UNKNOWN'
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
let whatsappCloudAPI: WhatsAppCloudAPI | null = null

export function getWhatsAppCloudAPI(config?: Partial<WhatsAppConfig>): WhatsAppCloudAPI {
  if (!whatsappCloudAPI) {
    whatsappCloudAPI = new WhatsAppCloudAPI(config)
  }
  return whatsappCloudAPI
}