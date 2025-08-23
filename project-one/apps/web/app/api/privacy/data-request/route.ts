/**
 * Data Request API
 * Handles data subject rights requests (access, deletion, portability, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DPDPComplianceManager, DataSubjectRight } from '@/lib/security/dpdp-compliance';
import { DataRetentionManager } from '@/lib/security/data-retention';
import { ConsentManager } from '@/lib/security/consent-manager';
import { EncryptionManager } from '@/lib/security/encryption-manager';
import { z } from 'zod';

// Request validation schemas
const DataAccessRequestSchema = z.object({
  userId: z.string(),
  requestType: z.nativeEnum(DataSubjectRight),
  details: z.any().optional(),
  reason: z.string().optional(),
});

const DataExportRequestSchema = z.object({
  userId: z.string(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  categories: z.array(z.string()).optional(),
  includeConsent: z.boolean().default(true),
  includeAnalytics: z.boolean().default(false),
});

const DataDeletionRequestSchema = z.object({
  userId: z.string(),
  categories: z.array(z.string()).optional(),
  reason: z.string(),
  immediate: z.boolean().default(false),
});

// Initialize managers
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const dpdpManager = new DPDPComplianceManager(supabaseUrl, supabaseKey);
const retentionManager = new DataRetentionManager(supabaseUrl, supabaseKey);
const consentManager = new ConsentManager(supabaseUrl, supabaseKey);
const encryptionManager = new EncryptionManager();

/**
 * GET /api/privacy/data-request
 * Get user's data or request status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const requestId = searchParams.get('requestId');

    if (!userId && !requestId) {
      return NextResponse.json(
        { error: 'userId or requestId required' },
        { status: 400 }
      );
    }

    if (requestId) {
      // Get request status
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('data_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        request: data,
      });
    }

    // Get user's data requests history
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('data_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requests: data || [],
    });
  } catch (error) {
    console.error('Data request GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/privacy/data-request
 * Submit a data subject rights request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request type
    const action = body.action;
    
    switch (action) {
      case 'access':
        return handleAccessRequest(body);
      case 'export':
        return handleExportRequest(body);
      case 'delete':
        return handleDeletionRequest(body);
      case 'rectify':
        return handleRectificationRequest(body);
      case 'restrict':
        return handleRestrictionRequest(body);
      case 'portability':
        return handlePortabilityRequest(body);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Data request POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle data access request
 */
