import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, tierBasedRateLimit } from '../middleware/auth.middleware';
import { validate, schemas, sanitizeInput } from '../middleware/validation.middleware';
import Redis from 'ioredis';

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(tierBasedRateLimit);

// Create new content
router.post('/', sanitizeInput, validate(schemas.createContent), async (req: any, res: Response) => {
  try {
    const advisorId = req.user.id;
    const { title, body, contentType, language, topicFamily, scheduledFor, tags } = req.body;

    // Check content limits based on tier
    const subscription = await prisma.subscription.findFirst({
      where: {
        advisorId,
        status: 'ACTIVE',
      },
    });

    if (subscription) {
      const contentCount = await prisma.content.count({
        where: {
          advisorId,
          createdAt: {
            gte: subscription.currentPeriodStart,
            lte: subscription.currentPeriodEnd,
          },
        },
      });

      if (contentCount >= subscription.contentLimit) {
        return res.status(403).json({
          error: 'Content limit exceeded',
          message: `You have reached your monthly content limit of ${subscription.contentLimit}`,
          currentCount: contentCount,
          limit: subscription.contentLimit,
        });
      }
    }

    // Create content
    const content = await prisma.content.create({
      data: {
        advisorId,
        title,
        body,
        contentType,
        language,
        topicFamily,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        tags,
        status: 'DRAFT',
      },
    });

    // Log analytics
    await prisma.analytics.create({
      data: {
        advisorId,
        eventType: 'CONTENT_CREATED',
        eventName: 'content_created',
        eventData: {
          contentId: content.id,
          contentType,
          language,
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        advisorId,
        contentId: content.id,
        action: 'CREATE',
        entity: 'content',
        entityId: content.id,
        newValues: content,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({
      message: 'Content created successfully',
      content,
    });
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({
      error: 'Content creation failed',
      message: 'An error occurred while creating content',
    });
  }
});

// Get all content for advisor with pagination
router.get('/', validate(schemas.pagination), async (req: any, res: Response) => {
  try {
    const advisorId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    // Build filter
    const where: any = { advisorId };
    
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    if (req.query.contentType) {
      where.contentType = req.query.contentType;
    }
    
    if (req.query.language) {
      where.language = req.query.language;
    }

    // Get total count
    const total = await prisma.content.count({ where });

    // Get paginated content
    const contents = await prisma.content.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        _count: {
          select: {
            complianceChecks: true,
            whatsappMessages: true,
          },
        },
      },
    });

    res.json({
      contents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Content fetch error:', error);
    res.status(500).json({
      error: 'Content fetch failed',
      message: 'An error occurred while fetching content',
    });
  }
});

// Get single content by ID
router.get('/:id', async (req: any, res: Response) => {
  try {
    const advisorId = req.user.id;
    const contentId = req.params.id;

    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        advisorId,
      },
      include: {
        complianceChecks: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        whatsappMessages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        auditLogs: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content not found',
        message: 'The requested content was not found',
      });
    }

    // Cache the content for faster retrieval
    await redis.setex(`content:${contentId}`, 3600, JSON.stringify(content));

    res.json(content);
  } catch (error) {
    console.error('Content fetch error:', error);
    res.status(500).json({
      error: 'Content fetch failed',
      message: 'An error occurred while fetching content',
    });
  }
});

