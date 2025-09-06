#!/usr/bin/env node
/**
 * GPT-IMAGE-1 WITH LOCAL SERVER
 * Saves images locally and serves them via HTTP server
 * NO DALL-E - ONLY gpt-image-1
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const http = require('http');

const RECIPIENT = '919765071249';
const PORT = 8888;
const SERVER_URL = 'http://localhost:8080'; // Change this to your public IP/domain if needed

console.log('🎨 GPT-IMAGE-1 WITH LOCAL SERVER');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ Model: gpt-image-1 ONLY (NO DALL-E)');
console.log('✅ Saving images locally');
console.log('✅ Serving via HTTP server\n');

// Create images directory
const IMAGES_DIR = path.join(__dirname, 'gpt-images');
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR);
  console.log('📁 Created directory:', IMAGES_DIR);
}

// Financial prompts
const prompts = [
  {
    id: 'sip',
    title: 'SIP Calculator',
    prompt: 'Professional financial infographic: "₹61 LAKHS" in huge gold text on navy blue gradient, subtitle "₹5,000 Monthly SIP for 20 Years", minimal banking design, crystal clear text rendering',
    caption: '💰 *SIP Calculator*\n\n₹5,000/month = ₹61 Lakhs!\n20 years @ 12% returns\n\nStart your wealth journey!'
  },
  {
    id: 'tax',
    title: 'Tax Savings',
    prompt: 'Tax savings poster: "SAVE ₹46,800" in massive white text on green gradient, "Section 80C Benefits" subtitle, professional financial design, perfect text clarity',
    caption: '💸 *Tax Savings*\n\nSave ₹46,800 under 80C!\nELSS • PPF • Insurance\n\nMaximize your benefits!'
  },
  {
    id: 'portfolio',
    title: 'Portfolio Mix',
    prompt: 'Investment portfolio chart: Clean pie chart showing "60% EQUITY" blue, "30% DEBT" green, "10% GOLD" gold, white background, large clear percentages, professional design',
    caption: '📊 *Portfolio Balance*\n\n60% Equity | 30% Debt | 10% Gold\n\nOptimal wealth creation!'
  },
  {
    id: 'emergency',
    title: 'Emergency Fund',
    prompt: 'Emergency fund formula poster: "6 × ₹50,000 = ₹3 LAKHS" in large text, teal gradient background, "Your Safety Net" subtitle, minimalist financial design',
    caption: '🛡️ *Emergency Fund*\n\n6 months expenses = Safety\n₹3 Lakh protection fund\n\nBuild your shield!'
  },
  {
    id: 'retirement',
    title: 'Retirement Goal',
    prompt: 'Retirement planning poster: "₹5 CRORES" in massive gold text, "Retirement Goal by Age 60" subtitle, purple gradient, wealth management aesthetic, premium design',
    caption: '🎯 *Retirement Planning*\n\n₹5 Crore by 60!\nStart at 30\n\nSecure your future!'
  }
];

// Start simple HTTP server
function startServer() {
  const server = http.createServer((req, res) => {
    // Parse URL to get filename
    const urlPath = req.url.substring(1); // Remove leading /
    const filePath = path.join(IMAGES_DIR, urlPath);
    
    // Check if file exists
    if (fs.existsSync(filePath) && filePath.endsWith('.png')) {
      console.log(`  📥 Serving: ${urlPath}`);
      const image = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': image.length,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(image);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  server.listen(PORT, () => {
    console.log(`🌐 Server running at ${SERVER_URL}`);
    console.log('📁 Serving from:', IMAGES_DIR);
    console.log('');
  });
  
  return server;
}

// Generate with gpt-image-1 and save locally
async function generateAndSave(config) {
  console.log(`\n${config.title}`);
  console.log('─────────────────────────────────────────');
  
  try {
    console.log('  🎨 Generating with gpt-image-1...');
    
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
        n: 1
        // NO response_format - returns b64_json by default
      })
    });
    
    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].b64_json) {
      // Save image locally
      const imageBytes = Buffer.from(data.data[0].b64_json, 'base64');
      const fileName = `${config.id}_${Date.now()}.png`;
      const filePath = path.join(IMAGES_DIR, fileName);
      
      fs.writeFileSync(filePath, imageBytes);
      
      console.log('  ✅ Generated with gpt-image-1!');
      console.log('  💾 Saved:', fileName);
      console.log('  📊 Size:', (imageBytes.length / 1024 / 1024).toFixed(2), 'MB');
      console.log('  🔗 URL:', `${SERVER_URL}/${fileName}`);
      
      return {
        success: true,
        fileName: fileName,
        url: `${SERVER_URL}/${fileName}`,
        caption: config.caption,
        size: imageBytes.length
      };
      
    } else if (data.error) {
      console.log('  ❌ gpt-image-1 error:', data.error.message);
      return { success: false };
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    return { success: false };
  }
}

// Send to WhatsApp
async function sendToWhatsApp(imageData) {
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
    console.log('  ✅ Sent to WhatsApp!');
    console.log('  📱 Message ID:', result.messages[0].id);
    return true;
  } else {
    console.log('  ❌ WhatsApp error:', result.error?.message);
    return false;
  }
}

// Main execution
async function main() {
  // Start server first
  const server = startServer();
  
  // Wait a bit for server to start
  await new Promise(r => setTimeout(r, 1000));
  
  // Send notification
  console.log('Sending notification to WhatsApp...');
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
          body: '🎨 GPT-IMAGE-1 Images\n\nGenerating 5 professional financial images.\nUsing ONLY gpt-image-1 model.\nNO DALL-E!\n\nPlease wait...'
        }
      })
    }
  );
  console.log('✅ Notification sent');
  
  // Generate and save all images
  const results = [];
  let successCount = 0;
  
  for (const prompt of prompts) {
    const result = await generateAndSave(prompt);
    
    if (result.success) {
      results.push(result);
      
      // Try to send via WhatsApp if server is publicly accessible
      // For localhost, this won't work for WhatsApp
      if (!SERVER_URL.includes('localhost')) {
        const sent = await sendToWhatsApp(result);
        if (sent) successCount++;
      }
    }
    
    // Wait between generations
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ GPT-IMAGE-1 GENERATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📊 RESULTS:');
  console.log(`  Generated: ${results.length}/5 images`);
  console.log(`  Total Size: ${(results.reduce((sum, r) => sum + r.size, 0) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Sent to WhatsApp: ${successCount}/5\n`);
  
  console.log('📁 SAVED IMAGES:');
  results.forEach(r => {
    console.log(`  • ${r.fileName} (${(r.size / 1024 / 1024).toFixed(2)} MB)`);
  });
  
  console.log('\n🌐 SERVER INFO:');
  console.log(`  URL: ${SERVER_URL}`);
  console.log(`  Directory: ${IMAGES_DIR}`);
  console.log('\n💡 NOTES:');
  console.log('  • Images are saved locally on your server');
  console.log('  • Server is running on port', PORT);
  console.log('  • For WhatsApp, you need a public URL (not localhost)');
  console.log('  • You can use ngrok to expose localhost: ngrok http 8080');
  console.log('\n  Press Ctrl+C to stop the server\n');
  
  // Keep server running
  process.on('SIGINT', () => {
    console.log('\n\nStopping server...');
    server.close();
    process.exit(0);
  });
}

main().catch(console.error);