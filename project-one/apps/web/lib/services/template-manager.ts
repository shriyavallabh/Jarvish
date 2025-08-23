import { WhatsAppCloudAPI, WhatsAppTemplate, TemplateStatus, QualityRating } from './whatsapp-cloud-api'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

// Template health scoring
export interface TemplateHealth {
  templateId: string
  templateName: string
  language: string
  status: TemplateStatus
  qualityScore: QualityRating
  deliveryRate: number
  openRate: number
  responseRate: number
  blockRate: number
  lastUsed: Date
  useCount: number
  healthScore: number // 0-100
  recommendation: 'USE' | 'MONITOR' | 'ROTATE' | 'DISABLE'
}

// Template rotation strategy
export interface RotationStrategy {
  primaryTemplate: string
  backupTemplates: string[]
  rotationInterval: number // hours
  qualityThreshold: number // 0-100
  performanceThreshold: number // 0-100
}

// Template content for financial advisors
export const TEMPLATE_LIBRARY = {
  // Daily market update templates
  DAILY_MARKET_UPDATE_V1: {
    name: 'daily_market_update_v1',
    category: 'MARKETING' as const,
    language: 'en',
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '📈 Market Update - {{1}}',
        example: {
          header_text: ['January 20, 2025']
        }
      },
      {
        type: 'BODY' as const,
        text: `Good morning! Here's your personalized market insight from {{1}}.

📊 Market Snapshot:
{{2}}

💡 Key Insights:
{{3}}

📱 Today's Focus:
{{4}}

⚠️ Disclaimer: This is for informational purposes only. Investment decisions should be made after consulting with a qualified financial advisor.

SEBI Registration: {{5}}`,
        example: {
          body_text: [
            ['Rajesh Kumar Financial Services'],
            ['Sensex: 73,500 (+1.2%) | Nifty: 22,300 (+0.9%)'],
            ['Banking stocks lead gains, IT sector shows resilience'],
            ['Consider large-cap mutual funds for stable returns'],
            ['INA000012345']
          ]
        }
      },
      {
        type: 'FOOTER' as const,
        text: 'Powered by JARVISH | Reply STOP to unsubscribe'
      },
      {
        type: 'BUTTONS' as const,
        buttons: [
          {
            type: 'URL' as const,
            text: 'Full Analysis',
            url: 'https://app.jarvish.ai/content/{{1}}'
          },
          {
            type: 'QUICK_REPLY' as const,
            text: 'Get Details'
          }
        ]
      }
    ]
  },

  DAILY_MARKET_UPDATE_V2: {
    name: 'daily_market_update_v2',
    category: 'MARKETING' as const,
    language: 'en',
    components: [
      {
        type: 'HEADER' as const,
        format: 'IMAGE' as const,
        example: {
          header_handle: ['market_chart_image']
        }
      },
      {
        type: 'BODY' as const,
        text: `🌅 Good Morning! {{1}} here with today's market outlook.

📈 Market Performance:
{{2}}

🎯 Investment Opportunity:
{{3}}

💰 Sector Watch:
{{4}}

📞 Need personalized advice? I'm here to help!

SEBI Reg: {{5}} | This is not investment advice.`,
        example: {
          body_text: [
            ['Your trusted advisor'],
            ['Markets open positive, banking sector leads'],
            ['SIP in diversified equity funds recommended'],
            ['Focus on FMCG and Pharma sectors today'],
            ['INA000012345']
          ]
        }
      }
    ]
  },

  // Hindi templates for wider reach
  DAILY_MARKET_UPDATE_HINDI_V1: {
    name: 'daily_market_update_hindi_v1',
    category: 'MARKETING' as const,
    language: 'hi',
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '📈 बाजार अपडेट - {{1}}',
        example: {
          header_text: ['20 जनवरी 2025']
        }
      },
      {
        type: 'BODY' as const,
        text: `🙏 नमस्ते! {{1}} की ओर से आज का बाजार विश्लेषण।

📊 बाजार की स्थिति:
{{2}}

💡 मुख्य सुझाव:
{{3}}

📱 आज का फोकस:
{{4}}

⚠️ चेतावनी: यह केवल जानकारी के लिए है। निवेश से पहले वित्तीय सलाहकार से परामर्श लें।

सेबी पंजीकरण: {{5}}`,
        example: {
          body_text: [
            ['राजेश कुमार फाइनेंशियल सर्विसेज'],
            ['सेंसेक्स: 73,500 (+1.2%) | निफ्टी: 22,300 (+0.9%)'],
            ['बैंकिंग शेयरों में तेजी, आईटी सेक्टर स्थिर'],
            ['लार्ज-कैप म्यूचुअल फंड पर विचार करें'],
            ['INA000012345']
          ]
        }
      },
      {
        type: 'FOOTER' as const,
        text: 'JARVISH द्वारा संचालित | रोकने के लिए STOP भेजें'
      }
    ]
  },

  // Fallback templates
  MARKET_CLOSED_UPDATE: {
    name: 'market_closed_update',
    category: 'MARKETING' as const,
    language: 'en',
    components: [
      {
        type: 'BODY' as const,
        text: `Good morning! Markets are closed today.

{{1}} wishes you a great day ahead!

📚 Today's Financial Tip:
{{2}}

Stay tuned for tomorrow's market update.

SEBI Reg: {{3}}`,
        example: {
          body_text: [
            ['Your Financial Advisor'],
            ['Review your portfolio allocation regularly for optimal returns'],
            ['INA000012345']
          ]
        }
      }
    ]
  },

  // Welcome template for new subscribers
  ADVISOR_WELCOME: {
    name: 'advisor_welcome',
    category: 'MARKETING' as const,
    language: 'en',
    components: [
      {
        type: 'BODY' as const,
        text: `Welcome! I'm {{1}}, your trusted financial advisor.

✅ You'll receive daily market updates at 6 AM
📊 Personalized investment insights
💡 Expert financial guidance
🔒 SEBI-compliant advice

Your journey to financial success starts here!

SEBI Registration: {{2}}

Reply HELP for assistance or STOP to unsubscribe.`,
        example: {
          body_text: [
            ['Rajesh Kumar'],
            ['INA000012345']
          ]
        }
      }
    ]
  }
}

