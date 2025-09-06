import { Router, Request, Response } from 'express';
import multer from 'multer';
import geminiClient from '../services/gemini/gemini-client';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/images/generate
 * Generate a single financial infographic
 */
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      content,
      contentType,
      language = 'en',
      format = 'post',
      advisorName,
      euin,
      includeDisclaimer = true
    } = req.body;

    // Validate required fields
    if (!content || !contentType) {
      return res.status(400).json({
        error: 'Missing required fields: content and contentType'
      });
    }

    // Validate content type
    const validContentTypes = ['market-update', 'educational', 'regulatory', 'festival', 'tax-planning'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        error: `Invalid contentType. Must be one of: ${validContentTypes.join(', ')}`
      });
    }

    // Validate language
    const validLanguages = ['en', 'hi', 'mr'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        error: `Invalid language. Must be one of: ${validLanguages.join(', ')}`
      });
    }

    // Validate format
    const validFormats = ['post', 'status', 'linkedin'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        error: `Invalid format. Must be one of: ${validFormats.join(', ')}`
      });
    }

    logger.info('Generating image with Gemini', {
      contentType,
      language,
      format,
      userId: (req as any).userId
    });

    const generatedImage = await geminiClient.generateFinancialInfographic({
      content,
      contentType,
      language,
      format,
      advisorName,
      euin,
      includeDisclaimer
    });

    // Return image as base64 for easy frontend consumption
    const base64Image = generatedImage.buffer.toString('base64');

    res.json({
      success: true,
      image: {
        data: base64Image,
        mimeType: generatedImage.mimeType,
        dimensions: generatedImage.dimensions,
        sizeKB: generatedImage.sizeKB,
        metadata: generatedImage.metadata
      }
    });

  } catch (error: any) {
    logger.error('Image generation failed', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message
    });
  }
});

/**
 * POST /api/images/generate-with-branding
 * Generate image with advisor branding
 */
router.post('/generate-with-branding', 
  authMiddleware,
  upload.single('logo'),
  async (req: Request, res: Response) => {
    try {
      const {
        content,
        contentType,
        language = 'en',
        format = 'post',
        advisorName,
        euin,
        includeDisclaimer = true
      } = req.body;

      // Validate required fields
      if (!content || !contentType || !advisorName) {
        return res.status(400).json({
          error: 'Missing required fields: content, contentType, and advisorName'
        });
      }

      const advisorLogo = req.file ? req.file.buffer : undefined;

      logger.info('Generating branded image with Gemini', {
        contentType,
        language,
        format,
        advisorName,
        hasLogo: !!advisorLogo,
        userId: (req as any).userId
      });

      const generatedImage = await geminiClient.generateFinancialInfographic({
        content,
        contentType,
        language,
        format,
        advisorName,
        advisorLogo,
        euin,
        includeDisclaimer
      });

      // Return image as base64
      const base64Image = generatedImage.buffer.toString('base64');

      res.json({
        success: true,
        image: {
          data: base64Image,
          mimeType: generatedImage.mimeType,
          dimensions: generatedImage.dimensions,
          sizeKB: generatedImage.sizeKB,
          metadata: {
            ...generatedImage.metadata,
            advisorName,
            hasLogo: !!advisorLogo
          }
        }
      });

    } catch (error: any) {
      logger.error('Branded image generation failed', error);
      res.status(500).json({
        error: 'Failed to generate branded image',
        message: error.message
      });
    }
});

/**
 * POST /api/images/generate-batch
 * Generate multiple images in batch
 */
router.post('/generate-batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: 'Invalid request. Expected array of image configurations'
      });
    }

    if (images.length > 10) {
      return res.status(400).json({
        error: 'Batch size too large. Maximum 10 images per batch'
      });
    }

    logger.info('Generating batch of images', {
      count: images.length,
      userId: (req as any).userId
    });

    const results = await geminiClient.generateBatch(images);

    // Convert all images to base64
    const processedResults = results.map(result => ({
      data: result.buffer.toString('base64'),
      mimeType: result.mimeType,
      dimensions: result.dimensions,
      sizeKB: result.sizeKB,
      metadata: result.metadata
    }));

    res.json({
      success: true,
      images: processedResults,
      count: processedResults.length
    });

  } catch (error: any) {
    logger.error('Batch image generation failed', error);
    res.status(500).json({
      error: 'Failed to generate batch images',
      message: error.message
    });
  }
});

/**
 * GET /api/images/templates
 * Get available content templates
 */
router.get('/templates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const templates = {
      'market-update': {
        name: 'Market Update',
        description: 'Daily market movements and insights',
        languages: ['en', 'hi', 'mr'],
        formats: ['post', 'status'],
        sampleContent: 'Sensex up 1.2% at 72,500. IT and Banking sectors lead the rally.'
      },
      'educational': {
        name: 'Educational Content',
        description: 'Investment education and financial literacy',
        languages: ['en', 'hi', 'mr'],
        formats: ['post', 'status', 'linkedin'],
        sampleContent: '5 Benefits of Systematic Investment Plans (SIPs) for Long-term Wealth Creation'
      },
      'regulatory': {
        name: 'Regulatory Update',
        description: 'SEBI guidelines and compliance updates',
        languages: ['en', 'hi'],
        formats: ['post', 'linkedin'],
        sampleContent: 'New SEBI guidelines for mutual fund distributors effective from April 1, 2024'
      },
      'festival': {
        name: 'Festival Greetings',
        description: 'Festival wishes with financial tips',
        languages: ['en', 'hi', 'mr'],
        formats: ['post', 'status'],
        sampleContent: 'This Diwali, gift your family the power of financial security with mutual funds'
      },
      'tax-planning': {
        name: 'Tax Planning',
        description: 'Tax saving tips and deadlines',
        languages: ['en', 'hi'],
        formats: ['post', 'linkedin'],
        sampleContent: 'Save up to ₹46,800 in taxes with ELSS mutual funds under Section 80C'
      }
    };

    res.json({
      success: true,
      templates
    });

  } catch (error: any) {
    logger.error('Failed to fetch templates', error);
    res.status(500).json({
      error: 'Failed to fetch templates',
      message: error.message
    });
  }
});

/**
 * POST /api/images/test-gemini
 * Test Gemini API connectivity
 */
router.post('/test-gemini', async (req: Request, res: Response) => {
  try {
    logger.info('Testing Gemini API connectivity');

    // Generate a simple test image
    const testImage = await geminiClient.generateFinancialInfographic({
      content: 'Test: Sensex at 72,000. This is a test image for Gemini API.',
      contentType: 'market-update',
      language: 'en',
      format: 'post',
      includeDisclaimer: true
    });

    const base64Image = testImage.buffer.toString('base64');

    res.json({
      success: true,
      message: 'Gemini API is working correctly',
      testImage: {
        data: base64Image,
        mimeType: testImage.mimeType,
        dimensions: testImage.dimensions,
        sizeKB: testImage.sizeKB
      }
    });

  } catch (error: any) {
    logger.error('Gemini API test failed', error);
    res.status(500).json({
      error: 'Gemini API test failed',
      message: error.message
    });
  }
});

export default router;