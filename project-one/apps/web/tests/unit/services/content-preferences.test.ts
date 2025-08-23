import { ContentPreferencesService } from '@/lib/services/content-preferences'
import { prisma } from '@/lib/utils/database'

// Mock the database
jest.mock('@/lib/utils/database', () => ({
  prisma: {
    contentPreferences: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    advisors: {
      findUnique: jest.fn(),
    },
    _reset: jest.fn(),
  },
}))

describe('ContentPreferencesService', () => {
  let service: ContentPreferencesService

  beforeEach(() => {
    jest.clearAllMocks()
    service = ContentPreferencesService
  })

  describe('setPreferences', () => {
    it('should create content preferences for basic tier with 1 language limit', async () => {
      const advisorId = 'advisor-123'
      const preferences = {
        languages: ['EN'],
        contentTypes: ['educational', 'market-update'],
        frequency: 'daily',
        topics: ['mutual-funds', 'equity'],
        deliveryTime: '09:00',
      }

      const mockAdvisor = {
        id: advisorId,
        subscription_tier: 'basic',
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)
      ;(prisma.contentPreferences.upsert as jest.Mock).mockResolvedValue({
        id: 'pref-123',
        advisorId,
        ...preferences,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await service.setPreferences(advisorId, preferences)

      expect(result).toMatchObject({
        advisorId,
        languages: ['EN'],
        contentTypes: ['educational', 'market-update'],
      })
      expect(prisma.contentPreferences.upsert).toHaveBeenCalledWith({
        where: { advisorId },
        create: expect.objectContaining({
          advisorId,
          languages: ['EN'],
        }),
        update: expect.objectContaining({
          languages: ['EN'],
        }),
      })
    })

    it('should enforce 2 language limit for standard tier', async () => {
      const advisorId = 'advisor-456'
      const preferences = {
        languages: ['EN', 'HI', 'GU'], // Trying to set 3 languages
        contentTypes: ['educational'],
        frequency: 'daily',
        topics: ['mutual-funds'],
        deliveryTime: '09:00',
      }

      const mockAdvisor = {
        id: advisorId,
        subscription_tier: 'standard',
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)

      await expect(
        service.setPreferences(advisorId, preferences)
      ).rejects.toThrow('Standard tier allows maximum 2 languages')
    })

    it('should allow 3 languages for pro tier', async () => {
      const advisorId = 'advisor-789'
      const preferences = {
        languages: ['EN', 'HI', 'GU'],
        contentTypes: ['educational', 'market-update', 'regulatory'],
        frequency: 'twice-daily',
        topics: ['mutual-funds', 'equity', 'insurance'],
        deliveryTime: '09:00,18:00',
      }

      const mockAdvisor = {
        id: advisorId,
        subscription_tier: 'pro',
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)
      ;(prisma.contentPreferences.upsert as jest.Mock).mockResolvedValue({
        id: 'pref-789',
        advisorId,
        ...preferences,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await service.setPreferences(advisorId, preferences)

      expect(result).toMatchObject({
        advisorId,
        languages: ['EN', 'HI', 'GU'],
      })
    })

    it('should validate required fields', async () => {
      const advisorId = 'advisor-123'
      const invalidPreferences = {
        languages: [], // Empty languages
        contentTypes: ['educational'],
        frequency: 'daily',
        topics: ['mutual-funds'],
        deliveryTime: '09:00',
      }

      await expect(
        service.setPreferences(advisorId, invalidPreferences)
      ).rejects.toThrow('At least one language must be selected')
    })

    it('should validate supported languages', async () => {
      const advisorId = 'advisor-123'
      const preferences = {
        languages: ['EN', 'FR'], // FR is not supported
        contentTypes: ['educational'],
        frequency: 'daily',
        topics: ['mutual-funds'],
        deliveryTime: '09:00',
      }

      const mockAdvisor = {
        id: advisorId,
        subscription_tier: 'standard',
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)

      await expect(
        service.setPreferences(advisorId, preferences)
      ).rejects.toThrow('Unsupported language: FR')
    })

    it('should validate content types', async () => {
      const advisorId = 'advisor-123'
      const preferences = {
        languages: ['EN'],
        contentTypes: ['invalid-type'],
        frequency: 'daily',
        topics: ['mutual-funds'],
        deliveryTime: '09:00',
      }

      const mockAdvisor = {
        id: advisorId,
        subscription_tier: 'basic',
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)

      await expect(
        service.setPreferences(advisorId, preferences)
      ).rejects.toThrow('Invalid content type: invalid-type')
    })

    it('should validate frequency options', async () => {
      const advisorId = 'advisor-123'
      const preferences = {
        languages: ['EN'],
        contentTypes: ['educational'],
        frequency: 'hourly', // Invalid frequency
        topics: ['mutual-funds'],
        deliveryTime: '09:00',
      }

      const mockAdvisor = {
        id: advisorId,
        subscription_tier: 'basic',
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)

      await expect(
        service.setPreferences(advisorId, preferences)
      ).rejects.toThrow('Invalid frequency: hourly')
    })
  })

  describe('getPreferences', () => {
    it('should retrieve existing preferences', async () => {
      const advisorId = 'advisor-123'
      const mockPreferences = {
        id: 'pref-123',
        advisorId,
        languages: ['EN', 'HI'],
        contentTypes: ['educational', 'market-update'],
        frequency: 'daily',
        topics: ['mutual-funds', 'equity'],
        deliveryTime: '09:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.contentPreferences.findUnique as jest.Mock).mockResolvedValue(mockPreferences as any)

      const result = await service.getPreferences(advisorId)

      expect(result).toEqual(mockPreferences)
      expect(prisma.contentPreferences.findUnique).toHaveBeenCalledWith({
        where: { advisorId },
      })
    })

    it('should return null if preferences not found', async () => {
      const advisorId = 'advisor-456'

      ;(prisma.contentPreferences.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await service.getPreferences(advisorId)

      expect(result).toBeNull()
    })
  })

  describe('getTierLimits', () => {
    it('should return correct limits for basic tier', () => {
      const limits = service.getTierLimits('basic')

      expect(limits).toEqual({
        maxLanguages: 1,
        maxContentTypes: 2,
        maxTopics: 3,
        allowedFrequencies: ['daily', 'weekly'],
      })
    })

    it('should return correct limits for standard tier', () => {
      const limits = service.getTierLimits('standard')

      expect(limits).toEqual({
        maxLanguages: 2,
        maxContentTypes: 3,
        maxTopics: 5,
        allowedFrequencies: ['daily', 'twice-daily', 'weekly'],
      })
    })

    it('should return correct limits for pro tier', () => {
      const limits = service.getTierLimits('pro')

      expect(limits).toEqual({
        maxLanguages: 3,
        maxContentTypes: 5,
        maxTopics: 10,
        allowedFrequencies: ['daily', 'twice-daily', 'thrice-daily', 'weekly', 'custom'],
      })
    })
  })
})