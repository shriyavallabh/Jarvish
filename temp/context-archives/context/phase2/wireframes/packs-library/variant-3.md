# Packs Library - Variant 3: Kanban Board View

## ASCII Wireframe (Mobile-First)

```
┌─────────────────────────────────────┐
│ ← Library     📋 Kanban      ⚙️     │ <- Header
├─────────────────────────────────────┤
│ [Drafts] [Review] [Ready] [Active]  │ <- Status Columns (Swipe)
├─────────────────────────────────────┤
│                                     │
│ 📝 DRAFTS (3)                       │ <- Current Column
│ ┌─────────────────────────────────┐ │
│ │ 📈 Market Volatility            │ │ <- Card (120px)
│ │ 🛡️ 96/100 • ⏰ Due tomorrow     │ │
│ │ [✏️ Edit] [👁️ Preview]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏦 Insurance Planning           │ │
│ │ 🛡️ 73/100 • ⚠️ Issues           │ │
│ │ [🔧 Fix] [📋 Review]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ + Add New Draft                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ← Swipe for Review (2) →            │ <- Navigation Hint
│                                     │
│ [🏠] [➕] [📚] [📊] [👤]            │ <- Bottom Nav
└─────────────────────────────────────┘
```

## Desktop Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Content Library - Workflow View     🔍 Search...    [+ New Content] [⚙️]  │ <- Header
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐  │ <- Kanban Columns
│ │📝 DRAFTS(3) │⚠️ REVIEW(2) │✅ READY(4)  │🚀 ACTIVE(6) │📊 DONE(12) │  │   (240px each)
│ ├─────────────┤─────────────┤─────────────┤─────────────┤─────────────┤  │
│ │┌───────────┐│┌───────────┐│┌───────────┐│┌───────────┐│┌───────────┐│  │
│ ││📈 Market  ││││🏛️ Tax    ││││💰 SIP    ││││📊 ELSS   ││││📚 MF     ││  │ <- Content Cards
│ ││Volatility ││││Planning  ││││Planning  ││││Benefits  ││││Basics    ││  │   (100px each)
│ ││           ││││          ││││Guide     ││││Explained ││││Template  ││  │
│ ││🛡️96/100   ││││🛡️85/100  ││││🛡️91/100  ││││🛡️98/100  ││││⭐Popular ││  │
│ ││⏰Tomorrow ││││⚠️Issues  ││││📅Dec 10  ││││👥52 sent ││││234 uses  ││  │
│ ││[Edit][👁️] ││││[Fix][📋] ││││[Send][📱]││││📊76% read││││[Use][📋] ││  │
│ │└───────────┘││└───────────┘││└───────────┘││└───────────┘││└───────────┘││  │
│ ││           ││││           ││││           ││││           ││││           ││  │
│ ││┌───────────┐│││┌───────────┐│││┌───────────┐│││┌───────────┐│││┌───────────┐││  │
│ │││🏦 Insur   ││││📈 Market ││││⚖️ Portfolio│││🎯 Goals  ││││💳 Credit ││  │
│ │││Planning  ││││Update    ││││Rebalance ││││Setting   ││││Cards     ││  │
│ │││          ││││          ││││          ││││          ││││          ││  │
│ │││🛡️73/100  ││││🛡️78/100  ││││🛡️88/100  ││││🛡️94/100  ││││🛡️91/100  ││  │
│ │││⚠️Issues  ││││📅Pending ││││📋Dec 15  ││││✅Active  ││││📅Nov 30  ││  │
│ │││[Fix][📋] ││││[Review]  ││││[Edit][⏰]││││[View][📊]││││[Archive] ││  │
│ ││└───────────┘│││└───────────┘│││└───────────┘│││└───────────┘│││└───────────┘││  │
│ ││           ││││           ││││           ││││           ││││           ││  │
│ ││┌───────────┐│││           ││││┌───────────┐│││┌───────────┐│││┌───────────┐││  │
│ │││🌟 Wealth  ││││           ││││📱 Mobile  ││││💼 Retire  ││││📈 Invest ││  │
│ │││Building   ││││           ││││Strategy   ││││Planning   ││││Strategy  ││  │
│ │││           ││││           ││││           ││││           ││││          ││  │
│ │││🛡️-/100    ││││           ││││🛡️89/100   ││││🛡️92/100   ││││🛡️88/100  ││  │
│ │││📝Draft    ││││           ││││📅Dec 12   ││││👥33 sent  ││││📅Nov 25  ││  │
│ │││[Complete] ││││           ││││[Preview]  ││││📊85% read ││││[Restore] ││  │
│ ││└───────────┘│││           ││││└───────────┘│││└───────────┘│││└───────────┘││  │
│ ││           ││││           ││││           ││││           ││││           ││  │
│ ││[+ Add]    ││││[+ Add]    ││││[+ Add]    ││││[+ Add]    ││││[+ View All]││  │
│ │└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Design Rationale

### Layout Approach: **Kanban Board View**
This variant organizes content by workflow status, emphasizing visual progress tracking and drag-and-drop workflow management.

### Key Design Decisions:

1. **Workflow-Centric Organization**
   - Clear visual representation of content pipeline
   - Drag-and-drop between status columns
   - Progress tracking through visual positioning

2. **Status-Based Columns**
   - Drafts, Review, Ready, Active, Done workflow stages
   - Column headers show count for workload awareness
   - Color coding for quick status identification

3. **Card-Based Content Representation**
   - Essential information in compact card format
   - Visual drag handles for interaction
   - Context-specific actions based on status

4. **Visual Workflow Management**
   - Clear bottlenecks visible at a glance
   - Workload distribution across team members
   - Pipeline health monitoring

### SEBI Compliance Features:
- Compliance scores on each content card
- Review status clearly marked
- Risk assessment visible in workflow
- Compliance bottlenecks easily identified

## Motion & Micro-interactions

### Kanban Board Interface
```yaml
kanban_load:
  duration: "800ms"
  sequence:
    - header: "slide-down (0ms)"
    - column_headers: "slide-in from top (200ms)"
    - cards: "staggered slide-up by column (400ms, 100ms between cards)"
    - navigation_hints: "fade-in (700ms)"

card_interactions:
  drag_and_drop:
    pickup:
      duration: "150ms"
      transforms:
        - "card: scale 1 to 1.05 with shadow increase"
        - "rotate: 2deg tilt for natural feel"
    
    dragging:
      duration: "continuous"
      animation:
        - "card: follow cursor with smooth interpolation"
        - "drop-zones: highlight compatible columns"
        - "placeholder: fade-in ghost card in original position"
    
    drop:
      duration: "300ms"
      animation:
        - "card: smooth settle into new position"
        - "column-reflow: adjust card positions"
        - "status-update: badge transition animation"

column_navigation:
  mobile_swipe:
    duration: "400ms"
    animation:
      - "columns: horizontal slide with momentum"
      - "active-column: highlight indicator"
      - "card-focus: fade non-active columns"
  
  desktop_scroll:
    duration: "200ms"
    animation:
      - "smooth-scroll: between column sections"
      - "column-highlighting: active column emphasis"

workflow_animations:
  status_progression:
    duration: "500ms"
    animation:
      - "card-border: color transition based on new status"
      - "progress-indicator: stage advancement"
      - "compliance-badge: update with new score"
  
  bottleneck_indicators:
    duration: "1000ms"
    animation:
      - "overloaded-column: subtle warning pulse"
      - "card-count: attention-drawing color change"

kanban_optimizations:
  smooth_interactions: "60fps drag and drop"
  reduced_motion: "maintain essential status transitions"
  touch_optimization: "enhanced touch targets for mobile"
```