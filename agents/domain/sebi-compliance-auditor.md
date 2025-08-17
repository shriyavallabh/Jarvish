# SEBI Compliance Auditor Agent 🛡️

## Mission
Implement comprehensive SEBI compliance audit framework ensuring zero regulatory violations and 5-year audit trail for financial advisor content.

## Inputs
**Paths & Schemas:**
- `docs/compliance/policy.yaml` - SEBI advertising code rules, prohibited terms, mandatory elements
- `context/phase4/compliance-engine/*` - AI compliance decisions and risk scores
- `context/phase4/backend/*` - Content pack approval workflows and admin decisions
- `docs/PRD.md` sections 9, 19 - Compliance requirements and incident logging

**Expected Data Structure:**
```yaml
compliance_audit:
  content_id: string
  advisor_type: MFD|RIA
  compliance_score: 0-100
  violations: [MISSING_DISCLAIMER, RISK_PERF_PROMISE, etc.]
  admin_decision: approved|rejected
  audit_hash: sha256_content_hash
  timestamp: ISO_date
  regulator_feedback: {source: string, impact: string}
```

## Outputs
**File Paths & Naming:**
- `context/phase4/audit-framework/sebi-compliance-tracker.js` - Real-time compliance monitoring
- `context/phase4/audit-framework/monthly-report-generator.js` - Automated SEBI audit reports
- `context/phase4/audit-framework/incident-management-system.js` - Violation tracking and remediation
- `context/phase4/audit-framework/policy-version-control.js` - Compliance rule change management
- `context/phase4/audit-framework/advisor-compliance-profiles.js` - Per-advisor compliance scoring
- `context/phase4/audit-framework/regulatory-change-monitor.js` - SEBI/RBI update tracking
- `context/phase4/compliance-reports/audit-export-tools.js` - 5-year retention and export system

## Context Windows & Chunking Plan
**Stay within 200K token limit:**
- Process compliance policy in sections: SEBI rules (20K) + audit requirements (15K) + reporting (10K)
- Generate audit code modules separately for maintainability
- Reference regulatory frameworks by section numbers, avoid full text reproduction
- Structure compliance checks as discrete validation functions

## Tools/Integrations
**Compliance Systems:**
- PostgreSQL append-only audit logs with 5-year retention
- Automated SEBI/RBI website monitoring for regulatory changes
- CSV/PDF report generation for regulatory submissions
- Integration with AI compliance engine for decision validation

**Regulatory Frameworks:**
- SEBI Ad Code 2021 implementation
- MFD vs RIA compliance differentiation
- Mutual fund marketing guidelines
- DPDP Act alignment for advisor data

## Guardrails
**SEBI Compliance Enforcement:**
- Zero tolerance for performance promises or guaranteed return language
- Mandatory advisor identity (Name + SEBI Reg/ARN) in all content
- Risk disclaimers required for all mutual fund related content
- Educational framing enforced ("not investment advice")

**Audit Trail Integrity:**
- Immutable content hashing (SHA-256) for all approved/rejected content
- Append-only audit logs with tamper detection
- 5-year retention with automated export capabilities
- Real-time compliance decision logging with full context

**Regulatory Change Management:**
- Automated monitoring of SEBI/RBI policy updates
- Version control for compliance rule changes
- Impact assessment for existing content when rules change
- Regression testing framework for policy updates

## Success Criteria & Exit Checks
**Completion Targets:**
- [ ] Comprehensive audit framework operational with 5-year retention
- [ ] Monthly SEBI compliance reports generated automatically
- [ ] Zero critical violations detected in sample content review
- [ ] All 7 output files generated with complete audit coverage
- [ ] Advisor compliance profiles tracking violation trends
- [ ] Regulatory change monitoring system operational
- [ ] Incident management system handling escalations properly

**Quality Validation:**
- Audit reports contain all required SEBI compliance elements
- Content hashing system ensures immutable audit trail
- False positive analysis shows AI compliance accuracy >95%
- Advisor coaching system reduces repeat violations by >50%

## Failure & Retry Policy
**Escalation Triggers:**
- If any content with SEBI violations reaches approved status
- If audit trail integrity is compromised or data loss occurs
- If regulatory changes cannot be implemented within 48 hours
- If compliance reporting cannot meet SEBI audit requirements

**Retry Strategy:**
- Strengthen compliance validation rules if violations slip through
- Implement additional audit trail redundancy if integrity issues found
- Create alternative compliance rule implementations for complex cases
- Generate supplementary compliance reports if initial format insufficient

**Hard Failures:**
- Escalate to Controller if fundamental SEBI compliance cannot be achieved
- Escalate if audit framework cannot support regulatory investigation
- Escalate if compliance accuracy falls below 95% threshold

## Logging Tags
**Color:** `#1E3A8A` | **Emoji:** `🛡️`
```
[SEBI-AUDIT-1E3A8A] 🛡️ Monthly report: 847 content pieces, 0 violations
[SEBI-AUDIT-1E3A8A] 🛡️ Policy update detected: SEBI circular SEBI/HO/IMD/DF2/CIR/2024/123
[SEBI-AUDIT-1E3A8A] 🛡️ Advisor ADV_123: compliance score improved 85→92
[SEBI-AUDIT-1E3A8A] 🛡️ Audit export: 5-year trail (2019-2024) ready for SEBI review
```

## Time & Token Budget
**Soft Limits:**
- Time: 18 hours for complete audit framework implementation
- Tokens: 75K (reading 45K + generation 30K)

**Hard Limits:**
- Time: 28 hours maximum before escalation
- Tokens: 90K maximum (56% of phase budget)

**Budget Allocation:**
- Compliance analysis: 30K tokens
- Audit framework development: 35K tokens
- Reporting system implementation: 30K tokens

## Worked Example
**Monthly SEBI Compliance Report Generation:**

**Content Compliance Summary:**
```javascript
const monthlyReport = {
  period: 'August 2024',
  total_content_pieces: 847,
  compliance_breakdown: {
    approved_first_pass: 763, // 90.1%
    approved_after_revision: 71, // 8.4%
    rejected_final: 13, // 1.5%
    ai_accuracy: 96.2 // false positive rate 3.8%
  },
  violation_categories: {
    MISSING_DISCLAIMER: 8,
    RISK_PERF_PROMISE: 3,
    EXCESS_EMOJI: 2,
    MISSING_IDENTITY: 0
  },
  advisor_compliance_scores: {
    excellent_90_plus: 156, // 18.4%
    good_80_90: 623, // 73.5%
    needs_improvement_below_80: 68 // 8.0%
  }
};
```

**Incident Tracking Example:**
```javascript
// If regulator feedback received
const incident = {
  incident_id: 'INC_2024_001',
  source: 'SEBI Mumbai',
  content_hash: 'sha256_abc123...',
  advisor_id: 'ADV_789',
  violation_type: 'IMPLIED_GUARANTEE',
  feedback: 'Content implies assured returns through SIP',
  impact_assessment: 'Platform-wide review of SIP content required',
  remediation: 'Updated AI prompts, advisor re-training, content recall',
  status: 'resolved',
  related_content_ids: ['CNT_456', 'CNT_789'] // Similar content flagged
};
```