-- Jarvish Complete Database Schema for Supabase
-- Includes all tables for advisor management, content, compliance, WhatsApp, and analytics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS advisors CASCADE;

-- Advisors table
CREATE TABLE advisors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  business_name VARCHAR(255),
  euin VARCHAR(50),
  arn VARCHAR(50),
  whatsapp_number VARCHAR(20),
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  language_preference VARCHAR(2) DEFAULT 'en' CHECK (language_preference IN ('en', 'hi', 'mr')),
  subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'standard', 'pro')),
  subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('active', 'inactive', 'trial')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for advisors
CREATE INDEX idx_advisors_email ON advisors(email);
CREATE INDEX idx_advisors_phone ON advisors(phone);
CREATE INDEX idx_advisors_subscription_status ON advisors(subscription_status);
CREATE INDEX idx_advisors_created_at ON advisors(created_at DESC);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  plan_id VARCHAR(100) NOT NULL,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'standard', 'pro')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  razorpay_subscription_id VARCHAR(255),
  razorpay_customer_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX idx_subscriptions_advisor_id ON subscriptions(advisor_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_razorpay_id ON subscriptions(razorpay_subscription_id);

-- Content table
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('market-update', 'educational', 'regulatory', 'festival', 'tax-planning')),
  language VARCHAR(2) NOT NULL CHECK (language IN ('en', 'hi', 'mr')),
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_compliance', 'approved', 'rejected', 'delivered')),
  compliance_score DECIMAL(5, 2),
  compliance_feedback TEXT,
  image_url TEXT,
  delivery_scheduled_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  whatsapp_message_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for content
CREATE INDEX idx_content_advisor_id ON content(advisor_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_created_at ON content(created_at DESC);
CREATE INDEX idx_content_delivery_scheduled ON content(delivery_scheduled_at);

-- Compliance checks table
CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  check_type VARCHAR(20) NOT NULL CHECK (check_type IN ('rules', 'ai', 'final')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
  score DECIMAL(5, 2) NOT NULL,
  feedback TEXT,
  violations JSONB DEFAULT '[]',
  processing_time_ms INTEGER,
  checked_by VARCHAR(255),
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for compliance checks
CREATE INDEX idx_compliance_content_id ON compliance_checks(content_id);
CREATE INDEX idx_compliance_check_type ON compliance_checks(check_type);
CREATE INDEX idx_compliance_status ON compliance_checks(status);
CREATE INDEX idx_compliance_checked_at ON compliance_checks(checked_at DESC);

-- WhatsApp messages table
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  recipient_phone VARCHAR(20) NOT NULL,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'template', 'image')),
  content TEXT,
  template_name VARCHAR(255),
  template_params JSONB,
  image_url TEXT,
  whatsapp_message_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  quality_score VARCHAR(20),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for WhatsApp messages
CREATE INDEX idx_whatsapp_advisor_id ON whatsapp_messages(advisor_id);
CREATE INDEX idx_whatsapp_recipient ON whatsapp_messages(recipient_phone);
CREATE INDEX idx_whatsapp_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_message_id ON whatsapp_messages(whatsapp_message_id);
CREATE INDEX idx_whatsapp_created_at ON whatsapp_messages(created_at DESC);

-- Analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL,
  metric_value DECIMAL(20, 4) NOT NULL,
  dimension_1 VARCHAR(255),
  dimension_2 VARCHAR(255),
  dimension_3 VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX idx_analytics_advisor_id ON analytics(advisor_id);
CREATE INDEX idx_analytics_metric_type ON analytics(metric_type);
CREATE INDEX idx_analytics_recorded_at ON analytics(recorded_at DESC);
CREATE INDEX idx_analytics_dimensions ON analytics(dimension_1, dimension_2, dimension_3);

-- Audit log table for compliance
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  action VARCHAR(50) NOT NULL,
  actor_id UUID,
  actor_type VARCHAR(50),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- Templates table for WhatsApp message templates
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  language VARCHAR(10) NOT NULL,
  header_text TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB,
  status VARCHAR(30) DEFAULT 'pending',
  quality_score VARCHAR(20),
  whatsapp_template_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for templates
CREATE INDEX idx_templates_name ON whatsapp_templates(name);
CREATE INDEX idx_templates_status ON whatsapp_templates(status);
CREATE INDEX idx_templates_language ON whatsapp_templates(language);

-- Content generation queue table
CREATE TABLE content_generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  language VARCHAR(2) NOT NULL,
  scheduled_for DATE NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  generated_content_id UUID REFERENCES content(id),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for content generation queue
CREATE INDEX idx_queue_advisor_id ON content_generation_queue(advisor_id);
CREATE INDEX idx_queue_status ON content_generation_queue(status);
CREATE INDEX idx_queue_scheduled_for ON content_generation_queue(scheduled_for);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_advisors_updated_at BEFORE UPDATE ON advisors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for advisors table
CREATE POLICY "Advisors can view own profile" ON advisors
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Advisors can update own profile" ON advisors
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for content table
CREATE POLICY "Advisors can view own content" ON content
  FOR SELECT USING (auth.uid()::text = advisor_id::text);

CREATE POLICY "Advisors can create own content" ON content
  FOR INSERT WITH CHECK (auth.uid()::text = advisor_id::text);

CREATE POLICY "Advisors can update own content" ON content
  FOR UPDATE USING (auth.uid()::text = advisor_id::text);

-- Create policies for whatsapp_messages table
CREATE POLICY "Advisors can view own messages" ON whatsapp_messages
  FOR SELECT USING (auth.uid()::text = advisor_id::text);

-- Create policies for subscriptions table
CREATE POLICY "Advisors can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid()::text = advisor_id::text);

-- Create policies for analytics table
CREATE POLICY "Advisors can view own analytics" ON analytics
  FOR SELECT USING (auth.uid()::text = advisor_id::text);

-- Create policies for compliance_checks table
CREATE POLICY "Advisors can view compliance checks for own content" ON compliance_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content 
      WHERE content.id = compliance_checks.content_id 
      AND content.advisor_id::text = auth.uid()::text
    )
  );

-- Grant permissions for service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create initial indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_delivery_pending 
  ON content(delivery_scheduled_at) 
  WHERE status = 'approved' AND delivered_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_pending_messages 
  ON whatsapp_messages(created_at) 
  WHERE status = 'queued';

-- Create materialized view for advisor dashboard metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS advisor_dashboard_metrics AS
SELECT 
  a.id as advisor_id,
  a.name,
  a.subscription_tier,
  COUNT(DISTINCT c.id) as total_content,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'approved') as approved_content,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'delivered') as delivered_content,
  COUNT(DISTINCT w.id) as total_messages,
  COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'delivered') as delivered_messages,
  AVG(cc.score) as avg_compliance_score,
  MAX(c.created_at) as last_content_created,
  MAX(w.sent_at) as last_message_sent
FROM advisors a
LEFT JOIN content c ON a.id = c.advisor_id
LEFT JOIN whatsapp_messages w ON a.id = w.advisor_id
LEFT JOIN compliance_checks cc ON c.id = cc.content_id
GROUP BY a.id, a.name, a.subscription_tier;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_advisor_metrics_id ON advisor_dashboard_metrics(advisor_id);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_advisor_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY advisor_dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-advisor-metrics', '*/15 * * * *', 'SELECT refresh_advisor_metrics();');