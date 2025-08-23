import { CronJob } from 'cron'
import IORedis from 'ioredis'
import { ContentService, AdvisorService } from '@/lib/supabase/services'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { getQueueManager } from './queue-manager'
import { ContentGenerator } from '@/lib/ai/content-generator'

type Tables = Database['public']['Tables']

// Redis connection
const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
})

export interface FallbackContent {
  id: string
  category: string
  content_english: string
  content_hindi?: string
  market_focus: 'equity' | 'debt' | 'hybrid' | 'general'
  risk_level: 'conservative' | 'moderate' | 'aggressive'
  advisor_tier: 'pro' | 'standard' | 'free'
  usage_count: number
  last_used?: Date
  created_at: Date
}

export interface FallbackAssignmentResult {
  advisorId: string
  contentId: string
  reason: string
  assignedAt: Date
}

export class FallbackAssigner {
  private readonly contentService = new ContentService()
  private readonly advisorService = new AdvisorService()
  private readonly queueManager = getQueueManager()
  private readonly supabase = createServerSupabaseClient()
  private readonly contentGenerator = new ContentGenerator()
  
  // Cron job for 21:30 IST daily
  private assignmentJob: CronJob
  
  // Fallback content pool management
  private readonly MIN_POOL_SIZE = 50
  private readonly MAX_USAGE_COUNT = 10
  private readonly ROTATION_DAYS = 30

  constructor() {
    // Initialize cron job for 21:30 IST (16:00 UTC)
    this.assignmentJob = new CronJob(
      '0 0 16 * * *', // 16:00 UTC = 21:30 IST
      async () => {
        await this.runFallbackAssignment()
      },
      null,
      true, // Start immediately
      'UTC'
    )

    // Initialize fallback content pool
    this.initializeFallbackPool()
  }

  /**
   * Initialize fallback content pool
   */
  private async initializeFallbackPool(): Promise<void> {
    try {
      const poolSize = await this.getFallbackPoolSize()
      
      if (poolSize < this.MIN_POOL_SIZE) {
        console.log(`Fallback pool size (${poolSize}) below minimum. Generating content...`)
        await this.generateFallbackContent(this.MIN_POOL_SIZE - poolSize)
      }
      
      // Rotate old content
      await this.rotateOldContent()
    } catch (error) {
      console.error('Failed to initialize fallback pool:', error)
    }
  }

  /**
   * Run fallback assignment for advisors without content
   */
  async runFallbackAssignment(): Promise<{
    assigned: number
    failed: number
    errors: string[]
  }> {
    const results = {
      assigned: 0,
      failed: 0,
      errors: [] as string[],
    }

    try {
      console.log('Starting fallback assignment at 21:30 IST...')
      
      // Get tomorrow's date for content assignment
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      // Get all active advisors
      const { data: advisors, error: advisorError } = await this.supabase
        .from('advisors')
        .select('*')
        .eq('is_active', true)
        .eq('whatsapp_enabled', true)

      if (advisorError) {
        throw advisorError
      }

      // Check which advisors don't have content for tomorrow
      const advisorsNeedingContent: Tables['advisors']['Row'][] = []
      
      for (const advisor of advisors) {
        const hasContent = await this.advisorHasContentForDate(advisor.id, tomorrow)
        
        if (!hasContent) {
          advisorsNeedingContent.push(advisor)
        }
      }

      console.log(`Found ${advisorsNeedingContent.length} advisors needing fallback content`)

      // Assign fallback content to each advisor
      for (const advisor of advisorsNeedingContent) {
        try {
          const assignment = await this.assignFallbackContent(advisor, tomorrow)
          
          if (assignment) {
            results.assigned++
            
            // Schedule delivery for tomorrow 6 AM IST
            await this.scheduleFallbackDelivery(advisor, assignment.contentId, tomorrow)
            
            // Track assignment
            await this.trackFallbackAssignment(assignment)
          }
        } catch (error) {
          console.error(`Failed to assign fallback for advisor ${advisor.id}:`, error)
          results.failed++
          results.errors.push(`Advisor ${advisor.id}: ${error.message}`)
        }
      }

      // Refill pool if needed
      await this.refillPoolIfNeeded()

      console.log(`Fallback assignment complete: ${results.assigned} assigned, ${results.failed} failed`)
      
      return results
    } catch (error) {
      console.error('Fallback assignment error:', error)
      results.errors.push(error.message)
      return results
    }
  }

