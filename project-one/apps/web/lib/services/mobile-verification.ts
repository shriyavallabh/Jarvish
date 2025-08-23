import * as crypto from 'crypto'
import { sendSMS } from './sms'
import { database } from '../utils/database'

interface GenerateOTPResult {
  success: boolean
  message: string
  expiresInMinutes?: number
  error?: string
}

interface VerifyOTPResult {
  success: boolean
  message: string
  attemptsRemaining?: number
}

interface ResendOTPResult {
  success: boolean
  message: string
  waitTimeSeconds?: number
}

export class MobileVerificationService {
  private readonly OTP_LENGTH = 6
  private readonly OTP_EXPIRY_MINUTES = 10
  private readonly MAX_ATTEMPTS = 3
  private readonly RATE_LIMIT_PER_HOUR = 5
  private readonly RESEND_COOLDOWN_SECONDS = 60

  /**
   * Generate and send OTP to mobile number
   * Implements rate limiting and invalidates previous OTPs
   */
  async generateOTP(userId: string, mobile: string): Promise<GenerateOTPResult> {
    try {
      // Normalize mobile number to Indian format
      const normalizedMobile = this.normalizeMobileNumber(mobile)
      
      // Check rate limiting
      await this.checkRateLimit(userId)
      
      // Invalidate previous unverified OTPs
      await database.otpTokens.deleteMany({
        where: {
          userId,
          verified: false,
        },
      })
      
      // Generate new OTP
      const otp = this.generateRandomOTP()
      const hashedOTP = this.hashOTP(otp)
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000)
      
      // Store OTP in database
      const otpToken = await database.otpTokens.create({
        data: {
          userId,
          mobile: normalizedMobile,
          otp: hashedOTP,
          expiresAt,
          attempts: 0,
          verified: false,
        },
      })
      
      // Send SMS with SEBI-compliant message
      const message = this.createSEBICompliantMessage(otp)
      await sendSMS({
        to: normalizedMobile,
        message,
      })
      
      return {
        success: true,
        message: 'OTP sent successfully',
        expiresInMinutes: this.OTP_EXPIRY_MINUTES,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to send OTP',
        error: error.message,
      }
    }
  }

  /**
   * Verify OTP with constant-time comparison for security
   * Implements attempt limiting and audit logging
   */
  async verifyOTP(userId: string, otp: string, ipAddress: string = '127.0.0.1'): Promise<VerifyOTPResult> {
    return await database.$transaction(async (tx) => {
      // Find the latest OTP token for this user
      const otpToken = await tx.otpTokens.findFirst({
        where: {
          userId,
          verified: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      
      if (!otpToken) {
        return {
          success: false,
          message: 'No OTP found. Please request a new one',
        }
      }
      
      // Check if OTP has expired
      if (new Date() > otpToken.expiresAt) {
        // Log failed attempt
        await tx.otpAttempts.create({
          data: {
            userId,
            otpTokenId: otpToken.id,
            success: false,
            reason: 'expired',
            ipAddress,
          },
        })
        
        return {
          success: false,
          message: 'OTP has expired',
        }
      }
      
      // Check attempts
      if (otpToken.attempts >= this.MAX_ATTEMPTS) {
        return {
          success: false,
          message: 'Maximum attempts exceeded. Please request a new OTP',
          attemptsRemaining: 0,
        }
      }
      
      // Verify OTP using constant-time comparison
      const providedOTPHash = this.hashOTP(otp)
      const isValid = this.constantTimeCompare(providedOTPHash, otpToken.otp)
      
      if (!isValid) {
        // Increment attempts
        await tx.otpTokens.update({
          where: { id: otpToken.id },
          data: { attempts: otpToken.attempts + 1 },
        })
        
        // Log failed attempt
        await tx.otpAttempts.create({
          data: {
            userId,
            otpTokenId: otpToken.id,
            success: false,
            reason: 'invalid_otp',
            ipAddress,
          },
        })
        
        const remainingAttempts = this.MAX_ATTEMPTS - (otpToken.attempts + 1)
        
        if (remainingAttempts === 0) {
          return {
            success: false,
            message: 'Maximum attempts exceeded. Please request a new OTP',
            attemptsRemaining: 0,
          }
        }
        
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining`,
          attemptsRemaining: remainingAttempts,
        }
      }
      
      // Mark OTP as verified
      await tx.otpTokens.update({
        where: { id: otpToken.id },
        data: { verified: true },
      })
      
      // Update advisor mobile verification status
      await tx.advisors.update({
        where: { id: userId },
        data: { mobileVerified: true },
      })
      
      // Update onboarding progress
      await tx.onboardingProgress.upsert({
        where: { advisorId: userId },
        update: { mobileVerified: true },
        create: {
          advisorId: userId,
          mobileVerified: true,
        },
      })
      
      // Log successful attempt
      await tx.otpAttempts.create({
        data: {
          userId,
          otpTokenId: otpToken.id,
          success: true,
          ipAddress,
        },
      })
      
      return {
        success: true,
        message: 'Mobile number verified successfully',
      }
    })
  }

  /**
   * Resend OTP with cooldown period
   */
  async resendOTP(userId: string, mobile: string): Promise<ResendOTPResult> {
    try {
      // Check if there's a recent OTP
      const recentOTP = await database.otpTokens.findFirst({
        where: {
          userId,
          verified: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      
      if (recentOTP) {
        const timeSinceLastOTP = Date.now() - recentOTP.createdAt.getTime()
        const secondsSinceLastOTP = Math.floor(timeSinceLastOTP / 1000)
        
        if (secondsSinceLastOTP < this.RESEND_COOLDOWN_SECONDS) {
          const waitTime = this.RESEND_COOLDOWN_SECONDS - secondsSinceLastOTP
          return {
            success: false,
            message: `Please wait ${waitTime} seconds before requesting a new OTP`,
            waitTimeSeconds: waitTime,
          }
        }
      }
      
      // Generate new OTP
      const result = await this.generateOTP(userId, mobile)
      
      if (result.success) {
        return {
          success: true,
          message: 'OTP resent successfully',
        }
      }
      
      return {
        success: false,
        message: result.message || 'Failed to resend OTP',
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to resend OTP',
      }
    }
  }

  /**
   * Check rate limiting for OTP generation
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentOTPs = await database.otpTokens.findMany({
      where: {
        userId,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    })
    
    if (recentOTPs.length >= this.RATE_LIMIT_PER_HOUR) {
      throw new Error('OTP generation rate limit exceeded. Please try again later')
    }
  }

  /**
   * Generate random 6-digit OTP
   */
  private generateRandomOTP(): string {
    const min = 100000
    const max = 999999
    const otp = Math.floor(Math.random() * (max - min + 1)) + min
    return otp.toString()
  }

  /**
   * Hash OTP for secure storage
   */
  private hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex')
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }
    
    const bufferA = Buffer.from(a)
    const bufferB = Buffer.from(b)
    
    return crypto.timingSafeEqual(bufferA, bufferB)
  }

  /**
   * Normalize mobile number to Indian format (+91XXXXXXXXXX)
   */
  private normalizeMobileNumber(mobile: string): string {
    // Remove all non-digit characters
    let cleaned = mobile.replace(/\D/g, '')
    
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }
    
    // If number doesn't start with 91, add it
    if (!cleaned.startsWith('91')) {
      cleaned = '91' + cleaned
    }
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned
    }
    
    // Validate Indian mobile number format
    if (!/^\+91[6-9]\d{9}$/.test(cleaned)) {
      throw new Error('Invalid Indian mobile number format')
    }
    
    return cleaned
  }

  /**
   * Create SEBI-compliant SMS message
   */
  private createSEBICompliantMessage(otp: string): string {
    return `Your Jarvish verification OTP is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes. Do not share this OTP with anyone. This is for financial advisory platform registration only.`
  }
}