# Project One - Component Inventory & Data Modeling Specification
## AI-First B2B Financial Content Platform - Phase 1 Data Architecture

**Version:** 1.0  
**Created:** 2025-08-14  
**Role:** Domain Data Modeler - Financial Services & Compliance Audit Systems  
**Focus:** SEBI Compliance, DPDP Act 2023, 5-Year Audit Trail Requirements  

---

## Executive Summary

This comprehensive component inventory and data modeling specification defines the complete data architecture for Project One's AI-first financial advisor platform. The design supports SEBI compliance requirements, DPDP Act 2023 data protection, 5-year audit trail retention, and 99% WhatsApp delivery SLA while serving 150-2000 financial advisors across three subscription tiers.

### Core Data Architecture Principles

1. **Compliance-First Design**: All data models embed SEBI regulatory requirements and audit trail capabilities
2. **Privacy by Design**: DPDP Act 2023 compliance with consent management and data minimization
3. **Performance at Scale**: Optimized for 99% delivery SLA and real-time analytics
4. **Audit Integrity**: Complete 5-year audit trail with immutable compliance tracking
5. **Multi-Language Support**: Native support for English, Hindi, and Marathi content

---

## Component Architecture Overview

### System Component Hierarchy

```yaml
project_one_architecture:
  frontend_components:
    advisor_dashboard:
      - dashboard_overview_widget
      - content_status_tracker  
      - delivery_analytics_panel
      - notification_center
      - quick_action_toolbar
      
    content_creation_studio:
      - ai_topic_suggestion_engine
      - content_composer_interface
      - real_time_compliance_scorer
      - whatsapp_preview_renderer
      - multi_language_editor
      - submission_workflow_manager
      
    approval_management:
      - admin_approval_queue
      - compliance_review_interface
      - bulk_operation_tools
      - escalation_workflow_manager
      - audit_trail_viewer
      
    analytics_intelligence:
      - advisor_performance_dashboard
      - content_effectiveness_analyzer
      - delivery_success_monitor
      - engagement_insights_panel
      - compliance_reporting_suite

  backend_services:
    advisor_management_service:
      - advisor_registration_processor
      - sebi_verification_engine
      - subscription_tier_manager
      - whatsapp_integration_handler
      - preference_configuration_service
      
    content_pipeline_service:
      - ai_content_generation_engine
      - compliance_validation_processor
      - content_rendering_service
      - template_management_system
      - fallback_content_selector
      
    delivery_orchestration_service:
      - whatsapp_delivery_manager
      - scheduling_optimization_engine
      - delivery_monitoring_system
      - sla_compliance_tracker
      - retry_logic_processor
      
    compliance_audit_service:
      - sebi_compliance_engine
      - audit_trail_recorder
      - incident_management_system
      - regulatory_reporting_generator
      - policy_version_controller

  data_storage_layer:
    operational_databases:
      - advisor_data_store
      - content_management_store
      - delivery_tracking_store
      - compliance_audit_store
      
    analytics_warehouses:
      - advisor_intelligence_warehouse
      - content_performance_warehouse
      - delivery_analytics_warehouse
      - compliance_metrics_warehouse
      
    cache_acceleration:
      - redis_session_cache
      - content_template_cache
      - compliance_rule_cache
      - delivery_queue_cache

  external_integrations:
    ai_ml_services:
      - openai_gpt_integration
      - compliance_scoring_model
      - content_quality_evaluator
      - engagement_prediction_engine
      
    messaging_platforms:
      - whatsapp_cloud_api
      - sms_backup_service
      - email_notification_service
      
    regulatory_services:
      - sebi_verification_api
      - compliance_rule_updates
      - regulatory_news_feeds
```

---

## Core Data Models & Entity Design

### 1. Advisor Management Domain

#### 1.1 Advisor Entity Model
```yaml
advisor_entity:
  primary_identifiers:
    advisor_id: "SERIAL PRIMARY KEY - Unique platform identifier"
    sebi_reg_no: "VARCHAR(50) UNIQUE NOT NULL - SEBI registration number"
    email: "VARCHAR(255) UNIQUE NOT NULL - Primary contact and login"
    
  regulatory_compliance:
    advisor_type: "ENUM('RIA', 'MFD') - SEBI advisor classification"
    sebi_status: "ENUM('pending', 'verified', 'expired', 'suspended')"
    sebi_document_hash: "VARCHAR(64) - SHA-256 of uploaded SEBI certificate"
    compliance_profile_id: "FK to advisor_compliance_profiles"
    
  subscription_management:
    tier: "ENUM('basic', 'standard', 'pro') - Subscription level"
    billing_status: "ENUM('active', 'pending', 'suspended', 'cancelled')"
    billing_customer_id: "VARCHAR(100) - Stripe/Razorpay customer reference"
    seats_allocated: "INTEGER DEFAULT 1 - Number of user seats"
    auto_renewal_enabled: "BOOLEAN DEFAULT true"
    
  whatsapp_integration:
    wa_business_phone: "VARCHAR(20) UNIQUE - WhatsApp Business number"
    waba_id: "VARCHAR(50) - WhatsApp Business Account ID"
    wa_verification_status: "ENUM('pending', 'verified', 'failed')"
    wa_optin_timestamp: "TIMESTAMP - Consent for proactive messaging"
    wa_webhook_url: "VARCHAR(255) - Webhook for delivery status"
    
  content_preferences:
    language_preferences: "TEXT[] CHECK languages IN ('EN','HI','MR')"
    preferred_send_time: "TIME DEFAULT '06:00:00'"
    content_tone: "ENUM('professional', 'friendly', 'educational')"
    topic_interests: "JSONB - Weighted topic preferences"
    auto_send_enabled: "BOOLEAN DEFAULT true"
    
  performance_metrics:
    health_score: "INTEGER 0-100 - Overall platform engagement"
    approval_success_rate: "DECIMAL(5,4) - Content approval percentage"
    delivery_success_rate: "DECIMAL(5,4) - WhatsApp delivery success"
    client_engagement_score: "DECIMAL(5,4) - Average read/response rates"
    
  audit_tracking:
    created_at: "TIMESTAMP NOT NULL DEFAULT NOW()"
    updated_at: "TIMESTAMP NOT NULL DEFAULT NOW()"
    last_login_at: "TIMESTAMP"
    last_content_created_at: "TIMESTAMP"
    gdpr_consent_timestamp: "TIMESTAMP"
    data_retention_until: "DATE - DPDP Act compliance"

  constraints:
    - "CHECK (health_score >= 0 AND health_score <= 100)"
    - "CHECK (approval_success_rate >= 0 AND approval_success_rate <= 1)"
    - "CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$')"
    - "CHECK (tier = 'basic' OR seats_allocated >= 1)"
    
  indexes:
    primary: "advisor_id"
    unique: ["sebi_reg_no", "email", "wa_business_phone"]
    performance: ["tier", "health_score DESC", "last_login_at DESC"]
    compliance: ["sebi_status", "wa_verification_status"]
```

#### 1.2 Advisor Profile Intelligence Model
```yaml
advisor_profile_intelligence:
  ai_personalization:
    topic_affinity_scores: "JSONB - ML-derived topic preferences"
    content_editing_patterns: "JSONB - Common edit behaviors"
    engagement_optimization: "JSONB - Time/content performance data"
    style_preferences: "JSONB - Tone, length, formatting preferences"
    
  behavioral_analytics:
    login_patterns: "JSONB - Time-based usage analysis"
    content_creation_velocity: "DECIMAL - Average pieces per day"
    revision_cycles: "DECIMAL - Average edits before approval"
    feature_adoption_scores: "JSONB - Feature usage analytics"
    
  compliance_intelligence:
    risk_tolerance_profile: "ENUM('conservative', 'moderate', 'aggressive')"
    frequent_compliance_issues: "TEXT[] - Recurring violation patterns"
    improvement_trajectory: "JSONB - Learning progress tracking"
    escalation_history: "JSONB - Past escalation patterns"
    
  performance_predictions:
    churn_risk_score: "DECIMAL(5,4) - ML churn prediction"
    engagement_forecast: "JSONB - Predicted engagement trends"
    content_success_prediction: "DECIMAL(5,4) - AI content match score"
    optimal_send_times: "JSONB - Personalized timing recommendations"
```

### 2. Content Management Domain

#### 2.1 Content Pack Entity Model
```yaml
content_pack_entity:
  content_identification:
    content_pack_id: "SERIAL PRIMARY KEY"
    advisor_id: "FK to advisors - Content ownership"
    content_hash: "VARCHAR(64) - SHA-256 for change detection"
    version_number: "INTEGER DEFAULT 1 - Content versioning"
    parent_content_id: "FK to content_packs - For revisions"
    
  content_classification:
    topic_family: "VARCHAR(100) - Market update, SIP education, etc."
    content_type: "ENUM('daily_post', 'market_update', 'educational', 'promotional')"
    target_audience: "ENUM('retail_investors', 'hnw_clients', 'general')"
    seasonal_relevance: "JSONB - Holiday/event associations"
    
  multi_language_content:
    content_json: "JSONB NOT NULL - Structured content by language"
    # Structure: {
    #   "en": {"title": "...", "body": "...", "cta": "...", "disclaimer": "..."},
    #   "hi": {"title": "...", "body": "...", "cta": "...", "disclaimer": "..."},
    #   "mr": {"title": "...", "body": "...", "cta": "...", "disclaimer": "..."}
    # }
    languages_included: "TEXT[] - Available language variants"
    primary_language: "VARCHAR(2) DEFAULT 'EN'"
    translation_quality_scores: "JSONB - AI translation confidence"
    
  ai_analysis_results:
    ai_risk_score: "INTEGER 0-100 - SEBI compliance risk"
    confidence_score: "DECIMAL(5,4) - AI confidence in assessment"
    compliance_reasons: "TEXT[] - Specific rule violations/concerns"
    improvement_suggestions: "TEXT[] - Actionable improvement tips"
    ai_model_version: "VARCHAR(50) - Model used for analysis"
    processing_timestamp: "TIMESTAMP - When AI analysis completed"
    
  workflow_status:
    status: "ENUM('draft', 'pending_review', 'approved', 'rejected', 'scheduled', 'delivered', 'archived')"
    submission_timestamp: "TIMESTAMP - When submitted for review"
    approval_timestamp: "TIMESTAMP - When approved/rejected"
    reviewed_by: "FK to admin_users - Reviewing admin"
    review_notes: "TEXT - Admin feedback"
    escalation_reason: "TEXT - Why escalated if applicable"
    
  scheduling_delivery:
    scheduled_date: "DATE - Target delivery date"
    scheduled_time: "TIME - Target delivery time"
    delivery_priority: "ENUM('low', 'normal', 'high', 'urgent')"
    fallback_eligible: "BOOLEAN DEFAULT true - Can use as fallback"
    content_expires_at: "TIMESTAMP - Content expiration"
    
  performance_metrics:
    engagement_prediction: "DECIMAL(5,4) - AI engagement forecast"
    actual_engagement_score: "DECIMAL(5,4) - Measured performance"
    delivery_success_rate: "DECIMAL(5,4) - Delivery success"
    read_rate: "DECIMAL(5,4) - Read receipt percentage"
    response_rate: "DECIMAL(5,4) - Client response percentage"
    
  audit_compliance:
    created_at: "TIMESTAMP NOT NULL DEFAULT NOW()"
    updated_at: "TIMESTAMP NOT NULL DEFAULT NOW()"
    creator_type: "ENUM('advisor', 'admin', 'fallback_system')"
    modification_log: "JSONB - Change history"
    retention_until: "DATE - 5-year SEBI retention requirement"
    
  constraints:
    - "CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100)"
    - "CHECK (jsonb_typeof(content_json) = 'object')"
    - "CHECK (status != 'scheduled' OR scheduled_date IS NOT NULL)"
    - "CHECK (status NOT IN ('approved', 'rejected') OR reviewed_by IS NOT NULL)"
    - "CHECK (languages_included && ARRAY['EN','HI','MR'])"
    
  indexes:
    primary: "content_pack_id"
    workflow: ["advisor_id", "status", "created_at DESC"]
    compliance: ["ai_risk_score DESC", "status"]
    scheduling: ["scheduled_date", "scheduled_time", "status"]
    performance: ["engagement_prediction DESC", "topic_family"]
```

