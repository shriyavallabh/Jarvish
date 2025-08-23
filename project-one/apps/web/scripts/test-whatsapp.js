#!/usr/bin/env node

// Test script for WhatsApp integration
// Usage: node scripts/test-whatsapp.js

const https = require('https')

// Configuration
const CONFIG = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'EAATOFQtMe9gBPNeaDrN3HikuwAj71gmi3K5dCYRTiivA565F1HyvaZCddYNI9LFIKmLTrJW0qBO4M5rMSgjmZC8MIZBkLkGaepNJ4tsS3TozV79UyWaIgHZA4jPftncKP4OZCy0HdMGGVkS52EH1ItcEdJq2WiesVa5eYtpZAAd2ZCsMFhsrB3xsXGovvhZCuQ0uCrwy2VnaEZAiNNrx8ss4Vfj7xBJPxREEg6SPU16HZAcwQZD',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '', // You'll need to set this
  testPhoneNumber: process.env.TEST_PHONE_NUMBER || '', // Your test phone number
  webhookUrl: 'https://jarvis-whatsapp-assist-silent-fog-7955.fly.dev/webhook'
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

// Helper function to make API calls
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const response = JSON.parse(body)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response)
          } else {
            reject({ status: res.statusCode, response })
          }
        } catch (e) {
          reject(e)
        }
      })
    })
    
    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// Test 1: Verify WhatsApp Business Account
async function testAccountVerification() {
  console.log(`\n${colors.cyan}Test 1: Verifying WhatsApp Business Account${colors.reset}`)
  
  try {
    const options = {
      hostname: 'graph.facebook.com',
      path: '/v18.0/me?access_token=' + CONFIG.accessToken,
      method: 'GET'
    }
    
    const response = await makeRequest(options)
    console.log(`${colors.green}✓ Account verified:${colors.reset}`, response.name || 'Success')
    return true
  } catch (error) {
    console.log(`${colors.red}✗ Account verification failed:${colors.reset}`, error.response || error)
    return false
  }
}

// Test 2: Get Phone Number ID
async function testGetPhoneNumberId() {
  console.log(`\n${colors.cyan}Test 2: Getting Phone Number ID${colors.reset}`)
  
  if (!CONFIG.phoneNumberId) {
    console.log(`${colors.yellow}⚠ Phone Number ID not configured${colors.reset}`)
    console.log('To get your Phone Number ID:')
    console.log('1. Go to Facebook Business Manager')
    console.log('2. Navigate to WhatsApp > Settings')
    console.log('3. Copy your Phone Number ID')
    return false
  }
  
  try {
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v18.0/${CONFIG.phoneNumberId}?access_token=${CONFIG.accessToken}`,
      method: 'GET'
    }
    
    const response = await makeRequest(options)
    console.log(`${colors.green}✓ Phone Number verified:${colors.reset}`, response.display_phone_number)
    return true
  } catch (error) {
    console.log(`${colors.red}✗ Phone Number verification failed:${colors.reset}`, error.response || error)
    return false
  }
}

// Test 3: Send Test Message
async function testSendMessage() {
  console.log(`\n${colors.cyan}Test 3: Sending Test Message${colors.reset}`)
  
  if (!CONFIG.phoneNumberId || !CONFIG.testPhoneNumber) {
    console.log(`${colors.yellow}⚠ Phone Number ID or Test Phone Number not configured${colors.reset}`)
    return false
  }
  
  try {
    const messageData = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: CONFIG.testPhoneNumber,
      type: 'template',
      template: {
        name: 'hello_world', // Using default WhatsApp template
        language: {
          code: 'en_US'
        }
      }
    }
    
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v18.0/${CONFIG.phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
    
    const response = await makeRequest(options, messageData)
    console.log(`${colors.green}✓ Message sent successfully:${colors.reset}`)
    console.log(`  Message ID: ${response.messages[0].id}`)
    console.log(`  Contact: ${response.contacts[0].wa_id}`)
    return true
  } catch (error) {
    console.log(`${colors.red}✗ Message send failed:${colors.reset}`, error.response || error)
    
    if (error.response?.error?.code === 100) {
      console.log(`${colors.yellow}Note: You may need to:${colors.reset}`)
      console.log('1. Create and approve templates in Facebook Business Manager')
      console.log('2. Verify the test phone number is on WhatsApp')
      console.log('3. Ensure the phone number has opted in to receive messages')
    }
    
    return false
  }
}

// Test 4: Webhook Verification
async function testWebhookVerification() {
  console.log(`\n${colors.cyan}Test 4: Testing Webhook Verification${colors.reset}`)
  
  try {
    const webhookUrl = new URL(CONFIG.webhookUrl)
    webhookUrl.searchParams.append('hub.mode', 'subscribe')
    webhookUrl.searchParams.append('hub.verify_token', process.env.WHATSAPP_VERIFY_TOKEN || 'test_token')
    webhookUrl.searchParams.append('hub.challenge', 'test_challenge_123')
    
    const options = {
      hostname: webhookUrl.hostname,
      path: webhookUrl.pathname + webhookUrl.search,
      method: 'GET'
    }
    
    const response = await makeRequest(options)
    
    if (response === 'test_challenge_123') {
      console.log(`${colors.green}✓ Webhook verification successful${colors.reset}`)
      return true
    } else {
      console.log(`${colors.red}✗ Webhook verification failed: Invalid response${colors.reset}`)
      return false
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠ Webhook test skipped (webhook may not be deployed)${colors.reset}`)
    return false
  }
}

