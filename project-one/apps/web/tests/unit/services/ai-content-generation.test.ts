import { AIContentGenerationService } from '../../../lib/services/ai-content-generation';
import { OpenAIService } from '../../../lib/ai/openai-service';
import { ThreeStageValidator } from '../../../lib/ai/three-stage-validator';

// Mock dependencies
jest.mock('../../../lib/ai/openai-service');
jest.mock('../../../lib/ai/three-stage-validator');

describe('AIContentGenerationService', () => {
  let service: AIContentGenerationService;
  let mockOpenAIService: jest.Mocked<OpenAIService>;
  let mockValidator: jest.Mocked<ThreeStageValidator>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AIContentGenerationService();
    mockOpenAIService = (service as any).openAIService;
    mockValidator = (service as any).validator;
  });

  describe('Content Generation', () => {
    it('should generate content in less than 3 seconds', async () => {
      const startTime = Date.now();
      
      mockOpenAIService.generateContent.mockResolvedValue({
        content: 'Test financial content',
        title: 'Test Title',
        category: 'educational',
        language: 'en',
        risk_score: 20,
        compliance_notes: ['Test note'],
        disclaimers: ['Market risks apply'],
        hashtags: ['#Finance']
      });

      mockValidator.validate.mockResolvedValue({
        isCompliant: true,
        riskScore: 20,
        riskLevel: 'low',
        colorCode: 'green',
        stages: [],
        finalContent: 'Test financial content',
        totalExecutionTime: 500,
        fallbackUsed: false,
        violations: [],
        suggestions: [],
        auditLog: {
          timestamp: new Date().toISOString(),
          contentHash: 'test-hash',
          advisorId: 'test-advisor',
          stages: []
        }
      });

      const result = await service.generateContent({
        advisorId: 'test-advisor',
        contentType: 'educational',
        language: 'en',
        advisorProfile: {
          name: 'Test Advisor',
          euin: 'E123456',
          specialization: 'Mutual Funds'
        }
      });

      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(3000);
      expect(result.content).toBeDefined();
      expect(result.isCompliant).toBe(true);
    });

    it('should support all 4 content types', async () => {
      const contentTypes = ['educational', 'market_updates', 'seasonal', 'promotional'];
      
      for (const contentType of contentTypes) {
        mockOpenAIService.generateContent.mockResolvedValue({
          content: `${contentType} content`,
          title: `${contentType} Title`,
          category: contentType as any,
          language: 'en',
          risk_score: 15,
          compliance_notes: [],
          disclaimers: ['Market risks'],
          hashtags: []
        });

        mockValidator.validate.mockResolvedValue({
          isCompliant: true,
          riskScore: 15,
          riskLevel: 'low',
          colorCode: 'green',
          stages: [],
          finalContent: `${contentType} content`,
          totalExecutionTime: 400,
          fallbackUsed: false,
          violations: [],
          suggestions: [],
          auditLog: {
            timestamp: new Date().toISOString(),
            contentHash: 'hash',
            advisorId: 'test-advisor',
            stages: []
          }
        });

        const result = await service.generateContent({
          advisorId: 'test-advisor',
          contentType: contentType as any,
          language: 'en',
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        });

        expect(result.contentType).toBe(contentType);
        expect(result.content).toContain(contentType);
      }
    });

    it('should support Hindi, English, and Mixed language selection', async () => {
      const languages = [
        { code: 'hi', expected: 'हिंदी सामग्री' },
        { code: 'en', expected: 'English content' },
        { code: 'mixed', expected: 'Mixed मिश्रित content' }
      ];

      for (const lang of languages) {
        mockOpenAIService.generateContent.mockResolvedValue({
          content: lang.expected,
          title: 'Test Title',
          category: 'educational',
          language: lang.code === 'mixed' ? 'en' : lang.code as any,
          risk_score: 10,
          compliance_notes: [],
          disclaimers: ['Disclaimer'],
          hashtags: []
        });

        mockValidator.validate.mockResolvedValue({
          isCompliant: true,
          riskScore: 10,
          riskLevel: 'low',
          colorCode: 'green',
          stages: [],
          finalContent: lang.expected,
          totalExecutionTime: 300,
          fallbackUsed: false,
          violations: [],
          suggestions: [],
          auditLog: {
            timestamp: new Date().toISOString(),
            contentHash: 'hash',
            advisorId: 'test-advisor',
            stages: []
          }
        });

        const result = await service.generateContent({
          advisorId: 'test-advisor',
          contentType: 'educational',
          language: lang.code as any,
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        });

        expect(result.language).toBe(lang.code);
        expect(result.content).toBe(lang.expected);
      }
    });

    it('should customize content based on advisor profile', async () => {
      const advisorProfile = {
        name: 'Rajesh Kumar',
        euin: 'E789012',
        specialization: 'Tax Planning',
        experience: 10,
        clientBase: 'HNI',
        preferredTone: 'professional' as const
      };

      mockOpenAIService.generateContent.mockResolvedValue({
        content: 'Customized tax planning content for HNI clients',
        title: 'Tax Planning Tips',
        category: 'tax_planning',
        language: 'en',
        risk_score: 15,
        compliance_notes: [],
        disclaimers: ['Tax laws subject to change'],
        hashtags: ['#TaxPlanning', '#HNI']
      });

      mockValidator.validate.mockResolvedValue({
        isCompliant: true,
        riskScore: 15,
        riskLevel: 'low',
        colorCode: 'green',
        stages: [],
        finalContent: 'Customized tax planning content for HNI clients',
        totalExecutionTime: 400,
        fallbackUsed: false,
        violations: [],
        suggestions: [],
        auditLog: {
          timestamp: new Date().toISOString(),
          contentHash: 'hash',
          advisorId: 'test-advisor',
          stages: []
        }
      });

      const result = await service.generateContent({
        advisorId: 'test-advisor',
        contentType: 'educational',
        language: 'en',
        advisorProfile
      });

      expect(mockOpenAIService.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          advisorName: 'Rajesh Kumar',
          euin: 'E789012',
          tone: 'professional',
          context: expect.stringContaining('Tax Planning')
        })
      );
      expect(result.content).toContain('tax planning');
    });

    it('should provide preview before finalization', async () => {
      mockOpenAIService.generateContent.mockResolvedValue({
        content: 'Preview content',
        title: 'Preview Title',
        category: 'educational',
        language: 'en',
        risk_score: 25,
        compliance_notes: ['Note 1'],
        disclaimers: ['Disclaimer 1'],
        hashtags: ['#Preview']
      });

      mockValidator.validate.mockResolvedValue({
        isCompliant: true,
        riskScore: 25,
        riskLevel: 'low',
        colorCode: 'green',
        stages: [],
        finalContent: 'Preview content',
        totalExecutionTime: 350,
        fallbackUsed: false,
        violations: [],
        suggestions: [],
        auditLog: {
          timestamp: new Date().toISOString(),
          contentHash: 'preview-hash',
          advisorId: 'test-advisor',
          stages: []
        }
      });

      const preview = await service.generatePreview({
        advisorId: 'test-advisor',
        contentType: 'educational',
        language: 'en',
        advisorProfile: {
          name: 'Test Advisor',
          euin: 'E123456',
          specialization: 'Mutual Funds'
        }
      });

      expect(preview).toHaveProperty('content');
      expect(preview).toHaveProperty('title');
      expect(preview).toHaveProperty('metadata');
      expect(preview).toHaveProperty('complianceStatus');
      expect(preview).toHaveProperty('isPreview', true);
      expect(preview.metadata).toHaveProperty('generatedAt');
      expect(preview.metadata).toHaveProperty('expiresAt');
    });

    it('should ensure SEBI compliance is built-in', async () => {
      mockOpenAIService.generateContent.mockResolvedValue({
        content: 'Investment content without disclaimer',
        title: 'Investment Tips',
        category: 'investment_tips',
        language: 'en',
        risk_score: 60,
        compliance_notes: ['Missing disclaimer'],
        disclaimers: [],
        hashtags: []
      });

      mockValidator.validate.mockResolvedValue({
        isCompliant: false,
        riskScore: 75,
        riskLevel: 'high',
        colorCode: 'red',
        stages: [
          {
            stage: 1,
            name: 'Hard Rules Engine',
            passed: false,
            violations: ['Missing risk disclaimer'],
            suggestions: ['Add market risk disclaimer'],
            executionTime: 50
          }
        ],
        finalContent: 'Investment content. Mutual fund investments are subject to market risks.',
        totalExecutionTime: 450,
        fallbackUsed: false,
        violations: [
          {
            type: 'MISSING_DISCLAIMER',
            severity: 'high',
            description: 'Missing risk disclaimer',
            stage: 1
          }
        ],
        suggestions: ['Add market risk disclaimer'],
        auditLog: {
          timestamp: new Date().toISOString(),
          contentHash: 'hash',
          advisorId: 'test-advisor',
          stages: []
        }
      });

      const result = await service.generateContent({
        advisorId: 'test-advisor',
        contentType: 'investment_tips',
        language: 'en',
        advisorProfile: {
          name: 'Test Advisor',
          euin: 'E123456',
          specialization: 'Mutual Funds'
        }
      });

      expect(mockValidator.validate).toHaveBeenCalled();
      expect(result.content).toContain('market risks');
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Hierarchical Prompt System', () => {
    it('should use master prompt for overall context', async () => {
      const prompts = await service.getPromptHierarchy();
      
      expect(prompts).toHaveProperty('master');
      expect(prompts.master).toContain('SEBI');
      expect(prompts.master).toContain('compliance');
    });

    it('should have content-type specific prompts', async () => {
      const prompts = await service.getPromptHierarchy();
      
      expect(prompts).toHaveProperty('contentTypes');
      expect(prompts.contentTypes).toHaveProperty('educational');
      expect(prompts.contentTypes).toHaveProperty('market_updates');
      expect(prompts.contentTypes).toHaveProperty('seasonal');
      expect(prompts.contentTypes).toHaveProperty('promotional');
    });

    it('should include language-specific instructions', async () => {
      const prompts = await service.getPromptHierarchy();
      
      expect(prompts).toHaveProperty('languages');
      expect(prompts.languages).toHaveProperty('hi');
      expect(prompts.languages).toHaveProperty('en');
      expect(prompts.languages).toHaveProperty('mixed');
    });
  });

  describe('Content Templates', () => {
    it('should provide templates for each content type', async () => {
      const templates = await service.getContentTemplates();
      
      expect(templates).toHaveProperty('educational');
      expect(templates).toHaveProperty('market_updates');
      expect(templates).toHaveProperty('seasonal');
      expect(templates).toHaveProperty('promotional');
      
      // Each template should have required fields
      Object.values(templates).forEach(template => {
        expect(template).toHaveProperty('structure');
        expect(template).toHaveProperty('requiredElements');
        expect(template).toHaveProperty('characterLimit');
        expect(template).toHaveProperty('complianceNotes');
      });
    });

    it('should enforce character limits for social media optimization', async () => {
      const templates = await service.getContentTemplates();
      
      Object.values(templates).forEach(template => {
        expect(template.characterLimit).toBeLessThanOrEqual(2000);
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should handle concurrent content generation requests', async () => {
      const promises = [];
      
      mockOpenAIService.generateContent.mockResolvedValue({
        content: 'Concurrent content',
        title: 'Title',
        category: 'educational',
        language: 'en',
        risk_score: 20,
        compliance_notes: [],
        disclaimers: ['Disclaimer'],
        hashtags: []
      });

      mockValidator.validate.mockResolvedValue({
        isCompliant: true,
        riskScore: 20,
        riskLevel: 'low',
        colorCode: 'green',
        stages: [],
        finalContent: 'Concurrent content',
        totalExecutionTime: 400,
        fallbackUsed: false,
        violations: [],
        suggestions: [],
        auditLog: {
          timestamp: new Date().toISOString(),
          contentHash: 'hash',
          advisorId: 'test-advisor',
          stages: []
        }
      });

      // Generate 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(
          service.generateContent({
            advisorId: `advisor-${i}`,
            contentType: 'educational',
            language: 'en',
            advisorProfile: {
              name: `Advisor ${i}`,
              euin: `E00000${i}`,
              specialization: 'Mutual Funds'
            }
          })
        );
      }

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.content).toBeDefined();
        expect(result.isCompliant).toBeDefined();
      });
    });

    it('should cache frequently used content patterns', async () => {
      const params = {
        advisorId: 'test-advisor',
        contentType: 'educational' as const,
        language: 'en' as const,
        advisorProfile: {
          name: 'Test Advisor',
          euin: 'E123456',
          specialization: 'Mutual Funds'
        }
      };

      mockOpenAIService.generateContent.mockResolvedValue({
        content: 'Cached content',
        title: 'Title',
        category: 'educational',
        language: 'en',
        risk_score: 15,
        compliance_notes: [],
        disclaimers: ['Disclaimer'],
        hashtags: []
      });

      mockValidator.validate.mockResolvedValue({
        isCompliant: true,
        riskScore: 15,
        riskLevel: 'low',
        colorCode: 'green',
        stages: [],
        finalContent: 'Cached content',
        totalExecutionTime: 300,
        fallbackUsed: false,
        violations: [],
        suggestions: [],
        auditLog: {
          timestamp: new Date().toISOString(),
          contentHash: 'hash',
          advisorId: 'test-advisor',
          stages: []
        }
      });

      // First call
      await service.generateContent(params);
      
      // Second call with same params (should use cache)
      await service.generateContent(params);
      
      // OpenAI should only be called once due to caching
      expect(mockOpenAIService.generateContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      mockOpenAIService.generateContent.mockRejectedValue(
        new Error('API connection failed')
      );

      const result = await service.generateContent({
        advisorId: 'test-advisor',
        contentType: 'educational',
        language: 'en',
        advisorProfile: {
          name: 'Test Advisor',
          euin: 'E123456',
          specialization: 'Mutual Funds'
        }
      });

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isFallback', true);
      expect(result.content).toBeDefined();
    });

    it('should enforce daily generation limits', async () => {
      // First, use up the daily limit
      for (let i = 0; i < 10; i++) {
        mockOpenAIService.generateContent.mockResolvedValue({
          content: `Test content ${i}`,
          title: `Title ${i}`,
          category: 'educational',
          language: 'en',
          risk_score: 15,
          compliance_notes: [],
          disclaimers: ['Disclaimer'],
          hashtags: []
        });

        mockValidator.validate.mockResolvedValue({
          isCompliant: true,
          riskScore: 15,
          riskLevel: 'low',
          colorCode: 'green',
          stages: [],
          finalContent: `Test content ${i}`,
          totalExecutionTime: 300,
          fallbackUsed: false,
          violations: [],
          suggestions: [],
          auditLog: {
            timestamp: new Date().toISOString(),
            contentHash: `hash${i}`,
            advisorId: 'test-advisor-limit',
            stages: []
          }
        });

        await service.generateContent({
          advisorId: 'test-advisor-limit',
          contentType: 'educational',
          language: 'en',
          advisorProfile: {
            name: `Test Advisor ${i}`,  // Make each request unique to avoid cache
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        });
      }

      // Now the 11th request should fail
      await expect(
        service.generateContent({
          advisorId: 'test-advisor-limit',
          contentType: 'educational',
          language: 'en',
          advisorProfile: {
            name: 'Test Advisor 11',
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        })
      ).rejects.toThrow('Daily content generation limit exceeded');
    });
  });

  describe('Audit and Tracking', () => {
    it('should log all content generation attempts', async () => {
      mockOpenAIService.generateContent.mockResolvedValue({
        content: 'Audited content',
        title: 'Title',
        category: 'educational',
        language: 'en',
        risk_score: 20,
        compliance_notes: [],
        disclaimers: ['Disclaimer'],
        hashtags: []
      });

      mockValidator.validate.mockResolvedValue({
        isCompliant: true,
        riskScore: 20,
        riskLevel: 'low',
        colorCode: 'green',
        stages: [],
        finalContent: 'Audited content',
        totalExecutionTime: 350,
        fallbackUsed: false,
        violations: [],
        suggestions: [],
        auditLog: {
          timestamp: new Date().toISOString(),
          contentHash: 'audit-hash',
          advisorId: 'test-advisor',
          stages: []
        }
      });

      await service.generateContent({
        advisorId: 'test-advisor',
        contentType: 'educational',
        language: 'en',
        advisorProfile: {
          name: 'Test Advisor',
          euin: 'E123456',
          specialization: 'Mutual Funds'
        }
      });

      const auditLog = await service.getAuditLog('test-advisor');
      
      expect(auditLog).toBeDefined();
      expect(auditLog.length).toBeGreaterThan(0);
      expect(auditLog[0]).toHaveProperty('timestamp');
      expect(auditLog[0]).toHaveProperty('contentHash');
      expect(auditLog[0]).toHaveProperty('complianceStatus');
    });

    it('should track performance metrics', async () => {
      mockOpenAIService.generateContent.mockResolvedValue({
        content: 'Performance tracked content',
        title: 'Title',
        category: 'educational',
        language: 'en',
        risk_score: 15,
        compliance_notes: [],
        disclaimers: ['Disclaimer'],
        hashtags: []
      });

      mockValidator.validate.mockResolvedValue({
        isCompliant: true,
        riskScore: 15,
        riskLevel: 'low',
        colorCode: 'green',
        stages: [],
        finalContent: 'Performance tracked content',
        totalExecutionTime: 280,
        fallbackUsed: false,
        violations: [],
        suggestions: [],
        auditLog: {
          timestamp: new Date().toISOString(),
          contentHash: 'perf-hash',
          advisorId: 'test-advisor',
          stages: []
        }
      });

      await service.generateContent({
        advisorId: 'test-advisor',
        contentType: 'educational',
        language: 'en',
        advisorProfile: {
          name: 'Test Advisor',
          euin: 'E123456',
          specialization: 'Mutual Funds'
        }
      });

      const metrics = await service.getPerformanceMetrics('test-advisor');
      
      expect(metrics).toHaveProperty('avgGenerationTime');
      expect(metrics).toHaveProperty('p95GenerationTime');
      expect(metrics).toHaveProperty('totalGenerations');
      expect(metrics.p95GenerationTime).toBeLessThan(3000);
    });
  });
});