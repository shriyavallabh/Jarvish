# Entity Relationship Implementation Notes 🗄️

## Overview
Detailed implementation notes for Project One's database schema, including primary/foreign keys, constraints, indexes, and relationship specifications aligned with the ER diagram.

## Core Entity Specifications

### Advisors & Authentication

#### `advisors` Table
```sql
CREATE TABLE advisors (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Business Logic Fields
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'suspended', 'cancelled')),
    tier VARCHAR(20) NOT NULL DEFAULT 'basic'
        CHECK (tier IN ('basic', 'standard', 'pro')),
    type VARCHAR(10) NOT NULL 
        CHECK (type IN ('RIA', 'MFD')),
    
    -- SEBI Registration & Identity
    sebi_reg_no VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    
    -- Contact & Integration
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    wa_business_phone VARCHAR(20) UNIQUE,
    waba_id VARCHAR(50), -- WhatsApp Business Account ID
    wa_optin_timestamp TIMESTAMP,
    
    -- Preferences & Configuration
    language_set TEXT[] DEFAULT ARRAY['EN'] 
        CHECK (language_set && ARRAY['EN','HI','MR']),
    send_window TIME DEFAULT '06:00:00' 
        CHECK (send_window IN ('06:00:00', '07:00:00')),
    disclaimer_footer TEXT,
    
    -- Subscription Management  
    seats_allowed INTEGER NOT NULL DEFAULT 1,
    billing_customer_id VARCHAR(100), -- Stripe/Razorpay customer ID
    auto_send_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Performance Tracking
    health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),
    
    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_advisors_status (status),
    INDEX idx_advisors_tier (tier),  
    INDEX idx_advisors_sebi_reg (sebi_reg_no),
    INDEX idx_advisors_wa_phone (wa_business_phone),
    INDEX idx_advisors_health_score (health_score DESC)
);

-- Auto-update timestamp trigger
CREATE TRIGGER update_advisors_updated_at 
    BEFORE UPDATE ON advisors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### `advisor_profiles` Table
```sql
CREATE TABLE advisor_profiles (
    -- Primary Key & Foreign Key  
    advisor_id INTEGER PRIMARY KEY REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- AI Personalization Data
    topic_affinity_scores JSONB DEFAULT '{}', 
    -- Structure: {"market_update": 0.8, "sip_education": 0.6, "tax_planning": 0.9}
    
    tone_preference VARCHAR(50) DEFAULT 'professional'
        CHECK (tone_preference IN ('professional', 'friendly', 'educational', 'conversational')),
    
    edit_patterns JSONB DEFAULT '{}',
    -- Structure: {"common_edits": ["replace_guaranteed", "add_disclaimers"], "writing_style": "formal"}
    
    -- Performance Metrics
    approval_success_rate DECIMAL(5,4) DEFAULT 0.0000 CHECK (approval_success_rate >= 0 AND approval_success_rate <= 1),
    
    engagement_metrics JSONB DEFAULT '{}',
    -- Structure: {"avg_read_rate": 0.75, "peak_engagement_hour": 7, "preferred_content_length": "medium"}
    
    -- Audit
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_advisor_profiles_success_rate (approval_success_rate DESC),
    INDEX idx_advisor_profiles_updated (last_updated DESC)
);
```

#### `admin_users` Table
```sql
CREATE TABLE admin_users (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Identity & Authentication
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin'
        CHECK (role IN ('admin', 'backup_approver', 'dpo', 'senior_reviewer')),
    
    -- Security
    has_2fa_enabled BOOLEAN NOT NULL DEFAULT false,
    ip_allowlist TEXT[], -- Array of allowed IP addresses
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    
    -- Indexes
    INDEX idx_admin_users_role (role),
    INDEX idx_admin_users_email (email)
);
```

### Content & Compliance

#### `content_packs` Table
```sql
CREATE TABLE content_packs (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Ownership & Creation Context
    advisor_id INTEGER NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
    creator_type VARCHAR(20) NOT NULL DEFAULT 'advisor'
        CHECK (creator_type IN ('advisor', 'admin', 'fallback_system')),
    
    -- Content Classification
    topic_family VARCHAR(100) NOT NULL,
    languages TEXT[] NOT NULL DEFAULT ARRAY['EN']
        CHECK (languages && ARRAY['EN','HI','MR']),
    
    -- Content Data
    draft_content_json JSONB NOT NULL,
    -- Structure: {
    --   "en": {"title": "...", "body": "...", "cta": "..."},  
    --   "hi": {"title": "...", "body": "...", "cta": "..."},
    --   "image_prompt": "...", "target_platforms": ["whatsapp", "status"]
    -- }
    
    -- AI Analysis Results
    ai_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
    ai_suggestions TEXT[],
    compliance_reasons TEXT[],
    
    -- Workflow Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'scheduled', 'sent', 'archived')),
    
    -- Scheduling
    schedule_date DATE,
    
    -- Content Integrity
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 of content for change detection
    
    -- Admin Review
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES admin_users(id),
    reviewed_at TIMESTAMP,
    
    -- Performance Data
    quality_scores JSONB DEFAULT '{}',
    -- Structure: {"readability": 85, "engagement_prediction": 78, "compliance_confidence": 95}
    
    variant_selection_log JSONB DEFAULT '{}',
    -- Structure: {"selected_variants": ["whatsapp", "status"], "selection_reason": "advisor_preference"}
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_content_packs_advisor_id (advisor_id),
    INDEX idx_content_packs_status (status),
    INDEX idx_content_packs_schedule_date (schedule_date),
    INDEX idx_content_packs_risk_score (ai_risk_score DESC),
    INDEX idx_content_packs_topic (topic_family),
    INDEX idx_content_packs_created_at (created_at DESC),
    
    -- Composite Indexes
    INDEX idx_content_packs_advisor_status (advisor_id, status),
    INDEX idx_content_packs_pending_review (status, ai_risk_score DESC) WHERE status = 'pending'
);

