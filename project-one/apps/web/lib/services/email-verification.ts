import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { database } from '@/lib/utils/database'
import { sendEmail } from '@/lib/services/email'

interface CreateTokenResult {
  token: string
  expiresAt: Date
}

interface ValidationResult {
  isValid: boolean
  userId?: string
  email?: string
  error?: string
}

interface VerificationResult {
  success: boolean
  userId?: string
  message?: string
  error?: string
  nextStep?: string
  retryable?: boolean
  retryAfter?: number
}

export class EmailVerificationService {
  private readonly TOKEN_EXPIRY_HOURS = 24
  private readonly MAX_RESEND_ATTEMPTS_PER_HOUR = 3
  private readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  async createVerificationToken(userId: string, email: string): Promise<CreateTokenResult> {
    // Generate secure random token
    const rawToken = randomBytes(32).toString('hex')
    
    // Hash token for storage
    const hashedToken = await bcrypt.hash(rawToken, 10)
    
    // Calculate expiry
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    
    // Store in database
    await database.verificationTokens.create({
      data: {
        token: hashedToken,
        userId,
        email,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    })
    
    return {
      token: rawToken, // Return unhashed token for URL
      expiresAt,
    }
  }

  async sendVerificationEmail(params: {
    userId: string
    email: string
    firstName: string
  }): Promise<VerificationResult> {
    try {
      // Create verification token
      const { token, expiresAt } = await this.createVerificationToken(
        params.userId,
        params.email
      )
      
      // Build verification link
      const verificationLink = `${this.BASE_URL}/verify-email?token=${token}`
      
      // Send email
      await sendEmail({
        to: params.email,
        subject: 'Verify your Jarvish account',
        template: 'email-verification',
        data: {
          firstName: params.firstName,
          verificationLink,
          expiryTime: '24 hours',
          disclaimer: 'This email is sent in compliance with SEBI regulations for financial advisory services.',
          regulatoryNote: 'Jarvish is a platform for SEBI-registered financial advisors. Ensure your EUIN is valid and active.',
        },
      })
      
      return {
        success: true,
        message: 'Verification email sent successfully',
      }
    } catch (error) {
      console.error('Failed to send verification email:', error)
      return {
        success: false,
        error: 'Failed to send verification email. Please try again.',
        retryable: true,
      }
    }
  }

  async validateToken(token: string): Promise<ValidationResult> {
    try {
      // Add constant time delay to prevent timing attacks
      await this.constantTimeDelay()
      
      // Find all non-used tokens (we'll check them all for timing attack prevention)
      const tokens = await database.verificationTokens.findMany({
        where: {
          type: 'EMAIL_VERIFICATION',
          used: false,
        },
      })
      
      // Check each token
      let validToken = null
      for (const dbToken of tokens) {
        const isMatch = await bcrypt.compare(token, dbToken.token)
        if (isMatch) {
          validToken = dbToken
          break
        }
      }
      
      if (!validToken) {
        return {
          isValid: false,
          error: 'Invalid verification link',
        }
      }
      
      // Check if expired
      if (validToken.expiresAt < new Date()) {
        return {
          isValid: false,
          error: 'Verification link has expired',
        }
      }
      
      // Check if already used
      if (validToken.used) {
        return {
          isValid: false,
          error: 'Verification link has already been used',
        }
      }
      
      return {
        isValid: true,
        userId: validToken.userId,
        email: validToken.email,
      }
    } catch (error) {
      console.error('Token validation error:', error)
      return {
        isValid: false,
        error: 'Failed to validate token',
      }
    }
  }

  async verifyEmail(token: string): Promise<VerificationResult> {
    // Validate token
    const validation = await this.validateToken(token)
    
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      }
    }
    
    const userId = validation.userId!
    
    try {
      // Start transaction
      const result = await database.$transaction(async (tx) => {
        // Mark email as verified
        await tx.advisors.update({
          where: { id: userId },
          data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        })
        
        // Mark token as used
        const dbToken = await tx.verificationTokens.findFirst({
          where: {
            userId,
            type: 'EMAIL_VERIFICATION',
            used: false,
          },
        })
        
        if (dbToken) {
          await tx.verificationTokens.update({
            where: { id: dbToken.id },
            data: { used: true },
          })
        }
        
        // Create or update onboarding progress
        await tx.onboardingProgress.upsert({
          where: { advisorId: userId },
          create: {
            advisorId: userId,
            currentStep: 'MOBILE_VERIFICATION',
            completedSteps: ['EMAIL_VERIFICATION'],
          },
          update: {
            completedSteps: {
              push: 'EMAIL_VERIFICATION',
            },
            currentStep: 'MOBILE_VERIFICATION',
          },
        })
        
        return { success: true }
      })
      
      return {
        success: true,
        userId,
        message: 'Email verified successfully',
        nextStep: 'mobile-verification',
      }
    } catch (error) {
      console.error('Email verification error:', error)
      return {
        success: false,
        error: 'Failed to verify email',
      }
    }
  }

  async resendVerificationEmail(userId: string): Promise<VerificationResult> {
    try {
      // Check if advisor exists and email not verified
      const advisor = await database.advisors.findUnique({
        where: { id: userId },
      })
      
      if (!advisor) {
        return {
          success: false,
          error: 'Advisor not found',
        }
      }
      
      if (advisor.emailVerified) {
        return {
          success: false,
          error: 'Email already verified',
        }
      }
      
      // Check rate limiting
      const recentEmailCount = await database.emailLogs.count({
        where: {
          recipientId: userId,
          type: 'EMAIL_VERIFICATION',
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      })
      
      if (recentEmailCount >= this.MAX_RESEND_ATTEMPTS_PER_HOUR) {
        return {
          success: false,
          error: 'Too many verification emails sent. Please try again later.',
          retryAfter: 60 * 60 * 1000, // 1 hour in milliseconds
        }
      }
      
      // Invalidate old tokens
      await database.verificationTokens.updateMany({
        where: {
          userId,
          type: 'EMAIL_VERIFICATION',
          used: false,
        },
        data: {
          used: true,
        },
      })
      
      // Send new verification email
      const result = await this.sendVerificationEmail({
        userId,
        email: advisor.email,
        firstName: advisor.firstName,
      })
      
      // Log email send
      await database.emailLogs.create({
        data: {
          recipientId: userId,
          recipientEmail: advisor.email,
          type: 'EMAIL_VERIFICATION',
          status: result.success ? 'SENT' : 'FAILED',
        },
      })
      
      return result
    } catch (error) {
      console.error('Resend verification email error:', error)
      return {
        success: false,
        error: 'Failed to resend verification email',
        retryable: true,
      }
    }
  }

  private async constantTimeDelay(): Promise<void> {
    // Add a small random delay to prevent timing attacks
    const delay = 50 + Math.random() * 50 // 50-100ms
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

// Export singleton instance
export const emailVerificationService = new EmailVerificationService()