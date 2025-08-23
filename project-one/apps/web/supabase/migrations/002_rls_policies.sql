-- Enable Row Level Security for all tables
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_delivery ENABLE ROW LEVEL SECURITY;

-- Advisors table policies
-- Allow advisors to read their own profile
CREATE POLICY "Advisors can view own profile" ON advisors
    FOR SELECT USING (auth.uid()::text = clerk_user_id);

-- Allow advisors to update their own profile
CREATE POLICY "Advisors can update own profile" ON advisors
    FOR UPDATE USING (auth.uid()::text = clerk_user_id);

-- Allow service role to manage all advisors (for admin operations)
CREATE POLICY "Service role can manage all advisors" ON advisors
    FOR ALL USING (auth.role() = 'service_role');

-- Content table policies
-- Allow advisors to view their own content
CREATE POLICY "Advisors can view own content" ON content
    FOR SELECT USING (
        advisor_id IN (
            SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Allow advisors to insert their own content
CREATE POLICY "Advisors can create content" ON content
    FOR INSERT WITH CHECK (
        advisor_id IN (
            SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Allow advisors to update their own content (only if not approved)
CREATE POLICY "Advisors can update own draft content" ON content
    FOR UPDATE USING (
        advisor_id IN (
            SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text
        ) AND status IN ('draft', 'rejected')
    );

-- Allow advisors to delete their own draft content
CREATE POLICY "Advisors can delete own draft content" ON content
    FOR DELETE USING (
        advisor_id IN (
            SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text
        ) AND status = 'draft'
    );

-- Service role can manage all content
CREATE POLICY "Service role can manage all content" ON content
    FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions table policies
-- Allow advisors to view their own subscriptions
CREATE POLICY "Advisors can view own subscriptions" ON subscriptions
    FOR SELECT USING (
        advisor_id IN (
            SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Only service role can manage subscriptions (for payment processing)
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Content delivery table policies
-- Allow advisors to view their own delivery history
CREATE POLICY "Advisors can view own delivery history" ON content_delivery
    FOR SELECT USING (
        advisor_id IN (
            SELECT id FROM advisors WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Only service role can manage delivery records
CREATE POLICY "Service role can manage all deliveries" ON content_delivery
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to handle new user registration from Clerk
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.advisors (clerk_user_id, email, business_name, mobile, euin)
    VALUES (
        NEW.raw_user_meta_data->>'clerk_user_id',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'business_name', 'Pending'),
        COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
        COALESCE(NEW.raw_user_meta_data->>'euin', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Real-time subscription for content updates
ALTER PUBLICATION supabase_realtime ADD TABLE content;
ALTER PUBLICATION supabase_realtime ADD TABLE content_delivery;
ALTER PUBLICATION supabase_realtime ADD TABLE advisors;