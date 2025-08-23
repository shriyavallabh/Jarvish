# Agent Handoffs & Artifact Flow - Project One

This table shows concrete output paths and consumption relationships for all agents:

| Agent | Output File Paths | Consumer Agents |
|-------|------------------|-----------------|
| **design/compliance-ux-researcher** | `context/phase1/ux-flows/advisor-onboarding-journey.md`<br>`context/phase1/ux-flows/content-composer-workflow.md`<br>`context/phase1/ux-flows/approval-tracking.md`<br>`context/phase1/compliance-patterns.md`<br>`context/phase1/mobile-ux-guidelines.md`<br>`context/phase1/whatsapp-integration-flows.md` | design/fintech-ui-designer |
| **design/fintech-ui-designer** | `context/phase2/design-system/tokens.js`<br>`context/phase2/design-system/components.md`<br>`context/phase2/financial-components/advisor-dashboard.md`<br>`context/phase2/financial-components/content-composer.md`<br>`context/phase2/financial-components/compliance-indicators.md`<br>`context/phase2/brand-standards/fintech-guidelines.md`<br>`context/phase2/brand-standards/mobile-patterns.md` | eng/nextjs-dashboard-developer |
| **eng/nextjs-dashboard-developer** | `context/phase3/dashboard-app/advisor-layout.tsx`<br>`context/phase3/dashboard-app/content-composer.tsx`<br>`context/phase3/dashboard-app/approval-tracker.tsx`<br>`context/phase3/components/compliance-indicator.tsx`<br>`context/phase3/components/whatsapp-preview.tsx`<br>`context/phase3/dashboard-app/analytics-dashboard.tsx`<br>`context/phase3/dashboard-app/settings-manager.tsx` | eng/ai-compliance-engine-dev, eng/whatsapp-api-specialist |
| **eng/ai-compliance-engine-dev** | `context/phase4/compliance-engine/three-stage-validator.js`<br>`context/phase4/compliance-engine/openai-integration.js`<br>`context/phase4/compliance-engine/risk-scoring-algorithm.js`<br>`context/phase4/compliance-engine/prompt-library.json`<br>`context/phase4/compliance-engine/fallback-handlers.js`<br>`context/phase4/compliance-api/endpoints.js`<br>`context/phase4/compliance-engine/audit-logging.js` | domain/sebi-compliance-auditor |
| **eng/whatsapp-api-specialist** | `context/phase4/whatsapp-integration/cloud-api-client.js`<br>`context/phase4/whatsapp-integration/template-manager.js`<br>`context/phase4/whatsapp-integration/delivery-scheduler.js`<br>`context/phase4/whatsapp-integration/quality-monitor.js`<br>`context/phase4/whatsapp-integration/webhook-handlers.js`<br>`context/phase4/whatsapp-integration/multi-number-strategy.js`<br>`context/phase4/delivery-analytics/sla-tracker.js` | domain/analytics-intelligence-dev, domain/fallback-system-architect |
| **domain/sebi-compliance-auditor** | `context/phase4/audit-framework/sebi-compliance-tracker.js`<br>`context/phase4/audit-framework/monthly-report-generator.js`<br>`context/phase4/audit-framework/incident-management-system.js`<br>`context/phase4/audit-framework/policy-version-control.js`<br>`context/phase4/audit-framework/advisor-compliance-profiles.js`<br>`context/phase4/audit-framework/regulatory-change-monitor.js`<br>`context/phase4/compliance-reports/audit-export-tools.js` | - (Terminal) |
| **domain/analytics-intelligence-dev** | `context/phase4/analytics-intelligence/advisor-insights-generator.js`<br>`context/phase4/analytics-intelligence/churn-prediction-model.js`<br>`context/phase4/analytics-intelligence/content-performance-analyzer.js`<br>`context/phase4/analytics-intelligence/platform-intelligence-engine.js`<br>`context/phase4/analytics-intelligence/anomaly-detector.js`<br>`context/phase4/analytics-intelligence/reporting-dashboard.js`<br>`context/phase4/insights-engine/natural-language-generator.js` | - (Terminal) |
| **domain/fallback-system-architect** | `context/phase4/fallback-system/ai-content-curator.js`<br>`context/phase4/fallback-system/evergreen-library-manager.js`<br>`context/phase4/fallback-system/seasonal-relevance-engine.js`<br>`context/phase4/fallback-system/engagement-predictor.js`<br>`context/phase4/fallback-system/assignment-scheduler.js`<br>`context/phase4/fallback-system/deduplication-tracker.js`<br>`context/phase4/continuity-rules/auto-send-controller.js` | - (Terminal) |

## Phase Gates

**Phase 1 → 2**: Requires `context/phase1/plan/sprint-plan.md` + `context/phase1/ux/content-composer-workflow.md`

**Phase 2 → 3**: Requires `context/phase2/ui/design-tokens.js` + `context/phase2/ui/component-specs.md`

**Phase 3 → 4**: Requires `context/phase3/frontend/advisor-layout.tsx` + `context/phase3/frontend/content-composer.tsx`

**Phase 4 Complete**: Requires `context/phase4/compliance/three-stage-validator.js` + `context/phase4/wa/delivery-scheduler.js` + `context/phase4/tests/integration-tests.js`

## Parallel Execution Groups

- **Phase 2**: `design/ui-designer` ↔ `design/whimsy-injector`
- **Phase 4**: `eng/test-runner` ↔ `eng/perf-benchmarker` ↔ `domain/compliance-guard`