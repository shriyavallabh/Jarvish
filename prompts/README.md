# Prompts Directory - Project One

This directory contains specialized runnable prompts for each development phase and agent type in Project One's multi-agent AI-first B2B financial advisor platform development.

## Generated Prompt Files

### Phase 1: Discovery & Strategy (3 agents)
- **`phase1.ux-researcher.md`** - UX research for financial advisor workflows, SEBI compliance integration, mobile-first design validation (462 lines)
- **`phase1.rapid-prototyper.md`** - Sprint planning for 12-week development with user stories and timeline (348 lines)  
- **`phase1.data-modeler.md`** - Data schema refinement for advisor entities and compliance audit requirements (312 lines)

### Phase 2: Design & Brand (2 agents)
- **`phase2.ui-designer.md`** - FinTech UI design system with shadcn-ui adaptations and compliance patterns (387 lines)
- **`phase2.whimsy-injector.md`** - Professional micro-interactions for financial services context (285 lines)

### Phase 3: Frontend Development (1 agent)
- **`phase3.frontend-dev.md`** - Next.js dashboard development with AI integration and advisor workflows (421 lines)

### Phase 4: Backend Services & AI-First Architecture (5 agents)
- **`phase4.backend-dev.md`** - NestJS architecture for backend foundation (Wave 1, 398 lines)
- **`phase4.compliance-engine-dev.md`** - Three-stage AI compliance validation system (Wave 2, 456 lines)
- **`phase4.whatsapp-specialist.md`** - WhatsApp Business Cloud API integration for 99% SLA (Wave 2, 423 lines)
- **`phase4.analytics-intelligence.md`** - ML-powered advisor insights and churn prediction (Wave 3, 445 lines)
- **`phase4.compliance-auditor.md`** - SEBI compliance audit framework with 5-year retention (Wave 3, 412 lines)

## Prompt Structure

Each prompt follows a consistent format:
- **ROLE**: Agent specialization and expertise area
- **GOAL**: Specific deliverable and success criteria
- **INPUTS**: Required reading materials with token limits
- **ACTIONS**: Detailed implementation steps with code examples
- **CONSTRAINTS**: Performance, compliance, and technical requirements
- **OUTPUTS**: Required deliverable file paths
- **SUCCESS CHECKS**: Validation criteria for completion

## Key Features

All prompts are designed for Project One's requirements:
- SEBI compliance and DPDP Act 2023 data protection
- 99% WhatsApp delivery SLA with Meta Business Cloud API
- Three-stage AI compliance validation (Rules → AI → Rules)
- Next.js 14 frontend with shadcn-ui components
- NestJS backend with PostgreSQL and Redis
- Token budget management (80K-200K per agent)
- Performance targets (<1.5s compliance, <3.5s generation)
- Indian market context and multi-language support (EN/HI/MR)