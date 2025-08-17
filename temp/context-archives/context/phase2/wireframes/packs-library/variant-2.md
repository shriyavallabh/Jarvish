# Packs Library - Variant 2: Table List View

## ASCII Wireframe (Mobile-First)

```
┌─────────────────────────────────────┐
│ ← Library        📊 List     ⚙️     │ <- Header with View Toggle
├─────────────────────────────────────┤
│ 🔍 Search... [📅] [🏷️] [📊] [⚙️]   │ <- Search with Quick Filters
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │ <- Content List Items
│ │ 📈 Market Volatility Guide      │ │   (80px each)
│ │ ⚠️ Pending Review • 📅 Dec 11   │ │
│ │ 🛡️ 96/100 • 👥 Draft           │ │
│ │ [✏️ Edit] [👁️ Preview] [📱]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💰 SIP Planning Guide           │ │
│ │ ✅ Ready to Send • 📅 Dec 10    │ │
│ │ 🛡️ 91/100 • 👥 45 sent • 82%   │ │
│ │ [🔄 Reuse] [📊 Stats] [📤]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏛️ Tax Planning 2024            │ │
│ │ ✅ Published • 📅 Dec 9         │ │
│ │ 🛡️ 94/100 • 👥 41 sent • 89%   │ │
│ │ [📋 Clone] [📊 View] [📤]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📊 ELSS Benefits Explained      │ │
│ │ ✅ Active • 📅 Dec 8            │ │
│ │ 🛡️ 98/100 • 👥 52 sent • 76%   │ │
│ │ [✏️ Edit] [📤 Share] [⭐]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ▼ Show 8 more items                 │ <- Expandable List
│                                     │
│ [🏠] [➕] [📚] [📊] [👤]            │ <- Bottom Nav
└─────────────────────────────────────┘
```