#### 2.2 Content Rendering & Asset Management
```yaml
content_rendering_model:
  render_job_tracking:
    render_job_id: "SERIAL PRIMARY KEY"
    content_pack_id: "FK to content_packs"
    variants_requested: "TEXT[] - whatsapp, status, linkedin"
    render_status: "ENUM('queued', 'processing', 'completed', 'failed')"
    
  asset_configuration:
    overlay_config: "JSONB - Branding and disclaimer overlays"
    # Structure: {
    #   "whatsapp": {"safe_areas": true, "disclaimer_position": "bottom"},
    #   "branding": {"logo_url": "...", "advisor_name": "...", "sebi_reg": "..."},
    #   "pro_features": {"custom_watermark": true, "branded_templates": true}
    # }
    image_specifications: "JSONB - Size, format, quality requirements"
    compliance_overlays: "JSONB - Mandatory disclaimer placements"
    
  asset_outputs:
    rendered_assets: "JSONB - URLs and metadata for rendered images"
    # Structure: {
    #   "whatsapp": {"url": "https://cdn.../wa_1200x628.webp", "size_bytes": 45000},
    #   "status": {"url": "https://cdn.../status_1080x1920.jpg", "size_bytes": 67000},
    #   "linkedin": {"url": "https://cdn.../li_1200x627.png", "size_bytes": 52000}
    # }
    asset_checksums: "JSONB - SHA-256 hashes for integrity"
    cdn_cache_status: "ENUM('pending', 'cached', 'expired')"
    
  performance_tracking:
    rendering_time_ms: "INTEGER - Processing time"
    queue_wait_time_ms: "INTEGER - Time in queue"
    cache_hit_rate: "DECIMAL(5,4) - CDN cache efficiency"
    error_details: "JSONB - Detailed error information"
    
  quality_assurance:
    visual_quality_score: "INTEGER 0-100 - Automated quality check"
    compliance_overlay_verified: "BOOLEAN - Disclaimer placement check"
    accessibility_score: "INTEGER 0-100 - Color contrast, readability"
    brand_consistency_score: "INTEGER 0-100 - Brand guideline adherence"
```

### 3. WhatsApp Delivery & Communication Domain

#### 3.1 Delivery Management Model
```yaml
delivery_management_model:
  delivery_identification:
    delivery_id: "SERIAL PRIMARY KEY"
    content_pack_id: "FK to content_packs"
    advisor_id: "FK to advisors"
    batch_id: "VARCHAR(100) - Grouping related deliveries"
    delivery_attempt: "INTEGER DEFAULT 1 - Retry attempt number"
    
  channel_configuration:
    delivery_channel: "ENUM('whatsapp', 'whatsapp_status', 'sms_backup', 'email_backup')"
    content_variant: "ENUM('post', 'status', 'linkedin') - Content type"
    template_used: "FK to wa_templates - WhatsApp template reference"
    message_format: "ENUM('text', 'image', 'document', 'template')"
    
  whatsapp_specifics:
    wa_phone_number_used: "VARCHAR(20) - Sending phone number"
    wa_message_id: "VARCHAR(255) - WhatsApp API message ID"
    wa_conversation_id: "VARCHAR(255) - WhatsApp conversation reference"
    message_direction: "ENUM('outbound', 'inbound') - Message direction"
    
  delivery_tracking:
    status: "ENUM('queued', 'throttled', 'sent', 'delivered', 'read', 'failed', 'expired')"
    queued_at: "TIMESTAMP DEFAULT NOW() - When queued for delivery"
    scheduled_for: "TIMESTAMP NOT NULL - Target delivery time"
    sent_at: "TIMESTAMP - Actual send time"
    delivered_at: "TIMESTAMP - WhatsApp delivery confirmation"
    read_at: "TIMESTAMP - Read receipt timestamp"
    failed_at: "TIMESTAMP - Failure timestamp"
    
  sla_compliance:
    sla_target_time: "TIMESTAMP - 06:05 IST target"
    sla_compliance_status: "ENUM('met', 'missed', 'pending')"
    delay_seconds: "INTEGER - Seconds past SLA target"
    delay_reason: "VARCHAR(255) - Reason for delay"
    
  retry_logic:
    retry_count: "INTEGER DEFAULT 0"
    max_retries: "INTEGER DEFAULT 3"
    next_retry_at: "TIMESTAMP - Next retry attempt"
    retry_strategy: "ENUM('immediate', 'exponential', 'scheduled')"
    
  error_handling:
    error_code: "VARCHAR(50) - WhatsApp API error code"
    error_message: "TEXT - Detailed error description"
    error_category: "ENUM('rate_limit', 'invalid_number', 'content_violation', 'system_error')"
    recoverable: "BOOLEAN - Whether retry is possible"
    
  delivery_metadata:
    recipient_count: "INTEGER DEFAULT 1 - Number of recipients"
    message_size_bytes: "INTEGER - Message size"
    api_response_time_ms: "INTEGER - WhatsApp API response time"
    delivery_cost_cents: "INTEGER - Delivery cost"
    
  constraints:
    - "CHECK (retry_count >= 0 AND retry_count <= max_retries)"
    - "CHECK (sent_at IS NULL OR delivered_at IS NULL OR sent_at <= delivered_at)"
    - "CHECK (delivered_at IS NULL OR read_at IS NULL OR delivered_at <= read_at)"
    - "CHECK (status != 'failed' OR error_code IS NOT NULL)"
    
  indexes:
    primary: "delivery_id"
    workflow: ["advisor_id", "status", "scheduled_for"]
    sla_monitoring: ["DATE(scheduled_for)", "sla_compliance_status"]
    retry_queue: ["status", "next_retry_at"] WHERE status = 'failed'
    performance: ["wa_message_id", "sent_at DESC"]
```

#### 3.2 WhatsApp Template Management
```yaml
whatsapp_template_model:
  template_identification:
    template_id: "SERIAL PRIMARY KEY"
    template_name: "VARCHAR(100) UNIQUE - WhatsApp template name"
    template_category: "ENUM('utility', 'marketing', 'authentication')"
    language_code: "VARCHAR(5) - ISO language code"
    
  template_structure:
    template_components: "JSONB - Header, body, footer, buttons"
    # Structure: {
    #   "header": {"type": "image", "format": "IMAGE"},
    #   "body": {"text": "Your daily market insight is ready, *{{1}}*..."},
    #   "footer": {"text": "Project One - SEBI Compliant Content"},
    #   "buttons": [{"type": "URL", "text": "View More", "url": "..."}]
    # }
    parameter_count: "INTEGER - Number of dynamic parameters"
    parameter_types: "TEXT[] - Parameter data types"
    
  compliance_approval:
    meta_approval_status: "ENUM('pending', 'approved', 'rejected', 'disabled')"
    meta_submission_date: "TIMESTAMP - When submitted to Meta"
    meta_approval_date: "TIMESTAMP - When approved by Meta"
    rejection_reason: "TEXT - Meta rejection feedback"
    
  usage_tracking:
    usage_count: "INTEGER DEFAULT 0"
    last_used_at: "TIMESTAMP"
    performance_score: "DECIMAL(5,4) - Delivery success rate"
    compliance_score: "INTEGER 0-100 - SEBI compliance rating"
    
  template_versions:
    version_number: "INTEGER DEFAULT 1"
    previous_version_id: "FK to wa_templates - Version history"
    change_reason: "TEXT - Why template was updated"
    created_by: "FK to admin_users"
    
  regional_compliance:
    india_compliance_status: "ENUM('compliant', 'under_review', 'non_compliant')"
    sebi_disclaimer_included: "BOOLEAN DEFAULT true"
    dnd_compliance: "BOOLEAN DEFAULT true - Do Not Disturb compliance"
    language_appropriateness: "JSONB - Cultural sensitivity scores"
```

### 4. AI & Compliance Engine Domain

#### 4.1 AI Processing & Analysis Model
```yaml
ai_processing_model:
  ai_job_tracking:
    ai_job_id: "SERIAL PRIMARY KEY"
    content_pack_id: "FK to content_packs"
    processing_stage: "ENUM('generation', 'compliance_check', 'enhancement', 'translation')"
    job_status: "ENUM('queued', 'processing', 'completed', 'failed')"
    
  model_configuration:
    ai_model_name: "VARCHAR(100) - OpenAI model identifier"
    model_version: "VARCHAR(50) - Model version"
    prompt_template_id: "FK to prompt_templates"
    prompt_version: "VARCHAR(50) - Prompt version used"
    temperature: "DECIMAL(3,2) - Model creativity setting"
    max_tokens: "INTEGER - Token limit"
    
  input_processing:
    input_content_hash: "VARCHAR(64) - SHA-256 of input"
    input_token_count: "INTEGER - Tokens in input"
    input_language: "VARCHAR(2) - Input language code"
    processing_context: "JSONB - Additional context data"
    
  ai_output_results:
    output_content_hash: "VARCHAR(64) - SHA-256 of output"
    output_token_count: "INTEGER - Tokens in output"
    confidence_score: "DECIMAL(5,4) - AI confidence in output"
    alternative_outputs: "JSONB - Other generated options"
    
  compliance_analysis:
    sebi_compliance_score: "INTEGER 0-100 - SEBI rule compliance"
    risk_level: "ENUM('low', 'medium', 'high', 'critical')"
    violation_indicators: "TEXT[] - Specific rule violations"
    compliance_suggestions: "TEXT[] - Improvement recommendations"
    human_review_required: "BOOLEAN - Escalation flag"
    
  performance_metrics:
    processing_time_ms: "INTEGER - Processing duration"
    queue_wait_time_ms: "INTEGER - Time in queue"
    api_cost_cents: "INTEGER - API call cost"
    cache_hit: "BOOLEAN - Whether result was cached"
    
  quality_assurance:
    output_quality_score: "INTEGER 0-100 - Content quality rating"
    readability_score: "INTEGER 0-100 - Reading ease"
    engagement_prediction: "DECIMAL(5,4) - Predicted engagement"
    brand_consistency: "INTEGER 0-100 - Brand alignment"
    
  audit_trail:
    processed_at: "TIMESTAMP DEFAULT NOW()"
    processed_by: "ENUM('system', 'admin_override', 'fallback')"
    audit_log_id: "FK to ai_audit_logs"
    retention_until: "DATE - 5-year compliance retention"
    
  constraints:
    - "CHECK (sebi_compliance_score >= 0 AND sebi_compliance_score <= 100)"
    - "CHECK (confidence_score >= 0 AND confidence_score <= 1)"
    - "CHECK (processing_time_ms > 0)"
    - "CHECK (temperature >= 0 AND temperature <= 2)"
    
  indexes:
    primary: "ai_job_id"
    performance: ["processing_stage", "job_status", "processed_at DESC"]
    compliance: ["sebi_compliance_score DESC", "risk_level"]
    cost_tracking: ["api_cost_cents DESC", "processed_at DESC"]
```

