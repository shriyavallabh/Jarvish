import { createCanvas, loadImage, registerFont, Canvas, CanvasRenderingContext2D } from 'canvas';
import path from 'path';
import { supabase } from '@/lib/supabase/client';

// Image aspect ratios for different platforms
export enum AspectRatio {
  SQUARE = '1:1',       // 1080x1080 - Instagram, WhatsApp Status
  LANDSCAPE = '16:9',   // 1920x1080 - LinkedIn, Twitter
  PORTRAIT = '9:16',    // 1080x1920 - Stories, Reels
  WHATSAPP = '4:3',     // 1600x1200 - WhatsApp optimized
}

// Content types for templates
export enum ContentType {
  MARKET_UPDATE = 'market_update',
  INVESTMENT_TIP = 'investment_tip',
  MUTUAL_FUND = 'mutual_fund',
  PORTFOLIO_INSIGHT = 'portfolio_insight',
  TAX_PLANNING = 'tax_planning',
  FINANCIAL_LITERACY = 'financial_literacy',
  FESTIVE_GREETING = 'festive_greeting',
  REGULATORY_UPDATE = 'regulatory_update',
}

// Image generation configuration
export interface ImageConfig {
  aspectRatio: AspectRatio;
  contentType: ContentType;
  language: 'en' | 'hi' | 'mr';
  quality: number; // 0-100 for JPEG quality
  format: 'jpeg' | 'png' | 'webp';
}

// Content data for image generation
export interface ContentData {
  title: string;
  subtitle?: string;
  body: string;
  highlights?: string[];
  footer?: string;
  data?: Record<string, any>; // For charts, statistics
}

// Advisor branding information
export interface BrandingConfig {
  advisorName: string;
  firmName?: string;
  logo?: string; // Base64 or URL
  primaryColor: string;
  secondaryColor: string;
  phone?: string;
  email?: string;
  website?: string;
  arnNumber?: string;
  euinNumber?: string;
  disclaimer?: string;
}

// Generated image result
export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  publicUrl?: string;
}

export class ImageGenerator {
  private fontCache: Map<string, boolean> = new Map();
  private logoCache: Map<string, any> = new Map();

  constructor() {
    this.initializeFonts();
  }

  private initializeFonts() {
    // Register fonts for different languages
    try {
      // English fonts
      registerFont(path.join(process.cwd(), 'public/fonts/Inter-Regular.ttf'), { 
        family: 'Inter', 
        weight: 'normal' 
      });
      registerFont(path.join(process.cwd(), 'public/fonts/Inter-Bold.ttf'), { 
        family: 'Inter', 
        weight: 'bold' 
      });

      // Hindi fonts
      registerFont(path.join(process.cwd(), 'public/fonts/NotoSansDevanagari-Regular.ttf'), { 
        family: 'Noto Sans Devanagari', 
        weight: 'normal' 
      });
      registerFont(path.join(process.cwd(), 'public/fonts/NotoSansDevanagari-Bold.ttf'), { 
        family: 'Noto Sans Devanagari', 
        weight: 'bold' 
      });

      // Marathi fonts (uses Devanagari script)
      this.fontCache.set('en', true);
      this.fontCache.set('hi', true);
      this.fontCache.set('mr', true);
    } catch (error) {
      console.warn('Font registration failed, using system fonts:', error);
    }
  }

