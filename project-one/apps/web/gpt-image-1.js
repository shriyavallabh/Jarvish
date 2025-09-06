#!/usr/bin/env node
/**
 * GPT-IMAGE-1 CORRECT IMPLEMENTATION
 * Following OpenAI's official API specification:
 * - No response_format parameter (returns b64_json by default)
 * - Explicit model pinning to gpt-image-1
 * - Direct base64 decoding
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');

const RECIPIENT = '919765071249';

console.log('🎨 GPT-IMAGE-1 CORRECT IMPLEMENTATION');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ Model: gpt-image-1 (pinned explicitly)');
console.log('✅ Format: b64_json (default, no response_format)');
console.log('✅ Sizes: 1024x1024, 1024x1536, 1536x1024');
console.log('✅ Quality: high | medium | low\n');

// Test all gpt-image-1 capabilities
const testCases = [
  {
    id: 1,
    title: 'Square Financial Infographic',
    prompt: 'Minimalist financial infographic showing "₹5 CRORES" in huge gold letters on purple gradient, editorial quality',
    size: '1024x1024',
    quality: 'high'
  },
  {
    id: 2,
    title: 'Portrait Mode',
    prompt: 'Vertical financial poster showing SIP calculator, ₹61 LAKHS text prominent, navy blue theme, banking aesthetic',
    size: '1024x1536',
    quality: 'high'
  },
  {
    id: 3,
    title: 'Landscape Mode',
    prompt: 'Horizontal tax saving infographic, SAVE ₹46,800 in bold text, Section 80C benefits, green gradient',
    size: '1536x1024',
    quality: 'high'
  }
];

async function generateWithGptImage1(config) {
  console.log(`\n${config.id}. ${config.title}`);
  console.log('─────────────────────────────────────────');
  console.log(`  Size: ${config.size}`);
  console.log(`  Quality: ${config.quality}`);
  
  try {
    console.log('  🎨 Calling gpt-image-1...');
    
    // Correct API call without response_format
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',  // Explicitly pinned
        prompt: config.prompt,
        size: config.size,
        quality: config.quality,
        n: 1
        // NO response_format - returns b64_json by default
      })
    });
    
    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].b64_json) {
      // Decode base64 directly
      const imageBytes = Buffer.from(data.data[0].b64_json, 'base64');
      const fileName = `gpt_image_1_${config.id}_${Date.now()}.png`;
      fs.writeFileSync(fileName, imageBytes);
      
      console.log('  ✅ Generated successfully with gpt-image-1!');
      console.log(`  💾 Saved: ${fileName}`);
      console.log(`  📊 Size: ${imageBytes.length.toLocaleString()} bytes`);
      
      return { success: true, fileName, imageBytes };
    } else if (data.error) {
      console.log('  ❌ Error:', data.error.message);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log('  ❌ Exception:', error.message);
    return { success: false, error };
  }
}

async function sendToWhatsApp(imageBytes, caption) {
  // Upload to free image host first
  const base64 = imageBytes.toString('base64');
  const uploadResponse = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `key=ebb758c42e25b6b3c80be5c496866229&image=${encodeURIComponent(base64)}`
  });
  
  const uploadData = await uploadResponse.json();
  if (!uploadData.data?.url) return false;
  
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
        image: { link: uploadData.data.url, caption }
      })
    }
  );
  
  const result = await whatsappResponse.json();
  return result.messages ? true : false;
}

async function main() {
  console.log('Testing gpt-image-1 with correct parameters...\n');
  
  const results = [];
  
  for (const test of testCases) {
    const result = await generateWithGptImage1(test);
    if (result.success) {
      results.push(result);
      
      // Send to WhatsApp
      console.log('  📱 Sending to WhatsApp...');
      const sent = await sendToWhatsApp(
        result.imageBytes,
        `🎨 GPT-IMAGE-1 Test\nSize: ${test.size}\nQuality: ${test.quality}`
      );
      console.log(sent ? '  ✅ Sent!' : '  ⚠️ Send failed');
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ GPT-IMAGE-1 TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('RESULTS:');
  console.log(`✅ Generated: ${results.length}/${testCases.length} images`);
  console.log('\nKEY LEARNINGS:');
  console.log('• gpt-image-1 is the current model (not DALL-E 2/3)');
  console.log('• Do NOT include response_format parameter');
  console.log('• Returns b64_json by default');
  console.log('• Supports 3 sizes: square, portrait, landscape');
  console.log('• Must explicitly pin model: "gpt-image-1"');
  console.log('\nThank you for the clarification! 🙏\n');
}

main().catch(console.error);