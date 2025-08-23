# Observability & SLOs - Project One

## Service Level Objectives

### Primary SLO (North Star)
**Delivery Success Rate**: ≥99% of scheduled WhatsApp deliveries completed by 06:05 IST
- **Measurement Window**: Monthly
- **Error Budget**: 0.5% (allowing ~43 minutes of delivery failures per month)
- **Alert Threshold**: 2% failure rate in any 5-minute window during delivery

### AI Performance SLAs
- **Compliance Lint**: ≤1.5s P95 latency
- **Content Generation**: ≤3.5s P95 latency per variant
- **Translation**: ≤2.0s P95 latency
- **AI Availability**: 99.5% during business hours (09:00-22:00 IST)

### Platform Availability
- **Dashboard Uptime**: 99.9% monthly (allowing ~43 minutes downtime)
- **API Response Time**: <500ms P95 for all endpoints
- **WhatsApp Webhook Processing**: <2s P95 end-to-end

## Key Performance Indicators

### Business KPIs
- **Advisor Retention**: ≥98% monthly retention rate
- **Onboarding Completion**: 70-85% sign-up to first delivery
- **Content Approval Rate**: ≥90% first-pass approval rate
- **Fallback Usage**: <20% of total sends per advisor per month

### Operational KPIs
- **Queue Processing**: Nightly approval queue cleared by 21:30 IST
- **Pre-render Success**: 100% approved packs rendered by 21:30 IST
- **Template Quality**: WhatsApp quality rating maintained ≥High
- **Zero Data Incidents**: No PII leaks or compliance violations

### AI Intelligence KPIs
- **Compliance Accuracy**: <5% false positive rate on AI lint
- **Personalization Effectiveness**: 15% improvement in content selection rates
- **Cost Efficiency**: Stay within ₹25k/month AI budget
- **Model Fallback Rate**: <10% primary model failures

## Detailed Alert Thresholds

### Critical Alerts (P0 - Page On-Call Immediately)
```yaml
delivery_failure_alert:
  metric: "whatsapp.delivery.failure_rate"
  threshold: ">2% failures in any 5-minute window"
  window: "05:30-06:30 IST (daily delivery window)"
  channels: ["pagerduty", "slack-critical", "sms"]
  escalation: "page_engineering_lead_after_5_minutes"
  runbook: "/runbooks/delivery-failure-incident"
  
whatsapp_quality_degradation:
  metric: "whatsapp.quality_rating"
  threshold: "drops_to_medium_or_low"
  evaluation: "immediate_on_webhook_receipt"
  channels: ["pagerduty", "slack-critical"]
  escalation: "executive_notification_within_15_minutes"
  runbook: "/runbooks/whatsapp-quality-recovery"
  
ai_service_outage:
  metrics:
    - "openai.api.availability < 95% for >5 minutes"
    - "compliance_engine.health_check = failed"
  window: "06:00-22:00 IST (business hours)"
  channels: ["pagerduty", "slack-critical"]
  escalation: "activate_ai_fallback_mode"
  runbook: "/runbooks/ai-service-outage"
  
database_unavailable:
  metrics:
    - "postgresql.connection.pool.exhausted"
    - "redis.primary.unreachable"
  threshold: "unable_to_establish_connections >30 seconds"
  channels: ["pagerduty", "slack-critical", "executive-alert"]
  escalation: "immediate_failover_to_backup"
  runbook: "/runbooks/database-emergency"

compliance_violation_detected:
  metrics:
    - "sebi.violation.critical_detected"
    - "content.risk_score > 90"
  threshold: "any_critical_compliance_issue"
  channels: ["pagerduty", "slack-compliance", "legal-alert"]
  escalation: "legal_team_notification_immediate"
  runbook: "/runbooks/compliance-incident"
```

