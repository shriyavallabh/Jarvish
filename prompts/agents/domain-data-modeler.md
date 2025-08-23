# Data Modeler Agent Prompt 🗃️

## When to Use
- Phase 1 for foundational data architecture design
- When establishing database schema for advisor, content, and compliance data
- Before backend implementation to ensure proper data relationships
- Critical for SEBI audit trail and DPDP compliance data protection

## Reads / Writes

**Reads:**
- `docs/data-model/er-diagram.md` - Initial database relationship specifications
- `docs/PRD.md` - Data requirements from product specification

**Writes:**
- `context/phase1/data/*.md` - Complete data model specifications
- `context/phase1/data/advisor-schema.md` - Advisor profile and subscription models
- `context/phase1/data/content-models.md` - Content structure with compliance metadata
- `context/phase1/data/compliance-audit-schema.md` - Audit trail and regulatory data

## Checklist Before Run

- [ ] PRD data requirements thoroughly analyzed and understood
- [ ] SEBI audit trail requirements for 7-year data retention documented
- [ ] DPDP data protection requirements for advisor and client information understood
- [ ] Advisor personas (MFD vs RIA) and their different data needs analyzed
- [ ] Content compliance metadata requirements from three-stage validation planned
- [ ] WhatsApp delivery tracking and analytics data requirements documented
- [ ] Scalability requirements for 150-300 → 1,000-2,000 advisors considered
- [ ] Performance requirements for real-time compliance checking (<1.5s) factored

## One-Shot Prompt Block

