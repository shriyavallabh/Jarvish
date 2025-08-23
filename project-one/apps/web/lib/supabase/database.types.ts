export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      advisors: {
        Row: {
          id: string
          clerk_user_id: string
          euin: string
          business_name: string
          mobile: string
          email: string
          subscription_tier: 'basic' | 'standard' | 'pro'
          whatsapp_verified: boolean
          compliance_score: number
          content_generated: number
          content_delivered: number
          last_active: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          euin: string
          business_name: string
          mobile: string
          email: string
          subscription_tier?: 'basic' | 'standard' | 'pro'
          whatsapp_verified?: boolean
          compliance_score?: number
          content_generated?: number
          content_delivered?: number
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          euin?: string
          business_name?: string
          mobile?: string
          email?: string
          subscription_tier?: 'basic' | 'standard' | 'pro'
          whatsapp_verified?: boolean
          compliance_score?: number
          content_generated?: number
          content_delivered?: number
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          advisor_id: string
          title: string
          content_english: string
          content_hindi: string | null
          category: string
          topic_family: string
          compliance_score: number
          ai_score: number
          is_approved: boolean
          rejection_reason: string | null
          scheduled_for: string | null
          status: 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'delivered'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          advisor_id: string
          title: string
          content_english: string
          content_hindi?: string | null
          category: string
          topic_family: string
          compliance_score?: number
          ai_score?: number
          is_approved?: boolean
          rejection_reason?: string | null
          scheduled_for?: string | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'delivered'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          advisor_id?: string
          title?: string
          content_english?: string
          content_hindi?: string | null
          category?: string
          topic_family?: string
          compliance_score?: number
          ai_score?: number
          is_approved?: boolean
          rejection_reason?: string | null
          scheduled_for?: string | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'delivered'
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          advisor_id: string
          plan_type: 'basic' | 'standard' | 'pro'
          status: 'active' | 'cancelled' | 'expired' | 'trial'
          razorpay_subscription_id: string | null
          razorpay_payment_id: string | null
          starts_at: string
          expires_at: string
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          advisor_id: string
          plan_type: 'basic' | 'standard' | 'pro'
          status?: 'active' | 'cancelled' | 'expired' | 'trial'
          razorpay_subscription_id?: string | null
          razorpay_payment_id?: string | null
          starts_at?: string
          expires_at?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          advisor_id?: string
          plan_type?: 'basic' | 'standard' | 'pro'
          status?: 'active' | 'cancelled' | 'expired' | 'trial'
          razorpay_subscription_id?: string | null
          razorpay_payment_id?: string | null
          starts_at?: string
          expires_at?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content_delivery: {
        Row: {
          id: string
          advisor_id: string
          content_id: string
          delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
          whatsapp_message_id: string | null
          scheduled_time: string
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          failure_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          advisor_id: string
          content_id: string
          delivery_status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
          whatsapp_message_id?: string | null
          scheduled_time: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          failure_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          advisor_id?: string
          content_id?: string
          delivery_status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
          whatsapp_message_id?: string | null
          scheduled_time?: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          failure_reason?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      advisor_analytics: {
        Row: {
          advisor_id: string
          business_name: string
          subscription_tier: string
          total_content: number
          approved_content: number
          delivered_content: number
          compliance_score: number
          engagement_rate: number
        }
      }
    }
    Functions: {
      get_advisor_metrics: {
        Args: {
          advisor_id: string
        }
        Returns: {
          total_content: number
          approved_content: number
          delivered_content: number
          compliance_score: number
          engagement_rate: number
        }
      }
    }
    Enums: {
      subscription_tier: 'basic' | 'standard' | 'pro'
      content_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'delivered'
      delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
    }
  }
}