// Churn Prediction Model
// ML-based advisor health scoring and churn risk analysis

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { ChurnPrediction, AnalyticsResponse } from '@/lib/types/analytics';

interface AdvisorBehaviorFeatures {
  advisor_id: string;
  
  // Engagement Features
  content_creation_frequency: number; // pieces per week
  days_since_last_content: number;
  engagement_trend: number; // -1 to 1, negative = declining
  content_approval_rate: number; // 0-1
  
  // Usage Features
  login_frequency: number; // days per week
  feature_adoption_score: number; // 0-1
  whatsapp_integration_usage: number; // 0-1
  
  // Business Features
  subscription_tier_value: number; // 1=basic, 2=standard, 3=pro
  payment_history_score: number; // 0-1, 1 = perfect payment history
  days_overdue: number;
  tier_changes: number; // upgrades/downgrades in last 90 days
  
  // Support Features
  support_tickets: number; // in last 30 days
  negative_sentiment_score: number; // 0-1
  resolution_satisfaction: number; // 0-1
  
  // Cohort Features
  days_since_signup: number;
  onboarding_completion: number; // 0-1
  
  // Calculated at time of prediction
  calculated_at: Date;
}

export class ChurnPredictionModel {
  private supabase;
  private modelWeights = {
    content_creation_frequency: 0.15,
    days_since_last_content: 0.12,
    engagement_trend: 0.18,
    content_approval_rate: 0.08,
    login_frequency: 0.10,
    feature_adoption_score: 0.08,
    payment_history_score: 0.15,
    days_overdue: 0.08,
    support_tickets: 0.06
  };

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Predict churn risk for a specific advisor
   */
  async predictAdvisorChurn(advisorId: string): Promise<AnalyticsResponse<ChurnPrediction>> {
    const startTime = Date.now();

    try {
      // Extract behavioral features
      const features = await this.extractBehavioralFeatures(advisorId);
      
      // Calculate risk scores
      const churnPrediction = await this.calculateChurnRisk(advisorId, features);

      return {
        success: true,
        data: churnPrediction,
        generated_at: new Date().toISOString(),
        metadata: {
          query_time_ms: Date.now() - startTime,
          data_points: 1,
          confidence_score: churnPrediction.prediction_confidence
        }
      };
    } catch (error) {
      console.error('Error predicting advisor churn:', error);
      return {
        success: false,
        data: {} as ChurnPrediction,
        generated_at: new Date().toISOString(),
        metadata: {
          query_time_ms: Date.now() - startTime,
          data_points: 0
        }
      };
    }
  }

  /**
   * Get platform-wide churn risk analysis
   */
  async getPlatformChurnAnalysis(): Promise<{
    total_advisors: number;
    risk_distribution: {
      excellent: number;
      good: number;
      needs_attention: number;
      at_risk: number;
      critical: number;
    };
    intervention_pipeline: {
      high_priority: ChurnPrediction[];
      medium_priority: ChurnPrediction[];
      automated_actions: number;
    };
  }> {
    try {
      // Get all active advisors
      const { data: advisors, error } = await this.supabase
        .from('advisors')
        .select('id')
        .eq('subscription_tier', 'basic')
        .or('subscription_tier.eq.standard,subscription_tier.eq.pro');

      if (error || !advisors) {
        throw error;
      }

      // Batch predict churn for all advisors
      const predictions = await Promise.all(
        advisors.map(advisor => this.predictAdvisorChurn(advisor.id))
      );

      const successfulPredictions = predictions
        .filter(p => p.success)
        .map(p => p.data);

      // Categorize by risk level
      const riskDistribution = {
        excellent: successfulPredictions.filter(p => p.risk_category === 'excellent').length,
        good: successfulPredictions.filter(p => p.risk_category === 'good').length,
        needs_attention: successfulPredictions.filter(p => p.risk_category === 'needs_attention').length,
        at_risk: successfulPredictions.filter(p => p.risk_category === 'at_risk').length,
        critical: successfulPredictions.filter(p => p.risk_category === 'critical').length
      };

      // Identify intervention priorities
      const highPriority = successfulPredictions
        .filter(p => p.risk_category === 'critical' || p.risk_category === 'at_risk')
        .sort((a, b) => b.churn_risk_30_day - a.churn_risk_30_day);

      const mediumPriority = successfulPredictions
        .filter(p => p.risk_category === 'needs_attention')
        .sort((a, b) => b.churn_risk_30_day - a.churn_risk_30_day);

      // Count automated actions triggered
      const automatedActions = highPriority.reduce((count, prediction) => 
        count + prediction.recommended_actions.filter(action => 
          action.action_type === 'proactive_outreach' || 
          action.action_type === 'retention_offer'
        ).length, 0
      );

      return {
        total_advisors: advisors.length,
        risk_distribution: riskDistribution,
        intervention_pipeline: {
          high_priority: highPriority.slice(0, 20), // Top 20 critical cases
          medium_priority: mediumPriority.slice(0, 30), // Top 30 medium cases
          automated_actions: automatedActions
        }
      };
    } catch (error) {
      console.error('Error getting platform churn analysis:', error);
      return {
        total_advisors: 0,
        risk_distribution: {
          excellent: 0, good: 0, needs_attention: 0, at_risk: 0, critical: 0
        },
        intervention_pipeline: {
          high_priority: [],
          medium_priority: [],
          automated_actions: 0
        }
      };
    }
  }

