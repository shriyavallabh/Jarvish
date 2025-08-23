/**
 * WhatsApp Scheduler Service Tests
 * Tests for 06:00 IST delivery scheduling with 99% SLA
 */

import { WhatsAppSchedulerService } from '@/lib/services/whatsapp-scheduler';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bull';
import { redis } from '@/lib/redis';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {},
            error: null
          })),
          data: [],
          error: null
        })),
        in: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        data: {},
        error: null
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null
        }))
      }))
    })),
    rpc: jest.fn()
  }))
}));

jest.mock('bull', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
    getJobs: jest.fn(),
    removeJobs: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getJobCounts: jest.fn(),
    obliterate: jest.fn()
  }))
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    zadd: jest.fn(),
    zrange: jest.fn(),
    zrem: jest.fn()
  }
}));

describe('WhatsAppSchedulerService', () => {
  let schedulerService: WhatsAppSchedulerService;
  let mockSupabase: any;
  let mockQueue: any;

  beforeEach(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => { cb(); return 0 as any; });
    jest.clearAllMocks();
    schedulerService = new WhatsAppSchedulerService();
    mockSupabase = createClient('', '');
    mockQueue = new Queue('whatsapp-delivery');
  });

  describe('06:00 IST Scheduling', () => {
    it('should schedule messages for 06:00 IST delivery', async () => {
      const advisors = [
        { id: '1', phone: '9876543210', tier: 'PRO' },
        { id: '2', phone: '9876543211', tier: 'STANDARD' }
      ];

      const content = {
        id: 'content-123',
        text: 'Market update for today',
        language: 'en'
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: advisors,
            error: null
          }))
        }))
      }));

      await schedulerService.scheduleDailyDelivery(content);

      expect(mockQueue.add).toHaveBeenCalledTimes(2);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'deliver-message',
        expect.objectContaining({
          advisorId: '1',
          phone: '9876543210',
          content: content,
          scheduledFor: expect.stringContaining('06:00')
        }),
        expect.objectContaining({
          delay: expect.any(Number),
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        })
      );
    });

    it('should calculate correct delay for next 06:00 IST', () => {
      const now = new Date('2024-01-20T10:00:00+05:30'); // 10:00 IST
      const nextDelivery = schedulerService.calculateNextDeliveryTime(now);
      
      expect(nextDelivery.getHours()).toBe(6);
      expect(nextDelivery.getMinutes()).toBe(0);
      expect(nextDelivery.getDate()).toBe(21); // Next day
    });

    it('should handle DST transitions correctly', () => {
      // Test various dates throughout the year
      const dates = [
        new Date('2024-03-15T10:00:00+05:30'),
        new Date('2024-06-15T10:00:00+05:30'),
        new Date('2024-10-15T10:00:00+05:30'),
        new Date('2024-12-15T10:00:00+05:30')
      ];

      dates.forEach(date => {
        const nextDelivery = schedulerService.calculateNextDeliveryTime(date);
        expect(nextDelivery.getHours()).toBe(6);
        expect(nextDelivery.getMinutes()).toBe(0);
      });
    });
  });

  describe('Delivery Queue Management', () => {
    it('should batch messages for efficient delivery', async () => {
      const advisors = Array(100).fill(null).map((_, i) => ({
        id: `advisor-${i}`,
        phone: `98765432${i.toString().padStart(2, '0')}`,
        tier: 'STANDARD'
      }));

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          data: advisors,
          error: null
        }))
      }));

      await schedulerService.batchScheduleDelivery(advisors, 'content-123');

      // Should batch in groups of 25 (WhatsApp rate limit)
      expect(mockQueue.add).toHaveBeenCalledTimes(4); // 100/25 = 4 batches
    });

    it('should prioritize Pro tier advisors', async () => {
      const advisors = [
        { id: '1', phone: '9876543210', tier: 'BASIC', priority: 3 },
        { id: '2', phone: '9876543211', tier: 'PRO', priority: 1 },
        { id: '3', phone: '9876543212', tier: 'STANDARD', priority: 2 }
      ];

      await schedulerService.prioritizeDelivery(advisors);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'deliver-message',
        expect.objectContaining({ advisorId: '2' }), // PRO first
        expect.objectContaining({ priority: 1 })
      );
    });

    it('should implement retry logic with exponential backoff', async () => {
      const job = {
        id: 'job-123',
        data: { advisorId: '1', attempts: 1 },
        attemptsMade: 1
      };

      await schedulerService.retryFailedDelivery(job);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'deliver-message',
        job.data,
        expect.objectContaining({
          delay: 2000, // 2^1 * 1000ms
          attempts: 2
        })
      );
    });

    it('should respect rate limits', async () => {
      const startTime = Date.now();
      
      // Simulate sending 100 messages
      for (let i = 0; i < 100; i++) {
        await schedulerService.sendWithRateLimit({
          phone: `98765432${i.toString().padStart(2, '0')}`,
          content: 'Test message'
        });
      }

      const timeTaken = Date.now() - startTime;
      
      // Should take at least 4 seconds for 100 messages (25 per second limit)
      expect(timeTaken).toBeGreaterThanOrEqual(4000);
    });
  });

  describe('99% SLA Monitoring', () => {
    it('should track delivery success rate', async () => {
      const deliveries = [
        { id: '1', status: 'delivered', timestamp: new Date() },
        { id: '2', status: 'delivered', timestamp: new Date() },
        { id: '3', status: 'failed', timestamp: new Date() }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: deliveries,
              error: null
            }))
          }))
        }))
      }));

      const sla = await schedulerService.calculateSLA(new Date());

      expect(sla.successRate).toBeCloseTo(0.667, 2); // 2/3 successful
      expect(sla.totalDeliveries).toBe(3);
      expect(sla.failedDeliveries).toBe(1);
    });

    it('should alert when SLA drops below 99%', async () => {
      const sla = {
        successRate: 0.985, // 98.5%
        threshold: 0.99
      };

      const alert = await schedulerService.checkSLACompliance(sla);

      expect(alert.triggered).toBe(true);
      expect(alert.message).toContain('below 99% threshold');
      expect(alert.severity).toBe('high');
    });

    it('should track delivery time performance', async () => {
      const deliveries = [
        { scheduled: '06:00:00', delivered: '06:02:30' },
        { scheduled: '06:00:00', delivered: '06:04:15' },
        { scheduled: '06:00:00', delivered: '06:05:45' }
      ];

      const metrics = await schedulerService.analyzeDeliveryTimes(deliveries);

      expect(metrics.averageDelay).toBeCloseTo(4.17, 2); // Average ~4.17 minutes
      expect(metrics.within5Minutes).toBeCloseTo(0.667, 2); // 2/3 within 5 mins
      expect(metrics.slaCompliant).toBe(false); // Not 99% within 5 mins
    });
  });

  describe('Fallback Content Handling', () => {
    it('should assign fallback content at 21:30 IST', async () => {
      const advisorsWithoutContent = [
        { id: '1', phone: '9876543210' },
        { id: '2', phone: '9876543211' }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          is: jest.fn(() => ({
            data: advisorsWithoutContent,
            error: null
          }))
        }))
      }));

      const now = new Date('2024-01-20T21:30:00+05:30');
      await schedulerService.assignFallbackContent(now);

      expect(mockSupabase.from).toHaveBeenCalledWith('advisor_content');
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should select appropriate fallback content', async () => {
      const fallbackPacks = [
        { id: 'pack-1', type: 'evergreen', relevance_score: 0.95 },
        { id: 'pack-2', type: 'seasonal', relevance_score: 0.75 },
        { id: 'pack-3', type: 'educational', relevance_score: 0.85 }
      ];

      const selected = await schedulerService.selectFallbackContent(
        'advisor-123',
        fallbackPacks
      );

      expect(selected.id).toBe('pack-1'); // Highest relevance
      expect(selected.relevance_score).toBe(0.95);
    });

    it('should prevent duplicate fallback assignments', async () => {
      const advisorId = 'advisor-123';
      const date = '2024-01-20';

      // First assignment
      await schedulerService.assignFallback(advisorId, 'content-1', date);
      
      // Second attempt
      const result = await schedulerService.assignFallback(advisorId, 'content-2', date);

      expect(result.assigned).toBe(false);
      expect(result.reason).toBe('Already has fallback for this date');
    });
  });

  describe('Multi-Number Strategy', () => {
    it('should rotate between multiple WhatsApp numbers', async () => {
      const numbers = [
        { id: 'num-1', phone: '919876543210', quality: 'GREEN' },
        { id: 'num-2', phone: '919876543211', quality: 'GREEN' },
        { id: 'num-3', phone: '919876543212', quality: 'YELLOW' }
      ];

      await schedulerService.initializeNumbers(numbers);

      const selectedNumbers = [];
      for (let i = 0; i < 6; i++) {
        const number = await schedulerService.selectDeliveryNumber();
        selectedNumbers.push(number.id);
      }

      // Should rotate and prefer GREEN quality
      expect(selectedNumbers.filter(n => n === 'num-1').length).toBeGreaterThan(0);
      expect(selectedNumbers.filter(n => n === 'num-2').length).toBeGreaterThan(0);
      expect(selectedNumbers.filter(n => n === 'num-3').length).toBeLessThan(3);
    });

    it('should handle number quality degradation', async () => {
      const number = {
        id: 'num-1',
        phone: '919876543210',
        quality: 'GREEN',
        failures: 0
      };

      // Simulate failures
      for (let i = 0; i < 5; i++) {
        await schedulerService.recordDeliveryFailure(number.id);
      }

      const updatedNumber = await schedulerService.getNumberStatus(number.id);
      
      expect(updatedNumber.quality).toBe('YELLOW');
      expect(updatedNumber.cooldownUntil).toBeDefined();
    });
  });

  describe('Queue Health Monitoring', () => {
    it('should monitor queue size and processing rate', async () => {
      mockQueue.getJobCounts = jest.fn().mockResolvedValue({
        waiting: 150,
        active: 25,
        completed: 2000,
        failed: 5
      });

      const health = await schedulerService.getQueueHealth();

      expect(health.queueSize).toBe(175); // waiting + active
      expect(health.failureRate).toBeCloseTo(0.0025, 4); // 5/2005
      expect(health.status).toBe('healthy');
    });

    it('should detect queue congestion', async () => {
      mockQueue.getJobCounts = jest.fn().mockResolvedValue({
        waiting: 5000,
        active: 100,
        completed: 1000,
        failed: 50
      });

      const health = await schedulerService.getQueueHealth();

      expect(health.status).toBe('congested');
      expect(health.alert).toBe(true);
      expect(health.recommendation).toContain('scale');
    });

    it('should auto-scale processing based on load', async () => {
      const load = {
        current: 5000,
        threshold: 1000,
        workers: 2
      };

      const scaling = await schedulerService.autoScale(load);

      expect(scaling.newWorkers).toBeGreaterThan(2);
      expect(scaling.action).toBe('scale-up');
    });
  });

  describe('Delivery Confirmation', () => {
    it('should track WhatsApp delivery receipts', async () => {
      const webhook = {
        statuses: [{
          id: 'wamid.123',
          status: 'delivered',
          timestamp: '1705728000',
          recipient_id: '919876543210'
        }]
      };

      await schedulerService.processWebhook(webhook);

      expect(mockSupabase.from).toHaveBeenCalledWith('whatsapp_deliveries');
      expect(mockSupabase.from().update).toHaveBeenCalled();
    });

    it('should handle delivery failures and trigger retries', async () => {
      const webhook = {
        statuses: [{
          id: 'wamid.456',
          status: 'failed',
          errors: [{ code: 131051, title: 'Message Expired' }]
        }]
      };

      const result = await schedulerService.processWebhook(webhook);

      expect(result.retry).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'retry-delivery',
        expect.any(Object)
      );
    });
  });

  describe('Emergency Controls', () => {
    it('should pause all deliveries immediately', async () => {
      await schedulerService.pauseAllDeliveries('System maintenance');

      expect(mockQueue.pause).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith('scheduler:paused', 'true');
    });

    it('should resume deliveries with catch-up logic', async () => {
      const missedDeliveries = [
        { id: '1', scheduledFor: '06:00:00' },
        { id: '2', scheduledFor: '06:00:00' }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: missedDeliveries,
            error: null
          }))
        }))
      }));

      await schedulerService.resumeDeliveries(true); // with catch-up

      expect(mockQueue.resume).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledTimes(2); // Catch-up deliveries
    });

    it('should clear queue in emergency', async () => {
      await schedulerService.emergencyClearQueue();

      expect(mockQueue.obliterate).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith('scheduler:queue');
    });
  });

  describe('Caching and Performance', () => {
    it('should cache advisor phone numbers', async () => {
      const advisors = [
        { id: '1', phone: '9876543210' },
        { id: '2', phone: '9876543211' }
      ];

      await schedulerService.cacheAdvisorPhones(advisors);

      expect(redis.setex).toHaveBeenCalledTimes(2);
      expect(redis.setex).toHaveBeenCalledWith(
        'advisor:phone:1',
        86400, // 24 hours
        '9876543210'
      );
    });

    it('should use cached data when available', async () => {
      (redis.get as jest.Mock).mockResolvedValue('9876543210');

      const phone = await schedulerService.getAdvisorPhone('advisor-123');

      expect(phone).toBe('9876543210');
      expect(mockSupabase.from).not.toHaveBeenCalled(); // Used cache
    });
  });
});