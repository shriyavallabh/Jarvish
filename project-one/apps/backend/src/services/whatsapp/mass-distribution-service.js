/**
 * WhatsApp Mass Distribution Service
 * Central service for sending the same content to all active subscribers at 06:00 IST
 * Handles 150-2000 concurrent recipients with 99% SLA
 */

const Bull = require('bull');
const moment = require('moment-timezone');
const EventEmitter = require('events');
const WhatsAppCloudAPIClient = require('./cloud-api-client');
const WhatsAppTemplateManager = require('./template-manager');

class WhatsAppMassDistributionService extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      redisUrl: config.redisUrl || 'redis://localhost:6379',
      timezone: 'Asia/Kolkata',
      deliveryTime: '06:00:00',
      deliveryWindow: 300000, // 5 minutes in ms
      batchSize: 50, // Messages per batch
      batchDelay: 500, // Delay between batches in ms
      maxConcurrentBatches: 10,
      maxRetries: 3,
      slaTarget: 0.99, // 99% SLA
      phoneNumbers: config.phoneNumbers || [], // Array of business phone numbers
      ...config
    };
    
    // Initialize core components
    this.initializeQueues();
    this.initializePhoneNumbers();
    this.templateManager = new WhatsAppTemplateManager(config);
    
    // Distribution state
    this.currentDistribution = null;
    this.distributionMetrics = this.createEmptyMetrics();
    
    // Phone number pool management
    this.phoneNumberPool = new Map();
    this.currentPhoneIndex = 0;
    
    // Setup automated scheduling
    this.setupDailyScheduler();
    this.setupQueueProcessors();
  }
  
  /**
   * Initialize message queues
   * @private
   */
  initializeQueues() {
    this.distributionQueue = new Bull('mass-distribution', this.config.redisUrl);
    this.batchQueue = new Bull('batch-processing', this.config.redisUrl);
    this.retryQueue = new Bull('distribution-retry', this.config.redisUrl);
    this.analyticsQueue = new Bull('distribution-analytics', this.config.redisUrl);
  }
  
  /**
   * Initialize phone number pool with load balancing
   * @private
   */
  initializePhoneNumbers() {
    this.config.phoneNumbers.forEach((phoneConfig, index) => {
      const client = new WhatsAppCloudAPIClient({
        ...phoneConfig,
        phoneNumberId: phoneConfig.phoneNumberId,
        accessToken: this.config.accessToken,
        businessId: this.config.businessId
      });
      
      this.phoneNumberPool.set(`phone_${index}`, {
        id: phoneConfig.phoneNumberId,
        displayNumber: phoneConfig.displayNumber,
        client,
        status: 'active',
        quality: 'HIGH',
        dailyLimit: 100000,
        currentUsage: 0,
        messagesPerSecond: 80,
        lastUsed: null,
        metrics: {
          sent: 0,
          delivered: 0,
          failed: 0,
          blocked: 0
        }
      });
      
      // Monitor quality degradation
      client.on('quality:degraded', (data) => {
        this.handlePhoneQualityDegradation(`phone_${index}`, data);
      });
      
      // Track delivery status
      client.on('message:delivered', (data) => {
        this.updateDeliveryMetrics('delivered', data);
      });
      
      client.on('message:failed', (data) => {
        this.updateDeliveryMetrics('failed', data);
      });
    });
  }
  
  /**
   * Schedule daily distribution at 06:00 IST
   * @private
   */
  setupDailyScheduler() {
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
      
      console.log(`Next mass distribution scheduled for: ${nextRun.format('YYYY-MM-DD HH:mm:ss')} IST`);
      console.log(`Time until distribution: ${moment.duration(delay).humanize()}`);
      
      setTimeout(async () => {
        await this.executeDailyDistribution();
        scheduleNext(); // Schedule next day
      }, delay);
    };
    
    scheduleNext();
  }
  
  /**
   * Execute daily mass distribution
   * @public
   */
  async executeDailyDistribution() {
    console.log('Starting 06:00 IST mass distribution...');
    
    try {
      // Reset metrics
      this.distributionMetrics = this.createEmptyMetrics();
      this.distributionMetrics.startTime = new Date();
      
      // Pre-distribution checks
      const preCheck = await this.performPreDistributionChecks();
      if (!preCheck.ready) {
        this.emit('distribution:aborted', preCheck);
        return;
      }
      
      // Get today's content
      const content = await this.getTodaysContent();
      if (!content) {
        this.emit('distribution:no_content', { date: moment().format('YYYY-MM-DD') });
        return;
      }
      
      // Get active subscribers
      const subscribers = await this.getActiveSubscribers();
      if (subscribers.length === 0) {
        this.emit('distribution:no_subscribers');
        return;
      }
      
      console.log(`Distributing to ${subscribers.length} subscribers`);
      
      // Create distribution job
      this.currentDistribution = {
        id: `dist_${Date.now()}`,
        date: moment().format('YYYY-MM-DD'),
        content,
        totalRecipients: subscribers.length,
        status: 'in_progress',
        startedAt: new Date()
      };
      
      this.distributionMetrics.totalRecipients = subscribers.length;
      
      // Create batches for efficient processing
      const batches = this.createBatches(subscribers, content);
      
      // Queue all batches with staggered delays
      await this.queueBatches(batches);
      
      // Start monitoring SLA
      this.startSLAMonitoring();
      
      this.emit('distribution:started', {
        distributionId: this.currentDistribution.id,
        totalRecipients: subscribers.length,
        totalBatches: batches.length,
        estimatedCompletion: new Date(Date.now() + this.config.deliveryWindow)
      });
      
    } catch (error) {
      console.error('Distribution failed:', error);
      this.emit('distribution:error', { error: error.message });
    }
  }
  
  /**
   * Perform pre-distribution health checks
   * @private
   */
  async performPreDistributionChecks() {
    const checks = {
      ready: true,
      issues: [],
      phoneNumbers: {},
      templates: {},
      content: {}
    };
    
    // Check phone number health
    for (const [id, phone] of this.phoneNumberPool) {
      try {
        const metrics = await phone.client.getQualityMetrics();
        checks.phoneNumbers[id] = {
          quality: metrics.quality,
          status: metrics.status,
          healthy: metrics.quality !== 'FLAGGED' && metrics.status === 'CONNECTED'
        };
        
        if (!checks.phoneNumbers[id].healthy) {
          checks.issues.push(`Phone ${id} unhealthy: ${metrics.quality}`);
        }
      } catch (error) {
        checks.phoneNumbers[id] = { healthy: false, error: error.message };
        checks.issues.push(`Phone ${id} check failed: ${error.message}`);
      }
    }
    
    // Check template availability
    const requiredTemplates = ['daily_market_update', 'daily_insight'];
    for (const templateName of requiredTemplates) {
      const template = this.templateManager.getBestTemplate(templateName);
      checks.templates[templateName] = template !== null;
      
      if (!template) {
        checks.issues.push(`Template ${templateName} not available`);
      }
    }
    
    // Check if we have at least one healthy phone number
    const healthyPhones = Object.values(checks.phoneNumbers).filter(p => p.healthy);
    if (healthyPhones.length === 0) {
      checks.ready = false;
      checks.issues.push('No healthy phone numbers available');
    }
    
    // Check Redis connectivity
    try {
      await this.distributionQueue.isReady();
      checks.redis = true;
    } catch (error) {
      checks.redis = false;
      checks.ready = false;
      checks.issues.push('Redis connection failed');
    }
    
    return checks;
  }
  
  /**
   * Get today's approved content for distribution
   * @private
   */
  async getTodaysContent() {
    // This would fetch from your database
    // For now, returning mock content
    return {
      id: `content_${Date.now()}`,
      type: 'daily_market_update',
      date: moment().format('YYYY-MM-DD'),
      headline: 'Market Update',
      body: `Good morning! Here's your market update for ${moment().format('DD MMM YYYY')}:\n\n📈 Sensex: +0.5%\n📊 Nifty: +0.6%\n💹 Top Gainer: HDFC Bank (+2.3%)\n\nDetailed analysis available in the app.`,
      mediaUrl: null, // Optional image/video
      language: 'en_US',
      approved: true,
      approvedBy: 'admin',
      approvedAt: new Date()
    };
  }
  
  /**
   * Get list of active subscribers
   * @private
   */
  async getActiveSubscribers() {
    // This would fetch from your database
    // Mock implementation for 150-2000 subscribers
    const subscriberCount = 150; // Start with 150, scale to 2000
    
    return Array.from({ length: subscriberCount }, (_, i) => ({
      id: `sub_${i + 1}`,
      phoneNumber: `91999999${String(i).padStart(4, '0')}`,
      name: `Subscriber ${i + 1}`,
      language: i % 3 === 0 ? 'hi_IN' : 'en_US',
      tier: i < 20 ? 'PREMIUM' : i < 50 ? 'PRO' : 'BASIC',
      status: 'active',
      subscribedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      preferences: {
        deliveryTime: '06:00',
        contentTypes: ['market_update', 'stock_tips']
      }
    }));
  }
  
  /**
   * Create message batches for efficient processing
   * @private
   */
  createBatches(subscribers, content) {
    const batches = [];
    const batchSize = this.config.batchSize;
    
    // Sort subscribers by tier (PREMIUM first)
    const sortedSubscribers = subscribers.sort((a, b) => {
      const tierOrder = { PREMIUM: 0, PRO: 1, BASIC: 2 };
      return (tierOrder[a.tier] || 2) - (tierOrder[b.tier] || 2);
    });
    
    for (let i = 0; i < sortedSubscribers.length; i += batchSize) {
      const batchSubscribers = sortedSubscribers.slice(i, i + batchSize);
      
      batches.push({
        id: `batch_${Date.now()}_${i / batchSize}`,
        batchNumber: Math.floor(i / batchSize) + 1,
        content,
        subscribers: batchSubscribers,
        priority: batchSubscribers[0].tier === 'PREMIUM' ? 'high' : 'normal',
        createdAt: new Date()
      });
    }
    
    return batches;
  }
  
  /**
   * Queue batches with staggered delays
   * @private
   */
  async queueBatches(batches) {
    const promises = [];
    
    batches.forEach((batch, index) => {
      // Calculate delay to spread load across delivery window
      const delay = index * this.config.batchDelay;
      
      const promise = this.batchQueue.add(
        'process_batch',
        batch,
        {
          delay,
          attempts: this.config.maxRetries,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          priority: batch.priority === 'high' ? 1 : 0
        }
      );
      
      promises.push(promise);
    });
    
    await Promise.all(promises);
    this.distributionMetrics.batchesQueued = batches.length;
  }
  
  /**
   * Setup queue processors
   * @private
   */
  setupQueueProcessors() {
    // Batch processor
    this.batchQueue.process('process_batch', this.config.maxConcurrentBatches, async (job) => {
      return this.processBatch(job.data);
    });
    
    // Retry processor
    this.retryQueue.process(5, async (job) => {
      return this.processRetry(job.data);
    });
    
    // Event handlers
    this.batchQueue.on('completed', (job, result) => {
      this.distributionMetrics.batchesCompleted++;
      this.emit('batch:completed', { batchId: job.data.id, result });
    });
    
    this.batchQueue.on('failed', (job, error) => {
      this.distributionMetrics.batchesFailed++;
      this.emit('batch:failed', { batchId: job.data.id, error: error.message });
    });
  }
  
  /**
   * Process a batch of messages
   * @private
   */
  async processBatch(batch) {
    const results = {
      batchId: batch.id,
      successful: [],
      failed: [],
      startedAt: new Date()
    };
    
    // Select phone number for this batch
    const phone = this.selectPhoneNumber();
    if (!phone) {
      throw new Error('No available phone numbers');
    }
    
    // Get appropriate template
    const template = this.templateManager.getBestTemplate(
      batch.content.type,
      batch.subscribers[0].language
    );
    
    if (!template) {
      throw new Error('No approved template available');
    }
    
    // Send to each subscriber in batch
    for (const subscriber of batch.subscribers) {
      try {
        const result = await this.sendToSubscriber(
          phone,
          subscriber,
          batch.content,
          template
        );
        
        if (result.success) {
          results.successful.push({
            subscriberId: subscriber.id,
            messageId: result.messageId
          });
          this.distributionMetrics.sent++;
        } else {
          throw new Error(result.error?.message || 'Send failed');
        }
      } catch (error) {
        results.failed.push({
          subscriberId: subscriber.id,
          error: error.message
        });
        
        // Queue for retry
        await this.queueRetry(subscriber, batch.content, error.message);
      }
      
      // Small delay between messages to prevent bursts
      await this.sleep(50);
    }
    
    results.completedAt = new Date();
    results.duration = results.completedAt - results.startedAt;
    
    return results;
  }
  
  /**
   * Send message to individual subscriber
   * @private
   */
  async sendToSubscriber(phone, subscriber, content, template) {
    try {
      const result = await phone.client.sendTemplateMessage({
        to: subscriber.phoneNumber,
        templateName: template.name,
        languageCode: subscriber.language || 'en_US',
        components: {
          body: [
            subscriber.name,
            moment().format('DD MMM YYYY'),
            content.body
          ]
        },
        mediaId: content.mediaId || null
      });
      
      // Update phone usage
      phone.currentUsage++;
      phone.lastUsed = new Date();
      phone.metrics.sent++;
      
      // Track delivery
      if (result.success) {
        this.trackSuccessfulDelivery(subscriber.id, result.messageId);
      }
      
      return result;
    } catch (error) {
      phone.metrics.failed++;
      throw error;
    }
  }
  
  /**
   * Select best available phone number using round-robin with health checks
   * @private
   */
  selectPhoneNumber() {
    const phones = Array.from(this.phoneNumberPool.values())
      .filter(p => p.status === 'active' && p.quality !== 'FLAGGED');
    
    if (phones.length === 0) return null;
    
    // Round-robin selection with capacity check
    let attempts = 0;
    while (attempts < phones.length) {
      const phone = phones[this.currentPhoneIndex % phones.length];
      this.currentPhoneIndex++;
      
      // Check if phone has capacity
      if (phone.currentUsage < phone.dailyLimit * 0.9) {
        return phone;
      }
      
      attempts++;
    }
    
    // If all phones near capacity, use the one with most remaining
    return phones.reduce((best, phone) => {
      const bestRemaining = best.dailyLimit - best.currentUsage;
      const phoneRemaining = phone.dailyLimit - phone.currentUsage;
      return phoneRemaining > bestRemaining ? phone : best;
    });
  }
  
  /**
   * Queue failed message for retry
   * @private
   */
  async queueRetry(subscriber, content, error) {
    this.distributionMetrics.queued_for_retry++;
    
    await this.retryQueue.add({
      subscriber,
      content,
      error,
      attempt: 1,
      originalDistributionId: this.currentDistribution.id
    }, {
      delay: 5000, // 5 second initial delay
      attempts: this.config.maxRetries - 1,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }
  
  /**
   * Process retry attempt
   * @private
   */
  async processRetry(data) {
    const { subscriber, content, attempt } = data;
    
    // Use backup phone for retries
    const phone = this.selectPhoneNumber();
    if (!phone) {
      throw new Error('No phone numbers available for retry');
    }
    
    const template = this.templateManager.getBestTemplate(content.type, subscriber.language);
    
    try {
      const result = await this.sendToSubscriber(phone, subscriber, content, template);
      
      if (result.success) {
        this.distributionMetrics.retry_successful++;
        this.distributionMetrics.sent++;
        return result;
      }
      
      throw new Error(result.error?.message || 'Retry failed');
    } catch (error) {
      this.distributionMetrics.retry_failed++;
      
      if (attempt >= this.config.maxRetries) {
        this.distributionMetrics.failed++;
        this.recordDeliveryFailure(subscriber.id, error.message);
      }
      
      throw error;
    }
  }
  
  /**
   * Handle phone quality degradation
   * @private
   */
  handlePhoneQualityDegradation(phoneId, data) {
    const phone = this.phoneNumberPool.get(phoneId);
    if (!phone) return;
    
    phone.quality = data.quality;
    
    if (data.quality === 'FLAGGED') {
      phone.status = 'disabled';
      this.emit('phone:disabled', { phoneId, reason: 'quality_flagged' });
      
      // Check if we have enough active phones
      const activePhones = Array.from(this.phoneNumberPool.values())
        .filter(p => p.status === 'active');
      
      if (activePhones.length === 0) {
        this.emit('critical:no_phones_available');
      }
    } else if (data.quality === 'LOW') {
      // Reduce capacity for low quality phones
      phone.dailyLimit = Math.floor(phone.dailyLimit * 0.5);
      phone.messagesPerSecond = 20;
      this.emit('phone:capacity_reduced', { phoneId, newLimit: phone.dailyLimit });
    }
  }
  
  /**
   * Start SLA monitoring
   * @private
   */
  startSLAMonitoring() {
    const monitoringInterval = setInterval(() => {
      const elapsed = Date.now() - this.distributionMetrics.startTime;
      
      if (elapsed > this.config.deliveryWindow) {
        clearInterval(monitoringInterval);
        this.finalizeSLA();
        return;
      }
      
      const currentSLA = this.calculateCurrentSLA();
      
      if (currentSLA < this.config.slaTarget) {
        this.emit('sla:at_risk', {
          current: currentSLA,
          target: this.config.slaTarget,
          sent: this.distributionMetrics.sent,
          total: this.distributionMetrics.totalRecipients
        });
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Calculate current SLA
   * @private
   */
  calculateCurrentSLA() {
    if (this.distributionMetrics.totalRecipients === 0) return 1;
    
    const delivered = this.distributionMetrics.sent + this.distributionMetrics.delivered;
    return delivered / this.distributionMetrics.totalRecipients;
  }
  
  /**
   * Finalize SLA calculation
   * @private
   */
  finalizeSLA() {
    this.distributionMetrics.endTime = new Date();
    
    const finalSLA = this.calculateCurrentSLA();
    const report = {
      distributionId: this.currentDistribution.id,
      date: this.currentDistribution.date,
      achieved: finalSLA,
      target: this.config.slaTarget,
      success: finalSLA >= this.config.slaTarget,
      metrics: {
        total: this.distributionMetrics.totalRecipients,
        sent: this.distributionMetrics.sent,
        delivered: this.distributionMetrics.delivered,
        failed: this.distributionMetrics.failed,
        retry_successful: this.distributionMetrics.retry_successful,
        retry_failed: this.distributionMetrics.retry_failed
      },
      duration: this.distributionMetrics.endTime - this.distributionMetrics.startTime,
      phoneUsage: this.getPhoneUsageReport()
    };
    
    console.log('Distribution SLA Report:', report);
    this.emit('distribution:completed', report);
    
    // Store report
    this.storeDistributionReport(report);
    
    // Mark distribution as complete
    if (this.currentDistribution) {
      this.currentDistribution.status = 'completed';
      this.currentDistribution.completedAt = new Date();
    }
  }
  
  /**
   * Get phone usage report
   * @private
   */
  getPhoneUsageReport() {
    const report = [];
    
    for (const [id, phone] of this.phoneNumberPool) {
      report.push({
        phoneId: id,
        displayNumber: phone.displayNumber,
        quality: phone.quality,
        status: phone.status,
        usage: `${phone.currentUsage}/${phone.dailyLimit}`,
        metrics: phone.metrics
      });
    }
    
    return report;
  }
  
  /**
   * Track successful delivery
   * @private
   */
  trackSuccessfulDelivery(subscriberId, messageId) {
    // This would update your database
    this.emit('delivery:success', {
      subscriberId,
      messageId,
      timestamp: new Date()
    });
  }
  
  /**
   * Record delivery failure
   * @private
   */
  recordDeliveryFailure(subscriberId, error) {
    // This would update your database
    this.emit('delivery:failure', {
      subscriberId,
      error,
      timestamp: new Date()
    });
  }
  
  /**
   * Update delivery metrics from webhook
   * @private
   */
  updateDeliveryMetrics(status, data) {
    if (status === 'delivered') {
      this.distributionMetrics.delivered++;
    } else if (status === 'failed') {
      this.distributionMetrics.failed++;
    }
  }
  
  /**
   * Store distribution report
   * @private
   */
  async storeDistributionReport(report) {
    // This would store in your database
    await this.analyticsQueue.add('store_report', report);
  }
  
  /**
   * Create empty metrics object
   * @private
   */
  createEmptyMetrics() {
    return {
      totalRecipients: 0,
      batchesQueued: 0,
      batchesCompleted: 0,
      batchesFailed: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      queued_for_retry: 0,
      retry_successful: 0,
      retry_failed: 0,
      startTime: null,
      endTime: null
    };
  }
  
  /**
   * Sleep utility
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Manually trigger distribution (for testing)
   * @public
   */
  async triggerDistribution() {
    console.log('Manually triggering mass distribution...');
    return this.executeDailyDistribution();
  }
  
  /**
   * Get current distribution status
   * @public
   */
  getDistributionStatus() {
    return {
      current: this.currentDistribution,
      metrics: this.distributionMetrics,
      sla: this.calculateCurrentSLA(),
      phoneStatus: this.getPhoneUsageReport()
    };
  }
  
  /**
   * Schedule a one-time distribution
   * @public
   */
  async scheduleDistribution(content, scheduledTime, recipients = 'all') {
    const distribution = {
      id: `scheduled_${Date.now()}`,
      content,
      scheduledTime,
      recipients,
      status: 'scheduled'
    };
    
    const delay = new Date(scheduledTime) - Date.now();
    
    if (delay < 0) {
      throw new Error('Scheduled time must be in the future');
    }
    
    await this.distributionQueue.add('scheduled_distribution', distribution, {
      delay
    });
    
    this.emit('distribution:scheduled', distribution);
    
    return distribution;
  }
}

module.exports = WhatsAppMassDistributionService;