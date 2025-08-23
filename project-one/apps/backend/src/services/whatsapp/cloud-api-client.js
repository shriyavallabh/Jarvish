/**
 * WhatsApp Cloud API Client
 * Handles all interactions with WhatsApp Business Cloud API
 * Implements rate limiting, retry logic, and quality monitoring
 */

const axios = require('axios');
const EventEmitter = require('events');

class WhatsAppCloudAPIClient extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken,
      businessId: config.businessId,
      apiVersion: config.apiVersion || 'v20.0',
      baseUrl: 'https://graph.facebook.com',
      ...config
    };
    
    // Rate limiting based on quality rating
    this.rateLimits = {
      HIGH: { messagesPerSecond: 80, messagesPerDay: 100000 },
      MEDIUM: { messagesPerSecond: 50, messagesPerDay: 10000 },
      LOW: { messagesPerSecond: 20, messagesPerDay: 1000 },
      FLAGGED: { messagesPerSecond: 0, messagesPerDay: 0 }
    };
    
    this.currentQuality = 'HIGH';
    this.messageQueue = [];
    this.metrics = {
      sent: 0,
      delivered: 0,
      failed: 0,
      read: 0
    };
    
    this.initializeRateLimiter();
  }
  
  /**
   * Initialize rate limiter based on current quality rating
   */
  initializeRateLimiter() {
    this.rateLimiter = {
      tokens: this.rateLimits[this.currentQuality].messagesPerSecond,
      lastRefill: Date.now(),
      interval: 1000 // 1 second
    };
  }
  
  /**
   * Send template message with parameter substitution
   * @param {Object} params Message parameters
   * @returns {Promise<Object>} API response
   */
  async sendTemplateMessage(params) {
    const {
      to,
      templateName,
      languageCode = 'en_US',
      components = [],
      mediaId = null
    } = params;
    
    // Check rate limit
    await this.checkRateLimit();
    
    // Construct message payload
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: this.buildTemplateComponents(components, mediaId)
      }
    };
    
    try {
      const response = await this.makeAPICall('POST', `/messages`, payload);
      
      this.metrics.sent++;
      this.emit('message:sent', {
        messageId: response.messages[0].id,
        to,
        templateName,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        messageId: response.messages[0].id,
        ...response
      };
    } catch (error) {
      return this.handleError(error, params);
    }
  }
  
  /**
   * Send text message (within 24-hour window)
   * @param {string} to Recipient phone number
   * @param {string} text Message text
   * @returns {Promise<Object>} API response
   */
  async sendTextMessage(to, text) {
    await this.checkRateLimit();
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    };
    
    try {
      const response = await this.makeAPICall('POST', `/messages`, payload);
      this.metrics.sent++;
      return { success: true, ...response };
    } catch (error) {
      return this.handleError(error, { to, text });
    }
  }
  
  /**
   * Upload media for use in messages
   * @param {Buffer} mediaBuffer Media file buffer
   * @param {string} mimeType MIME type of media
   * @returns {Promise<string>} Media ID
   */
  async uploadMedia(mediaBuffer, mimeType) {
    const formData = new FormData();
    formData.append('file', mediaBuffer, {
      contentType: mimeType,
      filename: `upload_${Date.now()}`
    });
    formData.append('messaging_product', 'whatsapp');
    
    try {
      const response = await this.makeAPICall('POST', `/media`, formData, {
        headers: formData.getHeaders()
      });
      return response.id;
    } catch (error) {
      throw new Error(`Media upload failed: ${error.message}`);
    }
  }
  
  /**
   * Get current quality rating and messaging limits
   * @returns {Promise<Object>} Quality metrics
   */
  async getQualityMetrics() {
    try {
      const response = await this.makeAPICall(
        'GET',
        `/${this.config.phoneNumberId}?fields=quality_rating,status,display_phone_number,verified_name`
      );
      
      this.currentQuality = response.quality_rating || 'UNKNOWN';
      this.updateRateLimits();
      
      return {
        quality: this.currentQuality,
        status: response.status,
        phoneNumber: response.display_phone_number,
        verifiedName: response.verified_name,
        limits: this.rateLimits[this.currentQuality]
      };
    } catch (error) {
      console.error('Failed to fetch quality metrics:', error);
      return { quality: 'UNKNOWN', error: error.message };
    }
  }
  
  /**
   * Build template components with parameter substitution
   * @private
   */
  buildTemplateComponents(components, mediaId) {
    const result = [];
    
    // Add header with media if provided
    if (mediaId) {
      result.push({
        type: 'header',
        parameters: [{
          type: 'image',
          image: { id: mediaId }
        }]
      });
    }
    
    // Add body parameters
    if (components.body && components.body.length > 0) {
      result.push({
        type: 'body',
        parameters: components.body.map(text => ({
          type: 'text',
          text
        }))
      });
    }
    
    // Add button parameters if any
    if (components.buttons && components.buttons.length > 0) {
      components.buttons.forEach((button, index) => {
        result.push({
          type: 'button',
          sub_type: button.type || 'quick_reply',
          index,
          parameters: [{
            type: button.type === 'url' ? 'text' : 'payload',
            [button.type === 'url' ? 'text' : 'payload']: button.value
          }]
        });
      });
    }
    
    return result;
  }
  
  /**
   * Format phone number to E.164 format
   * @private
   */
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }
  
  /**
   * Check and enforce rate limiting
   * @private
   */
  async checkRateLimit() {
    const now = Date.now();
    const timePassed = now - this.rateLimiter.lastRefill;
    
    // Refill tokens based on time passed
    if (timePassed >= this.rateLimiter.interval) {
      const intervalsElapsed = Math.floor(timePassed / this.rateLimiter.interval);
      this.rateLimiter.tokens = Math.min(
        this.rateLimits[this.currentQuality].messagesPerSecond,
        this.rateLimiter.tokens + intervalsElapsed * this.rateLimits[this.currentQuality].messagesPerSecond
      );
      this.rateLimiter.lastRefill = now;
    }
    
    // Wait if no tokens available
    if (this.rateLimiter.tokens <= 0) {
      const waitTime = this.rateLimiter.interval - (now - this.rateLimiter.lastRefill);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkRateLimit();
    }
    
    this.rateLimiter.tokens--;
  }
  
  /**
   * Update rate limits based on quality rating
   * @private
   */
  updateRateLimits() {
    const previousQuality = this.currentQuality;
    
    if (previousQuality !== this.currentQuality) {
      console.log(`Quality rating changed from ${previousQuality} to ${this.currentQuality}`);
      this.initializeRateLimiter();
      
      // Emit quality change event
      this.emit('quality:changed', {
        previous: previousQuality,
        current: this.currentQuality,
        limits: this.rateLimits[this.currentQuality]
      });
      
      // Trigger recovery if quality dropped
      if (this.getQualityScore(this.currentQuality) < this.getQualityScore(previousQuality)) {
        this.emit('quality:degraded', {
          quality: this.currentQuality,
          action: 'initiate_recovery'
        });
      }
    }
  }
  
  /**
   * Get numeric quality score for comparison
   * @private
   */
  getQualityScore(quality) {
    const scores = { HIGH: 3, MEDIUM: 2, LOW: 1, FLAGGED: 0, UNKNOWN: -1 };
    return scores[quality] || -1;
  }
  
  /**
   * Make API call with retry logic
   * @private
   */
  async makeAPICall(method, endpoint, data = null, options = {}, retries = 3) {
    const url = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}${endpoint}`;
    
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    if (data) {
      config.data = data;
    }
    
    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        const backoffTime = Math.pow(2, 3 - retries) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.makeAPICall(method, endpoint, data, options, retries - 1);
      }
      throw error;
    }
  }
  
  /**
   * Determine if error is retryable
   * @private
   */
  isRetryableError(error) {
    if (!error.response) return true; // Network errors
    
    const status = error.response.status;
    const errorCode = error.response.data?.error?.code;
    
    // Retry on rate limiting, server errors, or specific error codes
    return (
      status === 429 || // Rate limited
      status >= 500 || // Server errors
      errorCode === 130429 || // Rate limit hit
      errorCode === 131048 || // Temporary unavailable
      errorCode === 131056 // Message failed to send - temporary
    );
  }
  
  /**
   * Handle and classify errors
   * @private
   */
  handleError(error, context) {
    const errorInfo = {
      success: false,
      context,
      timestamp: new Date().toISOString()
    };
    
    if (error.response) {
      const { status, data } = error.response;
      errorInfo.status = status;
      errorInfo.error = data.error || { message: 'Unknown error' };
      
      // Classify error
      if (status === 429 || data.error?.code === 130429) {
        errorInfo.type = 'RATE_LIMIT';
        errorInfo.retryAfter = data.error?.error_data?.retry_after || 60;
      } else if (status === 400) {
        errorInfo.type = 'BAD_REQUEST';
      } else if (status === 401) {
        errorInfo.type = 'UNAUTHORIZED';
      } else if (status >= 500) {
        errorInfo.type = 'SERVER_ERROR';
      } else {
        errorInfo.type = 'UNKNOWN';
      }
      
      // Log specific error types
      console.error(`WhatsApp API Error [${errorInfo.type}]:`, errorInfo.error.message);
    } else {
      errorInfo.type = 'NETWORK_ERROR';
      errorInfo.error = { message: error.message };
    }
    
    this.metrics.failed++;
    this.emit('message:failed', errorInfo);
    
    return errorInfo;
  }
  
  /**
   * Process webhook notification
   * @param {Object} notification Webhook payload
   */
  processWebhook(notification) {
    const { entry } = notification;
    
    entry.forEach(item => {
      const { changes } = item;
      
      changes.forEach(change => {
        const { field, value } = change;
        
        if (field === 'messages') {
          // Process incoming messages
          value.messages?.forEach(message => {
            this.emit('message:received', {
              from: message.from,
              id: message.id,
              timestamp: message.timestamp,
              type: message.type,
              text: message.text?.body,
              context: message.context
            });
          });
          
          // Process message status updates
          value.statuses?.forEach(status => {
            this.updateMessageStatus(status);
          });
        }
      });
    });
  }
  
  /**
   * Update message status from webhook
   * @private
   */
  updateMessageStatus(status) {
    const { id, status: statusType, timestamp, recipient_id, errors } = status;
    
    switch (statusType) {
      case 'sent':
        this.emit('message:sent', { id, recipient_id, timestamp });
        break;
      case 'delivered':
        this.metrics.delivered++;
        this.emit('message:delivered', { id, recipient_id, timestamp });
        break;
      case 'read':
        this.metrics.read++;
        this.emit('message:read', { id, recipient_id, timestamp });
        break;
      case 'failed':
        this.metrics.failed++;
        this.emit('message:failed', { id, recipient_id, timestamp, errors });
        break;
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.sent > 0 
        ? ((this.metrics.delivered / this.metrics.sent) * 100).toFixed(2) + '%'
        : '0%',
      readRate: this.metrics.delivered > 0
        ? ((this.metrics.read / this.metrics.delivered) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

module.exports = WhatsAppCloudAPIClient;