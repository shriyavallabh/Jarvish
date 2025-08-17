# Responsive Layouts & Design Specifications - Project One

## Overview

This document defines comprehensive responsive layouts for Project One's financial advisor platform, providing mobile-first design specifications with shadcn-ui adaptations. Each layout includes ASCII sketches, design rationale, and implementation guidance for SEBI-compliant financial services UI.

## Design Principles

### Financial Services UI Standards
```yaml
design_foundation:
  trust_building:
    - clean, professional visual hierarchy
    - consistent compliance indicators
    - transparent data presentation
    - reliable interaction patterns
    
  efficiency_focused:
    - single-screen task completion
    - minimal cognitive load
    - progressive disclosure
    - contextual help integration
    
  mobile_first_approach:
    - thumb-friendly navigation
    - readable typography at scale
    - touch-optimized interactions
    - offline-capable workflows
    
  accessibility_compliance:
    - wcag_2.1_aa_standards
    - keyboard_navigation_support
    - screen_reader_optimization
    - high_contrast_availability
```

## Layout System Architecture

### Breakpoint Strategy
```yaml
responsive_breakpoints:
  mobile_portrait: "320px - 479px"    # Primary advisor usage
  mobile_landscape: "480px - 767px"   # Secondary mobile usage
  tablet_portrait: "768px - 1023px"   # Admin workflows
  desktop: "1024px+"                  # Admin dashboards
  
grid_system:
  base_unit: "4px"                    # Spacing foundation
  container_max_width: "1200px"      # Desktop max width
  gutter_mobile: "16px"               # Mobile gutters
  gutter_desktop: "24px"              # Desktop gutters
  
typography_scale:
  mobile_base: "16px"                 # Minimum readable size
  desktop_base: "16px"                # Consistent base
  line_height: "1.5"                  # Optimal readability
  scale_ratio: "1.25"                 # Major third scale
```

## 1. Advisor Dashboard Layout

### Mobile Layout (320px - 767px)
```
┌─────────────────────────────────────┐
│ ┌─┐ Project One        🔔 ⚙️       │ <- Header (64px)
│ └─┘ Good morning, Raj               │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │ <- Status Cards
│ │ Today's Content       ✅ Ready  │ │   (120px each)
│ │ Delivered: 08:00 IST            │ │
│ │ Read Rate: 78% ↗️               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ This Week             📊        │ │
│ │ 5 pieces created                │ │
│ │ 95% approval rate               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │ <- Quick Actions
│ │ ➕ Create New Content           │ │   (56px height)
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │ <- Recent Activity
│ │ Recent Activity                 │ │   (Variable height)
│ │ • Market Update approved 2h ago │ │
│ │ • SIP Guide delivered yesterday │ │
│ │ • Tax Planning pending review  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Home] [Create] [Library] [Stats] [Profile] <- Bottom Nav (60px)
└─────────────────────────────────────┘
```

### Desktop Layout (1024px+)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─┐ Project One    [Search...]    Raj Kumar    🔔 ⚙️     [Help] [Logout] │ <- Header (72px)
│ └─┘                                                                       │
├──────────────────────────────────────────────────────────────────────────┤
│ [Dashboard] [Create] [Library] [Analytics] [Settings]                    │ <- Nav Tabs (48px)
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌─────────────┐ │ <- KPI Cards
│ │ Today's Status │ │ This Week      │ │ Compliance     │ │ Performance │ │   (140px)
│ │ ✅ Ready       │ │ 📊 5 Created   │ │ 🛡️ 98% Score   │ │ 📈 +15%    │ │
│ │ 08:00 IST      │ │ 95% Approved   │ │ Zero Issues    │ │ Engagement  │ │
│ │ 78% Read Rate  │ │ 4.2 Avg Rating │ │ All Clear      │ │ This Month  │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └─────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐  │
│ │ Quick Actions                   │ │ Recent Activity                 │  │ <- Content Sections
│ │ ┌─────────────────────────────┐ │ │ ┌─────────────────────────────┐ │  │   (300px+)
│ │ │ ➕ Create Daily Content     │ │ │ │ • Market Update approved    │ │  │
│ │ └─────────────────────────────┘ │ │ │   2 hours ago               │ │  │
│ │ ┌─────────────────────────────┐ │ │ │ • SIP Guide delivered       │ │  │
│ │ │ 📋 Review Pending (3)       │ │ │ │   yesterday 06:00           │ │  │
│ │ └─────────────────────────────┘ │ │ │ • Tax Planning content      │ │  │
│ │ ┌─────────────────────────────┐ │ │ │   pending review            │ │  │
│ │ │ 📊 View Analytics           │ │ │ │ • WhatsApp integration      │ │  │
│ │ └─────────────────────────────┘ │ │ │   health check passed       │ │  │
│ └─────────────────────────────────┘ │ └─────────────────────────────┘ │  │
│                                     └─────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Design Rationale
- **Status-First Approach**: Immediate visibility of delivery status reduces advisor anxiety
- **Compliance Prominence**: SEBI compliance indicators always visible for confidence
- **Action-Oriented**: Primary CTA (Create Content) prominently placed for daily workflow
- **Progressive Information**: Summary cards lead to detailed views without overwhelming

