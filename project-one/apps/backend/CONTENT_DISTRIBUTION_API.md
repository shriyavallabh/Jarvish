# Jarvish Content Distribution Platform - Backend API

## Overview
Complete backend transformation from individual advisor content creation to centralized admin content distribution platform.

## Architecture Changes

### Previous Model (Individual Content Creation)
- Advisors create their own content
- Each advisor manages compliance
- Individual WhatsApp sending
- Per-advisor content management

### New Model (Centralized Distribution)
- Admins create content centrally
- AI-powered content generation
- Bulk distribution to all subscribers
- Scheduled 6 AM IST daily delivery
- Multi-channel distribution (WhatsApp, LinkedIn)

## Database Schema

### Core Models

#### Users (formerly Advisors)
- Now represents subscribers who pay for content
- Role-based access: SUBSCRIBER, ADMIN, SUPER_ADMIN
- WhatsApp Business integration details

#### Content Templates
- Admin-created content for distribution
- Multi-language support (10 Indian languages)
- AI generation metadata
- Approval workflow
- Scheduling capabilities

#### Subscriptions
- Plan tiers: BASIC_499, STANDARD_999, PREMIUM_1999, ENTERPRISE_CUSTOM
- Razorpay integration
- Feature-based access control
- Usage tracking

#### Content Delivery
- Tracks individual message delivery
- WhatsApp and LinkedIn status
- Retry mechanism
- Analytics tracking

## API Endpoints

### Admin Content Management
```
POST   /api/v1/admin/content/create          - Create new content
PUT    /api/v1/admin/content/:id/approve     - Approve content
POST   /api/v1/admin/content/schedule        - Schedule distribution
GET    /api/v1/admin/content/analytics       - View analytics
DELETE /api/v1/admin/content/:id             - Delete content
```

### AI Content Generation
```
POST   /api/v1/admin/content/generate-ai     - Generate with AI
POST   /api/v1/admin/content/scrape-and-generate - Web scraping + AI
PUT    /api/v1/admin/content/prompts         - Update AI prompts
POST   /api/v1/admin/content/upload-image    - Upload images
```

### Subscription Management
```
GET    /api/v1/subscriptions/plans           - Available plans
POST   /api/v1/subscriptions/create          - Create subscription
GET    /api/v1/subscriptions/status          - Check status
POST   /api/v1/subscriptions/cancel          - Cancel subscription
GET    /api/v1/subscriptions/usage           - Usage statistics
```

### Distribution System
```
GET    /api/v1/distribution/status           - Distribution status
POST   /api/v1/distribution/send-daily-content - Manual trigger
GET    /api/v1/distribution/queue            - View queue
GET    /api/v1/distribution/deliveries       - Delivery logs
POST   /api/v1/distribution/retry-failed     - Retry failed
```

## Key Features

### 1. AI Content Generation
- OpenAI GPT-4 integration
- Custom prompts per content type
- Web scraping for automated content
- Multi-language generation

### 2. Automated Distribution
- 6 AM IST daily scheduling
- Bulk WhatsApp sending
- LinkedIn posting
- Retry mechanism for failures

### 3. Subscription Management
- Razorpay payment integration
- Automated billing
- Feature-based access
- Usage tracking

### 4. Analytics & Reporting
- Content performance metrics
- Delivery statistics
- Engagement tracking
- Revenue analytics

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- WhatsApp Business API access
- Razorpay account
- OpenAI API key

### Installation
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### Environment Variables
```env
# Core Services
DATABASE_URL=postgresql://user:pass@localhost:5432/jarvish
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Integrations
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
WHATSAPP_PHONE_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx
OPENAI_API_KEY=sk-xxx
```

## Migration Guide

### From Old to New System

1. **User Migration**
   - Convert Advisors to Users table
   - Set all existing users as SUBSCRIBER role
   - Create admin accounts manually

2. **Content Migration**
   - Archive individual advisor content
   - Create new admin content templates
   - Set up AI prompts

3. **Subscription Setup**
   - Create Razorpay plans
   - Migrate existing subscriptions
   - Set up webhook endpoints

4. **WhatsApp Configuration**
   - Update to centralized sending
   - Configure webhooks
   - Set up templates

## Testing

### Test Admin APIs
```bash
# Create admin user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jarvish.ai",
    "password": "admin123",
    "name": "Admin",
    "role": "ADMIN"
  }'

# Create content
curl -X POST http://localhost:8000/api/v1/admin/content/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "WHATSAPP_MESSAGE",
    "content": "Market update for today...",
    "language": "EN"
  }'
```

### Test Distribution
```bash
# Trigger manual distribution
curl -X POST http://localhost:8000/api/v1/distribution/send-daily-content \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Check status
curl http://localhost:8000/api/v1/distribution/status \
  -H "Authorization: Bearer TOKEN"
```

## Production Deployment

### Requirements
- PM2 for process management
- Nginx for reverse proxy
- SSL certificates
- Monitoring (Sentry/New Relic)
- Backup strategy

### Deployment Steps
```bash
# Build TypeScript
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start dist/server.js --name jarvish-api

# Setup Nginx
# Configure SSL
# Setup monitoring
```

## Security Considerations

1. **Authentication**
   - JWT with refresh tokens
   - Role-based access control
   - Rate limiting per plan

2. **Data Protection**
   - Encrypted sensitive data
   - Audit logging
   - GDPR/DPDP compliance

3. **API Security**
   - Input validation
   - SQL injection prevention
   - XSS protection

## Monitoring & Maintenance

### Health Checks
- GET /health - System health
- GET /api/v1/distribution/status - Distribution status

### Logs
- Application logs in ./logs
- Audit trails in database
- Error tracking with Sentry

### Backup
- Daily database backups
- Redis persistence
- Content archives

## Support & Documentation

- API Documentation: /api/v1
- Postman Collection: [Available on request]
- Support: dev@jarvish.ai

## License
Proprietary - Jarvish AI Private Limited