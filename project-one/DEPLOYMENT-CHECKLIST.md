# Jarvish Platform - Production Deployment Checklist

## 🚀 Pre-Deployment Requirements

### Environment Variables
```bash
# Required .env variables for production
NODE_ENV=production
PORT=8001

# Database
DATABASE_URL=postgresql://user:password@host:5432/jarvish

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Razorpay (when ready to switch from basic billing)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Monitoring (Optional)
DATADOG_API_KEY=your-datadog-key
SENTRY_DSN=your-sentry-dsn
```

### Database Setup
- [ ] PostgreSQL instance provisioned
- [ ] Database migrations created
- [ ] Initial seed data prepared
- [ ] Backup strategy configured
- [ ] Connection pooling configured

### Infrastructure
- [ ] Cloud provider selected (AWS/GCP/Azure)
- [ ] Server instances provisioned
- [ ] Load balancer configured
- [ ] CDN setup for static assets
- [ ] Domain and SSL certificates configured

## ✅ Code Preparation

### Backend Checklist
- [x] All API endpoints tested
- [x] Error handling implemented
- [x] Request validation (Zod schemas)
- [x] Logging system (Winston)
- [x] Performance monitoring middleware
- [ ] Rate limiting configured
- [ ] API documentation generated
- [ ] Security headers verified

### Frontend Checklist
- [x] Production build successful
- [x] Environment variables configured
- [x] SEO metadata added
- [ ] Analytics tracking code added
- [ ] Error boundary components
- [ ] Loading states for all async operations
- [ ] Mobile responsiveness verified

### Testing
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests completed
- [ ] End-to-end tests passing
- [ ] Performance testing completed
- [ ] Security audit performed
- [ ] Accessibility audit (WCAG 2.1 AA)

## 🔧 Deployment Steps

### 1. Database Migration
```bash
# Run migrations
npm run prisma:migrate deploy

# Seed initial data
npm run seed
```

### 2. Build Applications
```bash
# Build backend
cd apps/backend
npm run build

# Build frontend
cd apps/web
npm run build
```

### 3. Deploy Backend
```bash
# Using PM2 for process management
pm2 start dist/simple-server.js --name jarvish-backend
pm2 save
pm2 startup
```

### 4. Deploy Frontend
```bash
# Deploy to Vercel/Netlify
vercel --prod
# OR
netlify deploy --prod
```

### 5. Configure WhatsApp Webhook
```bash
# Register webhook URL
curl -X POST https://graph.facebook.com/v17.0/PHONE_NUMBER_ID/register \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d "webhook_url=https://your-domain.com/api/webhooks/whatsapp"
```

## 📊 Post-Deployment Monitoring

### Health Checks
- [ ] `/health` endpoint responding
- [ ] `/api/monitoring/health` showing all services healthy
- [ ] Database connections stable
- [ ] Redis cache operational
- [ ] WhatsApp API connected

### Performance Metrics
- [ ] Response times < 1.5s for compliance checks
- [ ] WhatsApp delivery rate > 99%
- [ ] System uptime > 99.9%
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%

### Business Metrics
- [ ] Advisor onboarding flow working
- [ ] Content generation functional
- [ ] Compliance validation accurate
- [ ] WhatsApp messages delivering
- [ ] Analytics data collecting

## 🚨 Rollback Plan

### Automated Rollback Triggers
- Application crash rate > 1%
- Response time > 3s for 5 minutes
- Error rate > 5%
- Memory usage > 90%

### Manual Rollback Steps
1. Switch load balancer to previous version
2. Restore database from backup if needed
3. Clear Redis cache
4. Notify team via Slack/Discord
5. Investigate root cause

## 📝 Production Configuration

### Recommended Server Specs
- **Backend Server**: 4 vCPUs, 8GB RAM, 100GB SSD
- **Database Server**: 4 vCPUs, 16GB RAM, 200GB SSD
- **Redis Server**: 2 vCPUs, 4GB RAM, 50GB SSD

### Scaling Considerations
- Horizontal scaling ready (stateless backend)
- Database read replicas for analytics
- Redis cluster for high availability
- CDN for image delivery
- Queue workers for WhatsApp delivery

## 🔐 Security Checklist

### Application Security
- [ ] All secrets in environment variables
- [ ] HTTPS enforced everywhere
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection (React)
- [ ] CSRF tokens implemented

### Compliance
- [ ] SEBI Ad Code compliance verified
- [ ] DPDP Act compliance (data in India)
- [ ] WhatsApp Business Policy compliance
- [ ] User consent management active
- [ ] Audit logging enabled
- [ ] Data retention policies configured

## 📈 Launch Readiness

### Business Readiness
- [ ] Support team trained
- [ ] Documentation completed
- [ ] Pricing plans confirmed
- [ ] Marketing materials ready
- [ ] Initial advisors identified

### Technical Readiness
- [ ] All endpoints functional (24/29 currently passing)
- [ ] Monitoring dashboards configured
- [ ] Alert rules configured
- [ ] Backup procedures tested
- [ ] Disaster recovery plan documented

## 🎯 Go-Live Checklist

### Day of Launch
- [ ] Final code review completed
- [ ] Database backed up
- [ ] Team on standby
- [ ] Monitoring dashboards open
- [ ] Communication channels ready

### First 24 Hours
- [ ] Monitor error rates
- [ ] Check WhatsApp delivery rates
- [ ] Review performance metrics
- [ ] Gather user feedback
- [ ] Address critical issues

### First Week
- [ ] Daily performance reviews
- [ ] User onboarding analysis
- [ ] Feature adoption tracking
- [ ] Bug fixes and patches
- [ ] Performance optimization

## 📞 Emergency Contacts

```yaml
On-Call Engineer: [Phone Number]
Database Admin: [Phone Number]
WhatsApp Support: [Support Ticket URL]
Cloud Provider Support: [Support Number]
```

## 🎉 Launch Status

- **Current Status**: Development Complete
- **API Readiness**: 24/29 endpoints functional
- **External Dependencies**: WhatsApp API pending
- **Database**: Migration pending
- **Estimated Launch Date**: [To be determined]

---

*Last Updated: September 6, 2025*
*Next Review: Before production deployment*