## 2. Content Creation Studio Layout

### Mobile Content Creation Flow
```
Step 1: Topic Selection
┌─────────────────────────────────────┐
│ ← Back    Create Content    Skip    │ <- Header with context
├─────────────────────────────────────┤
│ What's your focus today?            │ <- Clear question
│                                     │
│ 🎯 AI Suggestions                   │ <- Section headers
│ ┌─────────────────────────────────┐ │
│ │ ⭐ Market Volatility Guide      │ │ <- Recommendation cards
│ │ Perfect for current conditions  │ │   (80px each)
│ │ High engagement predicted       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📈 SIP Benefits Explainer      │ │
│ │ Seasonal relevance: High        │ │
│ │ Your style match: 95%           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📝 Custom Topic                     │
│ ┌─────────────────────────────────┐ │ <- Input field
│ │ Enter your topic...             │ │   (56px)
│ └─────────────────────────────────┘ │
│                                     │
│           [Continue →]              │ <- Primary action
└─────────────────────────────────────┘   (56px)
```

```
Step 2: Content Generation
┌─────────────────────────────────────┐
│ ← Back    Market Volatility    ⚙️   │
├─────────────────────────────────────┤
│ ⚡ Generating content...            │ <- Progress indicator
│ ████████████████░░░░ 80%            │
│                                     │
│ Language: English ▼                 │ <- Settings
│ Tone: Professional ▼                │
│ Length: Standard ▼                  │
│                                     │
│ 📱 WhatsApp Preview                 │ <- Live preview
│ ┌─────────────────────────────────┐ │
│ │ 🏦 Market Volatility Insights   │ │ <- Preview card
│ │                                 │ │   (200px)
│ │ [Market chart visualization]    │ │
│ │                                 │ │
│ │ Market volatility is natural... │ │
│ │                                 │ │
│ │ 💼 Raj Kumar, CFP               │ │
│ │ SEBI RIA: INA123456789          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🛡️ Compliance Score: 87/100        │ <- Compliance status
│ ✅ SEBI compliant                   │
│ ⚠️ Consider adding risk disclaimer  │
│                                     │
│         [Edit] [Regenerate]         │ <- Secondary actions
│         [Continue →]                │ <- Primary action
└─────────────────────────────────────┘
```

