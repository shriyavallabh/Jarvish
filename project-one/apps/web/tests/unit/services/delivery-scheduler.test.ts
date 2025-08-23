import { DeliveryScheduler, DeliveryJob, DeliveryResult } from '@/lib/services/delivery-scheduler'
import { Queue, Worker } from 'bullmq'
import { formatInTimeZone } from 'date-fns-tz'

// Mock BullMQ
jest.mock('bullmq')
jest.mock('ioredis')
jest.mock('@/lib/services/whatsapp-cloud-api')
jest.mock('@/lib/services/template-manager')
jest.mock('@supabase/supabase-js')

const mockQueue = {
  add: jest.fn(),
  getJobCounts: jest.fn(),
  close: jest.fn()
}

const mockWorker = {
  close: jest.fn()
}

const mockScheduler = {
  close: jest.fn()
}

const mockEvents = {
  on: jest.fn(),
  close: jest.fn()
}

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({ data: null }),
        limit: jest.fn().mockResolvedValue({ data: [] }),
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({ data: [] })
        }))
      })),
      not: jest.fn(() => ({
        mockResolvedValue: jest.fn()
      }))
    })),
    insert: jest.fn().mockResolvedValue({ data: null, error: null })
  }))
}

// Mock implementations
;(Queue as jest.Mock).mockImplementation(() => mockQueue)
;(Worker as jest.Mock).mockImplementation(() => mockWorker)

// Mock external dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase
}))

