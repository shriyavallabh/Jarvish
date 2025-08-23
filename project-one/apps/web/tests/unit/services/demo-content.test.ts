import { DemoContentService } from '@/lib/services/demo-content'
import { prisma } from '@/lib/utils/database'

// Mock the AI services
jest.mock('@/lib/ai/openai-service', () => ({
  OpenAIService: jest.fn().mockImplementation(() => ({
    generateContent: jest.fn(),
  })),
}))

jest.mock('@/lib/ai/three-stage-validator', () => ({
  ThreeStageValidator: jest.fn().mockImplementation(() => ({
    validateContent: jest.fn(),
  })),
}))

// Mock the database
jest.mock('@/lib/utils/database', () => ({
  prisma: {
    contentPreferences: {
      findUnique: jest.fn(),
    },
    demoContent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    advisors: {
      findUnique: jest.fn(),
    },
    _reset: jest.fn(),
  },
}))

describe('DemoContentService', () => {
  let service: DemoContentService
  let mockOpenAI: any
  let mockValidator: any

  beforeEach(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => { cb(); return 0 as any; });
    jest.clearAllMocks()
    service = DemoContentService
    mockOpenAI = (service as any).openAI
    mockValidator = (service as any).validator
  })

  describe('generateDemo', () => {
    it('should generate demo content based on advisor preferences', async () => {
      const advisorId = 'advisor-123'
      const mockPreferences = {
        advisorId,
        languages: ['EN', 'HI'],
        contentTypes: ['educational'],
        topics: ['mutual-funds'],
        frequency: 'daily',
        deliveryTime: '09:00',
      }

      const mockAdvisor = {
        id: advisorId,
        business_name: 'Test Advisory',
        subscription_tier: 'standard',
      }

      const mockGeneratedContent = {
        title: 'Understanding Mutual Funds',
        content_english: 'Mutual funds are investment vehicles...',
        content_hindi: 'म्यूचुअल फंड निवेश वाहन हैं...',
        category: 'educational',
        topic_family: 'mutual-funds',
      }

      const mockValidationResult = {
        isCompliant: true,
        complianceScore: 95,
        aiScore: 92,
        sebiChecks: {
          noMisleadingClaims: true,
          properDisclosures: true,
          balancedView: true,
        },
        suggestions: [],
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor as any)
      ;(prisma.contentPreferences.findUnique as jest.Mock).mockResolvedValue(mockPreferences as any)
      mockOpenAI.generateContent.mockResolvedValue(mockGeneratedContent)
      mockValidator.validateContent.mockResolvedValue(mockValidationResult)
      ;(prisma.demoContent.create as jest.Mock).mockResolvedValue({
        id: 'demo-123',
        ...mockGeneratedContent,
        advisorId,
        complianceScore: mockValidationResult.complianceScore,
        aiScore: mockValidationResult.aiScore,
        isCompliant: true,
        validationDetails: mockValidationResult,
        createdAt: new Date(),
      } as any)

      const startTime = Date.now()
      const result = await service.generateDemo(advisorId)
      const responseTime = Date.now() - startTime

      // Verify response structure
      expect(result).toMatchObject({
        content: expect.objectContaining({
          title: 'Understanding Mutual Funds',
          content_english: expect.any(String),
          content_hindi: expect.any(String),
        }),
        validation: expect.objectContaining({
          isCompliant: true,
          complianceScore: 95,
          aiScore: 92,
        }),
        metadata: expect.objectContaining({
          generatedFor: 'Test Advisory',
          tier: 'standard',
          languages: ['EN', 'HI'],
        }),
      })

      // Verify response time is under 3.5 seconds
      expect(responseTime).toBeLessThan(3500)

      // Verify AI service was called with correct parameters
      expect(mockOpenAI.generateContent).toHaveBeenCalledWith({
        topic: 'mutual-funds',
        contentType: 'educational',
        languages: ['EN', 'HI'],
        businessName: 'Test Advisory',
      })

      // Verify validation was performed
      expect(mockValidator.validateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content_english: mockGeneratedContent.content_english,
        })
      )
    })

    it('should handle preferences not found', async () => {
      const advisorId = 'advisor-456'

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue({
        id: advisorId,
        business_name: 'Test Advisory',
        subscription_tier: 'basic',
      } as any)
      ;(prisma.contentPreferences.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.generateDemo(advisorId)).rejects.toThrow(
        'Content preferences not found. Please set your preferences first.'
      )
    })

    it('should handle generation failure gracefully', async () => {
      const advisorId = 'advisor-789'
      const mockPreferences = {
        advisorId,
        languages: ['EN'],
        contentTypes: ['educational'],
        topics: ['equity'],
        frequency: 'daily',
        deliveryTime: '09:00',
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue({
        id: advisorId,
        business_name: 'Test Advisory',
        subscription_tier: 'basic',
      } as any)
      ;(prisma.contentPreferences.findUnique as jest.Mock).mockResolvedValue(mockPreferences as any)
      mockOpenAI.generateContent.mockRejectedValue(new Error('AI service unavailable'))

      await expect(service.generateDemo(advisorId)).rejects.toThrow(
        'Failed to generate demo content'
      )
    })

    it('should handle non-compliant content', async () => {
      const advisorId = 'advisor-999'
      const mockPreferences = {
        advisorId,
        languages: ['EN'],
        contentTypes: ['market-update'],
        topics: ['equity'],
        frequency: 'daily',
        deliveryTime: '09:00',
      }

      const mockGeneratedContent = {
        title: 'Market Update',
        content_english: 'Guaranteed returns of 50% in 30 days!', // Non-compliant
        category: 'market-update',
        topic_family: 'equity',
      }

      const mockValidationResult = {
        isCompliant: false,
        complianceScore: 35,
        aiScore: 40,
        sebiChecks: {
          noMisleadingClaims: false,
          properDisclosures: false,
          balancedView: false,
        },
        violations: ['Misleading return claims', 'No risk disclosure'],
        suggestions: ['Remove guaranteed return claims', 'Add risk disclosure'],
      }

      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue({
        id: advisorId,
        business_name: 'Test Advisory',
        subscription_tier: 'basic',
      } as any)
      ;(prisma.contentPreferences.findUnique as jest.Mock).mockResolvedValue(mockPreferences as any)
      mockOpenAI.generateContent.mockResolvedValue(mockGeneratedContent)
      mockValidator.validateContent.mockResolvedValue(mockValidationResult)

      const result = await service.generateDemo(advisorId)

      expect(result.validation.isCompliant).toBe(false)
      expect(result.validation.violations).toContain('Misleading return claims')
      expect(result.validation.suggestions).toContain('Remove guaranteed return claims')
    })
  })

  describe('getDemoHistory', () => {
    it('should retrieve demo content history for advisor', async () => {
      const advisorId = 'advisor-123'
      const mockHistory = [
        {
          id: 'demo-2',
          advisorId,
          title: 'Demo 2',
          content_english: 'Content 2',
          complianceScore: 88,
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 'demo-1',
          advisorId,
          title: 'Demo 1',
          content_english: 'Content 1',
          complianceScore: 95,
          createdAt: new Date('2024-01-01'),
        },
      ]

      ;(prisma.demoContent.findMany as jest.Mock).mockResolvedValue(mockHistory as any)

      const result = await service.getDemoHistory(advisorId)

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Demo 2') // Should be sorted by date desc
      expect(prisma.demoContent.findMany).toHaveBeenCalledWith({
        where: { advisorId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    })
  })

  describe('performance requirements', () => {
    it('should complete generation within 3.5 seconds', async () => {
      const advisorId = 'advisor-perf'
      
      // Setup minimal mocks for performance test
      ;(prisma.advisors.findUnique as jest.Mock).mockResolvedValue({
        id: advisorId,
        business_name: 'Perf Test',
        subscription_tier: 'pro',
      } as any)
      
      ;(prisma.contentPreferences.findUnique as jest.Mock).mockResolvedValue({
        advisorId,
        languages: ['EN', 'HI', 'GU'],
        contentTypes: ['educational'],
        topics: ['mutual-funds'],
      } as any)

      // Simulate realistic AI delays
      mockOpenAI.generateContent.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          title: 'Test',
          content_english: 'Test content',
          content_hindi: 'टेस्ट सामग्री',
          content_gujarati: 'ટેસ્ટ સામગ્રી',
        }), 1500)) // 1.5s AI generation
      )

      mockValidator.validateContent.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          isCompliant: true,
          complianceScore: 90,
          aiScore: 85,
        }), 800)) // 0.8s validation
      )

      ;(prisma.demoContent.create as jest.Mock).mockResolvedValue({} as any)

      const startTime = Date.now()
      await service.generateDemo(advisorId)
      const responseTime = Date.now() - startTime

      expect(responseTime).toBeLessThan(3500)
      expect(responseTime).toBeGreaterThan(2000) // Should take at least 2s with delays
    })
  })
})