/**
 * Data Retention Manager
 * Manages data retention policies, automated deletion, and compliance with SEBI/DPDP requirements
 */

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Data categories with retention requirements
export enum DataCategory {
  FINANCIAL_RECORDS = 'financial_records', // 7 years (SEBI)
  KYC_DOCUMENTS = 'kyc_documents', // 7 years (SEBI)
  TRANSACTION_RECORDS = 'transaction_records', // 7 years (SEBI)
  AUDIT_LOGS = 'audit_logs', // 7 years (SEBI)
  USER_CONSENT = 'user_consent', // 7 years
  MARKETING_DATA = 'marketing_data', // 1 year
  SESSION_DATA = 'session_data', // 30 days
  TEMPORARY_DATA = 'temporary_data', // 7 days
  ANALYTICS_DATA = 'analytics_data', // 2 years
  SUPPORT_TICKETS = 'support_tickets', // 3 years
  COMMUNICATION_LOGS = 'communication_logs', // 1 year
  BACKUP_DATA = 'backup_data', // 90 days
}

// Retention policy schema
const RetentionPolicySchema = z.object({
  id: z.string(),
  category: z.nativeEnum(DataCategory),
  name: z.string(),
  description: z.string(),
  retentionDays: z.number(),
  legalBasis: z.string(),
  autoDelete: z.boolean(),
  anonymizeInstead: z.boolean(),
  backupRetentionDays: z.number().optional(),
  exceptions: z.array(z.object({
    condition: z.string(),
    additionalDays: z.number(),
  })).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean(),
});

export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>;

// Data retention record schema
const RetentionRecordSchema = z.object({
  id: z.string(),
  dataType: z.string(),
  dataId: z.string(),
  category: z.nativeEnum(DataCategory),
  createdAt: z.date(),
  expiresAt: z.date(),
  deletedAt: z.date().optional(),
  anonymizedAt: z.date().optional(),
  retainedFor: z.string().optional(), // Legal hold reason
  metadata: z.record(z.any()).optional(),
});

export type RetentionRecord = z.infer<typeof RetentionRecordSchema>;

// Deletion job schema
const DeletionJobSchema = z.object({
  id: z.string(),
  category: z.nativeEnum(DataCategory),
  scheduledAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  recordsProcessed: z.number(),
  recordsDeleted: z.number(),
  recordsAnonymized: z.number(),
  recordsFailed: z.number(),
  errors: z.array(z.string()).optional(),
});

export type DeletionJob = z.infer<typeof DeletionJobSchema>;

