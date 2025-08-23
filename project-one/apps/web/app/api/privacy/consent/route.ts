/**
 * Consent Management API
 * Handles consent collection, withdrawal, and preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConsentManager, ConsentType, ConsentStatus } from '@/lib/security/consent-manager';
import { z } from 'zod';

// Initialize consent manager
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const consentManager = new ConsentManager(supabaseUrl, supabaseKey);

// Consent submission schema
const ConsentSubmissionSchema = z.object({
  userId: z.string(),
  consents: z.array(z.object({
    type: z.nativeEnum(ConsentType),
    granted: z.boolean(),
  })),
  ipAddress: z.string(),
  userAgent: z.string(),
  metadata: z.any().optional(),
});

// Preference update schema
const PreferenceUpdateSchema = z.object({
  userId: z.string(),
  preferences: z.record(z.nativeEnum(ConsentType), z.boolean()).optional(),
  communicationChannels: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    push: z.boolean().optional(),
    phone: z.boolean().optional(),
  }).optional(),
  dataRetention: z.object({
    minimal: z.boolean().optional(),
    deleteOnWithdrawal: z.boolean().optional(),
    anonymizeInactive: z.boolean().optional(),
  }).optional(),
});

/**
 * GET /api/privacy/consent
 * Get user's consent status and preferences
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as ConsentType | null;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    if (type) {
      // Get specific consent status
      const consent = await consentManager.getUserConsent(userId, type);
      const isAllowed = await consentManager.isProcessingAllowed(userId, type);

      return NextResponse.json({
        success: true,
        consent,
        isAllowed,
      });
    }

    // Get all consents and preferences
    const [
      history,
      preferences,
      completeness,
      renewalNeeded,
      requiredConsents,
      optionalConsents,
    ] = await Promise.all([
      consentManager.getConsentHistory(userId),
      consentManager.getPreferences(userId),
      consentManager.verifyConsentCompleteness(userId),
      consentManager.checkConsentRenewal(userId),
      consentManager.getRequiredConsents(),
      consentManager.getOptionalConsents(),
    ]);

    // Get current status for each consent type
    const currentConsents: Record<string, any> = {};
    for (const consentType of Object.values(ConsentType)) {
      const consent = await consentManager.getUserConsent(userId, consentType);
      currentConsents[consentType] = {
        status: consent?.status || ConsentStatus.PENDING,
        grantedAt: consent?.grantedAt,
        expiresAt: consent?.expiresAt,
      };
    }

    return NextResponse.json({
      success: true,
      currentConsents,
      preferences,
      history: history.slice(0, 10), // Last 10 entries
      completeness,
      renewalNeeded,
      templates: {
        required: requiredConsents,
        optional: optionalConsents,
      },
    });
  } catch (error) {
    console.error('Consent GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/privacy/consent
 * Submit or update consent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ConsentSubmissionSchema.parse(body);

    const results = [];

    // Process each consent
    for (const consent of validated.consents) {
      const result = await consentManager.recordConsent(
        validated.userId,
        consent.type,
        consent.granted,
        validated.ipAddress,
        validated.userAgent,
        validated.metadata
      );
      results.push(result);
    }

    // Generate consent receipt
    const receipt = await consentManager.generateConsentReceipt(validated.userId);

    return NextResponse.json({
      success: true,
      message: 'Consents recorded successfully',
      consents: results,
      receipt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid consent data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Consent POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/privacy/consent
 * Update consent preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = PreferenceUpdateSchema.parse(body);

    const updatedPreferences = await consentManager.updatePreferences(
      validated.userId,
      {
        preferences: validated.preferences,
        communicationChannels: validated.communicationChannels,
        dataRetention: validated.dataRetention,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preference data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Consent PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/privacy/consent
 * Withdraw consent
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as ConsentType | null;
    const reason = searchParams.get('reason');

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'userId and type required' },
        { status: 400 }
      );
    }

    await consentManager.withdrawConsent(userId, type, reason || undefined);

    return NextResponse.json({
      success: true,
      message: `Consent for ${type} withdrawn successfully`,
      nextSteps: getWithdrawalNextSteps(type),
    });
  } catch (error) {
    console.error('Consent DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw consent' },
      { status: 500 }
    );
  }
}

/**
 * Get next steps after consent withdrawal
 */
function getWithdrawalNextSteps(type: ConsentType): string[] {
  const steps: Record<ConsentType, string[]> = {
    [ConsentType.DATA_COLLECTION]: [
      'Your data collection preferences have been updated',
      'Essential service data will still be collected as required',
    ],
    [ConsentType.DATA_PROCESSING]: [
      'Data processing for non-essential purposes will stop',
      'Service functionality may be limited',
    ],
    [ConsentType.MARKETING]: [
      'You will be removed from all marketing communications',
      'This may take up to 48 hours to take effect',
    ],
    [ConsentType.ANALYTICS]: [
      'Your data will be anonymized in analytics reports',
      'Future activity will not be tracked for analytics',
    ],
    [ConsentType.THIRD_PARTY_SHARING]: [
      'We will notify third parties to stop processing your data',
      'This process may take up to 30 days',
    ],
    [ConsentType.COOKIES]: [
      'Non-essential cookies will be deleted',
      'You may need to clear your browser cookies',
    ],
    [ConsentType.PROFILING]: [
      'Automated profiling will be disabled',
      'Personalized recommendations will no longer be available',
    ],
    [ConsentType.AUTOMATED_DECISION]: [
      'Automated decision-making will be disabled',
      'Manual review will be required for certain services',
    ],
    [ConsentType.CROSS_BORDER_TRANSFER]: [
      'International data transfers will be restricted',
      'Some global features may be unavailable',
    ],
    [ConsentType.BIOMETRIC_DATA]: [
      'Biometric authentication will be disabled',
      'Please set up an alternative authentication method',
    ],
    [ConsentType.FINANCIAL_DATA]: [
      'Financial data processing will be limited to legal requirements',
      'Some advisory services may be restricted',
    ],
    [ConsentType.HEALTH_DATA]: [
      'Health-related data processing will stop',
      'Health-based recommendations will be unavailable',
    ],
  };

  return steps[type] || ['Your consent withdrawal has been processed'];
}