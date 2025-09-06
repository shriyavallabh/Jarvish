# Gemini Nano Integration Plan for Jarvish

## Overview
Switching from OpenAI GPT-4 image generation to Google's Gemini Nano (Banana model) for superior financial infographic generation.

## Integration Architecture

### 1. Service Layer Structure
```
project-one/apps/backend/src/services/
├── ai/
│   ├── gemini-client.ts         # Gemini API client
│   ├── image-generator.ts       # Image generation service
│   ├── prompt-builder.ts        # Prompt construction for Gemini
│   └── template-engine.ts       # Template management
```

### 2. API Endpoints
```
POST /api/content/generate-image
POST /api/content/generate-with-branding
POST /api/content/bulk-generate
GET  /api/content/templates
```

## Implementation Steps

### Phase 1: Gemini Setup (Day 1-2)
1. **Environment Configuration**
   ```env
   GEMINI_API_KEY=your_api_key
   GEMINI_PROJECT_ID=your_project_id
   GEMINI_REGION=asia-south1
   GEMINI_MODEL=gemini-nano-banana
   ```

2. **Client Implementation**
   ```typescript
   // gemini-client.ts
   import { GoogleGenerativeAI } from '@google/generative-ai';
   
   class GeminiImageService {
     private client: GoogleGenerativeAI;
     
     async generateFinancialInfographic(
       content: string,
       language: 'en' | 'hi' | 'mr',
       format: 'post' | 'status' | 'linkedin'
     ): Promise<Buffer> {
       // Implementation
     }
   }
   ```

### Phase 2: Template System (Day 3-4)
1. **Template Categories**
   - Market Updates (Sensex/Nifty visuals)
   - Educational Content (Investment basics)
   - Regulatory Updates (SEBI announcements)
   - Festival Greetings (with financial tips)
   - Tax Planning Infographics

2. **Branding Overlay System**
   ```typescript
   interface BrandingConfig {
     advisorLogo?: Buffer;
     advisorName: string;
     euin?: string;
     disclaimer: string;
     colorScheme: 'professional' | 'vibrant' | 'minimal';
   }
   ```

### Phase 3: Multi-Language Support (Day 5-6)
1. **Language-Specific Prompts**
   - English: Professional financial terminology
   - Hindi: देवनागरी script with financial terms
   - Marathi: मराठी financial content

2. **Font Management**
   - English: Poppins/Fraunces
   - Hindi: Noto Sans Devanagari
   - Marathi: Noto Sans Devanagari

### Phase 4: WhatsApp Optimization (Day 7)
1. **Image Specifications**
   - Post: 1200x628px (16:9 ratio)
   - Status: 1080x1920px (9:16 ratio)
   - File size: <100KB for faster delivery
   - Format: JPEG with 85% quality

2. **Compression Pipeline**
   ```typescript
   import sharp from 'sharp';
   
   async function optimizeForWhatsApp(
     imageBuffer: Buffer,
     format: 'post' | 'status'
   ): Promise<Buffer> {
     return sharp(imageBuffer)
       .jpeg({ quality: 85, progressive: true })
       .resize(format === 'post' ? 1200 : 1080)
       .toBuffer();
   }
   ```

## Prompt Engineering for Gemini Nano

### Base Prompt Structure
```
Create a professional financial infographic for Indian advisors:
- Topic: {topic}
- Key Points: {bulletPoints}
- Language: {language}
- Style: Clean, trustworthy, SEBI-compliant
- Colors: Navy (#0B1F33), Gold (#CEA200), White
- Include: Charts/graphs where relevant
- Avoid: Promises of returns, guarantees
- Add disclaimer: "Mutual Fund investments are subject to market risks"
```

### Content Types
1. **Daily Market Update**
   - Sensex/Nifty movements
   - Top gainers/losers
   - Sector performance

2. **Educational Content**
   - SIP benefits visualization
   - Asset allocation pie charts
   - Risk vs Return graphs

3. **Regulatory Updates**
   - SEBI circulars simplified
   - Compliance reminders
   - Tax deadlines

## Performance Requirements

- Generation time: <2.5s per image
- Batch processing: 50 images/minute
- Cache generated templates for 24 hours
- CDN delivery via Cloudflare R2

## Error Handling

```typescript
class GeminiErrorHandler {
  async handleGenerationError(error: any) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      // Queue for retry
      await this.queueForRetry(task);
    } else if (error.code === 'INVALID_PROMPT') {
      // Fallback to pre-approved template
      return this.getFallbackTemplate(contentType);
    }
  }
}
```

## Testing Strategy

1. **Unit Tests**
   - Prompt generation accuracy
   - Image dimension validation
   - Compression quality checks

2. **Integration Tests**
   - End-to-end generation flow
   - WhatsApp delivery simulation
   - Multi-language rendering

3. **Performance Tests**
   - Load testing (100 concurrent requests)
   - Response time validation
   - Memory usage monitoring

## Migration Plan

### Week 1
- Set up Gemini API access
- Implement basic image generation
- Create 10 template designs

### Week 2
- Add branding overlay system
- Implement multi-language support
- WhatsApp optimization pipeline

### Week 3
- Complete testing
- Migrate existing OpenAI calls
- Deploy to production

## Required Information from Client

1. **Google Cloud Setup**
   - [ ] Project ID
   - [ ] API Key
   - [ ] Billing confirmation
   - [ ] Service account JSON

2. **Branding Assets**
   - [ ] Logo files (PNG with transparency)
   - [ ] Brand colors (hex codes)
   - [ ] Approved fonts
   - [ ] Disclaimer text

3. **Content Examples**
   - [ ] Sample market updates
   - [ ] Educational content topics
   - [ ] Preferred visual styles
   - [ ] Competitor references

## Success Metrics

- Image generation success rate: >99%
- Average generation time: <2.5s
- User satisfaction score: >4.5/5
- WhatsApp delivery rate: >99%
- Compliance validation pass rate: 100%

## Next Steps

1. Provide Gemini API credentials
2. Share brand assets and guidelines
3. Approve template designs
4. Begin implementation in sprint