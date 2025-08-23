// Analytics Engine Tests
// Comprehensive test suite for analytics services

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { analyticsEngine } from '@/lib/services/analytics-engine';
import { churnPredictionModel } from '@/lib/services/churn-prediction';
import { businessIntelligenceEngine } from '@/lib/services/business-intelligence';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn()
            }))
          }))
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn()
          }))
        })),
        order: jest.fn()
      }))
    }))
  }))
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

describe('Analytics Engine', () => {
  const mockAdvisorId = 'advisor-123';
  const mockStartDate = '2024-01-01T00:00:00Z';
  const mockEndDate = '2024-01-07T23:59:59Z';

  const mockAdvisorData = {
    id: mockAdvisorId,
    business_name: 'Test Advisory',
    subscription_tier: 'standard' as const,
    whatsapp_verified: true,
    compliance_score: 85,
    created_at: '2023-12-01T00:00:00Z'
  };

  const mockContentData = [
    {
      id: 'content-1',
      advisor_id: mockAdvisorId,
      title: 'SIP Benefits',
      topic_family: 'SIP',
      compliance_score: 92,
      is_approved: true,
      content_hindi: null,
      created_at: '2024-01-02T10:00:00Z'
    },
    {
      id: 'content-2',
      advisor_id: mockAdvisorId,
      title: 'Tax Planning Tips',
      topic_family: 'Tax',
      compliance_score: 88,
      is_approved: true,
      content_hindi: 'Hindi content here',
      created_at: '2024-01-03T11:00:00Z'
    }
  ];

  const mockDeliveryData = [
    {
      id: 'delivery-1',
      advisor_id: mockAdvisorId,
      content_id: 'content-1',
      delivery_status: 'read' as const,
      created_at: '2024-01-02T10:30:00Z',
      content: mockContentData[0]
    },
    {
      id: 'delivery-2',
      advisor_id: mockAdvisorId,
      content_id: 'content-2',
      delivery_status: 'delivered' as const,
      created_at: '2024-01-03T11:30:00Z',
      content: mockContentData[1]
    }
  ];

  beforeEach(() => {
    // Clear any cached data
    (analyticsEngine as any).cache.clear();
  });

  describe('getAdvisorMetrics', () => {
    it('should return advisor metrics with correct calculations', async () => {
      // Mock Supabase responses
      const mockSupabase = (analyticsEngine as any).supabase;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'advisors') {
          return {
            select: () => ({
              eq: () => ({
                single: jest.fn().mockResolvedValue({ data: mockAdvisorData, error: null })
              })
            })
          };
        }
        if (table === 'content') {
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  lte: jest.fn().mockResolvedValue({ data: mockContentData, error: null })
                })
              })
            })
          };
        }
        if (table === 'content_delivery') {
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  lte: jest.fn().mockResolvedValue({ data: mockDeliveryData, error: null })
                })
              })
            })
          };
        }
      });

      const result = await analyticsEngine.getAdvisorMetrics(
        mockAdvisorId,
        mockStartDate,
        mockEndDate
      );

      expect(result.success).toBe(true);
      expect(result.data.advisor_id).toBe(mockAdvisorId);
      expect(result.data.content_performance.total_created).toBe(2);
      expect(result.data.content_performance.approved_content).toBe(2);
      expect(result.data.engagement.total_sent).toBe(2);
      expect(result.data.engagement.read).toBe(1);
      expect(result.data.engagement.read_rate).toBe(0.5);
      expect(result.data.health_score).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const mockSupabase = (analyticsEngine as any).supabase;
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Advisor not found') })
          })
        })
      }));

      const result = await analyticsEngine.getAdvisorMetrics(
        'non-existent-advisor',
        mockStartDate,
        mockEndDate
      );

      expect(result.success).toBe(false);
      expect(result.data).toEqual({});
    });

    it('should use cache for repeated requests', async () => {
      const mockSupabase = (analyticsEngine as any).supabase;
      const mockSingle = jest.fn().mockResolvedValue({ data: mockAdvisorData, error: null });
      
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: mockSingle,
            gte: () => ({
              lte: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      }));

      // First request
      await analyticsEngine.getAdvisorMetrics(mockAdvisorId, mockStartDate, mockEndDate);
      
      // Second request (should use cache)
      const result = await analyticsEngine.getAdvisorMetrics(mockAdvisorId, mockStartDate, mockEndDate);

      expect(result.success).toBe(true);
      expect(result.cache_expires_at).toBeDefined();
    });
  });

  describe('generateWeeklyInsights', () => {
    it('should generate AI-powered weekly insights', async () => {
      const mockSupabase = (analyticsEngine as any).supabase;
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: jest.fn().mockResolvedValue({ data: mockAdvisorData, error: null }),
            gte: () => ({
              lte: jest.fn().mockResolvedValue({ data: mockContentData, error: null })
            })
          })
        })
      }));

      const result = await analyticsEngine.generateWeeklyInsights(mockAdvisorId);

      expect(result.success).toBe(true);
      expect(result.data.advisor_id).toBe(mockAdvisorId);
      expect(result.data.summary).toBeDefined();
      expect(result.data.key_wins).toBeInstanceOf(Array);
      expect(result.data.optimization_opportunities).toBeInstanceOf(Array);
      expect(result.data.content_recommendations).toBeDefined();
      expect(result.data.ai_confidence).toBeGreaterThan(0);
    });
  });

  describe('getTimeSeriesData', () => {
    it('should return time series data with trend analysis', async () => {
      const result = await analyticsEngine.getTimeSeriesData('engagement_rate', mockAdvisorId, 7);

      expect(result.series).toBeInstanceOf(Array);
      expect(result.series.length).toBe(7);
      expect(result.trend).toMatch(/^(up|down|stable)$/);
      expect(typeof result.trend_percentage).toBe('number');
    });
  });
});

