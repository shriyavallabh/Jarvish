// Analytics & Reporting Service
// Advanced analytics for business intelligence and advisor insights

import { createLogger, format, transports } from 'winston';
import fs from 'fs/promises';
import path from 'path';

interface AdvisorMetrics {
  advisorId: string;
  contentGenerated: number;
  complianceScore: number;
  whatsappEngagement: number;
  revenueContribution: number;
  lastActive: Date;
}

interface ContentAnalytics {
  totalContent: number;
  compliancePassRate: number;
  engagementRate: number;
  topPerformingTemplates: Array<{
    templateId: string;
    name: string;
    usageCount: number;
    successRate: number;
  }>;
}

interface RevenueAnalytics {
  totalRevenue: number;
  recurringRevenue: number;
  churnRate: number;
  ltv: number;
  arpu: number;
  growthRate: number;
}

interface PlatformInsights {
  systemHealth: number;
  userSatisfaction: number;
  featureAdoption: Record<string, number>;
  supportTickets: number;
  uptimeScore: number;
}

class AnalyticsService {
  private logger;
  private analyticsPath: string;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'logs/analytics.log' }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });

    this.analyticsPath = path.join(process.cwd(), 'analytics');
    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.analyticsPath, { recursive: true });
      this.logger.info('Analytics directories initialized');
    } catch (error) {
      this.logger.error('Failed to initialize analytics directories:', error);
    }
  }

  /**
   * Get advisor performance metrics
   */
  async getAdvisorMetrics(advisorId?: string): Promise<AdvisorMetrics[]> {
    // Mock advisor metrics - would come from database in production
    const mockAdvisors = Array.from({ length: 10 }, (_, i) => ({
      advisorId: `advisor_${i + 1}`,
      contentGenerated: Math.floor(Math.random() * 100) + 20,
      complianceScore: 85 + Math.random() * 15, // 85-100%
      whatsappEngagement: 60 + Math.random() * 35, // 60-95%
      revenueContribution: Math.floor(Math.random() * 50000) + 10000, // ₹10k-₹60k
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
    }));

    if (advisorId) {
      return mockAdvisors.filter(a => a.advisorId === advisorId);
    }

    return mockAdvisors;
  }

  /**
   * Analyze content performance
   */
  async getContentAnalytics(): Promise<ContentAnalytics> {
    return {
      totalContent: 12847,
      compliancePassRate: 98.7,
      engagementRate: 76.3,
      topPerformingTemplates: [
        {
          templateId: 'template_market_update',
          name: 'Daily Market Update',
          usageCount: 2847,
          successRate: 94.2
        },
        {
          templateId: 'template_sip_reminder',
          name: 'SIP Investment Reminder',
          usageCount: 1965,
          successRate: 91.8
        },
        {
          templateId: 'template_compliance_check',
          name: 'Compliance Advisory',
          usageCount: 1543,
          successRate: 96.5
        },
        {
          templateId: 'template_goal_planning',
          name: 'Financial Goal Planning',
          usageCount: 1287,
          successRate: 88.9
        },
        {
          templateId: 'template_tax_saving',
          name: 'Tax Saving Tips',
          usageCount: 987,
          successRate: 92.3
        }
      ]
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    // Mock revenue data - would come from billing service in production
    return {
      totalRevenue: 847000, // ₹8.47L
      recurringRevenue: 723950, // ₹7.24L MRR
      churnRate: 5.8,
      ltv: 51000, // ₹51k
      arpu: 4235, // ₹4,235
      growthRate: 23.7
    };
  }

  /**
   * Generate platform insights
   */
  async getPlatformInsights(): Promise<PlatformInsights> {
    return {
      systemHealth: 94.7,
      userSatisfaction: 4.6, // out of 5
      featureAdoption: {
        'ai_content_generation': 89.2,
        'compliance_checking': 96.7,
        'whatsapp_delivery': 87.3,
        'multi_language': 34.8,
        'custom_templates': 56.9,
        'analytics_dashboard': 67.4
      },
      supportTickets: 23,
      uptimeScore: 99.94
    };
  }

  /**
   * Generate advisor churn prediction
   */
  async predictChurn(): Promise<Array<{
    advisorId: string;
    riskScore: number;
    factors: string[];
    recommendation: string;
  }>> {
    // Mock churn prediction - would use ML models in production
    return [
      {
        advisorId: 'advisor_47',
        riskScore: 78.5,
        factors: ['Low content generation', 'Decreased WhatsApp engagement', 'No premium features usage'],
        recommendation: 'Offer personalized onboarding and premium trial'
      },
      {
        advisorId: 'advisor_23',
        riskScore: 65.2,
        factors: ['Compliance issues', 'Below average performance'],
        recommendation: 'Provide compliance training and support'
      },
      {
        advisorId: 'advisor_89',
        riskScore: 71.8,
        factors: ['Inactive for 5 days', 'No recent content generation'],
        recommendation: 'Re-engagement campaign with success stories'
      }
    ];
  }

  /**
   * Generate business intelligence report
   */
  async generateBIReport(): Promise<{
    summary: Record<string, any>;
    trends: Record<string, any>;
    recommendations: string[];
    kpis: Record<string, any>;
  }> {
    const [contentAnalytics, revenueAnalytics, platformInsights] = await Promise.all([
      this.getContentAnalytics(),
      this.getRevenueAnalytics(),
      this.getPlatformInsights()
    ]);

    const churnPrediction = await this.predictChurn();

    return {
      summary: {
        totalAdvisors: 142,
        activeToday: 89,
        contentGenerated: contentAnalytics.totalContent,
        revenue: revenueAnalytics.totalRevenue,
        systemHealth: platformInsights.systemHealth
      },
      trends: {
        advisorGrowth: '+15.3%',
        revenueGrowth: `+${revenueAnalytics.growthRate}%`,
        contentGrowth: '+28.4%',
        engagementGrowth: '+12.7%',
        complianceImprovement: '+5.2%'
      },
      recommendations: [
        'Focus on re-engaging at-risk advisors with personalized support',
        'Promote multi-language features to increase adoption from 34.8%',
        'Expand premium template library based on top-performing content',
        'Implement advisor success program to reduce churn rate',
        'Introduce gamification to boost daily engagement'
      ],
      kpis: {
        monthlyRecurringRevenue: revenueAnalytics.recurringRevenue,
        customerLifetimeValue: revenueAnalytics.ltv,
        averageRevenuePerUser: revenueAnalytics.arpu,
        churnRate: revenueAnalytics.churnRate,
        netPromoterScore: 67, // Mock NPS
        systemUptime: platformInsights.uptimeScore,
        complianceScore: contentAnalytics.compliancePassRate,
        advisorSatisfaction: platformInsights.userSatisfaction
      }
    };
  }

  /**
   * Export analytics data to CSV
   */
  async exportAnalytics(type: 'advisors' | 'content' | 'revenue'): Promise<string> {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      let data: any;
      let filename: string;
      let csvContent: string;

      switch (type) {
        case 'advisors':
          data = await this.getAdvisorMetrics();
          filename = `advisors_analytics_${timestamp}.csv`;
          csvContent = 'Advisor ID,Content Generated,Compliance Score,WhatsApp Engagement,Revenue Contribution,Last Active\n' +
            data.map(d => `${d.advisorId},${d.contentGenerated},${d.complianceScore.toFixed(1)},${d.whatsappEngagement.toFixed(1)},${d.revenueContribution},${d.lastActive.toISOString()}`).join('\n');
          break;

        case 'content':
          data = await this.getContentAnalytics();
          filename = `content_analytics_${timestamp}.csv`;
          csvContent = 'Metric,Value\n' +
            `Total Content,${data.totalContent}\n` +
            `Compliance Pass Rate,${data.compliancePassRate}%\n` +
            `Engagement Rate,${data.engagementRate}%\n` +
            'Template Name,Usage Count,Success Rate\n' +
            data.topPerformingTemplates.map(t => `${t.name},${t.usageCount},${t.successRate}%`).join('\n');
          break;

        case 'revenue':
          data = await this.getRevenueAnalytics();
          filename = `revenue_analytics_${timestamp}.csv`;
          csvContent = 'Metric,Value\n' +
            `Total Revenue,₹${data.totalRevenue}\n` +
            `Recurring Revenue,₹${data.recurringRevenue}\n` +
            `Churn Rate,${data.churnRate}%\n` +
            `LTV,₹${data.ltv}\n` +
            `ARPU,₹${data.arpu}\n` +
            `Growth Rate,${data.growthRate}%`;
          break;

        default:
          throw new Error('Invalid export type');
      }

      const filePath = path.join(this.analyticsPath, filename);
      await fs.writeFile(filePath, csvContent);
      
      this.logger.info(`Analytics exported successfully: ${filename}`);
      return filePath;

    } catch (error) {
      this.logger.error('Failed to export analytics:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getDashboardData(): Promise<{
    realtime: Record<string, number>;
    today: Record<string, number>;
    trends: Record<string, number>;
    alerts: Array<{ type: string; message: string; severity: string }>;
  }> {
    return {
      realtime: {
        activeUsers: 47,
        contentGenerating: 12,
        whatsappDelivering: 156,
        complianceChecking: 23,
        systemLoad: 67.8
      },
      today: {
        newAdvisors: 3,
        contentGenerated: 847,
        messagesDelivered: 1,
        complianceChecks: 2,
        revenue: 12450
      },
      trends: {
        advisorGrowthWeek: 15.3,
        contentGrowthWeek: 28.4,
        revenueGrowthWeek: 23.7,
        engagementGrowthWeek: 12.7,
        systemPerformanceWeek: 94.7
      },
      alerts: [
        {
          type: 'churn_risk',
          message: '3 advisors at high churn risk - immediate action needed',
          severity: 'high'
        },
        {
          type: 'template_performance',
          message: 'Daily Market Update template showing exceptional performance',
          severity: 'info'
        },
        {
          type: 'system_health',
          message: 'All systems operating within normal parameters',
          severity: 'success'
        }
      ]
    };
  }
}

export default new AnalyticsService();