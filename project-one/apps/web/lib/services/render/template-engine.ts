import { ContentType, AspectRatio } from './image-generator';
import { supabase } from '@/lib/supabase/client';

// Template categories
export enum TemplateCategory {
  MARKET = 'market',
  EDUCATIONAL = 'educational',
  SEASONAL = 'seasonal',
  PROMOTIONAL = 'promotional',
  COMPLIANCE = 'compliance',
  CUSTOM = 'custom',
}

// Template metadata
export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  contentType: ContentType;
  aspectRatio: AspectRatio;
  language: 'en' | 'hi' | 'mr';
  tier: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
  tags: string[];
  description?: string;
  thumbnail?: string;
  usageCount: number;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  layout: TemplateLayout;
  styles: TemplateStyles;
  elements: TemplateElement[];
  dataBindings?: DataBinding[];
}

// Template layout configuration
export interface TemplateLayout {
  type: 'grid' | 'flex' | 'absolute';
  columns?: number;
  rows?: number;
  padding: number;
  spacing: number;
  alignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'middle' | 'bottom';
}

// Template styling
export interface TemplateStyles {
  background: {
    type: 'solid' | 'gradient' | 'image' | 'pattern';
    value: string | any;
    opacity?: number;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
    caption: string;
  };
  shadows: boolean;
  borderRadius: number;
}

// Template element types
export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart' | 'icon' | 'qrcode';
  position: {
    x: number | string;
    y: number | string;
    width: number | string;
    height: number | string;
  };
  content?: any;
  styles?: any;
  animation?: AnimationConfig;
  conditional?: ConditionalConfig;
}

// Animation configuration
export interface AnimationConfig {
  type: 'fade' | 'slide' | 'zoom' | 'rotate';
  duration: number;
  delay?: number;
  easing?: string;
}

// Conditional display configuration
export interface ConditionalConfig {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
  value: any;
}

// Data binding for dynamic content
export interface DataBinding {
  elementId: string;
  field: string;
  format?: string;
  fallback?: any;
}

// Template render context
export interface RenderContext {
  data: Record<string, any>;
  language: 'en' | 'hi' | 'mr';
  branding?: any;
  variables?: Record<string, any>;
}

export class TemplateEngine {
  private templateCache: Map<string, Template> = new Map();
  private compiledTemplates: Map<string, Function> = new Map();

