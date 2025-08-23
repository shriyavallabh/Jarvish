import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/client'

export type Advisor = Database['public']['Tables']['advisors']['Row']
export type ContentTemplate = Database['public']['Tables']['content_templates']['Row']
export type ComplianceCheck = Database['public']['Tables']['compliance_checks']['Row']
export type AdvisorAnalytics = Database['public']['Tables']['advisor_analytics']['Row']

export interface PlatformMetrics {
  totalAdvisors: number
  activeAdvisors: number
  monthlyRecurringRevenue: number
  churnRate: number
  avgRevenuePerUser: number
  totalContentCreated: number
  complianceRate: number
  avgProcessingTime: number
}

export interface UserGrowthData {
  date: string
  newUsers: number
  activeUsers: number
  churnedUsers: number
}

export interface RevenueData {
  date: string
  revenue: number
  subscriptions: {
    free: number
    basic: number
    standard: number
    pro: number
  }
}

export interface ContentModerationItem {
  id: string
  advisorId: string
  advisorName: string
  content: string
  contentType: string
  language: string
  complianceStatus: string
  riskScore: number
  sebiViolations: string[]
  createdAt: string
}

export interface ActivityFeedItem {
  id: string
  type: 'user_signup' | 'content_created' | 'compliance_flagged' | 'subscription_changed'
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

class AdminService {
  // Platform Metrics
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    try {
      // Get total and active advisors
      const { data: advisors, error: advisorsError } = await supabase
        .from('advisors')
        .select('id, subscription_tier, subscription_status, is_active')
      
      if (advisorsError) throw advisorsError

      const totalAdvisors = advisors?.length || 0
      const activeAdvisors = advisors?.filter(a => a.is_active && a.subscription_status === 'ACTIVE').length || 0
      
      // Calculate MRR based on subscription tiers
      const tierPricing: Record<string, number> = {
        'FREE': 0,
        'BASIC': 499,
        'STANDARD': 999,
        'PRO': 2499
      }
      
      const monthlyRecurringRevenue = advisors?.reduce((total, advisor) => {
        if (advisor.subscription_status === 'ACTIVE') {
          return total + (tierPricing[advisor.subscription_tier] || 0)
        }
        return total
      }, 0) || 0

      // Calculate churn rate (simplified - should be based on time period)
      const churnedUsers = advisors?.filter(a => a.subscription_status === 'CANCELLED').length || 0
      const churnRate = totalAdvisors > 0 ? (churnedUsers / totalAdvisors) * 100 : 0

      // Calculate ARPU
      const avgRevenuePerUser = activeAdvisors > 0 ? monthlyRecurringRevenue / activeAdvisors : 0

      // Get content metrics
      const { data: contentStats, error: contentError } = await supabase
        .from('content_templates')
        .select('id, compliance_status')
      
      if (contentError) throw contentError

      const totalContentCreated = contentStats?.length || 0
      const approvedContent = contentStats?.filter(c => c.compliance_status === 'APPROVED').length || 0
      const complianceRate = totalContentCreated > 0 ? (approvedContent / totalContentCreated) * 100 : 0

      // Get average processing time from compliance checks
      const { data: complianceData, error: complianceError } = await supabase
        .from('compliance_checks')
        .select('processing_time_ms')
        .not('processing_time_ms', 'is', null)
      
      if (complianceError) throw complianceError

      const avgProcessingTime = complianceData?.length > 0
        ? complianceData.reduce((sum, c) => sum + (c.processing_time_ms || 0), 0) / complianceData.length
        : 0

      return {
        totalAdvisors,
        activeAdvisors,
        monthlyRecurringRevenue,
        churnRate: parseFloat(churnRate.toFixed(2)),
        avgRevenuePerUser: parseFloat(avgRevenuePerUser.toFixed(2)),
        totalContentCreated,
        complianceRate: parseFloat(complianceRate.toFixed(2)),
        avgProcessingTime: Math.round(avgProcessingTime)
      }
    } catch (error) {
      console.error('Error fetching platform metrics:', error)
      throw error
    }
  }

