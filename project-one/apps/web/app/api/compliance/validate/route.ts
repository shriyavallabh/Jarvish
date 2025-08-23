import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ThreeStageValidator } from '@/lib/ai/three-stage-validator';
import { checkCompliance, autoFixContent, ComplianceCheckRequestSchema } from '@/lib/services/compliance-rules';
import { getAuditLogger } from '@/lib/services/audit-logger';

// Validation request schema
const ValidateContentSchema = z.object({
  content: z.string().min(1).max(2000),
  contentType: z.enum(['market_update', 'investment_tips', 'tax_planning', 'educational']),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  advisorId: z.string(),
  euin: z.string().optional(),
  strictMode: z.boolean().default(false),
  autoFix: z.boolean().default(false),
  realTime: z.boolean().default(false) // For real-time typing validation
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const auditLogger = getAuditLogger();
  
  try {
    const body = await request.json();
    
    // Validate request
    const params = ValidateContentSchema.parse(body);
    
    // For real-time validation, use lightweight rules-only check
    if (params.realTime) {
      const quickCheck = checkCompliance(
        params.content,
        params.language === 'mr' ? 'hi' : params.language,
        params.strictMode
      );
      
      // Return quick response for real-time feedback
      return NextResponse.json({
        success: true,
        data: {
          isCompliant: quickCheck.violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
          riskScore: quickCheck.riskScore,
          riskLevel: quickCheck.riskScore <= 30 ? 'low' : 
                    quickCheck.riskScore <= 70 ? 'medium' : 'high',
          colorCode: quickCheck.riskScore <= 30 ? 'green' : 
                    quickCheck.riskScore <= 70 ? 'yellow' : 'red',
          violations: quickCheck.violations,
          suggestions: quickCheck.suggestions,
          realTime: true
        },
        performance: {
          executionTime: Date.now() - startTime
        }
      });
    }
    
    // Full three-stage validation
    const validator = new ThreeStageValidator();
    
    console.log(`[Compliance Validation] Starting for advisor ${params.advisorId}`);
    const validationResult = await validator.validate({
      content: params.content,
      contentType: params.contentType,
      language: params.language === 'mr' ? 'hi' : params.language,
      advisorId: params.advisorId,
      euin: params.euin,
      strictMode: params.strictMode
    });
    
    // Track performance
    const executionTime = Date.now() - startTime;
    validator.trackPerformance(params.advisorId, executionTime);
    
    // Attempt auto-fix if requested and possible
    let fixedContent: string | null = null;
    if (params.autoFix && !validationResult.isCompliant) {
      const rulesCheck = checkCompliance(params.content, params.language === 'mr' ? 'hi' : params.language);
      fixedContent = autoFixContent(
        params.content,
        rulesCheck.violations,
        rulesCheck.missingDisclaimers
      );
      
      // If auto-fix produced content, validate it
      if (fixedContent) {
        const fixedValidation = await validator.validate({
          content: fixedContent,
          contentType: params.contentType,
          language: params.language === 'mr' ? 'hi' : params.language,
          advisorId: params.advisorId,
          euin: params.euin,
          strictMode: params.strictMode
        });
        
        // Only use fixed content if it's better
        if (fixedValidation.riskScore < validationResult.riskScore) {
          validationResult.finalContent = fixedContent;
        }
      }
    }
    
    // Create audit log entry
    await auditLogger.log({
      advisorId: params.advisorId,
      action: 'compliance_check',
      content: {
        original: params.content,
        modified: fixedContent || undefined,
        final: validationResult.finalContent || params.content
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
        costEstimate: validationResult.fallbackUsed ? 0 : 0.001
      },
      euin: params.euin,
      sebiCodes: validationResult.violations.map(v => v.type)
    });
    
    // Prepare response
    const response = {
      success: true,
      data: {
        isCompliant: validationResult.isCompliant,
        riskScore: validationResult.riskScore,
        riskLevel: validationResult.riskLevel,
        colorCode: validationResult.colorCode,
        violations: validationResult.violations,
        suggestions: validationResult.suggestions,
        fixedContent: validationResult.finalContent,
        stages: validationResult.stages,
        auditHash: validationResult.auditLog.contentHash
      },
      metadata: {
        fallbackUsed: validationResult.fallbackUsed,
        autoFixed: !!fixedContent && validationResult.finalContent === fixedContent,
        executionTime
      },
      performance: {
        totalTime: executionTime,
        targetMet: executionTime < 1500,
        breakdown: validationResult.stages.reduce((acc, stage) => {
          acc[stage.name] = stage.executionTime;
          return acc;
        }, {} as Record<string, number>)
      }
    };
    
    // Log performance metrics
    console.log(`[Performance] Validation completed in ${executionTime}ms`, {
      riskScore: validationResult.riskScore,
      compliant: validationResult.isCompliant,
      stages: validationResult.stages.length
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Compliance validation error:', error);
    
    // Log error to audit
    await auditLogger.log({
      advisorId: body?.advisorId || 'unknown',
      action: 'compliance_check',
      content: {
        original: body?.content || 'Error during validation'
      },
      compliance: {
        riskScore: 100,
        isCompliant: false,
        violations: [{
          type: 'VALIDATION_ERROR',
          severity: 'critical',
          description: error instanceof Error ? error.message : 'Unknown error'
        }]
      },
      metadata: {
        executionTime: Date.now() - startTime
      }
    }).catch(console.error);
    
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
            error: 'Daily validation limit exceeded',
            message: 'You have reached your daily compliance check limit (20 per day). Please try again tomorrow.',
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
            message: 'Validation took too long. Falling back to rules-only check.',
            fallback: true
          },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate content',
        message: 'An unexpected error occurred during validation.',
      },
      { status: 500 }
    );
  }
}

// GET method for checking compliance analytics
export async function GET(request: NextRequest) {
  const advisorId = request.nextUrl.searchParams.get('advisorId');
  const period = request.nextUrl.searchParams.get('period') as 'day' | 'week' | 'month' || 'day';
  
  if (!advisorId) {
    return NextResponse.json({
      status: 'healthy',
      message: 'Compliance validation service is running',
      features: {
        threeStageValidation: true,
        aiPowered: true,
        autoFix: true,
        realTimeValidation: true,
        auditLogging: true
      },
      limits: {
        daily_checks: 20,
        max_content_length: 2000,
        response_time_target: '1.5s'
      }
    });
  }
  
  // Get compliance analytics for advisor
  const auditLogger = getAuditLogger();
  const analytics = await auditLogger.getComplianceAnalytics(advisorId, period);
  
  return NextResponse.json({
    success: true,
    advisorId,
    period,
    analytics: {
      totalChecks: analytics.totalChecks,
      complianceRate: `${analytics.complianceRate.toFixed(1)}%`,
      averageRiskScore: analytics.averageRiskScore.toFixed(1),
      commonViolations: analytics.commonViolations,
      trends: analytics.trendsData,
      performance: {
        aiUsageRate: `${analytics.aiUsageRate.toFixed(1)}%`,
        averageExecutionTime: `${analytics.averageExecutionTime.toFixed(0)}ms`
      }
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