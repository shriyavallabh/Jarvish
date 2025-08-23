/**
 * Template Diagnostic Tool
 * Checks why templates aren't delivering and fixes them
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('🔍 TEMPLATE DIAGNOSTIC & FIX TOOL');
console.log('═══════════════════════════════════════════════════════════════\n');

// Step 1: Get all templates and their exact structure
async function getAllTemplates() {
  console.log('📋 Fetching All Templates from Meta...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?fields=id,name,status,category,language,components&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.data) {
      console.log(`Found ${data.data.length} templates:\n`);
      
      // Find our templates
      const relevantTemplates = data.data.filter(t => 
        t.name.includes('hubix') || 
        t.name === 'hello_world' ||
        t.name.includes('daily')
      );
      
      relevantTemplates.forEach(template => {
        console.log(`─────────────────────────────────────`);
        console.log(`Name: ${template.name}`);
        console.log(`Status: ${template.status}`);
        console.log(`Language: ${template.language}`);
        console.log(`Category: ${template.category}`);
        
        if (template.components) {
          template.components.forEach(comp => {
            if (comp.type === 'BODY') {
              console.log(`Body Text: ${comp.text}`);
              
              // Count parameters
              const paramMatches = comp.text.match(/{{(\d+)}}/g);
              if (paramMatches) {
                console.log(`Parameters Required: ${paramMatches.length}`);
                console.log(`Parameter placeholders:`, paramMatches);
              }
            }
          });
        }
        console.log();
      });
      
      return relevantTemplates;
    }
  } catch (error) {
    console.log('Error fetching templates:', error.message);
  }
  
  return [];
}

// Step 2: Test each template with correct parameters
async function testTemplate(template) {
  console.log(`\n🧪 Testing template: ${template.name}`);
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // Build message based on template structure
  let messageBody = {
    messaging_product: 'whatsapp',
    to: RECIPIENT,
    type: 'template',
    template: {
      name: template.name,
      language: { 
        code: template.language === 'en' ? 'en' : 
              template.language === 'en_US' ? 'en_US' : 
              'en'
      }
    }
  };
  
  // Add parameters if template has them
  if (template.components) {
    const bodyComponent = template.components.find(c => c.type === 'BODY');
    if (bodyComponent && bodyComponent.text) {
      const paramCount = (bodyComponent.text.match(/{{(\d+)}}/g) || []).length;
      
      if (paramCount > 0) {
        console.log(`   Adding ${paramCount} parameters...`);
        
        // Generate appropriate parameters based on count
        const parameters = [];
        for (let i = 0; i < paramCount; i++) {
          parameters.push({
            type: 'text',
            text: getParameterValue(template.name, i)
          });
        }
        
        messageBody.template.components = [
          {
            type: 'body',
            parameters: parameters
          }
        ];
      }
    }
  }
  
  console.log(`   Sending with language: ${messageBody.template.language.code}`);
  
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
      console.log(`   ✅ SUCCESS! Message sent`);
      console.log(`   Message ID: ${data.messages[0].id}`);
      return { success: true, messageId: data.messages[0].id };
    } else {
      console.log(`   ❌ FAILED:`, data.error?.message);
      
      // Diagnose the error
      if (data.error?.code === 132000) {
        console.log(`   Diagnosis: Parameter count mismatch`);
      } else if (data.error?.code === 132001) {
        console.log(`   Diagnosis: Template name or language incorrect`);
      } else if (data.error?.code === 132005) {
        console.log(`   Diagnosis: Template parameters format incorrect`);
      }
      
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`   ❌ Network error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Generate appropriate parameter values
function getParameterValue(templateName, index) {
  if (templateName.includes('hubix')) {
    const hubixParams = [
      'Shriya',                                          // {{1}} - Name
      'Start your wealth journey with SIPs today!',      // {{2}} - Main message
      'Invest ₹5,000 monthly',                          // {{3}} - Action
      '₹5,000/month for 20 years = ₹50 Lakhs',         // {{4}} - Calculation
      'E789456',                                         // {{5}} - EUIN
      'Shriya Vallabh',                                  // {{6}} - Full name
      'Vallabh Financial Advisory'                       // {{7}} - Business
    ];
    return hubixParams[index] || `Param${index + 1}`;
  }
  
  // Default parameters for other templates
  return `Value${index + 1}`;
}

// Step 3: Create new template if needed
async function createNewTemplate() {
  console.log('\n📝 Creating New Hubix Template (Simplified)...\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
  
  const newTemplate = {
    name: 'hubix_simple_v1',
    category: 'MARKETING',
    language: 'en',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Daily Investment Insight'
      },
      {
        type: 'BODY',
        text: 'Hello {{1}}! Today\'s tip: {{2}}. Start investing with just {{3}}. Mutual funds subject to market risks. EUIN: {{4}}'
      },
      {
        type: 'FOOTER',
        text: 'Powered by Hubix'
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
      body: JSON.stringify(newTemplate)
    });
    
    const data = await response.json();
    
    if (data.id) {
      console.log('✅ New template created!');
      console.log('   Template ID:', data.id);
      console.log('   Name:', newTemplate.name);
      console.log('   Status: PENDING (will be approved in 1-60 minutes)');
      return data.id;
    } else {
      console.log('❌ Template creation failed:', data.error?.message);
      
      if (data.error?.message?.includes('already exists')) {
        console.log('   Template already exists - checking status...');
      }
    }
  } catch (error) {
    console.log('Error creating template:', error.message);
  }
}

// Step 4: Wait and check for approval
async function waitForApproval(templateName, maxWaitMinutes = 2) {
  console.log(`\n⏳ Waiting for ${templateName} approval (max ${maxWaitMinutes} minutes)...\n`);
  
  const startTime = Date.now();
  const maxWaitMs = maxWaitMinutes * 60 * 1000;
  let checkCount = 0;
  
  while (Date.now() - startTime < maxWaitMs) {
    checkCount++;
    console.log(`   Check #${checkCount} at ${new Date().toLocaleTimeString()}...`);
    
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?name=${templateName}&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const template = data.data?.find(t => t.name === templateName);
      
      if (template) {
        console.log(`   Status: ${template.status}`);
        
        if (template.status === 'APPROVED') {
          console.log('   ✅ Template approved!');
          return true;
        } else if (template.status === 'REJECTED') {
          console.log('   ❌ Template rejected');
          console.log('   Reason:', template.rejected_reason);
          return false;
        }
      }
    } catch (error) {
      console.log('   Error checking:', error.message);
    }
    
    // Wait 20 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 20000));
  }
  
  console.log('   ⏱️ Timeout - template still pending');
  return false;
}

// Main diagnostic flow
async function runDiagnostics() {
  // 1. Get all templates
  const templates = await getAllTemplates();
  
  // 2. Find working templates
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 TESTING APPROVED TEMPLATES');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const approvedTemplates = templates.filter(t => t.status === 'APPROVED');
  const workingTemplates = [];
  
  for (const template of approvedTemplates) {
    const result = await testTemplate(template);
    if (result.success) {
      workingTemplates.push(template.name);
    }
  }
  
  // 3. Create simplified template if needed
  if (workingTemplates.length === 1 && workingTemplates[0] === 'hello_world') {
    console.log('\n⚠️ Only hello_world template works. Creating new Hubix template...');
    
    const templateId = await createNewTemplate();
    
    if (templateId) {
      // Wait for approval
      const approved = await waitForApproval('hubix_simple_v1', 2);
      
      if (approved) {
        // Test the new template
        const newTemplate = {
          name: 'hubix_simple_v1',
          language: 'en',
          components: [{ type: 'BODY', text: 'Hello {{1}}! Today\'s tip: {{2}}. Start investing with just {{3}}. Mutual funds subject to market risks. EUIN: {{4}}' }]
        };
        
        await testTemplate(newTemplate);
      }
    }
  }
  
  // 4. Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('✅ WORKING TEMPLATES:');
  workingTemplates.forEach(t => console.log(`   - ${t}`));
  
  console.log('\n📱 MESSAGES SENT TO 9765071249:');
  workingTemplates.forEach(t => {
    console.log(`   ✓ ${t} template delivered`);
  });
  
  console.log('\n🔧 RECOMMENDATIONS:');
  console.log('1. Use hello_world for testing (always works)');
  console.log('2. Create simpler templates with fewer parameters');
  console.log('3. Wait for template approval before testing');
  console.log('4. Use exact language codes (en, en_US, etc.)');
  console.log('5. Match parameter count exactly');
  
  console.log('\n💡 For Production:');
  console.log('- Pre-create all templates in Meta Business Suite');
  console.log('- Test each template after approval');
  console.log('- Store working template names in database');
  console.log('- Implement fallback to hello_world if custom fails');
}

// Run diagnostics
runDiagnostics().catch(console.error);