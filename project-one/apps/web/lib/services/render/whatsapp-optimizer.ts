import sharp from 'sharp';
import { GeneratedImage } from './image-generator';

// WhatsApp image specifications
export interface WhatsAppImageSpecs {
  maxFileSize: number;        // in bytes
  recommendedWidth: number;
  recommendedHeight: number;
  supportedFormats: string[];
  compressionQuality: number; // 0-100
}

// Optimization result
export interface OptimizedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  fileSize: number;
  compressionRatio: number;
  optimizationTime: number;
}

// Device profile for optimization
export enum DeviceProfile {
  HIGH_END = 'high_end',     // Latest smartphones, high bandwidth
  MID_RANGE = 'mid_range',   // Average smartphones, moderate bandwidth
  LOW_END = 'low_end',       // Budget phones, limited bandwidth
  FEATURE_PHONE = 'feature_phone' // Basic phones, very limited
}

// Network conditions
export enum NetworkCondition {
  WIFI = 'wifi',           // High speed, no data concerns
  MOBILE_4G = '4g',        // Good speed, data usage matters
  MOBILE_3G = '3g',        // Moderate speed, data conservation
  MOBILE_2G = '2g',        // Slow speed, minimize data
}

export class WhatsAppOptimizer {
  private readonly specs: Record<string, WhatsAppImageSpecs> = {
    profile_picture: {
      maxFileSize: 1024 * 1024,     // 1MB
      recommendedWidth: 640,
      recommendedHeight: 640,
      supportedFormats: ['jpeg', 'png'],
      compressionQuality: 85,
    },
    status_image: {
      maxFileSize: 5 * 1024 * 1024,  // 5MB
      recommendedWidth: 1080,
      recommendedHeight: 1920,
      supportedFormats: ['jpeg', 'png', 'webp'],
      compressionQuality: 80,
    },
    chat_image: {
      maxFileSize: 16 * 1024 * 1024, // 16MB (WhatsApp limit)
      recommendedWidth: 1600,
      recommendedHeight: 1200,
      supportedFormats: ['jpeg', 'png', 'webp'],
      compressionQuality: 75,
    },
    document_image: {
      maxFileSize: 100 * 1024 * 1024, // 100MB for documents
      recommendedWidth: 2048,
      recommendedHeight: 2048,
      supportedFormats: ['jpeg', 'png', 'pdf'],
      compressionQuality: 90,
    },
  };

  // Get optimization settings based on device and network
  private getOptimizationSettings(
    device: DeviceProfile,
    network: NetworkCondition
  ): { quality: number; maxWidth: number; maxFileSize: number } {
    const settings = {
      [DeviceProfile.HIGH_END]: {
        [NetworkCondition.WIFI]: { quality: 90, maxWidth: 2048, maxFileSize: 10 * 1024 * 1024 },
        [NetworkCondition.MOBILE_4G]: { quality: 85, maxWidth: 1600, maxFileSize: 5 * 1024 * 1024 },
        [NetworkCondition.MOBILE_3G]: { quality: 75, maxWidth: 1200, maxFileSize: 2 * 1024 * 1024 },
        [NetworkCondition.MOBILE_2G]: { quality: 60, maxWidth: 800, maxFileSize: 500 * 1024 },
      },
      [DeviceProfile.MID_RANGE]: {
        [NetworkCondition.WIFI]: { quality: 85, maxWidth: 1600, maxFileSize: 5 * 1024 * 1024 },
        [NetworkCondition.MOBILE_4G]: { quality: 80, maxWidth: 1200, maxFileSize: 3 * 1024 * 1024 },
        [NetworkCondition.MOBILE_3G]: { quality: 70, maxWidth: 1080, maxFileSize: 1 * 1024 * 1024 },
        [NetworkCondition.MOBILE_2G]: { quality: 55, maxWidth: 640, maxFileSize: 300 * 1024 },
      },
      [DeviceProfile.LOW_END]: {
        [NetworkCondition.WIFI]: { quality: 80, maxWidth: 1200, maxFileSize: 3 * 1024 * 1024 },
        [NetworkCondition.MOBILE_4G]: { quality: 75, maxWidth: 1080, maxFileSize: 2 * 1024 * 1024 },
        [NetworkCondition.MOBILE_3G]: { quality: 65, maxWidth: 800, maxFileSize: 750 * 1024 },
        [NetworkCondition.MOBILE_2G]: { quality: 50, maxWidth: 480, maxFileSize: 200 * 1024 },
      },
      [DeviceProfile.FEATURE_PHONE]: {
        [NetworkCondition.WIFI]: { quality: 70, maxWidth: 800, maxFileSize: 1 * 1024 * 1024 },
        [NetworkCondition.MOBILE_4G]: { quality: 65, maxWidth: 640, maxFileSize: 750 * 1024 },
        [NetworkCondition.MOBILE_3G]: { quality: 55, maxWidth: 480, maxFileSize: 500 * 1024 },
        [NetworkCondition.MOBILE_2G]: { quality: 40, maxWidth: 320, maxFileSize: 100 * 1024 },
      },
    };

    return settings[device][network];
  }

