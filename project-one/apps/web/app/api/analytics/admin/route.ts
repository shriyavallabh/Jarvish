// Admin Analytics API
// Provides platform-wide analytics and business intelligence for administrators

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { analyticsEngine } from '@/lib/services/analytics-engine';
import { businessIntelligenceEngine } from '@/lib/services/business-intelligence';
import { churnPredictionModel } from '@/lib/services/churn-prediction';

// Admin role check (you might want to implement proper role-based access control)
const isAdmin = (userId: string): boolean => {
  // This should integrate with your user management system
  // For now, checking against environment variable or hardcoded admin IDs
  const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  return adminIds.includes(userId);
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dashboardType = searchParams.get('dashboard_type') || 'overview';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const includeAlerts = searchParams.get('include_alerts') === 'true';

    // Default to last 30 days if no date range provided
    const defaultEndDate = endDate || new Date().toISOString();
    const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const response: any = {
      dashboard_type: dashboardType,
      period: { start: defaultStartDate, end: defaultEndDate },
      generated_at: new Date().toISOString()
    };

    switch (dashboardType) {
      case 'overview':
        // Get comprehensive business intelligence
        const biResponse = await businessIntelligenceEngine.getBusinessDashboard(
          defaultStartDate,
          defaultEndDate
        );
        
        if (biResponse.success) {
          response.business_intelligence = biResponse.data;
          response.metadata = biResponse.metadata;
        }

        // Get platform churn analysis
        const churnAnalysis = await churnPredictionModel.getPlatformChurnAnalysis();
        response.churn_analysis = churnAnalysis;

        // Get content performance analytics
        const contentResponse = await analyticsEngine.getContentPerformanceAnalytics(
          defaultStartDate,
          defaultEndDate
        );
        
        if (contentResponse.success) {
          response.content_performance = contentResponse.data;
        }
        break;

      case 'revenue':
        // Detailed revenue analytics
        const revenueAnalytics = await businessIntelligenceEngine.getRevenueAnalytics(12);
        response.revenue_analytics = revenueAnalytics;
        break;

      case 'users':
        // User acquisition and retention analytics
        const userAnalytics = await businessIntelligenceEngine.getUserAcquisitionAnalytics();
        response.user_analytics = userAnalytics;
        break;

      case 'content':
        // Detailed content performance
        const detailedContent = await analyticsEngine.getContentPerformanceAnalytics(
          defaultStartDate,
          defaultEndDate
        );
        
        if (detailedContent.success) {
          response.detailed_content_analytics = detailedContent.data;
        }
        break;

      case 'churn':
        // Detailed churn analysis and predictions
        const detailedChurn = await churnPredictionModel.getPlatformChurnAnalysis();
        response.detailed_churn_analysis = detailedChurn;
        
        // Get time series churn data
        const churnTimeSeries = await analyticsEngine.getTimeSeriesData('churn_rate', undefined, 90);
        response.churn_time_series = churnTimeSeries;
        break;

      default:
        return NextResponse.json(
          { error: `Invalid dashboard_type: ${dashboardType}` },
          { status: 400 }
        );
    }

    // Add platform alerts if requested
    if (includeAlerts) {
      const alerts = await businessIntelligenceEngine.generatePlatformAlerts();
      response.platform_alerts = alerts;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in admin analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action_type, ...params } = body;

    switch (action_type) {
      case 'execute_retention_interventions':
        // Execute automated retention actions for at-risk advisors
        const churnAnalysis = await churnPredictionModel.getPlatformChurnAnalysis();
        const interventionResults = await churnPredictionModel.executeRetentionInterventions([
          ...churnAnalysis.intervention_pipeline.high_priority,
          ...churnAnalysis.intervention_pipeline.medium_priority
        ]);
        
        return NextResponse.json({
          success: true,
          intervention_results: interventionResults
        });

      case 'acknowledge_alert':
        // Acknowledge platform alert
        const { alert_id } = params;
        if (!alert_id) {
          return NextResponse.json({ error: 'alert_id is required' }, { status: 400 });
        }
        
        // In a real implementation, you'd update the alert status in the database
        console.log(`Admin ${userId} acknowledged alert ${alert_id}`);
        
        return NextResponse.json({
          success: true,
          message: `Alert ${alert_id} acknowledged`
        });

      case 'generate_forecast':
        // Generate business forecasting
        const { forecast_type, periods } = params;
        
        if (forecast_type === 'revenue') {
          const revenueAnalytics = await businessIntelligenceEngine.getRevenueAnalytics(periods || 12);
          return NextResponse.json({
            success: true,
            forecast: revenueAnalytics.forecast
          });
        }
        
        return NextResponse.json({ error: 'Invalid forecast_type' }, { status: 400 });

      case 'export_dashboard':
        // Trigger dashboard export
        const { dashboard_type, format } = params;
        
        // In a real implementation, you'd queue an export job
        const exportJobId = Math.random().toString(36).substr(2, 9);
        
        return NextResponse.json({
          success: true,
          export_job_id: exportJobId,
          estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
          download_url: `/api/exports/${exportJobId}`
        });

      case 'refresh_analytics':
        // Force refresh of cached analytics data
        // In a real implementation, you'd clear relevant caches
        console.log(`Admin ${userId} requested analytics refresh`);
        
        return NextResponse.json({
          success: true,
          message: 'Analytics cache refreshed'
        });

      default:
        return NextResponse.json(
          { error: `Invalid action_type: ${action_type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin analytics POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}