import { OpenAIService } from '../ai/openai-service';
import { ThreeStageValidator } from '../ai/three-stage-validator';
import ContentPersonalizationService from './content-personalization';
import { ClientDemographics } from '../types/content-personalization';
import { MarketDataService } from './market-data';
import { MarketInsight } from '../types/market-data';
import { z } from 'zod';

// Types
export interface AdvisorProfile {
  name: string;
  euin: string;
  specialization: string;
  experience?: number;
  clientBase?: string;
  preferredTone?: 'professional' | 'friendly' | 'educational';
  tier?: 'basic' | 'standard' | 'pro';
}

export interface ContentGenerationParams {
  advisorId: string;
  contentType: 'educational' | 'market_updates' | 'seasonal' | 'promotional' | 'investment_tips';
  language: 'en' | 'hi' | 'mixed';
  advisorProfile: AdvisorProfile;
  seasonalContext?: string;
  promotionDetails?: {
    type: string;
    fundName?: string;
  };
  platform?: 'whatsapp' | 'web' | 'email';
  clientDemographics?: ClientDemographics; // Added for personalization
  enablePersonalization?: boolean; // Flag to enable/disable personalization
  includeMarketData?: boolean; // Include real-time market data
  marketDataOptions?: {
    includeIndices?: boolean;
    includeMutualFunds?: boolean;
    includeSectors?: boolean;
    includeTopPerformers?: boolean;
  };
}

export interface GeneratedContent {
  content: string;
  title: string;
  contentType: string;
  language: string;
  isCompliant: boolean;
  complianceScore: number;
  riskScore: number;
  isFallback?: boolean;
  metadata?: {
    generatedAt: string;
    expiresAt: string;
    version: string;
  };
  complianceStatus?: {
    stage1: boolean;
    stage2: boolean;
    stage3: boolean;
    finalScore: number;
  };
  auditLog?: {
    timestamp: string;
    contentHash: string;
    advisorId: string;
    complianceChecks: any[];
  };
  performanceMetrics?: {
    generationTime: number;
    complianceCheckTime: number;
    totalTime: number;
  };
  advancedFeatures?: {
    customBranding: boolean;
  };
  formattedForWhatsApp?: boolean;
  seasonalTags?: string[];
  promotionalCompliance?: boolean;
  euinIncluded?: boolean;
  marketData?: {
    included: boolean;
    insights?: MarketInsight;
    dataPoints?: string[];
    lastUpdated?: string;
  };
}

export interface ContentPreview extends GeneratedContent {
  isPreview: boolean;
  complianceStatus: {
    passed: boolean;
    violations: string[];
    suggestions: string[];
  };
}

export interface ContentTemplate {
  structure: string[];
  requiredElements: string[];
  characterLimit: number;
  complianceNotes: string[];
}

export interface PromptHierarchy {
  master: string;
  contentTypes: Record<string, string>;
  languages: Record<string, string>;
}

export class AIContentGenerationService {
  private openAIService: OpenAIService;
  private validator: ThreeStageValidator;
  private personalizationService: ContentPersonalizationService;
  private marketDataService: MarketDataService;
  private dailyUsage: Map<string, { count: number; date: string }> = new Map();
  private contentCache: Map<string, GeneratedContent> = new Map();
  private auditLogs: Map<string, any[]> = new Map();
  private performanceMetrics: Map<string, any[]> = new Map();
  private readonly DAILY_LIMIT = 10;
  private readonly CACHE_TTL = 3600000; // 1 hour in ms

  constructor(personalizationService?: ContentPersonalizationService) {
    this.openAIService = new OpenAIService();
    this.validator = new ThreeStageValidator();
    // Initialize personalization service if not provided
    if (personalizationService) {
      this.personalizationService = personalizationService;
    } else {
      // Lazy initialization to avoid circular dependency
      this.personalizationService = new ContentPersonalizationService();
    }
    this.marketDataService = new MarketDataService({
      cache: {
        indices: 60,
        mutualFunds: 300,
        sectors: 120,
        currencies: 30,
        commodities: 60,
        default: 60
      },
      fallbackEnabled: true,
      mockDataEnabled: process.env.NODE_ENV === 'development'
    });
  }

