import { prisma } from '@/lib/utils/database'

export interface OnboardingProgress {
  id: string
  advisorId: string
  currentStep: string
  completedSteps: string[]
  completionPercentage: number
  startedAt: Date
  updatedAt: Date
  completedAt?: Date | null
}

const ONBOARDING_STEPS = [
  'registration',
  'email-verification',
  'mobile-verification',
  'preferences',
  'demo-content',
  'payment',
  'completion',
]

export class OnboardingProgressService {
  async initializeProgress(advisorId: string): Promise<OnboardingProgress> {
    const progress = await prisma.onboardingProgress.create({
      data: {
        advisorId,
        currentStep: 'registration',
        completedSteps: ['registration'],
        completionPercentage: this.calculateCompletionPercentage(1),
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return progress
  }

  async updateProgress(advisorId: string, completedStep: string): Promise<OnboardingProgress> {
    // Validate step
    if (!ONBOARDING_STEPS.includes(completedStep)) {
      throw new Error(`Invalid onboarding step: ${completedStep}`)
    }

    // Get current progress
    const currentProgress = await prisma.onboardingProgress.findUnique({
      where: { advisorId },
    })

    if (!currentProgress) {
      // Initialize if not exists
      return await this.initializeProgress(advisorId)
    }

    // Add step if not already completed
    const completedSteps = currentProgress.completedSteps.includes(completedStep)
      ? currentProgress.completedSteps
      : [...currentProgress.completedSteps, completedStep]

    // Calculate new percentage
    const completionPercentage = this.calculateCompletionPercentage(completedSteps.length)

    // Determine if completed
    const isComplete = completedSteps.length === ONBOARDING_STEPS.length
    const completedAt = isComplete ? new Date() : null

    // Update progress
    const updatedProgress = await prisma.onboardingProgress.update({
      where: { advisorId },
      data: {
        currentStep: completedStep,
        completedSteps,
        completionPercentage,
        updatedAt: new Date(),
        ...(completedAt && { completedAt }),
      },
    })

    return updatedProgress
  }

  async getProgress(advisorId: string): Promise<OnboardingProgress | null> {
    return await prisma.onboardingProgress.findUnique({
      where: { advisorId },
    })
  }

  calculateCompletionPercentage(completedStepsCount: number): number {
    return Math.round((completedStepsCount / ONBOARDING_STEPS.length) * 100)
  }

  getOnboardingSteps(): string[] {
    return ONBOARDING_STEPS
  }

  async isStepCompleted(advisorId: string, step: string): Promise<boolean> {
    const progress = await this.getProgress(advisorId)
    if (!progress) return false
    return progress.completedSteps.includes(step)
  }

  async getNextStep(advisorId: string): Promise<string | null> {
    const progress = await this.getProgress(advisorId)
    
    if (!progress) {
      return ONBOARDING_STEPS[0] // Return first step
    }

    // Find first incomplete step
    for (const step of ONBOARDING_STEPS) {
      if (!progress.completedSteps.includes(step)) {
        return step
      }
    }

    return null // All steps completed
  }

  async getStepDetails(step: string): Promise<{
    name: string
    description: string
    required: boolean
    estimatedTime: string
  }> {
    const stepDetails = {
      'registration': {
        name: 'Registration',
        description: 'Create your JARVISH account with EUIN verification',
        required: true,
        estimatedTime: '2 minutes',
      },
      'email-verification': {
        name: 'Email Verification',
        description: 'Verify your email address',
        required: true,
        estimatedTime: '1 minute',
      },
      'mobile-verification': {
        name: 'Mobile Verification',
        description: 'Verify your mobile number for WhatsApp integration',
        required: true,
        estimatedTime: '1 minute',
      },
      'preferences': {
        name: 'Content Preferences',
        description: 'Set your language, topics, and delivery preferences',
        required: true,
        estimatedTime: '3 minutes',
      },
      'demo-content': {
        name: 'Demo Content',
        description: 'Preview AI-generated compliant content',
        required: false,
        estimatedTime: '2 minutes',
      },
      'payment': {
        name: 'Subscription',
        description: 'Choose your plan and complete payment',
        required: true,
        estimatedTime: '3 minutes',
      },
      'completion': {
        name: 'Complete Setup',
        description: 'Finalize your account setup',
        required: true,
        estimatedTime: '1 minute',
      },
    }

    return stepDetails[step] || {
      name: step,
      description: '',
      required: false,
      estimatedTime: 'Unknown',
    }
  }
}