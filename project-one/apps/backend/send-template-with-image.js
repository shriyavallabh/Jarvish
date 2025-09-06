const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// WhatsApp Business API Credentials
const ACCESS_TOKEN = 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD';
const PHONE_NUMBER_ID = '574744175733556';
const BUSINESS_ACCOUNT_ID = '1861646317956355';
const RECIPIENT = '919765071249';

// Upload image to WhatsApp Media Library
async function uploadImage() {
  try {
    console.log('📤 Uploading image to WhatsApp Media Library...');
    
    const imagePath = path.join(__dirname, 'market-update.jpg');
    
    // Check if image exists
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Image not found at:', imagePath);
      console.log('Please ensure market-update.jpg exists in the backend directory');
      return null;
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    form.append('type', 'image/jpeg');
    form.append('messaging_product', 'whatsapp');

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    console.log('✅ Image uploaded successfully!');
    console.log('Media ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Error uploading image:', error.response?.data || error.message);
    return null;
  }
}

// Send template message with image
async function sendTemplateWithImage(mediaId) {
  try {
    console.log('📨 Sending template message with image...');

    // Get current date for market data
    const now = new Date();
    const marketData = {
      sensex: '74,523.45',
      sensexChange: '+1.23%',
      nifty: '22,234.56',
      niftyChange: '+0.98%',
      summary: `Markets closed higher on ${now.toLocaleDateString('en-IN', { weekday: 'long' })} with strong buying in banking and IT stocks. FIIs were net buyers worth ₹2,345 crores.`
    };

    const messageData = {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'template',
      template: {
        name: 'jarvish_market_update',
        language: {
          code: 'en_US'
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
              { type: 'text', text: marketData.sensex },
              { type: 'text', text: marketData.sensexChange },
              { type: 'text', text: marketData.nifty },
              { type: 'text', text: marketData.niftyChange },
              { type: 'text', text: marketData.summary }
            ]
          }
        ]
      }
    };

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Message sent successfully!');
    console.log('Message ID:', response.data.messages[0].id);
    console.log('To:', RECIPIENT);
    console.log('\n📊 Market Data Sent:');
    console.log('  Sensex:', marketData.sensex, marketData.sensexChange);
    console.log('  Nifty:', marketData.nifty, marketData.niftyChange);
    console.log('  Summary:', marketData.summary);

    return response.data;
  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', JSON.stringify(error.response.data.error, null, 2));
    }
    throw error;
  }
}

// Check template status
async function checkTemplateStatus() {
  try {
    console.log('🔍 Checking template status...');
    
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${BUSINESS_ACCOUNT_ID}/message_templates?name=jarvish_market_update`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    const templates = response.data.data || [];
    const template = templates.find(t => t.name === 'jarvish_market_update');
    
    if (!template) {
      console.error('❌ Template not found. Please run register-jarvish-template.js first.');
      return null;
    }

    console.log('📋 Template Status:', template.status);
    
    if (template.status !== 'APPROVED') {
      console.log('⏳ Template is not yet approved. Current status:', template.status);
      if (template.status === 'REJECTED') {
        console.log('❌ Template was rejected. Please check the rejection reason and create a new template.');
      } else {
        console.log('Please wait for approval before sending messages.');
      }
      return null;
    }

    console.log('✅ Template is APPROVED and ready to use!');
    return template;
  } catch (error) {
    console.error('Error checking template:', error.message);
    return null;
  }
}

// Alternative: Send image directly without template (for immediate testing)
async function sendDirectImageMessage(mediaId) {
  try {
    console.log('📱 Sending direct image message (no template)...');

    const messageData = {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'image',
      image: {
        id: mediaId,
        caption: '📊 *Today\'s Market Update*\n\n' +
                 'Sensex: 74,523.45 (+1.23%)\n' +
                 'Nifty: 22,234.56 (+0.98%)\n\n' +
                 'Markets closed higher with strong buying in banking and IT stocks.\n\n' +
                 '⚠️ _Investments are subject to market risks._'
      }
    };

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Direct image message sent successfully!');
    console.log('Message ID:', response.data.messages[0].id);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending direct message:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting WhatsApp Template Message Sender with Image');
  console.log('================================================\n');

  // Step 1: Upload the image
  const mediaId = await uploadImage();
  if (!mediaId) {
    console.error('Failed to upload image. Exiting...');
    process.exit(1);
  }

  // Step 2: Check template status
  const template = await checkTemplateStatus();
  
  if (template && template.status === 'APPROVED') {
    // Template is approved, send using template
    console.log('\n📨 Sending message using approved template...');
    await sendTemplateWithImage(mediaId);
  } else {
    // Template not approved, offer alternative
    console.log('\n⚠️  Template is not approved yet.');
    console.log('📱 Sending direct image message instead (for immediate delivery)...\n');
    
    // Send direct image message as fallback
    await sendDirectImageMessage(mediaId);
    
    console.log('\n📌 Note: This is a direct message. For template-based messages:');
    console.log('1. Wait for template approval');
    console.log('2. Run this script again once approved');
  }

  console.log('\n✅ Process completed successfully!');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});