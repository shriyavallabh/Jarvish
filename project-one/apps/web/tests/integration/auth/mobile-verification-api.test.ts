import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs'

// Mock dependencies BEFORE importing the route
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/services/mobile-verification', () => {
  // Create mock inside the factory function
  const mockServiceInstance = {
    generateOTP: jest.fn(),
    verifyOTP: jest.fn(),
    resendOTP: jest.fn(),
  }
  
  return {
    MobileVerificationService: jest.fn().mockImplementation(() => mockServiceInstance),
    __mockServiceInstance: mockServiceInstance, // Export for test access
  }
})

// Import route AFTER mocks are set up
import { POST, PUT, PATCH } from '@/app/api/auth/mobile-verify/route'
import { MobileVerificationService } from '@/lib/services/mobile-verification'

describe('Mobile Verification API Integration Tests', () => {
  const mockAuth = auth as jest.Mock
  // Get the mock service instance
  const mockServiceInstance = (require('@/lib/services/mobile-verification') as any).__mockServiceInstance
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/mobile-verify - Generate OTP', () => {
    it('should generate and send OTP for authenticated user', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      // Set up the mock response
      mockServiceInstance.generateOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresInMinutes: 10,
      })
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'POST',
        body: JSON.stringify({ mobile: '+919876543210' }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      // Log the error for debugging
      if (response.status !== 200) {
        console.log('Response data:', data)
      }
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('OTP sent successfully')
      expect(data.expiresInMinutes).toBe(10)
      expect(mockServiceInstance.generateOTP).toHaveBeenCalledWith('user-123', '+919876543210')
    })

    it('should reject unauthenticated requests', async () => {
      mockAuth.mockReturnValue({ userId: null })
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'POST',
        body: JSON.stringify({ mobile: '+919876543210' }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate mobile number format', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      // Test case: service should NOT be called because validation should fail first
      mockServiceInstance.generateOTP.mockResolvedValue({
        success: false,
        message: 'Invalid Indian mobile number format',
        error: 'Invalid Indian mobile number format',
      })
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'POST',
        body: JSON.stringify({ mobile: '123456' }), // Invalid format
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
      // The service should not be called at all since validation should fail
      expect(mockServiceInstance.generateOTP).not.toHaveBeenCalled()
    })

    it('should handle rate limiting', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const mockGenerateOTP = jest.fn().mockResolvedValue({
        success: false,
        message: 'OTP generation rate limit exceeded',
        error: 'rate limit exceeded',
      })
      
      mockServiceInstance.generateOTP = mockGenerateOTP
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'POST',
        body: JSON.stringify({ mobile: '+919876543210' }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many requests')
    })

    it('should accept various Indian mobile number formats', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const mockGenerateOTP = jest.fn().mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        expiresInMinutes: 10,
      })
      
      mockServiceInstance.generateOTP = mockGenerateOTP
      
      const formats = ['9876543210', '919876543210', '+919876543210']
      
      for (const mobile of formats) {
        const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
          method: 'POST',
          body: JSON.stringify({ mobile }),
        })
        
        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })
  })

  describe('PUT /api/auth/mobile-verify - Verify OTP', () => {
    it('should verify valid OTP successfully', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const mockVerifyOTP = jest.fn().mockResolvedValue({
        success: true,
        message: 'Mobile number verified successfully',
      })
      
      mockServiceInstance.verifyOTP = mockVerifyOTP
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PUT',
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ otp: '123456' }),
      })
      
      const response = await PUT(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.nextStep).toBe('profile-completion')
      expect(mockVerifyOTP).toHaveBeenCalledWith('user-123', '123456', '192.168.1.1')
    })

    it('should handle expired OTP', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const mockVerifyOTP = jest.fn().mockResolvedValue({
        success: false,
        message: 'OTP has expired',
      })
      
      mockServiceInstance.verifyOTP = mockVerifyOTP
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PUT',
        body: JSON.stringify({ otp: '123456' }),
      })
      
      const response = await PUT(request)
      const data = await response.json()
      
      expect(response.status).toBe(410) // Gone
      expect(data.error).toBe('OTP expired')
    })

    it('should handle maximum attempts exceeded', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const mockVerifyOTP = jest.fn().mockResolvedValue({
        success: false,
        message: 'Maximum attempts exceeded. Please request a new OTP',
        attemptsRemaining: 0,
      })
      
      mockServiceInstance.verifyOTP = mockVerifyOTP
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PUT',
        body: JSON.stringify({ otp: '999999' }),
      })
      
      const response = await PUT(request)
      const data = await response.json()
      
      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many attempts')
    })

    it('should validate OTP format', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const invalidOTPs = ['12345', '1234567', 'abcdef', '12 34 56']
      
      for (const otp of invalidOTPs) {
        const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
          method: 'PUT',
          body: JSON.stringify({ otp }),
        })
        
        const response = await PUT(request)
        const data = await response.json()
        
        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid request')
      }
    })

    it('should capture IP address for audit', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const mockVerifyOTP = jest.fn().mockResolvedValue({
        success: true,
        message: 'Mobile number verified successfully',
      })
      
      mockServiceInstance.verifyOTP = mockVerifyOTP
      
      // Test with x-forwarded-for header
      let request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PUT',
        headers: {
          'x-forwarded-for': '10.0.0.1',
        },
        body: JSON.stringify({ otp: '123456' }),
      })
      
      await PUT(request)
      expect(mockVerifyOTP).toHaveBeenCalledWith('user-123', '123456', '10.0.0.1')
      
      // Test with x-real-ip header
      mockVerifyOTP.mockClear()
      request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PUT',
        headers: {
          'x-real-ip': '10.0.0.2',
        },
        body: JSON.stringify({ otp: '123456' }),
      })
      
      await PUT(request)
      expect(mockVerifyOTP).toHaveBeenCalledWith('user-123', '123456', '10.0.0.2')
      
      // Test with no IP headers (fallback)
      mockVerifyOTP.mockClear()
      request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PUT',
        body: JSON.stringify({ otp: '123456' }),
      })
      
      await PUT(request)
      expect(mockVerifyOTP).toHaveBeenCalledWith('user-123', '123456', '127.0.0.1')
    })
  })

  describe('PATCH /api/auth/mobile-verify - Resend OTP', () => {
    it('should resend OTP successfully', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const mockResendOTP = jest.fn().mockResolvedValue({
        success: true,
        message: 'OTP resent successfully',
      })
      
      mockServiceInstance.resendOTP = mockResendOTP
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PATCH',
        body: JSON.stringify({ mobile: '+919876543210' }),
      })
      
      const response = await PATCH(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('OTP resent successfully')
      expect(mockResendOTP).toHaveBeenCalledWith('user-123', '+919876543210')
    })

    it('should handle cooldown period', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const mockResendOTP = jest.fn().mockResolvedValue({
        success: false,
        message: 'Please wait 45 seconds before requesting a new OTP',
        waitTimeSeconds: 45,
      })
      
      mockServiceInstance.resendOTP = mockResendOTP
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PATCH',
        body: JSON.stringify({ mobile: '+919876543210' }),
      })
      
      const response = await PATCH(request)
      const data = await response.json()
      
      expect(response.status).toBe(429)
      expect(data.error).toBe('Too soon to resend')
      expect(data.waitTimeSeconds).toBe(45)
    })

    it('should validate mobile number on resend', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PATCH',
        body: JSON.stringify({ mobile: 'invalid' }),
      })
      
      const response = await PATCH(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })
  })

  describe('Security Tests', () => {
    it('should not leak sensitive information in error messages', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      
      const mockVerifyOTP = jest.fn().mockRejectedValue(
        new Error('Database connection failed with password: secret123')
      )
      
      mockServiceInstance.verifyOTP = mockVerifyOTP
      
      // Set NODE_ENV to production to test error masking
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PUT',
        body: JSON.stringify({ otp: '123456' }),
      })
      
      const response = await PUT(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBeUndefined() // Should not leak error details
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv
    })

    it('should require authentication for all endpoints', async () => {
      mockAuth.mockReturnValue({ userId: null })
      
      // Test POST
      let request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'POST',
        body: JSON.stringify({ mobile: '+919876543210' }),
      })
      
      let response = await POST(request)
      expect(response.status).toBe(401)
      
      // Test PUT
      request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PUT',
        body: JSON.stringify({ otp: '123456' }),
      })
      
      response = await PUT(request)
      expect(response.status).toBe(401)
      
      // Test PATCH
      request = new NextRequest('http://localhost:3000/api/auth/mobile-verify', {
        method: 'PATCH',
        body: JSON.stringify({ mobile: '+919876543210' }),
      })
      
      response = await PATCH(request)
      expect(response.status).toBe(401)
    })
  })
})