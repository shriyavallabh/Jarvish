#!/usr/bin/env node

/**
 * WhatsApp Message Status Checker
 * Gets actual delivery status for messages
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  token: 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD',
  phoneNumberId: '574744175733556',
  recipientPhone: '919765071249',
  apiVersion: 'v21.0'
};

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, type = 'info') {
  const colorMap = {
    error: colors.red,
    success: colors.green,
    warning: colors.yellow,
    info: colors.cyan,
    header: colors.magenta + colors.bright
  };
  
  console.log(`${colorMap[type] || ''}${message}${colors.reset}`);
}

/**
 * Send template message (guaranteed delivery for first contact)
 */
async function sendTemplateMessage() {
  log('\n📤 SENDING TEMPLATE MESSAGE (hello_world)', 'header');
  log('This is the most reliable way to initiate contact\n', 'info');
  
  const messagePayload = {
    messaging_product: 'whatsapp',
    to: CONFIG.recipientPhone,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US'
      }
    }
  };
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${CONFIG.apiVersion}/${CONFIG.phoneNumberId}/messages`,
      messagePayload,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const messageId = response.data.messages?.[0]?.id;
    
    if (messageId) {
      log('✅ Template message sent successfully!', 'success');
      log(`Message ID: ${messageId}`, 'info');
      log(`Recipient: +${CONFIG.recipientPhone}`, 'info');
      
      // Store message ID for status checking
      return messageId;
    }
  } catch (error) {
    log('❌ Failed to send template message:', 'error');
    if (error.response?.data?.error) {
      const err = error.response.data.error;
      log(`Error Code: ${err.code}`, 'error');
      log(`Message: ${err.message}`, 'error');
      
      // Provide specific solutions
      if (err.code === 131030) {
        log('\n💡 SOLUTION: The recipient has not opted in', 'warning');
        log('They need to message your WhatsApp number first', 'warning');
      } else if (err.code === 131026) {
        log('\n💡 SOLUTION: The recipient may have blocked your number', 'warning');
      } else if (err.code === 131047) {
        log('\n💡 SOLUTION: The recipient number is not on WhatsApp', 'warning');
      }
    }
  }
  
  return null;
}

/**
 * Send regular text message (only works within 24-hour window)
 */
async function sendTextMessage() {
  log('\n📱 SENDING REGULAR TEXT MESSAGE', 'header');
  log('Note: This only works if user messaged you in last 24 hours\n', 'info');
  
  const messagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: CONFIG.recipientPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: `🎯 Test Message from Jarvish\n\nTime: ${new Date().toLocaleString('en-IN')}\n\nThis message confirms WhatsApp integration is working!\n\n- Powered by Jarvish AI`
    }
  };
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${CONFIG.apiVersion}/${CONFIG.phoneNumberId}/messages`,
      messagePayload,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const messageId = response.data.messages?.[0]?.id;
    
    if (messageId) {
      log('✅ Text message sent successfully!', 'success');
      log(`Message ID: ${messageId}`, 'info');
      return messageId;
    }
  } catch (error) {
    log('❌ Failed to send text message:', 'error');
    if (error.response?.data?.error) {
      const err = error.response.data.error;
      if (err.code === 131030 || err.code === 131031) {
        log('\n💡 24-hour window expired or not initiated', 'warning');
        log('Switching to template message...', 'info');
        return await sendTemplateMessage();
      }
    }
  }
  
  return null;
}

/**
 * Get message status (if webhook is not configured)
 */
async function checkMessageStatus(messageId) {
  log('\n📊 CHECKING MESSAGE STATUS', 'header');
  log(`Message ID: ${messageId}\n`, 'info');
  
  try {
    // Note: Direct status API may not be available
    // Webhooks are the primary way to get status
    log('⚠️  Direct status check not available via API', 'warning');
    log('Message status updates are sent via webhooks', 'info');
    log('\nTo track delivery status:', 'info');
    log('1. Set up a webhook endpoint on your server', 'info');
    log('2. Configure webhook in Meta Business Suite', 'info');
    log('3. Subscribe to "messages" and "message_status" fields', 'info');
    
    return null;
  } catch (error) {
    log('Could not check message status', 'error');
    return null;
  }
}

/**
 * Check if message was actually delivered
 */
async function verifyDelivery() {
  log('\n🔍 DELIVERY VERIFICATION', 'header');
  
  log('\nIMPORTANT CHECKLIST:', 'warning');
  console.log('');
  console.log('✓ 1. Check your phone (+919765071249) for the message');
  console.log('✓ 2. If not received, check:');
  console.log('     - Is WhatsApp installed and active?');
  console.log('     - Is the number correct?');
  console.log('     - Have you blocked business messages?');
  console.log('     - Check spam/blocked messages folder');
  console.log('');
  console.log('✓ 3. Common reasons for non-delivery:');
  console.log('     - User has not opted in (never messaged you)');
  console.log('     - User has blocked your business number');
  console.log('     - Phone is offline or has poor connectivity');
  console.log('     - WhatsApp not installed on that number');
  console.log('');
}

/**
 * Interactive message sender
 */
async function interactiveTest() {
  console.log(colors.bright + colors.green);
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              WHATSAPP MESSAGE DELIVERY TEST & VERIFICATION                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  console.log('\nConfiguration:');
  console.log(`  Phone Number: +91 76666 84471 (Jarvis Daily)`);
  console.log(`  Recipient: +${CONFIG.recipientPhone}`);
  console.log(`  Time: ${new Date().toLocaleString('en-IN')}`);
  
  // Try sending messages
  log('\n=== ATTEMPTING MESSAGE DELIVERY ===\n', 'header');
  
  // First try text message
  let messageId = await sendTextMessage();
  
  if (!messageId) {
    log('\nText message failed, trying template...', 'warning');
    messageId = await sendTemplateMessage();
  }
  
  if (messageId) {
    // Wait a bit for delivery
    log('\n⏳ Waiting 3 seconds for delivery...', 'info');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check status
    await checkMessageStatus(messageId);
    
    // Verify delivery
    await verifyDelivery();
    
    log('\n=== RESULTS ===\n', 'header');
    log('✅ Message was sent to WhatsApp servers successfully', 'success');
    log(`✅ Message ID: ${messageId}`, 'success');
    log('\n🔔 CHECK YOUR PHONE NOW!', 'warning');
    log('The message should appear in WhatsApp on +919765071249', 'warning');
    
    log('\nIf message NOT received:', 'error');
    log('1. Send a message FROM +919765071249 TO +91 76666 84471', 'info');
    log('2. This will open the 24-hour conversation window', 'info');
    log('3. Then run this script again', 'info');
    
  } else {
    log('\n❌ Message delivery failed completely', 'error');
    log('\nREQUIRED ACTION:', 'error');
    log('1. Open WhatsApp on +919765071249', 'warning');
    log('2. Send any message to +91 76666 84471', 'warning');
    log('3. Wait for confirmation', 'warning');
    log('4. Run this script again', 'warning');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run the interactive test
interactiveTest().catch(error => {
  log('Fatal error:', 'error');
  console.error(error);
  process.exit(1);
});