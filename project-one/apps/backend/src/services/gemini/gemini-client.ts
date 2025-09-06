import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import { logger } from '../../utils/logger';

export interface ImageGenerationOptions {
  content: string;
  contentType: 'market-update' | 'educational' | 'regulatory' | 'festival' | 'tax-planning';
  language: 'en' | 'hi' | 'mr';
  format: 'post' | 'status' | 'linkedin';
  advisorName?: string;
  advisorLogo?: Buffer;
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

class GeminiImageService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyC15ewbSpMcboNAmMJhsj1dZmXA8l8yeGQ';
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using Gemini 2.5 Flash Image Preview for better image generation
    this.model = this.genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash-image-preview' });
  }

  /**
   * Generate financial infographic using Gemini
   */
  async generateFinancialInfographic(
    options: ImageGenerationOptions
  ): Promise<GeneratedImage> {
    try {
      const prompt = this.buildPrompt(options);
      
      // For now, we'll use text generation to create SVG/HTML that can be rendered
      // Gemini doesn't directly generate images, but we can use it to create structured content
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const svgContent = response.text();
      
      // Convert SVG to image buffer
      const imageBuffer = await this.svgToImage(svgContent, options.format);
      
      // Apply branding if provided
      const brandedBuffer = options.advisorLogo 
        ? await this.applyBranding(imageBuffer, options)
        : imageBuffer;
      
      // Optimize for WhatsApp
      const optimizedBuffer = await this.optimizeForWhatsApp(brandedBuffer, options.format);
      
      const dimensions = await this.getImageDimensions(optimizedBuffer);
      
      return {
        buffer: optimizedBuffer,
        mimeType: 'image/jpeg',
        dimensions,
        sizeKB: optimizedBuffer.length / 1024,
        metadata: {
          generatedAt: new Date(),
          model: 'gemini-2.5-flash-image-preview',
          prompt: prompt.substring(0, 100) + '...',
          language: options.language
        }
      };
    } catch (error) {
      logger.error('Gemini image generation failed:', error);
      throw new Error('Failed to generate image with Gemini');
    }
  }

  /**
   * Build prompt for Gemini based on content type and language
   */
  private buildPrompt(options: ImageGenerationOptions): string {
    const { content, contentType, language, format } = options;
    
    const dimensions = this.getFormatDimensions(format);
    const languageText = this.getLanguageText(language);
    
    let basePrompt = `Create an SVG infographic for Indian financial advisors with these specifications:
    
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
    
    IMPORTANT: Generate only valid SVG code without any markdown or explanation.
    The SVG should be complete and renderable.`;

    // Add content-specific requirements
    switch (contentType) {
      case 'market-update':
        basePrompt += `\n- Include Sensex/Nifty indicators
        - Show percentage changes with arrows
        - Add top gainers/losers section`;
        break;
      case 'educational':
        basePrompt += `\n- Use simple visual metaphors
        - Include step-by-step flow if applicable
        - Add key takeaway highlights`;
        break;
      case 'regulatory':
        basePrompt += `\n- Include SEBI logo placeholder
        - Highlight compliance deadlines
        - Use official terminology`;
        break;
      case 'festival':
        basePrompt += `\n- Add festive design elements (subtle)
        - Include financial tip related to festival
        - Maintain professional tone`;
        break;
      case 'tax-planning':
        basePrompt += `\n- Include tax slab information
        - Show savings calculations
        - Add deadline reminders`;
        break;
    }

    // Add disclaimer for compliance
    if (options.includeDisclaimer !== false) {
      basePrompt += `\n\nAdd disclaimer at bottom in small text: "Mutual Fund investments are subject to market risks. Read all scheme related documents carefully."`;
    }

    return basePrompt;
  }

  /**
   * Convert SVG content to image buffer
   */
  private async svgToImage(svgContent: string, format: 'post' | 'status' | 'linkedin'): Promise<Buffer> {
    try {
      // Clean the SVG content (remove any markdown or extra text)
      const cleanSvg = this.extractSvgFromResponse(svgContent);
      
      const dimensions = this.getFormatDimensions(format);
      
      // Convert SVG to PNG using sharp
      const buffer = await sharp(Buffer.from(cleanSvg))
        .resize(dimensions.width, dimensions.height)
        .png()
        .toBuffer();
      
      return buffer;
    } catch (error) {
      logger.error('SVG to image conversion failed:', error);
      // Return a fallback template image
      return this.getFallbackImage(format);
    }
  }

  /**
   * Extract clean SVG from Gemini response
   */
  private extractSvgFromResponse(response: string): string {
    // Extract SVG content from the response
    const svgMatch = response.match(/<svg[\s\S]*?<\/svg>/i);
    
    if (svgMatch) {
      return svgMatch[0];
    }
    
    // If no SVG found, create a basic template
    return this.createBasicSvgTemplate();
  }

  /**
   * Create a basic SVG template as fallback
   */
  private createBasicSvgTemplate(): string {
    return `<svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="628" fill="#0B1F33"/>
      <text x="600" y="314" font-family="Poppins, sans-serif" font-size="48" fill="#CEA200" text-anchor="middle">
        Jarvish Financial Content
      </text>
      <text x="600" y="380" font-family="Poppins, sans-serif" font-size="24" fill="#FFFFFF" text-anchor="middle">
        Professional Financial Advisory
      </text>
    </svg>`;
  }

  /**
   * Apply advisor branding to the image
   */
  private async applyBranding(
    imageBuffer: Buffer,
    options: ImageGenerationOptions
  ): Promise<Buffer> {
    try {
      const composite = [];
      
      // Add advisor logo if provided
      if (options.advisorLogo) {
        const logoBuffer = await sharp(options.advisorLogo)
          .resize(120, 120, { fit: 'inside' })
          .toBuffer();
        
        composite.push({
          input: logoBuffer,
          top: 20,
          left: 20
        });
      }
      
      // Add advisor name and EUIN as text overlay
      if (options.advisorName || options.euin) {
        const textSvg = `
          <svg width="400" height="100">
            <text x="10" y="30" font-family="Poppins" font-size="24" fill="#FFFFFF">
              ${options.advisorName || ''}
            </text>
            <text x="10" y="60" font-family="Poppins" font-size="16" fill="#CEA200">
              ${options.euin ? `EUIN: ${options.euin}` : ''}
            </text>
          </svg>`;
        
        const textBuffer = await sharp(Buffer.from(textSvg))
          .png()
          .toBuffer();
        
        composite.push({
          input: textBuffer,
          top: options.advisorLogo ? 150 : 20,
          left: 20
        });
      }
      
      if (composite.length > 0) {
        return await sharp(imageBuffer)
          .composite(composite)
          .toBuffer();
      }
      
      return imageBuffer;
    } catch (error) {
      logger.error('Branding application failed:', error);
      return imageBuffer;
    }
  }

  /**
   * Optimize image for WhatsApp delivery
   */
  private async optimizeForWhatsApp(
    imageBuffer: Buffer,
    format: 'post' | 'status' | 'linkedin'
  ): Promise<Buffer> {
    const dimensions = this.getFormatDimensions(format);
    
    // Optimize for WhatsApp: JPEG with progressive loading, <100KB
    let quality = 85;
    let optimizedBuffer = await sharp(imageBuffer)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .jpeg({ quality, progressive: true })
      .toBuffer();
    
    // Reduce quality if file size is too large
    while (optimizedBuffer.length > 102400 && quality > 60) { // 100KB limit
      quality -= 5;
      optimizedBuffer = await sharp(imageBuffer)
        .resize(dimensions.width, dimensions.height, { fit: 'cover' })
        .jpeg({ quality, progressive: true })
        .toBuffer();
    }
    
    return optimizedBuffer;
  }

  /**
   * Get image dimensions based on format
   */
  private getFormatDimensions(format: 'post' | 'status' | 'linkedin'): { width: number; height: number } {
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

  /**
   * Get language text for prompt
   */
  private getLanguageText(language: 'en' | 'hi' | 'mr'): string {
    switch (language) {
      case 'en':
        return 'English';
      case 'hi':
        return 'Hindi (हिंदी)';
      case 'mr':
        return 'Marathi (मराठी)';
      default:
        return 'English';
    }
  }

  /**
   * Get image dimensions from buffer
   */
  private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  /**
   * Get fallback image when generation fails
   */
  private async getFallbackImage(format: 'post' | 'status' | 'linkedin'): Promise<Buffer> {
    const dimensions = this.getFormatDimensions(format);
    
    const svg = `
      <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${dimensions.width}" height="${dimensions.height}" fill="#0B1F33"/>
        <text x="${dimensions.width/2}" y="${dimensions.height/2}" 
              font-family="Poppins, sans-serif" font-size="32" fill="#CEA200" text-anchor="middle">
          Content Generation in Progress
        </text>
      </svg>`;
    
    return await sharp(Buffer.from(svg))
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  /**
   * Generate batch of images for bulk content
   */
  async generateBatch(
    contentArray: ImageGenerationOptions[]
  ): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = [];
    
    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < contentArray.length; i += batchSize) {
      const batch = contentArray.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(options => this.generateFinancialInfographic(options))
      );
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < contentArray.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

export default new GeminiImageService();