/**
 * Template Manager for WhatsApp Business
 * Handles template rotation, quality monitoring, and optimization
 */
export class TemplateManager {
  private whatsappAPI: WhatsAppCloudAPI
  private supabase: ReturnType<typeof createClient<Database>>
  private templateHealthCache: Map<string, TemplateHealth> = new Map()
  private rotationStrategies: Map<string, RotationStrategy> = new Map()
  private activeRotations: Map<string, { currentTemplate: string; rotatedAt: Date }> = new Map()

  constructor() {
    this.whatsappAPI = new WhatsAppCloudAPI()
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    this.initializeRotationStrategies()
  }

  /**
   * Initialize default rotation strategies
   */
  private initializeRotationStrategies() {
    // Daily content rotation strategy
    this.rotationStrategies.set('daily_content', {
      primaryTemplate: 'daily_market_update_v1',
      backupTemplates: ['daily_market_update_v2', 'market_closed_update'],
      rotationInterval: 168, // Weekly rotation
      qualityThreshold: 70,
      performanceThreshold: 80
    })

    // Hindi content rotation
    this.rotationStrategies.set('daily_content_hindi', {
      primaryTemplate: 'daily_market_update_hindi_v1',
      backupTemplates: ['daily_market_update_v2'],
      rotationInterval: 168,
      qualityThreshold: 70,
      performanceThreshold: 80
    })
  }

