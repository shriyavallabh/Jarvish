// Supabase Client Configuration for Next.js
// Provides both client and server-side Supabase clients

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jqvyrtoohlwiivsronzo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdnlydG9vaGx3aWl2c3JvbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTQ2MTYsImV4cCI6MjA3MTE5MDYxNn0.QRiWtn4MKvo5bfDFNlSthz6eYBLaA4qkAEqSn1cmYgY';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Database types
export interface Advisor {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_name?: string;
  euin?: string;
  arn?: string;
  whatsapp_number?: string;
  whatsapp_verified: boolean;
  language_preference: 'en' | 'hi' | 'mr';
  subscription_tier: 'basic' | 'standard' | 'pro';
  subscription_status: 'active' | 'inactive' | 'trial';
  subscription_expires_at?: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  advisor_id: string;
  content_text: string;
  content_type: 'market-update' | 'educational' | 'regulatory' | 'festival' | 'tax-planning';
  language: 'en' | 'hi' | 'mr';
  status: 'draft' | 'pending_compliance' | 'approved' | 'rejected' | 'delivered';
  compliance_score?: number;
  compliance_feedback?: string;
  delivery_scheduled_at?: string;
  delivered_at?: string;
  whatsapp_message_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceCheck {
  id: string;
  content_id: string;
  check_type: 'rules' | 'ai' | 'final';
  status: 'passed' | 'failed' | 'warning';
  score: number;
  feedback: string;
  violations?: any[];
  checked_at: string;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  advisor_id: string;
  recipient_phone: string;
  message_type: 'text' | 'template' | 'image';
  content?: string;
  template_name?: string;
  template_params?: any;
  image_url?: string;
  whatsapp_message_id?: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface Analytics {
  id: string;
  advisor_id: string;
  metric_type: string;
  metric_value: number;
  metadata?: any;
  recorded_at: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  advisor_id: string;
  plan_id: string;
  tier: 'basic' | 'standard' | 'pro';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  razorpay_subscription_id?: string;
  razorpay_customer_id?: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// Client-side Supabase client (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (for API routes with elevated permissions)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Server-side Supabase client with cookie-based auth (for server components)
export async function createServerClient() {
  const cookieStore = cookies();
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

// Helper functions for common database operations
export const db = {
  // Advisor operations
  advisors: {
    async get(id: string) {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Advisor;
    },
    
    async getByEmail(email: string) {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Advisor | null;
    },
    
    async create(advisor: Partial<Advisor>) {
      const { data, error } = await supabase
        .from('advisors')
        .insert([advisor])
        .select()
        .single();
      
      if (error) throw error;
      return data as Advisor;
    },
    
    async update(id: string, updates: Partial<Advisor>) {
      const { data, error } = await supabase
        .from('advisors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Advisor;
    }
  },
  
  // Content operations
  content: {
    async create(content: Partial<Content>) {
      const { data, error } = await supabase
        .from('content')
        .insert([content])
        .select()
        .single();
      
      if (error) throw error;
      return data as Content;
    },
    
    async getByAdvisor(advisorId: string, limit = 50) {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('advisor_id', advisorId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as Content[];
    },
    
    async updateStatus(id: string, status: Content['status'], feedback?: string) {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (feedback) updates.compliance_feedback = feedback;
      
      const { data, error } = await supabase
        .from('content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Content;
    }
  },
  
  // WhatsApp message operations
  whatsapp: {
    async logMessage(message: Partial<WhatsAppMessage>) {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert([message])
        .select()
        .single();
      
      if (error) throw error;
      return data as WhatsAppMessage;
    },
    
    async updateStatus(id: string, status: WhatsAppMessage['status'], whatsappId?: string) {
      const updates: any = { status };
      if (whatsappId) updates.whatsapp_message_id = whatsappId;
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();
      if (status === 'read') updates.read_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as WhatsAppMessage;
    }
  },
  
  // Analytics operations
  analytics: {
    async record(metric: Partial<Analytics>) {
      const { data, error } = await supabase
        .from('analytics')
        .insert([{
          ...metric,
          recorded_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as Analytics;
    },
    
    async getAdvisorMetrics(advisorId: string, startDate?: Date, endDate?: Date) {
      let query = supabase
        .from('analytics')
        .select('*')
        .eq('advisor_id', advisorId);
      
      if (startDate) {
        query = query.gte('recorded_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('recorded_at', endDate.toISOString());
      }
      
      const { data, error } = await query.order('recorded_at', { ascending: false });
      
      if (error) throw error;
      return data as Analytics[];
    }
  },
  
  // Subscription operations
  subscriptions: {
    async get(advisorId: string) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('advisor_id', advisorId)
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Subscription | null;
    },
    
    async create(subscription: Partial<Subscription>) {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([subscription])
        .select()
        .single();
      
      if (error) throw error;
      return data as Subscription;
    },
    
    async update(id: string, updates: Partial<Subscription>) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Subscription;
    }
  }
};

// Export types for use in API routes
export type Database = {
  advisors: Advisor;
  content: Content;
  compliance_checks: ComplianceCheck;
  whatsapp_messages: WhatsAppMessage;
  analytics: Analytics;
  subscriptions: Subscription;
};