  /**
   * Execute automated retention interventions
   */
  async executeRetentionInterventions(predictions: ChurnPrediction[]): Promise<{
    interventions_executed: number;
    success_rate: number;
    actions_taken: string[];
  }> {
    const actionsExecuted: string[] = [];
    let successCount = 0;

    for (const prediction of predictions) {
      if (prediction.risk_category === 'critical' || prediction.risk_category === 'at_risk') {
        // Execute high-priority actions
        for (const action of prediction.recommended_actions.filter(a => a.priority === 'high')) {
          try {
            await this.executeRetentionAction(prediction.advisor_id, action);
            actionsExecuted.push(`${action.action_type} for ${prediction.advisor_id}`);
            successCount++;
          } catch (error) {
            console.error(`Failed to execute ${action.action_type} for ${prediction.advisor_id}:`, error);
          }
        }
      }
    }

    return {
      interventions_executed: actionsExecuted.length,
      success_rate: actionsExecuted.length > 0 ? successCount / actionsExecuted.length : 0,
      actions_taken: actionsExecuted
    };
  }

  // Private methods for feature extraction and risk calculation

  private async extractBehavioralFeatures(advisorId: string): Promise<AdvisorBehaviorFeatures> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Fetch advisor data
    const { data: advisor, error: advisorError } = await this.supabase
      .from('advisors')
      .select('*')
      .eq('id', advisorId)
      .single();

    if (advisorError || !advisor) {
      throw new Error('Advisor not found');
    }

