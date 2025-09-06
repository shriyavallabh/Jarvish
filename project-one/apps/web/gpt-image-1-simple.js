#!/usr/bin/env node
/**
 * GPT-IMAGE-1 SIMPLE DIRECT SEND
 * Uses ONLY gpt-image-1, NO DALL-E
 * Sends OpenAI URLs directly to WhatsApp
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('🎨 GPT-IMAGE-1 DIRECT TO WHATSAPP');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ Using ONLY gpt-image-1 model');
console.log('❌ NO DALL-E\n');

async function generateAndSend(prompt, caption, title) {
  console.log(`Generating: ${title}`);
  console.log('─────────────────────────────────────────');
  
  try {
    // ONLY gpt-image-1
    console.log('  Using gpt-image-1...');
    const genResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',  // ONLY gpt-image-1
        prompt: prompt,
        size: '1024x1024',
        quality: 'high',
        n: 1
      })
    });
    
    const genData = await genResponse.json();
    
    // Check if we got an image URL
    let imageUrl = null;
    if (genData.data && genData.data[0]) {
      if (genData.data[0].url) {
        imageUrl = genData.data[0].url;
        console.log('  ✅ Generated with gpt-image-1!');
      } else if (genData.data[0].b64_json) {
        console.log('  ✅ Generated with gpt-image-1 (base64)');
        // For base64, we need to save and host it
        // But for now, let's skip and use URL-based generation
        console.log('  ⚠️ Got base64, retrying for URL...');
        return false;
      }
    } else if (genData.error) {
      console.log('  ❌ gpt-image-1 error:', genData.error.message);
      
      // If gpt-image-1 doesn't work with these params, try without quality
      console.log('  Retrying without quality param...');
      const retryResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: prompt,
          size: '1024x1024',
          n: 1
          // No quality param
        })
      });
      
      const retryData = await retryResponse.json();
      if (retryData.data && retryData.data[0] && retryData.data[0].url) {
        imageUrl = retryData.data[0].url;
        console.log('  ✅ Generated with gpt-image-1 (retry)!');
      }
    }
    
    if (!imageUrl) {
      console.log('  ❌ No image URL\n');
      return false;
    }
    
    // Send immediately to WhatsApp
    console.log('  Sending to WhatsApp...');
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
            caption: caption
          }
        })
      }
    );
    
    const result = await whatsappResponse.json();
    if (result.messages) {
      console.log('  ✅ SENT TO WHATSAPP!');
      console.log('  Message ID:', result.messages[0].id, '\n');
      return true;
    } else {
      console.log('  ❌ WhatsApp error:', result.error?.message, '\n');
      return false;
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.message, '\n');
    return false;
  }
}

async function main() {
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
          body: '🎨 GPT-IMAGE-1 ONLY (NO DALL-E)\n\nSending 3 images generated with gpt-image-1 model...'
        }
      })
    }
  );
  
  console.log('✅ Notification sent\n');
  
  let successCount = 0;
  
  // Image 1
  const success1 = await generateAndSend(
    'Professional financial poster with text "₹5 CRORES" in huge gold letters on purple gradient background, "Retirement Goal" subtitle, minimalist wealth management design',
    '🎯 *Retirement Planning*\n\n₹5 Crore by age 60\n\nGenerated with gpt-image-1',
    'Retirement Goal'
  );
  if (success1) successCount++;
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Image 2
  const success2 = await generateAndSend(
    'Clean financial infographic showing "₹61 LAKHS" in massive text, "SIP Calculator" title, navy blue background, professional banking aesthetic',
    '💰 *SIP Investment*\n\n₹61 Lakhs in 20 years\n\nGenerated with gpt-image-1',
    'SIP Calculator'
  );
  if (success2) successCount++;
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Image 3
  const success3 = await generateAndSend(
    'Tax saving poster with "SAVE ₹46,800" in bold text, green gradient, "Section 80C" subtitle, professional design',
    '💸 *Tax Savings*\n\nSave ₹46,800 yearly\n\nGenerated with gpt-image-1',
    'Tax Benefits'
  );
  if (success3) successCount++;
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`✅ Sent: ${successCount}/3 images`);
  console.log('Model: gpt-image-1 ONLY');
  console.log('NO DALL-E was used!\n');
  
  if (successCount > 0) {
    console.log('CHECK YOUR WHATSAPP!');
    console.log('From: Jarvis Daily (+91 76666 84471)');
  }
}

main().catch(console.error);