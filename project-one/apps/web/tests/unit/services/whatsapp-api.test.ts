import { WhatsAppCloudAPI, QualityRating, TemplateStatus } from '@/lib/services/whatsapp-cloud-api'

// Mock fetch
global.fetch = jest.fn()

describe('WhatsAppCloudAPI', () => {
  let whatsappAPI: WhatsAppCloudAPI
  
  beforeEach(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => { cb(); return 0 as any; });
    // Reset mocks
    jest.clearAllMocks()
    
    // Set environment variables
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id'
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'test_business_id'
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_access_token'
    process.env.WHATSAPP_VERIFY_TOKEN = 'test_verify_token'
    
    whatsappAPI = new WhatsAppCloudAPI()
  })

  describe('Phone Number Validation', () => {
    it('should validate correct Indian mobile numbers', () => {
      expect(whatsappAPI.validateIndianPhoneNumber('9876543210')).toBe(true)
      expect(whatsappAPI.validateIndianPhoneNumber('919876543210')).toBe(true)
      expect(whatsappAPI.validateIndianPhoneNumber('8123456789')).toBe(true)
      expect(whatsappAPI.validateIndianPhoneNumber('7000000000')).toBe(true)
      expect(whatsappAPI.validateIndianPhoneNumber('6999999999')).toBe(true)
    })

    it('should reject invalid Indian mobile numbers', () => {
      expect(whatsappAPI.validateIndianPhoneNumber('5123456789')).toBe(false) // Starts with 5
      expect(whatsappAPI.validateIndianPhoneNumber('123456789')).toBe(false) // Too short
      expect(whatsappAPI.validateIndianPhoneNumber('98765432101')).toBe(false) // Too long without country code
      expect(whatsappAPI.validateIndianPhoneNumber('1234567890')).toBe(false) // Starts with 1
    })

    it('should handle numbers with special characters', () => {
      expect(whatsappAPI.validateIndianPhoneNumber('+91-9876543210')).toBe(true)
      expect(whatsappAPI.validateIndianPhoneNumber('(+91) 9876543210')).toBe(true)
      expect(whatsappAPI.validateIndianPhoneNumber('98765 43210')).toBe(true)
    })
  })

  describe('Template Management', () => {
    it('should fetch and cache templates', async () => {
      const mockTemplate = {
        id: 'template_123',
        name: 'daily_market_update',
        language: 'en',
        status: 'APPROVED',
        category: 'MARKETING',
        components: [],
        quality_score: { score: 'GREEN', date: '2025-01-20' },
        last_updated: '2025-08-20T10:30:18.466Z'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockTemplate] })
      })

      const template = await whatsappAPI.getTemplate('daily_market_update', 'en')
      
      expect(template).toBeDefined()
      expect(template?.name).toBe('daily_market_update')
      expect(template?.status).toBe('APPROVED')
      
      // Verify caching by calling again - should not make another API call
      const cachedTemplate = await whatsappAPI.getTemplate('daily_market_update', 'en')
      expect(cachedTemplate).toEqual(template)
      expect(global.fetch).toHaveBeenCalledTimes(1) // Should use cache, not call API again
    })

    it('should create new templates', async () => {
      const mockResponse = {
        id: 'new_template_123',
        status: 'PENDING'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await whatsappAPI.createTemplate({
        name: 'test_template',
        category: 'MARKETING',
        language: 'en',
        components: []
      })

      expect(result.id).toBe('new_template_123')
      expect(result.status).toBe('PENDING')
    })
  })

  describe('Message Sending', () => {
    beforeEach(() => {
      // Mock getTemplate for all message sending tests
      const mockTemplate = {
        id: 'template_123',
        name: 'daily_market_update',
        language: 'en',
        status: 'APPROVED' as TemplateStatus,
        category: 'MARKETING' as const,
        components: [],
        quality_score: { score: 'GREEN' as QualityRating, date: '2025-01-20' },
        last_updated: '2025-08-20T10:30:18.466Z'
      }
      
      jest.spyOn(whatsappAPI, 'getTemplate').mockResolvedValue(mockTemplate)
    })
    
    it('should send template message successfully', async () => {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: '919876543210', wa_id: '919876543210' }],
        messages: [{ id: 'wamid.123456' }]
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      }) // Message send

      const response = await whatsappAPI.sendTemplate(
        '9876543210',
        'daily_market_update',
        'en',
        {
          param1: 'January 20, 2025',
          param2: 'Test Advisor',
          param3: 'Market is up',
          param4: 'Buy stocks',
          param5: 'Focus on IT',
          param6: 'INA000012345'
        }
      )

      expect(response.messages).toBeDefined()
      expect(response.messages?.[0].id).toBe('wamid.123456')
    })

    it('should handle rate limiting', async () => {
      const errorResponse = {
        error: {
          message: 'Rate limit exceeded',
          code: 131056
        }
      }

      // Mock getTemplate to avoid actual API call
      const mockTemplate = { status: 'APPROVED', components: [] }
      jest.spyOn(whatsappAPI, 'getTemplate').mockResolvedValue(mockTemplate as any)
      
      // Mock delay to avoid actual waiting
      jest.spyOn(whatsappAPI as any, 'delay').mockResolvedValue(undefined)
      
      // Mock checkRateLimit and updateRateLimit
      jest.spyOn(whatsappAPI as any, 'checkRateLimit').mockResolvedValue(undefined)
      jest.spyOn(whatsappAPI as any, 'updateRateLimit').mockReturnValue(undefined)

      // Mock all retry attempts to fail with the same error
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        })

      await expect(
        whatsappAPI.sendTemplate('9876543210', 'daily_market_update', 'en')
      ).rejects.toThrow('Rate limit exceeded')
    })

    it('should retry on failure with exponential backoff', async () => {
      // Mock getTemplate
      const mockTemplate = { status: 'APPROVED', components: [] }
      jest.spyOn(whatsappAPI, 'getTemplate').mockResolvedValue(mockTemplate as any)
      
      // Mock delay to avoid actual waiting
      jest.spyOn(whatsappAPI as any, 'delay').mockResolvedValue(undefined)
      
      const mockSuccess = {
        messaging_product: 'whatsapp',
        messages: [{ id: 'wamid.123' }]
      }

      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error')) // First attempt fails
        .mockRejectedValueOnce(new Error('Network error')) // Second attempt fails
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccess
        }) // Third attempt succeeds

      const response = await whatsappAPI.sendTemplate('9876543210', 'daily_market_update', 'en')
      
      expect(response.messages?.[0].id).toBe('wamid.123')
      expect(global.fetch).toHaveBeenCalledTimes(3) // 3 send attempts
    })
  })

  describe('Number Health Monitoring', () => {
    it('should fetch and cache number health', async () => {
      const mockHealth = {
        display_phone_number: '+919876543210',
        quality_rating: 'GREEN',
        messaging_limit: { current: 100, max: 1000 },
        status: 'ACTIVE'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth
      })

      const health = await whatsappAPI.getNumberHealth()
      
      expect(health.qualityRating).toBe('GREEN')
      expect(health.status).toBe('ACTIVE')
      expect(health.messagingLimit.max).toBe(1000)
      
      // Verify caching
      const cachedHealth = await whatsappAPI.getNumberHealth()
      expect(cachedHealth).toEqual(health)
      expect(global.fetch).toHaveBeenCalledTimes(1) // Should use cache
    })

    it('should map quality ratings correctly', async () => {
      const ratings: Array<[string, QualityRating]> = [
        ['GREEN', 'GREEN'],
        ['YELLOW', 'YELLOW'],
        ['RED', 'RED'],
        ['unknown', 'UNKNOWN'],
        ['', 'UNKNOWN']
      ]

      for (const [input, expected] of ratings) {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ quality_rating: input })
        })

        const health = await whatsappAPI.getNumberHealth(`test_${input}`)
        expect(health.qualityRating).toBe(expected)
      }
    })
  })

  describe('Media Upload', () => {
    it('should upload media successfully', async () => {
      const mockResponse = { id: 'media_123' }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const buffer = Buffer.from('test image data')
      const mediaId = await whatsappAPI.uploadMedia(buffer, 'image/jpeg')
      
      expect(mediaId).toBe('media_123')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/media'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_access_token'
          })
        })
      )
    })

    it('should handle media upload errors', async () => {
      const errorResponse = {
        error: {
          message: 'File too large',
          code: 131009
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse
      })

      const buffer = Buffer.from('test image data')
      await expect(
        whatsappAPI.uploadMedia(buffer, 'image/jpeg')
      ).rejects.toThrow('File too large')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock getTemplate for error handling tests
      const mockTemplate = {
        id: 'template_123',
        name: 'daily_market_update',
        language: 'en',
        status: 'APPROVED' as TemplateStatus,
        category: 'MARKETING' as const,
        components: [],
        quality_score: { score: 'GREEN' as QualityRating, date: '2025-01-20' },
        last_updated: '2025-08-20T10:30:18.466Z'
      }
      
      jest.spyOn(whatsappAPI, 'getTemplate').mockResolvedValue(mockTemplate)
    })
    
    it('should handle expired message window', async () => {
      const errorResponse = {
        error: {
          message: 'Message expired',
          code: 131051
        }
      }

      // Mock delay to avoid actual waiting during retries
      jest.spyOn(whatsappAPI as any, 'delay').mockResolvedValue(undefined)
      
      // Mock checkRateLimit and updateRateLimit
      jest.spyOn(whatsappAPI as any, 'checkRateLimit').mockResolvedValue(undefined)
      jest.spyOn(whatsappAPI as any, 'updateRateLimit').mockReturnValue(undefined)

      // Mock all retry attempts to fail with the same error
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        })

      await expect(
        whatsappAPI.sendTemplate('9876543210', 'daily_market_update', 'en')
      ).rejects.toThrow('Message window expired')
    })

    it('should handle user not on WhatsApp', async () => {
      const errorResponse = {
        error: {
          message: 'User not on WhatsApp',
          code: 131052
        }
      }

      // Mock delay to avoid actual waiting during retries
      jest.spyOn(whatsappAPI as any, 'delay').mockResolvedValue(undefined)
      
      // Mock checkRateLimit and updateRateLimit
      jest.spyOn(whatsappAPI as any, 'checkRateLimit').mockResolvedValue(undefined)
      jest.spyOn(whatsappAPI as any, 'updateRateLimit').mockReturnValue(undefined)

      // Mock all retry attempts to fail with the same error
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => errorResponse
        })

      await expect(
        whatsappAPI.sendTemplate('9876543210', 'daily_market_update', 'en')
      ).rejects.toThrow('Recipient is not on WhatsApp')
    })
  })

  describe('Configuration', () => {
    it('should throw error if configuration is incomplete', () => {
      delete process.env.WHATSAPP_PHONE_NUMBER_ID
      
      expect(() => new WhatsAppCloudAPI()).toThrow('WhatsApp Cloud API configuration is incomplete')
    })

    it('should accept custom configuration', () => {
      const customConfig = {
        phoneNumberId: 'custom_phone',
        businessAccountId: 'custom_business',
        accessToken: 'custom_token',
        verifyToken: 'custom_verify',
        apiVersion: 'v17.0',
        qualityRatingThreshold: 3,
        maxRetries: 5,
        retryDelayMs: 10000
      }

      const customAPI = new WhatsAppCloudAPI(customConfig)
      expect(customAPI).toBeDefined()
    })
  })
})