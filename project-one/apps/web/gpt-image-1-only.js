#!/usr/bin/env node
/**
 * GPT-IMAGE-1 ONLY - NO DALL-E
 * Using ONLY gpt-image-1 model as specified
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');

const RECIPIENT = '919765071249';

console.log('🎨 GPT-IMAGE-1 ONLY - PROFESSIONAL FINANCIAL IMAGES');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ Model: gpt-image-1 ONLY (NO DALL-E)');
console.log('✅ High quality financial infographics');
console.log('📱 Sending to: 9765071249\n');

const financialPrompts = [
  {
    id: 1,
    title: 'SIP Returns',
    prompt: 'Professional financial infographic poster: Show "₹61 LAKHS" in massive gold letters centered, navy blue premium background, subtitle "₹5,000 Monthly SIP for 20 Years", clean minimal banking design, ultra high quality, perfect text clarity',
    caption: '💰 *SIP Calculator*\n\n₹5,000 monthly = ₹61 Lakhs\n20 years @ 12% returns\n\nStart investing today!'
  },
  {
    id: 2,
    title: 'Tax Savings',
    prompt: 'Premium tax savings poster: "SAVE ₹46,800" in huge bold white text, professional green gradient, "Section 80C Tax Benefits" subtitle, clean corporate design, perfect text rendering, high quality financial infographic',
    caption: '💸 *Tax Savings Guide*\n\nSave ₹46,800 under 80C\nELSS • PPF • Insurance\n\nMaximize your savings!'
  },
  {
    id: 3,
    title: 'Portfolio',
    prompt: 'Professional investment portfolio chart: Clean pie chart with "60% EQUITY" blue section, "30% DEBT" green section, "10% GOLD" gold section, white background, large clear percentages, premium financial design',
    caption: '📊 *Portfolio Balance*\n\n60% Equity | 30% Debt | 10% Gold\n\nOptimal wealth mix!'
  },
  {
    id: 4,
    title: 'Emergency Fund',
    prompt: 'Financial safety poster: Show formula "6 × ₹50,000 = ₹3 LAKHS" in large clear text, teal premium gradient, "Emergency Fund Calculator" title, minimalist professional design, perfect number clarity',
    caption: '🛡️ *Emergency Fund*\n\n6 months expenses = Safety\n₹3 Lakh protection\n\nBuild your shield!'
  },
  {
    id: 5,
    title: 'Retirement',
    prompt: 'Retirement wealth poster: "₹5 CRORES" in massive gold premium text, "Retirement Goal by Age 60" subtitle, purple gradient background, ultra professional wealth management design, crystal clear text',
    caption: '🎯 *Retirement Goal*\n\n₹5 Crore by 60\nStart at 30\n\nSecure your future!'
  }
];

async function generateWithGptImage1Only(config) {
  console.log(`${config.id}. Generating: ${config.title}`);
  console.log('─────────────────────────────────────────');
  
  try {
    console.log('  🎨 Using gpt-image-1 model...');
    
    // ONLY gpt-image-1, NO DALL-E
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',  // ONLY gpt-image-1
        prompt: config.prompt,
        size: '1024x1024',
        quality: 'high',
        background: 'auto',
        n: 1
        // NO response_format - returns b64_json by default
      })
    });
    
    const data = await response.json();
    
    if (data.data && data.data[0]) {
      if (data.data[0].b64_json) {
        // Save the image locally
        const imageBytes = Buffer.from(data.data[0].b64_json, 'base64');
        const fileName = `gpt_image_1_${config.id}.png`;
        fs.writeFileSync(fileName, imageBytes);
        
        console.log('  ✅ Generated with gpt-image-1!');
        console.log(`  💾 Saved: ${fileName}`);
        console.log(`  📊 Size: ${(imageBytes.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Upload to temporary host for WhatsApp
        console.log('  📤 Preparing for WhatsApp...');
        
        // Try 0x0.st (simple curl-based host)
        const { execSync } = require('child_process');
        try {
          const uploadResult = execSync(`curl -F "file=@${fileName}" https://0x0.st`, { encoding: 'utf8' });
          const imageUrl = uploadResult.trim();
          
          if (imageUrl.startsWith('http')) {
            console.log('  ✅ Ready to send!');
            return { success: true, url: imageUrl, caption: config.caption };
          }
        } catch (e) {
          console.log('  ⚠️ Upload failed, using direct method');
        }
        
        // Clean up
        fs.unlinkSync(fileName);
        
      } else if (data.data[0].url) {
        console.log('  ✅ Generated with gpt-image-1!');
        console.log('  🔗 Got direct URL');
        return { success: true, url: data.data[0].url, caption: config.caption };
      }
    } else if (data.error) {
      console.log('  ❌ gpt-image-1 error:', data.error.message);
      console.log('  ⚠️ NO FALLBACK - Using gpt-image-1 ONLY');
      return { success: false };
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }
  
  console.log('\n');
  return { success: false };
}

async function sendToWhatsApp(imageData) {
  if (!imageData.url) return false;
  
  console.log('  📱 Sending to WhatsApp...');
  
  const response = await fetch(
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
          link: imageData.url,
          caption: imageData.caption
        }
      })
    }
  );
  
  const result = await response.json();
  
  if (result.messages) {
    console.log('  ✅ SENT!');
    console.log('  📱 ID:', result.messages[0].id);
    return true;
  } else {
    console.log('  ❌ Send failed:', result.error?.message);
    return false;
  }
}

async function main() {
  console.log('Starting gpt-image-1 ONLY generation...\n');
  console.log('NO DALL-E will be used!\n');
  
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
          body: '🎨 GPT-IMAGE-1 ONLY\n\nGenerating 5 professional financial images.\nNO DALL-E - Only gpt-image-1 model.\n\nPlease wait...'
        }
      })
    }
  );
  
  let successCount = 0;
  const results = [];
  
  for (const prompt of financialPrompts) {
    const result = await generateWithGptImage1Only(prompt);
    
    if (result.success) {
      results.push(result);
      const sent = await sendToWhatsApp(result);
      if (sent) {
        successCount++;
        console.log('  ✨ Complete!\n');
      } else {
        console.log('\n');
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ GPT-IMAGE-1 ONLY - COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`📊 Generated: ${results.length}/5 with gpt-image-1`);
  console.log(`📱 Sent to WhatsApp: ${successCount}/5`);
  console.log('\nNO DALL-E WAS USED!');
  console.log('Only gpt-image-1 model as requested.\n');
  
  if (successCount > 0) {
    console.log('✅ CHECK YOUR WHATSAPP!');
    console.log('You have received gpt-image-1 generated images.');
  }
}

main().catch(console.error);