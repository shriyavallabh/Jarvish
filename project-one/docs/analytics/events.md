# Event Tracking Schema & Advisor Health Score Recipe 📈

## Overview
Comprehensive event tracking schema for WhatsApp delivery lifecycle, client engagement patterns, and advisor health scoring system to enable data-driven insights and platform optimization.

## Core Event Tracking Schema

### WhatsApp Delivery Lifecycle Events

#### 1. Content Creation Events
```yaml
content_creation_event:
  event_name: "content_created"
  timestamp: "2024-12-01T20:45:23.123Z"
  
  advisor_context:
    advisor_id_hash: "a7b3c9"
    advisor_tier: "pro"
    sebi_registration: "hashed_registration_id"
    
  content_metadata:
    content_id: "P1_2KM8N7_a7b3c9_wa_x4y9"
    content_type: "edu" # edu|mkt|sip|tax|ins|ret
    platform: "whatsapp" # whatsapp|status|linkedin
    language: "en" # en|hi|mr
    
  creation_details:
    creation_method: "ai_generated" # ai_generated|template_based|manual_upload
    generation_time_seconds: 2.3
    ai_model_used: "gpt-4o-mini"
    template_id: "daily_pack_v1_en"
    
  compliance_context:
    initial_risk_score: 15
    requires_approval: true
    compliance_version: "v2.1.3"
```

#### 2. Approval Workflow Events
```yaml
content_approval_event:
  event_name: "content_approval_result"
  timestamp: "2024-12-01T21:15:45.678Z"
  
  content_reference:
    content_id: "P1_2KM8N7_a7b3c9_wa_x4y9"
    advisor_id_hash: "a7b3c9"
    
  approval_details:
    approval_status: "approved" # approved|rejected|requires_revision
    approval_stage: "stage_3_final_validation"
    final_risk_score: 16
    reviewer_type: "automated" # automated|human_reviewer
    reviewer_id_hash: "system_auto"
    
  processing_metrics:
    total_processing_time_seconds: 45
    stage_1_rule_validation_time: 0.8
    stage_2_ai_analysis_time: 1.5  
    stage_3_final_validation_time: 0.7
    queue_wait_time_seconds: 42
    
  compliance_validation:
    sebi_violations_detected: 0
    forbidden_terms_count: 0
    disclaimer_compliance: true
    risk_factors_identified: ["market_volatility_mention"]
```

#### 3. Content Scheduling Events
```yaml
content_scheduled_event:
  event_name: "content_scheduled"
  timestamp: "2024-12-01T21:16:00.123Z"
  
  scheduling_details:
    content_id: "P1_2KM8N7_a7b3c9_wa_x4y9"
    scheduled_delivery_time: "2024-12-02T06:00:00+05:30"
    delivery_group: "group_2" # group_1|group_2|group_3|group_4
    jitter_offset_seconds: 45
    
  targeting_context:
    advisor_id_hash: "a7b3c9"
    client_count_estimate: 125
    expected_delivery_attempts: 125
    
  technical_details:
    whatsapp_template_name: "daily_pack_v1_en"
    phone_number_shard: "shard_2"
    image_url: "https://res.cloudinary.com/p1/image/upload/v1/wa_edu_a7b3c9_20241202_001_en.webp"
    render_transform_applied: "proOverlayV1"
```

#### 4. WhatsApp Delivery Events
```yaml
whatsapp_sent_event:
  event_name: "whatsapp_message_sent"
  timestamp: "2024-12-02T06:00:23.456Z"
  
  message_context:
    content_id: "P1_2KM8N7_a7b3c9_wa_x4y9"
    advisor_id_hash: "a7b3c9"
    whatsapp_message_id: "wamid.HBgNMTkxODg4ODg4ODgVAgIxOA=="
    
  delivery_details:
    phone_number_used: "shard_2_hashed"
    template_name: "daily_pack_v1_en"
    delivery_attempt_number: 1
    api_response_time_ms: 1240
    
  client_targeting:
    estimated_recipients: 125
    delivery_group_id: "group_2"
    batch_sequence: 15
    total_batch_size: 450
    
  technical_metadata:
    api_rate_limit_remaining: 950
    quality_rating_before: "high"
    webhook_delivery_expected: true
```

#### 5. WhatsApp Delivery Status Events
```yaml
whatsapp_delivery_status_event:
  event_name: "whatsapp_delivery_status"
  timestamp: "2024-12-02T06:01:15.789Z"
  
  delivery_outcome:
    content_id: "P1_2KM8N7_a7b3c9_wa_x4y9"
    whatsapp_message_id: "wamid.HBgNMTkxODg4ODg4ODgVAgIxOA=="
    status: "delivered" # sent|delivered|read|failed
    
  recipient_context:
    recipient_phone_hash: "client_phone_hash_123"
    advisor_id_hash: "a7b3c9"
    client_anonymized_id: "client_456"
    
  delivery_metrics:
    delivery_time_seconds: 52
    delivery_attempts_required: 1
    network_carrier: "airtel" # anonymized_carrier_info
    
  failure_details: # only present if status = failed
    error_code: null
    error_message: null
    retry_scheduled: false
    failure_reason: null
```

