// Image Generation API Route
// Handles image generation with multiple providers and WhatsApp optimization

import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/gemini-service';
import { auth } from '@clerk/nextjs';
import sharp from 'sharp';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Image generation providers
enum ImageProvider {
  GEMINI = 'gemini',
  DALLE = 'dalle',
  GPT_IMAGE = 'gpt-image'
}

// Generate image based on provider
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      provider = ImageProvider.GEMINI,
      prompt,
      content,
      contentType,
      language = 'en',
      format = 'post',
      advisorName,
      euin,
      includeDisclaimer = true,
      optimize = true
    } = body;

    let imageResult: any;

    switch (provider) {
      case ImageProvider.GEMINI: {
        // Generate SVG with Gemini
        const svg = await GeminiService.generateInfographic({
          content: content || prompt,
          contentType: contentType || 'educational',
          language,
          format,
          advisorName,
          euin,
          includeDisclaimer
        });

        // Convert SVG to image
        const dimensions = getFormatDimensions(format);
        const imageBuffer = await sharp(Buffer.from(svg))
          .resize(dimensions.width, dimensions.height)
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();

        imageResult = {
          buffer: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg',
          dimensions,
          sizeKB: imageBuffer.length / 1024
        };
        break;
      }

      case ImageProvider.DALLE: {
        // Generate with DALL-E 3
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: buildDallePrompt(prompt || content, contentType),
          n: 1,
          size: getDalleSize(format),
          quality: 'standard',
          response_format: 'url'
        });

        const imageUrl = response.data[0].url;
        
        if (optimize && imageUrl) {
          // Download and optimize the image
          const imageResponse = await fetch(imageUrl);
          const buffer = await imageResponse.arrayBuffer();
          
          const optimizedBuffer = await optimizeForWhatsApp(
            Buffer.from(buffer),
            format
          );

          imageResult = {
            buffer: optimizedBuffer.toString('base64'),
            mimeType: 'image/jpeg',
            url: imageUrl,
            dimensions: getFormatDimensions(format),
            sizeKB: optimizedBuffer.length / 1024
          };
        } else {
          imageResult = {
            url: imageUrl,
            mimeType: 'image/png',
            dimensions: getFormatDimensions(format)
          };
        }
        break;
      }

      case ImageProvider.GPT_IMAGE: {
        // Generate with GPT-IMAGE-1
        const response = await openai.images.generate({
          model: 'gpt-image-1',
          prompt: buildDallePrompt(prompt || content, contentType),
          n: 1,
          size: getDalleSize(format),
          quality: 'high',
          response_format: 'b64_json'
        });

        const base64Image = response.data[0].b64_json;
        
        if (base64Image) {
          const buffer = Buffer.from(base64Image, 'base64');
          
          let finalBuffer = buffer;
          if (optimize) {
            finalBuffer = await optimizeForWhatsApp(buffer, format);
          }

          // Apply branding if provided
          if (advisorName || euin) {
            finalBuffer = await applyBranding(finalBuffer, {
              advisorName,
              euin,
              includeDisclaimer
            });
          }

          imageResult = {
            buffer: finalBuffer.toString('base64'),
            mimeType: 'image/jpeg',
            dimensions: getFormatDimensions(format),
            sizeKB: finalBuffer.length / 1024
          };
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid image provider' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...imageResult,
        provider,
        format,
        optimized: optimize
      }
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    );
  }
}

// Helper function to build DALL-E prompt
function buildDallePrompt(content: string, contentType?: string): string {
  let basePrompt = `Create a professional financial advisory image for Indian market. ${content}`;
  
  if (contentType) {
    switch (contentType) {
      case 'market-update':
        basePrompt += ' Include stock market indicators, charts, and financial data visualization.';
        break;
      case 'educational':
        basePrompt += ' Use educational infographic style with clear visual hierarchy.';
        break;
      case 'regulatory':
        basePrompt += ' Professional compliance-focused design with official appearance.';
        break;
      case 'festival':
        basePrompt += ' Festive design with financial wisdom, culturally appropriate.';
        break;
      case 'tax-planning':
        basePrompt += ' Include tax-related visuals, calculations, and savings illustrations.';
        break;
    }
  }
  
  basePrompt += ' Professional color scheme: navy blue, gold accents, clean design. No text in image.';
  
  return basePrompt;
}