  async generateContent(params: ContentGenerationParams): Promise<GeneratedContent> {
    const startTime = Date.now();
    
    try {
      // Check daily limit
      this.checkDailyLimit(params.advisorId);
      
      // Check cache
      const cacheKey = this.getCacheKey(params);
      const cached = this.contentCache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }

      // Build context for AI (now async due to market data)
      const context = await this.buildContext(params);
      
      // Generate content using OpenAI
      const aiStartTime = Date.now();
      const generatedContent = await this.openAIService.generateContent({
        advisorId: params.advisorId,
        category: this.mapContentType(params.contentType),
        language: params.language === 'mixed' ? 'en' : params.language,
        tone: params.advisorProfile.preferredTone,
        context,
        advisorName: params.advisorProfile.name,
        euin: params.advisorProfile.euin
      });
      const aiEndTime = Date.now();

      // Run three-stage compliance validation
      const complianceStartTime = Date.now();
      const validationResult = await this.validator.validate({
        content: generatedContent.content,
        contentType: params.contentType,
        language: params.language === 'mixed' ? 'en' : params.language,
        advisorId: params.advisorId,
        euin: params.advisorProfile.euin,
        strictMode: params.contentType === 'promotional'
      });
      const complianceEndTime = Date.now();

      // Format content based on platform
      let finalContent = validationResult.finalContent || generatedContent.content;
      if (params.platform === 'whatsapp') {
        finalContent = this.formatForWhatsApp(finalContent);
      }

      // Apply personalization if enabled and demographics provided
      if (params.enablePersonalization && params.clientDemographics) {
        const personalizationResult = await this.personalizationService.personalizeContent({
          content: finalContent,
          contentType: params.contentType,
          demographics: params.clientDemographics,
          language: params.language,
          advisorId: params.advisorId,
          preserveCompliance: true
        });

        if (personalizationResult.success && personalizationResult.personalizedContent) {
          finalContent = personalizationResult.personalizedContent.personalizedContent;
        }
      }

      // Include market data if requested
      let marketInsights = undefined;
      let marketDataPoints: string[] = [];
      
      if (params.includeMarketData) {
        // Generate market insights
        marketInsights = await this.marketDataService.generateMarketInsights();
        
        // Add specific market data based on options
        if (params.marketDataOptions?.includeIndices) {
          const indices = await this.marketDataService.getIndices(['SENSEX', 'NIFTY', 'BANKNIFTY']);
          if (indices.success && indices.data) {
            indices.data.forEach(index => {
              marketDataPoints.push(`${index.name}: ${index.value.toFixed(2)} (${index.changePercent > 0 ? '+' : ''}${index.changePercent.toFixed(2)}%)`);
            });
          }
        }
        
        if (params.marketDataOptions?.includeTopPerformers) {
          const topSectors = await this.marketDataService.getTopSectors(3);
          if (topSectors.success && topSectors.data) {
            topSectors.data.forEach(sector => {
              marketDataPoints.push(`${sector.name} sector: ${sector.changePercent > 0 ? '+' : ''}${sector.changePercent.toFixed(2)}%`);
            });
          }
        }
        
        // Enrich content with market context if it's a market update
        if (params.contentType === 'market_updates' && marketInsights) {
          finalContent = this.enrichContentWithMarketData(finalContent, marketInsights, marketDataPoints);
        }
      }

      // Include EUIN if required
      if (params.advisorProfile.tier === 'pro' || params.contentType === 'investment_tips') {
        if (!finalContent.includes(params.advisorProfile.euin)) {
          finalContent += `\n\nEUIN: ${params.advisorProfile.euin}`;
        }
      }

      // Build result
      const result: GeneratedContent = {
        content: finalContent,
        title: generatedContent.title,
        contentType: params.contentType,
        language: params.language,
        isCompliant: validationResult.isCompliant,
        complianceScore: 100 - validationResult.riskScore,
        riskScore: validationResult.riskScore,
        metadata: {
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + this.CACHE_TTL).toISOString(),
          version: '1.0.0'
        },
        complianceStatus: {
          stage1: validationResult.stages[0]?.passed || false,
          stage2: validationResult.stages[1]?.passed || false,
          stage3: validationResult.stages[2]?.passed || false,
          finalScore: 100 - validationResult.riskScore
        },
        auditLog: {
          timestamp: validationResult.auditLog.timestamp,
          contentHash: validationResult.auditLog.contentHash,
          advisorId: params.advisorId,
          complianceChecks: validationResult.stages
        },
        performanceMetrics: {
          generationTime: aiEndTime - aiStartTime,
          complianceCheckTime: complianceEndTime - complianceStartTime,
          totalTime: Date.now() - startTime
        }
      };

