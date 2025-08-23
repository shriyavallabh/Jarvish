# Intelligent Content Scheduling System

## Overview
The JARVISH Intelligent Content Scheduling System ensures 99% SLA delivery of daily financial content to advisors at 06:00 IST. It implements fault-tolerant mechanisms, intelligent fallback content assignment, and comprehensive real-time monitoring.

## Key Features

### 1. **99% SLA Guaranteed Delivery**
- Peak load handling for 2,000+ simultaneous deliveries
- Jitter implementation to distribute load (05:59:30 - 06:04:30)
- Automatic retry with exponential backoff
- Circuit breaker patterns for service protection

### 2. **Intelligent Queue Management**
- Priority-based scheduling (Pro > Standard > Free tiers)
- Rate limiting (80 messages/second for WhatsApp)
- Dead letter queue for failed messages
- Automatic queue scaling based on load

### 3. **Fallback Content System**
- Daily assignment at 21:30 IST for advisors without content
- AI-powered content selection based on advisor profile
- Emergency content generation for critical failures
- Zero silent days guarantee

### 4. **Real-time Monitoring**
- Live SLA tracking with sub-minute precision
- Performance dashboards with key metrics
- Automated alerting for SLA violations
- Historical trend analysis

## Architecture Components

### Content Scheduler (`content-scheduler.ts`)
The main orchestrator that manages daily content delivery scheduling.

```typescript
import { getContentScheduler } from '@/lib/services/scheduler'

const scheduler = getContentScheduler()

// Schedule daily delivery for all advisors
const result = await scheduler.scheduleDailyDelivery()
console.log(`Scheduled: ${result.scheduled}, Failed: ${result.failed}`)

// Get queue statistics
const stats = await scheduler.getQueueStats()
```

### Queue Manager (`queue-manager.ts`)
Manages multiple queues with circuit breaker patterns and load balancing.

```typescript
import { getQueueManager } from '@/lib/services/scheduler'

const queueManager = getQueueManager()

// Add job to queue
await queueManager.addJob('content-delivery', 'job-1', {
  advisorId: 'adv-123',
  contentId: 'cnt-456',
  phoneNumber: '+919876543210'
})

// Get queue metrics
const metrics = await queueManager.getQueueMetrics('content-delivery')

// Retry failed jobs
await queueManager.retryFailedJobs('content-delivery')
```

### Fallback Assigner (`fallback-assigner.ts`)
Automatically assigns fallback content to advisors without submissions.

```typescript
import { getFallbackAssigner } from '@/lib/services/scheduler'

const fallbackAssigner = getFallbackAssigner()

// Run fallback assignment (automatically runs at 21:30 IST)
const result = await fallbackAssigner.runFallbackAssignment()

// Get fallback statistics
const stats = await fallbackAssigner.getFallbackStats()
```

### Delivery Monitor (`delivery-monitor.ts`)
Real-time monitoring and alerting system.

```typescript
import { getDeliveryMonitor } from '@/lib/services/scheduler'

const monitor = getDeliveryMonitor()

// Get real-time dashboard
const dashboard = await monitor.getDashboard()

// Get historical metrics
const history = await monitor.getHistoricalMetrics('sla', 24)

// Listen for alerts
monitor.on('alert', (alert) => {
  console.log('Alert:', alert.message)
})

monitor.on('sla_violation', (violation) => {
  console.log('SLA Violation:', violation)
})
```

### WhatsApp Queue (`whatsapp-queue.ts`)
Dedicated queue for WhatsApp message delivery with rate limiting.

```typescript
import { getWhatsAppQueue } from '@/lib/queue/whatsapp-queue'

const whatsappQueue = getWhatsAppQueue()

// Send single message
await whatsappQueue.sendMessage({
  to: '+919876543210',
  template: {
    name: 'daily_content',
    language: 'en',
    components: []
  },
  metadata: {
    advisorId: 'adv-123',
    contentId: 'cnt-456',
    priority: 'high'
  }
})

// Bulk send
await whatsappQueue.bulkSend(messages)

// Get statistics
const stats = await whatsappQueue.getStats()
```

## API Endpoints

### GET /api/scheduler

#### Get Statistics
```bash
GET /api/scheduler?action=stats
```

#### Get Queue Metrics
```bash
GET /api/scheduler?action=queue-metrics&queue=content-delivery
```

#### Get SLA Metrics
```bash
GET /api/scheduler?action=sla-metrics
```

#### Get Historical Data
```bash
GET /api/scheduler?action=historical&type=sla&hours=24
```

#### Get System Health
```bash
GET /api/scheduler?action=health
```

