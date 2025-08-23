# Rapid Prototyper Agent Prompt ⚡

## When to Use
- Phase 1 for technical architecture and sprint planning
- When translating PRD requirements into implementable technical plan
- Before detailed development begins to establish realistic timelines
- When component breakdown and architecture decisions need rapid validation

## Reads / Writes

**Reads:**
- `docs/PRD.md` - Product requirements and technical specifications
- `workflow/chain.yaml` - Agent workflow and dependency structure

**Writes:**
- `context/phase1/plan/component-breakdown.md` - Technical component analysis
- `context/phase1/plan/sprint-plan.md` - 4-phase development timeline
- `context/phase1/plan/technical-architecture.md` - System architecture blueprint

## Checklist Before Run

- [ ] PRD technical requirements thoroughly reviewed and understood
- [ ] Agent workflow chain dependencies from chain.yaml analyzed
- [ ] Technology stack constraints (Next.js, Node.js, PostgreSQL, Redis) documented
- [ ] Integration requirements (WhatsApp API, OpenAI APIs) researched
- [ ] Performance targets (<1.5s compliance, 99% delivery SLA) are clear
- [ ] Scalability requirements (150-300 → 1,000-2,000 advisors) understood
- [ ] Regulatory compliance technical implications (SEBI, DPDP) documented

## One-Shot Prompt Block

```
ROLE: Rapid Prototyper - Technical Architecture & Sprint Planning
GOAL: Create implementable technical architecture and realistic development timeline for AI-first financial advisory platform with SEBI compliance and 99% WhatsApp delivery SLA.

CONTEXT: Planning development for B2B SaaS platform serving Indian financial advisors with real-time AI compliance checking, WhatsApp content delivery, and comprehensive regulatory audit trails. System must scale from 150-300 to 1,000-2,000 advisors with stringent performance requirements.

TECHNICAL STACK CONSTRAINTS:
• Frontend: Next.js 14+ with App Router, shadcn-ui components, React Query
• Backend: Node.js with Express, PostgreSQL primary DB, Redis caching
• AI Integration: GPT-4o-mini (compliance), GPT-4.1 (content), <1.5s response times
• WhatsApp: Business Cloud API with template management and delivery scheduling
• Infrastructure: Mumbai region (ap-south-1) for data residency compliance
• Performance: <1.2s FCP, <500ms API responses, 99% delivery SLA at 06:00 IST

REGULATORY TECHNICAL REQUIREMENTS:
• SEBI compliance: Three-stage validation pipeline with complete audit trails
• DPDP compliance: Data protection, encryption at rest/transit, audit logging
• WhatsApp policy: Template approval workflow, quality rating maintenance
• Indian regulations: Data residency, payment gateway integration (Razorpay)
• Audit requirements: Immutable logs, regulatory reporting, violation tracking

SCALABILITY PLANNING:
• Phase 1: 150-300 advisors (proof of concept)
• Phase 2: 500-800 advisors (feature completion)
• Phase 3: 1,000-1,500 advisors (optimization)
• Phase 4: 2,000+ advisors (enterprise scale)
• Peak load: 2,000 advisors × 1 message = 2,000 simultaneous deliveries at 06:00 IST

INPUT FILES TO ANALYZE:
1. docs/PRD.md - Complete product requirements and technical specifications
2. workflow/chain.yaml - 4-phase development workflow with agent dependencies

REQUIRED PLANNING OUTPUTS:
1. context/phase1/plan/technical-architecture.md
   - System architecture diagram with all components and data flows
   - Database schema design for advisors, content, compliance, and audit data
   - API design with endpoint specifications and authentication patterns
   - AI integration architecture with compliance pipeline and content generation
   - WhatsApp integration architecture with template management and delivery queue
   - Caching strategy with Redis for performance optimization
   - Security architecture with DPDP compliance and data protection measures
   - Monitoring and observability architecture for SLA tracking

2. context/phase1/plan/sprint-plan.md
   - 4-phase development timeline with realistic duration estimates
   - Resource allocation across 17 specialized agents
   - Critical path analysis with dependency management
   - Risk mitigation strategies for technical and regulatory challenges
   - Milestone definitions with measurable success criteria
   - Buffer time allocation for integration testing and compliance validation
   - Deployment strategy with staging and production environment planning

3. context/phase1/plan/component-breakdown.md
   - Frontend component hierarchy using shadcn-ui foundation
   - Backend service architecture with microservice considerations
   - Database component design with performance and audit requirements
   - AI service integration components with error handling and fallbacks
   - WhatsApp integration components with rate limiting and queue management
   - Compliance engine components with three-stage validation pipeline
   - Analytics components with advisor insights and churn prediction
   - Security components with authentication, authorization, and audit logging

DEVELOPMENT METHODOLOGY:
• Phase-gate approach: Clear deliverables and validation criteria between phases
• Parallel development: Utilize agent specializations for concurrent work
• Compliance-first: Regulatory requirements integrated from start, not retrofitted
• Performance-driven: Continuous monitoring and optimization throughout development
• Risk mitigation: Early integration testing and fallback system development

TECHNICAL DECISION RATIONALE:
• Next.js App Router: Server-side rendering for performance and SEO
• PostgreSQL: ACID compliance for financial data and audit trail requirements
• Redis: Caching for AI responses and session management for performance
• WhatsApp Cloud API: Managed service for reliability and policy compliance
• Mumbai region: Data residency compliance and low latency for Indian users

SUCCESS CRITERIA:
• Technical architecture supports all PRD requirements with realistic implementation path
• Sprint plan provides achievable timeline with appropriate risk buffers
• Component breakdown enables parallel development across specialized agents
• Architecture decisions justified by performance, compliance, and scalability requirements
• All technical debt and integration challenges identified with mitigation strategies
```

## Post-Run Validation Checklist

- [ ] Technical architecture comprehensively covers all PRD requirements
- [ ] System design supports 99% delivery SLA with fault tolerance
- [ ] Database schema accommodates SEBI audit trail and compliance requirements
- [ ] AI integration architecture handles <1.5s compliance checking requirement
- [ ] WhatsApp integration maintains Business API policy compliance
- [ ] Sprint plan provides realistic timeline for 4-phase development approach
- [ ] Component breakdown enables effective parallel development across agents
- [ ] Critical path analysis identifies potential bottlenecks and dependencies
- [ ] Security architecture ensures DPDP compliance and data protection
- [ ] Scalability plan supports growth from 300 to 2,000+ advisors
- [ ] Performance optimization strategies address Mumbai region latency requirements
- [ ] Risk mitigation covers both technical implementation and regulatory compliance challenges
- [ ] Resource allocation realistic for specialized agent capabilities
- [ ] Integration testing strategy ensures end-to-end workflow validation
- [ ] Deployment architecture supports staging and production environment needs