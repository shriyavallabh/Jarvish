// Advanced Analytics API Route with Supabase
// Provides comprehensive analytics for advisors and admin

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createServerClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';

// Get analytics data
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'overview';
    const advisorId = searchParams.get('advisorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const metric = searchParams.get('metric');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    let data: any = {};

    switch (type) {
      case 'overview': {
        // Get overview metrics
        const [advisors, content, messages, subscriptions] = await Promise.all([
          supabaseAdmin.from('advisors').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('content').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('whatsapp_messages').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
        ]);

        data = {
          totalAdvisors: advisors.count || 0,
          totalContent: content.count || 0,
          totalMessages: messages.count || 0,
          activeSubscriptions: subscriptions.count || 0
        };
        break;
      }

      case 'advisor': {
        if (!advisorId) {
          return NextResponse.json(
            { error: 'Advisor ID required' },
            { status: 400 }
          );
        }

        // Get advisor-specific metrics
        const [advisor, content, messages, analytics] = await Promise.all([
          supabaseAdmin
            .from('advisors')
            .select('*')
            .eq('id', advisorId)
            .single(),
          
          supabaseAdmin
            .from('content')
            .select('status, count', { count: 'exact' })
            .eq('advisor_id', advisorId),
          
          supabaseAdmin
            .from('whatsapp_messages')
            .select('status, count', { count: 'exact' })
            .eq('advisor_id', advisorId),
          
          supabaseAdmin
            .from('analytics')
            .select('*')
            .eq('advisor_id', advisorId)
            .order('recorded_at', { ascending: false })
            .limit(100)
        ]);

        // Process content stats
        const contentStats = {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };

        content.data?.forEach((item: any) => {
          contentStats.total++;
          if (item.status === 'approved') contentStats.approved++;
          if (item.status === 'pending_compliance') contentStats.pending++;
          if (item.status === 'rejected') contentStats.rejected++;
        });

        // Process message stats
        const messageStats = {
          total: 0,
          delivered: 0,
          failed: 0,
          read: 0
        };

        messages.data?.forEach((item: any) => {
          messageStats.total++;
          if (item.status === 'delivered') messageStats.delivered++;
          if (item.status === 'failed') messageStats.failed++;
          if (item.status === 'read') messageStats.read++;
        });

        data = {
          advisor: advisor.data,
          content: contentStats,
          messages: messageStats,
          analytics: analytics.data
        };
        break;
      }

      case 'content': {
        // Get content analytics
        let query = supabaseAdmin
          .from('content')
          .select('*, compliance_checks(*)');

        if (advisorId) {
          query = query.eq('advisor_id', advisorId);
        }

        if (startDate) {
          query = query.gte('created_at', startDate);
        }

        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data: contentData } = await query
          .order('created_at', { ascending: false })
          .limit(100);

        // Calculate compliance metrics
        const complianceStats = {
          totalChecked: 0,
          passed: 0,
          failed: 0,
          averageScore: 0
        };

        let totalScore = 0;
        contentData?.forEach((content: any) => {
          if (content.compliance_checks?.length > 0) {
            complianceStats.totalChecked++;
            const latestCheck = content.compliance_checks[0];
            if (latestCheck.status === 'passed') complianceStats.passed++;
            if (latestCheck.status === 'failed') complianceStats.failed++;
            totalScore += latestCheck.score || 0;
          }
        });

        if (complianceStats.totalChecked > 0) {
          complianceStats.averageScore = totalScore / complianceStats.totalChecked;
        }

        data = {
          content: contentData,
          compliance: complianceStats
        };
        break;
      }

      case 'delivery': {
        // Get delivery analytics
        let query = supabaseAdmin
          .from('whatsapp_messages')
          .select('*');

        if (advisorId) {
          query = query.eq('advisor_id', advisorId);
        }

        if (startDate) {
          query = query.gte('created_at', startDate);
        }

        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data: messages } = await query;

        // Calculate delivery metrics
        const deliveryStats = {
          total: messages?.length || 0,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          deliveryRate: 0,
          readRate: 0
        };

        messages?.forEach((msg: any) => {
          if (msg.status === 'sent') deliveryStats.sent++;
          if (msg.status === 'delivered') deliveryStats.delivered++;
          if (msg.status === 'read') deliveryStats.read++;
          if (msg.status === 'failed') deliveryStats.failed++;
        });

        if (deliveryStats.sent > 0) {
          deliveryStats.deliveryRate = (deliveryStats.delivered / deliveryStats.sent) * 100;
        }

        if (deliveryStats.delivered > 0) {
          deliveryStats.readRate = (deliveryStats.read / deliveryStats.delivered) * 100;
        }

        data = deliveryStats;
        break;
      }

      case 'revenue': {
        // Get revenue analytics
        const { data: subscriptions } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('status', 'active');

        const revenueStats = {
          totalMRR: 0,
          byTier: {
            basic: { count: 0, revenue: 0 },
            standard: { count: 0, revenue: 0 },
            pro: { count: 0, revenue: 0 }
          },
          churnRate: 0,
          growthRate: 0
        };

        subscriptions?.forEach((sub: any) => {
          revenueStats.totalMRR += sub.amount;
          if (sub.tier in revenueStats.byTier) {
            revenueStats.byTier[sub.tier as keyof typeof revenueStats.byTier].count++;
            revenueStats.byTier[sub.tier as keyof typeof revenueStats.byTier].revenue += sub.amount;
          }
        });

        data = revenueStats;
        break;
      }

      case 'custom': {
        // Custom metric query
        if (!metric) {
          return NextResponse.json(
            { error: 'Metric type required' },
            { status: 400 }
          );
        }

        let query = supabaseAdmin
          .from('analytics')
          .select('*')
          .eq('metric_type', metric);

        if (advisorId) {
          query = query.eq('advisor_id', advisorId);
        }

        if (startDate) {
          query = query.gte('recorded_at', startDate);
        }

        if (endDate) {
          query = query.lte('recorded_at', endDate);
        }

        const { data: metrics } = await query
          .order('recorded_at', { ascending: false })
          .limit(1000);

        data = metrics;
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Record analytics data
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { advisorId, metricType, metricValue, dimensions, metadata } = body;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Record the metric
    const { data, error } = await supabaseAdmin
      .from('analytics')
      .insert({
        advisor_id: advisorId,
        metric_type: metricType,
        metric_value: metricValue,
        dimension_1: dimensions?.dimension1,
        dimension_2: dimensions?.dimension2,
        dimension_3: dimensions?.dimension3,
        metadata: metadata || {},
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Analytics recording error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record analytics' },
      { status: 500 }
    );
  }
}

// Export runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';