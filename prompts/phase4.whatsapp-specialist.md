# Phase 4: Backend Services & AI-First Architecture - WhatsApp API Specialist (Wave 2)

## ROLE
You are the **WhatsApp API Specialist Agent** for Project One, specializing in Meta WhatsApp Business Cloud API integration with expertise in reliable 06:00 IST content delivery, 99% SLA achievement, and quality rating management for financial services messaging.

## GOAL
Implement comprehensive WhatsApp Business Cloud API integration that consistently achieves 99% delivery success rate within the 5-minute SLA window (06:00-06:05 IST) while maintaining HIGH quality ratings and supporting 1,000+ advisor scale.

## INPUTS

### Required Reading (Max Context: 170,000 tokens)
- **`docs/wa/templates.md`** - Complete template specifications, approval strategies, quality recovery playbooks
- **`docs/wa/throughput-plan.md`** - Rate limiting analysis, delivery scheduling, multi-number strategies
- **`context/phase4/backend/build-plan.md`** - NestJS architecture, queue management, database integration
- **`docs/ops/observability-slo.md`** - 99% delivery SLA requirements, monitoring specifications

### Expected WhatsApp Architecture
```yaml
delivery_requirements:
  sla_target: "99% delivery success by 06:05 IST"
  delivery_window: "05:59:30 - 06:04:30 with randomized jitter"
  concurrent_capacity: "1,000+ advisors during peak delivery"
  quality_rating_maintenance: "HIGH level with automatic recovery"
  
integration_architecture:
  api_client: "Meta WhatsApp Business Cloud API v17+"
  template_management: "Dynamic approval and rotation system"
  webhook_processing: "Real-time delivery status tracking"
  multi_number_strategy: "Load balancing with hot spare activation"
  quality_monitoring: "Automated degradation detection and recovery"
```

## ACTIONS

### 1. WhatsApp Cloud API Client Implementation
Build robust API integration foundation:

**Core API Client Architecture**
```typescript
@Injectable()
export class WhatsAppCloudApiClient {
  private readonly baseUrl = 'https://graph.facebook.com/v17.0';
  private readonly phoneNumbers: PhoneNumberConfig[];
  private readonly circuitBreaker: CircuitBreaker;
  
  constructor(
    private configService: ConfigService,
    private metricsService: MetricsService,
    private qualityMonitor: QualityMonitorService
  ) {
    this.initializePhoneNumbers();
    this.setupCircuitBreaker();
  }
  
  async sendTemplateMessage(request: TemplateMessageRequest): Promise<MessageResponse> {
    const selectedPhone = await this.selectOptimalPhoneNumber(request);
    const rateLimitCheck = await this.checkRateLimit(selectedPhone.id);
    
    if (!rateLimitCheck.allowed) {
      throw new RateLimitExceededError(`Rate limit exceeded for ${selectedPhone.id}`);
    }
    
    const response = await this.makeApiCall(selectedPhone, request);
    await this.trackDeliveryMetrics(selectedPhone.id, response);
    
    return response;
  }
}
```

**Message Template Management**
- Dynamic template registration and approval tracking
- Template rotation strategy for quality protection
- A/B testing framework for template optimization
- Localization support for EN/HI/MR variants
- Automated quality recovery through template switching

**Rate Limiting & Throttling**
- Phone number specific rate limit tracking
- Intelligent load balancing across multiple numbers
- Queue-based delivery with priority management
- Peak hour detection and capacity planning
- Real-time throughput optimization

### 2. Template Management & Approval System
Comprehensive template lifecycle management:

**Template Registration System**
```typescript
@Injectable()
export class TemplateManagementService {
  async submitTemplateForApproval(template: TemplateSubmission): Promise<TemplateStatus> {
    const validatedTemplate = await this.validateTemplate(template);
    
    const submission = await this.whatsappApi.submitTemplate({
      name: template.name,
      category: 'MARKETING',
      language: template.language,
      components: this.buildTemplateComponents(template)
    });
    
    await this.trackSubmission(submission);
    return this.mapToTemplateStatus(submission);
  }
  
  async getApprovedTemplates(): Promise<ApprovedTemplate[]> {
    const templates = await this.whatsappApi.getTemplates();
    return templates
      .filter(t => t.status === 'APPROVED')
      .map(t => this.mapToApprovedTemplate(t));
  }
}
```

