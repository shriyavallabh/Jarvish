# Phase 3: Frontend Development & AI Integration

## When to Use
- After Phase 2 completion with design system and component specifications ready
- When Phase 2 gate requirements are met (design-tokens.js + component-specs.md)
- Ready to implement advisor dashboard with AI-powered features
- Before backend services integration begins

## Reads / Writes

**Reads:**
- `context/phase2/**/*.md` - Complete design system and component specifications
- `context/phase1/ux/*.md` - User experience flows and interaction patterns
- `docs/PRD.md` - Technical requirements and AI integration specifications
- `docs/ai/ai-config.yaml` - AI service configuration and API requirements
- `workflow/registry.yaml` - Available integrations and constraints

**Writes:**
- `context/phase3/frontend/*.tsx` - React components and dashboard implementation
- `context/phase3/components/*.tsx` - Reusable UI components
- `context/phase3/hooks/*.ts` - Custom React hooks for AI and API integration
- `context/phase3/utils/*.ts` - Frontend utilities and helpers
- `context/phase3/SUMMARY.md` - Phase completion summary

## Checklist Before Run

- [ ] Phase 2 gate validation completed (design-tokens.js + component-specs.md exist)
- [ ] Design system tokens are comprehensive and ready for implementation
- [ ] Component specifications are detailed enough for development
- [ ] shadcn-ui library setup and customization requirements understood
- [ ] Next.js App Router architecture planned
- [ ] AI integration APIs (GPT-4o-mini, GPT-4.1) are documented
- [ ] Real-time compliance checking requirements are clear
- [ ] Mobile responsive requirements from Phase 1 UX guidelines understood
- [ ] Performance targets (<1.2s FCP, <2.5s LCP) are established

## One-Shot Prompt Block

```
ROLE: Phase 3 Orchestrator - Frontend Development & AI Integration
GOAL: Implement advisor dashboard using Next.js with real-time AI compliance checking, WhatsApp preview, and mobile-responsive design for Indian financial advisors.

CONTEXT: Building production-ready React application for 150-300 MFD/RIA advisors, scaling to 1,000-2,000. Dashboard must support daily content creation workflow with <1.5s AI compliance feedback and professional client-facing interface.

KEY TECHNICAL CONSTRAINTS:
• Next.js 14+ App Router: File-based routing, server components, streaming
• shadcn-ui components: Custom financial theme with design tokens from Phase 2
• Real-time AI integration: <500ms UI response, optimistic updates during processing
• Mobile responsiveness: Touch targets ≥44px, tablet-optimized for client meetings
• Performance: FCP <1.2s, LCP <2.5s, bundle size <180KB gzipped
• Accessibility: WCAG 2.1 AA, keyboard navigation, screen reader support
• State management: React Query for server state, React hooks for client state

AI INTEGRATION REQUIREMENTS:
• GPT-4o-mini for real-time compliance checking with <1.5s response
• GPT-4.1 for content generation with streaming response handling
• Three-stage compliance validation UI: Rules → AI → Rules display
• Real-time feedback during content composition
• WhatsApp message preview with live formatting
• Language variant generation (English, Hindi, Marathi)

INPUT FILES TO ANALYZE:
1. context/phase2/ui/design-tokens.js - Complete design system foundation
2. context/phase2/ui/component-specs.md - shadcn-ui component customizations
3. context/phase2/ui/advisor-dashboard.md - Dashboard layout and information architecture
4. context/phase2/ui/content-composer.md - AI-assisted content creation interface
5. context/phase2/ui/compliance-indicators.md - Compliance status visual system
6. context/phase2/ui/whatsapp-preview.md - Message preview component design
7. context/phase1/ux/content-composer-workflow.md - UX flow for content creation
8. context/phase1/ux/mobile-ux-guidelines.md - Responsive design requirements
9. docs/ai/ai-config.yaml - AI service APIs and integration patterns

REQUIRED OUTPUTS:
1. context/phase3/frontend/advisor-layout.tsx - Main dashboard layout with navigation
2. context/phase3/frontend/content-composer.tsx - AI-assisted content creation interface
3. context/phase3/frontend/approval-tracker.tsx - Content approval status and workflow
4. context/phase3/frontend/analytics-dashboard.tsx - Advisor performance metrics view
5. context/phase3/frontend/settings-manager.tsx - Profile, billing, WhatsApp connection
6. context/phase3/components/compliance-indicator.tsx - Real-time compliance scoring
7. context/phase3/components/whatsapp-preview.tsx - Live message preview with branding
8. context/phase3/hooks/use-ai-compliance.ts - Real-time compliance checking hook
9. context/phase3/hooks/use-content-generation.ts - AI content generation with streaming
10. context/phase3/utils/compliance-validation.ts - Frontend compliance utilities
11. context/phase3/utils/whatsapp-formatting.ts - Message formatting and preview utilities
12. context/phase3/SUMMARY.md - Phase completion summary with component inventory

PHASE GATE SUCCESS CRITERIA:
• advisor-layout.tsx provides complete dashboard navigation and structure
• content-composer.tsx integrates AI assistance with <1.5s compliance feedback
• Real-time features work without blocking main UI thread
• Mobile responsiveness tested across target devices (tablets, phones)
• Performance metrics meet FCP <1.2s, LCP <2.5s targets
• All forms handle validation and error states gracefully
• Integration points ready for Phase 4 backend services

EXECUTION APPROACH:
1. Set up Next.js project with shadcn-ui and custom design tokens
2. Implement responsive dashboard layout with mobile-first approach
3. Build AI-assisted content composer with real-time compliance checking
4. Create WhatsApp preview component with accurate message rendering
5. Implement approval tracking with three-stage compliance visualization
6. Add analytics dashboard for advisor performance insights
7. Ensure all components meet accessibility and performance requirements
8. Optimize bundle size and implement proper loading states
```

## Post-Run Validation Checklist

- [ ] All 12 required output files are created and functional
- [ ] Next.js App Router structure is properly implemented
- [ ] shadcn-ui components are customized with Phase 2 design tokens
- [ ] Content composer provides real-time AI compliance feedback <1.5s
- [ ] WhatsApp preview accurately shows message appearance to clients
- [ ] Mobile responsive design works on tablets and phones
- [ ] Touch targets meet 44px minimum size requirement
- [ ] Performance targets achieved: FCP <1.2s, LCP <2.5s
- [ ] Bundle size optimized to <180KB gzipped
- [ ] All forms handle validation errors with helpful messaging
- [ ] Loading states provide clear feedback during AI processing
- [ ] Accessibility standards met: keyboard navigation, screen reader support
- [ ] Phase gate files (advisor-layout.tsx + content-composer.tsx) ready for Phase 4
- [ ] Integration points prepared for backend API connections
- [ ] Real-time features tested for stability and performance