// Update content
router.patch('/:id', sanitizeInput, validate(schemas.updateContent), async (req: any, res: Response) => {
  try {
    const advisorId = req.user.id;
    const contentId = req.params.id;

    // Check if content exists and belongs to advisor
    const existingContent = await prisma.content.findFirst({
      where: {
        id: contentId,
        advisorId,
      },
    });

    if (!existingContent) {
      return res.status(404).json({
        error: 'Content not found',
        message: 'The content was not found or you do not have permission to update it',
      });
    }

    // Don't allow updates to approved content
    if (existingContent.status === 'APPROVED' || existingContent.status === 'PUBLISHED') {
      return res.status(403).json({
        error: 'Cannot update',
        message: 'Cannot update content that has been approved or published',
      });
    }

    // Update content
    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: {
        ...req.body,
        status: 'DRAFT', // Reset to draft on edit
        version: { increment: 1 },
      },
    });

    // Clear cache
    await redis.del(`content:${contentId}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        advisorId,
        contentId,
        action: 'UPDATE',
        entity: 'content',
        entityId: contentId,
        oldValues: existingContent,
        newValues: updatedContent,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      message: 'Content updated successfully',
      content: updatedContent,
    });
  } catch (error) {
    console.error('Content update error:', error);
    res.status(500).json({
      error: 'Content update failed',
      message: 'An error occurred while updating content',
    });
  }
});

// Delete content (soft delete)
router.delete('/:id', async (req: any, res: Response) => {
  try {
    const advisorId = req.user.id;
    const contentId = req.params.id;

    // Check if content exists and belongs to advisor
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        advisorId,
      },
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content not found',
        message: 'The content was not found or you do not have permission to delete it',
      });
    }

    // Don't allow deletion of published content
    if (content.status === 'PUBLISHED') {
      return res.status(403).json({
        error: 'Cannot delete',
        message: 'Cannot delete published content. Archive it instead.',
      });
    }

    // Update status to archived
    await prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'ARCHIVED',
      },
    });

    // Clear cache
    await redis.del(`content:${contentId}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        advisorId,
        contentId,
        action: 'DELETE',
        entity: 'content',
        entityId: contentId,
        oldValues: content,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('Content deletion error:', error);
    res.status(500).json({
      error: 'Content deletion failed',
      message: 'An error occurred while deleting content',
    });
  }
});

// Submit content for compliance check
router.post('/:id/submit-compliance', async (req: any, res: Response) => {
  try {
    const advisorId = req.user.id;
    const contentId = req.params.id;

    // Check if content exists and belongs to advisor
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        advisorId,
      },
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content not found',
        message: 'The content was not found',
      });
    }

    // Check if content is in draft status
    if (content.status !== 'DRAFT') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Only draft content can be submitted for compliance',
      });
    }

    // Update content status
    await prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'PENDING_APPROVAL',
        approvalStage: 1,
      },
    });

    // Create initial compliance check
    const complianceCheck = await prisma.complianceCheck.create({
      data: {
        contentId,
        advisorId,
        checkType: 'SEBI',
        stage: 1,
        status: 'PENDING',
        score: 0,
        threshold: 80,
      },
    });

    // TODO: Trigger AI compliance check asynchronously
    // This would typically be added to a job queue

    res.json({
      message: 'Content submitted for compliance check',
      complianceCheckId: complianceCheck.id,
      estimatedTime: '5-10 minutes',
    });
  } catch (error) {
    console.error('Compliance submission error:', error);
    res.status(500).json({
      error: 'Compliance submission failed',
      message: 'An error occurred while submitting content for compliance',
    });
  }
});

// Get content statistics
router.get('/stats/overview', async (req: any, res: Response) => {
  try {
    const advisorId = req.user.id;

    // Get counts by status
    const statusCounts = await prisma.content.groupBy({
      by: ['status'],
      where: { advisorId },
      _count: {
        id: true,
      },
    });

    // Get counts by content type
    const typeCounts = await prisma.content.groupBy({
      by: ['contentType'],
      where: { advisorId },
      _count: {
        id: true,
      },
    });

    // Get recent activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await prisma.content.count({
      where: {
        advisorId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get average compliance score
    const complianceScores = await prisma.content.aggregate({
      where: {
        advisorId,
        complianceScore: {
          not: null,
        },
      },
      _avg: {
        complianceScore: true,
      },
    });

    res.json({
      statusDistribution: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      typeDistribution: typeCounts.reduce((acc, item) => {
        acc[item.contentType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: {
        last30Days: recentActivity,
      },
      averageComplianceScore: complianceScores._avg.complianceScore || 0,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Stats fetch failed',
      message: 'An error occurred while fetching statistics',
    });
  }
});

export default router;