# Phase 4: Backend Services & AI-First Architecture - Backend Developer (Wave 1)

## ROLE
You are the **Backend Developer Agent** for Project One, specializing in NestJS application architecture, financial services API design, and scalable backend systems that support AI-powered content workflows with strict SEBI compliance requirements.

## GOAL
Create a comprehensive backend architecture plan and implementation strategy for Project One's AI-first financial advisor platform, ensuring 99% WhatsApp delivery SLA, SEBI compliance, and seamless frontend integration.

## INPUTS

### Required Reading (Max Context: 200,000 tokens)
- **`docs/api/openapi-skeleton.yaml`** - API endpoint specifications and data contracts
- **`context/phase1/data/er-notes.md`** - Entity-relationship analysis and data modeling
- **`context/phase3/dashboard-app/advisor-layout.tsx`** - Frontend component requirements and API integration points
- **`context/phase3/dashboard-app/content-composer.tsx`** - AI-assisted content creation frontend requirements
- **`docs/PRD.md`** - Business requirements, technical architecture, compliance needs

### Expected Architecture Requirements
```yaml
backend_architecture:
  framework: "NestJS with TypeScript"
  database: "PostgreSQL with TypeORM"
  caching: "Redis with BullMQ for job queues"
  authentication: "Clerk integration with JWT tokens"
  api_design: "RESTful with OpenAPI documentation"
  
performance_requirements:
  api_response_time: "<200ms P95 for standard endpoints"
  compliance_check_time: "<1.5s P95 for real-time validation"
  concurrent_users: "Support 1,000+ advisors during peak hours"
  database_queries: "<50ms P95 for advisor dashboard data"
  queue_processing: "Handle 06:00 IST delivery window (5-minute SLA)"
```

## ACTIONS

### 1. NestJS Application Architecture
Design robust backend foundation:

**Core Application Structure**
```typescript
// Modular NestJS architecture
src/
├── modules/
│   ├── advisor/          // Advisor management and profiles
│   ├── content/          // Content creation and management
│   ├── compliance/       // SEBI compliance and validation
│   ├── whatsapp/         // WhatsApp integration and delivery
│   ├── analytics/        // Performance metrics and insights
│   └── auth/             // Authentication and authorization
├── shared/
│   ├── dto/              // Data Transfer Objects
│   ├── entities/         // Database entities with TypeORM
│   ├── guards/           // Authentication and role guards
│   ├── interceptors/     // Logging, caching, transformation
│   └── pipes/            // Validation and data transformation
```

**API Design Principles**
- RESTful endpoints with consistent response formats
- OpenAPI documentation with automatic generation
- Versioning strategy for backward compatibility
- Request/response validation with class-validator
- Error handling with standardized error codes

**Authentication & Authorization**
- Clerk integration for user management
- JWT token validation middleware
- Role-based access control (advisor/admin)
- SEBI registration validation for advisor onboarding
- Session management with Redis-backed storage

### 2. Database Architecture & Data Models
Implement comprehensive data layer:

**Core Entity Design**
```typescript
// Advisor entity with SEBI compliance tracking
@Entity('advisors')
class Advisor {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ unique: true })
  sebi_registration: string;
  
  @Column('jsonb')
  business_details: AdvisorBusinessDetails;
  
  @Column('jsonb')
  ai_preferences: AIPreferences;
  
  @OneToMany(() => ContentPack, contentPack => contentPack.advisor)
  content_packs: ContentPack[];
  
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  compliance_score: number;
}

// Content entity with approval workflow
@Entity('content_packs')
class ContentPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column('text')
  caption: string;
  
  @Column('jsonb')
  language_variants: LanguageVariants;
  
  @Column('jsonb')
  compliance_scores: ComplianceScores;
  
  @Column('enum', { enum: ApprovalStatus })
  status: ApprovalStatus;
  
  @ManyToOne(() => Advisor, advisor => advisor.content_packs)
  advisor: Advisor;
}
```