#### 4.2 Compliance Rule Engine Model
```yaml
compliance_rule_engine_model:
  rule_definitions:
    rule_id: "SERIAL PRIMARY KEY"
    rule_name: "VARCHAR(100) UNIQUE - Human readable rule name"
    rule_category: "ENUM('sebi_mandatory', 'sebi_recommended', 'platform_policy', 'dpdp_compliance')"
    severity_level: "ENUM('info', 'warning', 'error', 'critical')"
    
  rule_logic:
    rule_expression: "TEXT - Rule logic in domain-specific language"
    # Example: "CONTAINS(content, 'guaranteed returns') AND NOT CONTAINS(content, 'subject to market risks')"
    rule_parameters: "JSONB - Configurable rule parameters"
    evaluation_order: "INTEGER - Rule execution priority"
    
  regulatory_context:
    sebi_regulation_reference: "VARCHAR(255) - SEBI circular/regulation"
    effective_date: "DATE - When rule became effective"
    expiry_date: "DATE - Rule expiration if applicable"
    jurisdiction: "VARCHAR(100) DEFAULT 'India' - Applicable jurisdiction"
    
  rule_execution:
    is_active: "BOOLEAN DEFAULT true"
    auto_fix_available: "BOOLEAN DEFAULT false - Can be auto-corrected"
    human_review_required: "BOOLEAN DEFAULT false - Needs human validation"
    escalation_threshold: "INTEGER - Score threshold for escalation"
    
  performance_tracking:
    execution_count: "INTEGER DEFAULT 0"
    violation_count: "INTEGER DEFAULT 0"
    false_positive_count: "INTEGER DEFAULT 0"
    average_execution_time_ms: "INTEGER"
    
  rule_versioning:
    version_number: "INTEGER DEFAULT 1"
    change_reason: "TEXT - Why rule was updated"
    created_by: "FK to admin_users"
    approved_by: "FK to admin_users"
    last_updated: "TIMESTAMP DEFAULT NOW()"
    
  constraints:
    - "CHECK (severity_level IN ('info', 'warning', 'error', 'critical'))"
    - "CHECK (evaluation_order > 0)"
    - "CHECK (escalation_threshold >= 0 AND escalation_threshold <= 100)"
    
  indexes:
    primary: "rule_id"
    execution: ["is_active", "evaluation_order"]
    performance: ["execution_count DESC", "average_execution_time_ms"]
    compliance: ["rule_category", "severity_level"]
```

### 5. Audit & Compliance Tracking Domain

#### 5.1 Comprehensive Audit Trail Model
```yaml
audit_trail_model:
  audit_event_tracking:
    audit_id: "SERIAL PRIMARY KEY"
    event_timestamp: "TIMESTAMP NOT NULL DEFAULT NOW()"
    event_type: "ENUM('create', 'update', 'delete', 'approve', 'reject', 'escalate', 'deliver')"
    event_category: "ENUM('content', 'advisor', 'delivery', 'compliance', 'system')"
    
  actor_identification:
    actor_type: "ENUM('advisor', 'admin', 'system', 'api', 'ai_agent')"
    actor_id: "INTEGER - Reference to user ID"
    actor_role: "VARCHAR(50) - Role at time of action"
    actor_ip_address: "INET - Source IP address"
    
  target_entity:
    entity_type: "VARCHAR(50) - Type of entity affected"
    entity_id: "INTEGER - ID of affected entity"
    entity_identifier: "VARCHAR(255) - Human readable identifier"
    
  change_details:
    old_values: "JSONB - Previous state"
    new_values: "JSONB - New state"
    changed_fields: "TEXT[] - List of modified fields"
    change_reason: "TEXT - Reason for change"
    
  request_context:
    session_id: "VARCHAR(100) - User session identifier"
    request_id: "VARCHAR(100) - Request tracing ID"
    user_agent: "TEXT - Browser/client information"
    referer_url: "VARCHAR(500) - Source page"
    
  compliance_context:
    compliance_impact: "ENUM('none', 'low', 'medium', 'high') - Regulatory relevance"
    sebi_relevance: "BOOLEAN DEFAULT false - SEBI compliance relevance"
    data_sensitivity: "ENUM('public', 'internal', 'confidential', 'pii')"
    retention_period_years: "INTEGER DEFAULT 7 - Legal retention requirement"
    
  business_context:
    business_process: "VARCHAR(100) - Related business process"
    workflow_stage: "VARCHAR(100) - Stage in workflow"
    approval_chain: "JSONB - Approval hierarchy context"
    
  audit_metadata:
    checksum: "VARCHAR(64) - SHA-256 of audit record for integrity"
    immutable: "BOOLEAN DEFAULT true - Record cannot be modified"
    archived_at: "TIMESTAMP - When moved to archive"
    retention_until: "DATE - When can be deleted per DPDP Act"
    
  constraints:
    - "CHECK (retention_period_years >= 1 AND retention_period_years <= 10)"
    - "CHECK (immutable = true OR actor_type = 'system')"
    
  indexes:
    primary: "audit_id"
    actor_tracking: ["actor_type", "actor_id", "event_timestamp DESC"]
    entity_tracking: ["entity_type", "entity_id", "event_timestamp DESC"]
    compliance_queries: ["sebi_relevance", "compliance_impact", "event_timestamp DESC"]
    retention_management: ["retention_until", "archived_at"]
```

#### 5.2 Compliance Incident Management Model
```yaml
compliance_incident_model:
  incident_identification:
    incident_id: "SERIAL PRIMARY KEY"
    incident_number: "VARCHAR(50) UNIQUE - Human readable incident ID"
    incident_type: "ENUM('sebi_violation', 'content_policy_breach', 'data_privacy_issue', 'platform_misuse')"
    severity: "ENUM('low', 'medium', 'high', 'critical')"
    
  incident_context:
    content_pack_id: "FK to content_packs - Related content if applicable"
    advisor_id: "FK to advisors - Involved advisor"
    detected_by: "ENUM('ai_system', 'admin_review', 'external_report', 'advisor_report')"
    detection_timestamp: "TIMESTAMP DEFAULT NOW()"
    
  regulatory_details:
    sebi_regulation_violated: "VARCHAR(255) - Specific SEBI rule"
    violation_description: "TEXT NOT NULL - Detailed description"
    potential_penalty: "VARCHAR(255) - Possible regulatory consequences"
    regulator_notification_required: "BOOLEAN DEFAULT false"
    
  impact_assessment:
    affected_content_count: "INTEGER DEFAULT 0"
    affected_advisor_count: "INTEGER DEFAULT 0"
    affected_client_count: "INTEGER DEFAULT 0"
    business_impact: "ENUM('none', 'low', 'medium', 'high', 'critical')"
    reputational_risk: "ENUM('none', 'low', 'medium', 'high', 'critical')"
    
  resolution_tracking:
    status: "ENUM('open', 'investigating', 'escalated', 'resolved', 'closed')"
    assigned_to: "FK to admin_users - Responsible admin"
    resolution_plan: "TEXT - Planned resolution approach"
    resolution_actions: "JSONB - Actions taken"
    lessons_learned: "TEXT - Process improvements identified"
    
  timeline_management:
    target_resolution_date: "DATE - SLA for resolution"
    actual_resolution_date: "DATE - When actually resolved"
    escalation_deadline: "TIMESTAMP - When to escalate"
    last_updated: "TIMESTAMP DEFAULT NOW()"
    
  communication_log:
    internal_notes: "JSONB - Internal communication history"
    external_communication: "JSONB - External stakeholder communication"
    advisor_notification_sent: "BOOLEAN DEFAULT false"
    regulator_notification_sent: "BOOLEAN DEFAULT false"
    
  prevention_measures:
    root_cause_analysis: "TEXT - Why incident occurred"
    preventive_measures: "TEXT - How to prevent recurrence"
    policy_updates_required: "BOOLEAN DEFAULT false"
    training_required: "BOOLEAN DEFAULT false"
    
  constraints:
    - "CHECK (actual_resolution_date IS NULL OR actual_resolution_date >= detection_timestamp)"
    - "CHECK (status != 'resolved' OR resolution_actions IS NOT NULL)"
    
  indexes:
    primary: "incident_id"
    management: ["status", "severity", "target_resolution_date"]
    advisor_tracking: ["advisor_id", "detection_timestamp DESC"]
    regulatory: ["sebi_regulation_violated", "severity"]
```

### 6. Analytics & Intelligence Domain

#### 6.1 Advisor Performance Analytics Model
```yaml
advisor_analytics_model:
  performance_measurement:
    analytics_id: "SERIAL PRIMARY KEY"
    advisor_id: "FK to advisors"
    measurement_period: "ENUM('daily', 'weekly', 'monthly', 'quarterly')"
    period_start_date: "DATE NOT NULL"
    period_end_date: "DATE NOT NULL"
    
  content_creation_metrics:
    content_pieces_created: "INTEGER DEFAULT 0"
    content_pieces_approved: "INTEGER DEFAULT 0"
    content_pieces_rejected: "INTEGER DEFAULT 0"
    average_approval_time_hours: "DECIMAL(8,2)"
    revision_cycles_average: "DECIMAL(5,2)"
    
  compliance_performance:
    compliance_score_average: "DECIMAL(5,4)"
    compliance_incidents_count: "INTEGER DEFAULT 0"
    auto_approval_rate: "DECIMAL(5,4)"
    escalation_rate: "DECIMAL(5,4)"
    improvement_trajectory: "DECIMAL(5,4) - Month-over-month improvement"
    
  delivery_performance:
    scheduled_deliveries: "INTEGER DEFAULT 0"
    successful_deliveries: "INTEGER DEFAULT 0"
    failed_deliveries: "INTEGER DEFAULT 0"
    sla_compliance_rate: "DECIMAL(5,4)"
    average_delivery_time_seconds: "INTEGER"
    
  engagement_analytics:
    total_messages_sent: "INTEGER DEFAULT 0"
    messages_delivered: "INTEGER DEFAULT 0"
    messages_read: "INTEGER DEFAULT 0"
    client_responses_received: "INTEGER DEFAULT 0"
    engagement_rate: "DECIMAL(5,4)"
    
  platform_usage:
    login_frequency: "INTEGER DEFAULT 0 - Logins in period"
    session_duration_minutes: "INTEGER DEFAULT 0 - Total session time"
    feature_adoption_score: "DECIMAL(5,4) - Feature usage breadth"
    mobile_usage_percentage: "DECIMAL(5,4)"
    
  business_impact:
    estimated_time_saved_hours: "DECIMAL(8,2)"
    productivity_improvement: "DECIMAL(5,4)"
    client_satisfaction_proxy: "DECIMAL(5,4)"
    platform_value_score: "DECIMAL(5,4)"
    
  predictive_insights:
    churn_risk_score: "DECIMAL(5,4) - Likelihood to churn"
    engagement_forecast: "DECIMAL(5,4) - Predicted next period engagement"
    feature_recommendation_ids: "INTEGER[] - Suggested features to adopt"
    optimization_opportunities: "JSONB - Improvement suggestions"
    
  benchmarking:
    peer_group_percentile: "INTEGER 0-100 - Relative performance"
    industry_benchmark_score: "DECIMAL(5,4)"
    improvement_potential: "DECIMAL(5,4)"
    
  constraints:
    - "CHECK (period_end_date >= period_start_date)"
    - "CHECK (compliance_score_average >= 0 AND compliance_score_average <= 1)"
    - "CHECK (sla_compliance_rate >= 0 AND sla_compliance_rate <= 1)"
    
  indexes:
    primary: "analytics_id"
    advisor_time_series: ["advisor_id", "period_start_date DESC"]
    performance_ranking: ["compliance_score_average DESC", "engagement_rate DESC"]
    benchmarking: ["peer_group_percentile DESC", "period_start_date DESC"]
```

