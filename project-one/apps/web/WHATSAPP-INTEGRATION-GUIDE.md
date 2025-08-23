# WhatsApp Business Cloud API Integration Guide

## Overview

JARVISH's WhatsApp integration delivers personalized financial content to 2000+ Indian advisors daily at 06:00 IST with 99% delivery SLA. The system uses Meta's WhatsApp Business Cloud API with advanced template management, queue-based delivery, and fallback content systems.

## Architecture Components

### 1. WhatsApp Cloud API Service (`/lib/services/whatsapp-cloud-api.ts`)

**Core Features:**
- Template message sending with parameter substitution
- Multi-language support (English/Hindi)
- Phone number validation for Indian market
- Rate limiting and retry mechanisms
- Quality rating monitoring
- Media upload support

**Key Methods:**
```typescript
// Send template message
await whatsappAPI.sendTemplate(phoneNumber, templateName, language, parameters, mediaUrl)

// Get template health
const template = await whatsappAPI.getTemplate(templateName, language)

// Check number quality rating
const health = await whatsappAPI.getNumberHealth()
```

### 2. Template Manager (`/lib/services/template-manager.ts`)

**Features:**
- Template rotation and quality monitoring
- A/B testing capabilities
- Approval status tracking
- Performance analytics
- SEBI-compliant templates

**Pre-approved Templates:**
- `daily_market_update_v1` - Primary English template
- `daily_market_update_v2` - Alternative with image header
- `daily_market_update_hindi_v1` - Hindi version
- `market_closed_update` - Holiday notifications
- `advisor_welcome` - Onboarding template

### 3. Delivery Scheduler (`/lib/services/delivery-scheduler.ts`)

**BullMQ-based Queue System:**
- Redis-backed job queue
- 06:00 IST fan-out with jitter (05:59:30-06:04:30)
- Priority-based processing (Pro > Standard > Free)
- Exponential backoff retry
- Real-time SLA monitoring

**Configuration:**
```typescript
const SCHEDULER_CONFIG = {
  DELIVERY_HOUR: 6, // 6 AM IST
  JITTER_WINDOW_MINUTES: 5,
  MAX_CONCURRENT_JOBS: 50,
  BATCH_SIZE: 20,
  SLA_THRESHOLD: 0.99 // 99% delivery SLA
}
```

### 4. Fallback Content System (`/lib/services/fallback-content.ts`)

**Zero Silent Days:**
- Pre-approved educational content
- Seasonal and holiday-specific messages
- Assignment at 21:30 IST if no custom content
- Usage tracking and optimization

## API Endpoints

### WhatsApp Messaging

#### `POST /api/whatsapp/send`
Send immediate or scheduled WhatsApp messages.

**Request:**
```json
{
  "contentId": "uuid",
  "phoneNumber": "9876543210", // Optional
  "immediate": true,
  "templateName": "daily_market_update_v1", // Optional
  "parameters": {
    "param1": "January 20, 2025",
    "param2": "Advisor Name"
  },
  "mediaUrl": "https://example.com/image.jpg" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "wamid.123456",
  "timestamp": "2025-01-20T06:00:00Z",
  "deliveryStatus": "sent"
}
```

#### `GET /api/whatsapp/send`
Get delivery statistics and SLA metrics.

**Query Parameters:**
- `timeframe`: 1d, 7d, 30d, 90d
- `details`: true/false

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalDelivered": 1950,
    "totalFailed": 50,
    "deliveryRate": 97.5,
    "slaStatus": "PASS"
  },
  "numberHealth": {
    "qualityRating": "GREEN",
    "messagingLimit": { "current": 100, "max": 1000 }
  }
}
```

### Template Management

#### `GET /api/whatsapp/templates`
Get template health and status information.

**Query Parameters:**
- `action`: health, best, monitor, library
- `template`: Template name
- `language`: en, hi
- `useCase`: daily_content
- `details`: true/false

#### `POST /api/whatsapp/templates`
Create and manage templates.

**Actions:**
- `create`: Submit template for approval
- `ab_test`: Run A/B testing
- `bulk_submit`: Submit multiple templates

### Cron Jobs

#### `GET /api/cron/daily-delivery`
**Schedule:** 5:55 AM IST daily
**Function:** Schedule all daily content for 6 AM delivery

#### `GET /api/cron/fallback-assignment`
**Schedule:** 9:30 PM IST daily
**Function:** Assign fallback content to advisors without custom content

## Environment Variables

```env
# WhatsApp Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Cron Security
CRON_SECRET=your_cron_secret
ADMIN_KEY=your_admin_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## Database Schema

### Templates Submissions
```sql
CREATE TABLE template_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR NOT NULL,
  template_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'PENDING',
  rejected_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Content Deliveries
```sql
CREATE TABLE content_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id),
  content_id UUID NOT NULL REFERENCES content(id),
  whatsapp_message_id VARCHAR,
  template_name VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Fallback Content
```sql
CREATE TABLE fallback_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  content_english TEXT NOT NULL,
  content_hindi TEXT,
  category VARCHAR NOT NULL,
  tags JSONB DEFAULT '[]',
  priority INTEGER DEFAULT 5,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  use_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Fallback Assignments
```sql
CREATE TABLE fallback_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id),
  content_id UUID NOT NULL REFERENCES content(id),
  fallback_id UUID NOT NULL REFERENCES fallback_content(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for DATE NOT NULL,
  reason VARCHAR NOT NULL
);
```

## Setup Instructions

### 1. WhatsApp Business Account Setup

1. Create Facebook Business Manager account
2. Add WhatsApp Business Account
3. Get verification for Business Account
4. Create WhatsApp Business App
5. Add phone number and verify
6. Generate permanent access token
7. Configure webhook URL: `https://yourdomain.com/api/webhooks/whatsapp`

