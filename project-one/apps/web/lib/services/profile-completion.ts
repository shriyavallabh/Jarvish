import { database } from '../utils/database'
import { uploadImage, deleteImage } from './image-upload'
import { validateProfile } from '../utils/validation'

interface ProfileData {
  firmName: string
  firmRegistrationNumber?: string
  experience: number
  clientCount?: number
  aum?: number
  specializations?: string[]
  languages?: string[]
  location?: {
    city: string
    state: string
    pincode: string
  }
  contactInfo?: {
    businessPhone?: string
    businessEmail?: string
    website?: string
  }
  disclaimers?: {
    sebiRegistered?: boolean
    pastPerformanceDisclaimer?: boolean
    riskDisclosure?: boolean
  }
}

interface BrandingData {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontFamily?: string
  logoPosition?: string
  contentStyle?: string
}

interface ImageFile {
  buffer: Buffer
  mimetype: string
  size: number
}

interface ProfileResult {
  success: boolean
  message?: string
  error?: string
  errors?: string[]
  profileId?: string
  photoUrl?: string
  logoUrl?: string
}

interface CompletionStatus {
  percentage: number
  missingFields: string[]
  requiredFieldsComplete: boolean
  optionalFieldsComplete: boolean
}

interface RegistrationValidation {
  valid: boolean
  error?: string
}

export class ProfileCompletionService {
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  
  /**
   * Create or update advisor profile with validation
   */
  async createProfile(userId: string, profileData: ProfileData): Promise<ProfileResult> {
    try {
      // Validate profile data
      const validation = validateProfile(profileData)
      
      if (!validation.valid) {
        return {
          success: false,
          error: 'Profile validation failed',
          errors: validation.errors,
        }
      }
      
      // Use transaction to ensure consistency
      const result = await database.$transaction(async (tx) => {
        // Upsert profile
        const profile = await tx.advisorProfiles.upsert({
          where: { advisorId: userId },
          update: {
            firmName: profileData.firmName,
            firmRegistrationNumber: profileData.firmRegistrationNumber,
            experience: profileData.experience,
            clientCount: profileData.clientCount,
            aum: profileData.aum,
            specializations: profileData.specializations,
            languages: profileData.languages,
            location: profileData.location,
            contactInfo: profileData.contactInfo,
            disclaimers: profileData.disclaimers,
            updatedAt: new Date(),
          },
          create: {
            advisorId: userId,
            firmName: profileData.firmName,
            firmRegistrationNumber: profileData.firmRegistrationNumber,
            experience: profileData.experience,
            clientCount: profileData.clientCount,
            aum: profileData.aum,
            specializations: profileData.specializations,
            languages: profileData.languages,
            location: profileData.location,
            contactInfo: profileData.contactInfo,
            disclaimers: profileData.disclaimers,
          },
        })
        
        // Update advisor status
        await tx.advisors.update({
          where: { id: userId },
          data: {
            profileCompleted: true,
          },
        })
        
        // Update onboarding progress
        await tx.onboardingProgress.update({
          where: { advisorId: userId },
          data: {
            profileCompleted: true,
            profileCompletedAt: new Date(),
          },
        })
        
        return profile
      })
      
      return {
        success: true,
        message: 'Profile created successfully',
        profileId: result.id,
      }
    } catch (error: any) {
      console.error('Profile creation error:', error)
      return {
        success: false,
        error: 'Failed to create profile',
      }
    }
  }
  
  /**
   * Upload and process profile photo
   */
  async uploadProfilePhoto(userId: string, imageFile: ImageFile): Promise<ProfileResult> {
    try {
      // Validate image
      if (!this.validateImage(imageFile)) {
        return {
          success: false,
          error: this.getImageValidationError(imageFile),
        }
      }
      
      // Check for existing photo to delete
      const existingProfile = await database.advisorProfiles.findUnique({
        where: { advisorId: userId },
        select: { profilePhotoPublicId: true },
      })
      
      if (existingProfile?.profilePhotoPublicId) {
        await deleteImage(existingProfile.profilePhotoPublicId)
      }
      
      // Upload new photo
      const uploadResult = await uploadImage({
        file: imageFile,
        folder: 'profiles',
        transformation: {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 'auto:good',
        },
      })
      
      if (!uploadResult.success) {
        return {
          success: false,
          error: 'Failed to upload image',
        }
      }
      
      // Save photo URL to profile
      await database.advisorProfiles.update({
        where: { advisorId: userId },
        data: {
          profilePhotoUrl: uploadResult.url,
          profilePhotoPublicId: uploadResult.publicId,
        },
      })
      
      return {
        success: true,
        message: 'Profile photo uploaded successfully',
        photoUrl: uploadResult.url,
      }
    } catch (error: any) {
      console.error('Photo upload error:', error)
      return {
        success: false,
        error: 'Failed to upload profile photo',
      }
    }
  }
  