#### 6. WhatsApp Read Receipt Events
```yaml
whatsapp_read_event:
  event_name: "whatsapp_message_read"
  timestamp: "2024-12-02T07:23:45.123Z"
  
  engagement_context:
    content_id: "P1_2KM8N7_a7b3c9_wa_x4y9"
    whatsapp_message_id: "wamid.HBgNMTkxODg4ODg4ODgVAgIxOA=="
    advisor_id_hash: "a7b3c9"
    recipient_phone_hash: "client_phone_hash_123"
    
  engagement_metrics:
    time_to_read_minutes: 83 # minutes from delivery to read
    read_during_business_hours: false
    read_day_of_week: "monday"
    read_hour_of_day: 7
    
  engagement_pattern:
    client_typical_read_delay_minutes: 120 # historical average for this client
    advisor_average_read_delay_minutes: 95 # advisor's historical average
    platform_average_read_delay_minutes: 110
```

## Client Engagement Pattern Events

### Forward/Share Tracking
```yaml
content_forwarded_event:
  event_name: "content_forwarded"
  timestamp: "2024-12-02T08:15:30.456Z"
  
  forward_context:
    original_content_id: "P1_2KM8N7_a7b3c9_wa_x4y9"
    original_whatsapp_message_id: "wamid.HBgNMTkxODg4ODg4ODgVAgIxOA=="
    forwarding_client_hash: "client_phone_hash_123"
    advisor_id_hash: "a7b3c9"
    
  viral_metrics:
    forward_count_estimate: 3 # estimated based on webhook patterns
    forward_chain_depth: 1 # first generation forward
    time_to_forward_minutes: 135
    
  content_analysis:
    content_type: "edu"
    content_effectiveness_score: 85 # high forward rate indicates effectiveness
    viral_potential_indicator: true
```

### Client Response Events
```yaml
client_response_event:
  event_name: "client_response_received"
  timestamp: "2024-12-02T09:45:12.789Z"
  
  response_context:
    original_content_id: "P1_2KM8N7_a7b3c9_wa_x4y9"
    responding_client_hash: "client_phone_hash_123"
    advisor_id_hash: "a7b3c9"
    
  response_analysis:
    response_time_hours: 3.5 # hours from delivery to response
    response_sentiment: "positive" # positive|neutral|negative|question
    response_indicates_engagement: true
    follow_up_question_detected: true
    
  business_context:
    potential_business_inquiry: true
    response_quality_score: 85 # indicates high engagement
    relationship_strength_indicator: "strong"
```

## Advisor Health Score Recipe

### Health Score Components
```yaml
advisor_health_score_calculation:
  total_possible_score: 100
  update_frequency: "daily_at_07:00_ist"
  rolling_window: "30_days"
  
  score_components:
    content_creation_consistency:
      weight: 25
      description: "Regular content creation and approval success"
      sub_metrics:
        daily_content_creation_rate:
          weight: 40
          calculation: "days_with_content_created / total_days_in_period"
          excellent_threshold: ">90%"
          
        approval_success_rate:
          weight: 35
          calculation: "approved_content / total_content_submitted"
          excellent_threshold: ">95%"
          
        content_variety_score:
          weight: 25
          calculation: "unique_content_types_used / available_content_types"
          excellent_threshold: ">70%"
    
    delivery_performance:
      weight: 30
      description: "WhatsApp delivery success and reliability"
      sub_metrics:
        delivery_success_rate:
          weight: 50
          calculation: "delivered_messages / sent_messages"
          excellent_threshold: ">98%"
          
        delivery_timing_consistency:
          weight: 30
          calculation: "on_time_deliveries / total_scheduled_deliveries"
          excellent_threshold: ">95%"
          
        template_health_maintenance:
          weight: 20
          calculation: "days_with_high_quality_rating / total_days"
          excellent_threshold: ">98%"
    
    client_engagement_effectiveness:
      weight: 30
      description: "Client interaction and content effectiveness"
      sub_metrics:
        read_rate_performance:
          weight: 40
          calculation: "messages_read / messages_delivered"
          benchmark: "above_platform_average"
          excellent_threshold: ">platform_75th_percentile"
          
        response_generation_rate:
          weight: 35
          calculation: "client_responses / messages_delivered"
          excellent_threshold: ">platform_75th_percentile"
          
        content_sharing_rate:
          weight: 25
          calculation: "forwarded_messages / messages_delivered"
          excellent_threshold: ">platform_median"
    
    platform_utilization:
      weight: 15
      description: "Feature adoption and platform engagement"
      sub_metrics:
        feature_adoption_score:
          weight: 40
          calculation: "features_used / total_available_features"
          excellent_threshold: ">60%"
          
        dashboard_engagement:
          weight: 30
          calculation: "weekly_dashboard_sessions / 7"
          excellent_threshold: ">daily_usage"
          
        support_interaction_health:
          weight: 30
          calculation: "1 - (support_tickets / content_created)" # fewer tickets = better
          excellent_threshold: "<0.05_tickets_per_content"
```