  // Optimize image for WhatsApp
  async optimizeForWhatsApp(
    image: Buffer | GeneratedImage,
    imageType: keyof typeof this.specs = 'chat_image',
    device: DeviceProfile = DeviceProfile.MID_RANGE,
    network: NetworkCondition = NetworkCondition.MOBILE_4G
  ): Promise<OptimizedImage> {
    const startTime = Date.now();
    const inputBuffer = Buffer.isBuffer(image) ? image : image.buffer;
    const originalSize = inputBuffer.length;

    const spec = this.specs[imageType];
    const settings = this.getOptimizationSettings(device, network);

    // Use the more restrictive settings
    const targetQuality = Math.min(spec.compressionQuality, settings.quality);
    const targetWidth = Math.min(spec.recommendedWidth, settings.maxWidth);
    const targetFileSize = Math.min(spec.maxFileSize, settings.maxFileSize);

    let optimizedBuffer = inputBuffer;
    let format = 'jpeg'; // Default to JPEG for better compression
    let metadata: sharp.Metadata;

    try {
      // Get image metadata
      metadata = await sharp(inputBuffer).metadata();
      
      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = (metadata.width || 1) / (metadata.height || 1);
      let newWidth = targetWidth;
      let newHeight = Math.round(targetWidth / aspectRatio);

      // If height exceeds recommended, adjust based on height
      if (imageType === 'status_image' && newHeight > spec.recommendedHeight) {
        newHeight = spec.recommendedHeight;
        newWidth = Math.round(newHeight * aspectRatio);
      }

      // Process image with progressive optimization
      let quality = targetQuality;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const processed = await sharp(inputBuffer)
          .resize(newWidth, newHeight, {
            fit: 'inside',
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3,
          })
          .jpeg({
            quality,
            progressive: true,
            mozjpeg: true, // Use mozjpeg encoder for better compression
          })
          .toBuffer();

        optimizedBuffer = processed;

        // Check if file size is acceptable
        if (optimizedBuffer.length <= targetFileSize) {
          break;
        }

        // Reduce quality or dimensions for next attempt
        if (attempts % 2 === 0) {
          quality = Math.max(40, quality - 10);
        } else {
          newWidth = Math.round(newWidth * 0.9);
          newHeight = Math.round(newHeight * 0.9);
        }

        attempts++;
      }

      // Try WebP if JPEG is still too large and WebP is supported
      if (optimizedBuffer.length > targetFileSize && spec.supportedFormats.includes('webp')) {
        const webpBuffer = await sharp(inputBuffer)
          .resize(newWidth, newHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({
            quality: targetQuality,
            effort: 4, // Balance between compression and speed
          })
          .toBuffer();

        if (webpBuffer.length < optimizedBuffer.length) {
          optimizedBuffer = webpBuffer;
          format = 'webp';
        }
      }

      // Get final metadata
      const finalMetadata = await sharp(optimizedBuffer).metadata();

      return {
        buffer: optimizedBuffer,
        format,
        width: finalMetadata.width || newWidth,
        height: finalMetadata.height || newHeight,
        fileSize: optimizedBuffer.length,
        compressionRatio: originalSize / optimizedBuffer.length,
        optimizationTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error('Failed to optimize image for WhatsApp');
    }
  }

  // Optimize multiple images in batch
  async optimizeBatch(
    images: (Buffer | GeneratedImage)[],
    imageType: keyof typeof this.specs = 'chat_image',
    device: DeviceProfile = DeviceProfile.MID_RANGE,
    network: NetworkCondition = NetworkCondition.MOBILE_4G
  ): Promise<OptimizedImage[]> {
    const results = await Promise.all(
      images.map(image => this.optimizeForWhatsApp(image, imageType, device, network))
    );
    return results;
  }

  // Generate preview image for quick loading
  async generatePreview(
    image: Buffer | GeneratedImage,
    maxWidth: number = 200,
    quality: number = 60
  ): Promise<Buffer> {
    const inputBuffer = Buffer.isBuffer(image) ? image : image.buffer;

    const preview = await sharp(inputBuffer)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality,
        progressive: false,
      })
      .blur(0.3) // Slight blur for faster loading
      .toBuffer();

