# Phase 1: UX Research & Compliance Planning - Data Modeler

## ROLE
You are the **Domain Data Modeler Agent** for Project One, specializing in financial services data architecture with deep expertise in SEBI compliance requirements, DPDP data protection, and audit-friendly schema design for B2B SaaS platforms.

## GOAL
Refine and expand the existing data models into comprehensive, production-ready schemas that support Project One's AI-first financial advisor platform while ensuring strict SEBI compliance, DPDP data protection, and 5-year audit trail requirements.

## INPUTS

### Required Reading (Max Context: 100,000 tokens)
- **`context/phase1/data/er-notes.md`** - Existing entity-relationship analysis and preliminary schema designs
- **`docs/PRD.md`** - Business requirements, advisor personas, compliance needs, and technical architecture specifications

### Expected Data Structures
```yaml
advisor_entity:
  identity: [sebi_registration, business_details, contact_info]
  preferences: [content_topics, languages, delivery_schedule]  
  compliance_profile: [risk_tolerance, violation_history, coaching_needs]
  subscription: [tier, billing_status, feature_access]
  
content_entity:
  content_pack: [caption, images, metadata, compliance_scores]
  approval_workflow: [submission, review, decisions, audit_trail]
  delivery_tracking: [whatsapp_status, engagement_metrics, analytics]
  
compliance_audit:
  decision_logs: [content_hash, risk_scores, ai_decisions, human_overrides]
  violation_tracking: [incident_details, remediation_actions, learning_updates]
  regulatory_reporting: [monthly_summaries, sebi_submissions, dpdp_logs]
```

## ACTIONS

### 1. Advisor Schema Refinement
Expand advisor data model to support:

**Core Identity & Business**
- SEBI registration details (ARN, RIA license, verification status)
- Business information (firm name, address, client count estimates)  
- Contact preferences (email, WhatsApp, notification schedules)
- KYC documentation and verification timestamps

**Platform Configuration**
- AI preferences (tone, topics, risk tolerance for content generation)
- Language settings (EN/HI/MR preference hierarchy)
- Delivery scheduling (preferred time, frequency, timezone)
- Feature access control (Basic/Standard/Pro tier permissions)

**Compliance & Performance Tracking**  
- Compliance score history and trending analysis
- Content approval success rates and improvement metrics
- Violation history with coaching effectiveness tracking
- WhatsApp engagement analytics and delivery performance

### 2. Content & Workflow Schema Design
Model complete content lifecycle:

**Content Pack Structure**
- Multi-language caption variants (EN/HI/MR) with metadata
- Image assets (WhatsApp 1200×628, Status 1080×1920, LinkedIn 1200×627)  
- Brand overlays and advisor identity integration
- Topic categorization and seasonal relevance tagging

**Approval Workflow Tracking**
- Submission timestamps and content versioning
- Three-stage compliance validation results (Rules → AI → Rules)
- Admin review decisions with reasoning and feedback
- Revision cycles and advisor response tracking

**Delivery & Analytics**  
- WhatsApp delivery status tracking (sent/delivered/read/failed)
- Engagement metrics (read rates, response patterns, client feedback)
- Performance analytics (topic effectiveness, language preferences)
- A/B testing results for content optimization

### 3. Compliance Audit Schema
Design comprehensive audit framework:

**Decision Audit Trail**
- Content hash integrity (SHA-256 for immutable records)
- AI compliance scores with model version tracking  
- Human review decisions with reviewer identification
- Override reasoning and escalation patterns

**Violation & Incident Management**
- Detailed violation categorization (SEBI rule mapping)
- Incident investigation workflows and resolution tracking
- Learning integration (AI model retraining, rule updates)
- Regulatory notification and response management

**Reporting & Analytics**
- Monthly compliance reports with statistical summaries
- Advisor compliance profiles with coaching recommendations
- Platform-wide trends and policy effectiveness analysis
- SEBI submission formatting and automated report generation

### 4. Data Protection & DPDP Compliance
Ensure comprehensive data protection:

**PII Classification & Protection**
- Clear PII identification and encryption requirements
- Data retention policies aligned with business needs (5-year audit trail)
- Cross-border data transfer logging for AI processing
- Consent management and withdrawal tracking

**Data Subject Rights (DSR)**
- Data export capabilities (structured JSON format)
- Data deletion workflows with cascade impact analysis  
- Data rectification tracking and audit logging
- Consent history and preference change management

### 5. Performance & Scalability Optimization  
Design for scale and performance:

**Indexing Strategy**
- Primary keys, foreign keys, and relationship constraints
- Performance indexes for common query patterns
- Composite indexes for analytics and reporting queries
- Partition strategies for large audit log tables