### Health Score Calculation Algorithm
```yaml
health_score_algorithm:
  calculation_steps:
    step_1_component_scoring:
      method: "calculate_each_component_score_0_to_100"
      normalization: "percentile_based_against_peer_group"
      
    step_2_weighted_aggregation:
      formula: "sum(component_score * component_weight) / 100"
      result_range: "0_to_100"
      
    step_3_trend_adjustment:
      trend_factor: "week_over_week_improvement_or_decline"
      adjustment_range: "±5_points_maximum"
      
    step_4_tier_calibration:
      basic_tier: "baseline_scoring"
      standard_tier: "+5_point_bonus_for_advanced_features"
      pro_tier: "+10_point_bonus_for_professional_features"
      
  health_score_categories:
    exceptional: "90-100 points"
    excellent: "80-89 points"
    good: "70-79 points"  
    needs_attention: "50-69 points"
    critical: "0-49 points"
```

### Health Score Trend Analysis
```yaml
trend_analysis_framework:
  trend_calculation:
    short_term_trend: "7_day_moving_average_change"
    medium_term_trend: "30_day_moving_average_change"
    long_term_trend: "90_day_moving_average_change"
    
  trend_interpretation:
    improving: "consistent_positive_trend_across_timeframes"
    stable: "minimal_variance_within_5_points"
    declining: "consistent_negative_trend_requiring_attention"
    volatile: "high_variance_indicating_inconsistent_usage"
    
  intervention_triggers:
    health_score_below_50:
      trigger: "immediate_advisor_outreach_required"
      action: "personalized_success_coaching_session"
      
    declining_trend_3_weeks:
      trigger: "proactive_support_engagement"
      action: "identify_blockers_and_optimization_opportunities"
      
    exceptional_performance:
      trigger: "success_story_documentation"
      action: "peer_mentorship_program_invitation"
```

## Event Storage & Processing

### Event Schema Standards
```yaml
event_storage_standards:
  event_structure:
    required_fields:
      - "event_name"
      - "timestamp"
      - "advisor_id_hash"
      - "event_id" # UUID for deduplication
      
    optional_fields:
      - "content_id"
      - "client_context"
      - "technical_metadata"
      - "business_context"
      
  data_types:
    timestamps: "ISO_8601_UTC_with_milliseconds"
    durations: "seconds_with_decimal_precision"  
    identifiers: "hashed_strings_for_privacy"
    scores: "integer_0_to_100_range"
    
  privacy_protection:
    client_identification: "irreversible_hashing_only"
    advisor_identification: "consistent_hashing_with_salt_rotation"
    content_sanitization: "no_client_personal_data_in_events"
```

### Event Processing Pipeline
```yaml
processing_pipeline:
  real_time_processing:
    ingestion: "kafka_event_stream_processing"
    validation: "schema_validation_and_duplicate_detection"
    enrichment: "add_contextual_metadata_and_calculations"
    
  batch_processing:
    aggregation_schedule: "hourly_and_daily_aggregations"
    health_score_calculation: "daily_at_07:00_ist"
    insight_generation: "weekly_on_sundays"
    
  data_retention:
    raw_events: "90_days_hot_storage"
    aggregated_metrics: "2_years_warm_storage"
    health_scores: "permanent_storage_for_trend_analysis"
    
  performance_optimization:
    partitioning: "by_date_and_advisor_hash"
    indexing: "content_id_advisor_hash_timestamp"
    caching: "frequently_accessed_aggregations"
```

## Analytics & Insights Integration

### Real-Time Dashboard Metrics
```yaml
real_time_metrics:
  delivery_window_monitoring:
    events_processed: "whatsapp_sent_delivered_read"
    success_rate_calculation: "real_time_delivery_success_percentage"
    alert_thresholds: "integrated_with_observability_slo_md"
    
  advisor_engagement_tracking:
    active_advisors: "advisors_with_events_in_last_24_hours"
    content_creation_velocity: "content_created_events_per_hour"
    platform_health_indicators: "average_health_score_across_advisors"
```

### Weekly Insights Data Pipeline
```yaml
insights_data_integration:
  event_aggregation_for_insights:
    content_performance: "aggregate_approval_delivery_engagement_events"
    advisor_behavior_patterns: "analyze_creation_and_usage_patterns"
    comparative_benchmarking: "anonymous_peer_performance_comparison"
    
  recommendation_engine_inputs:
    underperforming_areas: "identify_below_average_health_score_components"
    optimization_opportunities: "detect_patterns_in_high_performing_advisors"
    trend_predictions: "forecast_advisor_performance_trajectories"
```

This comprehensive event tracking schema enables detailed analytics, accurate advisor health scoring, and data-driven insights while maintaining privacy and compliance standards throughout the platform.