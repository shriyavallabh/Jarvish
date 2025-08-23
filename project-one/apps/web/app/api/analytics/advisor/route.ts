// Advisor Analytics API
// Provides personalized analytics and insights for individual advisors

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { analyticsEngine } from '@/lib/services/analytics-engine';
import { churnPredictionModel } from '@/lib/services/churn-prediction';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const advisorId = searchParams.get('advisor_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const metrics = searchParams.get('metrics')?.split(',') || ['engagement', 'content', 'compliance'];
    const includeInsights = searchParams.get('include_insights') === 'true';
    const includeChurn = searchParams.get('include_churn') === 'true';

    if (!advisorId) {
      return NextResponse.json({ error: 'advisor_id is required' }, { status: 400 });
    }

    // Default to last 7 days if no date range provided
    const defaultEndDate = endDate || new Date().toISOString();
    const defaultStartDate = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch advisor metrics
    const analyticsResponse = await analyticsEngine.getAdvisorMetrics(
      advisorId,
      defaultStartDate,
      defaultEndDate
    );

    if (!analyticsResponse.success) {
      return NextResponse.json(
        { error: 'Failed to fetch advisor analytics' },
        { status: 500 }
      );
    }

    const response: any = {
      advisor_metrics: analyticsResponse.data,
      generated_at: analyticsResponse.generated_at,
      metadata: analyticsResponse.metadata
    };

    // Add weekly insights if requested
    if (includeInsights) {
      const insightsResponse = await analyticsEngine.generateWeeklyInsights(advisorId);
      if (insightsResponse.success) {
        response.weekly_insights = insightsResponse.data;
      }
    }

    // Add churn prediction if requested
    if (includeChurn) {
      const churnResponse = await churnPredictionModel.predictAdvisorChurn(advisorId);
      if (churnResponse.success) {
        response.churn_prediction = churnResponse.data;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in advisor analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { advisor_id, action_type, feedback } = body;

    if (!advisor_id || !action_type) {
      return NextResponse.json(
        { error: 'advisor_id and action_type are required' },
        { status: 400 }
      );
    }

    // Handle different action types
    switch (action_type) {
      case 'acknowledge_insight':
        // Log insight acknowledgment for feedback learning
        console.log(`Advisor ${advisor_id} acknowledged insight`);
        break;
      
      case 'provide_feedback':
        // Store feedback for improving AI insights
        console.log(`Feedback from advisor ${advisor_id}:`, feedback);
        break;
      
      case 'request_detailed_analysis':
        // Generate more detailed analysis
        const detailedAnalysis = await analyticsEngine.generateWeeklyInsights(advisor_id);
        return NextResponse.json({
          success: true,
          detailed_analysis: detailedAnalysis.data
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action_type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in advisor analytics POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}