  /**
   * Get the best template for a use case
   */
  async getBestTemplate(
    useCase: string,
    language: string = 'en'
  ): Promise<{ templateName: string; health: TemplateHealth }> {
    const strategyKey = language === 'hi' ? `${useCase}_hindi` : useCase
    const strategy = this.rotationStrategies.get(strategyKey)

    if (!strategy) {
      throw new Error(`No rotation strategy found for ${useCase}`)
    }

    // Check if rotation is needed
    const rotation = this.activeRotations.get(strategyKey)
    if (rotation) {
      const hoursSinceRotation = (Date.now() - rotation.rotatedAt.getTime()) / 3600000
      if (hoursSinceRotation < strategy.rotationInterval) {
        // Check if current template is still healthy
        const health = await this.getTemplateHealth(rotation.currentTemplate)
        if (health.healthScore >= strategy.qualityThreshold) {
          return { templateName: rotation.currentTemplate, health }
        }
      }
    }

    // Evaluate all templates in the strategy
    const candidates = [strategy.primaryTemplate, ...strategy.backupTemplates]
    let bestTemplate = strategy.primaryTemplate
    let bestHealth: TemplateHealth | null = null

    for (const templateName of candidates) {
      const health = await this.getTemplateHealth(templateName)
      
      if (health.status === 'APPROVED' && health.healthScore >= strategy.qualityThreshold) {
        if (!bestHealth || health.healthScore > bestHealth.healthScore) {
          bestTemplate = templateName
          bestHealth = health
        }
      }
    }

    if (!bestHealth) {
      // No healthy template found, use primary with caution
      bestHealth = await this.getTemplateHealth(strategy.primaryTemplate)
      console.warn(`No healthy template found for ${useCase}, using ${strategy.primaryTemplate} with score ${bestHealth.healthScore}`)
    }

    // Update active rotation
    this.activeRotations.set(strategyKey, {
      currentTemplate: bestTemplate,
      rotatedAt: new Date()
    })

    return { templateName: bestTemplate, health: bestHealth }
  }

  /**
   * Get template health metrics
   */
  async getTemplateHealth(templateName: string): Promise<TemplateHealth> {
    // Check cache
    const cached = this.templateHealthCache.get(templateName)
    if (cached && (Date.now() - cached.lastUsed.getTime()) < 3600000) { // 1 hour cache
      return cached
    }

    // Fetch template status from WhatsApp
    const template = await this.whatsappAPI.getTemplate(templateName)
    
    if (!template) {
      return this.createDefaultHealth(templateName, 'REJECTED')
    }

    // Fetch delivery metrics from database
    const metrics = await this.fetchTemplateMetrics(templateName)

    // Calculate health score
    const healthScore = this.calculateHealthScore(template, metrics)

    // Determine recommendation
    const recommendation = this.getRecommendation(healthScore, template.status)

    const health: TemplateHealth = {
      templateId: template.id,
      templateName: template.name,
      language: template.language,
      status: template.status,
      qualityScore: template.quality_score?.score || 'UNKNOWN',
      deliveryRate: metrics.deliveryRate,
      openRate: metrics.openRate,
      responseRate: metrics.responseRate,
      blockRate: metrics.blockRate,
      lastUsed: metrics.lastUsed,
      useCount: metrics.useCount,
      healthScore,
      recommendation
    }

    // Cache the result
    this.templateHealthCache.set(templateName, health)

    return health
  }

  /**
   * Submit new template for approval
   */
  async submitTemplate(
    templateKey: keyof typeof TEMPLATE_LIBRARY
  ): Promise<{ id: string; status: string }> {
    const templateDef = TEMPLATE_LIBRARY[templateKey]
    
    if (!templateDef) {
      throw new Error(`Template ${templateKey} not found in library`)
    }

    // Check if template already exists
    const existing = await this.whatsappAPI.getTemplate(templateDef.name, templateDef.language)
    
    if (existing && existing.status === 'APPROVED') {
      return { id: existing.id, status: existing.status }
    }

    // Submit for approval
    const result = await this.whatsappAPI.createTemplate({
      name: templateDef.name,
      category: templateDef.category,
      language: templateDef.language,
      components: templateDef.components
    })

    // Log submission in database
    await this.logTemplateSubmission(templateDef.name, result.id)

    return result
  }

