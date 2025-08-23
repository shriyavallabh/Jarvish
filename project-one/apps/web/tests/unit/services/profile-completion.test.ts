import { ProfileCompletionService } from '@/lib/services/profile-completion'
import { uploadImage, deleteImage } from '@/lib/services/image-upload'
import { database } from '@/lib/utils/database'
import { validateProfile } from '@/lib/utils/validation'

// Mock dependencies
jest.mock('@/lib/services/image-upload')
jest.mock('@/lib/utils/database', () => ({
  database: {
    advisorProfiles: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    advisors: {
      update: jest.fn(),
    },
    onboardingProgress: {
      update: jest.fn(),
      upsert: jest.fn(),
    },
    specializations: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (fn) => await fn({
      advisorProfiles: {
        upsert: jest.fn(),
      },
      advisors: {
        update: jest.fn(),
      },
      onboardingProgress: {
        update: jest.fn(),
      },
    })),
  },
}))
jest.mock('@/lib/utils/validation')

describe('E01-US-004: Advisor Profile Setup', () => {
  let profileService: ProfileCompletionService
  const mockDb = (database as any)
  const mockUploadImage = uploadImage as jest.Mock
  const mockDeleteImage = deleteImage as jest.Mock
  const mockValidateProfile = validateProfile as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    profileService = ProfileCompletionService
    
    // Initialize all mock database objects
    mockDb.advisors = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    }
    mockDb.profiles = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    }
    mockDb.onboardingProgress = {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    }
  })

  describe('Profile Information Management', () => {
    it('should create advisor profile with all required fields', async () => {
      const userId = 'advisor-123'
      const profileData = {
        firmName: 'Wealth Advisors India',
        firmRegistrationNumber: 'MFD123456',
        experience: 10,
        clientCount: 150,
        aum: 5000000, // 50 lakhs
        specializations: ['Mutual Funds', 'Insurance', 'Tax Planning'],
        languages: ['English', 'Hindi'],
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
        contactInfo: {
          businessPhone: '+919876543210',
          businessEmail: 'advisor@wealthadvisors.in',
          website: 'https://wealthadvisors.in',
        },
      }

      mockValidateProfile.mockReturnValue({ valid: true })
      
      const mockTransaction = {
        advisorProfiles: {
          upsert: jest.fn().mockResolvedValue({
            id: 'profile-123',
            ...profileData,
          }),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          update: jest.fn(),
        },
      }

      mockDb.$transaction.mockImplementation((fn: any) => fn(mockTransaction))

      const result = await profileService.createProfile(userId, profileData)

      expect(result.success).toBe(true)
      expect(result.profileId).toBe('profile-123')
      expect(mockTransaction.advisorProfiles.upsert).toHaveBeenCalledWith({
        where: { advisorId: userId },
        update: expect.objectContaining({
          firmName: profileData.firmName,
          firmRegistrationNumber: profileData.firmRegistrationNumber,
        }),
        create: expect.objectContaining({
          advisorId: userId,
          ...profileData,
        }),
      })
    })

    it('should validate required fields before saving', async () => {
      const userId = 'advisor-123'
      const incompleteProfile = {
        firmName: '', // Empty required field
        experience: -1, // Invalid value
      }

      mockValidateProfile.mockReturnValue({
        valid: false,
        errors: ['Firm name is required', 'Experience must be positive'],
      })

      const result = await profileService.createProfile(userId, incompleteProfile)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Firm name is required')
      expect(mockDb.$transaction).not.toHaveBeenCalled()
    })

    it('should validate SEBI registration number format', async () => {
      const userId = 'advisor-123'
      const profileData = {
        firmName: 'Test Advisors',
        firmRegistrationNumber: 'INVALID', // Invalid format
        experience: 5,
      }

      mockValidateProfile.mockReturnValue({
        valid: false,
        errors: ['Invalid SEBI registration number format'],
      })

      const result = await profileService.createProfile(userId, profileData)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Invalid SEBI registration number format')
    })

    it('should handle specialization selection from predefined list', async () => {
      const specializations = [
        { id: '1', name: 'Mutual Funds', category: 'Investment' },
        { id: '2', name: 'Insurance', category: 'Risk Management' },
        { id: '3', name: 'Tax Planning', category: 'Financial Planning' },
        { id: '4', name: 'Retirement Planning', category: 'Financial Planning' },
        { id: '5', name: 'Estate Planning', category: 'Wealth Management' },
      ]

      mockDb.specializations.findMany.mockResolvedValue(specializations)

      const result = await profileService.getAvailableSpecializations()

      expect(result).toHaveLength(5)
      expect(result[0]).toHaveProperty('category')
      expect(result[0]).toHaveProperty('name')
    })
  })

  describe('Image Upload and Processing', () => {
    it('should upload and process profile photo', async () => {
      const userId = 'advisor-123'
      const imageFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 500000, // 500KB
      }

      mockUploadImage.mockResolvedValue({
        success: true,
        url: 'https://storage.jarvish.ai/profiles/advisor-123.jpg',
        publicId: 'profiles/advisor-123',
      })

      const result = await profileService.uploadProfilePhoto(userId, imageFile)

      expect(result.success).toBe(true)
      expect(result.photoUrl).toBeDefined()
      expect(mockUploadImage).toHaveBeenCalledWith({
        file: imageFile,
        folder: 'profiles',
        transformation: {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 'auto:good',
        },
      })
    })

    it('should validate image size and format', async () => {
      const userId = 'advisor-123'
      const oversizedImage = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 10485760, // 10MB (over limit)
      }

      const result = await profileService.uploadProfilePhoto(userId, oversizedImage)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Image size exceeds 5MB limit')
      expect(mockUploadImage).not.toHaveBeenCalled()
    })

    it('should reject invalid image formats', async () => {
      const userId = 'advisor-123'
      const invalidImage = {
        buffer: Buffer.from('fake-data'),
        mimetype: 'application/pdf', // Not an image
        size: 100000,
      }

      const result = await profileService.uploadProfilePhoto(userId, invalidImage)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid image format')
      expect(mockUploadImage).not.toHaveBeenCalled()
    })

    it('should upload and process company logo', async () => {
      const userId = 'advisor-123'
      const logoFile = {
        buffer: Buffer.from('fake-logo-data'),
        mimetype: 'image/png',
        size: 200000, // 200KB
      }

      mockUploadImage.mockResolvedValue({
        success: true,
        url: 'https://storage.jarvish.ai/logos/advisor-123.png',
        publicId: 'logos/advisor-123',
      })

      const result = await profileService.uploadCompanyLogo(userId, logoFile)

      expect(result.success).toBe(true)
      expect(result.logoUrl).toBeDefined()
      expect(mockUploadImage).toHaveBeenCalledWith({
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
    })

    it('should replace existing images when uploading new ones', async () => {
      const userId = 'advisor-123'
      const existingProfile = {
        profilePhotoUrl: 'https://storage.jarvish.ai/profiles/old-photo.jpg',
        profilePhotoPublicId: 'profiles/old-photo',
      }

      mockDb.advisorProfiles.findUnique.mockResolvedValue(existingProfile)
      mockDeleteImage.mockResolvedValue({ success: true })
      mockUploadImage.mockResolvedValue({
        success: true,
        url: 'https://storage.jarvish.ai/profiles/new-photo.jpg',
        publicId: 'profiles/new-photo',
      })

      const imageFile = {
        buffer: Buffer.from('new-image-data'),
        mimetype: 'image/jpeg',
        size: 300000,
      }

      const result = await profileService.uploadProfilePhoto(userId, imageFile)

      expect(mockDeleteImage).toHaveBeenCalledWith('profiles/old-photo')
      expect(result.success).toBe(true)
      expect(result.photoUrl).toContain('new-photo')
    })
  })

  describe('Branding Customization', () => {
    it('should save brand colors and theme preferences', async () => {
      const userId = 'advisor-123'
      const brandingData = {
        primaryColor: '#1a365d',
        secondaryColor: '#ed8936',
        accentColor: '#38a169',
        fontFamily: 'Poppins',
        logoPosition: 'top-left',
        contentStyle: 'professional',
      }

      const mockTransaction = {
        advisorProfiles: {
          upsert: jest.fn().mockResolvedValue({
            id: 'profile-123',
            branding: brandingData,
          }),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          update: jest.fn(),
        },
      }

      mockDb.$transaction.mockImplementation((fn: any) => fn(mockTransaction))

      const result = await profileService.updateBranding(userId, brandingData)

      expect(result.success).toBe(true)
      expect(mockTransaction.advisorProfiles.upsert).toHaveBeenCalledWith({
        where: { advisorId: userId },
        update: { branding: brandingData },
        create: {
          advisorId: userId,
          branding: brandingData,
        },
      })
    })

    it('should validate color format (hex codes)', async () => {
      const userId = 'advisor-123'
      const invalidBranding = {
        primaryColor: 'blue', // Should be hex
        secondaryColor: 'rgb(255,255,255)', // Should be hex
      }

      const result = await profileService.updateBranding(userId, invalidBranding)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid color format')
    })

    it('should provide default branding templates', async () => {
      const templates = await profileService.getBrandingTemplates()

      expect(templates).toContainEqual(
        expect.objectContaining({
          name: 'Professional Blue',
          primaryColor: '#1a365d',
          style: 'corporate',
        })
      )
      expect(templates).toContainEqual(
        expect.objectContaining({
          name: 'Trust Green',
          primaryColor: '#065f46',
          style: 'trustworthy',
        })
      )
      expect(templates).toContainEqual(
        expect.objectContaining({
          name: 'Premium Gold',
          primaryColor: '#92400e',
          style: 'luxury',
        })
      )
    })
  })

  describe('Profile Preview', () => {
    it('should generate profile preview with all customizations', async () => {
      const userId = 'advisor-123'
      const mockProfile = {
        firmName: 'Wealth Advisors India',
        profilePhotoUrl: 'https://storage.jarvish.ai/profiles/advisor.jpg',
        logoUrl: 'https://storage.jarvish.ai/logos/company.png',
        branding: {
          primaryColor: '#1a365d',
          secondaryColor: '#ed8936',
        },
        specializations: ['Mutual Funds', 'Tax Planning'],
        languages: ['English', 'Hindi'],
      }

      mockDb.advisorProfiles.findUnique.mockResolvedValue(mockProfile)

      const preview = await profileService.generatePreview(userId)

      expect(preview).toHaveProperty('html')
      expect(preview).toHaveProperty('whatsappPreview')
      expect(preview.html).toContain(mockProfile.firmName)
      expect(preview.whatsappPreview).toContain('Wealth Advisors India')
    })

    it('should show how profile appears in WhatsApp messages', async () => {
      const userId = 'advisor-123'
      const mockProfile = {
        firmName: 'ABC Financial Services',
        contactInfo: {
          businessPhone: '+919876543210',
        },
      }

      mockDb.advisorProfiles.findUnique.mockResolvedValue(mockProfile)

      const preview = await profileService.generateWhatsAppPreview(userId, 'Sample content message')

      expect(preview).toContain('ABC Financial Services')
      expect(preview).toContain('Sample content message')
      expect(preview).toContain('+919876543210')
    })
  })

  describe('Profile Completion Tracking', () => {
    it('should calculate profile completion percentage', async () => {
      const userId = 'advisor-123'
      const partialProfile = {
        firmName: 'Test Firm',
        experience: 5,
        // Missing: photo, logo, specializations, languages, etc.
      }

      mockDb.advisorProfiles.findUnique.mockResolvedValue(partialProfile)

      // Mock the advisor data for completion calculation
      mockDb.advisors.findUnique.mockResolvedValue({
        id: userId,
        firmRegistrationNumber: 'REG123',
        specializations: ['Equity', 'Debt'],
        languages: ['English', 'Hindi'],
        location: 'Mumbai',
        contactInfo: { phone: '9876543210' },
        profilePhotoUrl: '/photos/profile.jpg',
        logoUrl: '/logos/firm.png',
        branding: { colors: {} },
        clientCount: 100,
        aum: 10000000,
      })
      
      const completion = await profileService.getCompletionStatus(userId)

      expect(completion.percentage).toBeLessThan(100)
      expect(completion.missingFields).toContain('profilePhotoUrl')
      expect(completion.missingFields).toContain('specializations')
      expect(completion.requiredFieldsComplete).toBe(false)
    })

    it('should mark profile as complete when all required fields are filled', async () => {
      const userId = 'advisor-123'
      const completeProfile = {
        firmName: 'Complete Advisors',
        firmRegistrationNumber: 'MFD123456',
        experience: 10,
        clientCount: 100,
        specializations: ['Mutual Funds'],
        languages: ['English'],
        location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
        contactInfo: { businessPhone: '+919876543210' },
        profilePhotoUrl: 'https://storage.jarvish.ai/profiles/photo.jpg',
      }

      mockDb.advisorProfiles.findUnique.mockResolvedValue(completeProfile)

      // Mock the advisor data for completion calculation
      mockDb.advisors.findUnique.mockResolvedValue({
        id: userId,
        firmRegistrationNumber: 'REG123',
        specializations: ['Equity', 'Debt'],
        languages: ['English', 'Hindi'],
        location: 'Mumbai',
        contactInfo: { phone: '9876543210' },
        profilePhotoUrl: '/photos/profile.jpg',
        logoUrl: '/logos/firm.png',
        branding: { colors: {} },
        clientCount: 100,
        aum: 10000000,
      })
      
      const completion = await profileService.getCompletionStatus(userId)

      expect(completion.percentage).toBeGreaterThanOrEqual(75)
      // Some optional fields might still be missing
      expect(completion.missingFields.length).toBeLessThanOrEqual(3)
      expect(completion.requiredFieldsComplete).toBe(true)
    })

    it('should update onboarding progress when profile is completed', async () => {
      const userId = 'advisor-123'
      const profileData = {
        firmName: 'Test Advisors',
        firmRegistrationNumber: 'MFD123456',
        experience: 5,
        specializations: ['Mutual Funds'],
        languages: ['English'],
      }

      mockValidateProfile.mockReturnValue({ valid: true })
      
      const mockTransaction = {
        advisorProfiles: {
          upsert: jest.fn().mockResolvedValue({ id: 'profile-123' }),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          update: jest.fn(),
        },
      }

      mockDb.$transaction.mockImplementation((fn: any) => fn(mockTransaction))

      await profileService.createProfile(userId, profileData)

      expect(mockTransaction.onboardingProgress.update).toHaveBeenCalledWith({
        where: { advisorId: userId },
        data: {
          profileCompleted: true,
          profileCompletedAt: expect.any(Date),
        },
      })
    })
  })

  describe('SEBI Compliance for Profile', () => {
    it('should validate EUIN/ARN number format', async () => {
      const validEUINs = ['E123456', 'E999999']
      const validARNs = ['ARN-12345', 'ARN-99999']
      const invalidNumbers = ['123456', 'INVALID', 'E12345'] // Too short

      for (const euin of validEUINs) {
        const result = profileService.validateRegistrationNumber(euin, 'EUIN')
        expect(result.valid).toBe(true)
      }

      for (const arn of validARNs) {
        const result = profileService.validateRegistrationNumber(arn, 'ARN')
        expect(result.valid).toBe(true)
      }

      for (const invalid of invalidNumbers) {
        const result = profileService.validateRegistrationNumber(invalid, 'EUIN')
        expect(result.valid).toBe(false)
      }
    })

    it('should require mandatory SEBI disclaimers in profile', async () => {
      const userId = 'advisor-123'
      const profileData = {
        firmName: 'Test Advisors',
        disclaimers: {
          sebiRegistered: true,
          pastPerformanceDisclaimer: true,
          riskDisclosure: true,
        },
      }

      mockValidateProfile.mockReturnValue({ valid: true })

      const mockTransaction = {
        advisorProfiles: {
          upsert: jest.fn().mockResolvedValue({ id: 'profile-123' }),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          update: jest.fn(),
        },
      }

      mockDb.$transaction.mockImplementation((fn: any) => fn(mockTransaction))

      const result = await profileService.createProfile(userId, profileData)

      expect(result.success).toBe(true)
      expect(mockTransaction.advisorProfiles.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            disclaimers: profileData.disclaimers,
          }),
        })
      )
    })
  })
})