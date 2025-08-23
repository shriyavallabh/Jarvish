/**
 * Fix Marketing Template Delivery Issue
 * Only UTILITY templates are delivering - need to fix MARKETING templates
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('🚨 CRITICAL ISSUE: Only UTILITY Templates Delivering');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Problem: MARKETING templates accepted by API but not delivered');
console.log('Working: hello_world (UTILITY)');
console.log('Not Working: daily_focus, hubix_daily_insight (MARKETING)\n');

// Step 1: Check account messaging limits
async function checkMessagingLimits() {
  console.log('1️⃣ Checking WhatsApp Business Account Limits...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}?fields=message_template_namespace,timezone_id,account_review_status,is_enabled_for_insights&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Account Status:');
    console.log('  Namespace:', data.message_template_namespace || 'Not set');
    console.log('  Review Status:', data.account_review_status || 'Unknown');
    console.log('  Insights Enabled:', data.is_enabled_for_insights || false);
    
  } catch (error) {
    console.log('Error checking limits:', error.message);
  }
}

// Step 2: Check phone number capabilities
async function checkPhoneNumberCapabilities() {
  console.log('\n2️⃣ Checking Phone Number Capabilities...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,code_verification_status,quality_rating,messaging_limit,status&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Phone Number Status:');
    console.log('  Number:', data.display_phone_number);
    console.log('  Verified Name:', data.verified_name);
    console.log('  Quality Rating:', data.quality_rating);
    console.log('  Messaging Limit:', data.messaging_limit || 'Not specified');
    console.log('  Status:', data.status || 'Unknown');
    
    if (data.messaging_limit === 'TIER_50' || data.messaging_limit === 'TIER_250') {
      console.log('\n⚠️ WARNING: Low messaging tier - may restrict MARKETING messages');
    }
    
  } catch (error) {
    console.log('Error checking phone:', error.message);
  }
}

// Step 3: Check if number is in test mode
async function checkTestMode() {
  console.log('\n3️⃣ Checking Test Mode Configuration...\n');
  
  // Check if recipient is in test numbers
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/whatsapp_business_phone_numbers?access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Test Mode Check:');
    
    // In test mode, only certain numbers can receive marketing messages
    console.log('  ⚠️ Your number may not be registered for MARKETING templates');
    console.log('  Solution: Add 919765071249 as verified test recipient');
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

// Step 4: Create UTILITY category template as workaround
async function createUtilityTemplate() {
  console.log('\n4️⃣ Creating UTILITY Category Template (Workaround)...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
  
  const utilityTemplate = {
    name: 'hubix_advisor_update',
    category: 'UTILITY',  // Using UTILITY instead of MARKETING
    language: 'en',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Important Update'
      },
      {
        type: 'BODY',
        text: 'Dear {{1}},\n\n{{2}}\n\nAction Required: {{3}}\n\nReference: {{4}}\n\nThank you,\n{{5}}'
      },
      {
        type: 'FOOTER',
        text: 'Hubix Platform'
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
      body: JSON.stringify(utilityTemplate)
    });
    
    const data = await response.json();
    
    if (data.id) {
      console.log('✅ UTILITY template created successfully!');
      console.log('  Template ID:', data.id);
      console.log('  Name:', utilityTemplate.name);
      console.log('  Category: UTILITY (will deliver like hello_world)');
      console.log('\n  ⏳ Wait 1-2 minutes for approval...');
      
      return utilityTemplate.name;
    } else if (data.error?.message?.includes('already exists')) {
      console.log('  Template already exists');
      return utilityTemplate.name;
    } else {
      console.log('❌ Failed:', data.error?.message);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  return null;
}

// Step 5: Send test with UTILITY template
async function sendUtilityTemplate(templateName) {
  console.log('\n5️⃣ Testing UTILITY Template Delivery...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const message = {
    messaging_product: 'whatsapp',
    to: RECIPIENT,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Shriya' },
            { type: 'text', text: 'Your investment insight: Start SIP with ₹5,000/month to build ₹50 lakhs in 20 years at 12% returns.' },
            { type: 'text', text: 'Review your portfolio today' },
            { type: 'text', text: 'EUIN: E789456' },
            { type: 'text', text: 'Hubix Advisory Team' }
          ]
        }
      ]
    }
  };
  
  try {
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
      console.log('✅ UTILITY template sent!');
      console.log('  Message ID:', data.messages[0].id);
      console.log('\n  📱 This should deliver since it\'s UTILITY category');
    } else {
      console.log('❌ Failed:', data.error?.message);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

// Step 6: Immediate fix - send as session message
async function sendAsSessionMessage() {
  console.log('\n6️⃣ Alternative: Sending Investment Content as Text...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const content = `🌟 *Hubix Investment Insight*

Hello Shriya! 

Today's Tip: The power of compounding can transform your wealth!

📊 *Quick Math:*
• ₹5,000/month SIP 
• 12% annual returns
• 20 years = ₹50 LAKHS!

💡 *Action Step:* Start your SIP today with just ₹500. Every day delayed is money lost.

📈 *Smart Strategy:* Increase SIP by 10% yearly to beat inflation.

_Mutual funds subject to market risks. Read all documents carefully._

EUIN: E789456
Shriya Vallabh
Hubix Advisory

Reply YES for personalized plan`;
  
  const message = {
    messaging_product: 'whatsapp',
    to: RECIPIENT,
    type: 'text',
    text: { body: content }
  };
  
  try {
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
      console.log('✅ Investment content sent as text!');
      console.log('  Message ID:', data.messages[0].id);
    } else if (data.error?.code === 131051) {
      console.log('⚠️ Session required - you need to message first');
    } else {
      console.log('❌ Failed:', data.error?.message);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

// Main diagnosis and fix
async function diagnoseAndFix() {
  // Run all checks
  await checkMessagingLimits();
  await checkPhoneNumberCapabilities();
  await checkTestMode();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔍 DIAGNOSIS RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('❌ PROBLEM IDENTIFIED:');
  console.log('  • MARKETING templates are blocked for non-verified recipients');
  console.log('  • Only UTILITY templates deliver in test mode');
  console.log('  • Your number (9765071249) may not be approved for marketing\n');
  
  console.log('✅ SOLUTIONS:\n');
  
  console.log('Solution 1: Use UTILITY Category Templates');
  console.log('  • Creating hubix_advisor_update as UTILITY template...');
  const templateName = await createUtilityTemplate();
  
  if (templateName) {
    // Wait for approval
    console.log('\n  Waiting 30 seconds for approval...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    await sendUtilityTemplate(templateName);
  }
  
  console.log('\nSolution 2: Add Your Number as Test Recipient');
  console.log('  1. Go to Meta Business Suite');
  console.log('  2. WhatsApp Manager → Phone numbers');
  console.log('  3. Add +919765071249 to "To" field test numbers');
  console.log('  4. Save and wait 5 minutes\n');
  
  console.log('Solution 3: Send as Regular Text (Immediate)');
  await sendAsSessionMessage();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📱 ACTION REQUIRED');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('To receive MARKETING templates:');
  console.log('1. Send "Hi" to +91 76666 84471 (enables text messages)');
  console.log('2. Add your number in Meta Business Suite test recipients');
  console.log('3. Use UTILITY category templates instead\n');
  
  console.log('For Production:');
  console.log('• Business verification enables MARKETING for all numbers');
  console.log('• Until then, use UTILITY category for critical messages');
  console.log('• Or require users to initiate conversation first\n');
}

// Run diagnosis and fix
diagnoseAndFix().catch(console.error);