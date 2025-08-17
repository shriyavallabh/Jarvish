# Compliance Guard Agent Prompt 🛡️

## When to Use
- Phase 4 after backend API foundation is established
- When implementing three-stage SEBI compliance validation pipeline
- Critical for all content approval and risk scoring functionality
- Before WhatsApp integration to ensure compliant content delivery

## Reads / Writes

**Reads:**
- `docs/compliance/policy.yaml` - SEBI and DPDP regulatory requirements
- `context/phase3/frontend/*.tsx` - Frontend compliance UI requirements
- `context/phase4/backend/*.js` - Backend API integration points

**Writes:**
- `context/phase4/compliance/*.js` - Complete compliance validation system
- `context/phase4/compliance/three-stage-validator.js` - Core compliance pipeline
- `context/phase4/compliance/sebi-compliance-tracker.js` - Regulatory audit system
- `context/phase4/compliance/audit-framework.js` - Comprehensive logging
- `context/phase4/compliance/risk-scoring.js` - Content risk assessment

## Checklist Before Run

- [ ] SEBI regulations for financial content thoroughly researched and documented
- [ ] DPDP (Digital Personal Data Protection) requirements understood
- [ ] Three-stage validation approach (Rules→AI→Rules) architecture planned
- [ ] AI integration patterns for GPT-4o-mini compliance checking established
- [ ] Risk scoring methodology for financial content categorization defined
- [ ] Audit trail requirements for regulatory inspection documented
- [ ] Performance targets (<1.5s compliance checking) constraints understood
- [ ] Integration points with backend API and frontend UI established

## One-Shot Prompt Block