// Get DALL-E size based on format
function getDalleSize(format: string): '1024x1024' | '1024x1792' | '1792x1024' {
  switch (format) {
    case 'status':
      return '1024x1792'; // Portrait
    case 'linkedin':
      return '1024x1024'; // Square
    default:
      return '1792x1024'; // Landscape
  }
}

// Get dimensions for format
function getFormatDimensions(format: string): { width: number; height: number } {
  switch (format) {
    case 'post':
      return { width: 1200, height: 628 };
    case 'status':
      return { width: 1080, height: 1920 };
    case 'linkedin':
      return { width: 1200, height: 1200 };
    default:
      return { width: 1200, height: 628 };
  }
}

// Optimize image for WhatsApp
async function optimizeForWhatsApp(
  buffer: Buffer,
  format: string
): Promise<Buffer> {
  const dimensions = getFormatDimensions(format);
  
  // Start with high quality
  let quality = 85;
  let optimizedBuffer = await sharp(buffer)
    .resize(dimensions.width, dimensions.height, { 
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality, progressive: true })
    .toBuffer();
  
  // Reduce quality if file size is too large (WhatsApp limit: 100KB for auto-download)
  while (optimizedBuffer.length > 102400 && quality > 60) {
    quality -= 5;
    optimizedBuffer = await sharp(buffer)
      .resize(dimensions.width, dimensions.height, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();
  }
  
  return optimizedBuffer;
}

// Apply branding to image
async function applyBranding(
  buffer: Buffer,
  options: {
    advisorName?: string;
    euin?: string;
    includeDisclaimer?: boolean;
  }
): Promise<Buffer> {
  const composite: sharp.OverlayOptions[] = [];
  
  // Add text overlay for advisor name and EUIN
  if (options.advisorName || options.euin) {
    const textSvg = `
      <svg width="400" height="100">
        <rect width="400" height="100" fill="rgba(11, 31, 51, 0.8)" rx="5"/>
        ${options.advisorName ? `
          <text x="20" y="35" font-family="Arial" font-size="24" fill="#FFFFFF">
            ${options.advisorName}
          </text>
        ` : ''}
        ${options.euin ? `
          <text x="20" y="65" font-family="Arial" font-size="16" fill="#CEA200">
            EUIN: ${options.euin}
          </text>
        ` : ''}
      </svg>`;
    
    const textBuffer = await sharp(Buffer.from(textSvg))
      .png()
      .toBuffer();
    
    composite.push({
      input: textBuffer,
      top: 20,
      left: 20
    });
  }
  
  // Add disclaimer if required
  if (options.includeDisclaimer) {
    const disclaimerSvg = `
      <svg width="1160" height="40">
        <rect width="1160" height="40" fill="rgba(0, 0, 0, 0.7)"/>
        <text x="580" y="25" font-family="Arial" font-size="12" fill="#FFFFFF" text-anchor="middle">
          Mutual Fund investments are subject to market risks. Read all scheme related documents carefully.
        </text>
      </svg>`;
    
    const metadata = await sharp(buffer).metadata();
    const disclaimerBuffer = await sharp(Buffer.from(disclaimerSvg))
      .resize(metadata.width || 1200, 40)
      .png()
      .toBuffer();
    
    composite.push({
      input: disclaimerBuffer,
      top: (metadata.height || 628) - 40,
      left: 0
    });
  }
  
  if (composite.length > 0) {
    return await sharp(buffer)
      .composite(composite)
      .toBuffer();
  }
  
  return buffer;
}

// Export runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 30;