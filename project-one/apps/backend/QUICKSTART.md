# Jarvish Platform Quick Start Guide

Welcome to the Jarvish AI-powered financial advisory platform! This guide will help you get started quickly.

## 🚀 Current Status

### ✅ What's Working
- **Backend API Server**: Running on port 8001
- **Frontend Application**: Running on port 3000  
- **Redis Cache**: Connected and operational
- **Compliance Engine**: Basic rule checking functional
- **Billing System**: Plans and pricing configured
- **Monitoring**: Real-time metrics and alerts
- **Analytics**: Business intelligence dashboards

### ⚠️ Configuration Needed
- **OpenAI API Key**: Required for AI content generation
- **WhatsApp Business API**: Credentials needed for message delivery
- **PostgreSQL Database**: Service needs to be started
- **Razorpay**: Payment gateway credentials (optional)

## 📋 Quick Setup Steps

### 1. Start PostgreSQL Database
```bash
# macOS
brew services start postgresql

# Ubuntu/Debian  
sudo systemctl start postgresql

# Run database setup
cd apps/backend
./setup-database.sh
```

### 2. Configure API Keys
Edit `.env.local` file in `apps/backend/`:
```env
# Required for AI features
OPENAI_API_KEY=sk-your-actual-openai-key

# Required for WhatsApp delivery
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-id
```

### 3. Verify Setup
```bash
cd apps/backend
node verify-setup.js
```

## 🔧 Available Services

### Backend API (Port 8001)
```bash
# Health check
curl http://localhost:8001/health

# API documentation
curl http://localhost:8001/api/v1

# Test compliance checking
curl -X POST http://localhost:8001/api/compliance/check \
  -H "Content-Type: application/json" \
  -d '{"content": "Your investment advice here", "type": "marketing"}'
```

### Frontend Dashboard (Port 3000)
- Landing Page: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin (in development)
- Advisor Dashboard: http://localhost:3000/advisor (in development)

## 📊 API Endpoints Overview

### Compliance Services
- `POST /api/compliance/check` - Check content compliance
- `POST /api/compliance/generate` - Generate compliant content
- `GET /api/compliance/rules` - View compliance rules
- `POST /api/compliance/fix` - Auto-fix compliance issues

### WhatsApp Integration
- `GET /api/whatsapp/templates` - List message templates
- `POST /api/whatsapp/send-template` - Send WhatsApp message
- `GET /api/whatsapp/health` - Check WhatsApp API status

### Image Processing
- `POST /api/images/process-gpt` - Process GPT-image-1 to 1200x628
- `POST /api/images/whatsapp-formats` - Generate WhatsApp-optimized images

### Billing & Subscriptions
- `GET /api/billing/plans` - View subscription plans
- `POST /api/billing/validate-promo` - Validate promo codes
- `POST /api/billing/invoice-preview` - Generate invoice preview

### Analytics & Monitoring
- `GET /api/analytics/advisors` - Advisor performance metrics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/monitoring/health` - System health status
- `GET /api/monitoring/dashboard` - Real-time dashboard

## 🧪 Testing Features

### 1. Test Compliance Engine
```bash
# Should flag non-compliant content
curl -X POST http://localhost:8001/api/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Guaranteed 20% returns on your investment!",
    "type": "marketing"
  }'
```

### 2. Test WhatsApp API
```bash
# Run WhatsApp test suite
node test-whatsapp-api.js
```

### 3. Test Image Processing
```bash
curl -X POST http://localhost:8001/api/images/process-gpt \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "advisorName": "Test Advisor",
    "advisorPhone": "919999999999"
  }'
```

## 🔍 Troubleshooting

### Server Not Starting
```bash
# Check if ports are in use
lsof -i :8001  # Backend
lsof -i :3000  # Frontend

# Kill existing processes if needed
kill -9 $(lsof -t -i:8001)
kill -9 $(lsof -t -i:3000)
```

### Database Connection Issues
```bash
# Check PostgreSQL status
pg_isready

# Connect manually
psql -U jarvish_user -d jarvish_db

# Reset database
npx prisma db push --force-reset
```

### API Key Issues
- **OpenAI**: Get key from https://platform.openai.com/api-keys
- **WhatsApp**: Setup at https://developers.facebook.com
- **Razorpay**: Get from https://dashboard.razorpay.com

### Memory Warnings
If you see memory alerts:
```bash
# Restart backend server
npm run dev:restart

# Or use PM2 for better memory management
npm install -g pm2
pm2 start npm --name jarvish-api -- run dev
pm2 monit
```

## 📚 Next Steps

### For Development
1. Complete API key configuration
2. Set up WhatsApp Business account
3. Create message templates in Meta Business
4. Configure webhook URLs
5. Test end-to-end message delivery

### For Production
1. Review `DEPLOYMENT.md` for production setup
2. Set up AWS infrastructure (RDS, ElastiCache, EC2)
3. Configure SSL certificates
4. Set up monitoring and alerting
5. Implement backup strategies

## 🆘 Getting Help

### Documentation
- API Docs: http://localhost:8001/api/v1
- Deployment Guide: `DEPLOYMENT.md`
- Architecture: `README.md`

### Common Commands
```bash
# Development
npm run dev          # Start server
npm run build        # Build for production
npm run test         # Run tests

# Database
npx prisma studio    # Visual database editor
npx prisma migrate   # Run migrations

# Verification
node verify-setup.js       # Check setup
node test-whatsapp-api.js  # Test WhatsApp
```

### Support Resources
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- OpenAI API: https://platform.openai.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Node.js: https://nodejs.org/docs

## ✨ Platform Features

### Currently Available
- ✅ SEBI compliance checking
- ✅ Multi-tier subscription plans
- ✅ Real-time monitoring
- ✅ Business analytics
- ✅ API health checks
- ✅ Webhook integration

### Coming Soon
- 🔄 AI content generation (needs OpenAI key)
- 🔄 WhatsApp message delivery (needs API setup)
- 🔄 Admin dashboard UI
- 🔄 Advisor dashboard UI
- 🔄 Payment processing (needs Razorpay)

---

**Ready to go?** Start by running `node verify-setup.js` to check your configuration status!