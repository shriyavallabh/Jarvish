/**
 * Admin Service Tests
 * Tests for administrative operations and dashboard management
 */

import { AdminService } from '@/lib/services/admin-service';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {},
            error: null
          })),
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: [],
              error: null
            }))
          }))
        })),
        in: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        data: {},
        error: null
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null
        }))
      }))
    })),
    rpc: jest.fn(),
    auth: {
      admin: {
        listUsers: jest.fn(),
        deleteUser: jest.fn(),
        updateUserById: jest.fn()
      }
    }
  }))
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    flushdb: jest.fn()
  }
}));

describe('AdminService', () => {
  let adminService: AdminService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    adminService = new AdminService();
    mockSupabase = createClient('', '');
  });

  describe('getDashboardMetrics', () => {
    it('should return comprehensive dashboard metrics', async () => {
      // Mock database responses
      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            count: jest.fn(() => ({
              data: [{ count: 150 }],
              error: null
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              count: jest.fn(() => ({
                data: [{ count: 45 }],
                error: null
              }))
            }))
          }))
        });

      mockSupabase.rpc = jest.fn()
        .mockResolvedValueOnce({
          data: { 
            total_revenue: 450000,
            mrr: 75000,
            growth_rate: 0.15
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            delivery_rate: 0.99,
            engagement_rate: 0.72,
            compliance_rate: 0.995
          },
          error: null
        });

      const metrics = await adminService.getDashboardMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.total_advisors).toBe(150);
      expect(metrics.active_advisors_today).toBe(45);
      expect(metrics.total_revenue).toBe(450000);
      expect(metrics.mrr).toBe(75000);
      expect(metrics.platform_health.delivery_rate).toBe(0.99);
      expect(metrics.platform_health.compliance_rate).toBe(0.995);
    });

    it('should cache dashboard metrics', async () => {
      const metrics = { total_advisors: 150 };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          count: jest.fn(() => ({
            data: [{ count: 150 }],
            error: null
          }))
        }))
      }));

      await adminService.getDashboardMetrics();

      expect(redis.setex).toHaveBeenCalledWith(
        'admin:dashboard:metrics',
        300, // 5 minutes cache
        JSON.stringify(expect.any(Object))
      );
    });

    it('should use cached metrics when available', async () => {
      const cachedMetrics = {
        total_advisors: 150,
        cached: true
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedMetrics));

      const metrics = await adminService.getDashboardMetrics();

      expect(metrics.cached).toBe(true);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('manageAdvisors', () => {
    it('should list all advisors with pagination', async () => {
      const mockAdvisors = [
        { id: '1', euin: 'E123456', business_name: 'Advisor 1' },
        { id: '2', euin: 'E123457', business_name: 'Advisor 2' }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              data: mockAdvisors,
              error: null
            }))
          }))
        }))
      }));

      const result = await adminService.listAdvisors({ page: 1, limit: 10 });

      expect(result.advisors).toEqual(mockAdvisors);
      expect(result.advisors).toHaveLength(2);
    });

    it('should suspend an advisor', async () => {
      const advisorId = 'advisor-123';
      const reason = 'SEBI compliance violation';

      mockSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: { id: advisorId, status: 'suspended' },
            error: null
          }))
        }))
      }));

      const result = await adminService.suspendAdvisor(advisorId, reason);

      expect(result.success).toBe(true);
      expect(result.advisor.status).toBe('suspended');
    });

    it('should reactivate a suspended advisor', async () => {
      const advisorId = 'advisor-123';

      mockSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: { id: advisorId, status: 'active' },
            error: null
          }))
        }))
      }));

      const result = await adminService.reactivateAdvisor(advisorId);

      expect(result.success).toBe(true);
      expect(result.advisor.status).toBe('active');
    });

    it('should delete an advisor and all related data', async () => {
      const advisorId = 'advisor-123';

      mockSupabase.auth.admin.deleteUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      });

      mockSupabase.from = jest.fn(() => ({
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }));

      const result = await adminService.deleteAdvisor(advisorId);

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalled();
    });
  });

  describe('contentModeration', () => {
    it('should review and approve content', async () => {
      const contentId = 'content-123';
      const reviewNotes = 'SEBI compliant';

      mockSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: { 
              id: contentId, 
              status: 'approved',
              reviewed_at: expect.any(Date)
            },
            error: null
          }))
        }))
      }));

      const result = await adminService.approveContent(contentId, reviewNotes);

      expect(result.success).toBe(true);
      expect(result.content.status).toBe('approved');
    });

    it('should reject content with violations', async () => {
      const contentId = 'content-123';
      const violations = ['Guaranteed returns claim', 'Missing risk disclaimer'];

      mockSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: { 
              id: contentId, 
              status: 'rejected',
              violations
            },
            error: null
          }))
        }))
      }));

      const result = await adminService.rejectContent(contentId, violations);

      expect(result.success).toBe(true);
      expect(result.content.status).toBe('rejected');
      expect(result.content.violations).toEqual(violations);
    });

    it('should get content moderation queue', async () => {
      const pendingContent = [
        { id: '1', status: 'pending', created_at: new Date() },
        { id: '2', status: 'pending', created_at: new Date() }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                data: pendingContent,
                error: null
              }))
            }))
          }))
        }))
      }));

      const queue = await adminService.getModerationQueue();

      expect(queue).toEqual(pendingContent);
      expect(queue).toHaveLength(2);
    });
  });

  describe('systemConfiguration', () => {
    it('should update system configuration', async () => {
      const config = {
        delivery_time: '06:00',
        fallback_enabled: true,
        compliance_threshold: 0.95
      };

      mockSupabase.from = jest.fn(() => ({
        upsert: jest.fn(() => ({
          data: config,
          error: null
        }))
      }));

      const result = await adminService.updateSystemConfig(config);

      expect(result.success).toBe(true);
      expect(result.config).toEqual(config);

      // Verify cache is cleared
      expect(redis.del).toHaveBeenCalledWith('system:config');
    });

    it('should get current system configuration', async () => {
      const config = {
        delivery_time: '06:00',
        fallback_enabled: true
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: config,
            error: null
          }))
        }))
      }));

      const result = await adminService.getSystemConfig();

      expect(result).toEqual(config);
    });
  });

  describe('complianceReports', () => {
    it('should generate SEBI compliance report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: [
                { compliance_rate: 0.99, violations: [] },
                { compliance_rate: 0.98, violations: ['minor'] }
              ],
              error: null
            }))
          }))
        }))
      }));

      const report = await adminService.generateComplianceReport(startDate, endDate);

      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.overall_compliance_rate).toBeGreaterThan(0.95);
      expect(report.total_content_reviewed).toBe(2);
    });

    it('should get audit logs for inspection', async () => {
      const filters = {
        advisor_id: 'advisor-123',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      };

      const mockLogs = [
        { action: 'CONTENT_CREATED', timestamp: new Date() },
        { action: 'CONTENT_APPROVED', timestamp: new Date() }
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

      const logs = await adminService.getAuditLogs(filters);

      expect(logs).toEqual(mockLogs);
      expect(logs).toHaveLength(2);
    });
  });

  describe('bulkOperations', () => {
    it('should send bulk notifications to advisors', async () => {
      const advisorIds = ['advisor-1', 'advisor-2', 'advisor-3'];
      const message = {
        title: 'Platform Update',
        content: 'New features available',
        type: 'announcement'
      };

      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          data: advisorIds.map(id => ({ advisor_id: id, ...message })),
          error: null
        }))
      }));

      const result = await adminService.sendBulkNotification(advisorIds, message);

      expect(result.success).toBe(true);
      expect(result.sent_count).toBe(3);
    });

    it('should bulk update advisor subscriptions', async () => {
      const advisorIds = ['advisor-1', 'advisor-2'];
      const update = {
        subscription_tier: 'PRO',
        valid_until: new Date('2025-01-31')
      };

      mockSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({
          in: jest.fn(() => ({
            data: advisorIds.map(id => ({ id, ...update })),
            error: null
          }))
        }))
      }));

      const result = await adminService.bulkUpdateSubscriptions(advisorIds, update);

      expect(result.success).toBe(true);
      expect(result.updated_count).toBe(2);
    });
  });

  describe('performanceMonitoring', () => {
    it('should get system performance metrics', async () => {
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: {
          api_response_time: 0.245,
          database_query_time: 0.032,
          ai_processing_time: 1.2,
          whatsapp_delivery_rate: 0.99
        },
        error: null
      });

      const metrics = await adminService.getPerformanceMetrics();

      expect(metrics.api_response_time).toBeLessThan(1.5);
      expect(metrics.whatsapp_delivery_rate).toBeGreaterThanOrEqual(0.99);
    });

    it('should detect performance degradation', async () => {
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: {
          api_response_time: 2.5, // Above threshold
          whatsapp_delivery_rate: 0.97 // Below SLA
        },
        error: null
      });

      const result = await adminService.checkPerformanceHealth();

      expect(result.healthy).toBe(false);
      expect(result.issues).toContain('API response time exceeds threshold');
      expect(result.issues).toContain('WhatsApp delivery rate below SLA');
    });
  });

  describe('emergencyControls', () => {
    it('should pause all deliveries in emergency', async () => {
      const reason = 'Critical compliance issue detected';

      mockSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: { status: 'paused' },
            error: null
          }))
        }))
      }));

      const result = await adminService.pauseAllDeliveries(reason);

      expect(result.success).toBe(true);
      expect(result.status).toBe('paused');
      expect(redis.set).toHaveBeenCalledWith('system:emergency:pause', 'true');
    });

    it('should resume deliveries after emergency', async () => {
      mockSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: { status: 'active' },
            error: null
          }))
        }))
      }));

      const result = await adminService.resumeDeliveries();

      expect(result.success).toBe(true);
      expect(result.status).toBe('active');
      expect(redis.del).toHaveBeenCalledWith('system:emergency:pause');
    });

    it('should flush all caches in emergency', async () => {
      const result = await adminService.flushAllCaches();

      expect(result.success).toBe(true);
      expect(redis.flushdb).toHaveBeenCalled();
    });
  });

  describe('accessControl', () => {
    it('should verify admin permissions', async () => {
      const userId = 'user-123';
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { role: 'super_admin' },
              error: null
            }))
          }))
        }))
      }));

      const hasAccess = await adminService.verifyAdminAccess(userId, 'delete_advisor');

      expect(hasAccess).toBe(true);
    });

    it('should deny access for non-admin users', async () => {
      const userId = 'user-123';
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { role: 'advisor' },
              error: null
            }))
          }))
        }))
      }));

      const hasAccess = await adminService.verifyAdminAccess(userId, 'delete_advisor');

      expect(hasAccess).toBe(false);
    });
  });

  describe('dataExport', () => {
    it('should export advisor data for regulatory inspection', async () => {
      const advisorId = 'advisor-123';
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: {
              advisor: { id: advisorId, euin: 'E123456' },
              content: [],
              audit_logs: [],
              compliance_records: []
            },
            error: null
          }))
        }))
      }));

      const exportData = await adminService.exportAdvisorData(advisorId);

      expect(exportData.advisor_id).toBe(advisorId);
      expect(exportData.export_format).toBe('regulatory_compliant');
      expect(exportData.includes_audit_trail).toBe(true);
    });
  });
});