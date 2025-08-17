# Project One - Resolved Execution DAG

## Execution Graph with File Dependencies

```
┌─────────────────── PHASE 1: UX RESEARCH (Parallel) ──────────────────┐
│                                                                       │
│  ┌─ design/compliance-ux-researcher ─┐                               │
│  │   Max Context: 180K tokens        │                               │
│  │   Outputs: 6 UX flow files        │────────────┐                  │
│  └───────────────────────────────────┘            │                  │
│                                                    │                  │
│  ┌─ eng/rapid-prototyper ─────────────┐            │                  │
│  │   Max Context: 120K tokens        │            │                  │
│  │   Outputs: sprint plan, user stories │          │                  │
│  └───────────────────────────────────┘            │                  │
│                                                    │                  │
│  ┌─ domain/data-modeler ──────────────┐            │                  │
│  │   Max Context: 100K tokens        │            │                  │
│  │   Outputs: data schemas            │            │                  │
│  └───────────────────────────────────┘            │                  │
└───────────────────────────────────────────────────┼──────────────────┘
                                                     │
┌─────────────────── PHASE 2: UI DESIGN (Sequential → Parallel) ───────┼──┐
│                                                    │                  │  │
│  ┌─ design/fintech-ui-designer ───────┐ ◄──────────┘                  │  │
│  │   Max Context: 160K tokens         │                               │  │
│  │   Reads: UX flows, compliance       │                               │  │
│  │   Outputs: design system, components │───────────┐                  │  │
│  └────────────────────────────────────┘           │                  │  │
│                         │                         │                  │  │
│                         └────────┐                │                  │  │
│                                  ▼                │                  │  │
│  ┌─ design/whimsy-injector ──────────┐            │                  │  │
│  │   Max Context: 80K tokens      ◄──┘            │                  │  │
│  │   Outputs: micro-interactions      │            │                  │  │
│  └────────────────────────────────────┘            │                  │  │
└────────────────────────────────────────────────────┼──────────────────┘  │
                                                     │                     │
┌─────────────────── PHASE 3: FRONTEND DEV (Serial) ─┼─────────────────────┘
│                                                    │                     
│  ┌─ eng/nextjs-dashboard-developer ───┐ ◄──────────┘                     
│  │   Max Context: 190K tokens         │                                  
│  │   Reads: design system + UX flows  │                                  
│  │   Outputs: 7 React components      │────────────┐                     
│  └────────────────────────────────────┘            │                     
└────────────────────────────────────────────────────┼─────────────────────┘
                                                     │
┌─────────────────── PHASE 4: BACKEND & AI (3-Wave Parallel) ────────────┼──┐
│                                                    │                   │  │
│  WAVE 1: Backend Foundation (Serial)              │                   │  │
│  ┌─ eng/backend-dev ───────────────────┐ ◄─────────┘                   │  │
│  │   Max Context: 200K tokens          │                               │  │
│  │   Outputs: build-plan.md           │────┬──────────────┬─────────────┼──┤
│  └─────────────────────────────────────┘    │              │             │  │
│                                             │              │             │  │
│  WAVE 2: AI & WhatsApp (Parallel)           │              │             │  │
│  ┌─ eng/ai-compliance-engine-dev ─────┐ ◄───┘              │             │  │
│  │   Max Context: 180K tokens         │                    │             │  │
│  │   Outputs: compliance engine (7 files) │──┬──────────────┼─────────────┼──┤
│  └───────────────────────────────────┘    │              │             │  │
│                                           │              │             │  │
│  ┌─ eng/whatsapp-api-specialist ──────┐ ◄─┘              │             │  │
│  │   Max Context: 170K tokens         │                  │             │  │
│  │   Outputs: WhatsApp integration (7 files) │───────────┼─────────────┼──┤
│  └───────────────────────────────────┘                  │             │  │
│                                                          │             │  │
│  WAVE 3: Analytics & Audit (Parallel)                   │             │  │
│  ┌─ domain/analytics-intelligence-dev ┐ ◄────────────────┘             │  │
│  │   Max Context: 190K tokens         │                               │  │
│  │   Outputs: ML analytics system (7 files) │───────────────────────────┼──┤
│  └───────────────────────────────────┘                               │  │
│                                                                       │  │
│  ┌─ domain/sebi-compliance-auditor ───┐ ◄─────────────────────────────┼──┘
│  │   Max Context: 150K tokens         │                               │
│  │   Outputs: audit framework (7 files) │                             │
│  └───────────────────────────────────┘                               │
│                                                                       │
│  ┌─ domain/fallback-system-architect ─┐ ◄─────────────────────────────┘
│  │   Max Context: 140K tokens         │                                
│  │   Outputs: fallback system (7 files) │                              
│  └───────────────────────────────────┘                                
└─────────────────────────────────────────────────────────────────────────┘
```

## Execution Waves & Parallelization

### Wave Analysis

**Phase 1**: 3 agents in parallel (no dependencies)
- All agents can start simultaneously
- Total duration: max(ux-researcher, rapid-prototyper, data-modeler) = ~7 days

**Phase 2**: Sequential start → Parallel execution  
- UI Designer starts first (requires Phase 1 completion)
- Whimsy Injector starts after components.md exists
- Overlap opportunity: ~40% time savings

**Phase 3**: Single critical path
- Frontend dev must complete before Phase 4 can begin
- No parallelization opportunities within phase

**Phase 4**: Complex 3-wave parallelization
- Wave 1: Backend (serial) - must complete first
- Wave 2: AI + WhatsApp (parallel) - 50% time savings  
- Wave 3: Analytics + Audit + Fallback (parallel) - 60% time savings

