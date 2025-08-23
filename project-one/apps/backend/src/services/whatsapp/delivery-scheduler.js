/**
 * WhatsApp Delivery Scheduler
 * Handles 06:00 IST daily content delivery with 99% SLA
 * Implements fan-out strategy with jitter for concurrent message delivery
 */

const Bull = require('bull');
const moment = require('moment-timezone');
const EventEmitter = require('events');
const WhatsAppCloudAPIClient = require('./cloud-api-client');

class WhatsAppDeliveryScheduler extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      redisUrl: config.redisUrl || 'redis://localhost:6379',
      timezone: 'Asia/Kolkata',
      deliveryTime: '06:00:00',
      deliveryWindow: 300000, // 5 minutes in ms
      jitterRange: 20, // ms between messages
      concurrency: 50, // parallel sends
      maxRetries: 3,
      slaTarget: 0.99, // 99% SLA
      ...config
    };
    
    // Initialize queues
    this.deliveryQueue = new Bull('whatsapp-delivery', this.config.redisUrl);
    this.retryQueue = new Bull('whatsapp-retry', this.config.redisUrl);
    this.priorityQueue = new Bull('whatsapp-priority', this.config.redisUrl);
    
    // Initialize WhatsApp clients for multi-number strategy
    this.clients = new Map();
    this.initializeClients();
    
    // Delivery metrics
    this.metrics = {
      scheduled: 0,
      queued: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      retrying: 0,
      startTime: null,
      endTime: null
    };
    
    // SLA monitoring
    this.slaMonitor = {
      windowStart: null,
      windowEnd: null,
      targetDeliveries: 0,
      actualDeliveries: 0,
      violations: []
    };
    
    this.setupQueueProcessors();
    this.setupScheduler();
  }
  
  /**
   * Initialize WhatsApp API clients for multi-number strategy
   * @private
   */
  initializeClients() {
    // Primary numbers
    if (this.config.primaryNumbers) {
      this.config.primaryNumbers.forEach((numberConfig, index) => {
        const client = new WhatsAppCloudAPIClient(numberConfig);
        this.clients.set(`primary_${index}`, {
          client,
          config: numberConfig,
          quality: 'HIGH',
          capacity: 1000,
          currentLoad: 0,
          status: 'active'
        });
        
        // Monitor quality changes
        client.on('quality:degraded', (data) => {
          this.handleQualityDegradation(`primary_${index}`, data);
        });
      });
    }
    
    // Backup numbers
    if (this.config.backupNumbers) {
      this.config.backupNumbers.forEach((numberConfig, index) => {
        const client = new WhatsAppCloudAPIClient(numberConfig);
        this.clients.set(`backup_${index}`, {
          client,
          config: numberConfig,
          quality: 'HIGH',
          capacity: 1000,
          currentLoad: 0,
          status: 'standby'
        });
      });
    }
  }
  
  /**
   * Setup queue processors
   * @private
   */
  setupQueueProcessors() {
    // Main delivery queue processor
    this.deliveryQueue.process(this.config.concurrency, async (job) => {
      return this.processDelivery(job);
    });
    
    // Retry queue processor
    this.retryQueue.process(10, async (job) => {
      return this.processRetry(job);
    });
    
    // Priority queue for critical messages
    this.priorityQueue.process(20, async (job) => {
      return this.processPriorityDelivery(job);
    });
    
    // Queue event handlers
    this.deliveryQueue.on('completed', (job, result) => {
      this.metrics.delivered++;
      this.updateSLAMetrics('delivered');
      this.emit('delivery:completed', { jobId: job.id, result });
    });
    
    this.deliveryQueue.on('failed', (job, err) => {
      this.handleDeliveryFailure(job, err);
    });
  }
  
  /**
   * Setup daily scheduler for 06:00 IST
   * @private
   */
  setupScheduler() {
    // Calculate next 06:00 IST
    const scheduleNext = () => {
      const now = moment().tz(this.config.timezone);
      let nextRun = moment.tz(this.config.timezone)
        .hour(6)
        .minute(0)
        .second(0)
        .millisecond(0);
      
      // If it's past 06:00 today, schedule for tomorrow
      if (now.isAfter(nextRun)) {
        nextRun.add(1, 'day');
      }
      
      const delay = nextRun.diff(now);
      
      console.log(`Next delivery scheduled for: ${nextRun.format('YYYY-MM-DD HH:mm:ss')} IST`);
      console.log(`Time until next delivery: ${moment.duration(delay).humanize()}`);
      
      // Schedule the delivery
      setTimeout(() => {
        this.executeDelivery();
        scheduleNext(); // Schedule next day
      }, delay);
    };
    
    scheduleNext();
  }
  
  /**
   * Execute daily delivery at 06:00 IST
   * @public
   */
  async executeDelivery() {
    console.log('Starting 06:00 IST delivery cycle...');
    
    // Reset metrics
    this.resetMetrics();
    this.metrics.startTime = new Date();
    
    // Set SLA window
    this.slaMonitor.windowStart = new Date();
    this.slaMonitor.windowEnd = new Date(Date.now() + this.config.deliveryWindow);
    
    // Pre-delivery health check
    const healthStatus = await this.performHealthCheck();
    if (!healthStatus.healthy) {
      this.emit('delivery:health_check_failed', healthStatus);
      return;
    }
    
    // Get advisors for delivery
    const advisors = await this.getAdvisorsForDelivery();
    this.metrics.scheduled = advisors.length;
    this.slaMonitor.targetDeliveries = advisors.length;
    
    console.log(`Scheduling delivery for ${advisors.length} advisors`);
    
    // Fan-out with jitter
    const jobs = [];
    advisors.forEach((advisor, index) => {
      const jitter = this.calculateJitter(index);
      const job = this.scheduleAdvisorDelivery(advisor, jitter);
      jobs.push(job);
    });
    
    // Wait for all jobs to be queued
    await Promise.all(jobs);
    this.metrics.queued = jobs.length;
    
    // Start SLA monitoring
    this.startSLAMonitoring();
    
    this.emit('delivery:started', {
      totalAdvisors: advisors.length,
      estimatedCompletion: new Date(Date.now() + this.config.deliveryWindow)
    });
  }
  
  /**
   * Schedule delivery for individual advisor
   * @private
   */
  async scheduleAdvisorDelivery(advisor, delay) {
    const jobData = {
      advisorId: advisor.id,
      phoneNumber: advisor.phoneNumber,
      language: advisor.preferredLanguage || 'en_US',
      tier: advisor.tier || 'BASIC',
      content: advisor.todayContent,
      templateName: this.getTemplateForAdvisor(advisor),
      scheduledTime: new Date(Date.now() + delay),
      attempt: 1
    };
    
    // Add to appropriate queue based on tier
    if (advisor.tier === 'PRO' || advisor.tier === 'PREMIUM') {
      return this.priorityQueue.add(jobData, {
        delay,
        attempts: this.config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
    } else {
      return this.deliveryQueue.add(jobData, {
        delay,
        attempts: this.config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
    }
  }
  
  /**
   * Process message delivery
   * @private
   */
  async processDelivery(job) {
    const { data } = job;
    
    try {
      // Select best available client
      const clientInfo = this.selectBestClient();
      if (!clientInfo) {
        throw new Error('No available WhatsApp clients');
      }
      
      // Send message
      const result = await clientInfo.client.sendTemplateMessage({
        to: data.phoneNumber,
        templateName: data.templateName,
        languageCode: data.language,
        components: {
          body: [
            data.content.advisorName,
            moment().tz(this.config.timezone).format('DD-MM-YYYY'),
            data.content.marketInsight || 'Market insight not available'
          ]
        },
        mediaId: data.content.mediaId || null
      });
      
      if (result.success) {
        this.metrics.sent++;
        clientInfo.currentLoad++;
        
        // Track delivery for SLA
        this.trackDeliveryTime(data.advisorId);
        
        return {
          success: true,
          messageId: result.messageId,
          advisorId: data.advisorId,
          deliveredAt: new Date()
        };
      } else {
        throw new Error(result.error?.message || 'Delivery failed');
      }
    } catch (error) {
      // Log error and prepare for retry
      console.error(`Delivery failed for advisor ${data.advisorId}:`, error.message);
      
      if (data.attempt < this.config.maxRetries) {
        // Schedule retry
        await this.scheduleRetry(data);
      } else {
        // Max retries reached
        this.metrics.failed++;
        this.recordSLAViolation(data.advisorId, error.message);
      }
      
      throw error;
    }
  }
  
  /**
   * Process retry delivery
   * @private
   */
  async processRetry(job) {
    const { data } = job;
    data.attempt++;
    
    this.metrics.retrying++;
    
    // Use backup number for retries if available
    const clientInfo = this.selectBackupClient() || this.selectBestClient();
    
    if (!clientInfo) {
      throw new Error('No available clients for retry');
    }
    
    try {
      const result = await clientInfo.client.sendTemplateMessage({
        to: data.phoneNumber,
        templateName: data.templateName,
        languageCode: data.language,
        components: {
          body: [
            data.content.advisorName,
            moment().tz(this.config.timezone).format('DD-MM-YYYY'),
            data.content.marketInsight || 'Market insight not available'
          ]
        },
        mediaId: data.content.mediaId || null
      });
      
      if (result.success) {
        this.metrics.retrying--;
        this.metrics.delivered++;
        return result;
      }
      
      throw new Error(result.error?.message || 'Retry failed');
    } catch (error) {
      this.metrics.retrying--;
      
      if (data.attempt < this.config.maxRetries) {
        await this.scheduleRetry(data);
      } else {
        this.metrics.failed++;
        this.recordSLAViolation(data.advisorId, error.message);
      }
      
      throw error;
    }
  }
  
  /**
   * Process priority delivery for Pro/Premium advisors
   * @private
   */
  async processPriorityDelivery(job) {
    // Priority deliveries get first choice of clients
    const clientInfo = this.selectBestClient(true);
    
    if (!clientInfo) {
      // Fallback to regular processing
      return this.processDelivery(job);
    }
    
    return this.processDelivery(job);
  }
  
  /**
   * Select best available client based on quality and load
   * @private
   */
  selectBestClient(isPriority = false) {
    let bestClient = null;
    let bestScore = -1;
    
    for (const [id, info] of this.clients) {
      if (info.status !== 'active') continue;
      
      // Calculate score based on quality and available capacity
      const qualityScore = this.getQualityScore(info.quality);
      const loadScore = (info.capacity - info.currentLoad) / info.capacity;
      const score = (qualityScore * 0.7) + (loadScore * 0.3);
      
      // Priority messages get preference for high-quality numbers
      if (isPriority && info.quality === 'HIGH') {
        score *= 1.5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestClient = info;
      }
    }
    
    return bestClient;
  }
  
  /**
   * Select backup client for retries
   * @private
   */
  selectBackupClient() {
    for (const [id, info] of this.clients) {
      if (id.startsWith('backup_') && info.status === 'standby') {
        // Activate backup
        info.status = 'active';
        this.emit('backup:activated', { id, reason: 'retry_needed' });
        return info;
      }
    }
    return null;
  }
  
  /**
   * Get quality score for client selection
   * @private
   */
  getQualityScore(quality) {
    const scores = {
      HIGH: 1.0,
      MEDIUM: 0.6,
      LOW: 0.3,
      FLAGGED: 0
    };
    return scores[quality] || 0;
  }
  
  /**
   * Calculate jitter for message spacing
   * @private
   */
  calculateJitter(index) {
    // Distribute messages across the delivery window
    const baseDelay = (index * this.config.jitterRange) % this.config.deliveryWindow;
    const randomJitter = Math.random() * this.config.jitterRange;
    return Math.floor(baseDelay + randomJitter);
  }
  
  /**
   * Perform pre-delivery health check
   * @private
   */
  async performHealthCheck() {
    const checks = {
      healthy: true,
      issues: [],
      clients: {},
      templates: {}
    };
    
    // Check each client
    for (const [id, info] of this.clients) {
      try {
        const metrics = await info.client.getQualityMetrics();
        checks.clients[id] = {
          quality: metrics.quality,
          status: metrics.status,
          healthy: metrics.quality !== 'FLAGGED' && metrics.status === 'CONNECTED'
        };
        
        if (!checks.clients[id].healthy) {
          checks.healthy = false;
          checks.issues.push(`Client ${id} unhealthy: ${metrics.quality}/${metrics.status}`);
        }
      } catch (error) {
        checks.clients[id] = { healthy: false, error: error.message };
        checks.issues.push(`Client ${id} health check failed: ${error.message}`);
      }
    }
    
    // Check template availability
    // This would check with template manager
    checks.templates.available = true;
    
    return checks;
  }
  
  /**
   * Handle quality degradation for a client
   * @private
   */
  handleQualityDegradation(clientId, data) {
    const clientInfo = this.clients.get(clientId);
    if (!clientInfo) return;
    
    clientInfo.quality = data.quality;
    
    if (data.quality === 'FLAGGED') {
      // Immediately deactivate flagged number
      clientInfo.status = 'disabled';
      this.emit('client:disabled', { id: clientId, reason: 'quality_flagged' });
      
      // Activate backup if available
      const backup = this.selectBackupClient();
      if (backup) {
        console.log(`Activated backup client due to ${clientId} being flagged`);
      }
    } else if (data.quality === 'LOW') {
      // Reduce capacity for low quality numbers
      clientInfo.capacity = Math.floor(clientInfo.capacity * 0.5);
      this.emit('client:capacity_reduced', { id: clientId, newCapacity: clientInfo.capacity });
    }
  }
  
  /**
   * Schedule retry for failed delivery
   * @private
   */
  async scheduleRetry(data) {
    const backoffDelay = Math.pow(2, data.attempt) * 1000; // Exponential backoff
    
    await this.retryQueue.add(data, {
      delay: backoffDelay,
      attempts: 1
    });
    
    this.emit('delivery:retry_scheduled', {
      advisorId: data.advisorId,
      attempt: data.attempt + 1,
      retryIn: backoffDelay
    });
  }
  
  /**
   * Handle delivery failure
   * @private
   */
  handleDeliveryFailure(job, error) {
    this.metrics.failed++;
    
    // Check if SLA is at risk
    const slaStatus = this.calculateSLA();
    if (slaStatus < this.config.slaTarget) {
      this.emit('sla:at_risk', {
        current: slaStatus,
        target: this.config.slaTarget,
        failed: this.metrics.failed,
        total: this.metrics.scheduled
      });
    }
    
    this.emit('delivery:failed', {
      jobId: job.id,
      advisorId: job.data.advisorId,
      error: error.message,
      attempt: job.data.attempt
    });
  }
  
  /**
   * Get advisors for delivery (mock implementation)
   * @private
   */
  async getAdvisorsForDelivery() {
    // This would fetch from your database
    // Mock implementation for now
    return Array.from({ length: 150 }, (_, i) => ({
      id: `advisor_${i + 1}`,
      phoneNumber: `91999999${String(i).padStart(4, '0')}`,
      preferredLanguage: i % 3 === 0 ? 'hi_IN' : i % 3 === 1 ? 'mr_IN' : 'en_US',
      tier: i < 20 ? 'PRO' : i < 50 ? 'PREMIUM' : 'BASIC',
      todayContent: {
        advisorName: `Advisor ${i + 1}`,
        marketInsight: 'Today\'s market shows positive momentum with key sectors gaining.',
        mediaId: null
      }
    }));
  }
  
  /**
   * Get template name for advisor
   * @private
   */
  getTemplateForAdvisor(advisor) {
    // Template selection logic based on tier and content type
    if (advisor.tier === 'PRO' || advisor.tier === 'PREMIUM') {
      return 'daily_insight_pro_v1';
    }
    return 'daily_insight_v1';
  }
  
  /**
   * Start SLA monitoring
   * @private
   */
  startSLAMonitoring() {
    const monitorInterval = setInterval(() => {
      const now = new Date();
      
      // Check if we're still in delivery window
      if (now > this.slaMonitor.windowEnd) {
        clearInterval(monitorInterval);
        this.finalizeSLA();
        return;
      }
      
      // Calculate current SLA
      const currentSLA = this.calculateSLA();
      
      // Alert if SLA dropping
      if (currentSLA < this.config.slaTarget) {
        this.emit('sla:violation_risk', {
          current: currentSLA,
          target: this.config.slaTarget,
          timeRemaining: this.slaMonitor.windowEnd - now
        });
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Calculate current SLA
   * @private
   */
  calculateSLA() {
    if (this.metrics.scheduled === 0) return 1;
    
    const successfulDeliveries = this.metrics.delivered;
    return successfulDeliveries / this.metrics.scheduled;
  }
  
  /**
   * Track delivery time for SLA
   * @private
   */
  trackDeliveryTime(advisorId) {
    const now = new Date();
    
    if (now <= this.slaMonitor.windowEnd) {
      this.slaMonitor.actualDeliveries++;
    } else {
      this.recordSLAViolation(advisorId, 'Delivered outside window');
    }
  }
  
  /**
   * Record SLA violation
   * @private
   */
  recordSLAViolation(advisorId, reason) {
    this.slaMonitor.violations.push({
      advisorId,
      reason,
      timestamp: new Date()
    });
  }
  
  /**
   * Finalize SLA calculation
   * @private
   */
  finalizeSLA() {
    this.metrics.endTime = new Date();
    
    const finalSLA = this.calculateSLA();
    const slaReport = {
      achieved: finalSLA,
      target: this.config.slaTarget,
      success: finalSLA >= this.config.slaTarget,
      scheduled: this.metrics.scheduled,
      delivered: this.metrics.delivered,
      failed: this.metrics.failed,
      violations: this.slaMonitor.violations.length,
      duration: this.metrics.endTime - this.metrics.startTime
    };
    
    console.log('SLA Report:', slaReport);
    this.emit('sla:finalized', slaReport);
    
    // Store report for analytics
    this.storeSLAReport(slaReport);
  }
  
  /**
   * Store SLA report for analytics
   * @private
   */
  async storeSLAReport(report) {
    // This would store in your database
    // Mock implementation
    console.log('Storing SLA report:', report);
  }
  
  /**
   * Reset metrics for new delivery cycle
   * @private
   */
  resetMetrics() {
    this.metrics = {
      scheduled: 0,
      queued: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      retrying: 0,
      startTime: null,
      endTime: null
    };
    
    this.slaMonitor = {
      windowStart: null,
      windowEnd: null,
      targetDeliveries: 0,
      actualDeliveries: 0,
      violations: []
    };
    
    // Reset client loads
    for (const info of this.clients.values()) {
      info.currentLoad = 0;
    }
  }
  
  /**
   * Update SLA metrics
   * @private
   */
  updateSLAMetrics(event) {
    // Real-time SLA tracking
    if (event === 'delivered') {
      const now = new Date();
      if (now <= this.slaMonitor.windowEnd) {
        this.slaMonitor.actualDeliveries++;
      }
    }
  }
  
  /**
   * Get current metrics
   * @public
   */
  getMetrics() {
    return {
      ...this.metrics,
      sla: this.calculateSLA(),
      clientStatus: Array.from(this.clients.entries()).map(([id, info]) => ({
        id,
        quality: info.quality,
        status: info.status,
        load: `${info.currentLoad}/${info.capacity}`
      }))
    };
  }
  
  /**
   * Manually trigger delivery (for testing)
   * @public
   */
  async triggerDelivery() {
    console.log('Manually triggering delivery...');
    return this.executeDelivery();
  }
}

module.exports = WhatsAppDeliveryScheduler;