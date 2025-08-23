# Phase 2: FinTech UI Design & Brand System

## When to Use
- After Phase 1 completion with UX flows and compliance patterns defined
- When Phase 1 gate requirements are met (sprint-plan.md + content-composer-workflow.md)
- Before frontend development begins
- When establishing visual design system for financial advisory platform

## Reads / Writes

**Reads:**
- `context/phase1/ux/*.md` - UX flows and interaction patterns from Phase 1
- `context/phase1/compliance-patterns.md` - Regulatory UX requirements
- `docs/product/overview.md` - Brand and product positioning
- `docs/PRD.md` - Visual and branding requirements
- `workflow/registry.yaml` - Design agent capabilities

**Writes:**
- `context/phase2/ui/*.md` - Design system specifications and components
- `context/phase2/whimsy/*.md` - Enhanced interactions and animations
- `context/phase2/ui/design-tokens.js` - Design system tokens and variables
- `context/phase2/ui/component-specs.md` - Component library specifications
- `context/phase2/SUMMARY.md` - Phase completion summary

## Checklist Before Run

- [ ] Phase 1 gate validation completed (sprint-plan.md + content-composer-workflow.md exist)
- [ ] UX flows for advisor workflows are documented and approved
- [ ] Compliance patterns for SEBI requirements are defined
- [ ] Brand positioning and visual requirements are clear
- [ ] shadcn-ui component library constraints understood
- [ ] Financial services design standards researched
- [ ] Mobile-first responsive requirements documented
- [ ] Indian market visual preferences considered

## One-Shot Prompt Block

```
ROLE: Phase 2 Orchestrator - FinTech UI Design & Brand System
GOAL: Create professional financial services design system with shadcn-ui components, ensuring trust, compliance visibility, and advisor productivity.

CONTEXT: Designing for Indian financial advisors (MFDs/RIAs) who need professional, client-facing interfaces. Platform serves 150-300 advisors initially, scaling to 1,000-2,000. Design must convey regulatory compliance, financial expertise, and technology reliability.

KEY DESIGN CONSTRAINTS:
• Financial services professionalism: Trust-building visual hierarchy, conservative color palette
• SEBI compliance visibility: Clear compliance indicators, risk scoring, audit trail displays
• Mobile-first responsive: Advisors work on tablets/phones during client meetings
• Indian market preferences: Cultural color associations, vernacular language support
• Performance: <1.2s load times, optimized for mid-range devices
• Accessibility: WCAG 2.1 AA compliance, screen reader support
• shadcn-ui foundation: Consistent with existing component library patterns

BRAND REQUIREMENTS:
• Tier differentiation: Visual hierarchy for Basic/Standard/Pro features
• Compliance confidence: Green indicators for approved content, red for violations
• Professional credibility: Banking/financial services visual language
• Technology innovation: Modern but not flashy, AI assistance subtly integrated
• WhatsApp integration: Clear preview of message appearance to clients

INPUT FILES TO ANALYZE:
1. context/phase1/ux/advisor-onboarding-journey.md - User flows requiring visual design
2. context/phase1/ux/content-composer-workflow.md - AI-assisted content creation interface
3. context/phase1/ux/approval-tracking.md - Compliance validation status displays
4. context/phase1/ux/mobile-ux-guidelines.md - Responsive design requirements
5. context/phase1/compliance-patterns.md - Regulatory UX display requirements
6. docs/product/overview.md - Brand positioning and visual identity guidelines
7. docs/PRD.md - Product specifications and visual requirements

REQUIRED OUTPUTS:
1. context/phase2/ui/design-tokens.js - Complete design system tokens (colors, typography, spacing)
2. context/phase2/ui/component-specs.md - shadcn-ui component specifications and modifications
3. context/phase2/ui/advisor-dashboard.md - Main dashboard layout and information architecture
4. context/phase2/ui/content-composer.md - AI-assisted content creation interface design
5. context/phase2/ui/compliance-indicators.md - Visual system for compliance status and scoring
6. context/phase2/ui/whatsapp-preview.md - Message preview component design
7. context/phase2/ui/mobile-responsive-specs.md - Responsive breakpoint and touch target specifications
8. context/phase2/whimsy/micro-interactions.md - Subtle animations and feedback patterns
9. context/phase2/whimsy/enhanced-designs.md - Progressive enhancement for Pro tier features
10. context/phase2/whimsy/animation-specs.md - Loading states and transition specifications
11. context/phase2/SUMMARY.md - Phase completion summary with component inventory

PHASE GATE SUCCESS CRITERIA:
• design-tokens.js provides complete design system foundation
• component-specs.md ready for frontend development implementation
• All advisor workflows have corresponding visual designs
• Compliance indicators clearly communicate SEBI requirements
• Mobile responsiveness supports advisor field work scenarios
• Design system conveys financial services professionalism and trustworthiness

EXECUTION APPROACH:
1. Establish financial services design language with trust-building visual hierarchy
2. Create comprehensive design token system compatible with shadcn-ui
3. Design advisor dashboard prioritizing daily workflow efficiency
4. Develop compliance-first content composer with real-time feedback
5. Ensure mobile responsiveness for advisor client meetings
6. Add subtle micro-interactions that enhance without distracting
7. Validate all designs meet accessibility and performance requirements
```

## Post-Run Validation Checklist

- [ ] Design tokens (colors, typography, spacing) are comprehensive and professional
- [ ] Component specifications are ready for shadcn-ui implementation
- [ ] Advisor dashboard design supports efficient daily workflows
- [ ] Content composer interface clearly shows AI assistance and compliance status
- [ ] Compliance indicators provide immediate regulatory feedback
- [ ] WhatsApp preview accurately represents client-facing message appearance
- [ ] Mobile responsive specifications support advisor field work
- [ ] Micro-interactions enhance usability without overwhelming interface
- [ ] All designs convey financial services professionalism and trust
- [ ] Phase gate files (design-tokens.js + component-specs.md) ready for Phase 3
- [ ] Design system accommodates tier-based feature differentiation
- [ ] Visual hierarchy supports both English and regional language content