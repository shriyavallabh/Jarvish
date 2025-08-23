import { Router } from 'express';
import distributionService from '../services/distribution.service';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// WhatsApp webhook (public)
router.post('/webhook/whatsapp', async (req, res) => {
  try {
    // Verify webhook (for initial setup)
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.send(req.query['hub.challenge']);
    }

    // Process webhook
    await distributionService.handleWhatsAppWebhook(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.sendStatus(500);
  }
});

// Protected routes
router.use(authenticateJWT);

// Get distribution status
router.get('/status', async (req, res, next) => {
  try {
    const status = await distributionService.getDistributionStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

// Admin only routes
router.use(requireAdmin);

// Manually trigger daily distribution (admin only)
router.post('/send-daily-content', async (req, res, next) => {
  try {
    await distributionService.processDailyDistribution();
    res.json({
      success: true,
      message: 'Daily distribution triggered successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get queue details
router.get('/queue', async (req, res, next) => {
  try {
    const { status, batchId, limit = 20, page = 1 } = req.query;
    const prisma = (await import('@prisma/client')).PrismaClient;
    const db = new prisma();

    const where: any = {};
    if (status) where.status = status;
    if (batchId) where.batchId = batchId;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      db.distributionQueue.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { scheduledFor: 'asc' },
        include: {
          template: {
            select: {
              id: true,
              type: true,
              title: true,
              category: true,
            },
          },
        },
      }),
      db.distributionQueue.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get delivery logs
router.get('/deliveries', async (req, res, next) => {
  try {
    const { userId, templateId, status, startDate, endDate, limit = 20, page = 1 } = req.query;
    const prisma = (await import('@prisma/client')).PrismaClient;
    const db = new prisma();

    const where: any = {};
    if (userId) where.userId = userId;
    if (templateId) where.templateId = templateId;
    if (status) where.deliveryStatus = status;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [deliveries, total] = await Promise.all([
      db.contentDelivery.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            select: {
              id: true,
              type: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsappNumber: true,
            },
          },
        },
      }),
      db.contentDelivery.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        deliveries,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Retry failed deliveries
router.post('/retry-failed', async (req, res, next) => {
  try {
    const { deliveryIds } = req.body;
    const prisma = (await import('@prisma/client')).PrismaClient;
    const db = new prisma();

    const results = await Promise.all(
      deliveryIds.map(async (id: string) => {
        try {
          const delivery = await db.contentDelivery.findUnique({
            where: { id },
          });

          if (!delivery || delivery.deliveryStatus !== 'FAILED') {
            return { id, success: false, error: 'Invalid delivery or not failed' };
          }

          // Reset delivery status
          await db.contentDelivery.update({
            where: { id },
            data: {
              deliveryStatus: 'QUEUED',
              retryCount: { increment: 1 },
              errorMessage: null,
              errorCode: null,
            },
          });

          // Re-queue for processing
          const Bull = (await import('bull')).default;
          const distributionQueue = new Bull('content-distribution', {
            redis: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
            },
          });

          const template = await db.contentTemplate.findUnique({
            where: { id: delivery.templateId },
          });

          if (template?.type.startsWith('WHATSAPP')) {
            await distributionQueue.add('whatsapp-message', {
              templateId: delivery.templateId,
              userId: delivery.userId,
              deliveryId: delivery.id,
            });
          } else if (template?.type === 'LINKEDIN_POST') {
            await distributionQueue.add('linkedin-post', {
              templateId: delivery.templateId,
              userId: delivery.userId,
              deliveryId: delivery.id,
            });
          }

          return { id, success: true };
        } catch (error) {
          return { id, success: false, error: (error as any).message };
        }
      })
    );

    res.json({
      success: true,
      data: results,
      message: `Retried ${results.filter(r => r.success).length} deliveries`,
    });
  } catch (error) {
    next(error);
  }
});

// Cancel scheduled distribution
router.delete('/queue/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const prisma = (await import('@prisma/client')).PrismaClient;
    const db = new prisma();

    const queueItem = await db.distributionQueue.findUnique({
      where: { id },
    });

    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    if (queueItem.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only cancel pending items' });
    }

    await db.distributionQueue.update({
      where: { id },
      data: { status: 'CANCELED' },
    });

    res.json({
      success: true,
      message: 'Distribution cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;