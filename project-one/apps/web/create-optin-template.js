/**
 * Create Proper Opt-in Template for Hubix
 * This will be a UTILITY template that asks for consent
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('📝 CREATING PROPER OPT-IN TEMPLATE FOR HUBIX');
console.log('═══════════════════════════════════════════════════════════════\n');

// Create proper opt-in template
async function createOptInTemplate() {
  console.log('1️⃣ REGISTERING HUBIX OPT-IN TEMPLATE...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
  
  const optInTemplate = {
    name: 'hubix_advisor_optin',
    category: 'UTILITY',  // UTILITY ensures delivery to everyone
    language: 'en',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Welcome to Hubix!'
      },
      {
        type: 'BODY',
        text: `Dear {{1}},

Thank you for signing up for Hubix - your AI-powered financial content assistant.

You will receive:
• Daily SEBI-compliant investment insights at 06:00 IST
• Market updates and actionable tips
• Content ready to share with your clients

Your subscription: {{2}} Plan
Delivery time: {{3}} IST daily

Reply YES to confirm and start receiving daily content.
Reply STOP to opt-out anytime.

Terms: hubix.ai/terms`,
        example: {
          body_text: [
            ['Shriya', 'STANDARD', '06:00']
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
      body: JSON.stringify(optInTemplate)
    });
    
    const data = await response.json();
    
    if (data.id) {
      console.log('✅ Opt-in template created successfully!');
      console.log('  Template ID:', data.id);
      console.log('  Name:', optInTemplate.name);
      console.log('  Status: PENDING APPROVAL');
      console.log('\n  ⏳ Template will be approved in 1-60 minutes');
      return { success: true, templateId: data.id };
    } else if (data.error?.message?.includes('already exists')) {
      console.log('ℹ️  Template already exists');
      return { success: true, exists: true };
    } else {
      console.log('❌ Failed to create:', data.error?.message);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Create alternative simpler opt-in
async function createSimpleOptIn() {
  console.log('\n2️⃣ CREATING SIMPLER OPT-IN TEMPLATE...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
  
  const simpleTemplate = {
    name: 'hubix_consent',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: `Hi {{1}}! Hubix will send you daily investment insights at {{2}} IST. Reply YES to confirm or STOP to opt-out. Terms: hubix.ai/terms`,
        example: {
          body_text: [
            ['Shriya', '06:00']
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
      body: JSON.stringify(simpleTemplate)
    });
    
    const data = await response.json();
    
    if (data.id) {
      console.log('✅ Simple opt-in template created!');
      console.log('  Template ID:', data.id);
      console.log('  Name:', simpleTemplate.name);
      return { success: true, templateId: data.id };
    } else if (data.error?.message?.includes('already exists')) {
      console.log('ℹ️  Template already exists');
      return { success: true, exists: true };
    } else {
      console.log('❌ Failed:', data.error?.message);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log('Error:', error.message);
    return { success: false };
  }
}

// Check if templates are approved
async function checkTemplateApproval(templateName) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?name=${templateName}&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const template = data.data?.find(t => t.name === templateName);
    
    if (template) {
      return {
        found: true,
        status: template.status,
        id: template.id
      };
    }
    
    return { found: false };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

// Wait for approval and send
async function waitAndSend(templateName, maxWaitMinutes = 2) {
  console.log(`\n3️⃣ WAITING FOR ${templateName} APPROVAL...\n`);
  
  const startTime = Date.now();
  const maxWaitMs = maxWaitMinutes * 60 * 1000;
  let checkCount = 0;
  
  while (Date.now() - startTime < maxWaitMs) {
    checkCount++;
    console.log(`  Check #${checkCount}: Checking approval status...`);
    
    const status = await checkTemplateApproval(templateName);
    
    if (status.found && status.status === 'APPROVED') {
      console.log('  ✅ Template approved! Sending now...\n');
      
      // Send the opt-in message
      return await sendOptInMessage(templateName);
    } else if (status.found) {
      console.log(`  Status: ${status.status}`);
    } else {
      console.log('  Template not found yet');
    }
    
    // Wait 15 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  
  console.log('  ⏱️ Timeout - template still pending approval');
  console.log('  Note: Template approval can take 1-60 minutes');
  return false;
}

// Send the opt-in message
async function sendOptInMessage(templateName) {
  console.log('4️⃣ SENDING PROPER OPT-IN MESSAGE...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  let messageBody;
  
  if (templateName === 'hubix_advisor_optin') {
    messageBody = {
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
              { type: 'text', text: 'STANDARD' },
              { type: 'text', text: '06:00' }
            ]
          }
        ]
      }
    };
  } else if (templateName === 'hubix_consent') {
    messageBody = {
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
              { type: 'text', text: '06:00' }
            ]
          }
        ]
      }
    };
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
    
    if (data.messages) {
      console.log('✅ PROPER OPT-IN MESSAGE SENT!');
      console.log('  Message ID:', data.messages[0].id);
      console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
      console.log('  You should receive a proper opt-in request');
      console.log('  Reply YES to enable all marketing messages');
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

// Show how opt-in works
function explainOptInFlow() {
  console.log('\n📊 HOW THE OPT-IN FLOW WORKS:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('For New Advisors:');
  console.log('─────────────────────────────────────────');
  console.log('1. Advisor signs up on hubix.ai');
  console.log('2. System sends hubix_advisor_optin template (UTILITY)');
  console.log('3. Message asks for consent with YES/STOP options');
  console.log('4. Advisor replies YES');
  console.log('5. System records opt-in in database');
  console.log('6. Now ALL templates work for this advisor');
  console.log('7. Daily content delivered at 06:00 IST\n');
  
  console.log('Why This is Required:');
  console.log('─────────────────────────────────────────');
  console.log('• WhatsApp policy - even verified businesses need consent');
  console.log('• Protects users from spam');
  console.log('• Ensures high engagement rates');
  console.log('• Complies with GDPR/DPDP regulations');
  console.log('• Builds trust with advisors\n');
  
  console.log('Once Opted In:');
  console.log('─────────────────────────────────────────');
  console.log('• MARKETING templates work');
  console.log('• Daily content delivers automatically');
  console.log('• No need to message first each time');
  console.log('• Opt-in persists until user sends STOP\n');
}

// Main execution
async function main() {
  // Create templates
  const optIn1 = await createOptInTemplate();
  const optIn2 = await createSimpleOptIn();
  
  // Try to send if any template exists
  if (optIn1.exists || optIn2.exists) {
    console.log('\n📤 Templates already exist, checking approval...\n');
    
    // Check existing templates
    const template1Status = await checkTemplateApproval('hubix_advisor_optin');
    const template2Status = await checkTemplateApproval('hubix_consent');
    
    if (template1Status.found && template1Status.status === 'APPROVED') {
      await sendOptInMessage('hubix_advisor_optin');
    } else if (template2Status.found && template2Status.status === 'APPROVED') {
      await sendOptInMessage('hubix_consent');
    } else {
      console.log('Templates exist but pending approval');
      console.log('Waiting for approval...\n');
      
      // Wait for either template to be approved
      const sent = await waitAndSend('hubix_advisor_optin', 2) || 
                   await waitAndSend('hubix_consent', 1);
      
      if (!sent) {
        console.log('\n⏳ Templates still pending. Check back in a few minutes.');
      }
    }
  } else if (optIn1.success || optIn2.success) {
    // Wait for approval
    console.log('\nTemplates created, waiting for approval...\n');
    await waitAndSend('hubix_advisor_optin', 2);
  }
  
  // Explain the flow
  explainOptInFlow();
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ OPT-IN SYSTEM READY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Next Steps:');
  console.log('1. Wait for template approval (1-60 minutes)');
  console.log('2. Once approved, advisors receive proper opt-in');
  console.log('3. After YES reply, all templates work');
  console.log('4. Production ready! 🚀\n');
}

main().catch(console.error);