import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { OpenAIService } from '@/lib/ai/openai-service';
import { ThreeStageValidator } from '@/lib/ai/three-stage-validator';

// Request validation schema
const TranslateContentSchema = z.object({
  content: z.string().min(1).max(2000),
  fromLang: z.enum(['en', 'hi']),
  toLang: z.enum(['en', 'hi']),
  preserveCompliance: z.boolean().optional().default(true),
  advisorId: z.string(),
  validateAfter: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const params = TranslateContentSchema.parse(body);
    
    // Check if translation is needed
    if (params.fromLang === params.toLang) {
      return NextResponse.json({
        success: true,
        data: {
          translatedContent: params.content,
          originalContent: params.content,
          language: params.toLang,
          preservedDisclaimers: [],
          validationSkipped: true,
        },
      });
    }
    
    // Initialize services
    const openAIService = new OpenAIService();
    const validator = new ThreeStageValidator();
    
    // Perform translation
    const startTime = Date.now();
    const translationResult = await openAIService.translateContent({
      content: params.content,
      fromLang: params.fromLang,
      toLang: params.toLang,
      preserveCompliance: params.preserveCompliance,
    });
    
    let validationResult = null;
    
    // Validate translated content if requested
    if (params.validateAfter) {
      validationResult = await validator.validate({
        content: translationResult.translated,
        contentType: 'general',
        language: params.toLang,
        advisorId: params.advisorId,
        strictMode: false,
      });
    }
    
    // Prepare response
    const response = {
      success: true,
      data: {
        translatedContent: translationResult.translated,
        originalContent: params.content,
        fromLanguage: params.fromLang,
        toLanguage: params.toLang,
        preservedDisclaimers: translationResult.preserved_disclaimers,
        compliance: validationResult ? {
          isCompliant: validationResult.isCompliant,
          riskScore: validationResult.riskScore,
          riskLevel: validationResult.riskLevel,
          colorCode: validationResult.colorCode,
          suggestions: validationResult.suggestions,
        } : null,
        metadata: {
          translationTime: Date.now() - startTime,
          charactersTranslated: params.content.length,
        },
      },
    };
    
    // Log translation
    console.log(`Content translated for advisor ${params.advisorId}:`, {
      fromLang: params.fromLang,
      toLang: params.toLang,
      contentLength: params.content.length,
      executionTime: Date.now() - startTime,
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Translation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Translation failed',
        message: 'Unable to translate content at this time.',
      },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}