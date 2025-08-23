import IORedis from 'ioredis'
import { EventEmitter } from 'events'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { getQueueManager } from './queue-manager'

type Tables = Database['public']['Tables']

// Redis connection
const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
})

export interface DeliveryMetrics {
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  pendingDeliveries: number
  averageDeliveryTime: number
  slaCompliance: number
  deliveryRate: number
  errorRate: number
}

export interface SLAMetrics {
  currentSLA: number
  targetSLA: number
  violationCount: number
  withinSLACount: number
  totalMeasured: number
  averageLatency: number
  p95Latency: number
  p99Latency: number
}

export interface AlertConfig {
  type: 'sla_violation' | 'high_error_rate' | 'queue_backlog' | 'system_failure'
  threshold: number
  window: number // Time window in seconds
  cooldown: number // Cooldown period in seconds
}

export class DeliveryMonitor extends EventEmitter {
  private readonly supabase = createServerSupabaseClient()
  private readonly queueManager = getQueueManager()
  
  // Monitoring configuration
  private readonly SLA_TARGET = 0.99 // 99%
  private readonly SLA_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
  private readonly MONITORING_INTERVAL = 30000 // 30 seconds
  private readonly ALERT_COOLDOWN = 600000 // 10 minutes
  
  // Real-time metrics storage
  private metricsBuffer: Map<string, any[]> = new Map()
  private lastAlerts: Map<string, number> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null
  
  // Alert configurations
  private alertConfigs: AlertConfig[] = [
    {
      type: 'sla_violation',
      threshold: 0.97, // Alert if SLA drops below 97%
      window: 300, // 5 minutes
      cooldown: 600, // 10 minutes
    },
    {
      type: 'high_error_rate',
      threshold: 0.1, // Alert if error rate exceeds 10%
      window: 300,
      cooldown: 600,
    },
    {
      type: 'queue_backlog',
      threshold: 1000, // Alert if queue has >1000 pending jobs
      window: 60,
      cooldown: 300,
    },
    {
      type: 'system_failure',
      threshold: 0.5, // Alert if >50% failures
      window: 60,
      cooldown: 300,
    },
  ]

  constructor() {
    super()
    this.startMonitoring()
  }

  /**
   * Start real-time monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics()
      await this.checkSLA()
      await this.checkAlerts()
      await this.updateDashboard()
    }, this.MONITORING_INTERVAL)

    console.log('Delivery monitoring started')
  }

  /**
   * Collect current metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Get queue metrics
      const queueMetrics = await this.queueManager.getAllQueueMetrics()
      
      // Get delivery metrics from database
      const deliveryMetrics = await this.getDeliveryMetrics()
      
      // Get SLA metrics
      const slaMetrics = await this.getSLAMetrics()
      
      // Store in buffer for trend analysis
      const timestamp = Date.now()
      this.addToMetricsBuffer('queue', { timestamp, data: queueMetrics })
      this.addToMetricsBuffer('delivery', { timestamp, data: deliveryMetrics })
      this.addToMetricsBuffer('sla', { timestamp, data: slaMetrics })
      
      // Store in Redis for dashboard
      await this.storeMetricsInRedis({
        queue: queueMetrics,
        delivery: deliveryMetrics,
        sla: slaMetrics,
        timestamp,
      })
    } catch (error) {
      console.error('Error collecting metrics:', error)
    }
  }

  /**
   * Get delivery metrics from database
   */
  private async getDeliveryMetrics(): Promise<DeliveryMetrics> {
    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    
    // Get today's deliveries
    const { data: deliveries, error } = await this.supabase
      .from('content_deliveries')
      .select('*')
      .gte('created_at', todayStart.toISOString())

    if (error || !deliveries) {
      return this.getEmptyMetrics()
    }

    const total = deliveries.length
    const successful = deliveries.filter(d => 
      d.delivery_status === 'delivered' || d.delivery_status === 'read'
    ).length
    const failed = deliveries.filter(d => d.delivery_status === 'failed').length
    const pending = deliveries.filter(d => 
      d.delivery_status === 'pending' || d.delivery_status === 'sent'
    ).length

    // Calculate average delivery time
    const deliveryTimes = deliveries
      .filter(d => d.sent_at && d.scheduled_time)
      .map(d => {
        const sent = new Date(d.sent_at).getTime()
        const scheduled = new Date(d.scheduled_time).getTime()
        return sent - scheduled
      })

    const averageDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0

    // Calculate rates
    const hoursElapsed = (Date.now() - todayStart.getTime()) / (1000 * 60 * 60)
    const deliveryRate = hoursElapsed > 0 ? total / hoursElapsed : 0
    const errorRate = total > 0 ? failed / total : 0
    const slaCompliance = total > 0 ? successful / total : 1

    return {
      totalDeliveries: total,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      pendingDeliveries: pending,
      averageDeliveryTime,
      slaCompliance,
      deliveryRate,
      errorRate,
    }
  }

