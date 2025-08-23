# WhatsApp Business API Implementation Plan - CRITICAL PATH
**Timeline: 2-5 days for business verification**
**Date: 2025-08-17**

## EXECUTIVE SUMMARY
WhatsApp Business API implementation for 99% delivery SLA at 06:00 IST for 150-300 advisors (scaling to 1000-2000 by month 12). Business verification is the critical path requiring immediate action.

---

## 1. IMMEDIATE ACTION ITEMS (START TODAY)

### A. Business Verification Requirements
**Timeline: 2-15 business days (average 3-5 days)**

#### Required Documents for Indian Business:
1. **GST Certificate** (MANDATORY for India)
2. **Certificate of Incorporation** or equivalent
3. **Business Bank Account Statement** (last 3 months)
4. **PAN Card** of the business
5. **Valid business website with privacy policy**

#### Facebook Business Manager Setup:
1. Create Facebook Business Manager account
2. Ensure business name matches EXACTLY with MCA records
3. Add payment method (credit/debit card for API billing)
4. Submit business verification with documents

### B. Phone Number Requirements
- **Spare mobile number** not used on WhatsApp mobile app
- Consider purchasing 3-5 numbers for:
  - Primary messaging (150-300 advisors)
  - Backup for quality protection
  - Testing environment
- Numbers CANNOT be used simultaneously on WhatsApp mobile app

### C. Business Solution Provider (BSP) Selection
**Recommended Indian BSPs for faster approval:**
- **AiSensy** - Leading provider, bulk messaging up to 100,000 users
- **MSG91** - Strong Indian presence, good API documentation
- **Interakt** - Streamlined approval process
- **DoubleTick** - Good for multi-number management

---

## 2. COST BREAKDOWN

### Per-Message Pricing (India 2025)
```
Marketing Templates:    ₹0.88 per message
Utility Templates:      ₹0.125 per message  
Authentication:         ₹0.125 per message
Service Conversations:  ₹0.35 per conversation

Free Benefits:
- 1,000 free service conversations/month
- All user-initiated messages (24-hour window)
- Responses within 24-hour window
```

### Monthly Cost Projection (300 Advisors)
```
Daily Morning Content (06:00 IST):
- 300 advisors × 30 days = 9,000 messages/month
- Cost: 9,000 × ₹0.125 (utility) = ₹1,125/month (~$13.50)
- With 20% buffer: ₹1,350/month (~$16.20)

Scale to 2000 advisors:
- 2,000 × 30 = 60,000 messages/month
- Cost: ₹7,500/month (~$90) for utility templates
```

### Additional Costs
- Business verification: Free
- Phone numbers: ₹500-1000/number/month
- BSP platform fees: ₹2,000-10,000/month (varies by provider)

---

## 3. TECHNICAL ARCHITECTURE

### A. Webhook Integration Requirements
```javascript
// Required webhook endpoints for localhost:8001
POST /webhook/whatsapp/status    // Message delivery status
POST /webhook/whatsapp/messages  // Incoming messages
GET  /webhook/whatsapp/verify    // Webhook verification

// Webhook Events to Handle:
- message.sent
- message.delivered
- message.read
- message.failed
- template.approved
- template.rejected
```

### B. 06:00 IST Delivery Architecture
```javascript
// Delivery Strategy
const deliveryConfig = {
  schedule: {
    time: "06:00:00 IST",
    window: "05:59:30 - 06:04:30",  // 5-minute window
    jitter: 20,  // ms between messages
    concurrency: 50,  // parallel sends
  },
  
  retry: {
    attempts: 3,
    backoff: "exponential",
    maxDelay: 300000  // 5 minutes
  },
  
  failover: {
    primaryNumber: "+91XXXXXXXXXX",
    backupNumbers: ["+91YYYYYYYYYY", "+91ZZZZZZZZZZ"],
    switchThreshold: 0.98  // Switch if <98% success
  }
};
```

### C. Template Management Strategy
```javascript
// Multi-language template structure
const templates = {
  daily_content_v1: {
    languages: ["en_US", "hi_IN", "mr_IN"],
    category: "UTILITY",
    components: [
      {
        type: "HEADER",
        format: "IMAGE",
        example: {media: ["sample_image_url"]}
      },
      {
        type: "BODY",
        text: "Good morning {{1}}! Your daily market insight for {{2}} is ready.",
        example: {body_text: [["Advisor Name", "17-08-2025"]]}
      }
    ]
  }
};
```

---

## 4. QUALITY RATING PROTECTION

### Messaging Limits by Tier
- **Tier 1**: 1,000 conversations/24hr (Starting point)
- **Tier 2**: 10,000 conversations/24hr
- **Tier 3**: 100,000 conversations/24hr
- **Tier 4**: Unlimited

### Quality Protection Strategy
1. **Gradual Rollout**: Start with 50 advisors, increase by 50 daily
2. **Multi-Number Strategy**: 
   - Primary: 150 advisors
   - Secondary: 150 advisors
   - Backup: Hot spare ready