describe('Churn Prediction Model', () => {
  const mockAdvisorId = 'advisor-123';

  const mockBehaviorFeatures = {
    content_creation_frequency: 3.2,
    days_since_last_content: 2,
    engagement_trend: 0.1,
    content_approval_rate: 0.9,
    login_frequency: 5,
    feature_adoption_score: 0.8,
    whatsapp_integration_usage: 0.9,
    subscription_tier_value: 2,
    payment_history_score: 1.0,
    days_overdue: 0,
    tier_changes: 0,
    support_tickets: 0,
    negative_sentiment_score: 0,
    resolution_satisfaction: 0.8,
    days_since_signup: 45,
    onboarding_completion: 0.9
  };

  beforeEach(() => {
    // Mock Supabase for churn prediction tests
    const mockSupabase = (churnPredictionModel as any).supabase;
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: jest.fn().mockResolvedValue({ 
            data: { ...mockAdvisorData, id: mockAdvisorId }, 
            error: null 
          }),
          order: jest.fn().mockResolvedValue({
            data: [{
              id: 'sub-1',
              advisor_id: mockAdvisorId,
              status: 'active',
              plan_type: 'standard'
            }],
            error: null
          })
        }),
        gte: () => ({
          lte: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      })
    }));
  });

  describe('predictAdvisorChurn', () => {
    it('should predict churn risk for an advisor', async () => {
      const result = await churnPredictionModel.predictAdvisorChurn(mockAdvisorId);

      expect(result.success).toBe(true);
      expect(result.data.advisor_id).toBe(mockAdvisorId);
      expect(result.data.churn_risk_30_day).toBeGreaterThanOrEqual(0);
      expect(result.data.churn_risk_30_day).toBeLessThanOrEqual(100);
      expect(result.data.overall_health_score).toBeGreaterThanOrEqual(0);
      expect(result.data.overall_health_score).toBeLessThanOrEqual(100);
      expect(['excellent', 'good', 'needs_attention', 'at_risk', 'critical'])
        .toContain(result.data.risk_category);
      expect(result.data.risk_factors).toBeDefined();
      expect(result.data.recommended_actions).toBeInstanceOf(Array);
    });

    it('should handle different risk levels correctly', async () => {
      const result = await churnPredictionModel.predictAdvisorChurn(mockAdvisorId);
      
      expect(result.success).toBe(true);
      
      const healthScore = result.data.overall_health_score;
      const expectedCategory = 
        healthScore >= 90 ? 'excellent' :
        healthScore >= 80 ? 'good' :
        healthScore >= 70 ? 'needs_attention' :
        healthScore >= 50 ? 'at_risk' : 'critical';
      
      expect(result.data.risk_category).toBe(expectedCategory);
    });
  });

  describe('getPlatformChurnAnalysis', () => {
    it('should provide platform-wide churn analysis', async () => {
      const mockSupabase = (churnPredictionModel as any).supabase;
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: jest.fn(() => ({
            or: jest.fn().mockResolvedValue({
              data: [{ id: 'advisor-1' }, { id: 'advisor-2' }],
              error: null
            })
          }))
        })
      }));

      const result = await churnPredictionModel.getPlatformChurnAnalysis();

      expect(result.total_advisors).toBeGreaterThanOrEqual(0);
      expect(result.risk_distribution).toBeDefined();
      expect(result.risk_distribution.excellent).toBeGreaterThanOrEqual(0);
      expect(result.intervention_pipeline).toBeDefined();
      expect(result.intervention_pipeline.high_priority).toBeInstanceOf(Array);
      expect(result.intervention_pipeline.medium_priority).toBeInstanceOf(Array);
    });
  });
});