### Critical Path Analysis

**Total Serial Time**: 84 days (if all agents run sequentially)
**Optimized Parallel Time**: 52 days (38% reduction)

**Critical Path**: 
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 Wave 1 → Phase 4 Wave 3
(7 days) → (10 days) → (21 days) → (7 days) → (7 days) = 52 days
```

## File Dependency Graph

### Phase Transitions (Gates)

```
Phase 1 → Phase 2:
├── context/phase1/ux-flows/advisor-onboarding-journey.md
├── context/phase1/ux-flows/content-composer-workflow.md  
├── context/phase1/compliance-patterns.md
└── context/phase1/mobile-ux-guidelines.md

Phase 2 → Phase 3:
├── context/phase2/design-system/tokens.js
├── context/phase2/design-system/components.md
├── context/phase2/financial-components/*.md (5 files)
└── context/phase2/whimsy/micro-interactions.md

Phase 3 → Phase 4:
├── context/phase3/dashboard-app/advisor-layout.tsx
└── context/phase3/dashboard-app/content-composer.tsx

Phase 4 Internal:
├── Wave 1→2: context/phase4/backend/build-plan.md
├── Wave 2→3: context/phase4/compliance-engine/three-stage-validator.js
├── Wave 2→3: context/phase4/whatsapp-integration/delivery-scheduler.js
└── Wave 3→3: context/phase4/analytics-intelligence/advisor-insights-generator.js
```

### Dependency Matrix

| Agent | Depends On | Produces For |
|-------|------------|-------------|
| design/compliance-ux-researcher | PRD, compliance policy | design/fintech-ui-designer |
| design/fintech-ui-designer | Phase 1 UX outputs | eng/nextjs-dashboard-developer, design/whimsy-injector |
| design/whimsy-injector | UI components.md | eng/nextjs-dashboard-developer |
| eng/nextjs-dashboard-developer | Phase 2 design outputs | eng/backend-dev |
| eng/backend-dev | Frontend components | All Phase 4 Wave 2 agents |
| eng/ai-compliance-engine-dev | Backend plan | domain/sebi-compliance-auditor, domain/fallback-system-architect |
| eng/whatsapp-api-specialist | Backend plan | domain/analytics-intelligence-dev |
| domain/analytics-intelligence-dev | AI + WhatsApp outputs | domain/fallback-system-architect |

## Context Window Management

### Token Budget Allocation

| Phase | Total Budget | Per Agent Average | Critical Path Buffer |
|-------|--------------|-------------------|---------------------|
| Phase 1 | 400K tokens | 133K tokens | 50K tokens |
| Phase 2 | 240K tokens | 120K tokens | 40K tokens |  
| Phase 3 | 190K tokens | 190K tokens | 50K tokens |
| Phase 4 | 1,030K tokens | 147K tokens | 200K tokens |
| **Total** | **1,860K tokens** | **155K avg** | **340K buffer** |

### Memory Optimization Strategy

- **File Chunking**: Files >50K characters split into sections
- **Context Overlap**: 10K token buffer between related files
- **Aggressive Summarization**: Disabled (preserve detail for compliance)
- **Dependency Minimal**: Only essential files passed between agents

## Rollback Points & Recovery

### Checkpoint Strategy

1. **UX Ready** (Phase 1 Complete)
   - Can rollback to: Project start
   - Recovery time: 7 days

2. **UI Spec Stable** (Phase 2 Complete)  
   - Can rollback to: Phase 1 complete
   - Recovery time: 10 days

3. **FE Scaffold Ready** (Phase 3 Complete)
   - Can rollback to: Phase 2 complete
   - Recovery time: 21 days

4. **BE MVP Ready** (Phase 4 Wave 1 Complete)
   - Can rollback to: Phase 3 complete  
   - Recovery time: 7 days

5. **Delivery Dry-run Passed** (Phase 4 Complete)
   - Can rollback to: Phase 4 Wave 1
   - Recovery time: 21 days

### Error Recovery Modes

- **Circuit Breaker**: After 3 consecutive failures, fall back to serial execution
- **Exponential Backoff**: 1s, 2s, 4s retry delays
- **Partial Rollback**: Can restart from any completed wave within Phase 4
- **Dry Run Mode**: Test execution writes to `/context/_scratch` instead of `/context/phase*`

## Quality Gates & Validation

### Automated Validation

**Pre-execution**:
- ✅ Agent specs exist and are valid
- ✅ Input files accessible  
- ✅ No circular dependencies
- ✅ Token budgets feasible

**Post-phase**:
- ✅ Required output files generated
- ✅ File format validation (React TSX, JSON, Markdown)
- ✅ Cross-reference validation (imports, dependencies)
- ✅ Token usage within budget

### Manual Quality Gates

**Phase 1**: Advisor journey mapping validation, compliance workflow review
**Phase 2**: Design system consistency check, accessibility audit  
**Phase 3**: Dashboard demo, AI integration latency test, mobile usability
**Phase 4**: WhatsApp delivery dry-run, compliance accuracy test, analytics validation

## Dry Run Configuration

**Sandbox Mode**: `execution_mode: "dry_run"`
- All outputs write to `/context/_scratch/phase{N}/`
- Original `/context/` preserved
- Full DAG validation without side effects
- Token usage tracking and projection
- Dependency validation without file creation
- Rollback testing without impact

**Production Mode**: `execution_mode: "production"`  
- Outputs write to `/context/phase{N}/` as specified
- Checkpoints saved to `.checkpoint` file
- Full audit trail in workflow logs
- Rollback capability with file versioning