  // Get built-in templates
  async getBuiltInTemplates(): Promise<Template[]> {
    return [
      // Market Update Template
      {
        id: 'market-update-1',
        name: 'Daily Market Update',
        category: TemplateCategory.MARKET,
        contentType: ContentType.MARKET_UPDATE,
        aspectRatio: AspectRatio.WHATSAPP,
        language: 'en',
        tier: 'FREE',
        tags: ['market', 'daily', 'stocks', 'nifty', 'sensex'],
        description: 'Professional market update template with indices and key metrics',
        usageCount: 0,
        rating: 4.5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        layout: {
          type: 'grid',
          columns: 2,
          rows: 3,
          padding: 40,
          spacing: 20,
          alignment: 'center',
          verticalAlignment: 'top',
        },
        styles: {
          background: {
            type: 'gradient',
            value: {
              type: 'linear',
              angle: 135,
              colors: ['#1e3c72', '#2a5298'],
            },
          },
          colors: {
            primary: '#1e3c72',
            secondary: '#2a5298',
            text: '#ffffff',
            accent: '#4fc3f7',
          },
          fonts: {
            heading: 'Montserrat',
            body: 'Inter',
            caption: 'Inter',
          },
          shadows: true,
          borderRadius: 10,
        },
        elements: [
          {
            id: 'title',
            type: 'text',
            position: { x: '5%', y: '5%', width: '90%', height: '10%' },
            content: '{{title}}',
            styles: {
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff',
            },
          },
          {
            id: 'date',
            type: 'text',
            position: { x: '5%', y: '15%', width: '90%', height: '5%' },
            content: '{{date}}',
            styles: {
              fontSize: '24px',
              textAlign: 'center',
              color: '#b3d4fc',
            },
          },
          {
            id: 'nifty-box',
            type: 'shape',
            position: { x: '10%', y: '25%', width: '35%', height: '20%' },
            content: {
              type: 'rectangle',
              fill: 'rgba(255, 255, 255, 0.1)',
              stroke: '#4fc3f7',
              strokeWidth: 2,
            },
          },
          {
            id: 'sensex-box',
            type: 'shape',
            position: { x: '55%', y: '25%', width: '35%', height: '20%' },
            content: {
              type: 'rectangle',
              fill: 'rgba(255, 255, 255, 0.1)',
              stroke: '#4fc3f7',
              strokeWidth: 2,
            },
          },
        ],
        dataBindings: [
          { elementId: 'title', field: 'title', fallback: 'Market Update' },
          { elementId: 'date', field: 'date', format: 'DD MMM YYYY' },
        ],
      },

      // Investment Tip Template
      {
        id: 'investment-tip-1',
        name: 'Weekly Investment Tip',
        category: TemplateCategory.EDUCATIONAL,
        contentType: ContentType.INVESTMENT_TIP,
        aspectRatio: AspectRatio.SQUARE,
        language: 'en',
        tier: 'FREE',
        tags: ['investment', 'tips', 'education', 'wealth'],
        description: 'Clean and modern investment tip template',
        usageCount: 0,
        rating: 4.7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        layout: {
          type: 'flex',
          padding: 50,
          spacing: 30,
          alignment: 'center',
          verticalAlignment: 'middle',
        },
        styles: {
          background: {
            type: 'solid',
            value: '#f8f9fa',
          },
          colors: {
            primary: '#2c3e50',
            secondary: '#34495e',
            text: '#2c3e50',
            accent: '#3498db',
          },
          fonts: {
            heading: 'Playfair Display',
            body: 'Source Sans Pro',
            caption: 'Source Sans Pro',
          },
          shadows: false,
          borderRadius: 0,
        },
        elements: [
          {
            id: 'icon',
            type: 'icon',
            position: { x: '45%', y: '10%', width: '10%', height: '10%' },
            content: {
              name: 'lightbulb',
              color: '#f39c12',
            },
          },
          {
            id: 'tip-title',
            type: 'text',
            position: { x: '10%', y: '25%', width: '80%', height: '15%' },
            content: '{{tipTitle}}',
            styles: {
              fontSize: '36px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#2c3e50',
            },
          },
          {
            id: 'tip-content',
            type: 'text',
            position: { x: '10%', y: '45%', width: '80%', height: '30%' },
            content: '{{tipContent}}',
            styles: {
              fontSize: '20px',
              textAlign: 'center',
              lineHeight: '1.6',
              color: '#34495e',
            },
          },
        ],
        dataBindings: [
          { elementId: 'tip-title', field: 'tipTitle' },
          { elementId: 'tip-content', field: 'tipContent' },
        ],
      },

      // Festive Greeting Template
      {
        id: 'festive-greeting-1',
        name: 'Festival Wishes',
        category: TemplateCategory.SEASONAL,
        contentType: ContentType.FESTIVE_GREETING,
        aspectRatio: AspectRatio.SQUARE,
        language: 'en',
        tier: 'BASIC',
        tags: ['festival', 'greeting', 'wishes', 'seasonal'],
        description: 'Colorful festive greeting template',
        usageCount: 0,
        rating: 4.8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        layout: {
          type: 'absolute',
          padding: 30,
          spacing: 0,
          alignment: 'center',
          verticalAlignment: 'middle',
        },
        styles: {
          background: {
            type: 'pattern',
            value: 'festive-pattern',
          },
          colors: {
            primary: '#ff6b6b',
            secondary: '#ffd93d',
            text: '#ffffff',
            accent: '#6bcf7f',
          },
          fonts: {
            heading: 'Dancing Script',
            body: 'Open Sans',
            caption: 'Open Sans',
          },
          shadows: true,
          borderRadius: 20,
        },
        elements: [
          {
            id: 'greeting',
            type: 'text',
            position: { x: '10%', y: '30%', width: '80%', height: '20%' },
            content: '{{greeting}}',
            styles: {
              fontSize: '52px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            },
            animation: {
              type: 'fade',
              duration: 1000,
              delay: 0,
            },
          },
          {
            id: 'message',
            type: 'text',
            position: { x: '10%', y: '55%', width: '80%', height: '25%' },
            content: '{{message}}',
            styles: {
              fontSize: '24px',
              textAlign: 'center',
              lineHeight: '1.5',
              color: '#ffffff',
            },
            animation: {
              type: 'slide',
              duration: 1000,
              delay: 500,
            },
          },
        ],
        dataBindings: [
          { elementId: 'greeting', field: 'greeting' },
          { elementId: 'message', field: 'message' },
        ],
      },
    ];
  }

  // Load template from database
  async loadTemplate(templateId: string): Promise<Template | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('content_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !data) {
      // Try built-in templates
      const builtIn = await this.getBuiltInTemplates();
      const template = builtIn.find(t => t.id === templateId);
      if (template) {
        this.templateCache.set(templateId, template);
        return template;
      }
      return null;
    }

    const template = this.parseTemplateData(data);
    this.templateCache.set(templateId, template);
    return template;
  }

  // Parse template data from database
  private parseTemplateData(data: any): Template {
    return {
      id: data.id,
      name: data.title,
      category: data.template_type as TemplateCategory,
      contentType: ContentType.MARKET_UPDATE, // Default
      aspectRatio: AspectRatio.WHATSAPP,
      language: data.language,
      tier: 'FREE',
      tags: data.metadata?.tags || [],
      description: data.metadata?.description,
      thumbnail: data.metadata?.thumbnail,
      usageCount: data.times_used || 0,
      rating: data.metadata?.rating,
      isActive: true,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      layout: data.metadata?.layout || this.getDefaultLayout(),
      styles: data.metadata?.styles || this.getDefaultStyles(),
      elements: data.metadata?.elements || [],
      dataBindings: data.metadata?.dataBindings || [],
    };
  }