### Desktop Content Creation Studio
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard          Create Content          [Save Draft] [Help]  │ <- Header (64px)
├─────────┬────────────────────────────────────────────┬────────────────────┤
│ Steps   │ Content Editor                             │ Live Preview       │ <- 3-Column Layout
│         │                                            │                    │
│ ○ Topic │ 📝 Market Volatility Guide               │ 📱 WhatsApp        │
│ ● Create│                                           │ ┌────────────────┐ │
│ ○ Review│ Language: [English ▼] Tone: [Pro ▼]      │ │ 🏦 Market      │ │ <- Preview Panel
│ ○ Submit│                                           │ │ Volatility     │ │   (300px wide)
│         │ ┌────────────────────────────────────────┐ │ │                │ │
│         │ │ # Market Volatility: Your Guide        │ │ │ [Chart Visual] │ │
│         │ │                                        │ │ │                │ │
│         │ │ Dear Investors,                        │ │ │ Market volatil │ │
│         │ │                                        │ │ │ ity is natural │ │
│         │ │ Recent market movements may seem       │ │ │ ...            │ │
│         │ │ concerning, but volatility is a        │ │ │                │ │
│         │ │ natural part of investing...           │ │ │ 💼 Raj Kumar   │ │
│         │ │                                        │ │ │ SEBI: INA123   │ │
│         │ │ Key Points:                            │ │ └────────────────┘ │
│         │ │ • Diversification reduces risk         │ │                    │
│         │ │ • SIPs smooth out volatility          │ │ 🔄 LinkedIn        │
│         │ │ • Long-term investing wins             │ │ ┌────────────────┐ │
│         │ │                                        │ │ │ [LinkedIn Ver] │ │
│         │ │ [AI Suggestion: Add risk disclaimer]   │ │ └────────────────┘ │
│         │ └────────────────────────────────────────┘ │                    │
│         │                                            │ 🛡️ Compliance      │
│         │ 🛡️ Compliance Score: 87/100 ⚠️            │ Score: 87/100      │
│         │ • ✅ No guaranteed returns mentioned       │ ⚠️ Suggestions:    │
│         │ • ✅ Appropriate risk language             │ • Add disclaimer   │
│         │ • ⚠️ Consider adding SEBI disclaimer       │ • Review risk lang │
│         │                                            │                    │
│         │ [Regenerate] [AI Improve] [Continue →]     │ [Preview All]      │
├─────────┴────────────────────────────────────────────┴────────────────────┤
│ 💾 Auto-saved 30 seconds ago                     🕐 Estimated time: 3 min │ <- Footer (32px)
└──────────────────────────────────────────────────────────────────────────┘
```

### Design Rationale
- **Progressive Workflow**: Clear steps prevent overwhelming while maintaining context
- **Real-time Feedback**: Live preview and compliance scoring build confidence
- **Mobile-First Editing**: Touch-friendly controls with smart suggestions
- **Compliance Integration**: SEBI compliance always visible with actionable feedback

## 3. Admin Approval Workflow Layout

### Admin Queue Dashboard (Desktop Primary)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Project One Admin    [Search queue...]    Admin User    🔔 ⚙️   [Logout] │ <- Admin Header
├─────────────────┬────────────────────────────────────────────────────────┤
│ Queue Overview  │ Approval Queue (23 pending)                            │
│                 │                                                        │
│ 🚨 High Priority│ ┌─ Filters ──────────────────────────────────────────┐ │
│ 8 items         │ │ [High Risk ▼] [New Advisors ▼] [Today ▼] [Reset] │ │ <- Filter Bar
│                 │ └────────────────────────────────────────────────────┘ │   (48px)
│ ⚡ Standard     │                                                        │
│ 12 items        │ ┌──────────────────────────────────────────────────────────┐
│                 │ │ ☑️ [Select All] Sort: Risk Score ▼    [Bulk Approve] │ │ <- Bulk Actions
│ ✅ Auto-Approved│ └──────────────────────────────────────────────────────────┘   (40px)
│ 156 today       │                                                        │
│                 │ ┌──────────────────────────────────────────────────────────┐
│ 📊 Analytics    │ │ 🚨 Risk: 85  📅 2h ago  👤 Priya Sharma (New)        │ │ <- Queue Item
│ • 94% Auto      │ │ Market Crash Opportunity - Tax Loss Harvesting      │ │   (120px each)
│ • 3.2h Avg      │ │ "Perfect time to book losses..." [Read More]        │ │
│ • 0 Violations  │ │ ⚠️ Mentions "guaranteed tax savings"                │ │
│                 │ │ [👁️ Preview] [✅ Approve] [❌ Reject] [⬆️ Escalate]   │ │
│ 🔄 Refresh      │ └──────────────────────────────────────────────────────────┘
│ Auto: ON        │ ┌──────────────────────────────────────────────────────────┐
│                 │ │ ⚡ Risk: 45  📅 1h ago  👤 Raj Kumar (Standard)      │ │
│                 │ │ Weekly SIP Benefits Guide                           │ │
│                 │ │ "Systematic investment plans help..." [Read More]   │ │
│                 │ │ ✅ All compliance checks passed                     │ │
│                 │ │ [👁️ Preview] [✅ Approve] [📋 Quick Approve]        │ │
│                 │ └──────────────────────────────────────────────────────────┘
├─────────────────┴────────────────────────────────────────────────────────┤
│ ⏱️ SLA: 2.3h avg review time    📈 Today: 89% within SLA    🎯 Target: 4h│ <- Performance Bar
└──────────────────────────────────────────────────────────────────────────┘
```

