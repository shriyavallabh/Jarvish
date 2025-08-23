/**
 * Analytics Engine Service Tests
 * Tests for comprehensive analytics and advisor insights
 */

import { AnalyticsEngine } from '@/lib/services/analytics-engine';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';
import { OpenAI } from 'openai';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: [],
              error: null
            }))
          })),
          single: jest.fn(() => ({
            data: {},
            error: null
          }))
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        data: {},
        error: null
      }))
    })),
    rpc: jest.fn()
  }))
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    zadd: jest.fn(),
    zrange: jest.fn(),
    hincrby: jest.fn(),
    hget: jest.fn()
  }
}));

jest.mock('openai');

describe('AnalyticsEngine', () => {
  let analyticsEngine: AnalyticsEngine;
  let mockSupabase: any;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsEngine = new AnalyticsEngine();
    mockSupabase = createClient('', '');
    mockOpenAI = new OpenAI({ apiKey: 'test' });
  });

  describe('Advisor Performance Analytics', () => {
    it('should calculate advisor engagement score', async () => {
      const advisorMetrics = {
        advisorId: 'advisor-123',
        contentCreated: 25,
        clientEngagement: 0.75,
        deliveryRate: 0.98,
        complianceScore: 0.95,
        activeClients: 200,
        monthlyGrowth: 0.05
      };

      const score = await analyticsEngine.calculateEngagementScore(advisorMetrics);

      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.breakdown).toHaveProperty('content_activity');
      expect(score.breakdown).toHaveProperty('client_engagement');
      expect(score.breakdown).toHaveProperty('compliance');
      expect(score.category).toMatch(/high|medium|low/);
    });

    it('should generate weekly advisor insights', async () => {
      const advisorId = 'advisor-123';
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                data: [
                  { date: '2024-01-15', content_created: 5, engagement_rate: 0.72 },
                  { date: '2024-01-16', content_created: 3, engagement_rate: 0.68 },
                  { date: '2024-01-17', content_created: 4, engagement_rate: 0.75 }
                ],
                error: null
              }))
            }))
          }))
        }))
      }));

      const insights = await analyticsEngine.generateWeeklyInsights(advisorId);

      expect(insights.period).toBe('weekly');
      expect(insights.totalContent).toBe(12);
      expect(insights.avgEngagement).toBeCloseTo(0.72, 2);
      expect(insights.trend).toBeDefined();
      expect(insights.recommendations).toBeInstanceOf(Array);
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify top performing content', async () => {
      const contentData = [
        { id: '1', engagement_rate: 0.85, shares: 150, clicks: 200 },
        { id: '2', engagement_rate: 0.92, shares: 200, clicks: 250 },
        { id: '3', engagement_rate: 0.65, shares: 50, clicks: 75 }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  data: contentData,
                  error: null
                }))
              }))
            }))
          }))
        }))
      }));

      const topContent = await analyticsEngine.getTopPerformingContent('advisor-123', 30);

      expect(topContent).toHaveLength(3);
      expect(topContent[0].id).toBe('2'); // Highest engagement
      expect(topContent[0].performanceScore).toBeGreaterThan(topContent[2].performanceScore);
    });

    it('should track content performance over time', async () => {
      const contentId = 'content-123';
      const performanceData = [
        { timestamp: '2024-01-15T06:00:00Z', views: 100, engagement: 0.7 },
        { timestamp: '2024-01-15T12:00:00Z', views: 150, engagement: 0.75 },
        { timestamp: '2024-01-15T18:00:00Z', views: 180, engagement: 0.72 }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: performanceData,
              error: null
            }))
          }))
        }))
      }));

      const performance = await analyticsEngine.trackContentPerformance(contentId);

      expect(performance.totalViews).toBe(430);
      expect(performance.avgEngagement).toBeCloseTo(0.72, 2);
      expect(performance.peakTime).toBe('18:00');
      expect(performance.trend).toBe('growing');
    });
  });

  describe('Client Analytics', () => {
    it('should segment clients by activity', async () => {
      const clients = [
        { id: '1', last_interaction: '2024-01-15', engagement_score: 0.9 },
        { id: '2', last_interaction: '2024-01-01', engagement_score: 0.3 },
        { id: '3', last_interaction: '2024-01-14', engagement_score: 0.7 },
        { id: '4', last_interaction: '2023-12-01', engagement_score: 0.1 }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: clients,
            error: null
          }))
        }))
      }));

      const segments = await analyticsEngine.segmentClients('advisor-123');

      expect(segments.active).toContain('1');
      expect(segments.active).toContain('3');
      expect(segments.at_risk).toContain('2');
      expect(segments.churned).toContain('4');
      expect(segments.summary.total).toBe(4);
      expect(segments.summary.active_rate).toBe(0.5);
    });

    it('should calculate client lifetime value', async () => {
      const clientData = {
        id: 'client-123',
        subscription_start: '2023-01-01',
        monthly_revenue: 2499,
        engagement_score: 0.8,
        referrals: 3
      };

      const ltv = await analyticsEngine.calculateClientLTV(clientData);

      expect(ltv.estimatedLTV).toBeGreaterThan(0);
      expect(ltv.months_active).toBeGreaterThan(0);
      expect(ltv.projected_retention).toBeGreaterThan(0);
      expect(ltv.referral_value).toBeGreaterThan(0);
    });

    it('should predict client churn risk', async () => {
      const clientBehavior = {
        clientId: 'client-123',
        lastActivity: 15, // days ago
        engagementTrend: -0.3, // declining
        contentOpened: 2, // last 30 days
        messagesIgnored: 8
      };

      const churnRisk = await analyticsEngine.predictChurnRisk(clientBehavior);

      expect(churnRisk.risk_score).toBeGreaterThan(0.5);
      expect(churnRisk.risk_level).toMatch(/high|medium/);
      expect(churnRisk.factors).toContain('low_engagement');
      expect(churnRisk.retention_actions).toBeInstanceOf(Array);
    });
  });

  describe('Platform Analytics', () => {
    it('should calculate platform-wide metrics', async () => {
      mockSupabase.rpc = jest.fn()
        .mockResolvedValueOnce({
          data: {
            total_advisors: 1500,
            active_advisors: 1350,
            total_content: 45000,
            total_deliveries: 2000000
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            daily_active_users: 1200,
            weekly_active_users: 1400,
            monthly_active_users: 1450
          },
          error: null
        });

      const metrics = await analyticsEngine.getPlatformMetrics();

      expect(metrics.total_advisors).toBe(1500);
      expect(metrics.advisor_activation_rate).toBe(0.9);
      expect(metrics.dau_mau_ratio).toBeCloseTo(0.83, 2);
      expect(metrics.content_per_advisor).toBe(30);
      expect(metrics.platform_health).toBe('healthy');
    });

    it('should track feature adoption rates', async () => {
      const featureUsage = [
        { feature: 'ai_generation', users: 1200, total_users: 1500 },
        { feature: 'bulk_scheduling', users: 800, total_users: 1500 },
        { feature: 'analytics_dashboard', users: 1100, total_users: 1500 },
        { feature: 'multi_language', users: 600, total_users: 1500 }
      ];

      const adoption = await analyticsEngine.calculateFeatureAdoption(featureUsage);

      expect(adoption.ai_generation).toBe(0.8);
      expect(adoption.bulk_scheduling).toBeCloseTo(0.53, 2);
      expect(adoption.analytics_dashboard).toBeCloseTo(0.73, 2);
      expect(adoption.most_adopted).toBe('ai_generation');
      expect(adoption.least_adopted).toBe('multi_language');
    });

    it('should generate cohort analysis', async () => {
      const cohortData = [
        { cohort: '2024-01', signups: 100, month_1: 90, month_2: 85, month_3: 80 },
        { cohort: '2023-12', signups: 120, month_1: 108, month_2: 100, month_3: 95 },
        { cohort: '2023-11', signups: 80, month_1: 75, month_2: 70, month_3: 68 }
      ];

      const analysis = await analyticsEngine.performCohortAnalysis(cohortData);

      expect(analysis['2024-01'].retention_month_1).toBe(0.9);
      expect(analysis['2024-01'].retention_month_3).toBe(0.8);
      expect(analysis.best_cohort).toBe('2023-11'); // Highest month 3 retention
      expect(analysis.average_3month_retention).toBeCloseTo(0.82, 2);
    });
  });

  describe('Content Analytics', () => {
    it('should analyze content type performance', async () => {
      const contentTypes = [
        { type: 'educational', count: 500, avg_engagement: 0.75, avg_shares: 25 },
        { type: 'market_update', count: 300, avg_engagement: 0.68, avg_shares: 15 },
        { type: 'tax_tips', count: 200, avg_engagement: 0.82, avg_shares: 35 },
        { type: 'investment_ideas', count: 400, avg_engagement: 0.70, avg_shares: 20 }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: contentTypes,
              error: null
            }))
          }))
        }))
      }));

      const analysis = await analyticsEngine.analyzeContentTypes();

      expect(analysis.best_performing).toBe('tax_tips');
      expect(analysis.most_created).toBe('educational');
      expect(analysis.recommendations).toContain('Create more tax_tips content');
      expect(analysis.engagement_by_type.tax_tips).toBe(0.82);
    });

    it('should identify content trends', async () => {
      const trendData = [
        { week: 1, topic: 'budget2024', mentions: 150, engagement: 0.85 },
        { week: 2, topic: 'budget2024', mentions: 200, engagement: 0.88 },
        { week: 3, topic: 'tax_saving', mentions: 100, engagement: 0.75 },
        { week: 4, topic: 'elss', mentions: 180, engagement: 0.80 }
      ];

      const trends = await analyticsEngine.identifyContentTrends(trendData);

      expect(trends.trending_topics).toContain('budget2024');
      expect(trends.emerging_topics).toContain('elss');
      expect(trends.seasonal_patterns).toBeDefined();
      expect(trends.recommended_topics).toBeInstanceOf(Array);
    });

    it('should calculate content ROI', async () => {
      const contentMetrics = {
        contentId: 'content-123',
        creationCost: 1.49, // AI cost
        deliveries: 500,
        engagement: 0.75,
        conversions: 5,
        conversionValue: 2499 // subscription value
      };

      const roi = await analyticsEngine.calculateContentROI(contentMetrics);

      expect(roi.totalRevenue).toBe(12495);
      expect(roi.roi_percentage).toBeGreaterThan(8000); // Very high ROI
      expect(roi.cost_per_engagement).toBeLessThan(0.01);
      expect(roi.performance_rating).toBe('excellent');
    });
  });

  describe('Real-time Analytics', () => {
    it('should stream real-time metrics', async () => {
      const stream = await analyticsEngine.getRealtimeStream();

      expect(stream).toHaveProperty('active_users');
      expect(stream).toHaveProperty('content_being_created');
      expect(stream).toHaveProperty('messages_per_minute');
      expect(stream).toHaveProperty('current_sla');
      expect(stream.timestamp).toBeDefined();
    });

    it('should detect anomalies in real-time', async () => {
      const metrics = {
        current_deliveries: 50,
        expected_deliveries: 200,
        current_errors: 25,
        expected_errors: 5
      };

      const anomalies = await analyticsEngine.detectAnomalies(metrics);

      expect(anomalies).toHaveLength(2);
      expect(anomalies).toContainEqual(
        expect.objectContaining({
          type: 'low_delivery_rate',
          severity: 'high'
        })
      );
      expect(anomalies).toContainEqual(
        expect.objectContaining({
          type: 'high_error_rate',
          severity: 'critical'
        })
      );
    });

    it('should provide predictive alerts', async () => {
      const currentMetrics = {
        delivery_rate: 0.95, // Below 99% SLA
        queue_size: 5000, // Large queue
        error_trend: 0.15 // Increasing errors
      };

      const alerts = await analyticsEngine.generatePredictiveAlerts(currentMetrics);

      expect(alerts).toContainEqual(
        expect.objectContaining({
          type: 'sla_risk',
          prediction: 'SLA likely to be missed',
          recommended_action: expect.any(String)
        })
      );
    });
  });

  describe('Custom Reports', () => {
    it('should generate advisor performance report', async () => {
      const advisorId = 'advisor-123';
      const period = { start: new Date('2024-01-01'), end: new Date('2024-01-31') };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                data: {
                  content_created: 25,
                  clients_served: 200,
                  engagement_rate: 0.75,
                  compliance_score: 0.98
                },
                error: null
              }))
            }))
          }))
        }))
      }));

      const report = await analyticsEngine.generateAdvisorReport(advisorId, period);

      expect(report.advisor_id).toBe(advisorId);
      expect(report.period).toEqual(period);
      expect(report.metrics).toHaveProperty('content_created');
      expect(report.insights).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.performance_grade).toMatch(/[A-F]/);
    });

    it('should export analytics data in multiple formats', async () => {
      const exportConfig = {
        type: 'platform_metrics',
        format: 'csv',
        period: { start: '2024-01-01', end: '2024-01-31' }
      };

      const csvData = await analyticsEngine.exportAnalytics(exportConfig);

      expect(csvData).toContain('Date,Advisors,Content,Deliveries');
      expect(csvData.split('\n').length).toBeGreaterThan(1);

      // Test JSON export
      exportConfig.format = 'json';
      const jsonData = await analyticsEngine.exportAnalytics(exportConfig);
      
      const parsed = JSON.parse(jsonData);
      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('data');
      expect(Array.isArray(parsed.data)).toBe(true);
    });
  });

  describe('AI-Powered Insights', () => {
    it('should generate AI insights from analytics data', async () => {
      const analyticsData = {
        engagement_trend: -0.1,
        content_performance: 0.7,
        advisor_activity: 0.85
      };

      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              insights: [
                'Engagement declining, recommend personalization',
                'High advisor activity but low engagement suggests content quality issue'
              ],
              actions: [
                'Review content templates',
                'Implement A/B testing'
              ]
            })
          }
        }]
      });

      const insights = await analyticsEngine.generateAIInsights(analyticsData);

      expect(insights.insights).toBeInstanceOf(Array);
      expect(insights.insights.length).toBeGreaterThan(0);
      expect(insights.actions).toBeInstanceOf(Array);
      expect(insights.confidence).toBeGreaterThan(0.7);
    });

    it('should predict future metrics using ML', async () => {
      const historicalData = [
        { date: '2024-01-01', metric: 100 },
        { date: '2024-01-08', metric: 110 },
        { date: '2024-01-15', metric: 125 },
        { date: '2024-01-22', metric: 130 }
      ];

      const prediction = await analyticsEngine.predictFutureMetrics(historicalData, 7);

      expect(prediction.predicted_value).toBeGreaterThan(130);
      expect(prediction.confidence_interval).toHaveProperty('lower');
      expect(prediction.confidence_interval).toHaveProperty('upper');
      expect(prediction.trend).toBe('increasing');
    });
  });

  describe('Caching and Performance', () => {
    it('should cache frequently accessed metrics', async () => {
      const advisorId = 'advisor-123';
      
      // Set up global redis mock
      (global as any).redis = redis;
      
      await analyticsEngine.getAdvisorMetrics(advisorId);
      
      expect(redis.setex).toHaveBeenCalledWith(
        `analytics:advisor:${advisorId}`,
        300, // 5 minutes cache
        expect.any(String)
      );
    });

    it('should use cached data when available', async () => {
      const cachedData = {
        engagement: 0.75,
        content_count: 25,
        cached: true
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const metrics = await analyticsEngine.getAdvisorMetrics('advisor-123');

      expect(metrics.cached).toBe(true);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should batch analytics queries for efficiency', async () => {
      const advisorIds = ['advisor-1', 'advisor-2', 'advisor-3'];
      
      const metrics = await analyticsEngine.getBatchAdvisorMetrics(advisorIds);

      expect(metrics).toHaveLength(3);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Single query for all
    });
  });
});