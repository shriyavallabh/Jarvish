import { Queue, QueueEvents, Job } from 'bullmq'
import IORedis from 'ioredis'
import { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']

// Redis connection
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

export interface QueueConfig {
  name: string
  concurrency: number
  rateLimit?: {
    max: number
    duration: number
  }
  defaultJobOptions?: {
    attempts?: number
    backoff?: {
      type: 'exponential' | 'fixed'
      delay: number
    }
    removeOnComplete?: boolean | number
    removeOnFail?: boolean | number
  }
}

export interface QueueMetrics {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  throughput: number
  latency: number
  errorRate: number
}

export class QueueManager {
  private queues: Map<string, Queue> = new Map()
  private queueEvents: Map<string, QueueEvents> = new Map()
  private metrics: Map<string, QueueMetrics> = new Map()
  
  // Circuit breaker configuration
  private readonly CIRCUIT_BREAKER_THRESHOLD = 0.5 // 50% error rate
  private readonly CIRCUIT_BREAKER_WINDOW = 60000 // 1 minute
  private circuitBreakers: Map<string, {
    failures: number
    successes: number
    lastReset: number
    isOpen: boolean
  }> = new Map()

  constructor() {
    this.initializeQueues()
    this.startMetricsCollection()
  }

  /**
   * Initialize all queues with their configurations
   */
  private initializeQueues(): void {
    const queueConfigs: QueueConfig[] = [
      {
        name: 'content-delivery',
        concurrency: 100,
        rateLimit: {
          max: 20,
          duration: 1000,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 1000,
          removeOnFail: 10000,
        },
      },
      {
        name: 'fallback-assignment',
        concurrency: 50,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 10000,
          },
        },
      },
      {
        name: 'analytics-processing',
        concurrency: 20,
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: true,
        },
      },
      {
        name: 'notification-dispatch',
        concurrency: 30,
        rateLimit: {
          max: 10,
          duration: 1000,
        },
      },
    ]

    queueConfigs.forEach(config => {
      this.createQueue(config)
    })
  }

  /**
   * Create and configure a queue
   */
  private createQueue(config: QueueConfig): void {
    const queue = new Queue(config.name, {
      connection: redisConnection,
      defaultJobOptions: config.defaultJobOptions,
    })

    const queueEvents = new QueueEvents(config.name, {
      connection: redisConnection,
    })

    this.queues.set(config.name, queue)
    this.queueEvents.set(config.name, queueEvents)

    // Initialize circuit breaker
    this.circuitBreakers.set(config.name, {
      failures: 0,
      successes: 0,
      lastReset: Date.now(),
      isOpen: false,
    })

    // Set up event listeners
    this.setupQueueEventListeners(config.name, queueEvents)
  }

  /**
   * Set up event listeners for queue monitoring
   */
  private setupQueueEventListeners(queueName: string, events: QueueEvents): void {
    events.on('completed', ({ jobId, returnvalue }) => {
      this.updateCircuitBreaker(queueName, true)
      this.updateMetrics(queueName, 'completed')
    })

    events.on('failed', ({ jobId, failedReason }) => {
      this.updateCircuitBreaker(queueName, false)
      this.updateMetrics(queueName, 'failed')
      console.error(`Job ${jobId} in queue ${queueName} failed: ${failedReason}`)
    })

    events.on('stalled', ({ jobId }) => {
      console.warn(`Job ${jobId} in queue ${queueName} stalled`)
    })

    events.on('progress', ({ jobId, data }) => {
      console.log(`Job ${jobId} in queue ${queueName} progress: ${data}`)
    })
  }

  /**
   * Add a job to a specific queue
   */
  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: {
      delay?: number
      priority?: number
      attempts?: number
      backoff?: {
        type: 'exponential' | 'fixed'
        delay: number
      }
    }
  ): Promise<Job<T> | null> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

    // Check circuit breaker
    if (this.isCircuitOpen(queueName)) {
      console.warn(`Circuit breaker open for queue ${queueName}, rejecting job`)
      return null
    }

    try {
      const job = await queue.add(jobName, data, options)
      return job
    } catch (error) {
      console.error(`Failed to add job to queue ${queueName}:`, error)
      throw error
    }
  }

  /**
   * Bulk add jobs to a queue
   */
  async bulkAddJobs<T>(
    queueName: string,
    jobs: Array<{
      name: string
      data: T
      opts?: any
    }>
  ): Promise<Job<T>[]> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

    // Check circuit breaker
    if (this.isCircuitOpen(queueName)) {
      console.warn(`Circuit breaker open for queue ${queueName}, rejecting bulk jobs`)
      return []
    }

    try {
      const addedJobs = await queue.addBulk(jobs)
      return addedJobs
    } catch (error) {
      console.error(`Failed to bulk add jobs to queue ${queueName}:`, error)
      throw error
    }
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(queueName: string, success: boolean): void {
    const breaker = this.circuitBreakers.get(queueName)
    if (!breaker) return

    // Reset if window has passed
    if (Date.now() - breaker.lastReset > this.CIRCUIT_BREAKER_WINDOW) {
      breaker.failures = 0
      breaker.successes = 0
      breaker.lastReset = Date.now()
    }

    // Update counts
    if (success) {
      breaker.successes++
    } else {
      breaker.failures++
    }

    // Calculate error rate
    const total = breaker.successes + breaker.failures
    const errorRate = total > 0 ? breaker.failures / total : 0

    // Update circuit state
    if (errorRate > this.CIRCUIT_BREAKER_THRESHOLD && total > 10) {
      if (!breaker.isOpen) {
        console.warn(`Opening circuit breaker for queue ${queueName} (error rate: ${(errorRate * 100).toFixed(2)}%)`)
        breaker.isOpen = true
        
        // Auto-reset after 30 seconds
        setTimeout(() => {
          console.log(`Resetting circuit breaker for queue ${queueName}`)
          breaker.isOpen = false
          breaker.failures = 0
          breaker.successes = 0
          breaker.lastReset = Date.now()
        }, 30000)
      }
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(queueName: string): boolean {
    const breaker = this.circuitBreakers.get(queueName)
    return breaker?.isOpen || false
  }

  /**
   * Update queue metrics
   */
  private updateMetrics(queueName: string, event: 'completed' | 'failed'): void {
    // Implementation would update Redis counters for real-time metrics
    const metricsKey = `queue:metrics:${queueName}:${new Date().toISOString().split('T')[0]}`
    const eventKey = `${metricsKey}:${event}`
    
    redisConnection.incr(eventKey)
    redisConnection.expire(eventKey, 7 * 24 * 3600) // Keep for 7 days
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      for (const [name, queue] of this.queues) {
        const metrics = await this.getQueueMetrics(name)
        this.metrics.set(name, metrics)
        
        // Store in Redis for monitoring dashboard
        const key = `queue:snapshot:${name}`
        await redisConnection.set(key, JSON.stringify(metrics), 'EX', 300) // 5 minutes TTL
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Get metrics for a specific queue
   */
  async getQueueMetrics(queueName: string): Promise<QueueMetrics> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ])

    // Calculate throughput and latency from Redis metrics
    const metricsKey = `queue:metrics:${queueName}:${new Date().toISOString().split('T')[0]}`
    const completedToday = await redisConnection.get(`${metricsKey}:completed`) || '0'
    const failedToday = await redisConnection.get(`${metricsKey}:failed`) || '0'
    
    const total = parseInt(completedToday) + parseInt(failedToday)
    const errorRate = total > 0 ? parseInt(failedToday) / total : 0

    // Calculate average latency (simplified - in production, track actual times)
    const latency = active > 0 ? 1000 : 0 // Placeholder

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      throughput: parseInt(completedToday),
      latency,
      errorRate,
    }
  }

  /**
   * Get all queue metrics
   */
  async getAllQueueMetrics(): Promise<QueueMetrics[]> {
    const metrics: QueueMetrics[] = []
    
    for (const queueName of this.queues.keys()) {
      const queueMetrics = await this.getQueueMetrics(queueName)
      metrics.push(queueMetrics)
    }
    
    return metrics
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }
    
    await queue.pause()
    console.log(`Queue ${queueName} paused`)
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }
    
    await queue.resume()
    console.log(`Queue ${queueName} resumed`)
  }

  /**
   * Drain a queue (remove all jobs)
   */
  async drainQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }
    
    await queue.drain()
    console.log(`Queue ${queueName} drained`)
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(
    queueName: string,
    grace: number = 0,
    limit: number = 100,
    status?: 'completed' | 'failed'
  ): Promise<string[]> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }
    
    const jobs = await queue.clean(grace, limit, status)
    console.log(`Cleaned ${jobs.length} jobs from queue ${queueName}`)
    
    return jobs
  }

  /**
   * Get failed jobs for retry
   */
  async getFailedJobs(queueName: string, limit: number = 100): Promise<Job[]> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }
    
    const failed = await queue.getFailed(0, limit)
    return failed
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs(queueName: string, jobIds?: string[]): Promise<number> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }
    
    const failedJobs = await this.getFailedJobs(queueName)
    let retryCount = 0
    
    for (const job of failedJobs) {
      if (!jobIds || jobIds.includes(job.id)) {
        await job.retry()
        retryCount++
      }
    }
    
    console.log(`Retried ${retryCount} failed jobs in queue ${queueName}`)
    return retryCount
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down queue manager...')
    
    // Close all queue events
    for (const events of this.queueEvents.values()) {
      await events.close()
    }
    
    // Close all queues
    for (const queue of this.queues.values()) {
      await queue.close()
    }
    
    // Close Redis connection
    await redisConnection.quit()
    
    console.log('Queue manager shut down successfully')
  }
}

// Singleton instance
let queueManager: QueueManager | null = null

export function getQueueManager(): QueueManager {
  if (!queueManager) {
    queueManager = new QueueManager()
  }
  return queueManager
}