### Individual Content Review Modal
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Content Review - Market Crash Opportunity                        ✕ Close │ <- Modal Header
├─────────────────────┬────────────────────────────────────────────────────┤   (56px)
│ Advisor Context     │ Content Analysis                                   │
│                     │                                                    │
│ 👤 Priya Sharma     │ 📱 WhatsApp Preview                                │ <- 2-Column Layout
│ 🆔 SEBI: INA789012  │ ┌────────────────────────────────────────────────┐ │
│ 📊 Tier: Basic      │ │ 📈 Market Crash Opportunity                   │ │ <- Content Preview
│ ⭐ Health: 78/100   │ │                                                │ │   (300px)
│                     │ │ [Chart showing market decline]                │ │
│ 📈 History          │ │                                                │ │
│ • 23 submissions    │ │ Dear Investors,                                │ │
│ • 87% approval rate │ │                                                │ │
│ • 2 escalations     │ │ Recent market corrections present unique       │ │
│ • Last: 2 days ago  │ │ opportunities for tax loss harvesting...      │ │
│                     │ │                                                │ │
│ 🚨 Risk Factors     │ │ ⚠️ HIGHLIGHTED: "guaranteed tax savings"       │ │
│ • New advisor       │ │                                                │ │
│ • High risk content │ │ Benefits:                                      │ │
│ • Tax implications  │ │ • Reduce tax liability                         │ │
│                     │ │ • Rebalance portfolio                          │ │
│ 📋 Checklist        │ │ • Lock in losses before year-end              │ │
│ ☑️ SEBI disclaimer  │ │                                                │ │
│ ☑️ Risk warnings    │ │ 💼 Priya Sharma, Financial Advisor            │ │
│ ❌ Tax guarantees   │ │ 🏛️ SEBI Reg: INA789012345                     │ │
│ ☑️ Market risks     │ └────────────────────────────────────────────────┘ │
│                     │                                                    │
│                     │ 🛡️ AI Compliance Analysis                          │
│                     │ ┌────────────────────────────────────────────────┐ │ <- Compliance Panel
│                     │ │ Overall Risk Score: 85/100 🚨                  │ │   (200px)
│                     │ │                                                │ │
│                     │ │ ❌ Critical Issues:                             │ │
│                     │ │ • "Guaranteed tax savings" violates SEBI rules │ │
│                     │ │ • Missing market risk disclaimer               │ │
│                     │ │                                                │ │
│                     │ │ ⚠️ Suggested Improvements:                      │ │
│                     │ │ • Change to "potential tax benefits"           │ │
│                     │ │ • Add "subject to market risks"                │ │
│                     │ │ • Include tax consultation disclaimer           │ │
│                     │ │                                                │ │
│                     │ │ 📝 Auto-Fix Available                          │ │
│                     │ │ [Apply Suggestions] [Manual Edit]              │ │
│                     │ └────────────────────────────────────────────────┘ │
│                     │                                                    │
│                     │ 💬 Review Decision                                  │
│                     │ ┌────────────────────────────────────────────────┐ │ <- Decision Panel
│                     │ │ ○ Approve with modifications                   │ │   (150px)
│                     │ │ ○ Request advisor revision                     │ │
│                     │ │ ○ Reject (compliance violation)               │ │
│                     │ │ ○ Escalate to senior reviewer                 │ │
│                     │ │                                                │ │
│                     │ │ 📝 Feedback for Advisor:                       │ │
│                     │ │ ┌──────────────────────────────────────────┐   │ │
│                     │ │ │ Please remove guaranteed language...     │   │ │
│                     │ │ └──────────────────────────────────────────┘   │ │
│                     │ │                                                │ │
│                     │ │ [Cancel] [Save Decision] [Submit Review]       │ │
│                     │ └────────────────────────────────────────────────┘ │
├─────────────────────┴────────────────────────────────────────────────────┤
│ ⏱️ Review Time: 4:23    📋 Advisor Education    🔄 Previous/Next Review   │ <- Modal Footer
└──────────────────────────────────────────────────────────────────────────┘
```

### Mobile Admin Queue (Simplified)
```
┌─────────────────────────────────────┐
│ ← Admin    Queue (23)    ⚙️  🔄     │ <- Simplified header
├─────────────────────────────────────┤
│ [High Risk] [Standard] [Auto] ···   │ <- Tab navigation
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │ <- Mobile queue item
│ │ 🚨 85  Priya S.  2h ago        │ │   (100px each)
│ │ Market Crash Opportunity        │ │
│ │ ⚠️ "guaranteed tax savings"     │ │
│ │ [Review →]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚡ 45  Raj K.  1h ago           │ │
│ │ Weekly SIP Benefits Guide       │ │
│ │ ✅ All checks passed            │ │
│ │ [Quick ✓] [Review →]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Load More (18 remaining)            │
│                                     │
│ [Home] [Queue] [Reports] [Settings] │ <- Bottom nav
└─────────────────────────────────────┘
```

### Design Rationale
- **Context-Rich Design**: Advisor history and context speed up review decisions
- **Risk-First Organization**: High-risk content surfaced first for safety
- **Batch Operations**: Efficient bulk actions for standard-risk content
- **Mobile Accessibility**: Simplified mobile interface for urgent reviews

## 4. Analytics Dashboard Layout

### Mobile Analytics (Primary Focus)
```
┌─────────────────────────────────────┐
│ ← Back    Analytics    [Export]     │
├─────────────────────────────────────┤
│ 📊 This Week Overview               │ <- Time selector
│ [Week] [Month] [Quarter]            │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │ <- Key metrics cards
│ │ 📈 Engagement Rate              │ │   (80px each)
│ │ 78% ↗️ +12%                     │ │
│ │ Above peer average              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎯 Delivery Success             │ │
│ │ 98.2% ✅                        │ │
│ │ 156/159 successful              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🛡️ Compliance Score             │ │
│ │ 94/100 🟢                       │ │
│ │ Zero violations                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📈 Engagement Trend                 │ <- Chart section
│ ┌─────────────────────────────────┐ │   (200px)
│ │     ●●●                         │ │
│ │   ●●   ●●                       │ │
│ │ ●●       ●●●                    │ │
│ │                                 │ │
│ │ Mon Tue Wed Thu Fri Sat Sun     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🏆 Top Performing Content           │ <- Content insights
│ ┌─────────────────────────────────┐ │   (120px each)
│ │ SIP Planning Guide              │ │
│ │ 87% read rate • 23% responses   │ │
│ │ Best in category               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Home] [Create] [Library] [Stats] [Profile]
└─────────────────────────────────────┘
```

### Desktop Analytics Dashboard
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Analytics Dashboard         [Week ▼] [Month ▼] [Export] [Compare Peers]  │ <- Header with controls
├─────────────────┬────────────────────────────────────────────────────────┤
│ Quick Insights  │ Performance Overview                                    │
│                 │                                                        │
│ 📈 Key Metrics  │ ┌────────────┬────────────┬────────────┬─────────────┐ │ <- Metrics Grid
│ • 78% Engage    │ │ Engagement │ Delivery   │ Compliance │ Growth      │ │   (140px each)
│ • 98% Delivery  │ │ 78% ↗️+12% │ 98.2% ✅   │ 94/100 🟢  │ +15% MoM    │ │
│ • 94 Compliance │ │ Above avg  │ On target  │ Zero issues│ Top quartile│ │
│ • +15% Growth   │ └────────────┴────────────┴────────────┴─────────────┘ │
│                 │                                                        │
│ 🏆 Achievements │ ┌─────────────────────────────────────────────────────┐ │ <- Main Chart Area
│ • Zero violations│ │ 📊 Engagement Trends (7 days)                      │ │   (300px)
│ • 30-day streak │ │                                                     │ │
│ • Top 10% tier  │ │     ●●●                                             │ │
│                 │ │   ●●   ●●     ▲ Peak: Thursday 6:30 AM             │ │
│ 📋 Quick Actions│ │ ●●       ●●●   📱 Mobile: 73% of opens             │ │
│ • Export report │ │                                                     │ │
│ • Schedule email│ │ Mon  Tue  Wed  Thu  Fri  Sat  Sun                   │ │
│ • Compare peers │ │                                                     │ │
│ • Set alerts    │ └─────────────────────────────────────────────────────┘ │
│                 │                                                        │
│ 🔄 Data Refresh │ ┌──────────────────────┬──────────────────────────────┐ │ <- Content Analysis
│ Last: 2 min ago │ │ 🏆 Top Content       │ 📝 Content Insights          │ │   (200px each)
│ Next: 8 min     │ │                      │                              │ │
│                 │ │ 1. SIP Planning      │ • Best time: Thu 6:30 AM     │ │
│                 │ │    87% read rate     │ • Optimal length: 180 chars  │ │
│                 │ │                      │ • Top topic: Market updates  │ │
│                 │ │ 2. Tax Strategies    │ • Language: Hindi +25% eng   │ │
│                 │ │    82% read rate     │ • Images boost engagement    │ │
│                 │ │                      │   by 34%                     │ │
│                 │ │ 3. Market Updates    │ • Questions get 3x responses │ │
│                 │ │    79% read rate     │ • Seasonal topics perform    │ │
│                 │ │                      │   40% better                 │ │
│                 │ └──────────────────────┴──────────────────────────────┘ │
├─────────────────┴────────────────────────────────────────────────────────┤
│ 💡 AI Recommendations: Try Hindi content on weekends • Add more questions • Schedule at 6:30 AM │
└──────────────────────────────────────────────────────────────────────────┘
```

