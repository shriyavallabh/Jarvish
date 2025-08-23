/**
 * Opt-in Consent Recording System
 * Explains how consent is tracked and sends button template
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

console.log('🔐 HOW WHATSAPP OPT-IN CONSENT ACTUALLY WORKS');
console.log('═══════════════════════════════════════════════════════════════\n');

// Explain the consent system
function explainConsentSystem() {
  console.log('📊 WHO TRACKS CONSENT & HOW?\n');
  
  console.log('1️⃣ WHATSAPP/META TRACKING:');
  console.log('─────────────────────────────────────────');
  console.log('• WhatsApp does NOT store opt-in consent automatically');
  console.log('• They only track: 24-hour conversation windows');
  console.log('• They enforce: Template categories (UTILITY vs MARKETING)');
  console.log('• They monitor: Quality ratings and spam reports');
  console.log('• They DON\'T track: Who said YES or NO to your business\n');
  
  console.log('2️⃣ YOUR BUSINESS MUST TRACK CONSENT:');
  console.log('─────────────────────────────────────────');
  console.log('• YOU must store: User opt-in status');
  console.log('• YOU must record: Timestamp of consent');
  console.log('• YOU must honor: Opt-out requests (STOP)');
  console.log('• YOU must maintain: Consent database');
  console.log('• This is YOUR responsibility, not WhatsApp\'s!\n');
  
  console.log('3️⃣ HOW CONSENT RECORDING WORKS:');
  console.log('─────────────────────────────────────────');
  console.log('Step 1: Send opt-in template with buttons');
  console.log('Step 2: User clicks YES button');
  console.log('Step 3: WhatsApp sends webhook to your server:');
  console.log('        {');
  console.log('          "from": "919765071249",');
  console.log('          "type": "button_reply",');
  console.log('          "button_text": "YES"');
  console.log('        }');
  console.log('Step 4: YOUR server records in database:');
  console.log('        {');
  console.log('          "phone": "919765071249",');
  console.log('          "opted_in": true,');
  console.log('          "consent_date": "2025-08-23",');
  console.log('          "consent_method": "button_click"');
  console.log('        }');
  console.log('Step 5: YOUR server decides who gets marketing messages\n');
  
  console.log('4️⃣ CURRENT STATUS FOR YOUR NUMBERS:');
  console.log('─────────────────────────────────────────');
  console.log('919765071249 (You):');
  console.log('  • WhatsApp knows: You messaged back (24hr window open)');
  console.log('  • WhatsApp doesn\'t know: You consented to marketing');
  console.log('  • Our system should record: opted_in = true');
  console.log('');
  console.log('918975758513:');
  console.log('  • WhatsApp knows: Nothing (no reply yet)');
  console.log('  • WhatsApp doesn\'t know: Any consent status');
  console.log('  • Our system should record: opted_in = pending\n');
}

// Show how to implement consent database
function showConsentDatabase() {
  console.log('💾 IMPLEMENTING CONSENT DATABASE\n');
  
  console.log('OPTION 1: SUPABASE (Already in your project):');
  console.log('─────────────────────────────────────────');
  console.log('```sql');
  console.log('CREATE TABLE whatsapp_consent (');
  console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
  console.log('  phone_number VARCHAR(20) UNIQUE NOT NULL,');
  console.log('  advisor_id UUID REFERENCES advisors(id),');
  console.log('  opted_in BOOLEAN DEFAULT false,');
  console.log('  consent_date TIMESTAMP,');
  console.log('  opt_out_date TIMESTAMP,');
  console.log('  consent_method VARCHAR(50), -- "button", "text", "website"');
  console.log('  conversation_window_expires TIMESTAMP,');
  console.log('  created_at TIMESTAMP DEFAULT NOW(),');
  console.log('  updated_at TIMESTAMP DEFAULT NOW()');
  console.log(');');
  console.log('```\n');
  
  console.log('OPTION 2: SIMPLE JSON FILE (For testing):');
  console.log('─────────────────────────────────────────');
  console.log('```javascript');
  console.log('// consent-database.json');
  console.log('{');
  console.log('  "919765071249": {');
  console.log('    "opted_in": true,');
  console.log('    "consent_date": "2025-08-23T14:00:00Z",');
  console.log('    "method": "text_reply_yes"');
  console.log('  },');
  console.log('  "918975758513": {');
  console.log('    "opted_in": false,');
  console.log('    "consent_date": null,');
  console.log('    "method": null');
  console.log('  }');
  console.log('}');
  console.log('```\n');
}

// Create local consent tracking
const fs = require('fs');
const path = require('path');

function initConsentDatabase() {
  const dbPath = path.join(__dirname, 'consent-database.json');
  
  if (!fs.existsSync(dbPath)) {
    const initialDb = {
      "919765071249": {
        opted_in: true,
        consent_date: new Date().toISOString(),
        method: "text_reply_yes",
        conversation_window: new Date(Date.now() + 24*60*60*1000).toISOString()
      },
      "918975758513": {
        opted_in: false,
        consent_date: null,
        method: null,
        conversation_window: null
      }
    };
    
    fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
    console.log('✅ Created local consent database\n');
  }
  
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Check consent status
function checkConsentStatus(phone) {
  const db = initConsentDatabase();
  const consent = db[phone];
  
  if (consent && consent.opted_in) {
    console.log(`✅ ${phone}: OPTED IN`);
    console.log(`   Date: ${consent.consent_date}`);
    console.log(`   Method: ${consent.method}`);
  } else {
    console.log(`❌ ${phone}: NOT OPTED IN`);
    console.log(`   Status: Waiting for consent`);
  }
  
  return consent;
}

// Send button template to 8975758513
async function sendButtonTemplateToSecondNumber() {
  console.log('\n📤 SENDING BUTTON OPT-IN TO 8975758513...\n');
  
  const RECIPIENT = '918975758513';
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // First check which templates are approved
  const checkUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const checkResponse = await fetch(checkUrl);
    const templates = await checkResponse.json();
    
    // Find button templates
    const buttonTemplates = templates.data?.filter(t => 
      (t.name.includes('consent') || t.name.includes('optin')) && 
      t.status === 'APPROVED'
    );
    
    if (buttonTemplates && buttonTemplates.length > 0) {
      const template = buttonTemplates[0];
      console.log(`Using template: ${template.name}\n`);
      
      const message = {
        messaging_product: 'whatsapp',
        to: RECIPIENT,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language || 'en' }
        }
      };
      
      // Add parameters if needed
      if (template.name === 'hubix_quick_consent') {
        message.template.components = [{
          type: 'body',
          parameters: [
            { type: 'text', text: 'Advisor' },
            { type: 'text', text: '06:00' }
          ]
        }];
      }
      
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
        console.log('✅ Button opt-in sent to 8975758513!');
        console.log('  Message ID:', data.messages[0].id);
        console.log('\n📱 WHAT HAPPENS NEXT:');
        console.log('  1. User sees message with YES/NO buttons');
        console.log('  2. User taps YES button');
        console.log('  3. Our webhook receives the button click');
        console.log('  4. We record consent in database');
        console.log('  5. Marketing messages start delivering\n');
        return true;
      } else {
        console.log('❌ Failed:', data.error?.message);
      }
    } else {
      // Fallback to hello_world
      console.log('No button templates approved yet');
      console.log('Sending hello_world as fallback...\n');
      
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
        console.log('✅ Hello world sent (buttons pending approval)');
        console.log('  8975758513 should reply to enable messages\n');
      }
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

// Simulate webhook handling
function simulateWebhookHandler() {
  console.log('🔄 HOW WEBHOOK HANDLES CONSENT:\n');
  
  console.log('```javascript');
  console.log('// When user clicks YES button, webhook receives:');
  console.log('app.post("/webhook", (req, res) => {');
  console.log('  const message = req.body.entry[0].changes[0].value.messages[0];');
  console.log('  ');
  console.log('  if (message.type === "interactive") {');
  console.log('    const buttonReply = message.interactive.button_reply;');
  console.log('    ');
  console.log('    if (buttonReply.id === "yes_button") {');
  console.log('      // Record consent in database');
  console.log('      await supabase');
  console.log('        .from("whatsapp_consent")');
  console.log('        .upsert({');
  console.log('          phone_number: message.from,');
  console.log('          opted_in: true,');
  console.log('          consent_date: new Date(),');
  console.log('          consent_method: "button_click"');
  console.log('        });');
  console.log('      ');
  console.log('      // Send welcome message');
  console.log('      await sendWelcomeMessage(message.from);');
  console.log('    }');
  console.log('  }');
  console.log('});');
  console.log('```\n');
}

// Main execution
async function main() {
  console.log('Starting consent system analysis...\n');
  
  // Explain the system
  explainConsentSystem();
  
  // Show database implementation
  showConsentDatabase();
  
  // Check current consent status
  console.log('📋 CURRENT CONSENT STATUS:\n');
  checkConsentStatus('919765071249');
  console.log('');
  checkConsentStatus('918975758513');
  
  // Send button template
  await sendButtonTemplateToSecondNumber();
  
  // Show webhook handling
  simulateWebhookHandler();
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 CONSENT SYSTEM SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('KEY POINTS:');
  console.log('• WhatsApp does NOT track consent - YOU must');
  console.log('• Consent must be stored in YOUR database');
  console.log('• Webhooks notify you of user responses');
  console.log('• Your system decides who gets marketing messages\n');
  
  console.log('FOR 919765071249:');
  console.log('• Consent recorded locally (you replied YES)');
  console.log('• 24-hour window active');
  console.log('• Marketing templates working\n');
  
  console.log('FOR 918975758513:');
  console.log('• No consent recorded yet');
  console.log('• Needs to click YES button or reply');
  console.log('• Only UTILITY templates work until then\n');
  
  console.log('PRODUCTION REQUIREMENTS:');
  console.log('1. Set up webhook endpoint');
  console.log('2. Create consent database (Supabase)');
  console.log('3. Record all opt-ins/opt-outs');
  console.log('4. Check consent before sending marketing');
  console.log('5. Honor STOP requests immediately\n');
}

main().catch(console.error);