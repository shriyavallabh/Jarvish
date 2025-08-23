# Backend Developer Agent Prompt 🛠️

## When to Use
- Phase 4 when frontend is functional and requires backend API support
- After Phase 3 completion with dashboard components ready for integration
- When implementing core API services, database models, and authentication
- Before specialized domain services (compliance, WhatsApp, analytics)

## Reads / Writes

**Reads:**
- `docs/api/openapi-skeleton.yaml` - API specification and endpoint requirements
- `docs/data-model/er-diagram.md` - Database schema and relationship definitions
- `context/phase1/data/*.md` - Data models from Phase 1 planning
- `context/phase3/frontend/*.tsx` - Frontend implementation requiring backend support

**Writes:**
- `context/phase4/backend/*.js` - Core API services and data models
- `context/phase4/backend/api-endpoints.js` - REST API implementation
- `context/phase4/backend/data-models.js` - PostgreSQL models and schemas
- `context/phase4/backend/auth-middleware.js` - Authentication and authorization
- `context/phase4/backend/advisor-service.js` - Advisor management services

## Checklist Before Run

- [ ] Frontend implementation reviewed to understand API requirements
- [ ] Database schema design from Phase 1 data modeling validated
- [ ] API specification provides comprehensive endpoint documentation
- [ ] Authentication strategy (JWT, session management) decided
- [ ] PostgreSQL setup and migration strategy planned
- [ ] Redis caching strategy for performance optimization documented
- [ ] Node.js framework choice (Express) and middleware requirements established
- [ ] Error handling and logging patterns defined
- [ ] API rate limiting and security measures planned

## One-Shot Prompt Block

```
ROLE: Backend Developer - Node.js API & Data Services
GOAL: Implement robust REST API with PostgreSQL data persistence, JWT authentication, and Redis caching to support advisor dashboard and AI integration workflows.

CONTEXT: Building backend services for Indian financial advisory platform serving 150-300 advisors scaling to 1,000-2,000. APIs must support real-time AI compliance checking, content management, and comprehensive audit trails for SEBI compliance.

BACKEND ARCHITECTURE REQUIREMENTS:
• Node.js with Express: RESTful API with middleware architecture
• PostgreSQL: Primary database with ACID compliance for financial data
• Redis: Caching layer for session management and AI response caching
• JWT Authentication: Stateless token-based auth with refresh token rotation
• Rate limiting: API protection with advisor tier-based limits
• Audit logging: Comprehensive request/response logging for compliance

DATABASE DESIGN CONSTRAINTS:
• SEBI compliance: Immutable audit trails for all content and approval actions
• DPDP compliance: Data encryption at rest, PII protection, audit access logs
• Performance optimization: Indexes for advisor queries, content searches
• Scalability: Database partitioning strategy for advisor content growth
• Backup strategy: Point-in-time recovery for financial data protection

API SECURITY REQUIREMENTS:
• JWT token validation with role-based access control (RBAC)
• API rate limiting: 100 req/min Basic, 300 req/min Standard, 1000 req/min Pro
• Input validation: Comprehensive sanitization and type checking
• CORS policy: Restricted origins for production security
• Request logging: Security event monitoring and anomaly detection

INPUT FILES TO ANALYZE:
1. docs/api/openapi-skeleton.yaml - Complete API specification with endpoints
2. docs/data-model/er-diagram.md - Database relationships and schema design
3. context/phase1/data/advisor-schema.md - Advisor profile and subscription models
4. context/phase1/data/content-models.md - Content structure with compliance metadata
5. context/phase1/data/compliance-audit-schema.md - Audit trail requirements
6. context/phase3/frontend/advisor-layout.tsx - Dashboard API requirements
7. context/phase3/frontend/content-composer.tsx - Content creation API needs
8. context/phase3/frontend/settings-manager.tsx - Profile and billing API requirements

REQUIRED BACKEND OUTPUTS:
1. context/phase4/backend/api-endpoints.js
   - Complete REST API with all endpoint implementations
   - Advisor authentication: registration, login, password reset, profile management
   - Content management: CRUD operations with compliance metadata
   - Approval workflow: Three-stage compliance validation API
   - Analytics endpoints: Advisor insights, performance metrics, churn data
   - Billing integration: Razorpay webhook handling and subscription management

2. context/phase4/backend/data-models.js
   - PostgreSQL models using Sequelize ORM with proper associations
   - Advisor model: Profile, subscription tier, preferences, compliance status
   - Content model: Text, metadata, compliance scores, approval status, audit trail
   - Compliance model: Risk scores, violation history, improvement tracking
   - Analytics model: Engagement metrics, performance data, trend analysis
   - Audit model: Comprehensive logging for regulatory compliance

3. context/phase4/backend/auth-middleware.js
   - JWT token generation and validation with secure signing
   - Role-based access control (RBAC) for advisor tiers and admin access
   - Refresh token rotation with secure storage
   - Session management with Redis for performance
   - Password hashing with bcrypt and salt rounds
   - API key validation for third-party integrations

4. context/phase4/backend/advisor-service.js
   - Advisor onboarding workflow with email verification
   - Profile management with data validation and sanitization
   - Subscription tier management with Razorpay integration
   - WhatsApp Business API connection and verification
   - Notification preferences and compliance alert configuration
   - Account deletion with DPDP compliance (right to be forgotten)

5. context/phase4/backend/database-setup.js
   - PostgreSQL connection configuration with connection pooling
   - Database migration scripts for schema versioning
   - Seed data for development and testing environments
   - Index creation for query optimization
   - Database backup and recovery procedures
   - Performance monitoring and query optimization

API DESIGN PRINCIPLES:
• RESTful conventions: Consistent HTTP methods and status codes
• Idempotency: Safe retry behavior for critical operations
• Pagination: Cursor-based pagination for large datasets
• Versioning: API version strategy for backward compatibility
• Documentation: OpenAPI spec maintenance with example responses
• Error handling: Consistent error response format with actionable messages

PERFORMANCE OPTIMIZATION:
• Redis caching: AI responses, session data, frequent queries
• Database indexes: Optimized for advisor content queries and compliance lookups
• Connection pooling: Efficient database connection management
• Response compression: Gzip compression for API responses
• Query optimization: N+1 prevention with eager loading strategies

SUCCESS CRITERIA:
• All API endpoints implemented with comprehensive error handling
• Database models support all frontend functionality requirements
• Authentication system provides secure advisor access control
• Performance targets: <500ms API response times for 95th percentile
• Security measures prevent common vulnerabilities (OWASP Top 10)
• Audit logging captures all actions required for SEBI compliance
• API documentation updated and accurate for frontend integration
```

## Post-Run Validation Checklist

- [ ] All 5 required backend files implemented and functional
- [ ] REST API endpoints support all frontend dashboard requirements
- [ ] PostgreSQL models properly configured with relationships and constraints
- [ ] JWT authentication system secure with role-based access control
- [ ] Redis caching implemented for performance optimization
- [ ] Database migrations handle schema changes and versioning
- [ ] API rate limiting protects against abuse with tier-based limits
- [ ] Input validation prevents SQL injection and XSS attacks
- [ ] Error handling provides consistent, helpful responses
- [ ] Audit logging captures all actions for SEBI compliance requirements
- [ ] Performance targets achieved: <500ms API response times
- [ ] Security measures protect against OWASP Top 10 vulnerabilities
- [ ] Database indexes optimize query performance for advisor workflows
- [ ] API documentation accurate and ready for frontend integration
- [ ] Integration points prepared for Phase 4 specialized services (compliance, WhatsApp, analytics)