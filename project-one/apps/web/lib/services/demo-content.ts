import { prisma } from '@/lib/utils/database'
import { OpenAIService } from '@/lib/ai/openai-service'
import { ThreeStageValidator } from '@/lib/ai/three-stage-validator'

export interface DemoContentResult {
  content: {
    title: string
    content_english: string
    content_hindi?: string | null
    content_gujarati?: string | null
    category: string
    topic_family: string
  }
  validation: {
    isCompliant: boolean
    complianceScore: number
    aiScore: number
    sebiChecks?: any
    violations?: string[]
    suggestions?: string[]
  }
  metadata: {
    generatedFor: string
    tier: string
    languages: string[]
    generatedAt: Date
    responseTimeMs: number
  }
}

export class DemoContentService {
  private openAI: OpenAIService
  private validator: ThreeStageValidator

  constructor() {
    this.openAI = new OpenAIService()
    this.validator = new ThreeStageValidator()
  }

  async generateDemo(advisorId: string): Promise<DemoContentResult> {
    const startTime = Date.now()

    // Get advisor details
    const advisor = await prisma.advisors.findUnique({
      where: { id: advisorId },
    })

    if (!advisor) {
      throw new Error('Advisor not found')
    }

    // Get content preferences
    const preferences = await prisma.contentPreferences.findUnique({
      where: { advisorId },
    })

    if (!preferences) {
      throw new Error('Content preferences not found. Please set your preferences first.')
    }

    try {
      // Generate content using AI
      const generatedContent = await this.generateContent(
        preferences,
        advisor.business_name || 'Your Business'
      )

      // Validate content for SEBI compliance
      const validationResult = await this.validateContent(generatedContent)

      // Store demo content in database
      const savedDemo = await prisma.demoContent.create({
        data: {
          advisorId,
          title: generatedContent.title,
          content_english: generatedContent.content_english,
          content_hindi: generatedContent.content_hindi || null,
          content_gujarati: generatedContent.content_gujarati || null,
          category: generatedContent.category,
          topic_family: generatedContent.topic_family,
          complianceScore: validationResult.complianceScore,
          aiScore: validationResult.aiScore,
          isCompliant: validationResult.isCompliant,
          validationDetails: validationResult,
          createdAt: new Date(),
        },
      })

      const responseTimeMs = Date.now() - startTime

      return {
        content: {
          title: generatedContent.title,
          content_english: generatedContent.content_english,
          content_hindi: generatedContent.content_hindi,
          content_gujarati: generatedContent.content_gujarati,
          category: generatedContent.category,
          topic_family: generatedContent.topic_family,
        },
        validation: {
          isCompliant: validationResult.isCompliant,
          complianceScore: validationResult.complianceScore,
          aiScore: validationResult.aiScore,
          sebiChecks: validationResult.sebiChecks,
          violations: validationResult.violations,
          suggestions: validationResult.suggestions,
        },
        metadata: {
          generatedFor: advisor.business_name || 'Your Business',
          tier: advisor.subscription_tier || 'basic',
          languages: preferences.languages,
          generatedAt: new Date(),
          responseTimeMs,
        },
      }
    } catch (error) {
      throw new Error(`Failed to generate demo content: ${error.message}`)
    }
  }

  async getDemoHistory(advisorId: string, limit: number = 10) {
    const demos = await prisma.demoContent.findMany({
      where: { advisorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return demos
  }

  private async generateContent(preferences: any, businessName: string) {
    // Pick random topic and content type for demo
    const topic = preferences.topics[Math.floor(Math.random() * preferences.topics.length)]
    const contentType = preferences.contentTypes[Math.floor(Math.random() * preferences.contentTypes.length)]

    const content = await this.openAI.generateContent({
      topic,
      contentType,
      languages: preferences.languages,
      businessName,
    })

    return {
      ...content,
      category: contentType,
      topic_family: topic,
    }
  }

  private async validateContent(content: any) {
    const validationResult = await this.validator.validateContent({
      content_english: content.content_english,
      content_hindi: content.content_hindi,
      content_gujarati: content.content_gujarati,
      category: content.category,
      topic: content.topic_family,
    })

    return validationResult
  }
}