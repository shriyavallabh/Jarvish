import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/auth/verify-email/route'
import { emailVerificationService } from '@/lib/services/email-verification'
import { NextRequest } from 'next/server'

// Mock the email verification service
jest.mock('@/lib/services/email-verification', () => ({
  emailVerificationService: {
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
  },
}))

describe('E01-US-002: Email Verification API', () => {
  const mockEmailService = emailVerificationService as jest.Mocked<typeof emailVerificationService>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const token = 'valid-token-123'
      mockEmailService.verifyEmail.mockResolvedValue({
        success: true,
        userId: 'user-123',
        message: 'Email verified successfully',
        nextStep: 'mobile-verification',
      })

      const url = `http://localhost:3000/api/auth/verify-email?token=${token}`
      const req = new NextRequest(url)
      
      const response = await GET(req)
      const data = await response.json()

      expect(mockEmailService.verifyEmail).toHaveBeenCalledWith(token)
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Email verified successfully',
        userId: 'user-123',
        nextStep: 'mobile-verification',
      })
    })

    it('should return error for missing token', async () => {
      const url = 'http://localhost:3000/api/auth/verify-email'
      const req = new NextRequest(url)
      
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Verification token is required',
      })
      expect(mockEmailService.verifyEmail).not.toHaveBeenCalled()
    })

    it('should return error for invalid token', async () => {
      const token = 'invalid-token'
      mockEmailService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Invalid verification link',
      })

      const url = `http://localhost:3000/api/auth/verify-email?token=${token}`
      const req = new NextRequest(url)
      
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid verification link',
      })
    })

    it('should return error for expired token', async () => {
      const token = 'expired-token'
      mockEmailService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Verification link has expired',
      })

      const url = `http://localhost:3000/api/auth/verify-email?token=${token}`
      const req = new NextRequest(url)
      
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Verification link has expired',
      })
    })

    it('should handle service errors gracefully', async () => {
      const token = 'valid-token'
      mockEmailService.verifyEmail.mockRejectedValue(new Error('Database error'))

      const url = `http://localhost:3000/api/auth/verify-email?token=${token}`
      const req = new NextRequest(url)
      
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to verify email',
      })
    })
  })

  describe('POST /api/auth/verify-email', () => {
    it('should resend verification email successfully', async () => {
      const userId = 'user-123'
      mockEmailService.resendVerificationEmail.mockResolvedValue({
        success: true,
        message: 'Verification email sent',
      })

      const req = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
      
      const response = await POST(req)
      const data = await response.json()

      expect(mockEmailService.resendVerificationEmail).toHaveBeenCalledWith(userId)
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Verification email sent',
      })
    })

    it('should return error for missing userId', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'User ID is required',
      })
      expect(mockEmailService.resendVerificationEmail).not.toHaveBeenCalled()
    })

    it('should handle rate limiting', async () => {
      const userId = 'user-123'
      mockEmailService.resendVerificationEmail.mockResolvedValue({
        success: false,
        error: 'Too many verification emails sent. Please try again later.',
        retryAfter: 3600000, // 1 hour
      })

      const req = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
      
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(429) // Too Many Requests
      expect(data).toEqual({
        error: 'Too many verification emails sent. Please try again later.',
        retryAfter: 3600000,
      })
    })

    it('should handle already verified emails', async () => {
      const userId = 'user-123'
      mockEmailService.resendVerificationEmail.mockResolvedValue({
        success: false,
        error: 'Email already verified',
      })

      const req = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
      
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Email already verified',
      })
    })

    it('should handle service errors gracefully', async () => {
      const userId = 'user-123'
      mockEmailService.resendVerificationEmail.mockRejectedValue(new Error('SMTP error'))

      const req = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
      
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to resend verification email',
      })
    })
  })

  describe('Integration with registration flow', () => {
    it('should work seamlessly after registration', async () => {
      // Simulate registration creating a user
      const registrationResponse = {
        userId: 'new-user-123',
        requiresEmailVerification: true,
      }

      // User receives email with token
      const token = 'registration-token-123'
      
      // User clicks verification link
      mockEmailService.verifyEmail.mockResolvedValue({
        success: true,
        userId: registrationResponse.userId,
        message: 'Email verified successfully',
        nextStep: 'mobile-verification',
      })

      const url = `http://localhost:3000/api/auth/verify-email?token=${token}`
      const req = new NextRequest(url)
      
      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.userId).toBe(registrationResponse.userId)
      expect(data.nextStep).toBe('mobile-verification')
    })
  })

  describe('Security considerations', () => {
    it('should not expose user information for invalid tokens', async () => {
      const token = 'malicious-token'
      mockEmailService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Invalid verification link',
      })

      const url = `http://localhost:3000/api/auth/verify-email?token=${token}`
      const req = new NextRequest(url)
      
      const response = await GET(req)
      const data = await response.json()

      // Should not expose any user information
      expect(data).not.toHaveProperty('userId')
      expect(data).not.toHaveProperty('email')
      expect(data).toEqual({
        error: 'Invalid verification link',
      })
    })

    it('should sanitize error messages', async () => {
      const token = 'test-token'
      mockEmailService.verifyEmail.mockRejectedValue(
        new Error('Database connection failed at 192.168.1.1:5432')
      )

      const url = `http://localhost:3000/api/auth/verify-email?token=${token}`
      const req = new NextRequest(url)
      
      const response = await GET(req)
      const data = await response.json()

      // Should not expose internal error details
      expect(data.error).not.toContain('192.168.1.1')
      expect(data.error).toBe('Failed to verify email')
    })
  })
})