      // Add market data to result if included
      if (params.includeMarketData) {
        result.marketData = {
          included: true,
          insights: marketInsights,
          dataPoints: marketDataPoints,
          lastUpdated: new Date().toISOString()
        };
      }

      // Add advanced features for Pro tier
      if (params.advisorProfile.tier === 'pro') {
        result.advancedFeatures = {
          customBranding: true
        };
      }

      // Add platform-specific flags
      if (params.platform === 'whatsapp') {
        result.formattedForWhatsApp = true;
      }

      // Add seasonal tags
      if (params.contentType === 'seasonal' && params.seasonalContext) {
        result.seasonalTags = this.getSeasonalTags(params.seasonalContext);
      }

      // Add promotional compliance flag
      if (params.contentType === 'promotional') {
        result.promotionalCompliance = validationResult.isCompliant && validationResult.riskScore < 50;
      }

      // Check if EUIN is included
      result.euinIncluded = finalContent.includes(params.advisorProfile.euin);

      // Update usage and caches
      this.updateDailyUsage(params.advisorId);
      this.contentCache.set(cacheKey, result);
      this.logAudit(params.advisorId, result);
      this.trackPerformance(params.advisorId, result.performanceMetrics);

      return result;
    } catch (error) {
      console.error('Content generation error:', error);
      
      // Return fallback content
      return this.generateFallbackContent(params);
    }
  }

  async generatePreview(params: ContentGenerationParams): Promise<ContentPreview> {
    const content = await this.generateContent(params);
    
    return {
      ...content,
      isPreview: true,
      complianceStatus: {
        passed: content.isCompliant,
        violations: this.extractViolations(content),
        suggestions: this.extractSuggestions(content)
      }
    };
  }

  async getPromptHierarchy(): Promise<PromptHierarchy> {
    return {
      master: `You are a SEBI-compliant financial content generator for Indian financial advisors.
      Core compliance rules:
      - Never promise guaranteed returns
      - Always include risk disclaimers
      - Use educational framing
      - Include EUIN where required
      - Follow SEBI advertising code`,
      
      contentTypes: {
        educational: 'Focus on financial literacy and investor education. Explain concepts clearly.',
        market_updates: 'Provide factual market information without speculation. Include data sources.',
        seasonal: 'Create timely content for festivals and occasions with financial planning angle.',
        promotional: 'Promote services compliantly. No exaggerated claims. Include all disclaimers.',
        investment_tips: 'Share actionable insights with proper risk warnings. No direct recommendations.'
      },
      
      languages: {
        hi: 'Use simple Hindi with common English financial terms. Maintain formal tone.',
        en: 'Use professional English. Keep language accessible to retail investors.',
        mixed: 'Mix Hindi and English naturally. Use English for technical terms.'
      }
    };
  }

  async getContentTemplates(): Promise<Record<string, ContentTemplate>> {
    return {
      educational: {
        structure: ['Hook', 'Concept', 'Example', 'Takeaway', 'Disclaimer'],
        requiredElements: ['Educational purpose', 'Risk mention', 'Learn more CTA'],
        characterLimit: 1500,
        complianceNotes: ['Focus on education', 'No direct advice', 'Include disclaimers']
      },
      market_updates: {
        structure: ['Summary', 'Key Points', 'Impact', 'Outlook', 'Disclaimer'],
        requiredElements: ['Data source', 'Date/Time', 'Risk disclaimer'],
        characterLimit: 1200,
        complianceNotes: ['Factual only', 'No predictions', 'Cite sources']
      },
      seasonal: {
        structure: ['Greeting', 'Financial Tip', 'Action Item', 'Wishes', 'Disclaimer'],
        requiredElements: ['Festival context', 'Financial angle', 'Risk mention'],
        characterLimit: 1000,
        complianceNotes: ['Cultural sensitivity', 'Relevant timing', 'Compliance maintained']
      },
      promotional: {
        structure: ['Value Prop', 'Features', 'Benefits', 'CTA', 'Disclaimers'],
        requiredElements: ['Service details', 'EUIN', 'Full disclaimers', 'Contact info'],
        characterLimit: 1500,
        complianceNotes: ['No guarantees', 'Clear terms', 'All disclaimers required']
      }
    };
  }

  async getAuditLog(advisorId: string): Promise<any[]> {
    return this.auditLogs.get(advisorId) || [];
  }

  async getPerformanceMetrics(advisorId: string): Promise<{
    avgGenerationTime: number;
    p95GenerationTime: number;
    totalGenerations: number;
  }> {
    const metrics = this.performanceMetrics.get(advisorId) || [];
    
    if (metrics.length === 0) {
      return {
        avgGenerationTime: 0,
        p95GenerationTime: 0,
        totalGenerations: 0
      };
    }

    const times = metrics.map(m => m.totalTime).sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p95Index = Math.floor(times.length * 0.95);
    
    return {
      avgGenerationTime: avg,
      p95GenerationTime: times[p95Index] || times[times.length - 1],
      totalGenerations: metrics.length
    };
  }

  // Private helper methods
  private checkDailyLimit(advisorId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const usage = this.dailyUsage.get(advisorId);
    
    if (usage && usage.date === today) {
      if (usage.count >= this.DAILY_LIMIT) {
        throw new Error('Daily content generation limit exceeded');
      }
    }
  }

  private updateDailyUsage(advisorId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const usage = this.dailyUsage.get(advisorId) || { count: 0, date: today };
    
    if (usage.date !== today) {
      usage.count = 0;
      usage.date = today;
    }
    
    usage.count++;
    this.dailyUsage.set(advisorId, usage);
  }

  private getCacheKey(params: ContentGenerationParams): string {
    return `${params.advisorId}_${params.contentType}_${params.language}_${params.advisorProfile.specialization}`;
  }

  private isCacheValid(cached: GeneratedContent): boolean {
    if (!cached.metadata) return false;
    const expiresAt = new Date(cached.metadata.expiresAt);
    return expiresAt > new Date();
  }

  private async buildContext(params: ContentGenerationParams): Promise<string> {
    let context = `Specialization: ${params.advisorProfile.specialization}`;
    
    if (params.advisorProfile.experience) {
      context += `, Experience: ${params.advisorProfile.experience} years`;
    }
    
    if (params.advisorProfile.clientBase) {
      context += `, Client Base: ${params.advisorProfile.clientBase}`;
    }
    
    if (params.seasonalContext) {
      context += `, Seasonal Context: ${params.seasonalContext}`;
    }
    
    if (params.promotionDetails) {
      context += `, Promotion: ${params.promotionDetails.type}`;
      if (params.promotionDetails.fundName) {
        context += ` - ${params.promotionDetails.fundName}`;
      }
    }
    
    // Add market data context if requested
    if (params.includeMarketData && (params.contentType === 'market_updates' || params.marketDataOptions)) {
      const marketContext = await this.marketDataService.formatForAI();
      context += `\n\nCurrent Market Data:\n${marketContext}`;
    }
    
    return context;
  }

  private mapContentType(contentType: string): 'market_update' | 'investment_tips' | 'tax_planning' | 'educational' {
    const mapping: Record<string, any> = {
      'educational': 'educational',
      'market_updates': 'market_update',
      'seasonal': 'educational',
      'promotional': 'investment_tips',
      'investment_tips': 'investment_tips'
    };
    
    return mapping[contentType] || 'educational';
  }

  private enrichContentWithMarketData(content: string, insights: MarketInsight, dataPoints: string[]): string {
    // Add market summary at the beginning if not already present
    if (!content.includes('Market Update') && !content.includes('market update')) {
      const marketSummary = `📊 *Market Update*\n${insights.headline}\n\n`;
      content = marketSummary + content;
    }
    
    // Add key data points if space allows
    if (dataPoints.length > 0 && content.length < 3000) {
      const dataSection = '\n\n*Key Market Data:*\n' + dataPoints.map(dp => `• ${dp}`).join('\n');
      content += dataSection;
    }
    
    // Add market mood indicator
    if (insights.marketMood) {
      content += `\n\n*Market Sentiment:* ${insights.marketMood}`;
    }
    
    return content;
  }

  private formatForWhatsApp(content: string): string {
    // Remove HTML tags
    let formatted = content.replace(/<[^>]*>/g, '');
    
    // Limit length for WhatsApp
    if (formatted.length > 1024) {
      formatted = formatted.substring(0, 1021) + '...';
    }
    
    // Add WhatsApp-friendly formatting
    formatted = formatted.replace(/\n\n/g, '\n\n');
    
    return formatted;
  }

  private getSeasonalTags(context: string): string[] {
    const tags: Record<string, string[]> = {
      'diwali': ['#Diwali', '#FestiveInvesting', '#DiwaliBonus'],
      'holi': ['#Holi', '#ColorfulInvestments', '#HoliSavings'],
      'newyear': ['#NewYear', '#FinancialResolutions', '#NewYearGoals'],
      'budget': ['#UnionBudget', '#BudgetImpact', '#TaxChanges']
    };
    
    return tags[context.toLowerCase()] || ['#Seasonal'];
  }

  private generateFallbackContent(params: ContentGenerationParams): GeneratedContent {
    const templates: Record<string, string> = {
      educational: 'Understanding mutual funds helps build wealth systematically. Start with SIP for disciplined investing. Mutual fund investments are subject to market risks.',
      market_updates: 'Markets showing mixed trends. Investors advised to focus on long-term goals. All investments subject to market risks.',
      seasonal: 'Season\'s greetings! Plan your finances wisely this festive season. Invest regularly for long-term wealth. Subject to market risks.',
      promotional: 'Explore our financial advisory services. Professional guidance for your investment journey. Read all documents carefully. Market risks apply.',
      investment_tips: 'Diversification helps manage portfolio risk. Regular investments through SIP recommended. All investments subject to market risks.'
    };
    
    const content = templates[params.contentType] || templates.educational;
    
    return {
      content,
      title: `${params.contentType.replace('_', ' ')} - Fallback Content`,
      contentType: params.contentType,
      language: params.language,
      isCompliant: true,
      complianceScore: 80,
      riskScore: 20,
      isFallback: true,
      metadata: {
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        version: '1.0.0'
      }
    };
  }

  private extractViolations(content: GeneratedContent): string[] {
    // Extract violations from audit log
    if (content.auditLog?.complianceChecks) {
      return content.auditLog.complianceChecks
        .flatMap((check: any) => check.violations || []);
    }
    return [];
  }

  private extractSuggestions(content: GeneratedContent): string[] {
    // Extract suggestions from audit log
    if (content.auditLog?.complianceChecks) {
      return content.auditLog.complianceChecks
        .flatMap((check: any) => check.suggestions || []);
    }
    return [];
  }

  private logAudit(advisorId: string, content: GeneratedContent): void {
    const logs = this.auditLogs.get(advisorId) || [];
    logs.push({
      timestamp: new Date().toISOString(),
      contentHash: content.auditLog?.contentHash,
      complianceStatus: content.isCompliant,
      riskScore: content.riskScore,
      contentType: content.contentType,
      language: content.language
    });
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
    
    this.auditLogs.set(advisorId, logs);
  }

  private trackPerformance(advisorId: string, metrics: any): void {
    const perf = this.performanceMetrics.get(advisorId) || [];
    perf.push(metrics);
    
    // Keep only last 100 metrics
    if (perf.length > 100) {
      perf.shift();
    }
    
    this.performanceMetrics.set(advisorId, perf);
  }
}

export default AIContentGenerationService;