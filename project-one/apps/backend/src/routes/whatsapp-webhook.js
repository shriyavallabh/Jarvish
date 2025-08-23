/**
 * WhatsApp Webhook Handler
 * Processes incoming webhooks from WhatsApp Cloud API
 * Handles message status updates, incoming messages, and quality alerts
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Import WhatsApp services
const WhatsAppCloudAPIClient = require('../services/whatsapp/cloud-api-client');
const WhatsAppQualityMonitor = require('../services/whatsapp/quality-monitor');

// Initialize quality monitor
const qualityMonitor = new WhatsAppQualityMonitor({
  alertThresholds: {
    blockRate: 0.02,
    reportRate: 0.01,
    failureRate: 0.05,
    minQuality: 'MEDIUM'
  }
});

// Store for webhook verification tokens (in production, use Redis)
const verificationTokens = new Map();

/**
 * Webhook verification endpoint
 * Called by WhatsApp when setting up webhook
 */
router.get('/webhook/whatsapp/verify', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Check if mode and token are correct
  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.error('WhatsApp webhook verification failed - invalid token');
      res.sendStatus(403);
    }
  } else {
    console.error('WhatsApp webhook verification failed - missing parameters');
    res.sendStatus(400);
  }
});

/**
 * Main webhook endpoint for receiving WhatsApp notifications
 */
router.post('/webhook/whatsapp/messages', async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(req)) {
      console.error('Invalid webhook signature');
      return res.sendStatus(401);
    }
    
    const { entry } = req.body;
    
    if (!entry || !Array.isArray(entry)) {
      return res.sendStatus(400);
    }
    
    // Process each entry
    for (const item of entry) {
      await processWebhookEntry(item);
    }
    
    // Acknowledge receipt immediately
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    res.sendStatus(500);
  }
});

/**
 * Status update webhook endpoint
 */
router.post('/webhook/whatsapp/status', async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(req)) {
      console.error('Invalid webhook signature');
      return res.sendStatus(401);
    }
    
    const { entry } = req.body;
    
    if (!entry || !Array.isArray(entry)) {
      return res.sendStatus(400);
    }
    
    // Process status updates
    for (const item of entry) {
      if (item.changes) {
        for (const change of item.changes) {
          if (change.field === 'messages' && change.value.statuses) {
            await processStatusUpdates(change.value.statuses);
          }
        }
      }
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing status webhook:', error);
    res.sendStatus(500);
  }
});

/**
 * Process webhook entry
 * @private
 */
async function processWebhookEntry(entry) {
  const { id, changes } = entry;
  
  for (const change of changes) {
    const { field, value } = change;
    
    if (field === 'messages') {
      // Process incoming messages
      if (value.messages) {
        for (const message of value.messages) {
          await processIncomingMessage(message, value.metadata);
        }
      }
      
      // Process status updates
      if (value.statuses) {
        await processStatusUpdates(value.statuses, value.metadata);
      }
      
      // Process errors
      if (value.errors) {
        for (const error of value.errors) {
          await processError(error, value.metadata);
        }
      }
    } else if (field === 'message_template_status_update') {
      // Template status update
      await processTemplateStatusUpdate(value);
    } else if (field === 'phone_number_quality_update') {
      // Quality rating update
      await processQualityUpdate(value);
    }
  }
}

/**
 * Process incoming message from user
 * @private
 */
async function processIncomingMessage(message, metadata) {
  const {
    from,
    id: messageId,
    timestamp,
    type,
    text,
    button,
    context
  } = message;
  
  console.log(`Incoming message from ${from}:`, {
    messageId,
    type,
    text: text?.body,
    timestamp: new Date(timestamp * 1000)
  });
  
  // Store message in database
  await storeIncomingMessage({
    phoneNumber: from,
    messageId,
    timestamp: new Date(timestamp * 1000),
    type,
    content: text?.body || button?.text || '',
    context: context?.id || null,
    metadata
  });
  
  // Check for opt-out keywords
  if (text?.body) {
    const lowerText = text.body.toLowerCase();
    if (lowerText === 'stop' || lowerText === 'unsubscribe' || lowerText === 'opt out') {
      await handleOptOut(from);
    }
  }
  
  // Emit event for processing
  global.eventEmitter?.emit('whatsapp:message:received', {
    from,
    messageId,
    type,
    content: text?.body,
    timestamp: new Date(timestamp * 1000)
  });
}

