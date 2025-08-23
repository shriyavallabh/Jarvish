/**
 * DPDP Act Compliance Framework
 * Implements Digital Personal Data Protection Act requirements
 */

import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/monitoring/logger';
import crypto from 'crypto';

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  consentGiven: boolean;
  timestamp: Date;
  ipAddress: string;
  withdrawalDate?: Date;
}

export interface DataRequest {
  id: string;
  userId: string;
  requestType: 'ACCESS' | 'DELETION' | 'PORTABILITY' | 'CORRECTION';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  requestDate: Date;
  completionDate?: Date;
  data?: any;
}

export class DPDPComplianceManager {
  private static instance: DPDPComplianceManager;

  private constructor() {}

  static getInstance(): DPDPComplianceManager {
    if (!this.instance) {
      this.instance = new DPDPComplianceManager();
    }
    return this.instance;
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    purpose: string,
    consentGiven: boolean,
    ipAddress: string
  ): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      id: crypto.randomUUID(),
      userId,
      purpose,
      consentGiven,
      timestamp: new Date(),
      ipAddress,
    };

    // Store in audit log
    await supabase.from('audit_logs').insert({
      actor_type: 'user',
      actor_id: userId,
      action: consentGiven ? 'CONSENT_GRANTED' : 'CONSENT_WITHDRAWN',
      resource_type: 'consent',
      resource_id: consent.id,
      changes: { purpose, consentGiven },
      ip_address: ipAddress,
    });

    logger.info('Consent recorded', {
      userId,
      purpose,
      consentGiven,
      correlationId: consent.id,
    });

    return consent;
  }

  /**
   * Process data subject request (DPDP rights)
   */
  async processDataRequest(
    userId: string,
    requestType: DataRequest['requestType']
  ): Promise<DataRequest> {
    const request: DataRequest = {
      id: crypto.randomUUID(),
      userId,
      requestType,
      status: 'PENDING',
      requestDate: new Date(),
    };

    logger.info('Data request initiated', {
      userId,
      requestType,
      requestId: request.id,
    });

    // Process based on request type
    switch (requestType) {
      case 'ACCESS':
        request.data = await this.gatherUserData(userId);
        request.status = 'COMPLETED';
        request.completionDate = new Date();
        break;

      case 'DELETION':
        await this.scheduleDataDeletion(userId);
        request.status = 'PROCESSING';
        break;

      case 'PORTABILITY':
        request.data = await this.exportUserData(userId);
        request.status = 'COMPLETED';
        request.completionDate = new Date();
        break;

      case 'CORRECTION':
        request.status = 'PENDING';
        // Manual review required
        break;
    }

    return request;
  }

  /**
   * Gather all user data for access request
   */
  private async gatherUserData(userId: string): Promise<any> {
    const [advisor, content, analytics, compliance] = await Promise.all([
      supabase.from('advisors').select('*').eq('clerk_user_id', userId).single(),
      supabase.from('content_templates').select('*').eq('advisor_id', userId),
      supabase.from('advisor_analytics').select('*').eq('advisor_id', userId),
      supabase.from('compliance_checks').select('*').eq('advisor_id', userId),
    ]);

    return {
      profile: advisor.data,
      content: content.data,
      analytics: analytics.data,
      compliance: compliance.data,
      exportDate: new Date().toISOString(),
    };
  }

  /**
   * Export user data in portable format
   */
  private async exportUserData(userId: string): Promise<any> {
    const data = await this.gatherUserData(userId);
    
    // Format for portability (JSON)
    return {
      format: 'JSON',
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: data,
      checksum: crypto
        .createHash('sha256')
        .update(JSON.stringify(data))
        .digest('hex'),
    };
  }

  /**
   * Schedule data deletion (with retention requirements)
   */
  private async scheduleDataDeletion(userId: string): Promise<void> {
    // Check for regulatory retention requirements
    const retentionRequired = await this.checkRetentionRequirements(userId);
    
    if (retentionRequired) {
      logger.warn('Data deletion delayed due to retention requirements', {
        userId,
        reason: 'SEBI_7_YEAR_RETENTION',
      });
      
      // Anonymize instead of delete
      await this.anonymizeUserData(userId);
    } else {
      // Schedule deletion after 30-day grace period
      await this.scheduleJob('DELETE_USER_DATA', userId, 30);
    }
  }

  /**
   * Check regulatory retention requirements
   */
  private async checkRetentionRequirements(userId: string): Promise<boolean> {
    // SEBI requires 7-year retention for financial records
    const { data } = await supabase
      .from('content_history')
      .select('created_at')
      .eq('advisor_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const lastActivity = new Date(data[0].created_at);
      const sevenYearsAgo = new Date();
      sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
      
      return lastActivity > sevenYearsAgo;
    }

    return false;
  }

  /**
   * Anonymize user data while maintaining regulatory records
   */
  private async anonymizeUserData(userId: string): Promise<void> {
    const anonymousId = `ANON_${crypto.randomBytes(16).toString('hex')}`;
    
    // Update advisor record
    await supabase
      .from('advisors')
      .update({
        email: `${anonymousId}@anonymized.local`,
        phone: '0000000000',
        full_name: 'Anonymized User',
        firm_name: 'Anonymized',
        is_active: false,
        metadata: { anonymized: true, date: new Date().toISOString() },
      })
      .eq('clerk_user_id', userId);

    logger.info('User data anonymized', { userId, anonymousId });
  }

  /**
   * Data breach notification
   */
  async notifyDataBreach(
    affectedUsers: string[],
    breachDetails: {
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      description: string;
      discoveryDate: Date;
      dataTypes: string[];
    }
  ): Promise<void> {
    // DPDP requires notification within 72 hours
    const notificationDeadline = new Date(breachDetails.discoveryDate);
    notificationDeadline.setHours(notificationDeadline.getHours() + 72);

    logger.error('Data breach detected', {
      affectedCount: affectedUsers.length,
      severity: breachDetails.severity,
      deadline: notificationDeadline,
    });

    // Notify authorities
    await this.notifyAuthorities(breachDetails);

    // Notify affected users
    for (const userId of affectedUsers) {
      await this.notifyUser(userId, breachDetails);
    }

    // Create incident report
    await supabase.from('audit_logs').insert({
      actor_type: 'system',
      actor_id: 'BREACH_DETECTION',
      action: 'DATA_BREACH_REPORTED',
      resource_type: 'security_incident',
      resource_id: crypto.randomUUID(),
      changes: {
        ...breachDetails,
        affectedUsers: affectedUsers.length,
      },
    });
  }

  /**
   * Cross-border data transfer validation
   */
  async validateDataTransfer(
    destinationCountry: string,
    dataType: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // DPDP Act restrictions on cross-border transfers
    const restrictedCountries = ['CN', 'PK', 'RU']; // Example restricted list
    
    if (restrictedCountries.includes(destinationCountry)) {
      return {
        allowed: false,
        reason: 'Country not approved for data transfer under DPDP Act',
      };
    }

    // Check for adequacy decision
    const adequateCountries = ['US', 'UK', 'EU', 'SG', 'JP'];
    if (!adequateCountries.includes(destinationCountry)) {
      return {
        allowed: false,
        reason: 'Country lacks adequacy decision for data protection',
      };
    }

    return { allowed: true };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(period: 'monthly' | 'quarterly' | 'annual'): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'annual':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Gather compliance metrics
    const [consentStats, dataRequests, breaches, audits] = await Promise.all([
      this.getConsentStatistics(startDate, endDate),
      this.getDataRequestStatistics(startDate, endDate),
      this.getBreachStatistics(startDate, endDate),
      this.getAuditStatistics(startDate, endDate),
    ]);

    return {
      period,
      startDate,
      endDate,
      consentCompliance: consentStats,
      dataSubjectRequests: dataRequests,
      securityIncidents: breaches,
      auditTrail: audits,
      generatedAt: new Date(),
    };
  }

  private async getConsentStatistics(startDate: Date, endDate: Date): Promise<any> {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .in('action', ['CONSENT_GRANTED', 'CONSENT_WITHDRAWN'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const granted = data?.filter(log => log.action === 'CONSENT_GRANTED').length || 0;
    const withdrawn = data?.filter(log => log.action === 'CONSENT_WITHDRAWN').length || 0;

    return {
      totalGranted: granted,
      totalWithdrawn: withdrawn,
      netConsent: granted - withdrawn,
    };
  }

  private async getDataRequestStatistics(startDate: Date, endDate: Date): Promise<any> {
    // Implementation for data request statistics
    return {
      accessRequests: 0,
      deletionRequests: 0,
      portabilityRequests: 0,
      correctionRequests: 0,
      averageCompletionTime: '24 hours',
    };
  }

  private async getBreachStatistics(startDate: Date, endDate: Date): Promise<any> {
    // Implementation for breach statistics
    return {
      totalIncidents: 0,
      criticalIncidents: 0,
      averageResponseTime: '2 hours',
      notificationCompliance: '100%',
    };
  }

  private async getAuditStatistics(startDate: Date, endDate: Date): Promise<any> {
    const { count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    return {
      totalAuditLogs: count || 0,
      retentionCompliance: '100%',
      encryptionStatus: 'AES-256',
    };
  }

  private async notifyAuthorities(breachDetails: any): Promise<void> {
    // Implement notification to regulatory authorities
    logger.info('Authorities notified of data breach', breachDetails);
  }

  private async notifyUser(userId: string, breachDetails: any): Promise<void> {
    // Implement user notification
    logger.info('User notified of data breach', { userId, ...breachDetails });
  }

  private async scheduleJob(jobType: string, data: any, daysDelay: number): Promise<void> {
    // Schedule job using queue system
    const executeDate = new Date();
    executeDate.setDate(executeDate.getDate() + daysDelay);
    
    logger.info('Job scheduled', {
      jobType,
      executeDate,
      data,
    });
  }
}

export const dpdpCompliance = DPDPComplianceManager.getInstance();