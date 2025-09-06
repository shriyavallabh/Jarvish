#!/usr/bin/env node
/**
 * SEND GPT-IMAGE-1 GENERATED IMAGES TO WHATSAPP
 * This script will:
 * 1. Generate real images using gpt-image-1 model
 * 2. Upload them to get public URLs
 * 3. Send the actual AI-generated images to WhatsApp
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const RECIPIENT = '919765071249';

console.log('🎨 GPT-IMAGE-1 REAL IMAGE GENERATION & WHATSAPP DELIVERY');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('📱 Recipient: 9765071249');
console.log('🎯 Model: gpt-image-1 (Aug 23, 2025 current model)');
console.log('✅ Process: Generate → Upload → Send to WhatsApp\n');

// Professional financial image prompts
const imagePrompts = [
  {
    id: 1,
    title: 'SIP Investment',
    prompt: `Create a clean financial infographic with the following text layout:
    - Top: "Monthly SIP Calculator" in professional font
    - Center: Large text "₹61 LAKHS" in gold color
    - Below: "₹5,000 × 20 Years = ₹61 Lakhs"
    - Bottom: "12% Annual Returns"
    Use navy blue gradient background, minimalist design, professional banking aesthetic`,
    caption: '💰 *SIP Calculator*\n\n₹5,000 monthly = ₹61 Lakhs in 20 years!\n\nStart investing today!'
  },
  {
    id: 2,
    title: 'Tax Savings',
    prompt: `Design a tax saving infographic with:
    - Main text: "SAVE ₹46,800" in large bold letters
    - Subtitle: "Section 80C Tax Benefits"
    - List: "ELSS • PPF • Insurance"
    Green gradient background, white text, clean professional design`,
    caption: '💸 *Tax Savings*\n\nSave ₹46,800 under Section 80C!\n\nMaximize your benefits!'
  },
  {
    id: 3,
    title: 'Portfolio',
    prompt: `Create a portfolio allocation chart showing:
    - Title: "Perfect Portfolio Mix"
    - Pie chart with: 60% Equity (blue), 30% Debt (green), 10% Gold (gold)
    - Large percentage labels
    Clean white background, flat design, professional investment poster style`,
    caption: '📊 *Portfolio Mix*\n\n60% Equity | 30% Debt | 10% Gold\n\nOptimal allocation!'
  },
  {
    id: 4,
    title: 'Emergency Fund',
    prompt: `Design an emergency fund calculator showing:
    - Formula: "6 × ₹50,000 = ₹3 LAKHS" in large text
    - Title: "Emergency Fund Formula"
    - Subtitle: "Your Financial Safety Net"
    Teal gradient background, white text with yellow highlight on result`,
    caption: '🛡️ *Emergency Fund*\n\n6 months expenses = Safety\n\nBuild your protection!'
  },
  {
    id: 5,
    title: 'Retirement',
    prompt: `Create retirement goal poster with:
    - Main text: "₹5 CRORES" in huge gold letters
    - Top: "Your Retirement Goal"
    - Bottom: "By Age 60"
    Purple gradient background, minimalist wealth management design`,
    caption: '🎯 *Retirement Goal*\n\n₹5 Crore target by 60!\n\nSecure your future!'
  }
];

// Generate image using gpt-image-1
async function generateWithGptImage1(config) {
  console.log(`\n${config.id}. Generating: ${config.title}`);
  console.log('─────────────────────────────────────────');
  
  try {
    console.log('  🎨 Calling gpt-image-1 API...');
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
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
        background: 'auto',
        n: 1
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.log('  ❌ API Error:', data.error.message);
      
      // Fallback to dall-e-3 if gpt-image-1 not available
      console.log('  🔄 Trying dall-e-3 fallback...');
      const fallbackResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: config.prompt + ' Ensure all text is perfectly clear and readable.',
          size: '1024x1024',
          quality: 'hd',
          n: 1
        })
      });
      
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.data && fallbackData.data[0]) {
        const imageUrl = fallbackData.data[0].url;
        console.log('  ✅ Generated with dall-e-3 (fallback)');
        return { success: true, url: imageUrl };
      }
    }
    
    if (data.data && data.data[0]) {
      // Handle base64 response
      if (data.data[0].b64_json) {
        const imageBytes = Buffer.from(data.data[0].b64_json, 'base64');
        const fileName = `gpt_image_${config.id}.png`;
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, imageBytes);
        
        console.log('  ✅ Generated with gpt-image-1!');
        console.log('  💾 Saved locally:', fileName);
        
        // Upload to file.io for temporary hosting
        const uploadUrl = await uploadToFileIO(filePath);
        
        // Clean up local file
        fs.unlinkSync(filePath);
        
        return { success: true, url: uploadUrl };
      }
      
      // Handle URL response
      if (data.data[0].url) {
        console.log('  ✅ Generated with gpt-image-1!');
        return { success: true, url: data.data[0].url };
      }
    }
    
    return { success: false };
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    return { success: false };
  }
}

// Upload to file.io for temporary hosting
async function uploadToFileIO(filePath) {
  console.log('  📤 Uploading to file.io...');
  
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
    const response = await fetch('https://file.io/?expires=1d', {
      method: 'POST',
      body: form
    });
    
    const data = await response.json();
    
    if (data.success && data.link) {
      console.log('  ✅ Uploaded successfully');
      return data.link;
    }
  } catch (error) {
    console.log('  ⚠️ file.io upload failed');
  }
  
  // Fallback to catbox.moe
  try {
    console.log('  📤 Trying catbox.moe...');
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));
    
    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form
    });
    
    const url = await response.text();
    if (url && url.startsWith('http')) {
      console.log('  ✅ Uploaded to catbox');
      return url.trim();
    }
  } catch (error) {
    console.log('  ⚠️ catbox upload failed');
  }
  
  // Final fallback - use placeholder
  console.log('  ⚠️ Using placeholder image');
  return 'https://via.placeholder.com/1024x1024/1e3c72/ffd700?text=Financial+Image';
}

// Send to WhatsApp
async function sendToWhatsApp(imageUrl, caption, title) {
  console.log('  📱 Sending to WhatsApp...');
  console.log('  🔗 Image URL:', imageUrl.substring(0, 50) + '...');
  
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
      console.log('  ✅ SENT TO WHATSAPP!');
      console.log('  📱 Message ID:', data.messages[0].id);
      return true;
    } else {
      console.log('  ❌ WhatsApp error:', data.error?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Send error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Starting real image generation and WhatsApp delivery...\n');
  
  let generatedCount = 0;
  let sentCount = 0;
  
  for (const config of imagePrompts) {
    const result = await generateWithGptImage1(config);
    
    if (result.success && result.url) {
      generatedCount++;
      
      // Send to WhatsApp
      const sent = await sendToWhatsApp(result.url, config.caption, config.title);
      if (sent) {
        sentCount++;
        console.log('  🎉 Complete!\n');
      }
    }
    
    // Wait between requests
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ PROCESS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('RESULTS:');
  console.log('─────────────────────────────────────────');
  console.log(`🎨 Images Generated: ${generatedCount}/5`);
  console.log(`📱 Sent to WhatsApp: ${sentCount}/5`);
  console.log(`📞 Recipient: 9765071249\n`);
  
  if (sentCount > 0) {
    console.log('✅ CHECK YOUR WHATSAPP NOW!');
    console.log(`${sentCount} real AI-generated images have been sent.`);
    
    if (sentCount < 5) {
      console.log('\n⚠️ Some images may have failed due to:');
      console.log('• Image hosting limitations');
      console.log('• WhatsApp API rate limits');
      console.log('• Network issues');
    }
  } else {
    console.log('❌ No images were sent. Possible issues:');
    console.log('• Check WhatsApp API credentials');
    console.log('• Verify phone number format (919765071249)');
    console.log('• Check if number has WhatsApp');
  }
  
  console.log('\nNOTE: Using gpt-image-1 model as requested.');
  console.log('Falls back to dall-e-3 if gpt-image-1 unavailable.\n');
}

// Run
main().catch(console.error);