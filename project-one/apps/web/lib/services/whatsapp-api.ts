// WhatsApp Business Cloud API Service for Next.js
// Complete integration for message delivery and template management with Supabase

import { supabaseAdmin } from '../supabase';

// Configuration
const WHATSAPP_API_VERSION = 'v21.0';
const WHATSAPP_API_URL = 'https://graph.facebook.com';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '574744175733556';
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

// Types
export interface WhatsAppMessage {
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

export interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  error?: string;
}

export interface TemplateResponse {
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

export interface SendMessageOptions {
  to: string;
  advisorId?: string;
  saveToDatabase?: boolean;
}

// Helper functions
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
};

const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  // Indian phone numbers: 10 digits or 12 with country code
  return /^(91)?[6-9]\d{9}$/.test(cleaned);
};

const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// API request helper
async function makeWhatsAppRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'POST',
  body?: any
) {
  const url = `${WHATSAPP_API_URL}/${WHATSAPP_API_VERSION}/${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `WhatsApp API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('WhatsApp API request failed:', error);
    throw error;
  }
}

// Main WhatsApp API Service
export class WhatsAppService {
  /**
   * Send a WhatsApp message
   */
  static async sendMessage(
    message: WhatsAppMessage,
    options: SendMessageOptions = {}
  ): Promise<MessageStatus> {
    try {
      // Validate and format phone number
      if (!isValidPhoneNumber(message.to)) {
        throw new Error('Invalid phone number');
      }
      
      const formattedPhone = formatPhoneNumber(message.to);
      
      // Build message payload
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: message.type,
      };

      // Add message content based on type
      if (message.type === 'text' && message.text) {
        payload.text = message.text;
      } else if (message.type === 'image' && message.image) {
        if (!isValidImageUrl(message.image.link)) {
          throw new Error('Invalid image URL');
        }
        payload.image = message.image;
      } else if (message.type === 'template' && message.template) {
        payload.template = message.template;
      } else {
        throw new Error('Invalid message type or missing content');
      }

      // Send message via WhatsApp API
      const response = await makeWhatsAppRequest(
        `${PHONE_NUMBER_ID}/messages`,
        'POST',
        payload
      );

      const messageId = response.messages?.[0]?.id;
      
      // Save to database if requested
      if (options.saveToDatabase && supabaseAdmin && options.advisorId) {
        await supabaseAdmin.from('whatsapp_messages').insert({
          advisor_id: options.advisorId,
          recipient_phone: formattedPhone,
          message_type: message.type,
          content: message.text?.body,
          template_name: message.template?.name,
          template_params: message.template?.components,
          image_url: message.image?.link,
          whatsapp_message_id: messageId,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
      }

      return {
        messageId,
        status: 'sent',
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error('Failed to send WhatsApp message:', error);
      
      // Log failed message to database
      if (options.saveToDatabase && supabaseAdmin && options.advisorId) {
        await supabaseAdmin.from('whatsapp_messages').insert({
          advisor_id: options.advisorId,
          recipient_phone: message.to,
          message_type: message.type,
          status: 'failed',
          error_message: error.message
        });
      }
      
      throw error;
    }
  }

  /**
   * Send template message
   */
  static async sendTemplateMessage(params: {
    to: string;
    templateName: string;
    language?: string;
    components?: any[];
    advisorId?: string;
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

    return this.sendMessage(message, {
      advisorId: params.advisorId,
      saveToDatabase: true
    });
  }

  /**
   * Send text message (for 24-hour window)
   */
  static async sendTextMessage(
    to: string,
    text: string,
    advisorId?: string
  ): Promise<MessageStatus> {
    const message: WhatsAppMessage = {
      to,
      type: 'text',
      text: { body: text }
    };

    return this.sendMessage(message, {
      advisorId,
      saveToDatabase: true
    });
  }

  /**
   * Send image message
   */
  static async sendImageMessage(params: {
    to: string;
    imageUrl: string;
    caption?: string;
    advisorId?: string;
  }): Promise<MessageStatus> {
    const message: WhatsAppMessage = {
      to: params.to,
      type: 'image',
      image: {
        link: params.imageUrl,
        caption: params.caption
      }
    };

    return this.sendMessage(message, {
      advisorId: params.advisorId,
      saveToDatabase: true
    });
  }

  /**
   * Upload media to WhatsApp
   */
  static async uploadMedia(file: File | Buffer, mimeType: string): Promise<string> {
    try {
      const formData = new FormData();
      
      if (file instanceof File) {
        formData.append('file', file);
      } else {
        formData.append('file', new Blob([file], { type: mimeType }));
      }
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', mimeType);

      const response = await fetch(
        `${WHATSAPP_API_URL}/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
          },
          body: formData
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Media upload failed');
      }

      return data.id;
    } catch (error) {
      console.error('Media upload failed:', error);
      throw error;
    }
  }

  /**
   * Get media URL from media ID
   */
  static async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await makeWhatsAppRequest(mediaId, 'GET');
      return response.url;
    } catch (error) {
      console.error('Failed to get media URL:', error);
      throw error;
    }
  }

  /**
   * Create message template
   */
  static async createTemplate(params: {
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

      const response = await makeWhatsAppRequest(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        'POST',
        payload
      );

      // Save template to database
      if (supabaseAdmin) {
        await supabaseAdmin.from('whatsapp_templates').insert({
          name: params.name,
          category: params.category,
          language: params.language,
          header_text: params.headerText,
          body_text: params.bodyText,
          footer_text: params.footerText,
          buttons: params.buttons,
          status: 'pending',
          whatsapp_template_id: response.id
        });
      }

      return response;
    } catch (error) {
      console.error('Template creation failed:', error);
      throw error;
    }
  }

  /**
   * Get all templates
   */
  static async getTemplates(): Promise<TemplateResponse[]> {
    try {
      const response = await makeWhatsAppRequest(
        `${BUSINESS_ACCOUNT_ID}/message_templates?limit=100`,
        'GET'
      );
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      throw error;
    }
  }

  /**
   * Get template by name
   */
  static async getTemplateByName(name: string): Promise<TemplateResponse | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.name === name) || null;
  }

  /**
   * Delete template
   */
  static async deleteTemplate(name: string): Promise<boolean> {
    try {
      await makeWhatsAppRequest(
        `${BUSINESS_ACCOUNT_ID}/message_templates?name=${name}`,
        'DELETE'
      );

      // Update database
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('whatsapp_templates')
          .update({ status: 'deleted' })
          .eq('name', name);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete template:', error);
      return false;
    }
  }

  /**
   * Batch send messages
   */
  static async batchSendMessages(
    messages: WhatsAppMessage[],
    advisorId?: string
  ): Promise<MessageStatus[]> {
    const results: MessageStatus[] = [];
    const batchSize = 50; // WhatsApp rate limit safe batch size

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(msg => this.sendMessage(msg, { advisorId, saveToDatabase: true }))
      );

      batchResults.forEach((result) => {
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
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Check template quality score
   */
  static async checkTemplateQuality(templateName: string): Promise<string> {
    const template = await this.getTemplateByName(templateName);
    if (!template) {
      throw new Error('Template not found');
    }

    const qualityScore = template.quality_score?.score || 'UNKNOWN';
    
    // Update database with quality score
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('whatsapp_templates')
        .update({ quality_score: qualityScore })
        .eq('name', templateName);
    }

    // Pause template if quality is RED
    if (qualityScore === 'RED') {
      console.warn(`Template ${templateName} has RED quality score, pausing usage`);
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('whatsapp_templates')
          .update({ status: 'paused' })
          .eq('name', templateName);
      }
    }

    return qualityScore;
  }

  /**
   * Get delivery statistics
   */
  static async getDeliveryStats(advisorId?: string): Promise<any> {
    if (!supabaseAdmin) {
      return { error: 'Database not configured' };
    }

    try {
      let query = supabaseAdmin
        .from('whatsapp_messages')
        .select('status, count', { count: 'exact' });

      if (advisorId) {
        query = query.eq('advisor_id', advisorId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const stats = {
        total: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      };

      data?.forEach((row: any) => {
        stats.total += row.count;
        if (row.status in stats) {
          (stats as any)[row.status] = row.count;
        }
      });

      const deliveryRate = stats.sent > 0 
        ? (stats.delivered / stats.sent) * 100 
        : 0;

      return {
        ...stats,
        deliveryRate: `${deliveryRate.toFixed(2)}%`
      };
    } catch (error) {
      console.error('Failed to get delivery stats:', error);
      throw error;
    }
  }
}

// Export default instance for convenience
export default WhatsAppService;