  // User Management
  async getAdvisors(filters?: {
    search?: string
    subscriptionTier?: string
    status?: string
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from('advisors')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,firm_name.ilike.%${filters.search}%`)
      }

      if (filters?.subscriptionTier && filters.subscriptionTier !== 'all') {
        query = query.eq('subscription_tier', filters.subscriptionTier)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('subscription_status', filters.status)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      return { advisors: data || [], total: count || 0 }
    } catch (error) {
      console.error('Error fetching advisors:', error)
      throw error
    }
  }

  async getAdvisorDetails(advisorId: string) {
    try {
      // Get advisor info
      const { data: advisor, error: advisorError } = await supabase
        .from('advisors')
        .select('*')
        .eq('id', advisorId)
        .single()

      if (advisorError) throw advisorError

      // Get advisor analytics
      const { data: analytics, error: analyticsError } = await supabase
        .from('advisor_analytics')
        .select('*')
        .eq('advisor_id', advisorId)
        .single()

      // Get recent content
      const { data: recentContent, error: contentError } = await supabase
        .from('content_templates')
        .select('*')
        .eq('advisor_id', advisorId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get compliance history
      const { data: complianceHistory, error: complianceError } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('advisor_id', advisorId)
        .order('created_at', { ascending: false })
        .limit(10)

      return {
        advisor,
        analytics: analytics || null,
        recentContent: recentContent || [],
        complianceHistory: complianceHistory || []
      }
    } catch (error) {
      console.error('Error fetching advisor details:', error)
      throw error
    }
  }

  async updateAdvisorStatus(advisorId: string, updates: {
    subscription_tier?: string
    subscription_status?: string
    is_active?: boolean
  }) {
    try {
      const { data, error } = await supabase
        .from('advisors')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', advisorId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating advisor status:', error)
      throw error
    }
  }

  // Content Moderation
  async getContentForModeration(filters?: {
    status?: string
    riskLevel?: string
    limit?: number
    offset?: number
  }): Promise<{ items: ContentModerationItem[], total: number }> {
    try {
      let query = supabase
        .from('content_templates')
        .select(`
          *,
          advisors!inner(id, full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('compliance_status', filters.status)
      }

      if (filters?.riskLevel && filters.riskLevel !== 'all') {
        if (filters.riskLevel === 'high') {
          query = query.gte('compliance_score', 7)
        } else if (filters.riskLevel === 'medium') {
          query = query.gte('compliance_score', 4).lt('compliance_score', 7)
        } else if (filters.riskLevel === 'low') {
          query = query.lt('compliance_score', 4)
        }
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      const items: ContentModerationItem[] = (data || []).map((item: any) => ({
        id: item.id,
        advisorId: item.advisor_id,
        advisorName: item.advisors?.full_name || 'Unknown',
        content: item.content,
        contentType: item.template_type,
        language: item.language,
        complianceStatus: item.compliance_status,
        riskScore: item.compliance_score || 0,
        sebiViolations: item.sebi_violations || [],
        createdAt: item.created_at
      }))

      return { items, total: count || 0 }
    } catch (error) {
      console.error('Error fetching content for moderation:', error)
      throw error
    }
  }

  async moderateContent(contentId: string, decision: {
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
    feedback?: string
    sebiViolations?: string[]
  }) {
    try {
      // Update content template
      const { data: contentData, error: contentError } = await supabase
        .from('content_templates')
        .update({
          compliance_status: decision.status,
          compliance_feedback: { 
            adminReview: decision.feedback,
            reviewedAt: new Date().toISOString()
          },
          sebi_violations: decision.sebiViolations || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .select()
        .single()

      if (contentError) throw contentError

      // Create compliance check record
      const { error: complianceError } = await supabase
        .from('compliance_checks')
        .insert({
          content_id: contentId,
          advisor_id: contentData.advisor_id,
          check_type: 'ADMIN_REVIEW',
          content_text: contentData.content,
          stage3_final_status: decision.status,
          stage3_reviewer_notes: decision.feedback,
          final_status: decision.status
        })

      if (complianceError) throw complianceError

      return contentData
    } catch (error) {
      console.error('Error moderating content:', error)
      throw error
    }
  }

  async bulkModerateContent(contentIds: string[], decision: {
    status: 'APPROVED' | 'REJECTED'
    feedback?: string
  }) {
    try {
      const results = await Promise.all(
        contentIds.map(id => this.moderateContent(id, decision))
      )
      return results
    } catch (error) {
      console.error('Error bulk moderating content:', error)
      throw error
    }
  }

  // Analytics
  async getUserGrowthData(days: number = 30): Promise<UserGrowthData[]> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('advisors')
        .select('created_at, subscription_status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by date and calculate metrics
      const groupedData: Record<string, UserGrowthData> = {}
      
      // Initialize all days
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        groupedData[dateStr] = {
          date: dateStr,
          newUsers: 0,
          activeUsers: 0,
          churnedUsers: 0
        }
      }

      // Process advisor data
      data?.forEach(advisor => {
        const dateStr = advisor.created_at.split('T')[0]
        if (groupedData[dateStr]) {
          groupedData[dateStr].newUsers++
          if (advisor.subscription_status === 'ACTIVE') {
            groupedData[dateStr].activeUsers++
          } else if (advisor.subscription_status === 'CANCELLED') {
            groupedData[dateStr].churnedUsers++
          }
        }
      })

      return Object.values(groupedData)
    } catch (error) {
      console.error('Error fetching user growth data:', error)
      throw error
    }
  }

  async getRevenueData(days: number = 30): Promise<RevenueData[]> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('advisors')
        .select('created_at, subscription_tier, subscription_status')
        .gte('created_at', startDate.toISOString())
        .eq('subscription_status', 'ACTIVE')
        .order('created_at', { ascending: true })

      if (error) throw error

      const tierPricing: Record<string, number> = {
        'FREE': 0,
        'BASIC': 499,
        'STANDARD': 999,
        'PRO': 2499
      }

      // Group by date and calculate revenue
      const groupedData: Record<string, RevenueData> = {}
      
      // Initialize all days
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        groupedData[dateStr] = {
          date: dateStr,
          revenue: 0,
          subscriptions: {
            free: 0,
            basic: 0,
            standard: 0,
            pro: 0
          }
        }
      }

