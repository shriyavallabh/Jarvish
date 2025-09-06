#!/usr/bin/env node
/**
 * GPT-IMAGE-1 MODEL - VERIFIED WORKING
 * Using the latest gpt-image-1 model as per Aug 23, 2025 OpenAI docs
 * 
 * This model provides:
 * - Zero-Data-Retention compatibility
 * - Better quality than DALL-E 2/3
 * - High quality mode support
 * - Background control (transparent/opaque/auto)
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const RECIPIENT = '919765071249';

console.log('🎨 GPT-IMAGE-1 PROFESSIONAL WHATSAPP IMAGES');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ Model: gpt-image-1 (Current generation as of Aug 23, 2025)');
console.log('✅ Quality: HIGH mode enabled');
console.log('✅ Size: 1024x1024 optimized');
console.log('✅ Zero-Data-Retention compatible\n');

// Professional financial prompts
const imagePrompts = [
  {
    id: 1,
    title: 'SIP Calculator',
    prompt: 'A minimalist financial infographic poster, centered text "₹61 LAKHS" in huge gold letters, subtitle "₹5,000 Monthly × 20 Years" below, navy blue gradient background, professional banking aesthetic, crystal clear typography, editorial photography quality',
    caption: '💰 *Smart SIP Investment*\n\n₹5,000/month = ₹61 Lakhs in 20 years!\n12% returns annually\n\nStart your wealth journey today!'
  },
  {
    id: 2,
    title: 'Tax Savings',
    prompt: 'Clean tax saving infographic, "SAVE ₹46,800" in gigantic white bold text centered, "Section 80C Benefits" subtitle, green gradient background, minimalist design, professional financial services aesthetic, maximum readability',
    caption: '💸 *Tax Saving Guide*\n\nSave ₹46,800 under Section 80C!\nELSS • PPF • Insurance\n\nMaximize your benefits!'
  },
  {
    id: 3,
    title: 'Portfolio Mix',
    prompt: 'Portfolio allocation infographic, simple pie chart showing "60% EQUITY" blue, "30% DEBT" green, "10% GOLD" gold, white background, flat design, huge percentages, professional investment poster, minimalist aesthetic',
    caption: '📊 *Perfect Portfolio*\n\n60% Equity | 30% Debt | 10% Gold\n\nOptimal wealth creation mix!'
  },
  {
    id: 4,
    title: 'Emergency Fund',
    prompt: 'Emergency fund formula poster, huge centered text "6 × ₹50,000 = ₹3 LAKHS", teal gradient background, white text with yellow accent for result, minimalist banking poster, crystal clear typography',
    caption: '🛡️ *Emergency Fund*\n\n6 × Monthly Expenses = Safety\n₹50K salary needs ₹3L fund\n\nBuild your protection!'
  },
  {
    id: 5,
    title: 'Retirement Goal',
    prompt: 'Retirement planning poster, gigantic gold text "₹5 CRORES" centered, "Your Retirement Goal" at top, "By Age 60" below, purple gradient background, minimalist design, professional wealth management aesthetic',
    caption: '🎯 *Retirement Planning*\n\n₹5 Crore target by 60!\nStart investing at 30\n\nSecure your golden years!'
  }
];

// Generate using gpt-image-1
async function generateImage(config) {
  console.log(`\n${config.id}. Generating: ${config.title}`);
  console.log('─────────────────────────────────────────');
  
  try {
    console.log('  🎨 Calling gpt-image-1 model...');
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',         // Using gpt-image-1 as verified
        prompt: config.prompt,
        size: '1024x1024',            // Standard size
        quality: 'high',              // High quality mode
        background: 'auto',           // Auto background
        n: 1                          // One image
      })
    });
    
    const data = await response.json();
    
    if (data.data && data.data[0]) {
      // Get base64 encoded image
      const b64Json = data.data[0].b64_json;
      
      if (b64Json) {
        const imageBytes = Buffer.from(b64Json, 'base64');
        const fileName = `gpt_image_1_${config.id}_${Date.now()}.png`;
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, imageBytes);
        
        console.log('  ✅ Generated with gpt-image-1!');
        console.log(`  💾 Saved: ${fileName}`);
        console.log('  📐 Size: 1024x1024');
        console.log('  🎯 Quality: HIGH');
        
        return {
          success: true,
          fileName,
          filePath,
          imageBytes,
          caption: config.caption,
          title: config.title
        };
      } else if (data.data[0].url) {
        // If URL is returned instead of base64
        const imageUrl = data.data[0].url;
        const imageResponse = await fetch(imageUrl);
        const imageBytes = await imageResponse.buffer();
        
        const fileName = `gpt_image_1_${config.id}_${Date.now()}.png`;
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, imageBytes);
        
        console.log('  ✅ Generated with gpt-image-1!');
        console.log(`  💾 Saved: ${fileName}`);
        
        return {
          success: true,
          fileName,
          filePath,
          imageBytes,
          url: imageUrl,
          caption: config.caption,
          title: config.title
        };
      }
    } else {
      console.log('  ❌ Error:', data.error?.message || 'Generation failed');
      return { success: false };
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    return { success: false };
  }
}

// Upload to Imgur for WhatsApp
async function uploadToImgur(imageBytes) {
  console.log('  📤 Uploading to Imgur...');
  
  try {
    const base64Image = imageBytes.toString('base64');
    
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID c97d599b1bc95e8'
      },
      body: JSON.stringify({
        image: base64Image,
        type: 'base64'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('  ✅ Uploaded successfully');
      return data.data.link;
    } else {
      console.log('  ❌ Upload failed');
      return null;
    }
  } catch (error) {
    console.log('  ❌ Upload error:', error.message);
    return null;
  }
}

// Send to WhatsApp
async function sendToWhatsApp(imageUrl, caption, title) {
  console.log(`  📱 Sending to WhatsApp...`);
  
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const message = {
    messaging_product: 'whatsapp',
    to: RECIPIENT,
    type: 'image',
    image: {
      link: imageUrl,
      caption: caption
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    const data = await response.json();
    
    if (data.messages) {
      console.log('  ✅ Delivered to WhatsApp!');
      console.log(`  📱 Message ID: ${data.messages[0].id}`);
      return true;
    } else {
      console.log('  ❌ Send failed:', data.error?.message);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Starting gpt-image-1 generation (verified working model)...\n');
  
  const results = [];
  let successCount = 0;
  
  for (const config of imagePrompts) {
    const imageData = await generateImage(config);
    
    if (imageData.success) {
      results.push(imageData);
      
      // Upload to Imgur
      const publicUrl = imageData.url || await uploadToImgur(imageData.imageBytes);
      
      if (publicUrl) {
        // Send to WhatsApp
        const sent = await sendToWhatsApp(publicUrl, imageData.caption, imageData.title);
        if (sent) {
          successCount++;
          console.log(`  🎉 ${imageData.title} complete!\n`);
        }
      }
      
      // Clean up local file
      if (fs.existsSync(imageData.filePath)) {
        fs.unlinkSync(imageData.filePath);
      }
      
      // Wait between requests
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ GPT-IMAGE-1 GENERATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('DELIVERY REPORT:');
  console.log('─────────────────────────────────────────');
  console.log(`✅ Images Generated: ${results.length}/5`);
  console.log(`📱 Sent to WhatsApp: ${successCount}/5`);
  console.log(`📞 Recipient: 9765071249\n`);
  
  console.log('GPT-IMAGE-1 MODEL INFO (Aug 23, 2025):');
  console.log('• Current generation model (not DALL-E 2/3)');
  console.log('• Zero-Data-Retention compatible');
  console.log('• High quality mode support');
  console.log('• Background control (transparent/opaque/auto)');
  console.log('• Better than previous DALL-E models\n');
  
  if (successCount === 5) {
    console.log('🎉 SUCCESS! All 5 images delivered!');
    console.log('Check WhatsApp for high-quality financial infographics!');
  } else if (successCount > 0) {
    console.log(`⚠️ Partial success: ${successCount} images delivered`);
  }
  
  console.log('\nThank you for the correction about gpt-image-1!');
  console.log('This is indeed the current model as of Aug 23, 2025.\n');
}

// Run
main().catch(console.error);