### High Priority Alerts (P1 - 30min Response)
```yaml
approval_queue_backlog:
  metric: "approval.queue.pending_count"
  threshold: ">50 items at 21:45 IST OR >0 items at 05:00 IST"
  channels: ["slack-ops", "email-ops"]
  escalation: "wake_compliance_team_if_queue_not_cleared_by_05:00"
  runbook: "/runbooks/approval-queue-backlog"
  
pre_render_failures:
  metric: "render.pipeline.failure_rate"
  threshold: ">10% failures for next-day content"
  window: "20:30-21:30 IST"
  channels: ["slack-ops", "email-engineering"]
  escalation: "manual_render_investigation_required"
  runbook: "/runbooks/render-pipeline-failures"
  
payment_system_failure:
  metrics:
    - "razorpay.webhook.failure_rate > 5%"
    - "subscription.billing.errors > 3 per hour"
  channels: ["slack-business", "email-finance"]
  escalation: "freeze_new_subscriptions_if_>20_failures"
  runbook: "/runbooks/payment-system-incident"
  
template_approval_delays:
  metric: "whatsapp.template.approval_time"
  threshold: ">5 business days pending"
  channels: ["slack-ops", "email-marketing"]
  escalation: "investigate_meta_approval_bottleneck"
  runbook: "/runbooks/template-approval-delays"
```

### Medium Priority Alerts (P2 - 2hr Response)
```yaml
ai_latency_degradation:
  metrics:
    - "openai.compliance.latency.p95 > 3.0s"
    - "openai.generation.latency.p95 > 7.0s"
  window: "sustained for >15 minutes"
  channels: ["slack-engineering"]
  escalation: "investigate_ai_performance_after_2_hours"
  runbook: "/runbooks/ai-performance-degradation"
  
dashboard_error_rate:
  metric: "nextjs.5xx_error_rate"
  threshold: ">1% for >10 minutes"
  channels: ["slack-engineering"]
  escalation: "frontend_team_investigation"
  runbook: "/runbooks/dashboard-error-investigation"
  
individual_advisor_failures:
  metric: "advisor.delivery.personal_failure_rate"
  threshold: ">20% failures for single advisor in 24h"
  channels: ["slack-support"]
  escalation: "advisor_outreach_and_investigation"
  runbook: "/runbooks/advisor-delivery-troubleshooting"
  
cost_budget_warning:
  metrics:
    - "openai.monthly_cost > 80% of ₹25k budget"
    - "cloudinary.monthly_cost > 80% of ₹10k budget"
  channels: ["slack-finance", "email-leadership"]
  escalation: "budget_review_meeting_required"
  runbook: "/runbooks/cost-optimization-review"
```

### Low Priority Alerts (P3 - Next Business Day)
```yaml
performance_optimization_opportunities:
  metrics:
    - "api.response_time.p95 > 800ms (not > 1s threshold)"
    - "database.slow_queries > 10 per hour"
  channels: ["slack-engineering-low-priority"]
  escalation: "backlog_optimization_task"
  runbook: "/runbooks/performance-optimization"
  
analytics_data_delays:
  metric: "analytics.processing.lag"
  threshold: ">4 hours behind real-time"
  channels: ["slack-data"]
  escalation: "investigate_etl_pipeline_performance"
  runbook: "/runbooks/analytics-pipeline-debugging"
  
feature_adoption_monitoring:
  metrics:
    - "feature.pro_tier.adoption_rate < 5%"
    - "feature.multi_language.usage < 20%"
  channels: ["slack-product"]
  escalation: "product_review_and_optimization"
  runbook: "/runbooks/feature-adoption-analysis"
```

## Alert Runbook Links

### Emergency Runbooks
- **`/runbooks/delivery-failure-incident`**: WhatsApp delivery failure response procedures
- **`/runbooks/whatsapp-quality-recovery`**: Quality rating recovery playbook (detailed in wa/templates.md)
- **`/runbooks/ai-service-outage`**: AI service fallback and recovery procedures  
- **`/runbooks/database-emergency`**: Database failover and recovery procedures
- **`/runbooks/compliance-incident`**: SEBI compliance violation response protocol

