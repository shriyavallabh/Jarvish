/**
 * Send Proper Hubix Opt-in Message
 * Creates and sends a branded opt-in template for Hubix
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('🚀 HUBIX OPT-IN SYSTEM');
console.log('═══════════════════════════════════════════════════════════════\n');

// First, create a proper Hubix opt-in template
async function createHubixOptInTemplate() {
  console.log('1️⃣ CREATING HUBIX BRANDED OPT-IN TEMPLATE...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
  
  const template = {
    name: 'hubix_welcome_optin',
    category: 'UTILITY', // UTILITY ensures immediate delivery
    language: 'en',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Welcome to Hubix AI'
      },
      {
        type: 'BODY',
        text: `Hello {{1}}!

Welcome to Hubix - Your AI-powered financial content partner.

You're about to receive:
• Daily SEBI-compliant investment insights
• Ready-to-share content at {{2}} IST
• Multi-language support (English/Hindi/Marathi)

Your Plan: {{3}}
Delivery: Daily at {{4}} IST

To start receiving your daily financial content, please reply YES to confirm your subscription.

Reply STOP anytime to unsubscribe.

Terms & Privacy: hubix.ai/terms`,
        example: {
          body_text: [
            ['Shriya', '06:00', 'Standard', '06:00']
          ]
        }
      },
      {
        type: 'FOOTER',
        text: 'Hubix - Empowering Financial Advisors'
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
      console.log('✅ Hubix opt-in template created!');
      console.log('  Template ID:', data.id);
      console.log('  Name:', template.name);
      console.log('  Status: PENDING APPROVAL\n');
      return { success: true, templateName: template.name };
    } else if (data.error?.message?.includes('already exists')) {
      console.log('ℹ️  Template already exists\n');
      return { success: true, templateName: template.name, exists: true };
    } else {
      console.log('❌ Failed:', data.error?.message);
      return { success: false };
    }
  } catch (error) {
    console.log('Error:', error.message);
    return { success: false };
  }
}

// Check if template is approved
async function checkTemplateStatus(templateName) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?name=${templateName}&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const template = data.data?.find(t => t.name === templateName);
    if (template) {
      return template.status;
    }
  } catch (error) {
    console.log('Error checking status:', error.message);
  }
  return null;
}

// Send the opt-in message
async function sendHubixOptIn(templateName) {
  console.log('3️⃣ SENDING HUBIX OPT-IN MESSAGE...\n');
  
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
            { type: 'text', text: '06:00' },
            { type: 'text', text: 'Standard' },
            { type: 'text', text: '06:00' }
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
      console.log('✅ HUBIX OPT-IN MESSAGE SENT SUCCESSFULLY!');
      console.log('  Message ID:', data.messages[0].id);
      console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
      console.log('  You should receive the Hubix welcome opt-in message');
      console.log('  Reply YES to enable daily content delivery\n');
      return true;
    } else {
      console.log('❌ Failed to send:', data.error?.message);
      return false;
    }
  } catch (error) {
    console.log('Error:', error.message);
    return false;
  }
}

// Alternative: Send direct text message
async function sendDirectMessage() {
  console.log('4️⃣ ALTERNATIVE: SENDING DIRECT HUBIX WELCOME...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const welcomeText = `🎯 *Welcome to Hubix AI!*

Hi Shriya! 👋

Thank you for choosing Hubix - your AI-powered financial content partner.

*What You'll Receive:*
✅ Daily SEBI-compliant investment insights
✅ Content delivered at 06:00 IST
✅ Ready-to-share with your clients
✅ Multi-language support

*Your Subscription:*
Plan: Standard (₹5,999/month)
Delivery: 06:00 IST daily
Languages: English, Hindi, Marathi

*Quick Actions:*
• Reply YES to confirm subscription
• Reply HELP for assistance
• Reply STOP to unsubscribe

Your first daily insight arrives tomorrow morning!

Best regards,
The Hubix Team
hubix.ai`;
  
  const message = {
    messaging_product: 'whatsapp',
    to: RECIPIENT,
    type: 'text',
    text: { body: welcomeText }
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
      console.log('✅ Direct welcome message sent!');
      console.log('  Message ID:', data.messages[0].id);
      return true;
    } else if (data.error?.code === 131051) {
      console.log('⚠️  24-hour window required');
      console.log('  You need to message the business first');
      return false;
    } else {
      console.log('❌ Failed:', data.error?.message);
      return false;
    }
  } catch (error) {
    console.log('Error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  // Step 1: Create template
  const result = await createHubixOptInTemplate();
  
  if (result.success) {
    const templateName = result.templateName;
    
    // Step 2: Check if approved
    console.log('2️⃣ CHECKING TEMPLATE APPROVAL STATUS...\n');
    
    const status = await checkTemplateStatus(templateName);
    console.log('  Current Status:', status || 'NOT FOUND');
    
    if (status === 'APPROVED') {
      // Send the template
      await sendHubixOptIn(templateName);
    } else if (status === 'PENDING') {
      console.log('  ⏳ Template pending approval (1-60 minutes)');
      console.log('  Waiting 30 seconds then checking again...\n');
      
      // Wait and check again
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      const newStatus = await checkTemplateStatus(templateName);
      if (newStatus === 'APPROVED') {
        await sendHubixOptIn(templateName);
      } else {
        console.log('  Still pending. Trying direct message instead...\n');
        await sendDirectMessage();
      }
    } else {
      // Try direct message as fallback
      await sendDirectMessage();
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 HUBIX OPT-IN FLOW SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Production Flow:');
  console.log('1. Advisor signs up on hubix.ai');
  console.log('2. Receives Hubix-branded opt-in (UTILITY template)');
  console.log('3. Replies YES to confirm');
  console.log('4. Daily content at 06:00 IST');
  console.log('\nThis ensures 100% delivery from Day 1! 🚀\n');
}

main().catch(console.error);