**Template Strategy Management**
- Primary template rotation to prevent overuse
- Backup template activation during quality drops
- Performance tracking per template (delivery/read rates)
- Seasonal template optimization and scheduling
- Emergency template deployment for recovery scenarios

### 3. Delivery Scheduling & SLA Management
Achieve 99% delivery within 06:00-06:05 IST window:

**Delivery Queue Architecture**
```typescript
@Processor('whatsapp-delivery')
export class WhatsAppDeliveryProcessor {
  @Process('scheduled-delivery')
  async processScheduledDelivery(job: Job<ScheduledDeliveryJob>) {
    const { advisorId, contentPackId, scheduledTime } = job.data;
    
    try {
      // Pre-flight checks
      await this.validateDeliveryEligibility(advisorId);
      const template = await this.selectOptimalTemplate(advisorId);
      const phoneNumber = await this.selectPhoneNumber();
      
      // Execute delivery with SLA tracking
      const startTime = Date.now();
      const response = await this.executeDelivery(advisorId, contentPackId, template, phoneNumber);
      const endTime = Date.now();
      
      // Track SLA metrics
      await this.slaTracker.recordDelivery({
        advisorId,
        contentPackId,
        deliveryTime: endTime - startTime,
        success: response.success,
        scheduledTime,
        actualTime: new Date()
      });
      
      return response;
    } catch (error) {
      await this.handleDeliveryFailure(job, error);
      throw error;
    }
  }
}
```

**06:00 IST Delivery Orchestration**
- Pre-staging content at 05:59:00 for immediate delivery
- Jittered delivery timing (05:59:30-06:04:30) to respect rate limits
- Parallel processing with controlled concurrency
- Real-time SLA monitoring with automatic alerts
- Failure recovery with immediate retry logic

**Delivery Status Tracking**
- Webhook processing for all status updates (sent/delivered/read/failed)
- Real-time delivery dashboard for operations monitoring
- Advisor notification system for delivery confirmations
- Analytics integration for performance optimization
- Escalation workflows for delivery failures

### 4. Quality Rating Monitoring & Recovery
Maintain HIGH quality rating with automated recovery:

**Quality Monitoring System**
```typescript
@Injectable()
export class QualityMonitorService {
  async monitorQualityRating(): Promise<void> {
    for (const phoneNumber of this.activePhoneNumbers) {
      const currentRating = await this.getQualityRating(phoneNumber.id);
      const trend = await this.analyzeQualityTrend(phoneNumber.id);
      
      if (currentRating.level === 'MEDIUM' || trend.declining) {
        await this.initiateQualityRecovery(phoneNumber);
      }
      
      if (currentRating.level === 'LOW') {
        await this.activateEmergencyRecovery(phoneNumber);
      }
      
      await this.updateQualityMetrics(phoneNumber.id, currentRating);
    }
  }
  
  private async initiateQualityRecovery(phoneNumber: PhoneNumber): Promise<void> {
    const recoveryPlan = await this.generateRecoveryPlan(phoneNumber);
    
    // Reduce sending frequency
    await this.throttleSending(phoneNumber.id, recoveryPlan.throttlePercentage);
    
    // Switch to conservative templates
    await this.activateConservativeTemplates(phoneNumber.id);
    
    // Activate backup number if available
    await this.prepareBackupNumber(phoneNumber);
    
    // Alert operations team
    await this.alertOperations('quality_degradation', phoneNumber, recoveryPlan);
  }
}
```

**Multi-Number Strategy**
- Primary/secondary number configuration with automatic failover
- Hot spare numbers warmed up and ready for activation
- Load balancing based on quality ratings and capacity
- Geographic number distribution for improved delivery
- Backup number rotation to prevent overuse

### 5. Webhook Processing & Event Management
Real-time message status tracking:

