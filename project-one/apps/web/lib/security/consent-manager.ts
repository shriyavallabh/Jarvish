/**
 * Consent Manager
 * Manages user consent for data processing as per DPDP Act requirements
 */

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Consent types
export enum ConsentType {
  DATA_COLLECTION = 'data_collection',
  DATA_PROCESSING = 'data_processing',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  COOKIES = 'cookies',
  PROFILING = 'profiling',
  AUTOMATED_DECISION = 'automated_decision',
  CROSS_BORDER_TRANSFER = 'cross_border_transfer',
  BIOMETRIC_DATA = 'biometric_data',
  FINANCIAL_DATA = 'financial_data',
  HEALTH_DATA = 'health_data',
}

// Consent status
export enum ConsentStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

// Consent purpose categories
export enum ConsentPurpose {
  SERVICE_PROVISION = 'service_provision',
  LEGAL_COMPLIANCE = 'legal_compliance',
  LEGITIMATE_INTEREST = 'legitimate_interest',
  VITAL_INTEREST = 'vital_interest',
  PUBLIC_INTEREST = 'public_interest',
  CONSENT_BASED = 'consent_based',
}

// Consent record schema
const ConsentRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.nativeEnum(ConsentType),
  purpose: z.nativeEnum(ConsentPurpose),
  status: z.nativeEnum(ConsentStatus),
  version: z.string(),
  description: z.string(),
  dataCategories: z.array(z.string()),
  processingActivities: z.array(z.string()),
  thirdParties: z.array(z.string()).optional(),
  retentionPeriod: z.number(), // days
  grantedAt: z.date().optional(),
  withdrawnAt: z.date().optional(),
  expiresAt: z.date().optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  method: z.enum(['explicit', 'implicit', 'opt_out']),
  parentConsentId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;

// Consent template schema
const ConsentTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  type: z.nativeEnum(ConsentType),
  purpose: z.nativeEnum(ConsentPurpose),
  description: z.string(),
  shortDescription: z.string(),
  legalBasis: z.string(),
  dataCategories: z.array(z.string()),
  processingActivities: z.array(z.string()),
  thirdParties: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    country: z.string(),
  })).optional(),
  retentionPeriod: z.number(),
  isRequired: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ConsentTemplate = z.infer<typeof ConsentTemplateSchema>;

// Consent preferences schema
const ConsentPreferencesSchema = z.object({
  userId: z.string(),
  preferences: z.record(z.nativeEnum(ConsentType), z.boolean()),
  granularControls: z.record(z.string(), z.any()).optional(),
  communicationChannels: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    whatsapp: z.boolean(),
    push: z.boolean(),
    phone: z.boolean(),
  }),
  dataRetention: z.object({
    minimal: z.boolean(),
    deleteOnWithdrawal: z.boolean(),
    anonymizeInactive: z.boolean(),
  }),
  lastUpdated: z.date(),
});

export type ConsentPreferences = z.infer<typeof ConsentPreferencesSchema>;

