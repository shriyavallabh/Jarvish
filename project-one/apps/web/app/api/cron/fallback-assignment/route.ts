import { NextRequest, NextResponse } from 'next/server'
import { getFallbackContentSystem } from '@/lib/services/fallback-content'
import { headers } from 'next/headers'
import { formatInTimeZone } from 'date-fns-tz'

// This endpoint should be called by a cron job at 9:30 PM IST daily (21:30)
// It assigns fallback content to advisors who don't have custom content for tomorrow

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
    
    console.log(`Starting fallback content assignment at ${istTime} IST`)

    // Get fallback system instance
    const fallbackSystem = getFallbackContentSystem()

    // Assign fallback content for advisors without custom content
    const results = await fallbackSystem.assignFallbackContent()

    // Log results
    console.log('Fallback content assignment results:', {
      assigned: results.assigned,
      failed: results.failed,
      errors: results.errors
    })

    // Check if assignment was successful
    const assignmentRate = results.assigned / (results.assigned + results.failed || 1)
    let alertLevel = 'normal'

    if (assignmentRate < 0.95) {
      alertLevel = 'critical'
      console.error('CRITICAL: Low fallback assignment rate:', {
        assignmentRate: Math.round(assignmentRate * 10000) / 100,
        assigned: results.assigned,
        failed: results.failed,
        errors: results.errors
      })
      
      // TODO: Send critical alert to administrators
    } else if (assignmentRate < 0.98) {
      alertLevel = 'warning'
      console.warn('WARNING: Some fallback assignments failed:', {
        assignmentRate: Math.round(assignmentRate * 10000) / 100,
        failed: results.failed
      })
      
      // TODO: Send warning alert to administrators
    }

    // Get fallback statistics for monitoring
    const stats = await fallbackSystem.getFallbackStats()

    return NextResponse.json({
      success: true,
      timestamp: currentTime.toISOString(),
      istTime,
      assignment: {
        assigned: results.assigned,
        failed: results.failed,
        errors: results.errors,
        assignmentRate: Math.round(assignmentRate * 10000) / 100
      },
      statistics: {
        totalAssignments: stats.totalAssignments,
        byReason: stats.byReason,
        byCategory: stats.byCategory,
        coverageRate: Math.round(stats.coverageRate * 100) / 100
      },
      alertLevel,
      message: results.assigned > 0 
        ? `Successfully assigned fallback content to ${results.assigned} advisors`
        : 'All advisors have custom content for tomorrow - no fallback needed!'
    })
  } catch (error) {
    console.error('Fallback assignment cron error:', error)
    
    // TODO: Send critical system error alert to administrators
    
    return NextResponse.json(
      { 
        error: 'Failed to assign fallback content',
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
    const body = await request.json()
    
    if (body.adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const fallbackSystem = getFallbackContentSystem()
    
    // Allow specifying target date for manual assignment
    const targetDate = body.targetDate ? new Date(body.targetDate) : new Date()
    
    const results = await fallbackSystem.assignFallbackContent(targetDate)

    return NextResponse.json({
      success: true,
      assigned: results.assigned,
      failed: results.failed,
      errors: results.errors,
      message: 'Fallback content assignment manually triggered',
      timestamp: new Date().toISOString(),
      targetDate: targetDate.toISOString()
    })
  } catch (error) {
    console.error('Manual fallback assignment error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger fallback assignment',
        details: error.message 
      },
      { status: 500 }
    )
  }
}