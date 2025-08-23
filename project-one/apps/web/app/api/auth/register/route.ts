import { NextRequest, NextResponse } from 'next/server'
import { validateEUIN } from '@/lib/validators/euin'
import { SEBIComplianceValidator } from '@/lib/validators/sebi-compliance'
const bcrypt = require('bcryptjs')
import { prisma } from '@/lib/utils/database'

export async function POST(req: NextRequest) {
  let body: any
  
  try {
    body = await req.json()
    
    // Validate required fields
    const requiredFields = [
      'euin', 'email', 'firstName', 'lastName', 
      'mobile', 'password', 'businessType'
    ]
    
    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          fields: missingFields,
        },
        { status: 400 }
      )
    }

    // Validate terms acceptance
    if (!body.termsAccepted) {
      return NextResponse.json(
        { error: 'You must accept the terms and conditions' },
        { status: 400 }
      )
    }

    if (!body.dpdpConsent) {
      return NextResponse.json(
        { error: 'You must provide DPDP Act consent' },
        { status: 400 }
      )
    }

    // Validate Indian mobile number
    const mobilePattern = /^(\+91)?[6-9]\d{9}$/
    if (!mobilePattern.test(body.mobile)) {
      return NextResponse.json(
        { error: 'Please enter a valid Indian mobile number' },
        { status: 400 }
      )
    }

    // Validate EUIN
    const euinResult = await validateEUIN(body.euin)
    if (!euinResult.isValid) {
      return NextResponse.json(
        { error: euinResult.error },
        { status: 400 }
      )
    }

    // Check for duplicate registration
    const existingAdvisor = await prisma.advisor.findUnique({
      where: { euin: body.euin },
    })

    if (existingAdvisor) {
      return NextResponse.json(
        { 
          error: 'This EUIN is already registered',
          code: 'DUPLICATE_EUIN',
        },
        { status: 409 }
      )
    }

    // Validate SEBI compliance
    const validator = new SEBIComplianceValidator()
    const complianceResult = await validator.validateAdvisorData({
      euin: body.euin,
      firstName: body.firstName,
      lastName: body.lastName,
      certifications: euinResult.data?.certifications,
      businessType: body.businessType,
    })

    if (!complianceResult.isCompliant) {
      return NextResponse.json(
        { 
          error: 'SEBI compliance validation failed',
          violations: complianceResult.violations,
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12)

    // Create advisor record
    const advisor = await prisma.advisor.create({
      data: {
        euin: body.euin,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        mobile: body.mobile,
        password: hashedPassword,
        businessType: body.businessType,
        isVerified: false,
        termsAcceptedAt: new Date(),
        dpdpConsentAt: new Date(),
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'ADVISOR_REGISTRATION',
        euin: body.euin,
        success: true,
        metadata: {
          email: body.email,
          businessType: body.businessType,
        },
      },
    })

    // TODO: Send verification email
    // await sendVerificationEmail(advisor.email, advisor.id)

    return NextResponse.json(
      {
        success: true,
        advisor: {
          id: advisor.id,
          euin: advisor.euin,
          email: advisor.email,
          firstName: advisor.firstName,
          lastName: advisor.lastName,
        },
        requiresEmailVerification: true,
        message: 'Registration successful! Please check your email for verification.',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Log failed attempt
    if (body?.euin) {
      await prisma.auditLog.create({
        data: {
          action: 'ADVISOR_REGISTRATION',
          euin: body.euin,
          success: false,
          error: error.message,
        },
      }).catch(console.error)
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}