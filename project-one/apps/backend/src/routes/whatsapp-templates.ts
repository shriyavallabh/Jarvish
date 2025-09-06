// WhatsApp Template Management API Routes

import { Router, Request, Response } from 'express';
import whatsappTemplateManager from '../services/whatsapp-template-manager';
import { z } from 'zod';

const router = Router();

// Request validation schemas
const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  language: z.string().default('en'),
  components: z.array(z.any())
});

interface CreateTemplateRequest {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components: any[];
}

const SendTemplateSchema = z.object({
  to: z.string().regex(/^\d{10,15}$/), // Phone number validation
  templateName: z.string().min(1),
  language: z.string().default('en'),
  headerImageUrl: z.string().url().optional(),
  bodyParameters: z.array(z.string()).optional()
});

interface SendTemplateParams {
  to: string;
  templateName: string;
  language: string;
  headerImageUrl?: string;
  bodyParameters?: string[];
}

/**
 * GET /api/whatsapp/templates
 * Get all WhatsApp templates with statistics
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const summary = await whatsappTemplateManager.getTemplatesSummary();
    
    res.json({
      success: true,
      data: {
        summary: {
          total: summary.total,
          approved: summary.approved,
          pending: summary.pending,
          rejected: summary.rejected,
          imageTemplates: summary.imageTemplates,
          textTemplates: summary.textTemplates
        },
        templates: summary.templates.map(template => ({
          name: template.name,
          status: template.status,
          category: template.category,
          language: template.language,
          hasImage: template.components.some(c => 
            c.type === 'HEADER' && c.format === 'IMAGE'
          ),
          createdTime: template.created_time
        }))
      }
    });

  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/whatsapp/templates/approved
 * Get only approved templates
 */
router.get('/templates/approved', async (req: Request, res: Response) => {
  try {
    const templates = await whatsappTemplateManager.getTemplates();
    const approved = templates.filter(t => t.status === 'APPROVED');

    res.json({
      success: true,
      data: approved.map(template => ({
        name: template.name,
        category: template.category,
        language: template.language,
        hasImage: template.components.some(c => 
          c.type === 'HEADER' && c.format === 'IMAGE'
        ),
        components: template.components.map(c => ({
          type: c.type,
          format: c.format,
          text: c.text
        }))
      }))
    });

  } catch (error: any) {
    console.error('Error fetching approved templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approved templates'
    });
  }
});

/**
 * GET /api/whatsapp/templates/image
 * Get only approved image templates
 */
router.get('/templates/image', async (req: Request, res: Response) => {
  try {
    const imageTemplates = await whatsappTemplateManager.getApprovedImageTemplates();

    res.json({
      success: true,
      data: imageTemplates.map(template => ({
        name: template.name,
        category: template.category,
        language: template.language,
        components: template.components
      }))
    });

  } catch (error: any) {
    console.error('Error fetching image templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch image templates'
    });
  }
});

/**
 * POST /api/whatsapp/templates
 * Create a new WhatsApp template
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateTemplateSchema.parse(req.body);
    
    const result = await whatsappTemplateManager.createTemplate(validatedData as CreateTemplateRequest);
    
    res.json({
      success: true,
      data: {
        id: result.id,
        status: result.status,
        message: 'Template created successfully. Waiting for WhatsApp approval.'
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

    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * POST /api/whatsapp/templates/financial
 * Create financial content template with 1200x628 image support
 */
router.post('/templates/financial', async (req: Request, res: Response) => {
  try {
    const result = await whatsappTemplateManager.createFinancialContentTemplate();
    
    res.json({
      success: true,
      data: {
        id: result.id,
        status: result.status,
        templateName: 'jarvish_financial_content_1200x628',
        message: 'Financial content template created with 1200x628 image support'
      }
    });

  } catch (error: any) {
    console.error('Error creating financial template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create financial template',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * POST /api/whatsapp/templates/market-update
 * Create market update template
 */
router.post('/templates/market-update', async (req: Request, res: Response) => {
  try {
    const result = await whatsappTemplateManager.createMarketUpdateTemplate();
    
    res.json({
      success: true,
      data: {
        id: result.id,
        status: result.status,
        templateName: 'jarvish_market_update_image',
        message: 'Market update template created successfully'
      }
    });

  } catch (error: any) {
    console.error('Error creating market update template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create market update template',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * POST /api/whatsapp/templates/educational
 * Create educational content template
 */
router.post('/templates/educational', async (req: Request, res: Response) => {
  try {
    const result = await whatsappTemplateManager.createEducationalTemplate();
    
    res.json({
      success: true,
      data: {
        id: result.id,
        status: result.status,
        templateName: 'jarvish_educational_content',
        message: 'Educational template created successfully'
      }
    });

  } catch (error: any) {
    console.error('Error creating educational template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create educational template',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * DELETE /api/whatsapp/templates/:name
 * Delete a WhatsApp template
 */
router.delete('/templates/:name', async (req: Request, res: Response) => {
  try {
    const templateName = req.params.name;
    
    await whatsappTemplateManager.deleteTemplate(templateName);
    
    res.json({
      success: true,
      message: `Template '${templateName}' deleted successfully`
    });

  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * POST /api/whatsapp/send-template
 * Send a template message with image support
 */
router.post('/send-template', async (req: Request, res: Response) => {
  try {
    const validatedData = SendTemplateSchema.parse(req.body);
    
    const result = await whatsappTemplateManager.sendTemplateMessage(validatedData as SendTemplateParams);
    
    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        status: result.status,
        to: validatedData.to,
        template: validatedData.templateName
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

    console.error('Error sending template message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send template message',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * GET /api/whatsapp/templates/:name/status
 * Check template status
 */
router.get('/templates/:name/status', async (req: Request, res: Response) => {
  try {
    const templateName = req.params.name;
    const template = await whatsappTemplateManager.getTemplateStatus(templateName);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: {
        name: template.name,
        status: template.status,
        category: template.category,
        language: template.language,
        hasImage: template.components.some(c => 
          c.type === 'HEADER' && c.format === 'IMAGE'
        ),
        createdTime: template.created_time,
        updatedTime: template.updated_time
      }
    });

  } catch (error: any) {
    console.error('Error checking template status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check template status'
    });
  }
});

/**
 * GET /api/whatsapp/health
 * Check WhatsApp API health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Simple health check by fetching templates
    const summary = await whatsappTemplateManager.getTemplatesSummary();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        totalTemplates: summary.total,
        approvedTemplates: summary.approved,
        imageTemplates: summary.imageTemplates,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('WhatsApp health check failed:', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: 'WhatsApp API connection failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;