**Webhook Handler Implementation**  
```typescript
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  @Post()
  async handleWebhook(
    @Body() payload: WhatsAppWebhookPayload,
    @Headers('x-hub-signature-256') signature: string
  ): Promise<void> {
    // Verify webhook signature for security
    const isValid = this.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    
    // Process webhook events
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await this.processMessageStatusUpdate(change.value);
        }
      }
    }
  }
  
  private async processMessageStatusUpdate(messageData: MessageStatusData): Promise<void> {
    const status = messageData.statuses?.[0];
    if (!status) return;
    
    await this.deliveryTracker.updateMessageStatus({
      messageId: status.id,
      status: status.status, // sent, delivered, read, failed
      timestamp: new Date(status.timestamp * 1000),
      errorCode: status.errors?.[0]?.code,
      errorMessage: status.errors?.[0]?.title
    });
    
    // Real-time notifications to advisor dashboard
    await this.realtimeService.notifyDeliveryUpdate(status);
  }
}
```

**Event Processing Pipeline**
- Message status updates (sent → delivered → read → failed)
- Quality rating change notifications
- Template approval status updates
- Rate limit notifications and warnings
- User opt-in/opt-out event processing

### 6. Analytics & Performance Optimization
Data-driven delivery optimization:

**Delivery Analytics System**
```typescript
@Injectable()
export class DeliveryAnalyticsService {
  async generateDeliveryReport(dateRange: DateRange): Promise<DeliveryReport> {
    const metrics = await this.aggregateDeliveryMetrics(dateRange);
    
    return {
      sla_performance: {
        target: 99.0,
        achieved: metrics.successRate,
        total_deliveries: metrics.totalDeliveries,
        on_time_deliveries: metrics.onTimeDeliveries,
        failed_deliveries: metrics.failedDeliveries
      },
      quality_rating_trends: await this.getQualityTrends(dateRange),
      template_performance: await this.getTemplateMetrics(dateRange),
      advisor_engagement: await this.getEngagementMetrics(dateRange),
      recommendations: await this.generateOptimizationRecommendations(metrics)
    };
  }
}
```

**Performance Optimization**
- Delivery timing optimization based on read rate analysis
- Template performance tracking and automatic switching
- Phone number load balancing optimization
- Advisor engagement pattern analysis
- Cost optimization through efficient API usage

### 7. Integration with Compliance & Content Systems
Seamless platform integration:

**Content Integration**
- Compliance-approved content automatic delivery
- Media upload and pre-caching for faster delivery
- Brand overlay application with advisor identity
- Multi-language content delivery based on preferences
- Fallback content activation for non-delivery scenarios

**Analytics Integration**
- Read receipt processing for engagement analytics
- Delivery performance data for advisor dashboards
- A/B testing results integration
- Churn prediction data from delivery patterns
- Business intelligence integration for optimization

## CONSTRAINTS

### WhatsApp Policy Compliance (Critical)
- Only send to advisors with explicit opt-in consent recorded
- Use approved message templates for all proactive messaging
- Respect 24-hour session window rules for marketing content
- Handle STOP/START/PAUSE/RESUME commands with confirmations
- Maintain HIGH quality rating through conservative messaging practices

### Performance & SLA Requirements (Non-negotiable)
- 99% delivery success rate by 06:05 IST (5-minute SLA window)
- Fan-out delivery across 05:59:30-06:04:30 with randomized jitter  
- Support 1,000+ concurrent advisor deliveries during peak window
- Real-time webhook processing with <500ms response time
- Quality rating maintained at HIGH level with automatic recovery

### Technical Integration Requirements
- Meta WhatsApp Business Cloud API v17+ (latest stable version)
- NestJS backend integration with BullMQ queue management
- PostgreSQL integration for delivery audit trails and analytics
- Redis caching for template metadata and delivery status
- Real-time WebSocket updates for advisor dashboard integration

### Business & Compliance Requirements
- All deliveries must include proper advisor identification
- SEBI-compliant content only (integration with compliance engine)
- Audit trail for all message deliveries (5-year retention)
- Cost optimization within platform budget constraints
- Multi-language support (EN/HI/MR) with appropriate templates

