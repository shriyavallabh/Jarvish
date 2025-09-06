// WhatsApp Template Management Service
// Optimized template management with proper image aspect ratio support

import axios from 'axios';
import { cache } from '../utils/redis';

interface WhatsAppTemplate {
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components: any[];
  created_time?: string;
  updated_time?: string;
}

interface CreateTemplateRequest {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components: any[];
}

class WhatsAppTemplateManager {
  private accessToken: string;
  private businessAccountId: string;
  private phoneNumberId: string;
  private apiVersion: string = 'v21.0';

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  /**
   * Get all templates
   */
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const cacheKey = 'whatsapp:templates';
      const cached = await cache.get<string>(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await axios.get(
        `https://graph.facebook.com/${this.apiVersion}/${this.businessAccountId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          params: {
            fields: 'name,status,category,language,components,created_time'
          }
        }
      );

      const templates = response.data.data;
      
      // Cache for 30 minutes
      await cache.set(cacheKey, JSON.stringify(templates), 1800);
      
      return templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(template: CreateTemplateRequest): Promise<{ id: string; status: string }> {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${this.businessAccountId}/message_templates`,
        template,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Clear templates cache
      await cache.del('whatsapp:templates');

      return response.data;
    } catch (error: any) {
      console.error('Error creating template:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateName: string): Promise<void> {
    try {
      await axios.delete(
        `https://graph.facebook.com/${this.apiVersion}/${this.businessAccountId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          params: {
            name: templateName
          }
        }
      );

      // Clear templates cache
      await cache.del('whatsapp:templates');
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'): Promise<WhatsAppTemplate[]> {
    const templates = await this.getTemplates();
    return templates.filter(template => template.category === category);
  }

  /**
   * Get approved image templates
   */
  async getApprovedImageTemplates(): Promise<WhatsAppTemplate[]> {
    const templates = await this.getTemplates();
    return templates.filter(template => 
      template.status === 'APPROVED' && 
      template.components.some(component => 
        component.type === 'HEADER' && component.format === 'IMAGE'
      )
    );
  }

  /**
   * Create Financial Content Template with proper 1200x628 image support
   */
  async createFinancialContentTemplate(): Promise<{ id: string; status: string }> {
    const template: CreateTemplateRequest = {
      name: 'jarvish_financial_content_1200x628',
      category: 'MARKETING',
      language: 'en',
      components: [
        {
          type: 'HEADER',
          format: 'IMAGE',
          example: {
            header_handle: ['https://example.com/sample-1200x628.jpg'] // WhatsApp optimal ratio
          }
        },
        {
          type: 'BODY',
          text: '{{1}}\n\n📊 Today\'s Financial Insight\n{{2}}\n\n💡 Key Takeaway: {{3}}\n\nPowered by Jarvish AI',
          example: {
            body_text: [[
              'Good morning!',
              'SIP investments have shown consistent growth over long-term periods. Historical data suggests that systematic investing helps average out market volatility.',
              'Start your SIP journey with proper risk assessment and financial planning.'
            ]]
          }
        },
        {
          type: 'FOOTER',
          text: 'Mutual fund investments are subject to market risks. Please read all scheme related documents carefully.'
        }
      ]
    };

    return this.createTemplate(template);
  }

  /**
   * Create Market Update Template
   */
  async createMarketUpdateTemplate(): Promise<{ id: string; status: string }> {
    const template: CreateTemplateRequest = {
      name: 'jarvish_market_update_image',
      category: 'MARKETING', 
      language: 'en',
      components: [
        {
          type: 'HEADER',
          format: 'IMAGE',
          example: {
            header_handle: ['https://example.com/market-update-1200x628.jpg']
          }
        },
        {
          type: 'BODY',
          text: '🌅 Good Morning!\n\n📈 Today\'s Market Snapshot:\n\n{{1}}\n{{2}}\n\n🎯 Top Performers: {{3}}\n\nStay informed, invest wisely!',
          example: {
            body_text: [[
              'Sensex: 72,850 (+385 points)',
              'Nifty: 22,050 (+115 points)',
              'HDFC Bank, Infosys, TCS'
            ]]
          }
        },
        {
          type: 'FOOTER',
          text: 'Market data is indicative. Consult your advisor for investment decisions.'
        }
      ]
    };

    return this.createTemplate(template);
  }

  /**
   * Create Educational Content Template
   */
  async createEducationalTemplate(): Promise<{ id: string; status: string }> {
    const template: CreateTemplateRequest = {
      name: 'jarvish_educational_content',
      category: 'MARKETING',
      language: 'en',
      components: [
        {
          type: 'HEADER',
          format: 'IMAGE',
          example: {
            header_handle: ['https://example.com/education-1200x628.jpg']
          }
        },
        {
          type: 'BODY',
          text: '📚 Financial Learning\n\n{{1}}\n\n💡 Key Points:\n• {{2}}\n• {{3}}\n• {{4}}\n\n🎯 Remember: {{5}}',
          example: {
            body_text: [[
              'Understanding SIP Benefits',
              'Rupee cost averaging reduces risk',
              'Disciplined investing builds wealth',
              'Start early for better compounding',
              'Consistency is key to success'
            ]]
          }
        },
        {
          type: 'FOOTER',
          text: 'Educational content by your financial advisor'
        }
      ]
    };

    return this.createTemplate(template);
  }

  /**
   * Send template message with image
   */
  async sendTemplateMessage(params: {
    to: string;
    templateName: string;
    language: string;
    headerImageUrl?: string;
    bodyParameters?: string[];
  }): Promise<{ messageId: string; status: string }> {
    try {
      const messageData: any = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'template',
        template: {
          name: params.templateName,
          language: {
            code: params.language
          },
          components: []
        }
      };

      // Add header with image if provided
      if (params.headerImageUrl) {
        messageData.template.components.push({
          type: 'header',
          parameters: [{
            type: 'image',
            image: {
              link: params.headerImageUrl
            }
          }]
        });
      }

      // Add body parameters if provided
      if (params.bodyParameters && params.bodyParameters.length > 0) {
        messageData.template.components.push({
          type: 'body',
          parameters: params.bodyParameters.map(text => ({
            type: 'text',
            text: text
          }))
        });
      }

      const response = await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        messageId: response.data.messages[0].id,
        status: 'sent'
      };

    } catch (error: any) {
      console.error('Error sending template message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check template status
   */
  async getTemplateStatus(templateName: string): Promise<WhatsAppTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.name === templateName) || null;
  }

  /**
   * Get templates summary with statistics
   */
  async getTemplatesSummary(): Promise<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    imageTemplates: number;
    textTemplates: number;
    templates: WhatsAppTemplate[];
  }> {
    const templates = await this.getTemplates();
    
    const approved = templates.filter(t => t.status === 'APPROVED').length;
    const pending = templates.filter(t => t.status === 'PENDING').length;
    const rejected = templates.filter(t => t.status === 'REJECTED').length;
    
    const imageTemplates = templates.filter(t => 
      t.components.some(c => c.type === 'HEADER' && c.format === 'IMAGE')
    ).length;
    
    const textTemplates = templates.length - imageTemplates;

    return {
      total: templates.length,
      approved,
      pending,
      rejected,
      imageTemplates,
      textTemplates,
      templates
    };
  }
}

export default new WhatsAppTemplateManager();