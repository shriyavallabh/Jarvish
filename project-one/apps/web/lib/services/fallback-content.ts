import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { DeliveryScheduler } from './delivery-scheduler'
import { formatInTimeZone } from 'date-fns-tz'
import { subDays, addDays } from 'date-fns'

// Fallback content types
export interface FallbackContent {
  id: string
  title: string
  content_english: string
  content_hindi: string
  category: 'market_holiday' | 'general_tips' | 'educational' | 'seasonal' | 'emergency'
  tags: string[]
  priority: number
  validFrom: Date
  validUntil: Date
  useCount: number
  lastUsed?: Date
}

// Content pack for advisors
export interface ContentPack {
  advisorId: string
  contentId: string
  assignedAt: Date
  scheduledFor: Date
  reason: 'no_custom_content' | 'generation_failed' | 'compliance_failed' | 'holiday' | 'emergency'
}

// Seasonal content mapping
const SEASONAL_CONTENT = {
  'diwali': {
    validDays: 5,
    tags: ['festival', 'diwali', 'investment'],
    content: {
      en: 'Wishing you prosperity this Diwali! Consider gold ETFs and sovereign bonds for festive investments.',
      hi: 'दीपावली की शुभकामनाएं! त्योहार के निवेश के लिए गोल्ड ETF और सॉवरेन बॉन्ड पर विचार करें।'
    }
  },
  'holi': {
    validDays: 2,
    tags: ['festival', 'holi', 'markets'],
    content: {
      en: 'Happy Holi! Markets closed today. Review your colorful portfolio of diversified investments.',
      hi: 'होली की शुभकामनाएं! आज बाजार बंद। अपने विविध निवेश के रंगीन पोर्टफोलियो की समीक्षा करें।'
    }
  },
  'budget_day': {
    validDays: 3,
    tags: ['budget', 'government', 'policy'],
    content: {
      en: 'Union Budget announced! Key highlights and investment implications shared.',
      hi: 'केंद्रीय बजट घोषित! मुख्य बिंदु और निवेश प्रभाव साझा किए गए।'
    }
  },
  'year_end': {
    validDays: 7,
    tags: ['tax', 'planning', 'year-end'],
    content: {
      en: 'Year-end tax planning tips: Maximize Section 80C benefits through ELSS investments.',
      hi: 'साल के अंत की टैक्स प्लानिंग: ELSS निवेश के माध्यम से सेक्शन 80C लाभ अधिकतम करें।'
    }
  }
}