3. **Quality Monitoring**:
   - Track block/spam reports daily
   - Pause if quality drops below MEDIUM
   - Rotate templates if engagement <80%

### Best Practices for HIGH Quality
- Only message opted-in users
- Personalize with advisor name
- Keep messages under 1024 characters
- Avoid promotional content in utility templates
- Limit to 1-2 messages per day maximum

---

## 5. IMPLEMENTATION TIMELINE

### Week 1 (IMMEDIATE)
**Day 1-2:**
- [ ] Gather business documents (GST, incorporation, bank statements)
- [ ] Create Facebook Business Manager account
- [ ] Purchase 3-5 phone numbers
- [ ] Select BSP and initiate application

**Day 3-5:**
- [ ] Submit business verification to Meta
- [ ] Design message templates (Hindi/English/Marathi)
- [ ] Setup webhook endpoints at localhost:8001
- [ ] Implement basic WhatsApp Cloud API client

### Week 2
**Day 6-10:**
- [ ] Await business verification approval
- [ ] Submit message templates for approval
- [ ] Build delivery scheduler with BullMQ
- [ ] Implement quality monitoring system
- [ ] Create retry and failover logic

### Week 3
**Day 11-15:**
- [ ] Test with 10 internal users
- [ ] Gradual rollout to 50 advisors
- [ ] Monitor quality ratings
- [ ] Optimize delivery timing
- [ ] Scale to 150 advisors

---

## 6. RISK MITIGATION

### Critical Risks and Mitigations

1. **Business Verification Delay**
   - Risk: 2-15 day approval window
   - Mitigation: Start TODAY, use BSP for faster approval

2. **Template Rejection**
   - Risk: 3-5 day review per template
   - Mitigation: Submit 5-10 template variations immediately

3. **Quality Rating Drop**
   - Risk: Reduced messaging limits
   - Mitigation: Multi-number strategy, gradual rollout

4. **06:00 IST Load**
   - Risk: 300-2000 concurrent messages
   - Mitigation: Jitter distribution, queue management

---

## 7. LANGUAGE SUPPORT

### Supported Languages
WhatsApp API supports Hindi (hi_IN) and Marathi (mr_IN) along with English (en_US).

### Template Language Codes
```
English: en_US
Hindi: hi_IN
Marathi: mr_IN
```

### Implementation
- Create same template in all 3 languages
- Store advisor language preference
- Send template in preferred language

---

## 8. COMPLIANCE REQUIREMENTS

### Template Categories
- **UTILITY** (Recommended for daily content): ₹0.125/message
  - Order updates, account alerts, appointment reminders
  - Non-promotional content only
  
- **MARKETING** (Avoid for daily content): ₹0.88/message
  - Promotional offers, product announcements
  - Requires explicit opt-in

### User Consent
- Mandatory opt-in before messaging
- Clear opt-out instructions
- Maintain consent records
- Honor DND preferences

---

## 9. MONITORING & ANALYTICS

### Key Metrics to Track
```javascript
const metrics = {
  delivery: {
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    sla: 0.99  // Target 99%
  },
  
  quality: {
    rating: "HIGH",
    blocks: 0,
    reports: 0,
    messagingLimit: 1000
  },
  
  engagement: {
    opens: 0,
    clicks: 0,
    responses: 0
  }
};
```

---

## 10. ACTION CHECKLIST (DO TODAY)

### Business Setup (2-3 hours)
- [ ] Register on Facebook Business Manager
- [ ] Gather GST certificate and incorporation documents
- [ ] Prepare bank statements (last 3 months)
- [ ] Ensure website has privacy policy

### Technical Preparation (1-2 hours)
- [ ] Purchase 3 spare phone numbers
- [ ] Choose BSP (recommend AiSensy or MSG91)
- [ ] Setup basic webhook endpoints
- [ ] Design first template in English

### Submit Applications (1 hour)
- [ ] Submit business verification to Meta
- [ ] Apply for WhatsApp Business API through BSP
- [ ] Submit first template for approval

---

## CRITICAL SUCCESS FACTORS

1. **Start business verification TODAY** - This is your bottleneck
2. **Purchase multiple numbers** - Quality protection essential
3. **Submit templates early** - 3-5 day approval process
4. **Gradual rollout** - Protect quality rating
5. **Monitor constantly** - Real-time quality tracking

---

## SUPPORT CONTACTS

### Recommended BSPs
- **AiSensy**: support@aisensy.com
- **MSG91**: support@msg91.com
- **Interakt**: hello@interakt.shop

### Meta Support
- Business verification issues: Facebook Business Help Center
- API technical support: developers.facebook.com/support

---

**NEXT IMMEDIATE STEP**: Start Facebook Business Manager registration and gather GST certificate. This process cannot be accelerated and is your critical path to implementation.