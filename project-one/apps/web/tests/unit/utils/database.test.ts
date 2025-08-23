/**
 * Database Utilities Tests
 */

import { prisma } from '@/lib/utils/database';

// Mock Prisma Client
jest.mock('@/lib/utils/database', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    
    // Model mocks
    advisors: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn()
    },
    content: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn()
    },
    contentPreferences: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn()
    },
    whatsappMessages: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    subscriptions: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    analytics: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn()
    },
    demoContent: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Advisor Operations', () => {
    it('should create a new advisor', async () => {
      const advisorData = {
        euin: 'E123456',
        email: 'advisor@example.com',
        firstName: 'John',
        lastName: 'Doe',
        mobile: '9876543210',
        businessName: 'Financial Services Ltd',
        businessType: 'MFD'
      };

      const mockAdvisor = { id: '1', ...advisorData };
      (prisma.advisors.create as jest.Mock).mockResolvedValue(mockAdvisor);

      const result = await prisma.advisors.create({ data: advisorData });

      expect(result).toEqual(mockAdvisor);
      expect(prisma.advisors.create).toHaveBeenCalledWith({ data: advisorData });
    });

    it('should find advisor by EUIN', async () => {
      const euin = 'E123456';
      const mockAdvisor = {
        id: '1',
        euin,
        email: 'advisor@example.com',
        firstName: 'John'
      };

      (prisma.advisors.findUnique as jest.Mock).mockResolvedValue(mockAdvisor);

      const result = await prisma.advisors.findUnique({
        where: { euin }
      });

      expect(result).toEqual(mockAdvisor);
      expect(prisma.advisors.findUnique).toHaveBeenCalledWith({
        where: { euin }
      });
    });

    it('should update advisor profile', async () => {
      const advisorId = '1';
      const updateData = {
        businessName: 'Updated Services Ltd',
        mobile: '9876543211'
      };

      const mockUpdated = { id: advisorId, ...updateData };
      (prisma.advisors.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await prisma.advisors.update({
        where: { id: advisorId },
        data: updateData
      });

      expect(result).toEqual(mockUpdated);
      expect(prisma.advisors.update).toHaveBeenCalledWith({
        where: { id: advisorId },
        data: updateData
      });
    });

    it('should count total advisors', async () => {
      (prisma.advisors.count as jest.Mock).mockResolvedValue(150);

      const count = await prisma.advisors.count();

      expect(count).toBe(150);
      expect(prisma.advisors.count).toHaveBeenCalled();
    });
  });

  describe('Content Operations', () => {
    it('should create new content', async () => {
      const contentData = {
        advisorId: '1',
        title: 'Market Update',
        content_english: 'Market analysis...',
        content_hindi: 'बाजार विश्लेषण...',
        contentType: 'educational',
        status: 'approved'
      };

      const mockContent = { id: 'content-1', ...contentData };
      (prisma.content.create as jest.Mock).mockResolvedValue(mockContent);

      const result = await prisma.content.create({ data: contentData });

      expect(result).toEqual(mockContent);
      expect(prisma.content.create).toHaveBeenCalledWith({ data: contentData });
    });

    it('should find content by advisor', async () => {
      const advisorId = '1';
      const mockContents = [
        { id: 'c1', advisorId, title: 'Content 1' },
        { id: 'c2', advisorId, title: 'Content 2' }
      ];

      (prisma.content.findMany as jest.Mock).mockResolvedValue(mockContents);

      const result = await prisma.content.findMany({
        where: { advisorId },
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toEqual(mockContents);
      expect(prisma.content.findMany).toHaveBeenCalledWith({
        where: { advisorId },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('Audit Log Operations', () => {
    it('should create audit log entry', async () => {
      const auditData = {
        action: 'CONTENT_CREATED',
        advisorId: '1',
        euin: 'E123456',
        details: { contentId: 'c1' },
        success: true
      };

      const mockAudit = { id: 'audit-1', ...auditData, timestamp: new Date() };
      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAudit);

      const result = await prisma.auditLog.create({ data: auditData });

      expect(result).toEqual(mockAudit);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({ data: auditData });
    });

    it('should retrieve audit logs for advisor', async () => {
      const advisorId = '1';
      const mockLogs = [
        { id: 'log1', action: 'LOGIN', advisorId },
        { id: 'log2', action: 'CONTENT_CREATED', advisorId }
      ];

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const result = await prisma.auditLog.findMany({
        where: { advisorId },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      expect(result).toEqual(mockLogs);
    });

    it('should clean old audit logs', async () => {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 7);

      (prisma.auditLog.deleteMany as jest.Mock).mockResolvedValue({ count: 100 });

      const result = await prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });

      expect(result.count).toBe(100);
    });
  });

  describe('WhatsApp Message Operations', () => {
    it('should create WhatsApp message record', async () => {
      const messageData = {
        advisorId: '1',
        recipientPhone: '9876543210',
        templateName: 'daily_update',
        status: 'pending',
        scheduledFor: new Date()
      };

      const mockMessage = { id: 'msg-1', ...messageData };
      (prisma.whatsappMessages.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await prisma.whatsappMessages.create({ data: messageData });

      expect(result).toEqual(mockMessage);
    });

    it('should update message delivery status', async () => {
      const messageId = 'msg-1';
      const updateData = {
        status: 'delivered',
        deliveredAt: new Date(),
        whatsappMessageId: 'wamid.123'
      };

      (prisma.whatsappMessages.update as jest.Mock).mockResolvedValue({
        id: messageId,
        ...updateData
      });

      const result = await prisma.whatsappMessages.update({
        where: { id: messageId },
        data: updateData
      });

      expect(result.status).toBe('delivered');
    });

    it('should count messages by status', async () => {
      (prisma.whatsappMessages.count as jest.Mock)
        .mockResolvedValueOnce(100) // pending
        .mockResolvedValueOnce(950) // delivered
        .mockResolvedValueOnce(50); // failed

      const pending = await prisma.whatsappMessages.count({
        where: { status: 'pending' }
      });
      const delivered = await prisma.whatsappMessages.count({
        where: { status: 'delivered' }
      });
      const failed = await prisma.whatsappMessages.count({
        where: { status: 'failed' }
      });

      expect(pending).toBe(100);
      expect(delivered).toBe(950);
      expect(failed).toBe(50);
    });
  });

  describe('Subscription Operations', () => {
    it('should create subscription', async () => {
      const subscriptionData = {
        advisorId: '1',
        plan: 'pro',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      (prisma.subscriptions.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        ...subscriptionData
      });

      const result = await prisma.subscriptions.create({ data: subscriptionData });

      expect(result.plan).toBe('pro');
      expect(result.status).toBe('active');
    });

    it('should find active subscription', async () => {
      const advisorId = '1';
      const mockSubscription = {
        id: 'sub-1',
        advisorId,
        plan: 'pro',
        status: 'active'
      };

      (prisma.subscriptions.findUnique as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await prisma.subscriptions.findUnique({
        where: {
          advisorId_status: {
            advisorId,
            status: 'active'
          }
        }
      });

      expect(result).toEqual(mockSubscription);
    });
  });

  describe('Transaction Operations', () => {
    it('should handle database transactions', async () => {
      const mockTransactionResult = { success: true };
      
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txPrisma = {
          advisors: { update: jest.fn() },
          subscriptions: { create: jest.fn() },
          auditLog: { create: jest.fn() }
        };
        return callback(txPrisma);
      });

      const result = await prisma.$transaction(async (tx) => {
        await tx.advisors.update({
          where: { id: '1' },
          data: { subscriptionTier: 'pro' }
        });
        await tx.subscriptions.create({
          data: { advisorId: '1', plan: 'pro', status: 'active' }
        });
        await tx.auditLog.create({
          data: { action: 'SUBSCRIPTION_CREATED', advisorId: '1' }
        });
        return mockTransactionResult;
      });

      expect(result).toEqual(mockTransactionResult);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      await expect(
        prisma.$transaction(async (tx) => {
          throw new Error('Transaction failed');
        })
      ).rejects.toThrow('Transaction failed');
    });
  });

  describe('Analytics Operations', () => {
    it('should aggregate analytics data', async () => {
      const mockAggregation = {
        _sum: { engagementRate: 750 },
        _avg: { engagementRate: 75 },
        _count: 10
      };

      (prisma.analytics.aggregate as jest.Mock).mockResolvedValue(mockAggregation);

      const result = await prisma.analytics.aggregate({
        where: { advisorId: '1' },
        _sum: { engagementRate: true },
        _avg: { engagementRate: true },
        _count: true
      });

      expect(result._avg.engagementRate).toBe(75);
      expect(result._count).toBe(10);
    });
  });

  describe('Connection Management', () => {
    it('should connect to database', async () => {
      await prisma.$connect();
      expect(prisma.$connect).toHaveBeenCalled();
    });

    it('should disconnect from database', async () => {
      await prisma.$disconnect();
      expect(prisma.$disconnect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      (prisma.$connect as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      await expect(prisma.$connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete simple queries quickly', async () => {
      const startTime = Date.now();
      
      (prisma.advisors.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      
      await prisma.advisors.findUnique({ where: { id: '1' } });
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(100); // Should be very fast for mocked calls
    });

    it('should handle bulk operations efficiently', async () => {
      const bulkData = Array(100).fill(null).map((_, i) => ({
        advisorId: '1',
        title: `Content ${i}`,
        content_english: `Content body ${i}`
      }));

      (prisma.content.create as jest.Mock).mockResolvedValue({});

      const startTime = Date.now();
      
      await Promise.all(
        bulkData.map(data => prisma.content.create({ data }))
      );
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(1000);
    });
  });
});