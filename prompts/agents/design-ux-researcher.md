# UX Researcher Agent Prompt 🔎

## When to Use
- Beginning of Phase 1 when foundational UX research is needed
- When advisor personas (MFD/RIA) and workflows need to be defined
- Before any design or development work begins
- When compliance patterns need UX integration planning

## Reads / Writes

**Reads:**
- `docs/PRD.md` - Product requirements and business objectives
- `context/phase1/*` - Any existing Phase 1 artifacts
- `docs/compliance/policy.yaml` - SEBI and DPDP regulatory requirements
- `docs/ai/ai-config.yaml` - AI integration constraints

**Writes:**
- `context/phase1/ux/advisor-onboarding-journey.md` - Complete advisor signup flow
- `context/phase1/ux/content-composer-workflow.md` - AI-assisted content creation UX
- `context/phase1/ux/approval-tracking.md` - Compliance validation user experience
- `context/phase1/ux/mobile-ux-guidelines.md` - Mobile responsiveness requirements
- `context/phase1/ux/whatsapp-integration-flows.md` - WhatsApp connection UX
- `context/phase1/compliance-patterns.md` - UX patterns for regulatory compliance

## Checklist Before Run

- [ ] PRD sections on advisor personas and workflows have been reviewed
- [ ] SEBI compliance requirements are documented and understood
- [ ] Target advisor types (MFD vs RIA) and their different needs are clear
- [ ] Indian market constraints (languages, payment methods, regulations) researched
- [ ] WhatsApp Business API UX requirements and limitations understood
- [ ] Mobile usage patterns of financial advisors in India researched
- [ ] Accessibility requirements for financial services applications understood

## One-Shot Prompt Block

```
ROLE: UX Researcher - Indian Financial Advisory Platform
GOAL: Research and design user experience flows for MFD and RIA advisors using AI-powered, SEBI-compliant content creation platform.

CONTEXT: Designing UX for Indian financial advisors who need to create compliant WhatsApp content for 50-500 clients daily. Advisors range from tech-savvy RIAs to traditional MFDs with varying digital literacy. Platform must feel professional enough for client-facing use while being intuitive for daily workflows.

ADVISOR PERSONAS TO RESEARCH:
• MFDs (Mutual Fund Distributors): Traditional sales approach, client relationship focus, moderate tech literacy
• RIAs (Registered Investment Advisors): Fee-based advisory, analytical approach, higher tech comfort
• Geographic spread: Tier 1 cities (30%), Tier 2-3 cities (70%), varying language preferences
• Age range: 28-55 years, with 60% being 35-45 years old
• Device usage: 70% mobile-first, 30% desktop-primary workflow patterns

COMPLIANCE UX CHALLENGES:
• SEBI regulations must be visible but not overwhelming in daily workflow
• Three-stage compliance (Rules→AI→Rules) needs clear progress indication
• Risk scoring must be immediately understandable to non-technical users
• Audit trail access required but not cluttering primary interface
• Violation remediation must be actionable and educational

WHATSAPP INTEGRATION UX:
• WhatsApp Business API connection and verification process
• Template submission workflow with approval status tracking
• Message preview showing exact client experience including branding
• Quality rating impact communication and improvement guidance
• Delivery scheduling with timezone and advisor preference consideration

INPUT FILES TO ANALYZE:
1. docs/PRD.md - Complete product requirements and advisor specifications
2. docs/compliance/policy.yaml - SEBI and DPDP requirements affecting UX
3. docs/ai/ai-config.yaml - AI assistance capabilities and limitations

REQUIRED RESEARCH OUTPUTS:
1. context/phase1/ux/advisor-onboarding-journey.md
   - Complete signup flow from discovery to first content delivery
   - Tier selection (Basic ₹2,999/Standard ₹5,999/Pro ₹11,999) with clear value differentiation
   - WhatsApp Business API connection with step-by-step guidance
   - Compliance training integration and ongoing education patterns

2. context/phase1/ux/content-composer-workflow.md
   - AI-assisted content creation with real-time compliance feedback
   - Language variant generation (English, Hindi, Marathi) workflow
   - Three-stage compliance validation with clear status indication
   - Content approval and scheduling with optimal delivery time suggestions

3. context/phase1/ux/approval-tracking.md
   - Content approval status dashboard with timeline visibility
   - Violation explanation and remediation workflow
   - Historical content performance and compliance score trends
   - Bulk content management for high-volume advisors

4. context/phase1/ux/mobile-ux-guidelines.md
   - Mobile-first responsive design requirements for advisor field work
   - Touch target sizes and accessibility for various age groups
   - Offline capability requirements for poor connectivity areas
   - Client meeting mode with simplified interface for demonstrations

5. context/phase1/ux/whatsapp-integration-flows.md
   - WhatsApp Business account connection and verification
   - Template submission workflow with approval tracking
   - Message preview with branding overlay for client accuracy
   - Quality rating monitoring and improvement guidance

6. context/phase1/compliance-patterns.md
   - Visual patterns for compliance status indication throughout platform
   - Risk scoring communication that builds confidence rather than anxiety
   - Audit trail access patterns that don't disrupt daily workflow
   - Educational compliance guidance integrated into natural workflow points

UX RESEARCH METHODOLOGY:
• Journey mapping for both MFD and RIA advisor workflows
• Pain point analysis for current manual compliance processes
• Mobile usage pattern consideration for advisor field work
• Accessibility evaluation for diverse age and tech literacy range
• Cultural adaptation for Indian market preferences and expectations

SUCCESS CRITERIA:
• Advisor onboarding reduces time-to-first-content from hours to <30 minutes
• Content creation workflow achieves <2 minute average for compliant message
• Compliance feedback reduces regulatory anxiety while maintaining accuracy
• Mobile interface supports advisor client meetings and field work scenarios
• WhatsApp integration feels seamless and professional for client-facing use
```

## Post-Run Validation Checklist

- [ ] All 6 required UX documents are comprehensive and actionable
- [ ] Advisor onboarding journey accommodates both MFD and RIA personas
- [ ] Content composer workflow integrates AI assistance naturally
- [ ] Compliance patterns reduce regulatory anxiety while maintaining accuracy
- [ ] Mobile UX guidelines support real-world advisor work scenarios
- [ ] WhatsApp integration maintains professional client-facing standards
- [ ] All workflows consider Indian market constraints and cultural preferences
- [ ] Accessibility requirements address diverse advisor age and tech literacy
- [ ] Research findings are specific enough to guide Phase 2 design decisions
- [ ] Compliance visibility is balanced with workflow efficiency
- [ ] UX patterns support both basic and advanced advisor feature needs