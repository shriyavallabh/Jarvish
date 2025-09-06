#!/usr/bin/env node

/**
 * WhatsApp Business Template Registration
 * Creates a template for market updates with IMAGE header support
 */

const axios = require('axios');
const fs = require('fs');

// WhatsApp Business API Credentials
const ACCESS_TOKEN = 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD';
const BUSINESS_ACCOUNT_ID = '1861646317956355';
const PHONE_NUMBER_ID = '574744175733556';

async function createImageTemplate() {
  try {
    console.log('🚀 Creating WhatsApp template with IMAGE header...\n');

    const templateData = {
      name: 'market_insight_pro',  // New unique name
      language: 'en_US',
      category: 'MARKETING',
      components: [
        {
          type: 'HEADER',
          format: 'IMAGE',
          example: {
            header_handle: [
              'https://fastly.picsum.photos/id/10/1200/628.jpg?hmac=EYnBCv8F3dKo7LzXNJYV5PfQpkrQfC5OaHqHmP8Eqxg'
            ]
          }
        },
        {
          type: 'BODY',
          text: '📊 *Market Update - {{1}}*\n\n' +
                '🔹 *SENSEX:* {{2}} ({{3}})\n' +
                '🔹 *NIFTY:* {{4}} ({{5}})\n\n' +
                '*Key Highlights:*\n{{6}}\n\n' +
                '*Expert View:*\n{{7}}\n\n' +
                '_Personalized insights from your financial advisor_',
          example: {
            body_text: [
              [
                'Morning',
                '74,523',
                '+1.23%',
                '22,234',
                '+0.98%',
                'Markets showing positive momentum with banking and IT sectors leading gains.',
                'Continue SIPs for long-term wealth creation. Focus on quality large-caps.'
              ]
            ]
          }
        },
        {
          type: 'FOOTER',
          text: 'Investment subject to market risks'
        }
      ]
    };

    console.log('📝 Template Configuration:');
    console.log('   Name:', templateData.name);
    console.log('   Category:', templateData.category);
    console.log('   Language:', templateData.language);
    console.log('   Components: IMAGE header + Dynamic BODY + Footer\n');

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${BUSINESS_ACCOUNT_ID}/message_templates`,
      templateData,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Template created successfully!');
    console.log('\n📋 Template Details:');
    console.log('   ID:', response.data.id);
    console.log('   Name:', response.data.name || templateData.name);
    console.log('   Status:', response.data.status || 'PENDING');
    
    // Save template info
    const templateInfo = {
      templateId: response.data.id,
      templateName: response.data.name || templateData.name,
      status: response.data.status || 'PENDING',
      registeredAt: new Date().toISOString(),
      businessAccountId: BUSINESS_ACCOUNT_ID,
      phoneNumberId: PHONE_NUMBER_ID
    };
    
    fs.writeFileSync(
      'market-template-info.json',
      JSON.stringify(templateInfo, null, 2)
    );
    
    console.log('\n💾 Template info saved to market-template-info.json');
    console.log('\n⏳ Template approval typically takes 1-24 hours.');
    console.log('   Check status with: node check-template-status.js');
    console.log('   Once approved, use: node send-market-update.js');

    return response.data;
  } catch (error) {
    console.error('❌ Error creating template:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('\nError details:', JSON.stringify(error.response.data.error, null, 2));
      
      // Check for common issues
      if (error.response.data.error.code === 100) {
        if (error.response.data.error.message.includes('already exists')) {
          console.log('\n💡 Try with a different template name or check existing templates.');
        } else if (error.response.data.error.message.includes('example')) {
          console.log('\n💡 Make sure to provide proper example values for all dynamic parameters.');
        }
      }
    }
    process.exit(1);
  }
}

// Check existing templates
async function checkExistingTemplates() {
  try {
    console.log('🔍 Checking existing templates...\n');
    
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${BUSINESS_ACCOUNT_ID}/message_templates?fields=name,status,category,language,components`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    const templates = response.data.data || [];
    
    // Check for our specific templates
    const marketTemplates = templates.filter(t => 
      t.name.includes('market') || t.name.includes('jarvish')
    );
    
    if (marketTemplates.length > 0) {
      console.log('📋 Found related templates:');
      marketTemplates.forEach(template => {
        console.log(`   - ${template.name}: ${template.status} (${template.language})`);
        
        if (template.status === 'APPROVED' && template.name === 'market_insight_pro') {
          console.log('\n✅ Template "market_insight_pro" is already APPROVED!');
          console.log('   You can start sending messages immediately.');
          
          // Save the info
          fs.writeFileSync(
            'market-template-info.json',
            JSON.stringify({
              templateId: template.id,
              templateName: template.name,
              status: template.status,
              businessAccountId: BUSINESS_ACCOUNT_ID,
              phoneNumberId: PHONE_NUMBER_ID
            }, null, 2)
          );
          
          return template;
        }
      });
    } else {
      console.log('No related templates found. Creating new one...');
    }
    
    console.log('\n' + '─'.repeat(50) + '\n');
    return null;
    
  } catch (error) {
    console.error('Error checking templates:', error.message);
    return null;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('   WhatsApp Business Template Registration');
  console.log('   Market Update with Image Support');
  console.log('═'.repeat(60) + '\n');

  // Check if template already exists
  const existing = await checkExistingTemplates();
  
  if (!existing || (existing && existing.status !== 'APPROVED')) {
    // Create new template
    await createImageTemplate();
  } else {
    console.log('\n✅ Ready to send messages using the approved template!');
    console.log('   Run: node send-market-update.js');
  }
}

// Run the script
main();