-- Constraints
ALTER TABLE content_packs ADD CONSTRAINT chk_scheduled_content_has_date 
    CHECK (status != 'scheduled' OR schedule_date IS NOT NULL);

ALTER TABLE content_packs ADD CONSTRAINT chk_reviewed_content_has_reviewer
    CHECK (status NOT IN ('approved', 'rejected') OR reviewed_by IS NOT NULL);
```

#### `render_jobs` Table
```sql
CREATE TABLE render_jobs (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Content Reference
    content_pack_id INTEGER NOT NULL REFERENCES content_packs(id) ON DELETE CASCADE,
    
    -- Render Configuration
    variants_requested TEXT[] NOT NULL 
        CHECK (variants_requested && ARRAY['whatsapp', 'status', 'linkedin']),
    
    overlay_config JSONB NOT NULL,
    -- Structure: {
    --   "whatsapp": {"safe_areas": true, "disclaimer_position": "bottom"},
    --   "branding": {"logo_url": "...", "position": "top_right"},
    --   "transforms": ["proOverlayV1", "advisorBranding"]
    -- }
    
    -- Render Results
    result_asset_urls JSONB DEFAULT '{}',
    -- Structure: {"whatsapp": "https://cdn.../wa_post.webp", "status": "https://cdn.../status.jpg"}
    
    checksums JSONB DEFAULT '{}',
    -- Structure: {"whatsapp": "sha256_hash", "status": "sha256_hash"}
    
    cache_status VARCHAR(20) DEFAULT 'pending'
        CHECK (cache_status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Processing Metadata
    processing_time_seconds DECIMAL(8,3),
    error_message TEXT,
    
    -- Completion
    completed_at TIMESTAMP,
    
    -- Indexes
    INDEX idx_render_jobs_content_pack (content_pack_id),
    INDEX idx_render_jobs_status (cache_status),
    INDEX idx_render_jobs_completed (completed_at DESC)
);
```

### WhatsApp & Delivery

#### `wa_templates` Table
```sql
CREATE TABLE wa_templates (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- WhatsApp Template Identity
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'utility'
        CHECK (category IN ('utility', 'marketing', 'authentication')),
    
    -- Localization
    supported_locales TEXT[] NOT NULL DEFAULT ARRAY['en'],
    placeholders TEXT[],
    
    -- Template Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
    
    variant_number INTEGER NOT NULL DEFAULT 1,
    
    -- Template Content
    template_content JSONB NOT NULL,
    -- Structure: {
    --   "header": {"type": "image", "example": "..."},
    --   "body": {"text": "Welcome *{{1}}*, your content is ready", "examples": ["Rajesh"]},
    --   "footer": {"text": "Project One - Compliance-first content"}
    -- }
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    meta_approved_at TIMESTAMP,
    
    -- Indexes  
    INDEX idx_wa_templates_name (name),
    INDEX idx_wa_templates_status (status),
    INDEX idx_wa_templates_category (category)
);
```

#### `deliveries` Table
```sql
CREATE TABLE deliveries (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Content & Advisor Reference
    content_pack_id INTEGER NOT NULL REFERENCES content_packs(id) ON DELETE CASCADE,
    advisor_id INTEGER NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- Delivery Configuration
    channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp'
        CHECK (channel IN ('whatsapp', 'email', 'sms')),
    
    content_variant VARCHAR(20) NOT NULL DEFAULT 'post'
        CHECK (content_variant IN ('post', 'status', 'linkedin')),
    
    -- WhatsApp Specific
    template_used VARCHAR(100) REFERENCES wa_templates(name),
    message_id VARCHAR(255), -- WhatsApp message ID from API
    wa_phone_number_used VARCHAR(20),
    
    -- Delivery Status & Tracking
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'throttled', 'sent', 'delivered', 'read', 'failed')),
    
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Timing
    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    
    -- Delivery Metadata
    delivery_metadata JSONB DEFAULT '{}',
    -- Structure: {"recipient_count": 125, "batch_id": "20241201_grp2", "api_response_time": 1240}
    
    -- Indexes
    INDEX idx_deliveries_content_pack (content_pack_id),
    INDEX idx_deliveries_advisor (advisor_id),  
    INDEX idx_deliveries_status (status),
    INDEX idx_deliveries_scheduled (scheduled_for),
    INDEX idx_deliveries_message_id (message_id),
    
    -- Composite Indexes for Common Queries
    INDEX idx_deliveries_advisor_status (advisor_id, status),
    INDEX idx_deliveries_daily_status (DATE(scheduled_for), status),
    INDEX idx_deliveries_retry_queue (status, retry_count, scheduled_for) WHERE status = 'failed'
);

