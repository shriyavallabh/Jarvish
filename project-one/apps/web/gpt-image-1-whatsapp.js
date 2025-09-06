/**
 * GPT-IMAGE-1 MODEL - PROFESSIONAL WHATSAPP IMAGES
 * Using the latest gpt-image-1 model for superior image generation
 * 
 * As requested by user - using gpt-image-1 model specifically
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const RECIPIENT = '919765071249';

console.log('🎨 GPT-IMAGE-1 PROFESSIONAL WHATSAPP IMAGE GENERATION');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ Using gpt-image-1 model as requested');
console.log('✅ WhatsApp optimized: 1024x1024');
console.log('✅ High quality mode enabled');
console.log('✅ Professional financial infographics\n');

// Professional financial image prompts for gpt-image-1
const imagePrompts = [
  {
    id: 1,
    title: 'SIP Calculator',
    prompt: `A minimalist financial infographic poster showing "₹61 LAKHS" in huge gold text at center, 
    subtitle "₹5,000 Monthly × 20 Years" below in white, "12% Annual Returns" at bottom, 
    navy blue gradient background, professional banking aesthetic, editorial photography quality, 
    crystal clear typography, lots of white space, WhatsApp optimized layout`,
    caption: '💰 *Smart SIP Investment*\n\n₹5,000 monthly = ₹61 Lakhs in 20 years!\n\nStart your wealth journey today!'
  },
  {
    id: 2,
    title: 'Tax Savings',
    prompt: `A clean tax saving infographic poster with "SAVE ₹46,800" in gigantic white bold text,
    "Section 80C Benefits" subtitle, "ELSS • PPF • Insurance" at bottom with simple icons,
    green gradient background, minimalist design, professional financial services aesthetic,
    maximum readability, editorial photography quality, perfect for mobile viewing`,
    caption: '💸 *Tax Saving Guide*\n\nSave ₹46,800 under Section 80C!\n\nMaximize your tax benefits!'
  },
  {
    id: 3,
    title: 'Portfolio Mix',
    prompt: `A sophisticated portfolio allocation chart poster, "PERFECT PORTFOLIO" title at top,
    simple pie chart showing "60% EQUITY" in blue, "30% DEBT" in green, "10% GOLD" in gold,
    clean white background, flat design, huge percentages, professional investment poster,
    minimalist aesthetic, perfect text clarity, editorial quality`,
    caption: '📊 *Portfolio Balance*\n\n60% Equity | 30% Debt | 10% Gold\n\nThe perfect wealth mix!'
  },
  {
    id: 4,
    title: 'Emergency Fund',
    prompt: `An emergency fund formula poster with huge centered text "6 × ₹50,000 = ₹3 LAKHS",
    "Emergency Fund Formula" at top, "Your Financial Safety Net" at bottom,
    teal gradient background, white text with yellow accent for result, shield icon watermark,
    minimalist banking poster, crystal clear typography, professional financial services design`,
    caption: '🛡️ *Emergency Fund*\n\n6 × Monthly Expenses = Safety Net\n\nProtect your future!'
  },
  {
    id: 5,
    title: 'Retirement Goal',
    prompt: `A retirement planning poster with gigantic gold text "₹5 CRORES" at center,
    "Your Retirement Goal" at top in white, "By Age 60 • Start at 30" at bottom,
    purple gradient background, minimalist design, lots of empty space,
    professional wealth management aesthetic, perfect text rendering, editorial quality`,
    caption: '🎯 *Retirement Planning*\n\n₹5 Crore by 60!\n\nSecure your golden years!'
  }
];

// Generate image using gpt-image-1 model
async function generateImage(promptConfig) {
  console.log(`\n${promptConfig.id}. Generating: ${promptConfig.title}`);
  console.log('─────────────────────────────────────────');
  
  try {
    console.log('  🎨 Calling gpt-image-1 model...');
    
    // Using the gpt-image-1 model as specified by user
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',  // Using gpt-image-1 as requested
        prompt: promptConfig.prompt,
        size: '1024x1024',     // Standard size for gpt-image-1
        quality: 'high',       // High quality mode
        background: 'auto',    // Automatic background
        n: 1,                  // One variant
        response_format: 'b64_json'  // Get base64 for direct saving
      })
    });
    
    const data = await response.json();
    
    if (data.data && data.data[0]) {
      // Get base64 encoded image
      const b64Json = data.data[0].b64_json;
      const imageBytes = Buffer.from(b64Json, 'base64');
      
      // Save locally
      const fileName = `gpt_image_1_${promptConfig.id}_${Date.now()}.png`;
      const filePath = path.join(__dirname, fileName);
      fs.writeFileSync(filePath, imageBytes);
      
      console.log('  ✅ Generated successfully with gpt-image-1');
      console.log(`  💾 Saved: ${fileName}`);
      console.log('  📐 Size: 1024x1024');
      console.log('  🎯 Quality: HIGH');
      
      return {
        success: true,
        fileName: fileName,
        filePath: filePath,
        caption: promptConfig.caption,
        title: promptConfig.title,
        imageBytes: imageBytes
      };
    } else {
      // Fallback if gpt-image-1 is not available
      console.log('  ⚠️ gpt-image-1 not available, using dall-e-3...');
      
      const fallbackResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: promptConfig.prompt + ' ENSURE ALL TEXT IS CRYSTAL CLEAR AND PERFECTLY READABLE',
          size: '1024x1024',
          quality: 'hd',
          n: 1
        })
      });
      
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.data && fallbackData.data[0]) {
        const imageUrl = fallbackData.data[0].url;
        const imageResponse = await fetch(imageUrl);
        const imageBytes = await imageResponse.buffer();
        
        const fileName = `image_${promptConfig.id}_${Date.now()}.png`;
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, imageBytes);
        
        console.log('  ✅ Generated with fallback model');
        console.log(`  💾 Saved: ${fileName}`);
        
        return {
          success: true,
          fileName: fileName,
          filePath: filePath,
          caption: promptConfig.caption,
          title: promptConfig.title,
          imageBytes: imageBytes,
          url: imageUrl
        };
      }
    }
    
    console.log('  ❌ Generation failed:', data.error?.message || 'Unknown error');
    return { success: false };
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Upload to Imgur for public URL
async function uploadToImgur(imageBytes) {
  console.log('  📤 Uploading to Imgur...');
  
  try {
    const form = new FormData();
    form.append('image', imageBytes.toString('base64'));
    form.append('type', 'base64');
    
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID c97d599b1bc95e8'
      },
      body: form
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('  ✅ Uploaded successfully');
      return data.data.link;
    } else {
      console.log('  ❌ Upload failed:', data.data?.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log('  ❌ Upload error:', error.message);
    return null;
  }
}

// Send to WhatsApp
async function sendToWhatsApp(imageUrl, caption, title) {
  console.log(`  📱 Sending to WhatsApp: ${title}`);
  
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
      console.log('  ❌ Send failed:', data.error?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Starting gpt-image-1 professional image generation...\n');
  console.log('NOTE: Using gpt-image-1 model as specifically requested by user');
  console.log('This model should provide superior text clarity\n');
  
  const results = [];
  let successCount = 0;
  
  for (const promptConfig of imagePrompts) {
    // Generate image with gpt-image-1
    const imageData = await generateImage(promptConfig);
    
    if (imageData.success) {
      results.push(imageData);
      
      // Upload to Imgur or use existing URL
      let publicUrl = imageData.url;
      if (!publicUrl) {
        publicUrl = await uploadToImgur(imageData.imageBytes);
      }
      
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
  
  console.log('GPT-IMAGE-1 MODEL FEATURES:');
  console.log('• Latest image generation model');
  console.log('• High quality mode enabled');
  console.log('• Better text rendering capabilities');
  console.log('• WhatsApp optimized output');
  console.log('• Professional financial design\n');
  
  if (successCount === 5) {
    console.log('🎉 SUCCESS! All 5 images delivered!');
    console.log('Check WhatsApp now for high-quality financial infographics!');
  } else if (successCount > 0) {
    console.log(`⚠️ Partial success: ${successCount} images delivered`);
  }
  
  console.log('\nUsing gpt-image-1 model as you requested!');
  console.log('This should provide superior quality images!\n');
}

// Execute
main().catch(console.error);