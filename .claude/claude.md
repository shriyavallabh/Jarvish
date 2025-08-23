# Jarvish Development Context & Configuration

## Project Overview
Jarvish is an AI-first SaaS platform for Indian financial advisors, delivering SEBI-compliant content via WhatsApp automation. We serve MFDs and RIAs with intelligent content generation, compliance checking, and automated distribution.

## Context Files
You have access to the following context files in this repository:
- `JARVISH-FINAL-REQUIREMENTS-V7-MARKET-VALIDATED.md` - Complete product requirements
- `indian-financial-advisory-market-research-2024.md` - Market research data
- `competitive-analysis-indian-financial-advisors-2025.md` - Competitive landscape
- `jarvish-unit-economics-model.js` - Financial modeling
- `market-validation-final-report.md` - Market validation insights

## Technical Architecture
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + PostgreSQL + Redis
- **AI Integration**: OpenAI GPT-4 + Claude-3-Sonnet + Stability AI
- **Communication**: WhatsApp Business Cloud API
- **Deployment**: Vercel (frontend) + Railway (backend)

## Visual Development Guidelines

### Design Principles
You should follow these core design principles for the Jarvish platform:

1. **Trust & Professionalism**: Financial services require high trust - use deep blues (#1E3A8A), clean typography (Inter), and professional imagery
2. **SEBI Compliance First**: All UI elements must support regulatory compliance - clear disclaimers, audit trails, proper data handling
3. **Mobile-First**: 80% of advisors use mobile - prioritize responsive design and touch-friendly interfaces
4. **Indian Context**: Support for Hindi/English bilingual content, Indian financial terminology, cultural sensitivity
5. **Advisor-Centric UX**: Streamlined workflows for busy advisors - minimal clicks, clear information hierarchy
6. **Performance Optimized**: Fast loading for advisors in tier 2/3 cities with slower internet

### Playwright Visual Development Workflow

**IMPORTANT**: When working on ANY frontend changes, you MUST follow this visual validation process:

1. **Navigate & Screenshot**: Always use Playwright to navigate to affected pages and take screenshots
2. **Compliance Check**: Verify that all financial disclaimers and SEBI-required elements are visible
3. **Mobile Responsiveness**: Test at minimum three viewport sizes (mobile: 375px, tablet: 768px, desktop: 1920px)
4. **Performance Validation**: Check browser console for errors, warnings, or performance issues
5. **Accessibility Audit**: Ensure color contrast, keyboard navigation, and screen reader compatibility

**Auto-trigger conditions for comprehensive design review:**
- Creating or updating any pull request
- Major UI/UX refactors
- New component development
- Integration with external APIs (WhatsApp, AI services)
- SEBI compliance-related changes

### Browser Configuration
- **Primary Browser**: Chromium (matches production user base)
- **Viewport**: 1920x1080 desktop, 375x667 mobile
- **Performance**: Monitor Core Web Vitals (LCP, FID, CLS)
- **Console Monitoring**: Track AI generation errors, WhatsApp API failures, compliance violations

### Component Guidelines
- **shadcn/ui Based**: Use existing component library, customize with financial services branding
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **i18n Ready**: Support for Hindi/English switching
- **Error Boundaries**: Graceful handling of AI service failures
- **Loading States**: Clear feedback for AI content generation (can take 2-3 seconds)

### Testing Priorities
1. **SEBI Compliance UI**: Disclaimers, audit logs, regulatory notices
2. **WhatsApp Integration**: Message previews, delivery status, contact management
3. **AI Content Generation**: Loading states, error handling, content approval flows
4. **Payment Integration**: Subscription flows, tier upgrades, billing displays
5. **Admin Controls**: Content moderation, user management, system health

## Development Workflow Rules

### Code Standards
- **TypeScript Strict**: No `any` types, proper interface definitions
- **Error Handling**: Comprehensive try-catch blocks, user-friendly error messages
- **Security**: No API keys in frontend, proper authentication flows
- **Performance**: Lazy loading, code splitting, optimized images
- **Git Conventions**: Conventional commits, feature branches, proper PR descriptions

### AI Integration Guidelines
- **Cost Monitoring**: Track AI usage costs, implement budgets per advisor
- **Fallback Strategies**: Handle AI service outages gracefully
- **Content Quality**: Human review queues for sensitive financial content
- **Rate Limiting**: Respect API limits, implement queuing systems

### Compliance Requirements
- **Data Privacy**: DPDP Act compliance, encryption at rest/transit
- **Audit Trails**: Immutable logs for all advisor actions
- **Content Approval**: All AI-generated content must be reviewable
- **SEBI Guidelines**: Automated checking against latest regulatory updates

## Key Integrations
- **WhatsApp Business API**: Message delivery, contact management, template approval
- **OpenAI/Claude**: Content generation, compliance checking, embeddings
- **Payment Gateways**: Razorpay for Indian market, subscription management
- **Analytics**: PostHog for user behavior, custom dashboards for advisors
- **Monitoring**: Sentry for error tracking, Uptime Robot for service monitoring

## Never Do
- Skip Playwright visual validation for frontend changes
- Commit code with console errors or warnings
- Deploy without mobile responsiveness testing
- Ignore SEBI compliance requirements in UI design
- Use non-professional imagery or casual language
- Implement features without considering AI cost implications
- Add external dependencies without security review

## Always Do
- Take screenshots before and after UI changes
- Test on multiple viewport sizes
- Validate SEBI compliance elements are visible
- Check browser console for errors
- Ensure loading states for AI operations
- Maintain professional financial services aesthetic
- Consider Indian advisor workflow patterns
- Optimize for performance on slower networks