#### 6.2 Content Performance Intelligence Model
```yaml
content_intelligence_model:
  content_performance_tracking:
    performance_id: "SERIAL PRIMARY KEY"
    content_pack_id: "FK to content_packs"
    measurement_date: "DATE NOT NULL"
    data_freshness: "TIMESTAMP DEFAULT NOW()"
    
  engagement_metrics:
    delivery_count: "INTEGER DEFAULT 0"
    delivery_success_rate: "DECIMAL(5,4)"
    read_count: "INTEGER DEFAULT 0"
    read_rate: "DECIMAL(5,4)"
    response_count: "INTEGER DEFAULT 0"
    response_rate: "DECIMAL(5,4)"
    
  content_quality_scores:
    ai_predicted_engagement: "DECIMAL(5,4)"
    actual_engagement: "DECIMAL(5,4)"
    prediction_accuracy: "DECIMAL(5,4)"
    content_quality_score: "INTEGER 0-100"
    readability_score: "INTEGER 0-100"
    
  topic_performance:
    topic_family: "VARCHAR(100)"
    topic_engagement_rank: "INTEGER - Rank within topic category"
    seasonal_performance_factor: "DECIMAL(5,4)"
    trending_score: "DECIMAL(5,4)"
    
  compliance_efficiency:
    compliance_score_final: "INTEGER 0-100"
    revision_count: "INTEGER DEFAULT 0"
    approval_time_hours: "DECIMAL(8,2)"
    escalation_required: "BOOLEAN DEFAULT false"
    
  multi_language_performance:
    language_performance: "JSONB - Performance by language"
    # Structure: {
    #   "en": {"read_rate": 0.75, "response_rate": 0.12},
    #   "hi": {"read_rate": 0.82, "response_rate": 0.18},
    #   "mr": {"read_rate": 0.78, "response_rate": 0.15}
    # }
    optimal_language_mix: "JSONB - Recommended language distribution"
    
  advisor_segment_performance:
    advisor_tier_performance: "JSONB - Performance by subscription tier"
    advisor_type_performance: "JSONB - Performance by RIA vs MFD"
    geography_performance: "JSONB - Performance by region"
    
  temporal_analysis:
    time_of_day_performance: "JSONB - Performance by hour"
    day_of_week_performance: "JSONB - Performance by weekday"
    seasonal_trends: "JSONB - Monthly/quarterly patterns"
    
  competitive_intelligence:
    market_trend_alignment: "DECIMAL(5,4) - Alignment with market trends"
    content_uniqueness_score: "DECIMAL(5,4) - Differentiation factor"
    viral_potential: "DECIMAL(5,4) - Likelihood of sharing"
    
  actionable_insights:
    optimization_recommendations: "TEXT[] - Specific improvement suggestions"
    replication_value: "DECIMAL(5,4) - Value for creating similar content"
    fallback_suitability: "DECIMAL(5,4) - Suitability as fallback content"
    
  constraints:
    - "CHECK (delivery_success_rate >= 0 AND delivery_success_rate <= 1)"
    - "CHECK (read_rate >= 0 AND read_rate <= 1)"
    - "CHECK (content_quality_score >= 0 AND content_quality_score <= 100)"
    
  indexes:
    primary: "performance_id"
    content_tracking: ["content_pack_id", "measurement_date DESC"]
    topic_analysis: ["topic_family", "actual_engagement DESC"]
    trending: ["trending_score DESC", "measurement_date DESC"]
```

### 7. Fallback & Continuity System Domain

#### 7.1 Intelligent Fallback Content Model
```yaml
fallback_content_model:
  fallback_identification:
    fallback_id: "SERIAL PRIMARY KEY"
    content_category: "VARCHAR(100) - Content classification"
    priority_score: "INTEGER 0-100 - Selection priority"
    languages_available: "TEXT[] CHECK languages IN ('EN','HI','MR')"
    
  content_data:
    content_json: "JSONB NOT NULL - Multi-language content structure"
    # Structure: Same as content_packs.content_json
    asset_urls: "JSONB - Pre-rendered image URLs"
    content_hash: "VARCHAR(64) - Content integrity hash"
    
  quality_metrics:
    engagement_score: "DECIMAL(5,4) - Historical engagement"
    compliance_rating: "INTEGER 0-100 - SEBI compliance score"
    content_quality_rating: "INTEGER 0-100 - Editorial quality"
    freshness_score: "DECIMAL(5,4) - Content relevance over time"
    
  usage_tracking:
    usage_count: "INTEGER DEFAULT 0"
    last_used_date: "DATE"
    success_rate: "DECIMAL(5,4) - Delivery success when used"
    advisor_feedback_score: "DECIMAL(5,4) - Advisor satisfaction"
    
  seasonal_relevance:
    applicable_months: "INTEGER[] - Months when relevant (1-12)"
    market_conditions: "TEXT[] - Applicable market states"
    excluded_periods: "JSONB - When not to use"
    cultural_events: "TEXT[] - Relevant festivals/events"
    
  ai_curation:
    ai_selection_score: "DECIMAL(5,4) - AI recommendation confidence"
    topic_match_algorithm: "VARCHAR(100) - Selection algorithm used"
    personalization_factors: "JSONB - Advisor-specific adjustments"
    market_timing_score: "DECIMAL(5,4) - Market relevance"
    
  lifecycle_management:
    created_at: "TIMESTAMP DEFAULT NOW()"
    expires_at: "TIMESTAMP - Content expiration"
    approved_by: "FK to admin_users"
    approval_timestamp: "TIMESTAMP"
    retirement_reason: "TEXT - Why content was retired"
    
  performance_prediction:
    predicted_engagement: "DECIMAL(5,4) - AI engagement prediction"
    confidence_interval: "DECIMAL(5,4) - Prediction confidence"
    optimal_advisor_segments: "JSONB - Best fit advisor types"
    anti_patterns: "JSONB - When not to use"
    
  constraints:
    - "CHECK (priority_score >= 0 AND priority_score <= 100)"
    - "CHECK (engagement_score >= 0 AND engagement_score <= 1)"
    - "CHECK (compliance_rating >= 0 AND compliance_rating <= 100)"
    - "CHECK (array_length(applicable_months, 1) > 0)"
    
  indexes:
    primary: "fallback_id"
    selection: ["priority_score DESC", "engagement_score DESC", "last_used_date ASC NULLS FIRST"]
    seasonal: ["applicable_months", "market_conditions"]
    quality: ["compliance_rating DESC", "content_quality_rating DESC"]
```

#### 7.2 Fallback Selection Intelligence Model
```yaml
fallback_selection_model:
  selection_event_tracking:
    selection_id: "SERIAL PRIMARY KEY"
    advisor_id: "FK to advisors"
    fallback_content_id: "FK to fallback_packs"
    selection_timestamp: "TIMESTAMP DEFAULT NOW()"
    trigger_reason: "ENUM('no_content', 'compliance_failure', 'approval_delay', 'system_fallback')"
    
  selection_algorithm:
    algorithm_version: "VARCHAR(50) - Selection algorithm version"
    selection_criteria: "JSONB - Criteria used for selection"
    # Structure: {
    #   "advisor_preferences": {"topic_affinity": 0.8, "language": "HI"},
    #   "market_context": {"volatility": "high", "sentiment": "bearish"},
    #   "seasonal_factors": {"month": 12, "events": ["year_end"]},
    #   "usage_history": {"avoid_recent": true, "max_reuse_days": 30}
    # }
    
  contextual_factors:
    market_conditions: "JSONB - Current market state"
    advisor_profile_match: "DECIMAL(5,4) - Profile compatibility"
    content_freshness: "DECIMAL(5,4) - How recent/relevant"
    seasonal_appropriateness: "DECIMAL(5,4) - Seasonal fit"
    
  selection_scoring:
    base_score: "DECIMAL(5,4) - Algorithm base score"
    personalization_adjustment: "DECIMAL(5,4) - Advisor-specific boost"
    recency_penalty: "DECIMAL(5,4) - Recent usage penalty"
    final_selection_score: "DECIMAL(5,4) - Final composite score"
    
  alternative_options:
    runner_up_content_ids: "INTEGER[] - Other considered options"
    runner_up_scores: "DECIMAL(5,4)[] - Scores of alternatives"
    selection_confidence: "DECIMAL(5,4) - Confidence in choice"
    
  outcome_tracking:
    delivery_success: "BOOLEAN - Whether delivery succeeded"
    advisor_satisfaction: "INTEGER 1-5 - Advisor rating if provided"
    client_engagement: "DECIMAL(5,4) - Client interaction metrics"
    would_reselect: "BOOLEAN - Whether algorithm would choose again"
    
  feedback_loop:
    advisor_feedback: "TEXT - Advisor comments on selection"
    improvement_suggestions: "TEXT[] - How to improve selection"
    selection_quality_score: "INTEGER 0-100 - Outcome quality"
    
  system_learning:
    feature_importance: "JSONB - Which factors were most important"
    prediction_accuracy: "DECIMAL(5,4) - How accurate was prediction"
    model_updates_triggered: "BOOLEAN - Whether selection influenced model"
    
  constraints:
    - "CHECK (advisor_profile_match >= 0 AND advisor_profile_match <= 1)"
    - "CHECK (final_selection_score >= 0 AND final_selection_score <= 1)"
    - "CHECK (advisor_satisfaction IS NULL OR (advisor_satisfaction >= 1 AND advisor_satisfaction <= 5))"
    
  indexes:
    primary: "selection_id"
    advisor_tracking: ["advisor_id", "selection_timestamp DESC"]
    algorithm_performance: ["algorithm_version", "selection_quality_score DESC"]
    learning: ["prediction_accuracy DESC", "selection_timestamp DESC"]
```

---

## Data Integration & Flow Architecture

### 1. Real-Time Data Pipeline Design