      // Process advisor data
      data?.forEach(advisor => {
        const dateStr = advisor.created_at.split('T')[0]
        if (groupedData[dateStr]) {
          const revenue = tierPricing[advisor.subscription_tier] || 0
          groupedData[dateStr].revenue += revenue
          
          switch(advisor.subscription_tier) {
            case 'FREE':
              groupedData[dateStr].subscriptions.free++
              break
            case 'BASIC':
              groupedData[dateStr].subscriptions.basic++
              break
            case 'STANDARD':
              groupedData[dateStr].subscriptions.standard++
              break
            case 'PRO':
              groupedData[dateStr].subscriptions.pro++
              break
          }
        }
      })

      return Object.values(groupedData)
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      throw error
    }
  }

  async getContentPerformanceStats() {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .select('template_type, compliance_status, times_used, language')

      if (error) throw error

      // Calculate statistics
      const stats = {
        byType: {} as Record<string, number>,
        byLanguage: {} as Record<string, number>,
        byCompliance: {} as Record<string, number>,
        totalUsage: 0
      }

      data?.forEach(content => {
        // By type
        stats.byType[content.template_type] = (stats.byType[content.template_type] || 0) + 1
        
        // By language
        stats.byLanguage[content.language] = (stats.byLanguage[content.language] || 0) + 1
        
        // By compliance status
        stats.byCompliance[content.compliance_status] = (stats.byCompliance[content.compliance_status] || 0) + 1
        
        // Total usage
        stats.totalUsage += content.times_used
      })

      return stats
    } catch (error) {
      console.error('Error fetching content performance stats:', error)
      throw error
    }
  }

  // Activity Feed
  async getActivityFeed(limit: number = 20): Promise<ActivityFeedItem[]> {
    try {
      // This would typically come from a dedicated activity log table
      // For now, we'll construct it from recent changes in various tables
      
      const activities: ActivityFeedItem[] = []
      
      // Get recent advisor signups
      const { data: recentAdvisors } = await supabase
        .from('advisors')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      recentAdvisors?.forEach(advisor => {
        activities.push({
          id: `advisor-${advisor.id}`,
          type: 'user_signup',
          message: `New advisor ${advisor.full_name} signed up`,
          timestamp: advisor.created_at,
          metadata: { advisorId: advisor.id }
        })
      })

      // Get recent content creations
      const { data: recentContent } = await supabase
        .from('content_templates')
        .select('id, title, created_at, advisor_id')
        .order('created_at', { ascending: false })
        .limit(5)

      recentContent?.forEach(content => {
        activities.push({
          id: `content-${content.id}`,
          type: 'content_created',
          message: `New content created: ${content.title}`,
          timestamp: content.created_at,
          metadata: { contentId: content.id, advisorId: content.advisor_id }
        })
      })

      // Get recent compliance flags
      const { data: recentCompliance } = await supabase
        .from('compliance_checks')
        .select('id, final_status, created_at, advisor_id')
        .eq('final_status', 'REJECTED')
        .order('created_at', { ascending: false })
        .limit(5)

      recentCompliance?.forEach(check => {
        activities.push({
          id: `compliance-${check.id}`,
          type: 'compliance_flagged',
          message: `Content flagged for compliance issues`,
          timestamp: check.created_at,
          metadata: { checkId: check.id, advisorId: check.advisor_id }
        })
      })

      // Sort by timestamp and return limited results
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching activity feed:', error)
      return []
    }
  }

  // System Health
  async getSystemHealth() {
    try {
      // Check database connectivity
      const { error: dbError } = await supabase.from('advisors').select('id').limit(1)
      
      return {
        database: !dbError ? 'healthy' : 'unhealthy',
        whatsappApi: 'healthy', // Would check actual WhatsApp API status
        aiService: 'healthy', // Would check AI service status
        redis: 'healthy', // Would check Redis status
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error checking system health:', error)
      return {
        database: 'unhealthy',
        whatsappApi: 'unknown',
        aiService: 'unknown',
        redis: 'unknown',
        timestamp: new Date().toISOString()
      }
    }
  }
}

export const adminService = new AdminService()