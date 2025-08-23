import { z } from 'zod';

// Content type enum
export const contentTypeSchema = z.enum([
  'market_update',
  'educational',
  'promotional',
  'news',
]);

// Language enum
export const languageSchema = z.enum(['en', 'hi', 'mr']);

// Content status enum
export const contentStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'published',
]);

// Content creation validation
export const createContentSchema = z.object({
  type: contentTypeSchema,
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  body: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(2000, 'Content must be less than 2000 characters'),
  language: languageSchema,
  targetAudience: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
});

// Content update validation
export const updateContentSchema = createContentSchema.partial();

// Compliance check validation
export const complianceCheckSchema = z.object({
  text: z
    .string()
    .min(10, 'Text must be at least 10 characters')
    .max(2000, 'Text must be less than 2000 characters'),
  type: contentTypeSchema,
  language: languageSchema,
});

// Content filter validation
export const contentFilterSchema = z.object({
  type: contentTypeSchema.optional(),
  status: contentStatusSchema.optional(),
  language: languageSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});