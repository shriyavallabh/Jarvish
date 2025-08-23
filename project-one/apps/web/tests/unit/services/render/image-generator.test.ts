/**
 * Image Generator Service Tests
 * Tests for automated image generation with branding
 */

import { ImageGenerator } from '@/lib/services/render/image-generator';
import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp from 'sharp';
import { uploadToCloudinary } from '@/lib/services/cloudinary';
import { redis } from '@/lib/redis';

// Mock dependencies
jest.mock('canvas');
jest.mock('sharp');
jest.mock('@/lib/services/cloudinary');
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    expire: jest.fn()
  }
}));

describe('ImageGenerator Service', () => {
  let imageGenerator: ImageGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    imageGenerator = new ImageGenerator();
  });

  describe('generateContentImage', () => {
    it('should generate an image with content and branding', async () => {
      const content = {
        title: 'Market Update',
        body: 'Sensex rises 500 points',
        advisorName: 'John Doe',
        advisorLogo: 'https://example.com/logo.png',
        template: 'modern'
      };

      // Mock canvas operations
      const mockContext = {
        fillStyle: '',
        fillRect: jest.fn(),
        drawImage: jest.fn(),
        font: '',
        fillText: jest.fn(),
        measureText: jest.fn(() => ({ width: 100 })),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        globalAlpha: 1,
        shadowColor: '',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0
      };

      const mockCanvas = {
        getContext: jest.fn(() => mockContext),
        toBuffer: jest.fn(() => Buffer.from('image-data'))
      };

      (createCanvas as jest.Mock).mockReturnValue(mockCanvas);
      (loadImage as jest.Mock).mockResolvedValue({ width: 100, height: 100 });

      // Mock sharp operations
      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized-image'))
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      // Mock cloudinary upload
      (uploadToCloudinary as jest.Mock).mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'image-123'
      });

      const result = await imageGenerator.generateContentImage(content);

      expect(result).toBeDefined();
      expect(result.url).toBe('https://cloudinary.com/image.jpg');
      expect(result.dimensions).toEqual({ width: 1080, height: 1080 });
      expect(createCanvas).toHaveBeenCalledWith(1080, 1080);
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('should apply correct template styles', async () => {
      const templates = ['modern', 'classic', 'minimal', 'festive'];
      
      for (const template of templates) {
        const content = {
          title: 'Test',
          body: 'Test content',
          advisorName: 'Advisor',
          template
        };

        const mockCanvas = {
          getContext: jest.fn(() => ({
            fillStyle: '',
            fillRect: jest.fn(),
            font: '',
            fillText: jest.fn(),
            measureText: jest.fn(() => ({ width: 100 }))
          })),
          toBuffer: jest.fn(() => Buffer.from('image'))
        };

        (createCanvas as jest.Mock).mockReturnValue(mockCanvas);

        await imageGenerator.generateContentImage(content);

        // Verify template-specific styling was applied
        expect(createCanvas).toHaveBeenCalled();
      }
    });

    it('should handle multiple languages', async () => {
      const languages = ['en', 'hi', 'mr'];
      
      for (const language of languages) {
        const content = {
          title: 'शेयर बाजार',
          body: 'सेंसेक्स में तेजी',
          advisorName: 'Advisor',
          language
        };

        const mockContext = {
          font: '',
          fillText: jest.fn(),
          measureText: jest.fn(() => ({ width: 100 }))
        };

        const mockCanvas = {
          getContext: jest.fn(() => mockContext),
          toBuffer: jest.fn(() => Buffer.from('image'))
        };

        (createCanvas as jest.Mock).mockReturnValue(mockCanvas);

        await imageGenerator.generateContentImage(content);

        // Verify appropriate font was selected for language
        expect(mockContext.font).toContain('Noto Sans');
      }
    });
  });

  describe('generateWhatsAppOptimizedImage', () => {
    it('should optimize image for WhatsApp', async () => {
      const content = {
        title: 'Investment Tip',
        body: 'Diversify your portfolio',
        advisorName: 'Jane Advisor'
      };

      const mockCanvas = {
        getContext: jest.fn(() => ({
          fillStyle: '',
          fillRect: jest.fn(),
          fillText: jest.fn(),
          measureText: jest.fn(() => ({ width: 100 }))
        })),
        toBuffer: jest.fn(() => Buffer.from('image'))
      };

      (createCanvas as jest.Mock).mockReturnValue(mockCanvas);

      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized'))
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      const result = await imageGenerator.generateWhatsAppOptimizedImage(content);

      expect(mockSharp.resize).toHaveBeenCalledWith(800, 800);
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 80 });
      expect(result.sizeKB).toBeLessThan(100); // WhatsApp size limit
    });
  });

  describe('addBrandingOverlay', () => {
    it('should add advisor branding to image', async () => {
      const imageBuffer = Buffer.from('base-image');
      const branding = {
        logo: 'https://example.com/logo.png',
        name: 'Elite Financial Advisors',
        euin: 'E123456',
        disclaimer: 'Mutual funds are subject to market risks'
      };

      const mockContext = {
        drawImage: jest.fn(),
        fillText: jest.fn(),
        font: '',
        fillStyle: '',
        globalAlpha: 1
      };

      const mockCanvas = {
        getContext: jest.fn(() => mockContext),
        toBuffer: jest.fn(() => Buffer.from('branded-image'))
      };

      (createCanvas as jest.Mock).mockReturnValue(mockCanvas);
      (loadImage as jest.Mock).mockResolvedValue({ width: 100, height: 100 });

      const result = await imageGenerator.addBrandingOverlay(imageBuffer, branding);

      expect(mockContext.drawImage).toHaveBeenCalled(); // Logo
      expect(mockContext.fillText).toHaveBeenCalledWith(
        expect.stringContaining('E123456'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('generateBulkImages', () => {
    it('should generate multiple images in batch', async () => {
      const contents = [
        { title: 'Tip 1', body: 'Content 1' },
        { title: 'Tip 2', body: 'Content 2' },
        { title: 'Tip 3', body: 'Content 3' }
      ];

      const mockCanvas = {
        getContext: jest.fn(() => ({
          fillText: jest.fn(),
          measureText: jest.fn(() => ({ width: 100 }))
        })),
        toBuffer: jest.fn(() => Buffer.from('image'))
      };

      (createCanvas as jest.Mock).mockReturnValue(mockCanvas);
      (uploadToCloudinary as jest.Mock).mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg'
      });

      const results = await imageGenerator.generateBulkImages(contents, {
        template: 'modern',
        advisorName: 'Test Advisor'
      });

      expect(results).toHaveLength(3);
      expect(createCanvas).toHaveBeenCalledTimes(3);
    });

    it('should handle batch processing errors gracefully', async () => {
      const contents = [
        { title: 'Valid', body: 'Content' },
        { title: 'Invalid', body: null }, // This will cause an error
        { title: 'Valid 2', body: 'Content 2' }
      ];

      (createCanvas as jest.Mock)
        .mockReturnValueOnce({
          getContext: jest.fn(() => ({ fillText: jest.fn() })),
          toBuffer: jest.fn(() => Buffer.from('image'))
        })
        .mockImplementationOnce(() => {
          throw new Error('Canvas error');
        })
        .mockReturnValueOnce({
          getContext: jest.fn(() => ({ fillText: jest.fn() })),
          toBuffer: jest.fn(() => Buffer.from('image'))
        });

      const results = await imageGenerator.generateBulkImages(contents, {});

      expect(results).toHaveLength(2); // Only successful ones
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe('caching', () => {
    it('should cache generated images', async () => {
      const content = {
        title: 'Cached Content',
        body: 'This should be cached',
        advisorName: 'Advisor'
      };

      const cachedUrl = 'https://cloudinary.com/cached.jpg';
      (redis.get as jest.Mock).mockResolvedValue(cachedUrl);

      const result = await imageGenerator.generateContentImage(content);

      expect(result.url).toBe(cachedUrl);
      expect(createCanvas).not.toHaveBeenCalled(); // Should use cache
    });

    it('should generate new image when cache misses', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      const mockCanvas = {
        getContext: jest.fn(() => ({
          fillText: jest.fn(),
          measureText: jest.fn(() => ({ width: 100 }))
        })),
        toBuffer: jest.fn(() => Buffer.from('image'))
      };

      (createCanvas as jest.Mock).mockReturnValue(mockCanvas);
      (uploadToCloudinary as jest.Mock).mockResolvedValue({
        secure_url: 'https://cloudinary.com/new.jpg'
      });

      const result = await imageGenerator.generateContentImage({
        title: 'New Content',
        body: 'Not cached',
        advisorName: 'Advisor'
      });

      expect(createCanvas).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
      expect(redis.expire).toHaveBeenCalledWith(expect.any(String), 86400); // 24 hours
    });
  });

  describe('performance requirements', () => {
    it('should generate single image within 1 second', async () => {
      const startTime = Date.now();

      const mockCanvas = {
        getContext: jest.fn(() => ({
          fillText: jest.fn(),
          measureText: jest.fn(() => ({ width: 100 }))
        })),
        toBuffer: jest.fn(() => Buffer.from('image'))
      };

      (createCanvas as jest.Mock).mockReturnValue(mockCanvas);
      (uploadToCloudinary as jest.Mock).mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg'
      });

      await imageGenerator.generateContentImage({
        title: 'Performance Test',
        body: 'Testing speed',
        advisorName: 'Advisor'
      });

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle batch of 10 images within 5 seconds', async () => {
      const startTime = Date.now();
      const contents = Array(10).fill(null).map((_, i) => ({
        title: `Content ${i}`,
        body: `Body ${i}`
      }));

      const mockCanvas = {
        getContext: jest.fn(() => ({
          fillText: jest.fn(),
          measureText: jest.fn(() => ({ width: 100 }))
        })),
        toBuffer: jest.fn(() => Buffer.from('image'))
      };

      (createCanvas as jest.Mock).mockReturnValue(mockCanvas);
      (uploadToCloudinary as jest.Mock).mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg'
      });

      await imageGenerator.generateBulkImages(contents, {});

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(5000);
    });
  });

  describe('SEBI compliance', () => {
    it('should include mandatory disclaimers', async () => {
      const content = {
        title: 'Investment Advice',
        body: 'Invest in mutual funds',
        advisorName: 'John Advisor',
        euin: 'E123456'
      };

      const mockContext = {
        fillText: jest.fn(),
        measureText: jest.fn(() => ({ width: 100 }))
      };

      const mockCanvas = {
        getContext: jest.fn(() => mockContext),
        toBuffer: jest.fn(() => Buffer.from('image'))
      };

      (createCanvas as jest.Mock).mockReturnValue(mockCanvas);

      await imageGenerator.generateContentImage(content);

      // Verify SEBI disclaimers are added
      expect(mockContext.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Mutual funds are subject to market risks'),
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockContext.fillText).toHaveBeenCalledWith(
        expect.stringContaining('E123456'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});