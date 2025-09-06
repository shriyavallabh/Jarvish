// Advanced WhatsApp Webhook Handler with Supabase Integration
// Handles webhook verification and message events

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, db } from '@/lib/supabase';
import crypto from 'crypto';

// Configuration
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'jarvish_webhook_verify_2024';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

// Verify webhook signature
function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!APP_SECRET) {
    console.warn('WhatsApp App Secret not configured');
    return true; // Allow in development
  }

  const expectedSignature = crypto
    .createHmac('sha256', APP_SECRET)
    .update(body)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

// Process different webhook event types
async function processWebhookEvent(event: any) {
  try {
    if (event.entry?.[0]?.changes?.[0]) {
      const change = event.entry[0].changes[0];
      const value = change.value;

      switch (change.field) {
        case 'messages':
          await handleIncomingMessage(value);
          break;
        
        case 'message_template_status_update':
          await handleTemplateStatusUpdate(value);
          break;
        
        case 'quality_update':
          await handleQualityUpdate(value);
          break;

        case 'message_status':
          await handleMessageStatus(value);
          break;
        
        default:
          console.log('Unhandled webhook event field:', change.field);
      }
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
}

// Handle incoming messages from users
async function handleIncomingMessage(value: any) {
  if (value.messages?.[0]) {
    const message = value.messages[0];
    const metadata = value.metadata || {};
    
    console.log('Incoming message received:', {
      from: message.from,
      type: message.type,
      timestamp: message.timestamp
    });

    // Store incoming message in database
    if (supabaseAdmin) {
      try {
        // Find advisor by WhatsApp number
        const { data: advisor } = await supabaseAdmin
          .from('advisors')
          .select('id')
          .eq('whatsapp_number', metadata.display_phone_number)
          .single();

        if (advisor) {
          // Log the incoming message
          await supabaseAdmin.from('whatsapp_messages').insert({
            advisor_id: advisor.id,
            recipient_phone: message.from,
            message_type: message.type,
            content: message.text?.body || message.caption || null,
            whatsapp_message_id: message.id,
            status: 'received',
            metadata: {
              timestamp: message.timestamp,
              context: message.context,
              referral: message.referral
            }
          });

          // Handle opt-out messages
          if (message.text?.body?.toLowerCase().includes('stop') || 
              message.text?.body?.toLowerCase().includes('unsubscribe')) {
            await handleOptOut(message.from, advisor.id);
          }

          // Handle opt-in messages
          if (message.text?.body?.toLowerCase().includes('start') || 
              message.text?.body?.toLowerCase().includes('subscribe')) {
            await handleOptIn(message.from, advisor.id);
          }
        }
      } catch (error) {
        console.error('Error storing incoming message:', error);
      }
    }
  }

  // Handle message status updates
  if (value.statuses?.[0]) {
    const status = value.statuses[0];
    await updateMessageStatus(status.id, status.status, status.errors);
  }
}

// Handle template status updates
async function handleTemplateStatusUpdate(value: any) {
  console.log('Template status update:', {
    template: value.message_template_name,
    status: value.event,
    reason: value.reason
  });

  if (supabaseAdmin) {
    try {
      // Update template status in database
      await supabaseAdmin
        .from('whatsapp_templates')
        .update({
          status: value.event,
          quality_score: value.quality_score,
          metadata: {
            reason: value.reason,
            language: value.language,
            updated_at: new Date().toISOString()
          }
        })
        .eq('name', value.message_template_name);
    } catch (error) {
      console.error('Error updating template status:', error);
    }
  }
}

// Handle quality score updates
async function handleQualityUpdate(value: any) {
  console.warn('Template quality update:', {
    template: value.message_template_name,
    previousScore: value.previous_quality_score,
    newScore: value.new_quality_score
  });

  if (supabaseAdmin) {
    try {
      // Update template quality score
      await supabaseAdmin
        .from('whatsapp_templates')
        .update({
          quality_score: value.new_quality_score,
          metadata: {
            previous_score: value.previous_quality_score,
            quality_updated_at: new Date().toISOString()
          }
        })
        .eq('name', value.message_template_name);

      // Pause template if quality drops to RED
      if (value.new_quality_score === 'RED') {
        await supabaseAdmin
          .from('whatsapp_templates')
          .update({ status: 'paused' })
          .eq('name', value.message_template_name);
        
        console.error(`Template ${value.message_template_name} paused due to RED quality score`);
      }
    } catch (error) {
      console.error('Error updating quality score:', error);
    }
  }
}

// Handle message delivery status updates
async function handleMessageStatus(value: any) {
  if (value.statuses?.[0]) {
    const status = value.statuses[0];
    await updateMessageStatus(status.id, status.status, status.errors);
  }
}

// Update message delivery status in database
async function updateMessageStatus(messageId: string, status: string, errors?: any) {
  if (!supabaseAdmin) return;

  try {
    const updates: any = { status };
    
    // Map WhatsApp status to our status
    const statusMap: Record<string, string> = {
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed'
    };

    const mappedStatus = statusMap[status] || status;
    
    // Add timestamps based on status
    if (mappedStatus === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    } else if (mappedStatus === 'read') {
      updates.read_at = new Date().toISOString();
    } else if (mappedStatus === 'sent') {
      updates.sent_at = new Date().toISOString();
    }

    // Add error message if failed
    if (errors) {
      updates.error_message = JSON.stringify(errors);
      updates.status = 'failed';
    }

    // Update message status
    await supabaseAdmin
      .from('whatsapp_messages')
      .update(updates)
      .eq('whatsapp_message_id', messageId);

    // Record analytics
    const { data: message } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('advisor_id')
      .eq('whatsapp_message_id', messageId)
      .single();

    if (message) {
      await supabaseAdmin.from('analytics').insert({
        advisor_id: message.advisor_id,
        metric_type: `whatsapp_message_${mappedStatus}`,
        metric_value: 1,
        dimension_1: mappedStatus,
        recorded_at: new Date().toISOString()
      });
    }

    console.log('Message status updated:', { messageId, status: mappedStatus });
  } catch (error) {
    console.error('Error updating message status:', error);
  }
}

// Handle opt-out
async function handleOptOut(phoneNumber: string, advisorId: string) {
  if (!supabaseAdmin) return;

  try {
    // Create opt-out record
    await supabaseAdmin.from('whatsapp_opt_outs').insert({
      advisor_id: advisorId,
      phone_number: phoneNumber,
      opted_out_at: new Date().toISOString()
    });

    console.log('User opted out:', phoneNumber);
  } catch (error) {
    console.error('Error handling opt-out:', error);
  }
}

// Handle opt-in
async function handleOptIn(phoneNumber: string, advisorId: string) {
  if (!supabaseAdmin) return;

  try {
    // Remove opt-out record if exists
    await supabaseAdmin
      .from('whatsapp_opt_outs')
      .delete()
      .eq('advisor_id', advisorId)
      .eq('phone_number', phoneNumber);

    console.log('User opted in:', phoneNumber);
  } catch (error) {
    console.error('Error handling opt-in:', error);
  }
}

// GET request handler - webhook verification
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('WhatsApp webhook verification attempt:', {
      mode,
      hasToken: !!token,
      hasChallenge: !!challenge
    });

    // Verify the webhook
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.warn('Invalid verification token');
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST request handler - webhook events
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    
    // Verify signature in production
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && !verifyWebhookSignature(bodyText, signature)) {
      console.warn('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('WhatsApp webhook received:', {
      hasEntry: !!body.entry,
      entryCount: body.entry?.length || 0,
      object: body.object
    });

    // Process the webhook event
    if (body.object === 'whatsapp_business_account') {
      await processWebhookEvent(body);
      
      // Respond quickly to acknowledge receipt
      return NextResponse.json(
        { status: 'EVENT_RECEIVED' },
        { status: 200 }
      );
    } else {
      console.warn('Unknown webhook object type:', body.object);
      return NextResponse.json(
        { error: 'Not Found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Still return 200 to prevent WhatsApp from retrying
    return NextResponse.json(
      { status: 'ERROR_PROCESSED' },
      { status: 200 }
    );
  }
}

// Export runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds timeout