  /**
   * Upload and process company logo
   */
  async uploadCompanyLogo(userId: string, logoFile: ImageFile): Promise<ProfileResult> {
    try {
      // Validate image
      if (!this.validateImage(logoFile)) {
        return {
          success: false,
          error: this.getImageValidationError(logoFile),
        }
      }
      
      // Check for existing logo to delete
      const existingProfile = await database.advisorProfiles.findUnique({
        where: { advisorId: userId },
        select: { logoPublicId: true },
      })
      
      if (existingProfile?.logoPublicId) {
        await deleteImage(existingProfile.logoPublicId)
      }
      
      // Upload new logo
      const uploadResult = await uploadImage({
        file: logoFile,
        folder: 'logos',
        transformation: {
          width: 300,
          height: 100,
          crop: 'fit',
          quality: 'auto:best',
          format: 'png',
        },
      })
      
      if (!uploadResult.success) {
        return {
          success: false,
          error: 'Failed to upload logo',
        }
      }
      
      // Save logo URL to profile
      await database.advisorProfiles.update({
        where: { advisorId: userId },
        data: {
          logoUrl: uploadResult.url,
          logoPublicId: uploadResult.publicId,
        },
      })
      
      return {
        success: true,
        message: 'Company logo uploaded successfully',
        logoUrl: uploadResult.url,
      }
    } catch (error: any) {
      console.error('Logo upload error:', error)
      return {
        success: false,
        error: 'Failed to upload company logo',
      }
    }
  }
  
  /**
   * Update branding customization
   */
  async updateBranding(userId: string, brandingData: BrandingData): Promise<ProfileResult> {
    try {
      // Validate colors
      if (!this.validateBrandingColors(brandingData)) {
        return {
          success: false,
          error: 'Invalid color format. Please use hex codes (e.g., #1a365d)',
        }
      }
      
      // Update branding in transaction
      await database.$transaction(async (tx) => {
        await tx.advisorProfiles.upsert({
          where: { advisorId: userId },
          update: {
            branding: brandingData,
          },
          create: {
            advisorId: userId,
            branding: brandingData,
          },
        })
        
        await tx.advisors.update({
          where: { id: userId },
          data: {
            brandingCompleted: true,
          },
        })
        
        await tx.onboardingProgress.update({
          where: { advisorId: userId },
          data: {
            brandingCompleted: true,
          },
        })
      })
      
      return {
        success: true,
        message: 'Branding updated successfully',
      }
    } catch (error: any) {
      console.error('Branding update error:', error)
      return {
        success: false,
        error: 'Failed to update branding',
      }
    }
  }
  
  /**
   * Get available specializations
   */
  async getAvailableSpecializations() {
    return await database.specializations.findMany({
      orderBy: { category: 'asc' },
    })
  }
  
  /**
   * Get branding templates
   */
  async getBrandingTemplates() {
    return [
      {
        name: 'Professional Blue',
        primaryColor: '#1a365d',
        secondaryColor: '#2b6cb0',
        accentColor: '#63b3ed',
        style: 'corporate',
      },
      {
        name: 'Trust Green',
        primaryColor: '#065f46',
        secondaryColor: '#047857',
        accentColor: '#10b981',
        style: 'trustworthy',
      },
      {
        name: 'Premium Gold',
        primaryColor: '#92400e',
        secondaryColor: '#b45309',
        accentColor: '#f59e0b',
        style: 'luxury',
      },
      {
        name: 'Modern Purple',
        primaryColor: '#5b21b6',
        secondaryColor: '#7c3aed',
        accentColor: '#a78bfa',
        style: 'modern',
      },
    ]
  }
  
  /**
   * Generate profile preview
   */
  async generatePreview(userId: string) {
    const profile = await database.advisorProfiles.findUnique({
      where: { advisorId: userId },
    })
    
    if (!profile) {
      return null
    }
    
    const html = this.generatePreviewHTML(profile)
    const whatsappPreview = this.generateWhatsAppPreviewText(profile, 'Sample market update message')
    
    return {
      html,
      whatsappPreview,
    }
  }
  
  /**
   * Generate WhatsApp preview
   */
  async generateWhatsAppPreview(userId: string, sampleContent: string) {
    const profile = await database.advisorProfiles.findUnique({
      where: { advisorId: userId },
    })
    
    if (!profile) {
      return ''
    }
    
    return this.generateWhatsAppPreviewText(profile, sampleContent)
  }
  
