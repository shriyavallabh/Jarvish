import { z } from 'zod';

// Audit log entry schema
export const AuditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  advisorId: z.string(),
  action: z.enum([
    'content_generation',
    'compliance_check',
    'content_approval',
    'content_rejection',
    'manual_override',
    'bulk_generation'
  ]),
  contentHash: z.string(),
  content: z.object({
    original: z.string(),
    modified: z.string().optional(),
    final: z.string().optional()
  }),
  compliance: z.object({
    riskScore: z.number(),
    isCompliant: z.boolean(),
    violations: z.array(z.object({
      type: z.string(),
      severity: z.string(),
      description: z.string()
    })),
    aiAnalysis: z.object({
      used: z.boolean(),
      model: z.string().optional(),
      confidence: z.number().optional(),
      fallbackUsed: z.boolean()
    }).optional()
  }),
  metadata: z.object({
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    sessionId: z.string().optional(),
    requestId: z.string(),
    executionTime: z.number(),
    costEstimate: z.number().optional()
  }),
  regulatory: z.object({
    euin: z.string().optional(),
    sebiCode: z.array(z.string()),
    retentionDate: z.string(),
    exportable: z.boolean()
  })
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

// Audit logger service
export class AuditLogger {
  private logs: Map<string, AuditLogEntry[]> = new Map();
  private retentionPeriod = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds

  constructor(private storageBackend: 'memory' | 'database' | 'file' = 'memory') {
    // In production, this would connect to PostgreSQL or similar
    // For now, using in-memory storage
  }

