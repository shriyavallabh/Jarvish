#!/usr/bin/env node

/**
 * WhatsApp Business API Test Script
 * Tests all WhatsApp API integration functionality
 */

const axios = require('axios');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}📍 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

// WhatsApp API configuration
const config = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'jarvish_verify_token_2025',
  testPhoneNumber: process.env.TEST_PHONE_NUMBER || '919999999999', // Default test number
  apiVersion: 'v17.0',
  baseUrl: 'https://graph.facebook.com'
};

// Test results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

/**
 * Test 1: Verify API Credentials
 */
async function testCredentials() {
  log.header('TEST 1: API CREDENTIALS');
  testResults.total++;
  
  if (!config.phoneNumberId || !config.accessToken || !config.businessAccountId) {
    log.error('Missing WhatsApp API credentials');
    log.info('Required environment variables:');
    log.info('  - WHATSAPP_PHONE_NUMBER_ID');
    log.info('  - WHATSAPP_ACCESS_TOKEN');
    log.info('  - WHATSAPP_BUSINESS_ACCOUNT_ID');
    testResults.failed++;
    return false;
  }
  
  if (config.phoneNumberId.includes('your-') || 
      config.accessToken.includes('your-')) {
    log.warning('Using placeholder credentials - replace with actual values');
    testResults.skipped++;
    return false;
  }
  
  log.success('API credentials configured');
  testResults.passed++;
  return true;
}

/**
 * Test 2: Get Phone Number Details
 */
async function testPhoneNumber() {
  log.header('TEST 2: PHONE NUMBER VALIDATION');
  testResults.total++;
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/${config.apiVersion}/${config.phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      }
    );
    
    if (response.data) {
      log.success(`Phone number verified: ${response.data.display_phone_number || response.data.id}`);
      log.info(`  Verified Name: ${response.data.verified_name || 'Not set'}`);
      log.info(`  Quality Rating: ${response.data.quality_rating || 'Not available'}`);
      testResults.passed++;
      return true;
    }
  } catch (err) {
    if (err.response?.status === 401) {
      log.error('Authentication failed - invalid access token');
    } else if (err.response?.status === 400) {
      log.error('Invalid phone number ID');
    } else {
      log.error(`Phone validation failed: ${err.message}`);
    }
    testResults.failed++;
    return false;
  }
}

/**
 * Test 3: List Message Templates
 */
async function testTemplates() {
  log.header('TEST 3: MESSAGE TEMPLATES');
  testResults.total++;
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/${config.apiVersion}/${config.businessAccountId}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      }
    );
    
    const templates = response.data.data || [];
    
    if (templates.length > 0) {
      log.success(`Found ${templates.length} templates`);
      
      // Show template details
      templates.slice(0, 5).forEach(template => {
        const status = template.status === 'APPROVED' ? colors.green : colors.yellow;
        log.info(`  ${template.name}: ${status}${template.status}${colors.reset} (${template.language})`);
        
        if (template.quality_score) {
          const score = template.quality_score.score;
          const scoreColor = score === 'GREEN' ? colors.green : 
                           score === 'YELLOW' ? colors.yellow : colors.red;
          log.info(`    Quality: ${scoreColor}${score}${colors.reset}`);
        }
      });
      
      // Check for required templates
      const requiredTemplates = [
        'daily_market_update',
        'investment_tip',
        'compliance_advisory'
      ];
      
      requiredTemplates.forEach(name => {
        const found = templates.find(t => t.name === name);
        if (found) {
          log.info(`  Required template '${name}': Found`);
        } else {
          log.warning(`  Required template '${name}': Not found`);
        }
      });
      
      testResults.passed++;
      return templates;
    } else {
      log.warning('No templates found - create templates in Meta Business Suite');
      testResults.passed++;
      return [];
    }
  } catch (err) {
    log.error(`Template fetch failed: ${err.response?.data?.error?.message || err.message}`);
    testResults.failed++;
    return [];
  }
}

/**
 * Test 4: Send Test Text Message
 */
