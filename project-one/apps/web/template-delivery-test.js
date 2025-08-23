/**
 * Template Delivery Test - One by One with Status Check
 * Tests each template individually with proper delays
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('🎯 TEMPLATE DELIVERY TEST - ONE BY ONE');
console.log('═══════════════════════════════════════════════════════════════');
console.log('Target: 9765071249');
console.log('Time: ' + new Date().toLocaleTimeString('en-IN'));
console.log('═══════════════════════════════════════════════════════════════\n');

// Templates to test in order
const templates = [
  {
    name: 'hello_world',
    language: 'en_US',
    category: 'UTILITY',
    parameters: []
  },
  {
    name: 'daily_focus',
    language: 'en',
    category: 'MARKETING',
    parameters: [
      { type: 'text', text: 'Today\'s investment tip: Start SIP with ₹5000' }
    ]
  },
  {
    name: 'daily_focus_utility_v3',
    language: 'en_US',
    category: 'MARKETING',
    parameters: [
      { type: 'text', text: 'Friday' },
      { type: 'text', text: 'Review your investment portfolio and rebalance if needed' }
    ]
  },
  {
    name: 'hubix_daily_insight',
    language: 'en',
    category: 'MARKETING',
    parameters: [
      { type: 'text', text: 'Shriya' },
      { type: 'text', text: 'The power of compounding: ₹5,000 monthly SIP at 12% returns grows to ₹50 lakhs in 20 years!' },
      { type: 'text', text: 'Start your SIP today with just ₹500' },
      { type: 'text', text: '₹10,000/month for 15 years @15% = ₹1 Crore' },
      { type: 'text', text: 'E456789' },
      { type: 'text', text: 'Shriya Vallabh' },
      { type: 'text', text: 'Vallabh Financial Advisory' }
    ]
  }
];

// Delivery results table
const results = [];

// Send single template
async function sendTemplate(template) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // Build message
  const messageBody = {
    messaging_product: 'whatsapp',
    to: RECIPIENT,
    type: 'template',
    template: {
      name: template.name,
      language: { code: template.language }
    }
  };
  
  // Add parameters if needed
  if (template.parameters.length > 0) {
    messageBody.template.components = [{
      type: 'body',
      parameters: template.parameters
    }];
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageBody)
    });
    
    const data = await response.json();
    
    if (data.messages && data.messages[0]) {
      return {
        success: true,
        messageId: data.messages[0].id,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Unknown error',
        errorCode: data.error?.code
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Check if template is truly approved and ready
async function verifyTemplateStatus(templateName) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?fields=name,status,quality_score,language&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const template = data.data?.find(t => t.name === templateName);
    
    if (template) {
      return {
        found: true,
        status: template.status,
        quality: template.quality_score?.score || 'UNKNOWN',
        languages: template.language
      };
    }
    
    return { found: false };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

// Main test execution
async function runDeliveryTest() {
  console.log('🔍 STEP 1: Verifying Template Status\n');
  
  for (const template of templates) {
    const status = await verifyTemplateStatus(template.name);
    console.log(`${template.name}:`);
    console.log(`  Status: ${status.found ? status.status : 'NOT FOUND'}`);
    console.log(`  Language: ${template.language}`);
    console.log(`  Category: ${template.category}`);
    console.log(`  Quality: ${status.quality || 'N/A'}\n`);
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📤 STEP 2: Sending Templates (10 second delay between each)\n');
  
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    
    console.log(`\n[${i+1}/${templates.length}] Sending: ${template.name}`);
    console.log(`  Language: ${template.language}`);
    console.log(`  Parameters: ${template.parameters.length}`);
    
    const result = await sendTemplate(template);
    
    if (result.success) {
      console.log(`  ✅ SENT TO API`);
      console.log(`  Message ID: ${result.messageId.substring(0, 50)}...`);
      console.log(`  Time: ${new Date(result.timestamp).toLocaleTimeString('en-IN')}`);
      
      results.push({
        template: template.name,
        status: 'SENT',
        messageId: result.messageId,
        time: new Date().toLocaleTimeString('en-IN')
      });
    } else {
      console.log(`  ❌ FAILED`);
      console.log(`  Error: ${result.error}`);
      console.log(`  Code: ${result.errorCode}`);
      
      results.push({
        template: template.name,
        status: 'FAILED',
        error: result.error,
        time: new Date().toLocaleTimeString('en-IN')
      });
    }
    
    // Wait 10 seconds between templates
    if (i < templates.length - 1) {
      console.log('\n  ⏳ Waiting 10 seconds before next template...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Final summary table
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 DELIVERY SUMMARY TABLE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('┌──────────────────────────┬──────────┬────────────┬──────────────────────┐');
  console.log('│ Template                 │ Status   │ Time       │ Message ID / Error   │');
  console.log('├──────────────────────────┼──────────┼────────────┼──────────────────────┤');
  
  results.forEach(r => {
    const template = r.template.padEnd(24).substring(0, 24);
    const status = r.status.padEnd(8);
    const time = r.time.padEnd(10);
    const info = r.messageId ? 
      r.messageId.substring(0, 20) + '...' : 
      (r.error || '').substring(0, 20);
    
    console.log(`│ ${template} │ ${status} │ ${time} │ ${info.padEnd(20)} │`);
  });
  
  console.log('└──────────────────────────┴──────────┴────────────┴──────────────────────┘\n');
  
  // Check results
  const sentCount = results.filter(r => r.status === 'SENT').length;
  
  console.log('📱 EXPECTED ON YOUR WHATSAPP (9765071249):');
  console.log('─────────────────────────────────────────────────');
  
  if (sentCount === 4) {
    console.log('✅ You should receive ALL 4 messages:');
    console.log('   1. hello_world - Welcome message');
    console.log('   2. daily_focus - Investment tip');
    console.log('   3. daily_focus_utility_v3 - Friday portfolio review');
    console.log('   4. hubix_daily_insight - Complete Hubix message');
  } else if (sentCount === 1) {
    console.log('⚠️ If you only receive hello_world:');
    console.log('   - MARKETING templates may be blocked');
    console.log('   - Your number may need special permissions');
    console.log('   - Templates might need re-approval');
  } else {
    console.log(`📊 ${sentCount} messages sent to API`);
  }
  
  console.log('─────────────────────────────────────────────────');
  
  console.log('\n🔍 TROUBLESHOOTING:');
  console.log('─────────────────────────────────────────────────');
  console.log('If not all messages arrive:');
  console.log('1. Check if your number is registered as test number');
  console.log('2. UTILITY templates (hello_world) deliver more reliably');
  console.log('3. MARKETING templates may have stricter delivery rules');
  console.log('4. Language mismatch (en vs en_US) can affect delivery');
  console.log('5. Parameter formatting issues can prevent delivery');
  console.log('─────────────────────────────────────────────────\n');
  
  console.log('⏰ Wait 1-2 minutes and check your WhatsApp\n');
}

// Execute test
runDeliveryTest().catch(console.error);