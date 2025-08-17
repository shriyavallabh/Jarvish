# Technical Architecture - Financial Advisor Content Platform MVP

## Executive Summary
Complete technical architecture for a B2B SaaS platform serving Indian financial advisors with AI-powered, SEBI-compliant social media content generation and WhatsApp delivery.

## System Architecture Overview

### High-Level Architecture Components
```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                        │
├────────────────┬──────────────────┬──────────────────────────────┤
│  Landing Page  │ Advisor Dashboard │    Admin Dashboard          │
│  (Public)      │ (Authenticated)   │    (Admin Only)             │
└────────────────┴──────────────────┴──────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Next.js API)                   │
├───────────────────────────────────────────────────────────────────┤
│  • Authentication (Clerk)    • Rate Limiting                     │
│  • Request Routing           • CORS Handling                     │
│  • Request/Response Transform • API Versioning                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES (Node.js)                   │
├────────────┬───────────┬──────────┬───────────┬─────────────────┤
│  Content   │ Compliance│ WhatsApp │    AI     │   Analytics     │
│  Service   │  Engine   │  Service │  Service  │    Service      │
└────────────┴───────────┴──────────┴───────────┴─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├──────────────┬────────────────┬──────────────┬──────────────────┤
│  PostgreSQL  │     Redis      │  Cloudflare  │   ElasticSearch  │
│  (Primary)   │   (Caching)    │  R2 Storage  │    (Search)      │
└──────────────┴────────────────┴──────────────┴──────────────────┘
```

## Core Technology Stack

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18.3+
- **Styling**: Tailwind CSS 3.4+ with shadcn/ui components
- **State Management**: Zustand 4.5+
- **Data Fetching**: React Query 5.0+ with SWR for real-time
- **Forms**: React Hook Form + Zod validation
- **Authentication**: Clerk React SDK
- **Build Tools**: Turbo, Vite for Storybook
- **Testing**: Vitest, React Testing Library, Playwright

### Backend Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful with OpenAPI 3.1 spec
- **Database ORM**: Prisma 5.0+
- **Queue System**: BullMQ with Redis
- **Authentication**: Clerk Backend SDK
- **Validation**: Joi/Yup for request validation
- **Testing**: Jest, Supertest

### Infrastructure & DevOps
- **Hosting**: Vercel (Frontend), Railway/Render (Backend)
- **Database**: Neon PostgreSQL (Primary), Upstash Redis (Cache)
- **Storage**: Cloudflare R2 with CDN
- **Monitoring**: Datadog APM, Sentry
- **CI/CD**: GitHub Actions
- **Container**: Docker for local development
- **IaC**: Terraform for production infrastructure

### AI & Integration Services
- **AI Models**: 
  - GPT-4o-mini for compliance checking (<1.5s latency)
  - GPT-4 for content generation (<3.5s latency)
- **WhatsApp**: Meta Cloud API with Business Management API
- **Image Processing**: Cloudinary for dynamic overlays
- **Email**: SendGrid for transactional emails
- **Payment**: Razorpay for Indian market

## Database Schema Design

### Core Tables Structure
```sql
-- Advisors and Authentication
CREATE TABLE advisors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    arn_number VARCHAR(50),
    registration_type ENUM('MFD', 'RIA') NOT NULL,
    tier ENUM('BASIC', 'STANDARD', 'PRO') NOT NULL,
    whatsapp_number VARCHAR(20),
    whatsapp_opted_in BOOLEAN DEFAULT false,
    language_preferences JSONB DEFAULT '["en"]',
    branding_assets JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_clerk_user (clerk_user_id),
    INDEX idx_tier (tier),
    INDEX idx_created (created_at)
);

-- Content Packs and Templates
CREATE TABLE content_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type ENUM('WHATSAPP', 'STATUS', 'LINKEDIN', 'MULTI') NOT NULL,
    languages JSONB NOT NULL,
    captions JSONB NOT NULL,
    media_assets JSONB NOT NULL,
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    compliance_flags JSONB,
    status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DELIVERED') NOT NULL,
    scheduled_for TIMESTAMP,
    delivered_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_advisor (advisor_id),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_for),
    INDEX idx_compliance (compliance_score)
);

-- Compliance and Audit Trail
CREATE TABLE compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_pack_id UUID REFERENCES content_packs(id) ON DELETE CASCADE,
    check_type ENUM('RULE', 'AI', 'MANUAL') NOT NULL,
    risk_score INTEGER NOT NULL,
    violations JSONB,
    suggestions JSONB,
    ai_model_used VARCHAR(100),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_content_pack (content_pack_id),
    INDEX idx_risk_score (risk_score)
);

-- WhatsApp Delivery Tracking
CREATE TABLE whatsapp_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_pack_id UUID REFERENCES content_packs(id),
    advisor_id UUID REFERENCES advisors(id),
    message_id VARCHAR(255) UNIQUE,
    template_name VARCHAR(100),
    phone_number VARCHAR(20),
    status ENUM('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL,
    error_code VARCHAR(50),
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_message (message_id),
    INDEX idx_status (status),
    INDEX idx_advisor_delivery (advisor_id, created_at)
);

-- Analytics and Usage Tracking
CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id UUID REFERENCES advisors(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_advisor_events (advisor_id, created_at),
    INDEX idx_event_type (event_type)
);

-- Billing and Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id UUID REFERENCES advisors(id) UNIQUE,
    plan_id VARCHAR(50) NOT NULL,
    status ENUM('ACTIVE', 'CANCELLED', 'PAST_DUE', 'PAUSED') NOT NULL,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    razorpay_subscription_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_period (current_period_end)
);
```

