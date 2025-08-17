# Phase 1: UX Research & Compliance Planning

## When to Use
- Beginning of Project One development cycle
- After PRD review and before design system creation
- When establishing foundational UX patterns for financial advisory platform
- Before any UI design or development work begins

## Reads / Writes

**Reads:**
- `docs/PRD.md` - Product requirements and business objectives
- `docs/compliance/policy.yaml` - SEBI and DPDP regulatory constraints
- `docs/ai/ai-config.yaml` - AI integration requirements and limitations
- `workflow/registry.yaml` - Agent capabilities and constraints
- `workflow/chain.yaml` - Phase dependencies and requirements

**Writes:**
- `context/phase1/ux/*.md` - User experience flows and patterns
- `context/phase1/plan/*.md` - Technical architecture and sprint planning
- `context/phase1/data/*.md` - Data modeling and schema definitions
- `context/phase1/compliance-patterns.md` - Regulatory UX requirements
- `context/phase1/SUMMARY.md` - Phase completion summary

## Checklist Before Run

- [ ] PRD has been reviewed and understood
- [ ] Compliance requirements are documented in `docs/compliance/policy.yaml`
- [ ] AI integration constraints are defined in `docs/ai/ai-config.yaml`
- [ ] Target advisor personas (MFD/RIA) are clearly defined
- [ ] WhatsApp delivery requirements (06:00 IST, 99% SLA) are understood
- [ ] Indian market constraints (regional languages, payment methods) are documented
- [ ] Phase gate requirements are clear: sprint-plan.md + ux-spec.md needed for Phase 2 entry

## One-Shot Prompt Block

```
ROLE: Phase 1 Orchestrator - UX Research & Compliance Planning
GOAL: Design foundational UX patterns and compliance workflows for AI-first B2B financial advisory platform serving Indian MFDs/RIAs.

CONTEXT: Building a SEBI-compliant SaaS platform that delivers WhatsApp-ready financial content to 150-300 advisors by T+90 days, scaling to 1,000-2,000 by T+12 months. Platform must achieve 99% delivery SLA at 06:00 IST with <1.5s AI compliance checking.

KEY CONSTRAINTS:
• SEBI compliance: Three-stage validation (Rules→AI→Rules) for all financial content
• DPDP compliance: Data protection for advisor and client information
• WhatsApp policy: Template compliance, quality rating maintenance
• Regional requirements: Hindi/Marathi language support, Indian payment methods
• Performance: <1.2s dashboard load, <500ms compliance feedback
• Tier structure: Basic (₹2,999), Standard (₹5,999), Pro (₹11,999) monthly

INPUT FILES TO ANALYZE:
1. docs/PRD.md - Complete product specification and business requirements
2. docs/compliance/policy.yaml - SEBI regulations and DPDP data protection rules
3. docs/ai/ai-config.yaml - GPT-4o-mini compliance engine, GPT-4.1 content generation
4. workflow/registry.yaml - Available agents and their capabilities
5. workflow/chain.yaml - Phase dependencies and handoff requirements

REQUIRED OUTPUTS:
1. context/phase1/ux/advisor-onboarding-journey.md - Complete MFD/RIA signup to first content delivery
2. context/phase1/ux/content-composer-workflow.md - AI-assisted content creation with real-time compliance
3. context/phase1/ux/approval-tracking.md - Three-stage compliance validation user experience
4. context/phase1/ux/whatsapp-integration-flows.md - WhatsApp Business API connection and template management
5. context/phase1/ux/mobile-ux-guidelines.md - Responsive design requirements for advisor mobile usage
6. context/phase1/plan/sprint-plan.md - 4-phase development roadmap with resource allocation
7. context/phase1/plan/technical-architecture.md - Next.js + Node.js system architecture
8. context/phase1/plan/component-breakdown.md - shadcn-ui component requirements
9. context/phase1/data/advisor-schema.md - Advisor profile and subscription data models
10. context/phase1/data/content-models.md - Financial content structure with compliance metadata
11. context/phase1/data/compliance-audit-schema.md - Audit trail and risk scoring data models
12. context/phase1/compliance-patterns.md - UX patterns for regulatory compliance display
13. context/phase1/SUMMARY.md - Phase completion summary with gate validation

PHASE GATE SUCCESS CRITERIA:
• Sprint plan covers all 4 phases with realistic timelines
• UX flows accommodate both MFD and RIA advisor types
• Compliance patterns ensure SEBI regulatory adherence
• WhatsApp integration flows maintain policy compliance
• Mobile UX guidelines support advisor field work requirements
• All outputs ready for Phase 2 design system creation

EXECUTION APPROACH:
1. Analyze Indian financial advisory market requirements
2. Map advisor personas to UX journeys
3. Design compliance-first content creation workflow
4. Plan WhatsApp integration maintaining quality ratings
5. Structure development phases with clear deliverables
6. Validate all outputs meet regulatory and business constraints
```

## Post-Run Validation Checklist

- [ ] All 13 required output files are created and complete
- [ ] Advisor onboarding journey covers MFD and RIA personas
- [ ] Content composer workflow integrates three-stage compliance validation
- [ ] WhatsApp integration maintains Business API policy compliance
- [ ] Mobile UX guidelines ensure field-work usability
- [ ] Sprint plan provides realistic 4-phase development timeline
- [ ] Technical architecture supports 99% delivery SLA requirements
- [ ] Data models accommodate SEBI audit trail requirements
- [ ] Compliance patterns visible throughout user experience
- [ ] Phase gate files (`sprint-plan.md`, `content-composer-workflow.md`) ready for Phase 2 entry
- [ ] SUMMARY.md provides clear phase completion validation
- [ ] All outputs reference Indian market constraints and regulatory requirements