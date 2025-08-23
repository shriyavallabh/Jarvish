import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';

// Generic validation middleware
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid request data',
          errors,
        });
      }
      next(error);
    }
  };
};

// Specific validation schemas
export const schemas = {
  // Auth schemas
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      companyName: z.string().optional(),
      arnNumber: z.string().optional(),
      phoneNumber: z.string().optional(),
      languagePrefs: z.array(z.string()).optional(),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  // Content schemas
  createContent: z.object({
    body: z.object({
      title: z.string().optional(),
      body: z.string().min(1, 'Content body is required'),
      contentType: z.enum(['WHATSAPP', 'STATUS', 'LINKEDIN', 'EMAIL', 'SMS', 'BLOG']),
      language: z.enum(['EN', 'HI', 'GU', 'MR', 'TA', 'TE', 'KN', 'ML', 'BN', 'PA']).default('EN'),
      topicFamily: z.string().optional(),
      scheduledFor: z.string().datetime().optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),

  updateContent: z.object({
    params: z.object({
      id: z.string().cuid('Invalid content ID'),
    }),
    body: z.object({
      title: z.string().optional(),
      body: z.string().optional(),
      contentType: z.enum(['WHATSAPP', 'STATUS', 'LINKEDIN', 'EMAIL', 'SMS', 'BLOG']).optional(),
      language: z.enum(['EN', 'HI', 'GU', 'MR', 'TA', 'TE', 'KN', 'ML', 'BN', 'PA']).optional(),
      topicFamily: z.string().optional(),
      scheduledFor: z.string().datetime().optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),

  // Compliance schemas
  submitForCompliance: z.object({
    params: z.object({
      contentId: z.string().cuid('Invalid content ID'),
    }),
    body: z.object({
      checkType: z.enum(['SEBI', 'NSE', 'BSE', 'AMFI', 'IRDAI', 'CUSTOM']).optional(),
    }),
  }),

  // WhatsApp schemas
  sendWhatsAppMessage: z.object({
    body: z.object({
      recipientPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
      recipientName: z.string().optional(),
      contentId: z.string().cuid().optional(),
      messageType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'TEMPLATE']).default('TEXT'),
      body: z.string().optional(),
      mediaUrl: z.string().url().optional(),
      templateName: z.string().optional(),
    }),
  }),

  // Subscription schemas
  updateSubscription: z.object({
    body: z.object({
      tier: z.enum(['BASIC', 'STANDARD', 'PRO', 'ENTERPRISE']),
      billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
    }),
  }),

  // Pagination schemas
  pagination: z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  }),

  // Search schemas
  search: z.object({
    query: z.object({
      q: z.string().min(1, 'Search query is required'),
      type: z.enum(['content', 'template', 'advisor']).optional(),
      language: z.string().optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }),
  }),

  // API Key schemas
  createApiKey: z.object({
    body: z.object({
      name: z.string().min(1, 'API key name is required'),
      permissions: z.array(z.string()).optional(),
      expiresAt: z.string().datetime().optional(),
    }),
  }),
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize strings in the request
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove any potential XSS attempts
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

// File upload validation
export const validateFileUpload = (
  allowedTypes: string[],
  maxSizeMB: number = 10
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a file',
      });
    }

    const files = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : [req.file];

    for (const file of files.filter(Boolean)) {
      // Check file type
      const fileType = file.mimetype || '';
      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }

      // Check file size
      const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
      if (file.size > maxSize) {
        return res.status(400).json({
          error: 'File too large',
          message: `File size exceeds ${maxSizeMB}MB limit`,
        });
      }
    }

    next();
  };
};

// Content length validation
export const validateContentLength = (maxLength: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = JSON.stringify(req.body).length;
    
    if (contentLength > maxLength) {
      return res.status(413).json({
        error: 'Content too large',
        message: `Request body exceeds maximum allowed size`,
      });
    }

    next();
  };
};

export default {
  validate,
  schemas,
  sanitizeInput,
  validateFileUpload,
  validateContentLength,
};