### 2. Template Submission

```bash
# Submit all core templates
curl -X POST https://yourdomain.com/api/whatsapp/templates \
  -H "Content-Type: application/json" \
  -d '{
    "action": "bulk_submit",
    "templates": [
      "DAILY_MARKET_UPDATE_V1",
      "DAILY_MARKET_UPDATE_V2", 
      "DAILY_MARKET_UPDATE_HINDI_V1",
      "MARKET_CLOSED_UPDATE",
      "ADVISOR_WELCOME"
    ]
  }'
```

### 3. Cron Job Setup

**Using Vercel Cron:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/fallback-assignment",
      "schedule": "30 16 * * *"
    },
    {
      "path": "/api/cron/daily-delivery", 
      "schedule": "25 0 * * *"
    }
  ]
}
```

**Using external cron service:**
```bash
# 9:30 PM IST = 4:00 PM UTC
30 16 * * * curl -H "x-cron-secret: $CRON_SECRET" https://yourdomain.com/api/cron/fallback-assignment

# 5:55 AM IST = 12:25 AM UTC  
25 0 * * * curl -H "x-cron-secret: $CRON_SECRET" https://yourdomain.com/api/cron/daily-delivery
```

### 4. Redis Setup

For production, use managed Redis:

**Railway/Redis Cloud:**
```bash
# Install redis
npm install ioredis

# Connect
const redis = new Redis(process.env.REDIS_URL)
```

## Monitoring & Alerts

### SLA Monitoring
- **Target:** 99% delivery within 06:00-06:05 IST
- **Threshold:** Alert if delivery rate < 97%
- **Critical:** Alert if failure rate > 2%

### Quality Monitoring
- Track WhatsApp quality rating (GREEN/YELLOW/RED)
- Monitor template performance
- Automatic template rotation if quality drops

### Key Metrics
- Daily delivery success rate
- Template health scores
- Queue processing times
- Failure reasons distribution
- Peak concurrency levels

## Testing

```bash
# Run unit tests
npm run test:unit

# Test WhatsApp API
npm test -- --testPathPattern=whatsapp-api.test.ts

# Test delivery scheduler
npm test -- --testPathPattern=delivery-scheduler.test.ts

# Coverage report
npm run test:coverage
```

### Manual Testing

```bash
# Test immediate delivery
curl -X POST https://yourdomain.com/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "test-content-id",
    "phoneNumber": "919876543210",
    "immediate": true
  }'

# Check template health
curl "https://yourdomain.com/api/whatsapp/templates?action=health&template=daily_market_update_v1"

# Trigger fallback assignment
curl -X POST https://yourdomain.com/api/cron/fallback-assignment \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your_admin_key"}'
```

## Production Checklist

### Pre-deployment
- [ ] WhatsApp Business Account verified
- [ ] All templates submitted and approved
- [ ] Redis instance configured
- [ ] Database tables created
- [ ] Environment variables set
- [ ] Cron jobs scheduled
- [ ] Webhook endpoint tested

### Post-deployment
- [ ] Monitor first 06:00 IST delivery
- [ ] Verify SLA metrics
- [ ] Check template quality ratings
- [ ] Validate fallback content assignment
- [ ] Test immediate messaging
- [ ] Confirm webhook processing

## Troubleshooting

### Common Issues

**Templates not approved:**
- Check Meta's template policies
- Ensure SEBI compliance disclaimers
- Avoid promotional language in utility templates

**Messages not delivering:**
- Verify phone numbers are on WhatsApp
- Check quality rating status
- Validate 24-hour messaging window

**Queue not processing:**
- Check Redis connection
- Verify BullMQ worker status
- Monitor concurrency limits

**SLA violations:**
- Check IST timezone calculations
- Verify jitter distribution
- Monitor retry mechanisms

### Debug Commands

```bash
# Check queue status
curl "https://yourdomain.com/api/whatsapp/send?timeframe=1d&details=true"

# Monitor template health
curl "https://yourdomain.com/api/whatsapp/templates?details=true"

# View fallback stats
curl "https://yourdomain.com/api/cron/fallback-assignment"
```

## Performance Optimization

### Scaling Considerations
- **2000+ concurrent messages:** Use horizontal scaling
- **Redis clustering:** For high availability
- **Template caching:** Reduce API calls
- **Batch processing:** Optimize queue throughput

### Cost Optimization
- Template message rates: $0.055 per message in India
- Optimize template usage and reduce failures
- Monitor quality ratings to avoid restrictions

## Compliance & Security

### SEBI Compliance
- All templates include SEBI disclaimers
- Investment advice marked clearly
- Risk warnings included

### Data Security
- WhatsApp messages encrypted end-to-end
- No sensitive data in templates
- Secure webhook signature verification

### Privacy
- Opt-out mechanisms (STOP keyword)
- User consent tracking
- Data retention policies

## Support

For technical issues:
1. Check logs in production dashboard
2. Monitor SLA metrics endpoint
3. Review template health status
4. Contact WhatsApp Business Support for platform issues

**Emergency Contacts:**
- Critical SLA violations: Alert admin team
- Quality rating drops: Immediate template rotation
- System failures: Activate fallback procedures