/**
 * Process message status updates
 * @private
 */
async function processStatusUpdates(statuses, metadata) {
  for (const status of statuses) {
    const {
      id: messageId,
      status: statusType,
      timestamp,
      recipient_id,
      errors,
      pricing
    } = status;
    
    console.log(`Message status update:`, {
      messageId,
      status: statusType,
      recipient: recipient_id,
      timestamp: new Date(timestamp * 1000)
    });
    
    // Update message status in database
    await updateMessageStatus({
      messageId,
      status: statusType,
      recipientId: recipient_id,
      timestamp: new Date(timestamp * 1000),
      errors,
      pricing
    });
    
    // Track with quality monitor
    switch (statusType) {
      case 'sent':
        qualityMonitor.trackMessage({
          phoneNumberId: metadata?.phone_number_id,
          messageId,
          timestamp: new Date(timestamp * 1000)
        });
        break;
        
      case 'delivered':
        global.eventEmitter?.emit('whatsapp:message:delivered', {
          messageId,
          recipientId: recipient_id,
          timestamp: new Date(timestamp * 1000)
        });
        break;
        
      case 'read':
        global.eventEmitter?.emit('whatsapp:message:read', {
          messageId,
          recipientId: recipient_id,
          timestamp: new Date(timestamp * 1000)
        });
        break;
        
      case 'failed':
        qualityMonitor.trackFailure({
          phoneNumberId: metadata?.phone_number_id,
          messageId,
          reason: errors?.[0]?.title || 'Unknown error',
          timestamp: new Date(timestamp * 1000)
        });
        
        global.eventEmitter?.emit('whatsapp:message:failed', {
          messageId,
          recipientId: recipient_id,
          errors,
          timestamp: new Date(timestamp * 1000)
        });
        break;
    }
  }
}

/**
 * Process error notifications
 * @private
 */
async function processError(error, metadata) {
  const { code, title, message, error_data } = error;
  
  console.error('WhatsApp error received:', {
    code,
    title,
    message,
    error_data
  });
  
  // Track with quality monitor
  qualityMonitor.trackFailure({
    phoneNumberId: metadata?.phone_number_id,
    reason: title,
    errorCode: code,
    timestamp: new Date()
  });
  
  // Handle specific error types
  if (code === 131049) {
    // User blocked business
    await handleUserBlock(error_data?.details);
  } else if (code === 131051) {
    // User reported business
    await handleUserReport(error_data?.details);
  }
  
  // Emit error event
  global.eventEmitter?.emit('whatsapp:error', {
    code,
    title,
    message,
    metadata
  });
}

/**
 * Process template status update
 * @private
 */
async function processTemplateStatusUpdate(update) {
  const {
    message_template_id,
    message_template_name,
    message_template_language,
    status,
    reason
  } = update;
  
  console.log('Template status update:', {
    templateId: message_template_id,
    name: message_template_name,
    language: message_template_language,
    status,
    reason
  });
  
  // Update template status in database
  await updateTemplateStatus({
    templateId: message_template_id,
    name: message_template_name,
    language: message_template_language,
    status,
    rejectionReason: reason
  });
  
  // Emit event for template manager
  global.eventEmitter?.emit('whatsapp:template:status_update', {
    templateId: message_template_id,
    status,
    reason
  });
}

/**
 * Process quality rating update
 * @private
 */