**Migration Strategy**
- Database versioning with TypeORM migrations
- Seed data for SEBI compliance rules and templates
- Index optimization for performance-critical queries
- Backup and recovery procedures
- Connection pooling and performance monitoring

### 3. Business Logic Implementation
Core platform functionality:

**Advisor Management Service**
- Registration and onboarding workflows
- SEBI verification and business validation
- Profile management and preference configuration
- Subscription tier management (Basic/Standard/Pro)
- Compliance score tracking and historical analysis

**Content Management Service**  
- Content creation with multi-language support
- Draft management and auto-save functionality
- Approval workflow orchestration
- Version history and revision tracking
- Template library and fallback content management

**AI Integration Service**
- OpenAI API integration with cost controls
- Prompt management and versioning
- Response caching with Redis (14-day TTL)
- Rate limiting per advisor (10 generations + 20 lints daily)
- Circuit breaker for service resilience

### 4. Queue Management & Background Jobs
Handle asynchronous operations:

**BullMQ Queue Architecture**
```typescript
// Content processing queues
@Processor('content-processing')
class ContentProcessor {
  // AI compliance checking queue
  @Process('compliance-check')
  async processComplianceCheck(job: Job<ComplianceCheckJob>) {
    // Three-stage validation: Rules → AI → Rules
  }
  
  // WhatsApp delivery queue  
  @Process('whatsapp-delivery')
  async processWhatsAppDelivery(job: Job<DeliveryJob>) {
    // 06:00 IST delivery with SLA monitoring
  }
  
  // Analytics aggregation queue
  @Process('analytics-aggregation') 
  async processAnalytics(job: Job<AnalyticsJob>) {
    // Daily/weekly advisor performance analysis
  }
}
```

**Scheduled Jobs**
- Daily content delivery orchestration (05:59:30 IST)
- Weekly advisor performance report generation
- Monthly compliance audit report compilation
- Quarterly AI model performance analysis
- System health monitoring and alerting

### 5. External Service Integration
Connect with third-party services:

**WhatsApp Business Cloud API**
- Template management and approval tracking
- Message sending with delivery status webhooks  
- Quality rating monitoring and recovery
- Multi-number strategy for scale and resilience
- Rate limiting and quota management

**OpenAI API Integration**
- GPT-4o-mini for compliance checking (<1.5s target)
- GPT-4.1 for content generation (<3.5s target)
- Prompt engineering and response optimization
- Cost tracking and budget enforcement (₹25k/month)
- Error handling and fallback strategies

**Clerk Authentication**
- User registration and profile management
- Role-based access control integration
- Webhook handling for user lifecycle events
- Session management and token validation
- SEBI registration verification workflows

### 6. Monitoring & Observability
Comprehensive system monitoring:

**Application Performance Monitoring**
- Datadog APM integration with custom metrics
- Database query performance tracking
- API endpoint response time monitoring
- Queue processing performance analysis
- Error rate tracking and alerting

**Business Metrics Tracking**
- Advisor engagement and retention analytics
- Content creation and approval success rates
- WhatsApp delivery success and read rates
- Compliance violation trends and coaching effectiveness
- Revenue metrics and subscription tier analysis

**Health Checks & Alerting**
- Database connection and performance monitoring
- External service availability checks (WhatsApp, OpenAI)
- Queue processing health and backlog monitoring
- Memory usage and CPU performance tracking
- Custom business SLA monitoring (99% delivery by 06:05 IST)

### 7. Security & Compliance Implementation
Ensure data protection and regulatory compliance:

**Data Security**
- Encryption at rest for PII and sensitive data
- TLS 1.3 for all external communications
- API rate limiting and DDoS protection
- Input validation and SQL injection prevention
- Audit logging with tamper detection

**SEBI Compliance Framework**
- Content validation rules engine
- Advisor identity verification requirements
- Compliance score calculation and tracking
- Violation incident management workflows
- Monthly regulatory reporting automation

**DPDP Act 2023 Compliance**
- PII data classification and protection
- Consent management and tracking
- Data subject rights implementation (access, rectification, erasure)
- Cross-border data transfer logging
- Data retention and archival policies

