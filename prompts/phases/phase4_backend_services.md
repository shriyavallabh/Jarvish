# Phase 4: Backend Services & AI-First Architecture

## When to Use
- After Phase 3 completion with functional frontend dashboard
- When Phase 3 gate requirements are met (advisor-layout.tsx + content-composer.tsx)
- Ready to implement backend services, AI compliance engine, and WhatsApp integration
- Final phase before production deployment

## Reads / Writes

**Reads:**
- `context/phase3/frontend/*.tsx` - Frontend implementation requiring backend support
- `context/phase1/data/*.md` - Data models and schema definitions
- `docs/api/openapi-skeleton.yaml` - API specification and endpoint requirements
- `docs/compliance/policy.yaml` - SEBI and DPDP compliance requirements
- `docs/wa/templates.md` - WhatsApp Business API templates and policies
- `docs/ops/observability-slo.md` - SLA and monitoring requirements

**Writes:**
- `context/phase4/backend/*.js` - Core API services and data models
- `context/phase4/compliance/*.js` - Three-stage compliance validation engine
- `context/phase4/wa/*.js` - WhatsApp Cloud API integration and delivery
- `context/phase4/analytics/*.js` - AI-powered advisor insights system
- `context/phase4/tests/*.js` - Comprehensive test suites
- `context/phase4/SUMMARY.md` - Phase completion summary

## Checklist Before Run

- [ ] Phase 3 gate validation completed (advisor-layout.tsx + content-composer.tsx exist)
- [ ] Frontend dashboard is functional and ready for backend integration
- [ ] Data models from Phase 1 are comprehensive and validated
- [ ] API specification defines all required endpoints
- [ ] SEBI compliance requirements are documented and understood
- [ ] WhatsApp Business API setup and template approval process planned
- [ ] 99% delivery SLA requirements and monitoring approach defined
- [ ] PostgreSQL and Redis infrastructure architecture planned
- [ ] AI service integrations (GPT-4o-mini, GPT-4.1) are configured

## One-Shot Prompt Block

