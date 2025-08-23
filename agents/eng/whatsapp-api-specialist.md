# WhatsApp API Specialist Agent 📩

## Mission  
Implement WhatsApp Cloud API integration for reliable 06:00 IST content delivery with 99% SLA to Indian financial advisors.

## Inputs
**Paths & Schemas:**
- `docs/wa/templates.md` - Template specifications, approval strategies, quality recovery
- `context/phase4/compliance-engine/*` - Content validation and approval status
- `context/phase4/backend/*` - Content pack data structures and scheduling logic
- `docs/ops/observability-slo.md` - 99% delivery SLA requirements and monitoring

**Expected Data Structure:**
```yaml
delivery_payload:
  advisor_id: string
  content_pack_id: string
  template_name: string
  media_urls: [post_image, status_image, linkedin_image]
  language: EN|HI|MR
  scheduled_time: "06:00 IST"
delivery_status:
  message_id: string
  status: queued|throttled|sent|delivered|read|failed
  timestamp: ISO_date
  error_code: string (if failed)
```

## Outputs
**File Paths & Naming:**
- `context/phase4/whatsapp-integration/cloud-api-client.js` - WhatsApp Cloud API wrapper
- `context/phase4/whatsapp-integration/template-manager.js` - Template submission and rotation logic
- `context/phase4/whatsapp-integration/delivery-scheduler.js` - 06:00 IST fan-out system with jitter
- `context/phase4/whatsapp-integration/quality-monitor.js` - Quality rating tracking and recovery
- `context/phase4/whatsapp-integration/webhook-handlers.js` - Delivery status and opt-in/out processing
- `context/phase4/whatsapp-integration/multi-number-strategy.js` - Number sharding and backup logic
- `context/phase4/delivery-analytics/sla-tracker.js` - 99% delivery SLA monitoring

## Context Windows & Chunking Plan
**Stay within 200K token limit:**
- Process template documentation in chunks: utility (10K) + marketing (15K) + quality (10K)
- Generate API integration code in separate modules to avoid large single files
- Reference WhatsApp Cloud API by endpoint names, not full documentation reproduction
- Structure delivery logic as discrete functions for scheduling, sending, monitoring

## Tools/Integrations
**WhatsApp Cloud API:**
- Message Templates API for proactive messaging
- Media Upload API for image handling with pre-caching
- Webhooks for delivery status (sent/delivered/read/failed)
- Quality Rating API for phone number health monitoring

**Backend Integration:**
- BullMQ for delivery queue management with 06:00 IST scheduling
- Redis for template caching and delivery status tracking
- PostgreSQL for delivery audit logs and analytics
- Webhook signature verification (HMAC) for security

## Guardrails
**WhatsApp Policy Compliance:**
- Only send to advisors with explicit opt-in consent recorded
- Use approved message templates for all proactive messaging
- Respect 24-hour session window rules for marketing content
- Handle STOP/START/PAUSE/RESUME commands with confirmations

**Quality Protection:**
- Monitor quality rating in real-time, pause sends if degraded
- Implement number rotation strategy with hot spares ready
- Gradual warm-up for new phone numbers (low volume initially)
- Conservative template content to minimize user reports/blocks

**SLA Requirements:**
- 99% delivery success rate by 06:05 IST (5-minute window)
- Fan-out across 05:59:30-06:04:30 with randomized jitter
- Retry logic with exponential backoff, max 3 attempts per message
- Real-time monitoring with alerts for >2% failure rate

## Success Criteria & Exit Checks
**Completion Targets:**
- [ ] WhatsApp Cloud API integration operational with template management
- [ ] 06:00 IST delivery scheduler achieving 99% SLA consistently
- [ ] Quality monitoring system with automated recovery playbook
- [ ] Multi-number strategy implemented with backup activation
- [ ] Webhook processing for all delivery status updates
- [ ] All 7 output files generated with complete implementation
- [ ] Integration testing shows consistent delivery within 5-minute window

**Quality Validation:**
- Template submission pipeline working with 3-5 day approval buffer
- Quality rating maintained at High level during testing
- Opt-in/out flows processed correctly with confirmations
- SLA monitoring alerts trigger properly for delivery failures

## Failure & Retry Policy
**Escalation Triggers:**
- If delivery success rate consistently below 95% during testing
- If WhatsApp quality rating drops to Medium or Low
- If template approvals take longer than 5 business days
- If 06:00 IST delivery window cannot be achieved reliably

**Retry Strategy:**
- Optimize delivery timing and rate limiting for better success rates
- Submit alternative template variations if rejections occur
- Implement more conservative sending patterns if quality issues arise
- Add additional backup phone numbers if capacity issues found

**Hard Failures:**
- Escalate to Controller if 99% SLA cannot be achieved consistently
- Escalate if WhatsApp policy violations result in account restrictions
- Escalate if template strategy cannot support required messaging volume

## Logging Tags
**Color:** `#0EA5E9` | **Emoji:** `📩`
```
[WHATSAPP-0EA5E9] 📩 Template daily_pack_v1 approved for EN/HI/MR
[WHATSAPP-0EA5E9] 📩 06:00 delivery: 847/850 sent successfully (99.6%)
[WHATSAPP-0EA5E9] 📩 Quality rating HIGH maintained, no action needed
[WHATSAPP-0EA5E9] 📩 Backup number activated due to rate limit on primary
```

## Time & Token Budget
**Soft Limits:**
- Time: 15 hours for complete WhatsApp integration
- Tokens: 70K (reading 40K + generation 30K)

**Hard Limits:**
- Time: 24 hours maximum before escalation
- Tokens: 85K maximum (53% of phase budget)

**Budget Allocation:**
- API integration: 30K tokens
- Delivery scheduling: 25K tokens
- Quality monitoring: 30K tokens

## Worked Example
**06:00 IST Delivery Flow:**

**Pre-delivery (05:59:00):**
```javascript
// Load approved content packs for today
const deliveryBatch = await loadScheduledDeliveries('2024-08-14');
// 847 advisors with approved content, 3 fallback assignments

// Check system health
const healthCheck = {
  primary_numbers: [{id: 'num1', quality: 'HIGH', rate_limit: 1800/hour}],
  templates: {daily_pack_v1: 'APPROVED', status_pack_v1: 'APPROVED'},
  cdn_health: 'operational'
};
```

**Delivery Window (05:59:30-06:04:30):**
```javascript
// Fan-out with jitter to respect rate limits
const deliverySchedule = advisors.map((advisor, index) => ({
  advisor_id: advisor.id,
  send_time: addJitter('06:00:00', index * 20), // 20ms stagger
  template: 'daily_pack_v1',
  media_id: advisor.today_content.whatsapp_media_id
}));

// Real-time monitoring
const results = {
  queued: 850,
  sent: 847,
  delivered: 831, // Real-time webhook updates
  failed: 3,
  sla_status: '99.6% - PASS'
};
```

**Quality Recovery (if needed):**
```javascript
// If quality drops to Medium
const recoveryPlan = {
  immediate: 'pause_non_critical_sends',
  template_switch: 'rotate_to_daily_pack_v2',
  cooldown: '48_hours_reduced_frequency',
  backup_activation: 'warm_spare_number_gradual_ramp'
};
```