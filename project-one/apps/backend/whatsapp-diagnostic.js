#!/usr/bin/env node

/**
 * WhatsApp Delivery Diagnostic Tool
 * Identifies why messages show "sent" but don't arrive
 */

const axios = require('axios');
const https = require('https');

// Configuration
const CONFIG = {
  accessToken: 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD',
  phoneNumberId: '574744175733556',
  businessAccountId: '1861646317956355',
  recipientPhone: '919765071249',
  apiVersion: 'v21.0'
};

const API_BASE = `https://graph.facebook.com/${CONFIG.apiVersion}`;

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colorMap = {
    error: colors.red,
    success: colors.green,
    warning: colors.yellow,
    info: colors.cyan,
    header: colors.blue + colors.bright
  };
  console.log(`${colorMap[type] || ''}[${timestamp}] ${message}${colors.reset}`);
}

function printSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'header');
  console.log('='.repeat(80) + '\n');
}

/**
 * 1. Check Phone Number Registration Status
 */
async function checkPhoneNumberStatus() {
  printSection('1. PHONE NUMBER STATUS CHECK');
  
  try {
    const response = await axios.get(
      `${API_BASE}/${CONFIG.phoneNumberId}`,
      {
        params: {
          fields: 'verified_name,code_verification_status,display_phone_number,quality_rating,status,name_status,certificate,is_pin_enabled,is_official_business_account,account_mode',
          access_token: CONFIG.accessToken
        }
      }
    );
    
    const data = response.data;
    
    log('Phone Number Details:', 'info');
    console.log('  Display Number:', data.display_phone_number || 'NOT SET');
    console.log('  Verified Name:', data.verified_name || 'NOT VERIFIED');
    console.log('  Quality Rating:', data.quality_rating || 'UNKNOWN');
    console.log('  Status:', data.status || 'UNKNOWN');
    console.log('  Name Status:', data.name_status || 'NOT SET');
    console.log('  Code Verification:', data.code_verification_status || 'NOT VERIFIED');
    console.log('  Certificate:', data.certificate || 'NONE');
    console.log('  PIN Enabled:', data.is_pin_enabled || false);
    console.log('  Official Business:', data.is_official_business_account || false);
    console.log('  Account Mode:', data.account_mode || 'UNKNOWN');
    
    // Critical checks
    if (data.quality_rating === 'FLAGGED' || data.quality_rating === 'RESTRICTED') {
      log(`CRITICAL: Phone number quality rating is ${data.quality_rating}!`, 'error');
      log('This prevents message delivery. Contact Meta support.', 'error');
      return false;
    }
    
    if (data.status !== 'CONNECTED') {
      log(`WARNING: Phone status is ${data.status}, should be CONNECTED`, 'warning');
      return false;
    }
    
    if (!data.certificate) {
      log('WARNING: No business verification certificate', 'warning');
      log('This may affect delivery to certain numbers', 'warning');
    }
    
    log('Phone number checks PASSED', 'success');
    return true;
    
  } catch (error) {
    log(`Failed to check phone status: ${error.response?.data?.error?.message || error.message}`, 'error');
    if (error.response?.data) {
      console.log('Full error:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * 2. Check Business Account Status
 */
async function checkBusinessAccountStatus() {
  printSection('2. BUSINESS ACCOUNT STATUS CHECK');
  
  try {
    const response = await axios.get(
      `${API_BASE}/${CONFIG.businessAccountId}`,
      {
        params: {
          fields: 'name,verification_status,country,timezone_id,message_template_namespace,account_review_status,business_verification_status,is_enabled_for_insights',
          access_token: CONFIG.accessToken
        }
      }
    );
    
    const data = response.data;
    
    log('Business Account Details:', 'info');
    console.log('  Name:', data.name || 'NOT SET');
    console.log('  Verification Status:', data.verification_status || 'NOT VERIFIED');
    console.log('  Business Verification:', data.business_verification_status || 'NOT VERIFIED');
    console.log('  Review Status:', data.account_review_status || 'UNKNOWN');
    console.log('  Country:', data.country || 'NOT SET');
    console.log('  Timezone:', data.timezone_id || 'NOT SET');
    console.log('  Template Namespace:', data.message_template_namespace || 'NOT SET');
    
    // Critical checks
    if (data.account_review_status === 'RESTRICTED' || data.account_review_status === 'DISABLED') {
      log(`CRITICAL: Account review status is ${data.account_review_status}!`, 'error');
      log('This prevents all messaging. Contact Meta support.', 'error');
      return false;
    }
    
    if (!data.verification_status || data.verification_status === 'NOT_VERIFIED') {
      log('WARNING: Business account not verified', 'warning');
      log('This limits messaging capabilities', 'warning');
    }
    
    log('Business account checks PASSED', 'success');
    return true;
    
  } catch (error) {
    log(`Failed to check business account: ${error.response?.data?.error?.message || error.message}`, 'error');
    return false;
  }
}

/**
 * 3. Check Recipient Phone Number Format and Status
 */
async function checkRecipientNumber() {
  printSection('3. RECIPIENT NUMBER VALIDATION');
  
  // Check format
  if (!CONFIG.recipientPhone.match(/^91\d{10}$/)) {
    log('ERROR: Invalid phone format. Should be 91XXXXXXXXXX (no + prefix)', 'error');
    return false;
  }
  
  log(`Checking recipient: ${CONFIG.recipientPhone}`, 'info');
  
  // Check if number is WhatsApp-enabled (this requires sending a contact check)
  try {
    const response = await axios.post(
      `${API_BASE}/${CONFIG.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: CONFIG.recipientPhone,
        type: 'contacts',
        contacts: [{
          name: {
            formatted_name: 'Test Contact',
            first_name: 'Test'
          }
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If we get here without error, the number exists on WhatsApp
    log('Recipient has WhatsApp account', 'success');
    log(`Contact check message ID: ${response.data.messages[0].id}`, 'info');
    return true;
    
  } catch (error) {
    if (error.response?.data?.error?.code === 131047) {
      log('ERROR: Recipient number not registered on WhatsApp!', 'error');
      log('Make sure the recipient has WhatsApp installed and active', 'error');
      return false;
    }
    
    if (error.response?.data?.error?.code === 131031) {
      log('WARNING: Customer has not initiated conversation (24-hour window expired)', 'warning');
      log('You can only send template messages to this number', 'warning');
      // This is actually OK for template messages
      return true;
    }
    
    log(`Contact check error: ${error.response?.data?.error?.message || error.message}`, 'warning');
    // Continue anyway as this might be a rate limit
    return true;
  }
}

/**
 * 4. Check Message Template Status
 */
async function checkTemplates() {
  printSection('4. MESSAGE TEMPLATE STATUS');
  
  try {
    const response = await axios.get(
      `${API_BASE}/${CONFIG.businessAccountId}/message_templates`,
      {
        params: {
          access_token: CONFIG.accessToken,
          limit: 100
        }
      }
    );
    
    const templates = response.data.data || [];
    
    log(`Found ${templates.length} templates:`, 'info');
    
    const approvedTemplates = templates.filter(t => t.status === 'APPROVED');
    const rejectedTemplates = templates.filter(t => t.status === 'REJECTED');
    const pendingTemplates = templates.filter(t => t.status === 'PENDING');
    
    console.log(`  Approved: ${approvedTemplates.length}`);
    console.log(`  Rejected: ${rejectedTemplates.length}`);
    console.log(`  Pending: ${pendingTemplates.length}`);
    
    if (approvedTemplates.length === 0) {
      log('WARNING: No approved templates available!', 'warning');
      log('You need at least one approved template for initial contact', 'warning');
      return false;
    }
    
    console.log('\nApproved Templates:');
    approvedTemplates.slice(0, 5).forEach(t => {
      console.log(`  - ${t.name} (${t.language}): ${t.category}`);
    });
    
    log('Template checks PASSED', 'success');
    return true;
    
  } catch (error) {
    log(`Failed to check templates: ${error.response?.data?.error?.message || error.message}`, 'error');
    return false;
  }
}

/**
 * 5. Send Test Message with Detailed Tracking
 */
async function sendTestMessage() {
  printSection('5. SENDING TEST MESSAGE WITH TRACKING');
  
  const testMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: CONFIG.recipientPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: `Test message from Jarvish at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. If you receive this, please reply YES.`
    }
  };
  
  log('Sending test message...', 'info');
  console.log('Message payload:', JSON.stringify(testMessage, null, 2));
  
  try {
    const response = await axios.post(
      `${API_BASE}/${CONFIG.phoneNumberId}/messages`,
      testMessage,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const messageId = response.data.messages[0].id;
    log(`Message sent successfully!`, 'success');
    log(`Message ID: ${messageId}`, 'info');
    
    // Wait and check status
    log('Waiting 5 seconds to check delivery status...', 'info');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get message status (Note: This requires webhook data in production)
    await checkMessageStatus(messageId);
    
    return messageId;
    
  } catch (error) {
    log('Failed to send test message!', 'error');
    
    if (error.response?.data?.error) {
      const err = error.response.data.error;
      console.log('\nError Details:');
      console.log('  Code:', err.code);
      console.log('  Type:', err.type);
      console.log('  Message:', err.message);
      console.log('  Error Subcode:', err.error_subcode);
      console.log('  Error User Title:', err.error_user_title);
      console.log('  Error User Message:', err.error_user_msg);
      
      // Common error interpretations
      interpretError(err.code);
    }
    
    return null;
  }
}

/**
 * 6. Check Message Status (requires webhook in production)
 */
async function checkMessageStatus(messageId) {
  printSection('6. MESSAGE DELIVERY STATUS');
  
  log(`Checking status for message: ${messageId}`, 'info');
  
  // Note: Real-time status requires webhook implementation
  log('NOTE: Real-time delivery status requires webhook setup', 'warning');
  log('Without webhooks, we can only confirm the message was accepted by WhatsApp', 'warning');
  
  // Try to get conversation info
  try {
    const response = await axios.get(
      `${API_BASE}/${CONFIG.phoneNumberId}/conversations`,
      {
        params: {
          access_token: CONFIG.accessToken,
          limit: 10
        }
      }
    );
    
    if (response.data.data && response.data.data.length > 0) {
      log('Recent conversations found:', 'info');
      response.data.data.slice(0, 3).forEach(conv => {
        console.log(`  - ID: ${conv.id}, Origin: ${conv.origin?.type || 'unknown'}`);
      });
    }
  } catch (error) {
    log('Could not fetch conversation data', 'warning');
  }
}

/**
 * 7. Check Webhook Configuration
 */
async function checkWebhookConfig() {
  printSection('7. WEBHOOK CONFIGURATION CHECK');
  
  try {
    const response = await axios.get(
      `${API_BASE}/${CONFIG.businessAccountId}/subscribed_apps`,
      {
        params: {
          access_token: CONFIG.accessToken
        }
      }
    );
    
    if (response.data.data && response.data.data.length > 0) {
      log('Webhook subscriptions found:', 'success');
      response.data.data.forEach(app => {
        console.log(`  App ID: ${app.whatsapp_business_api_data?.id || app.id}`);
        console.log(`  Subscribed fields: ${app.whatsapp_business_api_data?.subscribed_fields?.join(', ') || 'none'}`);
      });
    } else {
      log('WARNING: No webhook subscriptions configured!', 'warning');
      log('Webhooks are required for delivery status tracking', 'warning');
      log('Set up webhooks to receive:', 'info');
      console.log('  - messages (incoming messages)');
      console.log('  - message_status (delivery status updates)');
      console.log('  - message_template_status_update (template approvals)');
    }
    
  } catch (error) {
    log('Could not check webhook config', 'warning');
  }
}

/**
 * 8. Network and SSL Check
 */
async function checkNetworkAndSSL() {
  printSection('8. NETWORK AND SSL CHECK');
  
  try {
    // Check SSL certificate
    const url = new URL(API_BASE);
    
    await new Promise((resolve, reject) => {
      https.get(url.href, (res) => {
        const cert = res.socket.getPeerCertificate();
        
        if (cert) {
          log('SSL Certificate Valid:', 'success');
          console.log('  Issuer:', cert.issuer?.O || 'Unknown');
          console.log('  Valid Until:', cert.valid_to);
          
          const validTo = new Date(cert.valid_to);
          const daysLeft = Math.floor((validTo - new Date()) / (1000 * 60 * 60 * 24));
          
          if (daysLeft < 30) {
            log(`WARNING: Certificate expires in ${daysLeft} days`, 'warning');
          }
        }
        
        resolve();
      }).on('error', reject);
    });
    
    // Check API endpoint reachability
    const pingStart = Date.now();
    await axios.get(`${API_BASE}/`, { 
      params: { access_token: CONFIG.accessToken },
      timeout: 5000 
    });
    const pingTime = Date.now() - pingStart;
    
    log(`API Response Time: ${pingTime}ms`, 'info');
    
    if (pingTime > 2000) {
      log('WARNING: High API latency detected', 'warning');
    }
    
  } catch (error) {
    log('Network connectivity issues detected', 'error');
    console.log(error.message);
  }
}

/**
 * Interpret common error codes
 */
function interpretError(code) {
  const errorMap = {
    131047: 'Recipient number not on WhatsApp',
    131031: '24-hour window expired - use template message',
    131026: 'Message failed to send - recipient may have blocked you',
    131048: 'Template does not exist or is not approved',
    131051: 'Message type not supported',
    131052: 'Media file size too large',
    131053: 'Media file type not supported',
    100: 'Invalid parameter - check your request format',
    200: 'Permission denied - check access token',
    368: 'Temporarily blocked for policy violation',
    470: 'Rate limit exceeded',
    80007: 'Phone number not verified or connected'
  };
  
  if (errorMap[code]) {
    log(`DIAGNOSIS: ${errorMap[code]}`, 'error');
  }
}

/**
 * Generate comprehensive report
 */
async function generateReport(results) {
  printSection('DIAGNOSTIC REPORT');
  
  const issues = [];
  const recommendations = [];
  
  // Analyze results
  if (!results.phoneStatus) {
    issues.push('Phone number registration or quality issues');
    recommendations.push('1. Check phone number quality rating in Meta Business Suite');
    recommendations.push('2. Ensure phone number is properly verified');
  }
  
  if (!results.businessStatus) {
    issues.push('Business account verification or restriction issues');
    recommendations.push('1. Complete business verification in Meta Business Suite');
    recommendations.push('2. Check for any policy violations');
  }
  
  if (!results.recipientValid) {
    issues.push('Recipient number issues');
    recommendations.push('1. Verify recipient has WhatsApp installed and active');
    recommendations.push('2. Check if recipient has blocked your number');
  }
  
  if (!results.templatesAvailable) {
    issues.push('No approved message templates');
    recommendations.push('1. Create and submit message templates for approval');
    recommendations.push('2. Wait 1-2 business days for approval');
  }
  
  if (!results.webhooksConfigured) {
    issues.push('Webhooks not configured');
    recommendations.push('1. Set up webhook endpoint for delivery status');
    recommendations.push('2. Subscribe to message_status events');
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  
  if (issues.length === 0) {
    log('ALL CHECKS PASSED!', 'success');
    log('Message delivery should be working correctly.', 'success');
    log('\nIf messages still don\'t arrive:', 'info');
    console.log('  1. Check if recipient has blocked your number');
    console.log('  2. Verify recipient has good network connectivity');
    console.log('  3. Check Meta Business Suite for any account warnings');
    console.log('  4. Try sending to a different number to isolate the issue');
  } else {
    log(`FOUND ${issues.length} ISSUE(S)`, 'error');
    
    console.log('\nIssues Identified:');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    
    console.log('\nRecommended Actions:');
    recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Main diagnostic flow
 */
async function runDiagnostics() {
  console.clear();
  console.log(colors.bright + colors.cyan);
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║               WHATSAPP DELIVERY DIAGNOSTIC TOOL - JARVISH                 ║');
  console.log('║                    Identifying Why Messages Don\'t Arrive                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  console.log('\nConfiguration:');
  console.log(`  Phone Number ID: ${CONFIG.phoneNumberId}`);
  console.log(`  Business Account: ${CONFIG.businessAccountId}`);
  console.log(`  Recipient: +${CONFIG.recipientPhone}`);
  console.log(`  API Version: ${CONFIG.apiVersion}`);
  
  const results = {
    phoneStatus: false,
    businessStatus: false,
    recipientValid: false,
    templatesAvailable: false,
    messageId: null,
    webhooksConfigured: false
  };
  
  try {
    // Run all diagnostic checks
    results.phoneStatus = await checkPhoneNumberStatus();
    results.businessStatus = await checkBusinessAccountStatus();
    results.recipientValid = await checkRecipientNumber();
    results.templatesAvailable = await checkTemplates();
    
    // Only send test if basics are OK
    if (results.phoneStatus && results.businessStatus && results.recipientValid) {
      results.messageId = await sendTestMessage();
    }
    
    await checkWebhookConfig();
    results.webhooksConfigured = true; // Set based on actual check
    
    await checkNetworkAndSSL();
    
  } catch (error) {
    log(`Diagnostic error: ${error.message}`, 'error');
  }
  
  // Generate final report
  await generateReport(results);
  
  console.log('\n' + colors.bright + colors.yellow);
  console.log('IMMEDIATE ACTION ITEMS:');
  console.log('1. Set up webhook endpoint at your server to receive delivery status');
  console.log('2. Subscribe your app to webhook events in Meta Business Suite');
  console.log('3. Verify the recipient number has WhatsApp and hasn\'t blocked you');
  console.log('4. Check Meta Business Suite > WhatsApp > Phone Numbers for any warnings');
  console.log('5. Try sending a template message if regular messages fail');
  console.log(colors.reset);
}

// Run diagnostics
runDiagnostics().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});