## API Design Strategy

### RESTful API Endpoints Structure
```yaml
# Core API Endpoints
/api/v1:
  # Authentication
  /auth:
    POST /login
    POST /logout
    POST /refresh
    GET /me
    
  # Advisor Management
  /advisors:
    GET / # List advisors (admin only)
    GET /{id}
    PUT /{id}
    DELETE /{id}
    GET /{id}/analytics
    GET /{id}/usage
    
  # Content Management
  /content:
    GET / # List content packs
    POST / # Create new content
    GET /{id}
    PUT /{id}
    DELETE /{id}
    POST /{id}/submit # Submit for approval
    POST /{id}/approve # Admin approve
    POST /{id}/reject # Admin reject
    
  # AI Services
  /ai:
    POST /generate # Generate content
    POST /translate # Translate content
    POST /compliance-check # Check compliance
    POST /improve # Improve content
    
  # WhatsApp Integration
  /whatsapp:
    POST /send # Send message
    GET /templates # List templates
    POST /opt-in # Manage opt-in
    GET /delivery-status/{messageId}
    
  # Analytics
  /analytics:
    GET /dashboard # Dashboard metrics
    GET /engagement # Engagement metrics
    GET /compliance # Compliance metrics
    GET /usage # Usage statistics
    
  # Webhooks
  /webhooks:
    POST /whatsapp # WhatsApp callbacks
    POST /payment # Payment callbacks
    POST /compliance # Compliance alerts
```

### API Authentication & Security
```typescript
// API Security Middleware Stack
export const securityMiddleware = [
  // 1. Rate Limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // 2. CORS Configuration
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }),
  
  // 3. Helmet Security Headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
  
  // 4. Request Sanitization
  mongoSanitize(),
  
  // 5. Authentication
  clerkAuth({
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
  
  // 6. Request ID Generation
  requestId(),
  
  // 7. Request Logging
  morgan('combined'),
];
```

## AI Integration Architecture

### Multi-Model AI Pipeline
```typescript
interface AIServiceArchitecture {
  // Content Generation Pipeline
  contentGeneration: {
    primary: 'GPT-4',
    fallback: 'GPT-4o-mini',
    maxTokens: 1500,
    temperature: 0.7,
    timeout: 3500, // ms
    retries: 2,
  },
  
  // Compliance Checking Pipeline
  complianceCheck: {
    primary: 'GPT-4o-mini',
    fallback: 'rule-based',
    maxTokens: 500,
    temperature: 0.3,
    timeout: 1500, // ms
    retries: 3,
  },
  
  // Translation Pipeline
  translation: {
    primary: 'GPT-4o-mini',
    languages: ['en', 'hi', 'mr'],
    maxTokens: 1000,
    temperature: 0.5,
    timeout: 2000, // ms
  },
  
  // Cost Controls
  costControls: {
    dailyBudget: 100, // USD
    perAdvisorLimit: 10, // generations per day
    alertThreshold: 0.8, // 80% of budget
  },
}

// Three-Stage Compliance Pipeline
class ComplianceEngine {
  async checkCompliance(content: string): Promise<ComplianceResult> {
    // Stage 1: Rule-based checking
    const ruleResults = await this.ruleEngine.check(content);
    if (ruleResults.violations.critical.length > 0) {
      return { riskScore: 100, stage: 'rules', violations: ruleResults };
    }
    
    // Stage 2: AI-powered analysis
    const aiResults = await this.aiEngine.analyze(content);
    if (aiResults.riskScore > 75) {
      return { riskScore: aiResults.riskScore, stage: 'ai', suggestions: aiResults.suggestions };
    }
    
    // Stage 3: Human review queue (if needed)
    if (aiResults.riskScore > 50) {
      await this.queueForReview(content);
      return { riskScore: aiResults.riskScore, stage: 'pending-review' };
    }
    
    return { riskScore: aiResults.riskScore, stage: 'approved' };
  }
}
```