  /**
   * Get SLA metrics
   */
  private async getSLAMetrics(): Promise<SLAMetrics> {
    const metricsKey = `sla:metrics:${new Date().toISOString().split('T')[0]}`
    const metrics = await redis.lrange(metricsKey, 0, -1)
    
    if (metrics.length === 0) {
      return {
        currentSLA: 1,
        targetSLA: this.SLA_TARGET,
        violationCount: 0,
        withinSLACount: 0,
        totalMeasured: 0,
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
      }
    }

    const parsed = metrics.map(m => JSON.parse(m))
    const withinSLA = parsed.filter(m => m.withinSLA && m.success).length
    const total = parsed.length
    const violations = parsed.filter(m => !m.withinSLA).length
    
    // Calculate latency percentiles
    const latencies = parsed
      .filter(m => m.deliveryTime)
      .map(m => m.deliveryTime)
      .sort((a, b) => a - b)

    const average = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0

    const p95Index = Math.floor(latencies.length * 0.95)
    const p99Index = Math.floor(latencies.length * 0.99)

    return {
      currentSLA: total > 0 ? withinSLA / total : 1,
      targetSLA: this.SLA_TARGET,
      violationCount: violations,
      withinSLACount: withinSLA,
      totalMeasured: total,
      averageLatency: average,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0,
    }
  }

  /**
   * Check SLA compliance
   */
  private async checkSLA(): Promise<void> {
    const slaMetrics = await this.getSLAMetrics()
    
    if (slaMetrics.totalMeasured < 100) {
      return // Not enough data yet
    }

    if (slaMetrics.currentSLA < this.SLA_TARGET) {
      const violation = {
        timestamp: new Date(),
        currentSLA: slaMetrics.currentSLA,
        targetSLA: this.SLA_TARGET,
        totalMeasured: slaMetrics.totalMeasured,
        severity: slaMetrics.currentSLA < 0.95 ? 'critical' : 'warning',
      }

      // Emit SLA violation event
      this.emit('sla_violation', violation)
      
      // Store violation
      await this.storeSLAViolation(violation)
    }
  }

  /**
   * Check for alert conditions
   */
  private async checkAlerts(): Promise<void> {
    for (const config of this.alertConfigs) {
      const shouldAlert = await this.evaluateAlertCondition(config)
      
      if (shouldAlert && this.canSendAlert(config.type)) {
        await this.sendAlert(config)
        this.lastAlerts.set(config.type, Date.now())
      }
    }
  }