### Design Rationale
- **Insight-Driven**: Focus on actionable insights rather than raw data
- **Peer Comparison**: Benchmarking motivates improvement
- **Mobile Optimization**: Key metrics accessible on mobile for quick checks
- **AI Guidance**: Machine learning recommendations for content optimization

## 5. Settings & Configuration Layout

### Mobile Settings Interface
```
┌─────────────────────────────────────┐
│ ← Back    Settings               ⚙️ │
├─────────────────────────────────────┤
│                                     │
│ 👤 Profile & Account                │ <- Section headers
│ ┌─────────────────────────────────┐ │   (56px each)
│ │ Raj Kumar                    >  │ │
│ │ raj.kumar@example.com           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📱 WhatsApp Integration             │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Connected: +91 98765 43210  │ │
│ │ Last sync: 2 minutes ago    >  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🎨 Content Preferences              │
│ ┌─────────────────────────────────┐ │
│ │ Language: English, Hindi    >  │ │
│ │ Tone: Professional          >  │ │
│ │ Send time: 06:00 IST        >  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🛡️ Compliance & Privacy             │
│ ┌─────────────────────────────────┐ │
│ │ SEBI Registration           >  │ │
│ │ Data retention settings     >  │ │
│ │ Privacy preferences         >  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 💳 Billing & Subscription           │
│ ┌─────────────────────────────────┐ │
│ │ Standard Plan               >  │ │
│ │ ₹5,999/month • Renews Mar 15   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Home] [Create] [Library] [Stats] [Profile]
└─────────────────────────────────────┘
```

