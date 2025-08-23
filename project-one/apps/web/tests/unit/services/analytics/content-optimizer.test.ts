/**
 * Content Optimizer Service Tests
 * Tests for AI-powered content optimization and recommendations
 * Epic: E02-US-005
 */

import { format, subDays } from 'date-fns';

// Mock dependencies first
jest.mock('@supabase/supabase-js');
jest.mock('openai');
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn()
  }
}));

// Import after mocks
import { ContentOptimizer } from '@/lib/services/analytics/content-optimizer';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { redis } from '@/lib/redis';

describe('ContentOptimizer Service', () => {
  let contentOptimizer: ContentOptimizer;
  let mockSupabase: any;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null })
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    
    // Setup OpenAI mock
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
    (OpenAI as jest.Mock).mockImplementation(() => mockOpenAI);
    
    // Setup Redis mock return values
    (redis.get as jest.Mock).mockResolvedValue(null);
    (redis.set as jest.Mock).mockResolvedValue('OK');
    (redis.expire as jest.Mock).mockResolvedValue(1);
    (redis.del as jest.Mock).mockResolvedValue(1);
    
    contentOptimizer = new ContentOptimizer();
  });

  describe('generateOptimizationReport', () => {
    it('should generate a comprehensive optimization report', async () => {
      const advisorId = 'advisor-123';
      const period = 30;

      // Mock content history data
      const mockContentHistory = [
        {
          id: 'content-1',
          title: 'Market Update',
          type: 'educational',
          engagement_rate: 0.75,
          reach: 1500,
          created_at: new Date()
        },
        {
          id: 'content-2',
          title: 'Investment Tips',
          type: 'tips',
          engagement_rate: 0.65,
          reach: 1200,
          created_at: subDays(new Date(), 5)
        }
      ];

      // Mock Supabase response
      mockSupabase.limit.mockResolvedValue({
        data: mockContentHistory,
        error: null
      });

      // Mock OpenAI analysis
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              topics: [
                { topic: 'Mutual Fund Basics', score: 0.9, reasoning: 'High engagement' },
                { topic: 'Tax Planning', score: 0.85, reasoning: 'Seasonal relevance' }
              ],
              insights: 'Focus on educational content during tax season',
              suggestions: [
                { type: 'educational', title: 'Understanding NAV', description: 'Explain NAV calculation' }
              ],
              predictions: [
                { content_type: 'educational', predicted_engagement: 0.75, confidence: 0.8 }
              ]
            })
          }
        }]
      });

      const report = await contentOptimizer.generateOptimizationReport(advisorId, period);

      expect(report).toBeDefined();
      expect(report.advisor_id).toBe(advisorId);
      expect(report.performance_metrics).toBeDefined();
      expect(report.optimal_posting_times).toBeDefined();
      expect(report.topic_recommendations).toBeDefined();
      expect(report.language_insights).toBeDefined();
      expect(report.content_suggestions).toBeDefined();
      expect(report.engagement_predictions).toBeDefined();
      expect(report.a_b_test_results).toBeDefined();
      expect(report.seasonal_trends).toBeDefined();
    });

    it('should use cached data when available', async () => {
      const advisorId = 'advisor-123';
      const cachedReport = {
        advisor_id: advisorId,
        performance_metrics: {},
        optimal_posting_times: {},
        topic_recommendations: [],
        language_insights: {},
        content_suggestions: [],
        engagement_predictions: [],
        a_b_test_results: [],
        seasonal_trends: [],
        generated_at: new Date()
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedReport));

      const report = await contentOptimizer.generateOptimizationReport(advisorId, 30);

      expect(redis.get).toHaveBeenCalledWith(`optimization:${advisorId}`);
      expect(report).toEqual(cachedReport);
    });

    it('should handle errors gracefully', async () => {
      const advisorId = 'advisor-123';
      
      // Mock database error - the error object should be truthy
      mockSupabase.limit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(
        contentOptimizer.generateOptimizationReport(advisorId, 30)
      ).rejects.toThrow('Failed to generate optimization report');
    });
  });

  describe('analyzeContentPerformance', () => {
    it('should calculate performance metrics correctly', async () => {
      const contentHistory = [
        { id: '1', title: 'Post 1', type: 'educational', engagement_rate: 0.8, reach: 1000, created_at: new Date() },
        { id: '2', title: 'Post 2', type: 'tips', engagement_rate: 0.6, reach: 800, created_at: new Date() },
        { id: '3', title: 'Post 3', type: 'market', engagement_rate: 0.4, reach: 600, created_at: new Date() }
      ];

      const metrics = await contentOptimizer.analyzeContentPerformance(contentHistory);

      expect(metrics.total_content_created).toBe(3);
      expect(metrics.average_engagement_rate).toBeCloseTo(0.6, 2);
      expect(metrics.best_performing_content).toHaveLength(1);
      expect(metrics.best_performing_content[0].engagement_rate).toBe(0.8);
      expect(metrics.worst_performing_content).toHaveLength(1);
      expect(metrics.worst_performing_content[0].engagement_rate).toBe(0.4);
      expect(metrics.engagement_by_type).toBeDefined();
      expect(metrics.virality_score).toBeDefined();
    });

    it('should handle empty content history', async () => {
      const metrics = await contentOptimizer.analyzeContentPerformance([]);

      expect(metrics.total_content_created).toBe(0);
      expect(metrics.average_engagement_rate).toBe(0);
      expect(metrics.best_performing_content).toEqual([]);
      expect(metrics.worst_performing_content).toEqual([]);
      expect(metrics.virality_score).toBe(0);
    });
  });

  describe('identifyOptimalPostingTimes', () => {
    it('should identify best posting times from engagement data', async () => {
      const engagementData = [
        { content_id: '1', posted_at: new Date('2024-01-15T10:00:00'), engagement_rate: 0.8 },
        { content_id: '2', posted_at: new Date('2024-01-16T14:00:00'), engagement_rate: 0.6 },
        { content_id: '3', posted_at: new Date('2024-01-17T10:00:00'), engagement_rate: 0.75 },
        { content_id: '4', posted_at: new Date('2024-01-18T18:00:00'), engagement_rate: 0.4 }
      ];

      const optimalTimes = await contentOptimizer.identifyOptimalPostingTimes(engagementData);

      expect(optimalTimes.best_days).toBeDefined();
      expect(optimalTimes.best_hours).toBeDefined();
      expect(optimalTimes.worst_times).toBeDefined();
      expect(optimalTimes.recommended_schedule).toBeDefined();
    });
  });

  describe('generateTopicRecommendations', () => {
    it('should generate AI-powered topic recommendations', async () => {
      const historicalPerformance = {
        top_topics: ['Mutual Funds', 'Tax Planning', 'SIP'],
        engagement_by_topic: {
          'Mutual Funds': 0.75,
          'Tax Planning': 0.8,
          'SIP': 0.65
        }
      };

      // Mock OpenAI analysis
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              recommendations: [
                { topic: 'Tax Saving Strategies', relevance: 0.95 },
                { topic: 'ELSS Funds', relevance: 0.90 },
                { topic: 'Section 80C Benefits', relevance: 0.88 }
              ]
            })
          }
        }]
      });

      const recommendations = await contentOptimizer.generateTopicRecommendations(
        'advisor-123',
        historicalPerformance
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].topic).toBe('Tax Saving Strategies');
      expect(recommendations[0].relevance_score).toBe(0.95);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('predictEngagement', () => {
    it('should predict engagement for proposed content', async () => {
      const proposedContent = {
        type: 'educational',
        topic: 'Mutual Fund Basics',
        language: 'en',
        target_audience: 'beginners'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              predicted_engagement: 0.72,
              confidence: 0.85,
              factors: {
                content_quality: 0.8,
                timing: 0.75,
                relevance: 0.9
              }
            })
          }
        }]
      });

      const prediction = await contentOptimizer.predictEngagement(proposedContent);

      expect(prediction.predicted_engagement_rate).toBe(0.72);
      expect(prediction.confidence_level).toBe(0.85);
      expect(prediction.factors).toBeDefined();
      expect(prediction.recommendations).toBeDefined();
    });
  });

  describe('runABTests', () => {
    it('should analyze A/B test results', async () => {
      const testData = [
        {
          test_id: 'test-1',
          variant_a: { content_id: 'a1', engagement_rate: 0.65, sample_size: 500 },
          variant_b: { content_id: 'b1', engagement_rate: 0.72, sample_size: 500 }
        }
      ];

      const results = await contentOptimizer.runABTests(testData);

      expect(results).toHaveLength(1);
      expect(results[0].winner).toBe('B');
      expect(results[0].improvement).toBeCloseTo(10.77, 1);
      expect(results[0].statistical_significance).toBeDefined();
    });
  });

  describe('identifySeasonalTrends', () => {
    it('should detect seasonal content performance patterns', async () => {
      const yearlyData = [
        { month: 'January', content_type: 'tax', avg_engagement: 0.8 },
        { month: 'February', content_type: 'tax', avg_engagement: 0.85 },
        { month: 'March', content_type: 'tax', avg_engagement: 0.9 },
        { month: 'October', content_type: 'festival', avg_engagement: 0.75 },
        { month: 'November', content_type: 'festival', avg_engagement: 0.8 }
      ];

      const trends = await contentOptimizer.identifySeasonalTrends(yearlyData);

      expect(trends).toBeDefined();
      expect(trends.some(t => t.season === 'tax_season')).toBe(true);
      expect(trends.some(t => t.season === 'festival_season')).toBe(true);
    });
  });

  describe('caching behavior', () => {
    it('should cache optimization reports', async () => {
      const advisorId = 'advisor-123';
      
      // Mock successful report generation
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      });

      await contentOptimizer.generateOptimizationReport(advisorId, 30);

      expect(redis.set).toHaveBeenCalled();
      expect(redis.expire).toHaveBeenCalledWith(
        `optimization:${advisorId}`,
        3600 // 1 hour cache
      );
    });

    it('should invalidate cache on new content', async () => {
      const advisorId = 'advisor-123';
      
      await contentOptimizer.invalidateCache(advisorId);

      expect(redis.del).toHaveBeenCalledWith(`optimization:${advisorId}`);
    });
  });

  describe('performance requirements', () => {
    it('should complete analysis within 2 seconds', async () => {
      const advisorId = 'advisor-123';
      const startTime = Date.now();
      
      // Mock fast responses
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null
      });
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({})
          }
        }]
      });

      await contentOptimizer.generateOptimizationReport(advisorId, 30);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000);
    });
  });
});