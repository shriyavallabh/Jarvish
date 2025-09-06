#!/usr/bin/env node

/**
 * WhatsApp Webhook Server - Track Delivery Status
 * Run this to see real-time message status updates
 */

const express = require('express');
const bodyParser = require('body-parser');
const ngrok = require('ngrok');

const app = express();
const PORT = 3001;

// Configuration
const VERIFY_TOKEN = 'jarvish_verify_2024';

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
  const timestamp = new Date().toLocaleTimeString('en-IN');
  const colorMap = {
    error: colors.red,
    success: colors.green,
    warning: colors.yellow,
    info: colors.cyan,
    status: colors.magenta + colors.bright
  };
  
  console.log(`${colorMap[type] || ''}[${timestamp}] ${message}${colors.reset}`);
}

// Store message statuses
const messageStatuses = new Map();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    log('✅ Webhook verified successfully!', 'success');
    res.status(200).send(challenge);
  } else {
    log('❌ Webhook verification failed', 'error');
    res.sendStatus(403);
  }
});

// Webhook handler (POST)
app.post('/webhook', (req, res) => {
  const body = req.body;
  
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

// Process WhatsApp events
function processWhatsAppEvent(change) {
  const value = change.value;
  
  // Handle incoming messages
  if (value.messages) {
    value.messages.forEach(message => {
      log('📨 INCOMING MESSAGE', 'status');
      log(`From: +${message.from}`, 'info');
      log(`Type: ${message.type}`, 'info');
      log(`Text: ${message.text?.body || '[Non-text]'}`, 'info');
      console.log('');
    });
  }
  
  // Handle status updates
  if (value.statuses) {
    value.statuses.forEach(status => {
      const messageId = status.id;
      const recipientId = status.recipient_id;
      const statusValue = status.status;
      const timestamp = new Date(status.timestamp * 1000).toLocaleTimeString('en-IN');
      
      // Store status
      if (!messageStatuses.has(messageId)) {
        messageStatuses.set(messageId, []);
      }
      messageStatuses.get(messageId).push({
        status: statusValue,
        timestamp,
        recipient: recipientId
      });
      
      // Display status
      const statusIcons = {
        sent: '📤 SENT',
        delivered: '✅ DELIVERED',
        read: '👁️  READ',
        failed: '❌ FAILED'
      };
      
      const icon = statusIcons[statusValue] || '📋 ' + statusValue.toUpperCase();
      
      log(`${icon}`, 'status');
      log(`To: +${recipientId}`, 'info');
      log(`Message ID: ${messageId}`, 'info');
      log(`Time: ${timestamp}`, 'info');
      
      // Show delivery chain
      if (statusValue === 'delivered' || statusValue === 'read') {
        const chain = messageStatuses.get(messageId);
        if (chain.length > 1) {
          log('Delivery Chain:', 'success');
          chain.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.status.toUpperCase()} at ${s.timestamp}`);
          });
        }
      }
      
      // Handle failures
      if (statusValue === 'failed') {
        log('❌ MESSAGE DELIVERY FAILED!', 'error');
        if (status.errors) {
          status.errors.forEach(error => {
            log(`Error: ${error.code} - ${error.title}`, 'error');
          });
        }
      }
      
      console.log('');
    });
  }
  
  // Handle errors
  if (value.errors) {
    value.errors.forEach(error => {
      log('❌ ERROR EVENT', 'error');
      log(`Code: ${error.code}`, 'error');
      log(`Message: ${error.message || error.title}`, 'error');
      console.log('');
    });
  }
}

// Status endpoint
app.get('/status', (req, res) => {
  const statuses = [];
  messageStatuses.forEach((chain, messageId) => {
    statuses.push({
      message_id: messageId,
      statuses: chain
    });
  });
  
  res.json({
    webhook_active: true,
    messages_tracked: messageStatuses.size,
    statuses
  });
});

// Start server and create ngrok tunnel
async function startServer() {
  return new Promise((resolve) => {
    app.listen(PORT, async () => {
      console.log(colors.bright + colors.green);
      console.log('╔════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                    WHATSAPP WEBHOOK SERVER - LIVE STATUS                  ║');
      console.log('╚════════════════════════════════════════════════════════════════════════════╝');
      console.log(colors.reset);
      
      log(`Webhook server running on port ${PORT}`, 'success');
      
      try {
        // Create ngrok tunnel
        const url = await ngrok.connect(PORT);
        const webhookUrl = `${url}/webhook`;
        
        console.log('\n' + colors.bright + colors.green);
        console.log('📡 WEBHOOK URL READY!');
        console.log('═'.repeat(80));
        console.log(colors.reset);
        
        console.log('\n' + colors.yellow + 'SETUP INSTRUCTIONS:' + colors.reset);
        console.log('\n1. Go to Meta Business Suite:');
        console.log('   https://business.facebook.com/settings/whatsapp-business-accounts/' + colors.cyan + '1861646317956355' + colors.reset);
        
        console.log('\n2. Click on "Configure Webhooks"');
        
        console.log('\n3. Set these values:');
        console.log('   Callback URL: ' + colors.bright + colors.cyan + webhookUrl + colors.reset);
        console.log('   Verify Token: ' + colors.bright + colors.cyan + VERIFY_TOKEN + colors.reset);
        
        console.log('\n4. Subscribe to these fields:');
        console.log('   ✓ messages');
        console.log('   ✓ message_status');
        console.log('   ✓ message_errors');
        
        console.log('\n5. Click "Verify and Save"');
        
        console.log('\n' + colors.green + '✅ Once configured, you will see real-time message status here!' + colors.reset);
        console.log('\n' + colors.yellow + '⚠️  Keep this terminal open to receive webhook events' + colors.reset);
        
        console.log('\n' + '═'.repeat(80));
        console.log(colors.bright + 'Waiting for webhook events...' + colors.reset);
        console.log('═'.repeat(80) + '\n');
        
        resolve(url);
      } catch (error) {
        log('Failed to create ngrok tunnel', 'error');
        console.log('Install ngrok: npm install -g ngrok');
        resolve(null);
      }
    });
  });
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n' + colors.yellow + 'Shutting down webhook server...' + colors.reset);
  await ngrok.kill();
  process.exit(0);
});

// Start the server
startServer();