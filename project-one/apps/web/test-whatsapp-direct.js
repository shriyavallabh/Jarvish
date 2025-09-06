#!/usr/bin/env node
/**
 * DIRECT WHATSAPP TEST
 * Simple test to verify WhatsApp delivery is working
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('📱 WHATSAPP DELIVERY TEST');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Testing delivery to: 9765071249');
console.log('Phone ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
console.log('Token exists:', !!process.env.WHATSAPP_ACCESS_TOKEN);
console.log('\n');

// Test cases
const tests = [
  {
    id: 1,
    type: 'text',
    message: {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'text',
      text: {
        body: '🎨 Test from GPT-IMAGE-1 script\n\nThis is a test message to verify WhatsApp delivery is working.\n\nTime: ' + new Date().toLocaleTimeString('en-IN')
      }
    }
  },
  {
    id: 2,
    type: 'image',
    message: {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'image',
      image: {
        link: 'https://via.placeholder.com/500x500/0000FF/FFFFFF?text=TEST',
        caption: 'Test Image - Blue Square'
      }
    }
  }
];

async function sendTest(test) {
  console.log(`Test ${test.id}: Sending ${test.type} message...`);
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  console.log('  URL:', url.substring(0, 60) + '...');
  console.log('  To:', test.message.to);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(test.message)
    });
    
    const data = await response.json();
    
    if (data.messages) {
      console.log('  ✅ SUCCESS!');
      console.log('  Message ID:', data.messages[0].id);
      console.log('  Status:', data.messages[0].message_status || 'sent');
      return true;
    } else if (data.error) {
      console.log('  ❌ API Error:', data.error.message);
      console.log('  Error Code:', data.error.code);
      console.log('  Error Type:', data.error.type);
      
      if (data.error.error_data) {
        console.log('  Details:', JSON.stringify(data.error.error_data, null, 2));
      }
      
      return false;
    }
  } catch (error) {
    console.log('  ❌ Network Error:', error.message);
    return false;
  }
  
  console.log('');
}

// Also test with alternative number formats
async function testNumberFormats() {
  console.log('\nTesting alternative number formats:');
  console.log('─────────────────────────────────────────\n');
  
  const formats = [
    { format: '919765071249', desc: 'With country code 91' },
    { format: '9765071249', desc: 'Without country code' },
    { format: '+919765071249', desc: 'With + prefix' }
  ];
  
  for (const fmt of formats) {
    console.log(`Format: ${fmt.format} (${fmt.desc})`);
    
    const testMessage = {
      messaging_product: 'whatsapp',
      to: fmt.format,
      type: 'text',
      text: { body: `Test: Number format ${fmt.format}` }
    };
    
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testMessage)
        }
      );
      
      const data = await response.json();
      
      if (data.messages) {
        console.log('  ✅ Format works!\n');
        return fmt.format; // Return working format
      } else {
        console.log('  ❌ Format failed:', data.error?.message || 'Unknown error\n');
      }
    } catch (e) {
      console.log('  ❌ Error:', e.message, '\n');
    }
  }
  
  return null;
}

async function main() {
  console.log('Starting WhatsApp delivery tests...\n');
  
  // Run basic tests
  let successCount = 0;
  for (const test of tests) {
    const success = await sendTest(test);
    if (success) successCount++;
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Test number formats
  const workingFormat = await testNumberFormats();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`✅ Successful sends: ${successCount}/${tests.length}`);
  
  if (workingFormat) {
    console.log(`✅ Working number format: ${workingFormat}`);
  }
  
  if (successCount === 0) {
    console.log('\n❌ NO MESSAGES DELIVERED\n');
    console.log('TROUBLESHOOTING CHECKLIST:');
    console.log('─────────────────────────────────────────');
    console.log('1. Verify WhatsApp Business API setup:');
    console.log('   - Is the phone number ID correct?');
    console.log('   - Is the access token valid and not expired?');
    console.log('   - Is the WhatsApp Business Account active?');
    console.log('\n2. Check recipient number:');
    console.log('   - Does 9765071249 have WhatsApp installed?');
    console.log('   - Is the number active on WhatsApp?');
    console.log('   - Try messaging the number manually first');
    console.log('\n3. API Configuration:');
    console.log('   - Check if webhooks are configured');
    console.log('   - Verify API version (using v18.0)');
    console.log('   - Check rate limits or blocks');
    console.log('\n4. Template Requirements:');
    console.log('   - For first contact, may need approved template');
    console.log('   - User needs to initiate conversation first');
    console.log('\n5. Environment Variables:');
    console.log('   WHATSAPP_PHONE_NUMBER_ID=' + (process.env.WHATSAPP_PHONE_NUMBER_ID || 'NOT SET'));
    console.log('   WHATSAPP_ACCESS_TOKEN=' + (process.env.WHATSAPP_ACCESS_TOKEN ? 'SET' : 'NOT SET'));
  } else {
    console.log('\n✅ WHATSAPP IS WORKING!');
    console.log('Check your WhatsApp for test messages.');
  }
  
  console.log('\n');
}

main().catch(console.error);