import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hash } from 'bcryptjs';
import { ConsentManager } from '@/lib/services/consent-manager';
import { WhatsAppService } from '@/lib/services/whatsapp-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      euin,
      firmName,
      password,
      whatsappConsent,
      marketingConsent,
      newsletterConsent,
      consentMetadata
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !euin || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // WhatsApp consent is mandatory
    if (!whatsappConsent) {
      return NextResponse.json(
        { error: 'WhatsApp consent is required to use Hubix services' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('advisors')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user account
    const { data: newAdvisor, error: advisorError } = await supabase
      .from('advisors')
      .insert({
        name,
        email,
        phone: phone.replace(/\D/g, ''), // Remove non-digits
        euin,
        firm_name: firmName,
        password_hash: hashedPassword,
        status: 'active',
        subscription_plan: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (advisorError) {
      console.error('Error creating advisor:', advisorError);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Get client IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Record WhatsApp consent
    const consentManager = new ConsentManager();
    const consentRecord = await consentManager.recordWebsiteConsent({
      advisorId: newAdvisor.id,
      phone: phone.replace(/\D/g, ''),
      whatsappConsent: true,
      marketingConsent: marketingConsent || false,
      newsletterConsent: newsletterConsent || false,
      ipAddress: ip,
      userAgent: consentMetadata?.userAgent || request.headers.get('user-agent') || 'unknown',
      consentText: 'I agree to receive daily investment insights via WhatsApp at 06:00 IST'
    });

    // Send welcome WhatsApp message
    if (whatsappConsent) {
      try {
        const whatsappService = new WhatsAppService();
        await whatsappService.sendWelcomeMessage({
          phone: phone.replace(/\D/g, ''),
          name: name,
          plan: 'Trial',
          deliveryTime: '06:00'
        });
      } catch (whatsappError) {
        // Log error but don't fail signup
        console.error('WhatsApp welcome message failed:', whatsappError);
      }
    }

    // Create session token (you might want to use a proper auth library)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        advisor_id: newAdvisor.id,
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      advisor: {
        id: newAdvisor.id,
        name: newAdvisor.name,
        email: newAdvisor.email,
        phone: newAdvisor.phone,
        euin: newAdvisor.euin,
        subscription_plan: newAdvisor.subscription_plan
      },
      consent: {
        whatsapp: consentRecord.opted_in,
        marketing: consentRecord.marketing_consent,
        newsletter: consentRecord.newsletter_consent,
        recorded_at: consentRecord.consent_date
      },
      session: session?.token
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}