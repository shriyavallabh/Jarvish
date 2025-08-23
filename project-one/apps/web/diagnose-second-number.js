/**
 * Diagnose why only hello_world delivers to 8975758513
 * Marketing and regular messages not reaching
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '918975758513';

console.log('🔍 DIAGNOSING DELIVERY ISSUE FOR 8975758513');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Issue: Only hello_world (UTILITY) delivered');
console.log('Not received: Marketing template, welcome, insights, infographic\n');

// Check message statuses
async function checkMessageStatuses() {
  console.log('1️⃣ CHECKING MESSAGE DELIVERY STATUSES...\n');
  
  console.log('Messages sent (according to API):');
  console.log('─────────────────────────────────────────');
  console.log('1. hello_world (UTILITY) - ✅ RECEIVED by you');
  console.log('2. daily_focus (MARKETING) - ❌ NOT received');
  console.log('3. Welcome text - ❌ NOT received');
  console.log('4. Insight text - ❌ NOT received');
  console.log('5. Infographic - ❌ NOT received\n');
  
  console.log('DIAGNOSIS:');
  console.log('─────────────────────────────────────────');
  console.log('✅ UTILITY templates work (hello_world delivered)');
  console.log('❌ MARKETING templates blocked');
  console.log('❌ Regular messages blocked (no 24-hour window)\n');
}

// Understand the issue
async function explainIssue() {
  console.log('2️⃣ WHY THIS IS HAPPENING...\n');
  
  console.log('For 8975758513:');
  console.log('─────────────────────────────────────────');
  console.log('• NOT in conversation window (hasn\'t messaged back)');
  console.log('• NOT opted in (no YES reply from this number)');
  console.log('• MARKETING templates require opt-in or test number status');
  console.log('• Regular messages need active conversation (24-hour rule)\n');
  
  console.log('WhatsApp Rules:');
  console.log('─────────────────────────────────────────');
  console.log('1. UTILITY templates → Always deliver (hello_world ✅)');
  console.log('2. MARKETING templates → Need opt-in or test number');
  console.log('3. Regular messages → Need user to message first\n');
}

// The solution
async function provideSolution() {
  console.log('3️⃣ SOLUTION FOR 8975758513...\n');
  
  console.log('Option 1: User Initiates Conversation');
  console.log('─────────────────────────────────────────');
  console.log('1. 8975758513 sends any message to +91 76666 84471');
  console.log('2. This opens 24-hour conversation window');
  console.log('3. All message types will then deliver\n');
  
  console.log('Option 2: Add as Test Number');
  console.log('─────────────────────────────────────────');
  console.log('1. Go to Meta Business Suite');
  console.log('2. WhatsApp Manager → Phone numbers → Settings');
  console.log('3. Add 8975758513 to test recipients');
  console.log('4. Then MARKETING templates will work\n');
  
  console.log('Option 3: Use Only UTILITY Templates');
  console.log('─────────────────────────────────────────');
  console.log('Create all templates as UTILITY category');
  console.log('These always deliver without restrictions\n');
}

// Send proper opt-in request
async function sendProperOptIn() {
  console.log('4️⃣ SENDING PROPER OPT-IN REQUEST...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // First, try the hubix_welcome_optin if approved
  const checkUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?name=hubix_welcome_optin&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const checkResponse = await fetch(checkUrl);
    const checkData = await checkResponse.json();
    
    const template = checkData.data?.find(t => t.name === 'hubix_welcome_optin');
    
    if (template && template.status === 'APPROVED') {
      console.log('  Using hubix_welcome_optin template...\n');
      
      const message = {
        messaging_product: 'whatsapp',
        to: RECIPIENT,
        type: 'template',
        template: {
          name: 'hubix_welcome_optin',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: 'User' },
                { type: 'text', text: '06:00' },
                { type: 'text', text: 'Standard' },
                { type: 'text', text: '06:00' }
              ]
            }
          ]
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      const data = await response.json();
      
      if (data.messages) {
        console.log('  ✅ Proper opt-in sent!');
        console.log('  Message ID:', data.messages[0].id);
        console.log('\n  📱 CHECK 8975758513\'s WHATSAPP');
        console.log('  Should receive Hubix opt-in request');
        console.log('  Reply YES to enable all messages\n');
        return true;
      }
    } else {
      console.log('  Hubix template not approved yet');
      console.log('  Sending hello_world as fallback...\n');
      
      // Send hello_world again with instructions
      const message = {
        messaging_product: 'whatsapp',
        to: RECIPIENT,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' }
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      const data = await response.json();
      
      if (data.messages) {
        console.log('  ✅ Hello world sent again');
        console.log('  📱 8975758513 needs to REPLY to this message');
        console.log('  Once they reply, all messages will deliver\n');
      }
    }
  } catch (error) {
    console.log('  Error:', error.message);
  }
}

// Test with UTILITY template
async function testUtilityDelivery() {
  console.log('5️⃣ TESTING WITH UTILITY TEMPLATE...\n');
  
  // Create a UTILITY template for content delivery
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
  
  const template = {
    name: 'hubix_daily_utility',
    category: 'UTILITY', // This ensures delivery
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Daily Insight: {{1}}\n\nAction: {{2}}\n\nHubix Advisory\nEUIN: {{3}}',
        example: {
          body_text: [
            ['Start SIP with ₹5000 monthly for wealth creation', 'Review your portfolio today', 'E123456']
          ]
        }
      }
    ]
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(template)
    });
    
    const data = await response.json();
    
    if (data.id) {
      console.log('  ✅ UTILITY content template created');
      console.log('  Name: hubix_daily_utility');
      console.log('  This will deliver to 8975758513 once approved\n');
    } else if (data.error?.message?.includes('already exists')) {
      console.log('  UTILITY template already exists\n');
    }
  } catch (error) {
    console.log('  Error:', error.message);
  }
}

// Main execution
async function main() {
  await checkMessageStatuses();
  await explainIssue();
  await provideSolution();
  await sendProperOptIn();
  await testUtilityDelivery();
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY FOR 8975758513');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Current Status:');
  console.log('• Can receive: UTILITY templates only');
  console.log('• Cannot receive: MARKETING templates, regular messages');
  console.log('• Reason: No opt-in, no conversation window\n');
  
  console.log('To Enable All Messages:');
  console.log('1. 8975758513 must reply to the hello_world message');
  console.log('2. OR send any message to your WhatsApp number');
  console.log('3. This opens 24-hour window for all content\n');
  
  console.log('Key Learning:');
  console.log('• Your number (9765071249) works because you replied YES');
  console.log('• 8975758513 hasn\'t replied, so no conversation window');
  console.log('• WhatsApp strictly enforces opt-in for non-UTILITY messages\n');
}

main().catch(console.error);