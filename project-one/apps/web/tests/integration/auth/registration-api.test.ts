import { NextRequest } from 'next/server'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import { validateEUIN } from '@/lib/validators/euin'
import { SEBIComplianceValidator } from '@/lib/validators/sebi-compliance'
import { prisma } from '@/lib/utils/database'

// Mock dependencies
jest.mock('@/lib/validators/euin')
jest.mock('@/lib/validators/sebi-compliance')
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
  compare: jest.fn(),
}))
jest.mock('@/lib/utils/database', () => ({
  prisma: {
    advisor: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    otpTokens: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    emailVerificationTokens: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const mockDb = prisma as any;

// Ensure all database mocks are set up
beforeEach(() => {
  if (mockDb.otpTokens) {
    mockDb.otpTokens.findMany.mockResolvedValue([]);
    mockDb.otpTokens.deleteMany.mockResolvedValue({ count: 0 });
  }
  if (mockDb.emailVerificationTokens) {
    mockDb.emailVerificationTokens.findFirst.mockResolvedValue(null);
    mockDb.emailVerificationTokens.deleteMany.mockResolvedValue({ count: 0 });
  }
});

// Helper function to create NextRequest
const createRequest = (body: any) => {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('Integration: Advisor Registration API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Always mock auditLog.create to prevent errors
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({
      id: 'log_123',
      action: 'ADVISOR_REGISTRATION',
    })
  })

  describe('POST /api/auth/register', () => {
    it('should successfully register a new advisor with valid data', async () => {
      // Mock successful EUIN validation
      ;(validateEUIN as jest.Mock).mockResolvedValue({ isValid: true })
      
      // Mock SEBI compliance check
      const mockValidator = {
        validateAdvisorData: jest.fn().mockResolvedValue({ isCompliant: true }),
      }
      ;(SEBIComplianceValidator as jest.Mock).mockImplementation(() => mockValidator)
      
      // Mock database - no existing advisor
      ;(prisma.advisor.findUnique as jest.Mock).mockResolvedValue(null)
      
      // Mock successful creation
      ;(prisma.advisor.create as jest.Mock).mockResolvedValue({
        id: 'adv_123',
        euin: 'E123456789',
        email: 'rajesh.kumar@example.com',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        mobile: '+919876543210',
        createdAt: new Date(),
        isVerified: false,
      })
      
      // Mock audit log creation
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({
        id: 'log_123',
        action: 'ADVISOR_REGISTRATION',
        euin: 'E123456789',
        success: true,
      })

      const requestBody = {
        euin: 'E123456789',
        email: 'rajesh.kumar@example.com',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        mobile: '+919876543210',
        password: 'SecurePass123!',
        businessType: 'individual',
        termsAccepted: true,
        dpdpConsent: true,
      }

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await registerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.advisor).toMatchObject({
        id: 'adv_123',
        euin: 'E123456789',
        email: 'rajesh.kumar@example.com',
      })
      expect(data.requiresEmailVerification).toBe(true)
    })

    it('should reject registration with invalid EUIN', async () => {
      ;(validateEUIN as jest.Mock).mockResolvedValue({ 
        isValid: false,
        error: 'Invalid EUIN format',
      })

      const requestBody = {
        euin: 'INVALID123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        mobile: '+919876543210',
        password: 'SecurePass123!',
        businessType: 'individual',
        termsAccepted: true,
        dpdpConsent: true,
      }

      const req = createRequest(requestBody)
      const response = await registerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid EUIN format')
      expect(prisma.advisor.create).not.toHaveBeenCalled()
    })

    it('should prevent duplicate registration', async () => {
      ;(validateEUIN as jest.Mock).mockResolvedValue({ isValid: true })
      
      // Mock existing advisor
      ;(prisma.advisor.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing_adv',
        euin: 'E123456789',
        email: 'existing@example.com',
      })

      const requestBody = {
        euin: 'E123456789',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        mobile: '+919876543211',
        password: 'SecurePass123!',
        businessType: 'individual',
        termsAccepted: true,
        dpdpConsent: true,
      }

      const req = createRequest(requestBody)
      const response = await registerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('This EUIN is already registered')
      expect(data.code).toBe('DUPLICATE_EUIN')
      expect(prisma.advisor.create).not.toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      const requestBody = {
        euin: 'E123456789',
        // Missing required fields
      }

      const req = createRequest(requestBody)
      const response = await registerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
      expect(data.fields).toContain('email')
      expect(data.fields).toContain('firstName')
      expect(data.fields).toContain('lastName')
    })

    it('should enforce terms and DPDP consent', async () => {
      const requestBody = {
        euin: 'E123456789',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        mobile: '+919876543210',
        password: 'SecurePass123!',
        businessType: 'individual',
        termsAccepted: false,
        dpdpConsent: false,
      }

      const req = createRequest(requestBody)
      const response = await registerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('must accept')
      expect(prisma.advisor.create).not.toHaveBeenCalled()
    })

    it('should validate Indian mobile number format', async () => {
      ;(validateEUIN as jest.Mock).mockResolvedValue({ isValid: true })

      const requestBody = {
        euin: 'E123456789',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        mobile: '+1234567890', // Non-Indian number
        password: 'SecurePass123!',
        businessType: 'individual',
        termsAccepted: true,
        dpdpConsent: true,
      }

      const req = createRequest(requestBody)
      const response = await registerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Indian mobile number')
    })

    it('should handle SEBI compliance violations', async () => {
      ;(validateEUIN as jest.Mock).mockResolvedValue({ isValid: true })
      
      const mockValidator = {
        validateAdvisorData: jest.fn().mockResolvedValue({ 
          isCompliant: false,
          violations: ['Missing required NISM certification'],
        }),
      }
      ;(SEBIComplianceValidator as jest.Mock).mockImplementation(() => mockValidator)
      
      ;(prisma.advisor.findUnique as jest.Mock).mockResolvedValue(null)

      const requestBody = {
        euin: 'E123456789',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        mobile: '+919876543210',
        password: 'SecurePass123!',
        businessType: 'individual',
        termsAccepted: true,
        dpdpConsent: true,
      }

      const req = createRequest(requestBody)
      const response = await registerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('SEBI compliance validation failed')
      expect(data.violations).toContain('Missing required NISM certification')
      expect(prisma.advisor.create).not.toHaveBeenCalled()
    })

    it('should create audit log for registration attempt', async () => {
      ;(validateEUIN as jest.Mock).mockResolvedValue({ isValid: true })
      
      const mockValidator = {
        validateAdvisorData: jest.fn().mockResolvedValue({ isCompliant: true }),
      }
      ;(SEBIComplianceValidator as jest.Mock).mockImplementation(() => mockValidator)
      
      ;(prisma.advisor.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.advisor.create as jest.Mock).mockResolvedValue({
        id: 'adv_123',
        euin: 'E123456789',
      })


      const requestBody = {
        euin: 'E123456789',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        mobile: '+919876543210',
        password: 'SecurePass123!',
        businessType: 'individual',
        termsAccepted: true,
        dpdpConsent: true,
      }

      const req = createRequest(requestBody)
      await registerHandler(req)

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ADVISOR_REGISTRATION',
            euin: 'E123456789',
            success: true,
          }),
        })
      )
    })

    it('should send verification email after successful registration', async () => {
      ;(validateEUIN as jest.Mock).mockResolvedValue({ isValid: true })
      
      const mockValidator = {
        validateAdvisorData: jest.fn().mockResolvedValue({ isCompliant: true }),
      }
      ;(SEBIComplianceValidator as jest.Mock).mockImplementation(() => mockValidator)
      
      ;(prisma.advisor.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.advisor.create as jest.Mock).mockResolvedValue({
        id: 'adv_123',
        euin: 'E123456789',
        email: 'test@example.com',
      })

      // Mock email service
      const sendEmailMock = jest.fn().mockResolvedValue({ success: true })
      jest.mock('@/lib/services/email', () => ({
        sendVerificationEmail: sendEmailMock,
      }))

      const requestBody = {
        euin: 'E123456789',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        mobile: '+919876543210',
        password: 'SecurePass123!',
        businessType: 'individual',
        termsAccepted: true,
        dpdpConsent: true,
      }

      const req = createRequest(requestBody)
      const response = await registerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.requiresEmailVerification).toBe(true)
      expect(data.message).toContain('verification email')
    })
  })
})