  private getDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
    switch (aspectRatio) {
      case AspectRatio.SQUARE:
        return { width: 1080, height: 1080 };
      case AspectRatio.LANDSCAPE:
        return { width: 1920, height: 1080 };
      case AspectRatio.PORTRAIT:
        return { width: 1080, height: 1920 };
      case AspectRatio.WHATSAPP:
        return { width: 1600, height: 1200 };
      default:
        return { width: 1080, height: 1080 };
    }
  }

  private getFontFamily(language: 'en' | 'hi' | 'mr'): string {
    switch (language) {
      case 'hi':
      case 'mr':
        return 'Noto Sans Devanagari, Arial Unicode MS, sans-serif';
      default:
        return 'Inter, Arial, sans-serif';
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private createGradient(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    primaryColor: string,
    secondaryColor: string
  ) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    return gradient;
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    lineHeight: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  async generateImage(
    content: ContentData,
    branding: BrandingConfig,
    config: ImageConfig
  ): Promise<GeneratedImage> {
    const { width, height } = this.getDimensions(config.aspectRatio);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Set background
    const gradient = this.createGradient(ctx, width, height, branding.primaryColor, branding.secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern overlay
    this.addPattern(ctx, width, height);

    // Draw content based on template
    await this.drawContent(ctx, content, branding, config, width, height);

    // Add branding elements
    await this.addBranding(ctx, branding, width, height);

    // Add compliance disclaimer
    if (branding.disclaimer || branding.arnNumber || branding.euinNumber) {
      this.addCompliance(ctx, branding, width, height);
    }

    // Convert to buffer
    const buffer = await this.canvasToBuffer(canvas, config.format, config.quality);

    return {
      buffer,
      mimeType: `image/${config.format}`,
      width,
      height,
      fileSize: buffer.length,
    };
  }

  private addPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    // Create subtle geometric pattern
    const spacing = 50;
    for (let x = 0; x < width; x += spacing) {
      for (let y = 0; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private async drawContent(
    ctx: CanvasRenderingContext2D,
    content: ContentData,
    branding: BrandingConfig,
    config: ImageConfig,
    width: number,
    height: number
  ) {
    const padding = width * 0.08;
    const contentWidth = width - (padding * 2);
    const fontFamily = this.getFontFamily(config.language);

    // Title
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${width * 0.05}px ${fontFamily}`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const titleLines = this.wrapText(ctx, content.title, contentWidth, width * 0.06);
    let yPosition = padding + (width * 0.06);

    for (const line of titleLines) {
      ctx.fillText(line, padding, yPosition);
      yPosition += width * 0.06;
    }
    ctx.restore();

    // Subtitle
    if (content.subtitle) {
      ctx.fillStyle = '#F0F0F0';
      ctx.font = `${width * 0.03}px ${fontFamily}`;
      yPosition += width * 0.02;
      ctx.fillText(content.subtitle, padding, yPosition);
      yPosition += width * 0.05;
    }

    // Body content
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${width * 0.025}px ${fontFamily}`;
    const bodyLines = this.wrapText(ctx, content.body, contentWidth, width * 0.035);
    
    yPosition += width * 0.03;
    for (const line of bodyLines) {
      ctx.fillText(line, padding, yPosition);
      yPosition += width * 0.035;
    }

    // Highlights
    if (content.highlights && content.highlights.length > 0) {
      yPosition += width * 0.03;
      this.drawHighlights(ctx, content.highlights, padding, yPosition, contentWidth, width, fontFamily);
    }

    // Data visualization (if applicable)
    if (content.data && config.contentType === ContentType.MARKET_UPDATE) {
      this.drawMarketData(ctx, content.data, padding, height * 0.5, contentWidth, height * 0.3);
    }
  }

  private drawHighlights(
    ctx: CanvasRenderingContext2D,
    highlights: string[],
    x: number,
    y: number,
    width: number,
    canvasWidth: number,
    fontFamily: string
  ) {
    const highlightHeight = canvasWidth * 0.08;
    const spacing = canvasWidth * 0.02;

    highlights.forEach((highlight, index) => {
      const yPos = y + (index * (highlightHeight + spacing));

      // Highlight background
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.roundRect(x, yPos, width, highlightHeight, 10);
      ctx.fill();

      // Highlight text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${canvasWidth * 0.025}px ${fontFamily}`;
      ctx.fillText(`• ${highlight}`, x + canvasWidth * 0.02, yPos + highlightHeight * 0.6);
      ctx.restore();
    });
  }

  private drawMarketData(
    ctx: CanvasRenderingContext2D,
    data: Record<string, any>,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    // Simple bar chart for market data
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();

    if (data.values && Array.isArray(data.values)) {
      const barWidth = width / data.values.length;
      const maxValue = Math.max(...data.values);

      data.values.forEach((value: number, index: number) => {
        const barHeight = (value / maxValue) * height * 0.8;
        const barX = x + (index * barWidth) + barWidth * 0.2;
        const barY = y + height - barHeight - 10;

        // Bar
        ctx.fillStyle = value > 0 ? '#4CAF50' : '#F44336';
        ctx.fillRect(barX, barY, barWidth * 0.6, barHeight);

        // Value label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(value.toFixed(1) + '%', barX + barWidth * 0.3, barY - 5);
      });
    }
    ctx.restore();
  }

  private async addBranding(
    ctx: CanvasRenderingContext2D,
    branding: BrandingConfig,
    width: number,
    height: number
  ) {
    const brandingHeight = height * 0.12;
    const brandingY = height - brandingHeight;

    // Branding background
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, brandingY, width, brandingHeight);

    // Logo
    if (branding.logo) {
      try {
        let logo;
        if (this.logoCache.has(branding.logo)) {
          logo = this.logoCache.get(branding.logo);
        } else {
          logo = await loadImage(branding.logo);
          this.logoCache.set(branding.logo, logo);
        }

        const logoSize = brandingHeight * 0.6;
        const logoX = width * 0.05;
        const logoY = brandingY + (brandingHeight - logoSize) / 2;
        
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    }

    // Advisor info
    const textX = branding.logo ? width * 0.15 : width * 0.05;
    ctx.fillStyle = '#FFFFFF';
    
    // Name and firm
    ctx.font = `bold ${width * 0.025}px Inter`;
    ctx.fillText(branding.advisorName, textX, brandingY + brandingHeight * 0.35);
    
    if (branding.firmName) {
      ctx.font = `${width * 0.02}px Inter`;
      ctx.fillText(branding.firmName, textX, brandingY + brandingHeight * 0.55);
    }

    // Contact info
    ctx.font = `${width * 0.018}px Inter`;
    let contactY = brandingY + brandingHeight * 0.75;
    
    if (branding.phone) {
      ctx.fillText(`📱 ${branding.phone}`, textX, contactY);
    }
    
    if (branding.email) {
      ctx.fillText(`✉ ${branding.email}`, textX + width * 0.25, contactY);
    }
    
    if (branding.website) {
      ctx.fillText(`🌐 ${branding.website}`, textX + width * 0.5, contactY);
    }

    ctx.restore();
  }

  private addCompliance(
    ctx: CanvasRenderingContext2D,
    branding: BrandingConfig,
    width: number,
    height: number
  ) {
    const complianceHeight = height * 0.05;
    const complianceY = height - complianceHeight;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, complianceY, width, complianceHeight);

    ctx.fillStyle = '#CCCCCC';
    ctx.font = `${width * 0.012}px Inter`;
    ctx.textAlign = 'center';

    let complianceText = '';
    if (branding.arnNumber) {
      complianceText += `ARN: ${branding.arnNumber} `;
    }
    if (branding.euinNumber) {
      complianceText += `| EUIN: ${branding.euinNumber} `;
    }
    if (branding.disclaimer) {
      complianceText += `| ${branding.disclaimer}`;
    }

    ctx.fillText(complianceText, width / 2, complianceY + complianceHeight * 0.6);
    ctx.restore();
  }

  private async canvasToBuffer(
    canvas: Canvas,
    format: 'jpeg' | 'png' | 'webp',
    quality: number
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const callback = (err: Error | null, buffer: Buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      };

      switch (format) {
        case 'jpeg':
          canvas.toBuffer(callback, 'image/jpeg', { quality: quality / 100 });
          break;
        case 'png':
          canvas.toBuffer(callback, 'image/png', {
            compressionLevel: Math.floor((100 - quality) / 10),
          });
          break;
        case 'webp':
          canvas.toBuffer(callback, 'image/webp', { quality: quality / 100 });
          break;
        default:
          canvas.toBuffer(callback);
      }
    });
  }

  async uploadToSupabase(
    image: GeneratedImage,
    advisorId: string,
    fileName: string
  ): Promise<string> {
    const filePath = `advisors/${advisorId}/generated/${Date.now()}_${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('content-images')
      .upload(filePath, image.buffer, {
        contentType: image.mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('content-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  // Batch processing for multiple images
  async generateBatch(
    contents: ContentData[],
    branding: BrandingConfig,
    config: ImageConfig
  ): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = [];

    for (const content of contents) {
      try {
        const image = await this.generateImage(content, branding, config);
        results.push(image);
      } catch (error) {
        console.error('Failed to generate image:', error);
      }
    }

    return results;
  }

  // Clean up caches
  clearCaches() {
    this.logoCache.clear();
  }
}

export default ImageGenerator;