  /**
   * Check if advisor has content for a specific date
   */
  private async advisorHasContentForDate(
    advisorId: string,
    date: Date
  ): Promise<boolean> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await this.supabase
      .from('content')
      .select('id')
      .eq('advisor_id', advisorId)
      .eq('approval_status', 'approved')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .limit(1)

    if (error) {
      console.error('Error checking advisor content:', error)
      return false
    }

    return data && data.length > 0
  }

  /**
   * Assign appropriate fallback content to an advisor
   */
  private async assignFallbackContent(
    advisor: Tables['advisors']['Row'],
    date: Date
  ): Promise<FallbackAssignmentResult | null> {
    try {
      // Get advisor's preferences and history
      const preferences = await this.getAdvisorPreferences(advisor.id)
      const recentlyUsed = await this.getRecentlyUsedContent(advisor.id, 7) // Last 7 days
      
      // Select appropriate fallback content
      const fallbackContent = await this.selectBestFallbackContent(
        advisor,
        preferences,
        recentlyUsed
      )

      if (!fallbackContent) {
        // Generate emergency content if no suitable fallback found
        const emergency = await this.generateEmergencyContent(advisor)
        if (!emergency) {
          throw new Error('Failed to generate emergency content')
        }
        
        return {
          advisorId: advisor.id,
          contentId: emergency.id,
          reason: 'emergency_generated',
          assignedAt: new Date(),
        }
      }

      // Create content record for the advisor
      const { data: content, error } = await this.supabase
        .from('content')
        .insert({
          advisor_id: advisor.id,
          content_english: fallbackContent.content_english,
          content_hindi: fallbackContent.content_hindi,
          approval_status: 'approved',
          is_fallback: true,
          fallback_reason: 'no_content_submitted',
          scheduled_for: date.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Update fallback content usage
      await this.updateFallbackUsage(fallbackContent.id)

      return {
        advisorId: advisor.id,
        contentId: content.id,
        reason: 'no_content_submitted',
        assignedAt: new Date(),
      }
    } catch (error) {
      console.error('Error assigning fallback content:', error)
      return null
    }
  }

  /**
   * Select best fallback content based on advisor profile
   */
  private async selectBestFallbackContent(
    advisor: Tables['advisors']['Row'],
    preferences: any,
    recentlyUsed: string[]
  ): Promise<FallbackContent | null> {
    try {
      // Query fallback content pool
      const { data: fallbackPool, error } = await this.supabase
        .from('fallback_content')
        .select('*')
        .eq('advisor_tier', advisor.subscription_tier || 'free')
        .not('id', 'in', `(${recentlyUsed.join(',')})`)
        .lte('usage_count', this.MAX_USAGE_COUNT)
        .order('usage_count', { ascending: true })
        .limit(10)

      if (error || !fallbackPool || fallbackPool.length === 0) {
        return null
      }

      // Score each content based on relevance
      const scored = fallbackPool.map(content => {
        let score = 0
        
        // Match market focus
        if (preferences.marketFocus === content.market_focus) {
          score += 3
        }
        
        // Match risk level
        if (preferences.riskLevel === content.risk_level) {
          score += 2
        }
        
        // Prefer less used content
        score += (this.MAX_USAGE_COUNT - content.usage_count) / this.MAX_USAGE_COUNT
        
        return { content, score }
      })

      // Sort by score and return best match
      scored.sort((a, b) => b.score - a.score)
      
      return scored[0]?.content || null
    } catch (error) {
      console.error('Error selecting fallback content:', error)
      return null
    }
  }

  /**
   * Generate emergency content using AI
   */
  private async generateEmergencyContent(
    advisor: Tables['advisors']['Row']
  ): Promise<Tables['content']['Row'] | null> {
    try {
      // Generate content using AI
      const generated = await this.contentGenerator.generateContent({
        advisorName: advisor.advisor_name,
        businessName: advisor.business_name,
        language: advisor.language_preference || 'en',
        tone: 'professional',
        includeMarketUpdate: true,
        includeEducational: true,
        maxLength: 500,
      })

      // Save as emergency content
      const { data, error } = await this.supabase
        .from('content')
        .insert({
          advisor_id: advisor.id,
          content_english: generated.content,
          content_hindi: generated.hindiContent,
          approval_status: 'approved',
          is_fallback: true,
          fallback_reason: 'emergency_generated',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error generating emergency content:', error)
      return null
    }
  }

  /**
   * Schedule fallback content delivery
   */
  private async scheduleFallbackDelivery(
    advisor: Tables['advisors']['Row'],
    contentId: string,
    date: Date
  ): Promise<void> {
    // Calculate delivery time (6 AM IST with jitter)
    const deliveryTime = new Date(date)
    deliveryTime.setHours(6, 0, 0, 0)
    
    // Add jitter based on tier
    const jitterMinutes = advisor.subscription_tier === 'pro' ? 1 : 
                         advisor.subscription_tier === 'standard' ? 3 : 5
    const jitterMs = Math.random() * jitterMinutes * 60 * 1000
    deliveryTime.setTime(deliveryTime.getTime() + jitterMs)

    // Add to delivery queue
    await this.queueManager.addJob(
      'content-delivery',
      `fallback-${advisor.id}-${contentId}`,
      {
        advisorId: advisor.id,
        contentId,
        phoneNumber: advisor.mobile,
        advisorName: advisor.advisor_name,
        businessName: advisor.business_name,
        tier: advisor.subscription_tier || 'free',
        language: advisor.language_preference || 'en',
        isFallback: true,
        fallbackReason: 'no_content_submitted',
      },
      {
        delay: deliveryTime.getTime() - Date.now(),
        priority: advisor.subscription_tier === 'pro' ? 10 : 5,
      }
    )
  }

  /**
   * Track fallback assignment for analytics
   */
  private async trackFallbackAssignment(
    assignment: FallbackAssignmentResult
  ): Promise<void> {
    const key = `fallback:assignments:${new Date().toISOString().split('T')[0]}`
    
    await redis.rpush(key, JSON.stringify(assignment))
    await redis.expire(key, 30 * 24 * 3600) // Keep for 30 days
    
    // Update daily metrics
    await redis.incr(`metrics:fallback:daily:${new Date().toISOString().split('T')[0]}`)
  }

  /**
   * Get advisor preferences
   */
  private async getAdvisorPreferences(advisorId: string): Promise<any> {
    // This would fetch from a preferences table or derive from history
    // For now, returning defaults
    return {
      marketFocus: 'equity',
      riskLevel: 'moderate',
      contentLength: 'medium',
      includeEducational: true,
    }
  }

  /**
   * Get recently used fallback content for an advisor
   */
  private async getRecentlyUsedContent(
    advisorId: string,
    days: number
  ): Promise<string[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await this.supabase
      .from('content')
      .select('id')
      .eq('advisor_id', advisorId)
      .eq('is_fallback', true)
      .gte('created_at', since.toISOString())

    if (error || !data) {
      return []
    }

    return data.map(item => item.id)
  }

  /**
   * Update fallback content usage count
   */
  private async updateFallbackUsage(contentId: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_fallback_usage', {
      content_id: contentId,
    })

    if (error) {
      console.error('Error updating fallback usage:', error)
    }
  }

  /**
   * Generate new fallback content for the pool
   */
  private async generateFallbackContent(count: number): Promise<void> {
    console.log(`Generating ${count} new fallback content items...`)
    
    const categories = ['market_update', 'educational', 'investment_tips', 'regulatory_news']
    const tiers = ['pro', 'standard', 'free']
    const riskLevels = ['conservative', 'moderate', 'aggressive']
    
    for (let i = 0; i < count; i++) {
      try {
        const category = categories[Math.floor(Math.random() * categories.length)]
        const tier = tiers[Math.floor(Math.random() * tiers.length)]
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)]
        
        const content = await this.contentGenerator.generateFallbackContent({
          category,
          tier,
          riskLevel,
          includeHindi: true,
        })

        await this.supabase
          .from('fallback_content')
          .insert({
            category,
            content_english: content.english,
            content_hindi: content.hindi,
            market_focus: content.marketFocus,
            risk_level: riskLevel,
            advisor_tier: tier,
            usage_count: 0,
            created_at: new Date().toISOString(),
          })

      } catch (error) {
        console.error(`Error generating fallback content ${i}:`, error)
      }
    }
    
    console.log('Fallback content generation complete')
  }

  /**
   * Get current fallback pool size
   */
  private async getFallbackPoolSize(): Promise<number> {
    const { count, error } = await this.supabase
      .from('fallback_content')
      .select('*', { count: 'exact', head: true })
      .lte('usage_count', this.MAX_USAGE_COUNT)

    return count || 0
  }

  /**
   * Rotate old or overused content
   */
  private async rotateOldContent(): Promise<void> {
    const rotationDate = new Date()
    rotationDate.setDate(rotationDate.getDate() - this.ROTATION_DAYS)

    // Archive old content
    const { error } = await this.supabase
      .from('fallback_content')
      .update({ archived: true })
      .or(`usage_count.gte.${this.MAX_USAGE_COUNT},created_at.lt.${rotationDate.toISOString()}`)

    if (error) {
      console.error('Error rotating old content:', error)
    }
  }

  /**
   * Refill pool if below minimum
   */
  private async refillPoolIfNeeded(): Promise<void> {
    const currentSize = await this.getFallbackPoolSize()
    
    if (currentSize < this.MIN_POOL_SIZE) {
      const needed = this.MIN_POOL_SIZE - currentSize
      await this.generateFallbackContent(needed)
    }
  }

  /**
   * Get fallback statistics
   */
  async getFallbackStats(): Promise<{
    poolSize: number
    assignmentsToday: number
    assignmentsThisMonth: number
    topReasons: { reason: string; count: number }[]
  }> {
    const poolSize = await this.getFallbackPoolSize()
    
    // Get today's assignments
    const todayKey = `metrics:fallback:daily:${new Date().toISOString().split('T')[0]}`
    const assignmentsToday = parseInt(await redis.get(todayKey) || '0')
    
    // Get this month's assignments
    let assignmentsThisMonth = 0
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    for (let day = 1; day <= 31; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const key = `metrics:fallback:daily:${date.toISOString().split('T')[0]}`
      const count = parseInt(await redis.get(key) || '0')
      assignmentsThisMonth += count
    }

    // Get top reasons (simplified for now)
    const topReasons = [
      { reason: 'no_content_submitted', count: assignmentsThisMonth * 0.7 },
      { reason: 'content_rejected', count: assignmentsThisMonth * 0.2 },
      { reason: 'emergency_generated', count: assignmentsThisMonth * 0.1 },
    ].map(r => ({ reason: r.reason, count: Math.floor(r.count) }))

    return {
      poolSize,
      assignmentsToday,
      assignmentsThisMonth,
      topReasons,
    }
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    this.assignmentJob.stop()
    console.log('Fallback assigner stopped')
  }
}

// Singleton instance
let fallbackAssigner: FallbackAssigner | null = null

export function getFallbackAssigner(): FallbackAssigner {
  if (!fallbackAssigner) {
    fallbackAssigner = new FallbackAssigner()
  }
  return fallbackAssigner
}