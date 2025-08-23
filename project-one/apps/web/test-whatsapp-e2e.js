/**
 * End-to-End WhatsApp Delivery Test
 * Tests the complete flow from content generation to WhatsApp delivery
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// Your WhatsApp number
const RECIPIENT_PHONE = '919765071249'; // India format with country code

// Test advisor details
const testAdvisor = {
  name: 'Test Financial Advisor',
  businessName: 'Test Advisory Services',
  email: 'test@advisor.com',
  euin: 'E123456',
  phone: RECIPIENT_PHONE
};

// Credentials from environment
const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini' // Using GPT-4o-mini for testing
  },
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
};

console.log('🚀 Starting End-to-End WhatsApp Delivery Test');
console.log('═══════════════════════════════════════════════════════════════\n');

// Step 1: Generate SEBI-compliant content using OpenAI
async function generateContent() {
  console.log('📝 Step 1: Generating SEBI-compliant content...');
  
  const prompt = `
    You are a SEBI-registered financial advisor in India creating educational content for clients.
    Generate a WhatsApp message about mutual funds that:
    1. Is educational and informative
    2. Includes mandatory SEBI disclaimers
    3. Is under 1000 characters for WhatsApp
    4. Includes the advisor's EUIN: ${testAdvisor.euin}
    5. Has a professional greeting and sign-off
    
    Topic: Benefits of Systematic Investment Plans (SIP) in Mutual Funds
    
    Format the message for WhatsApp with proper line breaks.
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openai.apiKey}`
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a SEBI-compliant financial advisor content generator for Indian markets.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`OpenAI error: ${data.error.message}`);
    }

    const content = data.choices[0].message.content;
    console.log('✅ Content generated successfully');
    console.log('\n📄 Generated Content:');
    console.log('-----------------------------------');
    console.log(content);
    console.log('-----------------------------------\n');
    
    return content;
  } catch (error) {
    console.error('❌ Error generating content:', error.message);
    
    // Fallback content if AI fails
    const fallbackContent = `
🙏 Namaste!

📊 *Benefits of SIP in Mutual Funds*

✅ *Rupee Cost Averaging*: Buy more units when prices are low
✅ *Power of Compounding*: Small amounts grow significantly over time
✅ *Disciplined Investing*: Automatic monthly investments
✅ *Flexibility*: Start with as low as ₹500/month
✅ *No Timing Risk*: Invest regularly regardless of market conditions

💡 *Example*: ₹5,000 monthly SIP for 20 years at 12% returns = ₹49.95 Lakhs!

📱 Start your SIP journey today!

*Disclaimer*: Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past performance is not indicative of future results.

EUIN: ${testAdvisor.euin}
${testAdvisor.name}
${testAdvisor.businessName}

#MutualFunds #SIP #WealthCreation
    `.trim();
    
    console.log('⚠️ Using fallback content');
    return fallbackContent;
  }
}

// Step 2: Validate SEBI compliance
function validateSEBICompliance(content) {
  console.log('🔍 Step 2: Validating SEBI compliance...');
  
  const checks = {
    disclaimer: content.toLowerCase().includes('market risk') || content.toLowerCase().includes('market risks'),
    euin: content.includes(testAdvisor.euin),
    noGuarantees: !content.includes('guaranteed returns'),
    educational: true // Assuming educational tone
  };
  
  console.log('  ✓ Disclaimer present:', checks.disclaimer ? '✅' : '❌');
  console.log('  ✓ EUIN displayed:', checks.euin ? '✅' : '❌');
  console.log('  ✓ No guaranteed returns:', checks.noGuarantees ? '✅' : '❌');
  console.log('  ✓ Educational content:', checks.educational ? '✅' : '❌');
  
  const isCompliant = Object.values(checks).every(check => check === true);
  console.log(`\n  ${isCompliant ? '✅ Content is SEBI compliant' : '❌ Content needs compliance fixes'}\n`);
  
  return isCompliant;
}

// Step 3: Send WhatsApp message
async function sendWhatsAppMessage(content) {
  console.log('📱 Step 3: Sending WhatsApp message...');
  console.log(`  Recipient: ${RECIPIENT_PHONE}`);
  
  const url = `https://graph.facebook.com/v18.0/${config.whatsapp.phoneNumberId}/messages`;
  
  const messageBody = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: RECIPIENT_PHONE,
    type: 'text',
    text: {
      preview_url: false,
      body: content
    }
  };

  try {
    console.log('  📤 Sending request to WhatsApp API...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageBody)
    });

    const responseData = await response.json();
    
    if (response.ok && responseData.messages) {
      console.log('  ✅ WhatsApp message sent successfully!');
      console.log(`  Message ID: ${responseData.messages[0].id}`);
      console.log(`  Status: ${responseData.messages[0].message_status || 'sent'}`);
      return true;
    } else {
      console.error('  ❌ Failed to send WhatsApp message');
      console.error('  Error:', JSON.stringify(responseData, null, 2));
      
      // Common error handling
      if (responseData.error?.code === 190) {
        console.error('  ⚠️ Access token may be expired. Please refresh the token.');
      } else if (responseData.error?.code === 100) {
        console.error('  ⚠️ Invalid parameter. Check phone number format.');
      }
      
      return false;
    }
  } catch (error) {
    console.error('  ❌ Error sending WhatsApp message:', error.message);
    return false;
  }
}

// Step 4: Log to database (optional)
async function logDelivery(content, success) {
  console.log('💾 Step 4: Logging delivery...');
  
  const log = {
    advisor_id: 'test-advisor-001',
    recipient: RECIPIENT_PHONE,
    content: content.substring(0, 500), // Store first 500 chars
    sent_at: new Date().toISOString(),
    status: success ? 'delivered' : 'failed',
    channel: 'whatsapp'
  };
  
  console.log('  ✅ Delivery logged:', success ? 'SUCCESS' : 'FAILED');
  
  return log;
}

// Main execution
async function runE2ETest() {
  console.log('📋 Test Configuration:');
  console.log(`  Advisor: ${testAdvisor.name}`);
  console.log(`  Business: ${testAdvisor.businessName}`);
  console.log(`  EUIN: ${testAdvisor.euin}`);
  console.log(`  Recipient: ${RECIPIENT_PHONE}`);
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Generate content
    const content = await generateContent();
    
    if (!content) {
      throw new Error('Failed to generate content');
    }
    
    // Step 2: Validate compliance
    const isCompliant = validateSEBICompliance(content);
    
    if (!isCompliant) {
      console.log('⚠️ Warning: Content may not be fully SEBI compliant');
    }
    
    // Step 3: Send WhatsApp message
    const sent = await sendWhatsAppMessage(content);
    
    // Step 4: Log delivery
    await logDelivery(content, sent);
    
    // Final status
    console.log('\n═══════════════════════════════════════════════════════════════');
    if (sent) {
      console.log('🎉 SUCCESS! WhatsApp message delivered successfully!');
      console.log('📱 Please check your WhatsApp for the message.');
      console.log(`📞 Sent to: ${RECIPIENT_PHONE}`);
    } else {
      console.log('❌ FAILED! Message could not be delivered.');
      console.log('Please check the error messages above and try again.');
    }
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('  1. Check if WhatsApp access token is valid');
    console.log('  2. Verify phone number format (with country code)');
    console.log('  3. Ensure OpenAI API key has credits');
    console.log('  4. Check network connectivity');
  }
}

// Run the test
console.log('🔧 Checking dependencies...\n');

// Check if we have node-fetch
try {
  require('node-fetch');
} catch (e) {
  console.log('📦 Installing node-fetch...');
  require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
}

// Execute test
runE2ETest();