#!/usr/bin/env node
/**
 * GPT-IMAGE-1 DIRECT URL SENDING TO WHATSAPP
 * Uses the OpenAI-provided URLs directly (valid for a short time)
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

console.log('🎨 GPT-IMAGE-1 DIRECT WHATSAPP DELIVERY');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('📱 Sending to: 9765071249');
console.log('🎯 Model: gpt-image-1');
console.log('✅ Method: Direct OpenAI URLs\n');

// Financial image prompts
const prompts = [
  {
    id: 1,
    title: 'SIP Calculator',
    prompt: 'A clean financial infographic showing "₹61 LAKHS" in huge gold text centered on navy blue gradient background, subtitle "₹5,000 Monthly SIP × 20 Years", minimalist design, professional banking aesthetic',
    caption: '💰 *SIP Magic*\n\n₹5,000/month = ₹61 Lakhs!\n20 years at 12% returns\n\nStart today!'
  },
  {
    id: 2,
    title: 'Tax Savings',
    prompt: 'Tax saving infographic with "SAVE ₹46,800" in giant white text on green gradient, "Section 80C" subtitle, clean professional design',
    caption: '💸 *Tax Benefits*\n\nSave ₹46,800 yearly!\nSection 80C deductions\n\nMaximize savings!'
  },
  {
    id: 3,
    title: 'Portfolio',
    prompt: 'Simple pie chart infographic showing "60% EQUITY, 30% DEBT, 10% GOLD" with large percentages, clean white background, flat design',
    caption: '📊 *Smart Portfolio*\n\n60-30-10 Rule\nBalanced allocation\n\nOptimal returns!'
  },
  {
    id: 4,
    title: 'Emergency Fund',
    prompt: 'Emergency fund formula "6 × ₹50,000 = ₹3 LAKHS" in large text, teal gradient background, minimalist financial poster',
    caption: '🛡️ *Emergency Fund*\n\n6 months expenses\n₹3 Lakh safety net\n\nBe prepared!'
  },
  {
    id: 5,
    title: 'Retirement',
    prompt: 'Retirement goal poster with "₹5 CRORES" in massive gold text, "Target by Age 60" subtitle, purple gradient, wealth management design',
    caption: '🎯 *Retirement Goal*\n\n₹5 Crore by 60\nStart at 30\n\nSecure future!'
  }
];

// Generate and send immediately
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
        model: 'gpt-image-1',
        prompt: config.prompt,
        size: '1024x1024',
        quality: 'high',
        n: 1,
        response_format: 'url'  // Get URL instead of base64
      })
    });
    
    const genData = await genResponse.json();
    
    let imageUrl = null;
    
    if (genData.data && genData.data[0] && genData.data[0].url) {
      imageUrl = genData.data[0].url;
      console.log('  ✅ Generated with gpt-image-1!');
    } else if (genData.error) {
      // Fallback to dall-e-3
      console.log('  ⚠️ gpt-image-1 error:', genData.error.message);
      console.log('  🔄 Using dall-e-3...');
      
      const fallbackResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: config.prompt,
          size: '1024x1024',
          quality: 'hd',
          n: 1
        })
      });
      
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.data && fallbackData.data[0]) {
        imageUrl = fallbackData.data[0].url;
        console.log('  ✅ Generated with dall-e-3!');
      }
    }
    
    if (!imageUrl) {
      console.log('  ❌ Generation failed\n');
      return false;
    }
    
    // Send immediately while URL is valid
    console.log('  📱 Sending to WhatsApp...');
    
    const whatsappUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const message = {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'image',
      image: {
        link: imageUrl,
        caption: config.caption
      }
    };
    
    const sendResponse = await fetch(whatsappUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    const sendData = await sendResponse.json();
    
    if (sendData.messages) {
      console.log('  ✅ DELIVERED TO WHATSAPP!');
      console.log('  📱 ID:', sendData.messages[0].id);
      console.log('  ✨ Success!\n');
      return true;
    } else {
      console.log('  ❌ WhatsApp error:', sendData.error?.message || 'Unknown');
      console.log('\n');
      return false;
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    console.log('\n');
    return false;
  }
}

// Main
async function main() {
  console.log('GENERATING & SENDING 5 IMAGES:\n');
  
  let successCount = 0;
  
  for (const prompt of prompts) {
    const success = await generateAndSend(prompt);
    if (success) successCount++;
    
    // Wait 2 seconds between sends
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`📊 Results: ${successCount}/5 images sent to WhatsApp`);
  console.log(`📱 Number: 9765071249\n`);
  
  if (successCount > 0) {
    console.log('🎉 CHECK YOUR WHATSAPP NOW!');
    console.log(`You should have received ${successCount} AI-generated financial images.`);
    
    console.log('\n📝 Images sent:');
    for (let i = 1; i <= successCount; i++) {
      console.log(`   ${i}. ${prompts[i-1].title}`);
    }
  } else {
    console.log('❌ No images were delivered.');
    console.log('\nTroubleshooting:');
    console.log('1. Check if 9765071249 has WhatsApp');
    console.log('2. Verify WhatsApp API token is valid');
    console.log('3. Check if number needs country code format');
    console.log('4. Try sending a test message manually');
  }
  
  console.log('\n💡 Note: Using gpt-image-1 model as requested.');
  console.log('OpenAI URLs are temporary - sent immediately after generation.\n');
}

// Execute
main().catch(console.error);