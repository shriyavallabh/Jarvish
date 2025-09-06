// Image Processing Service for WhatsApp Optimization
// Converts gpt-image-1 (1024x1024) to WhatsApp format (1200x628) with proper cropping/resizing

import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface ImageProcessingOptions {
  width: number;
  height: number;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
  background?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

interface ProcessedImage {
  filename: string;
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

class ImageProcessor {
  private outputDir: string;
  private baseUrl: string;

  constructor() {
    this.outputDir = process.env.IMAGE_OUTPUT_DIR || '/tmp/processed-images';
    this.baseUrl = process.env.IMAGE_BASE_URL || 'http://localhost:8888';
    this.ensureOutputDir();
  }

  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  /**
   * Generate filename with hash for caching
   */
  private generateFilename(originalData: Buffer, options: ImageProcessingOptions): string {
    const hash = crypto
      .createHash('md5')
      .update(originalData)
      .update(JSON.stringify(options))
      .digest('hex');
    
    return `processed_${hash}_${options.width}x${options.height}.${options.format || 'jpeg'}`;
  }

  /**
   * Process gpt-image-1 base64 to WhatsApp format (1200x628)
   */
  async processGPTImage(
    base64Data: string,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImage> {
    const defaultOptions: ImageProcessingOptions = {
      width: 1200,
      height: 628,
      format: 'jpeg',
      quality: 85,
      fit: 'cover',
      background: '#ffffff'
    };

    const processOptions = { ...defaultOptions, ...options };

    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Generate filename
      const filename = this.generateFilename(imageBuffer, processOptions);
      const outputPath = path.join(this.outputDir, filename);
      
      // Check if already processed
      try {
        await fs.access(outputPath);
        const stats = await fs.stat(outputPath);
        return {
          filename,
          url: `${this.baseUrl}/${filename}`,
          width: processOptions.width,
          height: processOptions.height,
          size: stats.size,
          format: processOptions.format!
        };
      } catch {
        // File doesn't exist, process it
      }

      // Process with Sharp
      let processor = sharp(imageBuffer);
      
      // Resize to WhatsApp dimensions
      processor = processor.resize(
        processOptions.width,
        processOptions.height,
        {
          fit: processOptions.fit as any,
          background: processOptions.background,
          withoutEnlargement: false
        }
      );

      // Set format and quality
      if (processOptions.format === 'jpeg') {
        processor = processor.jpeg({ quality: processOptions.quality });
      } else if (processOptions.format === 'png') {
        processor = processor.png({ quality: processOptions.quality });
      } else if (processOptions.format === 'webp') {
        processor = processor.webp({ quality: processOptions.quality });
      }

      // Save processed image
      const processedBuffer = await processor.toBuffer();
      await fs.writeFile(outputPath, processedBuffer);

      // Get file stats
      const stats = await fs.stat(outputPath);

      return {
        filename,
        url: `${this.baseUrl}/${filename}`,
        width: processOptions.width,
        height: processOptions.height,
        size: stats.size,
        format: processOptions.format!
      };

    } catch (error) {
      console.error('Image processing failed:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Process image from URL (for DALL-E URLs)
   */
  async processImageFromUrl(
    imageUrl: string,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImage> {
    try {
      // Download image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      const imageBuffer = Buffer.from(response.data);
      
      // Convert to base64 and process
      const base64Data = imageBuffer.toString('base64');
      return this.processGPTImage(base64Data, options);

    } catch (error) {
      console.error('Failed to download and process image:', error);
      throw new Error('Failed to process image from URL');
    }
  }

  /**
   * Create WhatsApp status image (1080x1920)
   */
  async createStatusImage(
    base64Data: string,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImage> {
    const statusOptions: ImageProcessingOptions = {
      width: 1080,
      height: 1920,
      format: 'jpeg',
      quality: 85,
      fit: 'contain',
      background: '#ffffff'
    };

    return this.processGPTImage(base64Data, { ...statusOptions, ...options });
  }

  /**
   * Create LinkedIn post image (1200x627)
   */
  async createLinkedInImage(
    base64Data: string,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImage> {
    const linkedinOptions: ImageProcessingOptions = {
      width: 1200,
      height: 627,
      format: 'jpeg',
      quality: 90,
      fit: 'cover',
      background: '#ffffff'
    };

    return this.processGPTImage(base64Data, { ...linkedinOptions, ...options });
  }

  /**
   * Batch process multiple images
   */
  async batchProcess(
    images: { base64: string; name: string }[],
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];

    for (const image of images) {
      try {
        const processed = await this.processGPTImage(image.base64, options);
        results.push(processed);
      } catch (error) {
        console.error(`Failed to process image ${image.name}:`, error);
        // Continue with other images
      }
    }

    return results;
  }

  /**
   * Get image metadata without processing
   */
  async getImageMetadata(base64Data: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
  }> {
    try {
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const metadata = await sharp(imageBuffer).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: imageBuffer.length,
        hasAlpha: metadata.hasAlpha || false
      };
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      throw new Error('Failed to analyze image');
    }
  }

  /**
   * Clean up old processed images (older than 24 hours)
   */
  async cleanupOldImages(): Promise<number> {
    try {
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old images`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old images:', error);
      return 0;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: Date;
    newestFile: Date;
  }> {
    try {
      const files = await fs.readdir(this.outputDir);
      let totalSize = 0;
      let oldestTime = Date.now();
      let newestTime = 0;

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        
        if (stats.mtime.getTime() < oldestTime) {
          oldestTime = stats.mtime.getTime();
        }
        if (stats.mtime.getTime() > newestTime) {
          newestTime = stats.mtime.getTime();
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        oldestFile: new Date(oldestTime),
        newestFile: new Date(newestTime)
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestFile: new Date(),
        newestFile: new Date()
      };
    }
  }
}

export default new ImageProcessor();