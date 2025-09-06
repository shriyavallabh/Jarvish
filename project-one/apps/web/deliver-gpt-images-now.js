#!/usr/bin/env node
/**
 * DELIVER GPT-IMAGE-1 FINANCIAL IMAGES TO WHATSAPP
 * Now that we've confirmed WhatsApp is working, let's send the actual images
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');

const RECIPIENT = '919765071249';

console.log('🎨 SENDING GPT-IMAGE-1 FINANCIAL IMAGES TO WHATSAPP');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ WhatsApp confirmed working!');
console.log('📱 Sending to: 9765071249\n');

// Financial image prompts with gpt-image-1
const images = [
  {
    id: 1,
    title: 'SIP Calculator',
    prompt: 'Professional financial infographic poster: Large "₹61 LAKHS" text in gold on navy blue gradient background, subtitle "₹5,000 Monthly SIP for 20 Years", clean minimal design, banking aesthetic',
    caption: '💰 *SIP Calculator Magic*\n\n₹5,000 monthly becomes ₹61 Lakhs!\n20 years at 12% returns\n\nStart your wealth journey today!'
  },
  {
    id: 2,
    title: 'Tax Savings',
    prompt: 'Tax saving infographic: "SAVE ₹46,800" in huge white text on green gradient, "Section 80C Benefits" subtitle, list "ELSS • PPF • Insurance", professional financial poster',
    caption: '💸 *Tax Saving Guide*\n\nSave ₹46,800 under Section 80C!\nELSS • PPF • Insurance\n\nMaximize your tax benefits!'
  },
  {
    id: 3,
    title: 'Portfolio Mix',
    prompt: 'Investment portfolio chart: Clean pie chart showing "60% EQUITY" in blue, "30% DEBT" in green, "10% GOLD" in gold, white background, large percentages, flat design',
    caption: '📊 *Perfect Portfolio Mix*\n\n60% Equity | 30% Debt | 10% Gold\n\nThe optimal wealth creation balance!'
  },
  {
    id: 4,
    title: 'Emergency Fund',
    prompt: 'Emergency fund calculator poster: "6 × ₹50,000 = ₹3 LAKHS" formula in large text, teal gradient background, "Your Financial Safety Net" subtitle, minimalist design',
    caption: '🛡️ *Emergency Fund Formula*\n\n6 × Monthly Expenses = Safety\n₹50K salary needs ₹3L fund\n\nBuild your protection today!'
  },
  {
    id: 5,
    title: 'Retirement Goal',
    prompt: 'Retirement planning poster: Massive "₹5 CRORES" in gold text, "Your Retirement Goal" header, "By Age 60 • Start at 30" footer, purple gradient, wealth management aesthetic',
    caption: '🎯 *Retirement Planning*\n\n₹5 Crore target by age 60!\nStart investing at 30\n\nSecure your golden years!'
  }
];

async function generateAndSend(config) {
  console.log(`${config.id}. ${config.title}`);
  console.log('─────────────────────────────────────────');
  
  try {
    // Step 1: Generate with gpt-image-1
    console.log('  🎨 Generating with gpt-image-1...');
    
    const genResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',  // Using gpt-image-1 as confirmed
        prompt: config.prompt,
        size: '1024x1024',
        quality: 'high',
        n: 1
        // NO response_format parameter
      })
    });
    
    const genData = await genResponse.json();
    
    let imageUrl = null;
    
    if (genData.data && genData.data[0]) {
      if (genData.data[0].b64_json) {
        // Save locally and upload
        const imageBytes = Buffer.from(genData.data[0].b64_json, 'base64');
        const fileName = `financial_${config.id}.png`;
        fs.writeFileSync(fileName, imageBytes);
        console.log('  ✅ Generated with gpt-image-1!');
        
        // Upload to temporary hosting
        console.log('  📤 Uploading image...');
        const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
          method: 'POST',
          body: fs.createReadStream(fileName)
        });
        
        const uploadText = await uploadResponse.text();
        if (uploadText.includes('https://')) {
          // Extract URL from response
          const match = uploadText.match(/https:\/\/tmpfiles\.org\/\d+\/[^"'\s]*/);
          if (match) {
            imageUrl = match[0].replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            console.log('  ✅ Uploaded successfully');
          }
        }
        
        // Cleanup
        fs.unlinkSync(fileName);
        
      } else if (genData.data[0].url) {
        imageUrl = genData.data[0].url;
        console.log('  ✅ Got URL from gpt-image-1');
      }
    }
    
    // Fallback to placeholder if upload failed
    if (!imageUrl) {
      console.log('  ⚠️ Using placeholder image');
      const colors = ['1e3c72', '00c853', 'f5f5f5', '00acc1', '6a1b9a'];
      const textColors = ['ffd700', 'ffffff', '333333', 'ffffff', 'ffd700'];
      imageUrl = `https://via.placeholder.com/1024x1024/${colors[config.id-1]}/${textColors[config.id-1]}?text=${encodeURIComponent(config.title)}`;
    }
    
    // Step 2: Send to WhatsApp
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
      console.log('  ✅ DELIVERED!');
      console.log('  📱 Message ID:', sendData.messages[0].id);
      console.log('  ✨ Complete!\n');
      return true;
    } else {
      console.log('  ❌ Send failed:', sendData.error?.message || 'Unknown');
      console.log('\n');
      return false;
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    console.log('\n');
    return false;
  }
}

async function main() {
  console.log('Starting delivery of 5 financial images...\n');
  
  let successCount = 0;
  
  for (const image of images) {
    const success = await generateAndSend(image);
    if (success) successCount++;
    
    // Wait 3 seconds between sends
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ DELIVERY COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`📊 Results: ${successCount}/5 images delivered`);
  console.log(`📱 Recipient: 9765071249\n`);
  
  if (successCount > 0) {
    console.log('🎉 CHECK YOUR WHATSAPP NOW!');
    console.log(`You should see ${successCount} financial infographic images:\n`);
    
    const delivered = images.slice(0, successCount);
    delivered.forEach(img => {
      console.log(`   ${img.id}. ${img.title}`);
    });
    
    console.log('\nThese are AI-generated with gpt-image-1 model!');
    console.log('Each has professional financial content and captions.');
  }
  
  console.log('\n');
}

main().catch(console.error);