## WhatsApp Integration Architecture

### WhatsApp Cloud API Integration
```typescript
interface WhatsAppArchitecture {
  // API Configuration
  api: {
    baseUrl: 'https://graph.facebook.com/v18.0',
    phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
    businessAccountId: process.env.WA_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WA_ACCESS_TOKEN,
  },
  
  // Template Management
  templates: {
    dailyContent: 'daily_content_v1',
    welcome: 'welcome_advisor_v1',
    reminder: 'content_reminder_v1',
  },
  
  // Delivery Configuration
  delivery: {
    defaultTime: '06:00', // IST
    batchSize: 50,
    retryAttempts: 3,
    retryDelay: 60000, // 1 minute
    timeout: 30000, // 30 seconds
  },
  
  // Quality Maintenance
  quality: {
    minQualityScore: 'GREEN',
    maxDailyMessages: 1000,
    optInRenewalDays: 180,
  },
}

// Delivery Orchestration
class WhatsAppDeliveryService {
  async scheduleDelivery(contentPack: ContentPack, advisorId: string) {
    // 1. Validate opt-in status
    const advisor = await this.advisorService.findById(advisorId);
    if (!advisor.whatsappOptedIn) {
      throw new Error('Advisor has not opted in for WhatsApp messages');
    }
    
    // 2. Prepare media assets
    const mediaUrl = await this.uploadMedia(contentPack.mediaAssets.whatsapp);
    
    // 3. Schedule message
    const job = await this.queue.add('whatsapp-delivery', {
      advisorId,
      contentPackId: contentPack.id,
      phoneNumber: advisor.whatsappNumber,
      templateName: 'daily_content_v1',
      mediaUrl,
      scheduledFor: contentPack.scheduledFor,
    }, {
      delay: contentPack.scheduledFor - Date.now(),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000,
      },
    });
    
    return job.id;
  }
}
```

## Performance & Scalability Strategy

### Performance Targets
```yaml
Performance SLAs:
  API Response Times:
    - GET requests: <200ms P95
    - POST requests: <500ms P95
    - AI generation: <3.5s P95
    - Compliance check: <1.5s P95
    
  WhatsApp Delivery:
    - Success rate: >99%
    - Delivery time: <30s from scheduled
    - Daily capacity: 10,000+ messages
    
  System Availability:
    - Uptime: 99.9%
    - RTO: <1 hour
    - RPO: <15 minutes
    
  Scalability Targets:
    - Concurrent users: 500+
    - Advisors supported: 2,000+
    - Content packs/day: 5,000+
    - Storage: 10TB+
```

### Caching Strategy
```typescript
interface CachingStrategy {
  // Redis Cache Layers
  layers: {
    // L1: Session Cache (1 hour TTL)
    session: {
      ttl: 3600,
      keys: ['user:*', 'auth:*'],
    },
    
    // L2: Content Cache (24 hours TTL)
    content: {
      ttl: 86400,
      keys: ['content:*', 'templates:*'],
    },
    
    // L3: Analytics Cache (5 minutes TTL)
    analytics: {
      ttl: 300,
      keys: ['metrics:*', 'stats:*'],
    },
  },
  
  // Cache Invalidation Strategy
  invalidation: {
    onUpdate: ['content:*', 'advisor:*'],
    onDelete: ['*'],
    scheduled: '0 0 * * *', // Daily at midnight
  },
}
```