// Test 5: List Templates
async function testListTemplates() {
  console.log(`\n${colors.cyan}Test 5: Listing Message Templates${colors.reset}`)
  
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''
  
  if (!businessAccountId) {
    console.log(`${colors.yellow}⚠ Business Account ID not configured${colors.reset}`)
    return false
  }
  
  try {
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v18.0/${businessAccountId}/message_templates?access_token=${CONFIG.accessToken}`,
      method: 'GET'
    }
    
    const response = await makeRequest(options)
    console.log(`${colors.green}✓ Templates retrieved:${colors.reset}`)
    
    if (response.data && response.data.length > 0) {
      response.data.forEach(template => {
        console.log(`  - ${template.name} (${template.status}) - ${template.language}`)
      })
    } else {
      console.log('  No templates found. You need to create templates in Facebook Business Manager.')
    }
    
    return true
  } catch (error) {
    console.log(`${colors.red}✗ Template listing failed:${colors.reset}`, error.response || error)
    return false
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}=================================`)
  console.log('WhatsApp Business API Test Suite')
  console.log(`=================================${colors.reset}`)
  
  const results = {
    accountVerification: await testAccountVerification(),
    phoneNumberId: await testGetPhoneNumberId(),
    sendMessage: await testSendMessage(),
    webhookVerification: await testWebhookVerification(),
    listTemplates: await testListTemplates()
  }
  
  // Summary
  console.log(`\n${colors.blue}=================================`)
  console.log('Test Summary')
  console.log(`=================================${colors.reset}`)
  
  const passed = Object.values(results).filter(r => r).length
  const total = Object.keys(results).length
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`
    console.log(`${test}: ${status}`)
  })
  
  console.log(`\n${colors.cyan}Results: ${passed}/${total} tests passed${colors.reset}`)
  
  if (passed < total) {
    console.log(`\n${colors.yellow}Next Steps:${colors.reset}`)
    console.log('1. Set up your WhatsApp Business Account at business.facebook.com')
    console.log('2. Get your Phone Number ID from WhatsApp Settings')
    console.log('3. Create and submit message templates for approval')
    console.log('4. Configure webhook URL in WhatsApp Settings')
    console.log('5. Add environment variables to your .env file:')
    console.log('   - WHATSAPP_PHONE_NUMBER_ID')
    console.log('   - WHATSAPP_BUSINESS_ACCOUNT_ID')
    console.log('   - WHATSAPP_VERIFY_TOKEN')
    console.log('   - WHATSAPP_APP_SECRET')
  } else {
    console.log(`\n${colors.green}All tests passed! WhatsApp integration is ready.${colors.reset}`)
  }
}

// Run tests
runTests().catch(console.error)