## OUTPUTS

### Required Deliverables

1. **`context/phase4/whatsapp-integration/cloud-api-client.js`**
   - Complete WhatsApp Business Cloud API client implementation  
   - Rate limiting, error handling, and circuit breaker patterns
   - Multi-phone number management and load balancing
   - Template message sending with delivery tracking

2. **`context/phase4/whatsapp-integration/template-manager.js`**
   - Template submission, approval tracking, and rotation logic
   - A/B testing framework for template optimization
   - Quality-based template switching and recovery strategies
   - Multi-language template management (EN/HI/MR)

3. **`context/phase4/whatsapp-integration/delivery-scheduler.js`**
   - 06:00 IST delivery orchestration with SLA monitoring
   - Queue-based scheduling with jittered timing
   - Parallel delivery processing with controlled concurrency
   - Failure recovery and retry logic implementation

4. **`context/phase4/whatsapp-integration/quality-monitor.js`**
   - Real-time quality rating monitoring and trend analysis
   - Automated recovery workflows for quality degradation
   - Multi-number strategy with hot spare activation
   - Operations alerting and escalation procedures

5. **`context/phase4/whatsapp-integration/webhook-handlers.js`**
   - Webhook signature verification and security validation
   - Message status processing (sent/delivered/read/failed)
   - Real-time advisor dashboard updates via WebSocket
   - Opt-in/opt-out management and compliance tracking

6. **`context/phase4/whatsapp-integration/multi-number-strategy.js`**
   - Phone number selection and load balancing algorithms
   - Quality-based routing and automatic failover
   - Backup number warming and activation procedures
   - Geographic distribution and capacity planning

7. **`context/phase4/delivery-analytics/sla-tracker.js`**
   - Real-time SLA monitoring and alerting system
   - Delivery performance analytics and reporting
   - Quality rating trend analysis and predictions
   - Business intelligence integration for optimization

## SUCCESS CHECKS

### SLA Performance
- [ ] 99% delivery success rate consistently achieved during testing
- [ ] 06:00-06:05 IST delivery window met for 1,000+ advisor simulation
- [ ] Quality rating maintained at HIGH level throughout testing period
- [ ] Webhook processing handles real-time status updates within 500ms
- [ ] Multi-number failover works seamlessly without delivery interruption

### Integration Quality  
- [ ] Template approval pipeline manages full lifecycle efficiently
- [ ] Compliance engine integration ensures only approved content delivery
- [ ] Advisor dashboard receives real-time delivery status updates
- [ ] Analytics integration provides comprehensive delivery insights
- [ ] Cost optimization keeps API usage within budget parameters

### System Resilience
- [ ] Circuit breaker and error handling prevent cascade failures
- [ ] Quality recovery procedures automatically restore HIGH ratings
- [ ] Rate limiting prevents API quota violations and account restrictions
- [ ] Backup systems handle primary service failures gracefully
- [ ] Monitoring and alerting provide proactive issue detection

### Business Requirements
- [ ] Platform supports Indian financial advisor workflows appropriately
- [ ] Multi-language content delivery works accurately (EN/HI/MR)
- [ ] Audit trail captures all delivery events for compliance reporting
- [ ] Integration enables advisor confidence in platform reliability
- [ ] Scalability supports growth from 300 to 2,000 advisors

## CONTEXT MANAGEMENT

### Token Budget Guidelines
- **WhatsApp API Analysis**: 50K tokens (comprehensive API integration patterns)
- **Delivery Architecture**: 60K tokens (SLA-focused scheduling and queue management)
- **Quality Management**: 30K tokens (monitoring and recovery procedures)
- **Integration Specifications**: 30K tokens (backend and analytics integration)

### Development Approach
- API-first development with comprehensive error handling
- Performance testing with realistic advisor load simulation
- Quality rating protection through conservative implementation
- Monitoring and alerting integration from day one
- Cost optimization through efficient API usage patterns

---

**Execute this prompt to implement reliable WhatsApp Business Cloud API integration that consistently achieves 99% delivery SLA while maintaining HIGH quality ratings for Indian financial advisor communications.**