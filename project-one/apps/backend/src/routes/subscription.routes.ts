import { Router } from 'express';
import subscriptionController from '../controllers/subscription.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/plans', subscriptionController.getPlans);
router.post('/webhook/razorpay', subscriptionController.handleRazorpayWebhook);

// Protected routes
router.use(authenticateJWT);

router.post('/create', subscriptionController.createSubscription);
router.get('/status', subscriptionController.getSubscriptionStatus);
router.post('/cancel', subscriptionController.cancelSubscription);

// Payment history
router.get('/payments', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const prisma = (await import('@prisma/client')).PrismaClient;
    const db = new prisma();

    const payments = await db.payment.findMany({
      where: {
        subscription: {
          userId,
        },
      },
      include: {
        subscription: {
          select: {
            planType: true,
            billingCycle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
});

// Upgrade/Downgrade subscription
router.post('/change-plan', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { newPlanType } = req.body;
    const prisma = (await import('@prisma/client')).PrismaClient;
    const db = new prisma();

    // Get current subscription
    const currentSubscription = await db.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (!currentSubscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel current subscription
    await subscriptionController.cancelSubscription(req, res, next);

    // Create new subscription
    req.body = { planType: newPlanType, billingCycle: currentSubscription.billingCycle };
    await subscriptionController.createSubscription(req, res, next);

  } catch (error) {
    next(error);
  }
});

// Usage statistics
router.get('/usage', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const prisma = (await import('@prisma/client')).PrismaClient;
    const db = new prisma();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayUsage, monthlyUsage, subscription] = await Promise.all([
      db.contentDelivery.count({
        where: {
          userId,
          createdAt: { gte: today },
        },
      }),
      db.contentDelivery.count({
        where: {
          userId,
          createdAt: { gte: thisMonth },
        },
      }),
      db.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        today: {
          used: todayUsage,
          limit: subscription?.dailyLimit || 0,
          remaining: Math.max(0, (subscription?.dailyLimit || 0) - todayUsage),
        },
        month: {
          total: monthlyUsage,
        },
        subscription: {
          planType: subscription?.planType,
          features: {
            whatsappMessages: subscription?.whatsappMessages,
            whatsappImages: subscription?.whatsappImages,
            whatsappStatus: subscription?.whatsappStatus,
            linkedinPosts: subscription?.linkedinPosts,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;