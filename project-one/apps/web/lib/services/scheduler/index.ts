// Export all scheduler services
export { ContentScheduler, getContentScheduler } from './content-scheduler'
export { QueueManager, getQueueManager } from './queue-manager'
export { FallbackAssigner, getFallbackAssigner } from './fallback-assigner'
export { DeliveryMonitor, getDeliveryMonitor } from './delivery-monitor'

// Export types
export type { ContentDeliveryJob, ScheduleOptions } from './content-scheduler'
export type { QueueConfig, QueueMetrics } from './queue-manager'
export type { FallbackContent, FallbackAssignmentResult } from './fallback-assigner'
export type { DeliveryMetrics, SLAMetrics, AlertConfig } from './delivery-monitor'

// Initialize all services on import
import { getContentScheduler } from './content-scheduler'
import { getQueueManager } from './queue-manager'
import { getFallbackAssigner } from './fallback-assigner'
import { getDeliveryMonitor } from './delivery-monitor'

// Auto-initialize singleton instances
let initialized = false

export function initializeScheduler() {
  if (initialized) {
    return
  }

  // Initialize all services
  getContentScheduler()
  getQueueManager()
  getFallbackAssigner()
  getDeliveryMonitor()

  initialized = true
  console.log('✅ Scheduler services initialized')
}

// Graceful shutdown
export async function shutdownScheduler() {
  console.log('Shutting down scheduler services...')
  
  const scheduler = getContentScheduler()
  const queueManager = getQueueManager()
  const fallbackAssigner = getFallbackAssigner()
  const monitor = getDeliveryMonitor()

  // Stop services
  fallbackAssigner.stop()
  monitor.stop()
  
  // Shutdown queues
  await scheduler.shutdown()
  await queueManager.shutdown()
  
  console.log('✅ Scheduler services shut down successfully')
}

// Handle process termination gracefully
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownScheduler)
  process.on('SIGINT', shutdownScheduler)
}