import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import ImageGenerator, { 
  AspectRatio, 
  ContentType, 
  ContentData, 
  BrandingConfig,
  ImageConfig 
} from '@/lib/services/render/image-generator';
import BrandManager from '@/lib/services/render/brand-manager';
import WhatsAppOptimizer, { DeviceProfile, NetworkCondition } from '@/lib/services/render/whatsapp-optimizer';
import TemplateEngine from '@/lib/services/render/template-engine';
import { supabase } from '@/lib/supabase/client';

// Request body interface
interface GenerateImageRequest {
  templateId?: string;
  content: ContentData;
  aspectRatio?: AspectRatio;
  contentType?: ContentType;
  language?: 'en' | 'hi' | 'mr';
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  optimize?: boolean;
  deviceProfile?: DeviceProfile;
  networkCondition?: NetworkCondition;
  customBranding?: Partial<BrandingConfig>;
  saveToStorage?: boolean;
}

// Initialize services
const imageGenerator = new ImageGenerator();
const brandManager = new BrandManager();
const whatsappOptimizer = new WhatsAppOptimizer();
const templateEngine = new TemplateEngine();

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get advisor data
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body: GenerateImageRequest = await request.json();
    const {
      templateId,
      content,
      aspectRatio = AspectRatio.WHATSAPP,
      contentType = ContentType.MARKET_UPDATE,
      language = advisor.primary_language || 'en',
      quality = 80,
      format = 'jpeg',
      optimize = true,
      deviceProfile = DeviceProfile.MID_RANGE,
      networkCondition = NetworkCondition.MOBILE_4G,
      customBranding,
      saveToStorage = true,
    } = body;

    // Validate content
    if (!content || !content.title || !content.body) {
      return NextResponse.json(
        { error: 'Invalid content data' },
        { status: 400 }
      );
    }

    // Load advisor branding
    const advisorBrand = await brandManager.loadAdvisorBrand(advisor.id);
    
    // Check tier features
    const tierFeatures = brandManager.getTierFeatures(advisor.subscription_tier);
    
    // Apply tier restrictions
    if (customBranding?.logo && !tierFeatures.customLogo) {
      return NextResponse.json(
        { error: 'Custom logo not available in your subscription tier' },
        { status: 403 }
      );
    }

    // Prepare branding config
    const brandingConfig: BrandingConfig = {
      advisorName: advisor.full_name,
      firmName: advisor.firm_name,
      logo: customBranding?.logo || advisorBrand.assets.logo?.url,
      primaryColor: customBranding?.primaryColor || advisorBrand.assets.colorPalette.primary,
      secondaryColor: customBranding?.secondaryColor || advisorBrand.assets.colorPalette.secondary,
      phone: advisor.phone,
      email: advisor.email,
      website: advisorBrand.socialLinks?.linkedin,
      arnNumber: advisor.arn_number,
      euinNumber: advisor.euin_number,
      disclaimer: advisorBrand.complianceInfo.disclaimer,
    };

    // Prepare image config
    const imageConfig: ImageConfig = {
      aspectRatio,
      contentType,
      language,
      quality,
      format,
    };

    // Generate image
    console.log('Generating image for advisor:', advisor.id);
    const generatedImage = await imageGenerator.generateImage(
      content,
      brandingConfig,
      imageConfig
    );

    // Optimize for WhatsApp if requested
    let finalImage = generatedImage;
    if (optimize) {
      console.log('Optimizing image for WhatsApp...');
      const optimized = await whatsappOptimizer.optimizeForWhatsApp(
        generatedImage,
        'chat_image',
        deviceProfile,
        networkCondition
      );
      
      finalImage = {
        ...generatedImage,
        buffer: optimized.buffer,
        mimeType: `image/${optimized.format}`,
        fileSize: optimized.fileSize,
      };
    }

    // Save to storage if requested
    let publicUrl: string | undefined;
    if (saveToStorage) {
      console.log('Uploading image to storage...');
      const fileName = `${contentType}_${Date.now()}.${format}`;
      publicUrl = await imageGenerator.uploadToSupabase(
        finalImage,
        advisor.id,
        fileName
      );

      // Save to content history
      await supabase
        .from('content_history')
        .insert({
          advisor_id: advisor.id,
          content_type: 'image',
          content: JSON.stringify({
            title: content.title,
            body: content.body,
            imageUrl: publicUrl,
          }),
          language,
          scheduled_for: new Date().toISOString(),
          delivery_status: 'PENDING',
          metadata: {
            templateId,
            aspectRatio,
            contentType,
            format,
            fileSize: finalImage.fileSize,
            optimized: optimize,
          },
        });
    }

    // Track template usage if applicable
    if (templateId) {
      await templateEngine.trackTemplateUsage(templateId);
    }

    // Return response
    return NextResponse.json({
      success: true,
      image: {
        url: publicUrl,
        width: finalImage.width,
        height: finalImage.height,
        format: finalImage.mimeType,
        fileSize: finalImage.fileSize,
        optimized: optimize,
      },
      metadata: {
        advisorId: advisor.id,
        templateId,
        contentType,
        aspectRatio,
        language,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve templates
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get advisor data
    const { data: advisor } = await supabase
      .from('advisors')
      .select('id, subscription_tier')
      .eq('clerk_user_id', userId)
      .single();

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const contentType = searchParams.get('contentType');
    const language = searchParams.get('language');

    // Get templates
    let templates;
    if (category || contentType || language) {
      templates = await templateEngine.searchTemplates('', {
        category: category as any,
        contentType: contentType as any,
        language,
        tier: advisor.subscription_tier,
      });
    } else {
      templates = await templateEngine.getRecommendedTemplates(advisor.id);
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });

  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}