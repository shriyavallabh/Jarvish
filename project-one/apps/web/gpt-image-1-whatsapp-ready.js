#!/usr/bin/env node
/**
 * GPT-IMAGE-1 WITH CORRECT WHATSAPP DIMENSIONS
 * Generates landscape images and uploads to public host
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

const RECIPIENT = '919765071249';

console.log('🎨 GPT-IMAGE-1 WHATSAPP-READY IMAGES');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ Model: gpt-image-1 ONLY');
console.log('✅ Size: 1536x1024 (3:2 landscape for WhatsApp)');
console.log('✅ Direct delivery to WhatsApp\n');

const prompts = [
  {
    id: 1,
    title: 'SIP Calculator',
    prompt: 'Professional financial infographic in landscape format, large "₹61 LAKHS" text in gold on navy blue gradient background, subtitle "₹5,000 Monthly SIP for 20 Years", horizontal layout, banking aesthetic, crystal clear text, landscape orientation',
    caption: '💰 *SIP Calculator*\n\n₹5,000/month = ₹61 Lakhs!\n20 years @ 12% returns\n\nStart investing today!'
  },
  {
    id: 2,
    title: 'Tax Savings',
    prompt: 'Tax savings poster in landscape format, "SAVE ₹46,800" in huge white text on green gradient, "Section 80C Benefits" subtitle, horizontal layout, professional financial design, landscape orientation',
    caption: '💸 *Tax Savings*\n\nSave ₹46,800 under 80C!\nELSS • PPF • Insurance'
  },
  {
    id: 3,
    title: 'Portfolio Mix',
    prompt: 'Investment portfolio chart in landscape format, horizontal layout showing "60% EQUITY" blue, "30% DEBT" green, "10% GOLD" gold sections, white background, large percentages, landscape orientation',
    caption: '📊 *Portfolio Balance*\n\n60% Equity | 30% Debt | 10% Gold'
  }
];

// Upload to public host
async function uploadImage(imageBuffer) {
  try {
    // Try Imgur first
    console.log('  📤 Uploading to Imgur...');
    const form = new FormData();
    form.append('image', imageBuffer.toString('base64'));
    form.append('type', 'base64');
    
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID c97d599b1bc95e8'
      },
      body: form
    });
    
    const data = await response.json();
    if (data.success && data.data && data.data.link) {
      console.log('  ✅ Uploaded successfully!');
      return data.data.link;
    }
  } catch (error) {
    console.log('  ⚠️ Imgur failed:', error.message);
  }
  
  // Try imgbb as fallback
  try {
    console.log('  📤 Trying imgbb...');
    const form = new FormData();
    form.append('image', imageBuffer.toString('base64'));
    
    const response = await fetch('https://api.imgbb.com/1/upload?key=ebb758c42e25b6b3c80be5c496866229', {
      method: 'POST',
      body: form
    });
    
    const data = await response.json();
    if (data.data && data.data.url) {
      console.log('  ✅ Uploaded to imgbb!');
      return data.data.url;
    }
  } catch (error) {
    console.log('  ⚠️ imgbb failed:', error.message);
  }
  
  return null;
}

async function generateAndSend(config) {
  console.log(`${config.id}. ${config.title}`);
  console.log('─────────────────────────────────────────');
  
  try {
    // Generate with gpt-image-1 in LANDSCAPE format
    console.log('  🎨 Generating with gpt-image-1 (landscape)...');
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: config.prompt,
        size: '1536x1024',  // Landscape format (3:2 ratio, close to WhatsApp's 1200x628)
        quality: 'high',
        n: 1
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      // If landscape size doesn't work, try standard size
      console.log('  ⚠️ Landscape failed, trying 1024x1024...');
      const fallbackResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: config.prompt + ' square format',
          size: '1024x1024',
          quality: 'high',
          n: 1
        })
      });
      
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.data && fallbackData.data[0]) {
        data.data = fallbackData.data;
      }
    }
    
    if (data.data && data.data[0]) {
      let imageUrl = null;
      
      // If we got base64, upload it
      if (data.data[0].b64_json) {
        console.log('  ✅ Generated with gpt-image-1!');
        const imageBuffer = Buffer.from(data.data[0].b64_json, 'base64');
        console.log('  📊 Size:', (imageBuffer.length / 1024 / 1024).toFixed(2), 'MB');
        
        // Save locally first
        const fileName = `gpt_${config.id}.png`;
        fs.writeFileSync(fileName, imageBuffer);
        console.log('  💾 Saved:', fileName);
        
        // Upload to public host
        imageUrl = await uploadImage(imageBuffer);
        
        // Clean up
        fs.unlinkSync(fileName);
      }
      // If we got URL directly
      else if (data.data[0].url) {
        console.log('  ✅ Got URL from gpt-image-1!');
        imageUrl = data.data[0].url;
      }
      
      if (imageUrl) {
        // Send to WhatsApp
        console.log('  📱 Sending to WhatsApp...');
        
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
                caption: config.caption
              }
            })
          }
        );
        
        const result = await whatsappResponse.json();
        
        if (result.messages) {
          console.log('  ✅ DELIVERED TO WHATSAPP!');
          console.log('  📱 Message ID:', result.messages[0].id);
          console.log('  ✨ Success!\n');
          return true;
        } else {
          console.log('  ❌ WhatsApp error:', result.error?.message);
          console.log('\n');
          return false;
        }
      } else {
        console.log('  ❌ Failed to get public URL\n');
        return false;
      }
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.message, '\n');
    return false;
  }
}

async function main() {
  console.log('Starting WhatsApp-ready image generation...\n');
  
  // Send notification
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
          body: '🎨 GPT-IMAGE-1 Images Coming\n\nGenerating landscape format images...\nUsing ONLY gpt-image-1 model.'
        }
      })
    }
  );
  
  let successCount = 0;
  
  for (const prompt of prompts) {
    const success = await generateAndSend(prompt);
    if (success) successCount++;
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`📊 Results: ${successCount}/3 delivered to WhatsApp`);
  console.log(`📱 Recipient: 9765071249`);
  console.log(`📨 From: Jarvis Daily (+91 76666 84471)\n`);
  
  if (successCount > 0) {
    console.log('✅ CHECK YOUR WHATSAPP NOW!');
    console.log(`You should have received ${successCount} images.`);
    console.log('\nNote: gpt-image-1 supports:');
    console.log('• 1024x1024 (square)');
    console.log('• 1024x1536 (portrait)');
    console.log('• 1536x1024 (landscape - closest to WhatsApp ratio)');
  } else {
    console.log('❌ Delivery failed. Possible issues:');
    console.log('• Image hosting services may be down');
    console.log('• WhatsApp API rate limits');
  }
}

main().catch(console.error);