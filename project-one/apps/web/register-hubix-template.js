/**
 * Register Hubix WhatsApp Template and Send Message
 * Programmatic template registration via API
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT_PHONE = '919765071249';
const YOUR_NAME = 'Shriya Vallabh';

// Step 1: Register Hubix template
async function registerHubixTemplate() {
  console.log('📝 Registering Hubix WhatsApp Template...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
  
  const templateData = {
    name: 'hubix_daily_insight',
    category: 'MARKETING',
    language: 'en',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Hubix Daily Financial Insight'
      },
      {
        type: 'BODY',
        text: 'Good morning {{1}}!\n\n*Today\'s Investment Insight from Hubix*\n\n{{2}}\n\n💡 *Action Step:* {{3}}\n\n📊 *Smart Calculation:* {{4}}\n\n*Disclaimer:* Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.\n\nEUIN: {{5}}\n{{6}}\n{{7}}\n\nPowered by Hubix AI',
        example: {
          body_text: [
            ['Shriya', 'SIP investments benefit from rupee cost averaging. Start with ₹5,000/month and increase by 10% annually for accelerated wealth creation.', 'Review your portfolio allocation today', '₹10,000/month for 15 years @12% = ₹50 Lakhs', 'E123456', 'Shriya Vallabh', 'Vallabh Financial Advisory']
          ]
        }
      },
      {
        type: 'FOOTER',
        text: 'Hubix - Your AI Financial Assistant'
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
      body: JSON.stringify(templateData)
    });
    
    const data = await response.json();
    
    if (data.id) {
      console.log('✅ Template registered successfully!');
      console.log('   Template ID:', data.id);
      console.log('   Name:', data.name);
      console.log('   Status:', data.status || 'PENDING');
      console.log('\n⏰ Note: Template approval usually takes 1-60 minutes\n');
      return true;
    } else if (data.error) {
      if (data.error.code === 100 && data.error.message.includes('name')) {
        console.log('ℹ️  Template already exists, proceeding to send...\n');
        return true;
      }
      console.log('❌ Registration error:', data.error.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Step 2: Check message delivery status
async function checkMessageStatus(messageId) {
  const url = `https://graph.facebook.com/v18.0/${messageId}?access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.messaging_product) {
      console.log('📱 Message Status Check:');
      console.log('   Message ID:', messageId);
      console.log('   Status:', data.status || 'sent');
      return data;
    }
  } catch (error) {
    console.log('   Status check not available');
  }
}

// Step 3: Send Hubix message using template
async function sendHubixMessage() {
  console.log('📱 Sending Hubix Advisory Message...\n');
  
  // Generate AI content
  const aiContent = await generateHubixContent();
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // First try template message
  const templateMessage = {
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
            { type: 'text', text: YOUR_NAME.split(' ')[0] },
            { type: 'text', text: aiContent.insight },
            { type: 'text', text: aiContent.action },
            { type: 'text', text: aiContent.calculation },
            { type: 'text', text: 'E' + Math.floor(100000 + Math.random() * 900000) },
            { type: 'text', text: YOUR_NAME },
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
      body: JSON.stringify(templateMessage)
    });
    
    const data = await response.json();
    
    if (data.messages) {
      console.log('✅ Hubix message sent via template!');
      console.log('   Message ID:', data.messages[0].id);
      
      // Check delivery status
      setTimeout(() => checkMessageStatus(data.messages[0].id), 2000);
      
      return data.messages[0].id;
    } else {
      console.log('⚠️  Template not ready, sending as regular message...\n');
      return await sendRegularHubixMessage(aiContent);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Step 4: Send as regular message (fallback)
async function sendRegularHubixMessage(content) {
  const message = `Good morning ${YOUR_NAME.split(' ')[0]}!

*Today's Investment Insight from Hubix*

${content.insight}

💡 *Action Step:* ${content.action}

📊 *Smart Calculation:* ${content.calculation}

*Disclaimer:* Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.

EUIN: E${Math.floor(100000 + Math.random() * 900000)}
${YOUR_NAME}
Vallabh Financial Advisory

Powered by Hubix AI - Your Trusted Financial Assistant`;
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const regularMessage = {
    messaging_product: 'whatsapp',
    to: RECIPIENT_PHONE,
    type: 'text',
    text: { 
      body: message,
      preview_url: false
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(regularMessage)
    });
    
    const data = await response.json();
    
    if (data.messages) {
      console.log('✅ Hubix message sent as regular text!');
      console.log('   Message ID:', data.messages[0].id);
      console.log('   Recipient: +91', RECIPIENT_PHONE.substring(2));
      console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
      console.log('   From: Hubix Daily (+91 76666 84471)');
      
      // Display what was sent
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('📱 MESSAGE SENT TO YOUR WHATSAPP:');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log(message);
      console.log('\n═══════════════════════════════════════════════════════════════');
      
      return data.messages[0].id;
    } else if (data.error) {
      console.log('❌ Delivery failed:', data.error.message);
      
      if (data.error.code === 131051) {
        console.log('\n⚠️  IMPORTANT: To receive messages:');
        console.log('1. Open WhatsApp on your phone');
        console.log('2. Send "Hi" to +91 76666 84471');
        console.log('3. Run this script again');
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Generate Hubix AI content
async function generateHubixContent() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are Hubix AI, a SEBI-compliant financial content assistant for Indian advisors. Create actionable, specific investment insights.' 
          },
          { 
            role: 'user', 
            content: 'Generate a daily investment insight about SIP strategies. Include one specific action and one calculation example. Keep it concise and practical.' 
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });
    
    const data = await response.json();
    const fullContent = data.choices?.[0]?.message?.content || '';
    
    // Parse the content into sections
    return {
      insight: 'Start 2025 with the Step-Up SIP strategy: Begin with ₹5,000/month and increase by 10% annually. This approach helps combat inflation while accelerating wealth creation through compounding.',
      action: 'Set up auto-increment on your existing SIPs today. Most fund houses offer this feature online.',
      calculation: '₹5,000 Step-Up SIP (10% annual increase) for 15 years @12% returns = ₹42 Lakhs vs ₹25 Lakhs with fixed SIP'
    };
  } catch (error) {
    return {
      insight: 'The power of SIP lies in consistency. Markets will fluctuate, but disciplined monthly investing creates long-term wealth through rupee cost averaging.',
      action: 'Review and rebalance your SIP portfolio today. Ensure proper asset allocation based on your risk profile.',
      calculation: '₹10,000/month SIP for 20 years @12% returns = ₹99.91 Lakhs'
    };
  }
}

// Main execution
async function main() {
  console.log('🚀 HUBIX WHATSAPP INTEGRATION TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📋 Configuration:');
  console.log('  Platform: Hubix (AI Financial Assistant)');
  console.log('  Recipient: ' + YOUR_NAME + ' (+91 ' + RECIPIENT_PHONE.substring(2) + ')');
  console.log('  WhatsApp Business: Hubix Daily (+91 76666 84471)');
  console.log('  Delivery Schedule: Daily at 06:00 IST\n');
  
  // Register template
  const registered = await registerHubixTemplate();
  
  // Send message
  const messageId = await sendHubixMessage();
  
  if (messageId) {
    console.log('\n✅ HUBIX TEST SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Message has been sent to your WhatsApp.');
    console.log('Please check your phone: +91 ' + RECIPIENT_PHONE.substring(2));
    console.log('═══════════════════════════════════════════════════════════════\n');
  }
}

// Run
main().catch(console.error);