/**
 * WhatsApp Scheduler Service Tests
 * Tests for automated 06:00 IST message scheduling with 99% SLA
 */

import { WhatsAppSchedulerService } from '@/lib/services/scheduler/whatsapp-scheduler';
import { createClient } from '@supabase/supabase-js';
import Bull from 'bull';
import { redis } from '@/lib/redis';
import { format, setHours, setMinutes, addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          in: jest.fn(() => ({
            data: [],
            error: null
          })),
          single: jest.fn(() => ({
            data: {},
            error: null
          }))
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
    }))
  }))
}));

jest.mock('bull');
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    mget: jest.fn()
  }
}));

describe('WhatsAppSchedulerService', () => {
  let scheduler: WhatsAppSchedulerService;
  let mockSupabase: any;
  let mockQueue: any;

  beforeEach(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => { cb(); return 0 as any; });
    jest.clearAllMocks();
    
    // Mock Bull queue
    mockQueue = {
      add: jest.fn(),
      process: jest.fn(),
      on: jest.fn(),
      getJobs: jest.fn(),
      removeRepeatableByKey: jest.fn(),
      clean: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      getJobCounts: jest.fn()
    };
    (Bull as jest.MockedClass<typeof Bull>).mockImplementation(() => mockQueue);
    
    scheduler = new WhatsAppSchedulerService();
    mockSupabase = createClient('', '');
  });

  describe('scheduleDailyDelivery', () => {
    it('should schedule messages for 06:00 IST delivery', async () => {
      const advisors = [
        { id: 'advisor-1', mobile: '9876543210', timezone: 'Asia/Kolkata' },
        { id: 'advisor-2', mobile: '9876543211', timezone: 'Asia/Kolkata' }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              data: advisors,
              error: null
            }))
          }))
        }))
      }));

      mockQueue.add.mockResolvedValue({ id: 'job-123' });

      const result = await scheduler.scheduleDailyDelivery();

      expect(result.scheduled_count).toBe(2);
      expect(result.scheduled_time).toContain('06:00');
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
      
      // Verify scheduling for 06:00 IST
      const scheduledTime = mockQueue.add.mock.calls[0][1].scheduledTime;
      const istTime = toZonedTime(new Date(scheduledTime), 'Asia/Kolkata');
      expect(istTime.getHours()).toBe(6);
      expect(istTime.getMinutes()).toBe(0);
    });

    it('should handle different timezones correctly', async () => {
      const advisors = [
        { id: 'advisor-1', mobile: '9876543210', timezone: 'Asia/Kolkata' },
        { id: 'advisor-2', mobile: '1234567890', timezone: 'America/New_York' }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              data: advisors,
              error: null
            }))
          }))
        }))
      }));

      await scheduler.scheduleDailyDelivery();

      expect(mockQueue.add).toHaveBeenCalledTimes(2);
      
      // Verify different scheduling times for different timezones
      const call1Time = mockQueue.add.mock.calls[0][1].scheduledTime;
      const call2Time = mockQueue.add.mock.calls[1][1].scheduledTime;
      expect(call1Time).not.toBe(call2Time);
    });

    it('should meet 99% SLA requirement', async () => {
      const advisors = Array(100).fill(null).map((_, i) => ({
        id: `advisor-${i}`,
        mobile: `98765432${i.toString().padStart(2, '0')}`,
        timezone: 'Asia/Kolkata'
      }));

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              data: advisors,
              error: null
            }))
          }))
        }))
      }));

      mockQueue.add.mockResolvedValue({ id: 'job-123' });

      const result = await scheduler.scheduleDailyDelivery();

      // Verify 99% are scheduled within 5-minute window (06:00-06:05)
      const scheduledJobs = mockQueue.add.mock.calls;
      const withinSLA = scheduledJobs.filter(call => {
        const time = new Date(call[1].scheduledTime);
        const istTime = toZonedTime(time, 'Asia/Kolkata');
        const hours = istTime.getHours();
        const minutes = istTime.getMinutes();
        return hours === 6 && minutes <= 5;
      });

      const slaPercentage = (withinSLA.length / scheduledJobs.length) * 100;
      expect(slaPercentage).toBeGreaterThanOrEqual(99);
    });
  });

  describe('assignFallbackContent', () => {
    it('should assign fallback content when advisor has no content', async () => {
      const advisorId = 'advisor-123';
      
      // Mock no content for advisor
      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'No content found' }
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'fallback-1',
                  content: 'Educational content about SIP benefits',
                  content_type: 'educational'
                },
                error: null
              }))
            }))
          }))
        });

      const fallbackContent = await scheduler.assignFallbackContent(advisorId);

      expect(fallbackContent).toBeDefined();
      expect(fallbackContent.content_type).toBe('educational');
      expect(fallbackContent.is_fallback).toBe(true);
    });

    it('should select seasonally relevant fallback content', async () => {
      const advisorId = 'advisor-123';
      const currentMonth = new Date().getMonth();
      
      // Tax season (Jan-Mar)
      if (currentMonth >= 0 && currentMonth <= 2) {
        mockSupabase.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn(() => ({
                data: [{
                  id: 'fallback-tax',
                  content: 'Tax saving with ELSS',
                  tags: ['tax', 'elss']
                }],
                error: null
              }))
            }))
          }))
        }));

        const fallback = await scheduler.assignFallbackContent(advisorId);
        expect(fallback.tags).toContain('tax');
      }
    });
  });

  describe('processDeliveryQueue', () => {
    it('should process scheduled messages at correct time', async () => {
      const jobs = [
        {
          id: 'job-1',
          data: {
            advisor_id: 'advisor-1',
            mobile: '9876543210',
            content_id: 'content-1',
            scheduled_time: new Date()
          }
        },
        {
          id: 'job-2',
          data: {
            advisor_id: 'advisor-2',
            mobile: '9876543211',
            content_id: 'content-2',
            scheduled_time: new Date()
          }
        }
      ];

      mockQueue.getJobs.mockResolvedValue(jobs);
      mockQueue.process.mockImplementation((callback) => {
        jobs.forEach(job => callback(job));
      });

      await scheduler.processDeliveryQueue();

      expect(mockQueue.process).toHaveBeenCalled();
      expect(mockQueue.getJobs).toHaveBeenCalled();
    });

    it('should handle delivery failures with retry logic', async () => {
      const job = {
        id: 'job-1',
        data: {
          advisor_id: 'advisor-1',
          mobile: '9876543210',
          content_id: 'content-1'
        },
        attemptsMade: 0,
        retry: jest.fn()
      };

      // Simulate delivery failure
      const deliveryError = new Error('Network timeout');
      mockQueue.process.mockImplementation(async (callback) => {
        await expect(callback(job)).rejects.toThrow(deliveryError);
      });

      await scheduler.processDeliveryQueue();

      // Verify retry was attempted
      expect(job.retry).toHaveBeenCalled();
    });
  });

  describe('monitorDeliveryStatus', () => {
    it('should track delivery success rate', async () => {
      const deliveryStats = {
        total: 100,
        delivered: 99,
        failed: 1,
        pending: 0
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: Array(deliveryStats.delivered).fill({ status: 'delivered' })
                .concat(Array(deliveryStats.failed).fill({ status: 'failed' })),
              error: null
            }))
          }))
        }))
      }));

      const status = await scheduler.monitorDeliveryStatus();

      expect(status.success_rate).toBe(0.99);
      expect(status.sla_met).toBe(true);
      expect(status.total_messages).toBe(100);
    });

    it('should alert when SLA is not met', async () => {
      const deliveryStats = {
        total: 100,
        delivered: 95,
        failed: 5
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: Array(deliveryStats.delivered).fill({ status: 'delivered' })
                .concat(Array(deliveryStats.failed).fill({ status: 'failed' })),
              error: null
            }))
          }))
        }))
      }));

      const status = await scheduler.monitorDeliveryStatus();

      expect(status.success_rate).toBe(0.95);
      expect(status.sla_met).toBe(false);
      expect(status.alert).toBeDefined();
      expect(status.alert.severity).toBe('high');
    });
  });

  describe('optimizeDeliveryTiming', () => {
    it('should stagger deliveries to prevent rate limiting', async () => {
      const advisors = Array(500).fill(null).map((_, i) => ({
        id: `advisor-${i}`,
        mobile: `98765432${i.toString().padStart(2, '0')}`
      }));

      const staggeredSchedule = await scheduler.optimizeDeliveryTiming(advisors);

      // Verify messages are staggered
      const uniqueTimes = new Set(staggeredSchedule.map(s => s.scheduled_time));
      expect(uniqueTimes.size).toBeGreaterThan(1);
      
      // Verify all within 5-minute window
      const times = staggeredSchedule.map(s => new Date(s.scheduled_time));
      const minTime = Math.min(...times.map(t => t.getTime()));
      const maxTime = Math.max(...times.map(t => t.getTime()));
      const windowMinutes = (maxTime - minTime) / (1000 * 60);
      expect(windowMinutes).toBeLessThanOrEqual(5);
    });

    it('should prioritize premium tier advisors', async () => {
      const advisors = [
        { id: 'advisor-1', subscription_tier: 'PRO', priority: 1 },
        { id: 'advisor-2', subscription_tier: 'BASIC', priority: 3 },
        { id: 'advisor-3', subscription_tier: 'STANDARD', priority: 2 }
      ];

      const schedule = await scheduler.optimizeDeliveryTiming(advisors);

      // PRO tier should be scheduled first
      const proSchedule = schedule.find(s => s.advisor_id === 'advisor-1');
      const basicSchedule = schedule.find(s => s.advisor_id === 'advisor-2');
      
      expect(new Date(proSchedule.scheduled_time).getTime())
        .toBeLessThan(new Date(basicSchedule.scheduled_time).getTime());
    });
  });

  describe('handleFailedDeliveries', () => {
    it('should implement exponential backoff for retries', async () => {
      const failedJob = {
        advisor_id: 'advisor-1',
        attempts: 2,
        last_error: 'Rate limit exceeded'
      };

      const retryDelay = await scheduler.calculateRetryDelay(failedJob.attempts);

      // Exponential backoff: 2^attempts * base_delay
      expect(retryDelay).toBe(Math.pow(2, failedJob.attempts) * 1000);
    });

    it('should use alternative WhatsApp number on quality issues', async () => {
      const failedDelivery = {
        advisor_id: 'advisor-1',
        error_type: 'quality_rating_low',
        primary_number: '+911234567890'
      };

      const alternativeNumber = await scheduler.selectAlternativeNumber(failedDelivery);

      expect(alternativeNumber).toBeDefined();
      expect(alternativeNumber).not.toBe(failedDelivery.primary_number);
    });
  });

  describe('generateDeliveryReport', () => {
    it('should generate comprehensive daily delivery report', async () => {
      const date = new Date();
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: [
                { status: 'delivered', delivered_at: date, advisor_id: 'advisor-1' },
                { status: 'delivered', delivered_at: date, advisor_id: 'advisor-2' },
                { status: 'failed', error: 'Network error', advisor_id: 'advisor-3' }
              ],
              error: null
            }))
          }))
        }))
      }));

      const report = await scheduler.generateDeliveryReport(date);

      expect(report.date).toEqual(date);
      expect(report.total_scheduled).toBe(3);
      expect(report.delivered).toBe(2);
      expect(report.failed).toBe(1);
      expect(report.success_rate).toBeCloseTo(0.667, 2);
      expect(report.sla_status).toBeDefined();
    });
  });

  describe('scheduleFallbackAssignment', () => {
    it('should schedule fallback at 21:30 IST for next day', async () => {
      const result = await scheduler.scheduleFallbackAssignment();

      // Verify scheduled for 21:30 IST
      const scheduledTime = mockQueue.add.mock.calls[0][1].scheduledTime;
      const istTime = toZonedTime(new Date(scheduledTime), 'Asia/Kolkata');
      expect(istTime.getHours()).toBe(21);
      expect(istTime.getMinutes()).toBe(30);
    });
  });

  describe('caching behavior', () => {
    it('should cache scheduled jobs', async () => {
      const advisorId = 'advisor-123';
      const jobData = {
        id: 'job-123',
        scheduled_time: new Date(),
        content_id: 'content-123'
      };

      await scheduler.cacheScheduledJob(advisorId, jobData);

      expect(redis.setex).toHaveBeenCalledWith(
        `schedule:${advisorId}`,
        86400, // 24 hours
        JSON.stringify(jobData)
      );
    });

    it('should use cached schedule when available', async () => {
      const advisorId = 'advisor-123';
      const cachedJob = {
        id: 'job-123',
        scheduled_time: new Date()
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedJob));

      const job = await scheduler.getScheduledJob(advisorId);

      expect(job).toEqual(cachedJob);
      expect(redis.get).toHaveBeenCalledWith(`schedule:${advisorId}`);
    });
  });

  describe('performance requirements', () => {
    it('should schedule 1000 messages within 5 seconds', async () => {
      const startTime = Date.now();
      
      const advisors = Array(1000).fill(null).map((_, i) => ({
        id: `advisor-${i}`,
        mobile: `98765432${i.toString().padStart(2, '0')}`
      }));

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              data: advisors,
              error: null
            }))
          }))
        }))
      }));

      mockQueue.add.mockResolvedValue({ id: 'job-123' });

      await scheduler.scheduleDailyDelivery();
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(5000);
    });

    it('should process queue with minimal latency', async () => {
      const jobs = Array(100).fill(null).map((_, i) => ({
        id: `job-${i}`,
        data: { advisor_id: `advisor-${i}` }
      }));

      mockQueue.getJobs.mockResolvedValue(jobs);
      
      const startTime = Date.now();
      await scheduler.processDeliveryQueue();
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(1000);
    });
  });
});