  /**
   * Evaluate if alert condition is met
   */
  private async evaluateAlertCondition(config: AlertConfig): Promise<boolean> {
    switch (config.type) {
      case 'sla_violation': {
        const sla = await this.getSLAMetrics()
        return sla.currentSLA < config.threshold && sla.totalMeasured > 100
      }
      
      case 'high_error_rate': {
        const metrics = await this.getDeliveryMetrics()
        return metrics.errorRate > config.threshold && metrics.totalDeliveries > 100
      }
      
      case 'queue_backlog': {
        const queueMetrics = await this.queueManager.getQueueMetrics('content-delivery')
        return queueMetrics.waiting > config.threshold
      }
      
      case 'system_failure': {
        const metrics = await this.getDeliveryMetrics()
        const failureRate = metrics.totalDeliveries > 0 
          ? metrics.failedDeliveries / metrics.totalDeliveries 
          : 0
        return failureRate > config.threshold && metrics.totalDeliveries > 50
      }
      
      default:
        return false
    }
  }

  /**
   * Check if alert can be sent (cooldown)
   */
  private canSendAlert(type: string): boolean {
    const lastAlert = this.lastAlerts.get(type)
    if (!lastAlert) return true
    
    const cooldown = this.alertConfigs.find(c => c.type === type)?.cooldown || 600
    return Date.now() - lastAlert > cooldown * 1000
  }

  /**
   * Send alert
   */
  private async sendAlert(config: AlertConfig): Promise<void> {
    const alert = {
      type: config.type,
      threshold: config.threshold,
      timestamp: new Date(),
      message: this.getAlertMessage(config.type),
      severity: this.getAlertSeverity(config.type),
    }

    // Emit alert event
    this.emit('alert', alert)
    
    // Store alert in Redis
    const alertKey = `alerts:${config.type}:${Date.now()}`
    await redis.set(alertKey, JSON.stringify(alert), 'EX', 86400) // 24 hours
    
    // Log alert
    console.error(`🚨 ALERT: ${alert.message}`)
    
    // Here you would typically send notifications via email, SMS, Slack, etc.
  }

  /**
   * Get alert message
   */
  private getAlertMessage(type: string): string {
    switch (type) {
      case 'sla_violation':
        return 'SLA compliance has dropped below target threshold'
      case 'high_error_rate':
        return 'High error rate detected in content delivery'
      case 'queue_backlog':
        return 'Large backlog detected in delivery queue'
      case 'system_failure':
        return 'System failure detected - high failure rate'
      default:
        return 'Unknown alert condition'
    }
  }

  /**
   * Get alert severity
   */
  private getAlertSeverity(type: string): 'info' | 'warning' | 'critical' {
    switch (type) {
      case 'sla_violation':
      case 'system_failure':
        return 'critical'
      case 'high_error_rate':
      case 'queue_backlog':
        return 'warning'
      default:
        return 'info'
    }
  }

  /**
   * Store SLA violation
   */
  private async storeSLAViolation(violation: any): Promise<void> {
    const key = `sla:violations:${Date.now()}`
    await redis.set(key, JSON.stringify(violation), 'EX', 7 * 86400) // 7 days
    
    // Update violation counter
    await redis.incr(`sla:violations:count:${new Date().toISOString().split('T')[0]}`)
  }

  /**
   * Update monitoring dashboard
   */
  private async updateDashboard(): Promise<void> {
    const dashboard = {
      timestamp: new Date(),
      delivery: await this.getDeliveryMetrics(),
      sla: await this.getSLAMetrics(),
      queues: await this.queueManager.getAllQueueMetrics(),
      alerts: await this.getActiveAlerts(),
      health: await this.getSystemHealth(),
    }

    // Store in Redis for real-time dashboard
    await redis.set('monitor:dashboard', JSON.stringify(dashboard), 'EX', 60)
    
    // Emit dashboard update event
    this.emit('dashboard_update', dashboard)
  }

  /**
   * Get active alerts
   */
  private async getActiveAlerts(): Promise<any[]> {
    const alerts = []
    
    for (const config of this.alertConfigs) {
      const isActive = await this.evaluateAlertCondition(config)
      if (isActive) {
        alerts.push({
          type: config.type,
          active: true,
          message: this.getAlertMessage(config.type),
          severity: this.getAlertSeverity(config.type),
        })
      }
    }
    
    return alerts
  }

