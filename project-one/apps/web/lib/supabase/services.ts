import { createServerSupabaseClient } from './client'
import { Database } from './database.types'

type Tables = Database['public']['Tables']

// Advisor Service
export class AdvisorService {
  private supabase = createServerSupabaseClient()

  async createAdvisor(data: Tables['advisors']['Insert']) {
    const { data: advisor, error } = await this.supabase
      .from('advisors')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return advisor
  }

  async getAdvisorByClerkId(clerkUserId: string) {
    const { data, error } = await this.supabase
      .from('advisors')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateAdvisor(id: string, updates: Tables['advisors']['Update']) {
    const { data, error } = await this.supabase
      .from('advisors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async validateEUIN(euin: string) {
    const { data, error } = await this.supabase
      .from('advisors')
      .select('id')
      .eq('euin', euin)
      .single()

    if (error && error.code !== 'PGRST116') {
      if (error.code === 'PGRST301') return false // EUIN already exists
      throw error
    }
    
    return !data // EUIN is available if no data found
  }

  async updateLastActive(advisorId: string) {
    const { error } = await this.supabase
      .from('advisors')
      .update({ last_active: new Date().toISOString() })
      .eq('id', advisorId)

    if (error) throw error
  }

  async incrementContentMetrics(advisorId: string, field: 'content_generated' | 'content_delivered') {
    const { data: advisor, error: fetchError } = await this.supabase
      .from('advisors')
      .select(field)
      .eq('id', advisorId)
      .single()

    if (fetchError) throw fetchError

    const currentValue = advisor[field] || 0
    const { error: updateError } = await this.supabase
      .from('advisors')
      .update({ [field]: currentValue + 1 })
      .eq('id', advisorId)

    if (updateError) throw updateError
  }
}

// Content Service
export class ContentService {
  private supabase = createServerSupabaseClient()

  async createContent(data: Tables['content']['Insert']) {
    const { data: content, error } = await this.supabase
      .from('content')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    
    // Increment advisor's content generated count
    const advisorService = new AdvisorService()
    await advisorService.incrementContentMetrics(content.advisor_id, 'content_generated')
    
    return content
  }

  async updateContent(id: string, updates: Tables['content']['Update']) {
    const { data, error } = await this.supabase
      .from('content')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async approveContent(contentId: string, complianceScore: number, aiScore: number) {
    const { data, error } = await this.supabase
      .from('content')
      .update({
        is_approved: true,
        compliance_score: complianceScore,
        ai_score: aiScore,
        status: 'approved' as const,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async rejectContent(contentId: string, reason: string) {
    const { data, error } = await this.supabase
      .from('content')
      .update({
        is_approved: false,
        rejection_reason: reason,
        status: 'rejected' as const,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async scheduleContent(contentId: string, scheduledFor: string) {
    const { data, error } = await this.supabase
      .from('content')
      .update({
        scheduled_for: scheduledFor,
        status: 'scheduled' as const,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getContentForDelivery(time: string) {
    const { data, error } = await this.supabase
      .from('content')
      .select('*, advisors!inner(*)')
      .eq('status', 'scheduled')
      .lte('scheduled_for', time)

    if (error) throw error
    return data || []
  }
}

// Subscription Service
export class SubscriptionService {
  private supabase = createServerSupabaseClient()

  async createSubscription(data: Tables['subscriptions']['Insert']) {
    // Cancel any existing active subscriptions
    await this.supabase
      .from('subscriptions')
      .update({ status: 'cancelled' as const })
      .eq('advisor_id', data.advisor_id)
      .eq('status', 'active')

    const { data: subscription, error } = await this.supabase
      .from('subscriptions')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    
    // Update advisor's subscription tier
    await this.supabase
      .from('advisors')
      .update({ subscription_tier: data.plan_type })
      .eq('id', data.advisor_id)
    
    return subscription
  }

  async updateSubscription(id: string, updates: Tables['subscriptions']['Update']) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    // Update advisor's subscription tier if plan changed
    if (updates.plan_type) {
      await this.supabase
        .from('advisors')
        .update({ subscription_tier: updates.plan_type })
        .eq('id', data.advisor_id)
    }
    
    return data
  }

  async cancelSubscription(advisorId: string) {
    const { error } = await this.supabase
      .from('subscriptions')
      .update({ status: 'cancelled' as const })
      .eq('advisor_id', advisorId)
      .eq('status', 'active')

    if (error) throw error
    
    // Update advisor to basic tier
    await this.supabase
      .from('advisors')
      .update({ subscription_tier: 'basic' as const })
      .eq('id', advisorId)
  }

  async getActiveSubscription(advisorId: string) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('advisor_id', advisorId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

// Content Delivery Service
export class ContentDeliveryService {
  private supabase = createServerSupabaseClient()

  async createDelivery(data: Tables['content_delivery']['Insert']) {
    const { data: delivery, error } = await this.supabase
      .from('content_delivery')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return delivery
  }

  async updateDeliveryStatus(
    id: string, 
    status: Tables['content_delivery']['Row']['delivery_status'],
    additionalData?: Partial<Tables['content_delivery']['Update']>
  ) {
    const updates: Tables['content_delivery']['Update'] = {
      delivery_status: status,
      ...additionalData
    }

    // Set timestamp based on status
    if (status === 'sent') updates.sent_at = new Date().toISOString()
    if (status === 'delivered') updates.delivered_at = new Date().toISOString()
    if (status === 'read') updates.read_at = new Date().toISOString()

    const { data, error } = await this.supabase
      .from('content_delivery')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    // If delivered, increment advisor's delivered count
    if (status === 'delivered') {
      const advisorService = new AdvisorService()
      await advisorService.incrementContentMetrics(data.advisor_id, 'content_delivered')
    }
    
    return data
  }

  async getPendingDeliveries(time: string) {
    const { data, error } = await this.supabase
      .from('content_delivery')
      .select('*, content!inner(*), advisors!inner(*)')
      .eq('delivery_status', 'pending')
      .lte('scheduled_time', time)

    if (error) throw error
    return data || []
  }

  async getDeliveryMetrics(advisorId: string) {
    const { data, error } = await this.supabase
      .from('content_delivery')
      .select('delivery_status')
      .eq('advisor_id', advisorId)

    if (error) throw error

    const metrics = {
      total: data?.length || 0,
      pending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      read: 0
    }

    data?.forEach(delivery => {
      metrics[delivery.delivery_status]++
    })

    return metrics
  }

  async getDeliveryById(id: string) {
    const { data, error } = await this.supabase
      .from('content_delivery')
      .select('*, content!inner(*)')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getDeliveryByWhatsAppId(whatsappMessageId: string) {
    const { data, error } = await this.supabase
      .from('content_delivery')
      .select('*')
      .eq('whatsapp_message_id', whatsappMessageId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

// Analytics Service
export class AnalyticsService {
  private supabase = createServerSupabaseClient()

  async getAdvisorMetrics(advisorId: string) {
    const { data, error } = await this.supabase
      .rpc('get_advisor_metrics', { advisor_uuid: advisorId })

    if (error) throw error
    return data?.[0] || null
  }

  async getAdvisorAnalytics(advisorId: string) {
    const { data, error } = await this.supabase
      .from('advisor_analytics')
      .select('*')
      .eq('advisor_id', advisorId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getPlatformMetrics() {
    const { data: advisors, error: advisorError } = await this.supabase
      .from('advisors')
      .select('subscription_tier')

    if (advisorError) throw advisorError

    const { data: content, error: contentError } = await this.supabase
      .from('content')
      .select('status')

    if (contentError) throw contentError

    const { data: deliveries, error: deliveryError } = await this.supabase
      .from('content_delivery')
      .select('delivery_status')

    if (deliveryError) throw deliveryError

    const metrics = {
      totalAdvisors: advisors?.length || 0,
      advisorsByTier: {
        basic: advisors?.filter(a => a.subscription_tier === 'basic').length || 0,
        standard: advisors?.filter(a => a.subscription_tier === 'standard').length || 0,
        pro: advisors?.filter(a => a.subscription_tier === 'pro').length || 0
      },
      totalContent: content?.length || 0,
      contentByStatus: {
        draft: content?.filter(c => c.status === 'draft').length || 0,
        pending: content?.filter(c => c.status === 'pending').length || 0,
        approved: content?.filter(c => c.status === 'approved').length || 0,
        rejected: content?.filter(c => c.status === 'rejected').length || 0,
        scheduled: content?.filter(c => c.status === 'scheduled').length || 0,
        delivered: content?.filter(c => c.status === 'delivered').length || 0
      },
      totalDeliveries: deliveries?.length || 0,
      deliveriesByStatus: {
        pending: deliveries?.filter(d => d.delivery_status === 'pending').length || 0,
        sent: deliveries?.filter(d => d.delivery_status === 'sent').length || 0,
        delivered: deliveries?.filter(d => d.delivery_status === 'delivered').length || 0,
        failed: deliveries?.filter(d => d.delivery_status === 'failed').length || 0,
        read: deliveries?.filter(d => d.delivery_status === 'read').length || 0
      }
    }

    return metrics
  }
}