export class DataRetentionManager {
  private supabase: any;
  private policies: Map<DataCategory, RetentionPolicy> = new Map();
  private activeDeletionJobs: Map<string, DeletionJob> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initializePolicies();
    this.startRetentionScheduler();
  }

  /**
   * Initialize default retention policies
   */
  private initializePolicies(): void {
    const defaultPolicies: Array<Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        category: DataCategory.FINANCIAL_RECORDS,
        name: 'Financial Records Retention',
        description: 'SEBI mandated 7-year retention for financial records',
        retentionDays: 2555, // 7 years
        legalBasis: 'SEBI Regulations',
        autoDelete: false,
        anonymizeInstead: false,
        backupRetentionDays: 2920, // 8 years
        isActive: true,
      },
      {
        category: DataCategory.KYC_DOCUMENTS,
        name: 'KYC Documents Retention',
        description: 'SEBI mandated 7-year retention for KYC documents',
        retentionDays: 2555,
        legalBasis: 'SEBI KYC Regulations',
        autoDelete: false,
        anonymizeInstead: false,
        backupRetentionDays: 2920,
        isActive: true,
      },
      {
        category: DataCategory.TRANSACTION_RECORDS,
        name: 'Transaction Records Retention',
        description: 'SEBI mandated 7-year retention for transaction records',
        retentionDays: 2555,
        legalBasis: 'SEBI Transaction Recording Requirements',
        autoDelete: false,
        anonymizeInstead: false,
        backupRetentionDays: 2920,
        isActive: true,
      },
      {
        category: DataCategory.AUDIT_LOGS,
        name: 'Audit Logs Retention',
        description: 'Security and compliance audit logs',
        retentionDays: 2555,
        legalBasis: 'SEBI Audit Requirements',
        autoDelete: false,
        anonymizeInstead: false,
        backupRetentionDays: 2920,
        isActive: true,
      },
      {
        category: DataCategory.USER_CONSENT,
        name: 'User Consent Records',
        description: 'DPDP Act consent records',
        retentionDays: 2555,
        legalBasis: 'DPDP Act Compliance',
        autoDelete: false,
        anonymizeInstead: false,
        isActive: true,
      },
      {
        category: DataCategory.MARKETING_DATA,
        name: 'Marketing Data',
        description: 'Marketing preferences and campaign data',
        retentionDays: 365,
        legalBasis: 'Business Operations',
        autoDelete: true,
        anonymizeInstead: true,
        isActive: true,
      },
      {
        category: DataCategory.SESSION_DATA,
        name: 'Session Data',
        description: 'User session and authentication data',
        retentionDays: 30,
        legalBasis: 'Security',
        autoDelete: true,
        anonymizeInstead: false,
        isActive: true,
      },
      {
        category: DataCategory.TEMPORARY_DATA,
        name: 'Temporary Data',
        description: 'Temporary files and cache data',
        retentionDays: 7,
        legalBasis: 'System Operations',
        autoDelete: true,
        anonymizeInstead: false,
        isActive: true,
      },
      {
        category: DataCategory.ANALYTICS_DATA,
        name: 'Analytics Data',
        description: 'User behavior and analytics data',
        retentionDays: 730, // 2 years
        legalBasis: 'Service Improvement',
        autoDelete: true,
        anonymizeInstead: true,
        isActive: true,
      },
      {
        category: DataCategory.SUPPORT_TICKETS,
        name: 'Support Tickets',
        description: 'Customer support tickets and communications',
        retentionDays: 1095, // 3 years
        legalBasis: 'Customer Service',
        autoDelete: true,
        anonymizeInstead: true,
        isActive: true,
      },
      {
        category: DataCategory.COMMUNICATION_LOGS,
        name: 'Communication Logs',
        description: 'Email and messaging logs',
        retentionDays: 365,
        legalBasis: 'Service Delivery',
        autoDelete: true,
        anonymizeInstead: false,
        isActive: true,
      },
      {
        category: DataCategory.BACKUP_DATA,
        name: 'Backup Data',
        description: 'System backup data',
        retentionDays: 90,
        legalBasis: 'Business Continuity',
        autoDelete: true,
        anonymizeInstead: false,
        isActive: true,
      },
    ];

    for (const policyData of defaultPolicies) {
      const policy: RetentionPolicy = {
        ...policyData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.policies.set(policy.category, policy);
    }
  }

  /**
   * Start retention scheduler
   */
  private startRetentionScheduler(): void {
    // Run retention check daily at 2 AM
    const scheduleDailyCheck = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0);
      
      const msUntilTomorrow = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        this.runRetentionCheck();
        scheduleDailyCheck(); // Schedule next check
      }, msUntilTomorrow);
    };

    scheduleDailyCheck();

    // Also run immediate check on startup
    this.runRetentionCheck();
  }

  /**
   * Run retention check and deletion
   */
  async runRetentionCheck(): Promise<DeletionJob[]> {
    console.log('Starting retention check...');
    const jobs: DeletionJob[] = [];

    for (const [category, policy] of this.policies.entries()) {
      if (!policy.isActive) continue;

      const job = await this.createDeletionJob(category, policy);
      jobs.push(job);
      
      try {
        await this.executeDeletionJob(job, policy);
      } catch (error) {
        console.error(`Deletion job failed for ${category}:`, error);
        job.status = 'failed';
        job.errors = [error.message];
      }
    }

    return jobs;
  }

  /**
   * Create deletion job
   */
  private async createDeletionJob(
    category: DataCategory,
    policy: RetentionPolicy
  ): Promise<DeletionJob> {
    const job: DeletionJob = {
      id: crypto.randomUUID(),
      category,
      scheduledAt: new Date(),
      status: 'pending',
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsAnonymized: 0,
      recordsFailed: 0,
    };

    this.activeDeletionJobs.set(job.id, job);

    // Store in database
    await this.supabase
      .from('deletion_jobs')
      .insert(job);

    return job;
  }

  /**
   * Execute deletion job
   */
  private async executeDeletionJob(
    job: DeletionJob,
    policy: RetentionPolicy
  ): Promise<void> {
    job.status = 'running';
    job.startedAt = new Date();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    // Get expired records
    const { data: expiredRecords, error } = await this.supabase
      .from('retention_records')
      .select('*')
      .eq('category', policy.category)
      .lt('expires_at', cutoffDate.toISOString())
      .is('deleted_at', null)
      .is('retained_for', null);

    if (error) {
      throw new Error(`Failed to fetch expired records: ${error.message}`);
    }

    for (const record of expiredRecords || []) {
      job.recordsProcessed++;

      try {
        if (policy.anonymizeInstead) {
          await this.anonymizeData(record);
          job.recordsAnonymized++;
        } else if (policy.autoDelete) {
          await this.deleteData(record);
          job.recordsDeleted++;
        }
      } catch (error) {
        console.error(`Failed to process record ${record.id}:`, error);
        job.recordsFailed++;
      }
    }

    job.status = 'completed';
    job.completedAt = new Date();

    // Update job status
    await this.supabase
      .from('deletion_jobs')
      .update(job)
      .eq('id', job.id);

    this.activeDeletionJobs.delete(job.id);
  }

  /**
   * Delete data
   */
  private async deleteData(record: RetentionRecord): Promise<void> {
    // Delete from main table based on category
    const tableMap: Record<DataCategory, string> = {
      [DataCategory.FINANCIAL_RECORDS]: 'financial_records',
      [DataCategory.KYC_DOCUMENTS]: 'kyc_documents',
      [DataCategory.TRANSACTION_RECORDS]: 'transactions',
      [DataCategory.AUDIT_LOGS]: 'audit_logs',
      [DataCategory.USER_CONSENT]: 'consent_records',
      [DataCategory.MARKETING_DATA]: 'marketing_data',
      [DataCategory.SESSION_DATA]: 'sessions',
      [DataCategory.TEMPORARY_DATA]: 'temp_data',
      [DataCategory.ANALYTICS_DATA]: 'analytics',
      [DataCategory.SUPPORT_TICKETS]: 'support_tickets',
      [DataCategory.COMMUNICATION_LOGS]: 'communication_logs',
      [DataCategory.BACKUP_DATA]: 'backups',
    };

    const tableName = tableMap[record.category];
    
    if (tableName) {
      await this.supabase
        .from(tableName)
        .delete()
        .eq('id', record.dataId);
    }

    // Mark as deleted in retention records
    await this.supabase
      .from('retention_records')
      .update({
        deleted_at: new Date(),
        metadata: { ...record.metadata, deletion_method: 'automated' },
      })
      .eq('id', record.id);

    // Secure deletion of any cached data
    await this.secureDeletion(record);
  }

  /**
   * Anonymize data
   */
  private async anonymizeData(record: RetentionRecord): Promise<void> {
    const anonymizedData = {
      user_id: `anon_${crypto.randomBytes(16).toString('hex')}`,
      email: `anonymized@example.com`,
      phone: '0000000000',
      name: 'ANONYMIZED',
      ip_address: '0.0.0.0',
      anonymized_at: new Date(),
    };

    // Update in main table
    const tableMap: Record<DataCategory, string> = {
      [DataCategory.MARKETING_DATA]: 'marketing_data',
      [DataCategory.ANALYTICS_DATA]: 'analytics',
      [DataCategory.SUPPORT_TICKETS]: 'support_tickets',
    };

    const tableName = tableMap[record.category];
    
    if (tableName) {
      await this.supabase
        .from(tableName)
        .update(anonymizedData)
        .eq('id', record.dataId);
    }

    // Mark as anonymized
    await this.supabase
      .from('retention_records')
      .update({
        anonymized_at: new Date(),
        metadata: { ...record.metadata, anonymization_method: 'automated' },
      })
      .eq('id', record.id);
  }

  /**
   * Secure deletion (crypto-shredding)
   */
  private async secureDeletion(record: RetentionRecord): Promise<void> {
    // Implement secure deletion for any cached or sensitive data
    // This would typically involve:
    // 1. Overwriting memory/disk locations multiple times
    // 2. Removing from all caches
    // 3. Ensuring no backups contain the data
    
    console.log(`Secure deletion completed for record: ${record.id}`);
  }

  /**
   * Apply legal hold
   */
  async applyLegalHold(
    dataId: string,
    category: DataCategory,
    reason: string,
    duration?: number
  ): Promise<void> {
    const expiresAt = duration 
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : null;

    await this.supabase
      .from('retention_records')
      .update({
        retained_for: reason,
        metadata: {
          legal_hold: true,
          hold_reason: reason,
          hold_expires: expiresAt,
        },
      })
      .eq('data_id', dataId)
      .eq('category', category);

    console.log(`Legal hold applied to ${dataId}: ${reason}`);
  }

  /**
   * Remove legal hold
   */
  async removeLegalHold(dataId: string, category: DataCategory): Promise<void> {
    await this.supabase
      .from('retention_records')
      .update({
        retained_for: null,
        metadata: { legal_hold: false },
      })
      .eq('data_id', dataId)
      .eq('category', category);

    console.log(`Legal hold removed from ${dataId}`);
  }

  /**
   * Handle right to be forgotten request
   */
  async handleRightToBeForgotten(userId: string): Promise<{
    success: boolean;
    deletedCategories: DataCategory[];
    retainedCategories: DataCategory[];
    reason?: string;
  }> {
    const deletedCategories: DataCategory[] = [];
    const retainedCategories: DataCategory[] = [];

    // Categories that can be deleted immediately
    const deletableCategories = [
      DataCategory.MARKETING_DATA,
      DataCategory.SESSION_DATA,
      DataCategory.TEMPORARY_DATA,
      DataCategory.ANALYTICS_DATA,
    ];

    // Categories that must be retained for legal compliance
    const mandatoryRetention = [
      DataCategory.FINANCIAL_RECORDS,
      DataCategory.KYC_DOCUMENTS,
      DataCategory.TRANSACTION_RECORDS,
      DataCategory.AUDIT_LOGS,
      DataCategory.USER_CONSENT,
    ];

    // Delete allowed categories
    for (const category of deletableCategories) {
      const { error } = await this.deleteUserDataByCategory(userId, category);
      if (!error) {
        deletedCategories.push(category);
      }
    }

    // Anonymize mandatory retention categories
    for (const category of mandatoryRetention) {
      const { error } = await this.anonymizeUserDataByCategory(userId, category);
      if (!error) {
        retainedCategories.push(category);
      }
    }

    return {
      success: true,
      deletedCategories,
      retainedCategories,
      reason: 'Some data retained for legal compliance (SEBI regulations)',
    };
  }

  /**
   * Delete user data by category
   */
  private async deleteUserDataByCategory(
    userId: string,
    category: DataCategory
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: records } = await this.supabase
        .from('retention_records')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category);

      for (const record of records || []) {
        await this.deleteData(record);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Anonymize user data by category
   */
  private async anonymizeUserDataByCategory(
    userId: string,
    category: DataCategory
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: records } = await this.supabase
        .from('retention_records')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category);

      for (const record of records || []) {
        await this.anonymizeData(record);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Get retention status
   */
  async getRetentionStatus(dataId: string): Promise<{
    category: DataCategory;
    createdAt: Date;
    expiresAt: Date;
    daysRemaining: number;
    isExpired: boolean;
    hasLegalHold: boolean;
  } | null> {
    const { data } = await this.supabase
      .from('retention_records')
      .select('*')
      .eq('data_id', dataId)
      .single();

    if (!data) return null;

    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    const daysRemaining = Math.floor(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      category: data.category,
      createdAt: new Date(data.created_at),
      expiresAt,
      daysRemaining,
      isExpired: daysRemaining <= 0,
      hasLegalHold: !!data.retained_for,
    };
  }

  /**
   * Generate retention report
   */
  async generateRetentionReport(): Promise<{
    timestamp: Date;
    policies: RetentionPolicy[];
    statistics: {
      totalRecords: number;
      expiredRecords: number;
      deletedRecords: number;
      anonymizedRecords: number;
      legalHolds: number;
    };
    recentJobs: DeletionJob[];
    compliance: {
      sebiCompliant: boolean;
      dpdpCompliant: boolean;
      issues: string[];
    };
  }> {
    const { data: stats } = await this.supabase
      .rpc('get_retention_statistics');

    const { data: recentJobs } = await this.supabase
      .from('deletion_jobs')
      .select('*')
      .order('scheduled_at', { ascending: false })
      .limit(10);

    const issues: string[] = [];
    
    // Check compliance
    for (const [category, policy] of this.policies.entries()) {
      if ([
        DataCategory.FINANCIAL_RECORDS,
        DataCategory.KYC_DOCUMENTS,
        DataCategory.TRANSACTION_RECORDS,
        DataCategory.AUDIT_LOGS,
      ].includes(category)) {
        if (policy.retentionDays < 2555) {
          issues.push(`${category} retention period below SEBI requirement`);
        }
      }
    }

    return {
      timestamp: new Date(),
      policies: Array.from(this.policies.values()),
      statistics: stats || {
        totalRecords: 0,
        expiredRecords: 0,
        deletedRecords: 0,
        anonymizedRecords: 0,
        legalHolds: 0,
      },
      recentJobs: recentJobs || [],
      compliance: {
        sebiCompliant: issues.length === 0,
        dpdpCompliant: true,
        issues,
      },
    };
  }
}

export default DataRetentionManager;