# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Jarvish** (formerly Hubix) is an AI-first B2B SaaS platform that delivers SEBI-compliant financial content to Indian advisors via WhatsApp automation. The platform features AI-powered content generation, three-stage compliance validation, multi-language support (English/Hindi/Marathi), and automated delivery systems.

**Primary Implementation**: The main development work is in the `project-one/` directory which contains a complete multi-agent architecture with frontend (Next.js) and backend (Node.js) applications.

**Target Market**: 275,000 MFDs + 1,000 RIAs in India  
**Business Model**: SaaS subscriptions (₹999-₹4,999/month)  
**Core Delivery**: WhatsApp messages daily at 06:00 IST with 99% SLA

## Commands

### Main Project Development (project-one/)

```bash
# Navigate to main project
cd project-one/

# Frontend Development (Next.js)
cd apps/web/
npm install
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
npm run lint                   # Run ESLint
npm run type-check            # TypeScript checks
npm run test                  # Run Jest tests
npm run test:puppeteer        # Run Puppeteer UI tests
npm run storybook            # Component development (localhost:6006)

# Backend Development (Node.js/Express)
cd apps/backend/
npm install
npm run dev                   # Start simple server (development)
npm run dev:full             # Start full server with all features
npm run build                # Build TypeScript
npm run prisma:migrate       # Run database migrations
npm run prisma:studio        # Open Prisma Studio
npm run prisma:generate      # Generate Prisma client
npm run prisma:push          # Push schema changes directly

# Multi-Agent System
cd project-one/
npm run agent                # Run agent CLI
npm run agents:list          # List all available agents
npm run agents:help          # Get agent help
```

### WhatsApp Integration Scripts

```bash
# In project-one/apps/web/ or project-one/apps/backend/
node send-template-now.js          # Send WhatsApp template messages
node whatsapp-webhook-handler.js   # Handle WhatsApp webhooks
node complete-whatsapp-gemini.js   # Gemini AI image generation + WhatsApp
node gpt-image-1-server.js         # GPT-IMAGE-1 with local server
```

### Root Level Scripts

```bash
# Install dependencies at root
npm install                   # Installs Playwright for testing
```

## Architecture

### Technology Stack

**Frontend (apps/web/)**
- Next.js 14 with App Router
- shadcn-ui components with custom financial themes
- Tailwind CSS with executive clarity design system
- Clerk authentication
- Supabase for data persistence
- React Query for API state management

**Backend (apps/backend/)**
- Node.js with Express/TypeScript
- Prisma ORM with PostgreSQL
- Redis + BullMQ for job processing
- OpenAI integration (GPT-4, GPT-IMAGE-1 for images)
- Google Gemini AI for image generation and content
- WhatsApp Cloud API for message delivery
- Three-stage compliance validation engine

**Multi-Agent System**
- 25+ specialized AI agents for different development phases
- Model Context Protocol (MCP) integration
- TypeScript-based orchestration system
- Phase-based development workflow

### Key Design Patterns

**Frontend Patterns**
- Server Components for initial renders
- Client components for interactivity
- Modular component architecture with shadcn-ui
- Design tokens in `/themes/` for consistency
- Mobile-first responsive design

**Backend Patterns**
- RESTful API with OpenAPI documentation
- Service-oriented architecture
- Queue-based job processing for WhatsApp delivery
- Multi-tenant database design
- Compliance validation pipeline

**AI Integration**
- Three-stage compliance checking: Rules → AI → Final Verification
- Content generation with GPT-4 models
- Image generation with Google Gemini
- Real-time compliance feedback (<1.5s)
- Multi-language support with context preservation

## Compliance Requirements

### SEBI Ad Code Compliance
- No guaranteed returns or assured performance claims
- Mandatory risk disclaimers
- Educational framing for all content
- Advisor identity in all communications
- 5-year audit trail retention

### Data Protection (DPDP Act)
- All data stored in ap-south-1 (Mumbai)
- Encryption at rest and in transit
- No PII sent to AI services
- Automated consent management

### WhatsApp Business Policy
- Pre-approved message templates
- 24-hour messaging window rules
- Quality rating maintenance
- Opt-in/opt-out management

## Development Workflow

The project follows a 4-phase agent-based development approach:

1. **Phase 1: UX Research** - User flows, compliance requirements
2. **Phase 2: UI Design** - Financial design system, wireframes
3. **Phase 3: Frontend** - Next.js implementation, AI integration
4. **Phase 4: Backend** - Services, compliance engine, WhatsApp API

Use the agent system in `project-one/` for coordinated development:
```bash
npm run agent -- --phase 1 --task "research advisor workflows"
```

## WhatsApp Business Configuration

**Business Account**: Jarvis Daily (+91 76666 84471)
**Phone Number ID**: 574744175733556
**Quality Rating**: GREEN
**Webhook URL**: https://jarvis-whatsapp-assist-silent-fog-7955.fly.dev/webhook

## API Endpoints

### Key Frontend API Routes
- `/api/whatsapp/send` - Send WhatsApp messages
- `/api/whatsapp/templates` - Manage message templates
- `/api/content/generate` - AI content generation
- `/api/compliance/validate` - Three-stage compliance check
- `/api/ai/generate-content` - GPT-4 content generation
- `/api/webhooks/whatsapp` - WhatsApp webhook handler
- `/api/analytics/advisor` - Advisor analytics
- `/api/cron/daily-delivery` - Scheduled content delivery
- `/api/render/generate` - Image generation with overlays

### Backend Services  
- `/api/gemini/generate-image` - Gemini AI image generation
- `/api/scheduler` - Job scheduling and queue management
- `/api/metrics` - Performance metrics and monitoring

## Current Status

**Completed**
- Landing page with executive clarity theme
- Component library with financial design system
- Puppeteer testing infrastructure
- Basic API structure and database schema
- WhatsApp Cloud API integration (working)
- Gemini AI image generation with WhatsApp delivery
- GPT-IMAGE-1 image generation (base64 output)
- Consent management system
- WhatsApp webhook handlers

**In Progress**
- Admin and advisor dashboards
- Three-stage compliance engine
- WhatsApp delivery scheduler optimization
- Content generation pipeline refinement

**Next Steps**
1. Complete dashboard implementations
2. Integrate AI compliance validation
3. Optimize WhatsApp template management
4. Implement subscription and billing
5. Deploy monitoring and analytics

## Important Files

**Configuration**
- `project-one/apps/web/.env.example` - Environment variables template
- `project-one/apps/backend/config/` - Backend configuration
- `project-one/prisma/schema.prisma` - Database schema

**Documentation**
- `project-one/README.md` - Detailed technical overview
- `project-one/docs/PRD.md` - Product requirements
- `JARVISH-FINAL-REQUIREMENTS-V7-MARKET-VALIDATED.md` - Business requirements

**Design References**
- `project-one/themes/` - HTML design templates (source of truth)
- `project-one/apps/web/tokens/design-tokens.ts` - Design system tokens

## Performance Requirements

- **Dashboard Load**: <1.2s FCP, <2.5s LCP
- **AI Compliance Check**: <1.5s P95
- **Content Generation**: <3.5s P95
- **WhatsApp Delivery**: 99% by 06:05 IST
- **Platform Uptime**: 99.9% availability

## Testing

- Run `npm run test` in respective directories for unit tests
- Use `npm run test:puppeteer` for UI testing
- Check `npm run lint` and `npm run type-check` before commits
- Comprehensive test coverage expected for compliance features

## Image Generation Models

### GPT-IMAGE-1 (OpenAI)
- Returns base64 encoded images (not URLs)
- Supported sizes: 1024x1024, 1024x1536, 1536x1024
- Quality modes: high, medium, low
- Requires hosting for WhatsApp delivery
- Saved locally in `gpt-images/` directory

### DALL-E 3 (OpenAI)
- Returns temporary public URLs (hosted by OpenAI ~1 hour)
- Works directly with WhatsApp
- Supported sizes: 1024x1024, 1024x1792, 1792x1024
- Quality modes: standard, hd

### Google Gemini
- Text and image generation capabilities
- Direct integration with WhatsApp delivery
- Used in `complete-whatsapp-gemini.js`

## Environment Variables

Key variables in `.env.local`:
- `OPENAI_API_KEY` - OpenAI API for GPT and image models
- `GOOGLE_GEMINI_API_KEY` - Gemini AI access
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp Business API token
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp sender phone ID (574744175733556)
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` - Database access
- `CLERK_*` - Authentication configuration