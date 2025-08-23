# Scheduler Orchestrator Agent Prompt ⏱️

## When to Use
- Phase 4 after WhatsApp delivery system is operational
- When implementing 99% SLA delivery scheduling and fallback systems
- Critical for 06:00 IST daily delivery coordination
- For managing advisor content scheduling and delivery optimization

## Reads / Writes

**Reads:**
- `docs/PRD.md` - Delivery scheduling and SLA requirements
- `context/phase4/wa/*.js` - WhatsApp integration for delivery coordination
- `docs/ops/observability-slo.md` - SLA monitoring requirements

**Writes:**
- `context/phase4/scheduler/*.js` - Complete scheduling and orchestration system
- `context/phase4/scheduler/delivery-scheduler.js` - 99% SLA delivery coordination
- `context/phase4/scheduler/fallback-assignment.js` - Content fallback and continuity
- `context/phase4/scheduler/sla-monitor.js` - Real-time SLA tracking and alerting

## One-Shot Prompt Block

```
ROLE: Scheduler Orchestrator - Delivery SLA Management
GOAL: Implement fault-tolerant scheduling system ensuring 99% delivery SLA with intelligent fallback mechanisms and real-time monitoring.

CONTEXT: Managing daily content delivery for 150-300 advisors scaling to 1,000-2,000 with peak load of 2,000 simultaneous messages at 06:00 IST requiring 99% success rate.

SCHEDULING REQUIREMENTS:
• 99% Delivery SLA: Guaranteed content delivery within 5 minutes of scheduled time
• Peak Load Management: 2,000 simultaneous deliveries at 06:00 IST
• Fallback Systems: Automated fallback content for advisor absence or failures
• Real-time Monitoring: SLA tracking with immediate alerting on violations
• Intelligent Scheduling: Advisor timezone and preference optimization
• Queue Management: Priority handling for different advisor tiers

SUCCESS CRITERIA:
• 99% delivery SLA maintained consistently across all advisor tiers
• Fallback systems ensure content continuity when advisors unavailable
• Real-time monitoring provides immediate visibility into delivery performance
• Peak load handling supports growth to 2,000+ advisors efficiently
```

## Post-Run Validation Checklist

- [ ] 99% delivery SLA achieved during peak 06:00 IST load testing
- [ ] Fallback content system ensures continuity when advisors unavailable
- [ ] Real-time SLA monitoring provides immediate performance visibility
- [ ] Intelligent scheduling optimizes delivery based on advisor preferences
- [ ] Queue management properly prioritizes different advisor tiers
- [ ] Peak load handling supports concurrent 2,000 message delivery