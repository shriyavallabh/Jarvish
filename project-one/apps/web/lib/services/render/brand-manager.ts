import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/client';

type SubscriptionTier = Database['public']['Tables']['advisors']['Row']['subscription_tier'];

// Brand configuration by subscription tier
export interface TierBrandingFeatures {
  customLogo: boolean;
  customColors: boolean;
  customFonts: boolean;
  watermarkRemoval: boolean;
  customTemplates: boolean;
  advancedLayouts: boolean;
  animatedContent: boolean;
  videoGeneration: boolean;
}

// Brand asset types
export interface BrandAssets {
  logo?: {
    url: string;
    width: number;
    height: number;
    format: string;
  };
  favicon?: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: {
      heading: number;
      subheading: number;
      body: number;
      caption: number;
    };
  };
  watermark?: {
    text: string;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
}

// Advisor brand profile
export interface AdvisorBrand {
  advisorId: string;
  subscriptionTier: SubscriptionTier;
  brandName: string;
  tagline?: string;
  assets: BrandAssets;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  complianceInfo: {
    arnNumber?: string;
    euinNumber?: string;
    sebiRegistration?: string;
    disclaimer: string;
    riskDisclosure?: string;
  };
  preferences: {
    autoWatermark: boolean;
    includeContact: boolean;
    includeCompliance: boolean;
    defaultLanguage: 'en' | 'hi' | 'mr';
    templateStyle: 'modern' | 'classic' | 'minimal' | 'bold';
  };
  createdAt: Date;
  updatedAt: Date;
}

export class BrandManager {
  private brandCache: Map<string, AdvisorBrand> = new Map();
  private assetCache: Map<string, any> = new Map();

  // Get tier-specific branding features
  getTierFeatures(tier: SubscriptionTier): TierBrandingFeatures {
    switch (tier) {
      case 'FREE':
        return {
          customLogo: false,
          customColors: false,
          customFonts: false,
          watermarkRemoval: false,
          customTemplates: false,
          advancedLayouts: false,
          animatedContent: false,
          videoGeneration: false,
        };
      
      case 'BASIC':
        return {
          customLogo: true,
          customColors: false,
          customFonts: false,
          watermarkRemoval: false,
          customTemplates: false,
          advancedLayouts: false,
          animatedContent: false,
          videoGeneration: false,
        };
      
      case 'STANDARD':
        return {
          customLogo: true,
          customColors: true,
          customFonts: false,
          watermarkRemoval: true,
          customTemplates: true,
          advancedLayouts: false,
          animatedContent: false,
          videoGeneration: false,
        };
      
      case 'PRO':
        return {
          customLogo: true,
          customColors: true,
          customFonts: true,
          watermarkRemoval: true,
          customTemplates: true,
          advancedLayouts: true,
          animatedContent: true,
          videoGeneration: true,
        };
      
      default:
        return this.getTierFeatures('FREE');
    }
  }

  // Get default brand colors by tier
  getDefaultColors(tier: SubscriptionTier): BrandAssets['colorPalette'] {
    const defaultColors = {
      FREE: {
        primary: '#2563EB',     // Blue
        secondary: '#7C3AED',   // Purple
        accent: '#10B981',      // Green
        text: '#1F2937',        // Dark Gray
        background: '#FFFFFF',  // White
      },
      BASIC: {
        primary: '#3B82F6',     // Lighter Blue
        secondary: '#8B5CF6',   // Lighter Purple
        accent: '#14B8A6',      // Teal
        text: '#111827',        // Black
        background: '#F9FAFB',  // Light Gray
      },
      STANDARD: {
        primary: '#1E40AF',     // Dark Blue
        secondary: '#6D28D9',   // Dark Purple
        accent: '#059669',      // Dark Green
        text: '#0F172A',        // Slate
        background: '#F8FAFC',  // Off White
      },
      PRO: {
        primary: '#1E3A8A',     // Navy
        secondary: '#581C87',   // Deep Purple
        accent: '#14532D',      // Forest Green
        text: '#020617',        // Near Black
        background: '#FAFAFA',  // Pure White
      },
    };

    return defaultColors[tier] || defaultColors.FREE;
  }

