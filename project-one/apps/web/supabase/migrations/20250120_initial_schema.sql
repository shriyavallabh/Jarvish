-- JARVISH Platform Database Schema
-- SEBI-Compliant Financial Advisory Platform
-- Created: 2025-01-20

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- Core Advisor Management
-- ==========================================

-- Advisors table (MFDs and RIAs)
CREATE TABLE IF NOT EXISTS advisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    firm_name VARCHAR(255),
    
    -- Regulatory Information
    advisor_type VARCHAR(50) NOT NULL CHECK (advisor_type IN ('MFD', 'RIA', 'BOTH')),
    arn_number VARCHAR(50),
    euin_number VARCHAR(50),
    sebi_registration VARCHAR(50),
    
    -- Subscription
    subscription_tier VARCHAR(50) DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'STANDARD', 'PRO')),
    subscription_status VARCHAR(50) DEFAULT 'TRIAL' CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'PAUSED', 'CANCELLED')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    primary_language VARCHAR(10) DEFAULT 'en' CHECK (primary_language IN ('en', 'hi', 'mr')),
    content_types JSONB DEFAULT '["whatsapp", "status", "linkedin"]',
    send_time TIME DEFAULT '06:00:00',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Status
    onboarding_completed BOOLEAN DEFAULT FALSE,
    whatsapp_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for advisors
CREATE INDEX idx_advisors_clerk_user_id ON advisors(clerk_user_id);
CREATE INDEX idx_advisors_email ON advisors(email);
CREATE INDEX idx_advisors_subscription ON advisors(subscription_tier, subscription_status);
CREATE INDEX idx_advisors_active ON advisors(is_active);

-- ==========================================
-- Content Management
-- ==========================================

-- Content templates
CREATE TABLE IF NOT EXISTS content_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- Content Details
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('whatsapp', 'status', 'linkedin', 'custom')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    
    -- AI Generation
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(50),
    prompt_used TEXT,
    
    -- Compliance
    compliance_status VARCHAR(50) DEFAULT 'PENDING' CHECK (compliance_status IN ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION')),
    compliance_score DECIMAL(5,2),
    compliance_feedback JSONB,
    sebi_violations JSONB DEFAULT '[]',
    
    -- Usage
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_content_templates_advisor ON content_templates(advisor_id);
CREATE INDEX idx_content_templates_type ON content_templates(template_type);
CREATE INDEX idx_content_templates_compliance ON content_templates(compliance_status);

-- Content history (audit trail)
CREATE TABLE IF NOT EXISTS content_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
    template_id UUID REFERENCES content_templates(id) ON DELETE SET NULL,
    
    -- Content Details
    content_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    
    -- Delivery Details
    scheduled_for DATE NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(50) DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'SCHEDULED', 'DELIVERED', 'FAILED', 'CANCELLED')),
    delivery_channel VARCHAR(50),
    
    -- WhatsApp Specific
    whatsapp_message_id VARCHAR(255),
    whatsapp_template_name VARCHAR(255),
    whatsapp_status VARCHAR(50),
    
    -- Performance
    engagement_metrics JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_content_history_advisor ON content_history(advisor_id);
CREATE INDEX idx_content_history_scheduled ON content_history(scheduled_for);
CREATE INDEX idx_content_history_delivery ON content_history(delivery_status);

-- ==========================================
-- WhatsApp Integration
-- ==========================================

-- WhatsApp configurations
CREATE TABLE IF NOT EXISTS whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID UNIQUE REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- WhatsApp Details
    phone_number VARCHAR(20) NOT NULL,
    country_code VARCHAR(5) DEFAULT '+91',
    whatsapp_business_id VARCHAR(255),
    
    -- Template Management
    active_template VARCHAR(255),
    template_language VARCHAR(10) DEFAULT 'en',
    template_quality_rating VARCHAR(20),
    
    -- Status
    opt_in_status BOOLEAN DEFAULT FALSE,
    opt_in_timestamp TIMESTAMP WITH TIME ZONE,
    last_message_sent TIMESTAMP WITH TIME ZONE,
    daily_limit INTEGER DEFAULT 1000,
    messages_sent_today INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_configs_advisor ON whatsapp_configs(advisor_id);