    // Fetch content creation data (last 30 days)
    const { data: recentContent, error: contentError } = await this.supabase
      .from('content')
      .select('*')
      .eq('advisor_id', advisorId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (contentError) throw contentError;

    // Fetch subscription data for payment history
    const { data: subscriptions, error: subError } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: false });

    if (subError) throw subError;

    // Calculate content creation features
    const contentCount = recentContent?.length || 0;
    const contentFrequency = contentCount / 4.33; // per week (30 days / 7)
    
    const lastContentDate = recentContent && recentContent.length > 0
      ? new Date(Math.max(...recentContent.map(c => new Date(c.created_at).getTime())))
      : new Date(0);
    const daysSinceLastContent = (now.getTime() - lastContentDate.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate approval rate
    const approvedContent = recentContent?.filter(c => c.is_approved).length || 0;
    const approvalRate = contentCount > 0 ? approvedContent / contentCount : 0;

    // Calculate engagement trend (simplified - would need more historical data)
    const recentEngagement = this.calculateEngagementScore(recentContent || []);
    const engagementTrend = 0; // Would compare with previous periods

    // Calculate payment history score
    const activeSubscription = subscriptions?.[0];
    const paymentHistoryScore = this.calculatePaymentScore(activeSubscription);
    const daysOverdue = this.calculateOverdueDays(activeSubscription);

    // Tier value mapping
    const tierValue = advisor.subscription_tier === 'pro' ? 3 
      : advisor.subscription_tier === 'standard' ? 2 
      : 1;

    // Days since signup
    const signupDate = new Date(advisor.created_at);
    const daysSinceSignup = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24);

    return {
      advisor_id: advisorId,
      content_creation_frequency: contentFrequency,
      days_since_last_content: Math.min(daysSinceLastContent, 30), // Cap at 30 days
      engagement_trend: engagementTrend,
      content_approval_rate: approvalRate,
      login_frequency: 5, // Mock - would track actual login data
      feature_adoption_score: advisor.whatsapp_verified ? 0.8 : 0.4, // Simplified
      whatsapp_integration_usage: advisor.whatsapp_verified ? 0.9 : 0,
      subscription_tier_value: tierValue,
      payment_history_score: paymentHistoryScore,
      days_overdue: daysOverdue,
      tier_changes: 0, // Would track tier change history
      support_tickets: 0, // Would integrate with support system
      negative_sentiment_score: 0, // Would analyze support ticket sentiment
      resolution_satisfaction: 0.8, // Default assumption
      days_since_signup: daysSinceSignup,
      onboarding_completion: advisor.whatsapp_verified ? 0.9 : 0.6, // Simplified
      calculated_at: now
    };
  }

  private async calculateChurnRisk(advisorId: string, features: AdvisorBehaviorFeatures): Promise<ChurnPrediction> {
    // Normalize features to 0-1 scale
    const normalizedFeatures = this.normalizeFeatures(features);
    
    // Calculate base risk scores using weighted features
    const baseRiskScore = this.calculateBaseRiskScore(normalizedFeatures);
    
    // Calculate time-specific risks
    const risk30Day = this.calculateTimeSpecificRisk(baseRiskScore, 30);
    const risk60Day = this.calculateTimeSpecificRisk(baseRiskScore, 60);
    const risk90Day = this.calculateTimeSpecificRisk(baseRiskScore, 90);
    
    // Calculate overall health score (inverse of risk)
    const healthScore = Math.round((1 - baseRiskScore) * 100);
    
    // Determine risk category
    const riskCategory = this.categorizeRisk(healthScore);
    
    // Identify specific risk factors
    const riskFactors = this.identifyRiskFactors(features, normalizedFeatures);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(riskFactors, riskCategory);
    
    return {
      advisor_id: advisorId,
      churn_risk_30_day: Math.round(risk30Day * 100),
      churn_risk_60_day: Math.round(risk60Day * 100),
      churn_risk_90_day: Math.round(risk90Day * 100),
      overall_health_score: healthScore,
      risk_category: riskCategory,
      risk_factors: riskFactors,
      recommended_actions: recommendations,
      model_version: '1.0.0',
      prediction_confidence: this.calculateConfidence(features),
      last_updated: new Date().toISOString()
    };
  }

  private normalizeFeatures(features: AdvisorBehaviorFeatures): { [key: string]: number } {
    return {
      content_creation_frequency: Math.min(features.content_creation_frequency / 5, 1), // Normalize to 5 posts/week max
      days_since_last_content: Math.max(0, 1 - (features.days_since_last_content / 14)), // 14 days max
      engagement_trend: (features.engagement_trend + 1) / 2, // -1 to 1 -> 0 to 1
      content_approval_rate: features.content_approval_rate,
      login_frequency: Math.min(features.login_frequency / 7, 1), // 7 days/week max
      feature_adoption_score: features.feature_adoption_score,
      payment_history_score: features.payment_history_score,
      days_overdue: Math.max(0, 1 - (features.days_overdue / 30)), // 30 days max penalty
      support_tickets: Math.max(0, 1 - (features.support_tickets / 5)) // 5 tickets max penalty
    };
  }

  private calculateBaseRiskScore(normalizedFeatures: { [key: string]: number }): number {
    let riskScore = 0;
    
    // Higher values = lower risk, so invert for risk calculation
    for (const [feature, weight] of Object.entries(this.modelWeights)) {
      const featureValue = normalizedFeatures[feature] || 0;
      riskScore += (1 - featureValue) * weight; // Invert: low feature value = high risk
    }
    
    return Math.min(Math.max(riskScore, 0), 1); // Clamp to 0-1
  }

  private calculateTimeSpecificRisk(baseRiskScore: number, days: number): number {
    // Apply time-based multipliers
    const timeMultipliers = { 30: 0.8, 60: 1.0, 90: 1.2 };
    const multiplier = timeMultipliers[days as keyof typeof timeMultipliers] || 1.0;
    
    return Math.min(baseRiskScore * multiplier, 1);
  }

  private categorizeRisk(healthScore: number): 'excellent' | 'good' | 'needs_attention' | 'at_risk' | 'critical' {
    if (healthScore >= 90) return 'excellent';
    if (healthScore >= 80) return 'good';
    if (healthScore >= 70) return 'needs_attention';
    if (healthScore >= 50) return 'at_risk';
    return 'critical';
  }

  private identifyRiskFactors(features: AdvisorBehaviorFeatures, normalized: { [key: string]: number }): any {
    return {
      declining_engagement: {
        score: Math.round((1 - normalized.content_creation_frequency) * 100),
        description: `Content creation frequency: ${features.content_creation_frequency.toFixed(1)} posts/week`,
        trend: features.engagement_trend
      },
      payment_issues: {
        score: Math.round((1 - normalized.payment_history_score) * 100),
        failed_payments: 0, // Would track from payment history
        overdue_days: features.days_overdue
      },
      support_escalations: {
        score: Math.round((1 - normalized.support_tickets) * 100),
        ticket_count: features.support_tickets,
        negative_sentiment: features.negative_sentiment_score
      },
      content_creation_drop: {
        score: Math.round((1 - normalized.days_since_last_content) * 100),
        days_since_last_content: features.days_since_last_content,
        trend: features.content_creation_frequency < 1 ? -50 : 0
      },
      feature_adoption: {
        score: Math.round((1 - normalized.feature_adoption_score) * 100),
        unused_features: features.whatsapp_integration_usage < 0.5 ? ['WhatsApp Integration'] : [],
        adoption_rate: features.feature_adoption_score
      }
    };
  }

  private generateRecommendations(riskFactors: any, riskCategory: string): any[] {
    const recommendations = [];

    if (riskCategory === 'critical' || riskCategory === 'at_risk') {
      recommendations.push({
        priority: 'high' as const,
        action_type: 'proactive_outreach' as const,
        description: 'Immediate personal outreach to understand challenges and provide support',
        expected_impact: 70
      });

      if (riskFactors.payment_issues.score > 50) {
        recommendations.push({
          priority: 'high' as const,
          action_type: 'retention_offer' as const,
          description: 'Offer payment plan or temporary discount to address payment issues',
          expected_impact: 60
        });
      }
    }

    if (riskFactors.content_creation_drop.score > 60) {
      recommendations.push({
        priority: 'medium' as const,
        action_type: 'onboarding_refresh' as const,
        description: 'Provide content creation tips and re-engagement workflow',
        expected_impact: 45
      });
    }

    if (riskCategory !== 'excellent') {
      recommendations.push({
        priority: 'low' as const,
        action_type: 'priority_support' as const,
        description: 'Fast-track any support tickets and provide proactive assistance',
        expected_impact: 30
      });
    }

    return recommendations;
  }

  private calculateEngagementScore(content: any[]): number {
    if (content.length === 0) return 0;
    
    const avgComplianceScore = content.reduce((sum, c) => sum + c.compliance_score, 0) / content.length;
    const approvalRate = content.filter(c => c.is_approved).length / content.length;
    
    return (avgComplianceScore / 100) * 0.6 + approvalRate * 0.4;
  }

  private calculatePaymentScore(subscription: any): number {
    if (!subscription) return 0.5; // Neutral score for no subscription data
    
    if (subscription.status === 'active') return 1.0;
    if (subscription.status === 'trial') return 0.8;
    if (subscription.status === 'cancelled') return 0.2;
    if (subscription.status === 'expired') return 0.1;
    
    return 0.5;
  }

  private calculateOverdueDays(subscription: any): number {
    if (!subscription || subscription.status === 'active') return 0;
    
    if (subscription.status === 'expired') {
      const expiryDate = new Date(subscription.expires_at);
      const now = new Date();
      return Math.max(0, (now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return 0;
  }

  private calculateConfidence(features: AdvisorBehaviorFeatures): number {
    // Confidence based on data completeness and recency
    let confidence = 0.5; // Base confidence
    
    // Boost confidence with more recent activity
    if (features.days_since_last_content < 7) confidence += 0.2;
    if (features.content_creation_frequency > 1) confidence += 0.15;
    if (features.feature_adoption_score > 0.7) confidence += 0.1;
    if (features.days_since_signup > 30) confidence += 0.05; // More historical data
    
    return Math.min(confidence, 1.0);
  }

  private async executeRetentionAction(advisorId: string, action: any): Promise<void> {
    // Implementation would depend on action type
    console.log(`Executing ${action.action_type} for advisor ${advisorId}`);
    
    switch (action.action_type) {
      case 'proactive_outreach':
        // Would trigger email/SMS to advisor
        // await this.sendProactiveOutreach(advisorId);
        break;
      case 'retention_offer':
        // Would create special pricing offer
        // await this.createRetentionOffer(advisorId);
        break;
      case 'onboarding_refresh':
        // Would trigger re-onboarding workflow
        // await this.triggerOnboardingRefresh(advisorId);
        break;
      case 'priority_support':
        // Would flag advisor for priority support
        // await this.setPrioritySupport(advisorId);
        break;
    }
  }
}

// Export singleton instance
export const churnPredictionModel = new ChurnPredictionModel();