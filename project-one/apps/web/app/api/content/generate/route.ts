import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { OpenAIService } from '@/lib/ai/openai-service';
import { ThreeStageValidator } from '@/lib/ai/three-stage-validator';
import { getAuditLogger } from '@/lib/services/audit-logger';

// Request validation schema
const GenerateContentSchema = z.object({
  advisorId: z.string(),
  category: z.enum(['market_update', 'investment_tips', 'tax_planning', 'educational']),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  tone: z.enum(['professional', 'friendly', 'educational']).optional(),
  context: z.string().optional(),
  advisorName: z.string().optional(),
  euin: z.string().optional(),
  autoApprove: z.boolean().optional().default(false),
  clientDemographics: z.object({
    ageGroup: z.string().optional(),
    investmentPreference: z.string().optional(),
    riskProfile: z.enum(['conservative', 'moderate', 'aggressive']).optional()
  }).optional(),
  brandVoice: z.object({
    style: z.string().optional(),
    signature: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const auditLogger = getAuditLogger();
  
  try {
    const body = await request.json();
    
    // Validate request
    const params = GenerateContentSchema.parse(body);
    
    // Initialize services
    const openAIService = new OpenAIService();
    const validator = new ThreeStageValidator();
    
    // Generate content with hierarchical prompt system
    console.log(`[Content Generation] Starting for advisor ${params.advisorId}`);
    const generatedContent = await openAIService.generateContent({
      advisorId: params.advisorId,
      category: params.category,
      language: params.language === 'mr' ? 'hi' : params.language, // Fallback Marathi to Hindi for now
      tone: params.tone,
      context: params.context,
      advisorName: params.advisorName,
      euin: params.euin
    });
    
    // Validate generated content through three-stage process
    console.log(`[Compliance Check] Running three-stage validation`);
    const validationResult = await validator.validate({
      content: generatedContent.content,
      contentType: generatedContent.category,
      language: params.language === 'mr' ? 'hi' : params.language,
      advisorId: params.advisorId,
      euin: params.euin,
      strictMode: true
    });
    
    // Track performance
    const executionTime = Date.now() - startTime;
    validator.trackPerformance(params.advisorId, executionTime);
    
    // Determine if content can be auto-approved
    const canAutoApprove = params.autoApprove && 
                          validationResult.isCompliant && 
                          validationResult.riskScore < 30;
    
    // Create audit log entry
    await auditLogger.log({
      advisorId: params.advisorId,
      action: 'content_generation',
      content: {
        original: generatedContent.content,
        modified: validationResult.finalContent,
        final: validationResult.finalContent || generatedContent.content
      },
      compliance: {
        riskScore: validationResult.riskScore,
        isCompliant: validationResult.isCompliant,
        violations: validationResult.violations.map(v => ({
          type: v.type,
          severity: v.severity,
          description: v.description
        })),
        aiAnalysis: {
          used: !validationResult.fallbackUsed,
          model: 'gpt-4o-mini',
          confidence: 0.95,
          fallbackUsed: validationResult.fallbackUsed
        }
      },
      metadata: {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        executionTime,
        costEstimate: 0.002 // Rough estimate for GPT-4o-mini
      },
      euin: params.euin,
      sebiCodes: validationResult.violations.map(v => v.type)
    });
    
    // Prepare response
    const response = {
      success: true,
      data: {
        content: validationResult.finalContent || generatedContent.content,
        title: generatedContent.title,
        category: generatedContent.category,
        language: generatedContent.language,
        compliance: {
          isCompliant: validationResult.isCompliant,
          riskScore: validationResult.riskScore,
          riskLevel: validationResult.riskLevel,
          colorCode: validationResult.colorCode,
          violations: validationResult.violations,
          suggestions: validationResult.suggestions,
          stages: validationResult.stages
        },
        disclaimers: generatedContent.disclaimers,
        hashtags: generatedContent.hashtags,
        metadata: {
          generationTime: executionTime,
          fallbackUsed: validationResult.fallbackUsed,
          autoApproved: canAutoApprove,
          auditId: validationResult.auditLog.contentHash
        }
      },
      performance: {
        totalTime: executionTime,
        targetMet: executionTime < 3500,
        breakdown: {
          generation: validationResult.stages[0]?.executionTime || 0,
          validation: validationResult.totalExecutionTime
        }
      }
    };
    
    // Log performance metrics
    console.log(`[Performance] Content generated in ${executionTime}ms`, {
      category: params.category,
      language: params.language,
      riskScore: validationResult.riskScore,
      compliant: validationResult.isCompliant
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Content generation error:', error);
    
    // Log error to audit
    if (error instanceof Error && !error.message.includes('limit exceeded')) {
      await auditLogger.log({
        advisorId: body?.advisorId || 'unknown',
        action: 'content_generation',
        content: {
          original: body?.context || 'Error during generation',
          final: 'Error'
        },
        compliance: {
          riskScore: 100,
          isCompliant: false,
          violations: [{
            type: 'GENERATION_ERROR',
            severity: 'critical',
            description: error.message
          }]
        },
        metadata: {
          executionTime: Date.now() - startTime
        }
      }).catch(console.error);
    }
    
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
            message: 'You have reached your daily content generation limit (10 per day). Please try again tomorrow.',
            resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout',
            message: 'Content generation took too long. Please try again.',
          },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate content',
        message: 'An unexpected error occurred while generating content. Please try again.',
      },
      { status: 500 }
    );
  }
}

// GET method for checking service status
export async function GET(request: NextRequest) {
  const advisorId = request.nextUrl.searchParams.get('advisorId');
  
  if (!advisorId) {
    return NextResponse.json({
      status: 'healthy',
      message: 'Content generation service is running',
      limits: {
        daily_generations: 10,
        daily_compliance_checks: 20
      }
    });
  }
  
  // Get usage stats for specific advisor
  const validator = new ThreeStageValidator();
  const metrics = validator.getPerformanceMetrics(advisorId);
  const auditLogger = getAuditLogger();
  const analytics = await auditLogger.getComplianceAnalytics(advisorId, 'day');
  
  return NextResponse.json({
    status: 'healthy',
    advisorId,
    usage: {
      todayGenerations: analytics.totalChecks,
      remainingGenerations: Math.max(0, 10 - analytics.totalChecks),
      complianceRate: analytics.complianceRate,
      averageRiskScore: analytics.averageRiskScore
    },
    performance: {
      avgTime: metrics.avgTime,
      p95Time: metrics.p95Time,
      totalChecks: metrics.totalChecks
    }
  });
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}