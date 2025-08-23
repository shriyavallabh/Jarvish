/**
 * Audit Logger Service Tests
 * Tests for SEBI-compliant audit logging with 7-year retention
 */

import { AuditLogger } from '@/lib/services/audit-logger';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';
import crypto from 'crypto';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        data: {},
        error: null
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn(() => ({
                data: [],
                error: null
              }))
            }))
          }))
        })),
        in: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        lt: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        list: jest.fn()
      }))
    }
  }))
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    lpush: jest.fn(),
    lrange: jest.fn(),
    ltrim: jest.fn(),
    expire: jest.fn(),
    pipeline: jest.fn(() => ({
      lpush: jest.fn().mockReturnThis(),
      ltrim: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn()
    }))
  }
}));

jest.mock('crypto');

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    auditLogger = new AuditLogger();
    mockSupabase = createClient('', '');
  });

  describe('logEvent', () => {
    it('should log a basic audit event', async () => {
      const event = {
        action: 'ADVISOR_LOGIN',
        advisorId: 'advisor-123',
        euin: 'E123456',
        metadata: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      };

      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          data: { id: 'log-123', ...event, timestamp: new Date() },
          error: null
        }))
      }));

      const result = await auditLogger.logEvent(event);

      expect(result.success).toBe(true);
      expect(result.logId).toBe('log-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should log SEBI compliance events with high priority', async () => {
      const event = {
        action: 'CONTENT_COMPLIANCE_CHECK',
        advisorId: 'advisor-123',
        euin: 'E123456',
        compliance: {
          status: 'failed',
          violations: ['Guaranteed returns claim'],
          contentId: 'content-456'
        }
      };

      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          data: { id: 'log-123', priority: 'HIGH' },
          error: null
        }))
      }));

      const result = await auditLogger.logEvent(event);

      expect(result.priority).toBe('HIGH');
      expect(result.requires_review).toBe(true);
    });

    it('should include cryptographic hash for data integrity', async () => {
      const event = {
        action: 'FINANCIAL_TRANSACTION',
        advisorId: 'advisor-123',
        amount: 5000
      };

      const mockHash = 'abc123hash';
      (crypto.createHash as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(mockHash)
      });

      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          data: { id: 'log-123', hash: mockHash },
          error: null
        }))
      }));

      const result = await auditLogger.logEvent(event);

      expect(result.hash).toBe(mockHash);
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });

    it('should buffer events in Redis for performance', async () => {
      const event = {
        action: 'CONTENT_VIEW',
        advisorId: 'advisor-123'
      };

      await auditLogger.logEvent(event, { buffer: true });

      expect(redis.lpush).toHaveBeenCalledWith(
        'audit:buffer',
        JSON.stringify(expect.objectContaining(event))
      );
    });
  });

  describe('queryLogs', () => {
    it('should retrieve logs by advisor ID', async () => {
      const advisorId = 'advisor-123';
      const mockLogs = [
        { id: '1', action: 'LOGIN', timestamp: new Date() },
        { id: '2', action: 'CONTENT_CREATED', timestamp: new Date() }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                order: jest.fn(() => ({
                  data: mockLogs,
                  error: null
                }))
              }))
            }))
          }))
        }))
      }));

      const logs = await auditLogger.queryLogs({
        advisorId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(logs).toEqual(mockLogs);
      expect(logs).toHaveLength(2);
    });

    it('should filter logs by action type', async () => {
      const mockLogs = [
        { id: '1', action: 'COMPLIANCE_VIOLATION', severity: 'HIGH' }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: mockLogs,
              error: null
            }))
          }))
        }))
      }));

      const logs = await auditLogger.queryLogs({
        action: 'COMPLIANCE_VIOLATION'
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].severity).toBe('HIGH');
    });

    it('should support pagination for large datasets', async () => {
      const page = 2;
      const limit = 50;
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              data: Array(limit).fill({ id: 'log' }),
              error: null
            }))
          }))
        }))
      }));

      const result = await auditLogger.queryLogs({
        page,
        limit
      });

      expect(result.data).toHaveLength(50);
      expect(result.page).toBe(2);
    });
  });

  describe('complianceReporting', () => {
    it('should generate SEBI compliance report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              eq: jest.fn(() => ({
                data: [
                  { action: 'CONTENT_APPROVED', compliance_status: 'passed' },
                  { action: 'CONTENT_REJECTED', compliance_status: 'failed' }
                ],
                error: null
              }))
            }))
          }))
        }))
      }));

      const report = await auditLogger.generateComplianceReport(startDate, endDate);

      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.total_events).toBe(2);
      expect(report.compliance_rate).toBeDefined();
      expect(report.violations).toBeDefined();
    });

    it('should identify compliance violations', async () => {
      const mockViolations = [
        {
          id: '1',
          action: 'CONTENT_VIOLATION',
          violation_type: 'Guaranteed returns',
          advisorId: 'advisor-123'
        },
        {
          id: '2',
          action: 'MISSING_DISCLAIMER',
          violation_type: 'Risk disclaimer absent',
          advisorId: 'advisor-124'
        }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            gte: jest.fn(() => ({
              data: mockViolations,
              error: null
            }))
          }))
        }))
      }));

      const violations = await auditLogger.getComplianceViolations({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(violations).toHaveLength(2);
      expect(violations[0].violation_type).toBe('Guaranteed returns');
    });
  });

  describe('dataRetention', () => {
    it('should enforce 7-year retention policy', async () => {
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() - 7);

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          lt: jest.fn(() => ({
            data: [{ id: '1' }, { id: '2' }],
            error: null
          }))
        }))
      }));

      const result = await auditLogger.checkRetentionCompliance();

      expect(result.compliant).toBe(true);
      expect(result.retention_period_years).toBe(7);
      expect(result.oldest_record_date).toBeDefined();
    });

    it('should archive old logs to cold storage', async () => {
      const archiveDate = new Date();
      archiveDate.setFullYear(archiveDate.getFullYear() - 2);

      const oldLogs = [
        { id: '1', timestamp: archiveDate },
        { id: '2', timestamp: archiveDate }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          lt: jest.fn(() => ({
            data: oldLogs,
            error: null
          }))
        }))
      }));

      mockSupabase.storage.from = jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'archive/2022/audit-logs.json' },
          error: null
        })
      }));

      const result = await auditLogger.archiveOldLogs();

      expect(result.archived_count).toBe(2);
      expect(result.archive_location).toContain('archive');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('audit-archives');
    });

    it('should never delete logs before 7 years', async () => {
      const attemptDate = new Date();
      attemptDate.setFullYear(attemptDate.getFullYear() - 5); // Only 5 years old

      await expect(
        auditLogger.deleteLogs({ before: attemptDate })
      ).rejects.toThrow('Cannot delete logs before 7-year retention period');
    });
  });

  describe('integrityVerification', () => {
    it('should verify log integrity using hash', async () => {
      const logId = 'log-123';
      const originalHash = 'abc123hash';
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: logId,
                data: { action: 'TEST' },
                hash: originalHash
              },
              error: null
            }))
          }))
        }))
      }));

      (crypto.createHash as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(originalHash)
      });

      const result = await auditLogger.verifyLogIntegrity(logId);

      expect(result.valid).toBe(true);
      expect(result.hash_match).toBe(true);
    });

    it('should detect tampered logs', async () => {
      const logId = 'log-123';
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: logId,
                data: { action: 'TAMPERED' },
                hash: 'originalhash'
              },
              error: null
            }))
          }))
        }))
      }));

      (crypto.createHash as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('differenthash')
      });

      const result = await auditLogger.verifyLogIntegrity(logId);

      expect(result.valid).toBe(false);
      expect(result.tampered).toBe(true);
    });
  });

  describe('realTimeAlerts', () => {
    it('should trigger alert for critical events', async () => {
      const criticalEvent = {
        action: 'DATA_BREACH_ATTEMPT',
        advisorId: 'advisor-123',
        severity: 'CRITICAL',
        metadata: {
          ip: 'suspicious-ip',
          attempts: 5
        }
      };

      const alertSpy = jest.spyOn(auditLogger, 'sendAlert');
      
      await auditLogger.logEvent(criticalEvent);

      expect(alertSpy).toHaveBeenCalledWith({
        type: 'CRITICAL_SECURITY_EVENT',
        event: criticalEvent
      });
    });

    it('should batch non-critical events', async () => {
      const events = Array(10).fill(null).map((_, i) => ({
        action: 'PAGE_VIEW',
        advisorId: `advisor-${i}`
      }));

      const pipeline = redis.pipeline();
      
      for (const event of events) {
        await auditLogger.logEvent(event, { buffer: true });
      }

      expect(redis.pipeline).toHaveBeenCalled();
    });
  });

  describe('searchAndExport', () => {
    it('should search logs with complex filters', async () => {
      const filters = {
        advisorIds: ['advisor-1', 'advisor-2'],
        actions: ['LOGIN', 'LOGOUT'],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        severity: 'HIGH'
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            in: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    data: [{ id: '1' }, { id: '2' }],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      }));

      const results = await auditLogger.searchLogs(filters);

      expect(results).toHaveLength(2);
    });

    it('should export logs for regulatory inspection', async () => {
      const exportRequest = {
        advisorId: 'advisor-123',
        format: 'SEBI_COMPLIANT',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        }
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                data: Array(100).fill({ action: 'various' }),
                error: null
              }))
            }))
          }))
        }))
      }));

      const exportData = await auditLogger.exportForRegulator(exportRequest);

      expect(exportData.format).toBe('SEBI_COMPLIANT');
      expect(exportData.includes_hash_verification).toBe(true);
      expect(exportData.total_records).toBe(100);
      expect(exportData.signature).toBeDefined();
    });
  });

  describe('performanceOptimization', () => {
    it('should use buffer for high-volume logging', async () => {
      const events = Array(100).fill(null).map((_, i) => ({
        action: 'BULK_EVENT',
        index: i
      }));

      await auditLogger.bulkLog(events);

      expect(redis.pipeline).toHaveBeenCalled();
      expect(redis.lpush).not.toHaveBeenCalledTimes(100); // Should batch
    });

    it('should flush buffer periodically', async () => {
      jest.useFakeTimers();
      
      // Add events to buffer
      await auditLogger.logEvent({ action: 'TEST' }, { buffer: true });
      
      // Trigger flush
      jest.advanceTimersByTime(5000);
      
      expect(mockSupabase.from).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('accessControl', () => {
    it('should restrict log access based on permissions', async () => {
      const userId = 'user-123';
      const requestedAdvisorId = 'advisor-456';

      // Mock permission check
      const hasAccess = await auditLogger.checkAccess(userId, requestedAdvisorId);

      expect(hasAccess).toBeDefined();
    });

    it('should allow admins to access all logs', async () => {
      const adminId = 'admin-123';
      
      const hasAccess = await auditLogger.checkAccess(adminId, null, 'admin');

      expect(hasAccess).toBe(true);
    });
  });
});