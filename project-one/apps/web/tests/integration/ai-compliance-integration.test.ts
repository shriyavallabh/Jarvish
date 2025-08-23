import { OpenAIService } from '@/lib/ai/openai-service';
import { ThreeStageValidator } from '@/lib/ai/three-stage-validator';
import { checkCompliance, autoFixContent } from '@/lib/services/compliance-rules';
import { getAuditLogger } from '@/lib/services/audit-logger';

// Mock OpenAI to avoid actual API calls in tests
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                content: 'Test generated content. Mutual funds are subject to market risks.',
                title: 'Test Title',
                category: 'educational',
                language: 'en',
                risk_score: 15,
                compliance_notes: ['Template content'],
                disclaimers: ['Market risks apply'],
                hashtags: ['#FinancialLiteracy'],
                is_compliant: true,
                violations: [],
                reasoning: 'Content is compliant',
                confidence: 0.95
              })
            }
          }]
        })
      }
    }
  }))
}));

describe('AI-Powered Compliance Engine Integration', () => {
  let openAIService: OpenAIService;
  let validator: ThreeStageValidator;
  let auditLogger: ReturnType<typeof getAuditLogger>;

  beforeEach(() => {
    openAIService = new OpenAIService();
    validator = new ThreeStageValidator();
    auditLogger = getAuditLogger();
    jest.clearAllMocks();
  });

  describe('End-to-End Content Generation with Compliance', () => {
    it('should generate and validate content in under 3.5 seconds', async () => {
      const startTime = Date.now();
      
      // Generate content
      const generated = await openAIService.generateContent({
        advisorId: 'test-advisor',
        category: 'educational',
        language: 'en',
        tone: 'professional',
        advisorName: 'Test Advisor',
        euin: 'E123456'
      });

      // Validate content
      const validation = await validator.validate({
        content: generated.content,
        contentType: generated.category,
        language: generated.language,
        advisorId: 'test-advisor',
        euin: 'E123456'
      });

      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(3500);
      expect(generated).toBeDefined();
      expect(validation.isCompliant).toBeDefined();
      expect(validation.riskScore).toBeLessThanOrEqual(100);
    });

    it('should properly integrate three-stage validation', async () => {
      const testContent = 'Invest in mutual funds for wealth creation. Past performance indicates good returns.';
      
      const validation = await validator.validate({
        content: testContent,
        contentType: 'investment_tips',
        language: 'en',
        advisorId: 'test-advisor'
      });

      // Should have all three stages
      expect(validation.stages).toHaveLength(3);
      expect(validation.stages[0].name).toBe('Hard Rules Engine');
      expect(validation.stages[1].name).toContain('AI');
      expect(validation.stages[2].name).toBe('Final Verification');
      
      // Should detect missing disclaimer
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.suggestions.some(s => 
        s.toLowerCase().includes('disclaimer') || 
        s.toLowerCase().includes('risk')
      )).toBe(true);
    });

    it('should block critical violations immediately', async () => {
      const dangerousContent = 'Guaranteed returns of 20% annually! No risk investment!';
      
      const validation = await validator.validate({
        content: dangerousContent,
        contentType: 'investment_tips',
        language: 'en',
        advisorId: 'test-advisor'
      });

      expect(validation.isCompliant).toBe(false);
      expect(validation.riskScore).toBe(100);
      expect(validation.colorCode).toBe('red');
      expect(validation.stages).toHaveLength(1); // Should stop at stage 1
    });

    it('should handle Hindi content properly', async () => {
      const hindiContent = 'म्यूचुअल फंड निवेश बाजार जोखिम के अधीन हैं। सभी योजना संबंधी दस्तावेजों को सावधानीपूर्वक पढ़ें।';
      
      const validation = await validator.validate({
        content: hindiContent,
        contentType: 'educational',
        language: 'hi',
        advisorId: 'test-advisor'
      });

      expect(validation.isCompliant).toBe(true);
      expect(validation.riskScore).toBeLessThan(30);
      expect(validation.colorCode).toBe('green');
    });
  });

  describe('Audit Logging Integration', () => {
    it('should create comprehensive audit logs for all operations', async () => {
      const advisorId = 'audit-test-advisor';
      
      // Generate content
      await openAIService.generateContent({
        advisorId,
        category: 'market_update',
        language: 'en'
      });

      // Validate content
      await validator.validate({
        content: 'Test content for audit',
        contentType: 'educational',
        language: 'en',
        advisorId
      });

      // Check audit logs
      const logs = await auditLogger.getAuditLogs({ advisorId });
      
      expect(logs.logs.length).toBeGreaterThan(0);
      expect(logs.logs[0].advisorId).toBe(advisorId);
      expect(logs.logs[0].contentHash).toBeDefined();
      expect(logs.logs[0].regulatory.retentionDate).toBeDefined();
    });

    it('should track performance metrics correctly', async () => {
      const advisorId = 'perf-test-advisor';
      
      // Run multiple validations
      for (let i = 0; i < 3; i++) {
        await validator.validate({
          content: `Test content ${i}`,
          contentType: 'educational',
          language: 'en',
          advisorId
        });
      }

      // Get performance metrics
      const metrics = validator.getPerformanceMetrics(advisorId);
      
      expect(metrics.totalChecks).toBe(3);
      expect(metrics.avgTime).toBeGreaterThan(0);
      expect(metrics.p95Time).toBeGreaterThan(0);
    });

    it('should generate compliance analytics', async () => {
      const advisorId = 'analytics-test-advisor';
      
      // Create some test data
      await validator.validate({
        content: 'Good content with proper disclaimers. Market risks apply.',
        contentType: 'educational',
        language: 'en',
        advisorId
      });

      await validator.validate({
        content: 'Guaranteed returns content',
        contentType: 'investment_tips',
        language: 'en',
        advisorId
      });

      // Get analytics
      const analytics = await auditLogger.getComplianceAnalytics(advisorId, 'day');
      
      expect(analytics.totalChecks).toBeGreaterThan(0);
      expect(analytics.complianceRate).toBeDefined();
      expect(analytics.averageRiskScore).toBeDefined();
      expect(analytics.commonViolations).toBeDefined();
    });
  });

  describe('Rules-Based Compliance', () => {
    it('should detect all SEBI violations correctly', () => {
      const testCases = [
        {
          content: 'Guaranteed returns of 15% annually',
          expectedViolation: 'GUARANTEED_RETURNS'
        },
        {
          content: 'This fund will double your money in 3 years',
          expectedViolation: 'MISLEADING_CLAIMS'
        },
        {
          content: 'I have insider information about this stock',
          expectedViolation: 'INSIDER_TRADING'
        },
        {
          content: 'Beat the market with our strategy',
          expectedViolation: 'MARKET_BEATING'
        }
      ];

      testCases.forEach(test => {
        const result = checkCompliance(test.content, 'en', true);
        expect(result.violations.some(v => 
          v.type === test.expectedViolation
        )).toBe(true);
        expect(result.riskScore).toBeGreaterThan(50);
      });
    });

    it('should auto-fix minor violations', () => {
      const content = 'Best investment opportunity with limited time offer!';
      const compliance = checkCompliance(content, 'en');
      
      const fixed = autoFixContent(
        content,
        compliance.violations,
        compliance.missingDisclaimers
      );

      expect(fixed).toBeDefined();
      expect(fixed).not.toContain('best investment');
      expect(fixed).not.toContain('limited time offer');
    });

    it('should not auto-fix critical violations', () => {
      const content = 'Guaranteed returns of 20% with no risk!';
      const compliance = checkCompliance(content, 'en');
      
      const fixed = autoFixContent(
        content,
        compliance.violations,
        compliance.missingDisclaimers
      );

      expect(fixed).toBeNull();
    });
  });

  describe('Cost Control and Limits', () => {
    it('should enforce daily generation limits', async () => {
      const advisorId = 'limit-test-advisor';
      
      // Mock the daily limit as already reached
      for (let i = 0; i < 10; i++) {
        await openAIService.generateContent({
          advisorId,
          category: 'educational',
          language: 'en'
        });
      }

      // Next generation should fail
      await expect(openAIService.generateContent({
        advisorId,
        category: 'educational',
        language: 'en'
      })).rejects.toThrow('Daily content generation limit exceeded');
    });

    it('should track costs accurately', async () => {
      const advisorId = 'cost-test-advisor';
      
      await validator.validate({
        content: 'Test content',
        contentType: 'educational',
        language: 'en',
        advisorId
      });

      const logs = await auditLogger.getAuditLogs({ advisorId });
      const latestLog = logs.logs[0];
      
      expect(latestLog.metadata.costEstimate).toBeDefined();
      expect(latestLog.metadata.costEstimate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should fallback to rules-only when AI fails', async () => {
      // Mock AI failure
      const OpenAI = require('openai').default;
      OpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValueOnce(new Error('API Error'))
          }
        }
      }));

      const validation = await validator.validate({
        content: 'Test content for fallback',
        contentType: 'educational',
        language: 'en',
        advisorId: 'fallback-test'
      });

      expect(validation.fallbackUsed).toBe(true);
      expect(validation.stages.some(s => 
        s.name.includes('Fallback')
      )).toBe(true);
    });

    it('should use cached results when available', async () => {
      const advisorId = 'cache-test-advisor';
      const params = {
        advisorId,
        content: 'Cached test content',
        contentType: 'educational' as const,
        language: 'en' as const
      };

      // First call
      const result1 = await openAIService.checkCompliance(params);
      
      // Second call should use cache
      const startTime = Date.now();
      const result2 = await openAIService.checkCompliance(params);
      const cacheTime = Date.now() - startTime;

      expect(result2).toEqual(result1);
      expect(cacheTime).toBeLessThan(10); // Cache should be very fast
    });
  });

  describe('Real-time Validation', () => {
    it('should provide instant feedback for typing', () => {
      const partialContent = 'Guaranteed ret';
      
      const result = checkCompliance(partialContent, 'en');
      
      // Should detect potential violation even in partial content
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should handle progressive content updates efficiently', () => {
      const contents = [
        'Invest',
        'Invest in mutual',
        'Invest in mutual funds',
        'Invest in mutual funds for wealth'
      ];

      contents.forEach(content => {
        const startTime = Date.now();
        const result = checkCompliance(content, 'en');
        const time = Date.now() - startTime;
        
        expect(time).toBeLessThan(50); // Real-time should be very fast
        expect(result).toBeDefined();
      });
    });
  });
});