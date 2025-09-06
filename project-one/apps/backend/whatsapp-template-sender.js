#!/usr/bin/env node

/**
 * WhatsApp Template Message Sender
 * Uses approved templates for guaranteed delivery
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const CONFIG = {
  accessToken: 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD',
  phoneNumberId: '574744175733556',
  businessAccountId: '1861646317956355',
  apiVersion: 'v21.0'
};

const API_BASE = `https://graph.facebook.com/${CONFIG.apiVersion}`;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colorMap = {
    error: colors.red,
    success: colors.green,
    warning: colors.yellow,
    info: colors.cyan,
    header: colors.blue + colors.bright
  };
  console.log(`${colorMap[type] || ''}[${timestamp}] ${message}${colors.reset}`);
}

function printHeader() {
  console.clear();
  console.log(colors.bright + colors.cyan);
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              WHATSAPP TEMPLATE MESSAGE SENDER - JARVISH                   ║');
  console.log('║                     Send Pre-Approved Template Messages                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

/**
 * Get available templates
 */
async function getTemplates() {
  try {
    const response = await axios.get(
      `${API_BASE}/${CONFIG.businessAccountId}/message_templates`,
      {
        params: {
          access_token: CONFIG.accessToken,
          limit: 100,
          fields: 'name,status,language,category,components'
        }
      }
    );
    
    const templates = response.data.data || [];
    const approvedTemplates = templates.filter(t => t.status === 'APPROVED');
    
    return approvedTemplates;
  } catch (error) {
    log(`Failed to fetch templates: ${error.response?.data?.error?.message || error.message}`, 'error');
    return [];
  }
}

/**
 * Display template menu
 */
async function selectTemplate(templates) {
  console.log('\n📋 Available Templates:\n');
  
  templates.forEach((template, index) => {
    console.log(`  ${index + 1}. ${colors.bright}${template.name}${colors.reset}`);
    console.log(`     Language: ${template.language}`);
    console.log(`     Category: ${template.category}`);
    
    // Show template content
    const bodyComponent = template.components?.find(c => c.type === 'BODY');
    if (bodyComponent) {
      const text = bodyComponent.text || '';
      const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
      console.log(`     Content: ${colors.cyan}${preview}${colors.reset}`);
    }
    console.log();
  });
  
  return new Promise((resolve) => {
    rl.question('Select template number (or 0 to use hello_world): ', (answer) => {
      const selection = parseInt(answer);
      if (selection === 0) {
        resolve(null); // Use default hello_world
      } else if (selection > 0 && selection <= templates.length) {
        resolve(templates[selection - 1]);
      } else {
        log('Invalid selection, using hello_world', 'warning');
        resolve(null);
      }
    });
  });
}

/**
 * Get recipient phone number
 */
async function getRecipient() {
  return new Promise((resolve) => {
    rl.question(`Enter recipient number (or press Enter for default +91 9765071249): `, (answer) => {
      if (!answer || answer.trim() === '') {
        resolve('919765071249');
      } else {
        // Clean up the number
        let cleaned = answer.replace(/[\s\-\+\(\)]/g, '');
        
        // Add country code if missing
        if (!cleaned.startsWith('91') && cleaned.length === 10) {
          cleaned = '91' + cleaned;
        }
        
        resolve(cleaned);
      }
    });
  });
}

/**
 * Send template message
 */
