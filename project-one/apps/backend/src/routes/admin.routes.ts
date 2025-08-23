import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';
import multer from 'multer';
import sharp from 'sharp';

const router = Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Middleware to process uploaded images
const processImage = async (req: any, res: any, next: any) => {
  if (!req.file) return next();

  try {
    // Process image with sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Convert to base64 for storage or upload to CDN
    req.processedImage = `data:image/jpeg;base64,${processedImage.toString('base64')}`;
    next();
  } catch (error) {
    next(error);
  }
};

// All admin routes require authentication and admin role
router.use(authenticateJWT);
router.use(requireAdmin);

// Content Management Routes
router.post('/content/create', adminController.createContent);
router.put('/content/:id/approve', adminController.approveContent);
router.post('/content/schedule', adminController.scheduleContent);
router.get('/content/analytics', adminController.getContentAnalytics);
router.get('/content', adminController.listContent);
router.delete('/content/:id', adminController.deleteContent);

// AI Content Generation Routes
router.post('/content/generate-ai', adminController.generateAIContent);
router.post('/content/scrape-and-generate', adminController.scrapeAndGenerate);
router.put('/content/prompts', adminController.updatePrompts);

// Image Upload Route
router.post('/content/upload-image', upload.single('image'), processImage, async (req: any, res) => {
  try {
    if (!req.processedImage) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // In production, you would upload to CDN (S3, Cloudinary, etc.)
    // For now, we'll return the base64 image
    res.json({
      success: true,
      data: {
        imageUrl: req.processedImage,
        message: 'Image uploaded successfully',
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// Bulk Operations
router.post('/content/bulk-approve', async (req, res, next) => {
  try {
    const { templateIds, approvalNotes } = req.body;
    const userId = (req as any).user.id;

    const results = await Promise.all(
      templateIds.map(async (id: string) => {
        try {
          await adminController.approveContent(
            { params: { id }, body: { approvalNotes }, user: { id: userId } } as any,
            {} as any,
            () => {}
          );
          return { id, success: true };
        } catch (error) {
          return { id, success: false, error: (error as any).message };
        }
      })
    );

    res.json({
      success: true,
      data: results,
      message: `Processed ${results.length} items`,
    });
  } catch (error) {
    next(error);
  }
});

// Dashboard Statistics
router.get('/stats/dashboard', async (req, res, next) => {
  try {
    const prisma = (await import('@prisma/client')).PrismaClient;
    const db = new prisma();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSubscribers,
      activeSubscribers,
      totalContent,
      scheduledContent,
      todayDeliveries,
      revenue,
    ] = await Promise.all([
      db.user.count({ where: { role: 'SUBSCRIBER' } }),
      db.user.count({
        where: {
          role: 'SUBSCRIBER',
          subscriptions: {
            some: {
              status: 'ACTIVE',
              expiresAt: { gte: new Date() },
            },
          },
        },
      }),
      db.contentTemplate.count(),
      db.contentTemplate.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: { gte: new Date() },
        },
      }),
      db.contentDelivery.count({
        where: { createdAt: { gte: today } },
      }),
      db.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        subscribers: {
          total: totalSubscribers,
          active: activeSubscribers,
          inactive: totalSubscribers - activeSubscribers,
        },
        content: {
          total: totalContent,
          scheduled: scheduledContent,
        },
        deliveries: {
          today: todayDeliveries,
        },
        revenue: {
          currentMonth: revenue._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Content Performance Report
router.get('/reports/content-performance', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const prisma = (await import('@prisma/client')).PrismaClient;
    const db = new prisma();

    const analytics = await db.contentAnalytics.findMany({
      where: {
        periodStart: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      },
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
      orderBy: { totalSent: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

export default router;