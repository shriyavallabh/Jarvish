import { prisma } from '@/lib/utils/database'
import { EmailService } from '@/lib/services/email'

export interface CompletionVerification {
  isComplete: boolean
  missingSteps: string[]
  completionPercentage: number
}

export interface CompletionResult {
  success: boolean
  advisor: any
  message: string
  warnings?: string[]
}

export interface CompletionStatus {
  isComplete: boolean
  isActive: boolean
  completedAt?: Date | null
  timeToComplete?: number // in days
  completedSteps: string[]
  completionPercentage: number
}

const REQUIRED_STEPS = [
  'registration',
  'email-verification',
  'mobile-verification',
  'preferences',
  'demo-content',
  'payment',
]

export class OnboardingCompletionService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  async verifyCompletion(advisorId: string): Promise<CompletionVerification> {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { advisorId },
    })

    if (!progress) {
      return {
        isComplete: false,
        missingSteps: [...REQUIRED_STEPS, 'completion'],
        completionPercentage: 0,
      }
    }

    // Check which required steps are missing
    const missingSteps = [...REQUIRED_STEPS, 'completion'].filter(
      step => !progress.completedSteps.includes(step)
    )

    return {
      isComplete: missingSteps.length === 0,
      missingSteps,
      completionPercentage: progress.completionPercentage,
    }
  }

  async completeOnboarding(advisorId: string): Promise<CompletionResult> {
    // Verify advisor exists
    const advisor = await prisma.advisors.findUnique({
      where: { id: advisorId },
    })

    if (!advisor) {
      throw new Error('Advisor not found')
    }

    // Verify all required steps are completed
    const verification = await this.verifyCompletion(advisorId)
    
    // Check if only 'completion' step is missing (which is expected)
    const onlyCompletionMissing = 
      verification.missingSteps.length === 1 && 
      verification.missingSteps[0] === 'completion'

    if (!onlyCompletionMissing && verification.missingSteps.length > 0) {
      const missingStepsExceptCompletion = verification.missingSteps.filter(s => s !== 'completion')
      throw new Error(
        `Cannot complete onboarding. Missing steps: ${missingStepsExceptCompletion.join(', ')}`
      )
    }

    const warnings: string[] = []

    try {
      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Update progress to mark as complete
        const updatedProgress = await tx.onboardingProgress.update({
          where: { advisorId },
          data: {
            currentStep: 'completion',
            completedSteps: {
              push: 'completion',
            },
            completionPercentage: 100,
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        })

        // Activate advisor account
        const activatedAdvisor = await tx.advisors.update({
          where: { id: advisorId },
          data: {
            isActive: true,
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            lastActive: new Date(),
          },
        })

        // Create welcome notification
        await tx.notifications.create({
          data: {
            advisorId,
            type: 'onboarding_complete',
            title: 'Welcome to JARVISH!',
            message: 'Your onboarding is complete. Start creating compliant content now!',
            priority: 'high',
            read: false,
            createdAt: new Date(),
          },
        })

        // Create audit log
        await tx.auditLog.create({
          data: {
            action: 'ONBOARDING_COMPLETED',
            advisorId,
            success: true,
            metadata: {
              completedSteps: updatedProgress.completedSteps,
              tier: activatedAdvisor.subscription_tier,
            },
            createdAt: new Date(),
          },
        })

        return activatedAdvisor
      })

      // Send welcome email (non-blocking, handle failures gracefully)
      try {
        await this.emailService.sendWelcomeEmail({
          email: advisor.email,
          name: `${advisor.firstName} ${advisor.lastName}`,
          businessName: advisor.business_name || advisor.businessType,
          tier: advisor.subscription_tier || 'basic',
        })
      } catch (emailError) {
        warnings.push('Welcome email could not be sent')
        
        // Log email failure
        await prisma.auditLog.create({
          data: {
            action: 'WELCOME_EMAIL_FAILED',
            advisorId,
            success: false,
            error: emailError.message,
            createdAt: new Date(),
          },
        })
      }

      return {
        success: true,
        advisor: result,
        message: 'Onboarding completed successfully',
        ...(warnings.length > 0 && { warnings }),
      }
    } catch (error) {
      // Log failure
      await prisma.auditLog.create({
        data: {
          action: 'ONBOARDING_COMPLETION_FAILED',
          advisorId,
          success: false,
          error: error.message,
          createdAt: new Date(),
        },
      })

      throw error
    }
  }

  async sendWelcomeNotification(advisorId: string, advisorData: any): Promise<void> {
    // Create in-app notification
    await prisma.notifications.create({
      data: {
        advisorId,
        type: 'onboarding_complete',
        title: 'Welcome to JARVISH!',
        message: `Congratulations! Your account is now active. You can start creating SEBI-compliant content for your clients.`,
        priority: 'high',
        read: false,
        createdAt: new Date(),
      },
    })

    // Send email notification
    try {
      await this.emailService.sendOnboardingCompleteEmail({
        email: advisorData.email,
        name: `${advisorData.firstName} ${advisorData.lastName}`,
        businessName: advisorData.business_name,
        tier: advisorData.subscription_tier,
      })
    } catch (error) {
      console.error('Failed to send onboarding complete email:', error)
      // Don't throw - email failure shouldn't break the flow
    }
  }

  async getCompletionStatus(advisorId: string): Promise<CompletionStatus> {
    const advisor = await prisma.advisors.findUnique({
      where: { id: advisorId },
    })

    const progress = await prisma.onboardingProgress.findUnique({
      where: { advisorId },
    })

    if (!advisor || !progress) {
      return {
        isComplete: false,
        isActive: false,
        completedSteps: [],
        completionPercentage: 0,
      }
    }

    let timeToComplete: number | undefined
    if (progress.startedAt && progress.completedAt) {
      const diffMs = progress.completedAt.getTime() - progress.startedAt.getTime()
      timeToComplete = Math.floor(diffMs / (1000 * 60 * 60 * 24)) // Convert to days
    }

    return {
      isComplete: advisor.onboardingCompleted || false,
      isActive: advisor.isActive || false,
      completedAt: advisor.onboardingCompletedAt || progress.completedAt,
      timeToComplete,
      completedSteps: progress.completedSteps,
      completionPercentage: progress.completionPercentage,
    }
  }

  async resetOnboarding(advisorId: string): Promise<void> {
    // This method is for testing/admin purposes only
    await prisma.$transaction(async (tx) => {
      // Reset advisor status
      await tx.advisors.update({
        where: { id: advisorId },
        data: {
          isActive: false,
          onboardingCompleted: false,
          onboardingCompletedAt: null,
        },
      })

      // Delete progress record
      await tx.onboardingProgress.delete({
        where: { advisorId },
      }).catch(() => {
        // Ignore if doesn't exist
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'ONBOARDING_RESET',
          advisorId,
          success: true,
          createdAt: new Date(),
        },
      })
    })
  }
}