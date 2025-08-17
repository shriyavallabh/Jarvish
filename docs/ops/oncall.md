# On-Call Operations - 05:30–06:30 IST Critical Window 📟

## Critical Delivery Window Operations

### 05:30–06:30 IST On-Call Protocol
**Primary Objective**: Ensure 99% delivery SLA during daily WhatsApp content delivery window

```yaml
critical_window_schedule:
  pre_delivery: "05:30-06:00 IST"
  delivery_execution: "06:00-06:05 IST" 
  post_delivery_monitoring: "06:05-06:30 IST"
  
  on_call_roles:
    primary_engineer: "Level 3+ Backend/DevOps Engineer"
    secondary_engineer: "Level 2+ Full-Stack Engineer"
    escalation_lead: "Senior Engineering Manager"
    executive_escalation: "CTO (for business-critical incidents)"
```

## Pre-Delivery Preparation (05:30-06:00 IST)

### 05:30 IST - System Health Verification
```yaml
pre_delivery_checklist:
  infrastructure_health:
    - "verify_database_connection_pool_healthy"
    - "confirm_redis_cache_operational"
    - "check_whatsapp_api_rate_limits_sufficient"
    - "validate_cloudinary_service_availability"
    
  content_pipeline_status:
    - "approval_queue_cleared (should_be_0_items)"
    - "content_pre_rendered_successfully"
    - "whatsapp_templates_approved_and_active"
    - "advisor_delivery_preferences_loaded"
    
  ai_service_readiness:
    - "openai_api_health_check_passing"
    - "compliance_engine_response_time <1.5s"
    - "fallback_content_systems_prepared"
    
  monitoring_systems:
    - "datadog_alerts_configured_and_active"
    - "grafana_delivery_dashboard_accessible"
    - "pagerduty_escalation_chain_verified"
    - "slack_critical_channels_monitored"
```

### 05:45 IST - Final Systems Check
```yaml
final_systems_verification:
  whatsapp_integration:
    - "quality_rating_maintained_high"
    - "phone_number_sharding_healthy"
    - "delivery_queue_processing_ready"
    - "webhook_endpoints_responding"
    
  delivery_pipeline:
    - "advisor_segmentation_loaded (4_groups)"
    - "jitter_windows_calculated"
    - "retry_logic_configured"
    - "fallback_mechanisms_armed"
    
  escalation_readiness:
    - "on_call_engineer_confirmed_availability"
    - "backup_engineer_on_standby"
    - "management_escalation_contacts_verified"
```

## Delivery Execution (06:00-06:05 IST)

### Real-Time Monitoring Requirements
```yaml
real_time_monitoring:
  primary_metrics:
    delivery_success_rate: "must_remain >98% throughout_window"
    message_processing_rate: "target_400_messages_per_minute"
    api_response_latency: "whatsapp_api_calls <2s_p95"
    error_rate: "total_errors <2% _of_attempted_deliveries"
    
  dashboard_monitoring:
    grafana_delivery_dashboard: "refresh_every_30_seconds"
    datadog_infrastructure: "real_time_metrics_monitoring"
    slack_delivery_channel: "automated_status_updates"
    
  alert_thresholds_during_delivery:
    immediate_page: "delivery_failure_rate >2% in_any_2_minute_window"
    urgent_investigate: "individual_advisor_failures >5_in_1_minute"
    warning_monitor: "overall_latency_increase >50%_baseline"
```

### Incident Response During Delivery
```yaml
delivery_window_incident_response:
  severity_1_immediate_page:
    triggers:
      - "whatsapp_api_completely_unavailable"
      - "database_connection_failures >50%"
      - "overall_delivery_success <95%_for_2_consecutive_minutes"
    
    immediate_actions:
      step_1: "acknowledge_pagerduty_alert <1_minute"
      step_2: "join_slack_war_room #delivery-incident"
      step_3: "assess_scope_of_failure"
      step_4: "activate_appropriate_emergency_runbook"
      step_5: "page_secondary_engineer_if_needed"
    
  severity_2_urgent_investigation:
    triggers:
      - "individual_phone_number_shard_failing"
      - "specific_advisor_tier_delivery_issues"
      - "template_approval_status_changes"
    
    response_actions:
      step_1: "investigate_root_cause_immediately"
      step_2: "implement_targeted_workaround"
      step_3: "monitor_for_impact_expansion"
      step_4: "document_incident_timeline"
```