async function processQualityUpdate(update) {
  const {
    phone_number,
    current_quality_rating,
    previous_quality_rating
  } = update;
  
  console.log('Quality rating update:', {
    phoneNumber: phone_number,
    current: current_quality_rating,
    previous: previous_quality_rating
  });
  
  // Update quality monitor
  qualityMonitor.updateQualityRating(phone_number, current_quality_rating);
  
  // Store in database
  await updateQualityRating({
    phoneNumber: phone_number,
    currentRating: current_quality_rating,
    previousRating: previous_quality_rating,
    timestamp: new Date()
  });
  
  // Emit alert if quality degraded
  if (getQualityScore(current_quality_rating) < getQualityScore(previous_quality_rating)) {
    global.eventEmitter?.emit('whatsapp:quality:degraded', {
      phoneNumber: phone_number,
      current: current_quality_rating,
      previous: previous_quality_rating
    });
  }
}

/**
 * Handle user opt-out
 * @private
 */
async function handleOptOut(phoneNumber) {
  console.log(`User opted out: ${phoneNumber}`);
  
  // Update database
  await markUserOptedOut(phoneNumber);
  
  // Send confirmation (if within 24-hour window)
  // This would use the WhatsApp client to send a confirmation
  
  global.eventEmitter?.emit('whatsapp:user:opted_out', { phoneNumber });
}

/**
 * Handle user block
 * @private
 */
async function handleUserBlock(details) {
  const phoneNumber = details?.wa_id;
  
  if (phoneNumber) {
    console.log(`User blocked business: ${phoneNumber}`);
    
    // Track with quality monitor
    qualityMonitor.trackBlock({
      phoneNumberId: details?.phone_number_id,
      advisorId: details?.advisor_id,
      timestamp: new Date()
    });
    
    // Update database
    await markUserBlocked(phoneNumber);
    
    global.eventEmitter?.emit('whatsapp:user:blocked', { phoneNumber });
  }
}

/**
 * Handle user report
 * @private
 */
async function handleUserReport(details) {
  const phoneNumber = details?.wa_id;
  
  if (phoneNumber) {
    console.log(`User reported business: ${phoneNumber}`);
    
    // Track with quality monitor
    qualityMonitor.trackReport({
      phoneNumberId: details?.phone_number_id,
      advisorId: details?.advisor_id,
      templateName: details?.template_name,
      timestamp: new Date()
    });
    
    // Update database
    await markUserReported(phoneNumber);
    
    global.eventEmitter?.emit('whatsapp:user:reported', { phoneNumber });
  }
}

/**
 * Verify webhook signature
 * @private
 */
function verifyWebhookSignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  
  if (!signature) {
    return false;
  }
  
  const elements = signature.split('=');
  const signatureHash = elements[1];
  
  const expectedHash = crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET || '')
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return signatureHash === expectedHash;
}

/**
 * Get quality score
 * @private
 */
function getQualityScore(quality) {
  const scores = { HIGH: 3, MEDIUM: 2, LOW: 1, FLAGGED: 0 };
  return scores[quality] || 0;
}

// Database functions (implement based on your database choice)
async function storeIncomingMessage(data) {
  // Store in database
  console.log('Storing incoming message:', data);
}

async function updateMessageStatus(data) {
  // Update in database
  console.log('Updating message status:', data);
}

async function updateTemplateStatus(data) {
  // Update in database
  console.log('Updating template status:', data);
}

async function updateQualityRating(data) {
  // Update in database
  console.log('Updating quality rating:', data);
}

async function markUserOptedOut(phoneNumber) {
  // Update in database
  console.log('Marking user opted out:', phoneNumber);
}

async function markUserBlocked(phoneNumber) {
  // Update in database
  console.log('Marking user blocked:', phoneNumber);
}

async function markUserReported(phoneNumber) {
  // Update in database
  console.log('Marking user reported:', phoneNumber);
}

// Quality monitor event handlers
qualityMonitor.on('quality:alert', (data) => {
  console.log('Quality alert:', data);
  // Send alert to operations team
});

qualityMonitor.on('action:pause_messaging', (data) => {
  console.log('Pausing messaging for:', data.phoneNumberId);
  // Implement pause logic
});

qualityMonitor.on('action:activate_backup', (data) => {
  console.log('Activating backup for:', data.phoneNumberId);
  // Implement backup activation
});

qualityMonitor.on('template:suspend', (data) => {
  console.log('Suspending template:', data.templateName);
  // Implement template suspension
});

module.exports = router;