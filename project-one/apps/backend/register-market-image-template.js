#!/usr/bin/env node

/**
 * Register WhatsApp template with IMAGE header - Fixed version
 * Properly formatted for Meta Business API
 */

const https = require('https');

const CONFIG = {
  token: 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD',
  businessId: '1861646317956355'
};

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function registerMarketingTemplate() {
  console.log('📸 Registering MARKETING Template with IMAGE Header\n');
  
  // Generate unique name with timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const templateName = `market_visual_${timestamp}`;
  
  console.log('Template Details:');
  console.log('================');
  console.log(`Name: ${templateName}`);
  console.log('Category: MARKETING');
  console.log('Language: en_US\n');

  const templateData = {
    name: templateName,
    category: 'MARKETING',
    language: 'en_US',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: ['4::YXBwbGljYXRpb24vb2N0ZXQtc3RyZWFt:ARbtpllLa9i70YCvSmNMu8LsaWpNDzqZaL9zvuOxF98GKFefyZ0jZsg8e_Oc5wpFxCqQVLCfXpMkgYkUCwJcBQ_dZvNrRWcLB8JLXA:e:1730730560:1861646317956355:100028413970600:ARZdJaOx4y8G1aXjKUE']
        }
      },
      {
        type: 'BODY',
        text: 'Good morning!\n\n📊 Today\'s Market Insight:\n{{1}}\n\n📈 Key Levels:\n{{2}}\n\n💡 Strategy:\n{{3}}',
        example: {
          body_text: [
            ['Markets open positive with banking leading', 'Nifty: 22,234 | Sensex: 74,523', 'Focus on quality large-caps']
          ]
        }
      },
      {
        type: 'FOOTER',
        text: 'Jarvish AI | Investment risks apply'
      }
    ]
  };

  try {
    const response = await makeRequest(
      'POST',
      `/v21.0/${CONFIG.businessId}/message_templates`,
      templateData
    );

    if (response.error) {
      console.error('❌ Error:', response.error.message);
      if (response.error.error_user_msg) {
        console.error('Details:', response.error.error_user_msg);
      }
      if (response.error.error_data) {
        console.error('Debug:', JSON.stringify(response.error.error_data, null, 2));
      }
      return null;
    }

    console.log('✅ Template Submitted Successfully!\n');
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function registerUtilityTemplate() {
  console.log('\n📱 Registering UTILITY Template (Faster Approval)\n');
  
  const timestamp = Math.floor(Date.now() / 1000);
  const templateName = `market_alert_${timestamp}`;
  
  console.log(`Template Name: ${templateName}\n`);

  const templateData = {
    name: templateName,
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: ['4::YXBwbGljYXRpb24vb2N0ZXQtc3RyZWFt:ARbtpllLa9i70YCvSmNMu8LsaWpNDzqZaL9zvuOxF98GKFefyZ0jZsg8e_Oc5wpFxCqQVLCfXpMkgYkUCwJcBQ_dZvNrRWcLB8JLXA:e:1730730560:1861646317956355:100028413970600:ARZdJaOx4y8G1aXjKUE']
        }
      },
      {
        type: 'BODY',
        text: 'Market Update: {{1}}'
      }
    ]
  };

  try {
    const response = await makeRequest(
      'POST',
      `/v21.0/${CONFIG.businessId}/message_templates`,
      templateData
    );

    if (response.error) {
      console.error('❌ Utility template error:', response.error.message);
      return null;
    }

    console.log('✅ Utility Template Submitted!\n');
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;

  } catch (error) {
    console.error('❌ Failed:', error.message);
    return null;
  }
}

async function getMediaHandle() {
  console.log('📎 Getting proper media handle format...\n');
  
  // First check if we have any existing templates to see the correct format
  const response = await makeRequest(
    'GET',
    `/v21.0/${CONFIG.businessId}/message_templates?limit=5`
  );
  
  if (response.data) {
    console.log('Sample template structure:');
    const firstTemplate = response.data[0];
    if (firstTemplate) {
      console.log(JSON.stringify(firstTemplate.components, null, 2));
    }
  }
  
  console.log('\n💡 For IMAGE headers, you need:');
  console.log('1. Upload an image to Meta first');
  console.log('2. Get the media handle ID');
  console.log('3. Use format: 4::base64::handle\n');
}

async function registerSimpleImageTemplate() {
  console.log('\n🎯 Registering Simplified Image Template\n');
  
  const timestamp = Date.now();
  const templateName = `jarvish_market_${timestamp}`;
  
  const templateData = {
    name: templateName,
    category: 'MARKETING',
    language: 'en_US',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE'
        // No example needed for initial registration
      },
      {
        type: 'BODY',
        text: 'Dear {{1}},\n\nToday\'s market update:\n\n{{2}}\n\nBest regards,\nYour Financial Advisor',
        example: {
          body_text: [
            ['Investor', 'Sensex gained 450 points today with positive global cues.']
          ]
        }
      },
      {
        type: 'FOOTER',
        text: 'Investments subject to market risks'
      }
    ]
  };

  try {
    console.log('Submitting template:', templateName);
    console.log('Payload:', JSON.stringify(templateData, null, 2), '\n');
    
    const response = await makeRequest(
      'POST',
      `/v21.0/${CONFIG.businessId}/message_templates`,
      templateData
    );

    if (response.error) {
      console.error('❌ Error:', response.error.message);
      if (response.error.error_subcode === 2388093) {
        console.log('\n📌 Note: Header handle is required for IMAGE format.');
        console.log('Solution: Use a public image URL or upload to Meta first.\n');
      }
      return null;
    }

    console.log('✅ SUCCESS! Template created.');
    console.log('Template ID:', response.id);
    console.log('Status:', response.status || 'PENDING');
    console.log('\nTemplate will be reviewed within 1-24 hours.');
    
    // Save template info
    const fs = require('fs');
    fs.writeFileSync(
      `template-${templateName}.json`,
      JSON.stringify({
        name: templateName,
        id: response.id,
        status: response.status || 'PENDING',
        created: new Date().toISOString(),
        response: response
      }, null, 2)
    );
    
    console.log(`\n💾 Template info saved to: template-${templateName}.json`);
    return response;

  } catch (error) {
    console.error('❌ Failed:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 WhatsApp Image Template Registration Tool\n');
  console.log('=' .repeat(50) + '\n');
  
  // First understand the format
  await getMediaHandle();
  
  // Try simple template first
  const result = await registerSimpleImageTemplate();
  
  if (!result) {
    console.log('\n📝 Alternative: Register without example first');
    console.log('Then update with image handle after approval.\n');
    
    // Try marketing template
    await registerMarketingTemplate();
    
    // Try utility template
    await registerUtilityTemplate();
  }
  
  console.log('\n✅ Registration process complete!');
  console.log('\nNext steps:');
  console.log('1. Run: node check-image-templates.js');
  console.log('2. Wait for approval (1-24 hours)');
  console.log('3. Run: node send-with-image-template.js');
}

main();