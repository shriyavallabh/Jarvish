import { NextRequest, NextResponse } from 'next/server'
import { getDeliveryScheduler } from '@/lib/services/delivery-scheduler'
import { getFallbackContentSystem } from '@/lib/services/fallback-content'
import { headers } from 'next/headers'
import { formatInTimeZone } from 'date-fns-tz'

// This endpoint should be called by a cron job at 5:55 AM IST daily
// It schedules all content for 6:00 AM delivery with jitter and ensures zero silent days

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const headersList = headers()
    const cronSecret = headersList.get('x-cron-secret')
    
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentTime = new Date()
    const istTime = formatInTimeZone(currentTime, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss')
    
    console.log(`Starting daily WhatsApp content delivery scheduling at ${istTime} IST`)

    // Get scheduler instance
    const scheduler = getDeliveryScheduler()

    // Schedule daily content for 6 AM IST
    const results = await scheduler.scheduleDailyDelivery()

    // Log initial results
    console.log('Daily delivery scheduling results:', {
      scheduled: results.scheduled,
      failed: results.failed,
      errors: results.errors,
      estimatedCompletion: results.estimatedCompletion
    })

    // Check for critical failure rate
    const failureRate = results.failed / (results.scheduled + results.failed || 1)
    let alertLevel = 'normal'

    if (failureRate > 0.05) {
      alertLevel = 'critical'
      console.error('CRITICAL: High failure rate in daily delivery:', {
        failureRate: Math.round(failureRate * 10000) / 100, // Percentage with 2 decimals
        scheduled: results.scheduled,
        failed: results.failed,
        errors: results.errors
      })
      
      // TODO: Send critical alert to administrators
      // This should trigger immediate notifications via email, Slack, SMS
    } else if (failureRate > 0.02) {
      alertLevel = 'warning'
      console.warn('WARNING: Elevated failure rate in daily delivery:', {
        failureRate: Math.round(failureRate * 10000) / 100,
        errors: results.errors
      })
      
      // TODO: Send warning alert to administrators
    }

    // Get SLA metrics for monitoring
    const slaMetrics = await scheduler.getSLAMetrics()
    
    // Check SLA compliance
    if (slaMetrics.slaStatus === 'FAIL') {
      console.error('SLA VIOLATION: Delivery rate below 99% threshold:', {
        deliveryRate: Math.round(slaMetrics.deliveryRate * 10000) / 100,
        violations: slaMetrics.violations
      })
      
      // TODO: Trigger SLA violation alerts
    }

    return NextResponse.json({
      success: true,
      timestamp: currentTime.toISOString(),
      istTime,
      scheduling: {
        scheduled: results.scheduled,
        failed: results.failed,
        errors: results.errors,
        estimatedCompletion: results.estimatedCompletion,
        failureRate: Math.round(failureRate * 10000) / 100
      },
      sla: {
        status: slaMetrics.slaStatus,
        deliveryRate: Math.round(slaMetrics.deliveryRate * 10000) / 100,
        totalScheduled: slaMetrics.totalScheduled,
        totalDelivered: slaMetrics.totalDelivered,
        totalFailed: slaMetrics.totalFailed
      },
      alertLevel,
      queueHealth: {
        peakConcurrency: slaMetrics.peakConcurrency,
        avgDeliveryTime: slaMetrics.avgDeliveryTime
      }
    })
  } catch (error) {
    console.error('Daily delivery cron error:', error)
    
    // TODO: Send critical system error alert to administrators
    
    return NextResponse.json(
      { 
        error: 'Failed to schedule daily delivery',
        details: error.message,
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    )
  }
}

// POST endpoint for manual triggering (admin use)
export async function POST(request: NextRequest) {
  try {
    // This should verify admin authentication
    // For now, checking for a simple admin key
    const body = await request.json()
    
    if (body.adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get scheduler instance
    const scheduler = getWhatsAppScheduler()

    // Schedule daily content
    const results = await scheduler.scheduleDailyContent()

    return NextResponse.json({
      success: true,
      scheduled: results.scheduled,
      failed: results.failed,
      errors: results.errors,
      message: 'Daily delivery manually triggered',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Manual daily delivery trigger error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger daily delivery',
        details: error.message 
      },
      { status: 500 }
    )
  }
}