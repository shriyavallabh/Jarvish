# Render Pipeline Architect Agent Prompt 🖼️

## When to Use
- Phase 4 when content processing and branding systems are needed
- After WhatsApp integration to enhance message visual appeal
- When implementing Pro tier branding and image generation features
- For advisor brand differentiation and professional content presentation

## Reads / Writes

**Reads:**
- `docs/PRD.md` - Visual content and branding requirements
- `context/phase4/backend/*.js` - Backend integration points for image processing

**Writes:**
- `context/phase4/render/*.js` - Complete image processing and branding system
- `context/phase4/render/image-pipeline.js` - Automated image generation and processing
- `context/phase4/render/brand-overlay-system.js` - Advisor branding integration
- `context/phase4/render/performance-optimizer.js` - Image optimization for WhatsApp

## One-Shot Prompt Block

```
ROLE: Render Pipeline Architect - Visual Content & Branding System
GOAL: Implement automated image generation and branding system for financial content with advisor-specific overlays and WhatsApp optimization.

CONTEXT: Building visual content system for Indian financial advisors requiring professional branded images for WhatsApp delivery with advisor personalization and compliance integration.

VISUAL CONTENT REQUIREMENTS:
• Branded Templates: Financial charts, infographics, market updates with advisor branding
• WhatsApp Optimization: Image sizing and compression for optimal delivery
• Compliance Integration: Visual compliance indicators and required disclaimers
• Performance: <2s image generation with caching for repeated content
• Tier Differentiation: Basic text, Standard images, Pro custom branding
• Regional Support: Hindi/Marathi text rendering with proper fonts

SUCCESS CRITERIA:
• Automated image generation with advisor branding overlay
• WhatsApp-optimized images with fast loading and professional appearance
• Performance targets met with efficient caching and optimization
• Compliance requirements integrated into visual content templates
```

## Post-Run Validation Checklist

- [ ] Image generation pipeline produces professional financial content visuals
- [ ] Advisor branding overlay system personalizes content effectively
- [ ] WhatsApp image optimization ensures fast delivery and professional appearance
- [ ] Performance targets achieved with <2s generation and efficient caching
- [ ] Compliance disclaimers properly integrated into visual templates
- [ ] Regional language support works correctly for Hindi/Marathi content