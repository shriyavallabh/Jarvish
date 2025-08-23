import { NextRequest, NextResponse } from 'next/server'
import { getContentScheduler } from '@/lib/services/scheduler/content-scheduler'
import { getQueueManager } from '@/lib/services/scheduler/queue-manager'
import { getFallbackAssigner } from '@/lib/services/scheduler/fallback-assigner'
import { getDeliveryMonitor } from '@/lib/services/scheduler/delivery-monitor'
import { getWhatsAppQueue } from '@/lib/queue/whatsapp-queue'

// API endpoints for scheduler management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'stats': {
        // Get overall scheduler statistics
        const scheduler = getContentScheduler()
        const queueManager = getQueueManager()
        const fallbackAssigner = getFallbackAssigner()
        const deliveryMonitor = getDeliveryMonitor()
        const whatsappQueue = getWhatsAppQueue()
        
        const [
          schedulerStats,
          queueMetrics,
          fallbackStats,
          dashboard,
          whatsappStats,
        ] = await Promise.all([
          scheduler.getQueueStats(),
          queueManager.getAllQueueMetrics(),
          fallbackAssigner.getFallbackStats(),
          deliveryMonitor.getDashboard(),
          whatsappQueue.getStats(),
        ])
        
        return NextResponse.json({
          success: true,
          data: {
            scheduler: schedulerStats,
            queues: queueMetrics,
            fallback: fallbackStats,
            monitoring: dashboard,
            whatsapp: whatsappStats,
            timestamp: new Date().toISOString(),
          },
        })
      }
      
      case 'queue-metrics': {
        // Get detailed queue metrics
        const queueManager = getQueueManager()
        const queueName = searchParams.get('queue')
        
        if (queueName) {
          const metrics = await queueManager.getQueueMetrics(queueName)
          return NextResponse.json({
            success: true,
            data: metrics,
          })
        } else {
          const metrics = await queueManager.getAllQueueMetrics()
          return NextResponse.json({
            success: true,
            data: metrics,
          })
        }
      }
      
      case 'sla-metrics': {
        // Get SLA metrics
        const monitor = getDeliveryMonitor()
        const dashboard = await monitor.getDashboard()
        
        return NextResponse.json({
          success: true,
          data: dashboard?.sla || null,
        })
      }
      
      case 'historical': {
        // Get historical metrics
        const monitor = getDeliveryMonitor()
        const type = searchParams.get('type') as 'delivery' | 'sla' | 'queue'
        const hours = parseInt(searchParams.get('hours') || '24')
        
        if (!type) {
          return NextResponse.json({
            success: false,
            error: 'Metric type required',
          }, { status: 400 })
        }
        
        const metrics = await monitor.getHistoricalMetrics(type, hours)
        
        return NextResponse.json({
          success: true,
          data: metrics,
        })
      }
      
      case 'health': {
        // Get system health
        const monitor = getDeliveryMonitor()
        const dashboard = await monitor.getDashboard()
        
        return NextResponse.json({
          success: true,
          data: dashboard?.health || null,
        })
      }
      
      default: {
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 })
      }
    }
  } catch (error) {
    console.error('Scheduler API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

// Schedule operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body
    
    switch (action) {
      case 'schedule-daily': {
        // Schedule daily content delivery
        const scheduler = getContentScheduler()
        const result = await scheduler.scheduleDailyDelivery()
        
        return NextResponse.json({
          success: true,
          data: result,
        })
      }
      
      case 'run-fallback': {
        // Run fallback assignment
        const fallbackAssigner = getFallbackAssigner()
        const result = await fallbackAssigner.runFallbackAssignment()
        
        return NextResponse.json({
          success: true,
          data: result,
        })
      }
      
      case 'send-immediate': {
        // Send immediate WhatsApp message
        const { advisorId, contentId, phoneNumber } = data
        
        if (!advisorId || !contentId || !phoneNumber) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields',
          }, { status: 400 })
        }
        
        const whatsappQueue = getWhatsAppQueue()
        const jobId = await whatsappQueue.sendMessage({
          to: phoneNumber,
          template: {
            name: 'daily_content',
            language: 'en',
            components: data.templateComponents || [],
          },
          metadata: {
            advisorId,
            contentId,
            deliveryId: data.deliveryId,
            priority: data.priority || 'normal',
          },
        })
        
        return NextResponse.json({
          success: true,
          data: { jobId },
        })
      }
      
      case 'bulk-send': {
        // Bulk send messages
        const { messages } = data
        
        if (!messages || !Array.isArray(messages)) {
          return NextResponse.json({
            success: false,
            error: 'Messages array required',
          }, { status: 400 })
        }
        
        const whatsappQueue = getWhatsAppQueue()
        const jobIds = await whatsappQueue.bulkSend(messages)
        
        return NextResponse.json({
          success: true,
          data: { jobIds },
        })
      }
      
      case 'pause-queue': {
        // Pause a specific queue
        const { queueName } = data
        
        if (!queueName) {
          return NextResponse.json({
            success: false,
            error: 'Queue name required',
          }, { status: 400 })
        }
        
        const queueManager = getQueueManager()
        await queueManager.pauseQueue(queueName)
        
        return NextResponse.json({
          success: true,
          message: `Queue ${queueName} paused`,
        })
      }
      
      case 'resume-queue': {
        // Resume a specific queue
        const { queueName } = data
        
        if (!queueName) {
          return NextResponse.json({
            success: false,
            error: 'Queue name required',
          }, { status: 400 })
        }
        
        const queueManager = getQueueManager()
        await queueManager.resumeQueue(queueName)
        
        return NextResponse.json({
          success: true,
          message: `Queue ${queueName} resumed`,
        })
      }
      
      case 'retry-failed': {
        // Retry failed jobs
        const { queueName, jobIds } = data
        
        if (!queueName) {
          return NextResponse.json({
            success: false,
            error: 'Queue name required',
          }, { status: 400 })
        }
        
        const queueManager = getQueueManager()
        const retryCount = await queueManager.retryFailedJobs(queueName, jobIds)
        
        return NextResponse.json({
          success: true,
          data: { retryCount },
        })
      }
      
      case 'clean-queue': {
        // Clean old jobs from queue
        const { queueName, grace, limit, status } = data
        
        if (!queueName) {
          return NextResponse.json({
            success: false,
            error: 'Queue name required',
          }, { status: 400 })
        }
        
        const queueManager = getQueueManager()
        const cleanedJobs = await queueManager.cleanQueue(
          queueName,
          grace || 0,
          limit || 100,
          status
        )
        
        return NextResponse.json({
          success: true,
          data: { cleanedCount: cleanedJobs.length },
        })
      }
      
      default: {
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 })
      }
    }
  } catch (error) {
    console.error('Scheduler API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

// Delete operations
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'drain-queue': {
        // Drain all jobs from a queue
        const queueName = searchParams.get('queue')
        
        if (!queueName) {
          return NextResponse.json({
            success: false,
            error: 'Queue name required',
          }, { status: 400 })
        }
        
        const queueManager = getQueueManager()
        await queueManager.drainQueue(queueName)
        
        return NextResponse.json({
          success: true,
          message: `Queue ${queueName} drained`,
        })
      }
      
      default: {
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 })
      }
    }
  } catch (error) {
    console.error('Scheduler API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}