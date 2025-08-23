import { Queue, Worker, Job, QueueScheduler, QueueEvents } from 'bullmq'
import Redis from 'ioredis'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { addMilliseconds, differenceInMilliseconds } from 'date-fns'
import { WhatsAppCloudAPI } from './whatsapp-cloud-api'
import { TemplateManager } from './template-manager'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

// Job data types
export interface DeliveryJob {
  advisorId: string
  contentId: string
  phoneNumber: string
  templateName?: string
  language: string
  parameters: Record<string, string>
  mediaUrl?: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  scheduledFor: string // ISO string
  retryCount: number
  maxRetries: number
  tier: 'pro' | 'standard' | 'free'
}

export interface DeliveryResult {
  jobId: string
  advisorId: string
  contentId: string
  status: 'sent' | 'delivered' | 'failed' | 'retry'
  whatsappMessageId?: string
  error?: string
  attempts: number
  deliveredAt?: Date
  processingTime: number
}

// SLA monitoring
export interface SLAMetrics {
  totalScheduled: number
  totalDelivered: number
  totalFailed: number
  deliveryRate: number
  avgDeliveryTime: number
  peakConcurrency: number
  slaStatus: 'PASS' | 'FAIL' | 'AT_RISK'
  violations: Array<{
    time: Date
    metric: string
    value: number
    threshold: number
  }>
}

// Configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3
}

const SCHEDULER_CONFIG = {
  IST_TIMEZONE: 'Asia/Kolkata',
  DELIVERY_HOUR: 6, // 6 AM IST
  DELIVERY_MINUTE: 0,
  JITTER_WINDOW_MINUTES: 5, // 5:59:30 to 6:04:30
  MAX_CONCURRENT_JOBS: 50,
  BATCH_SIZE: 20,
  RETRY_DELAYS: [5000, 30000, 60000], // 5s, 30s, 1m
  SLA_THRESHOLD: 0.99, // 99% delivery SLA
  CRITICAL_FAILURE_THRESHOLD: 0.02 // 2% failure rate triggers alert
}

/**
 * WhatsApp Delivery Scheduler
 * Manages reliable 06:00 IST content delivery for 2000+ advisors
 */
export class DeliveryScheduler {
  private redis: Redis
  private deliveryQueue: Queue<DeliveryJob>
  private worker: Worker<DeliveryJob, DeliveryResult>
  private scheduler: QueueScheduler
  private events: QueueEvents
  private whatsappAPI: WhatsAppCloudAPI
  private templateManager: TemplateManager
  private supabase: ReturnType<typeof createClient<Database>>
  
  // Metrics tracking
  private currentMetrics: SLAMetrics = {
    totalScheduled: 0,
    totalDelivered: 0,
    totalFailed: 0,
    deliveryRate: 0,
    avgDeliveryTime: 0,
    peakConcurrency: 0,
    slaStatus: 'PASS',
    violations: []
  }

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis(REDIS_CONFIG)
    