### POST /api/scheduler

#### Schedule Daily Delivery
```bash
POST /api/scheduler
{
  "action": "schedule-daily"
}
```

#### Run Fallback Assignment
```bash
POST /api/scheduler
{
  "action": "run-fallback"
}
```

#### Send Immediate Message
```bash
POST /api/scheduler
{
  "action": "send-immediate",
  "data": {
    "advisorId": "adv-123",
    "contentId": "cnt-456",
    "phoneNumber": "+919876543210",
    "priority": "high"
  }
}
```

#### Pause/Resume Queue
```bash
POST /api/scheduler
{
  "action": "pause-queue",
  "data": {
    "queueName": "content-delivery"
  }
}
```

#### Retry Failed Jobs
```bash
POST /api/scheduler
{
  "action": "retry-failed",
  "data": {
    "queueName": "content-delivery",
    "jobIds": ["job-1", "job-2"]
  }
}
```

## Configuration

### Environment Variables
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# WhatsApp API
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id

# Monitoring
SLA_TARGET=0.99
ALERT_EMAIL=admin@jarvish.com
ALERT_WEBHOOK=https://hooks.slack.com/services/xxx
```

### SLA Configuration
- **Target SLA**: 99% delivery success within 5 minutes
- **Warning Threshold**: Alert at 97% compliance
- **Critical Threshold**: Escalate at 95% compliance
- **Monitoring Window**: 5-minute rolling window

### Rate Limits
- **WhatsApp**: 80 messages/second, 100k messages/day
- **Concurrent Deliveries**: 100 simultaneous
- **Queue Processing**: 50 concurrent workers
- **Retry Attempts**: 3 with exponential backoff

## Monitoring Dashboard

The system provides a real-time monitoring dashboard with:

1. **Delivery Metrics**
   - Total deliveries today
   - Success/failure rates
   - Average delivery time
   - Queue backlogs

2. **SLA Compliance**
   - Current SLA percentage
   - Violations count
   - P95/P99 latency
   - Trend analysis

3. **System Health**
   - Queue status
   - Circuit breaker states
   - Resource utilization
   - Active alerts

4. **Fallback Statistics**
   - Pool size
   - Assignments today
   - Top fallback reasons
   - Content rotation metrics

## Failure Handling

### Circuit Breaker Pattern
- Opens after 5 consecutive failures
- 1-minute timeout before retry
- Automatic recovery on success

### Retry Logic
- 3 attempts per message
- Exponential backoff: 5s, 10s, 20s
- Dead letter queue for permanent failures

### Fallback Mechanisms
1. **Content Fallback**: AI-generated content when advisor has none
2. **Service Fallback**: Alternative delivery channels on WhatsApp failure
3. **Queue Fallback**: Overflow to secondary queues during peak load

## Performance Optimization

### Load Distribution
- Jitter implementation spreads load over 5-minute window
- Tier-based priority ensures Pro advisors get priority
- Batch processing for efficiency

### Resource Management
- Connection pooling for Redis and database
- Memory-efficient queue processing
- Automatic garbage collection for old jobs

### Scaling Strategy
- Horizontal scaling with multiple workers
- Queue partitioning by advisor tier
- Auto-scaling based on queue depth

## Testing

### Load Testing
```bash
# Simulate 2000 concurrent deliveries
npm run test:load-scheduler

# Test fallback assignment
npm run test:fallback

# Test SLA monitoring
npm run test:sla-monitor
```

### Integration Testing
```bash
# Test full scheduling flow
npm run test:scheduler-integration

# Test WhatsApp delivery
npm run test:whatsapp-delivery
```

## Troubleshooting

### Common Issues

1. **High Queue Backlog**
   - Check rate limits
   - Verify WhatsApp API status
   - Scale workers if needed

2. **SLA Violations**
   - Review error logs
   - Check circuit breaker status
   - Verify network connectivity

3. **Fallback Failures**
   - Ensure fallback pool has content
   - Check AI service availability
   - Verify advisor preferences

### Debug Commands
```bash
# Check queue status
curl http://localhost:3000/api/scheduler?action=stats

# View failed jobs
curl http://localhost:3000/api/scheduler?action=queue-metrics&queue=content-delivery

# Force retry failed jobs
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "retry-failed", "data": {"queueName": "content-delivery"}}'
```

## Support

For issues or questions:
- Check logs in Redis: `redis-cli MONITOR`
- View queue UI: `http://localhost:3000/admin/queues`
- Contact: devops@jarvish.com

## License

Copyright 2025 JARVISH. All rights reserved.