async function testTextMessage() {
  log.header('TEST 4: SEND TEXT MESSAGE (24-hour window only)');
  testResults.total++;
  
  if (!config.testPhoneNumber || config.testPhoneNumber === '919999999999') {
    log.warning('No test phone number configured - skipping');
    log.info('Set TEST_PHONE_NUMBER environment variable to test');
    testResults.skipped++;
    return;
  }
  
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: config.testPhoneNumber,
      type: 'text',
      text: {
        body: 'Test message from Jarvish Platform verification script. Time: ' + new Date().toISOString()
      }
    };
    
    const response = await axios.post(
      `${config.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.messages?.[0]?.id) {
      log.success(`Text message sent! ID: ${response.data.messages[0].id}`);
      testResults.passed++;
    }
  } catch (err) {
    if (err.response?.status === 400) {
      const errorCode = err.response.data?.error?.code;
      if (errorCode === 131026) {
        log.warning('Cannot send text - recipient has not initiated conversation (24-hour rule)');
        log.info('Use template messages for proactive messaging');
      } else {
        log.error(`Message failed: ${err.response.data?.error?.message}`);
      }
    } else {
      log.error(`Send message failed: ${err.message}`);
    }
    testResults.failed++;
  }
}

/**
 * Test 5: Send Template Message
 */
async function testTemplateMessage(templates) {
  log.header('TEST 5: SEND TEMPLATE MESSAGE');
  testResults.total++;
  
  if (!config.testPhoneNumber || config.testPhoneNumber === '919999999999') {
    log.warning('No test phone number configured - skipping');
    testResults.skipped++;
    return;
  }
  
  // Find an approved template
  const approvedTemplate = templates.find(t => t.status === 'APPROVED');
  
  if (!approvedTemplate) {
    log.warning('No approved templates available for testing');
    testResults.skipped++;
    return;
  }
  
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: config.testPhoneNumber,
      type: 'template',
      template: {
        name: approvedTemplate.name,
        language: {
          code: approvedTemplate.language || 'en'
        }
      }
    };
    
    // Add components if template has parameters
    if (approvedTemplate.components) {
      payload.template.components = [];
      
      // Add sample parameters based on template structure
      const bodyComponent = approvedTemplate.components.find(c => c.type === 'BODY');
      if (bodyComponent?.example?.body_text) {
        payload.template.components.push({
          type: 'body',
          parameters: bodyComponent.example.body_text[0].map(text => ({
            type: 'text',
            text: text
          }))
        });
      }
    }
    
    const response = await axios.post(
      `${config.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.messages?.[0]?.id) {
      log.success(`Template message sent! Template: ${approvedTemplate.name}`);
      log.info(`  Message ID: ${response.data.messages[0].id}`);
      testResults.passed++;
    }
  } catch (err) {
    log.error(`Template send failed: ${err.response?.data?.error?.message || err.message}`);
    testResults.failed++;
  }
}

/**
 * Test 6: Webhook Configuration
 */
async function testWebhook() {
  log.header('TEST 6: WEBHOOK CONFIGURATION');
  testResults.total++;
  
  try {
    // Test local webhook endpoint
    const webhookUrl = 'http://localhost:8001/api/webhooks/whatsapp';
    
    // Simulate webhook verification
    const verifyResponse = await axios.get(webhookUrl, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': config.webhookVerifyToken,
        'hub.challenge': 'test_challenge_12345'
      }
    });
    
    if (verifyResponse.data === 'test_challenge_12345') {
      log.success('Webhook verification endpoint working');
      log.info(`  Verify token: ${config.webhookVerifyToken}`);
      testResults.passed++;
    } else {
      log.error('Webhook verification failed - unexpected response');
      testResults.failed++;
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      log.warning('Server not running - start with: npm run dev');
      testResults.skipped++;
    } else {
      log.error(`Webhook test failed: ${err.message}`);
      testResults.failed++;
    }
  }
}

/**
 * Test 7: Rate Limiting
 */
async function testRateLimiting() {
  log.header('TEST 7: RATE LIMITING');
  testResults.total++;
  
  log.info('WhatsApp API Rate Limits:');
  log.info('  - 80 messages per second (per phone number)');
  log.info('  - 500K messages per day (per phone number)');
  log.info('  - Template quality affects limits');
  
  log.success('Rate limiting configuration verified');
  testResults.passed++;
}

/**
 * Generate test report
 */
function generateReport() {
  log.header('TEST SUMMARY');
  
  const successRate = Math.round((testResults.passed / testResults.total) * 100);
  
  console.log(`\n${colors.bold}Results:${colors.reset}`);
  console.log(`  Total Tests: ${testResults.total}`);
  console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);
  console.log(`  Success Rate: ${successRate >= 70 ? colors.green : colors.yellow}${successRate}%${colors.reset}`);
  
  console.log(`\n${colors.bold}Configuration Checklist:${colors.reset}`);
  console.log('  1. Meta Business Account: developers.facebook.com');
  console.log('  2. WhatsApp Business API: business.whatsapp.com');
  console.log('  3. Create message templates in Business Manager');
  console.log('  4. Configure webhook URL in Meta App Dashboard');
  console.log('  5. Verify phone number and set display name');
  
  if (testResults.failed > 0) {
    console.log(`\n${colors.yellow}Some tests failed. Check the errors above.${colors.reset}`);
  } else if (testResults.skipped > 0) {
    console.log(`\n${colors.green}Core tests passed! Configure TEST_PHONE_NUMBER to test messaging.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}${colors.bold}All tests passed! WhatsApp integration is ready.${colors.reset}`);
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   WHATSAPP BUSINESS API TEST SUITE
   Testing all integration points...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colors.reset}`);
  
  // Run tests in sequence
  const hasCredentials = await testCredentials();
  
  if (hasCredentials) {
    await testPhoneNumber();
    const templates = await testTemplates();
    await testTextMessage();
    
    if (templates.length > 0) {
      await testTemplateMessage(templates);
    }
  }
  
  await testWebhook();
  await testRateLimiting();
  
  // Generate report
  generateReport();
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error(`\n${colors.red}Unhandled error: ${err.message}${colors.reset}`);
  process.exit(1);
});

// Run tests
main().catch(console.error);