async function handleAccessRequest(body: any) {
  try {
    const validated = DataAccessRequestSchema.parse(body);
    
    // Process access request
    const result = await dpdpManager.handleDataSubjectRequest(
      validated.userId,
      validated.requestType,
      validated.details
    );

    // Log the request
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: requestRecord } = await supabase
      .from('data_requests')
      .insert({
        user_id: validated.userId,
        type: 'access',
        status: result.success ? 'completed' : 'failed',
        details: validated.details,
        result: result.data,
        created_at: new Date(),
        completed_at: new Date(),
      })
      .select()
      .single();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.data,
      requestId: requestRecord?.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

/**
 * Handle data export request
 */
async function handleExportRequest(body: any) {
  try {
    const validated = DataExportRequestSchema.parse(body);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Gather user data
    const exportData: any = {
      exportDate: new Date(),
      userId: validated.userId,
      format: validated.format,
    };

    // Get user profile
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', validated.userId)
      .single();

    if (userData) {
      // Decrypt PII if present
      if (userData.encrypted_pii) {
        userData.decrypted_pii = await encryptionManager.decryptPII(userData.encrypted_pii);
      }
      exportData.profile = userData;
    }

    // Get consent data if requested
    if (validated.includeConsent) {
      exportData.consent = await consentManager.exportConsentData(validated.userId);
    }

    // Get analytics data if requested
    if (validated.includeAnalytics) {
      const { data: analyticsData } = await supabase
        .from('analytics')
        .select('*')
        .eq('user_id', validated.userId);
      
      exportData.analytics = analyticsData;
    }

    // Get content created by user
    const { data: contentData } = await supabase
      .from('content')
      .select('*')
      .eq('advisor_id', validated.userId);
    
    exportData.content = contentData;

    // Format based on requested format
    let formattedData;
    let contentType;
    
    switch (validated.format) {
      case 'csv':
        formattedData = convertToCSV(exportData);
        contentType = 'text/csv';
        break;
      case 'pdf':
        formattedData = await generatePDF(exportData);
        contentType = 'application/pdf';
        break;
      default:
        formattedData = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
    }

    // Log the request
    const { data: requestRecord } = await supabase
      .from('data_requests')
      .insert({
        user_id: validated.userId,
        type: 'export',
        status: 'completed',
        details: { format: validated.format, categories: validated.categories },
        created_at: new Date(),
        completed_at: new Date(),
      })
      .select()
      .single();

    return new NextResponse(formattedData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="data-export-${validated.userId}-${Date.now()}.${validated.format}"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

/**
 * Handle data deletion request (Right to be forgotten)
 */
async function handleDeletionRequest(body: any) {
  try {
    const validated = DataDeletionRequestSchema.parse(body);
    
    // Check if immediate deletion is allowed
    if (validated.immediate) {
      // Verify no legal holds or compliance requirements
      const result = await retentionManager.handleRightToBeForgotten(validated.userId);
      
      return NextResponse.json({
        success: result.success,
        deletedCategories: result.deletedCategories,
        retainedCategories: result.retainedCategories,
        reason: result.reason,
        message: 'Data deletion completed with legal compliance considerations',
      });
    }

    // Schedule deletion for review
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: requestRecord } = await supabase
      .from('data_requests')
      .insert({
        user_id: validated.userId,
        type: 'deletion',
        status: 'pending_review',
        details: {
          categories: validated.categories,
          reason: validated.reason,
        },
        created_at: new Date(),
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      message: 'Deletion request submitted for review',
      requestId: requestRecord?.id,
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

/**
 * Handle data rectification request
 */
async function handleRectificationRequest(body: any) {
  try {
    const { userId, corrections, reason } = body;
    
    if (!userId || !corrections) {
      return NextResponse.json(
        { error: 'userId and corrections required' },
        { status: 400 }
      );
    }

    const result = await dpdpManager.handleDataSubjectRequest(
      userId,
      DataSubjectRight.RECTIFICATION,
      corrections
    );

    // Log the request
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase
      .from('data_requests')
      .insert({
        user_id: userId,
        type: 'rectification',
        status: result.success ? 'completed' : 'failed',
        details: { corrections, reason },
        created_at: new Date(),
        completed_at: new Date(),
      });

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Rectification error:', error);
    return NextResponse.json(
      { error: 'Failed to process rectification request' },
      { status: 500 }
    );
  }
}

/**
 * Handle processing restriction request
 */
async function handleRestrictionRequest(body: any) {
  try {
    const { userId, restrictions, reason } = body;
    
    if (!userId || !restrictions) {
      return NextResponse.json(
        { error: 'userId and restrictions required' },
        { status: 400 }
      );
    }

    const result = await dpdpManager.handleDataSubjectRequest(
      userId,
      DataSubjectRight.RESTRICTION,
      restrictions
    );

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Restriction error:', error);
    return NextResponse.json(
      { error: 'Failed to process restriction request' },
      { status: 500 }
    );
  }
}

/**
 * Handle data portability request
 */
async function handlePortabilityRequest(body: any) {
  try {
    const { userId, targetService } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const result = await dpdpManager.handleDataSubjectRequest(
      userId,
      DataSubjectRight.PORTABILITY,
      { targetService }
    );

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('Portability error:', error);
    return NextResponse.json(
      { error: 'Failed to process portability request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/privacy/data-request
 * Cancel a pending data request
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase
      .from('data_requests')
      .update({
        status: 'cancelled',
        completed_at: new Date(),
      })
      .eq('id', requestId)
      .eq('status', 'pending_review');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to cancel request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Request cancelled successfully',
    });
  } catch (error) {
    console.error('Data request DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

function convertToCSV(data: any): string {
  // Simple CSV conversion for demonstration
  const lines: string[] = [];
  
  // Add headers
  lines.push('Category,Field,Value');
  
  // Add profile data
  if (data.profile) {
    Object.entries(data.profile).forEach(([key, value]) => {
      lines.push(`Profile,${key},"${value}"`);
    });
  }
  
  // Add other data categories
  Object.entries(data).forEach(([category, items]) => {
    if (category !== 'profile' && Array.isArray(items)) {
      items.forEach((item: any) => {
        Object.entries(item).forEach(([key, value]) => {
          lines.push(`${category},${key},"${value}"`);
        });
      });
    }
  });
  
  return lines.join('\n');
}

async function generatePDF(data: any): Promise<Buffer> {
  // PDF generation would use a library like pdfkit or puppeteer
  // For now, return a simple text representation
  const content = JSON.stringify(data, null, 2);
  return Buffer.from(content);
}