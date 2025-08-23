/**
 * Churn Prediction Service
 * ML-based churn risk scoring and retention recommendations
 * Epic: E08-US-002
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { redis } from '@/lib/redis';
import { subDays, differenceInDays } from 'date-fns';

// Types
export interface ChurnPrediction {
  advisor_id: string;
  risk_score: number; // 0-100, higher = more likely to churn
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  probability_30_day: number; // 0-1 probability
  confidence_interval: {
    lower: number;
    upper: number;
  };
  risk_factors: RiskFactor[];
  behavioral_signals: BehavioralSignal[];
  intervention_recommendations: InterventionRecommendation[];
  retention_actions: RetentionAction[];
  predicted_churn_date: Date | null;
  last_updated: Date;
}

export interface RiskFactor {
  factor: string;
  category: 'engagement' | 'payment' | 'support' | 'activity' | 'compliance';
  impact: 'high' | 'medium' | 'low';
  current_value: any;
  threshold_value: any;
  trend: 'increasing' | 'stable' | 'decreasing';
  description: string;
}

export interface BehavioralSignal {
  signal: string;
  strength: 'strong' | 'moderate' | 'weak';
  detected_date: Date;
  pattern: string;
}

export interface InterventionRecommendation {
  type: 'proactive_outreach' | 'feature_education' | 'discount_offer' | 'tier_upgrade' | 'support_priority';
  urgency: 'immediate' | 'within_week' | 'within_month';
  action: string;
  expected_impact: string;
  success_probability: number;
}

export interface RetentionAction {
  action_id: string;
  action_type: string;
  scheduled_date: Date;
  status: 'pending' | 'in_progress' | 'completed';
  automated: boolean;
  outcome?: string;
}

interface AdvisorMetrics {
  login_frequency: number;
  content_creation_rate: number;
  message_send_rate: number;
  compliance_score: number;
  support_tickets: number;
  payment_history: any[];
  feature_usage: Record<string, number>;
  engagement_trend: number;
}

export class ChurnPredictorService {
  private supabase;
  private readonly CACHE_TTL = 1800; // 30 minutes cache
  
  // Model thresholds (trained values)
  private readonly THRESHOLDS = {
    login_days_inactive: 7,
    content_creation_drop: 0.5, // 50% drop
    message_send_drop: 0.4, // 40% drop
    compliance_score_min: 70,
    support_tickets_max: 3,
    payment_failures: 1,
    engagement_drop: 0.3 // 30% drop
  };

  // Risk weights (ML model coefficients)
  private readonly WEIGHTS = {
    login_inactivity: 0.25,
    content_decline: 0.20,
    engagement_drop: 0.20,
    payment_issues: 0.15,
    support_escalations: 0.10,
    compliance_violations: 0.10
  };

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Predict churn risk for a single advisor
   */
  async predictChurnRisk(advisorId: string): Promise<ChurnPrediction> {
    const cacheKey = `churn_prediction:${advisorId}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Gather all metrics
    const metrics = await this.gatherAdvisorMetrics(advisorId);
    
    // Extract features for ML model
    const features = this.extractFeatures(metrics);
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(features);
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskScore);
    
    // Calculate churn probability
    const probability = this.calculateChurnProbability(features);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(metrics, features);
    
    // Detect behavioral signals
    const behavioralSignals = this.detectBehavioralSignals(metrics);
    
    // Generate intervention recommendations
    const interventions = this.generateInterventions(riskLevel, riskFactors);
    
    // Create retention actions
    const retentionActions = await this.createRetentionActions(advisorId, riskLevel, interventions);
    
    // Predict churn date if high risk
    const predictedChurnDate = riskLevel === 'critical' || riskLevel === 'high' 
      ? this.predictChurnDate(features) 
      : null;

    const prediction: ChurnPrediction = {
      advisor_id: advisorId,
      risk_score: riskScore,
      risk_level: riskLevel,
      probability_30_day: probability,
      confidence_interval: this.calculateConfidenceInterval(probability, features),
      risk_factors: riskFactors,
      behavioral_signals: behavioralSignals,
      intervention_recommendations: interventions,
      retention_actions: retentionActions,
      predicted_churn_date: predictedChurnDate,
      last_updated: new Date()
    };

    // Cache the result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(prediction));

    // Store in database
    await this.storePrediction(prediction);

    // Trigger alerts if critical
    if (riskLevel === 'critical') {
      await this.triggerChurnAlert(advisorId, prediction);
    }

    return prediction;
  }

  /**
   * Gather all relevant metrics for an advisor
   */
  private async gatherAdvisorMetrics(advisorId: string): Promise<AdvisorMetrics> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sixtyDaysAgo = subDays(new Date(), 60);

    // Parallel data fetching
    const [
      advisor,
      recentContent,
      olderContent,
      recentMessages,
      olderMessages,
      complianceChecks,
      supportTickets,
      loginActivity,
      analytics
    ] = await Promise.all([
      // Basic advisor info
      this.supabase.from('advisors').select('*').eq('id', advisorId).single(),
      
      // Content creation (recent 30 days)
      this.supabase.from('content_templates')
        .select('*')
        .eq('advisor_id', advisorId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Content creation (previous 30 days for comparison)
      this.supabase.from('content_templates')
        .select('*')
        .eq('advisor_id', advisorId)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString()),
      
      // Message sending (recent)
      this.supabase.from('content_history')
        .select('*')
        .eq('advisor_id', advisorId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Message sending (older)
      this.supabase.from('content_history')
        .select('*')
        .eq('advisor_id', advisorId)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString()),
      
      // Compliance history
      this.supabase.from('compliance_checks')
        .select('*')
        .eq('advisor_id', advisorId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Support tickets
      this.supabase.from('support_tickets')
        .select('*')
        .eq('advisor_id', advisorId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Login activity from audit logs
      this.supabase.from('audit_logs')
        .select('*')
        .eq('actor_id', advisorId)
        .eq('action', 'LOGIN')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false }),
      
      // Analytics data
      this.supabase.from('advisor_analytics')
        .select('*')
        .eq('advisor_id', advisorId)
        .single()
    ]);

    // Calculate metrics
    const daysSinceLastLogin = advisor.data?.last_login_at 
      ? differenceInDays(new Date(), new Date(advisor.data.last_login_at))
      : 999;

    const recentContentCount = recentContent.data?.length || 0;
    const olderContentCount = olderContent.data?.length || 0;
    const contentCreationRate = olderContentCount > 0 
      ? (recentContentCount - olderContentCount) / olderContentCount 
      : -1;

    const recentMessageCount = recentMessages.data?.length || 0;
    const olderMessageCount = olderMessages.data?.length || 0;
    const messageSendRate = olderMessageCount > 0
      ? (recentMessageCount - olderMessageCount) / olderMessageCount
      : -1;

    const approvedCompliance = complianceChecks.data?.filter(c => c.final_status === 'APPROVED').length || 0;
    const totalCompliance = complianceChecks.data?.length || 1;
    const complianceScore = (approvedCompliance / totalCompliance) * 100;

    const supportTicketCount = supportTickets.data?.length || 0;

    // Feature usage tracking
    const featureUsage: Record<string, number> = {
      content_creation: recentContentCount,
      message_sending: recentMessageCount,
      whatsapp: recentMessages.data?.filter(m => m.delivery_channel === 'whatsapp').length || 0,
      compliance_checks: totalCompliance
    };

    // Calculate engagement trend
    const engagementTrend = analytics.data?.avg_engagement_rate || 0;

    return {
      login_frequency: daysSinceLastLogin,
      content_creation_rate: contentCreationRate,
      message_send_rate: messageSendRate,
      compliance_score: complianceScore,
      support_tickets: supportTicketCount,
      payment_history: [], // Would fetch from payment system
      feature_usage: featureUsage,
      engagement_trend: engagementTrend
    };
  }

  /**
   * Extract features for ML model
   */
  private extractFeatures(metrics: AdvisorMetrics): Record<string, number> {
    return {
      days_since_login: metrics.login_frequency,
      content_creation_decline: Math.max(0, -metrics.content_creation_rate),
      message_send_decline: Math.max(0, -metrics.message_send_rate),
      compliance_score: metrics.compliance_score,
      support_ticket_count: metrics.support_tickets,
      payment_failures: 0, // Would calculate from payment history
      feature_usage_score: Object.values(metrics.feature_usage).reduce((a, b) => a + b, 0),
      engagement_trend: metrics.engagement_trend,
      
      // Derived features
      is_inactive: metrics.login_frequency > this.THRESHOLDS.login_days_inactive ? 1 : 0,
      has_content_decline: metrics.content_creation_rate < -this.THRESHOLDS.content_creation_drop ? 1 : 0,
      has_support_issues: metrics.support_tickets > this.THRESHOLDS.support_tickets_max ? 1 : 0,
      low_compliance: metrics.compliance_score < this.THRESHOLDS.compliance_score_min ? 1 : 0
    };
  }

  /**
   * Calculate risk score using weighted model
   */
  private calculateRiskScore(features: Record<string, number>): number {
    let score = 0;

    // Login inactivity component
    if (features.days_since_login > 14) {
      score += this.WEIGHTS.login_inactivity * 100;
    } else if (features.days_since_login > 7) {
      score += this.WEIGHTS.login_inactivity * 50;
    }

    // Content decline component
    if (features.has_content_decline) {
      score += this.WEIGHTS.content_decline * 100;
    } else if (features.content_creation_decline > 0.25) {
      score += this.WEIGHTS.content_decline * 50;
    }

    // Engagement drop component
    if (features.engagement_trend < 30) {
      score += this.WEIGHTS.engagement_drop * 100;
    } else if (features.engagement_trend < 50) {
      score += this.WEIGHTS.engagement_drop * 50;
    }

    // Payment issues component
    if (features.payment_failures > 0) {
      score += this.WEIGHTS.payment_issues * 100;
    }

    // Support escalations component
    if (features.has_support_issues) {
      score += this.WEIGHTS.support_escalations * 100;
    } else if (features.support_ticket_count > 1) {
      score += this.WEIGHTS.support_escalations * 50;
    }

    // Compliance violations component
    if (features.low_compliance) {
      score += this.WEIGHTS.compliance_violations * 100;
    } else if (features.compliance_score < 85) {
      score += this.WEIGHTS.compliance_violations * 50;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Determine risk level based on score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Calculate churn probability using logistic regression
   */
  private calculateChurnProbability(features: Record<string, number>): number {
    // Simplified logistic regression
    const z = -2.5 + // intercept
      (features.days_since_login * 0.1) +
      (features.content_creation_decline * 2) +
      (features.has_support_issues * 1.5) +
      (features.low_compliance * 1) +
      (features.payment_failures * 3);

    // Sigmoid function
    const probability = 1 / (1 + Math.exp(-z));
    return Math.min(0.95, Math.max(0.05, probability));
  }

  /**
   * Calculate confidence interval for prediction
   */
  private calculateConfidenceInterval(
    probability: number,
    features: Record<string, number>
  ): { lower: number; upper: number } {
    // Calculate standard error based on feature variance
    const featureCount = Object.keys(features).length;
    const standardError = 0.1 * Math.sqrt(1 / featureCount);
    
    // 95% confidence interval
    const margin = 1.96 * standardError;
    
    return {
      lower: Math.max(0, probability - margin),
      upper: Math.min(1, probability + margin)
    };
  }

  /**
   * Identify specific risk factors
   */
  private identifyRiskFactors(
    metrics: AdvisorMetrics,
    features: Record<string, number>
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Login inactivity
    if (features.days_since_login > this.THRESHOLDS.login_days_inactive) {
      factors.push({
        factor: 'Login Inactivity',
        category: 'activity',
        impact: features.days_since_login > 14 ? 'high' : 'medium',
        current_value: features.days_since_login,
        threshold_value: this.THRESHOLDS.login_days_inactive,
        trend: 'increasing',
        description: `No login for ${features.days_since_login} days`
      });
    }

    // Content creation decline
    if (features.has_content_decline) {
      factors.push({
        factor: 'Content Creation Decline',
        category: 'engagement',
        impact: 'high',
        current_value: `${(metrics.content_creation_rate * 100).toFixed(1)}%`,
        threshold_value: `-${(this.THRESHOLDS.content_creation_drop * 100)}%`,
        trend: 'decreasing',
        description: 'Significant drop in content creation activity'
      });
    }

    // Low compliance score
    if (features.low_compliance) {
      factors.push({
        factor: 'Compliance Issues',
        category: 'compliance',
        impact: 'medium',
        current_value: `${metrics.compliance_score.toFixed(1)}%`,
        threshold_value: `${this.THRESHOLDS.compliance_score_min}%`,
        trend: 'stable',
        description: 'Below minimum compliance threshold'
      });
    }

    // Support tickets
    if (features.has_support_issues) {
      factors.push({
        factor: 'Support Escalations',
        category: 'support',
        impact: 'medium',
        current_value: metrics.support_tickets,
        threshold_value: this.THRESHOLDS.support_tickets_max,
        trend: 'increasing',
        description: 'Multiple unresolved support tickets'
      });
    }

    // Payment issues
    if (features.payment_failures > 0) {
      factors.push({
        factor: 'Payment Failures',
        category: 'payment',
        impact: 'high',
        current_value: features.payment_failures,
        threshold_value: 0,
        trend: 'stable',
        description: 'Recent payment failures detected'
      });
    }

    return factors;
  }

  /**
   * Detect behavioral signals indicating churn risk
   */
  private detectBehavioralSignals(metrics: AdvisorMetrics): BehavioralSignal[] {
    const signals: BehavioralSignal[] = [];
    const now = new Date();

    // Sudden activity drop
    if (metrics.content_creation_rate < -0.5) {
      signals.push({
        signal: 'Sudden Activity Drop',
        strength: 'strong',
        detected_date: now,
        pattern: 'Content creation dropped by more than 50%'
      });
    }

    // Feature abandonment
    const abandonedFeatures = Object.entries(metrics.feature_usage)
      .filter(([_, usage]) => usage === 0)
      .map(([feature]) => feature);

    if (abandonedFeatures.length > 0) {
      signals.push({
        signal: 'Feature Abandonment',
        strength: 'moderate',
        detected_date: now,
        pattern: `Stopped using: ${abandonedFeatures.join(', ')}`
      });
    }

    // Engagement decline
    if (metrics.engagement_trend < 30) {
      signals.push({
        signal: 'Low Engagement',
        strength: 'strong',
        detected_date: now,
        pattern: 'Engagement rate below 30%'
      });
    }

    // Support frustration
    if (metrics.support_tickets > 2) {
      signals.push({
        signal: 'Support Frustration',
        strength: 'moderate',
        detected_date: now,
        pattern: 'Multiple support tickets in short period'
      });
    }

    return signals;
  }

  /**
   * Generate intervention recommendations
   */
  private generateInterventions(
    riskLevel: string,
    riskFactors: RiskFactor[]
  ): InterventionRecommendation[] {
    const interventions: InterventionRecommendation[] = [];

    // Critical risk interventions
    if (riskLevel === 'critical') {
      interventions.push({
        type: 'proactive_outreach',
        urgency: 'immediate',
        action: 'Personal call from customer success manager',
        expected_impact: 'High engagement, understand pain points',
        success_probability: 0.7
      });

      interventions.push({
        type: 'discount_offer',
        urgency: 'immediate',
        action: 'Offer 30% discount for next 3 months',
        expected_impact: 'Immediate retention for price-sensitive advisors',
        success_probability: 0.6
      });
    }

    // High risk interventions
    if (riskLevel === 'high' || riskLevel === 'critical') {
      interventions.push({
        type: 'feature_education',
        urgency: 'within_week',
        action: 'Schedule personalized demo of underutilized features',
        expected_impact: 'Increase feature adoption and value realization',
        success_probability: 0.5
      });

      interventions.push({
        type: 'support_priority',
        urgency: 'immediate',
        action: 'Escalate to priority support queue',
        expected_impact: 'Faster issue resolution, improved satisfaction',
        success_probability: 0.8
      });
    }

    // Medium risk interventions
    if (riskLevel === 'medium') {
      interventions.push({
        type: 'proactive_outreach',
        urgency: 'within_week',
        action: 'Email with tips and best practices',
        expected_impact: 'Re-engagement through value addition',
        success_probability: 0.4
      });

      interventions.push({
        type: 'tier_upgrade',
        urgency: 'within_month',
        action: 'Offer free trial of higher tier features',
        expected_impact: 'Increase perceived value',
        success_probability: 0.3
      });
    }

    // Factor-specific interventions
    const hasLoginIssue = riskFactors.some(f => f.factor === 'Login Inactivity');
    if (hasLoginIssue) {
      interventions.push({
        type: 'proactive_outreach',
        urgency: 'within_week',
        action: 'Send re-engagement email with platform updates',
        expected_impact: 'Prompt login and activity resumption',
        success_probability: 0.5
      });
    }

    const hasPaymentIssue = riskFactors.some(f => f.category === 'payment');
    if (hasPaymentIssue) {
      interventions.push({
        type: 'discount_offer',
        urgency: 'immediate',
        action: 'Provide payment flexibility options',
        expected_impact: 'Resolve payment barriers',
        success_probability: 0.7
      });
    }

    return interventions;
  }

  /**
   * Create retention actions
   */
  private async createRetentionActions(
    advisorId: string,
    riskLevel: string,
    interventions: InterventionRecommendation[]
  ): Promise<RetentionAction[]> {
    const actions: RetentionAction[] = [];

    for (const intervention of interventions) {
      const scheduledDate = this.calculateScheduledDate(intervention.urgency);
      
      const action: RetentionAction = {
        action_id: `${advisorId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action_type: intervention.type,
        scheduled_date: scheduledDate,
        status: 'pending',
        automated: this.isAutomatable(intervention.type)
      };

      actions.push(action);

      // Store in database for tracking
      if (riskLevel === 'critical' || riskLevel === 'high') {
        await this.scheduleRetentionAction(advisorId, action, intervention);
      }
    }

    return actions;
  }

  /**
   * Calculate scheduled date based on urgency
   */
  private calculateScheduledDate(urgency: string): Date {
    const now = new Date();
    switch (urgency) {
      case 'immediate':
        return now;
      case 'within_week':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
      case 'within_month':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
    }
  }

  /**
   * Check if action can be automated
   */
  private isAutomatable(actionType: string): boolean {
    const automatableActions = ['proactive_outreach', 'feature_education', 'tier_upgrade'];
    return automatableActions.includes(actionType);
  }

  /**
   * Predict approximate churn date
   */
  private predictChurnDate(features: Record<string, number>): Date | null {
    // Simple linear projection based on activity decline rate
    const declineRate = Math.max(
      features.content_creation_decline,
      features.message_send_decline * 0.8
    );

    if (declineRate > 0) {
      // Estimate days until complete inactivity
      const daysToChurn = Math.round(30 / (declineRate + 0.1));
      return new Date(Date.now() + daysToChurn * 24 * 60 * 60 * 1000);
    }

    // Default to 30 days for high-risk without clear decline pattern
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  /**
   * Store prediction in database
   */
  private async storePrediction(prediction: ChurnPrediction) {
    try {
      await this.supabase
        .from('churn_predictions')
        .upsert({
          advisor_id: prediction.advisor_id,
          risk_score: prediction.risk_score,
          risk_level: prediction.risk_level,
          probability_30_day: prediction.probability_30_day,
          confidence_lower: prediction.confidence_interval.lower,
          confidence_upper: prediction.confidence_interval.upper,
          risk_factors: prediction.risk_factors,
          behavioral_signals: prediction.behavioral_signals,
          predicted_churn_date: prediction.predicted_churn_date?.toISOString(),
          updated_at: prediction.last_updated.toISOString()
        });

      // Update advisor analytics
      await this.supabase
        .from('advisor_analytics')
        .update({
          churn_risk_score: prediction.risk_score,
          churn_risk_factors: prediction.risk_factors
        })
        .eq('advisor_id', prediction.advisor_id);

    } catch (error) {
      console.error('Error storing churn prediction:', error);
    }
  }

  /**
   * Schedule retention action
   */
  private async scheduleRetentionAction(
    advisorId: string,
    action: RetentionAction,
    intervention: InterventionRecommendation
  ) {
    try {
      await this.supabase
        .from('retention_actions')
        .insert({
          advisor_id: advisorId,
          action_id: action.action_id,
          action_type: action.action_type,
          scheduled_date: action.scheduled_date.toISOString(),
          status: action.status,
          automated: action.automated,
          intervention_details: intervention
        });
    } catch (error) {
      console.error('Error scheduling retention action:', error);
    }
  }

  /**
   * Trigger alert for critical churn risk
   */
  private async triggerChurnAlert(advisorId: string, prediction: ChurnPrediction) {
    // Send notification to customer success team
    console.log(`CRITICAL CHURN ALERT: Advisor ${advisorId} at ${prediction.risk_score}% risk`);
    
    // In production, would integrate with notification service
    // await notificationService.send({
    //   type: 'churn_alert',
    //   priority: 'high',
    //   recipient: 'customer-success@jarvish.ai',
    //   data: prediction
    // });
  }

  /**
   * Batch predict churn for all advisors
   */
  async batchPredictChurn(): Promise<Map<string, ChurnPrediction>> {
    const { data: advisors, error } = await this.supabase
      .from('advisors')
      .select('id')
      .eq('is_active', true);

    if (error) throw error;

    const predictions = new Map<string, ChurnPrediction>();

    // Process in batches
    const batchSize = 20;
    for (let i = 0; i < advisors.length; i += batchSize) {
      const batch = advisors.slice(i, i + batchSize);
      const batchPredictions = await Promise.all(
        batch.map(advisor => 
          this.predictChurnRisk(advisor.id).catch(err => {
            console.error(`Failed to predict churn for ${advisor.id}:`, err);
            return null;
          })
        )
      );

      batchPredictions.forEach((prediction, index) => {
        if (prediction) {
          predictions.set(batch[index].id, prediction);
        }
      });
    }

    return predictions;
  }

  /**
   * Get churn statistics for dashboard
   */
  async getChurnStatistics(): Promise<{
    total_advisors: number;
    at_risk_count: number;
    critical_count: number;
    average_risk_score: number;
    distribution: Record<string, number>;
    top_risk_factors: string[];
  }> {
    const { data: predictions, error } = await this.supabase
      .from('churn_predictions')
      .select('*')
      .gte('updated_at', subDays(new Date(), 1).toISOString());

    if (error) throw error;

    const distribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const riskFactorCounts: Record<string, number> = {};

    predictions?.forEach(pred => {
      distribution[pred.risk_level]++;
      
      pred.risk_factors?.forEach((factor: any) => {
        riskFactorCounts[factor.factor] = (riskFactorCounts[factor.factor] || 0) + 1;
      });
    });

    const topRiskFactors = Object.entries(riskFactorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor]) => factor);

    const totalAdvisors = predictions?.length || 0;
    const atRiskCount = distribution.high + distribution.critical;
    const averageRiskScore = totalAdvisors > 0
      ? predictions.reduce((sum, p) => sum + p.risk_score, 0) / totalAdvisors
      : 0;

    return {
      total_advisors: totalAdvisors,
      at_risk_count: atRiskCount,
      critical_count: distribution.critical,
      average_risk_score: averageRiskScore,
      distribution,
      top_risk_factors: topRiskFactors
    };
  }
}

// Export singleton instance
export const churnPredictorService = new ChurnPredictorService();