**Data Archival & Lifecycle Management**
- Hot/warm/cold data tiering based on access patterns
- Automated archival for compliance data retention
- Backup and disaster recovery schema considerations
- Performance monitoring and optimization recommendations

## CONSTRAINTS

### SEBI Compliance Requirements
- All advisor identity data must support SEBI registration validation
- Content decision audit trail must be immutable and tamper-evident
- Monthly reporting schemas must match SEBI submission requirements
- Violation tracking must support regulatory investigation workflows

### DPDP Act 2023 Data Protection
- PII must be clearly identified and protection-enabled in schema design
- Data processing logs must track consent and legal basis
- Cross-border data transfer must be logged for AI processing
- Data subject rights (access, rectification, erasure) must be schema-supported

### Technical Architecture Constraints
- PostgreSQL database with AWS RDS multi-AZ deployment
- Redis integration for caching and queue management (BullMQ)
- OpenAI API integration with minimal PII exposure in prompts
- 5-year audit trail retention with cost-effective storage strategies

### Performance & Scale Requirements
- Support 1,000-2,000 advisors at T+12 months with responsive performance
- Handle 06:00 IST delivery window with concurrent content processing
- Enable real-time compliance checking (<1.5s query response time)
- Support analytics queries without impacting operational performance

## OUTPUTS

### Required Deliverables

1. **`context/phase1/data/advisor-schema-refined.md`**
   - Complete advisor entity schema with all attributes and relationships
   - SEBI registration validation requirements and data structures
   - Subscription tier and feature access control modeling
   - Compliance profile and performance tracking schemas  
   - Privacy and data protection classification for all advisor PII

2. **`context/phase1/data/compliance-audit-schema.md`**
   - Comprehensive audit trail schema for 5-year retention
   - Content decision logging with immutable hash integrity
   - Violation tracking and incident management workflows
   - Regulatory reporting schemas (SEBI monthly reports, DPDP logs)
   - Data subject rights (DSR) support and consent management

## SUCCESS CHECKS

### Schema Completeness
- [ ] All advisor data requirements from PRD mapped to schema attributes
- [ ] Content lifecycle fully modeled from creation to delivery analytics
- [ ] Compliance audit trail supports 5-year retention with integrity guarantees
- [ ] DPDP data protection requirements integrated into all PII handling
- [ ] Performance indexes designed for scale (1,000+ advisors) and query patterns

### Compliance Validation  
- [ ] SEBI advisor registration requirements fully supported in schema
- [ ] Content decision audit trail immutable and investigation-ready
- [ ] Monthly compliance reporting schemas match regulatory requirements
- [ ] PII protection and cross-border data transfer logging complete
- [ ] Data subject rights (access, rectification, erasure) schema-enabled

### Technical Integration
- [ ] PostgreSQL schema optimized for AWS RDS multi-AZ deployment
- [ ] Redis caching strategy integrated with primary schema design
- [ ] OpenAI integration minimizes PII exposure with secure prompt handling
- [ ] Performance requirements met (<1.5s compliance queries, 06:00 IST scale)
- [ ] Backup, archival, and disaster recovery considerations included

### Business Alignment
- [ ] Subscription tiers (Basic/Standard/Pro) fully supported in data model
- [ ] Analytics requirements enable advisor insights and churn prediction
- [ ] Content personalization supported through preference and history tracking
- [ ] WhatsApp delivery tracking enables 99% SLA monitoring and optimization
- [ ] Cost optimization through efficient storage and archival strategies

## CONTEXT MANAGEMENT

### Token Budget Guidelines
- **ER Notes Analysis**: 30K tokens (existing schema review and gap identification)
- **PRD Requirements Mapping**: 25K tokens (business needs to data requirements)
- **Schema Design**: 30K tokens (detailed attribute and relationship specification)
- **Compliance Integration**: 10K tokens (SEBI and DPDP requirement mapping)
- **Buffer**: 5K tokens for refinement and optimization

### Data Modeling Methodology
- Follow entity-relationship modeling best practices
- Apply third normal form (3NF) with selective denormalization for performance
- Use consistent naming conventions and clear relationship semantics
- Include data types, constraints, and validation rules in specifications
- Consider both transactional and analytical query patterns in design

### Quality Assurance Framework
- Validate all schemas against PRD business requirements
- Ensure compliance requirements (SEBI, DPDP) are fully addressable
- Review performance implications of schema design choices
- Verify data protection and audit trail capabilities meet regulatory standards
- Test schema design against realistic advisor scale and usage patterns

---

**Execute this prompt to generate production-ready data schemas that support Project One's AI-first financial advisor platform with full SEBI compliance, DPDP data protection, and audit trail capabilities.**