  /**
   * Get profile completion status
   */
  async getCompletionStatus(userId: string): Promise<CompletionStatus> {
    const profile = await database.advisorProfiles.findUnique({
      where: { advisorId: userId },
    })
    
    const requiredFields = [
      'firmName',
      'firmRegistrationNumber',
      'experience',
      'specializations',
      'languages',
      'location',
      'contactInfo',
    ]
    
    const optionalFields = [
      'profilePhotoUrl',
      'logoUrl',
      'branding',
      'clientCount',
      'aum',
    ]
    
    const missingFields: string[] = []
    let completedRequired = 0
    let completedOptional = 0
    
    if (!profile) {
      return {
        percentage: 0,
        missingFields: requiredFields,
        requiredFieldsComplete: false,
        optionalFieldsComplete: false,
      }
    }
    
    // Check required fields
    for (const field of requiredFields) {
      const value = (profile as any)[field]
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        completedRequired++
      } else {
        missingFields.push(field)
      }
    }
    
    // Check optional fields
    for (const field of optionalFields) {
      const value = (profile as any)[field]
      if (value) {
        completedOptional++
      } else {
        missingFields.push(field)
      }
    }
    
    const totalFields = requiredFields.length + optionalFields.length
    const completedFields = completedRequired + completedOptional
    const percentage = Math.round((completedFields / totalFields) * 100)
    
    return {
      percentage,
      missingFields,
      requiredFieldsComplete: completedRequired === requiredFields.length,
      optionalFieldsComplete: completedOptional === optionalFields.length,
    }
  }
  
  /**
   * Validate SEBI registration number
   */
  validateRegistrationNumber(number: string, type: 'EUIN' | 'ARN'): RegistrationValidation {
    if (type === 'EUIN') {
      // EUIN format: E followed by 6 digits
      const euinRegex = /^E\d{6}$/
      if (!euinRegex.test(number)) {
        return {
          valid: false,
          error: 'EUIN must be in format E123456',
        }
      }
    } else if (type === 'ARN') {
      // ARN format: ARN- followed by 5 digits
      const arnRegex = /^ARN-\d{5}$/
      if (!arnRegex.test(number)) {
        return {
          valid: false,
          error: 'ARN must be in format ARN-12345',
        }
      }
    }
    
    return { valid: true }
  }
  
  // Private helper methods
  
  private validateImage(imageFile: ImageFile): boolean {
    if (imageFile.size > this.MAX_IMAGE_SIZE) {
      return false
    }
    
    if (!this.ALLOWED_IMAGE_TYPES.includes(imageFile.mimetype)) {
      return false
    }
    
    return true
  }
  
  private getImageValidationError(imageFile: ImageFile): string {
    if (imageFile.size > this.MAX_IMAGE_SIZE) {
      return 'Image size exceeds 5MB limit'
    }
    
    if (!this.ALLOWED_IMAGE_TYPES.includes(imageFile.mimetype)) {
      return 'Invalid image format. Please upload JPEG, PNG, or WebP'
    }
    
    return 'Invalid image'
  }
  
  private validateBrandingColors(brandingData: BrandingData): boolean {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
    
    if (brandingData.primaryColor && !hexColorRegex.test(brandingData.primaryColor)) {
      return false
    }
    
    if (brandingData.secondaryColor && !hexColorRegex.test(brandingData.secondaryColor)) {
      return false
    }
    
    if (brandingData.accentColor && !hexColorRegex.test(brandingData.accentColor)) {
      return false
    }
    
    return true
  }
  
  private generatePreviewHTML(profile: any): string {
    return `
      <div style="font-family: ${profile.branding?.fontFamily || 'Arial'}, sans-serif;">
        <div style="background: ${profile.branding?.primaryColor || '#1a365d'}; color: white; padding: 20px;">
          ${profile.logoUrl ? `<img src="${profile.logoUrl}" alt="Logo" style="height: 50px;">` : ''}
          <h1>${profile.firmName}</h1>
        </div>
        <div style="padding: 20px;">
          <div style="display: flex; align-items: center;">
            ${profile.profilePhotoUrl ? `<img src="${profile.profilePhotoUrl}" alt="Profile" style="width: 100px; height: 100px; border-radius: 50%; margin-right: 20px;">` : ''}
            <div>
              <h2>Experience: ${profile.experience} years</h2>
              <p>Specializations: ${profile.specializations?.join(', ') || 'Not specified'}</p>
              <p>Languages: ${profile.languages?.join(', ') || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>
    `
  }
  
  private generateWhatsAppPreviewText(profile: any, content: string): string {
    return `*${profile.firmName}*\n\n${content}\n\n📞 ${profile.contactInfo?.businessPhone || 'Contact not available'}\n\n_This message is from a SEBI registered financial advisor_`
  }
}