/**
 * Compliance Rules Service Tests  
 * Tests for SEBI Ad Code compliance validation
 */

import { ComplianceRulesService } from '@/lib/services/compliance-rules-service';
import { OpenAI } from 'openai';
import { redis } from '@/lib/redis';

// Mock dependencies
jest.mock('openai');
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn()
  }
}));

describe('ComplianceRulesService', () => {
  let complianceService: ComplianceRulesService;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    complianceService = new ComplianceRulesService();
    mockOpenAI = new OpenAI({ apiKey: 'test' });
  });

  describe('threeStageValidation', () => {
    it('should perform three-stage compliance validation', async () => {
      const content = {
        text: 'Invest in our mutual fund scheme for steady returns',
        advisorId: 'advisor-123',
        euin: 'E123456'
      };

      // Stage 1: Hard rules
      const stage1 = await complianceService.validateStage1(content);
      expect(stage1.passed).toBe(true);
      expect(stage1.stage).toBe('hard_rules');

      // Stage 2: AI evaluation
      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              compliant: true,
              score: 0.92,
              issues: []
            })
          }
        }]
      });

      const stage2 = await complianceService.validateStage2(content);
      expect(stage2.passed).toBe(true);
      expect(stage2.stage).toBe('ai_evaluation');

      // Stage 3: Final verification
      const stage3 = await complianceService.validateStage3(content);
      expect(stage3.passed).toBe(true);
      expect(stage3.stage).toBe('final_verification');

      // Overall validation
      const result = await complianceService.validateContent(content);
      expect(result.compliant).toBe(true);
      expect(result.stages_passed).toBe(3);
    });

    it('should complete validation within 1.5 seconds', async () => {
      const content = {
        text: 'Investment advice content',
        advisorId: 'advisor-123'
      };

      const startTime = Date.now();
      await complianceService.validateContent(content);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(1500); // <1.5s requirement
    });
  });

  describe('prohibitedContent', () => {
    it('should detect guaranteed returns claims', async () => {
      const violations = [
        'Guaranteed 15% returns annually',
        'Assured returns of 12% per year',
        'Promise you 20% profits',
        'Ensure minimum 10% gains'
      ];

      for (const text of violations) {
        const result = await complianceService.checkProhibitedContent(text);
        expect(result.violations).toContain('guaranteed_returns');
        expect(result.compliant).toBe(false);
      }
    });

    it('should detect misleading performance claims', async () => {
      const content = 'Our fund has beaten the market 10 years in a row!';
      
      const result = await complianceService.checkProhibitedContent(content);
      
      expect(result.violations).toContain('selective_performance');
      expect(result.compliant).toBe(false);
      expect(result.suggestion).toContain('Include complete performance data');
    });

    it('should detect missing risk disclaimers', async () => {
      const content = 'Invest in equity mutual funds for wealth creation';
      
      const result = await complianceService.checkMandatoryElements(content);
      
      expect(result.missing).toContain('risk_disclaimer');
      expect(result.compliant).toBe(false);
      expect(result.required_text).toContain('subject to market risks');
    });

    it('should flag superlative claims', async () => {
      const violations = [
        'Best mutual fund in India',
        'Top performing scheme',
        'Unbeatable returns',
        'Number 1 fund house'
      ];

      for (const text of violations) {
        const result = await complianceService.checkProhibitedContent(text);
        expect(result.violations).toContain('superlative_claims');
      }
    });
  });

  describe('mandatoryElements', () => {
    it('should verify presence of advisor identity', async () => {
      const content = {
        text: 'Investment tips for wealth creation',
        euin: null,
        advisorName: null
      };

      const result = await complianceService.checkMandatoryElements(content);
      
      expect(result.missing).toContain('advisor_identity');
      expect(result.compliant).toBe(false);
    });

    it('should verify EUIN disclosure', async () => {
      const content = {
        text: 'Mutual fund investment advice',
        euin: 'E123456',
        advisorName: 'John Doe'
      };

      const result = await complianceService.checkMandatoryElements(content);
      
      expect(result.has_euin).toBe(true);
      expect(result.euin_format_valid).toBe(true);
    });

    it('should ensure educational framing', async () => {
      const content = 'Buy this fund now for quick profits!';
      
      const result = await complianceService.checkEducationalFraming(content);
      
      expect(result.is_educational).toBe(false);
      expect(result.issues).toContain('promotional_language');
      expect(result.suggestion).toContain('educational tone');
    });

    it('should validate disclaimer placement', async () => {
      const content = {
        text: 'Investment advice content',
        disclaimer: 'Mutual funds are subject to market risks',
        disclaimer_position: 'bottom'
      };

      const result = await complianceService.validateDisclaimerPlacement(content);
      
      expect(result.placement_valid).toBe(true);
      expect(result.visibility_adequate).toBe(true);
    });
  });

  describe('contextualCompliance', () => {
    it('should validate based on content type', async () => {
      const educationalContent = {
        type: 'educational',
        text: 'Understanding mutual fund basics'
      };

      const marketingContent = {
        type: 'marketing',
        text: 'Invest with us for better returns'
      };

      const eduResult = await complianceService.validateByType(educationalContent);
      const mktResult = await complianceService.validateByType(marketingContent);

      expect(eduResult.rules_applied).toContain('educational_content_rules');
      expect(mktResult.rules_applied).toContain('marketing_strict_rules');
      expect(mktResult.scrutiny_level).toBe('high');
    });

    it('should apply stricter rules for performance content', async () => {
      const content = {
        text: 'Our fund delivered 25% returns last year',
        type: 'performance'
      };

      const result = await complianceService.validatePerformanceContent(content);
      
      expect(result.requires_additional_disclosure).toBe(true);
      expect(result.required_elements).toContain('complete_performance_history');
      expect(result.required_elements).toContain('benchmark_comparison');
      expect(result.required_elements).toContain('risk_metrics');
    });

    it('should validate scheme-specific content', async () => {
      const content = {
        text: 'ELSS funds offer tax benefits under 80C',
        scheme_type: 'ELSS'
      };

      const result = await complianceService.validateSchemeContent(content);
      
      expect(result.scheme_rules_applied).toBe(true);
      expect(result.required_disclosures).toContain('lock_in_period');
      expect(result.required_disclosures).toContain('tax_implications');
    });
  });

  describe('aiComplianceEvaluation', () => {
    it('should use AI for nuanced compliance checking', async () => {
      const content = 'Investment strategies for long-term wealth creation';

      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              compliance_score: 0.95,
              tone_analysis: 'educational',
              risk_factors: [],
              suggestions: ['Add specific risk disclaimer']
            })
          }
        }]
      });

      const result = await complianceService.aiComplianceCheck(content);

      expect(result.compliance_score).toBe(0.95);
      expect(result.tone_analysis).toBe('educational');
      expect(result.ai_confidence).toBeGreaterThan(0.8);
    });

    it('should detect subtle violations using AI', async () => {
      const content = 'Historical performance suggests future success';

      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              compliance_score: 0.4,
              violations: ['implied_future_performance'],
              reasoning: 'Content implies past performance indicates future returns'
            })
          }
        }]
      });

      const result = await complianceService.aiComplianceCheck(content);

      expect(result.compliance_score).toBeLessThan(0.5);
      expect(result.violations).toContain('implied_future_performance');
    });
  });

  describe('multiLanguageCompliance', () => {
    it('should validate Hindi content for compliance', async () => {
      const content = {
        text: 'म्यूचुअल फंड निवेश बाजार जोखिमों के अधीन हैं',
        language: 'hi'
      };

      const result = await complianceService.validateMultilingualContent(content);
      
      expect(result.language_validated).toBe('hi');
      expect(result.compliant).toBe(true);
      expect(result.has_disclaimer).toBe(true);
    });

    it('should ensure disclaimer in same language as content', async () => {
      const content = {
        text_hi: 'निवेश सलाह',
        disclaimer_en: 'Subject to market risks',
        primary_language: 'hi'
      };

      const result = await complianceService.validateLanguageConsistency(content);
      
      expect(result.language_consistent).toBe(false);
      expect(result.issue).toBe('disclaimer_language_mismatch');
      expect(result.required_action).toBe('Translate disclaimer to Hindi');
    });
  });

  describe('realTimeCompliance', () => {
    it('should provide real-time compliance feedback', async () => {
      const partialContent = 'Invest for guaranteed';
      
      const feedback = await complianceService.getRealTimeFeedback(partialContent);
      
      expect(feedback.potential_issues).toContain('guaranteed_keyword_detected');
      expect(feedback.suggestion).toBe('Avoid using "guaranteed" with returns');
      expect(feedback.severity).toBe('high');
    });

    it('should cache compliance results for performance', async () => {
      const content = 'Standard investment advice content';
      
      await complianceService.validateContent(content);
      
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining('compliance:'),
        3600,
        expect.any(String)
      );
    });
  });

  describe('complianceReporting', () => {
    it('should generate compliance audit report', async () => {
      const period = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const report = await complianceService.generateComplianceReport(period);

      expect(report.total_content_reviewed).toBeGreaterThanOrEqual(0);
      expect(report.compliance_rate).toBeGreaterThanOrEqual(0.95);
      expect(report.common_violations).toBeInstanceOf(Array);
      expect(report.advisor_compliance_scores).toBeDefined();
    });

    it('should track violation patterns', async () => {
      const violations = await complianceService.getViolationPatterns();

      expect(violations.most_common).toBeDefined();
      expect(violations.by_advisor_type).toBeDefined();
      expect(violations.trend).toMatch(/increasing|decreasing|stable/);
      expect(violations.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('regulatoryUpdates', () => {
    it('should adapt to new SEBI guidelines', async () => {
      const newGuideline = {
        effective_date: new Date('2024-04-01'),
        rule: 'new_disclosure_requirement',
        details: 'Additional risk metrics required'
      };

      await complianceService.updateComplianceRules(newGuideline);

      const content = 'Investment advice';
      const result = await complianceService.validateContent(content);

      expect(result.rules_version).toContain('2024-04-01');
      expect(result.new_requirements_checked).toBe(true);
    });

    it('should notify about regulatory changes', async () => {
      const changes = await complianceService.getRegulatorYChanges();

      expect(changes.pending_changes).toBeInstanceOf(Array);
      expect(changes.effective_dates).toBeDefined();
      expect(changes.impact_assessment).toBeDefined();
    });
  });

  describe('errorHandling', () => {
    it('should handle AI service failures gracefully', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock) = jest.fn()
        .mockRejectedValue(new Error('AI service unavailable'));

      const content = 'Investment advice content';
      const result = await complianceService.validateContent(content);

      expect(result.fallback_mode).toBe(true);
      expect(result.validation_method).toBe('rules_only');
      expect(result.compliant).toBeDefined(); // Still provides result
    });

    it('should maintain compliance checking during high load', async () => {
      const contents = Array(100).fill('Investment advice');
      
      const results = await Promise.all(
        contents.map(c => complianceService.validateContent(c))
      );

      expect(results.every(r => r.compliant !== undefined)).toBe(true);
      expect(results.every(r => r.processing_time < 1500)).toBe(true);
    });
  });

  describe('whatsappSpecificCompliance', () => {
    it('should validate WhatsApp message format compliance', async () => {
      const message = {
        text: 'Investment tip: Mutual funds are subject to market risks',
        format: 'whatsapp',
        length: 1024
      };

      const result = await complianceService.validateWhatsAppCompliance(message);

      expect(result.length_compliant).toBe(true);
      expect(result.has_required_disclaimer).toBe(true);
      expect(result.format_appropriate).toBe(true);
    });

    it('should ensure template compliance for WhatsApp', async () => {
      const template = {
        name: 'daily_tip',
        content: '{{1}} - Investment tip: {{2}}. Mutual funds are subject to market risks.',
        variables: ['Advisor Name', 'Tip Content']
      };

      const result = await complianceService.validateWhatsAppTemplate(template);

      expect(result.template_compliant).toBe(true);
      expect(result.has_disclaimer).toBe(true);
      expect(result.variable_positions_valid).toBe(true);
    });
  });
});