## Desktop Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Content Library    🔍 Search...    [📊 List] [⬜ Grid]   [+ New] [Export] │ <- Header with View Toggle
├─────────┬────────────────────────────────────────────────────────────────┤
│ FILTERS │ ┌─ SORT & FILTERS ──────────────────────────────────────────┐ │ <- Quick Filters Bar
│         │ │ Sort: [Latest ▼] Type: [All ▼] Status: [All ▼] [Clear]   │ │
│ 📅 Date │ └───────────────────────────────────────────────────────────┘ │
│ ○ Today │                                                              │
│ ○ Week  │ ┌─ CONTENT LIST ─────────────────────────────────────────────┐ │ <- Table Header
│ ● Month │ │ Title                    Status      Date    Engagement   │ │
│ ○ All   │ ├─────────────────────────────────────────────────────────────┤ │
│         │ │ 📈 Market Volatility     ⚠️ Pending  Dec 11  Draft        │ │ <- Table Rows
│ 📊 Type │ │    Guide                 Review              (96/100)     │ │   (60px each)
│ ● All   │ │    [Edit] [Preview] [Mobile Preview] [Delete]             │ │
│ ○ Text  │ ├─────────────────────────────────────────────────────────────┤ │
│ ○ Image │ │ 💰 SIP Planning Guide    ✅ Ready    Dec 10  45 sent      │ │
│ ○ Video │ │                                              82% read     │ │
│         │ │    [Reuse] [Analytics] [Share] [Archive]                  │ │
│ 🎯 Goal │ ├─────────────────────────────────────────────────────────────┤ │
│ ○ Lead  │ │ 🏛️ Tax Planning 2024     ✅ Active   Dec 9   41 sent      │ │
│ ○ Edu   │ │                                              89% read     │ │
│ ○ News  │ │    [Clone] [View Details] [Edit] [Deactivate]             │ │
│ ● All   │ ├─────────────────────────────────────────────────────────────┤ │
│         │ │ 📊 ELSS Benefits         ✅ Published Dec 8  52 sent      │ │
│ 📈 Perf │ │    Explained                                76% read     │ │
│ ● High  │ │    [Edit] [Share] [Favorite] [Archive]                    │ │
│ ○ Med   │ ├─────────────────────────────────────────────────────────────┤ │
│ ○ Low   │ │ 📚 Mutual Fund Basics    📚 Template Popular 234 uses    │ │
│         │ │                          Premium           (95/100)     │ │
│ 🛡️ Risk │ │    [Use Template] [Customize] [Preview] [Favorite]        │ │
│ ● Low   │ ├─────────────────────────────────────────────────────────────┤ │
│ ○ Med   │ │ ⚖️ Portfolio             📋 Scheduled Dec 15 High Impact  │ │
│ ○ High  │ │    Rebalancing                                (88/100)    │ │
│         │ │    [Preview] [Reschedule] [Edit] [Cancel]                 │ │
│ [Clear] │ ├─────────────────────────────────────────────────────────────┤ │
│         │ │ 🏦 Retirement Planning   📝 Draft     Dec 16 Incomplete   │ │
│         │ │                                              (73/100)     │ │
│         │ │    [Complete] [Review] [Auto-Fix] [Delete]                │ │
│         │ ├─────────────────────────────────────────────────────────────┤ │
│         │ │ 🌟 Insurance Planning    📝 Draft     Dec 16 Needs Review │ │
│         │ │                                              (73/100)     │ │
│         │ │    [Review] [Fix Issues] [Get Help] [Delete]              │ │
│         │ └─────────────────────────────────────────────────────────────┘ │
│         │                                                              │
│         │ [◀ Previous] Page 1 of 4 [Next ▶] [Show: 10 ▼] [Export All] │ <- Pagination
└─────────┴──────────────────────────────────────────────────────────────┘
```

## Design Rationale

### Layout Approach: **Table List View**
This variant presents content as a structured data table, emphasizing information density and systematic comparison between content pieces.

### Key Design Decisions:

1. **Information-Dense Layout**
   - Tabular format allows quick comparison of multiple content pieces
   - Essential metadata visible at a glance without clicking
   - Sortable columns enable different organizational perspectives

2. **Systematic Data Organization**
   - Consistent column structure for predictable information location
   - Sortable headers allow custom organization by any field
   - Bulk selection enables efficient batch operations

3. **Action-Rich Interface**
   - Context-specific actions based on content status
   - Quick access to common operations without navigation
   - Inline editing capabilities for rapid updates

4. **Efficient Screen Utilization**
   - Maximum information visible per screen
   - Pagination handles large content libraries efficiently
   - Collapsible filters preserve content viewing space

5. **Professional Workflow Design**
   - Spreadsheet-like interface familiar to business users
   - Advanced filtering and sorting capabilities
   - Export functionality for external analysis

### SEBI Compliance Features:
- Compliance scores visible in dedicated column
- Status indicators show approval workflow state
- Risk level filtering for compliance management
- Bulk compliance review actions available

### Accessibility Considerations:
- Proper table headers for screen reader navigation
- Keyboard navigation through table rows
- Clear action button labeling
- Sortable columns with appropriate ARIA labels

### Mobile Performance:
- Condensed list view maintains essential information
- Touch-friendly action buttons
- Expandable rows reveal additional details
- Horizontal scrolling for full table access

## Motion & Micro-interactions

### Table List Interface
```yaml
table_list_load:
  duration: "700ms"
  sequence:
    - header: "slide-down (0ms)"
    - search_filters: "slide-in from left (150ms)"
    - table_header: "fade-in with professional confidence (250ms)"
    - list_items: "staggered slide-up (400ms, 80ms between rows)"
    - pagination: "fade-in from bottom (600ms)"
  accessibility:
    - "reduced-motion: instant appearance with opacity transitions"

list_item_interactions:
  row_hover:
    duration: "150ms"
    transforms:
      - "background: subtle primary tint"
      - "left-border: 3px solid primary"
      - "action-buttons: opacity 0.7 to 1"
  
  row_selection:
    duration: "200ms"
    transforms:
      - "background: primary selection color"
      - "checkbox: checkmark draw-in"
      - "scale: 1 to 1.01 briefly"

status_indicators:
  compliance_score:
    duration: "600ms"
    animation:
      - "score-badge: count-up with color transition"
      - "shield-icon: confidence pulse"
  
  approval_status:
    pending:
      duration: "1000ms"
      animation:
        - "pending-badge: gentle pulse"
        - "warning-glow: subtle amber breathing"
    
    approved:
      duration: "300ms"
      animation:
        - "checkmark: draw-in with success color"
        - "approved-badge: confidence scale-in"

sorting_filtering:
  column_sort:
    duration: "400ms"
    animation:
      - "sort-arrow: rotate and highlight"
      - "rows: smooth reorder animation"
      - "loading-shimmer: during sort processing"
  
  filter_application:
    duration: "500ms"
    animation:
      - "filtered-rows: fade-out non-matching"
      - "matching-rows: highlight and reposition"
      - "result-count: update with bounce"

table_optimizations:
  virtual_scrolling: "animate only visible rows"
  batch_updates: "smooth transitions for bulk operations"
  reduced_motion: "maintain sort indicators and status updates"
```