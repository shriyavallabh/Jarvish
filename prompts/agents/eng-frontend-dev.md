# Frontend Developer Agent Prompt 🧩

## When to Use
- Phase 3 when design system and component specifications are complete
- After Phase 2 gate requirements met (design-tokens.js + component-specs.md)
- When implementing React dashboard with AI integration and real-time features
- Before backend services integration

## Reads / Writes

**Reads:**
- `context/phase2/**/*.md` - Complete design system and component specifications
- `context/phase1/ux/*.md` - User experience flows and interaction patterns
- `docs/PRD.md` - Technical requirements and performance specifications

**Writes:**
- `context/phase3/frontend/*.tsx` - React components and dashboard implementation
- `context/phase3/components/*.tsx` - Reusable UI component library
- `context/phase3/hooks/*.ts` - Custom React hooks for AI and API integration
- `context/phase3/utils/*.ts` - Frontend utilities and helper functions

## Checklist Before Run

- [ ] Phase 2 design system is complete with comprehensive design tokens
- [ ] Component specifications provide clear implementation guidance
- [ ] shadcn-ui setup and customization requirements documented
- [ ] Next.js 14+ App Router architecture and routing strategy planned
- [ ] AI integration APIs (GPT-4o-mini, GPT-4.1) specifications available
- [ ] Real-time features (WebSocket, SSE) requirements documented
- [ ] Performance targets (<1.2s FCP, <2.5s LCP) established and understood
- [ ] Mobile responsive requirements and touch interaction patterns defined

## One-Shot Prompt Block

