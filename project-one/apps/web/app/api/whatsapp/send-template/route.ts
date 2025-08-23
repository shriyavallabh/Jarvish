import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { getWhatsAppClient } from '@/lib/whatsapp/client'
import { TemplateManager, TEMPLATES } from '@/lib/whatsapp/templates'
import { AdvisorService } from '@/lib/supabase/services'
import { z } from 'zod'

// Request validation schema
const sendTemplateSchema = z.object({
  templateName: z.enum([
    'DAILY_CONTENT',
    'DAILY_CONTENT_HINDI',
    'WELCOME_ADVISOR',
    'SUBSCRIPTION_REMINDER',
    'CONTENT_APPROVED',
    'DELIVERY_FAILED'
  ]),
  phoneNumber: z.string().optional(),
  variables: z.record(z.string()).optional()
})

// POST /api/whatsapp/send-template - Send template message
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const validation = sendTemplateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { templateName, phoneNumber, variables } = validation.data

    // Get advisor details
    const advisorService = new AdvisorService()
    const advisor = await advisorService.getAdvisorByClerkId(userId)

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor profile not found' },
        { status: 404 }
      )
    }

    // Use advisor's phone if not provided
    const targetPhone = phoneNumber || advisor.mobile

    // Validate phone number
    const whatsappClient = getWhatsAppClient()
    if (!whatsappClient.validateIndianPhoneNumber(targetPhone)) {
      return NextResponse.json(
        { error: 'Invalid Indian phone number format' },
        { status: 400 }
      )
    }

    // Get template
    const template = TemplateManager.getTemplate(templateName)

    // Prepare variables with defaults
    const templateVars = {
      advisor_name: advisor.business_name,
      euin: advisor.euin,
      ...variables
    }

    // Validate required variables
    const validation_result = TemplateManager.validateVariables(template, templateVars)
    if (!validation_result.valid) {
      return NextResponse.json(
        { 
          error: 'Missing template variables',
          missing: validation_result.missing 
        },
        { status: 400 }
      )
    }

    // Format template
    const formatted = TemplateManager.formatTemplate(template, templateVars)

    // Send via WhatsApp
    const response = await whatsappClient.sendTemplate(
      targetPhone,
      template.name,
      template.language,
      formatted.components
    )

    return NextResponse.json({
      success: true,
      messageId: response.messages[0].id,
      contactId: response.contacts[0].wa_id
    })
  } catch (error) {
    console.error('WhatsApp template send error:', error)
    return NextResponse.json(
      { error: 'Failed to send template', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/whatsapp/send-template - List available templates
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get WhatsApp client
    const whatsappClient = getWhatsAppClient()

    // Fetch templates from WhatsApp
    const whatsappTemplates = await whatsappClient.listTemplates()

    // Map local templates
    const localTemplates = Object.entries(TEMPLATES).map(([key, template]) => ({
      key,
      name: template.name,
      category: template.category,
      language: template.language,
      variables: template.variables,
      status: whatsappTemplates.find(t => t.name === template.name)?.status || 'NOT_CREATED'
    }))

    return NextResponse.json({
      success: true,
      templates: localTemplates,
      whatsappTemplates: whatsappTemplates.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        category: t.category,
        language: t.language,
        rejected_reason: t.rejected_reason
      }))
    })
  } catch (error) {
    console.error('WhatsApp templates list error:', error)
    return NextResponse.json(
      { error: 'Failed to list templates', details: error.message },
      { status: 500 }
    )
  }
}