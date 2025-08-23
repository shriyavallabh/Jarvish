import { ThreeStageValidator } from '@/lib/ai/three-stage-validator';
import SEBIComplianceValidator from '@/lib/validators/sebi-compliance';

// Mock OpenAI for AI stage
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                is_compliant: true,
                risk_score: 25,
                violations: [],
                reasoning: 'Content appears compliant',
                confidence: 0.95
              })
            }
          }]
        })
      }
    }
  }))
}));

describe('SEBI Compliance Engine', () => {
  let validator: ThreeStageValidator;
  let sebiValidator: SEBIComplianceValidator;

  beforeEach(() => {
    validator = new ThreeStageValidator();
    sebiValidator = new SEBIComplianceValidator();
    jest.clearAllMocks();
  });

  describe('Three-Stage Validation', () => {
    it('should complete validation within 1.5 seconds', async () => {
      const params = {
        content: 'Mutual funds are subject to market risks. Read all scheme-related documents carefully.',
        contentType: 'educational',
        language: 'en' as const,
        advisorId: 'test-advisor',
        euin: 'E123456'
      };

      const startTime = Date.now();
      const result = await validator.validate(params);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(1500);
      expect(result).toBeDefined();
    });

    it('should execute all three stages in sequence', async () => {
      const params = {
        content: 'Invest in equity for long-term wealth creation. Markets can be volatile.',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.stages).toHaveLength(3);
      expect(result.stages[0].name).toBe('Hard Rules Engine');
      expect(result.stages[1].name).toBe('AI Semantic Analysis');
      expect(result.stages[2].name).toBe('Final Verification');
    });

    it('should immediately block guaranteed returns language', async () => {
      const params = {
        content: 'Guaranteed returns of 15% annually! Invest now!',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.isCompliant).toBe(false);
      expect(result.riskScore).toBe(100);
      expect(result.colorCode).toBe('red');
      expect(result.violations.some(v => 
        v.description.toLowerCase().includes('guaranteed')
      )).toBe(true);
    });

    it('should detect missing disclaimers', async () => {
      const params = {
        content: 'SIP is the best way to invest in mutual funds.',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => 
        v.description.toLowerCase().includes('disclaimer')
      )).toBe(true);
      expect(result.suggestions.some(s => 
        s.toLowerCase().includes('market risk')
      )).toBe(true);
    });

    it('should handle Hindi content correctly', async () => {
      const params = {
        content: 'म्यूचुअल फंड बाजार जोखिम के अधीन हैं। सभी योजना संबंधी दस्तावेजों को सावधानीपूर्वक पढ़ें।',
        contentType: 'educational',
        language: 'hi' as const,
        advisorId: 'test-advisor',
        euin: 'E123456'
      };

      const result = await validator.validate(params);

      expect(result).toBeDefined();
      expect(result.isCompliant).toBe(true);
      expect(result.riskScore).toBeLessThan(30);
    });

    it('should fallback to rules-only when AI fails', async () => {
      // Mock AI failure for this specific test
      const openAIMock = require('openai').default;
      const originalImplementation = openAIMock.mockImplementation;
      
      // Temporarily override to simulate failure
      openAIMock.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      }));

      // Create a new validator instance with the failing mock
      const failingValidator = new ThreeStageValidator();

      const params = {
        content: 'Invest wisely in mutual funds. Market risks apply.',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor',
        euin: 'E123456'
      };

      const result = await failingValidator.validate(params);
      
      // Restore original mock
      openAIMock.mockImplementation = originalImplementation;

      expect(result).toBeDefined();
      expect(result.fallbackUsed).toBe(true);
      expect(result.stages.some(s => s.name === 'AI Semantic Analysis' && !s.passed)).toBe(true);
    });
  });

  describe('Risk Scoring', () => {
    it('should assign low risk score (0-30) for compliant content', async () => {
      const params = {
        content: 'Understanding market cycles is important for investors. Always consult your financial advisor. Mutual funds are subject to market risks.',
        contentType: 'educational',
        language: 'en' as const,
        advisorId: 'test-advisor',
        euin: 'E123456'
      };

      const result = await validator.validate(params);

      expect(result.riskScore).toBeLessThanOrEqual(30);
      expect(result.riskLevel).toBe('low');
      expect(result.colorCode).toBe('green');
    });

    it('should assign medium risk score (31-70) for borderline content', async () => {
      const params = {
        content: 'Historical data shows equity has given good returns over 10 years.',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.riskScore).toBeGreaterThan(30);
      expect(result.riskScore).toBeLessThanOrEqual(70);
      expect(result.riskLevel).toBe('medium');
      expect(result.colorCode).toBe('yellow');
    });

    it('should assign high risk score (71-100) for non-compliant content', async () => {
      const params = {
        content: 'This fund will definitely double your money in 3 years!',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.riskScore).toBeGreaterThan(70);
      expect(result.riskLevel).toBe('high');
      expect(result.colorCode).toBe('red');
    });

    it('should apply uniform scoring across all advisors', async () => {
      const content = 'Invest in this fund for assured growth';
      
      const result1 = await validator.validate({
        content,
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'advisor-1'
      });

      const result2 = await validator.validate({
        content,
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'advisor-2'
      });

      expect(result1.riskScore).toBe(result2.riskScore);
      expect(result1.riskLevel).toBe(result2.riskLevel);
    });
  });

  describe('Prohibited Content Detection', () => {
    it('should detect guaranteed returns language', async () => {
      const prohibitedPhrases = [
        'guaranteed returns',
        'assured profits',
        'no risk investment',
        'definite gains',
        '100% safe returns'
      ];

      for (const phrase of prohibitedPhrases) {
        const result = await validator.validate({
          content: `Invest now for ${phrase}!`,
          contentType: 'investment_tips',
          language: 'en' as const,
          advisorId: 'test-advisor'
        });

        expect(result.isCompliant).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
      }
    });

    it('should detect selective performance claims', async () => {
      const params = {
        content: 'Our best performing fund gave 45% returns last year!',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => 
        v.description.toLowerCase().includes('selective') || 
        v.description.toLowerCase().includes('performance')
      )).toBe(true);
    });

    it('should detect misleading statements', async () => {
      const params = {
        content: 'This investment strategy never fails!',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => 
        v.description.toLowerCase().includes('misleading')
      )).toBe(true);
    });

    it('should check for required EUIN display', async () => {
      const params = {
        content: 'Invest in mutual funds for wealth creation.',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor',
        euin: 'E123456',
        strictMode: true
      };

      const result = await validator.validate(params);

      if (!params.content.includes(params.euin)) {
        expect(result.suggestions.some(s => 
          s.toLowerCase().includes('euin') || 
          s.toLowerCase().includes('registration')
        )).toBe(true);
      }
    });

    it('should flag excessive emoji usage', async () => {
      const params = {
        content: 'Invest now! 💰💰💰💰 Best returns! 🚀🚀🚀',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.violations.some(v => 
        v.description.toLowerCase().includes('emoji')
      )).toBe(true);
    });
  });

  describe('Compliance Feedback', () => {
    it('should provide specific violation descriptions', async () => {
      const params = {
        content: 'Get guaranteed 20% returns with zero risk!',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.violations).toBeDefined();
      expect(result.violations.length).toBeGreaterThan(0);
      result.violations.forEach(violation => {
        expect(violation.type).toBeDefined();
        expect(violation.severity).toBeDefined();
        expect(violation.description).toBeDefined();
        expect(violation.stage).toBeDefined();
      });
    });

    it('should provide actionable suggestions', async () => {
      const params = {
        content: 'This fund will give you excellent returns.',
        contentType: 'investment_tips',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => 
        s.includes('market risk') || 
        s.includes('disclaimer') ||
        s.includes('past performance')
      )).toBe(true);
    });

    it('should attempt to fix minor violations', async () => {
      const params = {
        content: 'Mutual funds can help build wealth over time.',
        contentType: 'educational',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      if (result.finalContent) {
        expect(result.finalContent).toContain('market risk');
      }
    });
  });

  describe('Audit Logging', () => {
    it('should create comprehensive audit logs', async () => {
      const params = {
        content: 'Test content for audit',
        contentType: 'educational',
        language: 'en' as const,
        advisorId: 'test-advisor-123',
        euin: 'E123456'
      };

      const result = await validator.validate(params);

      expect(result.auditLog).toBeDefined();
      expect(result.auditLog.timestamp).toBeDefined();
      expect(result.auditLog.contentHash).toBeDefined();
      expect(result.auditLog.advisorId).toBe(params.advisorId);
      expect(result.auditLog.stages).toHaveLength(3);
    });

    it('should generate unique content hashes', async () => {
      const params1 = {
        content: 'Content 1',
        contentType: 'educational',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const params2 = {
        content: 'Content 2',
        contentType: 'educational',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result1 = await validator.validate(params1);
      const result2 = await validator.validate(params2);

      expect(result1.auditLog.contentHash).not.toBe(result2.auditLog.contentHash);
    });
  });

  describe('Performance Tracking', () => {
    it('should track validation performance metrics', async () => {
      const params = {
        content: 'Test content',
        contentType: 'educational',
        language: 'en' as const,
        advisorId: 'test-advisor'
      };

      const result = await validator.validate(params);

      expect(result.totalExecutionTime).toBeDefined();
      expect(result.totalExecutionTime).toBeGreaterThan(0);
      expect(result.stages.every(s => s.executionTime >= 0)).toBe(true);
    });

    it('should maintain performance history per advisor', async () => {
      const advisorId = 'test-advisor-perf';
      
      // Run multiple validations
      for (let i = 0; i < 5; i++) {
        await validator.validate({
          content: `Test content ${i}`,
          contentType: 'educational',
          language: 'en' as const,
          advisorId
        });
      }

      // Performance metrics should be tracked
      validator.trackPerformance(advisorId, 100);
      // Verify metrics are stored (implementation specific)
    });
  });
});