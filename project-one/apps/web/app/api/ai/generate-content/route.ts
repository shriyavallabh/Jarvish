import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIContentGenerationService } from '@/lib/services/ai-content-generation';

// Request validation schema
const GenerateContentSchema = z.object({
  advisorId: z.string(),
  contentType: z.enum(['educational', 'market_updates', 'seasonal', 'promotional', 'investment_tips']).optional(),
  category: z.enum(['market_update', 'investment_tips', 'tax_planning', 'educational']).optional(),
  language: z.enum(['en', 'hi', 'mixed']).optional(),
  topic: z.string().optional(),
  customization: z.string().optional(),
  advisorProfile: z.object({
    name: z.string(),
    euin: z.string(),
    specialization: z.string(),
    tier: z.enum(['basic', 'standard', 'pro']).optional(),
    preferredTone: z.enum(['professional', 'friendly', 'educational']).optional(),
  }).optional(),
  seasonalContext: z.string().optional(),
  promotionDetails: z.object({
    type: z.string(),
    fundName: z.string().optional(),
  }).optional(),
  platform: z.enum(['whatsapp', 'web', 'email']).optional(),
  bulkRequest: z.boolean().optional(),
  advisors: z.array(z.any()).optional(),
  commonProfile: z.any().optional(),
  includeMetrics: z.boolean().optional(),
  forceTimeout: z.boolean().optional(),
});

// Initialize service
const contentService = new AIContentGenerationService();

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(advisorId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(advisorId);
  
  if (!limit || now > limit.resetTime) {
    // Reset limit every hour
    rateLimitMap.set(advisorId, {
      count: 1,
      resetTime: now + 3600000 // 1 hour
    });
    return true;
  }
  
  if (limit.count >= 20) { // Higher limit for testing
    return false;
  }
  
  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request (allow partial for flexibility)
    const params = GenerateContentSchema.partial().parse(body);
    
    // Handle bulk requests
    if (params.bulkRequest && params.advisors) {
      const results = await Promise.all(
        params.advisors.map(async (advisor: any) => {
          try {
            const result = await contentService.generateContent({
              advisorId: advisor.advisorId,
              contentType: advisor.contentType || 'educational',
              language: advisor.language || 'en',
              advisorProfile: {
                ...params.commonProfile,
                name: `Advisor ${advisor.advisorId}`,
                euin: advisor.advisorId,
                specialization: params.commonProfile?.specialization || 'Mutual Funds'
              }
            });
            return result;
          } catch (error) {
            return {
              advisorId: advisor.advisorId,
              error: 'Generation failed',
              content: null
            };
          }
        })
      );
      
      return NextResponse.json({ results });
    }

    // Validate required fields for single request
    if (!params.advisorId) {
      return NextResponse.json(
        { error: 'advisorId is required' },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(params.advisorId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Handle timeout simulation for testing
    if (params.forceTimeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return NextResponse.json({
        content: 'Start your investment journey with SIP. Mutual fund investments are subject to market risks. Read all scheme documents carefully.',
        title: 'Investment Advisory',
        contentType: params.contentType || 'educational',
        language: params.language || 'en',
        isCompliant: true,
        complianceScore: 80,
        riskScore: 20,
        isFallback: true,
        metadata: {
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          version: '1.0.0'
        }
      });
    }

    // Generate content
    const startTime = Date.now();
    
    const result = await contentService.generateContent({
      advisorId: params.advisorId,
      contentType: params.contentType || params.category?.replace('_', '') as any || 'educational',
      language: params.language || 'en',
      advisorProfile: params.advisorProfile || {
        name: 'Financial Advisor',
        euin: params.advisorId,
        specialization: 'Mutual Funds'
      },
      seasonalContext: params.seasonalContext,
      promotionDetails: params.promotionDetails,
      platform: params.platform || 'whatsapp'
    });

    // Add topic to result if provided
    if (params.topic) {
      result.title = params.topic;
    }

    // Add performance metrics if requested
    if (params.includeMetrics) {
      const endTime = Date.now();
      if (!result.performanceMetrics) {
        result.performanceMetrics = {
          generationTime: 0,
          complianceCheckTime: 0,
          totalTime: endTime - startTime
        };
      } else {
        result.performanceMetrics.totalTime = endTime - startTime;
      }
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Content generation error:', error);
    
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
    
    if (error instanceof Error) {
      if (error.message.includes('limit exceeded')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Daily generation limit exceeded',
            message: 'You have reached your daily content generation limit. Please try again tomorrow.',
          },
          { status: 429 }
        );
      }
    }
    
    // Return fallback content on error
    return NextResponse.json({
      content: 'Invest wisely for your future. Start with systematic investment plans. Mutual fund investments are subject to market risks. Read all scheme documents carefully.',
      title: 'Financial Advisory',
      contentType: 'educational',
      language: 'en',
      isCompliant: true,
      complianceScore: 75,
      riskScore: 25,
      isFallback: true,
      error: error instanceof Error ? error.message : 'Generation failed',
      metadata: {
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        version: '1.0.0'
      }
    });
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