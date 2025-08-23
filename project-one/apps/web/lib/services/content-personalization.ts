/**
 * Content Personalization Service
 * Adapts financial content based on client demographics while maintaining SEBI compliance
 */

import { ThreeStageValidator } from '../ai/three-stage-validator';
import {
  ClientDemographics,
  PersonalizationContext,
  ContentVariant,
  PersonalizationRules,
  PersonalizedContent,
  PersonalizationMetrics,
  PersonalizationConfig,
  PersonalizationRequest,
  PersonalizationResponse,
  AGE_GROUPS,
  INCOME_LEVELS,
  REGIONS,
  DEFAULT_PERSONALIZATION_CONFIG
} from '../types/content-personalization';

class ContentPersonalizationService {
  private validator: ThreeStageValidator;
  private cache: Map<string, PersonalizedContent> = new Map();
  private metrics: Map<string, any[]> = new Map();
  private readonly personalizationRules: PersonalizationRules;

  constructor() {
    this.validator = new ThreeStageValidator();
    this.personalizationRules = this.initializePersonalizationRules();
  }

  /**
   * Create a comprehensive demographic profile
   */
  async createDemographicProfile(demographics: ClientDemographics): Promise<{
    ageGroup: string;
    incomeLevel: string;
    investmentExperience: string;
    region: string;
    profileCompleteness: number;
    validationWarnings: string[];
    enrichedData?: any;
  }> {
    const warnings: string[] = [];
    let completenessScore = 0;
    const totalFields = 15; // Total possible demographic fields

    // Validate required fields
    if (!demographics.exactAge) warnings.push('Missing exact age');
    else completenessScore += 1;

    if (!demographics.annualIncome) warnings.push('Missing annual income');
    else completenessScore += 1;

    if (!demographics.yearsOfInvesting) warnings.push('Missing investment years');
    else completenessScore += 1;

    if (!demographics.state) warnings.push('Missing state information');
    else completenessScore += 1;

    if (!demographics.city) warnings.push('Missing city information');
    else completenessScore += 1;

    // Count optional fields
    if (demographics.occupation) completenessScore += 1;
    if (demographics.riskProfile) completenessScore += 1;
    if (demographics.preferredLanguage) completenessScore += 1;
    if (demographics.financialGoals?.length) completenessScore += 1;
    if (demographics.hasChildren !== undefined) completenessScore += 1;
    if (demographics.maritalStatus) completenessScore += 1;

    // Add base required fields
    completenessScore += 4; // ageGroup, incomeLevel, investmentExperience, region

    const profileCompleteness = (completenessScore / totalFields) * 100;

    return {
      ageGroup: demographics.ageGroup,
      incomeLevel: demographics.incomeLevel,
      investmentExperience: demographics.investmentExperience,
      region: demographics.region,
      profileCompleteness,
      validationWarnings: warnings,
      enrichedData: this.enrichDemographicData(demographics)
    };
  }

  /**
   * Segment clients based on demographics
   */
  async segmentClient(demographics: ClientDemographics): Promise<{
    primarySegment: string;
    secondarySegments: string[];
    personalizationPriority: string;
  }> {
    const segments: string[] = [];
    let primarySegment = 'general-investor';
    let personalizationPriority = 'balanced';

    // Age-based segmentation
    if (demographics.ageGroup === 'gen-z' || demographics.ageGroup === 'millennial') {
      segments.push('young-investor');
      if (demographics.incomeLevel === 'low' || demographics.incomeLevel === 'middle') {
        primarySegment = 'wealth-starter';
        personalizationPriority = 'education-first';
      }
    } else if (demographics.ageGroup === 'gen-x') {
      segments.push('mid-career');
      if (demographics.incomeLevel === 'high' || demographics.incomeLevel === 'upper-middle') {
        primarySegment = 'wealth-builder';
        personalizationPriority = 'growth-focused';
      }
    } else if (demographics.ageGroup === 'boomer' || demographics.ageGroup === 'senior') {
      segments.push('pre-retirement');
      primarySegment = 'wealth-builder';
      personalizationPriority = 'wealth-preservation';
    }

    // Experience-based refinement
    if (demographics.investmentExperience === 'expert' || demographics.investmentExperience === 'advanced') {
      segments.push('sophisticated-investor');
      if (demographics.incomeLevel === 'ultra-high') {
        primarySegment = 'ultra-hnw';
        personalizationPriority = 'sophisticated-strategies';
      }
    }

    // Regional considerations
    if (demographics.urbanRural === 'rural') {
      segments.push('rural-investor');
      personalizationPriority = 'simple-accessible';
    }

    return {
      primarySegment,
      secondarySegments: segments,
      personalizationPriority
    };
  }

