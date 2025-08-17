# Claude Multi-Agent Workflow Guide - Project One

## How to Run the AI-First Financial Platform Development Workflow

This project implements a specialized multi-agent workflow for building a SEBI-compliant, AI-powered B2B financial content platform. Each phase has expert agents that collaborate through shared context files to deliver a production-ready system.

## Workflow Execution Strategy

**Execution Mode**: Sequential with 80% overlap allowance
**Total Timeline**: 47-66 days across 4 phases
**Checkpoint Validation**: Required at each phase completion
**Rollback Capability**: Enabled with recovery strategies

## Phase 1: UX Research & Compliance Planning (5-7 days)

### Agent Activation
```bash
# Primary UX Research for Financial Advisors
claude-agent compliance-ux-researcher --input docs/PRD.md --output context/phase1/

# Dashboard Architecture Planning
claude-agent financial-dashboard-planner --input context/phase1/ux-flows/ --output context/phase1/

# AI Integration Architecture
claude-agent ai-workflow-architect --input docs/ai/ai-config.yaml --output context/phase1/
```

### Expected Outputs
- **UX Flows**: `/context/phase1/ux-flows/advisor-dashboard/`, `/context/phase1/ux-flows/content-composer/`, `/context/phase1/ux-flows/onboarding/`
- **Compliance Patterns**: `/context/phase1/compliance-patterns.md` with SEBI-aware UX requirements
- **AI Integration Plan**: `/context/phase1/ai-integration.md` with real-time compliance checking architecture
- **Mobile Guidelines**: `/context/phase1/mobile-ux-guidelines.md` for advisor on-the-go usage

### Phase 1 Success Criteria
- Advisor onboarding journey mapped with 70-85% completion target
- Content creation workflow with AI assistance fully documented
- Three-stage compliance checking UX patterns validated
- WhatsApp integration flows designed for 06:00 IST delivery
- Mobile-responsive layouts planned for busy advisors

## Phase 2: Financial UI Design & Brand System (7-10 days)

### Agent Activation
```bash
# Professional FinTech Design System
claude-agent fintech-ui-designer --input context/phase1/ --output context/phase2/

# Compliance Visual Patterns
claude-agent compliance-visual-designer --input context/phase1/compliance-patterns.md --output context/phase2/

# Brand Consistency Validation
claude-agent brand-consistency-agent --input context/phase2/ --output context/phase2/
```

### Expected Outputs
- **Design System**: `/context/phase2/design-system/` with FinTech color palette, typography, shadows
- **Component Designs**: `/context/phase2/financial-components/` adapted from shadcn-ui for advisors
- **Compliance UI**: `/context/phase2/compliance-ui/` with green/amber/red risk indicators
- **Brand Standards**: `/context/phase2/brand-standards/` for financial services trust-building
- **Mobile Layouts**: Responsive designs tested across advisor device types

### Phase 2 Success Criteria
- Professional financial services design language established
- shadcn-ui components customized for advisor workflows
- Compliance alert patterns clear and non-intrusive
- Mobile responsiveness validated on target devices
- Brand guidelines consistent with B2B financial industry standards

## Phase 3: Frontend Development & AI Integration (14-21 days)

### Agent Activation
```bash
# Next.js Dashboard Implementation
claude-agent nextjs-dashboard-developer --input context/phase2/ --output context/phase3/

# AI Services Integration
claude-agent ai-integration-specialist --input context/phase1/ai-integration.md --output context/phase3/

# Compliance Frontend Components
claude-agent compliance-frontend-dev --input context/phase2/compliance-ui/ --output context/phase3/
```

### Expected Outputs
- **Dashboard App**: `/context/phase3/dashboard-app/` with full Next.js 14+ implementation
- **Component Library**: `/context/phase3/components/` with custom FinTech components
- **AI Services**: `/context/phase3/ai-services/` with real-time compliance integration
- **Content Composer**: AI-assisted content creation with <1.5s compliance feedback
- **Mobile App**: Progressive Web App with offline basic functionality

### Phase 3 Success Criteria
- Advisor dashboard fully functional with Clerk authentication
- Real-time AI compliance checking operational in content composer
- WhatsApp preview system working with accurate message rendering
- Performance targets met: FCP <1.2s, LCP <2.5s on mid-range devices
- Mobile experience smooth with touch optimization

## Phase 4: Backend Services & AI-First Architecture (21-28 days)

### Critical Backend Agents (Parallel Execution)
```bash
# Core AI Compliance Engine
claude-agent ai-compliance-engine-dev --input context/phase3/ --output context/phase4/

# WhatsApp Cloud API Integration  
claude-agent whatsapp-api-specialist --input docs/wa/templates.md --output context/phase4/

# SEBI Compliance & Audit Framework
claude-agent sebi-compliance-auditor --input docs/compliance/policy.yaml --output context/phase4/

# Fallback Content System
claude-agent fallback-system-architect --input context/phase4/ --output context/phase4/

# AI-Powered Analytics
claude-agent analytics-intelligence-dev --input context/phase4/ --output context/phase4/
```

