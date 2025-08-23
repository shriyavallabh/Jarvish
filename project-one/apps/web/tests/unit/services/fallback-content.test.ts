/**
 * Fallback Content Service Tests
 * Tests for zero silent days with AI-curated evergreen content
 */

import { FallbackContentService } from '@/lib/services/fallback-content';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { redis } from '@/lib/redis';
import { format, setHours, setMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
          })),
          is: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
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
    }))
  }))
}));

jest.mock('openai');
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    zadd: jest.fn(),
    zrange: jest.fn(),
    zrem: jest.fn()
  }
}));

describe('FallbackContentService', () => {
  let fallbackService: FallbackContentService;
  let mockSupabase: any;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    fallbackService = new FallbackContentService();
    mockSupabase = createClient('', '');
    mockOpenAI = new OpenAI({ apiKey: 'test' });
  });

  describe('assignFallbackContent', () => {
    it('should assign fallback content at 21:30 IST for advisors without content', async () => {
      const advisorsWithoutContent = [
        { id: 'advisor-1', subscription_tier: 'PRO', language_preference: 'en' },
        { id: 'advisor-2', subscription_tier: 'STANDARD', language_preference: 'hi' }
      ];

      // Mock advisors without content for tomorrow
      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            is: jest.fn(() => ({
              eq: jest.fn(() => ({
                data: advisorsWithoutContent,
                error: null
              }))
            }))
          }))
        });

      // Mock fallback content pool
      const fallbackContent = [
        { id: 'fallback-1', content: 'SIP Benefits', category: 'educational' },
        { id: 'fallback-2', content: 'Tax Planning', category: 'seasonal' }
      ];

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  data: fallbackContent,
                  error: null
                }))
              }))
            }))
          }))
        });

      const result = await fallbackService.assignFallbackContent();

      expect(result.assigned_count).toBe(2);
      expect(result.assignment_time).toContain('21:30');
      
      // Verify assignment happens at 21:30 IST
      const assignmentTime = new Date(result.assignment_timestamp);
      const istTime = toZonedTime(assignmentTime, 'Asia/Kolkata');
      expect(istTime.getHours()).toBe(21);
      expect(istTime.getMinutes()).toBe(30);
    });

    it('should prioritize Pro tier advisors for better fallback content', async () => {
      const proAdvisor = { 
        id: 'advisor-pro', 
        subscription_tier: 'PRO',
        content_preferences: { topics: ['investment', 'tax'] }
      };
      
      const basicAdvisor = { 
        id: 'advisor-basic', 
        subscription_tier: 'BASIC'
      };

      // Mock premium fallback content for Pro
      const premiumFallback = {
        id: 'premium-fallback',
        content: 'Advanced Tax Strategies',
        tier: 'premium',
        engagement_score: 0.85
      };

      const basicFallback = {
        id: 'basic-fallback',
        content: 'Basic Investment Tips',
        tier: 'standard',
        engagement_score: 0.65
      };

      const assignments = await fallbackService.assignTieredFallback([proAdvisor, basicAdvisor]);

      expect(assignments['advisor-pro'].tier).toBe('premium');
      expect(assignments['advisor-pro'].engagement_score).toBeGreaterThan(0.8);
      expect(assignments['advisor-basic'].tier).toBe('standard');
    });

    it('should ensure zero silent days policy', async () => {
      const advisorId = 'advisor-123';
      const today = new Date();
      
      // Mock no content scheduled for tomorrow
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                data: [], // No content
                error: null
              }))
            }))
          }))
        }))
      }));

      // Mock fallback assignment
      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          data: { 
            advisor_id: advisorId,
            content_id: 'fallback-123',
            scheduled_for: new Date()
          },
          error: null
        }))
      }));

      const result = await fallbackService.ensureZeroSilentDays(advisorId);

      expect(result.has_content).toBe(true);
      expect(result.is_fallback).toBe(true);
      expect(result.policy).toBe('ZERO_SILENT_DAYS');
    });
  });

  describe('curateEvergreenContent', () => {
    it('should create AI-curated evergreen content packs', async () => {
      const categories = ['educational', 'market_basics', 'investment_101'];
      
      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              content: {
                title: 'Understanding SIP',
                body: 'Systematic Investment Plans help build wealth...',
                category: 'educational',
                evergreen_score: 0.92,
                tags: ['sip', 'investment', 'beginner']
              }
            })
          }
        }]
      });

      const evergreenPack = await fallbackService.curateEvergreenContent(categories);

      expect(evergreenPack).toHaveLength(categories.length);
      expect(evergreenPack[0].evergreen_score).toBeGreaterThan(0.8);
      expect(evergreenPack[0].category).toBe('educational');
    });

    it('should validate content for SEBI compliance before adding to pool', async () => {
      const content = {
        title: 'Investment Guide',
        body: 'Learn about mutual funds',
        compliance_check: 'pending'
      };

      // Mock compliance validation
      const complianceResult = {
        is_compliant: true,
        score: 0.98,
        violations: []
      };

      const validated = await fallbackService.validateForFallbackPool(content);

      expect(validated.is_compliant).toBe(true);
      expect(validated.compliance_score).toBeGreaterThan(0.95);
      expect(validated.approved_for_fallback).toBe(true);
    });
  });

  describe('seasonalRelevance', () => {
    it('should select seasonally relevant fallback content', async () => {
      const currentMonth = new Date().getMonth();
      
      // Tax season (Jan-Mar)
      if (currentMonth >= 0 && currentMonth <= 2) {
        const fallbackContent = await fallbackService.getSeasonalFallback();
        
        expect(fallbackContent.some(c => 
          c.tags.includes('tax') || 
          c.tags.includes('elss') ||
          c.tags.includes('80c')
        )).toBe(true);
      }
      
      // Diwali season (Oct-Nov)
      if (currentMonth >= 9 && currentMonth <= 10) {
        const fallbackContent = await fallbackService.getSeasonalFallback();
        
        expect(fallbackContent.some(c => 
          c.tags.includes('festival') || 
          c.tags.includes('gold') ||
          c.tags.includes('muhurat')
        )).toBe(true);
      }
    });

    it('should boost relevance scores for timely content', async () => {
      const marchContent = {
        id: 'tax-content',
        tags: ['tax', 'elss'],
        base_score: 0.7
      };

      const octoberContent = {
        id: 'diwali-content',
        tags: ['festival', 'investment'],
        base_score: 0.7
      };

      // Test in March
      const marchScore = await fallbackService.calculateRelevanceScore(
        marchContent, 
        new Date('2024-03-15')
      );

      // Test in October
      const octoberScore = await fallbackService.calculateRelevanceScore(
        octoberContent,
        new Date('2024-10-15')
      );

      expect(marchScore).toBeGreaterThan(marchContent.base_score);
      expect(octoberScore).toBeGreaterThan(octoberContent.base_score);
    });
  });

  describe('intelligentMatching', () => {
    it('should match fallback content to advisor profile', async () => {
      const advisor = {
        id: 'advisor-123',
        business_type: 'MFD',
        client_demographics: 'young_professionals',
        content_history: [
          { category: 'sip', engagement: 0.8 },
          { category: 'tax', engagement: 0.75 }
        ]
      };

      const fallbackPool = [
        { id: '1', category: 'sip', title: 'SIP for Beginners' },
        { id: '2', category: 'retirement', title: 'Retirement Planning' },
        { id: '3', category: 'tax', title: 'Tax Saving Tips' }
      ];

      const matched = await fallbackService.intelligentMatch(advisor, fallbackPool);

      expect(matched.category).toBe('sip'); // Highest engagement history
      expect(matched.match_score).toBeGreaterThan(0.7);
      expect(matched.reasons).toContain('High historical engagement');
    });

    it('should avoid content repetition in fallback', async () => {
      const advisorId = 'advisor-123';
      const recentContent = [
        { content_id: 'content-1', delivered_at: new Date() },
        { content_id: 'content-2', delivered_at: new Date() }
      ];

      // Mock recent content history
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  data: recentContent,
                  error: null
                }))
              }))
            }))
          }))
        }))
      }));

      const fallbackPool = [
        { id: 'content-1' }, // Recently sent
        { id: 'content-3' }, // Not sent
        { id: 'content-4' }  // Not sent
      ];

      const selected = await fallbackService.selectWithoutRepetition(
        advisorId, 
        fallbackPool
      );

      expect(selected.id).not.toBe('content-1');
      expect(['content-3', 'content-4']).toContain(selected.id);
    });
  });

  describe('performanceOptimization', () => {
    it('should cache fallback assignments for quick retrieval', async () => {
      const advisorId = 'advisor-123';
      const fallbackContent = {
        id: 'fallback-123',
        content: 'Cached content',
        assigned_at: new Date()
      };

      await fallbackService.cacheFallbackAssignment(advisorId, fallbackContent);

      expect(redis.setex).toHaveBeenCalledWith(
        `fallback:${advisorId}`,
        86400, // 24 hours
        JSON.stringify(fallbackContent)
      );
    });

    it('should pre-compute fallback assignments in batch', async () => {
      const advisorIds = Array(100).fill(null).map((_, i) => `advisor-${i}`);
      
      const startTime = Date.now();
      const assignments = await fallbackService.batchAssignFallback(advisorIds);
      const executionTime = Date.now() - startTime;

      expect(assignments).toHaveLength(100);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain fallback content pool in Redis sorted set', async () => {
      const contentPool = [
        { id: 'content-1', score: 0.9 },
        { id: 'content-2', score: 0.85 },
        { id: 'content-3', score: 0.8 }
      ];

      await fallbackService.updateFallbackPool(contentPool);

      expect(redis.zadd).toHaveBeenCalledTimes(contentPool.length);
      expect(redis.zadd).toHaveBeenCalledWith(
        'fallback:pool',
        0.9,
        'content-1'
      );
    });
  });

  describe('multiLanguageSupport', () => {
    it('should provide fallback content in advisor preferred language', async () => {
      const advisors = [
        { id: '1', language: 'en' },
        { id: '2', language: 'hi' },
        { id: '3', language: 'mr' }
      ];

      const fallbackAssignments = await fallbackService.assignMultilingualFallback(advisors);

      expect(fallbackAssignments['1'].language).toBe('en');
      expect(fallbackAssignments['2'].language).toBe('hi');
      expect(fallbackAssignments['3'].language).toBe('mr');
    });

    it('should translate fallback content if not available in preferred language', async () => {
      const content = {
        id: 'content-1',
        body_en: 'Investment tips',
        body_hi: null,
        body_mr: null
      };

      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'निवेश युक्तियाँ' // Hindi translation
          }
        }]
      });

      const translated = await fallbackService.translateFallbackContent(content, 'hi');

      expect(translated.body_hi).toBe('निवेश युक्तियाँ');
      expect(translated.language).toBe('hi');
    });
  });

  describe('qualityAssurance', () => {
    it('should maintain minimum quality threshold for fallback content', async () => {
      const contentPool = [
        { id: '1', quality_score: 0.95 },
        { id: '2', quality_score: 0.6 }, // Below threshold
        { id: '3', quality_score: 0.85 }
      ];

      const filtered = await fallbackService.filterByQuality(contentPool, 0.8);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.quality_score >= 0.8)).toBe(true);
    });

    it('should track fallback content performance', async () => {
      const fallbackId = 'fallback-123';
      const metrics = {
        delivered_count: 150,
        engagement_rate: 0.68,
        feedback_score: 4.2
      };

      mockSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: { ...metrics, updated_at: new Date() },
            error: null
          }))
        }))
      }));

      await fallbackService.updateFallbackMetrics(fallbackId, metrics);

      expect(mockSupabase.from).toHaveBeenCalledWith('fallback_content');
    });

    it('should retire low-performing fallback content', async () => {
      const contentPool = [
        { id: '1', engagement_rate: 0.3, delivered_count: 100 }, // Poor performance
        { id: '2', engagement_rate: 0.75, delivered_count: 150 }
      ];

      const activePool = await fallbackService.retireLowPerformers(contentPool);

      expect(activePool).toHaveLength(1);
      expect(activePool[0].id).toBe('2');
    });
  });

  describe('emergencyFallback', () => {
    it('should have emergency fallback for system failures', async () => {
      // Simulate database failure
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          error: new Error('Database connection failed')
        }))
      }));

      const emergencyContent = await fallbackService.getEmergencyFallback();

      expect(emergencyContent).toBeDefined();
      expect(emergencyContent.source).toBe('emergency_cache');
      expect(emergencyContent.content).toContain('market update');
    });

    it('should maintain local emergency content cache', async () => {
      const emergencyPack = await fallbackService.initializeEmergencyCache();

      expect(emergencyPack).toHaveLength(7); // One week of content
      expect(emergencyPack[0].is_emergency).toBe(true);
      expect(emergencyPack[0].sebi_compliant).toBe(true);
    });
  });

  describe('reporting', () => {
    it('should generate fallback usage report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: [
                { advisor_id: '1', fallback_used: true, date: '2024-01-15' },
                { advisor_id: '2', fallback_used: false, date: '2024-01-16' }
              ],
              error: null
            }))
          }))
        }))
      }));

      const report = await fallbackService.generateUsageReport(startDate, endDate);

      expect(report.total_advisors).toBe(2);
      expect(report.fallback_usage_rate).toBe(0.5);
      expect(report.zero_silent_days_achieved).toBe(true);
    });

    it('should track fallback assignment success rate', async () => {
      const metrics = await fallbackService.getFallbackMetrics();

      expect(metrics.assignment_success_rate).toBeGreaterThanOrEqual(0.99);
      expect(metrics.average_assignment_time_ms).toBeLessThan(100);
      expect(metrics.zero_silent_days_compliance).toBe(true);
    });
  });
});