// Gemini AI Content Generation API Route
// Handles content and image generation requests

import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/gemini-service';
import { auth } from '@clerk/nextjs';

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
    const { type, ...options } = body;

    // Handle different generation types
    switch (type) {
      case 'content': {
        const content = await GeminiService.generateContent({
          topic: options.topic,
          contentType: options.contentType || 'educational',
          language: options.language || 'en',
          tone: options.tone || 'professional',
          maxLength: options.maxLength || 500,
          includeEmoji: options.includeEmoji || false,
          advisorContext: options.advisorContext
        });

        return NextResponse.json({
          success: true,
          data: content
        });
      }

      case 'infographic': {
        const svg = await GeminiService.generateInfographic({
          content: options.content,
          contentType: options.contentType || 'educational',
          language: options.language || 'en',
          format: options.format || 'post',
          advisorName: options.advisorName,
          euin: options.euin,
          includeDisclaimer: options.includeDisclaimer !== false
        });

        return NextResponse.json({
          success: true,
          data: { svg }
        });
      }

      case 'translate': {
        const translated = await GeminiService.translateContent(
          options.content,
          options.fromLang || 'en',
          options.toLang || 'hi'
        );

        return NextResponse.json({
          success: true,
          data: { translated }
        });
      }

      case 'compliance': {
        const compliantContent = await GeminiService.generateComplianceContent(
          options.content,
          options.violations || []
        );

        return NextResponse.json({
          success: true,
          data: { content: compliantContent }
        });
      }

      case 'market-insights': {
        const insights = await GeminiService.generateMarketInsights(
          options.marketData || {},
          options.language || 'en'
        );

        return NextResponse.json({
          success: true,
          data: { insights }
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid generation type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Gemini generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

// Export runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 30;