#### 1.1 Event-Driven Architecture
```yaml
event_driven_system:
  event_sources:
    advisor_actions:
      - content_creation_started
      - content_submitted_for_approval
      - profile_updated
      - whatsapp_connected
      
    admin_actions:
      - content_approved
      - content_rejected
      - policy_updated
      - incident_created
      
    system_events:
      - delivery_scheduled
      - delivery_completed
      - compliance_check_completed
      - ai_analysis_finished
      
    external_events:
      - whatsapp_delivery_status
      - market_data_updated
      - regulatory_news
      - template_approval_status

  event_processing:
    real_time_streams:
      - compliance_scoring_pipeline
      - delivery_orchestration_pipeline
      - analytics_aggregation_pipeline
      - notification_distribution_pipeline
      
    batch_processing:
      - daily_performance_calculations
      - weekly_advisor_reports
      - monthly_compliance_audits
      - quarterly_business_intelligence

  data_consistency:
    acid_transactions: "Critical business operations"
    eventual_consistency: "Analytics and reporting"
    conflict_resolution: "Last-write-wins with timestamp"
    data_validation: "Schema enforcement at ingestion"
```

#### 1.2 Data Synchronization Patterns
```yaml
synchronization_architecture:
  master_data_management:
    golden_records:
      - advisor_profile (advisors table as source of truth)
      - content_definition (content_packs table as master)
      - compliance_rules (policy_versions as authoritative)
      
    data_propagation:
      - real_time_updates: "Critical workflow data"
      - near_real_time: "Analytics and reporting"
      - batch_updates: "Historical analysis and archival"
      
  caching_strategy:
    redis_cache_layers:
      - session_cache: "User sessions and preferences (TTL: 24h)"
      - compliance_rules_cache: "Active compliance rules (TTL: 1h)"
      - content_templates_cache: "Approved templates (TTL: 12h)"
      - advisor_profiles_cache: "Frequently accessed profiles (TTL: 6h)"
      
    cache_invalidation:
      - event_based: "Immediate invalidation on data changes"
      - time_based: "TTL expiration for stale data"
      - manual_triggers: "Admin-initiated cache refresh"
      
  data_partitioning:
    horizontal_partitioning:
      - audit_logs: "Monthly partitions for 7-year retention"
      - deliveries: "Daily partitions for performance"
      - ai_audit_logs: "Monthly partitions for cost tracking"
      
    vertical_partitioning:
      - advisor_profiles: "Separate PII from behavioral data"
      - content_packs: "Separate metadata from content blob"
```

### 2. Analytics & Business Intelligence Architecture

#### 2.1 Data Warehouse Design
```yaml
analytics_warehouse_design:
  dimensional_modeling:
    fact_tables:
      fact_content_performance:
        - content_pack_id (FK)
        - advisor_id (FK)
        - delivery_date (FK)
        - engagement_metrics
        - compliance_scores
        - performance_indicators
        
      fact_delivery_events:
        - delivery_id (FK)
        - advisor_id (FK)
        - date_id (FK)
        - time_id (FK)
        - delivery_metrics
        - sla_compliance_data
        
      fact_advisor_activity:
        - advisor_id (FK)
        - date_id (FK)
        - activity_type (FK)
        - activity_metrics
        - engagement_scores
        
    dimension_tables:
      dim_advisor:
        - advisor_key
        - sebi_reg_no
        - tier
        - type
        - region
        - subscription_status
        
      dim_content:
        - content_key
        - topic_family
        - languages
        - content_type
        - compliance_level
        
      dim_date:
        - date_key
        - full_date
        - day_of_week
        - month
        - quarter
        - fiscal_year
        - is_business_day
        - indian_holidays
        
  aggregation_strategy:
    pre_aggregated_metrics:
      - daily_advisor_performance
      - weekly_content_trends
      - monthly_compliance_summaries
      - quarterly_business_metrics
      
    real_time_aggregations:
      - current_day_delivery_status
      - live_compliance_dashboard
      - real_time_sla_monitoring
      
  data_freshness_sla:
    critical_metrics: "< 5 minutes latency"
    operational_metrics: "< 15 minutes latency" 
    analytical_metrics: "< 1 hour latency"
    historical_reports: "Daily batch processing"
```

#### 2.2 Machine Learning Data Pipeline
```yaml
ml_data_architecture:
  feature_engineering:
    advisor_features:
      - behavioral_patterns: "Login frequency, content creation velocity"
      - compliance_history: "Historical compliance scores, incident patterns"
      - engagement_metrics: "Client interaction rates, response patterns"
      - content_preferences: "Topic affinity, style preferences"
      
    content_features:
      - linguistic_features: "Readability, sentiment, complexity"
      - compliance_features: "Risk indicators, regulatory compliance"
      - performance_features: "Historical engagement, delivery success"
      - contextual_features: "Market conditions, seasonal relevance"
      
    market_features:
      - volatility_indicators: "Market volatility, news sentiment"
      - seasonal_patterns: "Holiday effects, quarterly patterns"
      - regulatory_changes: "New regulations, policy updates"
      
  model_training_pipeline:
    data_preparation:
      - feature_extraction: "Automated feature generation from raw data"
      - data_validation: "Quality checks and anomaly detection"
      - feature_selection: "Automated relevance scoring"
      
    model_development:
      - engagement_prediction: "Predict content engagement rates"
      - compliance_scoring: "Automated SEBI compliance assessment"
      - churn_prediction: "Advisor retention forecasting"
      - content_optimization: "Recommend content improvements"
      
    model_deployment:
      - a_b_testing: "Model performance comparison"
      - gradual_rollout: "Phased model deployment"
      - performance_monitoring: "Continuous accuracy tracking"
      - feedback_incorporation: "Model improvement from outcomes"
      
  prediction_serving:
    real_time_inference:
      - compliance_scoring: "< 500ms response time"
      - content_recommendations: "< 1s response time"
      - engagement_prediction: "< 200ms response time"
      
    batch_predictions:
      - daily_advisor_insights: "Overnight processing"
      - weekly_content_planning: "Weekly batch job"
      - monthly_churn_scoring: "Monthly risk assessment"
```

---

## Data Privacy & Compliance Framework

### 1. DPDP Act 2023 Implementation

#### 1.1 Data Classification & Protection
```yaml
data_classification_framework:
  data_categories:
    personal_identifiable_information:
      - advisor_email: "Encrypted at rest, masked in logs"
      - phone_numbers: "Tokenized, access logged"
      - sebi_registration: "Business data, audit trail required"
      - financial_information: "Encrypted, restricted access"
      
    sensitive_personal_data:
      - behavioral_analytics: "Anonymized aggregation"
      - content_preferences: "Pseudonymized, consent required"
      - performance_metrics: "Aggregated reporting only"
      
    business_operational_data:
      - content_metadata: "Standard protection"
      - delivery_logs: "Retention policy applied"
      - system_metrics: "Anonymized processing"
      
  protection_mechanisms:
    encryption_at_rest:
      - database_encryption: "AES-256 full database encryption"
      - file_storage_encryption: "Client-side encryption before upload"
      - backup_encryption: "Separate keys for backup data"
      
    encryption_in_transit:
      - tls_1_3: "All API communications"
      - certificate_pinning: "Mobile app security"
      - vpn_requirements: "Admin access restrictions"
      
    access_controls:
      - role_based_access: "Principle of least privilege"
      - multi_factor_authentication: "Required for admin access"
      - session_management: "Automated timeout and rotation"
      - audit_logging: "All access logged and monitored"
      
  consent_management:
    consent_types:
      - processing_consent: "Required for platform usage"
      - marketing_consent: "Optional for promotional content"
      - analytics_consent: "Optional for usage analytics"
      - third_party_sharing: "Explicit consent for integrations"
      
    consent_tracking:
      - consent_timestamp: "When consent was given"
      - consent_version: "Version of privacy policy"
      - consent_channel: "How consent was obtained"
      - withdrawal_mechanism: "Easy consent withdrawal"
      
  data_subject_rights:
    right_to_access:
      - data_export_api: "Self-service data export"
      - processing_transparency: "Clear processing descriptions"
      - third_party_disclosure: "List of data sharing"
      
    right_to_rectification:
      - self_service_updates: "Profile update capabilities"
      - data_correction_workflow: "Admin-assisted corrections"
      - accuracy_validation: "Automated data quality checks"
      
    right_to_erasure:
      - account_deletion: "Complete data removal"
      - retention_compliance: "Automated deletion schedules"
      - audit_preservation: "Legal requirement exceptions"
      - anonymization_procedures: "Data anonymization options"
```

#### 1.2 Data Retention & Archival Strategy
```yaml
retention_strategy:
  regulatory_requirements:
    sebi_compliance:
      - audit_trail_retention: "7 years minimum"
      - content_approval_records: "7 years from approval date"
      - compliance_incident_records: "10 years from resolution"
      - advisor_registration_records: "5 years after deregistration"
      
    dpdp_act_requirements:
      - personal_data_retention: "As long as purpose exists + 6 months"
      - consent_records: "Until consent withdrawn + 3 years"
      - processing_logs: "3 years from processing date"
      
  automated_retention_policies:
    data_lifecycle_management:
      - active_data: "Real-time access, high-performance storage"
      - warm_data: "3-12 months old, standard storage"
      - cold_data: "1-7 years old, archival storage"
      - frozen_data: "Legal hold, immutable storage"
      
    deletion_automation:
      - scheduled_purging: "Automated deletion based on retention rules"
      - compliance_verification: "Pre-deletion compliance checks"
      - secure_deletion: "Cryptographic erasure methods"
      - deletion_audit_trail: "Record of all deletion activities"
      
  archival_infrastructure:
    storage_tiers:
      - hot_storage: "Active operational data (0-3 months)"
      - warm_storage: "Recent historical data (3-12 months)"
      - cold_storage: "Long-term archives (1-7 years)"
      - glacier_storage: "Legal compliance archives (7+ years)"
      
    data_integrity:
      - checksum_verification: "Regular integrity checks"
      - redundancy_strategy: "Geographic replication"
      - backup_verification: "Regular restore testing"
      - immutable_records: "Blockchain-based audit trails"
```

### 2. SEBI Compliance & Audit Framework

#### 2.1 Regulatory Compliance Architecture
```yaml
sebi_compliance_architecture:
  compliance_rule_engine:
    rule_categories:
      mandatory_disclosures:
        - mutual_fund_disclaimers: "Subject to market risks"
        - sebi_registration_display: "SEBI Reg No. mandatory"
        - past_performance_warnings: "Past performance disclaimers"
        
      prohibited_content:
        - guaranteed_returns_claims: "No guarantee promises"
        - misleading_advertisements: "Clear, truthful content"
        - unauthorized_recommendations: "Within advisor scope"
        
      content_standards:
        - clear_communication: "Plain language requirements"
        - risk_disclosure: "Appropriate risk warnings"
        - contact_information: "Advisor contact details"
        
  automated_compliance_checking:
    ai_compliance_engine:
      - natural_language_processing: "Content understanding"
      - rule_matching_algorithms: "Automated rule application"
      - risk_scoring_models: "Compliance risk assessment"
      - improvement_suggestions: "Automated fix recommendations"
      
    human_review_workflow:
      - escalation_triggers: "High-risk content flagging"
      - expert_review_queue: "Compliance specialist review"
      - approval_workflows: "Multi-level approval process"
      - feedback_mechanisms: "Continuous improvement"
      
  audit_trail_requirements:
    immutable_audit_logs:
      - content_creation_trail: "Complete creation history"
      - approval_decision_trail: "All approval decisions"
      - modification_history: "Every content change"
      - access_audit_trail: "Who accessed what when"
      
    regulatory_reporting:
      - monthly_compliance_reports: "Automated report generation"
      - incident_reporting: "Automated incident notifications"
      - advisor_compliance_profiles: "Individual compliance tracking"
      - trend_analysis_reports: "Compliance trend identification"
      
  regulatory_change_management:
    policy_update_workflow:
      - regulatory_monitoring: "Automated regulation tracking"
      - impact_assessment: "Change impact analysis"
      - policy_update_process: "Controlled policy deployment"
      - retroactive_compliance: "Historical content review"
      
    version_control:
      - policy_versioning: "All policy versions tracked"
      - effective_date_management: "Time-based policy application"
      - rollback_capabilities: "Policy rollback procedures"
      - change_documentation: "Complete change rationale"
```

