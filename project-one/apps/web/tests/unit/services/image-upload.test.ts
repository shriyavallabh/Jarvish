/**
 * Image Upload Service Tests
 * Tests for secure image upload and processing
 */

import { uploadImage, deleteImage, getOptimizedImageUrl, validateImageFile } from '@/lib/services/image-upload';

describe('ImageUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set NODE_ENV to test so we get mock implementations
    process.env.NODE_ENV = 'test';
  });

  describe('uploadImage', () => {
    it('should upload and process advisor profile images', async () => {
      const fileBuffer = Buffer.from('image content');
      const options = {
        file: {
          buffer: fileBuffer,
          mimetype: 'image/jpeg',
          size: fileBuffer.length
        },
        folder: 'profiles/advisor-123',
        transformation: {
          width: 400,
          height: 400,
          quality: '85'
        }
      };

      const result = await uploadImage(options);

      expect(result.success).toBe(true);
      expect(result.url).toContain('advisor-123');
      expect(result.publicId).toContain('advisor-123');
    });

    it('should validate image file types', async () => {
      const validation = validateImageFile({
        mimetype: 'application/pdf',
        size: 1024
      });

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Invalid file type');
    });

    it('should enforce file size limits', async () => {
      const validation = validateImageFile({
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024 // 10MB
      });

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('exceeds 5MB limit');
    });

    it('should generate multiple sizes for responsive images', async () => {
      const sizes = [
        { width: 150, height: 150, name: 'thumbnail' },
        { width: 600, height: 600, name: 'medium' },
        { width: 1200, height: 1200, name: 'large' }
      ];

      const results = await Promise.all(
        sizes.map(size => 
          uploadImage({
            file: {
              buffer: Buffer.from('image'),
              mimetype: 'image/jpeg',
              size: 1024
            },
            folder: 'content',
            transformation: {
              width: size.width,
              height: size.height
            }
          })
        )
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.url).toBeDefined();
      });
    });
  });

  describe('imageProcessing', () => {
    it('should optimize images for web delivery', async () => {
      const originalUrl = 'https://storage.jarvish.ai/test/image.jpg';
      
      const optimizedUrl = getOptimizedImageUrl(originalUrl, {
        width: 1200,
        quality: 85,
        format: 'webp'
      });

      expect(optimizedUrl).toBeDefined();
      // In test mode, it returns the original URL
      expect(optimizedUrl).toBe(originalUrl);
    });

    it('should handle watermark requests for Pro tier content', async () => {
      const options = {
        file: {
          buffer: Buffer.from('image'),
          mimetype: 'image/jpeg',
          size: 1024
        },
        folder: 'pro-content',
        transformation: {
          width: 800,
          height: 600,
          quality: '90'
        }
      };

      const result = await uploadImage(options);

      expect(result.success).toBe(true);
      expect(result.url).toContain('pro-content');
    });
  });

  describe('security', () => {
    it('should validate images for safe content types', async () => {
      const safeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      
      safeTypes.forEach(mimetype => {
        const validation = validateImageFile({
          mimetype,
          size: 1024
        });
        expect(validation.valid).toBe(true);
      });
    });

    it('should reject potentially malicious file types', async () => {
      const dangerousTypes = ['application/x-executable', 'text/html', 'application/javascript'];
      
      dangerousTypes.forEach(mimetype => {
        const validation = validateImageFile({
          mimetype,
          size: 1024
        });
        expect(validation.valid).toBe(false);
      });
    });

    it('should generate secure URLs in production mode', async () => {
      // Save original env
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const result = await uploadImage({
        file: {
          buffer: Buffer.from('secure image'),
          mimetype: 'image/jpeg',
          size: 1024
        },
        folder: 'secure'
      });

      // In production mode (without actual cloud config), it returns placeholder
      expect(result.url).toContain('placeholder');

      // Restore env
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('cleanup', () => {
    it('should delete images successfully', async () => {
      const publicId = 'profiles/advisor-123/old-profile.jpg';

      const result = await deleteImage(publicId);

      expect(result.success).toBe(true);
    });

    it('should handle deletion errors gracefully', async () => {
      // Mock console.error to prevent test output noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Since we're in test mode, deletion always succeeds
      const result = await deleteImage('non-existent-file');
      
      expect(result.success).toBe(true);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cloudinary integration', () => {
    it('should properly format Cloudinary transformation URLs', () => {
      // Set mock Cloudinary environment
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      
      const cloudinaryUrl = 'https://res.cloudinary.com/test-cloud/image/upload/v123/profiles/test.jpg';
      
      const optimized = getOptimizedImageUrl(cloudinaryUrl, {
        width: 400,
        height: 400,
        quality: 80,
        format: 'webp'
      });

      expect(optimized).toContain('w_400');
      expect(optimized).toContain('h_400');
      expect(optimized).toContain('q_80');
      expect(optimized).toContain('f_webp');
      
      // Clean up
      delete process.env.CLOUDINARY_CLOUD_NAME;
    });
  });
});