```
ROLE: Phase 4 Orchestrator - Backend Services & AI-First Architecture
GOAL: Implement complete backend system with three-stage compliance engine, 99% delivery SLA WhatsApp integration, and AI-powered advisor analytics for Indian financial advisory platform.

CONTEXT: Building production backend to support 150-300 advisors initially, scaling to 1,000-2,000 by T+12 months. System must achieve 99% delivery SLA at 06:00 IST with <1.5s compliance checking and comprehensive SEBI audit trails.

KEY TECHNICAL CONSTRAINTS:
• Node.js backend with PostgreSQL primary database and Redis caching
• Three-stage compliance: Rules → GPT-4o-mini → Rules validation pipeline
• WhatsApp Cloud API: Business API integration with template management
• 99% delivery SLA: Fault-tolerant scheduling with fallback systems
• Performance: <1.5s compliance checking, <500ms API responses
• Security: DPDP compliance, advisor data protection, audit logging
• Scalability: Support 2,000 advisors with 06:00 IST delivery peak load

COMPLIANCE & REGULATORY REQUIREMENTS:
• SEBI compliance validation for all financial content
• Three-stage validation: Rule-based → AI analysis → Final rule check
• Complete audit trail for regulatory inspection
• DPDP data protection for advisor and client information
• Risk scoring system for content categorization
• Automated compliance reporting and violation detection

WHATSAPP INTEGRATION REQUIREMENTS:
• WhatsApp Business API Cloud integration
• Template submission and approval workflow
• Quality rating maintenance (HIGH/MEDIUM/LOW)
• Delivery scheduling with 99% SLA guarantee
• Rate limiting compliance and queue management
• Real-time delivery status tracking and reporting

INPUT FILES TO ANALYZE:
1. context/phase3/frontend/advisor-layout.tsx - Frontend data requirements
2. context/phase3/frontend/content-composer.tsx - AI integration patterns
3. context/phase1/data/advisor-schema.md - Data model specifications
4. context/phase1/data/content-models.md - Content structure and metadata
5. context/phase1/data/compliance-audit-schema.md - Audit trail requirements
6. docs/api/openapi-skeleton.yaml - API endpoint specifications
7. docs/compliance/policy.yaml - SEBI and DPDP regulatory requirements
8. docs/wa/templates.md - WhatsApp template and policy requirements
9. docs/ops/observability-slo.md - SLA monitoring and alerting requirements

REQUIRED OUTPUTS:
1. context/phase4/backend/api-endpoints.js - Complete REST API implementation
2. context/phase4/backend/data-models.js - PostgreSQL models and schemas
3. context/phase4/backend/auth-middleware.js - Authentication and authorization
4. context/phase4/backend/advisor-service.js - Advisor management and billing
5. context/phase4/compliance/three-stage-validator.js - Complete compliance pipeline
6. context/phase4/compliance/sebi-compliance-tracker.js - Regulatory audit system
7. context/phase4/compliance/audit-framework.js - Comprehensive audit logging
8. context/phase4/compliance/risk-scoring.js - Content risk categorization
9. context/phase4/wa/cloud-api-client.js - WhatsApp Business API integration
10. context/phase4/wa/template-manager.js - Template submission and approval
11. context/phase4/wa/delivery-scheduler.js - 99% SLA delivery system
12. context/phase4/wa/quality-monitor.js - WhatsApp quality rating management
13. context/phase4/wa/webhook-handlers.js - Real-time status processing
14. context/phase4/analytics/advisor-insights-generator.js - Weekly advisor analytics
15. context/phase4/analytics/churn-prediction-model.js - Advisor health scoring
16. context/phase4/analytics/content-performance-analyzer.js - Engagement optimization
17. context/phase4/analytics/platform-intelligence-engine.js - Business trend analysis
18. context/phase4/tests/unit-tests.js - Comprehensive unit test coverage
19. context/phase4/tests/integration-tests.js - API and service integration tests
20. context/phase4/tests/compliance-tests.js - Regulatory validation test suite
21. context/phase4/SUMMARY.md - Complete system architecture and deployment readiness

PHASE COMPLETION SUCCESS CRITERIA:
• Three-stage compliance engine operational with <1.5s processing time
• WhatsApp Cloud API integration achieving 99% delivery SLA
• All API endpoints implemented with proper authentication and validation
• Comprehensive audit trail for SEBI regulatory compliance
• AI-powered analytics providing actionable advisor insights
• Complete test coverage with passing integration and compliance tests
• System ready for production deployment with monitoring and alerting

EXECUTION APPROACH:
1. Implement core API services with PostgreSQL data persistence
2. Build three-stage compliance validation pipeline with AI integration
3. Integrate WhatsApp Cloud API with template management and delivery scheduling
4. Develop AI-powered analytics for advisor insights and churn prediction
5. Implement comprehensive security and data protection measures
6. Create robust test coverage for all critical system components
7. Ensure system meets all SLA and performance requirements
8. Validate complete compliance with SEBI and DPDP regulations
```

## Post-Run Validation Checklist

- [ ] All 21 required output files are created and functional
- [ ] Three-stage compliance engine processes content in <1.5s
- [ ] WhatsApp Cloud API integration maintains 99% delivery SLA
- [ ] Complete REST API implemented with proper authentication
- [ ] PostgreSQL data models support all advisor and content requirements
- [ ] SEBI compliance audit trail comprehensive and queryable
- [ ] DPDP data protection measures implemented throughout system
- [ ] AI-powered analytics provide meaningful advisor insights
- [ ] Churn prediction model identifies at-risk advisors accurately
- [ ] Template management system maintains WhatsApp quality ratings
- [ ] Delivery scheduler handles 06:00 IST peak load reliably
- [ ] Comprehensive test coverage with all tests passing
- [ ] Integration tests validate end-to-end workflows
- [ ] Compliance tests ensure regulatory requirement adherence
- [ ] Phase gate files ready: three-stage-validator.js + delivery-scheduler.js + integration-tests.js
- [ ] System architecture documented and ready for production deployment
- [ ] Monitoring and alerting configured for SLA tracking
- [ ] Security audit completed with no critical vulnerabilities
- [ ] Performance benchmarks meet all specified requirements