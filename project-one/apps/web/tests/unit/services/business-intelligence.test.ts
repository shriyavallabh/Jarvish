/**
 * Business Intelligence Service Tests
 * Tests for analytics, insights, and data-driven decision making
 */

import { BusinessIntelligenceService } from '@/lib/services/business-intelligence-service';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { redis } from '@/lib/redis';
import * as tf from '@tensorflow/tfjs';

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
      }))
    })),
    rpc: jest.fn()
  }))
}));

jest.mock('openai');
jest.mock('@tensorflow/tfjs');
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hincrby: jest.fn()
  }
}));

describe('BusinessIntelligenceService', () => {
  let biService: BusinessIntelligenceService;
  let mockSupabase: any;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    biService = new BusinessIntelligenceService();
    mockSupabase = createClient('', '');
    mockOpenAI = new OpenAI({ apiKey: 'test' });
  });

  describe('executiveDashboard', () => {
    it('should generate comprehensive executive metrics', async () => {
      mockSupabase.rpc = jest.fn()
        .mockResolvedValueOnce({
          data: {
            mrr: 450000,
            arr: 5400000,
            growth_rate: 0.15,
            churn_rate: 0.02,
            ltv: 150000,
            cac: 5000,
            ltv_cac_ratio: 30
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            total_advisors: 1500,
            active_advisors: 1425,
            new_advisors_month: 150,
            churned_advisors_month: 30
          },
          error: null
        });

      const dashboard = await biService.getExecutiveDashboard();

      expect(dashboard.mrr).toBe(450000);
      expect(dashboard.arr).toBe(5400000);
      expect(dashboard.growth_rate).toBe(0.15);
      expect(dashboard.ltv_cac_ratio).toBe(30);
      expect(dashboard.health_score).toBeGreaterThan(0);
    });

    it('should calculate key SaaS metrics accurately', async () => {
      const metrics = {
        mrr: 100000,
        customers: 100,
        new_customers: 20,
        churned_customers: 2
      };

      const saasMetrics = await biService.calculateSaaSMetrics(metrics);

      expect(saasMetrics.arpu).toBe(1000); // 100000/100
      expect(saasMetrics.net_mrr_growth).toBe(18000); // (20-2) * 1000
      expect(saasMetrics.gross_mrr_churn).toBe(0.02); // 2/100
      expect(saasMetrics.net_mrr_retention).toBeGreaterThan(1); // Growth
    });

    it('should provide growth projections using ML', async () => {
      const historicalData = [
        { month: '2024-01', mrr: 100000, customers: 100 },
        { month: '2024-02', mrr: 115000, customers: 115 },
        { month: '2024-03', mrr: 132000, customers: 130 }
      ];

      // Mock TensorFlow model
      const mockModel = {
        predict: jest.fn(() => ({
          dataSync: jest.fn(() => [150000, 165000, 180000]) // 3-month projection
        }))
      };
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      const projections = await biService.generateGrowthProjections(historicalData);

      expect(projections.next_3_months).toHaveLength(3);
      expect(projections.next_3_months[0].projected_mrr).toBe(150000);
      expect(projections.confidence_interval).toBeDefined();
      expect(projections.growth_trajectory).toBe('accelerating');
    });
  });

  describe('customerAnalytics', () => {
    it('should segment advisors by value and activity', async () => {
      const advisors = [
        { id: '1', mrr: 5000, activity_score: 0.9, tier: 'PRO' },
        { id: '2', mrr: 3000, activity_score: 0.7, tier: 'STANDARD' },
        { id: '3', mrr: 1000, activity_score: 0.3, tier: 'BASIC' }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          data: advisors,
          error: null
        }))
      }));

      const segments = await biService.segmentCustomers();

      expect(segments.champions).toContain('1'); // High value, high activity
      expect(segments.at_risk).toContain('3'); // Low activity
      expect(segments.loyal_customers).toContain('2'); // Medium both
      expect(segments.segments_count).toBe(4); // 4 standard segments
    });

    it('should calculate customer lifetime value (LTV)', async () => {
      const advisor = {
        id: 'advisor-123',
        monthly_revenue: 5000,
        tenure_months: 12,
        churn_probability: 0.1
      };

      const ltv = await biService.calculateLTV(advisor);

      expect(ltv.estimated_ltv).toBeGreaterThan(0);
      expect(ltv.payback_period_months).toBeLessThan(12);
      expect(ltv.ltv_to_cac_ratio).toBeGreaterThan(3); // Healthy ratio
      expect(ltv.profit_margin).toBeGreaterThan(0.6); // 60%+ margin
    });

    it('should identify expansion opportunities', async () => {
      const advisors = [
        {
          id: '1',
          tier: 'BASIC',
          usage: { api_calls: 950, content_created: 95 },
          limits: { api_calls: 1000, content_created: 100 }
        },
        {
          id: '2',
          tier: 'STANDARD',
          usage: { api_calls: 500, content_created: 50 },
          limits: { api_calls: 5000, content_created: 500 }
        }
      ];

      const opportunities = await biService.identifyExpansionOpportunities(advisors);

      expect(opportunities).toContainEqual({
        advisor_id: '1',
        opportunity_type: 'tier_upgrade',
        reason: 'Approaching usage limits',
        potential_mrr_increase: expect.any(Number),
        recommended_action: 'Offer PRO tier upgrade'
      });
    });
  });

  describe('contentPerformanceAnalytics', () => {
    it('should analyze content engagement patterns', async () => {
      const contentData = [
        { type: 'educational', engagement_rate: 0.75, shares: 150 },
        { type: 'market_update', engagement_rate: 0.65, shares: 100 },
        { type: 'educational', engagement_rate: 0.8, shares: 200 }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            data: contentData,
            error: null
          }))
        }))
      }));

      const analysis = await biService.analyzeContentPerformance();

      expect(analysis.best_performing_type).toBe('educational');
      expect(analysis.average_engagement.educational).toBeCloseTo(0.775, 2);
      expect(analysis.viral_content_count).toBe(1); // Content with 200 shares
      expect(analysis.recommendations).toContain('Focus on educational content');
    });

    it('should identify content trends using AI', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              trending_topics: ['Tax Planning', 'ELSS Funds', 'Budget 2024'],
              declining_topics: ['Crypto', 'NFTs'],
              emerging_topics: ['AI in Finance', 'Green Investments']
            })
          }
        }]
      });

      const trends = await biService.identifyContentTrends();

      expect(trends.trending_topics).toContain('Tax Planning');
      expect(trends.declining_topics).toContain('Crypto');
      expect(trends.emerging_topics).toContain('AI in Finance');
      expect(trends.recommendation).toBeDefined();
    });
  });

  describe('revenueAnalytics', () => {
    it('should track MRR movement accurately', async () => {
      const mrrMovement = {
        starting_mrr: 100000,
        new_mrr: 20000,
        expansion_mrr: 5000,
        contraction_mrr: -2000,
        churned_mrr: -3000
      };

      const analysis = await biService.analyzeMRRMovement(mrrMovement);

      expect(analysis.ending_mrr).toBe(120000);
      expect(analysis.net_new_mrr).toBe(20000);
      expect(analysis.growth_rate).toBe(0.2); // 20% growth
      expect(analysis.quick_ratio).toBeGreaterThan(3); // (new+expansion)/(contraction+churn)
    });

    it('should identify revenue leakage points', async () => {
      const revenueData = {
        failed_payments: 15,
        total_payments: 1000,
        downgrades: 20,
        involuntary_churn: 5
      };

      const leakage = await biService.identifyRevenueLeakage(revenueData);

      expect(leakage.payment_failure_rate).toBe(0.015);
      expect(leakage.estimated_monthly_loss).toBeGreaterThan(0);
      expect(leakage.primary_leakage_source).toBe('downgrades');
      expect(leakage.recommendations).toContain('Implement dunning management');
    });

    it('should forecast revenue with seasonality', async () => {
      const historicalRevenue = [
        { month: 1, revenue: 100000 }, // January - tax season
        { month: 2, revenue: 120000 },
        { month: 3, revenue: 130000 },
        { month: 4, revenue: 105000 } // Post tax season
      ];

      const forecast = await biService.forecastRevenue(historicalRevenue, 6);

      expect(forecast.projections).toHaveLength(6);
      expect(forecast.seasonal_factors.Q1).toBeGreaterThan(1); // Q1 boost
      expect(forecast.confidence_band.lower).toBeLessThan(forecast.projections[0]);
      expect(forecast.confidence_band.upper).toBeGreaterThan(forecast.projections[0]);
    });
  });

  describe('operationalMetrics', () => {
    it('should track platform health metrics', async () => {
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: {
          api_response_time_p50: 0.150,
          api_response_time_p95: 0.450,
          api_response_time_p99: 1.2,
          error_rate: 0.001,
          uptime: 0.999,
          whatsapp_delivery_rate: 0.992
        },
        error: null
      });

      const health = await biService.getPlatformHealth();

      expect(health.api_performance.p95).toBeLessThan(1.5); // SLA
      expect(health.error_rate).toBeLessThan(0.01); // <1% errors
      expect(health.uptime).toBeGreaterThanOrEqual(0.999); // 99.9% uptime
      expect(health.whatsapp_sla_met).toBe(true); // >99% delivery
      expect(health.overall_health).toBe('healthy');
    });

    it('should detect anomalies in operational metrics', async () => {
      const metrics = [
        { timestamp: new Date(), response_time: 0.2 },
        { timestamp: new Date(), response_time: 0.3 },
        { timestamp: new Date(), response_time: 5.0 }, // Anomaly
        { timestamp: new Date(), response_time: 0.25 }
      ];

      const anomalies = await biService.detectAnomalies(metrics);

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].value).toBe(5.0);
      expect(anomalies[0].severity).toBe('high');
      expect(anomalies[0].alert_triggered).toBe(true);
    });
  });

  describe('competitiveIntelligence', () => {
    it('should benchmark against industry standards', async () => {
      const ourMetrics = {
        growth_rate: 0.15,
        churn_rate: 0.02,
        nps_score: 72,
        cac_payback_months: 8
      };

      const industryBenchmarks = {
        growth_rate: 0.12,
        churn_rate: 0.05,
        nps_score: 50,
        cac_payback_months: 12
      };

      const comparison = await biService.benchmarkPerformance(ourMetrics, industryBenchmarks);

      expect(comparison.growth_rate_percentile).toBeGreaterThan(50);
      expect(comparison.churn_performance).toBe('excellent');
      expect(comparison.nps_category).toBe('world_class');
      expect(comparison.overall_position).toBe('market_leader');
    });

    it('should provide competitive positioning insights', async () => {
      const marketData = {
        our_market_share: 0.08,
        competitor_shares: [0.25, 0.15, 0.12, 0.10],
        market_size: 1000000000, // 1B INR
        growth_rate: 0.25
      };

      const insights = await biService.getCompetitiveInsights(marketData);

      expect(insights.market_position).toBe(5); // 5th largest
      expect(insights.addressable_market).toBeGreaterThan(0);
      expect(insights.growth_opportunity).toBe('high');
      expect(insights.recommended_strategies).toContain('differentiation');
    });
  });

  describe('predictiveAnalytics', () => {
    it('should predict churn risk with ML model', async () => {
      const advisorBehavior = {
        login_frequency: 0.2, // Low
        content_created_trend: -0.5, // Declining
        engagement_rate: 0.3, // Low
        support_tickets: 5, // High
        days_since_last_activity: 15
      };

      // Mock TensorFlow model
      const mockModel = {
        predict: jest.fn(() => ({
          dataSync: jest.fn(() => [0.75]) // 75% churn risk
        }))
      };
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      const prediction = await biService.predictChurnRisk(advisorBehavior);

      expect(prediction.churn_probability).toBe(0.75);
      expect(prediction.risk_level).toBe('high');
      expect(prediction.intervention_recommended).toBe(true);
      expect(prediction.suggested_actions).toContain('personal outreach');
    });

    it('should predict optimal pricing for advisors', async () => {
      const advisorProfile = {
        business_size: 'medium',
        client_count: 250,
        location: 'metro',
        current_tier: 'STANDARD',
        feature_usage: { advanced: 0.8 }
      };

      const pricing = await biService.predictOptimalPricing(advisorProfile);

      expect(pricing.recommended_tier).toBe('PRO');
      expect(pricing.predicted_willingness_to_pay).toBeGreaterThan(3000);
      expect(pricing.upgrade_probability).toBeGreaterThan(0.6);
      expect(pricing.expected_revenue_increase).toBeGreaterThan(0);
    });
  });

  describe('customReports', () => {
    it('should generate custom reports for stakeholders', async () => {
      const reportConfig = {
        type: 'investor_update',
        period: { start: new Date('2024-01-01'), end: new Date('2024-03-31') },
        metrics: ['mrr', 'growth', 'churn', 'runway']
      };

      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: {
          mrr: 500000,
          growth_rate: 0.45,
          churn_rate: 0.02,
          cash_balance: 10000000,
          burn_rate: 500000
        },
        error: null
      });

      const report = await biService.generateCustomReport(reportConfig);

      expect(report.type).toBe('investor_update');
      expect(report.metrics.mrr).toBe(500000);
      expect(report.metrics.runway_months).toBe(20);
      expect(report.narrative).toContain('strong growth');
      expect(report.visualizations).toBeDefined();
    });

    it('should schedule automated reports', async () => {
      const schedule = {
        report_type: 'weekly_metrics',
        recipients: ['ceo@jarvish.ai', 'investors@jarvish.ai'],
        frequency: 'weekly',
        day: 'monday',
        time: '09:00'
      };

      const result = await biService.scheduleReport(schedule);

      expect(result.scheduled).toBe(true);
      expect(result.next_run).toBeDefined();
      expect(result.report_id).toBeDefined();
    });
  });

  describe('dataQuality', () => {
    it('should validate data quality and completeness', async () => {
      const dataQuality = await biService.assessDataQuality();

      expect(dataQuality.completeness_score).toBeGreaterThan(0.9);
      expect(dataQuality.accuracy_score).toBeGreaterThan(0.95);
      expect(dataQuality.timeliness_score).toBeGreaterThan(0.98);
      expect(dataQuality.issues).toBeInstanceOf(Array);
      expect(dataQuality.overall_grade).toMatch(/[A-F]/);
    });

    it('should detect and flag data anomalies', async () => {
      const anomalousData = [
        { advisor_id: '1', mrr: -5000 }, // Negative MRR
        { advisor_id: '2', mrr: 1000000 }, // Unusually high
        { advisor_id: '3', mrr: 5000 } // Normal
      ];

      const flags = await biService.flagDataAnomalies(anomalousData);

      expect(flags).toHaveLength(2);
      expect(flags[0].issue).toBe('negative_value');
      expect(flags[1].issue).toBe('statistical_outlier');
    });
  });

  describe('realTimeAnalytics', () => {
    it('should provide real-time metrics stream', async () => {
      const stream = await biService.getRealTimeMetricsStream();

      expect(stream.active_users).toBeGreaterThanOrEqual(0);
      expect(stream.current_api_load).toBeLessThan(1000);
      expect(stream.messages_per_minute).toBeGreaterThanOrEqual(0);
      expect(stream.last_updated).toBeDefined();
    });

    it('should maintain rolling window metrics', async () => {
      const window = '5m'; // 5 minutes
      
      const metrics = await biService.getRollingWindowMetrics(window);

      expect(metrics.window).toBe('5m');
      expect(metrics.total_requests).toBeGreaterThanOrEqual(0);
      expect(metrics.average_response_time).toBeGreaterThanOrEqual(0);
      expect(metrics.error_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('caching', () => {
    it('should cache expensive computations', async () => {
      const cacheKey = 'bi:executive:dashboard';
      
      await biService.getExecutiveDashboard();
      
      expect(redis.setex).toHaveBeenCalledWith(
        cacheKey,
        300, // 5 minutes
        expect.any(String)
      );
    });

    it('should use cached data when fresh', async () => {
      const cachedData = { mrr: 500000, cached: true };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await biService.getExecutiveDashboard();

      expect(result.cached).toBe(true);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });
});