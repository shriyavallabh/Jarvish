import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schemas
const CreateContentSchema = z.object({
  type: z.enum(['WHATSAPP_MESSAGE', 'WHATSAPP_IMAGE', 'WHATSAPP_STATUS', 'LINKEDIN_POST']),
  title: z.string().optional(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
  mediaUrl: z.string().url().optional(),
  linkedinHashtags: z.array(z.string()).optional(),
  language: z.enum(['EN', 'HI', 'GU', 'MR', 'TA', 'TE', 'KN', 'ML', 'BN', 'PA']).default('EN'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  topicFamily: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  repeatPattern: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY']).optional(),
});

const GenerateAIContentSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(['WHATSAPP_MESSAGE', 'WHATSAPP_IMAGE', 'WHATSAPP_STATUS', 'LINKEDIN_POST']),
  language: z.enum(['EN', 'HI', 'GU', 'MR', 'TA', 'TE', 'KN', 'ML', 'BN', 'PA']).default('EN'),
  model: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(4000).default(1000),
  includeImage: z.boolean().default(false),
});

const ScrapeAndGenerateSchema = z.object({
  url: z.string().url(),
  selector: z.string().optional(),
  type: z.enum(['WHATSAPP_MESSAGE', 'WHATSAPP_IMAGE', 'WHATSAPP_STATUS', 'LINKEDIN_POST']),
  language: z.enum(['EN', 'HI', 'GU', 'MR', 'TA', 'TE', 'KN', 'ML', 'BN', 'PA']).default('EN'),
});

const UpdatePromptsSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  promptType: z.enum(['SYSTEM', 'USER', 'ASSISTANT']),
  prompt: z.string().min(1),
  model: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(4000).default(1000),
  category: z.string().optional(),
});