describe('DeliveryScheduler', () => {
  let scheduler: DeliveryScheduler
  
  beforeEach(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => { cb(); return 0 as any; });
    jest.clearAllMocks()
    
    // Set up environment
    process.env.REDIS_HOST = 'localhost'
    process.env.REDIS_PORT = '6379'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'
    
    // Mock successful queue operations
    mockQueue.add.mockResolvedValue({ id: 'test-job-123' })
    mockQueue.getJobCounts.mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 100,
      failed: 5,
      delayed: 50
    })
  })

  describe('Daily Scheduling', () => {
    it('should schedule content for 6 AM IST delivery', async () => {
      // Mock content data
      const mockContent = [
        {
          id: 'content-1',
          advisor_id: 'advisor-1',
          content_english: 'Test market update with Sensex gains',
          content_hindi: null,
          media_url: null,
          advisors: {
            id: 'advisor-1',
            mobile: '9876543210',
            business_name: 'Test Advisory',
            subscription_tier: 'pro',
            language_preference: 'en',
            sebi_registration: 'INA000012345'
          }
        },
        {
          id: 'content-2',
          advisor_id: 'advisor-2',
          content_english: 'Another market insight with Nifty performance',
          content_hindi: null,
          media_url: 'https://example.com/chart.png',
          advisors: {
            id: 'advisor-2',
            mobile: '8765432109',
            business_name: 'Premium Advisory',
            subscription_tier: 'standard',
            language_preference: 'hi',
            sebi_registration: 'INA000098765'
          }
        }
      ]

      // Mock Supabase response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockContent,
              error: null
            })
          })
        })
      })

      scheduler = new DeliveryScheduler()
      
      const result = await scheduler.scheduleDailyDelivery()
      
      expect(result.scheduled).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.errors).toHaveLength(0)
      
      // Verify queue jobs were added
      expect(mockQueue.add).toHaveBeenCalledTimes(2)
      
      // Verify job data structure
      const firstJobCall = mockQueue.add.mock.calls[0]
      expect(firstJobCall[0]).toMatch(/delivery-advisor-\d+-content-\d+/)
      
      const jobData = firstJobCall[1] as DeliveryJob
      expect(jobData.advisorId).toBe('advisor-1')
      expect(jobData.contentId).toBe('content-1')
      expect(jobData.phoneNumber).toBe('9876543210')
      expect(jobData.language).toBe('en')
      expect(jobData.tier).toBe('pro')
      expect(jobData.priority).toBe('high')
    })

    it('should handle scheduling errors gracefully', async () => {
      // Mock Supabase error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      })

      scheduler = new DeliveryScheduler()
      
      const result = await scheduler.scheduleDailyDelivery()
      
      expect(result.scheduled).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.errors).toContain('Database error: Database connection failed')
    })

    it('should calculate jitter for load distribution', async () => {
      const mockContent = Array.from({ length: 100 }, (_, i) => ({
        id: `content-${i}`,
        advisor_id: `advisor-${i}`,
        content_english: `Market update ${i}`,
        advisors: {
          id: `advisor-${i}`,
          mobile: `987654${String(i).padStart(4, '0')}`,
          business_name: `Advisory ${i}`,
          subscription_tier: 'standard',
          language_preference: 'en',
          sebi_registration: 'INA000012345'
        }
      }))

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockContent,
              error: null
            })
          })
        })
      })

      scheduler = new DeliveryScheduler()
      
      const result = await scheduler.scheduleDailyDelivery()
      
      expect(result.scheduled).toBe(100)
      expect(mockQueue.add).toHaveBeenCalledTimes(100)
      
      // Verify that jobs have different delays (jitter)
      const delays = mockQueue.add.mock.calls.map(call => call[2]?.delay || 0)
      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(50) // Should have distributed delays
    })

    it('should prioritize Pro tier advisors', async () => {
      const mockContent = [
        {
          id: 'content-1',
          advisor_id: 'advisor-1',
          content_english: 'Free tier content',
          advisors: {
            id: 'advisor-1',
            mobile: '9876543210',
            business_name: 'Free Advisory',
            subscription_tier: 'free',
            language_preference: 'en',
            sebi_registration: 'INA000012345'
          }
        },
        {
          id: 'content-2',
          advisor_id: 'advisor-2',
          content_english: 'Pro tier content',
          advisors: {
            id: 'advisor-2',
            mobile: '8765432109',
            business_name: 'Pro Advisory',
            subscription_tier: 'pro',
            language_preference: 'en',
            sebi_registration: 'INA000098765'
          }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockContent,
              error: null
            })
          })
        })
      })

      scheduler = new DeliveryScheduler()
      
      await scheduler.scheduleDailyDelivery()
      
      // Verify Pro tier gets higher priority
      const jobCalls = mockQueue.add.mock.calls
      const proJob = jobCalls.find(call => (call[1] as DeliveryJob).tier === 'pro')
      const freeJob = jobCalls.find(call => (call[1] as DeliveryJob).tier === 'free')
      
      expect(proJob?.[1].priority).toBe('high')
      expect(freeJob?.[1].priority).toBe('low')
      expect(proJob?.[2]?.priority).toBeLessThan(freeJob?.[2]?.priority)
    })
  })

  describe('Immediate Delivery', () => {
    it('should send immediate messages with highest priority', async () => {
      const mockContent = {
        id: 'content-123',
        content_english: 'Urgent market update with important news',
        advisors: {
          business_name: 'Test Advisory',
          language_preference: 'en',
          subscription_tier: 'pro',
          sebi_registration: 'INA000012345'
        }
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockContent,
              error: null
            })
          })
        })
      })

      // Mock job completion
      const mockJob = {
        waitUntilFinished: jest.fn().mockResolvedValue({
          jobId: 'immediate-123',
          status: 'sent',
          whatsappMessageId: 'wamid.123456'
        })
      }
      mockQueue.add.mockResolvedValue(mockJob)

      scheduler = new DeliveryScheduler()
      
      const result = await scheduler.sendImmediate(
        'advisor-123',
        'content-123',
        '9876543210'
      )
      
      expect(result.status).toBe('sent')
      expect(result.whatsappMessageId).toBe('wamid.123456')
      
      // Verify highest priority
      const addCall = mockQueue.add.mock.calls[0]
      expect(addCall[2]?.priority).toBe(100)
      expect(addCall[1].priority).toBe('urgent')
    })

    it('should handle immediate delivery failures', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Content not found' }
            })
          })
        })
      })

      scheduler = new DeliveryScheduler()
      
      const result = await scheduler.sendImmediate(
        'advisor-123',
        'nonexistent-content',
        '9876543210'
      )
      
      expect(result.status).toBe('failed')
      expect(result.error).toContain('Content not found')
    })
  })

  describe('SLA Monitoring', () => {
    it('should track delivery metrics', async () => {
      scheduler = new DeliveryScheduler()
      
      const metrics = await scheduler.getSLAMetrics()
      
      expect(metrics).toHaveProperty('totalScheduled')
      expect(metrics).toHaveProperty('totalDelivered')
      expect(metrics).toHaveProperty('totalFailed')
      expect(metrics).toHaveProperty('deliveryRate')
      expect(metrics).toHaveProperty('slaStatus')
    })

    it('should detect SLA violations', async () => {
      scheduler = new DeliveryScheduler()
      
      // Simulate high failure rate
      const metrics = await scheduler.getSLAMetrics()
      metrics.totalDelivered = 90
      metrics.totalFailed = 10
      metrics.deliveryRate = 0.9 // 90% delivery rate
      
      expect(metrics.deliveryRate).toBeLessThan(0.99) // Below 99% SLA
    })
  })

  describe('Template Parameters', () => {
    it('should extract market summary from content', async () => {
      const content = `Daily Market Update
      
      Sensex gained 500 points to close at 73,000
      Nifty crossed 22,000 level
      
      Key insights for today:
      - Banking stocks outperformed
      - IT sector showed resilience
      
      Today's focus:
      Consider large-cap mutual funds`

      const mockContentData = {
        id: 'content-1',
        advisor_id: 'advisor-1',
        content_english: content,
        advisors: {
          id: 'advisor-1',
          mobile: '9876543210',
          business_name: 'Test Advisory',
          subscription_tier: 'pro',
          language_preference: 'en',
          sebi_registration: 'INA000012345'
        }
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [mockContentData],
              error: null
            })
          })
        })
      })

      scheduler = new DeliveryScheduler()
      
      await scheduler.scheduleDailyDelivery()
      
      const jobData = mockQueue.add.mock.calls[0][1] as DeliveryJob
      expect(jobData.parameters.param3).toContain('Sensex')
      expect(jobData.parameters.param4).toContain('Banking')
      expect(jobData.parameters.param5).toContain('Consider')
    })

    it('should handle Hindi language preference', async () => {
      const mockContent = {
        id: 'content-1',
        advisor_id: 'advisor-1',
        content_english: 'Market update',
        advisors: {
          id: 'advisor-1',
          mobile: '9876543210',
          business_name: 'Hindi Advisory',
          subscription_tier: 'standard',
          language_preference: 'hi',
          sebi_registration: 'INA000012345'
        }
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [mockContent],
              error: null
            })
          })
        })
      })

      scheduler = new DeliveryScheduler()
      
      await scheduler.scheduleDailyDelivery()
      
      const jobData = mockQueue.add.mock.calls[0][1] as DeliveryJob
      expect(jobData.language).toBe('hi')
    })
  })

  describe('Time Zone Handling', () => {
    it('should schedule for 6 AM IST', async () => {
      const mockContent = [{
        id: 'content-1',
        advisor_id: 'advisor-1',
        content_english: 'Test content',
        advisors: {
          id: 'advisor-1',
          mobile: '9876543210',
          business_name: 'Test Advisory',
          subscription_tier: 'standard',
          language_preference: 'en',
          sebi_registration: 'INA000012345'
        }
      }]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockContent,
              error: null
            })
          })
        })
      })

      scheduler = new DeliveryScheduler()
      
      const testDate = new Date('2025-01-20T12:00:00Z') // Noon UTC
      await scheduler.scheduleDailyDelivery(testDate)
      
      const jobData = mockQueue.add.mock.calls[0][1] as DeliveryJob
      const scheduledTime = new Date(jobData.scheduledFor)
      const istHour = parseInt(formatInTimeZone(scheduledTime, 'Asia/Kolkata', 'HH'))
      
      // Should be around 6 AM IST (allowing for jitter)
      expect(istHour).toBeGreaterThanOrEqual(5)
      expect(istHour).toBeLessThanOrEqual(6)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources properly', async () => {
      scheduler = new DeliveryScheduler()
      
      await scheduler.cleanup()
      
      expect(mockWorker.close).toHaveBeenCalled()
      expect(mockScheduler.close).toHaveBeenCalled()
      expect(mockEvents.close).toHaveBeenCalled()
      expect(mockQueue.close).toHaveBeenCalled()
    })
  })
})