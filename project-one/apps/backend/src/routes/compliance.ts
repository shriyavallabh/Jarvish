// Compliance API Routes
// Real-time compliance checking endpoints

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import complianceService from '../services/compliance-service';
import { rateLimiter } from '../utils/redis';

const router = Router();

// Request validation schema
const ComplianceCheckSchema = z.object({
  content: z.string().min(1).max(5000),
  language: z.enum(['en', 'hi', 'mr']).optional().default('en'),
  contentType: z.enum(['whatsapp', 'status', 'linkedin', 'email']).optional().default('whatsapp'),
  advisorId: z.string().optional(),
  skipCache: z.boolean().optional()
});

const ContentGenerationSchema = z.object({
  topic: z.string().min(1).max(200),
  language: z.enum(['en', 'hi', 'mr']).optional().default('en'),
  contentType: z.enum(['whatsapp', 'status', 'linkedin', 'email']).optional().default('whatsapp'),
  tone: z.enum(['professional', 'casual', 'educational']).optional().default('educational'),
  includeDisclaimer: z.boolean().optional().default(true),
  advisorId: z.string().optional()
});

/**
 * POST /api/compliance/check
 * Real-time compliance checking endpoint
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = ComplianceCheckSchema.parse(req.body);
    
    // Rate limiting
    const rateLimitKey = `compliance:${validatedData.advisorId || req.ip}`;
    const rateLimit = await rateLimiter.check(rateLimitKey, 100, 60);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      });
    }

    // Set response headers for rate limiting
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());

    // Perform compliance check
    const startTime = Date.now();
    const result = await complianceService.checkCompliance({
      content: validatedData.content,
      language: validatedData.language,
      contentType: validatedData.contentType,
      advisorId: validatedData.advisorId,
      skipCache: validatedData.skipCache
    });
    
    // Add performance metrics
    const totalTime = Date.now() - startTime;
    
    // Log slow requests
    if (totalTime > 1500) {
      console.warn(`Slow compliance check: ${totalTime}ms`, {
        contentLength: validatedData.content.length,
        language: validatedData.language,
        cacheHit: result.cacheHit
      });
    }

    // Return response
    res.json({
      success: true,
      data: result,
      meta: {
        processingTime: totalTime,
        cached: result.cacheHit || false,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    // Handle other errors
    console.error('Compliance check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/compliance/generate
 * Generate compliant content
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = ContentGenerationSchema.parse(req.body);
    
    // Check rate limits
    const rateLimitKey = `generation:${validatedData.advisorId || req.ip}`;
    const rateLimit = await rateLimiter.check(rateLimitKey, 10, 3600); // 10 per hour
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Generation limit exceeded',
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      });
    }

    // TODO: Implement content generation
    // This would use GPT-4 to generate compliant content
    // Then run it through compliance check
    
    res.json({
      success: true,
      data: {
        content: 'Generated content placeholder',
        isCompliant: true,
        riskScore: 10
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/compliance/stats
 * Get compliance statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const advisorId = req.query.advisorId as string;
    const stats = await complianceService.getStats(advisorId);
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/compliance/batch
 * Batch compliance checking
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { contents } = req.body;
    
    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Contents must be a non-empty array'
      });
    }

    if (contents.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 items per batch'
      });
    }

    // Process in parallel with limit
    const results = await Promise.all(
      contents.map(content => 
        complianceService.checkCompliance({
          content: content.content,
          language: content.language || 'en',
          contentType: content.contentType || 'whatsapp',
          advisorId: content.advisorId
        })
      )
    );

    res.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    console.error('Batch check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/compliance/rules
 * Get list of compliance rules
 */
router.get('/rules', (req: Request, res: Response) => {
  const language = req.query.language as string || 'en';
  
  const rules = {
    prohibitedTerms: [
      {
        category: 'Guaranteed Returns',
        terms: ['guaranteed returns', 'assured returns', 'risk-free'],
        severity: 'critical'
      },
      {
        category: 'Performance Promises',
        terms: ['will double', 'become rich', 'earn lakhs'],
        severity: 'critical'
      },
      {
        category: 'Misleading Claims',
        terms: ['better than FD', 'always beats', 'never loses'],
        severity: 'high'
      }
    ],
    requiredDisclosures: [
      {
        type: 'Market Risk',
        text: 'Mutual fund investments are subject to market risks',
        when: 'Mentioning mutual funds or SIP'
      },
      {
        type: 'Past Performance',
        text: 'Past performance is not indicative of future results',
        when: 'Discussing returns or performance'
      },
      {
        type: 'Advisor Identity',
        text: 'ARN/RIA registration number',
        when: 'Providing investment advice'
      }
    ],
    guidelines: [
      'Frame content as educational, not direct advice',
      'Include balanced presentation of risks and rewards',
      'Avoid creating urgency or FOMO',
      'Use professional language appropriate for financial services',
      'Limit use of promotional emojis (max 3)',
      'Avoid excessive use of capital letters'
    ]
  };

  res.json({
    success: true,
    data: rules
  });
});

/**
 * POST /api/compliance/fix
 * Auto-fix compliance issues
 */
router.post('/fix', async (req: Request, res: Response) => {
  try {
    const { content, language = 'en', issues } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    // First check compliance
    const complianceResult = await complianceService.checkCompliance({
      content,
      language,
      contentType: 'whatsapp'
    });

    // If already compliant
    if (complianceResult.isCompliant) {
      return res.json({
        success: true,
        data: {
          originalContent: content,
          fixedContent: content,
          wasFixed: false,
          isCompliant: true
        }
      });
    }

    // Attempt to fix (if risk score is not too high)
    if (complianceResult.riskScore < 50 && complianceResult.processedContent) {
      return res.json({
        success: true,
        data: {
          originalContent: content,
          fixedContent: complianceResult.processedContent,
          wasFixed: true,
          isCompliant: true,
          fixedIssues: complianceResult.issues.filter(i => i.severity !== 'critical')
        }
      });
    }

    // Cannot auto-fix
    res.json({
      success: false,
      error: 'Content has critical issues that cannot be auto-fixed',
      data: {
        issues: complianceResult.issues,
        suggestions: complianceResult.suggestions
      }
    });

  } catch (error: any) {
    console.error('Auto-fix error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/compliance/health
 * Check compliance service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test compliance check
    const testResult = await complianceService.checkCompliance({
      content: 'Test content for health check',
      language: 'en',
      contentType: 'whatsapp',
      skipCache: true
    });

    const isHealthy = testResult.processingTime < 2000;

    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        processingTime: testResult.processingTime,
        stagesCompleted: testResult.stagesCompleted,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;