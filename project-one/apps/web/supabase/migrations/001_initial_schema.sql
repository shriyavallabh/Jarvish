-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE subscription_tier AS ENUM ('basic', 'standard', 'pro');
CREATE TYPE content_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'scheduled', 'delivered');
CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');

-- Advisors table
CREATE TABLE advisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    euin VARCHAR(50) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier subscription_tier DEFAULT 'basic',
    whatsapp_verified BOOLEAN DEFAULT false,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    content_generated INTEGER DEFAULT 0,
    content_delivered INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content_english TEXT NOT NULL,
    content_hindi TEXT,
    category VARCHAR(100) NOT NULL,
    topic_family VARCHAR(100) NOT NULL,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    ai_score DECIMAL(5,2) DEFAULT 0,
    is_approved BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    status content_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
    plan_type subscription_tier DEFAULT 'basic',
    status subscription_status DEFAULT 'trial',
    razorpay_subscription_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content delivery table
CREATE TABLE content_delivery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    delivery_status delivery_status DEFAULT 'pending',
    whatsapp_message_id VARCHAR(255),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_advisors_clerk_user_id ON advisors(clerk_user_id);
CREATE INDEX idx_advisors_euin ON advisors(euin);
CREATE INDEX idx_advisors_email ON advisors(email);
CREATE INDEX idx_content_advisor_id ON content(advisor_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_scheduled_for ON content(scheduled_for);
CREATE INDEX idx_subscriptions_advisor_id ON subscriptions(advisor_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_content_delivery_advisor_id ON content_delivery(advisor_id);
CREATE INDEX idx_content_delivery_content_id ON content_delivery(content_id);
CREATE INDEX idx_content_delivery_status ON content_delivery(delivery_status);
CREATE INDEX idx_content_delivery_scheduled ON content_delivery(scheduled_time);

-- Create view for advisor analytics
CREATE VIEW advisor_analytics AS
SELECT 
    a.id as advisor_id,
    a.business_name,
    a.subscription_tier::text,
    COUNT(DISTINCT c.id) as total_content,
    COUNT(DISTINCT CASE WHEN c.is_approved THEN c.id END) as approved_content,
    COUNT(DISTINCT CASE WHEN cd.delivery_status = 'delivered' THEN cd.id END) as delivered_content,
    a.compliance_score,
    CASE 
        WHEN COUNT(DISTINCT cd.id) > 0 
        THEN (COUNT(DISTINCT CASE WHEN cd.delivery_status = 'read' THEN cd.id END)::DECIMAL / COUNT(DISTINCT cd.id)) * 100
        ELSE 0 
    END as engagement_rate
FROM advisors a
LEFT JOIN content c ON a.id = c.advisor_id
LEFT JOIN content_delivery cd ON a.id = cd.advisor_id
GROUP BY a.id, a.business_name, a.subscription_tier, a.compliance_score;

-- Function to get advisor metrics
CREATE OR REPLACE FUNCTION get_advisor_metrics(advisor_uuid UUID)
RETURNS TABLE(
    total_content BIGINT,
    approved_content BIGINT,
    delivered_content BIGINT,
    compliance_score DECIMAL,
    engagement_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.id) as total_content,
        COUNT(DISTINCT CASE WHEN c.is_approved THEN c.id END) as approved_content,
        COUNT(DISTINCT CASE WHEN cd.delivery_status = 'delivered' THEN cd.id END) as delivered_content,
        a.compliance_score,
        CASE 
            WHEN COUNT(DISTINCT cd.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN cd.delivery_status = 'read' THEN cd.id END)::DECIMAL / COUNT(DISTINCT cd.id)) * 100
            ELSE 0 
        END as engagement_rate
    FROM advisors a
    LEFT JOIN content c ON a.id = c.advisor_id
    LEFT JOIN content_delivery cd ON a.id = cd.advisor_id
    WHERE a.id = advisor_uuid
    GROUP BY a.compliance_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advisors_updated_at BEFORE UPDATE ON advisors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();