async function sendTemplateMessage(recipient, template) {
  log(`Sending template message to ${recipient}...`, 'info');
  
  let messagePayload;
  
  if (!template) {
    // Use hello_world template (universally available)
    messagePayload = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US'
        }
      }
    };
  } else {
    // Use selected template
    messagePayload = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: template.name,
        language: {
          code: template.language
        }
      }
    };
    
    // Add components if template has variables
    const hasVariables = template.components?.some(c => 
      c.text && c.text.includes('{{')
    );
    
    if (hasVariables) {
      log('Template has variables, using default values', 'info');
      messagePayload.template.components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Jarvish User' },
            { type: 'text', text: 'Test Value 1' },
            { type: 'text', text: 'Test Value 2' }
          ].slice(0, 3) // Use only needed parameters
        }
      ];
    }
  }
  
  console.log('\n📦 Message Payload:');
  console.log(JSON.stringify(messagePayload, null, 2));
  
  try {
    const response = await axios.post(
      `${API_BASE}/${CONFIG.phoneNumberId}/messages`,
      messagePayload,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log('✅ Message sent successfully!', 'success');
    console.log('\n📱 Message Details:');
    console.log(`  Message ID: ${response.data.messages[0].id}`);
    console.log(`  Status: Accepted for delivery`);
    console.log(`  Recipient: +${recipient}`);
    
    return response.data.messages[0].id;
    
  } catch (error) {
    log('❌ Failed to send message!', 'error');
    
    if (error.response?.data?.error) {
      const err = error.response.data.error;
      console.log('\n🔍 Error Analysis:');
      console.log(`  Code: ${err.code}`);
      console.log(`  Type: ${err.type}`);
      console.log(`  Message: ${err.message}`);
      
      // Provide solutions
      interpretError(err.code);
    }
    
    return null;
  }
}

/**
 * Send regular text message (requires 24-hour window)
 */
async function sendRegularMessage(recipient) {
  log('Attempting to send regular text message...', 'info');
  log('Note: This only works if customer messaged you in last 24 hours', 'warning');
  
  const messagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: {
      preview_url: false,
      body: `🎯 Test Message from Jarvish

Hello! This is a test message to verify WhatsApp delivery.

If you receive this message, the WhatsApp integration is working correctly.

Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Please reply with "YES" to confirm receipt.

Thank you!
- Jarvish Team`
    }
  };
  
  try {
    const response = await axios.post(
      `${API_BASE}/${CONFIG.phoneNumberId}/messages`,
      messagePayload,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log('✅ Regular message sent successfully!', 'success');
    console.log(`  Message ID: ${response.data.messages[0].id}`);
    return response.data.messages[0].id;
    
  } catch (error) {
    if (error.response?.data?.error?.code === 131031) {
      log('24-hour window expired. Customer needs to message you first.', 'warning');
      log('Switching to template message...', 'info');
      return null;
    } else {
      log(`Failed: ${error.response?.data?.error?.message || error.message}`, 'error');
      return null;
    }
  }
}

/**
 * Interpret error codes
 */
function interpretError(code) {
  const solutions = {
    132015: {
      problem: 'Template parameter count mismatch',
      solution: 'Check the template variables and provide correct number of parameters'
    },
    132016: {
      problem: 'Template format incorrect',
      solution: 'Ensure template name and language code match exactly'
    },
    131031: {
      problem: '24-hour session window expired',
      solution: 'Use a template message or wait for customer to message first'
    },
    131047: {
      problem: 'Recipient not on WhatsApp',
      solution: 'Verify the phone number has WhatsApp installed'
    },
    131026: {
      problem: 'Recipient may have blocked you',
      solution: 'Ask recipient to unblock your number'
    },
    131048: {
      problem: 'Template not found or not approved',
      solution: 'Check template name and approval status in Business Manager'
    },
    100: {
      problem: 'Invalid parameter in request',
      solution: 'Check the message format and required fields'
    }
  };
  
  const errorInfo = solutions[code];
  if (errorInfo) {
    console.log(`\n💡 ${colors.yellow}Solution:${colors.reset}`);
    console.log(`  Problem: ${errorInfo.problem}`);
    console.log(`  Fix: ${errorInfo.solution}`);
  }
}

/**
 * Check delivery instructions
 */