### Operational Runbooks
- **`/runbooks/approval-queue-backlog`**: Manual approval queue processing procedures
- **`/runbooks/render-pipeline-failures`**: Image rendering troubleshooting and manual intervention
- **`/runbooks/payment-system-incident`**: Razorpay integration and billing issue resolution
- **`/runbooks/template-approval-delays`**: Meta WhatsApp template approval acceleration

### Performance Runbooks
- **`/runbooks/ai-performance-degradation`**: AI API optimization and provider switching
- **`/runbooks/dashboard-error-investigation`**: Next.js frontend debugging and resolution
- **`/runbooks/advisor-delivery-troubleshooting`**: Individual advisor delivery issue resolution
- **`/runbooks/cost-optimization-review`**: AI and infrastructure cost optimization procedures

### Maintenance Runbooks
- **`/runbooks/performance-optimization`**: System performance tuning procedures
- **`/runbooks/analytics-pipeline-debugging`**: Data pipeline troubleshooting and repair
- **`/runbooks/feature-adoption-analysis`**: Product feature performance analysis and improvement

## Monitoring Infrastructure

### Application Monitoring
- **APM**: Datadog with OpenTelemetry instrumentation
- **Logs**: Centralized logging with structured JSON
- **Metrics**: Custom business metrics + infrastructure metrics
- **Traces**: End-to-end request tracing for AI workflows

### AI-Specific Monitoring
- **Model Performance**: Latency, token usage, cost per request
- **Content Quality**: Compliance pass rates, advisor satisfaction scores
- **Personalization**: Content ranking effectiveness, engagement correlation
- **Fallback Triggers**: Model failures, cost ceiling breaches

### WhatsApp Health Monitoring
- **Quality Rating**: Real-time tracking via API
- **Delivery Rates**: Success/failure rates by template and advisor
- **Template Status**: Approval status, usage patterns
- **Phone Number Health**: Individual number performance metrics

## Dashboard & Visualization

### Executive Dashboard
- North star metric (delivery success rate)
- Monthly recurring revenue and growth
- Advisor health score distribution
- Critical incidents and resolution status

### Operations Dashboard
- Real-time delivery pipeline status
- AI processing queue depth and latency
- Nightly approval workflow progress
- WhatsApp template and quality health

### Compliance Dashboard
- Content risk score distributions
- Policy version changes and impact
- Audit log analysis and patterns
- Regulator feedback tracking

## Incident Response

### Severity Levels
- **P0 (Critical)**: Core delivery failure, data breach, complete outage
- **P1 (High)**: Partial service degradation, compliance incident
- **P2 (Medium)**: Feature failures, performance degradation
- **P3 (Low)**: Minor bugs, enhancement requests

### Response Times
- **P0**: 15 minutes acknowledgment, 1 hour resolution target
- **P1**: 30 minutes acknowledgment, 4 hours resolution target
- **P2**: 2 hours acknowledgment, 24 hours resolution target
- **P3**: Next business day acknowledgment and resolution

### Communication Plan
- **Internal**: Slack alerts, PagerDuty escalation
- **External**: Status page updates, proactive advisor communication
- **Compliance**: Immediate notification for any regulatory issues

## Capacity Planning

### Traffic Patterns
- **Peak Authoring**: 20:00-22:00 IST (content creation)
- **Peak Processing**: 20:30-21:30 IST (approval & render)
- **Peak Delivery**: 06:00-06:05 IST (WhatsApp send)

### Scale Targets
- **T+90 Days**: 300 advisors, 900 daily deliveries
- **T+12 Months**: 2,000 advisors, 6,000 daily deliveries
- **AI Processing**: 5,000 generations/hour capacity during peak
- **WhatsApp**: 12,000 sends/day with burst handling