-- Constraints
ALTER TABLE deliveries ADD CONSTRAINT chk_sent_deliveries_have_timestamp
    CHECK (status NOT IN ('sent', 'delivered', 'read') OR sent_at IS NOT NULL);

ALTER TABLE deliveries ADD CONSTRAINT chk_failed_deliveries_have_error
    CHECK (status != 'failed' OR error_code IS NOT NULL);
```

### Fallback System

#### `fallback_policies` Table
```sql
CREATE TABLE fallback_policies (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Policy Configuration
    enabled BOOLEAN NOT NULL DEFAULT true,
    languages TEXT[] NOT NULL DEFAULT ARRAY['EN']
        CHECK (languages && ARRAY['EN','HI','MR']),
    
    topic_priority JSONB NOT NULL DEFAULT '{}',
    -- Structure: {"market_update": 10, "sip_education": 8, "tax_planning": 6}
    
    library_size INTEGER NOT NULL DEFAULT 50,
    ai_curation_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Selection Algorithm Config
    selection_algorithm VARCHAR(50) DEFAULT 'engagement_weighted'
        CHECK (selection_algorithm IN ('random', 'engagement_weighted', 'recency_weighted', 'topic_balanced')),
    
    -- Audit
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES admin_users(id),
    audit_notes TEXT,
    
    -- Indexes
    INDEX idx_fallback_policies_enabled (enabled),
    INDEX idx_fallback_policies_updated (last_updated DESC)
);
```

#### `fallback_packs` Table  
```sql
CREATE TABLE fallback_packs (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Content Data
    content_json JSONB NOT NULL,
    -- Structure: Same as content_packs.draft_content_json
    
    languages TEXT[] NOT NULL DEFAULT ARRAY['EN']
        CHECK (languages && ARRAY['EN','HI','MR']),
    
    topic_family VARCHAR(100) NOT NULL,
    
    -- Performance Metrics
    engagement_score DECIMAL(5,4) DEFAULT 0.0000 CHECK (engagement_score >= 0 AND engagement_score <= 1),
    usage_count INTEGER DEFAULT 0,
    
    -- Seasonal Relevance
    seasonal_relevance JSONB DEFAULT '{}',
    -- Structure: {"months": [1,2,12], "events": ["new_year", "budget_season"], "exclusions": []}
    
    compliance_rating INTEGER NOT NULL DEFAULT 0 CHECK (compliance_rating >= 0 AND compliance_rating <= 100),
    
    -- Content Lifecycle
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used TIMESTAMP,
    expires_at TIMESTAMP, -- Optional content expiration
    
    -- Quality Control
    created_by INTEGER REFERENCES admin_users(id),
    approved_by INTEGER REFERENCES admin_users(id),
    
    -- Indexes
    INDEX idx_fallback_packs_topic (topic_family),
    INDEX idx_fallback_packs_languages (languages),
    INDEX idx_fallback_packs_engagement (engagement_score DESC),
    INDEX idx_fallback_packs_compliance (compliance_rating DESC),
    INDEX idx_fallback_packs_last_used (last_used ASC NULLS FIRST),
    
    -- Composite Index for Selection Algorithm
    INDEX idx_fallback_selection (topic_family, engagement_score DESC, last_used ASC NULLS FIRST)
);
```

### Audit & Compliance

#### `audit_logs` Table
```sql
CREATE TABLE audit_logs (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Actor Information
    actor_type VARCHAR(20) NOT NULL 
        CHECK (actor_type IN ('admin', 'advisor', 'system', 'api')),
    actor_id INTEGER, -- Can be NULL for system actions
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    
    -- Detailed Information
    details_json JSONB NOT NULL DEFAULT '{}',
    -- Structure: {"old_values": {...}, "new_values": {...}, "request_ip": "...", "user_agent": "..."}
    
    -- Context
    session_id VARCHAR(100),
    request_id VARCHAR(100), -- For tracing across services
    
    -- Timing
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_audit_logs_actor (actor_type, actor_id),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_timestamp (timestamp DESC),
    
    -- Composite Indexes
    INDEX idx_audit_logs_actor_timestamp (actor_type, actor_id, timestamp DESC),
    INDEX idx_audit_logs_entity_timestamp (entity_type, entity_id, timestamp DESC)
);

