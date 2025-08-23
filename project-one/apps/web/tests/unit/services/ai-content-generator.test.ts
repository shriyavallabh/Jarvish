import { OpenAIService } from '@/lib/ai/openai-service';
import { ContentGenerationSchema } from '@/lib/ai/openai-service';

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

describe('AI Content Generator Service', () => {
  let service: OpenAIService;
  
  beforeEach(() => {
    service = new OpenAIService();
    jest.clearAllMocks();
  });

  describe('Content Generation', () => {
    it('should generate WhatsApp-ready content under 1024 characters', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'market_update' as const,
        language: 'en' as const,
        tone: 'professional' as const,
        advisorName: 'John Doe',
        euin: 'E123456'
      };

      const result = await service.generateContent(params);
      
      expect(result).toBeDefined();
      expect(result.content.length).toBeLessThanOrEqual(1024);
      expect(result.category).toBe(params.category);
      expect(result.language).toBe(params.language);
    });

    it('should support Hindi language generation', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'investment_tips' as const,
        language: 'hi' as const,
        advisorName: 'राज शर्मा',
        euin: 'E123456'
      };

      const result = await service.generateContent(params);
      
      expect(result).toBeDefined();
      expect(result.language).toBe('hi');
      // Check for Hindi characters
      expect(/[\u0900-\u097F]/.test(result.content)).toBe(true);
    });

    it('should complete generation within 3.5 seconds', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'educational' as const,
        language: 'en' as const
      };

      const startTime = Date.now();
      await service.generateContent(params);
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(3500);
    });

    it('should enforce daily generation limits', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'market_update' as const,
        language: 'en' as const
      };

      // Generate up to the limit
      for (let i = 0; i < 10; i++) {
        await service.generateContent(params);
      }

      // Next generation should fail
      await expect(service.generateContent(params))
        .rejects.toThrow('Daily generation limit exceeded');
    });

    it('should use hierarchical prompt system', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'tax_planning' as const,
        language: 'en' as const,
        tone: 'friendly' as const,
        context: 'End of financial year approaching'
      };

      const result = await service.generateContent(params);
      
      expect(result).toBeDefined();
      expect(result.category).toBe('tax_planning');
      // Should include tax-related content
      expect(result.content.toLowerCase()).toMatch(/tax|deduction|80c|planning/);
    });

    it('should include required disclaimers', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'investment_tips' as const,
        language: 'en' as const,
        euin: 'E123456'
      };

      const result = await service.generateContent(params);
      
      expect(result.disclaimers).toBeDefined();
      expect(result.disclaimers.length).toBeGreaterThan(0);
      expect(result.disclaimers.some(d => 
        d.includes('market risk') || d.includes('Market risks')
      )).toBe(true);
    });

    it('should personalize content based on advisor profile', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'market_update' as const,
        language: 'en' as const,
        advisorName: 'Sarah Johnson',
        specialization: 'Equity Markets',
        clientDemographics: {
          ageGroup: '25-35',
          investmentPreference: 'growth'
        }
      };

      const result = await service.generateContent(params);
      
      expect(result).toBeDefined();
      expect(result.content).toContain(params.advisorName);
    });

    it('should generate appropriate hashtags', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'educational' as const,
        language: 'en' as const
      };

      const result = await service.generateContent(params);
      
      expect(result.hashtags).toBeDefined();
      expect(Array.isArray(result.hashtags)).toBe(true);
      expect(result.hashtags.length).toBeGreaterThan(0);
      expect(result.hashtags.length).toBeLessThanOrEqual(5);
    });

    it('should handle API failures with fallback', async () => {
      // Mock API failure
      const OpenAI = require('openai').default;
      OpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValueOnce(new Error('API Error'))
          }
        }
      }));

      const params = {
        advisorId: 'test-advisor-123',
        category: 'market_update' as const,
        language: 'en' as const
      };

      const result = await service.generateContent(params);
      
      // Should return template-based content as fallback
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should validate generated content schema', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'investment_tips' as const,
        language: 'en' as const
      };

      const result = await service.generateContent(params);
      
      // Validate against schema
      const validation = ContentGenerationSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });
  });

  describe('Prompt Caching', () => {
    it('should cache repeated prompts for 14 days', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'market_update' as const,
        language: 'en' as const,
        tone: 'professional' as const
      };

      // First call
      const result1 = await service.generateContent(params);
      
      // Second call with same params
      const result2 = await service.generateContent(params);
      
      // Should return cached result (faster)
      expect(result2).toEqual(result1);
    });

    it('should invalidate cache after TTL expires', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'educational' as const,
        language: 'en' as const
      };

      // Mock cache expiry
      jest.useFakeTimers();
      
      const result1 = await service.generateContent(params);
      
      // Advance time by 15 days
      jest.advanceTimersByTime(15 * 24 * 60 * 60 * 1000);
      
      const result2 = await service.generateContent(params);
      
      // Should generate new content
      expect(result2).not.toEqual(result1);
      
      jest.useRealTimers();
    });
  });

  describe('Cost Controls', () => {
    it('should track usage per advisor', async () => {
      const advisor1Params = {
        advisorId: 'advisor-1',
        category: 'market_update' as const,
        language: 'en' as const
      };

      const advisor2Params = {
        advisorId: 'advisor-2',
        category: 'market_update' as const,
        language: 'en' as const
      };

      // Generate for advisor 1
      for (let i = 0; i < 5; i++) {
        await service.generateContent(advisor1Params);
      }

      // Advisor 2 should still be able to generate
      const result = await service.generateContent(advisor2Params);
      expect(result).toBeDefined();
    });

    it('should reset daily limits at midnight', async () => {
      const params = {
        advisorId: 'test-advisor-123',
        category: 'market_update' as const,
        language: 'en' as const
      };

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01 23:59:00'));

      // Use up daily limit
      for (let i = 0; i < 10; i++) {
        await service.generateContent(params);
      }

      // Move to next day
      jest.setSystemTime(new Date('2024-01-02 00:01:00'));
      
      // Should be able to generate again
      const result = await service.generateContent(params);
      expect(result).toBeDefined();

      jest.useRealTimers();
    });
  });
});