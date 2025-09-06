// Monitoring API Route
// System health, performance metrics, and operational monitoring

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';
import os from 'os';

// Health check types
interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  error?: string;
  lastChecked: Date;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  loadAverage: number[];
}

// Check service health
async function checkServiceHealth(service: string, checkFn: () => Promise<any>): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    await checkFn();
    return {
      service,
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date()
    };
  } catch (error: any) {
    return {
      service,
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message,
      lastChecked: new Date()
    };
  }
}

// GET - System monitoring data
export async function GET(request: NextRequest) {
  try {
    // Optional auth check for sensitive metrics
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'health';
    const requireAuth = searchParams.get('auth') === 'true';

    if (requireAuth) {
      const { userId } = auth();
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    switch (type) {
      case 'health': {
        // Basic health check
        const checks: HealthCheck[] = [];

        // Check database
        checks.push(
          await checkServiceHealth('database', async () => {
            if (!supabaseAdmin) throw new Error('Database not configured');
            const { error } = await supabaseAdmin.from('advisors').select('id').limit(1);
            if (error) throw error;
          })
        );

        // Check WhatsApp API
        checks.push(
          await checkServiceHealth('whatsapp', async () => {
            const response = await fetch(
              `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
              {
                headers: {
                  'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
                }
              }
            );
            if (!response.ok) throw new Error(`WhatsApp API error: ${response.status}`);
          })
        );

        // Check OpenAI
        checks.push(
          await checkServiceHealth('openai', async () => {
            const response = await fetch('https://api.openai.com/v1/models', {
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
              }
            });
            if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
          })
        );

        // Check Gemini
        checks.push(
          await checkServiceHealth('gemini', async () => {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
            );
            if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
          })
        );

        // Overall health status
        const allHealthy = checks.every(c => c.status === 'healthy');
        const anyDown = checks.some(c => c.status === 'down');
        const overallStatus = anyDown ? 'down' : allHealthy ? 'healthy' : 'degraded';

        return NextResponse.json({
          status: overallStatus,
          checks,
          timestamp: new Date().toISOString()
        });
      }

      case 'metrics': {
        // System metrics
        const metrics: SystemMetrics = {
          cpu: {
            usage: os.loadavg()[0] / os.cpus().length * 100,
            cores: os.cpus().length
          },
          memory: {
            used: (os.totalmem() - os.freemem()) / 1024 / 1024 / 1024,
            total: os.totalmem() / 1024 / 1024 / 1024,
            percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
          },
          uptime: os.uptime(),
          loadAverage: os.loadavg()
        };

        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });
      }

      case 'database': {
        if (!supabaseAdmin) {
          return NextResponse.json(
            { error: 'Database not configured' },
            { status: 500 }
          );
        }

        // Database statistics
        const [advisors, content, messages, subscriptions] = await Promise.all([
          supabaseAdmin.from('advisors').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('content').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('whatsapp_messages').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true })
        ]);

        // Get recent activity
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const [recentContent, recentMessages] = await Promise.all([
          supabaseAdmin
            .from('content')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneDayAgo.toISOString()),
          
          supabaseAdmin
            .from('whatsapp_messages')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneDayAgo.toISOString())
        ]);

        return NextResponse.json({
          success: true,
          data: {
            tables: {
              advisors: advisors.count || 0,
              content: content.count || 0,
              messages: messages.count || 0,
              subscriptions: subscriptions.count || 0
            },
            activity: {
              contentLast24h: recentContent.count || 0,
              messagesLast24h: recentMessages.count || 0
            }
          },
          timestamp: new Date().toISOString()
        });
      }

      case 'performance': {
        if (!supabaseAdmin) {
          return NextResponse.json(
            { error: 'Database not configured' },
            { status: 500 }
          );
        }

        // Performance metrics
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        // Message delivery performance
        const { data: recentMessages } = await supabaseAdmin
          .from('whatsapp_messages')
          .select('status, created_at, sent_at, delivered_at')
          .gte('created_at', oneHourAgo.toISOString());

        let totalDeliveryTime = 0;
        let deliveredCount = 0;
        let failedCount = 0;

        recentMessages?.forEach((msg: any) => {
          if (msg.status === 'delivered' && msg.sent_at && msg.delivered_at) {
            const deliveryTime = new Date(msg.delivered_at).getTime() - new Date(msg.sent_at).getTime();
            totalDeliveryTime += deliveryTime;
            deliveredCount++;
          }
          if (msg.status === 'failed') {
            failedCount++;
          }
        });

        const avgDeliveryTime = deliveredCount > 0 ? totalDeliveryTime / deliveredCount : 0;
        const deliveryRate = recentMessages?.length ? 
          ((deliveredCount / recentMessages.length) * 100).toFixed(2) : 0;

        // Compliance check performance
        const { data: recentChecks } = await supabaseAdmin
          .from('compliance_checks')
          .select('processing_time_ms')
          .gte('created_at', oneHourAgo.toISOString());

        const avgComplianceTime = recentChecks?.length ? 
          recentChecks.reduce((sum: number, check: any) => sum + (check.processing_time_ms || 0), 0) / recentChecks.length : 0;

        return NextResponse.json({
          success: true,
          data: {
            messaging: {
              avgDeliveryTimeMs: Math.round(avgDeliveryTime),
              deliveryRate: `${deliveryRate}%`,
              failedMessages: failedCount,
              totalProcessed: recentMessages?.length || 0
            },
            compliance: {
              avgProcessingTimeMs: Math.round(avgComplianceTime),
              checksProcessed: recentChecks?.length || 0
            }
          },
          timestamp: new Date().toISOString()
        });
      }

      case 'errors': {
        if (!supabaseAdmin) {
          return NextResponse.json(
            { error: 'Database not configured' },
            { status: 500 }
          );
        }

        // Recent errors and failures
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const { data: failedMessages } = await supabaseAdmin
          .from('whatsapp_messages')
          .select('*')
          .eq('status', 'failed')
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: failedCompliance } = await supabaseAdmin
          .from('compliance_checks')
          .select('*')
          .eq('status', 'failed')
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        return NextResponse.json({
          success: true,
          data: {
            messaging: {
              failed: failedMessages?.length || 0,
              errors: failedMessages?.map((m: any) => ({
                id: m.id,
                error: m.error_message,
                timestamp: m.created_at
              }))
            },
            compliance: {
              failed: failedCompliance?.length || 0,
              errors: failedCompliance?.map((c: any) => ({
                id: c.id,
                feedback: c.feedback,
                timestamp: c.created_at
              }))
            }
          },
          timestamp: new Date().toISOString()
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid monitoring type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Monitoring error:', error);
    return NextResponse.json(
      { error: error.message || 'Monitoring failed' },
      { status: 500 }
    );
  }
}

// POST - Record monitoring events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, severity, message, metadata } = body;

    if (!supabaseAdmin) {
      // Log to console as fallback
      console.log(`[${severity}] ${event}: ${message}`, metadata);
      return NextResponse.json({
        success: true,
        logged: 'console'
      });
    }

    // Log to audit table
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'monitoring',
      action: event,
      changes: {
        severity,
        message,
        metadata
      },
      created_at: new Date().toISOString()
    });

    // Alert on critical events
    if (severity === 'critical') {
      // TODO: Send alert to admin (email, SMS, etc.)
      console.error(`CRITICAL EVENT: ${event} - ${message}`, metadata);
    }

    return NextResponse.json({
      success: true,
      logged: 'database'
    });

  } catch (error: any) {
    console.error('Event logging error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log event' },
      { status: 500 }
    );
  }
}

// Export runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';