#### 2.2 Audit Support & Investigation Tools
```yaml
audit_support_infrastructure:
  investigation_capabilities:
    forensic_data_analysis:
      - timeline_reconstruction: "Event sequence analysis"
      - correlation_analysis: "Cross-entity relationship mapping"
      - anomaly_detection: "Unusual pattern identification"
      - evidence_preservation: "Legal-grade evidence handling"
      
    reporting_tools:
      - ad_hoc_queries: "Flexible investigation queries"
      - automated_reports: "Standard compliance reports"
      - visualization_tools: "Data visualization for investigations"
      - export_capabilities: "Regulatory submission formats"
      
  regulatory_interface:
    sebi_submission_tools:
      - standardized_formats: "SEBI-compliant data formats"
      - automated_submissions: "Scheduled regulatory filings"
      - compliance_dashboards: "Real-time compliance status"
      - incident_notifications: "Automated incident reporting"
      
    audit_preparation:
      - audit_trail_compilation: "Complete audit package generation"
      - document_indexing: "Searchable document repository"
      - witness_information: "Staff testimony preparation"
      - timeline_documentation: "Chronological event mapping"
      
  compliance_monitoring:
    real_time_dashboards:
      - compliance_score_tracking: "Live compliance metrics"
      - risk_level_monitoring: "Real-time risk assessment"
      - incident_tracking: "Active incident management"
      - trend_analysis: "Compliance trend visualization"
      
    alert_systems:
      - threshold_alerts: "Compliance threshold violations"
      - pattern_alerts: "Unusual behavior patterns"
      - regulatory_alerts: "New regulation notifications"
      - system_health_alerts: "Infrastructure compliance status"
```

---

## Performance & Scalability Architecture

### 1. Database Performance Optimization

#### 1.1 Query Optimization Strategy
```yaml
query_optimization:
  indexing_strategy:
    primary_indexes:
      - advisor_id_indexes: "All advisor-related queries"
      - content_pack_status_indexes: "Workflow management"
      - delivery_scheduling_indexes: "SLA compliance queries"
      - audit_timestamp_indexes: "Temporal audit queries"
      
    composite_indexes:
      - advisor_content_workflow: "(advisor_id, status, created_at DESC)"
      - delivery_sla_monitoring: "(scheduled_for, status, advisor_id)"
      - compliance_priority_queue: "(status, ai_risk_score DESC, created_at)"
      - audit_entity_timeline: "(entity_type, entity_id, timestamp DESC)"
      
    partial_indexes:
      - active_advisors_only: "WHERE status = 'active'"
      - pending_approval_content: "WHERE status = 'pending'"
      - failed_deliveries: "WHERE status = 'failed'"
      
  query_pattern_optimization:
    advisor_dashboard_queries:
      - "Single query for dashboard overview"
      - "Materialized views for complex aggregations"
      - "Cached results with smart invalidation"
      
    content_creation_workflow:
      - "Optimized content submission pipeline"
      - "Bulk approval operations"
      - "Efficient compliance checking queries"
      
    delivery_operations:
      - "Batch delivery scheduling"
      - "SLA monitoring with minimal overhead"
      - "Efficient retry queue management"
      
  database_partitioning:
    time_based_partitioning:
      - audit_logs: "Monthly partitions with automatic management"
      - deliveries: "Daily partitions for performance"
      - ai_audit_logs: "Weekly partitions for cost analysis"
      
    hash_partitioning:
      - advisor_data: "Distribute by advisor_id for parallel processing"
      - content_data: "Distribute by content_pack_id for isolation"
      
  connection_management:
    connection_pooling:
      - application_pools: "Dedicated pools per service"
      - read_replica_routing: "Read-heavy queries to replicas"
      - connection_limits: "Per-service connection limits"
      
    query_caching:
      - redis_query_cache: "Frequently accessed query results"
      - application_cache: "ORM-level caching"
      - cdn_caching: "Static content delivery"
```

#### 1.2 Scalability Architecture
```yaml
scalability_design:
  horizontal_scaling:
    database_sharding:
      - advisor_based_sharding: "Shard by advisor_id for data locality"
      - geography_based_sharding: "Regional data distribution"
      - feature_based_sharding: "Separate read/write workloads"
      
    microservices_architecture:
      - advisor_management_service: "Independent advisor operations"
      - content_pipeline_service: "Content creation and approval"
      - delivery_orchestration_service: "WhatsApp delivery management"
      - analytics_service: "Reporting and intelligence"
      
    load_balancing:
      - application_load_balancers: "HTTP request distribution"
      - database_load_balancers: "Query distribution"
      - cdn_load_balancing: "Asset delivery optimization"
      
  vertical_scaling:
    compute_optimization:
      - cpu_intensive_operations: "AI processing optimization"
      - memory_optimization: "Efficient data structures"
      - io_optimization: "SSD storage for hot data"
      
    resource_allocation:
      - service_resource_limits: "Container resource management"
      - auto_scaling_policies: "Dynamic resource allocation"
      - performance_monitoring: "Resource utilization tracking"
      
  caching_layers:
    multi_tier_caching:
      - browser_cache: "Static asset caching"
      - cdn_cache: "Geographic content distribution"
      - application_cache: "Session and computed data"
      - database_cache: "Query result caching"
      
    cache_coherency:
      - event_driven_invalidation: "Real-time cache updates"
      - ttl_management: "Time-based expiration"
      - cache_warming: "Proactive cache population"
      
  performance_targets:
    response_time_slas:
      - advisor_dashboard: "< 2 seconds page load"
      - content_creation: "< 1 second tool response"
      - compliance_checking: "< 500ms real-time feedback"
      - whatsapp_delivery: "< 5 minutes from schedule"
      
    throughput_requirements:
      - concurrent_advisors: "2000+ simultaneous users"
      - daily_content_volume: "10,000+ content pieces"
      - delivery_capacity: "100,000+ daily deliveries"
      - api_requests: "1,000,000+ daily API calls"
```

### 2. Real-Time Performance Monitoring

#### 2.1 Application Performance Monitoring
```yaml
apm_architecture:
  performance_metrics:
    application_metrics:
      - response_time_distribution: "P50, P95, P99 response times"
      - error_rate_tracking: "5xx error percentages"
      - throughput_monitoring: "Requests per second"
      - resource_utilization: "CPU, memory, disk usage"
      
    business_metrics:
      - advisor_satisfaction_scores: "User experience metrics"
      - content_approval_velocity: "Workflow efficiency"
      - delivery_sla_compliance: "Service level achievement"
      - system_availability: "Uptime and reliability"
      
    infrastructure_metrics:
      - database_performance: "Query execution times"
      - cache_hit_rates: "Caching efficiency"
      - network_latency: "Inter-service communication"
      - storage_performance: "I/O throughput and latency"
      
  alerting_framework:
    critical_alerts:
      - system_downtime: "Service unavailability"
      - sla_violations: "Performance threshold breaches"
      - security_incidents: "Security threat detection"
      - data_integrity_issues: "Data corruption detection"
      
    warning_alerts:
      - performance_degradation: "Approaching threshold limits"
      - resource_exhaustion: "High resource utilization"
      - unusual_patterns: "Anomaly detection alerts"
      - compliance_risks: "Regulatory compliance warnings"
      
  monitoring_tools:
    observability_stack:
      - datadog_apm: "Application performance monitoring"
      - grafana_dashboards: "Custom visualization dashboards"
      - elasticsearch_logs: "Centralized log aggregation"
      - prometheus_metrics: "Time-series metrics collection"
      
    custom_monitoring:
      - advisor_journey_tracking: "End-to-end user experience"
      - compliance_pipeline_monitoring: "Regulatory workflow tracking"
      - whatsapp_delivery_monitoring: "Message delivery tracking"
      - ai_model_performance: "ML model accuracy tracking"
```

#### 2.2 Capacity Planning & Auto-Scaling
```yaml
capacity_planning:
  demand_forecasting:
    usage_pattern_analysis:
      - daily_usage_cycles: "Morning peak usage patterns"
      - seasonal_variations: "Market-driven usage spikes"
      - growth_projections: "Advisor onboarding forecasts"
      - feature_adoption_curves: "New feature usage patterns"
      
    resource_requirement_modeling:
      - compute_scaling_models: "CPU/memory scaling relationships"
      - storage_growth_projections: "Data growth rate analysis"
      - network_bandwidth_planning: "Traffic growth forecasting"
      - database_scaling_requirements: "Query volume projections"
      
  auto_scaling_policies:
    horizontal_auto_scaling:
      - pod_scaling: "Kubernetes HPA for application services"
      - database_scaling: "Read replica auto-scaling"
      - cache_scaling: "Redis cluster auto-scaling"
      
    vertical_auto_scaling:
      - resource_adjustment: "Dynamic resource allocation"
      - performance_based_scaling: "Response time triggers"
      - cost_optimization: "Efficient resource utilization"
      
  capacity_optimization:
    resource_efficiency:
      - container_optimization: "Right-sized container resources"
      - database_optimization: "Query and schema optimization"
      - cache_optimization: "Efficient cache utilization"
      - cdn_optimization: "Content delivery optimization"
      
    cost_management:
      - reserved_capacity: "Long-term resource commitments"
      - spot_instances: "Cost-effective batch processing"
      - resource_scheduling: "Off-peak resource usage"
      - efficiency_monitoring: "Cost per transaction tracking"
```

---

## Technical Implementation Guidelines

### 1. Database Schema Implementation

#### 1.1 PostgreSQL Optimization Configuration
```sql
-- Performance Optimization Settings
-- postgresql.conf optimizations for Project One

-- Memory Configuration
shared_buffers = '2GB'                    -- 25% of system RAM
effective_cache_size = '6GB'              -- 75% of system RAM
work_mem = '256MB'                        -- Per operation memory
maintenance_work_mem = '512MB'            -- Maintenance operations

-- Connection Configuration  
max_connections = 200                     -- Concurrent connection limit
superuser_reserved_connections = 3        -- Admin connections
idle_in_transaction_session_timeout = 300000  -- 5 minutes

-- Query Optimization
random_page_cost = 1.1                    -- SSD optimization
seq_page_cost = 1.0                       -- Sequential read cost
cpu_tuple_cost = 0.01                     -- CPU processing cost
effective_io_concurrency = 200            -- Concurrent I/O operations

-- Write Ahead Logging (WAL)
wal_buffers = '16MB'                      -- WAL buffer size
checkpoint_completion_target = 0.7         -- Checkpoint spread
max_wal_size = '2GB'                      -- Maximum WAL size
min_wal_size = '512MB'                    -- Minimum WAL size

-- Replication Configuration
hot_standby = on                          -- Enable read replicas
max_replication_slots = 3                 -- Replication slot limit
max_wal_senders = 3                       -- WAL sender processes

-- Logging Configuration
log_statement = 'mod'                     -- Log modifications
log_min_duration_statement = 1000         -- Log slow queries (1s+)
log_checkpoints = on                      -- Log checkpoint activity
log_lock_waits = on                       -- Log lock wait events
```

