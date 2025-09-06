// WhatsApp Business Cloud API Service
// Complete integration for message delivery and template management

import axios, { AxiosInstance } from 'axios';
import { whatsappConfig, whatsappEndpoints, helpers, validators } from '../config/whatsapp.config';
import { createLogger } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'image' | 'template';
  text?: { body: string };
  image?: { link: string; caption?: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
}

interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  error?: string;
}

interface TemplateResponse {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  quality_score?: {
    score: string;
    date: number;
  };
}

class WhatsAppAPIService {
  private client: AxiosInstance;
  private logger;
  private messageQueue: WhatsAppMessage[] = [];
  private isProcessing = false;
  private deliveryStats = {
    sent: 0,
    delivered: 0,
    failed: 0,
    startTime: new Date()
  };

  constructor() {
    // Initialize axios client
    this.client = axios.create({
      baseURL: `${whatsappConfig.api.baseUrl}/${whatsappConfig.api.version}`,
      headers: helpers.getHeaders(),
      timeout: 30000
    });

    // Initialize logger
    this.logger = createLogger({
      level: 'info',
      defaultMeta: { service: 'whatsapp-api' }
    });

    // Setup request/response interceptors
    this.setupInterceptors();
    
    // Start queue processor
    this.startQueueProcessor();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.logger.info('WhatsApp API Request', {
          method: config.method,
          url: config.url,
          timestamp: new Date().toISOString()
        });
        return config;
      },
      (error) => {
        this.logger.error('WhatsApp API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.logger.info('WhatsApp API Response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        this.logger.error('WhatsApp API Response Error', {
          status: error.response?.status,
          message: error.response?.data?.error?.message,
          code: error.response?.data?.error?.code
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(message: WhatsAppMessage): Promise<MessageStatus> {
    try {
      // Validate phone number
      if (!validators.isValidPhoneNumber(message.to)) {
        throw new Error(whatsappConfig.errors.INVALID_PHONE);
      }

      // Format phone number
      const formattedPhone = validators.formatPhoneNumber(message.to);
      message.to = formattedPhone;

      // Add messaging_product field
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.to,
        ...message
      };

      // Send message
      const endpoint = whatsappEndpoints.sendMessage(whatsappConfig.api.phoneNumberId);
      const response = await this.client.post(endpoint, payload);

      // Update stats
      this.deliveryStats.sent++;

      return {
        messageId: response.data.messages[0].id,
        status: 'sent',
        timestamp: new Date()
      };

    } catch (error: any) {
      this.deliveryStats.failed++;
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        this.logger.warn('Rate limit exceeded, queueing message');
        this.messageQueue.push(message);
        return {
          messageId: 'queued',
          status: 'failed',
          timestamp: new Date(),
          error: whatsappConfig.errors.RATE_LIMIT_EXCEEDED
        };
      }

      throw error;
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(params: {
    to: string;
    templateName: string;
    language?: string;
    components?: any[];
  }): Promise<MessageStatus> {
    const message: WhatsAppMessage = {
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.language || 'en' },
        components: params.components || []
      }
    };

    return this.sendMessage(message);
  }

  /**
   * Send text message (for 24-hour window)
   */
  async sendTextMessage(to: string, text: string): Promise<MessageStatus> {
    const message: WhatsAppMessage = {
      to,
      type: 'text',
      text: { body: text }
    };

    return this.sendMessage(message);
  }

  /**
   * Send image message
   */
  async sendImageMessage(params: {
    to: string;
    imageUrl: string;
    caption?: string;
  }): Promise<MessageStatus> {
    // Validate image URL
    if (!validators.isValidImageUrl(params.imageUrl)) {
      throw new Error(whatsappConfig.errors.INVALID_MEDIA);
    }

    const message: WhatsAppMessage = {
      to: params.to,
      type: 'image',
      image: {
        link: params.imageUrl,
        caption: params.caption
      }
    };

    return this.sendMessage(message);
  }

  /**
   * Upload media to WhatsApp
   */
  async uploadMedia(filePath: string): Promise<string> {
    try {
      const formData = new FormData();
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      
      formData.append('file', new Blob([fileBuffer]), fileName);
      formData.append('messaging_product', 'whatsapp');

      const endpoint = whatsappEndpoints.uploadMedia(whatsappConfig.api.phoneNumberId);
      const response = await this.client.post(endpoint, formData, {
        headers: {
          ...helpers.getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.id;
    } catch (error) {
      this.logger.error('Media upload failed', error);
      throw error;
    }
  }

  /**
   * Get media URL from media ID
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const endpoint = whatsappEndpoints.getMediaUrl(mediaId);
      const response = await this.client.get(endpoint);
      return response.data.url;
    } catch (error) {
      this.logger.error('Failed to get media URL', error);
      throw error;
    }
  }

  /**
   * Create message template
   */
  async createTemplate(params: {
    name: string;
    category: string;
    language: string;
    headerText?: string;
    bodyText: string;
    footerText?: string;
    buttons?: any[];
  }): Promise<TemplateResponse> {
    try {
      const components: any[] = [];

      // Add header component if provided
      if (params.headerText) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: params.headerText
        });
      }

      // Add body component (required)
      components.push({
        type: 'BODY',
        text: params.bodyText
      });

      // Add footer component if provided
      if (params.footerText) {
        components.push({
          type: 'FOOTER',
          text: params.footerText
        });
      }

      // Add buttons if provided
      if (params.buttons && params.buttons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: params.buttons
        });
      }

      const payload = {
        name: params.name,
        category: params.category,
        language: params.language,
        components
      };

      const endpoint = whatsappEndpoints.createTemplate(whatsappConfig.api.businessAccountId);
      const response = await this.client.post(endpoint, payload);

      return response.data;
    } catch (error) {
      this.logger.error('Template creation failed', error);
      throw error;
    }
  }

