# Vercel Deployment Guide for Jarvish

## Overview
This guide provides step-by-step instructions for deploying the Jarvish platform to Vercel with Supabase integration.

## Prerequisites
- Vercel account (https://vercel.com)
- Supabase project already created
- Meta Business account for WhatsApp
- Clerk account for authentication
- Razorpay account for payments

## Deployment Steps

### 1. Prepare Supabase Database

1. Log into Supabase Dashboard (https://app.supabase.com)
2. Navigate to SQL Editor
3. Run the migration scripts in order:
   ```sql
   -- Run /apps/web/supabase/migrations/001_whatsapp_consent.sql
   -- Run /apps/web/supabase/migrations/002_jarvish_complete_schema.sql
   ```

4. Get your credentials from Settings > API:
   - Project URL: `https://jqvyrtoohlwiivsronzo.supabase.co`
   - Anon Key: (public key)
   - Service Role Key: (keep secret)

### 2. Configure Environment Variables in Vercel

1. Go to Vercel Dashboard > Project Settings > Environment Variables
2. Add the following variables:

#### Database
```
NEXT_PUBLIC_SUPABASE_URL=https://jqvyrtoohlwiivsronzo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[Your Service Role Key]
DATABASE_URL=postgresql://postgres:[password]@db.jqvyrtoohlwiivsronzo.supabase.co:5432/postgres
```

#### Authentication (Clerk)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[From Clerk Dashboard]
CLERK_SECRET_KEY=[From Clerk Dashboard]
```

#### AI Services
```
OPENAI_API_KEY=[Your OpenAI API Key]
GEMINI_API_KEY=AIzaSyC15ewbSpMcboNAmMJhsj1dZmXA8l8yeGQ
```

#### WhatsApp Business API
```
WHATSAPP_PHONE_NUMBER_ID=574744175733556
WHATSAPP_BUSINESS_ACCOUNT_ID=[From Meta Business Manager]
WHATSAPP_ACCESS_TOKEN=[From Meta Business Manager]
WHATSAPP_APP_SECRET=[From Meta App Dashboard]
WHATSAPP_WEBHOOK_VERIFY_TOKEN=jarvish_webhook_verify_2024
```

#### Payment (Razorpay)
```
RAZORPAY_KEY_ID=[From Razorpay Dashboard]
RAZORPAY_KEY_SECRET=[From Razorpay Dashboard]
RAZORPAY_WEBHOOK_SECRET=[From Razorpay Webhook Settings]
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd project-one/apps/web

# Deploy
vercel --prod
```

#### Option B: Using GitHub Integration
1. Push code to GitHub repository
2. Import project in Vercel Dashboard
3. Select `project-one/apps/web` as root directory
4. Vercel will auto-detect Next.js
5. Click Deploy

### 4. Configure WhatsApp Webhook

1. After deployment, get your Vercel URL (e.g., `https://jarvish.vercel.app`)
2. Go to Meta Business Manager > WhatsApp > Configuration
3. Set Webhook URL: `https://jarvish.vercel.app/api/webhooks/whatsapp/advanced`
4. Set Verify Token: `jarvish_webhook_verify_2024`
5. Subscribe to events:
   - messages
   - message_status
   - message_template_status_update
   - message_template_quality_update

### 5. Configure Razorpay Webhook

1. Go to Razorpay Dashboard > Webhooks
2. Add webhook URL: `https://jarvish.vercel.app/api/webhooks/razorpay`
3. Select events:
   - payment.captured
   - subscription.activated
   - subscription.charged
   - subscription.cancelled

### 6. Set Up Monitoring

1. Health Check: `https://jarvish.vercel.app/api/monitoring?type=health`
2. Set up uptime monitoring (e.g., Pingdom, UptimeRobot)
3. Configure alerts for critical events

## Post-Deployment Checklist

- [ ] Database migrations completed successfully
- [ ] Environment variables configured in Vercel
- [ ] WhatsApp webhook verified and working
- [ ] Razorpay webhook configured
- [ ] Health check endpoint responding
- [ ] Test user registration flow
- [ ] Test WhatsApp message sending
- [ ] Test payment flow
- [ ] Monitor error logs in Vercel Functions tab

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check if database allows connections from Vercel IPs
- Ensure connection pooling is configured

### WhatsApp API Errors
- Verify access token is valid
- Check phone number ID is correct
- Ensure webhook is properly verified
- Monitor WhatsApp quality ratings

### Payment Integration Issues
- Verify Razorpay keys are correct
- Check webhook secret matches
- Test in Razorpay test mode first

### Performance Issues
- Enable Vercel Edge Functions for better latency
- Use Mumbai (bom1) region for Indian users
- Implement caching for frequently accessed data
- Optimize image sizes for WhatsApp delivery

## Monitoring & Maintenance

### Daily Checks
- Monitor WhatsApp delivery rates
- Check compliance validation performance
- Review error logs
- Monitor subscription renewals

### Weekly Tasks
- Review analytics dashboard
- Check WhatsApp template quality scores
- Audit failed message deliveries
- Update content generation prompts

### Monthly Tasks
- Review and optimize database queries
- Audit security and compliance
- Update dependencies
- Review and optimize costs

## Support

For deployment issues:
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp

## Important URLs

- Production: https://jarvish.vercel.app
- Health Check: https://jarvish.vercel.app/api/monitoring?type=health
- WhatsApp Webhook: https://jarvish.vercel.app/api/webhooks/whatsapp/advanced
- Admin Dashboard: https://jarvish.vercel.app/admin
- Advisor Dashboard: https://jarvish.vercel.app/dashboard