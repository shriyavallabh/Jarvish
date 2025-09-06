#!/usr/bin/env node

/**
 * Register Jarvish Market Update Template with IMAGE support
 */

const axios = require('axios');

const WHATSAPP_API_TOKEN = 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD';
const WHATSAPP_BUSINESS_ACCOUNT_ID = '1861646317956355';

async function registerTemplate() {
  console.log('\n📝 Registering Jarvish Market Update Template with IMAGE...\n');
  
  const templateData = {
    name: 'jarvish_market_update',
    category: 'MARKETING',
    language: 'en',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: ['https://via.placeholder.com/1200x628.png']
        }
      },
      {
        type: 'BODY',
        text: 'Good morning! Here\'s your market update:\n\n{{1}}\n{{2}}\n\nTop performers: {{3}}\n\nPowered by Jarvish AI',
        example: {
          body_text: [
            ['Sensex: 72,850 (+385)', 'Nifty: 22,050 (+115)', 'HDFC Bank, Infosys']
          ]
        }
      },
      {
        type: 'FOOTER',
        text: 'Mutual Fund investments are subject to market risks'
      }
    ]
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      templateData,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Template registered successfully!');
    console.log('Template ID:', response.data.id);
    console.log('Status:', response.data.status);
    console.log('\n⏰ Template will be reviewed and approved within 1 hour');
    console.log('Once approved, we can send messages with images!\n');
    
    return response.data;
    
  } catch (error) {
    if (error.response?.data?.error?.message?.includes('already exists')) {
      console.log('ℹ️ Template already exists. Checking status...\n');
      return checkTemplateStatus();
    }
    console.error('❌ Failed to register template:', error.response?.data || error.message);
  }
}

async function checkTemplateStatus() {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?fields=name,status,components&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`
        }
      }
    );
    
    const jarvishTemplate = response.data.data.find(t => t.name === 'jarvish_market_update');
    if (jarvishTemplate) {
      console.log('Template Status:', jarvishTemplate.status);
      
      if (jarvishTemplate.status === 'APPROVED') {
        console.log('✅ Template is APPROVED! Sending message now...\n');
        return sendWithTemplate();
      } else {
        console.log('⏳ Template status:', jarvishTemplate.status);
        console.log('Waiting for approval...\n');
      }
    }
  } catch (error) {
    console.error('Error checking status:', error.message);
  }
}

async function sendWithTemplate() {
  try {
    // First upload the image
    const fs = require('fs');
    const FormData = require('form-data');
    
    const imageBuffer = fs.readFileSync('../backend/market-update.jpg');
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'market-update.jpg',
      contentType: 'image/jpeg'
    });
    form.append('messaging_product', 'whatsapp');
    
    const uploadRes = await axios.post(
      'https://graph.facebook.com/v21.0/574744175733556/media',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`
        }
      }
    );
    
    const mediaId = uploadRes.data.id;
    console.log('✅ Image uploaded. Media ID:', mediaId);
    
    // Send template message
    const messageData = {
      messaging_product: 'whatsapp',
      to: '919765071249',
      type: 'template',
      template: {
        name: 'jarvish_market_update',
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
              { type: 'text', text: 'Sensex: 72,850 (+385 points)' },
              { type: 'text', text: 'Nifty: 22,050 (+115 points)' },
              { type: 'text', text: 'HDFC Bank (+2.8%), Infosys (+2.3%)' }
            ]
          }
        ]
      }
    };
    
    const response = await axios.post(
      'https://graph.facebook.com/v21.0/574744175733556/messages',
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Template message with image sent!');
    console.log('Message ID:', response.data.messages[0].id);
    console.log('\n📱 CHECK YOUR WHATSAPP NOW!\n');
    
  } catch (error) {
    console.error('Error sending template:', error.response?.data || error.message);
  }
}

// Try existing marketing template first
async function useExistingMarketingTemplate() {
  console.log('📱 Using existing MARKETING template: daily_focus\n');
  
  try {
    // daily_focus is approved, let's use it
    const response = await axios.post(
      'https://graph.facebook.com/v21.0/574744175733556/messages',
      {
        messaging_product: 'whatsapp',
        to: '919765071249',
        type: 'template',
        template: {
          name: 'daily_focus',
          language: {
            code: 'en'
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Marketing template sent successfully!');
    console.log('Message ID:', response.data.messages[0].id);
    console.log('\n📱 CHECK YOUR WHATSAPP!\n');
    console.log('Once you receive this, you can reply and we\'ll send the image.\n');
    
  } catch (error) {
    console.error('Template failed:', error.response?.data || error.message);
  }
}

// Run both - use existing and register new
async function main() {
  // First, send with existing approved template
  await useExistingMarketingTemplate();
  
  // Then register new template for future use
  await registerTemplate();
}

main();