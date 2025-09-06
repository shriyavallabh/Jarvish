// Image Processing API Routes
// Handle GPT-image-1 to WhatsApp format conversion and hosting

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import imageProcessor from '../services/image-processor';

const router = Router();

// Request validation schemas
const ProcessImageSchema = z.object({
  base64Data: z.string().min(1),
  width: z.number().min(100).max(2000).optional().default(1200),
  height: z.number().min(100).max(2000).optional().default(628),
  format: z.enum(['jpeg', 'png', 'webp']).optional().default('jpeg'),
  quality: z.number().min(10).max(100).optional().default(85),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional().default('cover')
});

const ProcessUrlSchema = z.object({
  imageUrl: z.string().url(),
  width: z.number().min(100).max(2000).optional().default(1200),
  height: z.number().min(100).max(2000).optional().default(628),
  format: z.enum(['jpeg', 'png', 'webp']).optional().default('jpeg'),
  quality: z.number().min(10).max(100).optional().default(85),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional().default('cover')
});

const BatchProcessSchema = z.object({
  images: z.array(z.object({
    base64: z.string().min(1),
    name: z.string().min(1)
  })).min(1).max(10),
  width: z.number().min(100).max(2000).optional().default(1200),
  height: z.number().min(100).max(2000).optional().default(628),
  format: z.enum(['jpeg', 'png', 'webp']).optional().default('jpeg'),
  quality: z.number().min(10).max(100).optional().default(85)
});

/**
 * POST /api/images/process-gpt
 * Process GPT-image-1 base64 to WhatsApp format
 */
router.post('/process-gpt', async (req: Request, res: Response) => {
  try {
    const validatedData = ProcessImageSchema.parse(req.body);
    
    const startTime = Date.now();
    const processedImage = await imageProcessor.processGPTImage(validatedData.base64Data, {
      width: validatedData.width,
      height: validatedData.height,
      format: validatedData.format,
      quality: validatedData.quality,
      fit: validatedData.fit
    });
    
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        ...processedImage,
        originalSize: validatedData.base64Data.length,
        processingTime,
        optimized: true
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

    console.error('Image processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/images/process-url
 * Process image from URL (DALL-E, etc.)
 */
router.post('/process-url', async (req: Request, res: Response) => {
  try {
    const validatedData = ProcessUrlSchema.parse(req.body);
    
    const startTime = Date.now();
    const processedImage = await imageProcessor.processImageFromUrl(validatedData.imageUrl, {
      width: validatedData.width,
      height: validatedData.height,
      format: validatedData.format,
      quality: validatedData.quality,
      fit: validatedData.fit
    });
    
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        ...processedImage,
        sourceUrl: validatedData.imageUrl,
        processingTime,
        optimized: true
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

    console.error('URL image processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image from URL',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/images/whatsapp-formats
 * Generate all WhatsApp formats from GPT image
 */
router.post('/whatsapp-formats', async (req: Request, res: Response) => {
  try {
    const { base64Data } = req.body;
    
    if (!base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'base64Data is required'
      });
    }

    const startTime = Date.now();
    
    // Generate all WhatsApp formats concurrently
    const [postImage, statusImage, linkedinImage] = await Promise.all([
      // WhatsApp post (1200x628)
      imageProcessor.processGPTImage(base64Data, {
        width: 1200,
        height: 628,
        format: 'jpeg',
        quality: 85,
        fit: 'cover'
      }),
      
      // WhatsApp Status (1080x1920)
      imageProcessor.createStatusImage(base64Data),
      
      // LinkedIn (1200x627)
      imageProcessor.createLinkedInImage(base64Data)
    ]);
    
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        whatsappPost: postImage,
        whatsappStatus: statusImage,
        linkedinPost: linkedinImage,
        processingTime,
        generatedFormats: 3
      }
    });

  } catch (error: any) {
    console.error('Multi-format processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate WhatsApp formats',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/images/batch-process
 * Process multiple images in batch
 */
router.post('/batch-process', async (req: Request, res: Response) => {
  try {
    const validatedData = BatchProcessSchema.parse(req.body);
    
    const startTime = Date.now();
    const processedImages = await imageProcessor.batchProcess(
      validatedData.images as { base64: string; name: string }[],
      {
        width: validatedData.width,
        height: validatedData.height,
        format: validatedData.format,
        quality: validatedData.quality
      }
    );
    
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        processedImages,
        totalProcessed: processedImages.length,
        totalRequested: validatedData.images.length,
        processingTime,
        averageTimePerImage: Math.round(processingTime / processedImages.length)
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

    console.error('Batch processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process images in batch',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/images/metadata
 * Get image metadata without processing
 */
router.post('/metadata', async (req: Request, res: Response) => {
  try {
    const { base64Data } = req.body;
    
    if (!base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'base64Data is required'
      });
    }

    const metadata = await imageProcessor.getImageMetadata(base64Data);

    res.json({
      success: true,
      data: {
        ...metadata,
        aspectRatio: metadata.width / metadata.height,
        isWhatsAppCompatible: metadata.width === 1200 && metadata.height === 628,
        isSquare: metadata.width === metadata.height,
        sizeKB: Math.round(metadata.size / 1024)
      }
    });

  } catch (error: any) {
    console.error('Metadata extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract image metadata',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/images/storage-stats
 * Get storage statistics
 */
router.get('/storage-stats', async (req: Request, res: Response) => {
  try {
    const stats = await imageProcessor.getStorageStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        totalSizeMB: Math.round(stats.totalSize / (1024 * 1024) * 100) / 100,
        averageFileSizeKB: stats.totalFiles > 0 
          ? Math.round((stats.totalSize / stats.totalFiles) / 1024)
          : 0
      }
    });

  } catch (error: any) {
    console.error('Storage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage statistics'
    });
  }
});

/**
 * POST /api/images/cleanup
 * Clean up old processed images
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const deletedCount = await imageProcessor.cleanupOldImages();
    
    res.json({
      success: true,
      data: {
        deletedFiles: deletedCount,
        message: `Cleaned up ${deletedCount} old images`
      }
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old images'
    });
  }
});

/**
 * GET /api/images/health
 * Check image processing service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test with a small base64 image
    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const startTime = Date.now();
    await imageProcessor.getImageMetadata(testBase64);
    const processingTime = Date.now() - startTime;
    
    const storageStats = await imageProcessor.getStorageStats();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        processingTime,
        storageStats: {
          totalFiles: storageStats.totalFiles,
          totalSizeMB: Math.round(storageStats.totalSize / (1024 * 1024) * 100) / 100
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Image processing health check failed:', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: 'Image processing service unavailable',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;