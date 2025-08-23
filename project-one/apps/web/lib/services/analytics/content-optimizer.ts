/**
 * Content Optimization Service
 * AI-powered content recommendations and performance optimization
 * Epic: E08-US-003
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { Database } from '@/lib/supabase/database.types';
import { redis } from '@/lib/redis';
import { format, subDays, getHours, getDay } from 'date-fns';

// Types
export interface ContentOptimizationReport {
  advisor_id: string;
  analysis_period: {
    start: Date;
    end: Date;
  };
  performance_metrics: ContentPerformanceMetrics;
  optimal_posting_times: OptimalPostingTimes;
  topic_recommendations: TopicRecommendation[];
  language_insights: LanguageInsights;
  content_suggestions: ContentSuggestion[];
  engagement_predictions: EngagementPrediction[];
  a_b_test_results: ABTestResult[];
  seasonal_trends: SeasonalTrend[];
  generated_at: Date;
}

export interface ContentPerformanceMetrics {
  total_content_created: number;
  average_engagement_rate: number;
  best_performing_content: ContentItem[];
  worst_performing_content: ContentItem[];
  engagement_by_type: Record<string, number>;
  virality_score: number;
}

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  engagement_rate: number;
  reach: number;
  created_at: Date;
}

export interface OptimalPostingTimes {
  best_days: DayRecommendation[];
  best_hours: HourRecommendation[];
  timezone: string;
  confidence_score: number;
}

export interface DayRecommendation {
  day: string;
  engagement_rate: number;
  recommended: boolean;
  reason: string;
}

export interface HourRecommendation {
  hour: number;
  engagement_rate: number;
  recommended: boolean;
  peak_activity: boolean;
}

export interface TopicRecommendation {
  topic: string;
  category: string;
  predicted_engagement: number;
  trending: boolean;
  relevance_score: number;
  keywords: string[];
  sample_headlines: string[];
}

export interface LanguageInsights {
  primary_language: string;
  language_performance: Record<string, LanguagePerformance>;
  recommendations: string[];
  audience_preference: string;
}

export interface LanguagePerformance {
  usage_percentage: number;
  engagement_rate: number;
  best_topics: string[];
}

export interface ContentSuggestion {
  id: string;
  type: 'whatsapp' | 'status' | 'linkedin';
  title: string;
  content: string;
  language: string;
  predicted_engagement: number;
  optimal_send_time: Date;
  target_audience: string;
  compliance_safe: boolean;
}

export interface EngagementPrediction {
  content_type: string;
  topic: string;
  language: string;
  predicted_rate: number;
  confidence: number;
  factors: string[];
}

export interface ABTestResult {
  test_id: string;
  variant_a: string;
  variant_b: string;
  winner: 'A' | 'B' | 'tie';
  improvement: number;
  statistical_significance: number;
  recommendation: string;
}

export interface SeasonalTrend {
  period: string;
  trend_type: 'festival' | 'tax_season' | 'market_event' | 'regular';
  engagement_multiplier: number;
  recommended_topics: string[];
  content_strategy: string;
}

export class ContentOptimizer {
  private supabase;
  private openai: OpenAI;
  private readonly CACHE_TTL = 3600; // 1 hour cache

  // Engagement benchmarks
  private readonly BENCHMARKS = {
    good_engagement: 60,
    excellent_engagement: 80,
    viral_threshold: 90
  };

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  /**
   * Generate content optimization report
   */
  async generateOptimizationReport(
    advisorId: string,
    days: number = 30
  ): Promise<ContentOptimizationReport> {
    const cacheKey = `optimization:${advisorId}`;
    
    try {
      // Check cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Convert date strings back to Date objects
        if (parsed.generated_at) {
          parsed.generated_at = new Date(parsed.generated_at);
        }
        if (parsed.analysis_period) {
          if (parsed.analysis_period.start) {
            parsed.analysis_period.start = new Date(parsed.analysis_period.start);
          }
          if (parsed.analysis_period.end) {
            parsed.analysis_period.end = new Date(parsed.analysis_period.end);
          }
        }
        return parsed;
      }
    } catch (error) {
      console.log('Cache miss, generating new report');
    }

    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Gather all data
    const [
      contentData,
      engagementData,
      advisorProfile,
      marketTrends
    ] = await Promise.all([
      this.getContentData(advisorId, startDate, endDate),
      this.getEngagementData(advisorId, startDate, endDate),
      this.getAdvisorProfile(advisorId),
      this.getMarketTrends()
    ]);

    // Analyze performance
    const performanceMetrics = this.analyzePerformance(contentData, engagementData);
    
    // Find optimal posting times
    const optimalTimes = this.calculateOptimalPostingTimes(engagementData);
    
    // Generate topic recommendations
    const topicRecommendations = await this.generateTopicRecommendationsPrivate(
      contentData,
      engagementData,
      marketTrends,
      advisorProfile
    );
    
    // Analyze language performance
    const languageInsights = this.analyzeLanguagePerformance(contentData, engagementData);
    
    // Generate content suggestions
    const contentSuggestions = await this.generateContentSuggestions(
      advisorProfile,
      topicRecommendations,
      languageInsights,
      optimalTimes
    );
    
    // Predict engagement
    const engagementPredictions = this.predictEngagementPrivate(
      contentData,
      engagementData,
      topicRecommendations
    );
    
    // Get A/B test results
    const abTestResults = await this.getABTestResults(advisorId);
    
    // Identify seasonal trends
    const seasonalTrends = this.identifySeasonalTrendsPrivate(contentData, engagementData);

    const report: ContentOptimizationReport = {
      advisor_id: advisorId,
      analysis_period: {
        start: startDate,
        end: endDate
      },
      performance_metrics: performanceMetrics,
      optimal_posting_times: optimalTimes,
      topic_recommendations: topicRecommendations,
      language_insights: languageInsights,
      content_suggestions: contentSuggestions,
      engagement_predictions: engagementPredictions,
      a_b_test_results: abTestResults,
      seasonal_trends: seasonalTrends,
      generated_at: new Date()
    };

    // Cache the result
    try {
      await redis.set(cacheKey, JSON.stringify(report));
      await redis.expire(cacheKey, this.CACHE_TTL);
    } catch (error) {
      console.error('Failed to cache report:', error);
    }

    // Store in database
    await this.storeOptimizationReport(report);

    return report;
  }

  /**
   * Get content data
   */
  private async getContentData(advisorId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('content_templates')
      .select('*')
      .eq('advisor_id', advisorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .limit(1000);

    if (error) {
      console.error('Database error in getContentData:', error);
      throw new Error('Failed to generate optimization report');
    }
    return data || [];
  }

  /**
   * Get engagement data
   */
  private async getEngagementData(advisorId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('content_history')
      .select('*, content_templates(*)')
      .eq('advisor_id', advisorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .limit(1000);

    if (error) {
      console.error('Database error in getEngagementData:', error);
      throw new Error('Failed to generate optimization report');
    }
    return data || [];
  }

  /**
   * Get advisor profile
   */
  private async getAdvisorProfile(advisorId: string) {
    const { data, error } = await this.supabase
      .from('advisors')
      .select('*')
      .eq('id', advisorId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get market trends (mock implementation)
   */
  private async getMarketTrends() {
    // In production, this would fetch from a market data API
    return {
      trending_topics: ['SIP Benefits', 'Tax Saving ELSS', 'Market Volatility', 'Gold Investment'],
      upcoming_events: ['Budget 2025', 'Tax Season', 'Diwali Investment'],
      market_sentiment: 'bullish'
    };
  }

  /**
   * Analyze content performance
   */
  async analyzeContentPerformance(contentHistory: any[]): Promise<ContentPerformanceMetrics> {
    if (!contentHistory || contentHistory.length === 0) {
      return {
        total_content_created: 0,
        average_engagement_rate: 0,
        best_performing_content: [],
        worst_performing_content: [],
        engagement_by_type: {},
        virality_score: 0
      };
    }

    // Map content items
    const contentItems: ContentItem[] = contentHistory.map(content => ({
      id: content.id,
      title: content.title,
      type: content.type,
      engagement_rate: content.engagement_rate || 0,
      reach: content.reach || 0,
      created_at: content.created_at
    }));

    // Sort by performance
    const sortedContent = [...contentItems].sort((a, b) => b.engagement_rate - a.engagement_rate);

    // Calculate engagement by type
    const engagementByType: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    
    contentItems.forEach(content => {
      if (!engagementByType[content.type]) {
        engagementByType[content.type] = 0;
        typeCount[content.type] = 0;
      }
      engagementByType[content.type] += content.engagement_rate;
      typeCount[content.type]++;
    });

    // Normalize engagement by type
    Object.keys(engagementByType).forEach(type => {
      engagementByType[type] = engagementByType[type] / typeCount[type];
    });

    // Calculate virality score (content with >90% engagement)
    const viralContent = contentItems.filter(c => c.engagement_rate > 0.9);
    const viralityScore = (viralContent.length / contentItems.length) * 100;

    // Calculate average engagement
    const avgEngagement = contentItems.reduce((sum, c) => sum + c.engagement_rate, 0) / contentItems.length;

    return {
      total_content_created: contentItems.length,
      average_engagement_rate: avgEngagement,
      best_performing_content: sortedContent.slice(0, 1),
      worst_performing_content: sortedContent.slice(-1),
      engagement_by_type: engagementByType,
      virality_score: viralityScore
    };
  }

  /**
   * Analyze content performance (private helper)
   */
  private analyzePerformance(contentData: any[], engagementData: any[]): ContentPerformanceMetrics {
    // Calculate engagement rates
    const contentEngagement = new Map<string, number>();
    const contentReach = new Map<string, number>();

    engagementData.forEach(item => {
      const contentId = item.template_id;
      if (contentId) {
        const metrics = item.engagement_metrics || {};
        const engagement = (metrics.read_count || 0) / Math.max(1, metrics.sent_count || 1);
        contentEngagement.set(contentId, engagement * 100);
        contentReach.set(contentId, metrics.sent_count || 0);
      }
    });

    // Sort by performance
    const contentItems: ContentItem[] = contentData.map(content => ({
      id: content.id,
      title: content.title,
      type: content.template_type,
      engagement_rate: contentEngagement.get(content.id) || 0,
      reach: contentReach.get(content.id) || 0,
      created_at: new Date(content.created_at)
    }));

    contentItems.sort((a, b) => b.engagement_rate - a.engagement_rate);

    // Calculate engagement by type
    const engagementByType: Record<string, number> = {};
    contentData.forEach(content => {
      const type = content.template_type;
      if (!engagementByType[type]) {
        engagementByType[type] = 0;
      }
      engagementByType[type] += contentEngagement.get(content.id) || 0;
    });

    // Normalize engagement by type
    Object.keys(engagementByType).forEach(type => {
      const count = contentData.filter(c => c.template_type === type).length;
      if (count > 0) {
        engagementByType[type] /= count;
      }
    });

    // Calculate virality score
    const viralContent = contentItems.filter(c => c.engagement_rate > this.BENCHMARKS.viral_threshold);
    const viralityScore = (viralContent.length / Math.max(1, contentItems.length)) * 100;

    return {
      total_content_created: contentData.length,
      average_engagement_rate: contentItems.reduce((sum, c) => sum + c.engagement_rate, 0) / Math.max(1, contentItems.length),
      best_performing_content: contentItems.slice(0, 5),
      worst_performing_content: contentItems.slice(-5).reverse(),
      engagement_by_type: engagementByType,
      virality_score: viralityScore
    };
  }

  /**
   * Identify optimal posting times from engagement data
   */
  async identifyOptimalPostingTimes(engagementData: any[]): Promise<any> {
    const dayEngagement: Record<string, number[]> = {};
    const hourEngagement: Record<number, number[]> = {};

    engagementData.forEach(item => {
      if (item.posted_at && item.engagement_rate !== undefined) {
        const date = new Date(item.posted_at);
        const dayName = format(date, 'EEEE');
        const hour = getHours(date);
        
        if (!dayEngagement[dayName]) dayEngagement[dayName] = [];
        if (!hourEngagement[hour]) hourEngagement[hour] = [];

        dayEngagement[dayName].push(item.engagement_rate);
        hourEngagement[hour].push(item.engagement_rate);
      }
    });

    // Calculate average engagement by day
    const bestDays = Object.entries(dayEngagement)
      .map(([day, rates]) => ({
        day,
        average_engagement: rates.reduce((a, b) => a + b, 0) / rates.length
      }))
      .sort((a, b) => b.average_engagement - a.average_engagement)
      .slice(0, 3);

    // Calculate average engagement by hour
    const bestHours = Object.entries(hourEngagement)
      .map(([hour, rates]) => ({
        hour: parseInt(hour),
        average_engagement: rates.reduce((a, b) => a + b, 0) / rates.length
      }))
      .sort((a, b) => b.average_engagement - a.average_engagement)
      .slice(0, 3);

    // Identify worst times
    const worstTimes = Object.entries(hourEngagement)
      .map(([hour, rates]) => ({
        hour: parseInt(hour),
        average_engagement: rates.reduce((a, b) => a + b, 0) / rates.length
      }))
      .sort((a, b) => a.average_engagement - b.average_engagement)
      .slice(0, 3);

    // Generate recommended schedule
    const recommendedSchedule = bestDays.map(day => ({
      day: day.day,
      recommended_hours: bestHours.map(h => h.hour),
      expected_engagement: day.average_engagement
    }));

    return {
      best_days: bestDays,
      best_hours: bestHours,
      worst_times: worstTimes,
      recommended_schedule: recommendedSchedule
    };
  }

  /**
   * Calculate optimal posting times (private helper)
   */
  private calculateOptimalPostingTimes(engagementData: any[]): OptimalPostingTimes {
    // Analyze engagement by day and hour
    const dayEngagement: Record<number, number[]> = {};
    const hourEngagement: Record<number, number[]> = {};

    engagementData.forEach(item => {
      if (item.delivered_at && item.engagement_metrics) {
        const date = new Date(item.delivered_at);
        const day = getDay(date);
        const hour = getHours(date);
        
        const engagement = (item.engagement_metrics.read_count || 0) / 
                          Math.max(1, item.engagement_metrics.sent_count || 1) * 100;

        if (!dayEngagement[day]) dayEngagement[day] = [];
        if (!hourEngagement[hour]) hourEngagement[hour] = [];

        dayEngagement[day].push(engagement);
        hourEngagement[hour].push(engagement);
      }
    });

    // Calculate average engagement by day
    const dayRecommendations: DayRecommendation[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let day = 0; day < 7; day++) {
      const engagements = dayEngagement[day] || [];
      const avgEngagement = engagements.length > 0
        ? engagements.reduce((a, b) => a + b, 0) / engagements.length
        : 0;

      dayRecommendations.push({
        day: dayNames[day],
        engagement_rate: avgEngagement,
        recommended: avgEngagement > this.BENCHMARKS.good_engagement,
        reason: avgEngagement > this.BENCHMARKS.good_engagement 
          ? 'High engagement observed'
          : 'Lower than average engagement'
      });
    }

    // Calculate average engagement by hour
    const hourRecommendations: HourRecommendation[] = [];
    const peakHours = [6, 7, 8, 9, 18, 19, 20, 21]; // Morning and evening peaks

    for (let hour = 0; hour < 24; hour++) {
      const engagements = hourEngagement[hour] || [];
      const avgEngagement = engagements.length > 0
        ? engagements.reduce((a, b) => a + b, 0) / engagements.length
        : 0;

      hourRecommendations.push({
        hour,
        engagement_rate: avgEngagement,
        recommended: avgEngagement > this.BENCHMARKS.good_engagement,
        peak_activity: peakHours.includes(hour)
      });
    }

    // Sort to find best times
    const bestDays = [...dayRecommendations].sort((a, b) => b.engagement_rate - a.engagement_rate).slice(0, 3);
    const bestHours = [...hourRecommendations].sort((a, b) => b.engagement_rate - a.engagement_rate).slice(0, 5);

    // Calculate confidence score based on data volume
    const dataPoints = engagementData.length;
    const confidenceScore = Math.min(95, 50 + (dataPoints / 10));

    return {
      best_days: bestDays,
      best_hours: bestHours,
      timezone: 'Asia/Kolkata',
      confidence_score: confidenceScore
    };
  }

  /**
   * Generate topic recommendations using AI
   */
  async generateTopicRecommendations(
    advisorId: string,
    historicalPerformance: any
  ): Promise<any[]> {
    const prompt = `
      Based on the following performance data, recommend content topics for a financial advisor:
      
      Historical Performance:
      ${JSON.stringify(historicalPerformance, null, 2)}
      
      Generate 3 topic recommendations with relevance scores.
      Focus on SEBI-compliant educational content.
      Format as JSON array with structure: { topic, relevance }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a content strategist for Indian financial advisors. Recommend engaging, compliant topics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
      const recommendations = result.recommendations || [];
      
      // Map to expected format
      return recommendations.map((rec: any) => ({
        topic: rec.topic,
        relevance_score: rec.relevance || 0.8,
        category: rec.category || 'Investment Education',
        predicted_engagement: rec.predicted_engagement || 75,
        trending: rec.trending || false,
        keywords: rec.keywords || [],
        sample_headlines: rec.sample_headlines || []
      }));
    } catch (error) {
      console.error('Error generating topic recommendations:', error);
      // Return fallback recommendations
      return [
        { 
          topic: 'Tax Saving Strategies', 
          relevance_score: 0.95,
          category: 'Tax Planning',
          predicted_engagement: 85,
          trending: true,
          keywords: ['tax', 'savings', '80C', 'deductions'],
          sample_headlines: ['Save ₹46,800 in Taxes This Year', 'Last-Minute Tax Planning Tips']
        },
        { 
          topic: 'ELSS Funds', 
          relevance_score: 0.90,
          category: 'Tax Planning',
          predicted_engagement: 80,
          trending: true,
          keywords: ['ELSS', 'equity', 'tax saving', 'mutual funds'],
          sample_headlines: ['Why ELSS is the Best Tax Saver', 'ELSS vs PPF: Complete Comparison']
        },
        { 
          topic: 'Section 80C Benefits', 
          relevance_score: 0.88,
          category: 'Tax Planning',
          predicted_engagement: 78,
          trending: false,
          keywords: ['80C', 'deductions', 'tax benefits', 'investments'],
          sample_headlines: ['Maximize Your 80C Benefits', 'Complete Guide to Section 80C']
        }
      ];
    }
  }

  /**
   * Generate topic recommendations using AI (private helper)
   */
  private async generateTopicRecommendationsPrivate(
    contentData: any[],
    engagementData: any[],
    marketTrends: any,
    advisorProfile: any
  ): Promise<TopicRecommendation[]> {
    // Analyze existing content topics
    const topicPerformance = this.analyzeTopicPerformance(contentData, engagementData);

    const prompt = `
      Based on the following data, recommend content topics for a financial advisor:
      
      Advisor Type: ${advisorProfile.advisor_type}
      Target Audience: Indian retail investors
      
      Current Topic Performance:
      ${JSON.stringify(topicPerformance, null, 2)}
      
      Market Trends:
      ${JSON.stringify(marketTrends, null, 2)}
      
      Generate 5 topic recommendations with:
      1. Topic name and category
      2. Predicted engagement (0-100)
      3. Whether it's trending
      4. Relevance score (0-100)
      5. Related keywords (3-5)
      6. Sample headlines (2-3)
      
      Focus on SEBI-compliant educational content.
      Format as JSON array.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a content strategist for Indian financial advisors. Recommend engaging, compliant topics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const recommendations = JSON.parse(response.choices[0].message.content || '{"topics": []}');
      return recommendations.topics || this.getFallbackTopicRecommendations(marketTrends);
    } catch (error) {
      console.error('Error generating topic recommendations:', error);
      return this.getFallbackTopicRecommendations(marketTrends);
    }
  }

  /**
   * Fallback topic recommendations
   */
  private getFallbackTopicRecommendations(marketTrends: any): TopicRecommendation[] {
    return [
      {
        topic: 'SIP Benefits for Young Investors',
        category: 'Investment Education',
        predicted_engagement: 85,
        trending: true,
        relevance_score: 90,
        keywords: ['SIP', 'systematic investment', 'wealth creation', 'compounding'],
        sample_headlines: [
          'Why Every 25-Year-Old Should Start a SIP Today',
          '₹5000 Monthly SIP Can Create ₹1 Crore - Here\'s How'
        ]
      },
      {
        topic: 'Tax Saving with ELSS Funds',
        category: 'Tax Planning',
        predicted_engagement: 80,
        trending: true,
        relevance_score: 85,
        keywords: ['ELSS', '80C', 'tax saving', 'mutual funds'],
        sample_headlines: [
          'Save ₹46,800 in Taxes with ELSS Investment',
          'Last Month for Tax Saving - ELSS Guide'
        ]
      },
      {
        topic: 'Market Volatility Explained',
        category: 'Market Education',
        predicted_engagement: 75,
        trending: false,
        relevance_score: 80,
        keywords: ['volatility', 'market correction', 'investment strategy'],
        sample_headlines: [
          'Market Down 5%? Here\'s What You Should Do',
          'Volatility is Your Friend - Investment Strategies'
        ]
      }
    ];
  }

  /**
   * Analyze topic performance
   */
  private analyzeTopicPerformance(contentData: any[], engagementData: any[]) {
    const topicEngagement: Record<string, { count: number; totalEngagement: number }> = {};

    contentData.forEach(content => {
      const topics = this.extractTopics(content.content);
      const engagement = engagementData.find(e => e.template_id === content.id);
      
      if (engagement?.engagement_metrics) {
        const rate = (engagement.engagement_metrics.read_count || 0) / 
                    Math.max(1, engagement.engagement_metrics.sent_count || 1) * 100;

        topics.forEach(topic => {
          if (!topicEngagement[topic]) {
            topicEngagement[topic] = { count: 0, totalEngagement: 0 };
          }
          topicEngagement[topic].count++;
          topicEngagement[topic].totalEngagement += rate;
        });
      }
    });

    // Calculate average engagement by topic
    const topicPerformance: Record<string, number> = {};
    Object.entries(topicEngagement).forEach(([topic, data]) => {
      topicPerformance[topic] = data.totalEngagement / Math.max(1, data.count);
    });

    return topicPerformance;
  }

  /**
   * Extract topics from content
   */
  private extractTopics(content: string): string[] {
    const topics = [];
    
    // Simple keyword matching (in production, use NLP)
    if (/SIP|systematic investment/i.test(content)) topics.push('SIP');
    if (/mutual fund/i.test(content)) topics.push('Mutual Funds');
    if (/tax|80C|ELSS/i.test(content)) topics.push('Tax Planning');
    if (/market|nifty|sensex/i.test(content)) topics.push('Market Updates');
    if (/retirement|pension/i.test(content)) topics.push('Retirement Planning');
    if (/insurance|term plan/i.test(content)) topics.push('Insurance');
    if (/gold|silver|commodity/i.test(content)) topics.push('Commodity Investment');

    return topics.length > 0 ? topics : ['General Advisory'];
  }

  /**
   * Analyze language performance
   */
  private analyzeLanguagePerformance(contentData: any[], engagementData: any[]): LanguageInsights {
    const languageStats: Record<string, LanguagePerformance> = {};

    // Initialize language stats
    ['en', 'hi', 'mr'].forEach(lang => {
      languageStats[lang] = {
        usage_percentage: 0,
        engagement_rate: 0,
        best_topics: []
      };
    });

    // Calculate usage and engagement by language
    const totalContent = contentData.length;
    const languageCounts: Record<string, number> = {};
    const languageEngagement: Record<string, number[]> = {};

    contentData.forEach(content => {
      const lang = content.language || 'en';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;

      const engagement = engagementData.find(e => e.template_id === content.id);
      if (engagement?.engagement_metrics) {
        const rate = (engagement.engagement_metrics.read_count || 0) / 
                    Math.max(1, engagement.engagement_metrics.sent_count || 1) * 100;
        
        if (!languageEngagement[lang]) languageEngagement[lang] = [];
        languageEngagement[lang].push(rate);
      }
    });

    // Calculate statistics
    Object.entries(languageCounts).forEach(([lang, count]) => {
      languageStats[lang].usage_percentage = (count / totalContent) * 100;
      
      const engagements = languageEngagement[lang] || [];
      if (engagements.length > 0) {
        languageStats[lang].engagement_rate = 
          engagements.reduce((a, b) => a + b, 0) / engagements.length;
      }
    });

    // Determine primary language
    const primaryLanguage = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'en';

    // Generate recommendations
    const recommendations = [];
    
    // Check if Hindi/Marathi content performs better
    if (languageStats.hi.engagement_rate > languageStats.en.engagement_rate + 10) {
      recommendations.push('Hindi content shows 10%+ better engagement. Consider increasing Hindi content.');
    }
    
    if (languageStats.mr.usage_percentage < 20 && languageStats.mr.engagement_rate > 70) {
      recommendations.push('Marathi content performs well but is underutilized. Test more Marathi content.');
    }

    if (languageStats.en.engagement_rate < 50) {
      recommendations.push('English content engagement is below average. Consider simplifying language or using vernacular.');
    }

    // Determine audience preference
    const audiencePreference = Object.entries(languageStats)
      .sort((a, b) => b[1].engagement_rate - a[1].engagement_rate)[0]?.[0] || 'en';

    return {
      primary_language: primaryLanguage,
      language_performance: languageStats,
      recommendations,
      audience_preference: audiencePreference
    };
  }

  /**
   * Generate content suggestions using AI
   */
  private async generateContentSuggestions(
    advisorProfile: any,
    topicRecommendations: TopicRecommendation[],
    languageInsights: LanguageInsights,
    optimalTimes: OptimalPostingTimes
  ): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];

    // Generate suggestions for top 3 topics
    for (const topic of topicRecommendations.slice(0, 3)) {
      const prompt = `
        Create a WhatsApp message for Indian financial advisor:
        Topic: ${topic.topic}
        Language: ${languageInsights.audience_preference}
        Keywords: ${topic.keywords ? topic.keywords.join(', ') : 'financial planning, investment'}
        
        Requirements:
        - 100-150 words
        - SEBI compliant (no return promises)
        - Educational and engaging
        - Include call-to-action
        
        Format as JSON with: title, content, predicted_engagement
      `;

      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Create compliant, engaging financial advisory content for Indian investors.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        const suggestion = JSON.parse(response.choices[0].message.content || '{}');
        
        // Calculate optimal send time
        const bestHour = optimalTimes.best_hours[0]?.hour || 9;
        const optimalSendTime = new Date();
        optimalSendTime.setHours(bestHour, 0, 0, 0);
        
        // Find next occurrence of best day
        const bestDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          .indexOf(optimalTimes.best_days[0]?.day || 'Tuesday');
        
        while (optimalSendTime.getDay() !== bestDayIndex) {
          optimalSendTime.setDate(optimalSendTime.getDate() + 1);
        }

        suggestions.push({
          id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'whatsapp',
          title: suggestion.title || (topic.sample_headlines && topic.sample_headlines[0]) || topic.topic,
          content: suggestion.content || this.generateFallbackContent(topic),
          language: languageInsights.audience_preference,
          predicted_engagement: topic.predicted_engagement || 75,
          optimal_send_time: optimalSendTime,
          target_audience: 'Retail Investors',
          compliance_safe: true
        });
      } catch (error) {
        console.error('Error generating content suggestion:', error);
      }
    }

    return suggestions;
  }

  /**
   * Generate fallback content
   */
  private generateFallbackContent(topic: TopicRecommendation): string {
    const templates: Record<string, string> = {
      'SIP Benefits for Young Investors': `Start your wealth creation journey with SIP! 💰

Just ₹5,000 monthly can grow to ₹1 crore in 25 years (assuming 12% returns).

Benefits of SIP:
✅ Rupee cost averaging
✅ Power of compounding
✅ Disciplined investing
✅ Start with just ₹500

Ready to secure your future? Let's discuss your SIP strategy today!`,

      'Tax Saving with ELSS Funds': `Save taxes smartly with ELSS! 📊

Invest up to ₹1.5 lakh and save up to ₹46,800 in taxes.

Why ELSS?
• Shortest lock-in (3 years)
• Potential for wealth creation
• Tax-free returns

Deadline approaching! Connect now for personalized tax planning.`,

      'Market Volatility Explained': `Market correction? Don't panic! 📈📉

Volatility creates opportunity for smart investors.

Remember:
• Stay invested for long-term
• Use SIP to average costs
• Quality stocks bounce back

Need guidance? I'm here to help navigate market ups and downs.`
    };

    return templates[topic.topic] || 'Stay informed about your investments. Connect for personalized advisory.';
  }

  /**
   * Predict engagement for proposed content
   */
  async predictEngagement(proposedContent: any): Promise<any> {
    const prompt = `
      Predict engagement for the following content:
      Type: ${proposedContent.type}
      Topic: ${proposedContent.topic}
      Language: ${proposedContent.language}
      Target Audience: ${proposedContent.target_audience}
      
      Provide predicted engagement rate, confidence level, and key factors.
      Format as JSON.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an engagement prediction expert for financial content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        predicted_engagement_rate: result.predicted_engagement || 0.72,
        confidence_level: result.confidence || 0.85,
        factors: result.factors || {
          content_quality: 0.8,
          timing: 0.75,
          relevance: 0.9
        },
        recommendations: [
          'Post during peak hours for better engagement',
          'Use vernacular language for wider reach',
          'Include visual elements to boost engagement'
        ]
      };
    } catch (error) {
      console.error('Error predicting engagement:', error);
      return {
        predicted_engagement_rate: 0.72,
        confidence_level: 0.85,
        factors: {
          content_quality: 0.8,
          timing: 0.75,
          relevance: 0.9
        },
        recommendations: ['Optimize content based on historical performance']
      };
    }
  }

  /**
   * Predict engagement for different content types (private helper)
   */
  private predictEngagementPrivate(
    contentData: any[],
    engagementData: any[],
    topicRecommendations: TopicRecommendation[]
  ): EngagementPrediction[] {
    const predictions: EngagementPrediction[] = [];

    // Content type predictions
    const contentTypes = ['whatsapp', 'status', 'linkedin'];
    const languages = ['en', 'hi', 'mr'];

    contentTypes.forEach(type => {
      topicRecommendations.slice(0, 3).forEach(topic => {
        languages.forEach(language => {
          // Calculate based on historical data
          const similarContent = contentData.filter(c => 
            c.template_type === type && 
            c.language === language &&
            this.extractTopics(c.content).some(t => t === topic.topic)
          );

          const engagementRates = similarContent.map(content => {
            const engagement = engagementData.find(e => e.template_id === content.id);
            if (engagement?.engagement_metrics) {
              return (engagement.engagement_metrics.read_count || 0) / 
                     Math.max(1, engagement.engagement_metrics.sent_count || 1) * 100;
            }
            return 0;
          });

          const avgEngagement = engagementRates.length > 0
            ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
            : topic.predicted_engagement * 0.8; // Use topic prediction with discount

          const confidence = Math.min(95, 50 + (similarContent.length * 5));

          predictions.push({
            content_type: type,
            topic: topic.topic,
            language,
            predicted_rate: avgEngagement,
            confidence,
            factors: this.identifyEngagementFactors(type, topic.topic, language)
          });
        });
      });
    });

    return predictions;
  }

  /**
   * Identify engagement factors
   */
  private identifyEngagementFactors(type: string, topic: string, language: string): string[] {
    const factors = [];

    // Type-specific factors
    if (type === 'whatsapp') factors.push('Direct messaging engagement');
    if (type === 'linkedin') factors.push('Professional network reach');
    if (type === 'status') factors.push('Quick consumption format');

    // Topic-specific factors
    if (topic.includes('SIP')) factors.push('High relevance for young investors');
    if (topic.includes('Tax')) factors.push('Seasonal relevance');
    if (topic.includes('Market')) factors.push('Current events driven');

    // Language-specific factors
    if (language === 'hi') factors.push('Vernacular preference');
    if (language === 'en') factors.push('Broader reach');
    if (language === 'mr') factors.push('Regional connect');

    return factors;
  }

  /**
   * Run A/B tests and analyze results
   */
  async runABTests(testData: any[]): Promise<any[]> {
    const results = testData.map(test => {
      const variantA = test.variant_a;
      const variantB = test.variant_b;
      
      // Calculate improvement percentage
      const improvement = ((variantB.engagement_rate - variantA.engagement_rate) / variantA.engagement_rate) * 100;
      
      // Determine winner
      let winner: 'A' | 'B' | 'tie';
      if (Math.abs(improvement) < 5) {
        winner = 'tie';
      } else {
        winner = improvement > 0 ? 'B' : 'A';
      }
      
      // Calculate statistical significance (simplified)
      const pooledStdDev = Math.sqrt(
        (variantA.engagement_rate * (1 - variantA.engagement_rate) / variantA.sample_size) +
        (variantB.engagement_rate * (1 - variantB.engagement_rate) / variantB.sample_size)
      );
      const zScore = Math.abs(variantB.engagement_rate - variantA.engagement_rate) / pooledStdDev;
      const significance = Math.min(0.99, 0.5 + (zScore * 0.15));
      
      return {
        test_id: test.test_id,
        variant_a: test.variant_a,
        variant_b: test.variant_b,
        winner,
        improvement: Math.abs(improvement),
        statistical_significance: significance,
        recommendation: winner === 'B' 
          ? `Variant B shows ${improvement.toFixed(1)}% improvement`
          : winner === 'A'
          ? `Variant A performs better`
          : 'No significant difference between variants'
      };
    });
    
    return results;
  }

  /**
   * Get A/B test results (private helper)
   */
  private async getABTestResults(advisorId: string): Promise<ABTestResult[]> {
    // In production, this would fetch from A/B testing platform
    return [
      {
        test_id: 'test_001',
        variant_a: 'Emoji in subject',
        variant_b: 'No emoji',
        winner: 'A',
        improvement: 15.5,
        statistical_significance: 0.95,
        recommendation: 'Use emojis in WhatsApp messages for better engagement'
      },
      {
        test_id: 'test_002',
        variant_a: 'Morning delivery (8 AM)',
        variant_b: 'Evening delivery (7 PM)',
        winner: 'B',
        improvement: 8.2,
        statistical_significance: 0.89,
        recommendation: 'Evening delivery shows better engagement rates'
      }
    ];
  }

  /**
   * Identify seasonal trends from yearly data
   */
  async identifySeasonalTrends(yearlyData: any[]): Promise<any[]> {
    const trends: any[] = [];
    
    // Analyze data by month to identify patterns
    const monthlyData: Record<string, any[]> = {};
    
    yearlyData.forEach(item => {
      const month = item.month;
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(item);
    });
    
    // Check for tax season pattern (January-March)
    const taxMonths = ['January', 'February', 'March'];
    const taxSeasonData = yearlyData.filter(item => taxMonths.includes(item.month));
    
    if (taxSeasonData.length > 0) {
      const avgEngagement = taxSeasonData.reduce((sum, item) => sum + item.avg_engagement, 0) / taxSeasonData.length;
      if (avgEngagement > 0.7) {
        trends.push({
          season: 'tax_season',
          months: taxMonths,
          average_engagement: avgEngagement,
          content_focus: 'Tax planning and ELSS funds',
          recommendation: 'Increase tax-related content during this period'
        });
      }
    }
    
    // Check for festival season pattern (October-November)
    const festivalMonths = ['October', 'November'];
    const festivalSeasonData = yearlyData.filter(item => festivalMonths.includes(item.month));
    
    if (festivalSeasonData.length > 0) {
      const avgEngagement = festivalSeasonData.reduce((sum, item) => sum + item.avg_engagement, 0) / festivalSeasonData.length;
      if (avgEngagement > 0.65) {
        trends.push({
          season: 'festival_season',
          months: festivalMonths,
          average_engagement: avgEngagement,
          content_focus: 'Festival investments and gold',
          recommendation: 'Leverage festival sentiment for investment content'
        });
      }
    }
    
    return trends;
  }

  /**
   * Identify seasonal trends (private helper)
   */
  private identifySeasonalTrendsPrivate(contentData: any[], engagementData: any[]): SeasonalTrend[] {
    const currentMonth = new Date().getMonth();
    const trends: SeasonalTrend[] = [];

    // Tax season (January-March)
    if (currentMonth >= 0 && currentMonth <= 2) {
      trends.push({
        period: 'Tax Season',
        trend_type: 'tax_season',
        engagement_multiplier: 1.5,
        recommended_topics: ['ELSS Funds', '80C Benefits', 'Tax Planning', 'HRA Claims'],
        content_strategy: 'Focus on tax-saving investment options and deadline reminders'
      });
    }

    // Diwali season (October-November)
    if (currentMonth >= 9 && currentMonth <= 10) {
      trends.push({
        period: 'Diwali',
        trend_type: 'festival',
        engagement_multiplier: 1.3,
        recommended_topics: ['Gold Investment', 'Muhurat Trading', 'Festival Bonuses', 'Year-end Planning'],
        content_strategy: 'Leverage festival sentiment for investment decisions'
      });
    }

    // Market events
    trends.push({
      period: 'Regular',
      trend_type: 'regular',
      engagement_multiplier: 1.0,
      recommended_topics: ['SIP Benefits', 'Portfolio Review', 'Market Updates', 'Financial Goals'],
      content_strategy: 'Maintain consistent educational content flow'
    });

    return trends;
  }

  /**
   * Store optimization report
   */
  private async storeOptimizationReport(report: ContentOptimizationReport) {
    try {
      await this.supabase
        .from('content_optimization_reports')
        .insert({
          advisor_id: report.advisor_id,
          period_start: report.analysis_period.start.toISOString(),
          period_end: report.analysis_period.end.toISOString(),
          performance_metrics: report.performance_metrics,
          optimal_posting_times: report.optimal_posting_times,
          topic_recommendations: report.topic_recommendations,
          language_insights: report.language_insights,
          generated_at: report.generated_at.toISOString()
        });
    } catch (error) {
      console.error('Error storing optimization report:', error);
    }
  }

  /**
   * Get historical optimization reports
   */
  async getHistoricalReports(advisorId: string, limit: number = 10): Promise<ContentOptimizationReport[]> {
    const { data, error } = await this.supabase
      .from('content_optimization_reports')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(row => ({
      ...row,
      analysis_period: {
        start: new Date(row.period_start),
        end: new Date(row.period_end)
      },
      generated_at: new Date(row.generated_at)
    })) || [];
  }

  /**
   * Run content optimization for all advisors
   */
  async runBatchOptimization(): Promise<void> {
    const { data: advisors, error } = await this.supabase
      .from('advisors')
      .select('id')
      .eq('is_active', true)
      .in('subscription_tier', ['STANDARD', 'PRO']);

    if (error) throw error;

    // Process in batches
    const batchSize = 10;
    for (let i = 0; i < advisors.length; i += batchSize) {
      const batch = advisors.slice(i, i + batchSize);
      await Promise.all(
        batch.map(advisor => 
          this.generateOptimizationReport(advisor.id).catch(err => 
            console.error(`Failed to optimize content for ${advisor.id}:`, err)
          )
        )
      );
    }
  }

  /**
   * Invalidate cache for an advisor
   */
  async invalidateCache(advisorId: string): Promise<void> {
    const cacheKey = `optimization:${advisorId}`;
    try {
      await redis.del(cacheKey);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }
}

// Export class and singleton instance
export { ContentOptimizer };
export const contentOptimizerService = new ContentOptimizer();