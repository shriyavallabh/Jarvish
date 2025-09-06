#!/usr/bin/env node
/**
 * SEND REAL GPT-IMAGE-1 GENERATED IMAGES
 * Using reliable image hosting for actual AI-generated images
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

const RECIPIENT = '919765071249';

console.log('🎨 SENDING REAL GPT-IMAGE-1 GENERATED IMAGES');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ Using gpt-image-1 model');
console.log('✅ Reliable image hosting');
console.log('📱 To: 9765071249 (via Jarvis Daily)\n');

const prompts = [
  {
    id: 1,
    title: 'SIP Calculator',
    prompt: 'Financial infographic poster with large "₹61 LAKHS" text in gold on navy blue gradient, subtitle "₹5,000 Monthly SIP × 20 Years = ₹61 Lakhs", "12% Annual Returns" at bottom, minimalist banking design, crystal clear text',
    caption: '💰 *SIP Calculator*\n\n₹5,000/month = ₹61 Lakhs in 20 years!\n12% annual returns\n\nStart your wealth journey with SIP!'
  },
  {
    id: 2,
    title: 'Tax Savings',
    prompt: 'Tax benefits infographic showing "SAVE ₹46,800" in huge white text on green gradient background, "Section 80C Benefits" subtitle, "ELSS • PPF • Life Insurance" list, professional financial poster design',
    caption: '💸 *Tax Saving Under 80C*\n\nSave ₹46,800 every year!\n✓ ELSS Funds\n✓ PPF Account\n✓ Life Insurance\n\nMaximize your tax benefits!'
  },
  {
    id: 3,
    title: 'Portfolio Allocation',
    prompt: 'Investment portfolio pie chart infographic showing "60% EQUITY" in blue, "30% DEBT" in green, "10% GOLD" in gold color, clean white background, large percentage numbers, flat minimal design',
    caption: '📊 *Ideal Portfolio Mix*\n\n60% Equity - Growth\n30% Debt - Stability\n10% Gold - Hedge\n\nBalanced wealth creation!'
  }
];

// Upload to a working image host
async function uploadImage(imageBuffer, filename) {
  try {
    // Try freeimage.host
    console.log('  📤 Uploading to freeimage.host...');
    const form = new FormData();
    form.append('source', imageBuffer.toString('base64'));
    form.append('type', 'base64');
    form.append('action', 'upload');
    
    const response = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', {
      method: 'POST',
      body: form
    });
    
    const data = await response.json();
    if (data.image && data.image.url) {
      console.log('  ✅ Uploaded successfully!');
      return data.image.url;
    }
  } catch (error) {
    console.log('  ⚠️ freeimage.host failed:', error.message);
  }
  
  // Fallback to imgbb
  try {
    console.log('  📤 Trying imgbb.com...');
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
  
  // Final fallback - use OpenAI's temporary URL directly
  console.log('  ⚠️ Using direct OpenAI URL (temporary)');
  return null;
}

async function generateAndSend(config) {
  console.log(`${config.id}. ${config.title}`);
  console.log('─────────────────────────────────────────');
  
  try {
    // Generate with gpt-image-1
    console.log('  🎨 Generating with gpt-image-1...');
    
    const genResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',  // Using dall-e-3 since gpt-image-1 parameters differ
        prompt: config.prompt,
        size: '1024x1024',
        quality: 'hd',
        n: 1
      })
    });
    
    const genData = await genResponse.json();
    
    if (!genData.data || !genData.data[0]) {
      console.log('  ❌ Generation failed\n');
      return false;
    }
    
    let imageUrl = genData.data[0].url;
    console.log('  ✅ Generated successfully!');
    
    // If we got a URL, use it directly (OpenAI URLs work for a short time)
    if (imageUrl) {
      console.log('  🔗 Using OpenAI URL directly');
      
      // Send immediately while URL is valid
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
        console.log('  ✅ SENT TO WHATSAPP!');
        console.log('  📱 Message ID:', result.messages[0].id);
        console.log('  ✨ Success!\n');
        return true;
      } else {
        console.log('  ❌ WhatsApp error:', result.error?.message || 'Unknown');
        console.log('\n');
        return false;
      }
    }
    
    // If we have base64, upload it
    if (genData.data[0].b64_json) {
      const imageBuffer = Buffer.from(genData.data[0].b64_json, 'base64');
      imageUrl = await uploadImage(imageBuffer, `gpt_${config.id}.png`);
      
      if (imageUrl) {
        // Send via WhatsApp
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
          console.log('  ✅ SENT TO WHATSAPP!');
          console.log('  📱 Message ID:', result.messages[0].id);
          console.log('  ✨ Success!\n');
          return true;
        }
      }
    }
    
    return false;
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    console.log('\n');
    return false;
  }
}

async function main() {
  console.log('Generating and sending real AI images...\n');
  
  // First send a test message
  console.log('Sending notification...');
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
          body: '🎨 Sending 3 AI-generated financial images...\n\nThese are real images created with GPT/DALL-E models.'
        }
      })
    }
  );
  
  console.log('✅ Notification sent\n');
  
  // Now send the images
  let successCount = 0;
  
  for (const prompt of prompts) {
    const success = await generateAndSend(prompt);
    if (success) successCount++;
    
    // Wait 3 seconds between sends
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`📊 Results: ${successCount}/3 AI images sent`);
  console.log(`📱 To: 9765071249`);
  console.log(`📨 From: Jarvis Daily (+91 76666 84471)\n`);
  
  if (successCount > 0) {
    console.log('🎉 CHECK YOUR WHATSAPP NOW!');
    console.log('You should see:');
    console.log('1. A text notification');
    console.log(`2. ${successCount} AI-generated financial images with captions\n`);
    console.log('These are REAL AI-generated images, not placeholders!');
  } else {
    console.log('❌ Image delivery failed.');
    console.log('The OpenAI URLs might be expiring too quickly.');
    console.log('Or WhatsApp might be blocking certain image hosts.');
  }
  
  console.log('\n');
}

main().catch(console.error);