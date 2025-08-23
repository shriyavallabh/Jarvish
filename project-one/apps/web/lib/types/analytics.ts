// Analytics Types for JARVISH Platform
// Comprehensive type definitions for AI-powered analytics and business intelligence

export interface AdvisorMetrics {
  advisor_id: string;
  business_name: string;
  subscription_tier: 'basic' | 'standard' | 'pro';
  period_start: string;
  period_end: string;
  
  // Content Performance
  content_performance: {
    total_created: number;
    approved_content: number;
    rejected_content: number;
    delivered_content: number;
    approval_rate: number;
    delivery_success_rate: number;
  };
  
  // Engagement Analytics
  engagement: {
    total_sent: number;
    delivered: number;
    read: number;
    delivery_rate: number;
    read_rate: number;
    trend_direction: 'improving' | 'stable' | 'declining';
    week_over_week_change: number;
  };
  
  // Language Performance
  language_performance: {
    english: {
      content_count: number;
      read_rate: number;
      engagement_score: number;
    };
    hindi: {
      content_count: number;
      read_rate: number;
      engagement_score: number;
    };
    preferred_language: 'english' | 'hindi' | 'mixed';
  };
  
  // Topic Analytics
  topic_breakdown: {
    [topic: string]: {
      content_count: number;
      read_rate: number;
      compliance_score: number;
      performance_trend: 'up' | 'down' | 'stable';
    };
  };
  
  // Compliance Tracking
  compliance: {
    average_score: number;
    violations_count: number;
    trend_direction: 'improving' | 'stable' | 'declining';
    score_change: number;
    ai_accuracy: number;
  };
  
  // Health Score
  health_score: number; // 0-100 composite score
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface WeeklyInsight {
  advisor_id: string;
  week_start: string;
  week_end: string;
  
  summary: string; // AI-generated weekly summary
  key_wins: string[]; // Top achievements
  optimization_opportunities: string[]; // Areas for improvement
  
  metrics: AdvisorMetrics;
  
  // Recommendations
  content_recommendations: {
    optimal_topics: string[];
    best_posting_times: string[];
    language_preference: 'english' | 'hindi' | 'mixed';
    suggested_frequency: number; // posts per week
  };
  
  // Comparative Analysis
  peer_comparison: {
    performance_percentile: number; // 0-100, where advisor ranks vs peers
    above_peer_average: boolean;
    key_differentiators: string[];
  };
  
  generated_at: string;
  ai_confidence: number; // 0-1 confidence in insights
}

export interface ChurnPrediction {
  advisor_id: string;
  
  // Risk Scores (0-100)
  churn_risk_30_day: number;
  churn_risk_60_day: number;
  churn_risk_90_day: number;
  
  overall_health_score: number; // 0-100
  risk_category: 'excellent' | 'good' | 'needs_attention' | 'at_risk' | 'critical';
  
  // Risk Factors
  risk_factors: {
    declining_engagement: {
      score: number;
      description: string;
      trend: number; // percentage change
    };
    payment_issues: {
      score: number;
      failed_payments: number;
      overdue_days: number;
    };
    support_escalations: {
      score: number;
      ticket_count: number;
      negative_sentiment: number;
    };
    content_creation_drop: {
      score: number;
      days_since_last_content: number;
      trend: number;
    };
    feature_adoption: {
      score: number;
      unused_features: string[];
      adoption_rate: number;
    };
  };
  
  // Intervention Recommendations
  recommended_actions: {
    priority: 'high' | 'medium' | 'low';
    action_type: 'proactive_outreach' | 'retention_offer' | 'onboarding_refresh' | 'priority_support';
    description: string;
    expected_impact: number; // 0-100
  }[];
  
  // Model Metadata
  model_version: string;
  prediction_confidence: number; // 0-1
  last_updated: string;
}

export interface ContentPerformanceAnalytics {
  period_start: string;
  period_end: string;
  
  // Overall Platform Performance
  platform_metrics: {
    total_content_created: number;
    total_delivered: number;
    platform_read_rate: number;
    compliance_pass_rate: number;
  };
  
  // Topic Performance
  topic_analytics: {
    [topic: string]: {
      content_volume: number;
      avg_read_rate: number;
      engagement_trend: 'rising' | 'falling' | 'stable';
      seasonal_pattern: 'festival_boost' | 'budget_season' | 'stable' | 'volatile';
      best_performing_advisors: string[]; // advisor IDs
    };
  };
  
  // Language Insights
  language_performance: {
    english: {
      usage_percentage: number;
      avg_engagement: number;
      preferred_regions: string[];
    };
    hindi: {
      usage_percentage: number;
      avg_engagement: number;
      preferred_regions: string[];
    };
    mixed_content: {
      usage_percentage: number;
      avg_engagement: number;
    };
  };
  
