/**
 * Advisor Insights Service
 * AI-powered weekly insights generation for individual advisors
 * Epic: E08-US-001
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { Database } from '@/lib/supabase/database.types';
import { redis } from '@/lib/redis';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

// Types
export interface WeeklyInsight {
  advisor_id: string;
  period: {
    start: Date;
    end: Date;
    week_number: number;
  };
  summary: string;
  key_metrics: {
    content_created: number;
    messages_sent: number;
    delivery_rate: number;
    engagement_rate: number;
    compliance_score: number;
  };
  performance_analysis: {
    content_performance: ContentPerformance;
    best_performing_topics: string[];
    optimal_timing: TimingAnalysis;
    language_preference: LanguageAnalysis;
  };
  ai_recommendations: {
    content_suggestions: string[];
    optimization_opportunities: string[];
    risk_areas: string[];
    action_items: ActionItem[];
  };
  comparative_analysis: {
    vs_previous_week: WeekComparison;
    vs_peer_advisors: PeerComparison;
    industry_benchmarks: BenchmarkComparison;
  };
  health_score: number;
  trend_direction: 'improving' | 'stable' | 'declining';
  generated_at: Date;
}

interface ContentPerformance {
  by_type: Record<string, { sent: number; read_rate: number }>;
  by_topic: Record<string, { sent: number; engagement: number }>;
  by_language: Record<string, { sent: number; performance: number }>;
}

interface TimingAnalysis {
  best_days: string[];
  best_hours: number[];
  engagement_by_time: Record<string, number>;
}

interface LanguageAnalysis {
  primary: string;
  performance_by_language: Record<string, number>;
  recommendation: string;
}

interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  expected_impact: string;
}

interface WeekComparison {
  content_growth: number;
  engagement_change: number;
  compliance_improvement: number;
  key_improvements: string[];
  areas_declined: string[];
}

interface PeerComparison {
  percentile_rank: number;
  above_average_areas: string[];
  below_average_areas: string[];
  peer_group_size: number;
}

interface BenchmarkComparison {
  meets_standards: boolean;
  exceeds_in: string[];
  needs_improvement_in: string[];
}

export class AdvisorInsightsService {
  private supabase;
  private openai: OpenAI;
  private readonly CACHE_TTL = 3600; // 1 hour cache

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
   * Generate weekly insights for an advisor
   */
  async generateWeeklyInsights(advisorId: string, weekOffset: number = 0): Promise<WeeklyInsight> {
    const cacheKey = `weekly_insights:${advisorId}:${weekOffset}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate week period
    const endDate = subDays(new Date(), weekOffset * 7);
    const startDate = startOfWeek(endDate, { weekStartsOn: 1 });
    const endOfWeekDate = endOfWeek(endDate, { weekStartsOn: 1 });

    // Gather all data in parallel
    const [
      advisorData,
      contentData,
      deliveryData,
      complianceData,
      previousWeekData,
      peerData
    ] = await Promise.all([
      this.getAdvisorData(advisorId),
      this.getContentData(advisorId, startDate, endOfWeekDate),
      this.getDeliveryData(advisorId, startDate, endOfWeekDate),
      this.getComplianceData(advisorId, startDate, endOfWeekDate),
      this.getPreviousWeekData(advisorId, weekOffset + 1),
      this.getPeerComparisonData(advisorId)
    ]);

    // Calculate key metrics
    const keyMetrics = this.calculateKeyMetrics(contentData, deliveryData, complianceData);
    
    // Perform performance analysis
    const performanceAnalysis = this.analyzePerformance(contentData, deliveryData);
    
    // Generate AI recommendations
    const aiRecommendations = await this.generateAIRecommendations(
      advisorData,
      keyMetrics,
      performanceAnalysis
    );
    
    // Comparative analysis
    const comparativeAnalysis = this.performComparativeAnalysis(
      keyMetrics,
      previousWeekData,
      peerData
    );
    
    // Calculate health score
    const healthScore = this.calculateHealthScore(keyMetrics, comparativeAnalysis);
    
    // Determine trend
    const trendDirection = this.determineTrend(keyMetrics, previousWeekData);

    const insight: WeeklyInsight = {
      advisor_id: advisorId,
      period: {
        start: startDate,
        end: endOfWeekDate,
        week_number: this.getWeekNumber(startDate)
      },
      summary: await this.generateInsightSummary(keyMetrics, performanceAnalysis, trendDirection),
      key_metrics: keyMetrics,
      performance_analysis: performanceAnalysis,
      ai_recommendations: aiRecommendations,
      comparative_analysis: comparativeAnalysis,
      health_score: healthScore,
      trend_direction: trendDirection,
      generated_at: new Date()
    };

    // Cache the result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(insight));

    // Store in database for historical tracking
    await this.storeInsight(insight);

    return insight;
  }

  /**
   * Get advisor data
   */
  private async getAdvisorData(advisorId: string) {
    const { data, error } = await this.supabase
      .from('advisors')
      .select('*')
      .eq('id', advisorId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get content data for the period
   */
  private async getContentData(advisorId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('content_templates')
      .select('*')
      .eq('advisor_id', advisorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return data || [];
  }

  /**
   * Get delivery data for the period
   */
  private async getDeliveryData(advisorId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('content_history')
      .select('*')
      .eq('advisor_id', advisorId)
      .gte('scheduled_for', format(startDate, 'yyyy-MM-dd'))
      .lte('scheduled_for', format(endDate, 'yyyy-MM-dd'));

    if (error) throw error;
    return data || [];
  }

  /**
   * Get compliance data for the period
   */
  private async getComplianceData(advisorId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('compliance_checks')
      .select('*')
      .eq('advisor_id', advisorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return data || [];
  }

  /**
   * Calculate key metrics from raw data
   */
  private calculateKeyMetrics(contentData: any[], deliveryData: any[], complianceData: any[]) {
    const deliveredCount = deliveryData.filter(d => d.delivery_status === 'DELIVERED').length;
    const sentCount = deliveryData.filter(d => ['DELIVERED', 'SCHEDULED', 'PENDING'].includes(d.delivery_status)).length;
    const approvedCount = complianceData.filter(c => c.final_status === 'APPROVED').length;
    
    // Calculate engagement from delivered messages
    const engagementData = deliveryData.filter(d => d.engagement_metrics);
    const totalEngagement = engagementData.reduce((sum, d) => {
      const metrics = d.engagement_metrics || {};
      return sum + (metrics.read_count || 0);
    }, 0);

    return {
      content_created: contentData.length,
      messages_sent: sentCount,
      delivery_rate: sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0,
      engagement_rate: deliveredCount > 0 ? (totalEngagement / deliveredCount) * 100 : 0,
      compliance_score: complianceData.length > 0 ? (approvedCount / complianceData.length) * 100 : 0
    };
  }

  /**
   * Analyze performance patterns
   */
  private analyzePerformance(contentData: any[], deliveryData: any[]) {
    // Analyze by content type
    const byType: Record<string, { sent: number; read_rate: number }> = {};
    const byTopic: Record<string, { sent: number; engagement: number }> = {};
    const byLanguage: Record<string, { sent: number; performance: number }> = {};

    // Group content by type
    contentData.forEach(content => {
      const type = content.template_type;
      if (!byType[type]) {
        byType[type] = { sent: 0, read_rate: 0 };
      }
      byType[type].sent++;
    });

    // Analyze timing patterns
    const timingData: Record<string, number[]> = {};
    deliveryData.forEach(delivery => {
      if (delivery.delivered_at) {
        const hour = new Date(delivery.delivered_at).getHours();
        const day = format(new Date(delivery.delivered_at), 'EEEE');
        
        if (!timingData[day]) timingData[day] = [];
        timingData[day].push(hour);
      }
    });

    // Find best performing times
    const bestDays = Object.entries(timingData)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([day]) => day);

    const allHours = Object.values(timingData).flat();
    const hourCounts = allHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const bestHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Language analysis
    contentData.forEach(content => {
      const lang = content.language || 'en';
      if (!byLanguage[lang]) {
        byLanguage[lang] = { sent: 0, performance: 0 };
      }
      byLanguage[lang].sent++;
      byLanguage[lang].performance = content.times_used || 0;
    });

    return {
      content_performance: {
        by_type: byType,
        by_topic: byTopic,
        by_language: byLanguage
      },
      best_performing_topics: this.extractTopTopics(contentData),
      optimal_timing: {
        best_days: bestDays,
        best_hours: bestHours,
        engagement_by_time: hourCounts
      },
      language_preference: {
        primary: this.determinePrimaryLanguage(byLanguage),
        performance_by_language: Object.fromEntries(
          Object.entries(byLanguage).map(([lang, data]) => [lang, data.performance])
        ),
        recommendation: this.getLanguageRecommendation(byLanguage)
      }
    };
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateAIRecommendations(
    advisorData: any,
    metrics: any,
    performance: any
  ): Promise<any> {
    const prompt = `
      Based on the following advisor analytics data, generate personalized recommendations:
      
      Advisor Type: ${advisorData.advisor_type}
      Subscription Tier: ${advisorData.subscription_tier}
      
      Key Metrics:
      - Content Created: ${metrics.content_created}
      - Messages Sent: ${metrics.messages_sent}
      - Delivery Rate: ${metrics.delivery_rate.toFixed(1)}%
      - Engagement Rate: ${metrics.engagement_rate.toFixed(1)}%
      - Compliance Score: ${metrics.compliance_score.toFixed(1)}%
      
      Performance Patterns:
      - Best Days: ${performance.optimal_timing.best_days.join(', ')}
      - Best Hours: ${performance.optimal_timing.best_hours.join(', ')}
      - Primary Language: ${performance.language_preference.primary}
      
      Generate:
      1. 3 specific content suggestions based on performance
      2. 3 optimization opportunities to improve engagement
      3. 2 risk areas to monitor
      4. 3 action items with priority levels
      
      Format as JSON with clear, actionable recommendations.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisory analytics expert. Provide actionable, compliance-aware recommendations for Indian financial advisors.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const recommendations = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        content_suggestions: recommendations.content_suggestions || [],
        optimization_opportunities: recommendations.optimization_opportunities || [],
        risk_areas: recommendations.risk_areas || [],
        action_items: recommendations.action_items || []
      };
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return this.getFallbackRecommendations(metrics, performance);
    }
  }

  /**
   * Fallback recommendations if AI fails
   */
  private getFallbackRecommendations(metrics: any, performance: any) {
    const recommendations = {
      content_suggestions: [],
      optimization_opportunities: [],
      risk_areas: [],
      action_items: []
    };

    // Content suggestions based on performance
    if (metrics.engagement_rate < 50) {
      recommendations.content_suggestions.push('Focus on educational content about SIP benefits');
      recommendations.content_suggestions.push('Create simplified market updates in local language');
    }

    if (metrics.delivery_rate < 90) {
      recommendations.optimization_opportunities.push('Verify WhatsApp numbers for better delivery');
      recommendations.optimization_opportunities.push('Schedule messages during peak engagement hours');
    }

    if (metrics.compliance_score < 80) {
      recommendations.risk_areas.push('Review content for SEBI compliance before sending');
      recommendations.risk_areas.push('Avoid making specific return promises');
    }

    recommendations.action_items.push({
      priority: 'high',
      category: 'engagement',
      action: 'Increase posting frequency to daily',
      expected_impact: '20% engagement improvement'
    });

    return recommendations;
  }

  /**
   * Perform comparative analysis
   */
  private performComparativeAnalysis(
    currentMetrics: any,
    previousWeekData: any,
    peerData: any
  ) {
    // Week-over-week comparison
    const weekComparison: WeekComparison = {
      content_growth: previousWeekData ? 
        ((currentMetrics.content_created - previousWeekData.content_created) / previousWeekData.content_created) * 100 : 0,
      engagement_change: previousWeekData ?
        currentMetrics.engagement_rate - previousWeekData.engagement_rate : 0,
      compliance_improvement: previousWeekData ?
        currentMetrics.compliance_score - previousWeekData.compliance_score : 0,
      key_improvements: [],
      areas_declined: []
    };

    if (weekComparison.engagement_change > 5) {
      weekComparison.key_improvements.push('Engagement rate improved');
    }
    if (weekComparison.compliance_improvement > 5) {
      weekComparison.key_improvements.push('Compliance score increased');
    }
    if (weekComparison.content_growth < -10) {
      weekComparison.areas_declined.push('Content creation decreased');
    }

    // Peer comparison
    const peerComparison: PeerComparison = {
      percentile_rank: this.calculatePercentileRank(currentMetrics, peerData),
      above_average_areas: [],
      below_average_areas: [],
      peer_group_size: peerData.length
    };

    if (currentMetrics.engagement_rate > peerData.avgEngagement) {
      peerComparison.above_average_areas.push('Engagement rate');
    }
    if (currentMetrics.compliance_score > peerData.avgCompliance) {
      peerComparison.above_average_areas.push('Compliance adherence');
    }
    if (currentMetrics.content_created < peerData.avgContent) {
      peerComparison.below_average_areas.push('Content volume');
    }

    // Industry benchmarks
    const benchmarkComparison: BenchmarkComparison = {
      meets_standards: currentMetrics.compliance_score >= 85,
      exceeds_in: [],
      needs_improvement_in: []
    };

    if (currentMetrics.delivery_rate > 95) {
      benchmarkComparison.exceeds_in.push('Delivery reliability');
    }
    if (currentMetrics.compliance_score < 85) {
      benchmarkComparison.needs_improvement_in.push('Compliance adherence');
    }

    return {
      vs_previous_week: weekComparison,
      vs_peer_advisors: peerComparison,
      industry_benchmarks: benchmarkComparison
    };
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(metrics: any, comparative: any): number {
    let score = 50; // Base score

    // Metrics contribution (40 points)
    score += (metrics.engagement_rate / 100) * 20;
    score += (metrics.compliance_score / 100) * 15;
    score += (metrics.delivery_rate / 100) * 5;

    // Growth contribution (10 points)
    if (comparative.vs_previous_week.engagement_change > 0) score += 5;
    if (comparative.vs_previous_week.content_growth > 0) score += 5;

    // Cap at 100
    return Math.min(Math.round(score), 100);
  }

  /**
   * Determine trend direction
   */
  private determineTrend(current: any, previous: any): 'improving' | 'stable' | 'declining' {
    if (!previous) return 'stable';

    const engagementDiff = current.engagement_rate - previous.engagement_rate;
    const complianceDiff = current.compliance_score - previous.compliance_score;
    const contentDiff = current.content_created - previous.content_created;

    const totalChange = engagementDiff + complianceDiff + (contentDiff * 5);

    if (totalChange > 10) return 'improving';
    if (totalChange < -10) return 'declining';
    return 'stable';
  }

  /**
   * Generate insight summary using AI
   */
  private async generateInsightSummary(
    metrics: any,
    performance: any,
    trend: string
  ): Promise<string> {
    const prompt = `Generate a concise 2-sentence summary of this advisor's weekly performance:
      - Engagement: ${metrics.engagement_rate.toFixed(1)}%
      - Compliance: ${metrics.compliance_score.toFixed(1)}%
      - Trend: ${trend}
      - Best performing day: ${performance.optimal_timing.best_days[0] || 'N/A'}
      
      Make it positive and actionable.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a brief, encouraging performance summary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      });

      return response.choices[0].message.content || this.getDefaultSummary(metrics, trend);
    } catch (error) {
      return this.getDefaultSummary(metrics, trend);
    }
  }

  /**
   * Default summary if AI fails
   */
  private getDefaultSummary(metrics: any, trend: string): string {
    const trendText = trend === 'improving' ? 'showing improvement' : 
                      trend === 'declining' ? 'needs attention' : 'remains stable';
    
    return `Your performance this week ${trendText} with ${metrics.engagement_rate.toFixed(1)}% engagement rate. ` +
           `Compliance score of ${metrics.compliance_score.toFixed(1)}% demonstrates good adherence to regulations.`;
  }

  /**
   * Helper methods
   */
  private getWeekNumber(date: Date): number {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + firstDay.getDay() + 1) / 7);
  }

  private async getPreviousWeekData(advisorId: string, weekOffset: number) {
    // Fetch previous week metrics from database
    const endDate = subDays(new Date(), weekOffset * 7);
    const startDate = startOfWeek(endDate, { weekStartsOn: 1 });
    const endOfWeekDate = endOfWeek(endDate, { weekStartsOn: 1 });

    const [contentData, deliveryData, complianceData] = await Promise.all([
      this.getContentData(advisorId, startDate, endOfWeekDate),
      this.getDeliveryData(advisorId, startDate, endOfWeekDate),
      this.getComplianceData(advisorId, startDate, endOfWeekDate)
    ]);

    return this.calculateKeyMetrics(contentData, deliveryData, complianceData);
  }

  private async getPeerComparisonData(advisorId: string) {
    // Get anonymized peer data for comparison
    const { data: advisor } = await this.supabase
      .from('advisors')
      .select('subscription_tier, advisor_type')
      .eq('id', advisorId)
      .single();

    if (!advisor) return { length: 0, avgEngagement: 0, avgCompliance: 0, avgContent: 0 };

    // Get similar advisors (same tier and type)
    const { data: peers } = await this.supabase
      .from('advisor_analytics')
      .select('avg_engagement_rate, compliance_pass_rate, total_content_created')
      .eq('subscription_tier', advisor.subscription_tier)
      .neq('advisor_id', advisorId)
      .limit(50);

    if (!peers || peers.length === 0) {
      return { length: 0, avgEngagement: 50, avgCompliance: 80, avgContent: 10 };
    }

    const avgEngagement = peers.reduce((sum, p) => sum + (p.avg_engagement_rate || 0), 0) / peers.length;
    const avgCompliance = peers.reduce((sum, p) => sum + (p.compliance_pass_rate || 0), 0) / peers.length;
    const avgContent = peers.reduce((sum, p) => sum + (p.total_content_created || 0), 0) / peers.length;

    return {
      length: peers.length,
      avgEngagement,
      avgCompliance,
      avgContent
    };
  }

  private calculatePercentileRank(metrics: any, peerData: any): number {
    if (peerData.length === 0) return 50;

    const overallScore = (metrics.engagement_rate + metrics.compliance_score) / 2;
    const peerAvgScore = (peerData.avgEngagement + peerData.avgCompliance) / 2;

    // Simple percentile calculation
    if (overallScore > peerAvgScore * 1.2) return 90;
    if (overallScore > peerAvgScore * 1.1) return 75;
    if (overallScore > peerAvgScore) return 60;
    if (overallScore > peerAvgScore * 0.9) return 40;
    return 25;
  }

  private extractTopTopics(contentData: any[]): string[] {
    const topicCounts: Record<string, number> = {};

    contentData.forEach(content => {
      // Extract topics from content (simplified - in production, use NLP)
      const topics = this.extractTopicsFromContent(content.content);
      topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private extractTopicsFromContent(content: string): string[] {
    const topics = [];
    
    // Simple keyword matching (in production, use proper NLP)
    if (/SIP|systematic investment/i.test(content)) topics.push('SIP');
    if (/mutual fund/i.test(content)) topics.push('Mutual Funds');
    if (/tax|80C|ELSS/i.test(content)) topics.push('Tax Planning');
    if (/market|nifty|sensex/i.test(content)) topics.push('Market Updates');
    if (/retirement|pension/i.test(content)) topics.push('Retirement Planning');
    if (/insurance|term plan|health cover/i.test(content)) topics.push('Insurance');

    return topics.length > 0 ? topics : ['General Advisory'];
  }

  private determinePrimaryLanguage(languageData: Record<string, any>): string {
    const entries = Object.entries(languageData);
    if (entries.length === 0) return 'en';

    return entries.reduce((max, [lang, data]) => 
      data.sent > (languageData[max]?.sent || 0) ? lang : max
    , 'en');
  }

  private getLanguageRecommendation(languageData: Record<string, any>): string {
    const primary = this.determinePrimaryLanguage(languageData);
    const performance = languageData[primary]?.performance || 0;

    if (performance < 50) {
      return `Consider testing content in other languages. Hindi shows strong engagement in similar advisor profiles.`;
    }

    return `Continue with ${primary} as primary language. Performance is above average.`;
  }

  /**
   * Store insight in database for historical tracking
   */
  private async storeInsight(insight: WeeklyInsight) {
    try {
      await this.supabase
        .from('advisor_insights')
        .upsert({
          advisor_id: insight.advisor_id,
          week_start: insight.period.start.toISOString(),
          week_end: insight.period.end.toISOString(),
          week_number: insight.period.week_number,
          summary: insight.summary,
          key_metrics: insight.key_metrics,
          health_score: insight.health_score,
          trend_direction: insight.trend_direction,
          ai_recommendations: insight.ai_recommendations,
          generated_at: insight.generated_at.toISOString()
        });
    } catch (error) {
      console.error('Error storing insight:', error);
    }
  }

  /**
   * Get historical insights for an advisor
   */
  async getHistoricalInsights(advisorId: string, limit: number = 12): Promise<WeeklyInsight[]> {
    const { data, error } = await this.supabase
      .from('advisor_insights')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(row => ({
      ...row,
      period: {
        start: new Date(row.week_start),
        end: new Date(row.week_end),
        week_number: row.week_number
      },
      generated_at: new Date(row.generated_at)
    })) || [];
  }

  /**
   * Generate insights for all active advisors (scheduled job)
   */
  async generateAllWeeklyInsights(): Promise<void> {
    const { data: advisors, error } = await this.supabase
      .from('advisors')
      .select('id')
      .eq('is_active', true)
      .in('subscription_tier', ['BASIC', 'STANDARD', 'PRO']);

    if (error) throw error;

    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < advisors.length; i += batchSize) {
      const batch = advisors.slice(i, i + batchSize);
      await Promise.all(
        batch.map(advisor => 
          this.generateWeeklyInsights(advisor.id).catch(err => 
            console.error(`Failed to generate insights for ${advisor.id}:`, err)
          )
        )
      );
    }
  }
}

// Export singleton instance
export const advisorInsightsService = new AdvisorInsightsService();