```
ROLE: Compliance Guard - SEBI Regulatory Validation Engine
GOAL: Implement comprehensive three-stage compliance validation system ensuring all financial content meets SEBI regulations with complete audit trails and risk scoring.

CONTEXT: Building regulatory compliance engine for Indian financial advisory platform where non-compliant content could result in SEBI penalties, license suspension, or legal action. System must process 2,000+ daily content submissions with <1.5s validation time.

REGULATORY COMPLIANCE REQUIREMENTS:
• SEBI Guidelines: Investment advisory disclosure requirements, risk warnings, product suitability
• DPDP Act 2023: Data protection, consent management, audit trail requirements  
• MF Regulations: Mutual fund disclosure, performance disclaimers, risk categorization
• Insurance Regulations: Product disclosure, suitability assessment, complaint procedures
• Advertisement Guidelines: Clear, fair, not misleading content standards

THREE-STAGE VALIDATION ARCHITECTURE:
• Stage 1 - Rule Engine: Hard compliance rules (required disclaimers, prohibited terms)
• Stage 2 - AI Analysis: GPT-4o-mini semantic analysis for subtle compliance issues
• Stage 3 - Final Validation: Rules verification of AI-modified content
• Performance Target: Complete validation pipeline in <1.5 seconds
• Fallback Strategy: Rule-only validation if AI services unavailable

RISK SCORING METHODOLOGY:
• Low Risk (0-30): Standard disclaimers, general market education
• Medium Risk (31-70): Product-specific advice, performance projections  
• High Risk (71-100): Specific investment recommendations, guaranteed returns claims
• Violation Tracking: Escalating consequences for repeated high-risk content
• Advisor Education: Compliance improvement suggestions and training recommendations

INPUT FILES TO ANALYZE:
1. docs/compliance/policy.yaml - Complete SEBI and DPDP regulatory requirements
2. context/phase3/frontend/content-composer.tsx - Real-time compliance UI integration
3. context/phase3/components/compliance-indicator.tsx - Risk scoring visualization needs
4. context/phase4/backend/api-endpoints.js - Compliance API integration points
5. context/phase4/backend/data-models.js - Audit trail data storage requirements

REQUIRED COMPLIANCE OUTPUTS:
1. context/phase4/compliance/three-stage-validator.js
   - Complete validation pipeline orchestrator
   - Stage 1: Rule-based validation with configurable compliance rules
   - Stage 2: GPT-4o-mini integration for semantic compliance analysis
   - Stage 3: Final rule validation with AI suggestion application
   - Error handling: Graceful degradation when AI services unavailable
   - Performance optimization: Parallel processing and caching strategies

2. context/phase4/compliance/sebi-compliance-tracker.js
   - Regulatory rule engine with SEBI guideline implementation
   - Required disclaimer validation: Investment advisory, mutual fund, insurance
   - Prohibited content detection: Guaranteed returns, past performance promises
   - Risk warning verification: Product-specific risk disclosures
   - Suitability assessment: Client profile matching recommendations
   - Compliance scoring: Weighted scoring based on violation severity

3. context/phase4/compliance/audit-framework.js
   - Comprehensive audit trail system for regulatory inspection
   - Content submission logging: Timestamp, advisor, original content, modifications
   - Validation result logging: Each stage result, AI reasoning, final decision
   - Advisor activity tracking: Compliance trends, improvement patterns
   - Regulatory reporting: Automated compliance reports for SEBI submission
   - Data retention: 7-year audit trail storage as per regulatory requirements

4. context/phase4/compliance/risk-scoring.js
   - Dynamic risk assessment with machine learning enhancement
   - Content categorization: Product type, advice level, risk factors
   - Advisor risk profile: Historical compliance, violation patterns, improvement trends
   - Contextual scoring: Market conditions, regulatory changes, seasonal factors
   - Real-time adjustment: Risk score updates based on compliance performance
   - Predictive analysis: Early warning for potential compliance issues

5. context/phase4/compliance/compliance-api.js
   - REST API endpoints for compliance validation services
   - Real-time validation: POST /validate with <1.5s response guarantee
   - Bulk validation: Batch processing for historical content review
   - Compliance dashboard: GET /compliance/advisor/{id} for performance metrics
   - Violation management: Appeals process and remediation workflow
   - Regulatory export: Compliance data export for SEBI inspection

COMPLIANCE VALIDATION RULES:
• Mutual Fund Disclaimers: "Mutual fund investments are subject to market risks..."
• Past Performance: Prohibition of guarantee language based on historical returns
• Risk Warnings: Product-specific risk disclosure requirements
• Advisor Disclosure: Registration details, fee structure transparency
• Client Suitability: Investment recommendation appropriateness validation

AI INTEGRATION SPECIFICATIONS:
• GPT-4o-mini Prompt: Specialized prompts for Indian financial regulation compliance
• Context Window: Efficient content chunking for large advisor communications
• Response Parsing: Structured AI response for actionable compliance suggestions
• Fallback Logic: Rule-only validation when AI response exceeds time limits
• Quality Assurance: AI suggestion validation against compliance rule engine

SUCCESS CRITERIA:
• Three-stage validation pipeline completes in <1.5 seconds for 95% of content
• Risk scoring accuracy >90% as validated by regulatory compliance experts
• Zero false negatives: No compliant content incorrectly flagged as violations
• Comprehensive audit trail supports SEBI inspection requirements
• AI integration improves compliance detection beyond rule-based approaches
• System handles 2,000+ daily validations with consistent performance
• Advisor compliance improvement demonstrated through violation trend reduction
```

## Post-Run Validation Checklist

- [ ] Three-stage validation pipeline implemented and operational
- [ ] Compliance validation completes in <1.5s for target content volume
- [ ] SEBI regulatory rules comprehensive and accurately implemented
- [ ] AI integration enhances compliance detection beyond simple rule matching
- [ ] Risk scoring provides actionable guidance for advisor content improvement
- [ ] Audit trail captures all validation actions with regulatory-compliant detail
- [ ] Error handling gracefully manages AI service interruptions
- [ ] Performance optimization enables real-time validation for advisor workflow
- [ ] Compliance API endpoints support all frontend dashboard requirements
- [ ] Violation tracking and remediation workflow support advisor education
- [ ] Data retention policies comply with 7-year regulatory audit requirements
- [ ] Bulk validation capability supports historical content compliance review
- [ ] Integration testing validates end-to-end compliance workflow functionality
- [ ] Regulatory export functionality ready for SEBI inspection requirements
- [ ] System monitoring alerts on compliance validation performance degradation