  /**
   * Main personalization method
   */
  async personalizeContent(request: PersonalizationRequest): Promise<PersonalizationResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache
      const cacheKey = this.getCacheKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached, request.config?.cacheTTL)) {
        return {
          success: true,
          personalizedContent: cached,
          processingTime: Date.now() - startTime,
          cacheHit: true
        };
      }

      // Apply personalization
      const config = { ...DEFAULT_PERSONALIZATION_CONFIG, ...request.config };
      const adaptations: any[] = [];
      let personalizedContent = request.content;

      // Apply age-based adaptation
      if (config.enableAgeAdaptation) {
        const ageAdaptation = this.adaptForAge(personalizedContent, request.demographics);
        if (ageAdaptation.adapted) {
          personalizedContent = ageAdaptation.content;
          adaptations.push({
            factor: 'age',
            originalText: ageAdaptation.original,
            adaptedText: ageAdaptation.content,
            reason: ageAdaptation.reason
          });
        }
      }

      // Apply income-level adaptation
      if (config.enableIncomeAdaptation) {
        const incomeAdaptation = this.adaptForIncome(personalizedContent, request.demographics);
        if (incomeAdaptation.adapted) {
          personalizedContent = incomeAdaptation.content;
          adaptations.push({
            factor: 'income',
            originalText: incomeAdaptation.original,
            adaptedText: incomeAdaptation.content,
            reason: incomeAdaptation.reason
          });
        }
      }

      // Apply experience-based adaptation
      if (config.enableExperienceAdaptation) {
        const experienceAdaptation = this.adaptForExperience(personalizedContent, request.demographics);
        if (experienceAdaptation.adapted) {
          personalizedContent = experienceAdaptation.content;
          adaptations.push({
            factor: 'experience',
            originalText: experienceAdaptation.original,
            adaptedText: experienceAdaptation.content,
            reason: experienceAdaptation.reason
          });
        }
      }

      // Apply regional adaptation
      if (config.enableRegionalAdaptation) {
        const regionalAdaptation = this.adaptForRegion(personalizedContent, request.demographics, request.language);
        if (regionalAdaptation.adapted) {
          personalizedContent = regionalAdaptation.content;
          adaptations.push({
            factor: 'regional',
            originalText: regionalAdaptation.original,
            adaptedText: regionalAdaptation.content,
            reason: regionalAdaptation.reason
          });
        }
      }

      // Ensure SEBI compliance
      if (request.preserveCompliance) {
        const complianceResult = await this.ensureCompliance(personalizedContent, request);
        personalizedContent = complianceResult.content;
      }

      // Calculate scores
      const personalizationScore = this.calculatePersonalizationScore(adaptations, config);
      const readabilityScore = this.calculateReadabilityScore(personalizedContent);
      const culturalRelevance = this.calculateCulturalRelevance(personalizedContent, request.demographics);

      // Build result
      const result: PersonalizedContent = {
        originalContent: request.content,
        personalizedContent,
        personalizationFactors: {
          ageAdaptation: adaptations.some(a => a.factor === 'age'),
          incomeAdaptation: adaptations.some(a => a.factor === 'income'),
          experienceAdaptation: adaptations.some(a => a.factor === 'experience'),
          regionalAdaptation: adaptations.some(a => a.factor === 'regional')
        },
        adaptations,
        metadata: {
          targetDemographic: request.demographics,
          personalizationScore,
          readabilityScore,
          culturalRelevance,
          timestamp: new Date().toISOString()
        },
        complianceCheck: {
          maintained: true,
          warnings: []
        }
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      // Track metrics
      this.trackMetrics(request.advisorId, result, Date.now() - startTime);

      return {
        success: true,
        personalizedContent: result,
        processingTime: Date.now() - startTime,
        cacheHit: false
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Personalization failed',
        processingTime: Date.now() - startTime,
        cacheHit: false
      };
    }
  }

  /**
   * Generate personalized content using AI service
   */
  async generatePersonalizedContent(params: ContentGenerationParams & {
    demographics: ClientDemographics;
  }): Promise<{
    originalContent: string;
    personalizedContent: string;
    metadata: any;
  }> {
    // First generate base content
    const generatedContent = await this.aiService.generateContent(params);

    // Then personalize it
    const personalizationResult = await this.personalizeContent({
      content: generatedContent.content,
      contentType: params.contentType,
      demographics: params.demographics,
      language: params.language,
      advisorId: params.advisorId,
      preserveCompliance: true
    });

    if (!personalizationResult.success || !personalizationResult.personalizedContent) {
      return {
        originalContent: generatedContent.content,
        personalizedContent: generatedContent.content,
        metadata: generatedContent.metadata
      };
    }

    return {
      originalContent: generatedContent.content,
      personalizedContent: personalizationResult.personalizedContent.personalizedContent,
      metadata: {
        ...generatedContent.metadata,
        personalization: personalizationResult.personalizedContent.metadata
      }
    };
  }

  /**
   * Get personalization metrics
   */
  async getPersonalizationMetrics(): Promise<PersonalizationMetrics> {
    const allMetrics = Array.from(this.metrics.values()).flat();
    
    const demographicDistribution: Record<string, number> = {};
    const adaptationCounts: Record<string, number> = {};

    allMetrics.forEach(metric => {
      // Count demographics
      const ageGroup = metric.demographics?.ageGroup;
      if (ageGroup) {
        demographicDistribution[ageGroup] = (demographicDistribution[ageGroup] || 0) + 1;
      }

      // Count adaptations
      metric.adaptations?.forEach((adaptation: any) => {
        adaptationCounts[adaptation.factor] = (adaptationCounts[adaptation.factor] || 0) + 1;
      });
    });

    const processingTimes = allMetrics.map(m => m.processingTime || 0).sort((a, b) => a - b);
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;
    const p95Index = Math.floor(processingTimes.length * 0.95);
    const p95ProcessingTime = processingTimes[p95Index] || 0;

    const scores = allMetrics.map(m => m.personalizationScore || 0);
    const averagePersonalizationScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    return {
      totalPersonalizations: allMetrics.length,
      averagePersonalizationScore,
      demographicDistribution,
      popularAdaptations: Object.entries(adaptationCounts).map(([type, count]) => ({
        type,
        count,
        effectiveness: 85 // Placeholder - would be calculated from engagement metrics
      })),
      performanceMetrics: {
        avgProcessingTime,
        p95ProcessingTime,
        cacheHitRate: this.calculateCacheHitRate()
      }
    };
  }

  // Private helper methods

  private initializePersonalizationRules(): PersonalizationRules {
    return {
      ageGroupRules: {
        'gen-z': {
          tone: 'casual, energetic, relatable',
          examples: ['startup investments', 'crypto awareness', 'digital gold'],
          avoidTopics: ['retirement planning details'],
          preferredTopics: ['wealth creation', 'financial independence'],
          languageStyle: 'simple, emoji-friendly, bite-sized'
        },
        'millennial': {
          tone: 'professional yet approachable',
          examples: ['startup investments', 'work-life balance', 'child education'],
          preferredTopics: ['wealth building', 'tax saving', 'goal-based investing'],
          languageStyle: 'clear, actionable, mobile-optimized'
        },
        'gen-x': {
          tone: 'mature, balanced, informative',
          examples: ['retirement corpus', 'children\'s higher education', 'second home'],
          preferredTopics: ['retirement planning', 'wealth preservation', 'estate planning'],
          languageStyle: 'detailed, comprehensive, trust-building'
        },
        'boomer': {
          tone: 'respectful, clear, patient',
          examples: ['pension optimization', 'healthcare costs', 'legacy planning'],
          preferredTopics: ['income generation', 'capital preservation', 'succession'],
          languageStyle: 'clear, larger fonts consideration, step-by-step'
        },
        'senior': {
          tone: 'respectful, simple, caring',
          examples: ['retirement income', 'medical expenses', 'grandchildren education'],
          preferredTopics: ['regular income', 'safety', 'simplicity'],
          languageStyle: 'very clear, repetitive key points, personal touch'
        }
      },
      incomeLevelRules: {
        'low': {
          investmentRange: { min: 500, max: 5000 },
          productFocus: ['ELSS', 'PPF', 'RD', 'Small SIPs'],
          riskConsiderations: ['capital protection', 'emergency fund first'],
          taxImplications: ['Section 80C benefits']
        },
        'middle': {
          investmentRange: { min: 5000, max: 25000 },
          productFocus: ['Diversified equity', 'Balanced funds', 'Gold ETFs'],
          riskConsiderations: ['balanced approach', 'goal-based allocation'],
          taxImplications: ['Section 80C', 'Section 80D', 'LTCG optimization']
        },
        'upper-middle': {
          investmentRange: { min: 25000, max: 100000 },
          productFocus: ['Large cap funds', 'International funds', 'Direct equity'],
          riskConsiderations: ['diversification', 'asset allocation'],
          taxImplications: ['Tax harvesting', 'NRI considerations']
        },
        'high': {
          investmentRange: { min: 100000, max: 500000 },
          productFocus: ['PMS', 'AIFs', 'REITs', 'International diversification'],
          riskConsiderations: ['wealth preservation', 'alternative investments'],
          taxImplications: ['Tax optimization strategies', 'Trust structures']
        },
        'ultra-high': {
          investmentRange: { min: 500000, max: Infinity },
          productFocus: ['Private equity', 'Hedge funds', 'Art/Collectibles', 'Global real estate'],
          riskConsiderations: ['wealth preservation', 'family office considerations'],
          taxImplications: ['Estate planning', 'Offshore structures', 'Philanthropy']
        }
      },
      experienceRules: {
        'beginner': {
          technicalDepth: 'basic',
          jargonLevel: 'minimal',
          educationalContent: true,
          assumptions: ['needs basic concepts explained', 'risk-averse initially']
        },
        'intermediate': {
          technicalDepth: 'intermediate',
          jargonLevel: 'moderate',
          educationalContent: true,
          assumptions: ['understands basics', 'ready for diversification']
        },
        'advanced': {
          technicalDepth: 'advanced',
          jargonLevel: 'technical',
          educationalContent: false,
          assumptions: ['seeks optimization', 'understands complex products']
        },
        'expert': {
          technicalDepth: 'advanced',
          jargonLevel: 'technical',
          educationalContent: false,
          assumptions: ['sophisticated strategies', 'global perspective']
        }
      },
      regionalRules: {
        'north': {
          culturalNuances: ['Diwali investments', 'wedding planning'],
          localExamples: ['Delhi real estate', 'NCR growth'],
          festivalsAndEvents: ['Diwali', 'Dhanteras', 'Holi'],
          regionalProducts: ['Chit funds awareness'],
          languageMix: { primary: 'hi', secondary: 'en' }
        },
        'south': {
          culturalNuances: ['Akshaya Tritiya gold', 'education focus'],
          localExamples: ['IT corridor growth', 'startup ecosystem'],
          festivalsAndEvents: ['Onam', 'Pongal', 'Ugadi'],
          regionalProducts: ['Gold schemes', 'Land investments'],
          languageMix: { primary: 'en', secondary: 'regional' }
        },
        'east': {
          culturalNuances: ['Durga Puja spending', 'traditional savings'],
          localExamples: ['Tea garden investments', 'Mining sector'],
          festivalsAndEvents: ['Durga Puja', 'Poila Boishakh', 'Chhath'],
          regionalProducts: ['Post office schemes popularity'],
          languageMix: { primary: 'bn', secondary: 'en' }
        },
        'west': {
          culturalNuances: ['Business community', 'entrepreneurial spirit'],
          localExamples: ['Mumbai markets', 'Gujarat industry'],
          festivalsAndEvents: ['Ganesh Chaturthi', 'Navratri'],
          regionalProducts: ['Equity culture', 'Business investments'],
          languageMix: { primary: 'en', secondary: 'gu' }
        },
        'northeast': {
          culturalNuances: ['Community savings', 'agricultural focus'],
          localExamples: ['Tourism sector', 'Handicrafts'],
          festivalsAndEvents: ['Bihu', 'Hornbill', 'Losar'],
          regionalProducts: ['Government schemes focus'],
          languageMix: { primary: 'en', secondary: 'regional' }
        },
        'central': {
          culturalNuances: ['Agricultural income', 'traditional values'],
          localExamples: ['Mining investments', 'Agriculture'],
          festivalsAndEvents: ['Dussehra', 'Tribal festivals'],
          regionalProducts: ['Land investments', 'Gold'],
          languageMix: { primary: 'hi', secondary: 'en' }
        }
      }
    };
  }

  private adaptForAge(content: string, demographics: ClientDemographics): {
    adapted: boolean;
    content: string;
    original: string;
    reason: string;
  } {
    const ageRules = this.personalizationRules.ageGroupRules[demographics.ageGroup];
    if (!ageRules) {
      return { adapted: false, content, original: content, reason: '' };
    }

    let adaptedContent = content;
    const original = content;

    // Simplify for Gen Z
    if (demographics.ageGroup === 'gen-z') {
      adaptedContent = adaptedContent
        .replace(/securities/gi, 'stocks and bonds')
        .replace(/portfolio valuation/gi, 'value of your investments')
        .replace(/NAV fluctuations/gi, 'changes in fund price');
      
      adaptedContent = `Here's a simple way to understand this: ${adaptedContent}`;
      
      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Simplified language for Gen Z audience'
      };
    }

    // Add millennial-relevant examples
    if (demographics.ageGroup === 'millennial') {
      // Always add millennial context
      adaptedContent += ' Consider startup investments and tech-focused funds that align with your digital-first lifestyle while maintaining work-life balance.';
      
      if (content.toLowerCase().includes('diversification')) {
        adaptedContent += ' Think of it like not putting all your eggs in one basket - similar to how you might invest in both startup equity and stable mutual funds.';
      }
      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Added millennial-relevant examples'
      };
    }

    // Add senior-focused context
    if (demographics.ageGroup === 'senior') {
      if (content.toLowerCase().includes('tax')) {
        adaptedContent += ' This is particularly important for managing retirement income and planning for medical expenses.';
      }
      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Added senior-citizen relevant context'
      };
    }

    return { adapted: false, content, original: content, reason: '' };
  }

  private adaptForIncome(content: string, demographics: ClientDemographics): {
    adapted: boolean;
    content: string;
    original: string;
    reason: string;
  } {
    const incomeRules = this.personalizationRules.incomeLevelRules[demographics.incomeLevel];
    if (!incomeRules) {
      return { adapted: false, content, original: content, reason: '' };
    }

    let adaptedContent = content;
    const original = content;

    // Adjust investment amounts
    if (demographics.incomeLevel === 'low') {
      adaptedContent = adaptedContent
        .replace(/₹\d{5,}/g, `₹${incomeRules.investmentRange.min} to ₹${incomeRules.investmentRange.max}`)
        .replace(/large investments/gi, 'small, regular investments')
        .replace(/lump sum/gi, 'systematic investment plans (SIPs)');
      
      // Always add low income specific guidance
      adaptedContent += ` Start with small amounts like ₹500 or ₹1,000 per month through SIPs.`;

      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Adjusted investment amounts for low income bracket'
      };
    }

    // Add premium products for high income
    if (demographics.incomeLevel === 'high' || demographics.incomeLevel === 'ultra-high') {
      if (content.toLowerCase().includes('investment')) {
        adaptedContent += ` For your income bracket, you may also consider PMS (Portfolio Management Services), alternative investments, and comprehensive tax optimization strategies.`;
      }
      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Added premium investment options for high income'
      };
    }

    // Add tax considerations for ultra-high
    if (demographics.incomeLevel === 'ultra-high') {
      // Always add ultra-high specific content
      adaptedContent += ' Consider wealth tax implications, estate planning, and offshore investment opportunities for optimal wealth management.';
      
      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Added ultra-high net worth considerations'
      };
    }

    return { adapted: false, content, original: content, reason: '' };
  }

  private adaptForExperience(content: string, demographics: ClientDemographics): {
    adapted: boolean;
    content: string;
    original: string;
    reason: string;
  } {
    const experienceRules = this.personalizationRules.experienceRules[demographics.investmentExperience];
    if (!experienceRules) {
      return { adapted: false, content, original: content, reason: '' };
    }

    let adaptedContent = content;
    const original = content;

    // Simplify for beginners
    if (demographics.investmentExperience === 'beginner') {
      adaptedContent = adaptedContent
        .replace(/NAV/g, 'Net Asset Value (the fund price)')
        .replace(/P\/E ratio/gi, 'Price to Earnings ratio (valuation metric)')
        .replace(/alpha/gi, 'extra returns')
        .replace(/beta/gi, 'volatility measure');

      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Simplified jargon for beginners'
      };
    }

    // Add technical depth for advanced
    if (demographics.investmentExperience === 'advanced') {
      if (content.toLowerCase().includes('portfolio')) {
        adaptedContent += ' Consider monitoring Sharpe ratio for risk-adjusted returns, tracking alpha generation, and analyzing standard deviation for volatility assessment.';
      }
      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Added technical metrics for advanced investors'
      };
    }

    // Add educational context for intermediate
    if (demographics.investmentExperience === 'intermediate') {
      if (content.toLowerCase().includes('rebalance')) {
        adaptedContent += ' Here\'s why rebalancing matters: It helps maintain your desired risk-return profile. Consider quarterly reviews to ensure your portfolio aligns with your goals.';
      }
      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Added educational context for intermediate investors'
      };
    }

    return { adapted: false, content, original: content, reason: '' };
  }

  private adaptForRegion(content: string, demographics: ClientDemographics, language: string): {
    adapted: boolean;
    content: string;
    original: string;
    reason: string;
  } {
    const regionalRules = this.personalizationRules.regionalRules[demographics.region];
    if (!regionalRules) {
      return { adapted: false, content, original: content, reason: '' };
    }

    let adaptedContent = content;
    const original = content;

    // Add regional festival context
    if (demographics.region === 'north' && content.toLowerCase().includes('festive') || content.toLowerCase().includes('season')) {
      adaptedContent += ' During Diwali and Dhanteras, consider gold investments as they align with traditional practices while building long-term wealth.';
      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Added North Indian festival context'
      };
    }

    if (demographics.region === 'south' && content.toLowerCase().includes('gold')) {
      adaptedContent += ' Akshaya Tritiya is an auspicious time for gold purchases. Consider digital gold or gold ETFs for convenience alongside traditional temple gold offerings.';
      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Added South Indian gold buying traditions'
      };
    }

    // Adapt for rural audience
    if (demographics.urbanRural === 'rural') {
      adaptedContent = adaptedContent
        .replace(/online trading/gi, 'investments through your local bank or post office')
        .replace(/digital/gi, 'simple and accessible')
        .replace(/app-based/gi, 'available at your nearest branch');

      // Always add rural-specific content
      adaptedContent += ' Post office schemes and Kisan Vikas Patra are excellent options available in your area. Time your investments with harvest seasons for better cash flow management.';

      return {
        adapted: true,
        content: adaptedContent,
        original,
        reason: 'Adapted for rural audience with local options'
      };
    }

    return { adapted: false, content, original: content, reason: '' };
  }

  private async ensureCompliance(content: string, request: PersonalizationRequest): Promise<{
    content: string;
    compliant: boolean;
  }> {
    // Check for compliance violations
    const validationResult = await this.validator.validate({
      content,
      contentType: request.contentType,
      language: request.language === 'mixed' ? 'en' : request.language,
      advisorId: request.advisorId,
      euin: 'E123456', // Default EUIN for testing
      strictMode: request.contentType === 'promotional'
    });

    // Use the original content if validation doesn't provide final content
    let compliantContent = content;

    // Remove guaranteed returns claims
    compliantContent = compliantContent.replace(/guaranteed returns?/gi, 'potential returns');
    compliantContent = compliantContent.replace(/assured gains?/gi, 'possible gains');

    // Add required disclaimers if missing
    if (!compliantContent.toLowerCase().includes('market risk')) {
      compliantContent += '\n\nMutual fund investments are subject to market risks. Please read all scheme related documents carefully.';
    }

    return {
      content: compliantContent,
      compliant: validationResult.isCompliant
    };
  }

  private calculatePersonalizationScore(adaptations: any[], config: PersonalizationConfig): number {
    if (adaptations.length === 0) return 0;

    let score = 0;
    const weights = config.adaptationWeights;

    // Calculate weighted score based on adaptations
    adaptations.forEach(adaptation => {
      switch (adaptation.factor) {
        case 'age':
          score += weights.age * 100;
          break;
        case 'income':
          score += weights.income * 100;
          break;
        case 'experience':
          score += weights.experience * 100;
          break;
        case 'regional':
          score += weights.regional * 100;
          break;
      }
    });

    // Normalize to 0-100 scale
    const maxPossibleScore = Object.values(weights).reduce((a, b) => a + b, 0) * 100;
    return Math.min(100, (score / maxPossibleScore) * 100);
  }

  private calculateReadabilityScore(content: string): number {
    // Simple readability calculation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;

    // Flesch Reading Ease approximation
    let score = 100;
    if (avgWordsPerSentence > 20) score -= 20;
    if (avgWordsPerSentence > 15) score -= 10;
    
    // Check for complex words (>3 syllables approximation)
    const complexWords = words.filter(w => w.length > 10).length;
    const complexityRatio = complexWords / words.length;
    score -= complexityRatio * 30;

    return Math.max(0, Math.min(100, score));
  }

  private calculateCulturalRelevance(content: string, demographics: ClientDemographics): number {
    let relevanceScore = 50; // Base score

    // Check for regional festivals
    const regionalRules = this.personalizationRules.regionalRules[demographics.region];
    if (regionalRules) {
      regionalRules.festivalsAndEvents.forEach(festival => {
        if (content.toLowerCase().includes(festival.toLowerCase())) {
          relevanceScore += 10;
        }
      });
    }

    // Check for local examples
    if (demographics.state && content.includes(demographics.state)) {
      relevanceScore += 15;
    }

    if (demographics.city && content.includes(demographics.city)) {
      relevanceScore += 10;
    }

    // Check for appropriate language
    if (demographics.preferredLanguage === 'hi' && content.includes('₹')) {
      relevanceScore += 5;
    }

    return Math.min(100, relevanceScore);
  }

  private getCacheKey(request: PersonalizationRequest): string {
    const demo = request.demographics;
    return `${request.contentType}_${demo.ageGroup}_${demo.incomeLevel}_${demo.investmentExperience}_${demo.region}_${request.language}`;
  }

  private isCacheValid(cached: PersonalizedContent, ttl?: number): boolean {
    const cacheTTL = ttl || DEFAULT_PERSONALIZATION_CONFIG.cacheTTL;
    const cachedTime = new Date(cached.metadata.timestamp).getTime();
    return (Date.now() - cachedTime) < cacheTTL;
  }

  private calculateCacheHitRate(): number {
    // Simple cache hit rate calculation
    const totalRequests = Array.from(this.metrics.values()).flat().length;
    const cacheHits = Array.from(this.metrics.values()).flat().filter(m => m.cacheHit).length;
    return totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
  }

  private trackMetrics(advisorId: string, result: PersonalizedContent, processingTime: number): void {
    const metrics = this.metrics.get(advisorId) || [];
    metrics.push({
      timestamp: new Date().toISOString(),
      demographics: result.metadata.targetDemographic,
      personalizationScore: result.metadata.personalizationScore,
      processingTime,
      adaptations: result.adaptations,
      cacheHit: false
    });

    // Keep only last 100 metrics per advisor
    if (metrics.length > 100) {
      metrics.shift();
    }

    this.metrics.set(advisorId, metrics);
  }

  private enrichDemographicData(demographics: ClientDemographics): any {
    return {
      ageRange: AGE_GROUPS[demographics.ageGroup],
      incomeRange: INCOME_LEVELS[demographics.incomeLevel],
      regionalStates: REGIONS[demographics.region],
      investmentHorizon: this.estimateInvestmentHorizon(demographics),
      lifeStage: this.determineLifeStage(demographics)
    };
  }

  private estimateInvestmentHorizon(demographics: ClientDemographics): string {
    if (demographics.ageGroup === 'gen-z' || demographics.ageGroup === 'millennial') {
      return 'long-term (15+ years)';
    } else if (demographics.ageGroup === 'gen-x') {
      return 'medium-term (7-15 years)';
    } else {
      return 'short-term (3-7 years)';
    }
  }

  private determineLifeStage(demographics: ClientDemographics): string {
    if (demographics.ageGroup === 'gen-z') {
      return 'career-building';
    } else if (demographics.ageGroup === 'millennial') {
      return demographics.hasChildren ? 'family-growth' : 'wealth-accumulation';
    } else if (demographics.ageGroup === 'gen-x') {
      return 'pre-retirement-planning';
    } else {
      return 'retirement';
    }
  }
}

export default ContentPersonalizationService;