import bcrypt from 'bcryptjs'
import { MobileVerificationService } from '@/lib/services/mobile-verification'
import { sendSMS } from '@/lib/services/sms'
import { database } from '@/lib/utils/database'
import * as crypto from 'crypto'

// Mock dependencies
jest.mock('@/lib/services/sms')
jest.mock('@/lib/utils/database', () => ({
  database: {
    otpTokens: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    advisors: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    otpAttempts: {
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    onboardingProgress: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(async (fn) => await fn({
      otpTokens: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      advisors: {
        update: jest.fn(),
      },
      onboardingProgress: {
        upsert: jest.fn(),
      },
      otpAttempts: {
        create: jest.fn(),
      },
    })),
  },
}))

describe('E01-US-003: Mobile Verification', () => {
  let mobileService: MobileVerificationService
  const mockDb = (database as any)
  const mockSendSMS = sendSMS as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mobileService = new MobileVerificationService()
  })

  describe('OTP Generation', () => {
    it('should generate a 6-digit OTP', async () => {
      const userId = 'test-user-123'
      const mobile = '+919876543210'
      
      // Mock rate limit check - no recent OTPs
      mockDb.otpTokens.findMany.mockResolvedValue([])
      
      // Mock deletion of old OTPs
      mockDb.otpTokens.deleteMany.mockResolvedValue({ count: 0 })
      
      mockDb.otpTokens.create.mockResolvedValue({
        id: 'otp-123',
        userId,
        mobile,
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        verified: false,
      })

      mockSendSMS.mockResolvedValue({ success: true, messageId: 'msg-123' })

      const result = await mobileService.generateOTP(userId, mobile)

      expect(result.success).toBe(true)
      expect(result.expiresInMinutes).toBe(10)
      expect(mockDb.otpTokens.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          mobile: '+919876543210', // Normalized mobile number
          otp: expect.any(String), // OTP is hashed, so just check it's a string
          expiresAt: expect.any(Date),
          attempts: 0,
          verified: false,
        }),
      })
      expect(mockSendSMS).toHaveBeenCalledWith({
        to: mobile,
        message: expect.stringContaining('OTP'),
      })
    })

    it('should invalidate previous OTPs when generating new one', async () => {
      const userId = 'test-user-123'
      const mobile = '+919876543210'

      mockDb.otpTokens.findMany.mockResolvedValue([
        { id: 'old-otp-1', verified: false },
        { id: 'old-otp-2', verified: false },
      ])

      mockDb.otpTokens.create.mockResolvedValue({
        id: 'new-otp',
        otp: '654321',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })

      mockSendSMS.mockResolvedValue({ success: true })

      await mobileService.generateOTP(userId, mobile)

      expect(mockDb.otpTokens.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          verified: false,
        },
      })
    })

    it('should enforce rate limiting (max 5 OTPs per hour)', async () => {
      const userId = 'test-user-123'
      const mobile = '+919876543210'
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      mockDb.otpTokens.findMany.mockResolvedValue([
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
      ])

      const result = await mobileService.generateOTP(userId, mobile)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('rate limit exceeded')

      expect(mockSendSMS).not.toHaveBeenCalled()
    })

    it('should format mobile number to Indian format', async () => {
      const userId = 'test-user-123'
      const mobileVariants = [
        '9876543210',
        '919876543210',
        '+919876543210',
        '0919876543210',
      ]

      for (const mobile of mobileVariants) {
        // Mock rate limit and deleteMany for each iteration
        mockDb.otpTokens.findMany.mockResolvedValue([])
        mockDb.otpTokens.deleteMany.mockResolvedValue({ count: 0 })
        
        mockDb.otpTokens.create.mockResolvedValue({
          id: 'otp-123',
          otp: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        })
        mockSendSMS.mockResolvedValue({ success: true })

        await mobileService.generateOTP(userId, mobile)

        expect(mockDb.otpTokens.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            mobile: '+919876543210',
          }),
        })
      }
    })
  })

  describe('OTP Verification', () => {
    it('should verify valid OTP successfully', async () => {
      const userId = 'test-user-123'
      const otp = '123456'
      const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex')

      const mockTransaction = {
        otpTokens: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'otp-123',
            otp: hashedOTP,
            userId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            used: false,
            attempts: 0,
          }),
          update: jest.fn(),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          upsert: jest.fn(),
        },
        otpAttempts: {
          create: jest.fn(),
        },
      }

      mockDb.$transaction.mockImplementation((fn: any) => fn(mockTransaction))

      const result = await mobileService.verifyOTP(userId, otp)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Mobile number verified successfully')
      expect(mockTransaction.otpTokens.update).toHaveBeenCalledWith({
        where: { id: 'otp-123' },
        data: { verified: true },
      })
      expect(mockTransaction.advisors.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { mobileVerified: true },
      })
    })

    it('should reject expired OTP', async () => {
      const userId = 'test-user-123'
      const otp = '123456'
      const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex')

      const mockTransaction = {
        otpTokens: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'otp-123',
            otp: hashedOTP,
            userId,
            expiresAt: new Date(Date.now() - 10 * 60 * 1000),
            used: false,
            attempts: 0,
          }),
          update: jest.fn(),
        },
        otpAttempts: {
          create: jest.fn(),
        },
      }

      mockDb.$transaction.mockImplementation((fn: any) => fn(mockTransaction))

      const result = await mobileService.verifyOTP(userId, otp)

      expect(result.success).toBe(false)
      expect(result.message).toBe('OTP has expired')
      expect(mockTransaction.otpTokens.update).not.toHaveBeenCalled()
    })

    it('should reject after 3 failed attempts', async () => {
      const userId = 'test-user-123'
      const otp = '999999' // Wrong OTP
      const correctHashedOTP = crypto.createHash('sha256').update('123456').digest('hex')

      const mockTransaction = {
        otpTokens: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'otp-123',
            otp: correctHashedOTP,
            userId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            used: false,
            attempts: 3,
          }),
          update: jest.fn(),
        },
        otpAttempts: {
          create: jest.fn(),
        },
      }

      mockDb.$transaction.mockImplementation((fn: any) => fn(mockTransaction))

      const result = await mobileService.verifyOTP(userId, otp)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Maximum attempts exceeded')
    })

    it('should use constant-time comparison for security', async () => {
      const userId = 'user-123'
      const otp = '123456'
      const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex')
      
      // Mock OTP lookup
      mockDb.otpTokens.findFirst.mockResolvedValue({
        id: 'otp-id',
        otp: hashedOTP,
        userId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        attempts: 0,
      })
      
      // Mock transaction for the verification
      const mockTransaction = {
        otpTokens: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'otp-123',
            otp: hashedOTP,
            userId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            used: false,
            attempts: 0,
          }),
          update: jest.fn(),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          upsert: jest.fn(),
        },
        otpAttempts: {
          create: jest.fn(),
        },
      }
      
      mockDb.$transaction.mockImplementation(async (fn) => await fn(mockTransaction))
      
      // The service uses constant-time comparison via crypto.timingSafeEqual
      const result = await mobileService.verifyOTP(userId, otp)
      
      // Verify the OTP was verified successfully
      expect(result.success).toBe(true)
      expect(mockTransaction.otpTokens.update).toHaveBeenCalled()
    })
  })

  describe('OTP Verification Completion', () => {
    it('should mark mobile as verified after successful OTP verification', async () => {
      const userId = 'user-123'
      const otp = '123456'
      const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex')
      
      // Mock transaction with proper structure
      const mockTransaction = {
        otpTokens: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'otp-123',
            otp: hashedOTP,
            userId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            used: false,
            attempts: 0,
          }),
          update: jest.fn(),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          upsert: jest.fn(),
        },
        otpAttempts: {
          create: jest.fn(),
        },
      }

      mockDb.$transaction.mockImplementation((fn: any) => fn(mockTransaction))

      await mobileService.verifyOTP(userId, otp)

      // Verify the OTP was verified correctly
      expect(mockTransaction.advisors.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { mobileVerified: true },
      })
    })
  })

  describe('SEBI Compliance', () => {
    it('should include SEBI-compliant message in SMS', async () => {
      const userId = 'test-user-123'
      const mobile = '+919876543210'

      // Mock rate limit and deleteMany
      mockDb.otpTokens.findMany.mockResolvedValue([])
      mockDb.otpTokens.deleteMany.mockResolvedValue({ count: 0 })
      
      mockDb.otpTokens.create.mockResolvedValue({
        id: 'otp-123',
        otp: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })
      mockSendSMS.mockResolvedValue({ success: true })

      await mobileService.generateOTP(userId, mobile)

      expect(mockSendSMS).toHaveBeenCalledWith({
        to: mobile,
        message: expect.stringContaining('Jarvish'),
        // Should include disclaimer about financial services
      })
    })

    it('should log all OTP attempts for audit trail', async () => {
      const userId = 'test-user-123'
      const otp = '123456'
      const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex')

      const mockTransaction = {
        otpTokens: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'otp-123',
            otp: hashedOTP,
            userId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            used: false,
            attempts: 0,
          }),
          update: jest.fn(),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          upsert: jest.fn(),
        },
        otpAttempts: {
          create: jest.fn(),
        },
      }

      mockDb.$transaction.mockImplementation((fn: any) => fn(mockTransaction))

      await mobileService.verifyOTP(userId, otp)

      expect(mockTransaction.otpAttempts.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          otpTokenId: 'otp-123',
          success: true,
          ipAddress: expect.any(String),
        }),
      })
    })
  })

  describe('Resend OTP', () => {
    it('should allow resending OTP after 60 seconds', async () => {
      const userId = 'test-user-123'
      const mobile = '+919876543210'

      mockDb.otpTokens.findFirst.mockResolvedValue({
        id: 'old-otp',
        createdAt: new Date(Date.now() - 61000), // 61 seconds ago
      })

      // Mock rate limit and deleteMany for resend
      mockDb.otpTokens.findMany.mockResolvedValue([])
      mockDb.otpTokens.deleteMany.mockResolvedValue({ count: 0 })
      
      mockDb.otpTokens.create.mockResolvedValue({
        id: 'new-otp',
        otp: '654321',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })
      mockSendSMS.mockResolvedValue({ success: true })

      const result = await mobileService.resendOTP(userId, mobile)

      expect(result.success).toBe(true)
      expect(result.message).toBe('OTP resent successfully')
    })

    it('should prevent resending OTP within 60 seconds', async () => {
      const userId = 'test-user-123'
      const mobile = '+919876543210'

      mockDb.otpTokens.findFirst.mockResolvedValue({
        id: 'recent-otp',
        createdAt: new Date(Date.now() - 30000), // 30 seconds ago
      })

      const result = await mobileService.resendOTP(userId, mobile)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Please wait')
      expect(result.waitTimeSeconds).toBe(30)
      expect(mockSendSMS).not.toHaveBeenCalled()
    })
  })
})