-- Partitioning for performance (monthly partitions)
-- Implementation would use PostgreSQL native partitioning by timestamp range
```

#### `ai_audit_logs` Table
```sql
CREATE TABLE ai_audit_logs (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Content Reference
    content_pack_id INTEGER NOT NULL REFERENCES content_packs(id) ON DELETE CASCADE,
    
    -- AI Model Information
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    prompt_version VARCHAR(50) NOT NULL,
    
    -- Content Hashing for Integrity
    prompt_hash VARCHAR(64) NOT NULL, -- SHA-256 of prompt
    input_hash VARCHAR(64) NOT NULL,  -- SHA-256 of input content
    output_hash VARCHAR(64) NOT NULL, -- SHA-256 of AI output
    
    -- Risk Assessment Results
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    reasons TEXT[] DEFAULT '{}',
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Performance Metrics
    latency_ms INTEGER NOT NULL CHECK (latency_ms > 0),
    token_count INTEGER NOT NULL CHECK (token_count > 0),
    cost_cents INTEGER NOT NULL DEFAULT 0,
    
    -- Processing Context
    processing_stage VARCHAR(50) NOT NULL
        CHECK (processing_stage IN ('generation', 'compliance_check', 'enhancement', 'translation')),
    
    -- Timing
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_ai_audit_content_pack (content_pack_id),
    INDEX idx_ai_audit_model (model_name, model_version),
    INDEX idx_ai_audit_risk_score (risk_score DESC),
    INDEX idx_ai_audit_timestamp (timestamp DESC),
    INDEX idx_ai_audit_cost (cost_cents DESC),
    
    -- Composite Indexes
    INDEX idx_ai_audit_performance (latency_ms, token_count, timestamp DESC),
    INDEX idx_ai_audit_content_processing (content_pack_id, processing_stage, timestamp DESC)
);
```

#### `compliance_incidents` Table
```sql
CREATE TABLE compliance_incidents (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Incident Context
    content_pack_id INTEGER REFERENCES content_packs(id) ON DELETE SET NULL,
    advisor_id INTEGER NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- Regulatory Source
    regulator_source VARCHAR(100), -- SEBI, RBI, IRDAI, etc.
    incident_type VARCHAR(100) NOT NULL
        CHECK (incident_type IN ('sebi_violation', 'misleading_content', 'disclosure_missing', 'unauthorized_claim')),
    
    -- Incident Details
    feedback_text TEXT NOT NULL,
    severity_level VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    impact_assessment TEXT,
    related_content_ids INTEGER[], -- Array of related content_pack IDs
    
    -- Resolution Tracking
    resolution_status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (resolution_status IN ('open', 'investigating', 'resolved', 'appealed')),
    resolution_notes TEXT,
    resolved_by INTEGER REFERENCES admin_users(id),
    resolved_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by INTEGER NOT NULL REFERENCES admin_users(id),
    
    -- Indexes
    INDEX idx_compliance_incidents_content_pack (content_pack_id),
    INDEX idx_compliance_incidents_advisor (advisor_id),
    INDEX idx_compliance_incidents_type (incident_type),
    INDEX idx_compliance_incidents_severity (severity_level),
    INDEX idx_compliance_incidents_status (resolution_status),
    INDEX idx_compliance_incidents_created (created_at DESC)
);
```

#### `policy_versions` Table
```sql
CREATE TABLE policy_versions (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Version Information
    version_tag VARCHAR(50) NOT NULL UNIQUE,
    policy_yaml_hash VARCHAR(64) NOT NULL, -- SHA-256 of policy YAML
    
    -- Deployment
    effective_date TIMESTAMP NOT NULL,
    deprecated_date TIMESTAMP,
    
    -- Change Management
    change_summary TEXT NOT NULL,
    change_type VARCHAR(50) NOT NULL
        CHECK (change_type IN ('major', 'minor', 'patch', 'hotfix')),
    
    regression_test_results JSONB DEFAULT '{}',
    -- Structure: {"tests_passed": 45, "tests_failed": 0, "coverage_percentage": 98.5}
    
    -- Approval Chain
    created_by INTEGER NOT NULL REFERENCES admin_users(id),
    approved_by INTEGER REFERENCES admin_users(id),
    
    -- Audit  
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_policy_versions_version (version_tag),
    INDEX idx_policy_versions_effective (effective_date DESC),
    INDEX idx_policy_versions_created (created_at DESC)
);
```

## Key Relationships & Constraints

### Foreign Key Relationships
```sql
-- Core Business Relationships
advisors 1:1 advisor_profiles (advisor_id)
advisors 1:N content_packs (advisor_id)  
content_packs 1:N render_jobs (content_pack_id)
content_packs 1:N deliveries (content_pack_id)
advisors 1:N deliveries (advisor_id)