function showDeliveryInstructions() {
  console.log('\n' + '='.repeat(80));
  console.log(colors.bright + colors.green);
  console.log('📋 MESSAGE DELIVERY CHECKLIST:');
  console.log(colors.reset);
  
  console.log('\n✅ Message has been accepted by WhatsApp');
  console.log('\n🔍 To verify actual delivery:');
  console.log('  1. Check the recipient\'s WhatsApp for the message');
  console.log('  2. Look for two gray checkmarks (delivered)');
  console.log('  3. Look for two blue checkmarks (read)');
  
  console.log('\n❓ If message doesn\'t arrive:');
  console.log('  1. Verify recipient has WhatsApp installed and active');
  console.log('  2. Check if recipient has blocked your business number');
  console.log('  3. Ensure recipient\'s phone has internet connection');
  console.log('  4. Try sending to a different number to isolate the issue');
  
  console.log('\n🔧 Technical Checks:');
  console.log('  1. Set up webhooks to receive delivery confirmations');
  console.log('  2. Check Meta Business Suite for any warnings');
  console.log('  3. Verify phone number quality rating is GREEN');
  console.log('  4. Ensure business verification is complete');
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Main menu
 */
async function mainMenu() {
  printHeader();
  
  console.log('\n📱 WhatsApp Message Options:\n');
  console.log('  1. Send Template Message (Always works)');
  console.log('  2. Send Regular Text (Requires 24-hour window)');
  console.log('  3. List Available Templates');
  console.log('  4. Test hello_world Template');
  console.log('  5. Exit');
  
  return new Promise((resolve) => {
    rl.question('\nSelect option: ', (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  let running = true;
  
  while (running) {
    const choice = await mainMenu();
    
    switch (choice) {
      case '1': {
        // Send template message
        console.log('\n' + '='.repeat(80));
        const templates = await getTemplates();
        
        if (templates.length === 0) {
          log('No approved templates found!', 'error');
          break;
        }
        
        const template = await selectTemplate(templates);
        const recipient = await getRecipient();
        
        const messageId = await sendTemplateMessage(recipient, template);
        if (messageId) {
          showDeliveryInstructions();
        }
        
        console.log('\nPress Enter to continue...');
        await new Promise(resolve => rl.question('', resolve));
        break;
      }
      
      case '2': {
        // Send regular text
        console.log('\n' + '='.repeat(80));
        const recipient = await getRecipient();
        
        let messageId = await sendRegularMessage(recipient);
        if (!messageId) {
          log('Falling back to template message...', 'info');
          messageId = await sendTemplateMessage(recipient, null);
        }
        
        if (messageId) {
          showDeliveryInstructions();
        }
        
        console.log('\nPress Enter to continue...');
        await new Promise(resolve => rl.question('', resolve));
        break;
      }
      
      case '3': {
        // List templates
        console.log('\n' + '='.repeat(80));
        const templates = await getTemplates();
        
        if (templates.length === 0) {
          log('No approved templates found!', 'error');
        } else {
          console.log(`\n📋 Found ${templates.length} approved templates:\n`);
          templates.forEach((t, i) => {
            console.log(`  ${i + 1}. ${t.name} (${t.language}) - ${t.category}`);
          });
        }
        
        console.log('\nPress Enter to continue...');
        await new Promise(resolve => rl.question('', resolve));
        break;
      }
      
      case '4': {
        // Quick test with hello_world
        console.log('\n' + '='.repeat(80));
        log('Sending hello_world template to default number...', 'info');
        
        const messageId = await sendTemplateMessage('919765071249', null);
        if (messageId) {
          showDeliveryInstructions();
        }
        
        console.log('\nPress Enter to continue...');
        await new Promise(resolve => rl.question('', resolve));
        break;
      }
      
      case '5': {
        running = false;
        break;
      }
      
      default: {
        log('Invalid option', 'error');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.log(colors.bright + colors.green);
  console.log('\n👋 Thank you for using Jarvish WhatsApp Template Sender!');
  console.log(colors.reset);
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});

// Run main
main().catch(error => {
  log(`Error: ${error.message}`, 'error');
  process.exit(1);
});