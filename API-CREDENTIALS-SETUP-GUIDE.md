# JARVISH API CREDENTIALS SETUP GUIDE
## Step-by-Step Guide to Get All Required Credentials

### **Quick Overview:** 
You'll need 8 different service credentials for full platform functionality. I'll guide you through each one.

---

## 🔑 **REQUIRED CREDENTIALS CHECKLIST**

### **Priority 1: Core Development (Get These First)**
- [ ] **OpenAI API Key** (GPT-5 access for content generation)
- [ ] **Clerk Authentication** (User management)
- [ ] **PostgreSQL Database** (Data storage)
- [ ] **Redis** (Caching and job queues)

### **Priority 2: Production Features**
- [ ] **WhatsApp Business API** (Message delivery)
- [ ] **Razorpay** (Payment processing for Indian market)
- [ ] **AWS/Railway** (Deployment and hosting)
- [ ] **Meta Business Manager** (WhatsApp API approval)

---

## 🚀 **STEP-BY-STEP SETUP INSTRUCTIONS**

### **1. OpenAI API Key (Most Critical)**

#### **Steps:**
1. **Go to:** https://platform.openai.com/api-keys
2. **Sign up** or login with your account
3. **Click:** "Create new secret key"
4. **Name it:** "Jarvish-Production-GPT5"
5. **Copy the key** (starts with sk-...)

#### **What you'll get:**
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **Cost Estimate:** 
- Development: ~$50-100/month
- Production: ~$300-500/month for 1000 advisors

#### **GPT-5 Access:**
- Currently in limited access
- Apply at: https://openai.com/form/gpt-5-research
- Backup: Use GPT-4o-mini for development

---

### **2. Clerk Authentication (User Management)**

#### **Steps:**
1. **Go to:** https://clerk.com/
2. **Sign up** for free account
3. **Create new application:** "Jarvish Financial Platform"
4. **Choose:** Next.js template
5. **Copy credentials** from dashboard

#### **What you'll get:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/advisor/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/advisor/onboarding
```

#### **Configuration Needed:**
- Enable phone number verification (for Indian advisors)
- Add custom fields: EUIN, Business Name, License Number
- Configure webhook for user creation

#### **Cost:** Free for up to 10,000 monthly active users

---

### **3. PostgreSQL Database**

#### **Option A: Railway (Recommended for Development)**
1. **Go to:** https://railway.app/
2. **Sign up** with GitHub
3. **Create new project** → "PostgreSQL"
4. **Copy connection string**

#### **What you'll get:**
```
DATABASE_URL=postgresql://postgres:password@server:5432/railway
```

#### **Option B: Supabase (Good Alternative)**
1. **Go to:** https://supabase.com/
2. **Create new project:** "jarvish-db"
3. **Go to Settings** → Database
4. **Copy connection string**

#### **Cost:** Railway ~$5-15/month, Supabase free tier available

---

### **4. Redis (Caching & Job Queues)**

#### **Option A: Railway Redis**
1. **In Railway dashboard**
2. **Add service** → Redis
3. **Copy connection URL**

#### **What you'll get:**
```
REDIS_URL=redis://default:password@server:6379
```

#### **Option B: Redis Cloud**
1. **Go to:** https://redis.com/try-free/
2. **Create free database**
3. **Copy connection details**

#### **Cost:** Free tier available, ~$5-10/month for production

---

### **5. WhatsApp Business API**

#### **Steps:**
1. **Go to:** https://business.facebook.com/
2. **Create Business Manager account**
3. **Apply for WhatsApp Business API**
4. **Get approved** (can take 5-15 days)
5. **Create app** in Meta Developer Console

#### **What you'll get:**
```
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_token_123
```

#### **Requirements for Approval:**
- Registered business entity
- Business website (your landing page)
- Clear business use case
- Privacy policy and terms of service

#### **Alternative for Testing:**
Use WhatsApp Business API Test Number during development

---

### **6. Razorpay (Indian Payments)**

#### **Steps:**
1. **Go to:** https://razorpay.com/
2. **Sign up** as business account
3. **Complete KYC** (business documents needed)
4. **Get API keys** from dashboard

#### **What you'll get:**
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxx
```

#### **Documents Needed:**
- Business PAN card
- Bank account details  
- Business registration certificate
- Address proof

#### **Cost:** 2% transaction fee + GST

---

### **7. AWS/Railway Deployment**

#### **Railway (Easier):**
1. **Connect GitHub** repository
2. **Deploy automatically** on push
3. **Add environment variables**

#### **AWS (Production Scale):**
1. **EC2 instance** for application
2. **RDS** for PostgreSQL  
3. **ElastiCache** for Redis
4. **CloudFront** for CDN

#### **What you'll get:**
```
# Railway
RAILWAY_ENVIRONMENT=production

# AWS
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxx
AWS_REGION=ap-south-1
```

---

### **8. Additional Services**

#### **Email Service (Postmark/SendGrid):**
```
POSTMARK_API_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# OR
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **Analytics (PostHog for product analytics):**
```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 📁 **HOW TO ORGANIZE CREDENTIALS**

### **Create `.env.local` file in project root:**
```bash
# Copy this template and fill in your credentials
cp .env.example .env.local
```

### **Environment File Structure:**
```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Database
DATABASE_URL=postgresql://xxx
REDIS_URL=redis://xxx

# AI Services
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-xxx  # Backup for Claude

# WhatsApp
WHATSAPP_ACCESS_TOKEN=EAAxx
WHATSAPP_PHONE_NUMBER_ID=xxx

# Payment
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# Deployment
RAILWAY_ENVIRONMENT=production
```

---

## ⚡ **QUICK START PRIORITIES**

### **Week 1: Get These 4 First**
1. **OpenAI API Key** - For content generation testing
2. **Clerk Account** - For authentication development  
3. **Railway Database** - For data storage
4. **Railway Redis** - For caching

### **Week 2-3: Production Ready**
5. **WhatsApp Business API** - Start application process
6. **Razorpay Account** - Begin KYC verification
7. **Domain & SSL** - Get production domain
8. **Email Service** - Setup transactional emails

### **Cost Summary:**
- **Development:** ~$20-50/month
- **MVP (100 advisors):** ~$100-200/month  
- **Production (1000 advisors):** ~$500-800/month

---

## 🔐 **SECURITY BEST PRACTICES**

### **Never Commit Credentials:**
```bash
# Add to .gitignore
.env.local
.env.production
credentials.json
```

### **Use Environment Variables:**
- Development: `.env.local`
- Production: Railway/Vercel environment variables
- Never hardcode API keys in source code

### **Rotate Keys Regularly:**
- OpenAI keys: Every 90 days
- Database credentials: Every 180 days
- WhatsApp tokens: As required by Meta

I'll help you get each credential step-by-step as we need them for development!