```
ROLE: Data Modeler - Financial Advisory Platform Architecture
GOAL: Design comprehensive database schema supporting advisor management, content compliance, audit trails, and analytics while ensuring SEBI regulatory compliance and DPDP data protection.

CONTEXT: Designing data architecture for Indian financial advisory platform serving MFDs and RIAs with real-time compliance checking, WhatsApp content delivery, and comprehensive regulatory audit requirements.

DATABASE DESIGN CONSTRAINTS:
• SEBI Compliance: 7-year immutable audit trails for all content and advisor actions
• DPDP Compliance: Data protection, encryption at rest, PII anonymization capabilities
• Performance: <1.5s compliance checking with optimized query patterns
• Scalability: Support growth from 300 to 2,000+ advisors with content history
• Analytics: Efficient data structures for advisor insights and churn prediction
• Regulatory Export: Fast query capabilities for SEBI inspection and reporting

DATA MODELING REQUIREMENTS:
• Advisor Management: Profiles, subscriptions, tiers, preferences, compliance status
• Content Lifecycle: Creation, validation, approval, delivery, performance tracking
• Compliance System: Three-stage validation, risk scoring, violation history
• WhatsApp Integration: Templates, delivery tracking, engagement metrics
• Analytics Foundation: Advisor behavior, content performance, platform usage
• Audit Trail: Complete regulatory audit support with immutable logging

REGULATORY DATA REQUIREMENTS:
• SEBI Audit Trail: Content creation, modification, approval decisions, advisor actions
• DPDP Privacy: Consent management, data processing logs, anonymization tracking
• Financial Compliance: Investment advice categorization, suitability documentation
• WhatsApp Policy: Template compliance, quality rating factors, delivery logs
• Business Compliance: Subscription billing, tax calculations, revenue attribution
• Risk Management: Advisor risk profiles, content risk scoring, violation escalation

INPUT FILES TO ANALYZE:
1. docs/data-model/er-diagram.md - Initial database relationship specifications
2. docs/PRD.md - Complete product data requirements and business rules

REQUIRED DATA MODEL OUTPUTS:
1. context/phase1/data/advisor-schema.md
   - Complete advisor entity with profile, authentication, and subscription data
   - Advisor types: MFD vs RIA with different compliance and feature requirements
   - Subscription tiers: Basic (₹2,999), Standard (₹5,999), Pro (₹11,999) with feature mapping
   - Profile data: Contact information, business details, regulatory certifications
   - Preferences: Language, timezone, delivery preferences, notification settings
   - Authentication: Secure credential storage, session management, 2FA support
   - Compliance status: Current standing, violation history, improvement tracking

2. context/phase1/data/content-models.md
   - Content entity with full lifecycle support from creation to analytics
   - Content metadata: Type, topic, language, target audience, compliance category
   - Version control: Content revisions, approval history, rollback capabilities
   - Compliance integration: Risk scores, validation results, reviewer comments
   - Delivery tracking: WhatsApp template linkage, delivery status, engagement metrics
   - Performance data: Read rates, engagement, advisor satisfaction, client feedback
   - Archival strategy: Long-term storage with query optimization for historical analysis

3. context/phase1/data/compliance-audit-schema.md
   - Immutable audit log with complete regulatory trail for SEBI inspection
   - Event logging: Timestamp, advisor ID, action type, content hash, IP address
   - Compliance decisions: Three-stage validation results, AI reasoning, final determination
   - Violation tracking: Severity classification, remediation actions, follow-up status
   - Reviewer activity: Human compliance reviewer actions, overrides, appeal decisions
   - Data retention: 7-year storage with efficient archival and retrieval systems
   - Regulatory export: Optimized query patterns for SEBI reporting and inspection

4. context/phase1/data/analytics-foundation.md
   - Advisor behavior tracking for insights and churn prediction
   - Platform usage metrics: Login patterns, feature utilization, support interactions
   - Content creation patterns: Frequency, topics, compliance scores, improvement trends
   - Engagement analytics: WhatsApp delivery success, read rates, client responses
   - Business metrics: Revenue attribution, tier conversion, support cost allocation
   - Cohort analysis: Advisor lifecycle stages, retention patterns, success indicators
   - Privacy protection: Anonymization strategies for aggregate analytics

5. context/phase1/data/whatsapp-integration-schema.md
   - WhatsApp Business API integration data with template and delivery management
   - Template lifecycle: Creation, submission, approval status, performance tracking
   - Delivery queues: Scheduled messages, priority handling, retry mechanisms
   - Status tracking: Delivery confirmations, read receipts, engagement responses
   - Quality management: Rating factors, feedback analysis, improvement recommendations
   - Rate limiting: API usage tracking, quota management, throttling data
   - Analytics integration: Message performance, advisor success correlation

DATABASE ARCHITECTURE DECISIONS:
• PostgreSQL Primary: ACID compliance for financial data with JSON fields for flexible metadata
• Redis Caching: Session management, AI response caching, real-time analytics
• Time-series optimization: Partition strategies for audit logs and analytics data
• Indexing strategy: Optimized for advisor queries, compliance lookups, analytics aggregation
• Encryption: At-rest encryption for PII, in-transit encryption for all communications
• Backup and recovery: Point-in-time recovery with regulatory-compliant data retention

DATA RELATIONSHIPS & CONSTRAINTS:
• Advisor → Content: One-to-many with cascade delete protection for audit preservation
• Content → Compliance: One-to-many compliance checks with immutable audit history
• Content → Delivery: One-to-many WhatsApp deliveries with engagement tracking
• Advisor → Subscription: Time-series subscription history with billing integration
• Compliance → Audit: Complete audit trail linkage for regulatory inspection
• Analytics → Privacy: Anonymization layers for aggregate advisor insights

PERFORMANCE OPTIMIZATION:
• Query patterns: Optimized for real-time compliance checking and advisor dashboard loading
• Partitioning: Time-based partitioning for audit logs and analytics data
• Caching strategy: Frequently accessed advisor data with Redis integration
• Index optimization: Composite indexes for complex compliance and analytics queries
• Connection pooling: Efficient database connection management for concurrent users
• Read replicas: Analytics queries isolated from operational database load

SUCCESS CRITERIA:
• Complete data model supports all PRD requirements with proper relationships
• SEBI audit trail capabilities meet 7-year regulatory retention requirements
• DPDP compliance ensured through proper data protection and privacy controls
• Performance optimization enables <1.5s compliance checking under load
• Scalability design supports growth from 300 to 2,000+ advisors efficiently
• Analytics foundation enables advisor insights and churn prediction accuracy
• Data model flexibility accommodates future feature expansion and regulatory changes
```

## Post-Run Validation Checklist

- [ ] Advisor schema comprehensively covers MFD and RIA personas with tier differentiation
- [ ] Content models support complete lifecycle from creation to performance analytics
- [ ] Compliance audit schema provides immutable 7-year regulatory trail
- [ ] Database relationships properly enforce data integrity and audit preservation
- [ ] Performance optimization supports <1.5s compliance checking requirements
- [ ] SEBI audit trail capabilities meet regulatory inspection and reporting needs
- [ ] DPDP compliance ensured through proper PII protection and anonymization strategies
- [ ] WhatsApp integration schema supports template management and delivery tracking
- [ ] Analytics foundation enables advisor insights without compromising privacy
- [ ] Scalability design accommodates growth to 2,000+ advisors efficiently
- [ ] Data retention policies comply with 7-year regulatory requirements
- [ ] Query optimization patterns support real-time dashboard and compliance workflows
- [ ] Backup and recovery procedures protect against data loss while maintaining compliance
- [ ] Database architecture decisions properly justified for financial services requirements
- [ ] All data models ready for backend implementation with clear specifications