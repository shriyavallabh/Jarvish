// Gemini AI Service for Next.js
// Handles AI content generation and image creation with Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '../supabase';

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC15ewbSpMcboNAmMJhsj1dZmXA8l8yeGQ';

// Types
export interface ImageGenerationOptions {
  content: string;
  contentType: 'market-update' | 'educational' | 'regulatory' | 'festival' | 'tax-planning';
  language: 'en' | 'hi' | 'mr';
  format: 'post' | 'status' | 'linkedin';
  advisorName?: string;
  advisorLogo?: string;
  euin?: string;
  includeDisclaimer?: boolean;
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  dimensions: { width: number; height: number };
  sizeKB: number;
  metadata: {
    generatedAt: Date;
    model: string;
    prompt: string;
    language: string;
  };
}

export interface ContentGenerationOptions {
  topic: string;
  contentType: 'market-update' | 'educational' | 'regulatory' | 'festival' | 'tax-planning';
  language: 'en' | 'hi' | 'mr';
  tone?: 'professional' | 'conversational' | 'educational';
  maxLength?: number;
  includeEmoji?: boolean;
  advisorContext?: {
    name: string;
    specialization?: string;
    targetAudience?: string;
  };
}

export interface GeneratedContent {
  content: string;
  title?: string;
  summary?: string;
  hashtags?: string[];
  language: string;
  metadata: {
    generatedAt: Date;
    model: string;
    tokens: number;
  };
}

// Main Gemini Service Class
export class GeminiService {
  private static genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Using Gemini Pro for text generation
  private static textModel = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  // Using Gemini Pro Vision for image analysis and generation guidance
  private static visionModel = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

  /**
   * Generate financial content using Gemini
   */
  static async generateContent(
    options: ContentGenerationOptions
  ): Promise<GeneratedContent> {
    try {
      const prompt = this.buildContentPrompt(options);
      
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();
      
      // Parse the generated content
      const parsedContent = this.parseGeneratedContent(generatedText, options.language);
      
      // Save to database if admin client is available
      if (supabaseAdmin && options.advisorContext) {
        await this.saveGeneratedContent(parsedContent, options);
      }
      
      return parsedContent;
    } catch (error) {
      console.error('Gemini content generation failed:', error);
      throw new Error('Failed to generate content with Gemini');
    }
  }

  /**
   * Generate financial infographic content/SVG using Gemini
   */
  static async generateInfographic(
    options: ImageGenerationOptions
  ): Promise<string> {
    try {
      const prompt = this.buildImagePrompt(options);
      
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const svgContent = response.text();
      
      // Extract and clean SVG
      const cleanSvg = this.extractSvgFromResponse(svgContent);
      
      return cleanSvg;
    } catch (error) {
      console.error('Gemini infographic generation failed:', error);
      // Return fallback SVG
      return this.getFallbackSvg(options);
    }
  }

  /**
   * Translate content to different languages
   */
  static async translateContent(
    content: string,
    fromLang: 'en' | 'hi' | 'mr',
    toLang: 'en' | 'hi' | 'mr'
  ): Promise<string> {
    if (fromLang === toLang) return content;
    
    const languageMap = {
      'en': 'English',
      'hi': 'Hindi',
      'mr': 'Marathi'
    };
    
    const prompt = `Translate the following ${languageMap[fromLang]} financial advisory content to ${languageMap[toLang]}. 
    Maintain the professional tone and ensure all financial terms are accurately translated.
    Preserve any numbers, percentages, and proper nouns.
    
    Content to translate:
    ${content}
    
    Provide only the translated text without any explanation or notes.`;
    
    try {
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Translation failed:', error);
      return content; // Return original if translation fails
    }
  }