  // Get default fonts by tier
  getDefaultFonts(tier: SubscriptionTier): BrandAssets['typography'] {
    const defaultFonts = {
      FREE: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        fontSize: {
          heading: 32,
          subheading: 24,
          body: 16,
          caption: 12,
        },
      },
      BASIC: {
        headingFont: 'Montserrat',
        bodyFont: 'Inter',
        fontSize: {
          heading: 36,
          subheading: 26,
          body: 16,
          caption: 12,
        },
      },
      STANDARD: {
        headingFont: 'Playfair Display',
        bodyFont: 'Source Sans Pro',
        fontSize: {
          heading: 40,
          subheading: 28,
          body: 18,
          caption: 14,
        },
      },
      PRO: {
        headingFont: 'Custom',
        bodyFont: 'Custom',
        fontSize: {
          heading: 48,
          subheading: 32,
          body: 20,
          caption: 14,
        },
      },
    };

    return defaultFonts[tier] || defaultFonts.FREE;
  }

  // Load advisor brand from database
  async loadAdvisorBrand(advisorId: string): Promise<AdvisorBrand> {
    // Check cache first
    if (this.brandCache.has(advisorId)) {
      return this.brandCache.get(advisorId)!;
    }

    // Fetch from database
    const { data: advisor, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('id', advisorId)
      .single();

    if (error || !advisor) {
      throw new Error('Advisor not found');
    }

    // Fetch brand assets from storage
    const { data: brandData } = await supabase
      .from('advisor_brands')
      .select('*')
      .eq('advisor_id', advisorId)
      .single();

    // Build brand profile
    const brand: AdvisorBrand = {
      advisorId,
      subscriptionTier: advisor.subscription_tier,
      brandName: advisor.firm_name || advisor.full_name,
      tagline: brandData?.tagline,
      assets: {
        logo: brandData?.logo_url ? {
          url: brandData.logo_url,
          width: brandData.logo_width || 200,
          height: brandData.logo_height || 200,
          format: brandData.logo_format || 'png',
        } : undefined,
        colorPalette: brandData?.color_palette || this.getDefaultColors(advisor.subscription_tier),
        typography: brandData?.typography || this.getDefaultFonts(advisor.subscription_tier),
        watermark: brandData?.watermark,
      },
      socialLinks: brandData?.social_links,
      complianceInfo: {
        arnNumber: advisor.arn_number,
        euinNumber: advisor.euin_number,
        sebiRegistration: advisor.sebi_registration,
        disclaimer: brandData?.disclaimer || this.getDefaultDisclaimer(),
        riskDisclosure: brandData?.risk_disclosure,
      },
      preferences: {
        autoWatermark: brandData?.auto_watermark ?? true,
        includeContact: brandData?.include_contact ?? true,
        includeCompliance: brandData?.include_compliance ?? true,
        defaultLanguage: advisor.primary_language,
        templateStyle: brandData?.template_style || 'modern',
      },
      createdAt: new Date(brandData?.created_at || advisor.created_at),
      updatedAt: new Date(brandData?.updated_at || advisor.updated_at),
    };

    // Cache the brand
    this.brandCache.set(advisorId, brand);

    return brand;
  }

  // Save advisor brand to database
  async saveAdvisorBrand(brand: Partial<AdvisorBrand> & { advisorId: string }): Promise<void> {
    const { error } = await supabase
      .from('advisor_brands')
      .upsert({
        advisor_id: brand.advisorId,
        tagline: brand.tagline,
        logo_url: brand.assets?.logo?.url,
        logo_width: brand.assets?.logo?.width,
        logo_height: brand.assets?.logo?.height,
        logo_format: brand.assets?.logo?.format,
        color_palette: brand.assets?.colorPalette,
        typography: brand.assets?.typography,
        watermark: brand.assets?.watermark,
        social_links: brand.socialLinks,
        disclaimer: brand.complianceInfo?.disclaimer,
        risk_disclosure: brand.complianceInfo?.riskDisclosure,
        auto_watermark: brand.preferences?.autoWatermark,
        include_contact: brand.preferences?.includeContact,
        include_compliance: brand.preferences?.includeCompliance,
        template_style: brand.preferences?.templateStyle,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to save brand: ${error.message}`);
    }

    // Clear cache
    this.brandCache.delete(brand.advisorId);
  }

  // Upload brand logo
  async uploadLogo(
    advisorId: string,
    file: File
  ): Promise<{ url: string; width: number; height: number }> {
    const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `advisors/${advisorId}/brand/${fileName}`;

    const { data, error } = await supabase.storage
      .from('brand-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload logo: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(data.path);

    // Get image dimensions
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    return new Promise((resolve) => {
      img.onload = () => {
        resolve({
          url: urlData.publicUrl,
          width: img.width,
          height: img.height,
        });
      };
    });
  }

  // Validate brand assets
  validateBrandAssets(brand: AdvisorBrand): string[] {
    const errors: string[] = [];
    const features = this.getTierFeatures(brand.subscriptionTier);

    // Check logo
    if (brand.assets.logo && !features.customLogo) {
      errors.push('Custom logo not available in your subscription tier');
    }

    // Check colors
    if (this.hasCustomColors(brand) && !features.customColors) {
      errors.push('Custom colors not available in your subscription tier');
    }

    // Check fonts
    if (this.hasCustomFonts(brand) && !features.customFonts) {
      errors.push('Custom fonts not available in your subscription tier');
    }

    // Validate compliance info
    if (brand.complianceInfo.arnNumber && !this.isValidARN(brand.complianceInfo.arnNumber)) {
      errors.push('Invalid ARN number format');
    }

    if (brand.complianceInfo.euinNumber && !this.isValidEUIN(brand.complianceInfo.euinNumber)) {
      errors.push('Invalid EUIN number format');
    }

    return errors;
  }

  // Check if brand has custom colors
  private hasCustomColors(brand: AdvisorBrand): boolean {
    const defaultColors = this.getDefaultColors(brand.subscriptionTier);
    return JSON.stringify(brand.assets.colorPalette) !== JSON.stringify(defaultColors);
  }

  // Check if brand has custom fonts
  private hasCustomFonts(brand: AdvisorBrand): boolean {
    const defaultFonts = this.getDefaultFonts(brand.subscriptionTier);
    return brand.assets.typography.headingFont !== defaultFonts.headingFont ||
           brand.assets.typography.bodyFont !== defaultFonts.bodyFont;
  }

  // Validate ARN format
  private isValidARN(arn: string): boolean {
    // ARN format: ARN-XXXXXX (6 digits)
    return /^ARN-\d{6}$/.test(arn);
  }

  // Validate EUIN format
  private isValidEUIN(euin: string): boolean {
    // EUIN format: E + 6 digits
    return /^E\d{6}$/.test(euin);
  }

  // Get default disclaimer
  private getDefaultDisclaimer(): string {
    return 'Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past performance is not indicative of future returns.';
  }

  // Apply brand to content
  applyBrandToContent(
    content: any,
    brand: AdvisorBrand
  ): any {
    return {
      ...content,
      branding: {
        advisorName: brand.brandName,
        tagline: brand.tagline,
        logo: brand.assets.logo?.url,
        primaryColor: brand.assets.colorPalette.primary,
        secondaryColor: brand.assets.colorPalette.secondary,
        accentColor: brand.assets.colorPalette.accent,
        arnNumber: brand.complianceInfo.arnNumber,
        euinNumber: brand.complianceInfo.euinNumber,
        disclaimer: brand.preferences.includeCompliance ? brand.complianceInfo.disclaimer : undefined,
        watermark: brand.preferences.autoWatermark ? brand.assets.watermark : undefined,
      },
    };
  }

  // Generate brand preview
  async generateBrandPreview(brand: AdvisorBrand): Promise<string> {
    // This would generate a preview image showing the brand elements
    // For now, returning a placeholder
    return '/api/brand/preview/' + brand.advisorId;
  }

  // Clear caches
  clearCache(advisorId?: string) {
    if (advisorId) {
      this.brandCache.delete(advisorId);
    } else {
      this.brandCache.clear();
      this.assetCache.clear();
    }
  }
}

export default BrandManager;