-- Approval & Admin Relationships  
admin_users 1:N content_packs (reviewed_by)
wa_templates 1:N deliveries (template_used)

-- Audit Relationships
content_packs 1:N ai_audit_logs (content_pack_id)
advisors 1:N compliance_incidents (advisor_id)
content_packs 1:1 compliance_incidents (content_pack_id) -- optional

-- System Configuration
admin_users 1:N fallback_policies (updated_by)
admin_users 1:N fallback_packs (created_by, approved_by)
```

### Data Integrity Constraints
```sql
-- Business Rule Constraints
ALTER TABLE content_packs ADD CONSTRAINT chk_content_has_valid_json
    CHECK (jsonb_typeof(draft_content_json) = 'object');

ALTER TABLE advisors ADD CONSTRAINT chk_advisor_valid_email
    CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$');

ALTER TABLE deliveries ADD CONSTRAINT chk_delivery_timing_sequence
    CHECK (sent_at IS NULL OR delivered_at IS NULL OR sent_at <= delivered_at);

ALTER TABLE deliveries ADD CONSTRAINT chk_read_after_delivery  
    CHECK (read_at IS NULL OR delivered_at IS NULL OR delivered_at <= read_at);

-- Performance Constraints
ALTER TABLE ai_audit_logs ADD CONSTRAINT chk_reasonable_latency
    CHECK (latency_ms >= 100 AND latency_ms <= 30000); -- 100ms to 30s

