#!/usr/bin/env node

/**
 * WhatsApp Webhook Handler
 * Receives and processes delivery status updates
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;

// Configuration
const CONFIG = {
  verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'jarvish_verify_token_2024',
  appSecret: process.env.APP_SECRET || '', // Get from Meta App Dashboard
  logFile: path.join(__dirname, 'whatsapp-delivery-log.json')
};

// Store delivery status in memory (use Redis in production)
const deliveryStatus = new Map();
const messageLog = [];

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info', data = null) {
  const timestamp = new Date().toISOString();
  const colorMap = {
    error: colors.red,
    success: colors.green,
    warning: colors.yellow,
    info: colors.cyan,
    status: colors.blue + colors.bright
  };
  
  console.log(`${colorMap[type] || ''}[${timestamp}] ${message}${colors.reset}`);
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Log to file
  const logEntry = {
    timestamp,
    type,
    message,
    data
  };
  
  messageLog.push(logEntry);
  
  // Keep only last 1000 entries
  if (messageLog.length > 1000) {
    messageLog.shift();
  }
  
  // Save to file
  saveLogToFile();
}

function saveLogToFile() {
  try {
    fs.writeFileSync(CONFIG.logFile, JSON.stringify(messageLog, null, 2));
  } catch (error) {
    console.error('Failed to save log:', error.message);
  }
}

/**
 * Webhook verification endpoint (GET)
 * Meta will call this to verify the webhook URL
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  log('Webhook verification request received', 'info');
  
  if (mode && token) {
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
      log('Webhook verified successfully!', 'success');
      res.status(200).send(challenge);
    } else {
      log('Webhook verification failed - invalid token', 'error');
      res.sendStatus(403);
    }
  } else {
    log('Webhook verification failed - missing parameters', 'error');
    res.sendStatus(400);
  }
});

/**
 * Webhook message handler (POST)
 * Receives all WhatsApp events
 */
