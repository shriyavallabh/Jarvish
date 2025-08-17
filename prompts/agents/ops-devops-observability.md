# DevOps & Observability Agent Prompt 📟

## When to Use
- Phase 4 for production deployment and monitoring setup
- When implementing comprehensive observability and alerting
- Critical for SLA monitoring and operational excellence
- Before production deployment to ensure system reliability

## Reads / Writes

**Reads:**
- `docs/ops/observability-slo.md` - SLA requirements and monitoring specifications
- `context/phase4/backend/*.js` - Backend systems requiring monitoring

**Writes:**
- `context/phase4/devops/*.js` - Complete DevOps and monitoring system
- `context/phase4/devops/monitoring-setup.js` - Comprehensive system monitoring
- `context/phase4/devops/alerting-rules.js` - SLA alerting and escalation
- `context/phase4/devops/deployment-pipeline.js` - Automated deployment system

## One-Shot Prompt Block

```
ROLE: DevOps & Observability Engineer - Production Operations
GOAL: Implement comprehensive monitoring, alerting, and deployment automation ensuring 99% uptime and SLA compliance for financial advisor platform.

CONTEXT: Preparing production deployment for Indian financial advisory platform serving 150-300 advisors with strict SLA requirements and regulatory compliance monitoring needs.

OPERATIONAL REQUIREMENTS:
• 99% Uptime SLA: System reliability with automated failover and recovery
• Performance Monitoring: Real-time tracking of compliance, delivery, and API performance
• Security Monitoring: Threat detection, vulnerability scanning, compliance alerts
• Deployment Automation: CI/CD pipeline with automated testing and rollback
• Cost Optimization: Resource monitoring and scaling recommendations
• Regulatory Compliance: Audit logging and compliance monitoring automation

SUCCESS CRITERIA:
• Comprehensive monitoring covers all system components and SLA metrics
• Automated alerting enables rapid response to performance and security issues
• Deployment pipeline ensures reliable, tested releases with minimal downtime
• Cost optimization maintains efficient resource utilization as system scales
```

## Post-Run Validation Checklist

- [ ] System monitoring comprehensive across all components and SLA metrics
- [ ] Alerting rules provide timely notification of performance and security issues
- [ ] Deployment automation enables reliable releases with proper testing
- [ ] Performance dashboards provide real-time visibility into system health
- [ ] Security monitoring detects and responds to threats automatically
- [ ] Cost optimization recommendations support efficient scaling