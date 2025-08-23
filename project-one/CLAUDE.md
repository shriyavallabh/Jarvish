# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Project One** - an AI-powered, SEBI-compliant B2B financial content platform that delivers WhatsApp-ready content to Indian MFDs/RIAs daily at 06:00 IST. The system features three-stage AI compliance checking, multi-language support (English/Hindi/Marathi), and automated fallback content to ensure zero silent days.

**Target Scale**: 150-300 advisors by T+90 days, 1,000-2,000 by T+12 months  
**North Star Metric**: ≥98% advisors receive complete daily content by 06:05 IST for 14+ consecutive business days

## Commands & Development Workflow

### Frontend Development (Next.js App)
```bash
# Navigate to web app
cd apps/web

# Development server
npm run dev                    # Start Next.js dev server on localhost:3000

# Build and deployment
npm run build                  # Production build
npm run start                  # Start production server
npm run type-check             # TypeScript compilation check
npm run lint                   # ESLint validation

# Component development
npm run storybook             # Start Storybook on localhost:6006
npm run build-storybook       # Build static Storybook

# Comprehensive UI Testing (Puppeteer)
npm run test:puppeteer         # Run all Puppeteer tests
npm run test:puppeteer:headed  # Run tests with visible browser
npm run test:a11y              # Accessibility testing only
npm run test:visual            # Visual regression testing
npm run test:perf              # Performance testing with Lighthouse

# Custom test scripts
node test-ui-issues.js         # Quick UI issue detection
node final-test.js             # Comprehensive quality assessment
```

### Design System Reference
The project uses **highly specific HTML theme files** as the design source of truth:
- **Landing**: `/themes/landing/theme-1-executive-clarity.html`
- **Admin**: `/themes/admin/theme-4-premium-professional.html` 
- **Advisor**: `/themes/advisor/theme-4-premium-professional.html`

**CRITICAL**: Always reference these HTML files for exact colors, fonts, animations, and layout patterns. The Next.js implementation must match these designs precisely.

### Multi-Agent Development Workflow
This project uses a specialized 4-phase agent workflow. Refer to `CLAUDE_WORKFLOW.md` for the complete process:

```bash
# Phase 1: UX Research (5-7 days)
claude-agent compliance-ux-researcher --input docs/PRD.md

# Phase 2: UI Design (7-10 days) 
claude-agent fintech-ui-designer --input context/phase1/

# Phase 3: Frontend Development (14-21 days)
claude-agent nextjs-dashboard-developer --input context/phase2/

# Phase 4: Backend Services (21-28 days)
claude-agent ai-compliance-engine-dev --input context/phase3/
```

## Architecture & Key Components

### Frontend Stack
- **Framework**: Next.js 14+ with App Router
- **UI Library**: shadcn-ui with custom financial design system
- **Styling**: Tailwind CSS with financial services design tokens
- **State**: React Server Components + client-side hooks
- **Design Reference**: Custom HTML themes in `/themes/` directory

