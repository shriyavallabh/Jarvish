/**
 * Advisor Insights Service Tests
 * Tests for weekly AI-powered advisor analytics and recommendations
 */

import { AdvisorInsightsService } from '@/lib/services/analytics/advisor-insights';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { redis } from '@/lib/redis';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

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
      }))
    })),
    rpc: jest.fn()
  }))
}));

jest.mock('openai');
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    expire: jest.fn(),
    del: jest.fn()
  }
}));

describe('AdvisorInsightsService', () => {
  let insightsService: AdvisorInsightsService;
  let mockSupabase: any;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    insightsService = new AdvisorInsightsService();
    mockSupabase = createClient('', '');
    mockOpenAI = new OpenAI({ apiKey: 'test' });
  });

  describe('generateWeeklyInsights', () => {
    it('should generate comprehensive weekly insights for an advisor', async () => {
      const advisorId = 'advisor-123';
      
      // Mock advisor profile
      const mockAdvisor = {
        id: advisorId,
        business_name: 'Elite Financial Services',
        subscription_tier: 'PRO',
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      };

      // Mock performance data
      const mockPerformanceData = {
        content_created: 25,
        engagement_rate: 0.72,
        delivery_success_rate: 0.98,
        active_clients: 450,
        growth_rate: 0.15
      };

      // Mock comparison data
      const mockPeerComparison = {
        peer_average_engagement: 0.65,
        peer_average_content: 20,
        percentile_rank: 75
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockAdvisor,
                error: null
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => ({
                  data: [mockPerformanceData],
                  error: null
                }))
              }))
            }))
          }))
        });

      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: mockPeerComparison,
        error: null
      });

      // Mock AI insights generation
      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              key_achievements: ['Exceeded engagement targets', 'Perfect delivery record'],
              areas_for_improvement: ['Increase content variety'],
              personalized_tips: ['Try video content for better engagement']
            })
          }
        }]
      });

      const insights = await insightsService.generateWeeklyInsights(advisorId);

      expect(insights).toBeDefined();
      expect(insights.advisor_id).toBe(advisorId);
      expect(insights.period).toBeDefined();
      expect(insights.performance_summary).toBeDefined();
      expect(insights.engagement_metrics).toBeDefined();
      expect(insights.content_analytics).toBeDefined();
      expect(insights.peer_comparison).toBeDefined();
      expect(insights.recommendations).toBeInstanceOf(Array);
      expect(insights.action_items).toBeInstanceOf(Array);
    });

    it('should use cached insights when available', async () => {
      const advisorId = 'advisor-123';
      const cachedInsights = {
        advisor_id: advisorId,
        performance_summary: { score: 85 },
        generated_at: new Date()
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedInsights));

      const insights = await insightsService.generateWeeklyInsights(advisorId);

      expect(redis.get).toHaveBeenCalledWith(`insights:weekly:${advisorId}`);
      expect(insights.advisor_id).toBe(advisorId);
      expect(insights.performance_summary.score).toBe(85);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should calculate weighted performance score', async () => {
      const metrics = {
        engagement_rate: 0.75,
        content_consistency: 0.90,
        delivery_success: 0.98,
        growth_rate: 0.20,
        feature_utilization: 0.65
      };

      const score = await insightsService.calculatePerformanceScore(metrics);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeCloseTo(80, 0); // Expected weighted average
    });

    it('should handle missing metrics gracefully', async () => {
      const metrics = {
        engagement_rate: 0.75,
        content_consistency: undefined,
        delivery_success: 0.98
      };

      const score = await insightsService.calculatePerformanceScore(metrics);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeEngagementTrends', () => {
    it('should identify engagement trends over time', async () => {
      const engagementData = [
        { date: subDays(new Date(), 6), rate: 0.65 },
        { date: subDays(new Date(), 5), rate: 0.68 },
        { date: subDays(new Date(), 4), rate: 0.70 },
        { date: subDays(new Date(), 3), rate: 0.72 },
        { date: subDays(new Date(), 2), rate: 0.74 },
        { date: subDays(new Date(), 1), rate: 0.76 },
        { date: new Date(), rate: 0.78 }
      ];

      const trends = await insightsService.analyzeEngagementTrends(engagementData);

      expect(trends.direction).toBe('increasing');
      expect(trends.change_percentage).toBeGreaterThan(0);
      expect(trends.forecast_next_week).toBeGreaterThan(0.78);
      expect(trends.volatility).toBeDefined();
    });

    it('should detect declining trends', async () => {
      const engagementData = [
        { date: subDays(new Date(), 3), rate: 0.75 },
        { date: subDays(new Date(), 2), rate: 0.70 },
        { date: subDays(new Date(), 1), rate: 0.65 },
        { date: new Date(), rate: 0.60 }
      ];

      const trends = await insightsService.analyzeEngagementTrends(engagementData);

      expect(trends.direction).toBe('decreasing');
      expect(trends.change_percentage).toBeLessThan(0);
      expect(trends.alert).toBeDefined();
    });
  });

  describe('generateContentRecommendations', () => {
    it('should generate AI-powered content recommendations', async () => {
      const performanceData = {
        top_performing_topics: ['Tax Planning', 'SIP Benefits'],
        low_performing_topics: ['Complex Derivatives'],
        audience_preferences: {
          language: 'hi',
          format: 'visual',
          timing: 'morning'
        }
      };

      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              recommendations: [
                {
                  type: 'topic',
                  suggestion: 'Focus on tax-saving content',
                  expected_impact: 'high',
                  reasoning: 'Strong historical performance'
                },
                {
                  type: 'format',
                  suggestion: 'Increase visual content',
                  expected_impact: 'medium',
                  reasoning: 'Audience preference analysis'
                }
              ]
            })
          }
        }]
      });

      const recommendations = await insightsService.generateContentRecommendations(
        performanceData,
        'advisor-123'
      );

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].type).toBe('topic');
      expect(recommendations[0].expected_impact).toBeDefined();
      expect(recommendations[1].type).toBe('format');
    });

    it('should provide fallback recommendations on AI failure', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockRejectedValue(
        new Error('AI service unavailable')
      );

      const recommendations = await insightsService.generateContentRecommendations(
        {},
        'advisor-123'
      );

      expect(recommendations).toHaveLength(3); // Fallback recommendations
      expect(recommendations[0].type).toBe('general');
    });
  });

  describe('compareToPeers', () => {
    it('should compare advisor performance to peer group', async () => {
      const advisorMetrics = {
        engagement_rate: 0.75,
        content_volume: 25,
        delivery_success: 0.98
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              data: [
                { engagement_rate: 0.65, content_volume: 20 },
                { engagement_rate: 0.70, content_volume: 22 },
                { engagement_rate: 0.68, content_volume: 18 }
              ],
              error: null
            }))
          }))
        }))
      }));

      const comparison = await insightsService.compareToPeers(
        'advisor-123',
        advisorMetrics
      );

      expect(comparison.percentile_rank).toBeGreaterThan(50);
      expect(comparison.relative_performance).toBe('above_average');
      expect(comparison.strengths).toContain('engagement_rate');
      expect(comparison.peer_average).toBeDefined();
    });

    it('should handle different subscription tiers', async () => {
      const advisorMetrics = {
        engagement_rate: 0.60,
        subscription_tier: 'BASIC'
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [
              { engagement_rate: 0.55, subscription_tier: 'BASIC' },
              { engagement_rate: 0.58, subscription_tier: 'BASIC' }
            ],
            error: null
          }))
        }))
      }));

      const comparison = await insightsService.compareToPeers(
        'advisor-123',
        advisorMetrics
      );

      expect(comparison.peer_group).toBe('BASIC');
      expect(comparison.percentile_rank).toBeGreaterThan(50);
    });
  });

  describe('identifyActionItems', () => {
    it('should generate prioritized action items', async () => {
      const insightsData = {
        performance_score: 65,
        engagement_trend: 'decreasing',
        content_gaps: ['Video content', 'Regional language'],
        delivery_issues: 2,
        churn_risk: 'medium'
      };

      const actionItems = await insightsService.identifyActionItems(insightsData);

      expect(actionItems).toBeInstanceOf(Array);
      expect(actionItems.length).toBeGreaterThan(0);
      expect(actionItems[0].priority).toBeDefined();
      expect(actionItems[0].category).toBeDefined();
      expect(actionItems[0].action).toBeDefined();
      expect(actionItems[0].expected_impact).toBeDefined();
      expect(actionItems[0].deadline).toBeDefined();
    });

    it('should prioritize critical issues', async () => {
      const insightsData = {
        performance_score: 35,
        engagement_trend: 'rapidly_decreasing',
        delivery_issues: 10,
        churn_risk: 'high'
      };

      const actionItems = await insightsService.identifyActionItems(insightsData);

      expect(actionItems[0].priority).toBe('critical');
      expect(actionItems[0].category).toContain('retention');
    });
  });

  describe('generateExecutiveSummary', () => {
    it('should create concise executive summary', async () => {
      const fullInsights = {
        performance_score: 82,
        key_metrics: {
          engagement: 0.75,
          growth: 0.15,
          retention: 0.92
        },
        achievements: ['Exceeded targets', 'Perfect delivery'],
        challenges: ['Content variety'],
        opportunities: ['Video content', 'Webinars']
      };

      const summary = await insightsService.generateExecutiveSummary(fullInsights);

      expect(summary.headline).toBeDefined();
      expect(summary.key_numbers).toHaveLength(3);
      expect(summary.top_achievement).toBeDefined();
      expect(summary.main_opportunity).toBeDefined();
      expect(summary.week_ahead_focus).toBeDefined();
    });
  });

  describe('trackGoalProgress', () => {
    it('should track progress toward advisor goals', async () => {
      const advisorGoals = [
        {
          goal_id: 'goal-1',
          type: 'engagement',
          target: 0.80,
          current: 0.75,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          goal_id: 'goal-2',
          type: 'content_volume',
          target: 30,
          current: 25,
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: advisorGoals,
            error: null
          }))
        }))
      }));

      const progress = await insightsService.trackGoalProgress('advisor-123');

      expect(progress).toHaveLength(2);
      expect(progress[0].completion_percentage).toBe(93.75);
      expect(progress[0].on_track).toBe(true);
      expect(progress[1].completion_percentage).toBe(83.33);
    });
  });

  describe('generateWhatsAppSummary', () => {
    it('should format insights for WhatsApp delivery', async () => {
      const insights = {
        performance_score: 85,
        key_achievements: ['Top 10% engagement', '100% delivery success'],
        action_items: [
          { action: 'Add Hindi content', priority: 'high' },
          { action: 'Schedule webinar', priority: 'medium' }
        ],
        peer_rank: 8
      };

      const whatsappMessage = await insightsService.generateWhatsAppSummary(insights);

      expect(whatsappMessage).toContain('Weekly Performance');
      expect(whatsappMessage).toContain('85/100');
      expect(whatsappMessage).toContain('Top 10% engagement');
      expect(whatsappMessage).toContain('Add Hindi content');
      expect(whatsappMessage.length).toBeLessThan(1024); // WhatsApp limit
    });
  });

  describe('scheduleInsightsDelivery', () => {
    it('should schedule weekly insights for delivery', async () => {
      const advisorId = 'advisor-123';
      const deliveryTime = new Date('2024-01-22T09:00:00');

      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          data: { id: 'schedule-1', advisor_id: advisorId },
          error: null
        }))
      }));

      const schedule = await insightsService.scheduleInsightsDelivery(
        advisorId,
        deliveryTime
      );

      expect(schedule.success).toBe(true);
      expect(schedule.scheduled_for).toEqual(deliveryTime);
    });
  });

  describe('getBenchmarks', () => {
    it('should retrieve industry benchmarks', async () => {
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                engagement_benchmark: 0.65,
                content_volume_benchmark: 20,
                retention_benchmark: 0.85
              },
              error: null
            }))
          }))
        }))
      }));

      const benchmarks = await insightsService.getBenchmarks('MFD');

      expect(benchmarks.engagement_benchmark).toBe(0.65);
      expect(benchmarks.content_volume_benchmark).toBe(20);
      expect(benchmarks.retention_benchmark).toBe(0.85);
    });
  });

  describe('exportInsights', () => {
    it('should export insights in PDF format', async () => {
      const insights = {
        advisor_id: 'advisor-123',
        period: { start: new Date(), end: new Date() },
        performance_score: 85
      };

      const pdf = await insightsService.exportInsights(insights, 'pdf');

      expect(pdf).toBeDefined();
      expect(pdf.format).toBe('pdf');
      expect(pdf.size).toBeGreaterThan(0);
    });

    it('should export insights in Excel format', async () => {
      const insights = {
        advisor_id: 'advisor-123',
        metrics: { engagement: 0.75, growth: 0.15 }
      };

      const excel = await insightsService.exportInsights(insights, 'excel');

      expect(excel).toBeDefined();
      expect(excel.format).toBe('excel');
    });
  });

  describe('caching behavior', () => {
    it('should cache weekly insights', async () => {
      const advisorId = 'advisor-123';
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: advisorId },
              error: null
            }))
          }))
        }))
      }));

      await insightsService.generateWeeklyInsights(advisorId);

      expect(redis.setex).toHaveBeenCalled();
      const cacheKey = `insights:weekly:${advisorId}`;
      expect(redis.setex).toHaveBeenCalledWith(
        cacheKey,
        86400, // 24 hours
        expect.any(String)
      );
    });

    it('should invalidate cache on significant changes', async () => {
      const advisorId = 'advisor-123';
      
      await insightsService.invalidateInsightsCache(advisorId);

      expect(redis.del).toHaveBeenCalledWith(`insights:weekly:${advisorId}`);
    });
  });

  describe('performance requirements', () => {
    it('should generate insights within 2 seconds', async () => {
      const startTime = Date.now();
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 'advisor-123' },
              error: null
            }))
          }))
        }))
      }));

      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{ message: { content: '{}' } }]
      });

      await insightsService.generateWeeklyInsights('advisor-123');
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(2000);
    });

    it('should handle batch insights generation efficiently', async () => {
      const startTime = Date.now();
      const advisorIds = Array(50).fill(null).map((_, i) => `advisor-${i}`);
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            data: advisorIds.map(id => ({ id })),
            error: null
          }))
        }))
      }));

      await insightsService.generateBatchInsights(advisorIds);
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(30000); // 30 seconds for 50 advisors
    });
  });
});