### WhatsApp Configuration Detail
```
┌─────────────────────────────────────┐
│ ← Settings    WhatsApp    [Test]    │
├─────────────────────────────────────┤
│                                     │
│ 📱 Connection Status                │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Connected & Verified         │ │
│ │ +91 98765 43210                 │ │
│ │ Business Account: Active        │ │
│ │ Last health check: 2 min ago    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⏰ Delivery Settings                │
│ ┌─────────────────────────────────┐ │
│ │ Default time: [06:00] IST       │ │ <- Time picker
│ │ Weekend delivery: ☑️ Enabled    │ │ <- Toggle
│ │ Holiday delivery: ☐ Disabled    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🎯 Client Management                │
│ ┌─────────────────────────────────┐ │
│ │ Auto-add new clients: ☑️        │ │
│ │ Group management: [Configure]   │ │
│ │ Opt-out handling: [Automatic]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🔧 Advanced Options                 │
│ ┌─────────────────────────────────┐ │
│ │ Webhook URL: [Auto-configured]  │ │
│ │ Message format: [Template]      │ │
│ │ Retry attempts: [3] max         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🧪 Test Connection                  │
│ ┌─────────────────────────────────┐ │
│ │ Send test message to yourself   │ │
│ │ [Send Test Message]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [Save Changes]              │
└─────────────────────────────────────┘
```