  // Create audit log entry
  async log(params: {
    advisorId: string;
    action: AuditLogEntry['action'];
    content: {
      original: string;
      modified?: string;
      final?: string;
    };
    compliance: {
      riskScore: number;
      isCompliant: boolean;
      violations: Array<{
        type: string;
        severity: string;
        description: string;
      }>;
      aiAnalysis?: {
        used: boolean;
        model?: string;
        confidence?: number;
        fallbackUsed: boolean;
      };
    };
    metadata?: {
      ip?: string;
      userAgent?: string;
      sessionId?: string;
      executionTime: number;
      costEstimate?: number;
    };
    euin?: string;
    sebiCodes?: string[];
  }): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      advisorId: params.advisorId,
      action: params.action,
      contentHash: this.hashContent(params.content.final || params.content.original),
      content: params.content,
      compliance: params.compliance,
      metadata: {
        ...params.metadata,
        requestId: this.generateRequestId(),
        executionTime: params.metadata?.executionTime || 0
      },
      regulatory: {
        euin: params.euin,
        sebiCode: params.sebiCodes || [],
        retentionDate: this.calculateRetentionDate(),
        exportable: true
      }
    };

    // Validate entry
    const validated = AuditLogEntrySchema.parse(entry);

    // Store the log
    await this.store(validated);

    // Trigger async export if needed
    if (params.compliance.riskScore > 70 || !params.compliance.isCompliant) {
      this.scheduleHighRiskExport(validated);
    }

    return validated;
  }

  // Store audit log
  private async store(entry: AuditLogEntry): Promise<void> {
    const advisorLogs = this.logs.get(entry.advisorId) || [];
    advisorLogs.push(entry);
    this.logs.set(entry.advisorId, advisorLogs);

    // In production, also persist to database
    if (this.storageBackend === 'database') {
      await this.persistToDatabase(entry);
    }
  }

  // Retrieve audit logs
  async getAuditLogs(params: {
    advisorId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: AuditLogEntry['action'];
    complianceStatus?: 'compliant' | 'non-compliant';
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: AuditLogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    let allLogs: AuditLogEntry[] = [];

    // Collect logs based on filters
    if (params.advisorId) {
      allLogs = this.logs.get(params.advisorId) || [];
    } else {
      this.logs.forEach(logs => {
        allLogs.push(...logs);
      });
    }

    // Apply filters
    let filtered = allLogs;

    if (params.startDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= params.startDate!
      );
    }

    if (params.endDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= params.endDate!
      );
    }

    if (params.action) {
      filtered = filtered.filter(log => log.action === params.action);
    }

    if (params.complianceStatus) {
      filtered = filtered.filter(log => 
        params.complianceStatus === 'compliant' 
          ? log.compliance.isCompliant 
          : !log.compliance.isCompliant
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply pagination
    const limit = params.limit || 100;
    const offset = params.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      logs: paginated,
      total: filtered.length,
      hasMore: offset + limit < filtered.length
    };
  }

  // Export logs for regulatory compliance
  async exportForCompliance(params: {
    advisorId?: string;
    startDate: Date;
    endDate: Date;
    format?: 'json' | 'csv';
  }): Promise<{
    data: string;
    recordCount: number;
    checksum: string;
  }> {
    const { logs } = await this.getAuditLogs({
      advisorId: params.advisorId,
      startDate: params.startDate,
      endDate: params.endDate
    });

    // Filter only exportable logs
    const exportable = logs.filter(log => log.regulatory.exportable);

    // Convert to requested format
    let data: string;
    if (params.format === 'csv') {
      data = this.convertToCSV(exportable);
    } else {
      data = JSON.stringify(exportable, null, 2);
    }

    // Generate checksum for integrity
    const checksum = this.generateChecksum(data);

    return {
      data,
      recordCount: exportable.length,
      checksum
    };
  }

  // Analytics and insights
  async getComplianceAnalytics(advisorId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<{
    totalChecks: number;
    complianceRate: number;
    averageRiskScore: number;
    commonViolations: Array<{ type: string; count: number }>;
    trendsData: Array<{ date: string; riskScore: number; complianceRate: number }>;
    aiUsageRate: number;
    averageExecutionTime: number;
  }> {
    const logs = this.logs.get(advisorId) || [];
    
    // Filter by period
    const now = new Date();
    const periodMs = period === 'day' ? 24 * 60 * 60 * 1000 :
                     period === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                     30 * 24 * 60 * 60 * 1000;
    
    const recentLogs = logs.filter(log => 
      new Date(log.timestamp).getTime() > now.getTime() - periodMs
    );

    if (recentLogs.length === 0) {
      return {
        totalChecks: 0,
        complianceRate: 0,
        averageRiskScore: 0,
        commonViolations: [],
        trendsData: [],
        aiUsageRate: 0,
        averageExecutionTime: 0
      };
    }

    // Calculate metrics
    const totalChecks = recentLogs.length;
    const compliantCount = recentLogs.filter(log => log.compliance.isCompliant).length;
    const complianceRate = (compliantCount / totalChecks) * 100;
    
    const totalRiskScore = recentLogs.reduce((sum, log) => sum + log.compliance.riskScore, 0);
    const averageRiskScore = totalRiskScore / totalChecks;

    // Common violations
    const violationCounts = new Map<string, number>();
    recentLogs.forEach(log => {
      log.compliance.violations.forEach(violation => {
        const count = violationCounts.get(violation.type) || 0;
        violationCounts.set(violation.type, count + 1);
      });
    });

    const commonViolations = Array.from(violationCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Trends data (group by day)
    const trendMap = new Map<string, { totalScore: number; compliant: number; count: number }>();
    recentLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { totalScore: 0, compliant: 0, count: 0 };
      existing.totalScore += log.compliance.riskScore;
      existing.compliant += log.compliance.isCompliant ? 1 : 0;
      existing.count += 1;
      trendMap.set(date, existing);
    });

    const trendsData = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        riskScore: data.totalScore / data.count,
        complianceRate: (data.compliant / data.count) * 100
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // AI usage rate
    const aiUsedCount = recentLogs.filter(log => 
      log.compliance.aiAnalysis?.used && !log.compliance.aiAnalysis.fallbackUsed
    ).length;
    const aiUsageRate = (aiUsedCount / totalChecks) * 100;

    // Average execution time
    const totalExecutionTime = recentLogs.reduce((sum, log) => 
      sum + (log.metadata.executionTime || 0), 0
    );
    const averageExecutionTime = totalExecutionTime / totalChecks;

    return {
      totalChecks,
      complianceRate,
      averageRiskScore,
      commonViolations,
      trendsData,
      aiUsageRate,
      averageExecutionTime
    };
  }

  // Privacy-compliant data purge
  async purgeOldLogs(): Promise<number> {
    const now = new Date();
    let purgedCount = 0;

    this.logs.forEach((advisorLogs, advisorId) => {
      const retained = advisorLogs.filter(log => {
        const retentionDate = new Date(log.regulatory.retentionDate);
        if (retentionDate < now) {
          purgedCount++;
          return false;
        }
        return true;
      });
      
      if (retained.length > 0) {
        this.logs.set(advisorId, retained);
      } else {
        this.logs.delete(advisorId);
      }
    });

    return purgedCount;
  }

  // Helper methods
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashContent(content: string): string {
    // Use a simple hash function for now - in production use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }

  private generateChecksum(data: string): string {
    // Simple checksum for now - in production use crypto
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
      checksum = (checksum + data.charCodeAt(i)) % 65536;
    }
    return checksum.toString(16).padStart(4, '0');
  }

  private calculateRetentionDate(): string {
    const date = new Date();
    date.setTime(date.getTime() + this.retentionPeriod);
    return date.toISOString();
  }

  private async persistToDatabase(entry: AuditLogEntry): Promise<void> {
    // In production, this would save to PostgreSQL
    // For now, just a placeholder
    console.log('Would persist to database:', entry.id);
  }

  private scheduleHighRiskExport(entry: AuditLogEntry): void {
    // In production, this would trigger an async job
    // to export high-risk logs for compliance review
    console.log('High-risk content flagged for export:', entry.id);
  }

  private convertToCSV(logs: AuditLogEntry[]): string {
    if (logs.length === 0) return '';

    // Headers
    const headers = [
      'ID',
      'Timestamp',
      'Advisor ID',
      'Action',
      'Content Hash',
      'Risk Score',
      'Compliant',
      'Violations',
      'EUIN',
      'Execution Time (ms)'
    ];

    // Rows
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.advisorId,
      log.action,
      log.contentHash,
      log.compliance.riskScore.toString(),
      log.compliance.isCompliant.toString(),
      log.compliance.violations.map(v => v.type).join('; '),
      log.regulatory.euin || '',
      log.metadata.executionTime.toString()
    ]);

    // Combine
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }
}

// Singleton instance
let auditLogger: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    auditLogger = new AuditLogger(
      process.env.AUDIT_STORAGE_BACKEND as any || 'memory'
    );
  }
  return auditLogger;
}

export default AuditLogger;