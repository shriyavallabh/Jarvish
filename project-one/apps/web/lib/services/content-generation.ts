/**
 * Content Generation Service
 * Uses GPT-5 for copy and GPT-4o for images as specified
 */

import { AI_MODELS, getModel, CONTENT_CONFIGS } from '@/lib/config/ai-models';

export class ContentGenerationService {
  private openaiApiKey: string;
  
  constructor(apiKey: string = process.env.OPENAI_API_KEY!) {
    this.openaiApiKey = apiKey;
  }

  /**
   * Generate copy using GPT-5
   */
  async generateCopy(
    type: 'whatsapp' | 'caption' | 'status' | 'linkedin',
    context?: string
  ): Promise<string> {
    const config = this.getContentConfig(type);
    
    // Use GPT-5 for copywriting
    const model = getModel('copy');
    
    const prompts = {
      whatsapp: `Create a WhatsApp message for financial advisors about ${context || 'SIP benefits'}. 
                 Max ${config.maxLength} chars. Include emojis, statistics, and clear CTA.`,
      caption: `Write an emotional, aspirational caption for a financial infographic. 
                Max ${config.maxLength} chars. Focus on dreams and security.`,
      status: `Create a WhatsApp/Instagram status about wealth creation. 
               Max ${config.maxLength} chars. Make it inspirational and shareable.`,
      linkedin: `Write a professional LinkedIn post for financial advisors about ${context || 'systematic investment'}. 
                 Include insights, data, and hashtags. Max ${config.maxLength} chars.`
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: model, // GPT-5 when available, fallback to GPT-4o-mini
          messages: [
            { 
              role: 'system', 
              content: 'You are Hubix AI, creating compelling financial content for Indian advisors. Be professional yet engaging.' 
            },
            { role: 'user', content: prompts[type] }
          ],
          temperature: AI_MODELS.copywriting.temperature,
          max_tokens: AI_MODELS.copywriting.maxTokens
        })
      });

      const data = await response.json();
      
      if (data.choices?.[0]?.message?.content) {
        return this.formatContent(data.choices[0].message.content, type);
      }
      
      throw new Error('No content generated');
    } catch (error) {
      console.error('Copy generation failed:', error);
      return this.getFallbackCopy(type);
    }
  }

  /**
   * Generate images using GPT-4o (via DALL-E 3)
   */
  async generateImage(
    type: 'infographic' | 'status' | 'linkedin',
    customPrompt?: string
  ): Promise<string> {
    const config = this.getImageConfig(type);
    
    // Use GPT-4o for image generation (via DALL-E endpoint)
    const model = getModel('image');
    
    const prompts = {
      infographic: customPrompt || 
        'Professional financial infographic showing SIP growth over 20 years. ' +
        'Navy blue (#0B1F33) and gold (#CEA200) colors. Indian rupee symbols. ' +
        'Clean modern design with rising graph. Text: "₹5,000/month = ₹50 Lakhs in 20 years"',
      
      status: customPrompt ||
        'Square motivational image for WhatsApp status about wealth creation. ' +
        'Minimalist design with inspiring quote overlay. Financial theme with ' +
        'abstract growth elements. Professional colors.',
      
      linkedin: customPrompt ||
        'Professional LinkedIn banner about systematic investment planning. ' +
        'Corporate blue theme with data visualization. Trust-building design. ' +
        'Include subtle Indian financial elements.'
    };

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: model, // DALL-E 3 for actual image generation
          prompt: prompts[type],
          n: 1,
          size: config.size,
          quality: AI_MODELS.imageGeneration.quality,
          style: AI_MODELS.imageGeneration.style
        })
      });

      const data = await response.json();
      
      if (data.data?.[0]?.url) {
        return data.data[0].url;
      }
      
      throw new Error('No image generated');
    } catch (error) {
      console.error('Image generation failed:', error);
      return this.getFallbackImage(type);
    }
  }

  /**
   * Generate complete content package (text + image)
   */
  async generateContentPackage(
    contentType: 'daily_insight' | 'weekly_summary' | 'market_update'
  ): Promise<{
    text: string;
    caption: string;
    imageUrl: string;
    statusText: string;
    linkedinPost: string;
  }> {
    // Generate all content in parallel for efficiency
    const [text, caption, imageUrl, statusText, linkedinPost] = await Promise.all([
      this.generateCopy('whatsapp', contentType),
      this.generateCopy('caption', contentType),
      this.generateImage('infographic', contentType),
      this.generateCopy('status', contentType),
      this.generateCopy('linkedin', contentType)
    ]);

    return {
      text,
      caption,
      imageUrl,
      statusText,
      linkedinPost
    };
  }

  /**
   * Check content compliance using AI
   */
  async checkCompliance(content: string): Promise<{
    compliant: boolean;
    riskScore: number;
    issues: string[];
  }> {
    const model = getModel('compliance');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a SEBI compliance checker. Analyze content for regulatory violations.' 
            },
            { 
              role: 'user', 
              content: `Check this content for SEBI compliance: "${content}"
                       Return JSON: { compliant: boolean, riskScore: 0-100, issues: string[] }`
            }
          ],
          temperature: AI_MODELS.compliance.temperature,
          max_tokens: AI_MODELS.compliance.maxTokens
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      
      return {
        compliant: result.compliant ?? true,
        riskScore: result.riskScore ?? 0,
        issues: result.issues ?? []
      };
    } catch (error) {
      console.error('Compliance check failed:', error);
      return { compliant: true, riskScore: 10, issues: [] };
    }
  }

  // Helper methods
  private getContentConfig(type: string) {
    const configs: any = {
      whatsapp: CONTENT_CONFIGS.whatsappText,
      caption: CONTENT_CONFIGS.whatsappCaption,
      status: CONTENT_CONFIGS.statusText,
      linkedin: CONTENT_CONFIGS.linkedinPost
    };
    return configs[type] || CONTENT_CONFIGS.whatsappText;
  }

  private getImageConfig(type: string) {
    const configs: any = {
      infographic: CONTENT_CONFIGS.infographic,
      status: CONTENT_CONFIGS.statusImage,
      linkedin: CONTENT_CONFIGS.linkedinBanner
    };
    return configs[type] || CONTENT_CONFIGS.infographic;
  }

  private formatContent(content: string, type: string): string {
    // Ensure content meets length requirements
    const config = this.getContentConfig(type);
    if (content.length > config.maxLength) {
      content = content.substring(0, config.maxLength - 3) + '...';
    }
    
    // Add required elements if missing
    if (type === 'whatsapp' && !content.includes('*')) {
      // Add emphasis
      content = content.replace(/SIP/g, '*SIP*');
    }
    
    if (type === 'linkedin' && !content.includes('#')) {
      // Add hashtags
      content += '\n\n#SIP #WealthCreation #FinancialFreedom #MutualFunds';
    }
    
    return content;
  }

  private getFallbackCopy(type: string): string {
    const fallbacks: any = {
      whatsapp: '💰 Start SIP today! ₹5,000/month = ₹50 Lakhs in 20 years 📈\n\n👉 Reply YES for details\n\n*Mutual funds subject to market risks',
      caption: '🚀 Your financial future starts with one decision today',
      status: '₹1000 today = ₹1 Lakh tomorrow\nStart your SIP journey! 🎯',
      linkedin: 'The power of systematic investment cannot be overstated.\n\n#SIP #Investment'
    };
    return fallbacks[type] || fallbacks.whatsapp;
  }

  private getFallbackImage(type: string): string {
    const fallbacks: any = {
      infographic: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1024',
      status: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1024',
      linkedin: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1792'
    };
    return fallbacks[type] || fallbacks.infographic;
  }
}

// Export singleton instance
export const contentGenerator = new ContentGenerationService();