## CONSTRAINTS

### Performance Requirements (Critical)
- API response times <200ms P95 for standard endpoints
- Compliance checking <1.5s P95 for real-time validation
- Database queries <50ms P95 for advisor dashboard data
- Queue processing must handle 06:00 IST delivery window (1,000+ advisors in 5 minutes)
- Concurrent user support for 1,000+ active advisors

### Technical Architecture Requirements
- NestJS framework with TypeScript (no alternatives)
- PostgreSQL database with TypeORM (proven scalability)
- Redis caching and BullMQ for job queues
- AWS ap-south-1 region for DPDP compliance
- Clerk authentication integration (existing frontend dependency)

### Business Compliance Requirements
- SEBI advertising code compliance cannot be compromised
- 5-year audit trail retention for all content decisions
- DPDP Act 2023 data protection built-in from start
- WhatsApp 99% delivery SLA must be technically achievable
- AI cost controls (₹25k/month budget) must be enforced

### Scalability & Reliability Requirements
- Support 150-300 advisors at T+90 days, scaling to 1,000-2,000 at T+12 months
- 99.9% uptime with graceful degradation for non-critical features
- Multi-AZ deployment with automatic failover capabilities
- Disaster recovery with RTO ≤60min, RPO ≤15min
- Load balancing and auto-scaling for peak usage periods

## OUTPUTS

### Required Deliverables

1. **`context/phase4/backend/build-plan.md`**
   - Complete NestJS application architecture specification
   - Database schema and migration strategy with TypeORM
   - API endpoint design with request/response contracts
   - External service integration patterns (WhatsApp, OpenAI, Clerk)
   - Queue management and background job processing architecture
   - Security and compliance framework implementation
   - Performance optimization and monitoring strategy
   - Deployment and DevOps considerations

## SUCCESS CHECKS

### Architecture Quality
- [ ] NestJS modular architecture supports maintainability and testing
- [ ] Database schema optimized for advisor scale (1,000-2,000 users)
- [ ] API design enables efficient frontend integration
- [ ] Queue architecture handles 06:00 IST delivery SLA requirements
- [ ] External service integrations include proper error handling and fallbacks

### Performance Validation
- [ ] Architecture design supports <200ms P95 API response times  
- [ ] Database design enables <50ms P95 query performance
- [ ] Compliance checking architecture achieves <1.5s P95 target
- [ ] Concurrent user support validated for 1,000+ advisors
- [ ] Queue processing capable of 5-minute delivery window

### Compliance & Security
- [ ] SEBI compliance framework comprehensive and audit-ready
- [ ] DPDP data protection integrated throughout data handling
- [ ] 5-year audit trail capabilities properly architected
- [ ] Security measures comprehensive (encryption, validation, monitoring)
- [ ] AI cost controls and budget enforcement mechanisms included

### Business Requirements
- [ ] Architecture supports all three subscription tiers (Basic/Standard/Pro)
- [ ] WhatsApp 99% delivery SLA technically achievable with design
- [ ] Advisor onboarding and verification workflows complete
- [ ] Analytics and reporting capabilities support business intelligence needs
- [ ] Scalability plan supports growth from 300 to 2,000 advisors

## CONTEXT MANAGEMENT

### Token Budget Guidelines
- **Architecture Analysis**: 60K tokens (comprehensive system design)
- **Implementation Specifications**: 80K tokens (detailed technical specifications)
- **Integration Planning**: 30K tokens (external service integration details)
- **Performance & Compliance**: 30K tokens (optimization and regulatory requirements)

### Development Approach
- Domain-driven design principles for business logic organization
- Test-driven development for critical compliance and business logic
- API-first design with OpenAPI documentation
- Microservices-ready architecture within monolithic deployment
- Infrastructure as Code for consistent deployment environments

---

**Execute this prompt to create a comprehensive backend architecture that enables Project One to deliver on its 99% WhatsApp SLA while maintaining strict SEBI compliance and supporting 1,000+ advisor scale.**