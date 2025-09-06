#!/usr/bin/env node

/**
 * Complete solution for sending WhatsApp messages with IMAGE templates
 * This script handles the entire workflow:
 * 1. Check for existing image templates
 * 2. Register new template if needed
 * 3. Send message with Gemini-generated image
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const CONFIG = {
  token: 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD',
  businessId: '1861646317956355',
  phoneNumberId: '574744175733556',
  recipient: '919765071249'
};

// API request helper
async function makeRequest(method, path, body = null, isFormData = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.token}`
      }
    };

    if (!isFormData) {
      options.headers['Content-Type'] = 'application/json';
      if (body) {
        const bodyStr = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
      }
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
    
    if (body) {
      if (isFormData) {
        body.pipe(req);
      } else {
        req.write(JSON.stringify(body));
        req.end();
      }
    } else {
      req.end();
    }
  });
}

// Check for existing image templates
async function findImageTemplates() {
  console.log('🔍 Searching for templates with IMAGE headers...\n');
  
  const response = await makeRequest(
    'GET',
    `/v21.0/${CONFIG.businessId}/message_templates?limit=100`
  );

  if (response.error) {
    throw new Error(`Failed to fetch templates: ${response.error.message}`);
  }

  const templates = response.data || [];
  const imageTemplates = templates.filter(t => 
    t.components?.some(c => c.type === 'HEADER' && c.format === 'IMAGE')
  );
  
  const approvedImageTemplates = imageTemplates.filter(t => t.status === 'APPROVED');
  
  console.log(`Total templates: ${templates.length}`);
  console.log(`Image templates: ${imageTemplates.length}`);
  console.log(`Approved image templates: ${approvedImageTemplates.length}\n`);
  
  if (approvedImageTemplates.length > 0) {
    console.log('✅ Found approved image templates:');
    approvedImageTemplates.forEach(t => {
      console.log(`   - ${t.name} (${t.language})`);
    });
    console.log('');
  }
  
  return { all: imageTemplates, approved: approvedImageTemplates };
}

// Register new image template
async function registerImageTemplate() {
  console.log('📝 Registering new template with IMAGE header...\n');
  
  const templateName = `market_insight_daily_${Date.now()}`;
  
  const templateData = {
    name: templateName,
    category: 'MARKETING',
    language: 'en',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: [
            'https://raw.githubusercontent.com/facebook/whatsapp-business-api-documentation/main/examples/media/sample.jpg'
          ]
        }
      },
      {
        type: 'BODY',
        text: 'Good morning {{1}}!\n\n📊 *Today\'s Market Insight*\n\n{{2}}\n\n📈 *Key Indices:*\n{{3}}\n\n💡 *Expert View:*\n{{4}}',
        example: {
          body_text: [
            [
              'Advisor',
              'Markets open with positive momentum, Banking and IT sectors lead',
              'Sensex: 74,523 (+1.2%) | Nifty: 22,234 (+0.9%)',
              'Focus on quality stocks with strong fundamentals'
            ]
          ]
        }
      },
      {
        type: 'FOOTER',
        text: 'Jarvish AI | SEBI Registered | Market risks apply'
      }
    ]
  };

  const response = await makeRequest(
    'POST',
    `/v21.0/${CONFIG.businessId}/message_templates`,
    templateData
  );

  if (response.error) {
    console.error('❌ Template registration failed:', response.error.message);
    
    // If name exists, return existing template info
    if (response.error.message.includes('already exists')) {
      console.log('Template name already exists, will use existing templates.');
      return null;
    }
    throw new Error(response.error.message);
  }

  console.log('✅ Template registered successfully!');
  console.log(`   Name: ${templateName}`);
  console.log(`   ID: ${response.id}`);
  console.log(`   Status: ${response.status || 'PENDING'}\n`);
  
  return {
    name: templateName,
    id: response.id,
    status: response.status || 'PENDING'
  };
}

// Upload image to WhatsApp
async function uploadImage() {
  console.log('📤 Uploading Gemini-generated image to WhatsApp...\n');
  
  const imagePath = path.join(__dirname, 'market-update.jpg');
  
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }
  
  const stats = fs.statSync(imagePath);
  console.log(`   File: market-update.jpg`);
  console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
  
  // Use axios or node-fetch for multipart upload
  const axios = require('axios');
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));
  form.append('type', 'image/jpeg');
  form.append('messaging_product', 'whatsapp');
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${CONFIG.phoneNumberId}/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${CONFIG.token}`
        }
      }
    );
    
    console.log('✅ Image uploaded successfully!');
    console.log(`   Media ID: ${response.data.id}\n`);
    return response.data.id;
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data || error.message);
    throw error;
  }
}

// Send message with image template
async function sendImageTemplateMessage(templateName, mediaId) {
  console.log('📨 Sending message with image template...\n');
  
  const now = new Date();
  const marketData = {
    advisor: 'Dear Investor',
    highlight: `Markets ${now.getHours() < 15 ? 'are trading' : 'closed'} with positive momentum. Banking and technology sectors lead the gains.`,
    indices: 'Sensex: 74,523.45 (+892 pts, +1.21%) | Nifty: 22,234.70 (+247 pts, +1.12%)',
    expertView: 'Continue SIPs in quality mutual funds. Market volatility creates opportunities for long-term investors.'
  };
  
  const messageData = {
    messaging_product: 'whatsapp',
    to: CONFIG.recipient,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'en'
      },
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: {
                id: mediaId
              }
            }
          ]
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', text: marketData.advisor },
            { type: 'text', text: marketData.highlight },
            { type: 'text', text: marketData.indices },
            { type: 'text', text: marketData.expertView }
          ]
        }
      ]
    }
  };
  
  const response = await makeRequest(
    'POST',
    `/v21.0/${CONFIG.phoneNumberId}/messages`,
    messageData
  );
  
  if (response.error) {
    console.error('❌ Message sending failed:', response.error.message);
    if (response.error.error_data?.details) {
      console.error('Details:', response.error.error_data.details);
    }
    throw new Error(response.error.message);
  }
  
  console.log('✅ Message sent successfully!');
  console.log(`   Message ID: ${response.messages[0].id}`);
  console.log(`   To: ${CONFIG.recipient}`);
  console.log(`   Template: ${templateName}\n`);
  
  return response.messages[0].id;
}

// Send direct image message (fallback if no template)
async function sendDirectImageMessage(mediaId) {
  console.log('📱 Sending direct image message (no template required)...\n');
  
  const now = new Date();
  const caption = `📊 *Market Update - ${now.toLocaleDateString('en-IN')}*

Sensex: 74,523.45 (+1.21%)
Nifty: 22,234.70 (+1.12%)

✅ Banking & IT sectors lead gains
✅ FIIs net buyers at ₹2,345 cr
✅ Positive global cues support rally

💡 Continue systematic investments for long-term wealth creation.

⚠️ Investments subject to market risks.
Powered by Jarvish AI | SEBI Registered`;
  
  const messageData = {
    messaging_product: 'whatsapp',
    to: CONFIG.recipient,
    type: 'image',
    image: {
      id: mediaId,
      caption: caption
    }
  };
  
  const response = await makeRequest(
    'POST',
    `/v21.0/${CONFIG.phoneNumberId}/messages`,
    messageData
  );
  
  if (response.error) {
    console.error('❌ Direct message failed:', response.error.message);
    throw new Error(response.error.message);
  }
  
  console.log('✅ Direct image message sent!');
  console.log(`   Message ID: ${response.messages[0].id}`);
  console.log(`   To: ${CONFIG.recipient}\n`);
  
  return response.messages[0].id;
}

// Main execution flow
async function main() {
  console.log('🚀 WhatsApp Image Template Manager\n');
  console.log('=' .repeat(50));
  console.log('Business Account:', CONFIG.businessId);
  console.log('Phone Number ID:', CONFIG.phoneNumberId);
  console.log('Recipient:', CONFIG.recipient);
  console.log('=' .repeat(50) + '\n');
  
  try {
    // Step 1: Check for existing image templates
    const { approved } = await findImageTemplates();
    
    let templateToUse = null;
    
    if (approved.length > 0) {
      // Use first approved template
      templateToUse = approved[0];
      console.log(`📋 Using approved template: ${templateToUse.name}\n`);
    } else {
      console.log('⚠️  No approved image templates found.\n');
      
      // Try to register a new template
      const newTemplate = await registerImageTemplate();
      
      if (newTemplate && newTemplate.status === 'APPROVED') {
        templateToUse = newTemplate;
      } else {
        console.log('⏳ New template pending approval (usually 1-24 hours).\n');
      }
    }
    
    // Step 2: Upload the image
    const mediaId = await uploadImage();
    
    // Step 3: Send message
    if (templateToUse) {
      // Send using template
      await sendImageTemplateMessage(templateToUse.name, mediaId);
    } else {
      // Send direct image as fallback
      console.log('📌 Sending without template for immediate delivery...\n');
      await sendDirectImageMessage(mediaId);
      
      console.log('💡 TIP: Template messages have higher delivery rates.');
      console.log('   Check back later for template approval status.\n');
    }
    
    console.log('✅ Complete! Message delivered successfully.\n');
    
    // Save status for monitoring
    const status = {
      timestamp: new Date().toISOString(),
      recipient: CONFIG.recipient,
      mediaId: mediaId,
      templateUsed: templateToUse?.name || 'direct_message',
      success: true
    };
    
    fs.writeFileSync(
      'delivery-status.json',
      JSON.stringify(status, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify access token is valid');
    console.error('2. Check if phone number is verified');
    console.error('3. Ensure recipient has opted in');
    console.error('4. Verify image file exists: market-update.jpg');
    process.exit(1);
  }
}

// Check if axios is installed
try {
  require('axios');
} catch (e) {
  console.log('📦 Installing required dependencies...\n');
  require('child_process').execSync('npm install axios form-data', { stdio: 'inherit' });
}

// Run the script
main();