  // Timing Analytics
  optimal_delivery_patterns: {
    best_days: string[];
    best_hours: number[];
    timezone_performance: {
      [timezone: string]: {
        read_rate: number;
        best_hours: number[];
      };
    };
  };
  
  // Geographic Insights
  regional_performance: {
    metro_cities: {
      engagement_rate: number;
      preferred_topics: string[];
      language_preference: 'english' | 'hindi' | 'mixed';
    };
    tier2_cities: {
      engagement_rate: number;
      preferred_topics: string[];
      language_preference: 'english' | 'hindi' | 'mixed';
    };
    tier3_cities: {
      engagement_rate: number;
      preferred_topics: string[];
      language_preference: 'english' | 'hindi' | 'mixed';
    };
  };
}

export interface BusinessIntelligence {
  period_start: string;
  period_end: string;
  
  // Revenue Analytics
  revenue: {
    total_mrr: number; // Monthly Recurring Revenue
    mrr_growth_rate: number;
    arr: number; // Annual Recurring Revenue
    revenue_by_tier: {
      basic: number;
      standard: number;
      pro: number;
    };
    churn_impact: number; // Revenue lost to churn
    expansion_revenue: number; // Upgrades
    contraction_revenue: number; // Downgrades
  };
  
  // User Analytics
  user_metrics: {
    total_advisors: number;
    new_signups: number;
    active_advisors: number; // Active in period
    churned_advisors: number;
    net_advisor_growth: number;
    
    // Cohort Analysis
    cohort_retention: {
      [month: string]: {
        cohort_size: number;
        month_1_retention: number;
        month_3_retention: number;
        month_6_retention: number;
        month_12_retention: number;
      };
    };
  };
  
  // Subscription Analytics
  subscription_health: {
    churn_rate: number;
    upgrade_rate: number;
    downgrade_rate: number;
    ltv_cac_ratio: number; // Lifetime Value / Customer Acquisition Cost
    
    tier_distribution: {
      basic: { count: number; percentage: number };
      standard: { count: number; percentage: number };
      pro: { count: number; percentage: number };
    };
  };
  
  // Feature Adoption
  feature_usage: {
    content_generation: {
      adoption_rate: number;
      usage_frequency: number;
      power_users: number;
    };
    whatsapp_integration: {
      adoption_rate: number;
      success_rate: number;
      avg_delivery_time: number;
    };
    compliance_checking: {
      usage_rate: number;
      accuracy_score: number;
      automation_rate: number;
    };
  };
  
  // Cost Analysis
  operational_metrics: {
    ai_costs: {
      content_generation: number;
      compliance_checking: number;
      analytics_processing: number;
      total: number;
    };
    infrastructure_costs: number;
    support_costs: number;
    
    unit_economics: {
      cost_per_advisor: number;
      cost_per_content_piece: number;
      margin_by_tier: {
        basic: number;
        standard: number;
        pro: number;
      };
    };
  };
  
  // Market Insights
  market_trends: {
    seasonal_patterns: {
      festival_season_boost: number;
      budget_announcement_impact: number;
      market_volatility_correlation: number;
    };
    competitive_position: {
      market_share_estimate: number;
      feature_parity_score: number;
      pricing_competitiveness: number;
    };
  };
}

export interface PlatformAlerts {
  id: string;
  type: 'churn_risk' | 'performance_anomaly' | 'system_health' | 'business_milestone';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_entities: string[]; // advisor IDs, content IDs, etc.
  recommended_action: string;
  created_at: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface AnalyticsRequest {
  advisor_id?: string;
  start_date: string;
  end_date: string;
  metrics: ('engagement' | 'content' | 'compliance' | 'revenue')[];
  include_predictions?: boolean;
  include_recommendations?: boolean;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  generated_at: string;
  cache_expires_at?: string;
  metadata: {
    query_time_ms: number;
    data_points: number;
    confidence_score?: number;
  };
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

export interface TimeSeriesData {
  series: ChartDataPoint[];
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

export interface ComparativeData {
  current_period: ChartDataPoint[];
  previous_period: ChartDataPoint[];
  benchmark?: ChartDataPoint[];
}

// Export & Report Types
export interface ReportExportRequest {
  report_type: 'weekly_insights' | 'churn_analysis' | 'content_performance' | 'business_intelligence';
  format: 'pdf' | 'excel' | 'csv';
  date_range: {
    start: string;
    end: string;
  };
  advisor_ids?: string[];
  include_charts: boolean;
  include_raw_data: boolean;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  download_url?: string;
  expires_at?: string;
  error_message?: string;
  created_at: string;
}