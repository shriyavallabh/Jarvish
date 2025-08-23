import { Worker, Queue } from 'bullmq'
import IORedis from 'ioredis'
import { getWhatsAppClient } from '@/lib/whatsapp/client'
import { TemplateManager, TEMPLATES } from '@/lib/whatsapp/templates'
import { ContentDeliveryService } from '@/lib/supabase/services'
import { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']

// Redis connection
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

export interface WhatsAppMessage {
  to: string
  template: {
    name: string
    language: string
    components: any[]
  }
  metadata?: {
    advisorId: string
    contentId: string
    deliveryId: string
    priority: 'high' | 'normal' | 'low'
  }
}

export interface WhatsAppDeliveryResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: Date
  attempts: number
}

export class WhatsAppQueue {
  private worker: Worker<WhatsAppMessage>
  private queue: Queue<WhatsAppMessage>
  private readonly whatsappClient = getWhatsAppClient()
  private readonly deliveryService = new ContentDeliveryService()
  
  // Rate limiting configuration (WhatsApp Business API limits)
  private readonly RATE_LIMITS = {
    messagesPerSecond: 80, // WhatsApp allows 80 messages/second
    messagesPerDay: 100000, // 100k messages per day per number
    templateMessagesPerSecond: 1000, // Template messages have higher limit
  }
  
  // Circuit breaker for API failures
  private circuitBreaker = {
    failures: 0,
    successes: 0,
    lastFailure: 0,
    isOpen: false,
    threshold: 5, // Open after 5 consecutive failures
    timeout: 60000, // 1 minute timeout
  }
  
  // Daily quota tracking
  private dailyQuota = {
    sent: 0,
    limit: this.RATE_LIMITS.messagesPerDay,
    resetTime: this.getNextResetTime(),
  }