-- WhatsApp delivery queue
CREATE TABLE IF NOT EXISTS whatsapp_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- Message Details
    recipient_phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) DEFAULT 'template',
    template_name VARCHAR(255),
    template_params JSONB,
    message_content TEXT,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    priority INTEGER DEFAULT 5,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_queue_status ON whatsapp_queue(status);
CREATE INDEX idx_whatsapp_queue_scheduled ON whatsapp_queue(scheduled_for);
CREATE INDEX idx_whatsapp_queue_advisor ON whatsapp_queue(advisor_id);

-- ==========================================
-- Compliance & Audit
-- ==========================================

-- Compliance checks log
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID,
    advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- Check Details
    check_type VARCHAR(50) NOT NULL,
    content_text TEXT NOT NULL,
    
    -- Three-Stage Validation
    stage1_rules_passed BOOLEAN,
    stage1_violations JSONB,
    stage2_ai_score DECIMAL(5,2),
    stage2_ai_feedback TEXT,
    stage3_final_status VARCHAR(50),
    stage3_reviewer_notes TEXT,
    
    -- Overall Result
    final_status VARCHAR(50) NOT NULL CHECK (final_status IN ('APPROVED', 'REJECTED', 'NEEDS_REVISION')),
    risk_score DECIMAL(5,2),
    
    -- Performance
    processing_time_ms INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_compliance_checks_advisor ON compliance_checks(advisor_id);
CREATE INDEX idx_compliance_checks_status ON compliance_checks(final_status);
CREATE INDEX idx_compliance_checks_created ON compliance_checks(created_at);

