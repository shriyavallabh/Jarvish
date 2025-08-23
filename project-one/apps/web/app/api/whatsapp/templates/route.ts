import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { getTemplateManager, TEMPLATE_LIBRARY } from '@/lib/services/template-manager'
import { z } from 'zod'

// Request validation schemas
const createTemplateSchema = z.object({
  templateKey: z.string(),
  language: z.string().default('en'),
  priority: z.number().min(1).max(10).default(5)
})

const templateHealthSchema = z.object({
  templateName: z.string(),
  language: z.string().default('en')
})

// GET /api/whatsapp/templates - Get template health and status
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (admin endpoint)
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const templateName = searchParams.get('template')
    const language = searchParams.get('language') || 'en'
    const includeDetails = searchParams.get('details') === 'true'

    const templateManager = getTemplateManager()

    switch (action) {
      case 'health':
        // Get health status for specific template
        if (!templateName) {
          return NextResponse.json(
            { error: 'Template name required for health check' },
            { status: 400 }
          )
        }

        const health = await templateManager.getTemplateHealth(templateName)
        
        return NextResponse.json({
          success: true,
          template: templateName,
          language,
          health: {
            status: health.status,
            qualityScore: health.qualityScore,
            healthScore: health.healthScore,
            recommendation: health.recommendation,
            metrics: {
              deliveryRate: health.deliveryRate,
              openRate: health.openRate,
              blockRate: health.blockRate,
              useCount: health.useCount,
              lastUsed: health.lastUsed
            }
          }
        })

      case 'best':
        // Get best template for a use case
        const useCase = searchParams.get('useCase') || 'daily_content'
        
        try {
          const { templateName: bestTemplate, health: bestHealth } = 
            await templateManager.getBestTemplate(useCase, language)
          
          return NextResponse.json({
            success: true,
            useCase,
            language,
            bestTemplate: {
              name: bestTemplate,
              healthScore: bestHealth.healthScore,
              recommendation: bestHealth.recommendation,
              qualityScore: bestHealth.qualityScore,
              status: bestHealth.status
            }
          })
        } catch (error) {
          return NextResponse.json(
            { 
              error: 'Failed to get best template',
              details: error.message 
            },
            { status: 500 }
          )
        }

      case 'monitor':
        // Monitor template approval status
        const approvalUpdates = await templateManager.monitorApprovals()
        
        return NextResponse.json({
          success: true,
          approvalUpdates,
          timestamp: new Date().toISOString()
        })

      case 'library':
        // List available templates in library
        const libraryTemplates = Object.keys(TEMPLATE_LIBRARY).map(key => {
          const template = TEMPLATE_LIBRARY[key as keyof typeof TEMPLATE_LIBRARY]
          return {
            key,
            name: template.name,
            category: template.category,
            language: template.language,
            description: this.getTemplateDescription(key)
          }
        })

        return NextResponse.json({
          success: true,
          templates: libraryTemplates,
          count: libraryTemplates.length
        })

      default:
        // List all template health statuses
        const templateNames = Object.values(TEMPLATE_LIBRARY).map(t => t.name)
        const healthStatuses = await Promise.all(
          templateNames.map(async name => {
            try {
              const health = await templateManager.getTemplateHealth(name)
              return {
                name,
                language: health.language,
                status: health.status,
                healthScore: health.healthScore,
                recommendation: health.recommendation,
                qualityScore: health.qualityScore,
                ...(includeDetails && {
                  details: {
                    deliveryRate: health.deliveryRate,
                    openRate: health.openRate,
                    blockRate: health.blockRate,
                    useCount: health.useCount,
                    lastUsed: health.lastUsed
                  }
                })
              }
            } catch (error) {
              return {
                name,
                error: error.message,
                status: 'ERROR'
              }
            }
          })
        )

        return NextResponse.json({
          success: true,
          templates: healthStatuses,
          summary: {
            total: healthStatuses.length,
            approved: healthStatuses.filter(t => t.status === 'APPROVED').length,
            pending: healthStatuses.filter(t => t.status === 'PENDING').length,
            rejected: healthStatuses.filter(t => t.status === 'REJECTED').length,
            errors: healthStatuses.filter(t => t.status === 'ERROR').length
          }
        })
    }
  } catch (error) {
    console.error('Template GET error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get template information',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// POST /api/whatsapp/templates - Create or submit templates
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (admin endpoint)
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    const templateManager = getTemplateManager()

    switch (action) {
      case 'create':
        // Create/submit template for approval
        const validation = createTemplateSchema.safeParse(body)
        
        if (!validation.success) {
          return NextResponse.json(
            { 
              error: 'Invalid request',
              details: validation.error.errors 
            },
            { status: 400 }
          )
        }

        const { templateKey } = validation.data

        if (!(templateKey in TEMPLATE_LIBRARY)) {
          return NextResponse.json(
            { error: 'Template not found in library' },
            { status: 400 }
          )
        }

        try {
          const result = await templateManager.submitTemplate(
            templateKey as keyof typeof TEMPLATE_LIBRARY
          )
          
          return NextResponse.json({
            success: true,
            template: templateKey,
            submission: {
              id: result.id,
              status: result.status,
              submittedAt: new Date().toISOString()
            },
            message: result.status === 'APPROVED' 
              ? 'Template already approved and ready to use'
              : 'Template submitted for approval. Review typically takes 24-48 hours.'
          })
        } catch (error) {
          return NextResponse.json(
            { 
              error: 'Failed to submit template',
              details: error.message 
            },
            { status: 500 }
          )
        }

      case 'ab_test':
        // Run A/B test between templates
        const { templateA, templateB, sampleSize = 100 } = body

        if (!templateA || !templateB) {
          return NextResponse.json(
            { error: 'Both templateA and templateB are required' },
            { status: 400 }
          )
        }

        try {
          const testResult = await templateManager.runABTest(
            templateA,
            templateB,
            sampleSize
          )
          
          return NextResponse.json({
            success: true,
            test: {
              templateA,
              templateB,
              sampleSize,
              winner: testResult.winner,
              results: {
                aPerformance: testResult.aPerformance,
                bPerformance: testResult.bPerformance,
                confidence: testResult.confidence
              },
              recommendation: testResult.confidence > 0.95 
                ? `Use ${testResult.winner} (statistically significant)`
                : 'Continue testing - not statistically significant yet'
            }
          })
        } catch (error) {
          return NextResponse.json(
            { 
              error: 'Failed to run A/B test',
              details: error.message 
            },
            { status: 500 }
          )
        }

      case 'bulk_submit':
        // Submit multiple templates at once
        const { templates = [] } = body
        
        if (!Array.isArray(templates) || templates.length === 0) {
          return NextResponse.json(
            { error: 'Templates array is required' },
            { status: 400 }
          )
        }

        const submissions = []
        const errors = []

        for (const templateKey of templates) {
          try {
            if (templateKey in TEMPLATE_LIBRARY) {
              const result = await templateManager.submitTemplate(
                templateKey as keyof typeof TEMPLATE_LIBRARY
              )
              submissions.push({
                templateKey,
                id: result.id,
                status: result.status
              })
            } else {
              errors.push(`Template ${templateKey} not found in library`)
            }
          } catch (error) {
            errors.push(`Failed to submit ${templateKey}: ${error.message}`)
          }
        }

        return NextResponse.json({
          success: true,
          submissions,
          errors,
          summary: {
            submitted: submissions.length,
            failed: errors.length,
            approved: submissions.filter(s => s.status === 'APPROVED').length,
            pending: submissions.filter(s => s.status === 'PENDING').length
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, ab_test, bulk_submit' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Template POST error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process template request',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Helper function to get template description
function getTemplateDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'DAILY_MARKET_UPDATE_V1': 'Primary daily market update template with comprehensive layout',
    'DAILY_MARKET_UPDATE_V2': 'Alternative daily market update template with image header',
    'DAILY_MARKET_UPDATE_HINDI_V1': 'Hindi version of daily market update template',
    'MARKET_CLOSED_UPDATE': 'Template for market holidays and non-trading days',
    'ADVISOR_WELCOME': 'Welcome message template for new subscriber onboarding'
  }
  
  return descriptions[key] || 'Template for WhatsApp messaging'
}