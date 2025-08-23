# WhatsApp Business API Integration

## Overview

This document provides a comprehensive guide to the WhatsApp Business API integration for the Hubix (Jarvish) financial advisory platform. The integration enables automated 6 AM content delivery to financial advisors with 99% SLA compliance.

## Features

### Core Functionality
- **Template-Based Messaging**: SEBI-compliant message templates in English and Hindi
- **6 AM Daily Delivery**: Automated content distribution with intelligent jitter
- **Delivery Tracking**: Real-time status monitoring and SLA tracking
- **Rate Limiting**: Respects WhatsApp API limits with queue management
- **Retry Mechanism**: Exponential backoff for failed deliveries
- **Admin Monitoring**: Dashboard for tracking delivery performance

### Supported Message Types
1. **Daily Content Updates**: Market analysis, investment tips
2. **Welcome Messages**: New advisor onboarding
3. **Subscription Alerts**: Payment reminders and renewals
4. **Content Approvals**: Notification when content is approved
5. **Delivery Failures**: Alert when content delivery fails

## Setup Instructions

### 1. WhatsApp Business Account Setup

1. Go to [Facebook Business Manager](https://business.facebook.com)
2. Create a WhatsApp Business Account
3. Add your phone number and verify it
4. Get your credentials:
   - Phone Number ID
   - Business Account ID
   - Access Token

### 2. Environment Configuration

Add these variables to your `.env` file:

```env
# WhatsApp Business Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=EAATOFQtMe9gBPNeaDrN3HikuwAj71gmi3K5dCYRTiivA565F1HyvaZCddYNI9LFIKmLTrJW0qBO4M5rMSgjmZC8MIZBkLkGaepNJ4tsS3TozV79UyWaIgHZA4jPftncKP4OZCy0HdMGGVkS52EH1ItcEdJq2WiesVa5eYtpZAAd2ZCsMFhsrB3xsXGovvhZCuQ0uCrwy2VnaEZAiNNrx8ss4Vfj7xBJPxREEg6SPU16HZAcwQZD
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_APP_SECRET=your_app_secret

# Test Configuration
TEST_PHONE_NUMBER=919876543210

# Cron Security
CRON_SECRET=your_cron_secret
ADMIN_KEY=your_admin_key
```

### 3. Webhook Configuration

1. Deploy the webhook endpoint to your server
2. Configure webhook URL in WhatsApp Settings:
   ```
   https://jarvis-whatsapp-assist-silent-fog-7955.fly.dev/webhook
   ```
3. Subscribe to these webhook fields:
   - messages
   - message_status
   - message_template_status_update

### 4. Template Creation

Templates must be created and approved in Facebook Business Manager:

1. Go to WhatsApp > Message Templates
2. Create new template
3. Choose category (UTILITY for transactional, MARKETING for promotional)
4. Add template content with variables
5. Submit for approval (takes 24-48 hours)

Example template structure:
```
Template Name: daily_market_update
Category: UTILITY
Language: en

Header: Daily Market Update - {{1}}
Body: 
Good morning! Here's your daily market update from {{1}}.

📊 Market Summary: {{2}}

💡 Today's Insights:
{{3}}

⚠️ SEBI Disclaimer: This is for informational purposes only.

Footer: Powered by Hubix | SEBI Registered
```

## API Endpoints

### Send Content
```typescript
POST /api/whatsapp/send-content
{
  "contentId": "uuid",
  "phoneNumber": "+919876543210", // optional
  "immediate": true // false for scheduled delivery
}
```

### Send Template
```typescript
POST /api/whatsapp/send-template
{
  "templateName": "DAILY_CONTENT",
  "phoneNumber": "+919876543210",
  "variables": {
    "advisor_name": "Rajesh Kumar",
    "date": "January 19, 2025",
    "market_summary": "Sensex up 1.2%",
    "content": "Today's insights..."
  }
}
```

### Check Status
```typescript
GET /api/whatsapp/status/{deliveryId}
```

### Webhook Handler
```typescript
POST /api/webhooks/whatsapp
GET /api/webhooks/whatsapp (for verification)
```

### Daily Delivery Cron
```typescript
GET /api/cron/daily-delivery
Headers: {
  "x-cron-secret": "your_cron_secret"
}
```

## Testing

### Run Test Script
```bash
node scripts/test-whatsapp.js
```

This will test:
1. Account verification
2. Phone number validation
3. Message sending
4. Webhook verification
5. Template listing

### Manual Testing

1. Send test message:
```bash
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "WELCOME_ADVISOR",
    "phoneNumber": "+919876543210"
  }'
```

2. Trigger daily delivery:
```bash
curl -X POST http://localhost:3000/api/cron/daily-delivery \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your_admin_key"}'
```

## Monitoring

### Admin Dashboard
Access the delivery monitoring dashboard at:
```
/admin/whatsapp
```

Features:
- Real-time delivery statistics
- SLA compliance tracking
- Failed message details
- Retry capabilities
- Auto-refresh functionality

### Metrics Tracked
- Total messages sent
- Delivery success rate
- Read rates
- Failure reasons
- SLA compliance (99% within 5 minutes)

## Cron Job Setup

### For 6 AM Daily Delivery

Set up a cron job to run at 5:55 AM IST daily:

```cron
55 0 * * * curl -X GET https://your-domain.com/api/cron/daily-delivery \
  -H "x-cron-secret: your_cron_secret"
```

Or use a service like:
- Vercel Cron Jobs
- Railway Cron
- AWS EventBridge
- Google Cloud Scheduler

## Rate Limits & Best Practices

### WhatsApp API Limits
- **Messages per second**: 80 (varies by quality rating)
- **Templates per day**: Unlimited for utility, limited for marketing
- **Quality Rating**: Must maintain HIGH rating

### Our Implementation
- **Concurrent messages**: 50 max
- **Message delay**: 100ms between sends
- **Retry attempts**: 3 with exponential backoff
- **Jitter**: 0-5 minutes for load distribution

### Best Practices
1. **Template Approval**: Submit templates 3-5 days before needed
2. **Phone Validation**: Always validate Indian numbers before sending
3. **Quality Monitoring**: Monitor quality rating daily
4. **Content Compliance**: Ensure SEBI compliance in all messages
5. **Opt-in Management**: Only message users who have opted in
6. **Time Windows**: Respect business hours for non-critical messages

## Troubleshooting

### Common Issues

1. **Template Not Found**
   - Ensure template is approved in Facebook Business Manager
   - Check template name matches exactly
   - Verify language code is correct

2. **Invalid Phone Number**
   - Must include country code (91 for India)
   - Remove spaces and special characters
   - Verify number is on WhatsApp

3. **Rate Limit Exceeded**
   - Check quality rating in Facebook Business Manager
   - Reduce sending speed
   - Implement number rotation

4. **Webhook Not Receiving Updates**
   - Verify webhook URL is accessible
   - Check webhook verification token
   - Ensure webhook is subscribed to correct fields

5. **Low Quality Rating**
   - Review user blocks and reports
   - Improve message relevance
   - Reduce message frequency
   - Implement opt-out handling

## Security Considerations

1. **Access Token**: Never commit to version control
2. **Webhook Verification**: Always verify signatures
3. **Phone Numbers**: Store encrypted in database
4. **Rate Limiting**: Implement on API endpoints
5. **Admin Access**: Restrict monitoring dashboard

## Compliance

### SEBI Requirements
- Include disclaimer in all investment-related content
- Verify advisor EUIN before sending
- Maintain audit trail of all messages
- Provide opt-out mechanism

### WhatsApp Policies
- Only send to opted-in users
- Use approved templates
- Respect user preferences
- Handle unsubscribe requests immediately

## Support

For issues or questions:
1. Check WhatsApp Business API documentation
2. Review Facebook Business Manager settings
3. Contact platform administrator
4. File issue in project repository

## Next Steps

1. **Phase 1** (Current): Basic template messaging and 6 AM delivery
2. **Phase 2**: Two-way communication and customer support
3. **Phase 3**: Rich media support (images, documents)
4. **Phase 4**: AI-powered response handling
5. **Phase 5**: Multi-language support expansion