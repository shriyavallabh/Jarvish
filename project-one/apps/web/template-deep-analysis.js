/**
 * Deep Template Analysis & Delivery Verification
 * Comprehensive analysis of why only hello_world delivers
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('🔬 DEEP TEMPLATE ANALYSIS & DELIVERY VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// Store all template details for analysis
const templateAnalysis = [];

// Step 1: Get COMPLETE template information
async function getCompleteTemplateInfo() {
  console.log('📊 FETCHING COMPLETE TEMPLATE INFORMATION\n');
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?fields=id,name,status,category,language,components,rejected_reason,quality_score&limit=100&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.data) {
      // Filter relevant templates
      const templates = data.data.filter(t => 
        t.name === 'hello_world' ||
        t.name.includes('hubix') ||
        t.name.includes('daily')
      );
      
      // Analyze each template
      for (const template of templates) {
        const analysis = {
          name: template.name,
          id: template.id,
          status: template.status,
          category: template.category,
          language: template.language,
          quality_score: template.quality_score,
          rejected_reason: template.rejected_reason || null,
          parameters: [],
          body_text: '',
          header_text: '',
          footer_text: '',
          buttons: [],
          can_send: false,
          test_result: null
        };
        
        // Extract components
        if (template.components) {
          for (const comp of template.components) {
            if (comp.type === 'BODY') {
              analysis.body_text = comp.text;
              // Count parameters
              const params = comp.text.match(/\{\{(\d+)\}\}/g);
              if (params) {
                analysis.parameters = params.map(p => {
                  const num = p.match(/\d+/)[0];
                  return {
                    placeholder: p,
                    number: parseInt(num),
                    example: comp.example?.body_text?.[0]?.[parseInt(num) - 1] || `Value${num}`
                  };
                });
              }
            } else if (comp.type === 'HEADER') {
              analysis.header_text = comp.text || comp.format || '';
            } else if (comp.type === 'FOOTER') {
              analysis.footer_text = comp.text || '';
            } else if (comp.type === 'BUTTONS') {
              analysis.buttons = comp.buttons || [];
            }
          }
        }
        
        templateAnalysis.push(analysis);
      }
      
      return templateAnalysis;
    }
  } catch (error) {
    console.log('Error fetching templates:', error.message);
    return [];
  }
}

// Step 2: Test each template with exact parameters
async function testTemplateDelivery(template) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // Build the message
  let messageBody = {
    messaging_product: 'whatsapp',
    to: RECIPIENT,
    type: 'template',
    template: {
      name: template.name,
      language: { code: template.language || 'en' }
    }
  };
  
  // Add parameters if needed
  if (template.parameters.length > 0) {
    const parameters = template.parameters.map(p => ({
      type: 'text',
      text: p.example || `Test${p.number}`
    }));
    
    messageBody.template.components = [{
      type: 'body',
      parameters: parameters
    }];
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
      return {
        success: true,
        messageId: data.messages[0].id,
        status: 'SENT_TO_API'
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Unknown error',
        error_code: data.error?.code
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Step 3: Create detailed analysis table
function createAnalysisTable(templates) {
  console.log('\n📋 TEMPLATE ANALYSIS TABLE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Create header
  console.log('┌─────────────────────────┬──────────┬──────────┬───────┬────────────┬─────────────┬──────────────┐');
  console.log('│ Template Name           │ Status   │ Language │ Params│ Category   │ Can Send    │ Test Result  │');
  console.log('├─────────────────────────┼──────────┼──────────┼───────┼────────────┼─────────────┼──────────────┤');
  
  templates.forEach(t => {
    const name = t.name.padEnd(23).substring(0, 23);
    const status = (t.status || 'UNKNOWN').padEnd(8).substring(0, 8);
    const lang = (t.language || 'N/A').padEnd(8).substring(0, 8);
    const params = String(t.parameters.length).padEnd(5);
    const category = (t.category || 'N/A').padEnd(10).substring(0, 10);
    const canSend = t.can_send ? '✅ Yes      ' : '❌ No       ';
    const testResult = t.test_result ? 
      (t.test_result.success ? '✅ Sent     ' : '❌ Failed   ') : 
      '⏳ Pending  ';
    
    console.log(`│ ${name} │ ${status} │ ${lang} │ ${params} │ ${category} │ ${canSend} │ ${testResult} │`);
  });
  
  console.log('└─────────────────────────┴──────────┴──────────┴───────┴────────────┴─────────────┴──────────────┘\n');
}

// Step 4: Show template details
function showTemplateDetails(template) {
  console.log(`\n📝 TEMPLATE: ${template.name}`);
  console.log('─────────────────────────────────────────────────');
  console.log(`Status: ${template.status}`);
  console.log(`Language: ${template.language}`);
  console.log(`Category: ${template.category}`);
  console.log(`Quality Score: ${template.quality_score || 'N/A'}`);
  
  if (template.header_text) {
    console.log(`\nHeader: "${template.header_text}"`);
  }
  
  console.log(`\nBody Text:`);
  console.log(`"${template.body_text}"`);
  
  if (template.footer_text) {
    console.log(`\nFooter: "${template.footer_text}"`);
  }
  
  if (template.parameters.length > 0) {
    console.log(`\nParameters Required: ${template.parameters.length}`);
    template.parameters.forEach(p => {
      console.log(`  ${p.placeholder} → Example: "${p.example}"`);
    });
  }
  
  if (template.test_result) {
    console.log(`\nTest Result:`);
    if (template.test_result.success) {
      console.log(`  ✅ Sent successfully`);
      console.log(`  Message ID: ${template.test_result.messageId}`);
    } else {
      console.log(`  ❌ Failed to send`);
      console.log(`  Error: ${template.test_result.error}`);
      console.log(`  Error Code: ${template.test_result.error_code}`);
    }
  }
  
  if (template.rejected_reason) {
    console.log(`\n⚠️ Rejection Reason: ${template.rejected_reason}`);
  }
}

// Step 5: Try different parameter combinations
async function tryDifferentParameters(template) {
  console.log(`\n🔧 TRYING DIFFERENT PARAMETER COMBINATIONS FOR: ${template.name}\n`);
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // Different parameter sets to try
  const parameterSets = [
    // Set 1: Simple values
    template.parameters.map((p, i) => ({ type: 'text', text: `Value${i+1}` })),
    
    // Set 2: Actual content
    template.parameters.map((p, i) => {
      const values = [
        'Shriya',
        'Start SIP today with ₹5000',
        'Review your portfolio',
        '₹5000/month = ₹50 Lakhs in 20 years',
        'E123456',
        'Shriya Vallabh',
        'Hubix Advisory'
      ];
      return { type: 'text', text: values[i] || `Param${i+1}` };
    }),
    
    // Set 3: Minimal values
    template.parameters.map(() => ({ type: 'text', text: 'Test' }))
  ];
  
  let successCount = 0;
  
  for (let i = 0; i < parameterSets.length; i++) {
    console.log(`Attempt ${i+1}: Testing with parameter set ${i+1}`);
    
    const messageBody = {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language }
      }
    };
    
    if (template.parameters.length > 0) {
      messageBody.template.components = [{
        type: 'body',
        parameters: parameterSets[i]
      }];
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
        console.log(`  ✅ Success with parameter set ${i+1}`);
        console.log(`     Message ID: ${data.messages[0].id}`);
        successCount++;
        
        // Wait 2 seconds between sends
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`  ❌ Failed with parameter set ${i+1}`);
        console.log(`     Error: ${data.error?.message}`);
      }
    } catch (error) {
      console.log(`  ❌ Network error: ${error.message}`);
    }
  }
  
  return successCount;
}

// Main analysis
async function runDeepAnalysis() {
  // 1. Get all templates
  const templates = await getCompleteTemplateInfo();
  
  // 2. Test each template
  console.log('\n🧪 TESTING EACH TEMPLATE\n');
  
  for (const template of templates) {
    console.log(`Testing ${template.name}...`);
    
    // Check if can send
    template.can_send = template.status === 'APPROVED';
    
    if (template.can_send) {
      template.test_result = await testTemplateDelivery(template);
      
      if (template.test_result.success) {
        console.log(`  ✅ API accepted the message`);
      } else {
        console.log(`  ❌ API rejected: ${template.test_result.error}`);
      }
    } else {
      console.log(`  ⏭️ Skipped (not approved)`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 3. Show analysis table
  createAnalysisTable(templates);
  
  // 4. Show details for each template
  console.log('\n📄 DETAILED TEMPLATE ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  templates.forEach(t => showTemplateDetails(t));
  
  // 5. Try different parameters for failing templates
  const failingTemplates = templates.filter(t => 
    t.can_send && 
    t.test_result && 
    !t.test_result.success &&
    t.parameters.length > 0
  );
  
  if (failingTemplates.length > 0) {
    console.log('\n🔧 ATTEMPTING TO FIX FAILING TEMPLATES');
    console.log('═══════════════════════════════════════════════════════════════');
    
    for (const template of failingTemplates) {
      const successCount = await tryDifferentParameters(template);
      console.log(`\n  Result: ${successCount}/3 parameter sets worked\n`);
    }
  }
  
  // 6. Final recommendations
  console.log('\n💡 DIAGNOSIS & RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const workingTemplates = templates.filter(t => t.test_result?.success);
  const failedTemplates = templates.filter(t => t.test_result && !t.test_result.success);
  
  console.log(`✅ WORKING TEMPLATES (${workingTemplates.length}):`);
  workingTemplates.forEach(t => {
    console.log(`   • ${t.name} (${t.language})`);
  });
  
  console.log(`\n❌ FAILED TEMPLATES (${failedTemplates.length}):`);
  failedTemplates.forEach(t => {
    console.log(`   • ${t.name} - ${t.test_result.error}`);
  });
  
  console.log('\n📱 DELIVERY STATUS TO 9765071249:');
  console.log('─────────────────────────────────────────────────');
  
  if (workingTemplates.length === 1 && workingTemplates[0].name === 'hello_world') {
    console.log('⚠️ ONLY hello_world is delivering!');
    console.log('\nPOSSIBLE REASONS:');
    console.log('1. Other templates have parameter mismatches');
    console.log('2. Language code issues (en vs en_US)');
    console.log('3. Template format not matching Meta\'s requirements');
    console.log('4. Number not properly registered for testing');
    console.log('\nSOLUTION:');
    console.log('1. Create simpler templates with fewer parameters');
    console.log('2. Use exact language codes from template definition');
    console.log('3. Test with Meta\'s Template Tester in Business Suite');
  } else {
    console.log(`✅ ${workingTemplates.length} templates should be delivered`);
  }
  
  console.log('─────────────────────────────────────────────────');
}

// Run the analysis
runDeepAnalysis().catch(console.error);