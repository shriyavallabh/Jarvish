# WhatsApp Template Manager Agent Prompt 📩

## When to Use
- Phase 4 after backend API and compliance systems are operational
- When implementing WhatsApp Business Cloud API integration
- Critical for achieving 99% delivery SLA at 06:00 IST
- After compliance validation to ensure template policy adherence

## Reads / Writes

**Reads:**
- `docs/wa/templates.md` - WhatsApp Business API templates and policy requirements
- `context/phase4/backend/*.js` - Backend API integration points

**Writes:**
- `context/phase4/wa/*.js` - Complete WhatsApp integration system
- `context/phase4/wa/cloud-api-client.js` - WhatsApp Business API client
- `context/phase4/wa/template-manager.js` - Template submission and approval
- `context/phase4/wa/delivery-scheduler.js` - 99% SLA delivery system
- `context/phase4/wa/quality-monitor.js` - Quality rating management
- `context/phase4/wa/webhook-handlers.js` - Real-time status processing

## Checklist Before Run

- [ ] WhatsApp Business Cloud API documentation thoroughly reviewed
- [ ] Template approval process and policy requirements understood
- [ ] Quality rating system (HIGH/MEDIUM/LOW) and impact documented
- [ ] Rate limiting constraints and best practices researched
- [ ] 99% delivery SLA requirements and fault tolerance strategies planned
- [ ] Message template categories (utility, marketing, authentication) understood
- [ ] Indian regulatory compliance for WhatsApp business messaging documented
- [ ] Integration with compliance system to ensure only approved content delivery

## One-Shot Prompt Block

