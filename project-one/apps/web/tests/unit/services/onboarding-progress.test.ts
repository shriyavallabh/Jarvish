import { OnboardingProgressService } from '@/lib/services/onboarding-progress'
import { prisma } from '@/lib/utils/database'

// Mock the database
jest.mock('@/lib/utils/database', () => ({
  prisma: {
    onboardingProgress: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    advisors: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    _reset: jest.fn(),
  },
}))

describe('OnboardingProgressService', () => {
  let service: OnboardingProgressService

  beforeEach(() => {
    jest.clearAllMocks()
    service = OnboardingProgressService
  })

  describe('initializeProgress', () => {
    it('should create initial progress record for new advisor', async () => {
      const advisorId = 'advisor-123'

      ;(prisma.onboardingProgress.create as jest.Mock).mockResolvedValue({
        id: 'progress-123',
        advisorId,
        currentStep: 'registration',
        completedSteps: ['registration'],
        completionPercentage: 14, // 1 of 7 steps
        startedAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await service.initializeProgress(advisorId)

      expect(result).toMatchObject({
        advisorId,
        currentStep: 'registration',
        completedSteps: ['registration'],
        completionPercentage: 14,
      })

      expect(prisma.onboardingProgress.create).toHaveBeenCalledWith({
        data: {
          advisorId,
          currentStep: 'registration',
          completedSteps: ['registration'],
          completionPercentage: 14,
          startedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      })
    })
  })

  describe('updateProgress', () => {
    it('should update progress when a step is completed', async () => {
      const advisorId = 'advisor-123'
      const existingProgress = {
        id: 'progress-123',
        advisorId,
        currentStep: 'registration',
        completedSteps: ['registration'],
        completionPercentage: 14,
        startedAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(existingProgress as any)
      ;(prisma.onboardingProgress.update as jest.Mock).mockResolvedValue({
        ...existingProgress,
        currentStep: 'email-verification',
        completedSteps: ['registration', 'email-verification'],
        completionPercentage: 29, // 2 of 7 steps
        updatedAt: new Date(),
      } as any)

      const result = await service.updateProgress(advisorId, 'email-verification')

      expect(result).toMatchObject({
        currentStep: 'email-verification',
        completedSteps: ['registration', 'email-verification'],
        completionPercentage: 29,
      })

      expect(prisma.onboardingProgress.update).toHaveBeenCalledWith({
        where: { advisorId },
        data: {
          currentStep: 'email-verification',
          completedSteps: ['registration', 'email-verification'],
          completionPercentage: 29,
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should not duplicate completed steps', async () => {
      const advisorId = 'advisor-456'
      const existingProgress = {
        id: 'progress-456',
        advisorId,
        currentStep: 'email-verification',
        completedSteps: ['registration', 'email-verification'],
        completionPercentage: 29,
      }

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(existingProgress as any)
      ;(prisma.onboardingProgress.update as jest.Mock).mockResolvedValue(existingProgress as any)

      const result = await service.updateProgress(advisorId, 'email-verification')

      expect(result.completedSteps).toEqual(['registration', 'email-verification'])
      expect(result.completionPercentage).toBe(29)
    })

    it('should handle invalid step names', async () => {
      const advisorId = 'advisor-789'

      await expect(
        service.updateProgress(advisorId, 'invalid-step')
      ).rejects.toThrow('Invalid onboarding step: invalid-step')
    })
  })

  describe('getProgress', () => {
    it('should retrieve current progress', async () => {
      const advisorId = 'advisor-123'
      const mockProgress = {
        id: 'progress-123',
        advisorId,
        currentStep: 'preferences',
        completedSteps: ['registration', 'email-verification', 'mobile-verification', 'preferences'],
        completionPercentage: 57, // 4 of 7 steps
        startedAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)

      const result = await service.getProgress(advisorId)

      expect(result).toEqual(mockProgress)
      expect(prisma.onboardingProgress.findUnique).toHaveBeenCalledWith({
        where: { advisorId },
      })
    })

    it('should return null if no progress exists', async () => {
      const advisorId = 'advisor-new'

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await service.getProgress(advisorId)

      expect(result).toBeNull()
    })
  })

  describe('calculateCompletionPercentage', () => {
    it('should calculate correct percentage for each step count', () => {
      const testCases = [
        { steps: 1, expected: 14 }, // 1/7 = 14%
        { steps: 2, expected: 29 }, // 2/7 = 29%
        { steps: 3, expected: 43 }, // 3/7 = 43%
        { steps: 4, expected: 57 }, // 4/7 = 57%
        { steps: 5, expected: 71 }, // 5/7 = 71%
        { steps: 6, expected: 86 }, // 6/7 = 86%
        { steps: 7, expected: 100 }, // 7/7 = 100%
      ]

      testCases.forEach(({ steps, expected }) => {
        const percentage = service.calculateCompletionPercentage(steps)
        expect(percentage).toBe(expected)
      })
    })
  })

  describe('getOnboardingSteps', () => {
    it('should return all onboarding steps in correct order', () => {
      const steps = service.getOnboardingSteps()

      expect(steps).toEqual([
        'registration',
        'email-verification',
        'mobile-verification',
        'preferences',
        'demo-content',
        'payment',
        'completion',
      ])
    })
  })

  describe('isStepCompleted', () => {
    it('should check if a specific step is completed', async () => {
      const advisorId = 'advisor-123'
      const mockProgress = {
        completedSteps: ['registration', 'email-verification', 'mobile-verification'],
      }

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)

      const isEmailVerified = await service.isStepCompleted(advisorId, 'email-verification')
      const isPaymentDone = await service.isStepCompleted(advisorId, 'payment')

      expect(isEmailVerified).toBe(true)
      expect(isPaymentDone).toBe(false)
    })

    it('should return false if no progress exists', async () => {
      const advisorId = 'advisor-new'

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await service.isStepCompleted(advisorId, 'registration')

      expect(result).toBe(false)
    })
  })

  describe('getNextStep', () => {
    it('should return the next incomplete step', async () => {
      const advisorId = 'advisor-123'
      const mockProgress = {
        completedSteps: ['registration', 'email-verification'],
      }

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)

      const nextStep = await service.getNextStep(advisorId)

      expect(nextStep).toBe('mobile-verification')
    })

    it('should return null if all steps are completed', async () => {
      const advisorId = 'advisor-done'
      const mockProgress = {
        completedSteps: [
          'registration',
          'email-verification',
          'mobile-verification',
          'preferences',
          'demo-content',
          'payment',
          'completion',
        ],
      }

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)

      const nextStep = await service.getNextStep(advisorId)

      expect(nextStep).toBeNull()
    })

    it('should return first step if no progress exists', async () => {
      const advisorId = 'advisor-new'

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(null)

      const nextStep = await service.getNextStep(advisorId)

      expect(nextStep).toBe('registration')
    })
  })
})