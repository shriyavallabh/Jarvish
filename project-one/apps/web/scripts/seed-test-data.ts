/**
 * Test Data Seeder for Manual Testing
 * Populates mock database with sample data for all user stories
 */

import { database } from '../lib/utils/database'
import { hashPassword } from '../lib/utils/auth'
import crypto from 'crypto'

interface TestAdvisor {
  id: string
  email: string
  mobile: string
  name: string
  tier: 'free' | 'basic' | 'pro'
  status: 'pending' | 'active' | 'suspended'
  profile?: any
}

const testAdvisors: TestAdvisor[] = [
  {
    id: 'test-advisor-1',
    email: 'rajesh.kumar@wealthadvisors.in',
    mobile: '+919876543210',
    name: 'Rajesh Kumar',
    tier: 'pro',
    status: 'active',
    profile: {
      firmName: 'Kumar Wealth Advisors',
      firmRegistrationNumber: 'E123456',
      experience: 15,
      clientCount: 250,
      aum: 150000000, // 15 crores
      specializations: ['Mutual Funds', 'Insurance', 'Tax Planning', 'Retirement Planning'],
      languages: ['English', 'Hindi', 'Marathi'],
      location: {
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
      contactInfo: {
        businessPhone: '+912226123456',
        businessEmail: 'info@kumarwealth.in',
        website: 'https://kumarwealth.in',
      },
      branding: {
        primaryColor: '#0B1F33',
        secondaryColor: '#CEA200',
        accentColor: '#0C310C',
        fontFamily: 'Poppins',
        logoPosition: 'top-left',
        contentStyle: 'professional',
      },
      profilePhotoUrl: 'https://storage.jarvish.ai/profiles/rajesh-kumar.jpg',
      logoUrl: 'https://storage.jarvish.ai/logos/kumar-wealth.png',
    },
  },
  {
    id: 'test-advisor-2',
    email: 'priya.sharma@financialplanners.co.in',
    mobile: '+919123456789',
    name: 'Priya Sharma',
    tier: 'basic',
    status: 'active',
    profile: {
      firmName: 'Sharma Financial Planners',
      firmRegistrationNumber: 'ARN-12345',
      experience: 8,
      clientCount: 120,
      aum: 50000000, // 5 crores
      specializations: ['Mutual Funds', 'Goal Planning', 'Child Education'],
      languages: ['English', 'Hindi'],
      location: {
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      },
      contactInfo: {
        businessPhone: '+912026123456',
        businessEmail: 'contact@sharmafinancial.co.in',
      },
      branding: {
        primaryColor: '#065f46',
        secondaryColor: '#047857',
        accentColor: '#10b981',
        fontFamily: 'Inter',
        contentStyle: 'trustworthy',
      },
    },
  },
  {
    id: 'test-advisor-3',
    email: 'amit.patel@investmentadvisors.in',
    mobile: '+917890123456',
    name: 'Amit Patel',
    tier: 'free',
    status: 'pending',
    profile: null, // New advisor, profile not completed
  },
  {
    id: 'test-advisor-4',
    email: 'sneha.reddy@wealthmanagers.in',
    mobile: '+918901234567',
    name: 'Sneha Reddy',
    tier: 'pro',
    status: 'active',
    profile: {
      firmName: 'Reddy Wealth Management',
      firmRegistrationNumber: 'INA123456789',
      experience: 20,
      clientCount: 500,
      aum: 500000000, // 50 crores
      specializations: ['Portfolio Management', 'Estate Planning', 'NRI Services', 'Alternative Investments'],
      languages: ['English', 'Telugu', 'Hindi'],
      location: {
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
      },
      contactInfo: {
        businessPhone: '+914066123456',
        businessEmail: 'info@reddywealth.in',
        website: 'https://reddywealth.in',
      },
      branding: {
        primaryColor: '#92400e',
        secondaryColor: '#b45309',
        accentColor: '#f59e0b',
        fontFamily: 'Playfair Display',
        contentStyle: 'luxury',
      },
      profilePhotoUrl: 'https://storage.jarvish.ai/profiles/sneha-reddy.jpg',
      logoUrl: 'https://storage.jarvish.ai/logos/reddy-wealth.png',
    },
  },
  {
    id: 'test-advisor-5',
    email: 'vikram.singh@financialadvisors.com',
    mobile: '+919012345678',
    name: 'Vikram Singh',
    tier: 'basic',
    status: 'suspended', // For testing suspended state
    profile: {
      firmName: 'Singh Financial Advisory',
      firmRegistrationNumber: 'E789012',
      experience: 5,
      clientCount: 80,
      aum: 25000000, // 2.5 crores
      specializations: ['Mutual Funds', 'Insurance'],
      languages: ['English', 'Punjabi', 'Hindi'],
      location: {
        city: 'Chandigarh',
        state: 'Punjab',
        pincode: '160001',
      },
    },
  },
]

const testContent = [
  {
    id: 'content-1',
    advisorId: 'test-advisor-1',
    type: 'market_update',
    language: 'English',
    content: 'Markets witnessed strong recovery today with Nifty closing above 19,500. Banking and IT sectors led the rally. Stay invested for long-term wealth creation.',
    complianceScore: 95,
    status: 'approved',
    scheduledFor: new Date('2024-12-20T00:30:00Z'), // 6:00 AM IST
    createdAt: new Date('2024-12-19T10:00:00Z'),
  },
  {
    id: 'content-2',
    advisorId: 'test-advisor-1',
    type: 'educational',
    language: 'Hindi',
    content: 'म्यूचुअल फंड में SIP के फायदे: 1) रुपये की औसत लागत 2) अनुशासित निवेश 3) छोटी राशि से शुरुआत। आज ही अपना SIP शुरू करें!',
    complianceScore: 88,
    status: 'approved',
    scheduledFor: new Date('2024-12-21T00:30:00Z'),
    createdAt: new Date('2024-12-19T11:00:00Z'),
  },
  {
    id: 'content-3',
    advisorId: 'test-advisor-2',
    type: 'market_update',
    language: 'English',
    content: 'Gold prices hit 6-month high. Consider diversifying your portfolio with sovereign gold bonds for tax-efficient returns.',
    complianceScore: 92,
    status: 'pending_review',
    scheduledFor: new Date('2024-12-21T00:30:00Z'),
    createdAt: new Date('2024-12-19T12:00:00Z'),
  },
  {
    id: 'content-4',
    advisorId: 'test-advisor-4',
    type: 'tax_tip',
    language: 'English',
    content: 'Last date for tax-saving investments approaching! Invest in ELSS funds to save tax under Section 80C and create wealth. Maximum deduction: ₹1.5 lakhs.',
    complianceScore: 90,
    status: 'approved',
    scheduledFor: new Date('2024-12-22T00:30:00Z'),
    createdAt: new Date('2024-12-19T13:00:00Z'),
  },
  {
    id: 'content-5',
    advisorId: 'test-advisor-1',
    type: 'festival_greeting',
    language: 'Marathi',
    content: 'दिवाळीच्या हार्दिक शुभेच्छा! या दिवाळीत तुमच्या गुंतवणुकीत वाढ होवो आणि तुमचे आर्थिक ध्येय पूर्ण होवोत.',
    complianceScore: 100,
    status: 'approved',
    scheduledFor: new Date('2024-11-01T00:30:00Z'),
    createdAt: new Date('2024-10-30T10:00:00Z'),
  },
  {
    id: 'content-6',
    advisorId: 'test-advisor-2',
    type: 'market_update',
    language: 'English',
    content: 'GUARANTEED 20% returns in just 3 months! Invest NOW!', // Compliance violation
    complianceScore: 15,
    status: 'rejected',
    rejectionReason: 'SEBI violation: Contains guaranteed returns claim',
    scheduledFor: new Date('2024-12-20T00:30:00Z'),
    createdAt: new Date('2024-12-19T14:00:00Z'),
  },
]

const testOTPs = [
  {
    id: 'otp-1',
    userId: 'test-advisor-3',
    mobile: '+917890123456',
    otpHash: crypto.createHash('sha256').update('123456').digest('hex'),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Valid for 10 minutes
    attempts: 0,
    verified: false,
  },
]

const testOnboardingProgress = [
  {
    advisorId: 'test-advisor-1',
    emailVerified: true,
    mobileVerified: true,
    profileCompleted: true,
    contentPreferencesSet: true,
    demoCompleted: true,
    brandingCompleted: true,
    completedAt: new Date('2024-12-01T10:00:00Z'),
  },
  {
    advisorId: 'test-advisor-2',
    emailVerified: true,
    mobileVerified: true,
    profileCompleted: true,
    contentPreferencesSet: true,
    demoCompleted: false,
    brandingCompleted: true,
    completedAt: null,
  },
  {
    advisorId: 'test-advisor-3',
    emailVerified: true,
    mobileVerified: false,
    profileCompleted: false,
    contentPreferencesSet: false,
    demoCompleted: false,
    brandingCompleted: false,
    completedAt: null,
  },
]

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n')

  try {
    // Clear existing test data
    console.log('🧹 Clearing existing test data...')
    await database.$transaction(async (tx) => {
      // Delete in reverse order of dependencies
      await tx.contentHistory.deleteMany({
        where: { advisorId: { startsWith: 'test-advisor-' } },
      })
      await tx.onboardingProgress.deleteMany({
        where: { advisorId: { startsWith: 'test-advisor-' } },
      })
      await tx.otpTokens.deleteMany({
        where: { userId: { startsWith: 'test-advisor-' } },
      })
      await tx.advisorProfiles.deleteMany({
        where: { advisorId: { startsWith: 'test-advisor-' } },
      })
      await tx.advisors.deleteMany({
        where: { id: { startsWith: 'test-advisor-' } },
      })
    })

    // Seed advisors
    console.log('👥 Creating test advisors...')
    for (const advisor of testAdvisors) {
      await database.advisors.create({
        data: {
          id: advisor.id,
          email: advisor.email,
          mobile: advisor.mobile,
          name: advisor.name,
          tier: advisor.tier,
          status: advisor.status,
          passwordHash: await hashPassword('Test@123'),
          emailVerified: advisor.status !== 'pending',
          mobileVerified: advisor.status === 'active',
          profileCompleted: !!advisor.profile,
          brandingCompleted: !!advisor.profile?.branding,
          createdAt: new Date('2024-12-01T00:00:00Z'),
        },
      })

      // Create profile if exists
      if (advisor.profile) {
        await database.advisorProfiles.create({
          data: {
            advisorId: advisor.id,
            ...advisor.profile,
          },
        })
        console.log(`  ✅ Created advisor: ${advisor.name} (${advisor.tier} tier)`)
      } else {
        console.log(`  ⏳ Created advisor: ${advisor.name} (pending profile)`)
      }
    }

    // Seed content history
    console.log('\n📝 Creating test content...')
    for (const content of testContent) {
      await database.contentHistory.create({
        data: content,
      })
      console.log(`  ✅ Created ${content.type} content in ${content.language} (${content.status})`)
    }

    // Seed OTPs
    console.log('\n🔐 Creating test OTPs...')
    for (const otp of testOTPs) {
      await database.otpTokens.create({
        data: otp,
      })
      console.log(`  ✅ Created OTP for mobile: ${otp.mobile} (use: 123456)`)
    }

    // Seed onboarding progress
    console.log('\n📊 Creating onboarding progress...')
    for (const progress of testOnboardingProgress) {
      await database.onboardingProgress.create({
        data: progress,
      })
      const advisor = testAdvisors.find(a => a.id === progress.advisorId)
      const completion = [
        progress.emailVerified,
        progress.mobileVerified,
        progress.profileCompleted,
        progress.contentPreferencesSet,
        progress.demoCompleted,
        progress.brandingCompleted,
      ].filter(Boolean).length
      console.log(`  ✅ ${advisor?.name}: ${completion}/6 steps completed`)
    }

    console.log('\n✨ Test data seeding completed successfully!\n')
    console.log('📋 Test Credentials:')
    console.log('  Email: Any test advisor email')
    console.log('  Password: Test@123')
    console.log('  OTP (for Amit Patel): 123456\n')

    console.log('🔗 Test URLs:')
    console.log('  Landing: http://localhost:3000')
    console.log('  Admin: http://localhost:3000/admin')
    console.log('  Advisor Dashboard: http://localhost:3000/advisor/dashboard')
    console.log('  Sign In: http://localhost:3000/auth/signin')
    console.log('  Sign Up: http://localhost:3000/auth/signup\n')

  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    process.exit(1)
  } finally {
    await database.$disconnect()
  }
}

// Run seeder
seedTestData()