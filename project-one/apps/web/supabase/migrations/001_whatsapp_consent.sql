-- WhatsApp Consent Management Schema
-- This migration creates the necessary tables for tracking WhatsApp consent

-- Create WhatsApp consent table
CREATE TABLE IF NOT EXISTS whatsapp_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  opted_in BOOLEAN DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
  consent_method VARCHAR(50) NOT NULL, -- 'website_signup', 'whatsapp_button', 'import', 'manual'
  consent_text TEXT, -- Exact text user agreed to
  ip_address INET, -- IP address for legal proof
  user_agent TEXT, -- Browser info for audit
  
  -- Marketing preferences
  marketing_consent BOOLEAN DEFAULT true,
  newsletter_consent BOOLEAN DEFAULT true,
  promotional_consent BOOLEAN DEFAULT true,
  
  -- Opt-out tracking
  opt_out_date TIMESTAMP WITH TIME ZONE,
  opt_out_method VARCHAR(50), -- 'whatsapp_stop', 'website', 'support'
  opt_out_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_whatsapp_consent_phone ON whatsapp_consent(phone_number);
CREATE INDEX idx_whatsapp_consent_advisor ON whatsapp_consent(advisor_id);
CREATE INDEX idx_whatsapp_consent_status ON whatsapp_consent(opted_in, consent_date);

-- Create consent audit log for compliance
CREATE TABLE IF NOT EXISTS whatsapp_consent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id UUID REFERENCES whatsapp_consent(id),
  advisor_id UUID REFERENCES advisors(id),
  phone_number VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'opted_in', 'opted_out', 'updated_preferences'
  old_value JSONB,
  new_value JSONB,
  performed_by VARCHAR(100), -- 'user', 'system', 'admin'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message delivery tracking
CREATE TABLE IF NOT EXISTS whatsapp_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES advisors(id),
  phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'daily_insight', 'welcome', 'marketing'
  template_name VARCHAR(100),
  message_id VARCHAR(255), -- WhatsApp message ID
  status VARCHAR(50), -- 'sent', 'delivered', 'read', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for security
ALTER TABLE whatsapp_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_consent_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_delivery_log ENABLE ROW LEVEL SECURITY;

-- Advisors can only see their own consent records
CREATE POLICY "Advisors can view own consent" ON whatsapp_consent
  FOR SELECT USING (auth.uid() = advisor_id);

CREATE POLICY "Advisors can update own consent" ON whatsapp_consent
  FOR UPDATE USING (auth.uid() = advisor_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_whatsapp_consent_updated_at
  BEFORE UPDATE ON whatsapp_consent
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log consent changes
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO whatsapp_consent_audit (
    consent_id,
    advisor_id,
    phone_number,
    action,
    old_value,
    new_value,
    performed_by
  ) VALUES (
    NEW.id,
    NEW.advisor_id,
    NEW.phone_number,
    CASE 
      WHEN OLD IS NULL THEN 'opted_in'
      WHEN OLD.opted_in = true AND NEW.opted_in = false THEN 'opted_out'
      ELSE 'updated_preferences'
    END,
    to_jsonb(OLD),
    to_jsonb(NEW),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log all consent changes
CREATE TRIGGER log_whatsapp_consent_changes
  AFTER INSERT OR UPDATE ON whatsapp_consent
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_change();