## Post-Delivery Monitoring (06:05-06:30 IST)

### Delivery Completion Verification
```yaml
post_delivery_verification:
  06_05_ist_checkpoint:
    - "verify_99%_delivery_sla_achieved"
    - "confirm_all_advisor_groups_processed"
    - "validate_zero_critical_failures"
    - "check_whatsapp_quality_rating_maintained"
    
  06_15_ist_checkpoint:
    - "review_delivery_analytics_summary"
    - "identify_any_advisor_specific_issues"
    - "confirm_delivery_receipt_webhook_processing"
    - "verify_engagement_tracking_operational"
    
  06_30_ist_final_report:
    - "generate_daily_delivery_success_report"
    - "document_any_incidents_or_issues"
    - "update_delivery_performance_trends"
    - "hand_off_to_day_team_with_summary"
```

### Issue Remediation Window
```yaml
remediation_priorities:
  immediate_fix_required:
    - "advisor_specific_delivery_failures"
    - "whatsapp_quality_rating_degradation"
    - "compliance_engine_errors_affecting_future_content"
    
  monitor_and_schedule:
    - "minor_performance_degradations"
    - "non_critical_api_errors"
    - "optimization_opportunities_identified"
    
  escalate_to_day_team:
    - "infrastructure_capacity_planning_needs"
    - "feature_bugs_not_affecting_delivery"
    - "long_term_optimization_projects"
```

## Escalation Paths

### Engineering Escalation Chain
```yaml
escalation_levels:
  level_1_primary_on_call:
    role: "Senior Backend/DevOps Engineer"
    responsibility: "immediate_incident_response_and_resolution"
    escalation_trigger: "unable_to_resolve_within_15_minutes_of_critical_incident"
    
  level_2_secondary_engineer:
    role: "Full-Stack Engineer + Domain Expert"
    responsibility: "additional_technical_expertise_and_parallel_investigation"
    escalation_trigger: "complex_multi_system_failure_requiring_additional_expertise"
    
  level_3_engineering_manager:
    role: "Senior Engineering Manager" 
    responsibility: "resource_coordination_and_business_impact_decisions"
    escalation_trigger: "incident_duration >30_minutes_or_significant_business_impact"
    
  level_4_executive:
    role: "CTO"
    responsibility: "business_continuity_decisions_and_external_communication"
    escalation_trigger: "complete_service_outage >1_hour_or_compliance_incident"
```

### Business Escalation Matrix
```yaml
business_impact_escalation:
  delivery_sla_miss:
    <95%_delivery_rate:
      immediate: "engineering_manager"
      within_1_hour: "head_of_product"
      within_4_hours: "cto"
      
    <90%_delivery_rate:
      immediate: "cto"
      within_30_minutes: "ceo"
      within_1_hour: "board_notification"
      
  compliance_incident:
    sebi_violation_detected:
      immediate: "legal_counsel + compliance_officer"
      within_15_minutes: "ceo"
      within_1_hour: "external_legal_consultation"
      
  whatsapp_account_restriction:
    quality_rating_to_medium:
      immediate: "head_of_operations"
      within_2_hours: "cto + head_of_marketing"
      
    account_suspended:
      immediate: "cto + ceo"
      within_30_minutes: "emergency_business_continuity_meeting"
```

## Communication Protocols

### Internal Communication Channels
```yaml
communication_channels:
  slack_channels:
    critical_incidents: "#delivery-war-room"
    daily_operations: "#delivery-ops"
    engineering_alerts: "#engineering-alerts"
    executive_notifications: "#executive-alerts"
    
  pagerduty_escalation:
    service: "project-one-delivery"
    escalation_policy: "delivery_window_escalation"
    notification_methods: ["sms", "phone_call", "slack", "email"]
    
  status_communications:
    internal_status_page: "status.internal.projectone.ai"
    advisor_facing_status: "status.projectone.ai"
    twitter_updates: "@ProjectOneStatus"
```