-- Audit logs (immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor
    actor_type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    actor_email VARCHAR(255),
    
    -- Action
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    
    -- Details
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp (immutable)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ==========================================
-- Analytics & Insights
-- ==========================================

-- Advisor analytics
CREATE TABLE IF NOT EXISTS advisor_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID UNIQUE REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- Engagement Metrics
    total_content_created INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    total_messages_delivered INTEGER DEFAULT 0,
    avg_delivery_time_seconds DECIMAL(10,2),
    
    -- Content Performance
    most_used_template_id UUID,
    best_performing_content_id UUID,
    avg_engagement_rate DECIMAL(5,2),
    
    -- Compliance
    total_compliance_checks INTEGER DEFAULT 0,
    compliance_pass_rate DECIMAL(5,2),
    total_violations INTEGER DEFAULT 0,
    
    -- Activity
    last_content_created_at TIMESTAMP WITH TIME ZONE,
    last_message_sent_at TIMESTAMP WITH TIME ZONE,
    active_days_last_30 INTEGER DEFAULT 0,
    
    -- Churn Risk
    churn_risk_score DECIMAL(5,2),
    churn_risk_factors JSONB,
    
    -- Updated
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_advisor_analytics_advisor ON advisor_analytics(advisor_id);

-- Platform metrics (aggregated daily)
CREATE TABLE IF NOT EXISTS platform_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL UNIQUE,
    
    -- User Metrics
    total_advisors INTEGER DEFAULT 0,
    active_advisors INTEGER DEFAULT 0,
    new_signups INTEGER DEFAULT 0,
    churned_advisors INTEGER DEFAULT 0,
    
    -- Content Metrics
    total_content_created INTEGER DEFAULT 0,
    ai_generated_content INTEGER DEFAULT 0,
    compliance_approved INTEGER DEFAULT 0,
    compliance_rejected INTEGER DEFAULT 0,
    
    -- Delivery Metrics
    total_messages_scheduled INTEGER DEFAULT 0,
    total_messages_delivered INTEGER DEFAULT 0,
    delivery_success_rate DECIMAL(5,2),
    avg_delivery_time_seconds DECIMAL(10,2),
    
    -- Revenue Metrics
    mrr DECIMAL(12,2),
    new_mrr DECIMAL(12,2),
    churned_mrr DECIMAL(12,2),
    
    -- System Performance
    api_availability DECIMAL(5,2),
    ai_availability DECIMAL(5,2),
    avg_api_response_ms INTEGER,
    
    -- Created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_platform_metrics_date ON platform_metrics(metric_date);

-- ==========================================
-- Fallback Content System
-- ==========================================

-- Pre-approved fallback content
CREATE TABLE IF NOT EXISTS fallback_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content Details
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    
    -- Targeting
    advisor_types VARCHAR(50)[] DEFAULT ARRAY['MFD', 'RIA'],
    market_conditions VARCHAR(50)[],
    seasons VARCHAR(50)[],
    
    -- Compliance (pre-approved)
    compliance_approved BOOLEAN DEFAULT TRUE,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Usage
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    effectiveness_score DECIMAL(5,2),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_until DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fallback_content_category ON fallback_content(category);
CREATE INDEX idx_fallback_content_language ON fallback_content(language);
CREATE INDEX idx_fallback_content_active ON fallback_content(is_active);

-- ==========================================
-- Support & Feedback
-- ==========================================

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
    
    -- Ticket Details
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_RESPONSE', 'RESOLVED', 'CLOSED')),
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    
    -- Assignment
    assigned_to VARCHAR(255),
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_advisor ON support_tickets(advisor_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_number ON support_tickets(ticket_number);

-- ==========================================
-- Functions & Triggers
-- ==========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_advisors_updated_at BEFORE UPDATE ON advisors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_templates_updated_at BEFORE UPDATE ON content_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_configs_updated_at BEFORE UPDATE ON whatsapp_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_queue_updated_at BEFORE UPDATE ON whatsapp_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advisor_analytics_updated_at BEFORE UPDATE ON advisor_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fallback_content_updated_at BEFORE UPDATE ON fallback_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

-- Enable RLS on tables
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (advisors can only see their own data)
CREATE POLICY advisor_own_profile ON advisors
    FOR ALL USING (auth.uid()::text = clerk_user_id);

CREATE POLICY advisor_own_content ON content_templates
    FOR ALL USING (advisor_id IN (SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text));

CREATE POLICY advisor_own_history ON content_history
    FOR ALL USING (advisor_id IN (SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text));

CREATE POLICY advisor_own_whatsapp ON whatsapp_configs
    FOR ALL USING (advisor_id IN (SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text));

CREATE POLICY advisor_own_compliance ON compliance_checks
    FOR ALL USING (advisor_id IN (SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text));

CREATE POLICY advisor_own_analytics ON advisor_analytics
    FOR ALL USING (advisor_id IN (SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text));

CREATE POLICY advisor_own_tickets ON support_tickets
    FOR ALL USING (advisor_id IN (SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text));

-- Public read access for fallback content
CREATE POLICY public_read_fallback ON fallback_content
    FOR SELECT USING (is_active = true);

-- ==========================================
-- Initial Data & Seed
-- ==========================================

-- Insert sample fallback content
INSERT INTO fallback_content (category, title, content, language) VALUES
('market_update', 'Market Outlook', 'The equity markets continue to show resilience. Diversification remains key for long-term wealth creation.', 'en'),
('educational', 'SIP Benefits', 'Systematic Investment Plans help average out market volatility through rupee cost averaging.', 'en'),
('tax_planning', 'ELSS Advantage', 'ELSS funds offer dual benefits of tax saving under 80C and potential for wealth creation.', 'en')
ON CONFLICT DO NOTHING;

-- Create initial platform metrics row for today
INSERT INTO platform_metrics (metric_date) 
VALUES (CURRENT_DATE) 
ON CONFLICT (metric_date) DO NOTHING;

-- ==========================================
-- Grants (for Supabase)
-- ==========================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read permissions to anonymous users (for public endpoints)
GRANT SELECT ON fallback_content TO anon;
GRANT SELECT ON platform_metrics TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'JARVISH database schema created successfully!';
    RAISE NOTICE 'Tables created: advisors, content_templates, content_history, whatsapp_configs, whatsapp_queue, compliance_checks, audit_logs, advisor_analytics, platform_metrics, fallback_content, support_tickets';
    RAISE NOTICE 'Row Level Security enabled for data protection';
END $$;