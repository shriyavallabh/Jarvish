/**
 * Content Personalization Service Tests
 * Following TDD methodology - Tests written before implementation
 */

import { ContentPersonalizationService } from '../../../lib/services/content-personalization';
import { AIContentGenerationService } from '../../../lib/services/ai-content-generation';
import { ThreeStageValidator } from '../../../lib/ai/three-stage-validator';
import {
  ClientDemographics,
  PersonalizationRequest,
  PersonalizedContent,
  PersonalizationConfig,
  DEFAULT_PERSONALIZATION_CONFIG
} from '../../../lib/types/content-personalization';

// Mock dependencies
jest.mock('../../../lib/services/ai-content-generation');
jest.mock('../../../lib/ai/three-stage-validator');

describe('ContentPersonalizationService', () => {
  let service: ContentPersonalizationService;
  let mockAIService: jest.Mocked<AIContentGenerationService>;
  let mockValidator: jest.Mocked<ThreeStageValidator>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the validator validate method globally
    const mockValidate = jest.fn().mockResolvedValue({
      isCompliant: true,
      riskScore: 20,
      riskLevel: 'low',
      colorCode: 'green',
      stages: [],
      finalContent: 'Compliant content. Mutual fund investments are subject to market risks.',
      totalExecutionTime: 100,
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
    
    (ThreeStageValidator as jest.MockedClass<typeof ThreeStageValidator>).mockImplementation(() => ({
      validate: mockValidate
    } as any));
    
    service = new ContentPersonalizationService();
    mockAIService = (service as any).aiService;
    mockValidator = (service as any).validator;
  });

  describe('ST-E02-002-01: Client Demographic Profiling', () => {
    it('should create comprehensive client demographic profile', async () => {
      const demographics: ClientDemographics = {
        ageGroup: 'millennial',
        exactAge: 32,
        incomeLevel: 'upper-middle',
        annualIncome: 2500000,
        investmentExperience: 'intermediate',
        yearsOfInvesting: 5,
        region: 'west',
        state: 'Maharashtra',
        city: 'Mumbai',
        urbanRural: 'urban',
        occupation: 'IT Professional',
        riskProfile: 'moderate',
        preferredLanguage: 'en',
        financialGoals: ['retirement', 'child education'],
        hasChildren: true,
        maritalStatus: 'married'
      };

      const profile = await service.createDemographicProfile(demographics);

      expect(profile).toBeDefined();
      expect(profile.ageGroup).toBe('millennial');
      expect(profile.incomeLevel).toBe('upper-middle');
      expect(profile.investmentExperience).toBe('intermediate');
      expect(profile.region).toBe('west');
      expect(profile.profileCompleteness).toBeGreaterThan(80);
    });

    it('should validate demographic data and handle missing fields', async () => {
      const partialDemographics: ClientDemographics = {
        ageGroup: 'gen-x',
        incomeLevel: 'middle',
        investmentExperience: 'beginner',
        region: 'north',
        urbanRural: 'semi-urban'
      };

      const profile = await service.createDemographicProfile(partialDemographics);

      expect(profile).toBeDefined();
      expect(profile.validationWarnings).toContain('Missing exact age');
      expect(profile.validationWarnings).toContain('Missing annual income');
      expect(profile.profileCompleteness).toBeLessThan(60);
    });

    it('should categorize clients into appropriate segments', async () => {
      const demographics: ClientDemographics = {
        ageGroup: 'boomer',
        incomeLevel: 'high',
        investmentExperience: 'advanced',
        region: 'south',
        urbanRural: 'urban'
      };

      const segmentation = await service.segmentClient(demographics);

      expect(segmentation.primarySegment).toBe('wealth-builder');
      expect(segmentation.secondarySegments).toContain('pre-retirement');
      expect(segmentation.personalizationPriority).toBe('wealth-preservation');
    });
  });

  describe('ST-E02-002-02: Age-based Content Variants', () => {
    it('should adapt content tone for Gen Z audience', async () => {
      const request: PersonalizationRequest = {
        content: 'Mutual funds are investment vehicles that pool money from multiple investors to purchase securities.',
        contentType: 'educational',
        demographics: {
          ageGroup: 'gen-z',
          exactAge: 23,
          incomeLevel: 'low',
          investmentExperience: 'beginner',
          region: 'north',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.success).toBe(true);
      expect(result.personalizedContent?.personalizedContent).toContain('simple way');
      expect(result.personalizedContent?.personalizedContent).not.toContain('securities');
      expect(result.personalizedContent?.metadata.readabilityScore).toBeGreaterThan(70);
    });

    it('should use appropriate examples for millennials', async () => {
      const request: PersonalizationRequest = {
        content: 'Diversification helps reduce portfolio risk.',
        contentType: 'investment_tips',
        demographics: {
          ageGroup: 'millennial',
          exactAge: 35,
          incomeLevel: 'middle',
          investmentExperience: 'intermediate',
          region: 'west',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('startup investments');
      expect(result.personalizedContent?.personalizedContent).toContain('work-life balance');
      expect(result.personalizedContent?.adaptations).toContainEqual(
        expect.objectContaining({
          factor: 'age',
          reason: 'Added millennial-relevant examples'
        })
      );
    });

    it('should adjust complexity for senior citizens', async () => {
      const request: PersonalizationRequest = {
        content: 'Consider tax-efficient investment strategies for optimal returns.',
        contentType: 'tax_planning',
        demographics: {
          ageGroup: 'senior',
          exactAge: 72,
          incomeLevel: 'upper-middle',
          investmentExperience: 'intermediate',
          region: 'south',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('retirement income');
      expect(result.personalizedContent?.personalizedContent).toContain('medical expenses');
      expect(result.personalizedContent?.metadata.targetDemographic.ageGroup).toBe('senior');
    });
  });

  describe('ST-E02-002-03: Income-level Adaptation', () => {
    it('should recommend appropriate investment amounts for low income', async () => {
      const request: PersonalizationRequest = {
        content: 'Start investing with systematic investment plans.',
        contentType: 'investment_tips',
        demographics: {
          ageGroup: 'millennial',
          incomeLevel: 'low',
          annualIncome: 400000,
          investmentExperience: 'beginner',
          region: 'east',
          urbanRural: 'semi-urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('₹500');
      expect(result.personalizedContent?.personalizedContent).toContain('₹1,000');
      expect(result.personalizedContent?.personalizedContent).not.toContain('₹50,000');
      expect(result.personalizedContent?.adaptations).toContainEqual(
        expect.objectContaining({
          factor: 'income',
          reason: 'Adjusted investment amounts for low income bracket'
        })
      );
    });

    it('should suggest premium products for high income clients', async () => {
      const request: PersonalizationRequest = {
        content: 'Explore investment opportunities for wealth creation.',
        contentType: 'promotional',
        demographics: {
          ageGroup: 'gen-x',
          incomeLevel: 'high',
          annualIncome: 8000000,
          investmentExperience: 'advanced',
          region: 'west',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('PMS');
      expect(result.personalizedContent?.personalizedContent).toContain('alternative investments');
      expect(result.personalizedContent?.personalizedContent).toContain('tax optimization');
    });

    it('should include tax considerations for ultra-high income', async () => {
      const request: PersonalizationRequest = {
        content: 'Plan your investments strategically.',
        contentType: 'tax_planning',
        demographics: {
          ageGroup: 'boomer',
          incomeLevel: 'ultra-high',
          annualIncome: 50000000,
          investmentExperience: 'expert',
          region: 'south',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('wealth tax');
      expect(result.personalizedContent?.personalizedContent).toContain('estate planning');
      expect(result.personalizedContent?.personalizedContent).toContain('offshore');
    });
  });

  describe('ST-E02-002-04: Experience-based Customization', () => {
    it('should simplify jargon for beginners', async () => {
      const request: PersonalizationRequest = {
        content: 'NAV fluctuations impact your portfolio valuation.',
        contentType: 'educational',
        demographics: {
          ageGroup: 'gen-z',
          incomeLevel: 'low',
          investmentExperience: 'beginner',
          yearsOfInvesting: 0,
          region: 'north',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).not.toContain('NAV');
      expect(result.personalizedContent?.personalizedContent).toContain('fund price');
      expect(result.personalizedContent?.personalizedContent).toContain('value of your investment');
    });

    it('should provide technical depth for advanced investors', async () => {
      const request: PersonalizationRequest = {
        content: 'Consider portfolio optimization strategies.',
        contentType: 'investment_tips',
        demographics: {
          ageGroup: 'gen-x',
          incomeLevel: 'high',
          investmentExperience: 'advanced',
          yearsOfInvesting: 15,
          region: 'west',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('Sharpe ratio');
      expect(result.personalizedContent?.personalizedContent).toContain('alpha');
      expect(result.personalizedContent?.personalizedContent).toContain('standard deviation');
    });

    it('should add educational context for intermediate investors', async () => {
      const request: PersonalizationRequest = {
        content: 'Rebalance your portfolio periodically.',
        contentType: 'investment_tips',
        demographics: {
          ageGroup: 'millennial',
          incomeLevel: 'middle',
          investmentExperience: 'intermediate',
          yearsOfInvesting: 3,
          region: 'south',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('why rebalancing matters');
      expect(result.personalizedContent?.personalizedContent).toContain('quarterly review');
      expect(result.personalizedContent?.personalizedContent).toContain('risk-return');
    });
  });

  describe('ST-E02-002-05: Regional Context Engine', () => {
    it('should include regional festivals for North India', async () => {
      const request: PersonalizationRequest = {
        content: 'Plan your investments for the festive season.',
        contentType: 'seasonal',
        demographics: {
          ageGroup: 'gen-x',
          incomeLevel: 'middle',
          investmentExperience: 'intermediate',
          region: 'north',
          state: 'Delhi',
          urbanRural: 'urban'
        },
        language: 'hi',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('Diwali');
      expect(result.personalizedContent?.personalizedContent).toContain('Dhanteras');
      expect(result.personalizedContent?.adaptations).toContainEqual(
        expect.objectContaining({
          factor: 'regional',
          reason: 'Added North Indian festival context'
        })
      );
    });

    it('should use appropriate regional examples for South India', async () => {
      const request: PersonalizationRequest = {
        content: 'Invest in gold for long-term wealth.',
        contentType: 'investment_tips',
        demographics: {
          ageGroup: 'boomer',
          incomeLevel: 'upper-middle',
          investmentExperience: 'intermediate',
          region: 'south',
          state: 'Tamil Nadu',
          city: 'Chennai',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('Akshaya Tritiya');
      expect(result.personalizedContent?.personalizedContent).toContain('temple gold');
    });

    it('should adapt for rural audience', async () => {
      const request: PersonalizationRequest = {
        content: 'Build wealth through systematic savings.',
        contentType: 'educational',
        demographics: {
          ageGroup: 'gen-x',
          incomeLevel: 'low',
          investmentExperience: 'beginner',
          region: 'east',
          state: 'Bihar',
          urbanRural: 'rural'
        },
        language: 'hi',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('post office');
      expect(result.personalizedContent?.personalizedContent).toContain('kisan');
      expect(result.personalizedContent?.personalizedContent).toContain('harvest');
    });
  });

  describe('SEBI Compliance Maintenance', () => {
    it('should maintain compliance after personalization', async () => {
      const request: PersonalizationRequest = {
        content: 'Invest in mutual funds for guaranteed returns.',
        contentType: 'promotional',
        demographics: {
          ageGroup: 'millennial',
          incomeLevel: 'middle',
          investmentExperience: 'beginner',
          region: 'west',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      mockValidator.validate.mockResolvedValue({
        isCompliant: false,
        riskScore: 85,
        riskLevel: 'high',
        colorCode: 'red',
        stages: [],
        finalContent: 'Invest in mutual funds. Mutual fund investments are subject to market risks.',
        totalExecutionTime: 500,
        fallbackUsed: false,
        violations: ['Guaranteed returns claim'],
        suggestions: ['Remove guaranteed returns'],
        auditLog: {
          timestamp: new Date().toISOString(),
          contentHash: 'test-hash',
          advisorId: 'test-advisor',
          stages: []
        }
      });

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).not.toContain('guaranteed');
      expect(result.personalizedContent?.personalizedContent).toContain('market risks');
      expect(result.personalizedContent?.complianceCheck.maintained).toBe(true);
    });

    it('should add required disclaimers post-personalization', async () => {
      const request: PersonalizationRequest = {
        content: 'Start your investment journey today.',
        contentType: 'promotional',
        demographics: {
          ageGroup: 'gen-z',
          incomeLevel: 'low',
          investmentExperience: 'beginner',
          region: 'north',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.personalizedContent).toContain('subject to market risks');
      expect(result.personalizedContent?.personalizedContent).toContain('read all scheme related documents');
    });
  });

  describe('Performance and Caching', () => {
    it('should personalize content within 500ms', async () => {
      const request: PersonalizationRequest = {
        content: 'Test content for performance.',
        contentType: 'educational',
        demographics: {
          ageGroup: 'millennial',
          incomeLevel: 'middle',
          investmentExperience: 'intermediate',
          region: 'west',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const startTime = Date.now();
      const result = await service.personalizeContent(request);
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(500);
      expect(result.processingTime).toBeLessThan(500);
    });

    it('should cache personalized content for same demographics', async () => {
      const request: PersonalizationRequest = {
        content: 'Cache test content.',
        contentType: 'educational',
        demographics: {
          ageGroup: 'gen-x',
          incomeLevel: 'high',
          investmentExperience: 'advanced',
          region: 'south',
          urbanRural: 'urban'
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      // First call
      const result1 = await service.personalizeContent(request);
      expect(result1.cacheHit).toBe(false);

      // Second call with same parameters
      const result2 = await service.personalizeContent(request);
      expect(result2.cacheHit).toBe(true);
      expect(result2.processingTime).toBeLessThan(result1.processingTime);
    });
  });

  describe('Integration with AI Content Generation', () => {
    it('should enhance AI-generated content with personalization', async () => {
      mockAIService.generateContent.mockResolvedValue({
        content: 'Generic investment advice content.',
        title: 'Investment Tips',
        contentType: 'investment_tips',
        language: 'en',
        isCompliant: true,
        complianceScore: 90,
        riskScore: 10,
        metadata: {
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          version: '1.0.0'
        }
      });

      const demographics: ClientDemographics = {
        ageGroup: 'millennial',
        incomeLevel: 'upper-middle',
        investmentExperience: 'intermediate',
        region: 'west',
        urbanRural: 'urban'
      };

      const result = await service.generatePersonalizedContent({
        advisorId: 'test-advisor',
        contentType: 'investment_tips',
        language: 'en',
        demographics,
        advisorProfile: {
          name: 'Test Advisor',
          euin: 'E123456',
          specialization: 'Mutual Funds'
        }
      });

      expect(result).toBeDefined();
      expect(result.originalContent).toBeDefined();
      expect(result.personalizedContent).toBeDefined();
      expect(result.personalizedContent).not.toBe(result.originalContent);
    });
  });

  describe('Metrics and Analytics', () => {
    it('should track personalization metrics', async () => {
      // Generate some personalizations
      for (let i = 0; i < 5; i++) {
        await service.personalizeContent({
          content: `Test content ${i}`,
          contentType: 'educational',
          demographics: {
            ageGroup: i % 2 === 0 ? 'millennial' : 'gen-x',
            incomeLevel: 'middle',
            investmentExperience: 'intermediate',
            region: 'west',
            urbanRural: 'urban'
          },
          language: 'en',
          advisorId: `advisor-${i}`,
          preserveCompliance: true
        });
      }

      const metrics = await service.getPersonalizationMetrics();

      expect(metrics.totalPersonalizations).toBe(5);
      expect(metrics.averagePersonalizationScore).toBeGreaterThan(0);
      expect(metrics.demographicDistribution).toBeDefined();
      expect(metrics.popularAdaptations).toBeDefined();
      expect(metrics.performanceMetrics.avgProcessingTime).toBeLessThan(500);
    });
  });

  describe('Configuration and Customization', () => {
    it('should respect custom personalization config', async () => {
      const customConfig: Partial<PersonalizationConfig> = {
        enableAgeAdaptation: true,
        enableIncomeAdaptation: false,
        enableExperienceAdaptation: true,
        enableRegionalAdaptation: false,
        minPersonalizationScore: 70
      };

      const request: PersonalizationRequest = {
        content: 'Test content with custom config.',
        contentType: 'educational',
        demographics: {
          ageGroup: 'millennial',
          incomeLevel: 'high',
          investmentExperience: 'intermediate',
          region: 'north',
          urbanRural: 'urban'
        },
        config: customConfig,
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      // Check that income and regional adaptations were skipped
      const incomeAdaptations = result.personalizedContent?.adaptations.filter(
        a => a.factor === 'income'
      );
      const regionalAdaptations = result.personalizedContent?.adaptations.filter(
        a => a.factor === 'regional'
      );

      expect(incomeAdaptations?.length).toBe(0);
      expect(regionalAdaptations?.length).toBe(0);
    });

    it('should calculate personalization score based on weights', async () => {
      const request: PersonalizationRequest = {
        content: 'Calculate personalization score.',
        contentType: 'educational',
        demographics: {
          ageGroup: 'gen-x',
          incomeLevel: 'upper-middle',
          investmentExperience: 'advanced',
          region: 'south',
          urbanRural: 'urban'
        },
        config: {
          adaptationWeights: {
            age: 0.30,
            income: 0.20,
            experience: 0.35,
            regional: 0.15
          }
        },
        language: 'en',
        advisorId: 'test-advisor',
        preserveCompliance: true
      };

      const result = await service.personalizeContent(request);

      expect(result.personalizedContent?.metadata.personalizationScore).toBeDefined();
      expect(result.personalizedContent?.metadata.personalizationScore).toBeGreaterThan(60);
      expect(result.personalizedContent?.metadata.personalizationScore).toBeLessThanOrEqual(100);
    });
  });
});