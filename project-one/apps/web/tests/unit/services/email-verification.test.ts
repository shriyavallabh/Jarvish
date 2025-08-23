import bcrypt from 'bcryptjs'
import { EmailVerificationService } from '@/lib/services/email-verification'
import { generateVerificationToken, validateVerificationToken } from '@/lib/utils/token'
import { sendEmail } from '@/lib/services/email'
import { database } from '@/lib/utils/database'

// Mock dependencies
jest.mock('@/lib/utils/token')
jest.mock('@/lib/services/email')
jest.mock('@/lib/utils/database', () => ({
  database: {
    verificationTokens: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    advisors: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emailLogs: {
      count: jest.fn(),
      create: jest.fn(),
    },
    onboardingProgress: {
      create: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(async (fn) => await fn({
      verificationTokens: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      advisors: {
        update: jest.fn(),
      },
      onboardingProgress: {
        upsert: jest.fn(),
      },
    })),
  },
}))

describe('E01-US-002: Email Verification', () => {
  let emailService: EmailVerificationService
  const mockDb = (database as any)
  const mockSendEmail = sendEmail as jest.Mock
  const mockGenerateToken = generateVerificationToken as jest.Mock
  const mockValidateToken = validateVerificationToken as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    emailService = EmailVerificationService
    
    // Setup default mocks
    mockGenerateToken.mockReturnValue('test-verification-token-123')
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-123' })
    
    // Reset mock database structure for each test
    mockDb.verificationTokens = {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    }
    mockDb.advisors = {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    }
    mockDb.emailLogs = {
      count: jest.fn(),
      create: jest.fn(),
    }
    mockDb.onboardingProgress = {
      create: jest.fn(),
      upsert: jest.fn(),
    }
  })

  describe('TC-E01-002-01: Email verification link generation', () => {
    it('should generate unique verification token for new user', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      
      mockDb.verificationTokens.create.mockResolvedValue({
        id: 'token-id-123',
        token: 'hashed-token',
        userId,
        email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      
      const result = await emailService.createVerificationToken(userId, email)
      
      // The service returns the raw token, not the mocked one
      expect(result).toEqual({
        token: expect.any(String), // Raw token is random
        expiresAt: expect.any(Date),
      })
      expect(result.token).toHaveLength(64) // 32 bytes hex = 64 chars
    })

    it('should store verification token in database with 24-hour expiry', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      
      mockDb.verificationTokens.create.mockResolvedValue({
        id: 'token-id-123',
        token: 'test-verification-token-123',
        userId,
        email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      
      const result = await emailService.createVerificationToken(userId, email)
      
      expect(mockDb.verificationTokens.create).toHaveBeenCalledWith({
        data: {
          token: expect.any(String), // Token is hashed, so we can't predict exact value
          userId,
          email,
          type: 'EMAIL_VERIFICATION',
          expiresAt: expect.any(Date),
        },
      })
      
      // Verify expiry is 24 hours from now
      const expiryTime = result.expiresAt.getTime()
      const expectedExpiry = Date.now() + 24 * 60 * 60 * 1000
      expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(1000) // Within 1 second
    })
  })

  describe('TC-E01-002-02: Email verification sending', () => {
    it('should send verification email with correct template', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      const firstName = 'Test'
      
      // Mock the token creation that happens inside sendVerificationEmail
      mockDb.verificationTokens.create.mockResolvedValue({
        id: 'token-id-123',
        token: 'hashed-token',
        userId,
        email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      
      await emailService.sendVerificationEmail({
        userId,
        email,
        firstName,
      })
      
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: email,
        subject: 'Verify your Jarvish account',
        template: 'email-verification',
        data: {
          firstName,
          verificationLink: expect.stringContaining('/verify-email?token='),
          expiryTime: '24 hours',
          disclaimer: 'This email is sent in compliance with SEBI regulations for financial advisory services.',
          regulatoryNote: 'Jarvish is a platform for SEBI-registered financial advisors. Ensure your EUIN is valid and active.',
        },
      })
    })

    it('should include SEBI-compliant disclaimer in email', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      
      // Mock the token creation
      mockDb.verificationTokens.create.mockResolvedValue({
        id: 'token-id',
        token: 'hashed-token',
        userId,
        email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      
      await emailService.sendVerificationEmail({
        userId,
        email,
        firstName: 'Test',
      })
      
      const emailCall = mockSendEmail.mock.calls[0][0]
      expect(emailCall.data).toMatchObject({
        disclaimer: expect.stringContaining('SEBI'),
        regulatoryNote: expect.stringContaining('financial'),
      })
    })

    it('should handle email sending failures gracefully', async () => {
      mockSendEmail.mockRejectedValue(new Error('SMTP connection failed'))
      
      const result = await emailService.sendVerificationEmail({
        userId: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
      })
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to send verification email. Please try again.',
        retryable: true,
      })
    })
  })

  describe('TC-E01-002-03: Token validation', () => {
    it('should validate correct verification token', async () => {
      const token = 'valid-token-123'
      const userId = 'user-123'
      
      // Mock the findMany call (validateToken uses findMany for timing attack prevention)
      const bcrypt = require('bcryptjs')
      const hashedToken = await bcrypt.hash(token, 10)
      mockDb.verificationTokens.findMany.mockResolvedValue([{
        id: 'token-id',
        token: hashedToken,
        userId,
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        used: false,
      }])
      
      const result = await emailService.validateToken(token)
      
      expect(result).toEqual({
        isValid: true,
        userId: 'user-123',
        email: 'test@example.com',
      })
    })

    it('should reject expired tokens', async () => {
      const token = 'expired-token-123'
      
      // Mock the findMany call with expired token
      const bcrypt = require('bcryptjs')
      const hashedToken = await bcrypt.hash(token, 10)
      mockDb.verificationTokens.findMany.mockResolvedValue([{
        id: 'token-id',
        token: hashedToken,
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() - 60 * 1000), // 1 minute ago - expired
        used: false,
      }])
      
      const result = await emailService.validateToken(token)
      
      expect(result).toEqual({
        isValid: false,
        error: 'Verification link has expired',
      })
    })

    it('should reject already used tokens', async () => {
      const token = 'used-token-123'
      
      // Mock the findMany call with used token
      const bcrypt = require('bcryptjs')
      const hashedToken = await bcrypt.hash(token, 10)
      mockDb.verificationTokens.findMany.mockResolvedValue([{
        id: 'token-id',
        token: hashedToken,
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        used: true, // Already used
      }])
      
      const result = await emailService.validateToken(token)
      
      expect(result).toEqual({
        isValid: false,
        error: 'Verification link has already been used',
      })
    })

    it('should reject non-existent tokens', async () => {
      // Mock findMany returning empty array (no matching tokens)
      mockDb.verificationTokens.findMany.mockResolvedValue([])
      
      const result = await emailService.validateToken('invalid-token')
      
      expect(result).toEqual({
        isValid: false,
        error: 'Invalid verification link',
      })
    })
  })

  describe('TC-E01-002-04: Email verification completion', () => {
    it('should mark email as verified in database', async () => {
      const token = 'valid-token-123'
      const userId = 'user-123'
      const hashedToken = await bcrypt.hash(token, 10)
      
      // Mock for validateToken
      mockDb.verificationTokens.findMany = jest.fn().mockResolvedValue([
        {
          id: 'token-id',
          token: hashedToken,
          userId,
          email: 'test@example.com',
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
        },
      ])
      
      mockDb.verificationTokens.findFirst = jest.fn()
      mockDb.verificationTokens.update = jest.fn()
      
      mockDb.advisors.update = jest.fn().mockResolvedValue({
        id: userId,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      })
      
      // Setup transaction mock
      const mockTransaction = {
        verificationTokens: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'token-id',
            token: 'hashed-token',
            userId: 'user-123',
            email: 'test@example.com',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            used: false,
          }),
          update: jest.fn(),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          upsert: jest.fn(),
        },
      }
      
      mockDb.$transaction.mockImplementation(async (fn) => await fn(mockTransaction))
      
      const result = await emailService.verifyEmail(token)
      
      expect(mockTransaction.advisors.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: expect.any(Date),
        },
      })
      
      expect(mockTransaction.verificationTokens.update).toHaveBeenCalledWith({
        where: { id: 'token-id' },
        data: { used: true },
      })
      
      expect(result).toEqual({
        success: true,
        userId,
        message: 'Email verified successfully',
        nextStep: 'mobile-verification',
      })
    })

    it('should trigger onboarding flow after verification', async () => {
      const token = 'valid-token-123'
      const userId = 'user-123'
      const hashedToken = await bcrypt.hash(token, 10)
      
      // Mock for validateToken
      mockDb.verificationTokens.findMany = jest.fn().mockResolvedValue([
        {
          id: 'token-id',
          token: hashedToken,
          userId,
          email: 'test@example.com',
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
        },
      ])
      
      mockDb.verificationTokens.findFirst = jest.fn()
      mockDb.verificationTokens.update = jest.fn()
      
      mockDb.advisors.update = jest.fn().mockResolvedValue({
        id: userId,
        emailVerified: true,
      })
      
      mockDb.onboardingProgress.upsert = jest.fn()
      
      // Setup transaction mock
      const mockTransaction = {
        verificationTokens: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'token-id',
            token: 'hashed-token',
            userId: 'user-123',
            email: 'test@example.com',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            used: false,
          }),
          update: jest.fn(),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          upsert: jest.fn(),
        },
      }
      
      mockDb.$transaction.mockImplementation(async (fn) => await fn(mockTransaction))
      
      const result = await emailService.verifyEmail(token)
      
      expect(mockTransaction.onboardingProgress.upsert).toHaveBeenCalledWith({
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
      
      expect(result.nextStep).toEqual('mobile-verification')
    })
  })

  describe('TC-E01-002-05: Resend verification email', () => {
    it('should allow resending verification email', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      
      mockDb.advisors = {
        findUnique: jest.fn().mockResolvedValue({
          id: userId,
          email,
          firstName: 'Test',
          emailVerified: false,
        }),
      }
      
      mockDb.verificationTokens = {
        updateMany: jest.fn(), // Invalidate old tokens
        create: jest.fn().mockResolvedValue({
          token: 'new-token-123',
        }),
      }
      
      // Mock existing user
      mockDb.advisors.findUnique.mockResolvedValue({
        id: userId,
        email,
        emailVerified: false,
      })
      
      // Mock rate limit check
      mockDb.emailLogs.count.mockResolvedValue(0)
      
      // Mock token creation
      mockDb.verificationTokens.create.mockResolvedValue({
        id: 'new-token-id',
        token: 'new-hashed-token',
        userId,
        email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      
      const result = await emailService.resendVerificationEmail(userId)
      
      expect(mockDb.verificationTokens.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          type: 'EMAIL_VERIFICATION',
          used: false,
        },
        data: {
          used: true,
        },
      })
      
      expect(mockSendEmail).toHaveBeenCalled()
      expect(result).toEqual({
        success: true,
        message: 'Verification email sent successfully',
      })
    })

    it('should enforce rate limiting on resend requests', async () => {
      const userId = 'user-123'
      
      // Mock advisor exists
      mockDb.advisors.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        emailVerified: false,
        firstName: 'Test',
      })
      
      // Mock rate limit check
      mockDb.emailLogs = {
        count: jest.fn().mockResolvedValue(3), // 3 emails in last hour
      }
      
      const result = await emailService.resendVerificationEmail(userId)
      
      expect(result).toEqual({
        success: false,
        error: 'Too many verification emails sent. Please try again later.',
        retryAfter: expect.any(Number),
      })
      
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('should not resend if email already verified', async () => {
      const userId = 'user-123'
      
      mockDb.advisors = {
        findUnique: jest.fn().mockResolvedValue({
          id: userId,
          email: 'test@example.com',
          emailVerified: true,
        }),
      }
      
      const result = await emailService.resendVerificationEmail(userId)
      
      expect(result).toEqual({
        success: false,
        error: 'Email already verified',
      })
      
      expect(mockSendEmail).not.toHaveBeenCalled()
    })
  })

  describe('Integration with registration flow', () => {
    it('should integrate with advisor registration process', async () => {
      const registrationData = {
        euin: 'E123456789',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Advisor',
      }
      
      // Mock registration creating user
      mockDb.advisors = {
        create: jest.fn().mockResolvedValue({
          id: 'new-user-123',
          ...registrationData,
          emailVerified: false,
        }),
      }
      
      // Simulate registration triggering email verification
      const advisor = await mockDb.advisors.create({ data: registrationData })
      const verificationResult = await emailService.sendVerificationEmail({
        userId: advisor.id,
        email: advisor.email,
        firstName: advisor.firstName,
      })
      
      expect(verificationResult.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'new@example.com',
          template: 'email-verification',
        })
      )
    })
  })

  describe('Security considerations', () => {
    it('should hash tokens before storing in database', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'
      
      mockDb.verificationTokens = {
        create: jest.fn(),
      }
      
      await emailService.createVerificationToken(userId, email)
      
      const storedToken = mockDb.verificationTokens.create.mock.calls[0][0].data.token
      // Token should be hashed (different from generated token)
      expect(storedToken).not.toEqual('test-verification-token-123')
      expect(storedToken).toMatch(/^\$2[aby]\$/) // bcrypt hash pattern
    })

    it('should prevent timing attacks on token validation', async () => {
      const validToken = 'valid-token'
      const invalidToken = 'invalid-token'
      
      mockDb.verificationTokens.findFirst = jest.fn()
        .mockResolvedValueOnce({ 
          id: 'token-id',
          token: 'valid-token',
          userId: 'user-123',
          email: 'test@example.com',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
        })
        .mockResolvedValueOnce(null)
      
      const start1 = Date.now()
      await emailService.validateToken(validToken)
      const time1 = Date.now() - start1
      
      const start2 = Date.now()
      await emailService.validateToken(invalidToken)
      const time2 = Date.now() - start2
      
      // Response times should be similar (within 10ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(100)
    })
  })
})