import { createClient } from '@/lib/supabase/server';

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
}

interface MessageTemplate {
  name: string;
  language: string;
  components?: any[];
}

export class WhatsAppService {
  private config: WhatsAppConfig;
  private supabase;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.config = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!
    };
    this.supabase = createClient();
  }

  /**
   * Send welcome message to new advisor
   */
  async sendWelcomeMessage(data: {
    phone: string;
    name: string;
    plan: string;
    deliveryTime: string;
  }) {
    try {
      const formattedPhone = this.formatPhoneNumber(data.phone);
      
      // First, try to send custom welcome template
      const welcomeResult = await this.sendTemplate(formattedPhone, {
        name: 'hubix_welcome',
        language: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: data.name },
              { type: 'text', text: data.plan },
              { type: 'text', text: data.deliveryTime }
            ]
          }
        ]
      });

      if (!welcomeResult.success) {
        // Fallback to utility template
        await this.sendTemplate(formattedPhone, {
          name: 'hello_world',
          language: 'en_US'
        });
      }

      // Send follow-up text message with details
      await this.sendTextMessage(formattedPhone, this.getWelcomeText(data));

      // Log delivery
      await this.logDelivery({
        phone: formattedPhone,
        messageType: 'welcome',
        templateName: 'hubix_welcome',
        status: 'sent'
      });

      return { success: true };
    } catch (error) {
      console.error('WhatsAppService.sendWelcomeMessage error:', error);
      throw error;
    }
  }

  /**
   * Send daily insight to advisor
   */
  async sendDailyInsight(advisorId: string, content: string, imageUrl?: string) {
    try {
      // Get advisor details
      const { data: advisor } = await this.supabase
        .from('advisors')
        .select('phone, name, euin')
        .eq('id', advisorId)
        .single();

      if (!advisor) {
        throw new Error('Advisor not found');
      }

      const formattedPhone = this.formatPhoneNumber(advisor.phone);

      // Check consent before sending
      const { ConsentManager } = await import('./consent-manager');
      const consentManager = new ConsentManager();
      const consentCheck = await consentManager.checkConsent(formattedPhone, 'daily_insight');

      if (!consentCheck.canSendMessage) {
        console.log(`No consent for ${formattedPhone}, skipping daily insight`);
        return { success: false, reason: 'no_consent' };
      }

      // Send insight template
      const templateResult = await this.sendTemplate(formattedPhone, {
        name: 'daily_focus',
        language: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: content }
            ]
          }
        ]
      });

      // If template fails, try text message (if in 24-hour window)
      if (!templateResult.success) {
        await this.sendTextMessage(formattedPhone, content);
      }

      // Send image if provided
      if (imageUrl) {
        await this.sendImageMessage(formattedPhone, imageUrl, 'Today\'s visual insight');
      }

      // Log delivery
      await this.logDelivery({
        phone: formattedPhone,
        advisorId: advisorId,
        messageType: 'daily_insight',
        templateName: 'daily_focus',
        status: 'sent'
      });

      return { success: true };
    } catch (error) {
      console.error('WhatsAppService.sendDailyInsight error:', error);
      throw error;
    }
  }

  /**
   * Send template message
   */
  private async sendTemplate(phone: string, template: MessageTemplate) {
    try {
      const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
      
      const body = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: template
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.messages) {
        return { 
          success: true, 
          messageId: data.messages[0].id 
        };
      } else {
        console.error('Template send failed:', data.error);
        return { 
          success: false, 
          error: data.error?.message 
        };
      }
    } catch (error) {
      console.error('sendTemplate error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send text message (requires active conversation window)
   */
  private async sendTextMessage(phone: string, text: string) {
    try {
      const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
      
      const body = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.messages) {
        return { 
          success: true, 
          messageId: data.messages[0].id 
        };
      } else {
        // Error code 131051 means no active conversation window
        if (data.error?.code === 131051) {
          console.log('No active conversation window');
        }
        return { 
          success: false, 
          error: data.error?.message 
        };
      }
    } catch (error) {
      console.error('sendTextMessage error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send image message
   */
  private async sendImageMessage(phone: string, imageUrl: string, caption?: string) {
    try {
      const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
      
      const body = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.messages) {
        return { 
          success: true, 
          messageId: data.messages[0].id 
        };
      } else {
        return { 
          success: false, 
          error: data.error?.message 
        };
      }
    } catch (error) {
      console.error('sendImageMessage error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get welcome text message
   */
  private getWelcomeText(data: any): string {
    return `🎯 Welcome to Hubix, ${data.name}!

Your AI-powered content assistant is ready.

What you'll receive:
✅ Daily investment insights at ${data.deliveryTime} IST
✅ SEBI-compliant content
✅ Market updates & tips
✅ Ready to share with clients

Your Details:
Plan: ${data.plan}
Delivery: ${data.deliveryTime} IST daily

Quick Commands:
• PAUSE - Pause daily messages
• RESUME - Resume delivery
• HELP - Get support
• STOP - Unsubscribe

Your first content arrives tomorrow morning!

Need help? Reply to this message.`;
  }

  /**
   * Log message delivery
   */
  private async logDelivery(data: {
    phone: string;
    advisorId?: string;
    messageType: string;
    templateName: string;
    status: string;
    messageId?: string;
  }) {
    try {
      await this.supabase
        .from('whatsapp_delivery_log')
        .insert({
          advisor_id: data.advisorId,
          phone_number: data.phone,
          message_type: data.messageType,
          template_name: data.templateName,
          message_id: data.messageId,
          status: data.status,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging delivery:', error);
      // Don't throw - logging shouldn't break main flow
    }
  }

  /**
   * Format phone number for WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Add 91 prefix if needed for WhatsApp
    if (!cleaned.startsWith('91')) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Handle incoming WhatsApp webhook
   */
  async handleWebhook(payload: any) {
    try {
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        return { processed: false };
      }

      const message = messages[0];
      const from = message.from;
      const messageType = message.type;

      // Handle button replies
      if (messageType === 'interactive' && message.interactive?.type === 'button_reply') {
        const buttonId = message.interactive.button_reply.id;
        const buttonText = message.interactive.button_reply.title;

        if (buttonText === 'YES' || buttonText === 'NO') {
          const { ConsentManager } = await import('./consent-manager');
          const consentManager = new ConsentManager();
          await consentManager.recordWhatsAppConsent(from, buttonText);
        }
      }

      // Handle text messages (commands)
      if (messageType === 'text') {
        const text = message.text.body.toUpperCase();
        
        if (text === 'STOP') {
          const { ConsentManager } = await import('./consent-manager');
          const consentManager = new ConsentManager();
          await consentManager.handleOptOut(from, 'whatsapp_stop');
          
          // Send confirmation
          await this.sendTextMessage(from, 'You have been unsubscribed. Reply START to re-subscribe.');
        } else if (text === 'START' || text === 'YES') {
          const { ConsentManager } = await import('./consent-manager');
          const consentManager = new ConsentManager();
          await consentManager.recordWhatsAppConsent(from, 'YES');
          
          // Send confirmation
          await this.sendTextMessage(from, 'Welcome back! You will receive daily insights at 06:00 IST.');
        }
      }

      return { processed: true };
    } catch (error) {
      console.error('WhatsAppService.handleWebhook error:', error);
      return { processed: false, error: String(error) };
    }
  }
}