### Key Design Principles
1. **Executive Clarity Theme**: Professional navy (#0B1F33), gold (#CEA200), CTA green (#0C310C)
2. **Typography**: Fraunces (serif headings), Poppins (body text)
3. **Financial Services Aesthetics**: Trust-building, SEBI compliance indicators
4. **Mobile-First**: Responsive design for advisor on-the-go usage
5. **No Emojis**: Professional business communication (except in theme reference files)

### Critical Frontend Architecture
- **Route Structure**: Next.js 14 App Router with route groups
  - `(public)/` - Landing page (COMPLETED - world-class quality)
  - `(admin)/` - Administrative interfaces (wireframes complete)
  - `(advisor)/` - Advisor dashboard and tools (wireframes complete)
- **Component System**: shadcn-ui base with financial service extensions
- **Mock Data**: Comprehensive TypeScript interfaces in `/lib/mock/`
- **Quality Assurance**: Puppeteer testing suite with accessibility, performance, and visual regression testing

### Backend Services (In Development)
- **API**: Node.js with OpenAPI documentation
- **Database**: PostgreSQL with multi-tenant architecture  
- **AI Services**: OpenAI GPT-4o-mini (compliance), GPT-4.1 (generation)
- **Messaging**: Meta WhatsApp Cloud API
- **Cache**: Redis + BullMQ for job processing

## Compliance & Regulatory Requirements

### SEBI Ad Code Compliance
- **Three-Stage Validation**: Hard rules → AI evaluator → Final verification
- **Prohibited Content**: No guarantees, assured returns, selective performance
- **Mandatory Elements**: Advisor identity, risk disclaimers, educational framing
- **Real-time Feedback**: <1.5s compliance checking in content composer

### Data Protection (DPDP Act)
- **Data Residency**: All PII stored in ap-south-1 (Mumbai) region
- **Encryption**: At-rest (KMS) and in-transit (TLS 1.3) 
- **AI Processing**: Content-only transmission, no PII in prompts

### WhatsApp Policy Compliance
- **Template Strategy**: 3 pre-approved variants per language
- **Quality Protection**: Multi-number strategy, quality monitoring
- **24-hour Rule**: Marketing templates for proactive messaging

## Performance & SLA Requirements

### Service Level Objectives
- **Delivery SLA**: ≥99% messages delivered by 06:05 IST (5min window)
- **AI Performance**: Lint ≤1.5s P95, Generation ≤3.5s P95  
- **Dashboard Performance**: FCP <1.2s, LCP <2.5s on mid-range devices
- **Availability**: 99.9% dashboard uptime, 99.5% AI availability

### Business Model Context
- **Subscription Tiers**: Basic (₹2,999/mo), Standard (₹5,999/mo), Pro (₹11,999/mo)
- **Target Market**: Indian Mutual Fund Distributors (MFDs) and RIAs
- **Content Types**: WhatsApp messages/images, Status content, LinkedIn posts
- **Languages**: English, Hindi, Marathi with AI-powered translation

## Working with Design Themes

### Design Reference Files
The `/themes/` directory contains the definitive design specifications:
- **Color Schemes**: Extracted from CSS `:root` variables in HTML files
- **Typography**: Font families, weights, and sizing from theme files  
- **Component Patterns**: Layout grids, card designs, button styles
- **Animations**: CSS animations and transitions (especially timeline progressions)

### Implementation Guidelines
1. **Color Consistency**: Use exact hex values from theme HTML files
2. **Font Implementation**: Match Fraunces (headings) + Poppins (body) exactly
3. **Animation Replication**: Recreate CSS animations from themes (fadeInUp, pulse, progressFill)
4. **Component Fidelity**: Match spacing, shadows, and hover effects precisely
5. **Remove Emojis**: Professional financial services communication standards

## File Structure Context

### Key Directories
- `/apps/web/` - Next.js frontend application
- `/themes/` - HTML design reference files (source of truth)
- `/docs/` - Product requirements and technical specifications
- `/context/` - Inter-agent communication and phase handoffs
- `/workflow/` - Multi-agent coordination and checkpoints
- `/agents/` - Specialized development agent configurations

### Critical Files to Reference
- `README.md` - Project overview and technical architecture
- `CLAUDE_WORKFLOW.md` - Multi-agent development process
- `MVP-Strategy.md` - Product strategy and feature prioritization
- `/apps/web/fe-notes.md` - Frontend implementation notes
- `/themes/landing/theme-1-executive-clarity.html` - Landing page design reference

### Context Files for Agent Coordination
The `/context/` directory maintains state between development phases:
- `phase1/` - UX research and compliance planning
- `phase2/` - UI design and brand system  
- `phase3/` - Frontend development and AI integration
- `phase4/` - Backend services and full system integration

## Development Standards

### TypeScript & Component Development  
- **Strict Mode**: Full TypeScript coverage with proper interface definitions
- **Component Library**: Custom shadcn-ui extensions for financial services
- **Mock Data**: Comprehensive test data in `/lib/mock/` for realistic development
- **Accessibility**: WCAG 2.1 AA compliance for financial services

### AI Integration Points
- **Compliance Engine**: Real-time SEBI compliance checking (<1.5s response)
- **Content Generation**: AI-powered creation with three-stage validation
- **Translation Services**: Multi-language support with financial terminology
- **Analytics Intelligence**: Advisor insights and churn prediction

## Current Project Status & Next Steps

### ✅ COMPLETED (Phase 2-3 Frontend)
- **Landing Page**: World-class UI implementation matching executive clarity theme
- **Design System**: Complete CSS framework with financial services aesthetics  
- **Component Library**: shadcn-ui components with professional styling
- **Quality Assurance**: Comprehensive Puppeteer testing infrastructure
- **Performance**: EXCELLENT load times (449ms), accessibility compliance
- **Mobile Responsive**: Full responsive design with mobile-first approach

### 🔄 IN PROGRESS (Phase 3 Continuation)  
- **Admin Dashboard**: Wireframes complete, implementation needed
- **Advisor Dashboard**: Wireframes complete, implementation needed
- **Component Integration**: Connect remaining pages to design system

### 📋 NEXT PRIORITIES (Phase 4 Backend)
1. **AI Compliance Engine**: Three-stage validation system (<1.5s response)
2. **WhatsApp Cloud API**: 99% delivery SLA at 06:00 IST
3. **Database Architecture**: PostgreSQL with multi-tenant design
4. **Authentication System**: Clerk integration with RBAC
5. **Analytics Intelligence**: Advisor insights and churn prediction

### 🚀 Multi-Agent Deployment Strategy
Execute the remaining development phases using specialized agents:
```bash
# Deploy Phase 3 completion
npm run agent nextjs-dashboard-developer

# Deploy Phase 4 backend services  
npm run agent ai-compliance-engine-dev
npm run agent whatsapp-api-specialist
npm run agent fallback-system-architect
npm run agent analytics-intelligence-dev
```

This codebase represents a production-ready financial services platform with stringent compliance requirements and performance targets. The landing page has achieved world-class quality standards. Always prioritize SEBI compliance, data protection, and the professional financial services aesthetic when making changes.