### External Communication Plan
```yaml
external_communication:
  advisor_notifications:
    delivery_delays >15_minutes:
      method: "in_app_notification + email"
      message: "delivery_delay_with_eta_update"
      frequency: "every_15_minutes_until_resolved"
      
    service_degradation:
      method: "status_page + proactive_email"
      message: "service_impact_description_with_workarounds"
      timeline: "within_30_minutes_of_incident_start"
      
  regulatory_notifications:
    compliance_incidents:
      sebi_notification: "within_24_hours_if_required"
      legal_documentation: "comprehensive_incident_report"
      remediation_plan: "detailed_corrective_actions"
```

## On-Call Playbooks

### Standard Operating Procedures
```yaml
sop_references:
  delivery_failure_investigation:
    runbook: "/runbooks/delivery-failure-incident"
    estimated_resolution_time: "10-15_minutes"
    success_criteria: "delivery_rate_restored_to >98%"
    
  whatsapp_quality_recovery:
    runbook: "/runbooks/whatsapp-quality-recovery" 
    estimated_resolution_time: "30-60_minutes"
    success_criteria: "quality_rating_improvement_plan_activated"
    
  ai_service_fallback:
    runbook: "/runbooks/ai-service-outage"
    estimated_resolution_time: "5-10_minutes"
    success_criteria: "fallback_systems_activated_and_functional"
    
  database_emergency:
    runbook: "/runbooks/database-emergency"
    estimated_resolution_time: "15-30_minutes" 
    success_criteria: "database_connectivity_and_performance_restored"
```

### Emergency Contacts
```yaml
emergency_contacts:
  engineering_leadership:
    cto: "+91-9876543210"
    engineering_manager: "+91-9876543211" 
    senior_devops_lead: "+91-9876543212"
    
  business_leadership:
    ceo: "+91-9876543213"
    head_of_operations: "+91-9876543214"
    head_of_compliance: "+91-9876543215"
    
  external_contacts:
    whatsapp_business_support: "business_support_india@whatsapp.com"
    cloudinary_premium_support: "+1-xxx-xxx-xxxx"
    datadog_support: "support@datadoghq.com"
```

## On-Call Preparation & Training

### Pre-Shift Requirements
```yaml
on_call_preparation:
  technical_setup:
    - "vpn_access_configured_and_tested"
    - "pagerduty_app_installed_with_notifications_enabled"
    - "datadog_mobile_app_with_dashboard_access"
    - "slack_mobile_notifications_configured"
    - "backup_internet_connection_available"
    
  knowledge_requirements:
    - "delivery_pipeline_architecture_understanding"
    - "whatsapp_api_integration_knowledge"
    - "database_and_caching_layer_familiarity"
    - "monitoring_dashboard_proficiency"
    - "incident_response_procedure_training"
    
  access_verification:
    - "production_database_read_access"
    - "monitoring_systems_admin_access" 
    - "whatsapp_business_manager_access"
    - "cloudinary_account_management_access"
```

### Shift Handoff Protocol
```yaml
shift_handoff:
  incoming_engineer_briefing:
    - "review_previous_24_hours_incident_log"
    - "current_system_health_status_overview"
    - "pending_issues_requiring_monitoring"
    - "upcoming_scheduled_maintenance_or_changes"
    - "special_instructions_or_known_issues"
    
  handoff_documentation:
    location: "confluence/on_call_handoff_log"
    required_sections: ["incidents", "performance_notes", "advisor_issues", "infrastructure_changes"]
    update_frequency: "every_shift_change"
    
  knowledge_transfer_meeting:
    duration: "15_minutes"
    participants: ["outgoing_engineer", "incoming_engineer", "optional_manager"]
    agenda: ["system_status", "active_issues", "qa_session"]
```

This comprehensive on-call protocol ensures reliable 99% delivery SLA maintenance during the critical 06:00 IST delivery window with proper escalation and communication procedures.