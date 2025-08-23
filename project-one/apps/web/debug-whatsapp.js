/**
 * Debug WhatsApp API Connection
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const config = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
};

console.log('🔍 Debugging WhatsApp Configuration\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Step 1: Check token validity
async function checkToken() {
  console.log('1️⃣ Checking Access Token...');
  
  const url = `https://graph.facebook.com/v18.0/debug_token?input_token=${config.accessToken}&access_token=${config.accessToken}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.data) {
      console.log('   ✓ Token Type:', data.data.type || 'Unknown');
      console.log('   ✓ App ID:', data.data.app_id || 'Unknown');
      console.log('   ✓ Valid:', data.data.is_valid ? '✅ Yes' : '❌ No');
      
      if (data.data.expires_at) {
        const expiryDate = new Date(data.data.expires_at * 1000);
        console.log('   ✓ Expires:', expiryDate.toLocaleString());
      } else {
        console.log('   ✓ Expires: Never (Permanent token)');
      }
      
      if (data.data.scopes) {
        console.log('   ✓ Permissions:', data.data.scopes.join(', '));
      }
    } else if (data.error) {
      console.log('   ❌ Error:', data.error.message);
    }
  } catch (error) {
    console.log('   ❌ Failed to validate token:', error.message);
  }
  
  console.log();
}

// Step 2: Check WhatsApp Business Account
async function checkBusinessAccount() {
  console.log('2️⃣ Checking WhatsApp Business Account...');
  
  const url = `https://graph.facebook.com/v18.0/${config.businessAccountId}?access_token=${config.accessToken}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.id) {
      console.log('   ✓ Account ID:', data.id);
      console.log('   ✓ Name:', data.name || 'Unknown');
      console.log('   ✓ Currency:', data.currency || 'Unknown');
      console.log('   ✓ Timezone:', data.timezone_name || 'Unknown');
    } else if (data.error) {
      console.log('   ❌ Error:', data.error.message);
    }
  } catch (error) {
    console.log('   ❌ Failed to check account:', error.message);
  }
  
  console.log();
}

// Step 3: Check Phone Number
async function checkPhoneNumber() {
  console.log('3️⃣ Checking WhatsApp Phone Number...');
  
  const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}?access_token=${config.accessToken}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.id) {
      console.log('   ✓ Phone Number ID:', data.id);
      console.log('   ✓ Display Number:', data.display_phone_number || 'Unknown');
      console.log('   ✓ Verified Name:', data.verified_name || 'Unknown');
      console.log('   ✓ Quality Rating:', data.quality_rating || 'Unknown');
      console.log('   ✓ Platform Type:', data.platform_type || 'Unknown');
      console.log('   ✓ Status:', data.account_mode || 'Unknown');
    } else if (data.error) {
      console.log('   ❌ Error:', data.error.message);
      if (data.error.error_subcode === 2388061) {
        console.log('   ⚠️  The phone number may not be registered or verified');
      }
    }
  } catch (error) {
    console.log('   ❌ Failed to check phone number:', error.message);
  }
  
  console.log();
}

// Step 4: Check if recipient is in contacts (for testing)
async function checkRecipientStatus() {
  console.log('4️⃣ Checking Recipient Eligibility...');
  
  const recipientPhone = '919765071249';
  console.log('   Recipient:', recipientPhone);
  
  // Check if we can send to this number
  const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
  
  const testMessage = {
    messaging_product: 'whatsapp',
    to: recipientPhone,
    type: 'text',
    text: {
      body: 'Test message from Jarvish debugging'
    }
  };
  
  try {
    console.log('   Attempting to send test message...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });
    
    const data = await response.json();
    
    if (data.messages) {
      console.log('   ✅ Test message accepted!');
      console.log('   Message ID:', data.messages[0].id);
    } else if (data.error) {
      console.log('   ❌ Cannot send message');
      console.log('   Error Code:', data.error.code);
      console.log('   Error:', data.error.message);
      
      // Common error interpretations
      if (data.error.code === 131030) {
        console.log('\n   ⚠️  IMPORTANT: Recipient has not opted in to receive messages');
        console.log('   Solution: The recipient must initiate a conversation first');
      } else if (data.error.code === 131031) {
        console.log('\n   ⚠️  IMPORTANT: Message failed to send');
        console.log('   Possible reasons:');
        console.log('   - Recipient has blocked the business');
        console.log('   - Invalid phone number format');
        console.log('   - WhatsApp not installed on recipient device');
      } else if (data.error.code === 131026) {
        console.log('\n   ⚠️  IMPORTANT: Message undeliverable');
        console.log('   The recipient may not have WhatsApp or the number is incorrect');
      } else if (data.error.code === 131047) {
        console.log('\n   ⚠️  IMPORTANT: Re-engagement required');
        console.log('   More than 24 hours have passed since last customer message');
      } else if (data.error.code === 131051) {
        console.log('\n   ⚠️  IMPORTANT: Message type not supported');
        console.log('   Try using a template message instead');
      }
      
      console.log('\n   📝 Full error details:', JSON.stringify(data.error, null, 2));
    }
  } catch (error) {
    console.log('   ❌ Failed to send test:', error.message);
  }
  
  console.log();
}

// Step 5: List available message templates
async function checkTemplates() {
  console.log('5️⃣ Checking Available Message Templates...');
  
  const url = `https://graph.facebook.com/v18.0/${config.businessAccountId}/message_templates?access_token=${config.accessToken}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      console.log(`   ✓ Found ${data.data.length} templates:\n`);
      
      data.data.forEach((template, index) => {
        console.log(`   Template ${index + 1}:`);
        console.log(`   - Name: ${template.name}`);
        console.log(`   - Status: ${template.status}`);
        console.log(`   - Language: ${template.language}`);
        console.log(`   - Category: ${template.category}`);
        console.log();
      });
    } else if (data.data && data.data.length === 0) {
      console.log('   ⚠️  No message templates found');
      console.log('   You may need to create templates in Meta Business Suite');
    } else if (data.error) {
      console.log('   ❌ Error:', data.error.message);
    }
  } catch (error) {
    console.log('   ❌ Failed to check templates:', error.message);
  }
  
  console.log();
}

// Main execution
async function debug() {
  console.log('Configuration:');
  console.log('  Access Token:', config.accessToken ? `${config.accessToken.substring(0, 20)}...` : 'NOT SET');
  console.log('  Phone Number ID:', config.phoneNumberId || 'NOT SET');
  console.log('  Business Account ID:', config.businessAccountId || 'NOT SET');
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  
  await checkToken();
  await checkBusinessAccount();
  await checkPhoneNumber();
  await checkRecipientStatus();
  await checkTemplates();
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🔍 Debugging Complete\n');
  
  console.log('📋 DIAGNOSIS SUMMARY:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('If you\'re not receiving messages, common issues are:');
  console.log();
  console.log('1. RECIPIENT NOT OPTED IN (Most Common)');
  console.log('   - The recipient must message your WhatsApp Business first');
  console.log('   - Or be added as a test number in Meta Business Suite');
  console.log();
  console.log('2. PHONE NUMBER NOT VERIFIED');
  console.log('   - Your WhatsApp Business phone number needs verification');
  console.log();
  console.log('3. TEMPLATE REQUIRED');
  console.log('   - You can only send template messages to new conversations');
  console.log('   - Free-form text only works within 24-hour window');
  console.log();
  console.log('4. TEST MODE RESTRICTIONS');
  console.log('   - In test mode, you can only message verified test numbers');
  console.log('   - Add 919765071249 as test number in Meta Business Suite:');
  console.log('   - Go to: WhatsApp > API Setup > To > Manage phone number list');
  console.log('───────────────────────────────────────────────────────────────\n');
}

// Check for node-fetch
try {
  require('node-fetch');
  debug();
} catch (e) {
  console.log('📦 Installing node-fetch...');
  require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
  debug();
}