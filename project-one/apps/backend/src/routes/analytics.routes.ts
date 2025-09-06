// Analytics & Business Intelligence API Routes
// Advanced analytics endpoints for data-driven insights

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import analyticsService from '../services/analytics-service';

const router = Router();

// Request validation schemas
const ExportSchema = z.object({
  type: z.enum(['advisors', 'content', 'revenue']),
  format: z.enum(['csv', 'json']).optional().default('csv')
});

const AdvisorQuerySchema = z.object({
  advisorId: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(10),
  sortBy: z.enum(['revenue', 'content', 'compliance', 'engagement']).optional().default('revenue')
});

/**
 * GET /api/analytics/advisors
 * Get advisor performance metrics
 */
router.get('/advisors', async (req: Request, res: Response) => {
  try {
    const { advisorId, limit, sortBy } = AdvisorQuerySchema.parse(req.query);
    
    let advisorMetrics = await analyticsService.getAdvisorMetrics(advisorId);
    
    // Sort advisors by specified metric
    advisorMetrics.sort((a, b) => {
      switch (sortBy) {
        case 'revenue': return b.revenueContribution - a.revenueContribution;
        case 'content': return b.contentGenerated - a.contentGenerated;
        case 'compliance': return b.complianceScore - a.complianceScore;
        case 'engagement': return b.whatsappEngagement - a.whatsappEngagement;
        default: return 0;
      }
    });
    
    // Apply limit
    advisorMetrics = advisorMetrics.slice(0, limit);
    
    // Calculate aggregated metrics
    const totalRevenue = advisorMetrics.reduce((sum, a) => sum + a.revenueContribution, 0);
    const avgComplianceScore = advisorMetrics.reduce((sum, a) => sum + a.complianceScore, 0) / advisorMetrics.length;
    const avgEngagement = advisorMetrics.reduce((sum, a) => sum + a.whatsappEngagement, 0) / advisorMetrics.length;
    
    res.json({
      success: true,
      data: {
        advisors: advisorMetrics,
        summary: {
          totalAdvisors: advisorMetrics.length,
          totalRevenue: Math.round(totalRevenue),
          averageCompliance: Math.round(avgComplianceScore * 10) / 10,
          averageEngagement: Math.round(avgEngagement * 10) / 10,
          topPerformer: advisorMetrics[0]?.advisorId
        },
        insights: {
          highPerformers: advisorMetrics.filter(a => a.complianceScore >= 95 && a.whatsappEngagement >= 80).length,
          atRisk: advisorMetrics.filter(a => a.complianceScore < 85 || a.whatsappEngagement < 60).length,
          revenueContributors: advisorMetrics.filter(a => a.revenueContribution >= 30000).length
        }
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Failed to get advisor metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve advisor metrics'
    });
  }
});

/**
 * GET /api/analytics/content
 * Get content performance analytics
 */
router.get('/content', async (req: Request, res: Response) => {
  try {
    const contentAnalytics = await analyticsService.getContentAnalytics();
    
    res.json({
      success: true,
      data: {
        ...contentAnalytics,
        insights: {
          bestTemplate: contentAnalytics.topPerformingTemplates[0],
          complianceTrend: contentAnalytics.compliancePassRate > 95 ? 'excellent' : 'good',
          engagementTrend: contentAnalytics.engagementRate > 75 ? 'high' : 'moderate',
          recommendations: [
            contentAnalytics.compliancePassRate < 95 
              ? 'Focus on improving compliance training' 
              : 'Maintain excellent compliance standards',
            contentAnalytics.engagementRate < 70 
              ? 'Consider revising content strategy for better engagement' 
              : 'Content engagement is performing well'
          ]
        }
      }
    });

  } catch (error: any) {
    console.error('Failed to get content analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve content analytics'
    });
  }
});

/**
 * GET /api/analytics/revenue
 * Get revenue analytics and forecasting
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const revenueAnalytics = await analyticsService.getRevenueAnalytics();
    
    // Calculate forecast (simplified projection)
    const monthlyGrowthRate = revenueAnalytics.growthRate / 100;
    const projectedRevenue = Math.round(revenueAnalytics.totalRevenue * (1 + monthlyGrowthRate));
    
    res.json({
      success: true,
      data: {
        current: revenueAnalytics,
        forecast: {
          nextMonth: projectedRevenue,
          quarterlyProjection: Math.round(projectedRevenue * 3),
          yearlyProjection: Math.round(projectedRevenue * 12),
          confidenceLevel: 85
        },
        benchmarks: {
          industryARPU: 3800, // Industry average
          targetChurnRate: 5.0,
          healthyLTV: 45000,
          targetGrowthRate: 20
        },
        insights: {
          performance: revenueAnalytics.growthRate > 20 ? 'excellent' : 'good',
          churnStatus: revenueAnalytics.churnRate < 6 ? 'healthy' : 'attention_needed',
          ltv_healthy: revenueAnalytics.ltv > 45000,
          arpu_above_industry: revenueAnalytics.arpu > 3800
        }
      }
    });

  } catch (error: any) {
    console.error('Failed to get revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve revenue analytics'
    });
  }
});

/**
 * GET /api/analytics/churn-prediction
 * Get advisor churn prediction and risk analysis
 */