  /**
   * Generate compliance-friendly content
   */
  static async generateComplianceContent(
    originalContent: string,
    violations: string[]
  ): Promise<string> {
    const prompt = `Rewrite the following financial advisory content to be SEBI compliant.
    
    Original content:
    ${originalContent}
    
    Compliance violations found:
    ${violations.join('\n')}
    
    Requirements:
    1. Remove any guaranteed returns or assured performance claims
    2. Add appropriate risk disclaimers
    3. Ensure educational framing
    4. Maintain factual accuracy
    5. Keep the core message intact
    
    Provide the rewritten content that addresses all violations while maintaining the value for advisors.`;
    
    try {
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Compliance content generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze image for compliance
   */
  static async analyzeImageCompliance(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<{ compliant: boolean; issues: string[] }> {
    try {
      // Convert buffer to base64 for Gemini
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = `Analyze this financial advisory image for SEBI compliance issues.
      Check for:
      1. Guaranteed returns or assured performance claims
      2. Missing risk disclaimers
      3. Misleading information
      4. Inappropriate use of regulatory logos
      5. Unsubstantiated claims
      
      List any compliance issues found.`;
      
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      };
      
      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const analysis = response.text();
      
      // Parse the analysis
      const issues = this.parseComplianceIssues(analysis);
      
      return {
        compliant: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Image compliance analysis failed:', error);
      return { compliant: true, issues: [] }; // Default to compliant on error
    }
  }

  /**
   * Generate market insights
   */
  static async generateMarketInsights(
    marketData: any,
    language: 'en' | 'hi' | 'mr' = 'en'
  ): Promise<string> {
    const prompt = `Generate a concise market insight for Indian financial advisors based on the following data:
    
    ${JSON.stringify(marketData, null, 2)}
    
    Requirements:
    1. Keep it under 200 words
    2. Focus on actionable insights
    3. Include key market movements
    4. Maintain educational tone
    5. Generate in ${language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}
    
    Format as a WhatsApp-friendly message.`;
    
    try {
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Market insights generation failed:', error);
      throw error;
    }
  }

  // Private helper methods

  private static buildContentPrompt(options: ContentGenerationOptions): string {
    const { topic, contentType, language, tone = 'professional', maxLength = 500, includeEmoji = false, advisorContext } = options;
    
    const languageText = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
    
    let prompt = `Generate ${contentType} content for Indian financial advisors in ${languageText}.
    
    Topic: ${topic}
    Tone: ${tone}
    Maximum length: ${maxLength} characters
    ${includeEmoji ? 'Include relevant emojis for WhatsApp' : 'Do not include emojis'}
    
    Requirements:
    1. SEBI compliant - no guaranteed returns or assured performance
    2. Educational and informative
    3. Include appropriate risk disclaimers
    4. Relevant to Indian market context
    5. Suitable for WhatsApp distribution`;
    
    if (advisorContext) {
      prompt += `\n\nAdvisor Context:
      Name: ${advisorContext.name}
      ${advisorContext.specialization ? `Specialization: ${advisorContext.specialization}` : ''}
      ${advisorContext.targetAudience ? `Target Audience: ${advisorContext.targetAudience}` : ''}`;
    }
    
    // Add content-specific requirements
    switch (contentType) {
      case 'market-update':
        prompt += '\n\nInclude: Sensex/Nifty movements, key sectors, global cues';
        break;
      case 'educational':
        prompt += '\n\nInclude: Key concept explanation, practical examples, actionable tips';
        break;
      case 'regulatory':
        prompt += '\n\nInclude: Regulation summary, compliance requirements, deadlines';
        break;
      case 'festival':
        prompt += '\n\nInclude: Festival greeting, financial planning tip, investment wisdom';
        break;
      case 'tax-planning':
        prompt += '\n\nInclude: Tax saving options, deadlines, calculation examples';
        break;
    }
    
    prompt += '\n\nProvide the content in a structured format with title, main content, and relevant hashtags.';
    
    return prompt;
  }

  private static buildImagePrompt(options: ImageGenerationOptions): string {
    const { content, contentType, language, format } = options;
    
    const dimensions = this.getFormatDimensions(format);
    const languageText = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
    
    return `Create an SVG infographic for Indian financial advisors with these specifications:
    
    Content: ${content}
    Type: ${contentType}
    Language: ${languageText}
    Dimensions: ${dimensions.width}x${dimensions.height}px
    
    Design Requirements:
    - Professional financial services aesthetic
    - Colors: Navy (#0B1F33), Gold (#CEA200), White (#FFFFFF)
    - Clean, minimalist design with high readability
    - Include relevant charts/graphs for data
    - ${language === 'hi' ? 'Use Devanagari script for Hindi text' : ''}
    - ${language === 'mr' ? 'Use Devanagari script for Marathi text' : ''}
    
    ${options.includeDisclaimer ? 'Include disclaimer: "Mutual Fund investments are subject to market risks. Read all scheme related documents carefully."' : ''}
    
    IMPORTANT: Generate only valid SVG code without any markdown or explanation.`;
  }

  private static parseGeneratedContent(text: string, language: string): GeneratedContent {
    // Try to extract structured content
    const lines = text.split('\n').filter(line => line.trim());
    
    let title = '';
    let content = '';
    let hashtags: string[] = [];
    
    // Look for title (usually first line or after "Title:")
    const titleMatch = text.match(/Title:\s*(.+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else if (lines.length > 0) {
      title = lines[0].replace(/^#+\s*/, '').trim();
    }
    
    // Look for hashtags
    const hashtagMatch = text.match(/#\w+/g);
    if (hashtagMatch) {
      hashtags = hashtagMatch;
    }
    
    // Extract main content (everything except title and hashtags)
    content = text
      .replace(/Title:\s*.+/i, '')
      .replace(/#\w+/g, '')
      .trim();
    
    return {
      content,
      title,
      summary: content.substring(0, 200),
      hashtags,
      language,
      metadata: {
        generatedAt: new Date(),
        model: 'gemini-pro',
        tokens: text.length // Approximate
      }
    };
  }

  private static extractSvgFromResponse(response: string): string {
    // Extract SVG content from the response
    const svgMatch = response.match(/<svg[\s\S]*?<\/svg>/i);
    
    if (svgMatch) {
      return svgMatch[0];
    }
    
    // If no SVG found, return a basic template
    return this.getFallbackSvg({ format: 'post' } as ImageGenerationOptions);
  }

  private static getFallbackSvg(options: ImageGenerationOptions): string {
    const dimensions = this.getFormatDimensions(options.format);
    
    return `<svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${dimensions.width}" height="${dimensions.height}" fill="#0B1F33"/>
      <text x="${dimensions.width/2}" y="${dimensions.height/2}" 
            font-family="Arial, sans-serif" font-size="32" fill="#CEA200" text-anchor="middle">
        Jarvish Financial Advisory
      </text>
      <text x="${dimensions.width/2}" y="${dimensions.height/2 + 40}" 
            font-family="Arial, sans-serif" font-size="18" fill="#FFFFFF" text-anchor="middle">
        Professional Content for Advisors
      </text>
    </svg>`;
  }

  private static getFormatDimensions(format: 'post' | 'status' | 'linkedin'): { width: number; height: number } {
    switch (format) {
      case 'post':
        return { width: 1200, height: 628 }; // 16:9 for WhatsApp posts
      case 'status':
        return { width: 1080, height: 1920 }; // 9:16 for WhatsApp status
      case 'linkedin':
        return { width: 1200, height: 1200 }; // 1:1 for LinkedIn
      default:
        return { width: 1200, height: 628 };
    }
  }

  private static parseComplianceIssues(analysis: string): string[] {
    const issues: string[] = [];
    
    // Look for common compliance issue patterns
    const patterns = [
      /guaranteed returns?/gi,
      /assured performance/gi,
      /no risk/gi,
      /definitely will/gi,
      /must invest/gi,
      /missing disclaimer/gi,
      /misleading/gi
    ];
    
    patterns.forEach(pattern => {
      if (pattern.test(analysis)) {
        issues.push(pattern.source.replace(/\\/g, ''));
      }
    });
    
    // Also extract any numbered list of issues
    const numberedIssues = analysis.match(/\d+\.\s+(.+)/g);
    if (numberedIssues) {
      numberedIssues.forEach(issue => {
        issues.push(issue.replace(/^\d+\.\s+/, ''));
      });
    }
    
    return [...new Set(issues)]; // Remove duplicates
  }

  private static async saveGeneratedContent(
    content: GeneratedContent,
    options: ContentGenerationOptions
  ): Promise<void> {
    if (!supabaseAdmin) return;
    
    try {
      // Find advisor by name or context
      const { data: advisor } = await supabaseAdmin
        .from('advisors')
        .select('id')
        .eq('name', options.advisorContext?.name || '')
        .single();
      
      if (advisor) {
        await supabaseAdmin.from('content').insert({
          advisor_id: advisor.id,
          content_text: content.content,
          content_type: options.contentType,
          language: options.language,
          status: 'draft',
          metadata: {
            title: content.title,
            hashtags: content.hashtags,
            generated_by: 'gemini',
            generated_at: content.metadata.generatedAt
          }
        });
      }
    } catch (error) {
      console.error('Failed to save generated content:', error);
    }
  }

  /**
   * Batch generate content for multiple advisors
   */
  static async batchGenerateContent(
    requests: ContentGenerationOptions[]
  ): Promise<GeneratedContent[]> {
    const results: GeneratedContent[] = [];
    const batchSize = 5; // Process 5 at a time to avoid rate limits
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(options => this.generateContent(options))
      );
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

// Export default instance for convenience
export default GeminiService;