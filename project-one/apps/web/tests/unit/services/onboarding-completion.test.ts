import { OnboardingCompletionService } from '@/lib/services/onboarding-completion'
import { prisma } from '@/lib/utils/database'

// Mock email service
jest.mock('@/lib/services/email', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendWelcomeEmail: jest.fn(),
    sendOnboardingCompleteEmail: jest.fn(),
  })),
}))

// Mock the database
jest.mock('@/lib/utils/database', () => ({
  prisma: {
    onboardingProgress: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    advisors: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notifications: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    _reset: jest.fn(),
  },
}))

describe('OnboardingCompletionService', () => {
  let service: OnboardingCompletionService
  let mockEmailService: any

  beforeEach(() => {
    jest.clearAllMocks()
    service = OnboardingCompletionService
    mockEmailService = (service as any).emailService
  })

  describe('verifyCompletion', () => {
    it('should verify all required steps are completed', async () => {
      const advisorId = 'advisor-123'
      const mockProgress = {
        id: 'progress-123',
        advisorId,
        completedSteps: [
          'registration',
          'email-verification',
          'mobile-verification',
          'preferences',
          'demo-content',
          'payment',
        ],
        completionPercentage: 86,
      }

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)

      const result = await service.verifyCompletion(advisorId)

      expect(result).toEqual({
        isComplete: false,
        missingSteps: ['completion'],
        completionPercentage: 86,
      })
    })

    it('should return true when all steps are completed', async () => {
      const advisorId = 'advisor-456'
      const mockProgress = {
        id: 'progress-456',
        advisorId,
        completedSteps: [
          'registration',
          'email-verification',
          'mobile-verification',
          'preferences',
          'demo-content',
          'payment',
          'completion',
        ],
        completionPercentage: 100,
      }

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)

      const result = await service.verifyCompletion(advisorId)

      expect(result).toEqual({
        isComplete: true,
        missingSteps: [],
        completionPercentage: 100,
      })
    })

    it('should handle missing progress record', async () => {
      const advisorId = 'advisor-new'

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await service.verifyCompletion(advisorId)

      expect(result).toEqual({
        isComplete: false,
        missingSteps: [
          'registration',
          'email-verification',
          'mobile-verification',
          'preferences',
          'demo-content',
          'payment',
          'completion',
        ],
        completionPercentage: 0,
      })
    })
  })

  describe('completeOnboarding', () => {
    it('should complete onboarding and activate advisor account', async () => {
      const advisorId = 'advisor-123'
      const mockAdvisor = {
        id: advisorId,
        email: 'advisor@example.com',
        firstName: 'John',
        lastName: 'Doe',
        business_name: 'Test Advisory',
        subscription_tier: 'standard',
      }

      const mockProgress = {
        id: 'progress-123',
        advisorId,
        completedSteps: [
          'registration',
          'email-verification',
          'mobile-verification',
          'preferences',
          'demo-content',
          'payment',
        ],
        completionPercentage: 86,
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)
      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)
      
      // Mock transaction
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        return fn(prisma)
      })

      ;(prisma.onboardingProgress.update as jest.Mock).mockResolvedValue({
        ...mockProgress,
        completedSteps: [...mockProgress.completedSteps, 'completion'],
        completionPercentage: 100,
        completedAt: new Date(),
      } as any)

      ;(prisma.advisors.update as jest.Mock).mockResolvedValue({
        ...mockAdvisor,
        isActive: true,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      } as any)

      ;(prisma.notifications.create as jest.Mock).mockResolvedValue({
        id: 'notif-123',
        advisorId,
        type: 'onboarding_complete',
        title: 'Welcome to JARVISH!',
        message: 'Your onboarding is complete. Start creating compliant content now!',
        createdAt: new Date(),
      } as any)

      mockEmailService.sendWelcomeEmail.mockResolvedValue(true)

      const result = await service.completeOnboarding(advisorId)

      expect(result).toMatchObject({
        success: true,
        advisor: expect.objectContaining({
          isActive: true,
          onboardingCompleted: true,
        }),
        message: 'Onboarding completed successfully',
      })

      // Verify transaction was called
      expect(prisma.$transaction).toHaveBeenCalled()

      // Verify progress was updated
      expect(prisma.onboardingProgress.update).toHaveBeenCalledWith({
        where: { advisorId },
        data: expect.objectContaining({
          completedSteps: expect.objectContaining({
            push: 'completion',
          }),
          completionPercentage: 100,
          currentStep: 'completion',
          completedAt: expect.any(Date),
        }),
      })

      // Verify advisor was activated
      expect(prisma.advisors.update).toHaveBeenCalledWith({
        where: { id: advisorId },
        data: {
          isActive: true,
          onboardingCompleted: true,
          onboardingCompletedAt: expect.any(Date),
          lastActive: expect.any(Date),
        },
      })

      // Verify notification was created
      expect(prisma.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          advisorId,
          type: 'onboarding_complete',
        }),
      })

      // Verify welcome email was sent
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith({
        email: 'advisor@example.com',
        name: 'John Doe',
        businessName: 'Test Advisory',
        tier: 'standard',
      })

      // Verify audit log was created
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ONBOARDING_COMPLETED',
          advisorId,
          success: true,
        }),
      })
    })

    it('should prevent completion if steps are missing', async () => {
      const advisorId = 'advisor-456'
      const mockProgress = {
        id: 'progress-456',
        advisorId,
        completedSteps: ['registration', 'email-verification'],
        completionPercentage: 29,
      }

      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)

      await expect(
        service.completeOnboarding(advisorId)
      ).rejects.toThrow(
        'Cannot complete onboarding. Missing steps: mobile-verification, preferences, demo-content, payment'
      )

      // Verify no updates were made
      expect(prisma.advisors.update).not.toHaveBeenCalled()
      expect(prisma.notifications.create).not.toHaveBeenCalled()
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled()
    })

    it('should handle advisor not found', async () => {
      const advisorId = 'advisor-not-found'

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        service.completeOnboarding(advisorId)
      ).rejects.toThrow('Advisor not found')
    })

    it('should handle email sending failure gracefully', async () => {
      const advisorId = 'advisor-789'
      const mockAdvisor = {
        id: advisorId,
        email: 'advisor@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        business_name: 'Smith Advisory',
        subscription_tier: 'pro',
      }

      const mockProgress = {
        id: 'progress-789',
        advisorId,
        completedSteps: [
          'registration',
          'email-verification',
          'mobile-verification',
          'preferences',
          'demo-content',
          'payment',
        ],
        completionPercentage: 86,
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)
      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma))
      ;(prisma.onboardingProgress.update as jest.Mock).mockResolvedValue({} as any)
      ;(prisma.advisors.update as jest.Mock).mockResolvedValue({ ...mockAdvisor, isActive: true } as any)
      ;(prisma.notifications.create as jest.Mock).mockResolvedValue({} as any)
      
      // Email fails but should not break completion
      mockEmailService.sendWelcomeEmail.mockRejectedValue(new Error('Email service down'))

      const result = await service.completeOnboarding(advisorId)

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('Welcome email could not be sent')

      // Verify audit log captured email failure
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'WELCOME_EMAIL_FAILED',
          advisorId,
          success: false,
          error: 'Email service down',
        }),
      })
    })
  })

  describe('sendWelcomeNotification', () => {
    it('should send in-app notification and email', async () => {
      const advisorId = 'advisor-123'
      const advisorData = {
        email: 'advisor@example.com',
        firstName: 'John',
        lastName: 'Doe',
        business_name: 'Test Advisory',
        subscription_tier: 'basic',
      }

      ;(prisma.notifications.create as jest.Mock).mockResolvedValue({
        id: 'notif-123',
        advisorId,
        type: 'onboarding_complete',
        createdAt: new Date(),
      } as any)

      mockEmailService.sendOnboardingCompleteEmail.mockResolvedValue(true)

      await service.sendWelcomeNotification(advisorId, advisorData)

      expect(prisma.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          advisorId,
          type: 'onboarding_complete',
          title: 'Welcome to JARVISH!',
        }),
      })

      expect(mockEmailService.sendOnboardingCompleteEmail).toHaveBeenCalledWith({
        email: 'advisor@example.com',
        name: 'John Doe',
        businessName: 'Test Advisory',
        tier: 'basic',
      })
    })
  })

  describe('getCompletionStatus', () => {
    it('should return detailed completion status', async () => {
      const advisorId = 'advisor-123'
      const mockAdvisor = {
        id: advisorId,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date('2024-01-15'),
        isActive: true,
      }

      const mockProgress = {
        id: 'progress-123',
        advisorId,
        completedSteps: [
          'registration',
          'email-verification',
          'mobile-verification',
          'preferences',
          'demo-content',
          'payment',
          'completion',
        ],
        completionPercentage: 100,
        startedAt: new Date('2024-01-10'),
        completedAt: new Date('2024-01-15'),
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)
      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)

      const result = await service.getCompletionStatus(advisorId)

      expect(result).toEqual({
        isComplete: true,
        isActive: true,
        completedAt: new Date('2024-01-15'),
        timeToComplete: 5, // 5 days from start to completion
        completedSteps: mockProgress.completedSteps,
        completionPercentage: 100,
      })
    })

    it('should calculate time to complete in days', async () => {
      const advisorId = 'advisor-456'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-10')

      const mockAdvisor = {
        id: advisorId,
        onboardingCompleted: true,
        onboardingCompletedAt: endDate,
        isActive: true,
      }

      const mockProgress = {
        id: 'progress-456',
        advisorId,
        completedSteps: Array(7).fill('step'),
        completionPercentage: 100,
        startedAt: startDate,
        completedAt: endDate,
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)
      ;(prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(mockProgress as any)

      const result = await service.getCompletionStatus(advisorId)

      expect(result.timeToComplete).toBe(9) // 9 days difference
    })
  })
})