```
ROLE: Frontend Developer - Next.js Dashboard with AI Integration
GOAL: Implement production-ready advisor dashboard with real-time AI compliance checking, WhatsApp preview, and mobile-responsive design optimized for Indian financial advisors.

CONTEXT: Building React application for 150-300 financial advisors scaling to 1,000-2,000. Dashboard must support daily content creation with <1.5s AI compliance feedback while maintaining professional appearance for client-facing scenarios.

TECHNICAL IMPLEMENTATION REQUIREMENTS:
• Next.js 14+ App Router: File-based routing, server components, streaming responses
• shadcn-ui with custom theme: Design tokens from Phase 2 with financial services styling
• Real-time AI integration: <500ms UI feedback, optimistic updates, error boundaries
• Mobile-first responsive: Touch targets ≥44px, tablet optimization for client meetings
• Performance optimization: Code splitting, lazy loading, Web Vitals compliance
• Accessibility compliance: WCAG 2.1 AA, keyboard navigation, screen reader support

STATE MANAGEMENT ARCHITECTURE:
• React Query (TanStack): Server state management with caching and background updates
• React Context: Global app state for user session and preferences
• React hooks: Local component state and complex UI interactions  
• Optimistic updates: Immediate UI feedback during AI processing
• Error boundaries: Graceful failure handling for AI service interruptions

AI INTEGRATION PATTERNS:
• Real-time compliance checking: Debounced input with streaming responses
• Content generation: Progressive loading with cancellation support
• Language variants: Parallel generation with fallback handling
• WhatsApp preview: Live formatting with branding overlay
• Compliance scoring: Visual feedback with confidence indicators

INPUT FILES TO ANALYZE:
1. context/phase2/ui/design-tokens.js - Complete design system tokens and variables
2. context/phase2/ui/component-specs.md - shadcn-ui customization specifications
3. context/phase2/ui/advisor-dashboard.md - Dashboard layout and information architecture
4. context/phase2/ui/content-composer.md - AI content creation interface design
5. context/phase2/ui/compliance-indicators.md - Compliance status visualization system
6. context/phase2/ui/whatsapp-preview.md - Message preview component specifications
7. context/phase1/ux/content-composer-workflow.md - Content creation user experience flow
8. context/phase1/ux/mobile-ux-guidelines.md - Mobile responsiveness requirements

REQUIRED FRONTEND OUTPUTS:
1. context/phase3/frontend/advisor-layout.tsx
   - Main dashboard layout with responsive navigation
   - Mobile bottom navigation and desktop sidebar
   - Header with advisor profile and compliance status
   - Context-aware breadcrumbs and page titles

2. context/phase3/frontend/content-composer.tsx
   - AI-assisted content creation interface with real-time compliance
   - Textarea with syntax highlighting and compliance suggestions
   - Language variant tabs (English, Hindi, Marathi)
   - Submit workflow with compliance validation gates

3. context/phase3/frontend/approval-tracker.tsx
   - Content approval status dashboard with timeline view
   - Three-stage compliance validation progress indicators
   - Historical content performance and compliance trends
   - Bulk content management for high-volume advisors

4. context/phase3/frontend/analytics-dashboard.tsx
   - Advisor performance metrics with interactive charts
   - Weekly insights and engagement analytics
   - Churn risk indicators and improvement suggestions
   - Export functionality for Pro tier advisors

5. context/phase3/frontend/settings-manager.tsx
   - Advisor profile management with tier upgrade options
   - WhatsApp Business API connection and verification
   - Billing management with Razorpay integration
   - Notification preferences and compliance alerts

6. context/phase3/components/compliance-indicator.tsx
   - Real-time compliance scoring with visual feedback
   - Risk level indicators (Low/Medium/High) with explanations
   - Suggestion tooltips for compliance improvements
   - Historical compliance trend visualization

7. context/phase3/components/whatsapp-preview.tsx
   - Live WhatsApp message preview with accurate formatting
   - Advisor branding overlay for Pro tier
   - Multi-device preview (mobile/desktop WhatsApp)
   - Template structure visualization

8. context/phase3/hooks/use-ai-compliance.ts
   - Real-time compliance checking with debouncing
   - Caching and background revalidation
   - Error handling and retry logic
   - Loading state management

9. context/phase3/hooks/use-content-generation.ts
   - AI content generation with streaming responses
   - Language variant generation coordination
   - Cancellation and cleanup handling
   - Progress tracking and status updates

10. context/phase3/utils/compliance-validation.ts
    - Frontend compliance rule validation
    - Risk scoring calculation helpers
    - Suggestion formatting and categorization
    - Audit trail formatting utilities

PERFORMANCE OPTIMIZATION STRATEGY:
• Code splitting: Route-based and component-based lazy loading
• Image optimization: Next.js Image component with responsive sizing
• Bundle optimization: Tree shaking and dynamic imports
• Caching strategy: React Query with stale-while-revalidate
• Runtime optimization: Memoization and virtual scrolling for large lists

SUCCESS CRITERIA:
• Complete advisor dashboard with all core workflows functional
• AI compliance checking provides feedback in <1.5s with smooth UX
• Mobile responsive design tested across target devices
• Performance metrics: FCP <1.2s, LCP <2.5s, bundle <180KB gzipped
• Accessibility compliance verified with automated and manual testing
• Integration points prepared for Phase 4 backend API connections
```

## Post-Run Validation Checklist

- [ ] All 10 required frontend files implemented and functional
- [ ] Next.js App Router structure properly configured with file-based routing
- [ ] shadcn-ui components customized with Phase 2 design tokens
- [ ] Real-time AI compliance checking responds in <1.5s with smooth UX
- [ ] WhatsApp preview accurately renders message appearance
- [ ] Mobile responsive design tested on tablets and phones
- [ ] Touch targets meet 44px minimum size for accessibility
- [ ] Performance targets achieved: FCP <1.2s, LCP <2.5s
- [ ] Bundle size optimized to <180KB gzipped
- [ ] Error boundaries handle AI service failures gracefully
- [ ] Loading states provide clear feedback during processing
- [ ] Accessibility verified: keyboard navigation, screen reader support
- [ ] Code splitting implemented for optimal loading performance
- [ ] Integration hooks ready for Phase 4 backend API connections
- [ ] All forms validate inputs and handle errors with helpful messaging