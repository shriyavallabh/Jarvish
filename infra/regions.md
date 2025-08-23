# Infrastructure Regional Strategy - Project One 🌏

## Primary Region: ap-south-1 (Mumbai, India)

### Selection Justification
**Latency Optimization:**
• Sub-50ms latency for Indian financial advisors across major cities (Mumbai, Delhi, Bangalore, Chennai, Pune)
• Optimal response times for real-time content generation and compliance checking during peak 06:00 IST delivery window
• Direct fiber connectivity to major Indian ISPs reduces network hops for WhatsApp API integration

**DPDP Act 2023 Compliance:**
• Ensures all Personal Identifiable Information (PII) including advisor data, SEBI registrations, and client communications remain within Indian jurisdiction
• Meets data localization requirements for financial services sector as mandated by RBI and SEBI
• Simplifies Data Subject Rights (DSR) fulfillment with local data residency for access, rectification, and erasure requests

**Infrastructure Reliability:**  
• AWS ap-south-1 offers 99.99% SLA with 3 Availability Zones (Mumbai AZ-1a, 1b, 1c) for multi-AZ deployment
• Dedicated financial services infrastructure with enhanced compliance controls and audit capabilities
• Local AWS support team with financial sector expertise for critical incident resolution during business hours (09:00-22:00 IST)

### Services Deployment
- **RDS PostgreSQL**: Multi-AZ with automated backups, point-in-time recovery
- **ElastiCache Redis**: Queue management (BullMQ), session storage, AI caching
- **ECS Fargate**: API services, AI processing, WhatsApp webhook handlers
- **Application Load Balancer**: SSL termination, health checks, auto-scaling
- **KMS**: Encryption key management for PII at-rest

### Performance Targets
- **Database**: <5ms query latency P95, 99.9% availability
- **Cache**: <1ms Redis operations, cluster mode for high availability  
- **Compute**: Auto-scaling 2-50 tasks based on queue depth and CPU

## Content Delivery: Cloudflare Global Network

### Regional Strategy
- **Primary PoP**: Mumbai, Chennai, Delhi for India traffic
- **Edge Caching**: R2 storage with India-optimized edge locations
- **Cache TTL**: 48h for generated images, 24h for preview content
- **Bandwidth**: Unlimited with DDoS protection included

### Performance Benefits
- **Image Delivery**: <200ms loading time for advisors in tier-1 cities
- **WhatsApp Media**: Pre-cached media IDs for faster message sending
- **Dashboard Assets**: CDN-cached UI components, reduced server load

## AI Processing: Global with Data Minimization

### OpenAI Integration
- **Primary**: US-East endpoints (lowest latency for GPT models)
- **Data Policy**: Content-only transmission, no PII in prompts
- **Compliance**: Contractual data retention opt-out where available
- **Fallback**: Multiple region endpoints for redundancy

### Performance Architecture
- **Connection Pooling**: Persistent connections to reduce handshake latency
- **Request Batching**: Combine multiple lint requests where possible
- **Caching Layer**: Redis-based prompt and response caching (14-day TTL)
- **Circuit Breakers**: Auto-fallback to lighter models on timeout/errors

## WhatsApp Cloud API: Meta Infrastructure

### Geographic Distribution
- **Primary Endpoint**: Meta's Edge network (auto-routed globally)
- **Webhook Destination**: ap-south-1 load balancer with HMAC verification
- **Media Storage**: Cloudflare R2 with signed URLs for image delivery
- **Template Management**: Global template registry with India locale support

### Quality & Compliance
- **Number Strategy**: Multiple numbers on single WABA for scale protection
- **Quality Monitoring**: Real-time delivery rate and quality score tracking
- **Compliance**: Message template adherence, opt-in/out management
- **Recovery**: Hot spare numbers for quality rating protection

## Monitoring & Observability

### Datadog Configuration
- **Site**: US5 (supports Indian data residency preferences)
- **Data Export**: Controlled cross-border with contractual safeguards
- **Retention**: 15 months with automated compliance reporting
- **Alerting**: India timezone-aware notifications and on-call schedules

### APM Coverage
- **Tracing**: OpenTelemetry across all services in ap-south-1
- **Metrics**: Custom business metrics (delivery rates, AI performance)
- **Logs**: Structured JSON with PII redaction, central aggregation
- **Dashboards**: Real-time ops dashboards with SLO tracking

## Disaster Recovery: Multi-AZ + Cross-Region

### Primary DR (Within ap-south-1)
- **Multi-AZ**: Database and cache automatic failover
- **Auto Scaling**: Compute resources across 3 availability zones
- **Load Balancing**: Health check-based traffic routing
- **Data Replication**: Synchronous within region

### Secondary DR (ap-southeast-1 Singapore)
- **Database**: Daily automated snapshots with cross-region copying
- **Application Code**: Containerized deployment ready for rapid activation
- **Configuration**: Infrastructure-as-code for consistent environment
- **RTO Target**: 60 minutes for emergency failover

## Security & Network Architecture

### VPC Design
- **Private Subnets**: Database, cache, and internal services
- **Public Subnets**: Load balancers and NAT gateways only
- **Security Groups**: Principle of least privilege, minimal open ports
- **NACLs**: Additional network-level access controls

### Data Protection
- **Encryption in Transit**: TLS 1.3 for all external connections
- **Encryption at Rest**: AWS KMS with quarterly key rotation
- **Network Segmentation**: Isolated subnets for different service tiers
- **VPN Access**: Site-to-site VPN for admin access if needed

## Cost Optimization Strategy

### Resource Sizing
- **Right-sizing**: Start small, scale based on actual usage patterns
- **Reserved Instances**: 1-year commitments for predictable workloads
- **Spot Instances**: For non-critical batch processing (AI queue overflow)
- **Storage Tiering**: Automated lifecycle policies for older backups

### Budget Controls
- **Infrastructure**: ≤₹65k/month ceiling with 20% flex allowance
- **AI Costs**: ≤₹25k/month with per-advisor caps and degradation
- **Monitoring**: Real-time cost tracking with budget alerts
- **Optimization**: Monthly cost review and right-sizing recommendations

## Compliance & Audit

### Data Residency
- **PII Location**: All advisor and content data remains in ap-south-1
- **Audit Logs**: Append-only storage with 5-year retention requirement
- **Cross-border**: Only for AI processing with contractual protections
- **DSAR Support**: Automated data export/deletion with tracking

### Regulatory Reporting
- **SEBI Compliance**: Monthly advisor activity reports with content hashes
- **DPDP Compliance**: Data processing records, consent management
- **Financial Audit**: Billing and transaction logs with tamper detection
- **Change Management**: All infrastructure changes logged and approved