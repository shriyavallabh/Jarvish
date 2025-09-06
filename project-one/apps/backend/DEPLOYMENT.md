# Jarvish Platform Deployment Guide

## Overview
This guide covers the complete deployment process for the Jarvish AI-powered financial advisory platform, including all external service configurations and production setup requirements.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [WhatsApp Business API](#whatsapp-business-api)
5. [External Services](#external-services)
6. [Cloud Infrastructure](#cloud-infrastructure)
7. [Deployment Process](#deployment-process)
8. [Post-Deployment](#post-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### Required Accounts & Services
- [ ] AWS Account (for hosting in ap-south-1 Mumbai region)
- [ ] Meta Business Account (for WhatsApp Business API)
- [ ] OpenAI API Account (for content generation)
- [ ] Razorpay Business Account (for payments)
- [ ] Domain name with DNS management access
- [ ] SSL certificates (or use AWS Certificate Manager)

### Local Development Tools
```bash
# Required tools
node --version      # v18+ required
npm --version       # v9+ required
postgresql --version # v14+ required
redis-server --version # v6+ required (optional for dev)
```

## Environment Configuration

### 1. Create Production Environment File
Create `.env.production` with all required variables:

```env
# Node Environment
NODE_ENV=production
PORT=8001

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/jarvish_db?schema=public

# OpenAI API
OPENAI_API_KEY=sk-your-production-openai-key
OPENAI_ORG_ID=org-your-org-id

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-production-access-token
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=secure-random-token
WHATSAPP_WEBHOOK_URL=https://api.jarvish.ai/api/webhooks/whatsapp

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Redis (for job queue)
REDIS_URL=redis://your-elasticache-endpoint:6379

# Application URLs
FRONTEND_URL=https://app.jarvish.ai
API_URL=https://api.jarvish.ai

# Security
JWT_SECRET=your-secure-jwt-secret
ENCRYPTION_KEY=your-32-byte-encryption-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### 2. Environment Variables Security
```bash
# Never commit .env files
echo ".env*" >> .gitignore

# Use AWS Secrets Manager for production
aws secretsmanager create-secret \
  --name jarvish/production/env \
  --secret-string file://.env.production
```

## Database Setup

### 1. AWS RDS PostgreSQL Setup
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier jarvish-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.9 \
  --master-username jarvish_admin \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --storage-encrypted \
  --vpc-security-group-ids sg-xxxx \
  --db-subnet-group-name jarvish-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --multi-az \
  --region ap-south-1
```

### 2. Run Database Migrations
```bash
# Set production database URL
export DATABASE_URL="postgresql://..."

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (if needed)
npm run seed:production
```

### 3. Database Backup Strategy
```bash
# Automated daily backups
aws rds modify-db-instance \
  --db-instance-identifier jarvish-prod-db \
  --backup-retention-period 30 \
  --apply-immediately

# Manual backup before major updates
aws rds create-db-snapshot \
  --db-instance-identifier jarvish-prod-db \
  --db-snapshot-identifier jarvish-backup-$(date +%Y%m%d)
```

## WhatsApp Business API

### 1. Meta Business Setup
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a new App with "Business" type
3. Add WhatsApp product to your app
4. Navigate to WhatsApp > Getting Started

### 2. Configure Phone Number
```javascript
// In Meta App Dashboard:
// 1. Add phone number
// 2. Verify business
// 3. Request display name
```

### 3. Create Message Templates
Navigate to WhatsApp > Message Templates and create:

```yaml
Template 1: daily_market_update
  Category: MARKETING
  Languages: en, hi, mr
  Header: Image
  Body: "Good morning! Here's your market update from {{1}}. {{2}}"
  
Template 2: investment_tip
  Category: MARKETING  
  Languages: en, hi, mr
  Body: "Investment Insight: {{1}} | {{2}} | Disclaimer: {{3}}"

Template 3: compliance_advisory
  Category: UTILITY
  Languages: en
  Body: "Regulatory Update: {{1}} | Action Required: {{2}}"
```

### 4. Configure Webhooks
In Meta App Dashboard > WhatsApp > Configuration:
```
Callback URL: https://api.jarvish.ai/api/webhooks/whatsapp
Verify Token: [your-verify-token]
Webhook Fields: messages, message_template_status_update, quality_update
```

### 5. Test WhatsApp Integration
```bash
# Run test script
cd apps/backend
node test-whatsapp-api.js
```

## External Services

### 1. OpenAI API Setup
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Configure rate limits in code
const openaiConfig = {
  maxRetries: 3,
  timeout: 30000,
  rateLimit: 100 // requests per minute
};
```

### 2. Razorpay Configuration
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Generate API keys from Settings > API Keys
3. Configure webhooks:
   - URL: `https://api.jarvish.ai/api/webhooks/razorpay`
   - Events: payment.captured, subscription.activated, subscription.charged

### 3. Redis Setup (AWS ElastiCache)
```bash
# Create ElastiCache cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id jarvish-redis \
  --engine redis \
  --engine-version 6.2.6 \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxx \
  --cache-subnet-group-name jarvish-cache-subnet \
  --region ap-south-1
```

## Cloud Infrastructure

### 1. AWS Architecture
```yaml
Region: ap-south-1 (Mumbai)
Services:
  - EC2/ECS: Application servers
  - RDS: PostgreSQL database
  - ElastiCache: Redis for queues
  - S3: Static assets & backups
  - CloudFront: CDN
  - Route53: DNS management
  - Certificate Manager: SSL
  - Secrets Manager: Environment variables
  - CloudWatch: Monitoring & logs
```

### 2. EC2 Instance Setup
```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0xxxxx \
  --instance-type t3.medium \
  --key-name jarvish-prod \
  --security-group-ids sg-xxxx \
  --subnet-id subnet-xxxx \
  --iam-instance-profile Name=jarvish-ec2-role \
  --user-data file://startup-script.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=jarvish-api-prod}]' \
  --region ap-south-1
```

### 3. Load Balancer Configuration
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name jarvish-alb \
  --subnets subnet-xxxx subnet-yyyy \
  --security-groups sg-xxxx \
  --region ap-south-1

# Configure target group
aws elbv2 create-target-group \
  --name jarvish-api-targets \
  --protocol HTTP \
  --port 8001 \
  --vpc-id vpc-xxxx \
  --health-check-path /health \
  --region ap-south-1
```

## Deployment Process

### 1. Build Application
```bash
# Backend build
cd apps/backend
npm ci --production
npm run build

# Frontend build  
cd apps/web
npm ci --production
npm run build
```

### 2. Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 8001
CMD ["npm", "start"]
```

```bash
# Build and push Docker image
docker build -t jarvish-api:latest .
docker tag jarvish-api:latest your-ecr-repo/jarvish-api:latest
docker push your-ecr-repo/jarvish-api:latest
```

### 3. Deploy with PM2
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'jarvish-api',
    script: './dist/simple-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    time: true
  }]
};
```

```bash
# Deploy with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Database Migrations
```bash
# Run migrations on production
NODE_ENV=production npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

## Post-Deployment

### 1. Verification Checklist
```bash
# Run verification script
node verify-setup.js

# Test all endpoints
curl https://api.jarvish.ai/health
curl https://api.jarvish.ai/api/v1

# Test WhatsApp webhook
curl https://api.jarvish.ai/api/webhooks/health
```

### 2. Configure Domain & SSL
```bash
# Route53 DNS records
Type A: api.jarvish.ai -> ALB
Type A: app.jarvish.ai -> CloudFront

# SSL Certificate (ACM)
aws acm request-certificate \
  --domain-name "*.jarvish.ai" \
  --validation-method DNS \
  --region us-east-1  # For CloudFront
```

### 3. Setup Monitoring
```javascript
// CloudWatch Alarms
const alarms = {
  highCPU: { threshold: 80, evaluationPeriods: 2 },
  highMemory: { threshold: 90, evaluationPeriods: 2 },
  apiErrors: { threshold: 10, evaluationPeriods: 1 },
  dbConnections: { threshold: 80, evaluationPeriods: 2 }
};
```

## Monitoring & Maintenance

### 1. Health Checks
```bash
# API health endpoint
GET /health

# Database health
GET /api/monitoring/health

# WhatsApp integration
GET /api/webhooks/health
```

### 2. Log Management
```bash
# CloudWatch Logs
aws logs create-log-group --log-group-name /aws/jarvish/api
aws logs put-retention-policy \
  --log-group-name /aws/jarvish/api \
  --retention-in-days 30
```

### 3. Performance Monitoring
```javascript
// Key metrics to track
const metrics = {
  api: {
    responseTime: '<1.5s P95',
    throughput: '>100 req/s',
    errorRate: '<0.1%'
  },
  whatsapp: {
    deliveryRate: '>99%',
    deliveryTime: '06:00-06:05 IST',
    templateQuality: 'GREEN/YELLOW'
  },
  database: {
    connectionPool: '<80%',
    queryTime: '<100ms P95',
    replicationLag: '<1s'
  }
};
```

### 4. Backup & Recovery
```bash
# Automated backups
- Database: Daily RDS snapshots (30-day retention)
- Application: Git repository + Docker images
- User data: S3 with versioning enabled
- Configurations: AWS Secrets Manager

# Disaster recovery
- RPO: 1 hour
- RTO: 2 hours
- Multi-AZ deployment
- Automated failover
```

### 5. Security Updates
```bash
# Regular security tasks
1. Update dependencies: npm audit fix
2. Rotate API keys quarterly
3. Review IAM permissions
4. Update SSL certificates
5. Security scanning with AWS Inspector
```

## Troubleshooting

### Common Issues & Solutions

#### WhatsApp Delivery Failures
```bash
# Check template quality
node test-whatsapp-api.js

# Verify webhook is receiving events
tail -f logs/webhooks.log

# Check rate limits
grep "429" logs/api.log
```

#### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Check connection pool
SELECT count(*) FROM pg_stat_activity;

# Reset connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'jarvish_db';
```

#### High Memory Usage
```bash
# Check PM2 status
pm2 monit

# Restart with memory limit
pm2 restart jarvish-api --max-memory-restart 1G

# Analyze memory leak
node --inspect app.js
```

## Support & Documentation

### Resources
- API Documentation: `/api/v1/docs`
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- OpenAI API: https://platform.openai.com/docs
- AWS Documentation: https://docs.aws.amazon.com

### Contact
- Technical Support: tech@jarvish.ai
- WhatsApp API Issues: Meta Business Support
- Infrastructure: AWS Support (based on plan)

### Version History
- v1.0.0 - Initial deployment (January 2025)
- Latest updates: Check CHANGELOG.md

---

**Note**: This deployment guide assumes production deployment on AWS. Adjust configurations based on your specific cloud provider and requirements. Always test deployments in staging environment first.