/**
 * Send WhatsApp Template Message
 * Uses pre-approved templates that don't require user initiation
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT_PHONE = '919765071249';

async function sendTemplateMessage() {
  console.log('📱 Sending WhatsApp Template Message to ' + RECIPIENT_PHONE);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // Using hello_world template as it's simple and approved
  const messageBody = {
    messaging_product: 'whatsapp',
    to: RECIPIENT_PHONE,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US'
      }
    }
  };
  
  try {
    console.log('📤 Sending template: hello_world');
    console.log('   This is a pre-approved template that bypasses the 24-hour rule\n');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageBody)
    });
    
    const data = await response.json();
    
    if (data.messages) {
      console.log('✅ Template message sent successfully!');
      console.log('   Message ID:', data.messages[0].id);
      console.log('   Status:', data.messages[0].message_status || 'accepted');
      console.log('\n📱 Check your WhatsApp at: +91 9765071249');
      console.log('\n📝 Note: This uses a pre-approved template.');
      console.log('   For custom financial content, we\'ll need to create');
      console.log('   specific templates for daily advisory messages.');
    } else if (data.error) {
      console.log('❌ Failed to send template message');
      console.log('   Error:', data.error.message);
      
      if (data.error.code === 131051) {
        console.log('\n⚠️  This template may not be available or configured correctly');
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('\n💡 For Jarvish Production:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('1. Create custom templates for financial advisories:');
  console.log('   - "daily_investment_insight" template');
  console.log('   - "sip_benefits_reminder" template');
  console.log('   - "market_update_notification" template');
  console.log('\n2. Templates can include variables like:');
  console.log('   - {{1}} = Advisor name');
  console.log('   - {{2}} = Investment tip');
  console.log('   - {{3}} = EUIN number');
  console.log('\n3. Once approved, advisors can receive messages at 06:00 IST');
  console.log('   without needing to message first!');
  console.log('───────────────────────────────────────────────────────────────\n');
}

// Try another template if hello_world fails
async function sendDailyFocusTemplate() {
  console.log('\n📱 Trying daily_focus template (MARKETING category)...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const messageBody = {
    messaging_product: 'whatsapp',
    to: RECIPIENT_PHONE,
    type: 'template',
    template: {
      name: 'daily_focus',
      language: {
        code: 'en'
      }
    }
  };
  
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
    
    if (data.messages) {
      console.log('✅ Daily focus template sent!');
      console.log('   Message ID:', data.messages[0].id);
      console.log('\n📱 This template is perfect for daily advisory messages!');
    } else if (data.error) {
      console.log('❌ Template error:', data.error.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Main execution
(async () => {
  await sendTemplateMessage();
  await sendDailyFocusTemplate();
})();