    // Initialize BullMQ queue
    this.deliveryQueue = new Queue<DeliveryJob>('whatsapp-delivery', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    })

    // Initialize queue scheduler for delayed jobs
    this.scheduler = new QueueScheduler('whatsapp-delivery', {
      connection: this.redis
    })

    // Initialize queue events for monitoring
    this.events = new QueueEvents('whatsapp-delivery', {
      connection: this.redis
    })

    // Initialize services
    this.whatsappAPI = new WhatsAppCloudAPI()
    this.templateManager = new TemplateManager()
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Initialize worker
    this.worker = this.createWorker()
    
    // Setup event listeners
    this.setupEventListeners()
  }

  /**
   * Schedule daily content for 06:00 IST delivery
   */
  async scheduleDailyDelivery(date?: Date): Promise<{
    scheduled: number
    failed: number
    errors: string[]
    estimatedCompletion: Date
  }> {
    const results = {
      scheduled: 0,
      failed: 0,
      errors: [] as string[],
      estimatedCompletion: new Date()
    }

    try {
      // Calculate target time (6 AM IST)
      const targetDate = date || new Date()
      const istTime = toZonedTime(targetDate, SCHEDULER_CONFIG.IST_TIMEZONE)
      istTime.setHours(SCHEDULER_CONFIG.DELIVERY_HOUR, SCHEDULER_CONFIG.DELIVERY_MINUTE, 0, 0)
      
      // If it's already past 6 AM, schedule for tomorrow
      if (targetDate > istTime) {
        istTime.setDate(istTime.getDate() + 1)
      }

      // Fetch all approved content for delivery
      const { data: contentItems, error } = await this.supabase
        .from('content')
        .select(`
          id,
          advisor_id,
          content_english,
          content_hindi,
          media_url,
          advisors!inner (
            id,
            mobile,
            business_name,
            subscription_tier,
            language_preference,
            sebi_registration
          )
        `)
        .eq('status', 'approved')
        .eq('scheduled_date', istTime.toISOString().split('T')[0])

      if (error) {
        console.error('Failed to fetch content:', error)
        results.errors.push(`Database error: ${error.message}`)
        return results
      }

      if (!contentItems || contentItems.length === 0) {
        console.log('No content scheduled for delivery')
        return results
      }

      // Sort by tier priority (Pro > Standard > Free)
      const sortedContent = contentItems.sort((a, b) => {
        const tierPriority = { pro: 3, standard: 2, free: 1 }
        return (tierPriority[b.advisors.subscription_tier] || 1) - 
               (tierPriority[a.advisors.subscription_tier] || 1)
      })

      // Schedule jobs with jitter
      for (let i = 0; i < sortedContent.length; i++) {
        try {
          const content = sortedContent[i]
          const advisor = content.advisors
          
          // Calculate jitter for load distribution
          const jitterMs = this.calculateJitter(i, sortedContent.length)
          const deliveryTime = addMilliseconds(istTime, jitterMs)
          
          // Prepare template parameters
          const parameters = {
            param1: formatInTimeZone(istTime, SCHEDULER_CONFIG.IST_TIMEZONE, 'MMMM d, yyyy'),
            param2: advisor.business_name,
            param3: this.extractMarketSummary(content.content_english),
            param4: this.extractKeyInsights(content.content_english),
            param5: this.extractTodaysFocus(content.content_english),
            param6: advisor.sebi_registration || 'Pending'
          }

          // Create delivery job
          const job: DeliveryJob = {
            advisorId: advisor.id,
            contentId: content.id,
            phoneNumber: advisor.mobile,
            language: advisor.language_preference || 'en',
            parameters,
            mediaUrl: content.media_url,
            priority: this.getPriorityByTier(advisor.subscription_tier),
            scheduledFor: deliveryTime.toISOString(),
            retryCount: 0,
            maxRetries: 3,
            tier: advisor.subscription_tier as 'pro' | 'standard' | 'free'
          }

          // Add to queue with delay
          const delay = differenceInMilliseconds(deliveryTime, new Date())
          await this.deliveryQueue.add(`delivery-${advisor.id}-${content.id}`, job, {
            delay: Math.max(0, delay),
            priority: this.getPriorityValue(job.priority)
          })

          results.scheduled++
        } catch (error) {
          console.error(`Failed to schedule for advisor ${sortedContent[i].advisor_id}:`, error)
          results.failed++
          results.errors.push(`Advisor ${sortedContent[i].advisor_id}: ${error.message}`)
        }
      }

      // Calculate estimated completion time
      const totalJobs = results.scheduled
      const estimatedTimeMs = (totalJobs / SCHEDULER_CONFIG.BATCH_SIZE) * 1000 + 
                             SCHEDULER_CONFIG.JITTER_WINDOW_MINUTES * 60 * 1000
      results.estimatedCompletion = addMilliseconds(istTime, estimatedTimeMs)

      // Update metrics
      this.currentMetrics.totalScheduled = results.scheduled

      console.log(`Scheduled ${results.scheduled} deliveries for ${formatInTimeZone(istTime, SCHEDULER_CONFIG.IST_TIMEZONE, 'yyyy-MM-dd HH:mm:ss')} IST`)

      return results
    } catch (error) {
      console.error('Daily scheduling error:', error)
      results.errors.push(`System error: ${error.message}`)
      return results
    }
  }

  /**
   * Send immediate content (for testing or urgent updates)
   */
  async sendImmediate(
    advisorId: string,
    contentId: string,
    phoneNumber: string
  ): Promise<DeliveryResult> {
    try {
      // Fetch content and advisor details
      const { data: content } = await this.supabase
        .from('content')
        .select('*, advisors!inner(*)')
        .eq('id', contentId)
        .single()

      if (!content) {
        throw new Error('Content not found')
      }

      const advisor = content.advisors

      // Prepare job
      const job: DeliveryJob = {
        advisorId,
        contentId,
        phoneNumber,
        language: advisor.language_preference || 'en',
        parameters: {
          param1: formatInTimeZone(new Date(), SCHEDULER_CONFIG.IST_TIMEZONE, 'MMMM d, yyyy'),
          param2: advisor.business_name,
          param3: this.extractMarketSummary(content.content_english),
          param4: this.extractKeyInsights(content.content_english),
          param5: this.extractTodaysFocus(content.content_english),
          param6: advisor.sebi_registration || 'Pending'
        },
        mediaUrl: content.media_url,
        priority: 'urgent',
        scheduledFor: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 1,
        tier: advisor.subscription_tier as 'pro' | 'standard' | 'free'
      }

      // Add to queue for immediate processing
      const queueJob = await this.deliveryQueue.add(`immediate-${advisorId}-${contentId}`, job, {
        priority: 100 // Highest priority
      })

      // Wait for completion
      const result = await queueJob.waitUntilFinished(this.events)
      
      return result
    } catch (error) {
      console.error('Immediate delivery error:', error)
      return {
        jobId: '',
        advisorId,
        contentId,
        status: 'failed',
        error: error.message,
        attempts: 1,
        processingTime: 0
      }
    }
  }

  /**
   * Create worker to process delivery jobs
   */
  private createWorker(): Worker<DeliveryJob, DeliveryResult> {
    return new Worker<DeliveryJob, DeliveryResult>(
      'whatsapp-delivery',
      async (job: Job<DeliveryJob>) => {
        const startTime = Date.now()
        const { data } = job

        try {
          console.log(`Processing delivery job ${job.id} for advisor ${data.advisorId}`)

          // Get best template for the use case
          const { templateName } = await this.templateManager.getBestTemplate(
            'daily_content',
            data.language
          )

          // Send WhatsApp message
          const response = await this.whatsappAPI.sendTemplate(
            data.phoneNumber,
            data.templateName || templateName,
            data.language,
            data.parameters,
            data.mediaUrl
          )

          if (!response.messages || response.messages.length === 0) {
            throw new Error('No message ID returned from WhatsApp API')
          }

          // Log delivery in database
          await this.logDelivery({
            advisor_id: data.advisorId,
            content_id: data.contentId,
            whatsapp_message_id: response.messages[0].id,
            template_name: templateName,
            status: 'sent',
            sent_at: new Date().toISOString()
          })

          // Update metrics
          this.currentMetrics.totalDelivered++
          this.updateDeliveryRate()

          return {
            jobId: job.id,
            advisorId: data.advisorId,
            contentId: data.contentId,
            status: 'sent',
            whatsappMessageId: response.messages[0].id,
            attempts: job.attemptsMade,
            deliveredAt: new Date(),
            processingTime: Date.now() - startTime
          }
        } catch (error) {
          console.error(`Delivery failed for job ${job.id}:`, error)

          // Log failure
          await this.logDelivery({
            advisor_id: data.advisorId,
            content_id: data.contentId,
            status: 'failed',
            error_message: error.message,
            attempts: job.attemptsMade
          })

          // Update metrics
          this.currentMetrics.totalFailed++
          this.updateDeliveryRate()
          this.checkSLAViolation()

          // Determine if we should retry
          if (job.attemptsMade < data.maxRetries) {
            throw error // Will trigger retry
          }

          return {
            jobId: job.id,
            advisorId: data.advisorId,
            contentId: data.contentId,
            status: 'failed',
            error: error.message,
            attempts: job.attemptsMade,
            processingTime: Date.now() - startTime
          }
        }
      },
      {
        connection: this.redis,
        concurrency: SCHEDULER_CONFIG.MAX_CONCURRENT_JOBS,
        limiter: {
          max: SCHEDULER_CONFIG.BATCH_SIZE,
          duration: 1000 // Per second
        }
      }
    )
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners() {
    // Job completed successfully
    this.events.on('completed', ({ jobId, returnvalue }) => {
      console.log(`Job ${jobId} completed:`, returnvalue)
    })

    // Job failed after all retries
    this.events.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} failed:`, failedReason)
      this.handleFailedJob(jobId, failedReason)
    })

    // Job progress updates
    this.events.on('progress', ({ jobId, data }) => {
      console.log(`Job ${jobId} progress:`, data)
    })

    // Monitor queue health
    setInterval(() => {
      this.monitorQueueHealth()
    }, 30000) // Every 30 seconds
  }

  /**
   * Calculate jitter for load distribution
   */
  private calculateJitter(index: number, total: number): number {
    // Distribute jobs across the jitter window
    const windowMs = SCHEDULER_CONFIG.JITTER_WINDOW_MINUTES * 60 * 1000
    const baseJitter = (index / total) * windowMs
    
    // Add random component (-30s to +30s)
    const randomJitter = (Math.random() - 0.5) * 60000
    
    // Start 30 seconds before target time
    return baseJitter + randomJitter - 30000
  }

  /**
   * Get priority by subscription tier
   */
  private getPriorityByTier(tier: string): 'urgent' | 'high' | 'normal' | 'low' {
    switch (tier) {
      case 'pro':
        return 'high'
      case 'standard':
        return 'normal'
      default:
        return 'low'
    }
  }

  /**
   * Get numeric priority value for BullMQ
   */
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'urgent':
        return 1
      case 'high':
        return 2
      case 'normal':
        return 3
      case 'low':
        return 4
      default:
        return 3
    }
  }

  /**
   * Extract content sections for template
   */
  private extractMarketSummary(content: string): string {
    const lines = content.split('\n')
    const summaryLine = lines.find(line => 
      line.toLowerCase().includes('sensex') || 
      line.toLowerCase().includes('nifty') ||
      line.toLowerCase().includes('market')
    )
    return summaryLine || 'Market update for today'
  }

  private extractKeyInsights(content: string): string {
    const lines = content.split('\n')
    const insightLine = lines.find(line => 
      line.toLowerCase().includes('insight') || 
      line.toLowerCase().includes('focus') ||
      line.toLowerCase().includes('opportunity')
    )
    return insightLine || 'Key investment opportunities identified'
  }

  private extractTodaysFocus(content: string): string {
    const lines = content.split('\n')
    const focusLine = lines.find(line => 
      line.toLowerCase().includes('recommend') || 
      line.toLowerCase().includes('consider') ||
      line.toLowerCase().includes('focus')
    )
    return focusLine || 'Strategic focus areas for today'
  }

  /**
   * Log delivery to database
   */
  private async logDelivery(data: any) {
    try {
      await this.supabase
        .from('content_deliveries')
        .insert(data)
    } catch (error) {
      console.error('Failed to log delivery:', error)
    }
  }

  /**
   * Update delivery rate metric
   */
  private updateDeliveryRate() {
    const total = this.currentMetrics.totalDelivered + this.currentMetrics.totalFailed
    if (total > 0) {
      this.currentMetrics.deliveryRate = this.currentMetrics.totalDelivered / total
    }
  }

  /**
   * Check for SLA violations
   */
  private checkSLAViolation() {
    if (this.currentMetrics.deliveryRate < SCHEDULER_CONFIG.SLA_THRESHOLD) {
      this.currentMetrics.slaStatus = 'AT_RISK'
      
      if (this.currentMetrics.deliveryRate < (SCHEDULER_CONFIG.SLA_THRESHOLD - 0.02)) {
        this.currentMetrics.slaStatus = 'FAIL'
        this.triggerSLAAlert()
      }
    }

    // Check failure rate
    const failureRate = this.currentMetrics.totalFailed / 
                       (this.currentMetrics.totalDelivered + this.currentMetrics.totalFailed)
    
    if (failureRate > SCHEDULER_CONFIG.CRITICAL_FAILURE_THRESHOLD) {
      this.currentMetrics.violations.push({
        time: new Date(),
        metric: 'failure_rate',
        value: failureRate,
        threshold: SCHEDULER_CONFIG.CRITICAL_FAILURE_THRESHOLD
      })
      this.triggerCriticalAlert()
    }
  }

  /**
   * Handle failed jobs
   */
  private async handleFailedJob(jobId: string, reason: string) {
    // Implement fallback logic
    console.error(`Job ${jobId} failed permanently: ${reason}`)
    
    // Could trigger fallback content delivery here
  }

  /**
   * Monitor queue health
   */
  private async monitorQueueHealth() {
    const counts = await this.deliveryQueue.getJobCounts()
    
    console.log('Queue health:', {
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed
    })

    // Update peak concurrency
    if (counts.active > this.currentMetrics.peakConcurrency) {
      this.currentMetrics.peakConcurrency = counts.active
    }
  }

  /**
   * Trigger SLA alert
   */
  private triggerSLAAlert() {
    console.error('SLA VIOLATION: Delivery rate below threshold', {
      currentRate: this.currentMetrics.deliveryRate,
      threshold: SCHEDULER_CONFIG.SLA_THRESHOLD
    })
    
    // Send alert to administrators
    // This would integrate with monitoring systems
  }

  /**
   * Trigger critical failure alert
   */
  private triggerCriticalAlert() {
    console.error('CRITICAL: High failure rate detected', {
      failureRate: this.currentMetrics.totalFailed / 
                  (this.currentMetrics.totalDelivered + this.currentMetrics.totalFailed),
      threshold: SCHEDULER_CONFIG.CRITICAL_FAILURE_THRESHOLD
    })
    
    // Send urgent alert to administrators
  }

  /**
   * Get current SLA metrics
   */
  async getSLAMetrics(): Promise<SLAMetrics> {
    return this.currentMetrics
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.worker.close()
    await this.scheduler.close()
    await this.events.close()
    await this.deliveryQueue.close()
    await this.redis.quit()
  }
}

// Singleton instance
let deliveryScheduler: DeliveryScheduler | null = null

export function getDeliveryScheduler(): DeliveryScheduler {
  if (!deliveryScheduler) {
    deliveryScheduler = new DeliveryScheduler()
  }
  return deliveryScheduler
}