  /**
   * Get all templates
   */
  async getTemplates(): Promise<TemplateResponse[]> {
    try {
      const endpoint = whatsappEndpoints.getTemplates(whatsappConfig.api.businessAccountId);
      const response = await this.client.get(endpoint);
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch templates', error);
      throw error;
    }
  }

  /**
   * Get template by name
   */
  async getTemplateByName(name: string): Promise<TemplateResponse | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.name === name) || null;
  }

  /**
   * Check template quality score
   */
  async checkTemplateQuality(templateName: string): Promise<string> {
    const template = await this.getTemplateByName(templateName);
    if (!template) {
      throw new Error(whatsappConfig.errors.TEMPLATE_NOT_FOUND);
    }

    const qualityScore = template.quality_score?.score || 'UNKNOWN';
    
    // Pause template if quality is RED
    if (qualityScore === 'RED' && whatsappConfig.quality.pauseOnRed) {
      this.logger.warn(`Template ${templateName} has RED quality score, pausing usage`);
      // Implement template pause logic here
    }

    return qualityScore;
  }

  /**
   * Batch send messages
   */
  async batchSendMessages(messages: WhatsAppMessage[]): Promise<MessageStatus[]> {
    const results: MessageStatus[] = [];
    const batches = this.createBatches(messages, whatsappConfig.delivery.batchSize);

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(msg => this.sendMessage(msg))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            messageId: 'failed',
            status: 'failed',
            timestamp: new Date(),
            error: result.reason.message
          });
        }
      });

      // Rate limit delay between batches
      await this.delay(1000);
    }

    return results;
  }

  /**
   * Process message queue
   */
  private async startQueueProcessor(): Promise<void> {
    setInterval(async () => {
      if (this.isProcessing || this.messageQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      
      try {
        const messagesToProcess = this.messageQueue.splice(0, 10);
        await this.batchSendMessages(messagesToProcess);
      } catch (error) {
        this.logger.error('Queue processing error', error);
      } finally {
        this.isProcessing = false;
      }
    }, 5000); // Process every 5 seconds
  }

  /**
   * Register webhook
   */
  async registerWebhook(): Promise<void> {
    try {
      const endpoint = whatsappEndpoints.registerWebhook(whatsappConfig.api.phoneNumberId);
      await this.client.post(endpoint, {
        subscribed_fields: whatsappConfig.webhook.events
      });

      this.logger.info('Webhook registered successfully');
    } catch (error) {
      this.logger.error('Webhook registration failed', error);
      throw error;
    }
  }

  /**
   * Verify webhook token
   */
  verifyWebhookToken(token: string): boolean {
    return token === whatsappConfig.api.webhookVerifyToken;
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: any): Promise<void> {
    try {
      // Handle different event types
      if (event.entry?.[0]?.changes?.[0]) {
        const change = event.entry[0].changes[0];
        const value = change.value;

        switch (change.field) {
          case 'messages':
            await this.handleIncomingMessage(value);
            break;
          
          case 'message_template_status_update':
            await this.handleTemplateStatusUpdate(value);
            break;
          
          case 'quality_update':
            await this.handleQualityUpdate(value);
            break;
          
          default:
            this.logger.info('Unhandled webhook event', { field: change.field });
        }
      }
    } catch (error) {
      this.logger.error('Webhook processing error', error);
    }
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(value: any): Promise<void> {
    if (value.messages?.[0]) {
      const message = value.messages[0];
      this.logger.info('Incoming message received', {
        from: message.from,
        type: message.type,
        timestamp: message.timestamp
      });

      // Update delivery status if it's a status update
      if (value.statuses?.[0]) {
        const status = value.statuses[0];
        this.updateMessageStatus(status.id, status.status);
      }
    }
  }

  /**
   * Handle template status update
   */
  private async handleTemplateStatusUpdate(value: any): Promise<void> {
    this.logger.info('Template status update', {
      template: value.message_template_name,
      status: value.event,
      reason: value.reason
    });
  }

  /**
   * Handle quality score update
   */
  private async handleQualityUpdate(value: any): Promise<void> {
    this.logger.warn('Template quality update', {
      template: value.message_template_name,
      previousScore: value.previous_quality_score,
      newScore: value.new_quality_score
    });

    // Pause template if quality drops to RED
    if (value.new_quality_score === 'RED' && whatsappConfig.quality.pauseOnRed) {
      this.logger.error(`Template ${value.message_template_name} quality dropped to RED, pausing`);
      // Implement pause logic
    }
  }

  /**
   * Update message delivery status
   */
  private updateMessageStatus(messageId: string, status: string): void {
    if (status === 'delivered') {
      this.deliveryStats.delivered++;
    }
    
    this.logger.info('Message status updated', { messageId, status });
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats(): any {
    const runtime = (new Date().getTime() - this.deliveryStats.startTime.getTime()) / 1000;
    const deliveryRate = this.deliveryStats.sent > 0 
      ? (this.deliveryStats.delivered / this.deliveryStats.sent) * 100 
      : 0;

    return {
      ...this.deliveryStats,
      runtime: `${Math.floor(runtime)}s`,
      deliveryRate: `${deliveryRate.toFixed(2)}%`,
      queueSize: this.messageQueue.length
    };
  }

  /**
   * Helper: Create batches from array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Helper: Delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new WhatsAppAPIService();