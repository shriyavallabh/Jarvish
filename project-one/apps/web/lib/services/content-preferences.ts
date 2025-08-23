import { prisma } from '@/lib/utils/database'

export interface ContentPreferences {
  languages: string[]
  contentTypes: string[]
  frequency: string
  topics: string[]
  deliveryTime: string
}

export interface TierLimits {
  maxLanguages: number
  maxContentTypes: number
  maxTopics: number
  allowedFrequencies: string[]
}

const SUPPORTED_LANGUAGES = ['EN', 'HI', 'GU', 'MR', 'TA', 'TE', 'BN', 'KN', 'ML', 'PA']
const VALID_CONTENT_TYPES = ['educational', 'market-update', 'regulatory', 'product-spotlight', 'client-education']
const VALID_FREQUENCIES = ['daily', 'twice-daily', 'thrice-daily', 'weekly', 'custom']
const VALID_TOPICS = [
  'mutual-funds',
  'equity',
  'debt',
  'insurance',
  'retirement',
  'tax-planning',
  'wealth-management',
  'nps',
  'gold',
  'real-estate',
]

export class ContentPreferencesService {
  async setPreferences(advisorId: string, preferences: ContentPreferences) {
    // Validate advisor exists and get tier
    const advisor = await prisma.advisors.findUnique({
      where: { id: advisorId },
    })

    if (!advisor) {
      throw new Error('Advisor not found')
    }

    const tier = advisor.subscription_tier || 'basic'

    // Validate preferences
    this.validatePreferences(preferences, tier)

    // Upsert preferences
    const result = await prisma.contentPreferences.upsert({
      where: { advisorId },
      create: {
        advisorId,
        languages: preferences.languages,
        contentTypes: preferences.contentTypes,
        frequency: preferences.frequency,
        topics: preferences.topics,
        deliveryTime: preferences.deliveryTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        languages: preferences.languages,
        contentTypes: preferences.contentTypes,
        frequency: preferences.frequency,
        topics: preferences.topics,
        deliveryTime: preferences.deliveryTime,
        updatedAt: new Date(),
      },
    })

    return result
  }

  async getPreferences(advisorId: string) {
    return await prisma.contentPreferences.findUnique({
      where: { advisorId },
    })
  }

  getTierLimits(tier: string): TierLimits {
    switch (tier) {
      case 'basic':
        return {
          maxLanguages: 1,
          maxContentTypes: 2,
          maxTopics: 3,
          allowedFrequencies: ['daily', 'weekly'],
        }
      case 'standard':
        return {
          maxLanguages: 2,
          maxContentTypes: 3,
          maxTopics: 5,
          allowedFrequencies: ['daily', 'twice-daily', 'weekly'],
        }
      case 'pro':
        return {
          maxLanguages: 3,
          maxContentTypes: 5,
          maxTopics: 10,
          allowedFrequencies: ['daily', 'twice-daily', 'thrice-daily', 'weekly', 'custom'],
        }
      default:
        return this.getTierLimits('basic')
    }
  }

  private validatePreferences(preferences: ContentPreferences, tier: string) {
    const limits = this.getTierLimits(tier)

    // Validate languages
    if (!preferences.languages || preferences.languages.length === 0) {
      throw new Error('At least one language must be selected')
    }

    if (preferences.languages.length > limits.maxLanguages) {
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
      throw new Error(`${tierName} tier allows maximum ${limits.maxLanguages} languages`)
    }

    // Check supported languages
    for (const lang of preferences.languages) {
      if (!SUPPORTED_LANGUAGES.includes(lang)) {
        throw new Error(`Unsupported language: ${lang}`)
      }
    }

    // Validate content types
    if (!preferences.contentTypes || preferences.contentTypes.length === 0) {
      throw new Error('At least one content type must be selected')
    }

    if (preferences.contentTypes.length > limits.maxContentTypes) {
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
      throw new Error(`${tierName} tier allows maximum ${limits.maxContentTypes} content types`)
    }

    for (const type of preferences.contentTypes) {
      if (!VALID_CONTENT_TYPES.includes(type)) {
        throw new Error(`Invalid content type: ${type}`)
      }
    }

    // Validate frequency
    if (!limits.allowedFrequencies.includes(preferences.frequency)) {
      throw new Error(`Invalid frequency: ${preferences.frequency}`)
    }

    // Validate topics
    if (!preferences.topics || preferences.topics.length === 0) {
      throw new Error('At least one topic must be selected')
    }

    if (preferences.topics.length > limits.maxTopics) {
      const tierName = tier.charAt(0).toUpperCase() + tier.slice(1)
      throw new Error(`${tierName} tier allows maximum ${limits.maxTopics} topics`)
    }

    for (const topic of preferences.topics) {
      if (!VALID_TOPICS.includes(topic)) {
        throw new Error(`Invalid topic: ${topic}`)
      }
    }

    // Validate delivery time format (HH:MM or HH:MM,HH:MM for multiple times)
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](,([0-1]?[0-9]|2[0-3]):[0-5][0-9])*$/
    if (!timePattern.test(preferences.deliveryTime)) {
      throw new Error('Invalid delivery time format. Use HH:MM format')
    }
  }
}