export class AdminController {
  // Create content template
  async createContent(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CreateContentSchema.parse(req.body);
      const userId = (req as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      }

      const contentTemplate = await prisma.contentTemplate.create({
        data: {
          type: validated.type,
          title: validated.title,
          content: validated.content,
          imageUrl: validated.imageUrl,
          mediaUrl: validated.mediaUrl,
          linkedinHashtags: validated.linkedinHashtags || [],
          language: validated.language,
          category: validated.category,
          tags: validated.tags || [],
          topicFamily: validated.topicFamily,
          scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : undefined,
          scheduledTime: validated.scheduledTime,
          repeatPattern: validated.repeatPattern,
          createdById: userId,
          status: 'DRAFT',
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_CONTENT',
          entity: 'ContentTemplate',
          entityId: contentTemplate.id,
          newValues: contentTemplate as any,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          requestId: (req as any).id,
        },
      });

      res.status(201).json({
        success: true,
        data: contentTemplate,
        message: 'Content template created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  // Approve content
  async approveContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approvalNotes } = req.body;
      const userId = (req as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      }

      const contentTemplate = await prisma.contentTemplate.findUnique({
        where: { id },
      });

      if (!contentTemplate) {
        return res.status(404).json({ error: 'Content template not found' });
      }

      const updatedContent = await prisma.contentTemplate.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvalNotes,
          approvedById: userId,
          approvedAt: new Date(),
        },
      });

      // If scheduled, add to distribution queue
      if (updatedContent.scheduledDate) {
        await prisma.distributionQueue.create({
          data: {
            templateId: updatedContent.id,
            scheduledFor: updatedContent.scheduledDate,
            priority: 1,
            status: 'PENDING',
          },
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'APPROVE_CONTENT',
          entity: 'ContentTemplate',
          entityId: id,
          oldValues: { status: contentTemplate.status },
          newValues: { status: 'APPROVED' },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          requestId: (req as any).id,
        },
      });

      res.json({
        success: true,
        data: updatedContent,
        message: 'Content approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Schedule content
  async scheduleContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateIds, scheduledDate, scheduledTime, priority } = req.body;
      const userId = (req as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      }

      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime || '06:00'}:00.000Z`);
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get total active subscribers
      const totalRecipients = await prisma.user.count({
        where: {
          role: 'SUBSCRIBER',
          isActive: true,
          subscriptions: {
            some: {
              status: 'ACTIVE',
              expiresAt: { gte: new Date() },
            },
          },
        },
      });

      const queueItems = await Promise.all(
        templateIds.map(async (templateId: string) => {
          // Update template status
          await prisma.contentTemplate.update({
            where: { id: templateId },
            data: {
              status: 'SCHEDULED',
              scheduledDate: scheduledFor,
            },
          });

          // Add to distribution queue
          return prisma.distributionQueue.create({
            data: {
              templateId,
              scheduledFor,
              priority: priority || 0,
              status: 'PENDING',
              batchId,
              totalRecipients,
            },
          });
        })
      );

      res.json({
        success: true,
        data: {
          batchId,
          scheduledFor,
          totalRecipients,
          items: queueItems,
        },
        message: `Content scheduled for ${totalRecipients} subscribers`,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get content analytics
  async getContentAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, templateId } = req.query;
      const userId = (req as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      }

      const where: any = {};
      if (templateId) where.templateId = templateId;
      if (startDate && endDate) {
        where.periodStart = { gte: new Date(startDate as string) };
        where.periodEnd = { lte: new Date(endDate as string) };
      }

      const analytics = await prisma.contentAnalytics.findMany({
        where,
        orderBy: { periodStart: 'desc' },
      });

      // Aggregate metrics
      const aggregated = analytics.reduce((acc, curr) => {
        return {
          totalSent: acc.totalSent + curr.totalSent,
          totalDelivered: acc.totalDelivered + curr.totalDelivered,
          totalRead: acc.totalRead + curr.totalRead,
          totalClicked: acc.totalClicked + curr.totalClicked,
          whatsappSent: acc.whatsappSent + curr.whatsappSent,
          whatsappDelivered: acc.whatsappDelivered + curr.whatsappDelivered,
          whatsappRead: acc.whatsappRead + curr.whatsappRead,
          linkedinViews: acc.linkedinViews + curr.linkedinViews,
          linkedinLikes: acc.linkedinLikes + curr.linkedinLikes,
          linkedinShares: acc.linkedinShares + curr.linkedinShares,
          linkedinComments: acc.linkedinComments + curr.linkedinComments,
        };
      }, {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalClicked: 0,
        whatsappSent: 0,
        whatsappDelivered: 0,
        whatsappRead: 0,
        linkedinViews: 0,
        linkedinLikes: 0,
        linkedinShares: 0,
        linkedinComments: 0,
      });

      // Calculate rates
      const deliveryRate = aggregated.totalSent > 0 
        ? (aggregated.totalDelivered / aggregated.totalSent * 100).toFixed(2)
        : 0;
      const readRate = aggregated.totalDelivered > 0
        ? (aggregated.totalRead / aggregated.totalDelivered * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        data: {
          metrics: aggregated,
          deliveryRate: `${deliveryRate}%`,
          readRate: `${readRate}%`,
          details: analytics,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate AI content
  async generateAIContent(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = GenerateAIContentSchema.parse(req.body);
      const userId = (req as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      }

      // Get system prompt for the content type
      const systemPrompt = await prisma.aIPrompt.findFirst({
        where: {
          promptType: 'SYSTEM',
          category: validated.type,
          isActive: true,
        },
      });

      const messages: any[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt.prompt });
      } else {
        // Default system prompt
        messages.push({
          role: 'system',
          content: `You are a professional financial content writer creating ${validated.type} content for Indian financial advisors. 
                   Create engaging, compliant, and informative content in ${validated.language} language.
                   Follow SEBI guidelines and ensure accuracy.`
        });
      }

      messages.push({ role: 'user', content: validated.prompt });

      // Generate content with OpenAI
      const completion = await openai.chat.completions.create({
        model: validated.model,
        messages,
        temperature: validated.temperature,
        max_tokens: validated.maxTokens,
      });

      const generatedContent = completion.choices[0].message.content;

      // Generate image if requested
      let imageUrl = undefined;
      if (validated.includeImage && validated.type !== 'WHATSAPP_MESSAGE') {
        try {
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Financial advisory image for: ${validated.prompt}. Professional, clean, suitable for Indian market.`,
            n: 1,
            size: "1024x1024",
          });
          imageUrl = imageResponse.data[0].url;
        } catch (imageError) {
          console.error('Image generation failed:', imageError);
        }
      }

      // Create content template
      const contentTemplate = await prisma.contentTemplate.create({
        data: {
          type: validated.type,
          content: generatedContent || '',
          imageUrl,
          language: validated.language,
          aiGenerated: true,
          aiModel: validated.model,
          aiPrompt: validated.prompt,
          createdById: userId,
          status: 'DRAFT',
        },
      });

      // Update prompt usage count
      if (systemPrompt) {
        await prisma.aIPrompt.update({
          where: { id: systemPrompt.id },
          data: { useCount: { increment: 1 } },
        });
      }

      res.json({
        success: true,
        data: contentTemplate,
        message: 'AI content generated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  // Scrape and generate content
  async scrapeAndGenerate(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = ScrapeAndGenerateSchema.parse(req.body);
      const userId = (req as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      }

      // Scrape the URL
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.goto(validated.url, { waitUntil: 'networkidle2' });

      let content = '';
      if (validated.selector) {
        content = await page.$eval(validated.selector, el => el.textContent || '');
      } else {
        content = await page.evaluate(() => document.body.innerText);
      }

      await browser.close();

      if (!content) {
        return res.status(400).json({ error: 'No content could be extracted from the URL' });
      }

      // Truncate content if too long
      const maxContentLength = 3000;
      if (content.length > maxContentLength) {
        content = content.substring(0, maxContentLength) + '...';
      }

      // Generate content based on scraped data
      const messages = [
        {
          role: 'system',
          content: `You are a professional financial content writer. Based on the following scraped content, 
                   create a ${validated.type} in ${validated.language} language for Indian financial advisors.
                   Make it engaging, informative, and compliant with SEBI guidelines.`
        },
        {
          role: 'user',
          content: `Create content based on this information: ${content}`
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const generatedContent = completion.choices[0].message.content;

      // Create content template
      const contentTemplate = await prisma.contentTemplate.create({
        data: {
          type: validated.type,
          content: generatedContent || '',
          language: validated.language,
          aiGenerated: true,
          aiModel: 'gpt-4',
          webScrapingUrl: validated.url,
          createdById: userId,
          status: 'DRAFT',
        },
      });

      // Store scraping job for future reference
      await prisma.scrapingJob.create({
        data: {
          url: validated.url,
          selector: validated.selector,
          jobType: 'NEWS',
          lastRunAt: new Date(),
          lastContent: { scraped: content.substring(0, 500), generated: generatedContent },
          successCount: 1,
        },
      });

      res.json({
        success: true,
        data: contentTemplate,
        message: 'Content scraped and generated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  // Update AI prompts
  async updatePrompts(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = UpdatePromptsSchema.parse(req.body);
      const userId = (req as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Super admin access required.' });
      }

      // Check if prompt exists
      const existingPrompt = await prisma.aIPrompt.findUnique({
        where: { name: validated.name },
      });

      let prompt;
      if (existingPrompt) {
        // Update existing prompt
        prompt = await prisma.aIPrompt.update({
          where: { name: validated.name },
          data: {
            description: validated.description,
            promptType: validated.promptType,
            prompt: validated.prompt,
            model: validated.model,
            temperature: validated.temperature,
            maxTokens: validated.maxTokens,
            category: validated.category,
          },
        });
      } else {
        // Create new prompt
        prompt = await prisma.aIPrompt.create({
          data: validated,
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: existingPrompt ? 'UPDATE_PROMPT' : 'CREATE_PROMPT',
          entity: 'AIPrompt',
          entityId: prompt.id,
          oldValues: existingPrompt ? existingPrompt as any : null,
          newValues: prompt as any,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          requestId: (req as any).id,
        },
      });

      res.json({
        success: true,
        data: prompt,
        message: `Prompt ${existingPrompt ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  // List all content templates
  async listContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, type, language, page = 1, limit = 20 } = req.query;
      const userId = (req as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      }

      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;
      if (language) where.language = language;

      const skip = (Number(page) - 1) * Number(limit);

      const [templates, total] = await Promise.all([
        prisma.contentTemplate.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            approvedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        prisma.contentTemplate.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          templates,
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
  }

  // Delete content template
  async deleteContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
      }

      const contentTemplate = await prisma.contentTemplate.findUnique({
        where: { id },
      });

      if (!contentTemplate) {
        return res.status(404).json({ error: 'Content template not found' });
      }

      // Check if content has been delivered
      const deliveries = await prisma.contentDelivery.count({
        where: { templateId: id },
      });

      if (deliveries > 0) {
        // Archive instead of delete
        await prisma.contentTemplate.update({
          where: { id },
          data: { status: 'ARCHIVED' },
        });

        return res.json({
          success: true,
          message: 'Content archived (has delivery history)',
        });
      }

      // Delete from queue if scheduled
      await prisma.distributionQueue.deleteMany({
        where: { templateId: id },
      });

      // Delete the template
      await prisma.contentTemplate.delete({
        where: { id },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE_CONTENT',
          entity: 'ContentTemplate',
          entityId: id,
          oldValues: contentTemplate as any,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          requestId: (req as any).id,
        },
      });

      res.json({
        success: true,
        message: 'Content template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();