  // Get default layout
  private getDefaultLayout(): TemplateLayout {
    return {
      type: 'flex',
      padding: 40,
      spacing: 20,
      alignment: 'center',
      verticalAlignment: 'top',
    };
  }

  // Get default styles
  private getDefaultStyles(): TemplateStyles {
    return {
      background: {
        type: 'solid',
        value: '#ffffff',
      },
      colors: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        text: '#1f2937',
        accent: '#10b981',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        caption: 'Inter',
      },
      shadows: false,
      borderRadius: 0,
    };
  }

  // Search templates
  async searchTemplates(
    query: string,
    filters?: {
      category?: TemplateCategory;
      contentType?: ContentType;
      language?: string;
      tier?: string;
    }
  ): Promise<Template[]> {
    const builtIn = await this.getBuiltInTemplates();
    
    let results = builtIn.filter(template => {
      // Text search
      const searchText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
      if (!searchText.includes(query.toLowerCase())) {
        return false;
      }

      // Apply filters
      if (filters?.category && template.category !== filters.category) {
        return false;
      }
      if (filters?.contentType && template.contentType !== filters.contentType) {
        return false;
      }
      if (filters?.language && template.language !== filters.language) {
        return false;
      }
      if (filters?.tier && template.tier !== filters.tier) {
        return false;
      }

      return true;
    });

    // Sort by relevance and rating
    results.sort((a, b) => {
      const aScore = (a.rating || 0) * 10 + a.usageCount;
      const bScore = (b.rating || 0) * 10 + b.usageCount;
      return bScore - aScore;
    });

    return results;
  }

  // Get templates by category
  async getTemplatesByCategory(category: TemplateCategory): Promise<Template[]> {
    const builtIn = await this.getBuiltInTemplates();
    return builtIn.filter(t => t.category === category);
  }

  // Get recommended templates for advisor
  async getRecommendedTemplates(
    advisorId: string,
    limit: number = 10
  ): Promise<Template[]> {
    // Get advisor preferences and history
    const { data: advisor } = await supabase
      .from('advisors')
      .select('subscription_tier, primary_language, content_types')
      .eq('id', advisorId)
      .single();

    if (!advisor) {
      return [];
    }

    const builtIn = await this.getBuiltInTemplates();
    
    // Filter by tier and language
    const eligible = builtIn.filter(t => {
      const tierOrder = ['FREE', 'BASIC', 'STANDARD', 'PRO'];
      const advisorTierIndex = tierOrder.indexOf(advisor.subscription_tier);
      const templateTierIndex = tierOrder.indexOf(t.tier);
      
      return templateTierIndex <= advisorTierIndex &&
             (t.language === advisor.primary_language || t.language === 'en');
    });

    // Sort by relevance
    eligible.sort((a, b) => {
      // Prioritize matching content types
      const aRelevance = advisor.content_types.includes(a.contentType) ? 100 : 0;
      const bRelevance = advisor.content_types.includes(b.contentType) ? 100 : 0;
      
      // Then by rating and usage
      const aScore = aRelevance + (a.rating || 0) * 10 + a.usageCount;
      const bScore = bRelevance + (b.rating || 0) * 10 + b.usageCount;
      
      return bScore - aScore;
    });

    return eligible.slice(0, limit);
  }

  // Save custom template
  async saveCustomTemplate(
    advisorId: string,
    template: Partial<Template>
  ): Promise<string> {
    const { data, error } = await supabase
      .from('content_templates')
      .insert({
        advisor_id: advisorId,
        template_type: 'custom',
        title: template.name,
        content: JSON.stringify(template.elements),
        language: template.language || 'en',
        ai_generated: false,
        compliance_status: 'PENDING',
        times_used: 0,
        is_favorite: false,
        metadata: {
          ...template,
          category: template.category,
          aspectRatio: template.aspectRatio,
          layout: template.layout,
          styles: template.styles,
          dataBindings: template.dataBindings,
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save template: ${error.message}`);
    }

    return data.id;
  }

  // Clone template
  async cloneTemplate(
    templateId: string,
    advisorId: string,
    modifications?: Partial<Template>
  ): Promise<string> {
    const original = await this.loadTemplate(templateId);
    if (!original) {
      throw new Error('Template not found');
    }

    const cloned = {
      ...original,
      ...modifications,
      id: undefined, // Remove ID to create new
      name: modifications?.name || `${original.name} (Copy)`,
    };

    return this.saveCustomTemplate(advisorId, cloned);
  }

  // Update template usage statistics
  async trackTemplateUsage(templateId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_template_usage', {
      template_id: templateId,
    });

    if (error) {
      console.error('Failed to track template usage:', error);
    }
  }

  // Clear template cache
  clearCache(templateId?: string) {
    if (templateId) {
      this.templateCache.delete(templateId);
      this.compiledTemplates.delete(templateId);
    } else {
      this.templateCache.clear();
      this.compiledTemplates.clear();
    }
  }
}

export default TemplateEngine;