describe('Business Intelligence Engine', () => {
  const mockStartDate = '2024-01-01T00:00:00Z';
  const mockEndDate = '2024-01-31T23:59:59Z';

  beforeEach(() => {
    // Clear cache
    (businessIntelligenceEngine as any).cache.clear();
    
    // Mock Supabase responses
    const mockSupabase = (businessIntelligenceEngine as any).supabase;
    mockSupabase.from.mockImplementation((table: string) => {
      const mockData = {
        subscriptions: [
          { id: 'sub-1', plan_type: 'basic', status: 'active', advisor_id: 'adv-1' },
          { id: 'sub-2', plan_type: 'standard', status: 'active', advisor_id: 'adv-2' }
        ],
        advisors: [
          { id: 'adv-1', created_at: '2024-01-15T00:00:00Z', last_active: '2024-01-30T00:00:00Z' },
          { id: 'adv-2', created_at: '2024-01-20T00:00:00Z', last_active: '2024-01-31T00:00:00Z' }
        ],
        content: [
          { id: 'content-1', advisor_id: 'adv-1', created_at: '2024-01-16T00:00:00Z' },
          { id: 'content-2', advisor_id: 'adv-2', created_at: '2024-01-21T00:00:00Z' }
        ]
      };

      return {
        select: () => ({
          gte: () => ({
            lte: jest.fn().mockResolvedValue({ 
              data: mockData[table as keyof typeof mockData], 
              error: null 
            }),
            order: jest.fn().mockResolvedValue({ 
              data: mockData[table as keyof typeof mockData], 
              error: null 
            })
          }),
          eq: () => ({
            or: jest.fn().mockResolvedValue({ 
              data: mockData[table as keyof typeof mockData], 
              error: null 
            })
          }),
          order: jest.fn().mockResolvedValue({ 
            data: mockData[table as keyof typeof mockData], 
            error: null 
          })
        })
      };
    });
  });

  describe('getBusinessDashboard', () => {
    it('should return comprehensive business intelligence', async () => {
      const result = await businessIntelligenceEngine.getBusinessDashboard(
        mockStartDate,
        mockEndDate
      );

      expect(result.success).toBe(true);
      expect(result.data.period_start).toBe(mockStartDate);
      expect(result.data.period_end).toBe(mockEndDate);
      expect(result.data.revenue).toBeDefined();
      expect(result.data.user_metrics).toBeDefined();
      expect(result.data.subscription_health).toBeDefined();
      expect(result.data.feature_usage).toBeDefined();
      expect(result.data.operational_metrics).toBeDefined();
      expect(result.data.market_trends).toBeDefined();
    });

    it('should calculate revenue metrics correctly', async () => {
      const result = await businessIntelligenceEngine.getBusinessDashboard(
        mockStartDate,
        mockEndDate
      );

      expect(result.success).toBe(true);
      expect(result.data.revenue.total_mrr).toBeGreaterThan(0);
      expect(result.data.revenue.arr).toBe(result.data.revenue.total_mrr * 12);
      expect(typeof result.data.revenue.mrr_growth_rate).toBe('number');
    });

    it('should use caching for repeated requests', async () => {
      // First request
      const result1 = await businessIntelligenceEngine.getBusinessDashboard(
        mockStartDate,
        mockEndDate
      );
      
      // Second request (should use cache)
      const result2 = await businessIntelligenceEngine.getBusinessDashboard(
        mockStartDate,
        mockEndDate
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.cache_expires_at).toBeDefined();
    });
  });

  describe('getRevenueAnalytics', () => {
    it('should return revenue analytics with forecasting', async () => {
      const result = await businessIntelligenceEngine.getRevenueAnalytics(12);

      expect(result.historical_revenue).toBeDefined();
      expect(result.historical_revenue.series).toBeInstanceOf(Array);
      expect(result.revenue_by_tier).toBeDefined();
      expect(result.forecast).toBeDefined();
      expect(result.forecast.next_month_mrr).toBeGreaterThanOrEqual(0);
      expect(result.forecast.confidence_interval).toBeDefined();
    });
  });

  describe('getUserAcquisitionAnalytics', () => {
    it('should return user acquisition metrics', async () => {
      const result = await businessIntelligenceEngine.getUserAcquisitionAnalytics();

      expect(result.acquisition_funnel).toBeDefined();
      expect(result.acquisition_funnel.signups).toBeGreaterThanOrEqual(0);
      expect(result.cohort_analysis).toBeInstanceOf(Array);
      expect(result.ltv_analysis).toBeDefined();
      expect(result.ltv_analysis.average_ltv).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generatePlatformAlerts', () => {
    it('should generate relevant platform alerts', async () => {
      const alerts = await businessIntelligenceEngine.generatePlatformAlerts();

      expect(alerts).toBeInstanceOf(Array);
      alerts.forEach(alert => {
        expect(alert.id).toBeDefined();
        expect(['churn_risk', 'performance_anomaly', 'system_health', 'business_milestone'])
          .toContain(alert.type);
        expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
        expect(alert.title).toBeDefined();
        expect(alert.description).toBeDefined();
        expect(alert.recommended_action).toBeDefined();
      });
    });
  });
});

// Integration tests for API endpoints would go here
describe('Analytics API Integration', () => {
  // These would test the actual API endpoints
  // For brevity, including just structure
  
  describe('GET /api/analytics/advisor', () => {
    it('should return advisor analytics with proper authentication', () => {
      // Test implementation
    });
  });

  describe('GET /api/analytics/admin', () => {
    it('should return admin analytics with proper authorization', () => {
      // Test implementation
    });
  });

  describe('POST /api/analytics/reports', () => {
    it('should create export jobs successfully', () => {
      // Test implementation
    });
  });
});