#### 1.2 Table Creation Scripts
```sql
-- Advisor Management Tables
CREATE TABLE advisors (
    id SERIAL PRIMARY KEY,
    
    -- Business identification
    sebi_reg_no VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE 
        CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'),
    company_name VARCHAR(255) NOT NULL,
    
    -- Advisor classification
    advisor_type advisor_type_enum NOT NULL,
    tier subscription_tier_enum NOT NULL DEFAULT 'basic',
    status advisor_status_enum NOT NULL DEFAULT 'pending',
    
    -- WhatsApp integration
    wa_business_phone VARCHAR(20) UNIQUE,
    waba_id VARCHAR(50),
    wa_verification_status wa_verification_enum DEFAULT 'pending',
    wa_optin_timestamp TIMESTAMP,
    
    -- Preferences
    language_preferences TEXT[] DEFAULT ARRAY['EN'] 
        CHECK (language_preferences && ARRAY['EN','HI','MR']),
    preferred_send_time TIME DEFAULT '06:00:00',
    content_tone content_tone_enum DEFAULT 'professional',
    auto_send_enabled BOOLEAN DEFAULT true,
    
    -- Performance tracking
    health_score INTEGER DEFAULT 0 
        CHECK (health_score >= 0 AND health_score <= 100),
    approval_success_rate DECIMAL(5,4) DEFAULT 0.0000 
        CHECK (approval_success_rate >= 0 AND approval_success_rate <= 1),
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    gdpr_consent_timestamp TIMESTAMP,
    data_retention_until DATE GENERATED ALWAYS AS 
        (created_at::date + INTERVAL '7 years') STORED
);

-- Indexes for advisor table
CREATE INDEX idx_advisors_status ON advisors(status);
CREATE INDEX idx_advisors_tier ON advisors(tier);
CREATE INDEX idx_advisors_sebi_reg ON advisors(sebi_reg_no);
CREATE INDEX idx_advisors_health_score ON advisors(health_score DESC);
CREATE INDEX idx_advisors_last_login ON advisors(last_login_at DESC);

-- Content Management Tables
CREATE TABLE content_packs (
    id SERIAL PRIMARY KEY,
    
    -- Ownership and context
    advisor_id INTEGER NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
    creator_type creator_type_enum NOT NULL DEFAULT 'advisor',
    
    -- Content classification
    topic_family VARCHAR(100) NOT NULL,
    content_type content_type_enum NOT NULL DEFAULT 'daily_post',
    languages_included TEXT[] NOT NULL DEFAULT ARRAY['EN']
        CHECK (languages_included && ARRAY['EN','HI','MR']),
    
    -- Content data
    content_json JSONB NOT NULL 
        CHECK (jsonb_typeof(content_json) = 'object'),
    content_hash VARCHAR(64) NOT NULL,
    version_number INTEGER DEFAULT 1,
    
    -- AI analysis
    ai_risk_score INTEGER NOT NULL DEFAULT 0 
        CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
    ai_confidence_score DECIMAL(5,4) 
        CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    compliance_reasons TEXT[],
    improvement_suggestions TEXT[],
    
    -- Workflow status
    status content_status_enum NOT NULL DEFAULT 'draft',
    submission_timestamp TIMESTAMP,
    approval_timestamp TIMESTAMP,
    reviewed_by INTEGER REFERENCES admin_users(id),
    review_notes TEXT,
    
    -- Scheduling
    scheduled_date DATE,
    scheduled_time TIME,
    delivery_priority delivery_priority_enum DEFAULT 'normal',
    
    -- Performance prediction
    engagement_prediction DECIMAL(5,4),
    actual_engagement_score DECIMAL(5,4),
    
    -- Audit trail
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    retention_until DATE GENERATED ALWAYS AS 
        (created_at::date + INTERVAL '7 years') STORED,
    
    -- Constraints
    CONSTRAINT chk_scheduled_content_has_date 
        CHECK (status != 'scheduled' OR scheduled_date IS NOT NULL),
    CONSTRAINT chk_reviewed_content_has_reviewer
        CHECK (status NOT IN ('approved', 'rejected') OR reviewed_by IS NOT NULL)
);

-- Indexes for content_packs table  
CREATE INDEX idx_content_packs_advisor_id ON content_packs(advisor_id);
CREATE INDEX idx_content_packs_status ON content_packs(status);
CREATE INDEX idx_content_packs_schedule_date ON content_packs(scheduled_date);
CREATE INDEX idx_content_packs_risk_score ON content_packs(ai_risk_score DESC);
CREATE INDEX idx_content_packs_topic ON content_packs(topic_family);
CREATE INDEX idx_content_packs_created_at ON content_packs(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_content_workflow ON content_packs(advisor_id, status, created_at DESC)
    WHERE status IN ('draft', 'pending');
    
CREATE INDEX idx_approval_queue_priority ON content_packs(status, ai_risk_score DESC, created_at ASC)
    WHERE status = 'pending';

-- Delivery tracking table
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    
    -- References
    content_pack_id INTEGER NOT NULL REFERENCES content_packs(id) ON DELETE CASCADE,
    advisor_id INTEGER NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- Delivery configuration
    delivery_channel delivery_channel_enum NOT NULL DEFAULT 'whatsapp',
    content_variant content_variant_enum NOT NULL DEFAULT 'post',
    template_used VARCHAR(100) REFERENCES wa_templates(name),
    
    -- WhatsApp specifics
    wa_phone_number_used VARCHAR(20),
    wa_message_id VARCHAR(255),
    wa_conversation_id VARCHAR(255),
    
    -- Status tracking
    status delivery_status_enum NOT NULL DEFAULT 'queued',
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Timing
    queued_at TIMESTAMP DEFAULT NOW(),
    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- SLA compliance
    sla_target_time TIMESTAMP GENERATED ALWAYS AS 
        (scheduled_for + INTERVAL '5 minutes') STORED,
    sla_compliance_status sla_status_enum DEFAULT 'pending',
    delay_seconds INTEGER GENERATED ALWAYS AS 
        (EXTRACT(EPOCH FROM (sent_at - scheduled_for))::INTEGER) STORED,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,
    
    -- Metadata
    delivery_metadata JSONB DEFAULT '{}',
    api_response_time_ms INTEGER,
    delivery_cost_cents INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT chk_delivery_timing_sequence
        CHECK (sent_at IS NULL OR delivered_at IS NULL OR sent_at <= delivered_at),
    CONSTRAINT chk_read_after_delivery  
        CHECK (read_at IS NULL OR delivered_at IS NULL OR delivered_at <= read_at),
    CONSTRAINT chk_failed_deliveries_have_error
        CHECK (status != 'failed' OR error_code IS NOT NULL),
    CONSTRAINT chk_retry_count_within_limit
        CHECK (retry_count >= 0 AND retry_count <= max_retries)
);

-- Indexes for deliveries table
CREATE INDEX idx_deliveries_content_pack ON deliveries(content_pack_id);
CREATE INDEX idx_deliveries_advisor ON deliveries(advisor_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_scheduled ON deliveries(scheduled_for);
CREATE INDEX idx_deliveries_message_id ON deliveries(wa_message_id);

-- Composite indexes for workflow queries
CREATE INDEX idx_deliveries_advisor_status ON deliveries(advisor_id, status);
CREATE INDEX idx_deliveries_daily_status ON deliveries(DATE(scheduled_for), status);
CREATE INDEX idx_deliveries_sla_monitoring ON deliveries(sla_compliance_status, scheduled_for DESC);
CREATE INDEX idx_deliveries_retry_queue ON deliveries(status, next_retry_at)
    WHERE status = 'failed' AND retry_count < max_retries;
```

#### 1.3 Enum Types Definition
```sql
-- Create custom enum types for type safety and performance

-- Advisor related enums
CREATE TYPE advisor_type_enum AS ENUM ('RIA', 'MFD');
CREATE TYPE subscription_tier_enum AS ENUM ('basic', 'standard', 'pro');
CREATE TYPE advisor_status_enum AS ENUM ('pending', 'approved', 'suspended', 'cancelled');
CREATE TYPE wa_verification_enum AS ENUM ('pending', 'verified', 'failed');
CREATE TYPE content_tone_enum AS ENUM ('professional', 'friendly', 'educational', 'conversational');

-- Content related enums  
CREATE TYPE creator_type_enum AS ENUM ('advisor', 'admin', 'fallback_system');
CREATE TYPE content_type_enum AS ENUM ('daily_post', 'market_update', 'educational', 'promotional');
CREATE TYPE content_status_enum AS ENUM ('draft', 'pending', 'approved', 'rejected', 'scheduled', 'delivered', 'archived');
CREATE TYPE delivery_priority_enum AS ENUM ('low', 'normal', 'high', 'urgent');

-- Delivery related enums
CREATE TYPE delivery_channel_enum AS ENUM ('whatsapp', 'whatsapp_status', 'sms_backup', 'email_backup');
CREATE TYPE content_variant_enum AS ENUM ('post', 'status', 'linkedin');
CREATE TYPE delivery_status_enum AS ENUM ('queued', 'throttled', 'sent', 'delivered', 'read', 'failed', 'expired');
CREATE TYPE sla_status_enum AS ENUM ('met', 'missed', 'pending');

-- Compliance related enums
CREATE TYPE risk_level_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_type_enum AS ENUM ('sebi_violation', 'content_policy_breach', 'data_privacy_issue', 'platform_misuse');
CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE resolution_status_enum AS ENUM ('open', 'investigating', 'escalated', 'resolved', 'closed');

-- Audit related enums
CREATE TYPE actor_type_enum AS ENUM ('advisor', 'admin', 'system', 'api', 'ai_agent');
CREATE TYPE event_type_enum AS ENUM ('create', 'update', 'delete', 'approve', 'reject', 'escalate', 'deliver');
CREATE TYPE event_category_enum AS ENUM ('content', 'advisor', 'delivery', 'compliance', 'system');
CREATE TYPE compliance_impact_enum AS ENUM ('none', 'low', 'medium', 'high');
CREATE TYPE data_sensitivity_enum AS ENUM ('public', 'internal', 'confidential', 'pii');
```

### 2. API Design & Integration Patterns

