#!/usr/bin/env node

/**
 * Register a WhatsApp template with IMAGE header support
 * This template will allow sending Gemini-generated market update images
 */

const https = require('https');

const CONFIG = {
  token: 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD',
  businessId: '1861646317956355'
};

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function registerImageTemplate() {
  console.log('📸 Registering WhatsApp Template with IMAGE Header Support\n');
  console.log('Template Name: jarvish_image_update');
  console.log('Category: MARKETING');
  console.log('Language: en_US\n');

  const templateData = {
    name: 'jarvish_image_update',
    category: 'MARKETING',
    language: 'en_US',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png'
          ]
        }
      },
      {
        type: 'BODY',
        text: 'Hi {{1}},\n\nToday\'s market update is ready for you!\n\n📊 *Key Highlights:*\n{{2}}\n\n📈 *Market Performance:*\n{{3}}\n\nView the detailed analysis in the image above.',
        example: {
          body_text: [
            ['Advisor', 'Sensex up 1.2%, Banking sector leads gains', 'Nifty: 19,450 (+0.8%) | Sensex: 65,230 (+1.2%)']
          ]
        }
      },
      {
        type: 'FOOTER',
        text: 'Powered by Jarvish AI | SEBI Registered Advisor'
      }
    ]
  };

  try {
    console.log('📤 Submitting template to WhatsApp Business API...\n');
    
    const response = await makeRequest(
      'POST',
      `/v21.0/${CONFIG.businessId}/message_templates`,
      templateData
    );

    if (response.error) {
      console.error('❌ Error creating template:', response.error.message);
      
      // If template already exists, try a different name
      if (response.error.message.includes('already exists')) {
        console.log('\n🔄 Template name exists. Trying alternative name...\n');
        
        // Try with timestamp suffix
        const timestamp = Date.now();
        templateData.name = `jarvish_img_${timestamp}`;
        console.log(`New template name: ${templateData.name}\n`);
        
        const retryResponse = await makeRequest(
          'POST',
          `/v21.0/${CONFIG.businessId}/message_templates`,
          templateData
        );
        
        if (retryResponse.error) {
          console.error('❌ Retry failed:', retryResponse.error.message);
          return;
        }
        
        handleSuccess(retryResponse, templateData.name);
      }
      return;
    }

    handleSuccess(response, templateData.name);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function handleSuccess(response, templateName) {
  console.log('✅ Template registration successful!\n');
  console.log('📋 Template Details:');
  console.log('==================');
  console.log(`ID: ${response.id}`);
  console.log(`Name: ${templateName}`);
  console.log(`Status: ${response.status || 'PENDING'}`);
  
  console.log('\n⏳ NEXT STEPS:');
  console.log('==============');
  console.log('1. Template is now pending approval from Meta');
  console.log('2. Approval typically takes 1-24 hours');
  console.log('3. Check status with: node check-image-templates.js');
  console.log('4. Once approved, use: node send-with-image-template.js');
  
  console.log('\n💡 TIP: While waiting for approval, you can:');
  console.log('   - Register additional template variations');
  console.log('   - Test with existing approved templates');
  console.log('   - Prepare your image assets');
  
  // Save template info for later use
  const fs = require('fs');
  const templateInfo = {
    templateName,
    templateId: response.id,
    status: response.status || 'PENDING',
    createdAt: new Date().toISOString(),
    components: response.components || []
  };
  
  fs.writeFileSync(
    'image-template-info.json',
    JSON.stringify(templateInfo, null, 2)
  );
  console.log('\n💾 Template info saved to: image-template-info.json');
}

// Alternative: Register a simpler UTILITY template (faster approval)
async function registerUtilityImageTemplate() {
  console.log('\n🔄 Also registering UTILITY category template (faster approval)...\n');
  
  const utilityTemplate = {
    name: 'jarvish_market_alert',
    category: 'UTILITY',  // UTILITY templates get approved faster
    language: 'en_US',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png'
          ]
        }
      },
      {
        type: 'BODY',
        text: 'Market Update for {{1}}\n\n{{2}}',
        example: {
          body_text: [
            ['Today', 'Important market information enclosed in the image above.']
          ]
        }
      }
    ]
  };

  try {
    const response = await makeRequest(
      'POST',
      `/v21.0/${CONFIG.businessId}/message_templates`,
      utilityTemplate
    );

    if (!response.error) {
      console.log('✅ Utility template also registered:', utilityTemplate.name);
      console.log('   (UTILITY templates typically get approved within 1 hour)\n');
    }
  } catch (error) {
    console.log('⚠️  Utility template registration failed:', error.message);
  }
}

// Run both registrations
async function main() {
  await registerImageTemplate();
  await registerUtilityImageTemplate();
}

main();