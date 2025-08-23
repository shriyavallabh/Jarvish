import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ThreeStageValidator } from '@/lib/ai/three-stage-validator';
import { createOptimizedApi, OptimizationPresets } from '@/lib/performance/api-optimizer';
import { slaMonitor } from '@/lib/monitoring/metrics-collector';

// Request validation schema
const CheckComplianceSchema = z.object({
  advisorId: z.string(),
  content: z.string().min(10).max(2000),
  contentType: z.string(),
  language: z.enum(['en', 'hi']),
  euin: z.string().optional(),
  realtime: z.boolean().optional(), // For real-time typing feedback
});

// Optimized POST handler with AI endpoint configuration
const postHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // Validate request
    const params = CheckComplianceSchema.parse(body);
    
    // Initialize validator
    const validator = new ThreeStageValidator();
    
    // Start timing
    const startTime = Date.now();
    
    // Perform validation
    const validationResult = await validator.validate({
      content: params.content,
      contentType: params.contentType,
      language: params.language,
      advisorId: params.advisorId,
      euin: params.euin,
      strictMode: !params.realtime, // Less strict for real-time feedback
    });
    
    // Track performance and SLA compliance
    const executionTime = Date.now() - startTime;
    validator.trackPerformance(params.advisorId, executionTime);
    
    // Track SLA compliance for monitoring
    slaMonitor.trackComplianceSla(
      executionTime,
      params.realtime ? 'realtime' : 'standard',
      params.contentType
    );
    
    // Get performance metrics
    const metrics = validator.getPerformanceMetrics(params.advisorId);
    
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
        stages: params.realtime ? undefined : validationResult.stages, // Don't send stages for realtime
        performance: {
          executionTime,
          avgTime: metrics.avgTime,
          p95Time: metrics.p95Time,
          withinSLA: executionTime < 1500, // 1.5s SLA
        },
        auditLog: params.realtime ? undefined : validationResult.auditLog,
      },
    };
    
    // Log compliance check
    if (!params.realtime) {
      console.log(`Compliance check for advisor ${params.advisorId}:`, {
        riskScore: validationResult.riskScore,
        isCompliant: validationResult.isCompliant,
        executionTime,
        fallbackUsed: validationResult.fallbackUsed,
      });
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Compliance check error:', error);
    
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
            error: 'Daily compliance check limit exceeded',
            message: 'You have reached your daily compliance check limit.',
          },
          { status: 429 }
        );
      }
    }
    
    // Fallback to basic validation on error
    return NextResponse.json({
      success: true,
      data: {
        isCompliant: false,
        riskScore: 50,
        riskLevel: 'medium',
        colorCode: 'yellow',
        violations: [{
          type: 'SERVICE_ERROR',
          severity: 'medium',
          description: 'Unable to perform full compliance check',
          stage: 0
        }],
        suggestions: ['Please review content manually for compliance'],
        performance: {
          executionTime: Date.now() - Date.now(),
          withinSLA: true,
          fallback: true,
        },
      },
    });
  }
};

// Create optimized POST handler with AI endpoint preset
export const POST = createOptimizedApi(postHandler, {
  ...OptimizationPresets.AI_ENDPOINTS,
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes cache for compliance results
    keyGenerator: (req) => {
      // Create cache key based on content hash for deterministic results
      const body = JSON.stringify(req.body);
      const hash = require('crypto').createHash('md5').update(body).digest('hex');
      return `compliance:${hash}`;
    },
    conditions: (req, res) => {
      // Only cache successful non-realtime checks
      const body = req.body as any;
      return res.status === 200 && !body?.realtime;
    },
    tags: ['compliance', 'ai']
  },
  validation: {
    schema: CheckComplianceSchema,
    sanitize: true
  }
});

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