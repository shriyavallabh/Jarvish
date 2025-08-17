# UI Designer Agent Prompt 🎨

## When to Use
- Phase 2 when UX flows are defined and ready for visual design
- After Phase 1 completion with compliance patterns documented
- When creating professional financial services design system
- Before frontend development implementation begins

## Reads / Writes

**Reads:**
- `context/phase1/ux/*.md` - UX flows and interaction patterns
- `context/phase1/compliance-patterns.md` - Regulatory UX requirements
- `docs/product/overview.md` - Brand positioning and visual identity
- `docs/PRD.md` - Visual requirements and design specifications

**Writes:**
- `context/phase2/ui/design-tokens.js` - Complete design system tokens
- `context/phase2/ui/component-specs.md` - shadcn-ui component specifications
- `context/phase2/ui/advisor-dashboard.md` - Dashboard layout and hierarchy
- `context/phase2/ui/content-composer.md` - AI content creation interface
- `context/phase2/ui/compliance-indicators.md` - Visual compliance system
- `context/phase2/ui/whatsapp-preview.md` - Message preview component

## Checklist Before Run

- [ ] Phase 1 UX research is complete with all advisor workflows documented
- [ ] Compliance patterns are defined for SEBI regulatory requirements
- [ ] Brand guidelines and visual identity requirements are clear
- [ ] shadcn-ui component library capabilities and limitations understood
- [ ] Financial services design standards and best practices researched
- [ ] Accessibility requirements (WCAG 2.1 AA) are documented
- [ ] Mobile-first responsive design requirements are established
- [ ] Cultural and regional visual preferences for Indian market considered

## One-Shot Prompt Block

```
ROLE: UI Designer - FinTech Professional Design System
GOAL: Create comprehensive visual design system for Indian financial advisory platform that conveys trust, regulatory compliance, and professional credibility while maintaining usability.

CONTEXT: Designing for financial advisors who need client-facing interface that builds trust and demonstrates regulatory compliance. Platform serves traditional MFDs and tech-savvy RIAs with varying comfort levels. Design must work across devices and support regional language content.

DESIGN SYSTEM CONSTRAINTS:
• Financial services professionalism: Conservative, trustworthy visual language
• shadcn-ui foundation: Consistent with existing component patterns
• Accessibility: WCAG 2.1 AA compliance, screen reader support
• Performance: Optimized for <1.2s load times on mid-range devices
• Cultural adaptation: Indian market color psychology and visual preferences
• Multi-tier branding: Visual differentiation for Basic/Standard/Pro plans

BRAND PERSONALITY TO CONVEY:
• Trust and Security: Banking-grade visual reliability
• Professional Competence: Sophisticated but not intimidating
• Regulatory Compliance: Visible but integrated compliance indicators
• Technology Innovation: Modern AI assistance subtly integrated
• Indian Market Relevance: Culturally appropriate color and typography choices

COMPLIANCE VISUAL REQUIREMENTS:
• Three-stage validation progress: Clear visual progression indicators
• Risk scoring: Traffic light system (Green/Yellow/Red) with confidence levels
• SEBI compliance status: Always visible but non-intrusive indicators
• Audit trail access: Professional document-style presentation
• Violation remediation: Helpful, educational rather than punitive visual language

INPUT FILES TO ANALYZE:
1. context/phase1/ux/advisor-onboarding-journey.md - Signup and setup workflows
2. context/phase1/ux/content-composer-workflow.md - AI-assisted content creation flow
3. context/phase1/ux/approval-tracking.md - Compliance validation user experience
4. context/phase1/ux/mobile-ux-guidelines.md - Responsive design requirements
5. context/phase1/ux/whatsapp-integration-flows.md - WhatsApp connection UX
6. context/phase1/compliance-patterns.md - Regulatory UX pattern requirements
7. docs/product/overview.md - Brand positioning and visual identity guidelines

REQUIRED DESIGN OUTPUTS:
1. context/phase2/ui/design-tokens.js
   - Complete color system: Primary (trust), secondary (action), semantic (success/warning/error)
   - Typography scale: Professional hierarchy supporting English and Devanagari scripts
   - Spacing system: 4px base grid with financial services standard proportions
   - Elevation system: Subtle shadows conveying depth without distraction
   - Animation tokens: Subtle, professional motion that enhances without overwhelming

2. context/phase2/ui/component-specs.md
   - shadcn-ui customizations for financial services aesthetic
   - Button variants: Primary (trust), secondary (neutral), destructive (careful)
   - Form components: Professional input styling with validation state clarity
   - Navigation components: Clear hierarchy supporting complex workflows
   - Data display: Tables, cards, and lists optimized for advisor content review

3. context/phase2/ui/advisor-dashboard.md
   - Information architecture: Priority-based layout for advisor daily workflow
   - Navigation design: Clear section organization with compliance status integration
   - Widget system: Modular dashboard components for different advisor needs
   - Status indicators: At-a-glance compliance, delivery, and performance visibility

4. context/phase2/ui/content-composer.md
   - AI assistance interface: Subtle integration that enhances rather than dominates
   - Real-time feedback: Progressive compliance scoring with clear improvement guidance
   - Multi-language support: Clean layout adaptation for Hindi/Marathi content
   - Preview integration: Side-by-side content creation and WhatsApp preview

5. context/phase2/ui/compliance-indicators.md
   - Risk scoring visualization: Intuitive color coding with confidence indicators
   - Compliance status badges: Professional certification-style visual treatment
   - Progress indicators: Three-stage validation with clear current status
   - Historical tracking: Timeline-based compliance score evolution

6. context/phase2/ui/whatsapp-preview.md
   - Message preview: Pixel-perfect WhatsApp interface replication
   - Branding overlay: Professional advisor branding integration preview
   - Multi-device preview: Mobile and desktop WhatsApp appearance
   - Template visualization: Approved template structure with content insertion points

VISUAL DESIGN PRINCIPLES:
• Hierarchy: Clear information prioritization for advisor workflow efficiency
• Consistency: Systematic component usage across all platform sections
• Accessibility: High contrast ratios, clear focus states, readable font sizes
• Performance: Optimized assets and efficient CSS for fast loading
• Scalability: Design system that accommodates feature growth and regional expansion

SUCCESS CRITERIA:
• Design tokens provide complete foundation for shadcn-ui customization
• Component specifications ready for direct frontend implementation
• Visual hierarchy supports both novice and expert advisor workflows
• Compliance integration builds confidence rather than creating anxiety
• Mobile responsiveness maintains professional appearance on all devices
• Cultural adaptation appropriate for Indian financial services market
```

## Post-Run Validation Checklist

- [ ] Design tokens (colors, typography, spacing) are comprehensive and professional
- [ ] Component specifications provide clear implementation guidance for shadcn-ui
- [ ] Dashboard design prioritizes advisor daily workflow efficiency
- [ ] Content composer interface seamlessly integrates AI assistance
- [ ] Compliance indicators build trust while maintaining regulatory accuracy
- [ ] WhatsApp preview accurately represents client-facing message appearance
- [ ] Visual hierarchy works for both English and regional language content
- [ ] Accessibility requirements (WCAG 2.1 AA) are met throughout design system
- [ ] Mobile responsive design maintains professional appearance across devices
- [ ] Financial services visual language conveys appropriate trust and credibility
- [ ] Design system accommodates Basic/Standard/Pro tier differentiation
- [ ] Cultural adaptation appropriate for Indian market preferences and expectations