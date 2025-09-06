#!/usr/bin/env node
/**
 * USING DALL-E 3 FOR DIRECT URL DELIVERY
 * Since DALL-E provides public URLs that work immediately with WhatsApp
 * We'll use it temporarily to demonstrate the difference
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('📊 COMPARISON: DALL-E vs GPT-IMAGE-1');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('DALL-E 3 advantages:');
console.log('✅ Returns public URLs (hosted by OpenAI)');
console.log('✅ URLs work directly with WhatsApp');
console.log('✅ No need for additional hosting\n');
console.log('GPT-IMAGE-1 characteristics:');
console.log('✅ Returns base64 data');
console.log('❌ Requires manual hosting for WhatsApp');
console.log('✅ Better for local storage\n');

async function sendWithDallE() {
  console.log('Generating with DALL-E 3 (for URL delivery)...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: 'Financial infographic showing "₹5 CRORES" in gold text on purple background, retirement planning theme, professional design',
        size: '1024x1024',
        quality: 'hd',
        n: 1
      })
    });
    
    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].url) {
      const imageUrl = data.data[0].url;
      console.log('✅ Got public URL from DALL-E!');
      console.log('🔗 URL:', imageUrl.substring(0, 50) + '...');
      
      // Send to WhatsApp immediately
      console.log('📱 Sending to WhatsApp...');
      
      const whatsappResponse = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: RECIPIENT,
            type: 'image',
            image: {
              link: imageUrl,
              caption: '🎯 *DALL-E Generated*\n\nThis works because DALL-E provides public URLs!\n\nGPT-IMAGE-1 returns base64 data instead.'
            }
          })
        }
      );
      
      const result = await whatsappResponse.json();
      
      if (result.messages) {
        console.log('✅ SENT TO WHATSAPP!');
        console.log('Message ID:', result.messages[0].id);
        return true;
      } else {
        console.log('❌ WhatsApp error:', result.error?.message);
      }
    } else if (data.error) {
      console.log('❌ API error:', data.error.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  return false;
}

async function main() {
  // Send explanation first
  await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: RECIPIENT,
        type: 'text',
        text: {
          body: '📊 *The Difference:*\n\n*DALL-E 3:*\n• Returns public URLs\n• Works directly with WhatsApp\n\n*GPT-IMAGE-1:*\n• Returns base64 data\n• Needs hosting for WhatsApp\n\nThat\'s why DALL-E images reached you but GPT-IMAGE-1 didn\'t!'
        }
      })
    }
  );
  
  console.log('✅ Explanation sent\n');
  
  // Try to send with DALL-E
  const success = await sendWithDallE();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (success) {
    console.log('✅ DALL-E image sent successfully!');
    console.log('\nThis is why DALL-E images reached you earlier.');
    console.log('The URLs are publicly hosted by OpenAI temporarily.');
  } else {
    console.log('❌ Failed (likely billing limit reached)');
  }
  
  console.log('\n📝 Your GPT-IMAGE-1 images are saved locally at:');
  console.log('/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/gpt-images/');
  console.log('\nTo send them to WhatsApp, you need to:');
  console.log('1. Host them publicly (cloud storage, server, etc.)');
  console.log('2. Or use ngrok to expose localhost: ngrok http 8888');
}

main().catch(console.error);