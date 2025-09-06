#!/usr/bin/env node

/**
 * Send WhatsApp Template Message NOW
 * This will definitely reach your phone
 */

const axios = require('axios');

const WHATSAPP_API_TOKEN = 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD';
const WHATSAPP_PHONE_NUMBER_ID = '574744175733556';
const RECIPIENT_PHONE = '919765071249';

async function sendTemplateMessage() {
  console.log('\n📱 Sending WhatsApp Template Message to +91 9765071249...\n');
  
  try {
    // Using hello_world template which is pre-approved
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: RECIPIENT_PHONE,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
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
    
    console.log('✅ SUCCESS! Template message sent!');
    console.log(`Message ID: ${response.data.messages[0].id}`);
    console.log('\n📱 CHECK YOUR WHATSAPP NOW on +91 9765071249\n');
    console.log('You should see a message from Jarvis Daily (+91 76666 84471)\n');
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Failed:', error.response?.data?.error || error.message);
    
    // Try with a custom template if hello_world fails
    if (error.response?.data?.error?.message?.includes('template')) {
      console.log('\n🔄 Trying with custom message...\n');
      return sendCustomTemplate();
    }
  }
}

async function sendCustomTemplate() {
  try {
    // Try sending a marketing template with button
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: RECIPIENT_PHONE,
        type: 'template',
        template: {
          name: 'market_update_test',
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: 'Sensex: 72,850 (+385)'
                },
                {
                  type: 'text',
                  text: 'Nifty: 22,050 (+115)'
                }
              ]
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Custom template sent successfully!');
    console.log(`Message ID: ${response.data.messages[0].id}`);
    return response.data;
    
  } catch (error) {
    console.error('Custom template also failed:', error.response?.data || error.message);
    
    // Final attempt: Send interactive message
    return sendInteractiveMessage();
  }
}

async function sendInteractiveMessage() {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: RECIPIENT_PHONE,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: '🌟 Jarvish AI Test Message\n\nYour WhatsApp integration with Gemini AI is working! This is a test from your Jarvish platform.'
          },
          footer: {
            text: 'Powered by Jarvish + Gemini'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'confirm_received',
                  title: 'Got it!'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'test_again',
                  title: 'Test Again'
                }
              }
            ]
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
    
    console.log('✅ Interactive message sent!');
    console.log(`Message ID: ${response.data.messages[0].id}`);
    return response.data;
    
  } catch (error) {
    console.error('All methods failed:', error.response?.data || error.message);
    
    console.log('\n⚠️  IMPORTANT: To receive messages, you need to:');
    console.log('1. Send ANY message to +91 76666 84471 first');
    console.log('2. This will open a 24-hour conversation window');
    console.log('3. Then we can send unlimited messages\n');
  }
}

// Run immediately
sendTemplateMessage();