### Database Optimization
```sql
-- Indexes for Performance
CREATE INDEX idx_content_advisor_status ON content_packs(advisor_id, status, created_at DESC);
CREATE INDEX idx_delivery_scheduled ON content_packs(scheduled_for) WHERE status = 'APPROVED';
CREATE INDEX idx_compliance_pending ON content_packs(status) WHERE status = 'PENDING';
CREATE INDEX idx_analytics_recent ON usage_analytics(advisor_id, created_at DESC);

-- Partitioning for Scale
ALTER TABLE usage_analytics PARTITION BY RANGE (created_at);
CREATE TABLE usage_analytics_2024_q1 PARTITION OF usage_analytics
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- Materialized Views for Analytics
CREATE MATERIALIZED VIEW advisor_metrics AS
SELECT 
    advisor_id,
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_content,
    AVG(compliance_score) as avg_compliance,
    COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered
FROM content_packs
GROUP BY advisor_id, DATE_TRUNC('day', created_at);

CREATE INDEX ON advisor_metrics(advisor_id, date DESC);
REFRESH MATERIALIZED VIEW CONCURRENTLY advisor_metrics;
```

## Security Architecture

### Security Layers
```typescript
interface SecurityArchitecture {
  // Authentication & Authorization
  auth: {
    provider: 'Clerk',
    mfa: true,
    sessionTimeout: 3600, // 1 hour
    jwtExpiry: 900, // 15 minutes
  },
  
  // Data Protection
  encryption: {
    atRest: 'AES-256-GCM',
    inTransit: 'TLS 1.3',
    keyManagement: 'AWS KMS',
  },
  
  // Access Control
  rbac: {
    roles: ['advisor', 'admin', 'backup_approver', 'dpo'],
    permissions: {
      advisor: ['read:own', 'write:own'],
      admin: ['read:all', 'write:all', 'delete:all'],
      backup_approver: ['read:queue', 'write:approval'],
      dpo: ['read:audit', 'write:policy'],
    },
  },
  
  // Audit & Compliance
  audit: {
    events: ['login', 'content_create', 'approval', 'delivery'],
    retention: 730, // days
    immutable: true,
  },
  
  // Security Headers
  headers: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'",
  },
}
```

### DPDP Compliance Implementation
```typescript
class DPDPComplianceService {
  // Data Subject Rights
  async handleDSAR(advisorId: string, requestType: string) {
    switch (requestType) {
      case 'ACCESS':
        return await this.exportAdvisorData(advisorId);
      case 'RECTIFICATION':
        return await this.correctAdvisorData(advisorId);
      case 'ERASURE':
        return await this.deleteAdvisorData(advisorId);
      case 'PORTABILITY':
        return await this.exportPortableData(advisorId);
    }
  }
  
  // Consent Management
  async updateConsent(advisorId: string, consents: ConsentUpdate) {
    await this.auditLog.record({
      type: 'CONSENT_UPDATE',
      advisorId,
      consents,
      timestamp: new Date(),
      ip: this.request.ip,
    });
    
    return await this.advisorService.updateConsents(advisorId, consents);
  }
  
  // Data Retention
  async enforceRetention() {
    // Delete data past retention period
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - 730); // 2 years
    
    await this.contentService.deleteOldContent(retentionDate);
    await this.analyticsService.archiveOldData(retentionDate);
  }
}
```

## Monitoring & Observability

### Observability Stack
```yaml
Monitoring Infrastructure:
  Metrics:
    - Provider: Datadog
    - Custom Metrics:
      - api.request.duration
      - ai.generation.latency
      - whatsapp.delivery.success_rate
      - compliance.risk_score
    - Dashboards:
      - System Health
      - API Performance
      - AI Usage
      - WhatsApp Delivery
      - Compliance Metrics
      
  Logging:
    - Provider: Datadog Logs
    - Log Levels: ERROR, WARN, INFO, DEBUG
    - Structured Logging: JSON format
    - Retention: 30 days hot, 90 days cold
    
  Tracing:
    - Provider: Datadog APM
    - Instrumentation: OpenTelemetry
    - Sample Rate: 10% (100% for errors)
    
  Alerting:
    - Channels: Slack, Email, PagerDuty
    - Critical Alerts:
      - API error rate >5%
      - WhatsApp delivery <95%
      - AI service timeout >10%
      - Database connection pool exhausted
    - Warning Alerts:
      - Response time >1s P95
      - Memory usage >80%
      - Disk usage >70%
```

### Health Checks & SLOs
```typescript
// Health Check Endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/health/detailed', async (req, res) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkWhatsAppAPI(),
    checkAIService(),
    checkStorage(),
  ]);
  
  const health = {
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    services: {
      database: checks[0].status === 'fulfilled' ? 'up' : 'down',
      cache: checks[1].status === 'fulfilled' ? 'up' : 'down',
      whatsapp: checks[2].status === 'fulfilled' ? 'up' : 'down',
      ai: checks[3].status === 'fulfilled' ? 'up' : 'down',
      storage: checks[4].status === 'fulfilled' ? 'up' : 'down',
    },
    timestamp: new Date(),
  };
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// SLO Definitions
const SLOs = {
  availability: {
    target: 99.9,
    window: '30d',
    measurement: 'successful_requests / total_requests',
  },
  latency: {
    target: 95,
    threshold: 500, // ms
    window: '1h',
    measurement: 'requests_under_threshold / total_requests',
  },
  whatsappDelivery: {
    target: 99,
    window: '24h',
    measurement: 'delivered_messages / sent_messages',
  },
};
```

