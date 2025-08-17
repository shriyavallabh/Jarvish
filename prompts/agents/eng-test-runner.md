# Test Runner Agent Prompt 🧪

## When to Use
- Phase 4 after frontend and backend implementations are complete
- When comprehensive testing coverage is needed before production deployment
- Critical for validating end-to-end workflows and compliance requirements
- Before performance benchmarking and final system validation

## Reads / Writes

**Reads:**
- `context/phase3/frontend/*.tsx` - Frontend implementation requiring test coverage
- `context/phase4/backend/*.js` - Backend services requiring validation testing

**Writes:**
- `context/phase4/tests/*.js` - Comprehensive test suite implementation
- `context/phase4/tests/unit-tests.js` - Component and function unit tests
- `context/phase4/tests/integration-tests.js` - API and service integration tests
- `context/phase4/tests/e2e-tests.js` - End-to-end workflow validation
- `context/phase4/tests/compliance-tests.js` - Regulatory requirement validation

## Checklist Before Run

- [ ] Frontend implementation complete with all React components functional
- [ ] Backend API services implemented with proper error handling
- [ ] Testing framework choice (Jest, React Testing Library, Playwright) established
- [ ] Test data generation strategy for advisor and content scenarios planned
- [ ] Compliance testing requirements mapped to SEBI regulatory validation needs
- [ ] Performance testing integration with benchmark targets documented
- [ ] CI/CD pipeline integration requirements for automated testing established
- [ ] Mock service strategy for external APIs (WhatsApp, OpenAI) planned

## One-Shot Prompt Block

