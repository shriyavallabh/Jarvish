# Pack Composer - Variant 1: Step-by-Step Wizard

## ASCII Wireframe

### Mobile Layout (320px+)
```
┌─────────────────────────────────────┐
│ ← Pack Composer        [Save] [⋯] │
├─────────────────────────────────────┤
│ Step 2 of 4: Content Creation      │
│ ████████████████░░░░░░░░░░░░░░░░░░   │
├─────────────────────────────────────┤
│                                     │
│ 📝 Content Topic                    │
│ [Market Update ▼]                   │
│                                     │
│ 🤖 AI Assistance Level              │
│ ○ Minimal ● Standard ○ Enhanced     │
│                                     │
│ 📊 Compliance Score: 94/100 ✅      │
│ [View Details]                      │
│                                     │
│ ┌─── Content Preview ───────────────┐│
│ │ Good morning! Today's market...   ││
│ │                                   ││
│ │ [WhatsApp] [LinkedIn] [Email]     ││
│ └───────────────────────────────────┘│
│                                     │
│ 🎨 Visual Assets                    │
│ [+ Add Image] [+ Add Chart]         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [← Previous]      [Next Step →] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Desktop Layout (1024px+)
```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ ← Pack Composer                                            [Save Draft] [Preview] [⋯] │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ Step 2 of 4: Content Creation                                                          │
│ ████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
├─────────────────────────────────┬───────────────────────────────────────────────────────┤
│                                 │                                                       │
│ 📝 Content Settings              │ 📱 Live Preview                                      │
│                                 │                                                       │
│ Topic Category                  │ ┌─── WhatsApp Preview ─────────────────────────────┐ │
│ [Market Update ▼]               │ │ 📱 Advisor Name                              6:00 │ │
│                                 │ │                                                   │ │
│ Language                        │ │ Good morning! Here's today's market update:      │ │
│ [English ▼]                     │ │                                                   │ │
│                                 │ │ Nifty opened strong at 19,850 points...         │ │
│ 🤖 AI Assistance                │ │                                                   │ │
│ ○ Minimal                       │ │ [📊 Market Chart Image]                          │ │
│ ● Standard                      │ │                                                   │ │
│ ○ Enhanced                      │ │ Disclaimer: This is for informational...         │ │
│                                 │ │                                                   │ │
│ 📊 Real-time Compliance         │ │ ✓ Read                                            │ │
│ Score: 94/100 ✅                │ └───────────────────────────────────────────────────┘ │
│ ┌─ Details ─────────────────────┐│                                                       │
│ │ ✅ SEBI Disclaimers Present    ││ ┌─── LinkedIn Preview ─────────────────────────────┐ │
│ │ ⚠️  Performance Data Warning   ││ │ 💼 Professional Network View                     │ │
│ │ ✅ Language Appropriateness    ││ │                                                   │ │
│ └───────────────────────────────┘│ │ Market insights for today...                     │ │
│                                 │ │                                                   │ │
│ 🎨 Visual Assets                │ │ #MarketUpdate #FinancialPlanning                 │ │
│ [+ Add Image] [+ Add Chart]     │ └───────────────────────────────────────────────────┘ │
│ [+ Brand Logo] [+ Disclaimer]   │                                                       │
│                                 │                                                       │
│ ┌─────────────────────────────┐ │ ┌─────────────────────────────────────────────────┐ │
│ │ [← Step 1: Setup]           │ │ │ [Save & Continue to Step 3: Review →]          │ │
│ └─────────────────────────────┘ │ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────┴───────────────────────────────────────────────────────┘
```

## Design Rationale

### Layout Philosophy
**Step-by-Step Wizard approach** breaks down complex content creation into manageable, sequential steps. This reduces cognitive load for advisors who may be creating multiple content packs daily while ensuring all compliance requirements are met.

### Key Design Decisions

1. **Progress Indicator**: Clear visual progress bar shows completion status and builds confidence
2. **Real-time Compliance**: Immediate feedback on SEBI compliance reduces anxiety and prevents downstream issues
3. **Live Preview**: Side-by-side preview shows exactly how content will appear across platforms
4. **AI Assistance Levels**: Clear options allow advisors to choose appropriate automation level
5. **Platform-Specific Previews**: WhatsApp and LinkedIn previews ensure platform-appropriate content

### Mobile-First Considerations
- Single-column layout prevents information overload
- Large touch targets (44px minimum)
- Preview sections stack vertically
- Simplified navigation with clear next/previous steps

### Accessibility Features
- High contrast compliance indicators
- Screen reader friendly progress announcements
- Keyboard navigation between form elements
- Clear visual hierarchy with consistent spacing

### SEBI Compliance Integration
- Prominent compliance score display
- Real-time violation detection
- Required disclaimer integration
- Audit trail capture for regulatory reporting

## Motion & Micro-interactions

### Page Load Animation (800ms)
- Progress bar animates from 0% to current step completion
- Form elements fade in with 100ms stagger
- Compliance score counter animates to current value

### Real-time Feedback (300ms)
- Compliance score updates with smooth number transitions
- Validation icons appear with gentle scale animation
- Preview panels update with 200ms fade transition

### Navigation Transitions (400ms)
- Step progression with slide animation
- Form validation with subtle shake for errors
- Success states with green checkmark animation

### AI Assistance Feedback (600ms)
- AI level selection with smooth radio button transitions
- Content suggestions appear with staggered fade-in
- Processing indicators with subtle pulse animation

### Accessibility Motion
- Respects `prefers-reduced-motion` setting
- Alternative static feedback for motion-sensitive users
- High contrast mode maintains visual feedback hierarchy