#### 2.1 RESTful API Specification
```yaml
api_design_specification:
  base_configuration:
    base_url: "https://api.projectone.ai/v1"
    authentication: "Bearer JWT tokens"
    rate_limiting: "1000 requests per hour per advisor"
    content_type: "application/json"
    api_versioning: "URI versioning (/v1, /v2)"
    
  advisor_management_endpoints:
    get_advisor_profile:
      method: "GET"
      path: "/advisors/{advisor_id}"
      response_format:
        advisor_data:
          - basic_profile
          - compliance_metrics
          - performance_summary
          - subscription_details
        cache_ttl: "15 minutes"
        
    update_advisor_preferences:
      method: "PATCH"
      path: "/advisors/{advisor_id}/preferences"
      request_body:
        language_preferences: "array"
        content_tone: "enum"
        send_schedule: "object"
        notification_settings: "object"
      validation:
        - required_fields_validation
        - enum_value_validation
        - business_rule_validation
        
    whatsapp_integration:
      method: "POST"
      path: "/advisors/{advisor_id}/integrations/whatsapp"
      request_body:
        business_phone: "string"
        verification_method: "enum"
        webhook_url: "url"
      security:
        - phone_number_validation
        - duplicate_prevention
        - rate_limiting: "3 attempts per hour"
        
  content_management_endpoints:
    create_content:
      method: "POST"
      path: "/content"
      request_body:
        topic_family: "string"
        languages: "array"
        content_data: "object"
        scheduling: "object"
      processing_pipeline:
        - content_validation
        - ai_compliance_check
        - asset_rendering_job
        - approval_workflow_trigger
      response_format:
        content_id: "string"
        status: "enum"
        compliance_score: "integer"
        estimated_approval_time: "string"
        
    get_content_status:
      method: "GET"
      path: "/content/{content_id}"
      response_format:
        content_metadata:
          - current_status
          - compliance_analysis
          - approval_timeline
          - delivery_schedule
        real_time_updates: "WebSocket connection available"
        
    submit_for_approval:
      method: "POST"
      path: "/content/{content_id}/submit"
      business_logic:
        - final_compliance_check
        - approval_queue_insertion
        - advisor_notification
        - sla_timer_start
      
  delivery_management_endpoints:
    schedule_delivery:
      method: "POST"
      path: "/deliveries"
      request_body:
        content_id: "string"
        delivery_time: "datetime"
        delivery_channels: "array"
        recipient_groups: "array"
      validation:
        - content_approval_check
        - scheduling_conflict_check
        - whatsapp_integration_check
        
    get_delivery_status:
      method: "GET"
      path: "/deliveries/{delivery_id}"
      response_format:
        delivery_metadata:
          - current_status
          - whatsapp_message_id
          - delivery_confirmations
          - read_receipts
          - error_details
        sla_compliance_data:
          - target_time
          - actual_time
          - compliance_status
          
    retry_failed_delivery:
      method: "POST"
      path: "/deliveries/{delivery_id}/retry"
      business_logic:
        - failure_reason_analysis
        - retry_strategy_selection
        - exponential_backoff_calculation
        - max_retry_enforcement
        
  analytics_endpoints:
    advisor_dashboard_data:
      method: "GET"
      path: "/analytics/advisor/{advisor_id}/dashboard"
      query_parameters:
        - date_range: "string"
        - metrics: "array"
        - granularity: "enum"
      response_format:
        performance_metrics:
          - content_creation_stats
          - delivery_performance
          - compliance_scores
          - engagement_rates
        trending_data:
          - topic_performance
          - optimal_timing
          - improvement_suggestions
          
    content_performance_analysis:
      method: "GET"
      path: "/analytics/content/{content_id}/performance"
      response_format:
        engagement_data:
          - delivery_success_rate
          - read_rates
          - response_rates
          - sharing_metrics
        comparative_analysis:
          - peer_benchmark
          - topic_average
          - historical_performance
```

#### 2.2 WebSocket Real-Time Updates
```yaml
websocket_architecture:
  connection_management:
    authentication:
      - jwt_token_validation
      - advisor_session_verification
      - role_based_channel_access
      
    connection_lifecycle:
      - connection_establishment
      - heartbeat_monitoring
      - graceful_disconnection
      - automatic_reconnection
      
  real_time_channels:
    advisor_notifications:
      channel_name: "/advisor/{advisor_id}/notifications"
      message_types:
        - content_approval_updates
        - delivery_status_changes
        - compliance_alerts
        - system_announcements
      message_format:
        timestamp: "ISO 8601"
        event_type: "string"
        data: "object"
        requires_action: "boolean"
        
    content_workflow_updates:
      channel_name: "/content/{content_id}/status"
      message_types:
        - compliance_score_updates
        - approval_status_changes
        - rendering_completion
        - delivery_scheduling
      real_time_requirements:
        - latency: "< 500ms"
        - delivery_guarantee: "at_least_once"
        - ordering_guarantee: "true"
        
    delivery_tracking:
      channel_name: "/delivery/{delivery_id}/tracking"
      message_types:
        - whatsapp_status_updates
        - read_receipt_notifications
        - delivery_confirmations
        - error_notifications
      integration_sources:
        - whatsapp_webhooks
        - internal_delivery_system
        - third_party_apis
        
    compliance_alerts:
      channel_name: "/advisor/{advisor_id}/compliance"
      message_types:
        - policy_updates
        - violation_alerts
        - training_reminders
        - regulatory_news
      priority_levels:
        - critical: "immediate_notification"
        - high: "within_5_minutes"
        - medium: "within_30_minutes"
        - low: "batch_notification"
        
  message_queuing:
    queue_management:
      - redis_pub_sub: "Real-time message distribution"
      - message_persistence: "Offline message storage"
      - delivery_guarantees: "At-least-once delivery"
      - duplicate_detection: "Message deduplication"
      
    scaling_strategy:
      - horizontal_scaling: "Multiple WebSocket servers"
      - load_balancing: "Sticky session management"
      - failover_handling: "Automatic server switching"
      - message_replay: "Missed message recovery"
```

#### 2.3 Third-Party Integration Patterns
```yaml
integration_architecture:
  whatsapp_cloud_api:
    connection_management:
      - webhook_verification: "Meta webhook signature validation"
      - rate_limit_handling: "1000 messages per second limit"
      - error_handling: "Exponential backoff retry"
      - health_monitoring: "API endpoint availability"
      
    message_templates:
      - template_management: "Dynamic template creation"
      - approval_workflow: "Meta template approval process"
      - localization_support: "Multi-language templates"
      - compliance_validation: "SEBI-compliant template content"
      
    delivery_optimization:
      - batch_processing: "Bulk message sending"
      - timing_optimization: "Recipient timezone awareness"
      - fallback_strategies: "Alternative delivery methods"
      - delivery_confirmation: "Read receipt tracking"
      
  openai_integration:
    model_configuration:
      - model_selection: "GPT-4o-mini for compliance, GPT-4.1 for generation"
      - prompt_management: "Versioned prompt templates"
      - parameter_tuning: "Temperature, max_tokens optimization"
      - cost_optimization: "Token usage monitoring"
      
    content_processing:
      - generation_pipeline: "AI content creation workflow"
      - compliance_checking: "SEBI rule validation"
      - quality_assessment: "Content quality scoring"
      - improvement_suggestions: "Automated enhancement recommendations"
      
    performance_monitoring:
      - latency_tracking: "API response time monitoring"
      - accuracy_measurement: "Compliance prediction accuracy"
      - cost_tracking: "Per-request cost analysis"
      - usage_analytics: "Token consumption patterns"
      
  sebi_compliance_apis:
    advisor_verification:
      - registration_validation: "SEBI advisor verification"
      - status_monitoring: "Registration status updates"
      - compliance_history: "Historical compliance data"
      - violation_tracking: "Regulatory violation records"
      
    regulatory_updates:
      - policy_monitoring: "New regulation detection"
      - impact_assessment: "Regulation change analysis"
      - compliance_mapping: "Rule-to-content mapping"
      - notification_system: "Regulatory alert distribution"
      
  payment_gateway_integration:
    subscription_management:
      - billing_automation: "Recurring payment processing"
      - plan_management: "Tier upgrade/downgrade"
      - payment_tracking: "Transaction history"
      - dunning_management: "Failed payment handling"
      
    compliance_requirements:
      - pci_compliance: "Payment data security"
      - tax_calculation: "GST calculation and remittance"
      - invoice_generation: "Automated billing documents"
      - financial_reporting: "Revenue analytics"
```

---

## Conclusion & Implementation Roadmap

### Component Implementation Priority Matrix

#### Phase 1: Foundation (Weeks 1-3)
```yaml
critical_priority_components:
  advisor_management_domain:
    - advisor_entity_model: "Core user management"
    - sebi_verification_system: "Regulatory compliance foundation"
    - subscription_tier_management: "Business model support"
    
  content_management_domain:
    - content_pack_entity_model: "Content creation foundation"
    - ai_compliance_integration: "SEBI compliance automation"
    - content_workflow_engine: "Approval process management"
    
  audit_compliance_domain:
    - comprehensive_audit_trail: "Regulatory requirement"
    - compliance_incident_tracking: "Risk management"
    - data_retention_framework: "Legal compliance"
```

#### Phase 2: Core Features (Weeks 4-9)
```yaml
high_priority_components:
  whatsapp_delivery_domain:
    - delivery_management_system: "Core delivery functionality"
    - template_management_system: "Message standardization"
    - sla_monitoring_framework: "99% delivery guarantee"
    
  ai_intelligence_domain:
    - ai_processing_pipeline: "Content generation automation"
    - compliance_rule_engine: "Automated compliance checking"
    - performance_prediction_models: "Content optimization"
    
  analytics_intelligence_domain:
    - advisor_performance_analytics: "Business intelligence"
    - content_intelligence_system: "Content optimization insights"
    - real_time_dashboard_data: "Operational visibility"
```

#### Phase 3: Advanced Features (Weeks 10-12)
```yaml
medium_priority_components:
  fallback_continuity_domain:
    - intelligent_fallback_system: "Content continuity assurance"
    - fallback_selection_intelligence: "AI-driven content selection"
    - seasonal_content_management: "Contextual content delivery"
    
  performance_optimization:
    - caching_layer_implementation: "Performance enhancement"
    - database_optimization: "Scalability preparation"
    - monitoring_alerting_system: "Operational excellence"
```

### Data Architecture Success Metrics

#### Compliance & Audit Metrics
- **SEBI Compliance Rate**: 100% compliance with zero violations
- **Audit Trail Completeness**: 100% of actions logged with 7-year retention
- **Data Privacy Compliance**: Full DPDP Act 2023 adherence
- **Incident Response Time**: <2 hours for compliance issues

#### Performance & Scalability Metrics  
- **Database Query Performance**: <200ms for 95% of queries
- **Real-Time Analytics Latency**: <5 minutes for dashboard updates
- **System Scalability**: Support for 2000+ concurrent advisors
- **Data Integrity**: 99.99% data consistency across all systems

#### Business Intelligence Metrics
- **Advisor Insight Generation**: Real-time performance analytics
- **Content Optimization**: AI-driven engagement prediction accuracy >85%
- **Predictive Analytics**: Churn prediction accuracy >80%
- **Operational Intelligence**: Complete visibility into all business processes

This comprehensive component inventory and data modeling specification provides the complete foundation for Project One's AI-first financial advisor platform, ensuring SEBI compliance, DPDP Act 2023 adherence, and scalable architecture to support growth from 150 to 2000+ advisors while maintaining 99% delivery SLA and comprehensive audit capabilities.

The data architecture prioritizes regulatory compliance, performance at scale, and intelligent automation while providing the flexibility to adapt to evolving regulatory requirements and business needs.