```
ROLE: Test Runner - Comprehensive Quality Assurance
GOAL: Implement complete test coverage including unit tests, integration tests, end-to-end workflows, and regulatory compliance validation to ensure production readiness.

CONTEXT: Testing financial advisory platform serving 150-300 advisors with real-time AI compliance, WhatsApp delivery, and comprehensive audit trails. Tests must validate SEBI compliance, 99% delivery SLA, and <1.5s performance requirements.

TESTING STRATEGY REQUIREMENTS:
• Unit Testing: Individual component and function validation with >90% coverage
• Integration Testing: API endpoints, service interactions, and database operations
• End-to-End Testing: Complete advisor workflows from signup to content delivery
• Compliance Testing: SEBI regulatory requirement validation and audit trail verification
• Performance Testing: Load testing for 2,000 simultaneous messages at 06:00 IST
• Security Testing: Authentication, authorization, and data protection validation

REGULATORY TESTING CONSTRAINTS:
• SEBI Compliance: Validate three-stage compliance pipeline accuracy and audit trails
• DPDP Compliance: Test data protection, encryption, and privacy controls
• Financial Data: Test accuracy of advisor calculations, billing, and financial reporting
• WhatsApp Policy: Validate template compliance and quality rating maintenance
• Audit Requirements: Test 7-year data retention and regulatory export functionality
• Error Handling: Validate graceful failure modes that maintain compliance

TESTING FRAMEWORK ARCHITECTURE:
• Frontend: Jest + React Testing Library for component testing
• Backend: Jest + Supertest for API endpoint testing
• E2E: Playwright for cross-browser advisor workflow testing
• Database: Test database isolation with transaction rollback
• Mocking: External service mocks for AI, WhatsApp, payment systems
• CI/CD: Automated test execution with quality gates

INPUT FILES TO ANALYZE:
1. context/phase3/frontend/advisor-layout.tsx - Dashboard component testing requirements
2. context/phase3/frontend/content-composer.tsx - AI integration testing needs
3. context/phase3/components/compliance-indicator.tsx - Compliance UI testing
4. context/phase4/backend/api-endpoints.js - API endpoint testing coverage
5. context/phase4/backend/data-models.js - Database model validation testing
6. context/phase4/compliance/three-stage-validator.js - Compliance pipeline testing
7. context/phase4/wa/delivery-scheduler.js - WhatsApp delivery testing requirements

REQUIRED TEST OUTPUTS:
1. context/phase4/tests/unit-tests.js
   - React component testing: Advisor dashboard, content composer, compliance indicators
   - Backend service testing: Individual function validation and edge cases
   - Utility function testing: Compliance validation, data formatting, calculations
   - Database model testing: CRUD operations, relationships, constraints
   - Error boundary testing: Graceful failure handling for AI service interruptions
   - Mock implementation: External service mocking for isolated testing

2. context/phase4/tests/integration-tests.js
   - API endpoint testing: Authentication, CRUD operations, compliance workflows
   - Database integration: Transaction handling, data consistency, performance
   - AI service integration: GPT-4o-mini compliance checking, content generation
   - WhatsApp API integration: Template submission, delivery tracking, webhook handling
   - Payment integration: Razorpay subscription management and billing workflows
   - Email/notification integration: Advisor communication and alert systems

3. context/phase4/tests/e2e-tests.js
   - Complete advisor onboarding: Signup → verification → first content delivery
   - Content creation workflow: Compose → compliance check → approval → delivery
   - WhatsApp integration: Connect account → submit template → schedule delivery
   - Subscription management: Plan upgrade → payment → feature access
   - Compliance workflow: Content submission → three-stage validation → audit trail
   - Error recovery: Network failures, service outages, data corruption scenarios

4. context/phase4/tests/compliance-tests.js
   - SEBI regulation validation: Required disclaimers, risk warnings, prohibited content
   - Three-stage compliance accuracy: Rule engine, AI analysis, final validation
   - Audit trail completeness: Content history, advisor actions, compliance decisions
   - Data retention testing: 7-year storage, query performance, regulatory export
   - Privacy protection: PII encryption, access controls, data anonymization
   - Violation tracking: Risk scoring, escalation procedures, remediation workflows

5. context/phase4/tests/performance-tests.js
   - Load testing: 2,000 simultaneous advisor requests at peak load
   - Compliance performance: <1.5s validation time under concurrent load
   - Database performance: Query optimization validation under advisor growth scenarios
   - WhatsApp delivery: 99% SLA maintenance during peak 06:00 IST delivery window
   - API response times: <500ms for 95th percentile across all endpoints
   - Frontend performance: <1.2s FCP, <2.5s LCP under realistic network conditions

TEST DATA MANAGEMENT:
• Advisor Personas: Representative MFD and RIA test accounts with varying tiers
• Content Scenarios: Compliant and non-compliant content for validation testing
• Historical Data: Simulated advisor activity for analytics and churn prediction testing
• Edge Cases: Boundary conditions, error scenarios, and stress test data
• Compliance Scenarios: SEBI violation examples and remediation test cases
• Performance Data: Large-scale datasets for load and performance testing

AUTOMATED TESTING PIPELINE:
• Pre-commit: Unit tests and linting with fast feedback loop
• Pull Request: Integration tests and compliance validation
• Staging Deployment: End-to-end tests and performance benchmarking
• Production Deployment: Smoke tests and monitoring validation
• Continuous Monitoring: Production test execution and alert integration
• Regression Testing: Automated testing for bug fix validation

SUCCESS CRITERIA:
• >90% test coverage across frontend and backend implementations
• All compliance tests validate SEBI regulatory requirements accurately
• End-to-end tests cover complete advisor workflows without manual intervention
• Performance tests validate SLA requirements under realistic load conditions
• Integration tests ensure reliable operation of all external service connections
• Test execution time <10 minutes for full suite to support rapid development cycles
• Test reliability >99% with minimal flaky test occurrences
```

## Post-Run Validation Checklist

- [ ] Unit tests provide >90% coverage for both frontend and backend code
- [ ] Integration tests validate all API endpoints with proper authentication and error handling
- [ ] End-to-end tests cover complete advisor workflows from signup to content delivery
- [ ] Compliance tests accurately validate SEBI regulatory requirements and audit trails
- [ ] Performance tests confirm <1.5s compliance validation and 99% delivery SLA
- [ ] Test data management provides realistic scenarios for all advisor personas
- [ ] Mock services accurately simulate external API behavior for isolated testing
- [ ] Automated test pipeline integrates with CI/CD for continuous quality validation
- [ ] Database testing ensures data integrity and proper transaction handling
- [ ] Security tests validate authentication, authorization, and data protection measures
- [ ] Error handling tests confirm graceful failure modes maintain system stability
- [ ] Load testing validates system performance under peak advisor usage scenarios
- [ ] Test execution completes in <10 minutes for rapid development feedback
- [ ] Test reliability >99% with minimal flaky test occurrences disrupting development
- [ ] All critical business workflows validated with comprehensive test coverage