```
ROLE: WhatsApp Template Manager - Business API Integration & Delivery
GOAL: Implement comprehensive WhatsApp Business Cloud API integration ensuring 99% delivery SLA with template management, quality rating maintenance, and real-time delivery tracking.

CONTEXT: Managing WhatsApp content delivery for 150-300 financial advisors scaling to 1,000-2,000, with peak load of 2,000 simultaneous messages at 06:00 IST. System must maintain HIGH quality rating while adhering to WhatsApp Business policies.

WHATSAPP BUSINESS API CONSTRAINTS:
• Quality Rating: Maintain HIGH rating (>80% positive feedback) for optimal delivery
• Rate Limiting: Messaging limits based on quality rating and business verification
• Template Policies: Strict approval process for message templates
• Message Categories: Utility (notifications), Marketing (promotional), Authentication (OTP)
• Content Guidelines: No spam, personalization required, opt-out mechanisms
• Delivery Windows: 24-hour session windows, template message initiation

DELIVERY SLA REQUIREMENTS:
• 99% Delivery Success: Messages delivered within 5 minutes of scheduled time
• Peak Load Handling: 2,000 simultaneous messages at 06:00 IST
• Fault Tolerance: Automatic retry with exponential backoff
• Fallback Strategy: SMS/Email backup when WhatsApp delivery fails
• Monitoring: Real-time delivery tracking with alerting on SLA violations
• Geographic Coverage: All India with Mumbai region optimization

TEMPLATE MANAGEMENT WORKFLOW:
• Template Creation: Dynamic template generation from advisor content
• Compliance Integration: Only compliance-approved content becomes templates
• Approval Tracking: Monitor template approval status with Meta review process
• Version Management: Template updates and rollback capabilities
• Performance Analytics: Template engagement and delivery success rates

INPUT FILES TO ANALYZE:
1. docs/wa/templates.md - WhatsApp Business API templates and policy requirements
2. context/phase4/backend/api-endpoints.js - Backend integration points
3. context/phase4/compliance/three-stage-validator.js - Compliance-approved content source

REQUIRED WHATSAPP OUTPUTS:
1. context/phase4/wa/cloud-api-client.js
   - WhatsApp Business Cloud API client with comprehensive error handling
   - Authentication: Access token management with automatic renewal
   - Rate limiting: Intelligent throttling based on quality rating and limits
   - Message sending: Template messages with parameter substitution
   - Media handling: Image, document attachment support for Pro tier
   - Status tracking: Delivery receipt and read receipt processing
   - Error classification: Temporary vs permanent failures for retry logic

2. context/phase4/wa/template-manager.js
   - Template lifecycle management from creation to approval
   - Dynamic template generation: Convert advisor content to WhatsApp templates
   - Approval workflow: Submit to Meta, track approval status, handle rejections
   - Template versioning: Maintain multiple template versions with rollback
   - Performance tracking: Template success rates and advisor engagement metrics
   - Policy compliance: Automatic template policy validation before submission

3. context/phase4/wa/delivery-scheduler.js
   - 99% SLA delivery system with fault-tolerant architecture
   - Queue management: Priority queues for different message types and advisor tiers
   - Batch processing: Efficient batch delivery for 06:00 IST peak load
   - Retry logic: Exponential backoff with dead letter queue for failed messages
   - Load balancing: Distribution across multiple WhatsApp Business accounts if needed
   - SLA monitoring: Real-time tracking with alerting on delivery delays

4. context/phase4/wa/quality-monitor.js
   - Quality rating tracking and maintenance system
   - Feedback analysis: Monitor user reports and feedback patterns
   - Proactive quality management: Identify content patterns leading to negative feedback
   - Advisor education: Guidance for maintaining high-quality messaging practices
   - A/B testing: Template and timing optimization for better engagement
   - Compliance integration: Quality rating impact of compliance violations

5. context/phase4/wa/webhook-handlers.js
   - Real-time webhook processing for message status updates
   - Delivery confirmations: Track sent, delivered, read, and failed statuses
   - Webhook authentication: Secure webhook endpoint with signature verification
   - Status persistence: Store delivery status in database for analytics and SLA tracking
   - Real-time updates: WebSocket updates to advisor dashboard for live delivery status
   - Error handling: Process webhook failures and status inconsistencies

6. context/phase4/wa/analytics-integration.js
   - WhatsApp delivery analytics for advisor insights
   - Engagement metrics: Open rates, click-through rates, response rates
   - Delivery performance: Success rates, failure reasons, timing analysis
   - Advisor benchmarking: Comparative performance across advisor tiers
   - Template performance: Most effective templates and messaging patterns
   - ROI analysis: Content engagement correlation with advisor business metrics

WHATSAPP POLICY COMPLIANCE:
• Opt-in Requirement: Verified user consent for marketing messages
• Personalization: Message content relevant to individual recipients
• Opt-out Mechanism: Easy unsubscribe process with immediate effect
• Content Quality: Valuable, relevant content that users want to receive
• Frequency Limits: Respect user preferences and engagement patterns
• Business Verification: Maintain verified business status for optimal limits

TECHNICAL INTEGRATION PATTERNS:
• Queue Architecture: Redis-based message queue with priority handling
• Circuit Breaker: Automatic failure detection with service degradation
• Caching Strategy: Template metadata and delivery status caching
• Database Integration: Persistent storage of delivery history and analytics
• Monitoring Integration: CloudWatch/Datadog integration for SLA tracking
• Security: End-to-end encryption and secure credential management

SUCCESS CRITERIA:
• 99% delivery SLA achieved consistently during peak and off-peak hours
• HIGH WhatsApp quality rating maintained (>80% positive feedback)
• Template approval process automated with <24 hour turnaround
• Real-time delivery status visible to advisors through dashboard
• Fault-tolerant architecture handles WhatsApp API outages gracefully
• Compliance integration ensures only approved content delivery
• Analytics provide actionable insights for advisor engagement improvement
```

## Post-Run Validation Checklist

- [ ] WhatsApp Business Cloud API client robust with comprehensive error handling
- [ ] Template management system handles approval workflow end-to-end
- [ ] 99% delivery SLA architecture tested under peak load conditions
- [ ] Quality rating monitoring proactively maintains HIGH rating status
- [ ] Real-time webhook processing updates delivery status accurately
- [ ] Rate limiting intelligence respects WhatsApp API constraints
- [ ] Compliance integration prevents non-approved content delivery
- [ ] Fault tolerance handles API outages with graceful degradation
- [ ] Queue management efficiently processes 2,000 simultaneous messages at 06:00 IST
- [ ] Template policy validation prevents policy violations before submission
- [ ] Analytics integration provides comprehensive delivery and engagement insights
- [ ] Retry logic with exponential backoff handles temporary failures effectively
- [ ] Database persistence supports audit requirements and performance analysis
- [ ] Security measures protect WhatsApp credentials and webhook endpoints
- [ ] Integration testing validates complete WhatsApp workflow functionality