    return preview;
  }

  // Generate multiple size variants
  async generateSizeVariants(
    image: Buffer | GeneratedImage
  ): Promise<Record<string, OptimizedImage>> {
    const inputBuffer = Buffer.isBuffer(image) ? image : image.buffer;
    const variants: Record<string, OptimizedImage> = {};

    // Thumbnail
    variants.thumbnail = await this.optimizeForWhatsApp(
      inputBuffer,
      'profile_picture',
      DeviceProfile.LOW_END,
      NetworkCondition.MOBILE_3G
    );

    // Mobile optimized
    variants.mobile = await this.optimizeForWhatsApp(
      inputBuffer,
      'chat_image',
      DeviceProfile.MID_RANGE,
      NetworkCondition.MOBILE_4G
    );

    // High quality
    variants.highQuality = await this.optimizeForWhatsApp(
      inputBuffer,
      'document_image',
      DeviceProfile.HIGH_END,
      NetworkCondition.WIFI
    );

    return variants;
  }

  // Check if image needs optimization
  needsOptimization(
    image: Buffer | GeneratedImage,
    imageType: keyof typeof this.specs = 'chat_image'
  ): boolean {
    const size = Buffer.isBuffer(image) ? image.length : image.buffer.length;
    const spec = this.specs[imageType];
    return size > spec.maxFileSize * 0.8; // Optimize if within 80% of limit
  }

  // Estimate delivery time based on file size and network
  estimateDeliveryTime(
    fileSize: number,
    network: NetworkCondition
  ): number {
    // Estimated speeds in bytes per second
    const speeds = {
      [NetworkCondition.WIFI]: 5 * 1024 * 1024,      // 5 MB/s
      [NetworkCondition.MOBILE_4G]: 2 * 1024 * 1024,  // 2 MB/s
      [NetworkCondition.MOBILE_3G]: 384 * 1024,       // 384 KB/s
      [NetworkCondition.MOBILE_2G]: 40 * 1024,        // 40 KB/s
    };

    const speed = speeds[network];
    const baseTime = (fileSize / speed) * 1000; // Convert to milliseconds
    const overhead = 500; // Network overhead in ms

    return Math.round(baseTime + overhead);
  }

  // Get optimization recommendations
  getOptimizationRecommendations(
    currentSize: number,
    targetDevice: DeviceProfile,
    targetNetwork: NetworkCondition
  ): string[] {
    const recommendations: string[] = [];
    const settings = this.getOptimizationSettings(targetDevice, targetNetwork);

    if (currentSize > settings.maxFileSize) {
      recommendations.push(
        `Reduce file size to under ${(settings.maxFileSize / 1024 / 1024).toFixed(1)}MB for optimal delivery`
      );
    }

    if (targetNetwork === NetworkCondition.MOBILE_2G || targetNetwork === NetworkCondition.MOBILE_3G) {
      recommendations.push('Consider using lower quality settings for faster delivery on slow networks');
      recommendations.push('Use progressive JPEG encoding for better perceived loading speed');
    }

    if (targetDevice === DeviceProfile.LOW_END || targetDevice === DeviceProfile.FEATURE_PHONE) {
      recommendations.push('Reduce image dimensions to improve rendering performance on low-end devices');
      recommendations.push('Avoid complex transparency effects that may not render correctly');
    }

    if (currentSize > 1024 * 1024) {
      recommendations.push('Consider using WebP format for better compression while maintaining quality');
    }

    return recommendations;
  }

  // Validate image for WhatsApp compatibility
  validateForWhatsApp(
    image: Buffer | GeneratedImage,
    imageType: keyof typeof this.specs = 'chat_image'
  ): { valid: boolean; errors: string[] } {
    const size = Buffer.isBuffer(image) ? image.length : image.buffer.length;
    const spec = this.specs[imageType];
    const errors: string[] = [];

    if (size > spec.maxFileSize) {
      errors.push(`File size ${(size / 1024 / 1024).toFixed(1)}MB exceeds limit of ${(spec.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Additional validation can be added here

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default WhatsAppOptimizer;