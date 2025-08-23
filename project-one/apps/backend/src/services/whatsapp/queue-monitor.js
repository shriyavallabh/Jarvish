/**
 * WhatsApp Queue Monitor
 * Real-time monitoring and management of distribution queues
 */

const Bull = require('bull');
const EventEmitter = require('events');

class WhatsAppQueueMonitor extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      redisUrl: config.redisUrl || 'redis://localhost:6379',
      updateInterval: 5000, // 5 seconds
      alertThresholds: {
        queueDepth: 1000,
        failureRate: 0.05,
        processingTime: 10000 // 10 seconds
      },
      ...config
    };
    
    // Initialize queues for monitoring
    this.queues = {
      distribution: new Bull('mass-distribution', this.config.redisUrl),
      batch: new Bull('batch-processing', this.config.redisUrl),
      retry: new Bull('distribution-retry', this.config.redisUrl),
      analytics: new Bull('distribution-analytics', this.config.redisUrl)
    };
    
    // Metrics storage
    this.metrics = {
      queues: {},
      performance: {},
      alerts: []
    };
    
    // Start monitoring
    this.startMonitoring();
  }
  
  /**
   * Start monitoring all queues
   * @private
   */
  startMonitoring() {
    // Setup queue event listeners
    Object.entries(this.queues).forEach(([name, queue]) => {
      this.setupQueueListeners(name, queue);
    });
    
    // Regular metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.updateInterval);
    
    // Health check interval
    this.healthInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Setup event listeners for a queue
   * @private
   */
  setupQueueListeners(name, queue) {
    // Job lifecycle events
    queue.on('active', (job) => {
      this.trackJobStart(name, job);
    });
    
    queue.on('completed', (job, result) => {
      this.trackJobComplete(name, job, result);
    });
    
    queue.on('failed', (job, error) => {
      this.trackJobFailed(name, job, error);
    });
    
    queue.on('stalled', (job) => {
      this.handleStalledJob(name, job);
    });
    
    // Queue health events
    queue.on('error', (error) => {
      this.handleQueueError(name, error);
    });
  }
  
  /**
   * Collect metrics from all queues
   * @private
   */
  async collectMetrics() {
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        const metrics = await this.getQueueMetrics(queue);
        this.metrics.queues[name] = metrics;
        
        // Check for threshold violations
        this.checkThresholds(name, metrics);
        
        // Emit metrics update
        this.emit('metrics:updated', {
          queue: name,
          metrics
        });
      } catch (error) {
        console.error(`Failed to collect metrics for ${name}:`, error);
      }
    }
  }
  
  /**
   * Get detailed metrics for a queue
   * @private
   */
  async getQueueMetrics(queue) {
    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused()
    ]);
    
    // Get job processing stats
    const jobs = await queue.getJobs(['completed', 'failed'], 0, 100);
    const processingTimes = jobs
      .filter(job => job.finishedOn && job.processedOn)
      .map(job => job.finishedOn - job.processedOn);
    
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;
    
    const failureRate = completed + failed > 0
      ? failed / (completed + failed)
      : 0;
    
    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed,
      failureRate,
      avgProcessingTime,
      throughput: this.calculateThroughput(queue.name),
      timestamp: new Date()
    };
  }
  
  /**
   * Calculate queue throughput
   * @private
   */
  calculateThroughput(queueName) {
    const perf = this.metrics.performance[queueName];
    if (!perf || !perf.recentJobs || perf.recentJobs.length < 2) {
      return 0;
    }
    
    const timeSpan = perf.recentJobs[perf.recentJobs.length - 1].timestamp - 
                     perf.recentJobs[0].timestamp;
    
    if (timeSpan === 0) return 0;
    
    return (perf.recentJobs.length / timeSpan) * 1000 * 60; // Jobs per minute
  }
  
  /**
   * Track job start
   * @private
   */
  trackJobStart(queueName, job) {
    if (!this.metrics.performance[queueName]) {
      this.metrics.performance[queueName] = {
        activeJobs: new Map(),
        recentJobs: []
      };
    }
    
    this.metrics.performance[queueName].activeJobs.set(job.id, {
      startTime: Date.now(),
      data: job.data
    });
  }
  
  /**
   * Track job completion
   * @private
   */
  trackJobComplete(queueName, job, result) {
    const perf = this.metrics.performance[queueName];
    if (!perf) return;
    
    const activeJob = perf.activeJobs.get(job.id);
    if (activeJob) {
      const processingTime = Date.now() - activeJob.startTime;
      
      // Store in recent jobs (keep last 100)
      perf.recentJobs.push({
        id: job.id,
        processingTime,
        timestamp: Date.now(),
        success: true
      });
      
      if (perf.recentJobs.length > 100) {
        perf.recentJobs.shift();
      }
      
      perf.activeJobs.delete(job.id);
      
      // Emit performance metric
      this.emit('job:completed', {
        queue: queueName,
        jobId: job.id,
        processingTime,
        result
      });
    }
  }
  
  /**
   * Track job failure
   * @private
   */
  trackJobFailed(queueName, job, error) {
    const perf = this.metrics.performance[queueName];
    if (!perf) return;
    
    const activeJob = perf.activeJobs.get(job.id);
    if (activeJob) {
      const processingTime = Date.now() - activeJob.startTime;
      
      perf.recentJobs.push({
        id: job.id,
        processingTime,
        timestamp: Date.now(),
        success: false,
        error: error.message
      });
      
      if (perf.recentJobs.length > 100) {
        perf.recentJobs.shift();
      }
      
      perf.activeJobs.delete(job.id);
      
      // Emit failure event
      this.emit('job:failed', {
        queue: queueName,
        jobId: job.id,
        error: error.message,
        attemptsMade: job.attemptsMade,
        data: job.data
      });
    }
  }
  
  /**
   * Handle stalled job
   * @private
   */
  handleStalledJob(queueName, job) {
    console.warn(`Stalled job detected in ${queueName}:`, job.id);
    
    this.createAlert({
      type: 'stalled_job',
      severity: 'warning',
      queue: queueName,
      jobId: job.id,
      message: `Job ${job.id} stalled in ${queueName}`,
      timestamp: new Date()
    });
    
    this.emit('job:stalled', {
      queue: queueName,
      jobId: job.id,
      data: job.data
    });
  }
  
  /**
   * Handle queue error
   * @private
   */
  handleQueueError(queueName, error) {
    console.error(`Queue error in ${queueName}:`, error);
    
    this.createAlert({
      type: 'queue_error',
      severity: 'high',
      queue: queueName,
      error: error.message,
      timestamp: new Date()
    });
    
    this.emit('queue:error', {
      queue: queueName,
      error: error.message
    });
  }
  
  /**
   * Check metrics against thresholds
   * @private
   */
  checkThresholds(queueName, metrics) {
    const thresholds = this.config.alertThresholds;
    
    // Check queue depth
    if (metrics.waiting > thresholds.queueDepth) {
      this.createAlert({
        type: 'high_queue_depth',
        severity: 'warning',
        queue: queueName,
        value: metrics.waiting,
        threshold: thresholds.queueDepth,
        message: `Queue depth (${metrics.waiting}) exceeds threshold (${thresholds.queueDepth})`
      });
    }
    
    // Check failure rate
    if (metrics.failureRate > thresholds.failureRate) {
      this.createAlert({
        type: 'high_failure_rate',
        severity: 'high',
        queue: queueName,
        value: metrics.failureRate,
        threshold: thresholds.failureRate,
        message: `Failure rate (${(metrics.failureRate * 100).toFixed(2)}%) exceeds threshold`
      });
    }
    
    // Check processing time
    if (metrics.avgProcessingTime > thresholds.processingTime) {
      this.createAlert({
        type: 'slow_processing',
        severity: 'warning',
        queue: queueName,
        value: metrics.avgProcessingTime,
        threshold: thresholds.processingTime,
        message: `Average processing time (${metrics.avgProcessingTime}ms) exceeds threshold`
      });
    }
  }
  
  /**
   * Create and emit alert
   * @private
   */
  createAlert(alert) {
    alert.id = `alert_${Date.now()}`;
    alert.timestamp = alert.timestamp || new Date();
    
    // Store alert
    this.metrics.alerts.push(alert);
    
    // Keep only recent alerts (last 100)
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts.shift();
    }
    
    // Emit alert
    this.emit('alert:created', alert);
    
    // Log based on severity
    if (alert.severity === 'critical') {
      console.error('CRITICAL ALERT:', alert);
    } else if (alert.severity === 'high') {
      console.error('HIGH ALERT:', alert);
    } else {
      console.warn('ALERT:', alert);
    }
  }
  
  /**
   * Perform health check
   * @private
   */
  async performHealthCheck() {
    const health = {
      healthy: true,
      queues: {},
      issues: []
    };
    
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        const isPaused = await queue.isPaused();
        const isReady = await queue.isReady();
        
        health.queues[name] = {
          paused: isPaused,
          ready: isReady,
          healthy: !isPaused && isReady
        };
        
        if (!health.queues[name].healthy) {
          health.healthy = false;
          health.issues.push(`Queue ${name} is unhealthy`);
        }
      } catch (error) {
        health.queues[name] = {
          healthy: false,
          error: error.message
        };
        health.healthy = false;
        health.issues.push(`Queue ${name} health check failed: ${error.message}`);
      }
    }
    
    this.emit('health:checked', health);
    
    if (!health.healthy) {
      this.createAlert({
        type: 'health_check_failed',
        severity: 'high',
        health,
        message: `Health check failed: ${health.issues.join(', ')}`
      });
    }
    
    return health;
  }
  
  /**
   * Get current queue status
   * @public
   */
  async getQueueStatus() {
    const status = {};
    
    for (const [name, queue] of Object.entries(this.queues)) {
      status[name] = await this.getQueueMetrics(queue);
    }
    
    return status;
  }
  
  /**
   * Get performance metrics
   * @public
   */
  getPerformanceMetrics() {
    const performance = {};
    
    for (const [queueName, perf] of Object.entries(this.metrics.performance)) {
      const recentJobs = perf.recentJobs || [];
      const successful = recentJobs.filter(j => j.success);
      const failed = recentJobs.filter(j => !j.success);
      
      performance[queueName] = {
        totalProcessed: recentJobs.length,
        successful: successful.length,
        failed: failed.length,
        successRate: recentJobs.length > 0 
          ? successful.length / recentJobs.length 
          : 0,
        avgProcessingTime: successful.length > 0
          ? successful.reduce((sum, j) => sum + j.processingTime, 0) / successful.length
          : 0,
        throughput: this.calculateThroughput(queueName)
      };
    }
    
    return performance;
  }
  
  /**
   * Get recent alerts
   * @public
   */
  getAlerts(severity = null, limit = 50) {
    let alerts = this.metrics.alerts;
    
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    
    return alerts.slice(-limit).reverse();
  }
  
  /**
   * Clear completed jobs from queues
   * @public
   */
  async clearCompleted(queueName = null) {
    const queues = queueName 
      ? { [queueName]: this.queues[queueName] }
      : this.queues;
    
    const results = {};
    
    for (const [name, queue] of Object.entries(queues)) {
      try {
        await queue.clean(0, 'completed');
        results[name] = { success: true };
      } catch (error) {
        results[name] = { success: false, error: error.message };
      }
    }
    
    return results;
  }
  
  /**
   * Pause queue processing
   * @public
   */
  async pauseQueue(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    
    await queue.pause();
    
    this.emit('queue:paused', { queue: queueName });
    
    return { success: true, queue: queueName, status: 'paused' };
  }
  
  /**
   * Resume queue processing
   * @public
   */
  async resumeQueue(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    
    await queue.resume();
    
    this.emit('queue:resumed', { queue: queueName });
    
    return { success: true, queue: queueName, status: 'active' };
  }
  
  /**
   * Get failed jobs for retry
   * @public
   */
  async getFailedJobs(queueName, limit = 10) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    
    const failed = await queue.getFailed(0, limit);
    
    return failed.map(job => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.finishedOn
    }));
  }
  
  /**
   * Retry failed jobs
   * @public
   */
  async retryFailedJobs(queueName, jobIds = null) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    
    const failed = await queue.getFailed();
    const jobsToRetry = jobIds 
      ? failed.filter(job => jobIds.includes(job.id))
      : failed;
    
    const results = [];
    
    for (const job of jobsToRetry) {
      try {
        await job.retry();
        results.push({ jobId: job.id, success: true });
      } catch (error) {
        results.push({ jobId: job.id, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Stop monitoring
   * @public
   */
  stopMonitoring() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
    
    this.emit('monitoring:stopped');
  }
}

module.exports = WhatsAppQueueMonitor;