// Pre-approved content library
const FALLBACK_LIBRARY = [
  {
    title: 'Power of Compounding',
    content_english: `📈 The Magic of Compounding

Did you know? ₹10,000 invested monthly in equity mutual funds with 12% annual returns becomes ₹23 lakhs in 10 years!

Start your SIP journey today and let compounding work its magic.

💡 Tip: Consistency is key. Never skip your SIP installments.`,
    content_hindi: `📈 चक्रवृद्धि का जादू

क्या आप जानते हैं? 12% वार्षिक रिटर्न के साथ इक्विटी म्यूचुअल फंड में मासिक ₹10,000 का निवेश 10 साल में ₹23 लाख बन जाता है!

आज ही अपनी SIP यात्रा शुरू करें और चक्रवृद्धि को अपना जादू दिखाने दें।

💡 टिप: निरंतरता महत्वपूर्ण है। अपनी SIP किस्तें कभी न छोड़ें।`,
    category: 'educational',
    tags: ['sip', 'compounding', 'mutual-funds']
  },
  {
    title: 'Diversification Strategy',
    content_english: `🎯 Smart Diversification

A well-balanced portfolio typically includes:
• 60% Equity (growth)
• 30% Debt (stability)
• 10% Gold (hedge)

Review your asset allocation quarterly to maintain this balance.

Remember: Don't put all eggs in one basket!`,
    content_hindi: `🎯 स्मार्ट विविधीकरण

एक संतुलित पोर्टफोलियो में आमतौर पर शामिल है:
• 60% इक्विटी (वृद्धि)
• 30% डेट (स्थिरता)
• 10% गोल्ड (सुरक्षा)

इस संतुलन को बनाए रखने के लिए तिमाही आधार पर अपने एसेट एलोकेशन की समीक्षा करें।

याद रखें: सभी अंडे एक टोकरी में न रखें!`,
    category: 'educational',
    tags: ['diversification', 'portfolio', 'asset-allocation']
  },
  {
    title: 'Emergency Fund Importance',
    content_english: `🛡️ Build Your Safety Net

Financial experts recommend maintaining an emergency fund equal to 6-12 months of expenses.

Where to park emergency funds?
✅ Liquid Funds
✅ Savings Account
✅ Fixed Deposits

Start building your emergency fund today!`,
    content_hindi: `🛡️ अपना सुरक्षा जाल बनाएं

वित्तीय विशेषज्ञ 6-12 महीने के खर्च के बराबर आपातकालीन निधि बनाए रखने की सलाह देते हैं।

आपातकालीन निधि कहाँ रखें?
✅ लिक्विड फंड
✅ बचत खाता
✅ फिक्स्ड डिपॉजिट

आज ही अपनी आपातकालीन निधि बनाना शुरू करें!`,
    category: 'educational',
    tags: ['emergency-fund', 'planning', 'safety']
  },
  {
    title: 'Market Holiday Notice',
    content_english: `📅 Market Holiday

Markets are closed today for public holiday.

Use this time to:
• Review your portfolio performance
• Plan next investment moves
• Read about new investment opportunities

Markets resume tomorrow at 9:15 AM.`,
    content_hindi: `📅 बाजार अवकाश

सार्वजनिक अवकाश के लिए आज बाजार बंद हैं।

इस समय का उपयोग करें:
• अपने पोर्टफोलियो प्रदर्शन की समीक्षा
• अगले निवेश की योजना
• नए निवेश अवसरों के बारे में पढ़ें

बाजार कल सुबह 9:15 बजे फिर से खुलेंगे।`,
    category: 'market_holiday',
    tags: ['holiday', 'market-closed']
  },
  {
    title: 'Tax Saving Tips',
    content_english: `💰 Save Tax Smartly

Maximum tax deductions under Section 80C: ₹1.5 Lakhs

Popular options:
• ELSS Mutual Funds (3 year lock-in)
• PPF (15 year tenure)
• NSC (5 year tenure)
• Life Insurance Premium

Plan your taxes, maximize your savings!`,
    content_hindi: `💰 स्मार्ट टैक्स बचत

सेक्शन 80C के तहत अधिकतम कर कटौती: ₹1.5 लाख

लोकप्रिय विकल्प:
• ELSS म्यूचुअल फंड (3 साल लॉक-इन)
• PPF (15 साल की अवधि)
• NSC (5 साल की अवधि)
• जीवन बीमा प्रीमियम

अपने करों की योजना बनाएं, अपनी बचत अधिकतम करें!`,
    category: 'seasonal',
    tags: ['tax-saving', '80c', 'elss']
  }
]

/**
 * Fallback Content System
 * Ensures zero silent days with pre-approved content
 */