app.post('/webhook', (req, res) => {
  const body = req.body;
  
  // Verify webhook signature if app secret is configured
  if (CONFIG.appSecret) {
    const signature = req.headers['x-hub-signature-256'];
    if (!verifyWebhookSignature(req.rawBody || JSON.stringify(body), signature)) {
      log('Invalid webhook signature!', 'error');
      return res.sendStatus(401);
    }
  }
  
  // Process WhatsApp Business API event
  if (body.object === 'whatsapp_business_account') {
    body.entry?.forEach(entry => {
      entry.changes?.forEach(change => {
        processWhatsAppEvent(change);
      });
    });
    
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  if (!CONFIG.appSecret || !signature) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', CONFIG.appSecret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}

/**
 * Process WhatsApp events
 */
function processWhatsAppEvent(change) {
  const value = change.value;
  
  // Handle different event types
  if (value.messages) {
    // Incoming message
    value.messages.forEach(message => {
      log('📨 INCOMING MESSAGE', 'status', {
        from: message.from,
        type: message.type,
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        text: message.text?.body || '[Non-text message]'
      });
    });
  }
  
  if (value.statuses) {
    // Message status update
    value.statuses.forEach(status => {
      processStatusUpdate(status);
    });
  }
  
  if (value.errors) {
    // Error events
    value.errors.forEach(error => {
      log('❌ ERROR EVENT', 'error', {
        code: error.code,
        title: error.title,
        message: error.message,
        error_data: error.error_data
      });
      
      interpretDeliveryError(error);
    });
  }
}

/**
 * Process message status updates
 */
function processStatusUpdate(status) {
  const messageId = status.id;
  const recipientId = status.recipient_id;
  const statusValue = status.status;
  const timestamp = new Date(status.timestamp * 1000).toISOString();
  
  // Store status
  if (!deliveryStatus.has(messageId)) {
    deliveryStatus.set(messageId, {
      recipient: recipientId,
      statuses: []
    });
  }
  
  const messageInfo = deliveryStatus.get(messageId);
  messageInfo.statuses.push({
    status: statusValue,
    timestamp
  });
  
  // Log based on status type
  const statusIcons = {
    sent: '📤',
    delivered: '✅',
    read: '👁️',
    failed: '❌',
    deleted: '🗑️'
  };
  
  const icon = statusIcons[statusValue] || '📋';
  const logType = statusValue === 'failed' ? 'error' : 'success';
  
  log(`${icon} MESSAGE ${statusValue.toUpperCase()}`, logType, {
    messageId,
    recipient: recipientId,
    timestamp,
    errors: status.errors
  });
  
  // Analyze delivery issues
  if (statusValue === 'failed') {
    analyzeDeliveryFailure(status);
  }
  
  // Show delivery chain
  if (statusValue === 'delivered' || statusValue === 'read') {
    showDeliveryChain(messageId);
  }
}

/**
 * Analyze delivery failure
 */
function analyzeDeliveryFailure(status) {
  log('🔍 ANALYZING DELIVERY FAILURE', 'warning');
  
  if (status.errors && status.errors.length > 0) {
    status.errors.forEach(error => {
      interpretDeliveryError(error);
    });
  } else {
    log('No specific error details provided', 'warning');
    log('Common reasons for delivery failure:', 'info');
    console.log('  1. Recipient has blocked your number');
    console.log('  2. Recipient number is no longer on WhatsApp');
    console.log('  3. Network issues on recipient\'s device');
    console.log('  4. Recipient\'s phone is off or has no internet');
  }
}

/**
 * Interpret delivery errors
 */
function interpretDeliveryError(error) {
  const errorCode = error.code;
  const errorTitle = error.title || error.error_data?.details;
  
  log(`ERROR CODE ${errorCode}: ${errorTitle}`, 'error');
  
  const solutions = {
    131026: {
      reason: 'Message failed to send - recipient may have blocked the sender',
      solution: 'The recipient needs to unblock your number or initiate contact first'
    },
    131047: {
      reason: 'Recipient phone number is not on WhatsApp',
      solution: 'Verify the recipient has WhatsApp installed and the number is correct'
    },
    131031: {
      reason: '24-hour session window has expired',
      solution: 'Send a template message or wait for customer to message you first'
    },
    131048: {
      reason: 'Template not found or not approved',
      solution: 'Check template name and ensure it\'s approved in Business Manager'
    },
    470: {
      reason: 'Rate limit exceeded',
      solution: 'Slow down message sending rate or upgrade your tier'
    },
    131051: {
      reason: 'Unsupported message type',
      solution: 'Check that the message type is supported for your account'
    },
    131052: {
      reason: 'Media size too large',
      solution: 'Reduce media file size (images <5MB, videos <16MB)'
    }
  };
  
  const errorInfo = solutions[errorCode];
  if (errorInfo) {
    log(`📋 REASON: ${errorInfo.reason}`, 'warning');
    log(`💡 SOLUTION: ${errorInfo.solution}`, 'info');
  }
}

/**
 * Show complete delivery chain for a message
 */
function showDeliveryChain(messageId) {
  const messageInfo = deliveryStatus.get(messageId);
  
  if (messageInfo) {
    log('📊 DELIVERY CHAIN', 'info');
    console.log(`  Message ID: ${messageId}`);
    console.log(`  Recipient: ${messageInfo.recipient}`);
    console.log('  Status Timeline:');
    
    messageInfo.statuses.forEach((status, index) => {
      const duration = index > 0 
        ? calculateDuration(messageInfo.statuses[index - 1].timestamp, status.timestamp)
        : '';
      
      console.log(`    ${index + 1}. ${status.status.toUpperCase()} at ${status.timestamp} ${duration}`);
    });
    
    // Calculate total delivery time
    if (messageInfo.statuses.length >= 2) {
      const firstStatus = messageInfo.statuses[0];
      const lastStatus = messageInfo.statuses[messageInfo.statuses.length - 1];
      const totalTime = calculateDuration(firstStatus.timestamp, lastStatus.timestamp);
      console.log(`  Total Delivery Time: ${totalTime}`);
    }
  }
}

/**
 * Calculate duration between timestamps
 */
function calculateDuration(start, end) {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diffMs = endTime - startTime;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return `(+${diffSec}s)`;
  } else {
    const diffMin = Math.floor(diffSec / 60);
    return `(+${diffMin}m ${diffSec % 60}s)`;
  }
}

/**
 * Status dashboard endpoint
 */
app.get('/status', (req, res) => {
  const summary = {
    webhook_active: true,
    total_messages_tracked: deliveryStatus.size,
    recent_messages: [],
    delivery_statistics: {
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0
    }
  };
  
  // Get recent messages
  const recentMessages = Array.from(deliveryStatus.entries()).slice(-10);
  
  recentMessages.forEach(([messageId, info]) => {
    const latestStatus = info.statuses[info.statuses.length - 1];
    summary.recent_messages.push({
      message_id: messageId,
      recipient: info.recipient,
      latest_status: latestStatus.status,
      timestamp: latestStatus.timestamp
    });
    
    // Count statistics
    info.statuses.forEach(status => {
      if (summary.delivery_statistics[status.status] !== undefined) {
        summary.delivery_statistics[status.status]++;
      }
    });
  });
  
  res.json(summary);
});

/**
 * Get delivery status for specific message
 */
app.get('/status/:messageId', (req, res) => {
  const messageId = req.params.messageId;
  const messageInfo = deliveryStatus.get(messageId);
  
  if (messageInfo) {
    res.json({
      message_id: messageId,
      ...messageInfo
    });
  } else {
    res.status(404).json({
      error: 'Message not found',
      message_id: messageId
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    messages_tracked: deliveryStatus.size,
    webhook_url: `http://your-domain.com:${PORT}/webhook`
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(colors.bright + colors.green);
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              WHATSAPP WEBHOOK HANDLER - DELIVERY TRACKING                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  log(`Webhook server running on port ${PORT}`, 'success');
  console.log('\nEndpoints:');
  console.log(`  Webhook:     http://localhost:${PORT}/webhook`);
  console.log(`  Status:      http://localhost:${PORT}/status`);
  console.log(`  Health:      http://localhost:${PORT}/health`);
  console.log(`  Message:     http://localhost:${PORT}/status/:messageId`);
  
  console.log('\n📌 SETUP INSTRUCTIONS:');
  console.log('1. Use ngrok to expose this webhook to the internet:');
  console.log(`   ngrok http ${PORT}`);
  console.log('\n2. Configure webhook in Meta Business Suite:');
  console.log('   - Go to WhatsApp > Configuration > Webhooks');
  console.log('   - Set Callback URL to: https://your-ngrok-url.ngrok.io/webhook');
  console.log(`   - Set Verify Token to: ${CONFIG.verifyToken}`);
  console.log('   - Subscribe to: messages, message_status');
  console.log('\n3. Test by sending a message and watching this console');
  
  // Load previous log if exists
  if (fs.existsSync(CONFIG.logFile)) {
    try {
      const savedLog = JSON.parse(fs.readFileSync(CONFIG.logFile, 'utf8'));
      messageLog.push(...savedLog.slice(-100)); // Load last 100 entries
      log(`Loaded ${messageLog.length} previous log entries`, 'info');
    } catch (error) {
      log('Could not load previous log', 'warning');
    }
  }
});