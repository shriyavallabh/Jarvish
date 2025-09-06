import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'jarvish-web',
    },
  },
});

// Database types (generated from schema)
export type Database = {
  public: {
    Tables: {
      advisors: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          phone: string;
          full_name: string;
          firm_name?: string;
          advisor_type: 'MFD' | 'RIA' | 'BOTH';
          arn_number?: string;
          euin_number?: string;
          sebi_registration?: string;
          subscription_tier: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
          subscription_status: 'TRIAL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED';
          trial_ends_at?: string;
          primary_language: 'en' | 'hi' | 'mr';
          content_types: string[];
          send_time: string;
          timezone: string;
          onboarding_completed: boolean;
          whatsapp_verified: boolean;
          email_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login_at?: string;
          metadata: Record<string, any>;
        };
        Insert: Omit<Database['public']['Tables']['advisors']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['advisors']['Insert']>;
      };
      content_templates: {
        Row: {
          id: string;
          advisor_id: string;
          template_type: 'whatsapp' | 'status' | 'linkedin' | 'custom';
          title: string;
          content: string;
          language: string;
          ai_generated: boolean;
          ai_model?: string;
          prompt_used?: string;
          compliance_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
          compliance_score?: number;
          compliance_feedback?: Record<string, any>;
          sebi_violations: any[];
          times_used: number;
          last_used_at?: string;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
          metadata: Record<string, any>;
        };
        Insert: Omit<Database['public']['Tables']['content_templates']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['content_templates']['Insert']>;
      };
      content_history: {
        Row: {
          id: string;
          advisor_id: string;
          template_id?: string;
          content_type: string;
          content: string;
          language: string;
          scheduled_for: string;
          delivered_at?: string;
          delivery_status: 'PENDING' | 'SCHEDULED' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
          delivery_channel?: string;
          whatsapp_message_id?: string;
          whatsapp_template_name?: string;
          whatsapp_status?: string;
          engagement_metrics: Record<string, any>;
          created_at: string;
          metadata: Record<string, any>;
        };
        Insert: Omit<Database['public']['Tables']['content_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['content_history']['Insert']>;
      };
      whatsapp_configs: {
        Row: {
          id: string;
          advisor_id: string;
          phone_number: string;
          country_code: string;
          whatsapp_business_id?: string;
          active_template?: string;
          template_language: string;
          template_quality_rating?: string;
          opt_in_status: boolean;
          opt_in_timestamp?: string;
          last_message_sent?: string;
          daily_limit: number;
          messages_sent_today: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['whatsapp_configs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['whatsapp_configs']['Insert']>;
      };
      compliance_checks: {
        Row: {
          id: string;
          content_id?: string;
          advisor_id: string;
          check_type: string;
          content_text: string;
          stage1_rules_passed?: boolean;
          stage1_violations?: Record<string, any>;
          stage2_ai_score?: number;
          stage2_ai_feedback?: string;
          stage3_final_status?: string;
          stage3_reviewer_notes?: string;
          final_status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
          risk_score?: number;
          processing_time_ms?: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['compliance_checks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['compliance_checks']['Insert']>;
      };
      advisor_analytics: {
        Row: {
          id: string;
          advisor_id: string;
          total_content_created: number;
          total_messages_sent: number;
          total_messages_delivered: number;
          avg_delivery_time_seconds?: number;
          most_used_template_id?: string;
          best_performing_content_id?: string;
          avg_engagement_rate?: number;
          total_compliance_checks: number;
          compliance_pass_rate?: number;
          total_violations: number;
          last_content_created_at?: string;
          last_message_sent_at?: string;
          active_days_last_30: number;
          churn_risk_score?: number;
          churn_risk_factors?: Record<string, any>;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['advisor_analytics']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['advisor_analytics']['Insert']>;
      };
    };
  };
};

// Helper functions for database operations
export const dbHelpers = {
  // Advisor operations
  async getAdvisor(clerkUserId: string) {
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createAdvisor(advisor: Database['public']['Tables']['advisors']['Insert']) {
    const { data, error } = await supabase
      .from('advisors')
      .insert(advisor)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAdvisor(id: string, updates: Database['public']['Tables']['advisors']['Update']) {
    const { data, error } = await supabase
      .from('advisors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Content operations
  async getContentTemplates(advisorId: string) {
    const { data, error } = await supabase
      .from('content_templates')
      .select('*')
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createContentTemplate(template: Database['public']['Tables']['content_templates']['Insert']) {
    const { data, error } = await supabase
      .from('content_templates')
      .insert(template)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Compliance operations
  async createComplianceCheck(check: Database['public']['Tables']['compliance_checks']['Insert']) {
    const { data, error } = await supabase
      .from('compliance_checks')
      .insert(check)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Analytics operations
  async getAdvisorAnalytics(advisorId: string) {
    const { data, error } = await supabase
      .from('advisor_analytics')
      .select('*')
      .eq('advisor_id', advisorId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore not found errors
    return data;
  },

  // WhatsApp operations
  async getWhatsAppConfig(advisorId: string) {
    const { data, error } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('advisor_id', advisorId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore not found errors
    return data;
  },

  async createWhatsAppConfig(config: Database['public']['Tables']['whatsapp_configs']['Insert']) {
    const { data, error } = await supabase
      .from('whatsapp_configs')
      .insert(config)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Server-side client helper
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
}

export default supabase;