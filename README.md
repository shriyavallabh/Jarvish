# Project One - AI-First B2B Financial Content Platform

An AI-powered, compliance-safe, minimalist B2B SaaS platform delivering WhatsApp-ready financial content to Indian MFDs/RIAs every morning at 06:00 IST.

## Overview

**Mission**: Deliver SEBI-compliant financial education content to Indian advisors via WhatsApp with AI-assisted content generation, three-stage compliance checking, and automatic continuity through fallback systems.

**Target Users**: Indian Mutual Fund Distributors (MFDs) and Registered Investment Advisors (RIAs)
**Scale Target**: 150-300 advisors by T+90 days, 1,000-2,000 by T+12 months
**North Star Metric**: ≥98% advisors receive complete daily content by 06:05 IST for 14+ consecutive business days

## Key Features

### Daily Content Delivery
- **06:00 IST Automation**: Scheduled WhatsApp delivery to advisors
- **Multi-format Output**: Post images (1200×628), Status images (1080×1920), LinkedIn variants
- **Multi-language Support**: English, Hindi, Marathi content variants
- **Pro Tier Branding**: Advisor logo/name overlays on content with compliance-safe placement

### AI-First Compliance
- **Three-Stage Validation**: Hard rules → AI evaluator → Final verification
- **Real-time Feedback**: <1.5s compliance checking in content composer
- **SEBI Awareness**: Automated detection of prohibited terms and performance promises
- **Risk Scoring**: 0-100 scale with green/amber/red visual indicators

### Business Model
- **Subscription Tiers**: Basic (₹2,999/mo), Standard (₹5,999/mo), Pro (₹11,999/mo)
- **Launch Offer**: "Founding 100" - 50% discount for 3 months + 15% annual discount
- **14-Day Trial**: Watermarked content, limited pack creation, no Pro features

### Fallback Continuity
- **Pre-Approved Library**: 60 evergreen packs per language, AI-curated
- **Automatic Assignment**: Triggered at 21:30 IST if no fresh content approved
- **Zero Silent Days**: Ensures no opted-in advisor misses daily content

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14+ with App Router
- **UI Library**: shadcn-ui with custom financial design system
- **Authentication**: Clerk with RBAC (Admin/Backup Approver/Advisor roles)
- **State Management**: React Server Components + Zustand for client state
- **Styling**: Tailwind CSS with financial services design tokens

### Backend Services
- **API**: Node.js (NestJS/Express) with OpenAPI documentation
- **Database**: PostgreSQL with multi-tenant architecture
- **Cache & Queues**: Redis + BullMQ for job processing
- **AI Services**: OpenAI GPT-4o-mini (compliance), GPT-4.1 (generation)
- **Messaging**: Meta WhatsApp Cloud API with template management

### Infrastructure
- **Primary Region**: AWS ap-south-1 (Mumbai) for DPDP compliance
- **CDN & Storage**: Cloudflare R2 + global CDN
- **Image Processing**: Cloudinary for dynamic overlays and optimization
- **Monitoring**: Datadog APM + Grafana dashboards
- **Security**: KMS encryption, IP allowlisting, 2FA for admins

## Development Workflow

This project uses a multi-agent development approach with four sequential phases:

### Phase 1: UX Research & Compliance Planning (5-7 days)
**Agents**: compliance-ux-researcher, financial-dashboard-planner, ai-workflow-architect
**Focus**: Advisor dashboard flows, compliance UX patterns, AI integration architecture

### Phase 2: Financial UI Design & Brand System (7-10 days)  
**Agents**: fintech-ui-designer, compliance-visual-designer, brand-consistency-agent
**Focus**: Professional financial services design system, mobile-responsive layouts

### Phase 3: Frontend Development & AI Integration (14-21 days)
**Agents**: nextjs-dashboard-developer, ai-integration-specialist, compliance-frontend-dev
**Focus**: Dashboard implementation, AI-powered content composer, real-time compliance

### Phase 4: Backend Services & AI-First Architecture (21-28 days)
**Agents**: ai-compliance-engine-dev, whatsapp-api-specialist, sebi-compliance-auditor, fallback-system-architect, analytics-intelligence-dev, others
**Focus**: Three-stage compliance engine, WhatsApp delivery, analytics intelligence

## Compliance & Regulatory

### SEBI Ad Code Compliance
- **Prohibited Content**: No guarantees, assured returns, selective performance data
- **Mandatory Elements**: Advisor identity, risk disclaimers, educational framing
- **Audit Framework**: 5-year retention, monthly compliance reports, incident tracking

### Data Protection (DPDP Act)
- **Data Residency**: All PII stored in ap-south-1 region
- **Encryption**: At-rest (KMS) and in-transit (TLS 1.3)
- **Privacy Rights**: Automated DSAR handling, consent management
- **AI Processing**: Content-only transmission, no PII in prompts

### WhatsApp Policy Compliance
- **Template Strategy**: 3 pre-approved variants per language
- **Opt-in Management**: Explicit consent, STOP/START handling
- **Quality Protection**: Multi-number strategy, quality monitoring
- **24-hour Rule**: Marketing templates for proactive messaging

## Performance & SLOs

### Service Level Objectives
- **Delivery SLA**: ≥99% messages delivered by 06:05 IST (5min window)
- **AI Performance**: Lint ≤1.5s P95, Generation ≤3.5s P95
- **Dashboard Performance**: FCP <1.2s, LCP <2.5s on mid-range devices
- **Availability**: 99.9% dashboard uptime, 99.5% AI availability during business hours

### Monitoring & Alerting
- **Critical Alerts**: Delivery failure >2%, WhatsApp quality drop, system outages
- **On-Call Window**: 05:30-06:30 IST for delivery issues
- **Business Metrics**: Advisor health scores, churn risk detection, content performance

## Getting Started

Refer to `CLAUDE_WORKFLOW.md` for detailed instructions on running the multi-agent development workflow.

## Project Structure
```
project-one/
├── docs/                    # Product requirements and technical specs
├── workflow/                # Multi-agent workflow coordination
├── agents/                  # Specialized development agents
├── context/                 # Inter-agent communication files
├── infra/                   # Infrastructure and deployment configs
└── prompts/                 # Phase-specific development prompts
```

**Checkpoint**: `00_bootstrap_complete`