  /**
   * Get system health status
   */
  private async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical'
    score: number
    components: any[]
  }> {
    const sla = await this.getSLAMetrics()
    const delivery = await this.getDeliveryMetrics()
    const queues = await this.queueManager.getAllQueueMetrics()
    
    // Calculate health score (0-100)
    let score = 100
    
    // SLA impact (40 points)
    if (sla.currentSLA < this.SLA_TARGET) {
      score -= (this.SLA_TARGET - sla.currentSLA) * 40
    }
    
    // Error rate impact (30 points)
    if (delivery.errorRate > 0.05) {
      score -= Math.min(delivery.errorRate * 100, 30)
    }
    
    // Queue backlog impact (30 points)
    const totalBacklog = queues.reduce((sum, q) => sum + q.waiting, 0)
    if (totalBacklog > 500) {
      score -= Math.min(totalBacklog / 100, 30)
    }
    
    // Determine status
    let status: 'healthy' | 'degraded' | 'critical'
    if (score >= 80) {
      status = 'healthy'
    } else if (score >= 50) {
      status = 'degraded'
    } else {
      status = 'critical'
    }
    
    return {
      status,
      score: Math.max(0, Math.min(100, score)),
      components: [
        {
          name: 'SLA Compliance',
          status: sla.currentSLA >= this.SLA_TARGET ? 'healthy' : 'degraded',
          value: `${(sla.currentSLA * 100).toFixed(2)}%`,
        },
        {
          name: 'Error Rate',
          status: delivery.errorRate <= 0.05 ? 'healthy' : 'degraded',
          value: `${(delivery.errorRate * 100).toFixed(2)}%`,
        },
        {
          name: 'Queue Backlog',
          status: totalBacklog <= 500 ? 'healthy' : 'degraded',
          value: totalBacklog,
        },
      ],
    }
  }

  /**
   * Add metrics to buffer for trend analysis
   */
  private addToMetricsBuffer(type: string, metrics: any): void {
    if (!this.metricsBuffer.has(type)) {
      this.metricsBuffer.set(type, [])
    }
    
    const buffer = this.metricsBuffer.get(type)!
    buffer.push(metrics)
    
    // Keep only last hour of data
    const oneHourAgo = Date.now() - 3600000
    const filtered = buffer.filter(m => m.timestamp > oneHourAgo)
    this.metricsBuffer.set(type, filtered)
  }

  /**
   * Store metrics in Redis
   */
  private async storeMetricsInRedis(metrics: any): Promise<void> {
    const key = `monitor:metrics:${Date.now()}`
    await redis.set(key, JSON.stringify(metrics), 'EX', 3600) // 1 hour
    
    // Update latest metrics
    await redis.set('monitor:metrics:latest', JSON.stringify(metrics), 'EX', 60)
  }

  /**
   * Get empty metrics object
   */
  private getEmptyMetrics(): DeliveryMetrics {
    return {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      pendingDeliveries: 0,
      averageDeliveryTime: 0,
      slaCompliance: 1,
      deliveryRate: 0,
      errorRate: 0,
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboard(): Promise<any> {
    const dashboard = await redis.get('monitor:dashboard')
    return dashboard ? JSON.parse(dashboard) : null
  }

  /**
   * Get historical metrics
   */
  async getHistoricalMetrics(
    type: 'delivery' | 'sla' | 'queue',
    hours: number = 24
  ): Promise<any[]> {
    const buffer = this.metricsBuffer.get(type) || []
    const cutoff = Date.now() - (hours * 3600000)
    return buffer.filter(m => m.timestamp > cutoff)
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    console.log('Delivery monitoring stopped')
  }
}

// Singleton instance
let monitor: DeliveryMonitor | null = null

export function getDeliveryMonitor(): DeliveryMonitor {
  if (!monitor) {
    monitor = new DeliveryMonitor()
  }
  return monitor
}