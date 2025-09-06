import { createClient } from '@/lib/supabase/server';

export interface ConsentRecord {
  advisor_id: string;
  phone_number: string;
  opted_in: boolean;
  consent_date: string;
  consent_method: 'website_signup' | 'whatsapp_button' | 'import' | 'manual';
  consent_text: string;
  ip_address?: string;
  user_agent?: string;
  marketing_consent?: boolean;
  newsletter_consent?: boolean;
  promotional_consent?: boolean;
}

export interface ConsentCheckResult {
  hasConsent: boolean;
  consentDate?: string;
  consentMethod?: string;
  marketingAllowed?: boolean;
  canSendMessage: boolean;
}

export class ConsentManager {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Record consent from website signup
   */
  async recordWebsiteConsent(data: {
    advisorId: string;
    phone: string;
    whatsappConsent: boolean;
    marketingConsent?: boolean;
    newsletterConsent?: boolean;
    ipAddress?: string;
    userAgent?: string;
    consentText?: string;
  }) {
    try {
      // Format phone number (ensure it has country code)
      const formattedPhone = this.formatPhoneNumber(data.phone);

      // Create consent record
      const consentRecord: ConsentRecord = {
        advisor_id: data.advisorId,
        phone_number: formattedPhone,
        opted_in: data.whatsappConsent,
        consent_date: new Date().toISOString(),
        consent_method: 'website_signup',
        consent_text: data.consentText || 'I agree to receive daily investment insights via WhatsApp at 06:00 IST',
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        marketing_consent: data.marketingConsent ?? true,
        newsletter_consent: data.newsletterConsent ?? true,
        promotional_consent: data.marketingConsent ?? true
      };

      // Insert into database
      const { data: consent, error } = await this.supabase
        .from('whatsapp_consent')
        .insert(consentRecord)
        .select()
        .single();

      if (error) {
        console.error('Error recording consent:', error);
        throw new Error('Failed to record consent');
      }

      // Log consent for audit trail
      await this.logConsentAction(data.advisorId, formattedPhone, 'opted_in', consentRecord);

      return consent;
    } catch (error) {
      console.error('ConsentManager.recordWebsiteConsent error:', error);
      throw error;
    }
  }

  /**
   * Record consent from WhatsApp button reply
   */
  async recordWhatsAppConsent(phone: string, buttonReply: string) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Find advisor by phone number
      const { data: advisor } = await this.supabase
        .from('advisors')
        .select('id')
        .eq('phone', formattedPhone)
        .single();

      if (!advisor) {
        throw new Error('Advisor not found');
      }

      const isOptIn = buttonReply.toLowerCase() === 'yes';

      // Update or create consent record
      const { data: consent, error } = await this.supabase
        .from('whatsapp_consent')
        .upsert({
          advisor_id: advisor.id,
          phone_number: formattedPhone,
          opted_in: isOptIn,
          consent_date: new Date().toISOString(),
          consent_method: 'whatsapp_button',
          consent_text: isOptIn ? 'Clicked YES on WhatsApp opt-in message' : 'Clicked NO on WhatsApp opt-in message',
          marketing_consent: isOptIn,
          newsletter_consent: isOptIn,
          promotional_consent: isOptIn,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone_number'
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording WhatsApp consent:', error);
        throw error;
      }

      // Log action
      await this.logConsentAction(
        advisor.id, 
        formattedPhone, 
        isOptIn ? 'opted_in' : 'opted_out',
        consent
      );

      return consent;
    } catch (error) {
      console.error('ConsentManager.recordWhatsAppConsent error:', error);
      throw error;
    }
  }

  /**
   * Check if a phone number has consent to receive messages
   */
  async checkConsent(phone: string, messageType: 'marketing' | 'utility' | 'daily_insight' = 'marketing'): Promise<ConsentCheckResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const { data: consent } = await this.supabase
        .from('whatsapp_consent')
        .select('*')
        .eq('phone_number', formattedPhone)
        .single();

      if (!consent) {
        return {
          hasConsent: false,
          canSendMessage: messageType === 'utility' // UTILITY templates always allowed
        };
      }

      // Check if opted in
      if (!consent.opted_in) {
        return {
          hasConsent: false,
          consentDate: consent.opt_out_date,
          consentMethod: consent.consent_method,
          canSendMessage: messageType === 'utility'
        };
      }

      // Check specific message type permissions
      let canSend = consent.opted_in;
      
      if (messageType === 'marketing' && !consent.marketing_consent) {
        canSend = false;
      }

      return {
        hasConsent: true,
        consentDate: consent.consent_date,
        consentMethod: consent.consent_method,
        marketingAllowed: consent.marketing_consent,
        canSendMessage: canSend || messageType === 'utility'
      };
    } catch (error) {
      console.error('ConsentManager.checkConsent error:', error);
      // Default to safe option - no consent
      return {
        hasConsent: false,
        canSendMessage: messageType === 'utility'
      };
    }
  }

  /**
   * Handle opt-out request
   */
  async handleOptOut(phone: string, method: 'whatsapp_stop' | 'website' | 'support' = 'whatsapp_stop') {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Find existing consent record
      const { data: existing } = await this.supabase
        .from('whatsapp_consent')
        .select('*')
        .eq('phone_number', formattedPhone)
        .single();

      if (!existing) {
        console.log('No consent record found for opt-out:', formattedPhone);
        return null;
      }

      // Update consent to opted out
      const { data: updated, error } = await this.supabase
        .from('whatsapp_consent')
        .update({
          opted_in: false,
          opt_out_date: new Date().toISOString(),
          opt_out_method: method,
          marketing_consent: false,
          newsletter_consent: false,
          promotional_consent: false,
          updated_at: new Date().toISOString()
        })
        .eq('phone_number', formattedPhone)
        .select()
        .single();

      if (error) {
        console.error('Error recording opt-out:', error);
        throw error;
      }

      // Log opt-out action
      await this.logConsentAction(existing.advisor_id, formattedPhone, 'opted_out', updated);

      return updated;
    } catch (error) {
      console.error('ConsentManager.handleOptOut error:', error);
      throw error;
    }
  }

  /**
   * Get all opted-in advisors for daily delivery
   */
  async getOptedInAdvisors(limit?: number) {
    try {
      let query = this.supabase
        .from('whatsapp_consent')
        .select(`
          *,
          advisors!inner(
            id,
            name,
            email,
            phone,
            euin,
            subscription_plan,
            delivery_time
          )
        `)
        .eq('opted_in', true);

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching opted-in advisors:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('ConsentManager.getOptedInAdvisors error:', error);
      throw error;
    }
  }

  /**
   * Log consent action for audit trail
   */
  private async logConsentAction(
    advisorId: string,
    phone: string,
    action: string,
    newValue: any
  ) {
    try {
      await this.supabase
        .from('whatsapp_consent_audit')
        .insert({
          advisor_id: advisorId,
          phone_number: phone,
          action: action,
          new_value: newValue,
          performed_by: 'system',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging consent action:', error);
      // Don't throw - logging failure shouldn't break main flow
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Get consent statistics
   */
  async getConsentStats() {
    try {
      const { data: stats } = await this.supabase
        .rpc('get_consent_stats');

      return stats || {
        total: 0,
        opted_in: 0,
        opted_out: 0,
        opt_in_rate: 0
      };
    } catch (error) {
      console.error('Error fetching consent stats:', error);
      return {
        total: 0,
        opted_in: 0,
        opted_out: 0,
        opt_in_rate: 0
      };
    }
  }
}