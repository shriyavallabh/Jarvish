/**
 * Check Hubix Template Approval Status
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT_PHONE = '919765071249';

async function checkTemplateStatus() {
  console.log('🔍 Checking Hubix Template Status...\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Get all templates
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Find Hubix template
    const hubixTemplate = data.data?.find(t => t.name === 'hubix_daily_insight');
    
    if (hubixTemplate) {
      console.log('✅ HUBIX TEMPLATE FOUND!\n');
      console.log('📋 Template Details:');
      console.log('  Name:', hubixTemplate.name);
      console.log('  Status:', hubixTemplate.status);
      console.log('  Category:', hubixTemplate.category);
      console.log('  Language:', hubixTemplate.language);
      console.log('  ID:', hubixTemplate.id);
      
      if (hubixTemplate.status === 'APPROVED') {
        console.log('\n🎉 TEMPLATE IS APPROVED! Sending message now...\n');
        await sendHubixTemplateMessage();
      } else if (hubixTemplate.status === 'PENDING') {
        console.log('\n⏳ Template still PENDING approval');
        console.log('   Usually takes 1-60 minutes');
        console.log('   Current wait time: ~5 minutes');
      } else if (hubixTemplate.status === 'REJECTED') {
        console.log('\n❌ Template was REJECTED');
        console.log('   Rejection reason:', hubixTemplate.rejected_reason);
      }
    } else {
      console.log('⚠️  Hubix template not found in list');
      console.log('\nAll available templates:');
      data.data?.forEach((t, i) => {
        if (t.name.includes('daily') || t.name.includes('hubix')) {
          console.log(`  ${i+1}. ${t.name} - ${t.status}`);
        }
      });
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.log('❌ Error checking template:', error.message);
  }
}

async function sendHubixTemplateMessage() {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const messageBody = {
    messaging_product: 'whatsapp',
    to: RECIPIENT_PHONE,
    type: 'template',
    template: {
      name: 'hubix_daily_insight',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Shriya' },
            { type: 'text', text: 'The power of compounding: A ₹10,000 monthly SIP growing at 12% annually becomes ₹93 lakhs in 20 years. Start early, stay consistent!' },
            { type: 'text', text: 'Increase your SIP by 10% every year to beat inflation' },
            { type: 'text', text: '₹15,000/month for 15 years @15% = ₹1.01 Crores' },
            { type: 'text', text: 'E789456' },
            { type: 'text', text: 'Shriya Vallabh' },
            { type: 'text', text: 'Vallabh Financial Advisory' }
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
      body: JSON.stringify(messageBody)
    });
    
    const data = await response.json();
    
    if (data.messages) {
      console.log('✅ HUBIX TEMPLATE MESSAGE SENT SUCCESSFULLY!');
      console.log('   Message ID:', data.messages[0].id);
      console.log('   Recipient: +91', RECIPIENT_PHONE.substring(2));
      console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
      console.log('   This message was sent using the approved template');
      console.log('   No user initiation required!');
      
      console.log('\n📋 Message Preview:');
      console.log('───────────────────────────────────────────────────────────────');
      console.log('Good morning Shriya!');
      console.log('\n*Today\'s Investment Insight from Hubix*');
      console.log('\nThe power of compounding: A ₹10,000 monthly SIP growing at');
      console.log('12% annually becomes ₹93 lakhs in 20 years.');
      console.log('\n💡 Action: Increase your SIP by 10% every year');
      console.log('📊 Calculation: ₹15,000/month for 15 years @15% = ₹1.01 Crores');
      console.log('\nPowered by Hubix AI');
      console.log('───────────────────────────────────────────────────────────────');
      
    } else if (data.error) {
      console.log('❌ Template message failed:', data.error.message);
      if (data.error.code === 132000) {
        console.log('   The template parameters may not match');
      }
    }
  } catch (error) {
    console.log('❌ Error sending template:', error.message);
  }
}

// Also try sending with other approved templates
async function tryApprovedTemplates() {
  console.log('🔄 Trying with pre-approved templates...\n');
  
  const templates = [
    'daily_focus',
    'daily_focus_utility_v3',
    'reminder_notification_v1'
  ];
  
  for (const templateName of templates) {
    console.log(`Trying template: ${templateName}`);
    
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const messageBody = {
      messaging_product: 'whatsapp',
      to: RECIPIENT_PHONE,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' }
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
        console.log(`  ✅ ${templateName} sent! ID: ${data.messages[0].id}`);
        console.log('  Check your WhatsApp!\n');
        return true;
      } else {
        console.log(`  ❌ ${templateName} failed:`, data.error?.message?.substring(0, 50));
      }
    } catch (error) {
      console.log(`  ❌ Error with ${templateName}`);
    }
  }
}

// Main execution
async function main() {
  await checkTemplateStatus();
  
  // Try other templates as backup
  console.log('═══════════════════════════════════════════════════════════════\n');
  await tryApprovedTemplates();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📱 IMPORTANT: If you still haven\'t received messages:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('Simply send "Hi" to +91 76666 84471 on WhatsApp');
  console.log('You\'ll immediately receive all queued messages!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main();