## Disaster Recovery & Business Continuity

### Backup Strategy
```yaml
Backup Configuration:
  Database:
    - Type: Automated snapshots
    - Frequency: Every 6 hours
    - Retention: 30 days
    - Cross-region: Yes (Mumbai + Singapore)
    
  Application Data:
    - Storage: Cloudflare R2
    - Replication: Multi-region
    - Versioning: Enabled
    - Lifecycle: 90 days
    
  Configuration:
    - Secrets: AWS Secrets Manager
    - Environment: Git repository
    - Infrastructure: Terraform state in S3
```

### Failover & Recovery Procedures
```typescript
interface DisasterRecovery {
  // RTO: 1 hour, RPO: 15 minutes
  procedures: {
    databaseFailure: {
      detection: 'Automated health checks',
      failover: 'Promote read replica',
      recovery: 'Restore from snapshot',
      rto: '30 minutes',
    },
    
    applicationFailure: {
      detection: 'Health endpoint monitoring',
      failover: 'Blue-green deployment switch',
      recovery: 'Rollback to previous version',
      rto: '15 minutes',
    },
    
    regionFailure: {
      detection: 'Multi-region health checks',
      failover: 'DNS failover to DR region',
      recovery: 'Full region restoration',
      rto: '1 hour',
    },
  },
  
  fallbackSystems: {
    aiService: 'Rule-based compliance checking',
    whatsapp: 'Queue messages for later delivery',
    payment: 'Offline processing mode',
  },
}
```

## Integration Points

### Third-Party Service Integrations
```yaml
External Services:
  Payment Gateway (Razorpay):
    - Subscription management
    - Recurring billing
    - Webhook handling
    - Refund processing
    
  WhatsApp Business API:
    - Template management
    - Message delivery
    - Media handling
    - Status callbacks
    
  AI Services (OpenAI):
    - Content generation
    - Compliance checking
    - Translation
    - Content improvement
    
  CDN & Storage (Cloudflare):
    - Static asset delivery
    - Image optimization
    - Global distribution
    - DDoS protection
    
  Email Service (SendGrid):
    - Transactional emails
    - Welcome sequences
    - Approval notifications
    - System alerts
    
  Analytics (Mixpanel):
    - User behavior tracking
    - Funnel analysis
    - Cohort analysis
    - Custom events
```

## Development & Deployment Pipeline

### CI/CD Pipeline
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
      
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit
      - run: npm run lint:security
      - uses: aquasecurity/trivy-action@master
      
  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      - uses: vercel/action@v3
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Cost Optimization Strategy

### Infrastructure Cost Management
```yaml
Cost Optimization:
  Compute:
    - Auto-scaling based on load
    - Serverless for background jobs
    - Reserved instances for baseline
    
  Database:
    - Connection pooling
    - Read replicas for analytics
    - Archival to cold storage
    
  AI Services:
    - Model selection by use case
    - Prompt caching
    - Batch processing
    - Usage quotas per tier
    
  Storage:
    - Lifecycle policies
    - Compression
    - CDN caching
    - Tiered storage classes
    
  Estimated Monthly Costs (1000 advisors):
    - Infrastructure: $500-800
    - AI Services: $300-500
    - WhatsApp API: $200-300
    - CDN & Storage: $100-150
    - Monitoring: $100-150
    - Total: $1,200-1,900
```

## Conclusion

This technical architecture provides a robust, scalable foundation for the Financial Advisor Content Platform MVP. The architecture emphasizes:

1. **Performance**: Sub-second response times with intelligent caching
2. **Scalability**: Support for 2,000+ advisors with horizontal scaling
3. **Reliability**: 99.9% uptime with comprehensive failover strategies
4. **Security**: Multi-layered security with DPDP compliance
5. **Compliance**: Three-stage validation with AI-powered checking
6. **Cost-Effectiveness**: Optimized resource usage with tiered service levels

The modular design allows for incremental development and deployment, enabling rapid iteration while maintaining system stability and compliance requirements.