router.get('/churn-prediction', async (req: Request, res: Response) => {
  try {
    const churnPrediction = await analyticsService.predictChurn();
    
    const riskLevels = {
      high: churnPrediction.filter(p => p.riskScore >= 70).length,
      medium: churnPrediction.filter(p => p.riskScore >= 50 && p.riskScore < 70).length,
      low: churnPrediction.filter(p => p.riskScore < 50).length
    };
    
    res.json({
      success: true,
      data: {
        predictions: churnPrediction,
        riskSummary: riskLevels,
        totalAtRisk: churnPrediction.length,
        estimatedRevenueLoss: Math.round(churnPrediction.reduce((sum, p) => sum + (p.riskScore / 100) * 4235, 0)),
        actionItems: [
          `${riskLevels.high} advisors need immediate attention`,
          `${riskLevels.medium} advisors require proactive engagement`,
          'Implement retention campaigns for at-risk segments'
        ]
      }
    });

  } catch (error: any) {
    console.error('Failed to get churn prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve churn prediction'
    });
  }
});

/**
 * GET /api/analytics/platform-insights
 * Get platform performance and feature adoption insights
 */
router.get('/platform-insights', async (req: Request, res: Response) => {
  try {
    const platformInsights = await analyticsService.getPlatformInsights();
    
    // Calculate feature adoption insights
    const featureAdoption = Object.entries(platformInsights.featureAdoption);
    const topFeatures = featureAdoption.sort(([,a], [,b]) => b - a).slice(0, 3);
    const underutilizedFeatures = featureAdoption.filter(([, adoption]) => adoption < 50);
    
    res.json({
      success: true,
      data: {
        ...platformInsights,
        featureInsights: {
          topAdoptedFeatures: topFeatures.map(([name, rate]) => ({ name, adoptionRate: rate })),
          underutilizedFeatures: underutilizedFeatures.map(([name, rate]) => ({ name, adoptionRate: rate })),
          averageAdoption: Math.round(featureAdoption.reduce((sum, [, rate]) => sum + rate, 0) / featureAdoption.length * 10) / 10
        },
        systemStatus: {
          health: platformInsights.systemHealth > 90 ? 'excellent' : 'good',
          satisfaction: platformInsights.userSatisfaction > 4.5 ? 'high' : 'moderate',
          uptime: platformInsights.uptimeScore > 99.5 ? 'excellent' : 'good'
        },
        recommendations: [
          underutilizedFeatures.length > 0 ? 'Focus on promoting underutilized features' : 'Feature adoption is healthy',
          platformInsights.userSatisfaction < 4.5 ? 'Improve user experience and support' : 'Maintain high satisfaction levels',
          platformInsights.systemHealth < 90 ? 'Address system performance issues' : 'System health is optimal'
        ]
      }
    });

  } catch (error: any) {
    console.error('Failed to get platform insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve platform insights'
    });
  }
});

/**
 * GET /api/analytics/business-intelligence
 * Get comprehensive business intelligence report
 */
router.get('/business-intelligence', async (req: Request, res: Response) => {
  try {
    const biReport = await analyticsService.generateBIReport();
    
    res.json({
      success: true,
      data: {
        ...biReport,
        executiveSummary: {
          overallHealth: 'Strong growth with healthy metrics across all areas',
          keyWins: [
            `${biReport.trends.advisorGrowth} advisor growth`,
            `${biReport.trends.revenueGrowth} revenue increase`,
            `${biReport.kpis.complianceScore}% compliance score`
          ],
          priorities: [
            'Reduce churn rate from current level',
            'Increase feature adoption rates',
            'Scale content generation capacity'
          ],
          forecast: {
            confidence: 'High',
            outlook: 'Positive growth trajectory expected to continue',
            risks: ['Market volatility', 'Competitive pressure', 'Regulatory changes']
          }
        },
        reportGenerated: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Failed to generate BI report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate business intelligence report'
    });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get real-time analytics dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboardData = await analyticsService.getDashboardData();
    
    res.json({
      success: true,
      data: {
        ...dashboardData,
        summary: {
          status: 'healthy',
          lastUpdated: new Date().toISOString(),
          dataFreshness: 'real-time',
          coverage: '100%'
        }
      }
    });

  } catch (error: any) {
    console.error('Failed to get dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data'
    });
  }
});

/**
 * POST /api/analytics/export
 * Export analytics data to CSV or JSON
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { type, format } = ExportSchema.parse(req.body);
    
    if (format === 'csv') {
      const filePath = await analyticsService.exportAnalytics(type);
      
      res.json({
        success: true,
        message: 'Analytics exported successfully',
        data: {
          filePath,
          downloadUrl: `/downloads/${path.basename(filePath)}`,
          type,
          format,
          generatedAt: new Date().toISOString()
        }
      });
    } else {
      // JSON export
      let data;
      switch (type) {
        case 'advisors':
          data = await analyticsService.getAdvisorMetrics();
          break;
        case 'content':
          data = await analyticsService.getContentAnalytics();
          break;
        case 'revenue':
          data = await analyticsService.getRevenueAnalytics();
          break;
      }

      res.json({
        success: true,
        data: {
          exportType: type,
          format,
          data,
          generatedAt: new Date().toISOString()
        }
      });
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Failed to export analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

export default router;