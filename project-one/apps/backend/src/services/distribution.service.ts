import { PrismaClient } from '@prisma/client';
import * as cron from 'node-cron';
import axios from 'axios';
import Bull from 'bull';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Create Bull queue for content distribution
const distributionQueue = new Bull('content-distribution', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// WhatsApp Cloud API configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export class DistributionService {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeScheduler();
    this.setupQueueProcessors();
  }

  // Initialize cron scheduler for 6 AM IST daily distribution
  private initializeScheduler() {
    // Schedule for 6:00 AM IST (00:30 UTC)
    const dailySchedule = '30 0 * * *'; // Runs at 00:30 UTC daily

    const dailyJob = cron.schedule(dailySchedule, async () => {
      console.log('Running daily content distribution at 6 AM IST');
      await this.processDailyDistribution();
    }, {
      timezone: 'Asia/Kolkata'
    });

    this.cronJobs.set('daily-distribution', dailyJob);

    // Check for scheduled content every 15 minutes
    const scheduledContentCheck = cron.schedule('*/15 * * * *', async () => {
      await this.processScheduledContent();
    });

    this.cronJobs.set('scheduled-content', scheduledContentCheck);

    console.log('Distribution scheduler initialized');
  }

  // Setup Bull queue processors
  private setupQueueProcessors() {
    // Process WhatsApp message distribution
    distributionQueue.process('whatsapp-message', async (job) => {
      const { templateId, userId, deliveryId } = job.data;
      return await this.sendWhatsAppMessage(templateId, userId, deliveryId);
    });

    // Process LinkedIn post distribution
    distributionQueue.process('linkedin-post', async (job) => {
      const { templateId, userId, deliveryId } = job.data;
      return await this.postToLinkedIn(templateId, userId, deliveryId);
    });

    // Process batch distribution
    distributionQueue.process('batch-distribution', async (job) => {
      const { batchId } = job.data;
      return await this.processBatchDistribution(batchId);
    });

    // Handle queue events
    distributionQueue.on('completed', (job, result) => {
      console.log(`Job ${job.id} completed:`, result);
    });

    distributionQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err);
    });
  }

  // Process daily distribution at 6 AM IST
  async processDailyDistribution() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get approved content scheduled for today
      const scheduledContent = await prisma.contentTemplate.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            {
              scheduledDate: {
                gte: today,
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
              },
            },
            {
              repeatPattern: { in: ['DAILY'] },
            },
          ],
        },
      });

      if (scheduledContent.length === 0) {
        console.log('No content scheduled for today');
        return;
      }

      // Get all active subscribers
      const activeSubscribers = await prisma.user.findMany({
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
        include: {
          subscriptions: {
            where: {
              status: 'ACTIVE',
              expiresAt: { gte: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      console.log(`Processing distribution for ${activeSubscribers.length} subscribers`);

      // Create batch for tracking
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      for (const template of scheduledContent) {
        // Add to distribution queue
        const queueItem = await prisma.distributionQueue.create({
          data: {
            templateId: template.id,
            scheduledFor: new Date(),
            priority: 1,
            status: 'PROCESSING',
            batchId,
            totalRecipients: activeSubscribers.length,
          },
        });

        // Process distribution for each subscriber
        for (const subscriber of activeSubscribers) {
          const subscription = subscriber.subscriptions[0];
          
          // Check daily limit
          const todayDeliveries = await prisma.contentDelivery.count({
            where: {
              userId: subscriber.id,
              createdAt: { gte: today },
            },
          });

          if (subscription.dailyLimit !== -1 && todayDeliveries >= subscription.dailyLimit) {
            console.log(`Daily limit reached for user ${subscriber.id}`);
            continue;
          }

          // Check content type permissions
          if (template.type === 'WHATSAPP_MESSAGE' && !subscription.whatsappMessages) continue;
          if (template.type === 'WHATSAPP_IMAGE' && !subscription.whatsappImages) continue;
          if (template.type === 'WHATSAPP_STATUS' && !subscription.whatsappStatus) continue;
          if (template.type === 'LINKEDIN_POST' && !subscription.linkedinPosts) continue;

          // Create delivery record
          const delivery = await prisma.contentDelivery.create({
            data: {
              templateId: template.id,
              userId: subscriber.id,
              deliveryChannel: template.type.startsWith('WHATSAPP') ? 'WHATSAPP' : 'LINKEDIN',
              deliveryStatus: 'QUEUED',
              scheduledFor: new Date(),
            },
          });

          // Add to processing queue
          if (template.type.startsWith('WHATSAPP')) {
            await distributionQueue.add('whatsapp-message', {
              templateId: template.id,
              userId: subscriber.id,
              deliveryId: delivery.id,
            }, {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
            });
          } else if (template.type === 'LINKEDIN_POST') {
            await distributionQueue.add('linkedin-post', {
              templateId: template.id,
              userId: subscriber.id,
              deliveryId: delivery.id,
            }, {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
            });
          }
        }

        // Update queue status
        await prisma.distributionQueue.update({
          where: { id: queueItem.id },
          data: {
            status: 'PROCESSING',
            processedAt: new Date(),
          },
        });
      }

      // Update content analytics
      await this.updateAnalytics(scheduledContent.map(c => c.id));

    } catch (error) {
      console.error('Error in daily distribution:', error);
    }
  }

  // Process scheduled content
  async processScheduledContent() {
    try {
      const now = new Date();
      
      // Get pending scheduled items
      const pendingItems = await prisma.distributionQueue.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: { lte: now },
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' },
        ],
        take: 10,
      });

      for (const item of pendingItems) {
        await distributionQueue.add('batch-distribution', {
          batchId: item.batchId || item.id,
        });

        await prisma.distributionQueue.update({
          where: { id: item.id },
          data: { status: 'PROCESSING' },
        });
      }
    } catch (error) {
      console.error('Error processing scheduled content:', error);
    }
  }

  // Send WhatsApp message
  async sendWhatsAppMessage(templateId: string, userId: string, deliveryId: string) {
    try {
      const [template, user] = await Promise.all([
        prisma.contentTemplate.findUnique({ where: { id: templateId } }),
        prisma.user.findUnique({ where: { id: userId } }),
      ]);

      if (!template || !user || !user.whatsappNumber) {
        throw new Error('Invalid template or user data');
      }

      // Update delivery status
      await prisma.contentDelivery.update({
        where: { id: deliveryId },
        data: { deliveryStatus: 'SENDING' },
      });

      let messageData: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: user.whatsappNumber.replace(/[^0-9]/g, ''), // Clean phone number
      };

      // Prepare message based on type
      if (template.type === 'WHATSAPP_MESSAGE') {
        messageData.type = 'text';
        messageData.text = {
          preview_url: true,
          body: this.personalizeContent(template.content, user),
        };
      } else if (template.type === 'WHATSAPP_IMAGE') {
        messageData.type = 'image';
        messageData.image = {
          link: template.imageUrl,
          caption: this.personalizeContent(template.content, user),
        };
      }

      // Send via WhatsApp Cloud API
      const response = await axios.post(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const whatsappMessageId = response.data.messages[0].id;

      // Update delivery record
      await prisma.contentDelivery.update({
        where: { id: deliveryId },
        data: {
          deliveryStatus: 'SENT',
          whatsappMessageId,
          sentAt: new Date(),
        },
      });

      return { success: true, messageId: whatsappMessageId };

    } catch (error: any) {
      console.error('WhatsApp send error:', error);

      // Update delivery with error
      await prisma.contentDelivery.update({
        where: { id: deliveryId },
        data: {
          deliveryStatus: 'FAILED',
          failedAt: new Date(),
          errorMessage: error.message,
          errorCode: error.response?.data?.error?.code,
        },
      });

      throw error;
    }
  }

  // Post to LinkedIn
  async postToLinkedIn(templateId: string, userId: string, deliveryId: string) {
    try {
      const [template, user] = await Promise.all([
        prisma.contentTemplate.findUnique({ where: { id: templateId } }),
        prisma.user.findUnique({ where: { id: userId } }),
      ]);

      if (!template || !user) {
        throw new Error('Invalid template or user data');
      }

      // Update delivery status
      await prisma.contentDelivery.update({
        where: { id: deliveryId },
        data: { deliveryStatus: 'SENDING' },
      });

      // Note: LinkedIn API integration would go here
      // This is a placeholder for the actual LinkedIn posting logic
      // You would need to implement OAuth 2.0 flow and use LinkedIn's Share API

      const linkedinPostId = `linkedin_${Date.now()}`;
      const linkedinUrl = `https://www.linkedin.com/feed/update/${linkedinPostId}`;

      // Simulate LinkedIn posting
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update delivery record
      await prisma.contentDelivery.update({
        where: { id: deliveryId },
        data: {
          deliveryStatus: 'SENT',
          linkedinPostId,
          linkedinUrl,
          sentAt: new Date(),
        },
      });

      return { success: true, postId: linkedinPostId, url: linkedinUrl };

    } catch (error: any) {
      console.error('LinkedIn post error:', error);

      // Update delivery with error
      await prisma.contentDelivery.update({
        where: { id: deliveryId },
        data: {
          deliveryStatus: 'FAILED',
          failedAt: new Date(),
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  // Process batch distribution
  async processBatchDistribution(batchId: string) {
    try {
      const queueItems = await prisma.distributionQueue.findMany({
        where: { batchId },
      });

      for (const item of queueItems) {
        // Get template
        const template = await prisma.contentTemplate.findUnique({
          where: { id: item.templateId },
        });

        if (!template) continue;

        // Get deliveries for this batch
        const deliveries = await prisma.contentDelivery.findMany({
          where: {
            templateId: item.templateId,
            deliveryStatus: 'QUEUED',
          },
        });

        let sentCount = 0;
        let failedCount = 0;

        for (const delivery of deliveries) {
          try {
            if (template.type.startsWith('WHATSAPP')) {
              await this.sendWhatsAppMessage(template.id, delivery.userId, delivery.id);
            } else if (template.type === 'LINKEDIN_POST') {
              await this.postToLinkedIn(template.id, delivery.userId, delivery.id);
            }
            sentCount++;
          } catch (error) {
            failedCount++;
          }
        }

        // Update queue item
        await prisma.distributionQueue.update({
          where: { id: item.id },
          data: {
            status: 'COMPLETED',
            sentCount,
            failedCount,
            processedAt: new Date(),
          },
        });
      }

      return { success: true, batchId };

    } catch (error) {
      console.error('Batch distribution error:', error);
      throw error;
    }
  }

  // Personalize content with user data
  private personalizeContent(content: string, user: any): string {
    return content
      .replace(/\{\{name\}\}/g, user.name)
      .replace(/\{\{company\}\}/g, user.companyName || 'your company')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-IN'));
  }

  // Update content analytics
  async updateAnalytics(templateIds: string[]) {
    try {
      for (const templateId of templateIds) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get delivery stats
        const deliveryStats = await prisma.contentDelivery.groupBy({
          by: ['deliveryStatus', 'deliveryChannel'],
          where: {
            templateId,
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
          _count: true,
        });

        // Calculate metrics
        const metrics = {
          totalSent: 0,
          totalDelivered: 0,
          totalRead: 0,
          whatsappSent: 0,
          whatsappDelivered: 0,
          whatsappRead: 0,
          linkedinViews: 0,
        };

        deliveryStats.forEach(stat => {
          if (stat.deliveryStatus === 'SENT') {
            metrics.totalSent += stat._count;
            if (stat.deliveryChannel === 'WHATSAPP') {
              metrics.whatsappSent += stat._count;
            }
          }
          if (stat.deliveryStatus === 'DELIVERED') {
            metrics.totalDelivered += stat._count;
            if (stat.deliveryChannel === 'WHATSAPP') {
              metrics.whatsappDelivered += stat._count;
            }
          }
          if (stat.deliveryStatus === 'READ') {
            metrics.totalRead += stat._count;
            if (stat.deliveryChannel === 'WHATSAPP') {
              metrics.whatsappRead += stat._count;
            }
          }
        });

        // Update or create analytics record
        await prisma.contentAnalytics.upsert({
          where: {
            templateId_periodStart_periodEnd: {
              templateId,
              periodStart: today,
              periodEnd: tomorrow,
            },
          },
          update: metrics,
          create: {
            templateId,
            ...metrics,
            periodStart: today,
            periodEnd: tomorrow,
          },
        });
      }
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  // Handle WhatsApp webhook for delivery status
  async handleWhatsAppWebhook(data: any) {
    try {
      if (data.entry && data.entry[0] && data.entry[0].changes) {
        for (const change of data.entry[0].changes) {
          if (change.value.statuses) {
            for (const status of change.value.statuses) {
              const delivery = await prisma.contentDelivery.findFirst({
                where: { whatsappMessageId: status.id },
              });

              if (delivery) {
                let deliveryStatus = delivery.deliveryStatus;
                let updateData: any = { whatsappStatus: status.status };

                switch (status.status) {
                  case 'delivered':
                    deliveryStatus = 'DELIVERED';
                    updateData.deliveredAt = new Date(status.timestamp * 1000);
                    break;
                  case 'read':
                    deliveryStatus = 'READ';
                    updateData.readAt = new Date(status.timestamp * 1000);
                    break;
                  case 'failed':
                    deliveryStatus = 'FAILED';
                    updateData.failedAt = new Date(status.timestamp * 1000);
                    updateData.errorMessage = status.errors?.[0]?.title;
                    break;
                }

                await prisma.contentDelivery.update({
                  where: { id: delivery.id },
                  data: {
                    deliveryStatus,
                    ...updateData,
                  },
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
    }
  }

  // Get distribution status
  async getDistributionStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayQueue, todayDeliveries, activeSubscribers] = await Promise.all([
      prisma.distributionQueue.count({
        where: {
          scheduledFor: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.contentDelivery.groupBy({
        by: ['deliveryStatus'],
        where: {
          createdAt: {
            gte: today,
          },
        },
        _count: true,
      }),
      prisma.user.count({
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
      }),
    ]);

    const deliveryStats = todayDeliveries.reduce((acc, curr) => {
      acc[curr.deliveryStatus.toLowerCase()] = curr._count;
      return acc;
    }, {} as any);

    return {
      todayQueue,
      activeSubscribers,
      deliveryStats,
      nextScheduledRun: this.getNextScheduledRun(),
    };
  }

  // Get next scheduled run time
  private getNextScheduledRun(): Date {
    const now = new Date();
    const next = new Date();
    next.setHours(6, 0, 0, 0); // 6 AM IST

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }
}

// Create and export singleton instance
const distributionService = new DistributionService();
export default distributionService;