  /**
   * Monitor template approval status
   */
  async monitorApprovals(): Promise<Array<{
    templateName: string
    status: TemplateStatus
    rejectedReason?: string
  }>> {
    const results: Array<any> = []

    // Get all pending templates from database
    const { data: pendingTemplates } = await this.supabase
      .from('template_submissions')
      .select('*')
      .eq('status', 'PENDING')

    if (!pendingTemplates) return results

    for (const submission of pendingTemplates) {
      const template = await this.whatsappAPI.getTemplate(submission.template_name)
      
      if (template && template.status !== 'PENDING') {
        // Update status in database
        await this.supabase
          .from('template_submissions')
          .update({
            status: template.status,
            rejected_reason: template.rejected_reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', submission.id)

        results.push({
          templateName: template.name,
          status: template.status,
          rejectedReason: template.rejected_reason
        })
      }
    }

    return results
  }

  /**
   * Perform A/B testing on templates
   */
  async runABTest(
    templateA: string,
    templateB: string,
    sampleSize: number = 100
  ): Promise<{
    winner: string
    aPerformance: number
    bPerformance: number
    confidence: number
  }> {
    // This would implement actual A/B testing logic
    // For now, returning mock results
    return {
      winner: templateA,
      aPerformance: 85,
      bPerformance: 78,
      confidence: 0.95
    }
  }

  /**
   * Calculate template health score
   */
  private calculateHealthScore(
    template: WhatsAppTemplate,
    metrics: any
  ): number {
    let score = 0
    
    // Status weight: 30%
    if (template.status === 'APPROVED') score += 30
    else if (template.status === 'PENDING') score += 15
    
    // Quality rating weight: 30%
    if (template.quality_score?.score === 'GREEN') score += 30
    else if (template.quality_score?.score === 'YELLOW') score += 20
    else if (template.quality_score?.score === 'RED') score += 5
    
    // Delivery rate weight: 20%
    score += Math.min(20, metrics.deliveryRate * 0.2)
    
    // Open rate weight: 10%
    score += Math.min(10, metrics.openRate * 0.1)
    
    // Block rate penalty: -10%
    score -= Math.min(10, metrics.blockRate * 10)
    
    // Recent usage bonus: 10%
    const daysSinceUse = (Date.now() - metrics.lastUsed.getTime()) / 86400000
    if (daysSinceUse < 1) score += 10
    else if (daysSinceUse < 7) score += 5
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Get recommendation based on health score
   */
  private getRecommendation(
    healthScore: number,
    status: TemplateStatus
  ): 'USE' | 'MONITOR' | 'ROTATE' | 'DISABLE' {
    if (status !== 'APPROVED') return 'DISABLE'
    if (healthScore >= 80) return 'USE'
    if (healthScore >= 60) return 'MONITOR'
    if (healthScore >= 40) return 'ROTATE'
    return 'DISABLE'
  }

  /**
   * Fetch template metrics from database
   */
  private async fetchTemplateMetrics(templateName: string): Promise<any> {
    // Query delivery metrics from database
    const { data, error } = await this.supabase
      .from('delivery_metrics')
      .select('*')
      .eq('template_name', templateName)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error || !data || data.length === 0) {
      return {
        deliveryRate: 0,
        openRate: 0,
        responseRate: 0,
        blockRate: 0,
        lastUsed: new Date(0),
        useCount: 0
      }
    }

    // Calculate aggregate metrics
    const totalMessages = data.length
    const delivered = data.filter(d => d.status === 'delivered').length
    const opened = data.filter(d => d.status === 'read').length
    const blocked = data.filter(d => d.failure_reason?.includes('blocked')).length

    return {
      deliveryRate: (delivered / totalMessages) * 100,
      openRate: (opened / totalMessages) * 100,
      responseRate: 0, // Would need interaction tracking
      blockRate: (blocked / totalMessages) * 100,
      lastUsed: new Date(data[0].created_at),
      useCount: totalMessages
    }
  }

  /**
   * Log template submission to database
   */
  private async logTemplateSubmission(templateName: string, templateId: string) {
    await this.supabase
      .from('template_submissions')
      .insert({
        template_name: templateName,
        template_id: templateId,
        status: 'PENDING',
        submitted_at: new Date().toISOString()
      })
  }

  /**
   * Create default health for missing templates
   */
  private createDefaultHealth(templateName: string, status: TemplateStatus): TemplateHealth {
    return {
      templateId: '',
      templateName,
      language: 'en',
      status,
      qualityScore: 'UNKNOWN',
      deliveryRate: 0,
      openRate: 0,
      responseRate: 0,
      blockRate: 0,
      lastUsed: new Date(0),
      useCount: 0,
      healthScore: 0,
      recommendation: 'DISABLE'
    }
  }
}

// Singleton instance
let templateManager: TemplateManager | null = null

export function getTemplateManager(): TemplateManager {
  if (!templateManager) {
    templateManager = new TemplateManager()
  }
  return templateManager
}