export class ConsentManager {
  private supabase: any;
  private templates: Map<string, ConsentTemplate> = new Map();
  private consentCache: Map<string, ConsentRecord[]> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.loadTemplates();
  }

  /**
   * Load consent templates
   */
  private async loadTemplates(): Promise<void> {
    const defaultTemplates: Partial<ConsentTemplate>[] = [
      {
        name: 'Essential Data Collection',
        type: ConsentType.DATA_COLLECTION,
        purpose: ConsentPurpose.SERVICE_PROVISION,
        description: 'Collection of essential data required to provide financial advisory services',
        shortDescription: 'Essential service data',
        legalBasis: 'Contract performance',
        dataCategories: ['identity', 'contact', 'financial'],
        processingActivities: ['identity_verification', 'service_delivery'],
        retentionPeriod: 2555, // 7 years for SEBI
        isRequired: true,
        isActive: true,
      },
      {
        name: 'Marketing Communications',
        type: ConsentType.MARKETING,
        purpose: ConsentPurpose.CONSENT_BASED,
        description: 'Sending marketing communications about our financial products and services',
        shortDescription: 'Marketing emails and messages',
        legalBasis: 'Explicit consent',
        dataCategories: ['contact', 'preferences'],
        processingActivities: ['email_marketing', 'sms_marketing'],
        retentionPeriod: 365,
        isRequired: false,
        isActive: true,
      },
      {
        name: 'Analytics and Improvement',
        type: ConsentType.ANALYTICS,
        purpose: ConsentPurpose.LEGITIMATE_INTEREST,
        description: 'Using analytics to improve our services and user experience',
        shortDescription: 'Service improvement analytics',
        legalBasis: 'Legitimate interest',
        dataCategories: ['usage', 'preferences'],
        processingActivities: ['analytics', 'service_improvement'],
        retentionPeriod: 730,
        isRequired: false,
        isActive: true,
      },
      {
        name: 'Financial Data Processing',
        type: ConsentType.FINANCIAL_DATA,
        purpose: ConsentPurpose.SERVICE_PROVISION,
        description: 'Processing financial data for advisory services and portfolio management',
        shortDescription: 'Financial data processing',
        legalBasis: 'Contract performance and legal obligation',
        dataCategories: ['financial', 'investment', 'transaction'],
        processingActivities: ['portfolio_analysis', 'risk_assessment', 'reporting'],
        retentionPeriod: 2555, // 7 years for SEBI
        isRequired: true,
        isActive: true,
      },
    ];

    for (const template of defaultTemplates) {
      const fullTemplate = {
        ...template,
        id: crypto.randomUUID(),
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ConsentTemplate;

      this.templates.set(fullTemplate.id, fullTemplate);
    }
  }

  /**
   * Get user's consent status
   */
  async getUserConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<ConsentRecord | null> {
    const { data } = await this.supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .eq('type', consentType)
      .eq('status', ConsentStatus.GRANTED)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data;
  }

  /**
   * Record consent
   */
  async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    ipAddress: string,
    userAgent: string,
    metadata?: any
  ): Promise<ConsentRecord> {
    const template = Array.from(this.templates.values()).find(
      t => t.type === consentType
    );

    if (!template) {
      throw new Error(`No template found for consent type: ${consentType}`);
    }

    const consentRecord: ConsentRecord = {
      id: crypto.randomUUID(),
      userId,
      type: consentType,
      purpose: template.purpose,
      status: granted ? ConsentStatus.GRANTED : ConsentStatus.DENIED,
      version: template.version,
      description: template.description,
      dataCategories: template.dataCategories,
      processingActivities: template.processingActivities,
      thirdParties: template.thirdParties?.map(tp => tp.name),
      retentionPeriod: template.retentionPeriod,
      grantedAt: granted ? new Date() : undefined,
      expiresAt: granted 
        ? new Date(Date.now() + template.retentionPeriod * 24 * 60 * 60 * 1000)
        : undefined,
      ipAddress,
      userAgent,
      method: 'explicit',
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in database
    const { data, error } = await this.supabase
      .from('consent_records')
      .insert(consentRecord)
      .select()
      .single();

    if (error) throw error;

    // Update cache
    const userConsents = this.consentCache.get(userId) || [];
    userConsents.push(data);
    this.consentCache.set(userId, userConsents);

    // Log consent change
    await this.logConsentChange(consentRecord);

    return data;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    consentType: ConsentType,
    reason?: string
  ): Promise<void> {
    const currentConsent = await this.getUserConsent(userId, consentType);
    
    if (!currentConsent) {
      throw new Error('No active consent found to withdraw');
    }

    // Update consent status
    const { error } = await this.supabase
      .from('consent_records')
      .update({
        status: ConsentStatus.WITHDRAWN,
        withdrawnAt: new Date(),
        updatedAt: new Date(),
        metadata: { ...currentConsent.metadata, withdrawalReason: reason },
      })
      .eq('id', currentConsent.id);

    if (error) throw error;

    // Create withdrawal record
    await this.recordConsent(
      userId,
      consentType,
      false,
      currentConsent.ipAddress,
      currentConsent.userAgent,
      { action: 'withdrawal', reason, parentId: currentConsent.id }
    );

    // Trigger data deletion if required
    await this.handleConsentWithdrawal(userId, consentType);
  }

  /**
   * Get consent history
   */
  async getConsentHistory(
    userId: string,
    consentType?: ConsentType
  ): Promise<ConsentRecord[]> {
    const query = this.supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (consentType) {
      query.eq('type', consentType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Update consent preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<ConsentPreferences>
  ): Promise<ConsentPreferences> {
    const current = await this.getPreferences(userId);
    
    const updated: ConsentPreferences = {
      ...current,
      ...preferences,
      userId,
      lastUpdated: new Date(),
    };

    const { data, error } = await this.supabase
      .from('consent_preferences')
      .upsert(updated)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get consent preferences
   */
  async getPreferences(userId: string): Promise<ConsentPreferences> {
    const { data } = await this.supabase
      .from('consent_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) {
      // Return default preferences
      return {
        userId,
        preferences: Object.values(ConsentType).reduce((acc, type) => ({
          ...acc,
          [type]: false,
        }), {} as Record<ConsentType, boolean>),
        communicationChannels: {
          email: true,
          sms: false,
          whatsapp: false,
          push: false,
          phone: false,
        },
        dataRetention: {
          minimal: true,
          deleteOnWithdrawal: true,
          anonymizeInactive: true,
        },
        lastUpdated: new Date(),
      };
    }

    return data;
  }

  /**
   * Check if processing is allowed
   */
  async isProcessingAllowed(
    userId: string,
    consentType: ConsentType,
    activity?: string
  ): Promise<boolean> {
    const consent = await this.getUserConsent(userId, consentType);
    
    if (!consent) return false;
    
    if (consent.status !== ConsentStatus.GRANTED) return false;
    
    if (consent.expiresAt && consent.expiresAt < new Date()) return false;
    
    if (activity && !consent.processingActivities.includes(activity)) return false;
    
    return true;
  }

  /**
   * Get required consents for service
   */
  async getRequiredConsents(): Promise<ConsentTemplate[]> {
    return Array.from(this.templates.values()).filter(t => t.isRequired);
  }

  /**
   * Get optional consents
   */
  async getOptionalConsents(): Promise<ConsentTemplate[]> {
    return Array.from(this.templates.values()).filter(t => !t.isRequired);
  }

  /**
   * Verify consent completeness
   */
  async verifyConsentCompleteness(userId: string): Promise<{
    complete: boolean;
    missing: ConsentType[];
    expired: ConsentType[];
  }> {
    const required = await this.getRequiredConsents();
    const missing: ConsentType[] = [];
    const expired: ConsentType[] = [];

    for (const template of required) {
      const consent = await this.getUserConsent(userId, template.type);
      
      if (!consent || consent.status !== ConsentStatus.GRANTED) {
        missing.push(template.type);
      } else if (consent.expiresAt && consent.expiresAt < new Date()) {
        expired.push(template.type);
      }
    }

    return {
      complete: missing.length === 0 && expired.length === 0,
      missing,
      expired,
    };
  }

  /**
   * Generate consent receipt
   */
  async generateConsentReceipt(
    userId: string
  ): Promise<{
    receiptId: string;
    timestamp: Date;
    consents: ConsentRecord[];
    preferences: ConsentPreferences;
  }> {
    const consents = await this.getConsentHistory(userId);
    const preferences = await this.getPreferences(userId);
    
    const receipt = {
      receiptId: crypto.randomUUID(),
      timestamp: new Date(),
      userId,
      consents: consents.filter(c => c.status === ConsentStatus.GRANTED),
      preferences,
    };

    // Store receipt
    await this.supabase
      .from('consent_receipts')
      .insert(receipt);

    return receipt;
  }

  /**
   * Export consent data (for data portability)
   */
  async exportConsentData(userId: string): Promise<any> {
    const consents = await this.getConsentHistory(userId);
    const preferences = await this.getPreferences(userId);
    const receipt = await this.generateConsentReceipt(userId);

    return {
      exportDate: new Date(),
      userId,
      consents,
      preferences,
      receipt,
      format: 'json',
      version: '1.0',
    };
  }

  /**
   * Handle consent withdrawal
   */
  private async handleConsentWithdrawal(
    userId: string,
    consentType: ConsentType
  ): Promise<void> {
    // Implement data deletion or anonymization based on consent type
    switch (consentType) {
      case ConsentType.MARKETING:
        // Remove from marketing lists
        await this.removeFromMarketing(userId);
        break;
        
      case ConsentType.ANALYTICS:
        // Anonymize analytics data
        await this.anonymizeAnalytics(userId);
        break;
        
      case ConsentType.THIRD_PARTY_SHARING:
        // Notify third parties of withdrawal
        await this.notifyThirdParties(userId);
        break;
        
      default:
        // Log withdrawal for audit
        console.log(`Consent withdrawn: ${userId} - ${consentType}`);
    }
  }

  /**
   * Log consent change
   */
  private async logConsentChange(consent: ConsentRecord): Promise<void> {
    await this.supabase
      .from('consent_audit_log')
      .insert({
        id: crypto.randomUUID(),
        userId: consent.userId,
        consentId: consent.id,
        action: consent.status,
        type: consent.type,
        timestamp: new Date(),
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        metadata: consent.metadata,
      });
  }

  /**
   * Remove user from marketing
   */
  private async removeFromMarketing(userId: string): Promise<void> {
    await this.supabase
      .from('marketing_lists')
      .delete()
      .eq('user_id', userId);
  }

  /**
   * Anonymize analytics data
   */
  private async anonymizeAnalytics(userId: string): Promise<void> {
    await this.supabase
      .from('analytics_data')
      .update({ user_id: `anon_${crypto.randomUUID()}` })
      .eq('user_id', userId);
  }

  /**
   * Notify third parties of consent withdrawal
   */
  private async notifyThirdParties(userId: string): Promise<void> {
    // Implement third-party notification logic
    console.log(`Notifying third parties of consent withdrawal for user: ${userId}`);
  }

  /**
   * Check consent renewal requirements
   */
  async checkConsentRenewal(userId: string): Promise<ConsentType[]> {
    const consents = await this.getConsentHistory(userId);
    const needsRenewal: ConsentType[] = [];
    
    for (const consent of consents) {
      if (consent.status === ConsentStatus.GRANTED && consent.expiresAt) {
        const daysUntilExpiry = Math.floor(
          (consent.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilExpiry <= 30) {
          needsRenewal.push(consent.type);
        }
      }
    }
    
    return needsRenewal;
  }
}

export default ConsentManager;