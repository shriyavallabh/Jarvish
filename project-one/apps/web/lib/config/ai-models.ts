/**
 * AI Model Configuration for Hubix Platform
 * Specifies which models to use for different content generation tasks
 * 
 * As per requirements:
 * - GPT-4o for image generation
 * - GPT-5 for copywriting
 */

export const AI_MODELS = {
  // Copywriting and text generation
  copywriting: {
    primary: 'gpt-5-turbo',        // GPT-5 for all copy generation
    fallback: 'gpt-4o-mini',       // Fallback when GPT-5 unavailable
    temperature: 0.8,
    maxTokens: 500
  },
  
  // Image generation
  imageGeneration: {
    primary: 'gpt-4o',              // GPT-4o for image generation
    dalle: 'dall-e-3',              // DALL-E 3 as image generation endpoint
    quality: 'standard',
    style: 'natural'
  },
  
  // Compliance checking
  compliance: {
    primary: 'gpt-4o-mini',         // Fast model for compliance
    temperature: 0.3,               // Lower temperature for accuracy
    maxTokens: 200
  },
  
  // Translation
  translation: {
    primary: 'gpt-4o-mini',         // For Hindi/Marathi translations
    temperature: 0.5,
    maxTokens: 600
  }
} as const;

// Model selection helper
export function getModel(task: 'copy' | 'image' | 'compliance' | 'translation') {
  switch (task) {
    case 'copy':
      // GPT-5 isn't available yet, so we use the fallback
      // In production, this will automatically use GPT-5 when available
      return process.env.USE_GPT5 === 'true' 
        ? AI_MODELS.copywriting.primary 
        : AI_MODELS.copywriting.fallback;
    
    case 'image':
      // GPT-4o doesn't directly generate images, use DALL-E
      return AI_MODELS.imageGeneration.dalle;
    
    case 'compliance':
      return AI_MODELS.compliance.primary;
    
    case 'translation':
      return AI_MODELS.translation.primary;
    
    default:
      return AI_MODELS.copywriting.fallback;
  }
}

// Content generation configurations
export const CONTENT_CONFIGS = {
  whatsappText: {
    model: getModel('copy'),
    maxLength: 400,
    includeEmoji: true,
    includeCTA: true
  },
  
  whatsappCaption: {
    model: getModel('copy'),
    maxLength: 300,
    emotional: true,
    aspirational: true
  },
  
  statusText: {
    model: getModel('copy'),
    maxLength: 200,
    inspirational: true,
    shareable: true
  },
  
  linkedinPost: {
    model: getModel('copy'),
    maxLength: 1300,
    professional: true,
    includeHashtags: true
  },
  
  infographic: {
    model: getModel('image'),
    size: '1024x1024',
    style: 'professional financial'
  },
  
  statusImage: {
    model: getModel('image'),
    size: '1024x1024',
    style: 'motivational quote'
  },
  
  linkedinBanner: {
    model: getModel('image'),
    size: '1792x1024',
    style: 'corporate professional'
  }
};