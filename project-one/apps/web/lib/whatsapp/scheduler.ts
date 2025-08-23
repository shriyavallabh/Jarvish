import { getWhatsAppClient } from './client'
import { TemplateManager, TEMPLATES } from './templates'
import { ContentService, AdvisorService, ContentDeliveryService } from '@/lib/supabase/services'
import { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']

export interface DeliveryJob {
  id: string
  advisorId: string
  contentId: string
  phoneNumber: string
  scheduledTime: Date
  priority: 'high' | 'normal' | 'low'
  retryCount: number
  maxRetries: number
}

export interface DeliveryResult {
  jobId: string
  status: 'success' | 'failed' | 'retry'
  whatsappMessageId?: string
  error?: string
  timestamp: Date
}

export class WhatsAppScheduler {
  private readonly whatsappClient = getWhatsAppClient()
  private readonly contentService = new ContentService()
  private readonly advisorService = new AdvisorService()
  private readonly deliveryService = new ContentDeliveryService()
  
  // Rate limiting configuration
  private readonly maxConcurrentMessages = 50 // WhatsApp rate limit
  private readonly messageDelayMs = 100 // Delay between messages
  private readonly retryDelayMs = 5000 // Delay for retries
  private readonly maxRetries = 3

  // Queue for managing delivery
  private deliveryQueue: DeliveryJob[] = []
  private activeDeliveries = 0
  private isProcessing = false

  // Schedule daily content for 6 AM IST
  async scheduleDailyContent(): Promise<{
    scheduled: number
    failed: number
    errors: string[]
  }> {
    const results = {
      scheduled: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {
      // Get current time in IST
      const now = new Date()
      const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
      const istTime = new Date(now.getTime() + istOffset)
      
      // Set to 6 AM IST
      const scheduledTime = new Date(istTime)
      scheduledTime.setHours(6, 0, 0, 0)
      
      // If it's already past 6 AM, schedule for tomorrow
      if (istTime.getHours() >= 6) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      // Get all approved content scheduled for delivery
      const content = await this.contentService.getContentForDelivery(
        scheduledTime.toISOString()
      )

      // Create delivery jobs for each advisor
      for (const item of content) {
        try {
          // Create delivery record
          const delivery = await this.deliveryService.createDelivery({
            advisor_id: item.advisor_id,
            content_id: item.id,
            scheduled_time: scheduledTime.toISOString(),
            delivery_status: 'pending'
          })

          // Add to queue with jitter for load distribution
          const jitterMs = Math.random() * 5 * 60 * 1000 // 0-5 minutes jitter
          const deliveryTime = new Date(scheduledTime.getTime() + jitterMs)

          this.addToQueue({
            id: delivery.id,
            advisorId: item.advisor_id,
            contentId: item.id,
            phoneNumber: item.advisors.mobile,
            scheduledTime: deliveryTime,
            priority: this.getPriorityByTier(item.advisors.subscription_tier),
            retryCount: 0,
            maxRetries: this.maxRetries
          })

          results.scheduled++
        } catch (error) {
          console.error(`Failed to schedule for advisor ${item.advisor_id}:`, error)
          results.failed++
          results.errors.push(`Advisor ${item.advisor_id}: ${error.message}`)
        }
      }

      // Start processing queue
      this.processQueue()

      return results
    } catch (error) {
      console.error('Daily content scheduling error:', error)
      throw error
    }
  }

  // Send immediate content
  async sendImmediate(
    advisorId: string,
    contentId: string,
    phoneNumber: string
  ): Promise<DeliveryResult> {
    try {
      // Get content and advisor details
      const advisor = await this.advisorService.getAdvisorByClerkId(advisorId)
      if (!advisor) {
        throw new Error('Advisor not found')
      }

      // Validate phone number
      if (!this.whatsappClient.validateIndianPhoneNumber(phoneNumber)) {
        throw new Error('Invalid Indian phone number')
      }

      // Get content
      const content = await this.getContent(contentId)
      if (!content) {
        throw new Error('Content not found')
      }

      // Create delivery record
      const delivery = await this.deliveryService.createDelivery({
        advisor_id: advisorId,
        content_id: contentId,
        scheduled_time: new Date().toISOString(),
        delivery_status: 'pending'
      })

      // Send message
      const result = await this.sendWhatsAppMessage(
        phoneNumber,
        advisor,
        content,
        delivery.id
      )

      return result
    } catch (error) {
      console.error('Immediate delivery error:', error)
      return {
        jobId: '',
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      }
    }
  }

  // Core message sending logic
  private async sendWhatsAppMessage(
    phoneNumber: string,
    advisor: Tables['advisors']['Row'],
    content: Tables['content']['Row'],
    deliveryId: string
  ): Promise<DeliveryResult> {
    try {
      // Prepare template variables
      const templateVars = {
        advisor_name: advisor.business_name,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        market_summary: this.extractMarketSummary(content.content_english),
        content: content.content_english
      }

      // Select template based on language preference
      const template = content.content_hindi 
        ? TEMPLATES.DAILY_CONTENT_HINDI 
        : TEMPLATES.DAILY_CONTENT

      // Format template
      const formatted = TemplateManager.formatTemplate(template, templateVars)

      // Send via WhatsApp
      const response = await this.whatsappClient.sendTemplate(
        phoneNumber,
        template.name,
        template.language,
        formatted.components
      )

      // Update delivery status
      await this.deliveryService.updateDeliveryStatus(
        deliveryId,
        'sent',
        {
          whatsapp_message_id: response.messages[0].id,
          sent_at: new Date().toISOString()
        }
      )

      return {
        jobId: deliveryId,
        status: 'success',
        whatsappMessageId: response.messages[0].id,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('WhatsApp message send error:', error)
      
      // Update delivery status as failed
      await this.deliveryService.updateDeliveryStatus(
        deliveryId,
        'failed',
        {
          failure_reason: error.message
        }
      )

      return {
        jobId: deliveryId,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      }
    }
  }

  // Queue management
  private addToQueue(job: DeliveryJob) {
    // Insert based on priority and scheduled time
    const insertIndex = this.deliveryQueue.findIndex(
      j => j.priority < job.priority || 
          (j.priority === job.priority && j.scheduledTime > job.scheduledTime)
    )

    if (insertIndex === -1) {
      this.deliveryQueue.push(job)
    } else {
      this.deliveryQueue.splice(insertIndex, 0, job)
    }
  }

  // Process delivery queue
  private async processQueue() {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.deliveryQueue.length > 0) {
      // Check if we can send more messages
      if (this.activeDeliveries >= this.maxConcurrentMessages) {
        await this.delay(this.messageDelayMs)
        continue
      }

      const job = this.deliveryQueue.shift()
      if (!job) continue

      // Check if it's time to send
      if (job.scheduledTime > new Date()) {
        // Put it back and wait
        this.deliveryQueue.unshift(job)
        await this.delay(1000) // Check every second
        continue
      }

      // Process delivery
      this.activeDeliveries++
      this.processDelivery(job).then(() => {
        this.activeDeliveries--
      })

      // Rate limiting delay
      await this.delay(this.messageDelayMs)
    }

    this.isProcessing = false
  }

  // Process individual delivery
  private async processDelivery(job: DeliveryJob) {
    try {
      const advisor = await this.advisorService.getAdvisorByClerkId(job.advisorId)
      const content = await this.getContent(job.contentId)

      if (!advisor || !content) {
        throw new Error('Advisor or content not found')
      }

      const result = await this.sendWhatsAppMessage(
        job.phoneNumber,
        advisor,
        content,
        job.id
      )

      if (result.status === 'failed' && job.retryCount < job.maxRetries) {
        // Retry with exponential backoff
        job.retryCount++
        const retryDelay = this.retryDelayMs * Math.pow(2, job.retryCount)
        job.scheduledTime = new Date(Date.now() + retryDelay)
        this.addToQueue(job)
      }
    } catch (error) {
      console.error(`Delivery failed for job ${job.id}:`, error)
      
      if (job.retryCount < job.maxRetries) {
        job.retryCount++
        const retryDelay = this.retryDelayMs * Math.pow(2, job.retryCount)
        job.scheduledTime = new Date(Date.now() + retryDelay)
        this.addToQueue(job)
      }
    }
  }

  // Helper methods
  private getPriorityByTier(tier: string): 'high' | 'normal' | 'low' {
    switch (tier) {
      case 'pro':
        return 'high'
      case 'standard':
        return 'normal'
      default:
        return 'low'
    }
  }

  private extractMarketSummary(content: string): string {
    // Extract first line or summary from content
    const lines = content.split('\n')
    const summary = lines.find(line => 
      line.toLowerCase().includes('sensex') || 
      line.toLowerCase().includes('nifty') ||
      line.toLowerCase().includes('market')
    )
    return summary || lines[0] || 'Market update available'
  }

  private async getContent(contentId: string): Promise<Tables['content']['Row'] | null> {
    // This would typically fetch from database
    // For now, returning null as placeholder
    return null
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get delivery statistics
  async getDeliveryStats(advisorId?: string): Promise<{
    total: number
    pending: number
    sent: number
    delivered: number
    failed: number
    read: number
    successRate: number
  }> {
    if (advisorId) {
      const metrics = await this.deliveryService.getDeliveryMetrics(advisorId)
      const successRate = metrics.total > 0 
        ? ((metrics.delivered + metrics.read) / metrics.total) * 100 
        : 0

      return {
        ...metrics,
        successRate: Math.round(successRate * 100) / 100
      }
    }

    // Get platform-wide stats
    const analytics = new (await import('@/lib/supabase/services')).AnalyticsService()
    const platformMetrics = await analytics.getPlatformMetrics()
    
    const deliveries = platformMetrics.deliveriesByStatus
    const total = platformMetrics.totalDeliveries
    const successRate = total > 0 
      ? ((deliveries.delivered + deliveries.read) / total) * 100 
      : 0

    return {
      total,
      pending: deliveries.pending,
      sent: deliveries.sent,
      delivered: deliveries.delivered,
      failed: deliveries.failed,
      read: deliveries.read,
      successRate: Math.round(successRate * 100) / 100
    }
  }
}

// Singleton instance
let scheduler: WhatsAppScheduler | null = null

export function getWhatsAppScheduler(): WhatsAppScheduler {
  if (!scheduler) {
    scheduler = new WhatsAppScheduler()
  }
  return scheduler
}