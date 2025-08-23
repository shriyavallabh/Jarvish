import { Queue, Worker, QueueScheduler, Job } from 'bullmq'
import IORedis from 'ioredis'
import { ContentService, AdvisorService, ContentDeliveryService } from '@/lib/supabase/services'
import { getWhatsAppClient } from '@/lib/whatsapp/client'
import { TemplateManager, TEMPLATES } from '@/lib/whatsapp/templates'
import { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']

// Redis connection configuration
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

// Job data interfaces
export interface ContentDeliveryJob {
  advisorId: string
  contentId: string
  phoneNumber: string
  advisorName: string
  businessName: string
  tier: 'pro' | 'standard' | 'free'
  language: 'en' | 'hi'
  retryCount?: number
  isFallback?: boolean
  fallbackReason?: string
}

export interface ScheduleOptions {
  scheduledTime?: Date
  priority?: number
  attempts?: number
  backoff?: {
    type: 'exponential' | 'fixed'
    delay: number
  }
}

export class ContentScheduler {
  private queue: Queue<ContentDeliveryJob>
  private scheduler: QueueScheduler
  private worker: Worker<ContentDeliveryJob>
  private readonly contentService = new ContentService()
  private readonly advisorService = new AdvisorService()
  private readonly deliveryService = new ContentDeliveryService()
  private readonly whatsappClient = getWhatsAppClient()

  // SLA Configuration
  private readonly SLA_TARGET_MS = 5 * 60 * 1000 // 5 minutes
  private readonly SLA_WARNING_THRESHOLD = 0.97 // Alert at 97%
  private readonly MAX_CONCURRENT_DELIVERIES = 100
  private readonly DELIVERY_BATCH_SIZE = 50
  private readonly RATE_LIMIT_PER_SECOND = 20

  constructor() {
    // Initialize BullMQ queue
    this.queue = new Queue('content-delivery', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    })

    // Initialize queue scheduler for delayed/repeated jobs
    this.scheduler = new QueueScheduler('content-delivery', {
      connection: redisConnection,
    })

    // Initialize worker
    this.worker = new Worker<ContentDeliveryJob>(
      'content-delivery',
      async (job) => this.processDelivery(job),
      {
        connection: redisConnection,
        concurrency: this.MAX_CONCURRENT_DELIVERIES,
        limiter: {
          max: this.RATE_LIMIT_PER_SECOND,
          duration: 1000, // 1 second
        },
      }
    )

    // Set up event handlers
    this.setupEventHandlers()
  }

  /**
   * Schedule daily content delivery for 06:00 IST
   * Implements jitter for load distribution between 05:59:30 and 06:04:30
   */
  async scheduleDailyDelivery(): Promise<{
    scheduled: number
    failed: number
    errors: string[]
  }> {
    const results = {
      scheduled: 0,
      failed: 0,
      errors: [] as string[],
    }

    try {
      // Calculate next 6 AM IST
      const now = new Date()
      const istOffset = 5.5 * 60 * 60 * 1000
      const istTime = new Date(now.getTime() + istOffset)
      
      const scheduledTime = new Date(istTime)
      scheduledTime.setHours(6, 0, 0, 0)
      
      // If past 6 AM, schedule for tomorrow
      if (istTime.getHours() >= 6) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      // Get all active advisors with approved content
      const content = await this.contentService.getContentForDelivery(
        scheduledTime.toISOString()
      )

      // Group by priority tier for batch processing
      const tierGroups = {
        pro: [] as typeof content,
        standard: [] as typeof content,
        free: [] as typeof content,
      }

      content.forEach(item => {
        const tier = item.advisors?.subscription_tier || 'free'
        tierGroups[tier].push(item)
      })

      // Schedule Pro tier first (05:59:30 - 06:00:30)
      for (const item of tierGroups.pro) {
        const jitter = Math.random() * 60 * 1000 // 0-60 seconds
        const deliveryTime = new Date(scheduledTime.getTime() - 30000 + jitter)
        
        await this.scheduleDelivery(item, deliveryTime, 10) // Priority 10
        results.scheduled++
      }

      // Schedule Standard tier (06:00:00 - 06:02:00)
      for (const item of tierGroups.standard) {
        const jitter = Math.random() * 120 * 1000 // 0-120 seconds
        const deliveryTime = new Date(scheduledTime.getTime() + jitter)
        
        await this.scheduleDelivery(item, deliveryTime, 5) // Priority 5
        results.scheduled++
      }

      // Schedule Free tier (06:02:00 - 06:04:30)
      for (const item of tierGroups.free) {
        const jitter = 120000 + Math.random() * 150 * 1000 // 120-270 seconds
        const deliveryTime = new Date(scheduledTime.getTime() + jitter)
        
        await this.scheduleDelivery(item, deliveryTime, 1) // Priority 1
        results.scheduled++
      }

      console.log(`Scheduled ${results.scheduled} deliveries for ${scheduledTime.toISOString()}`)
      
      return results
    } catch (error) {
      console.error('Daily scheduling error:', error)
      results.errors.push(error.message)
      return results
    }
  }

  /**
   * Schedule a single content delivery
   */
  private async scheduleDelivery(
    content: any,
    scheduledTime: Date,
    priority: number
  ): Promise<void> {
    const jobData: ContentDeliveryJob = {
      advisorId: content.advisor_id,
      contentId: content.id,
      phoneNumber: content.advisors.mobile,
      advisorName: content.advisors.advisor_name,
      businessName: content.advisors.business_name,
      tier: content.advisors.subscription_tier || 'free',
      language: content.advisors.language_preference || 'en',
      retryCount: 0,
      isFallback: false,
    }

    await this.queue.add(
      `delivery-${content.advisor_id}-${content.id}`,
      jobData,
      {
        delay: scheduledTime.getTime() - Date.now(),
        priority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    )

    // Create delivery record in database
    await this.deliveryService.createDelivery({
      advisor_id: content.advisor_id,
      content_id: content.id,
      scheduled_time: scheduledTime.toISOString(),
      delivery_status: 'pending',
    })
  }

  /**
   * Process individual delivery job
   */
  private async processDelivery(job: Job<ContentDeliveryJob>): Promise<void> {
    const startTime = Date.now()
    const { data } = job

    try {
      // Validate phone number
      if (!this.whatsappClient.validateIndianPhoneNumber(data.phoneNumber)) {
        throw new Error(`Invalid phone number: ${data.phoneNumber}`)
      }

      // Get content details
      const content = await this.getContent(data.contentId)
      if (!content) {
        throw new Error(`Content not found: ${data.contentId}`)
      }

      // Prepare template variables
      const templateVars = {
        advisor_name: data.advisorName,
        business_name: data.businessName,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        content: data.language === 'hi' ? content.content_hindi : content.content_english,
        market_summary: this.extractMarketSummary(content.content_english),
      }

      // Select template based on language
      const template = data.language === 'hi' 
        ? TEMPLATES.DAILY_CONTENT_HINDI 
        : TEMPLATES.DAILY_CONTENT

      // Format and send message
      const formatted = TemplateManager.formatTemplate(template, templateVars)
      const response = await this.whatsappClient.sendTemplate(
        data.phoneNumber,
        template.name,
        template.language,
        formatted.components
      )

      // Update delivery status
      await this.deliveryService.updateDeliveryStatus(
        job.id,
        'sent',
        {
          whatsapp_message_id: response.messages[0].id,
          sent_at: new Date().toISOString(),
          delivery_time_ms: Date.now() - startTime,
        }
      )

      // Track SLA metrics
      await this.trackSLAMetrics(job.id, startTime, true)

      // Update progress
      await job.updateProgress(100)

    } catch (error) {
      console.error(`Delivery failed for job ${job.id}:`, error)
      
      // Track SLA violation if this was the last attempt
      if (job.attemptsMade >= job.opts.attempts) {
        await this.trackSLAMetrics(job.id, startTime, false)
        
        // Update delivery status as failed
        await this.deliveryService.updateDeliveryStatus(
          job.id,
          'failed',
          {
            failure_reason: error.message,
            failed_at: new Date().toISOString(),
          }
        )
      }

      throw error // Re-throw to trigger retry
    }
  }

  /**
   * Track SLA metrics for monitoring
   */
  private async trackSLAMetrics(
    jobId: string,
    startTime: number,
    success: boolean
  ): Promise<void> {
    const deliveryTime = Date.now() - startTime
    const withinSLA = deliveryTime <= this.SLA_TARGET_MS

    // Store metrics in Redis for real-time monitoring
    const metricsKey = `sla:metrics:${new Date().toISOString().split('T')[0]}`
    const metrics = {
      jobId,
      deliveryTime,
      withinSLA,
      success,
      timestamp: new Date().toISOString(),
    }

    await redisConnection.rpush(metricsKey, JSON.stringify(metrics))
    await redisConnection.expire(metricsKey, 7 * 24 * 3600) // Keep for 7 days

    // Calculate current SLA percentage
    const todayMetrics = await redisConnection.lrange(metricsKey, 0, -1)
    const parsed = todayMetrics.map(m => JSON.parse(m))
    const successfulWithinSLA = parsed.filter(m => m.success && m.withinSLA).length
    const total = parsed.length
    const slaPercentage = total > 0 ? (successfulWithinSLA / total) : 1

    // Alert if below threshold
    if (slaPercentage < this.SLA_WARNING_THRESHOLD && total > 100) {
      await this.sendSLAAlert(slaPercentage, total)
    }
  }

  /**
   * Send SLA alert to administrators
   */
  private async sendSLAAlert(slaPercentage: number, totalDeliveries: number): Promise<void> {
    console.error(`⚠️ SLA ALERT: Current SLA ${(slaPercentage * 100).toFixed(2)}% (Target: 99%)`)
    console.error(`Total deliveries today: ${totalDeliveries}`)
    
    // Here you would typically send alerts via email, Slack, SMS, etc.
    // For now, we'll store it in Redis for the monitoring dashboard
    const alertKey = 'sla:alerts:active'
    const alert = {
      timestamp: new Date().toISOString(),
      slaPercentage,
      totalDeliveries,
      severity: slaPercentage < 0.95 ? 'critical' : 'warning',
    }
    
    await redisConnection.set(alertKey, JSON.stringify(alert), 'EX', 3600) // Expire in 1 hour
  }

  /**
   * Get content from database
   */
  private async getContent(contentId: string): Promise<Tables['content']['Row'] | null> {
    const { data, error } = await this.contentService.supabase
      .from('content')
      .select('*')
      .eq('id', contentId)
      .single()

    if (error) {
      console.error('Error fetching content:', error)
      return null
    }

    return data
  }

  /**
   * Extract market summary from content
   */
  private extractMarketSummary(content: string): string {
    const lines = content.split('\n')
    const summary = lines.find(line => 
      line.toLowerCase().includes('sensex') || 
      line.toLowerCase().includes('nifty') ||
      line.toLowerCase().includes('market')
    )
    return summary || lines[0] || 'Market update available'
  }

  /**
   * Set up event handlers for monitoring
   */
  private setupEventHandlers(): void {
    // Worker events
    this.worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed:`, err.message)
    })

    this.worker.on('stalled', (jobId) => {
      console.warn(`⚠️ Job ${jobId} stalled and will be retried`)
    })

    // Queue events
    this.queue.on('waiting', (jobId) => {
      console.log(`⏳ Job ${jobId} is waiting`)
    })

    this.queue.on('active', (job) => {
      console.log(`🚀 Job ${job.id} is active`)
    })

    this.queue.on('error', (error) => {
      console.error('Queue error:', error)
    })
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down content scheduler...')
    
    await this.worker.close()
    await this.scheduler.close()
    await this.queue.close()
    await redisConnection.quit()
    
    console.log('Content scheduler shut down successfully')
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    paused: boolean
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ])

    const isPaused = await this.queue.isPaused()

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: isPaused,
    }
  }
}

// Singleton instance
let scheduler: ContentScheduler | null = null

export function getContentScheduler(): ContentScheduler {
  if (!scheduler) {
    scheduler = new ContentScheduler()
  }
  return scheduler
}