### Design Rationale
- **Grouped Organization**: Related settings grouped logically
- **Status Visibility**: Connection and configuration status always clear
- **Progressive Disclosure**: Basic settings first, advanced options available
- **Test Capabilities**: Easy testing reduces support burden

## 6. Common UI Patterns

### Loading States
```yaml
loading_patterns:
  content_generation:
    pattern: "Progress bar with descriptive text"
    example: "⚡ Generating content... █████████░ 80%"
    duration: "3-5 seconds typical"
    
  compliance_analysis:
    pattern: "Spinner with status updates"
    example: "🛡️ Analyzing compliance..."
    duration: "1-2 seconds"
    
  data_sync:
    pattern: "Pulse animation with timestamp"
    example: "🔄 Syncing... Last updated 2 min ago"
    duration: "Variable"
```

### Error States
```yaml
error_patterns:
  validation_errors:
    pattern: "Inline error with suggestion"
    example: "⚠️ Missing risk disclaimer. [Add automatically]"
    color: "amber"
    
  system_errors:
    pattern: "Error card with retry action"
    example: "❌ Content generation failed. [Try again]"
    color: "red"
    
  network_errors:
    pattern: "Banner with offline capability"
    example: "📡 Connection lost. Working offline."
    color: "gray"
```

### Success States
```yaml
success_patterns:
  content_approved:
    pattern: "Success card with next steps"
    example: "✅ Content approved! Scheduled for 6:00 AM tomorrow."
    color: "green"
    
  delivery_confirmed:
    pattern: "Status update with metrics"
    example: "📱 Delivered to 47 clients. 12 read so far."
    color: "blue"
    
  configuration_saved:
    pattern: "Toast notification"
    example: "⚙️ Settings saved successfully"
    color: "green"
```

### Empty States
```yaml
empty_state_patterns:
  new_user_onboarding:
    pattern: "Welcome card with clear next step"
    example: "👋 Welcome! Let's create your first content piece."
    action: "[Get Started]"
    
  empty_content_library:
    pattern: "Illustration with multiple options"
    example: "📚 Your library is empty. Create content or browse templates."
    actions: "[Create] [Browse Templates]"
    
  no_analytics_data:
    pattern: "Informational card with timeline"
    example: "📊 Analytics available after first delivery. Check back tomorrow!"
    timeline: "Available in: 18 hours"
```

## 7. Responsive Behavior Specifications

### Breakpoint Transitions
```yaml
transition_behaviors:
  mobile_to_tablet:
    navigation: "Bottom tabs → Side tabs + drawer"
    content: "Single column → Two column"
    actions: "FAB → Toolbar buttons"
    
  tablet_to_desktop:
    navigation: "Drawer → Persistent sidebar"
    content: "Two column → Three column with panels"
    actions: "Touch → Mouse hover states"
```

### Touch Interactions
```yaml
touch_patterns:
  swipe_actions:
    content_cards: "Swipe right: approve, left: actions"
    navigation: "Swipe from edge: back navigation"
    
  long_press:
    content_selection: "Multi-select mode activation"
    preview: "Quick preview without navigation"
    
  pull_to_refresh:
    dashboards: "Refresh data and sync status"
    lists: "Load latest content and updates"
```

### Accessibility Adaptations
```yaml
accessibility_features:
  high_contrast:
    pattern: "Alternative color scheme with 7:1 contrast ratio"
    toggle: "Available in settings → accessibility"
    
  large_text:
    behavior: "UI scales proportionally up to 200%"
    minimum: "16px base, 44px touch targets maintain"
    
  screen_reader:
    navigation: "Proper heading hierarchy and landmarks"
    dynamic_content: "Live regions for status updates"
    
  keyboard_navigation:
    focus_order: "Logical tab order through interactive elements"
    shortcuts: "Standard shortcuts plus custom productivity keys"
```

This comprehensive layout specification provides the foundation for building a professional, efficient, and accessible financial advisor platform that serves both mobile-first advisors and desktop-focused administrators while maintaining strict SEBI compliance standards.