### Additional Specialized Agents
```bash
# Financial Data Architecture
claude-agent financial-data-architect --input docs/data-model/ --output context/phase4/

# Content Processing Pipeline
claude-agent content-pipeline-engineer --input context/phase4/ --output context/phase4/

# Performance & SLA Optimization
claude-agent performance-optimizer --input docs/ops/observability-slo.md --output context/phase4/

# Data Protection & DPDP Compliance
claude-agent security-dpo-specialist --input docs/compliance/policy.yaml --output context/phase4/
```

### Expected Outputs
- **Compliance Engine**: `/context/phase4/compliance-engine/` with three-stage validation
- **WhatsApp Integration**: `/context/phase4/whatsapp-integration/` with 99% delivery SLA
- **Fallback System**: `/context/phase4/fallback-system/` with 60 evergreen packs per language
- **Analytics Intelligence**: `/context/phase4/analytics-intelligence/` with churn prediction
- **Audit Framework**: `/context/phase4/audit-framework/` with SEBI reporting capability

### Phase 4 Success Criteria
- **Delivery SLA**: ≥99% WhatsApp messages delivered by 06:05 IST consistently
- **AI Performance**: Lint ≤1.5s P95, Generation ≤3.5s P95 achieved
- **Compliance Validation**: Three-stage engine operational with <5% false positives
- **Fallback System**: Automatic assignment working, zero silent days for opted-in advisors
- **SEBI Compliance**: Full audit framework generating required regulatory reports

## Checkpoint Management & Quality Gates

### Phase Validation Commands
```bash
# Run after each phase completion
claude-validate-phase --phase=1 --criteria=context/phase1/success-criteria.md
claude-validate-phase --phase=2 --criteria=context/phase2/success-criteria.md
claude-validate-phase --phase=3 --criteria=context/phase3/success-criteria.md
claude-validate-phase --phase=4 --criteria=context/phase4/success-criteria.md
```

### Critical Rollback Conditions
- **Phase 1 → Restart**: Fundamental compliance workflow misunderstood
- **Phase 2 → Phase 1**: UX issues discovered during design
- **Phase 3 → Phase 2**: Design system gaps affecting implementation  
- **Phase 4 → Phase 3**: Backend integration breaking frontend assumptions

### Production Readiness Gates
Before final deployment, validate:
- [ ] **Security**: Penetration testing passed, KMS encryption operational
- [ ] **Performance**: Load testing validates 2,000 advisor capacity
- [ ] **Compliance**: SEBI audit framework generates required reports
- [ ] **Monitoring**: Datadog APM operational, SLA alerting configured
- [ ] **DR Testing**: RTO ≤60min, RPO ≤15min validated

## AI Configuration & Budget Management

### Model Selection by Task
```yaml
ai_task_mapping:
  compliance_checking: "gpt-4o-mini"  # Fast, accurate for rule evaluation
  content_generation: "gpt-4.1"      # High quality for creative content
  translation: "gpt-4o-mini"         # Efficient for EN/HI/MR translation
  analytics_insights: "gpt-4o-mini"  # Pattern recognition and summarization
```

### Cost Controls
- **Monthly Budget**: ₹25,000 with 20% flex allowance
- **Per-advisor Caps**: 10 generations + 20 lints per day
- **Fallback Strategy**: Rules-only compliance if budget exceeded
- **Real-time Monitoring**: Cost tracking with automated budget alerts

## Support & Troubleshooting

### Common Integration Issues
1. **AI Latency Spikes**: Check OpenAI status, activate fallback models
2. **WhatsApp Template Rejections**: Review content against Meta policies
3. **Compliance False Positives**: Tune AI prompts, validate with expert review
4. **Performance Degradation**: Check database query performance, optimize N+1 queries

### Expert Consultation
- **SEBI Compliance**: Legal/regulatory expert for complex compliance questions
- **WhatsApp Policy**: Meta Business Support for template and policy issues  
- **AI Performance**: OpenAI support for model optimization and troubleshooting

## Deployment Strategy

### Staged Rollout Approach
1. **Internal Testing** (Phase 4 completion): 5-10 internal test advisors
2. **Pilot Launch** (Post-validation): 20-50 friendly advisor beta group
3. **Founding 100** (Stable operation): First 100 advisors with launch discount
4. **General Availability** (Proven scale): Open registration with full feature set

### Success Metrics Tracking
- **North Star**: ≥98% advisors receive complete daily content by 06:05 IST for 14+ consecutive business days
- **Business**: 70-85% onboarding completion, <5% monthly churn, ≥4/5 advisor satisfaction
- **Technical**: 99% delivery SLA, <1.5s AI latency, <2s dashboard response time
- **Compliance**: Zero critical SEBI violations, <5% AI false positive rate

Save checkpoint: `00_bootstrap_complete` → Ready for Phase 1 execution