ALTER TABLE ai_audit_logs ADD CONSTRAINT chk_reasonable_tokens
    CHECK (token_count >= 10 AND token_count <= 100000);
```

### Database Performance Optimization

#### Partitioning Strategy
```sql
-- Time-based partitioning for high-volume tables
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE ai_audit_logs_2024_01 PARTITION OF ai_audit_logs  
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Hash partitioning for deliveries by advisor_id
CREATE TABLE deliveries_p0 PARTITION OF deliveries
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
```

#### Composite Indexes for Common Queries
```sql
-- Content creation workflow
CREATE INDEX idx_content_workflow ON content_packs (advisor_id, status, created_at DESC)
    WHERE status IN ('draft', 'pending');

-- Daily delivery operations
CREATE INDEX idx_daily_delivery_queue ON deliveries (DATE(scheduled_for), status, advisor_id)  
    WHERE status IN ('queued', 'throttled');

-- Admin approval efficiency
CREATE INDEX idx_approval_queue_priority ON content_packs (status, ai_risk_score DESC, created_at ASC)
    WHERE status = 'pending';

-- Analytics queries
CREATE INDEX idx_advisor_performance ON deliveries (advisor_id, DATE(scheduled_for), status)
    WHERE status IN ('delivered', 'read');
```

## Data Residency & Compliance

### DPDP Act 2023 Compliance
```sql
-- PII Identification and Protection
ALTER TABLE advisors ADD COLUMN data_classification VARCHAR(20) DEFAULT 'pii'
    CHECK (data_classification IN ('public', 'internal', 'confidential', 'pii'));

-- Data retention policies via table constraints
ALTER TABLE audit_logs ADD COLUMN retention_until DATE 
    GENERATED ALWAYS AS (timestamp::date + INTERVAL '7 years') STORED;

-- Consent tracking
CREATE TABLE consent_records (
    advisor_id INTEGER PRIMARY KEY REFERENCES advisors(id),
    data_processing_consent BOOLEAN NOT NULL DEFAULT false,
    marketing_consent BOOLEAN NOT NULL DEFAULT false,
    consent_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    consent_ip_address INET,
    consent_version VARCHAR(10) NOT NULL DEFAULT '1.0'
);
```

### Regional Data Requirements
```sql
-- India-specific fields
ALTER TABLE advisors ADD COLUMN gstin VARCHAR(15)
    CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$');

ALTER TABLE advisors ADD COLUMN pan_number VARCHAR(10) 
    CHECK (pan_number IS NULL OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$');
```

## Migration & Deployment Notes

### Initial Data Seeding
```sql
-- Seed fallback policies
INSERT INTO fallback_policies (enabled, languages, topic_priority, library_size) 
VALUES (true, ARRAY['EN','HI','MR'], '{"market_update": 10, "sip_education": 8}', 50);

-- Seed WhatsApp templates (will be populated from Meta approval)
INSERT INTO wa_templates (name, category, supported_locales, template_content) 
VALUES ('welcome_v1_en', 'utility', ARRAY['en'], '{"body": {"text": "Welcome *{{1}}*..."}}');

-- Create admin user
INSERT INTO admin_users (email, role, has_2fa_enabled) 
VALUES ('admin@projectone.ai', 'admin', true);
```

### Performance Monitoring Queries
```sql  
-- Monitor content creation pipeline performance
SELECT DATE(created_at), COUNT(*), AVG(ai_risk_score) 
FROM content_packs 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at);

-- Monitor delivery SLA compliance  
SELECT DATE(scheduled_for), 
       COUNT(*) as total_scheduled,
       COUNT(CASE WHEN sent_at <= scheduled_for + INTERVAL '5 minutes' THEN 1 END) as on_time,
       ROUND(COUNT(CASE WHEN sent_at <= scheduled_for + INTERVAL '5 minutes' THEN 1 END) * 100.0 / COUNT(*), 2) as sla_percentage
FROM deliveries 
WHERE scheduled_for >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(scheduled_for);
```

This comprehensive ER implementation ensures data integrity, performance optimization, and regulatory compliance while supporting the platform's core business workflows and scalability requirements.