export class FallbackContentSystem {
  private supabase: ReturnType<typeof createClient<Database>>
  private deliveryScheduler: DeliveryScheduler
  private contentCache: Map<string, FallbackContent[]> = new Map()
  
  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    this.deliveryScheduler = new DeliveryScheduler()
    this.initializeFallbackContent()
  }

  /**
   * Initialize fallback content in database
   */
  private async initializeFallbackContent() {
    try {
      // Check if fallback content exists
      const { data: existing } = await this.supabase
        .from('fallback_content')
        .select('id')
        .limit(1)

      if (!existing || existing.length === 0) {
        // Insert default fallback content
        const fallbackItems = FALLBACK_LIBRARY.map((item, index) => ({
          title: item.title,
          content_english: item.content_english,
          content_hindi: item.content_hindi,
          category: item.category,
          tags: item.tags,
          priority: index + 1,
          valid_from: new Date().toISOString(),
          valid_until: addDays(new Date(), 365).toISOString(),
          use_count: 0
        }))

        await this.supabase
          .from('fallback_content')
          .insert(fallbackItems)

        console.log('Fallback content initialized')
      }
    } catch (error) {
      console.error('Failed to initialize fallback content:', error)
    }
  }

  /**
   * Assign fallback content at 21:30 IST if no custom content
   */
  async assignFallbackContent(targetDate: Date = new Date()): Promise<{
    assigned: number
    failed: number
    errors: string[]
  }> {
    const results = {
      assigned: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {
      // Set target date to tomorrow 6 AM IST
      const tomorrow = addDays(targetDate, 1)
      const scheduledDate = formatInTimeZone(tomorrow, 'Asia/Kolkata', 'yyyy-MM-dd')

      // Find advisors without content for tomorrow
      const { data: advisorsWithoutContent } = await this.supabase
        .from('advisors')
        .select('id, mobile, business_name, language_preference, subscription_tier')
        .eq('is_active', true)
        .not('id', 'in', 
          `(SELECT advisor_id FROM content WHERE scheduled_date = '${scheduledDate}' AND status = 'approved')`
        )

      if (!advisorsWithoutContent || advisorsWithoutContent.length === 0) {
        console.log('All advisors have content for tomorrow')
        return results
      }

      console.log(`Found ${advisorsWithoutContent.length} advisors without content for ${scheduledDate}`)

      // Check for special dates
      const specialContent = await this.getSpecialDateContent(tomorrow)

      // Get or create fallback content for each advisor
      for (const advisor of advisorsWithoutContent) {
        try {
          // Select appropriate fallback content
          const fallback = specialContent || await this.selectBestFallback(
            advisor.id,
            advisor.language_preference || 'en'
          )

          if (!fallback) {
            throw new Error('No suitable fallback content available')
          }

          // Create content record
          const { data: content, error } = await this.supabase
            .from('content')
            .insert({
              advisor_id: advisor.id,
              content_english: fallback.content_english,
              content_hindi: fallback.content_hindi,
              category: 'fallback',
              status: 'approved', // Pre-approved
              scheduled_date: scheduledDate,
              created_at: new Date().toISOString(),
              metadata: {
                fallback_id: fallback.id,
                reason: 'no_custom_content'
              }
            })
            .select()
            .single()

          if (error) throw error

          // Log assignment
          await this.logFallbackAssignment({
            advisor_id: advisor.id,
            content_id: content.id,
            fallback_id: fallback.id,
            assigned_at: new Date().toISOString(),
            scheduled_for: scheduledDate,
            reason: 'no_custom_content'
          })

          // Update fallback usage
          await this.updateFallbackUsage(fallback.id)

          results.assigned++
        } catch (error) {
          console.error(`Failed to assign fallback for advisor ${advisor.id}:`, error)
          results.failed++
          results.errors.push(`Advisor ${advisor.id}: ${error.message}`)
        }
      }

      console.log(`Assigned fallback content: ${results.assigned} success, ${results.failed} failed`)

      return results
    } catch (error) {
      console.error('Fallback assignment error:', error)
      results.errors.push(`System error: ${error.message}`)
      return results
    }
  }

  /**
   * Select best fallback content for advisor
   */
  private async selectBestFallback(
    advisorId: string,
    language: string
  ): Promise<FallbackContent | null> {
    try {
      // Get advisor's content history
      const { data: recentContent } = await this.supabase
        .from('content_deliveries')
        .select('content_id, metadata')
        .eq('advisor_id', advisorId)
        .order('created_at', { ascending: false })
        .limit(30)

      // Get used fallback IDs
      const usedFallbackIds = recentContent
        ?.map(c => c.metadata?.fallback_id)
        .filter(Boolean) || []

      // Get available fallback content
      const { data: fallbacks } = await this.supabase
        .from('fallback_content')
        .select('*')
        .eq('category', 'educational')
        .not('id', 'in', `(${usedFallbackIds.join(',')})`)
        .lte('valid_from', new Date().toISOString())
        .gte('valid_until', new Date().toISOString())
        .order('use_count', { ascending: true })
        .order('priority', { ascending: true })
        .limit(1)

      if (!fallbacks || fallbacks.length === 0) {
        // If all content has been used, select least recently used
        const { data: lruFallback } = await this.supabase
          .from('fallback_content')
          .select('*')
          .eq('category', 'educational')
          .order('last_used', { ascending: true, nullsFirst: true })
          .limit(1)

        return lruFallback?.[0] || null
      }

      return fallbacks[0]
    } catch (error) {
      console.error('Failed to select fallback content:', error)
      return null
    }
  }

  /**
   * Get special date content (holidays, festivals, etc.)
   */
  private async getSpecialDateContent(date: Date): Promise<FallbackContent | null> {
    try {
      // Check for market holidays
      const { data: holiday } = await this.supabase
        .from('market_holidays')
        .select('*')
        .eq('date', formatInTimeZone(date, 'Asia/Kolkata', 'yyyy-MM-dd'))
        .single()

      if (holiday) {
        // Return holiday-specific content
        const { data: holidayContent } = await this.supabase
          .from('fallback_content')
          .select('*')
          .eq('category', 'market_holiday')
          .contains('tags', [holiday.type])
          .limit(1)

        if (holidayContent?.[0]) {
          return holidayContent[0]
        }
      }

      // Check for seasonal content
      const month = date.getMonth()
      const day = date.getDate()

      // Diwali (October/November)
      if ((month === 9 || month === 10) && this.isDiwaliPeriod(date)) {
        return this.getSeasonalContent('diwali')
      }

      // Year-end tax planning (January-March)
      if (month >= 0 && month <= 2) {
        return this.getSeasonalContent('year_end')
      }

      // Budget day (February 1)
      if (month === 1 && day === 1) {
        return this.getSeasonalContent('budget_day')
      }

      return null
    } catch (error) {
      console.error('Failed to get special date content:', error)
      return null
    }
  }

  /**
   * Check if date is in Diwali period
   */
  private isDiwaliPeriod(date: Date): boolean {
    // This would ideally check against a lunar calendar API
    // For now, using approximate dates
    const month = date.getMonth()
    const day = date.getDate()
    
    // Approximate Diwali period (late October to early November)
    return (month === 9 && day >= 20) || (month === 10 && day <= 10)
  }

  /**
   * Get seasonal content
   */
  private async getSeasonalContent(season: keyof typeof SEASONAL_CONTENT): Promise<FallbackContent | null> {
    const seasonData = SEASONAL_CONTENT[season]
    
    try {
      const { data: content } = await this.supabase
        .from('fallback_content')
        .select('*')
        .contains('tags', seasonData.tags)
        .limit(1)

      return content?.[0] || null
    } catch (error) {
      console.error('Failed to get seasonal content:', error)
      return null
    }
  }

  /**
   * Update fallback content usage
   */
  private async updateFallbackUsage(fallbackId: string) {
    try {
      await this.supabase
        .from('fallback_content')
        .update({
          use_count: this.supabase.sql`use_count + 1`,
          last_used: new Date().toISOString()
        })
        .eq('id', fallbackId)
    } catch (error) {
      console.error('Failed to update fallback usage:', error)
    }
  }

  /**
   * Log fallback assignment
   */
  private async logFallbackAssignment(data: any) {
    try {
      await this.supabase
        .from('fallback_assignments')
        .insert(data)
    } catch (error) {
      console.error('Failed to log fallback assignment:', error)
    }
  }

  /**
   * Get fallback content statistics
   */
  async getFallbackStats(startDate?: Date, endDate?: Date): Promise<{
    totalAssignments: number
    byReason: Record<string, number>
    byCategory: Record<string, number>
    topUsedContent: Array<{ id: string; title: string; useCount: number }>
    coverageRate: number
  }> {
    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    try {
      // Get assignment statistics
      const { data: assignments } = await this.supabase
        .from('fallback_assignments')
        .select('*')
        .gte('assigned_at', start.toISOString())
        .lte('assigned_at', end.toISOString())

      // Get top used content
      const { data: topContent } = await this.supabase
        .from('fallback_content')
        .select('id, title, use_count')
        .order('use_count', { ascending: false })
        .limit(5)

      // Calculate statistics
      const byReason: Record<string, number> = {}
      const byCategory: Record<string, number> = {}

      assignments?.forEach(assignment => {
        byReason[assignment.reason] = (byReason[assignment.reason] || 0) + 1
      })

      // Calculate coverage rate
      const { count: totalDeliveries } = await this.supabase
        .from('content_deliveries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      const coverageRate = totalDeliveries > 0 
        ? ((totalDeliveries - (assignments?.length || 0)) / totalDeliveries) * 100
        : 100

      return {
        totalAssignments: assignments?.length || 0,
        byReason,
        byCategory,
        topUsedContent: topContent || [],
        coverageRate
      }
    } catch (error) {
      console.error('Failed to get fallback stats:', error)
      return {
        totalAssignments: 0,
        byReason: {},
        byCategory: {},
        topUsedContent: [],
        coverageRate: 0
      }
    }
  }

  /**
   * Optimize fallback content based on performance
   */
  async optimizeFallbackContent() {
    try {
      // Analyze engagement metrics
      const { data: metrics } = await this.supabase
        .from('delivery_metrics')
        .select('*')
        .eq('content_type', 'fallback')
        .order('engagement_rate', { ascending: false })

      // Identify high-performing content
      const highPerformers = metrics?.filter(m => m.engagement_rate > 0.7) || []
      
      // Identify low-performing content
      const lowPerformers = metrics?.filter(m => m.engagement_rate < 0.3) || []

      // Update priorities based on performance
      for (const performer of highPerformers) {
        await this.supabase
          .from('fallback_content')
          .update({ priority: 1 })
          .eq('id', performer.content_id)
      }

      for (const performer of lowPerformers) {
        await this.supabase
          .from('fallback_content')
          .update({ priority: 10 })
          .eq('id', performer.content_id)
      }

      console.log(`Optimized fallback content: ${highPerformers.length} promoted, ${lowPerformers.length} demoted`)
    } catch (error) {
      console.error('Failed to optimize fallback content:', error)
    }
  }
}

// Singleton instance
let fallbackSystem: FallbackContentSystem | null = null

export function getFallbackContentSystem(): FallbackContentSystem {
  if (!fallbackSystem) {
    fallbackSystem = new FallbackContentSystem()
  }
  return fallbackSystem
}