  constructor() {
    // Initialize queue
    this.queue = new Queue('whatsapp-delivery', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep for 24 hours
          count: 1000, // Keep last 1000
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed for 7 days
        },
      },
    })

    // Initialize worker
    this.worker = new Worker<WhatsAppMessage>(
      'whatsapp-delivery',
      async (job) => this.processMessage(job.data, job.attemptsMade),
      {
        connection: redisConnection,
        concurrency: 50, // Process 50 messages concurrently
        limiter: {
          max: this.RATE_LIMITS.messagesPerSecond,
          duration: 1000, // Per second
        },
      }
    )

    // Set up event handlers
    this.setupEventHandlers()
    
    // Initialize daily quota from Redis
    this.loadDailyQuota()
    
    // Reset quota at midnight
    this.scheduleQuotaReset()
  }

  /**
   * Add message to queue
   */
  async sendMessage(
    message: WhatsAppMessage,
    options?: {
      delay?: number
      priority?: number
      jobId?: string
    }
  ): Promise<string> {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      throw new Error('WhatsApp API circuit breaker is open - service temporarily unavailable')
    }

    // Check daily quota
    if (this.dailyQuota.sent >= this.dailyQuota.limit) {
      throw new Error('Daily WhatsApp message quota exceeded')
    }

    // Add to queue
    const job = await this.queue.add(
      options?.jobId || `whatsapp-${Date.now()}`,
      message,
      {
        delay: options?.delay,
        priority: options?.priority || this.getPriorityValue(message.metadata?.priority),
      }
    )

    return job.id
  }

  /**
   * Bulk send messages
   */
  async bulkSend(
    messages: WhatsAppMessage[],
    options?: {
      delay?: number
      priority?: number
    }
  ): Promise<string[]> {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      throw new Error('WhatsApp API circuit breaker is open')
    }

    // Check if bulk send would exceed quota
    if (this.dailyQuota.sent + messages.length > this.dailyQuota.limit) {
      const available = this.dailyQuota.limit - this.dailyQuota.sent
      throw new Error(`Bulk send would exceed daily quota. Only ${available} messages available.`)
    }

    // Add all messages to queue
    const jobs = await this.queue.addBulk(
      messages.map((message, index) => ({
        name: `bulk-${Date.now()}-${index}`,
        data: message,
        opts: {
          delay: options?.delay,
          priority: options?.priority || this.getPriorityValue(message.metadata?.priority),
        },
      }))
    )

    return jobs.map(job => job.id)
  }

  /**
   * Process individual message
   */
  private async processMessage(
    message: WhatsAppMessage,
    attemptNumber: number
  ): Promise<WhatsAppDeliveryResult> {
    const startTime = Date.now()
    
    try {
      // Validate phone number
      if (!this.whatsappClient.validateIndianPhoneNumber(message.to)) {
        throw new Error(`Invalid phone number: ${message.to}`)
      }

      // Send via WhatsApp API
      const response = await this.whatsappClient.sendTemplate(
        message.to,
        message.template.name,
        message.template.language,
        message.template.components
      )

      // Update delivery status if metadata provided
      if (message.metadata?.deliveryId) {
        await this.deliveryService.updateDeliveryStatus(
          message.metadata.deliveryId,
          'sent',
          {
            whatsapp_message_id: response.messages[0].id,
            sent_at: new Date().toISOString(),
            delivery_time_ms: Date.now() - startTime,
          }
        )
      }

      // Update circuit breaker
      this.updateCircuitBreaker(true)
      
      // Update daily quota
      this.incrementDailyQuota()

      return {
        success: true,
        messageId: response.messages[0].id,
        timestamp: new Date(),
        attempts: attemptNumber + 1,
      }
    } catch (error) {
      console.error('WhatsApp delivery error:', error)
      
      // Update circuit breaker
      this.updateCircuitBreaker(false)
      
      // Update delivery status if this was the last attempt
      if (message.metadata?.deliveryId && attemptNumber >= 2) {
        await this.deliveryService.updateDeliveryStatus(
          message.metadata.deliveryId,
          'failed',
          {
            failure_reason: error.message,
            failed_at: new Date().toISOString(),
          }
        )
      }

      // Check for rate limit errors
      if (this.isRateLimitError(error)) {
        // Add extra delay before retry
        await this.delay(10000) // 10 second delay
      }

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
        attempts: attemptNumber + 1,
      }
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(): boolean {
    if (!this.circuitBreaker.isOpen) {
      return false
    }

    // Check if timeout has passed
    if (Date.now() - this.circuitBreaker.lastFailure > this.circuitBreaker.timeout) {
      console.log('Circuit breaker timeout passed, attempting to close')
      this.circuitBreaker.isOpen = false
      this.circuitBreaker.failures = 0
      this.circuitBreaker.successes = 0
      return false
    }

    return true
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(success: boolean): void {
    if (success) {
      this.circuitBreaker.successes++
      this.circuitBreaker.failures = 0
      
      // Close circuit if we have enough successes
      if (this.circuitBreaker.isOpen && this.circuitBreaker.successes >= 3) {
        console.log('Circuit breaker closed after successful messages')
        this.circuitBreaker.isOpen = false
      }
    } else {
      this.circuitBreaker.failures++
      this.circuitBreaker.lastFailure = Date.now()
      
      // Open circuit if threshold reached
      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        console.error('Circuit breaker opened due to consecutive failures')
        this.circuitBreaker.isOpen = true
        this.circuitBreaker.successes = 0
      }
    }
  }

  /**
   * Check if error is rate limit related
   */
  private isRateLimitError(error: any): boolean {
    const message = error.message?.toLowerCase() || ''
    return message.includes('rate') || 
           message.includes('limit') || 
           message.includes('429') ||
           message.includes('too many')
  }

  /**
   * Get priority value
   */
  private getPriorityValue(priority?: 'high' | 'normal' | 'low'): number {
    switch (priority) {
      case 'high':
        return 10
      case 'normal':
        return 5
      case 'low':
        return 1
      default:
        return 5
    }
  }

  /**
   * Load daily quota from Redis
   */
  private async loadDailyQuota(): Promise<void> {
    const quotaKey = `whatsapp:quota:${new Date().toISOString().split('T')[0]}`
    const sent = await redisConnection.get(quotaKey)
    
    if (sent) {
      this.dailyQuota.sent = parseInt(sent)
    }
  }

  /**
   * Increment daily quota
   */
  private async incrementDailyQuota(): Promise<void> {
    this.dailyQuota.sent++
    
    const quotaKey = `whatsapp:quota:${new Date().toISOString().split('T')[0]}`
    await redisConnection.incr(quotaKey)
    await redisConnection.expire(quotaKey, 86400) // Expire after 24 hours
  }

  /**
   * Get next quota reset time (midnight)
   */
  private getNextResetTime(): Date {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  }

  /**
   * Schedule daily quota reset
   */
  private scheduleQuotaReset(): void {
    const now = new Date()
    const resetTime = this.getNextResetTime()
    const delay = resetTime.getTime() - now.getTime()
    
    setTimeout(() => {
      this.dailyQuota.sent = 0
      this.dailyQuota.resetTime = this.getNextResetTime()
      console.log('Daily WhatsApp quota reset')
      
      // Schedule next reset
      this.scheduleQuotaReset()
    }, delay)
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`✅ WhatsApp message ${job.id} delivered successfully`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`❌ WhatsApp message ${job?.id} failed:`, err.message)
    })

    this.worker.on('stalled', (jobId) => {
      console.warn(`⚠️ WhatsApp message ${jobId} stalled`)
    })

    this.queue.on('error', (error) => {
      console.error('WhatsApp queue error:', error)
    })
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    quotaUsed: number
    quotaLimit: number
    circuitBreakerOpen: boolean
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      quotaUsed: this.dailyQuota.sent,
      quotaLimit: this.dailyQuota.limit,
      circuitBreakerOpen: this.circuitBreaker.isOpen,
    }
  }

  /**
   * Get delivery status by message ID
   */
  async getDeliveryStatus(messageId: string): Promise<any> {
    try {
      // Get status from WhatsApp API
      const status = await this.whatsappClient.getMessageStatus(messageId)
      return status
    } catch (error) {
      console.error('Error getting delivery status:', error)
      return null
    }
  }

  /**
   * Pause queue processing
   */
  async pause(): Promise<void> {
    await this.queue.pause()
    await this.worker.pause()
    console.log('WhatsApp queue paused')
  }

  /**
   * Resume queue processing
   */
  async resume(): Promise<void> {
    await this.queue.resume()
    await this.worker.resume()
    console.log('WhatsApp queue resumed')
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down WhatsApp queue...')
    
    await this.worker.close()
    await this.queue.close()
    await redisConnection.quit()
    
    console.log('WhatsApp queue shut down successfully')
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
let whatsappQueue: WhatsAppQueue | null = null

export function getWhatsAppQueue(): WhatsAppQueue {
  if (!whatsappQueue) {
    whatsappQueue = new WhatsAppQueue()
  }
  return whatsappQueue
}