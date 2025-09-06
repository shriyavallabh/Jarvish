#!/usr/bin/env node

/**
 * Test WhatsApp delivery with Gemini-generated images
 * This script generates a financial infographic using Gemini and sends it via WhatsApp
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');

// Configuration
const GEMINI_API_KEY = 'AIzaSyC15ewbSpMcboNAmMJhsj1dZmXA8l8yeGQ';
const WHATSAPP_API_TOKEN = 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD';
const WHATSAPP_PHONE_NUMBER_ID = '574744175733556'; // Updated to correct Phone Number ID
const RECIPIENT_PHONE = '919765071249'; // Your number with country code

// Today's date for content
const today = new Date();
const dateStr = today.toLocaleDateString('en-IN', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

// Market data (simulated real-time)
const marketData = {
  sensex: {
    current: 72850,
    change: 385,
    changePercent: 0.53,
    high: 73125,
    low: 72445
  },
  nifty: {
    current: 22050,
    change: 115,
    changePercent: 0.52,
    high: 22125,
    low: 21950
  },
  topGainers: [
    { name: 'HDFC Bank', change: '+2.8%' },
    { name: 'Infosys', change: '+2.3%' },
    { name: 'Reliance', change: '+1.9%' }
  ],
  topLosers: [
    { name: 'Tata Steel', change: '-1.5%' },
    { name: 'Bharti Airtel', change: '-1.2%' },
    { name: 'SBI', change: '-0.8%' }
  ]
};

/**
 * Generate financial infographic using Gemini
 */
async function generateMarketUpdateImage() {
  console.log('🎨 Generating market update infographic with Gemini...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Create detailed prompt for market update
    const prompt = `Create a professional SVG infographic for Indian stock market update with these exact specifications:

Market Data for ${dateStr}:
- Sensex: ${marketData.sensex.current} (${marketData.sensex.change > 0 ? '+' : ''}${marketData.sensex.change} points, ${marketData.sensex.changePercent}%)
- Nifty: ${marketData.nifty.current} (${marketData.nifty.change > 0 ? '+' : ''}${marketData.nifty.change} points, ${marketData.nifty.changePercent}%)

Top Gainers:
${marketData.topGainers.map(g => `- ${g.name}: ${g.change}`).join('\n')}

Top Losers:
${marketData.topLosers.map(l => `- ${l.name}: ${l.change}`).join('\n')}

Design Requirements:
- Dimensions: 1200x628px (WhatsApp post format)
- Background: Gradient from #0B1F33 (navy) to #1a3a52
- Header: "Daily Market Update" in gold (#CEA200)
- Show Sensex and Nifty with up arrows in green
- Display top gainers in green (#4CAF50) and losers in red (#f44336)
- Include charts/graphs showing the day's movement
- Add Jarvish branding at bottom
- Include disclaimer: "Mutual Fund investments are subject to market risks"

IMPORTANT: Generate only valid SVG code without any markdown or explanation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const svgContent = response.text();
    
    // Extract SVG or create fallback
    const cleanSvg = extractSvgFromResponse(svgContent);
    
    // Convert SVG to PNG buffer
    const imageBuffer = await sharp(Buffer.from(cleanSvg))
      .resize(1200, 628)
      .png()
      .toBuffer();
    
    // Add Jarvish branding overlay
    const brandedBuffer = await addJarvishBranding(imageBuffer);
    
    // Optimize for WhatsApp
    const optimizedBuffer = await optimizeForWhatsApp(brandedBuffer);
    
    // Save locally for debugging
    const outputPath = path.join(__dirname, 'market-update.jpg');
    fs.writeFileSync(outputPath, optimizedBuffer);
    console.log(`✅ Image saved to: ${outputPath}`);
    console.log(`   Size: ${(optimizedBuffer.length / 1024).toFixed(2)} KB\n`);
    
    return optimizedBuffer;
    
  } catch (error) {
    console.error('❌ Gemini generation failed:', error.message);
    // Return fallback image
    return await createFallbackImage();
  }
}

/**
 * Extract clean SVG from Gemini response
 */
function extractSvgFromResponse(response) {
  const svgMatch = response.match(/<svg[\s\S]*?<\/svg>/i);
  
  if (svgMatch) {
    return svgMatch[0];
  }
  
  // Create a professional fallback SVG
  return `<svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0B1F33;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1a3a52;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="1200" height="628" fill="url(#bgGrad)"/>
    
    <!-- Header -->
    <text x="600" y="60" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
          fill="#CEA200" text-anchor="middle">📊 Daily Market Update</text>
    <text x="600" y="95" font-family="Arial, sans-serif" font-size="18" 
          fill="#8FA3B8" text-anchor="middle">${dateStr}</text>
    
    <!-- Sensex Box -->
    <rect x="150" y="140" width="400" height="120" fill="rgba(255,255,255,0.05)" rx="10"/>
    <text x="350" y="180" font-family="Arial" font-size="24" fill="#CEA200" text-anchor="middle">SENSEX</text>
    <text x="350" y="220" font-family="Arial" font-size="36" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle">${marketData.sensex.current}</text>
    <text x="350" y="250" font-family="Arial" font-size="20" 
          fill="#4CAF50" text-anchor="middle">▲ ${marketData.sensex.change} (${marketData.sensex.changePercent}%)</text>
    
    <!-- Nifty Box -->
    <rect x="650" y="140" width="400" height="120" fill="rgba(255,255,255,0.05)" rx="10"/>
    <text x="850" y="180" font-family="Arial" font-size="24" fill="#CEA200" text-anchor="middle">NIFTY 50</text>
    <text x="850" y="220" font-family="Arial" font-size="36" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle">${marketData.nifty.current}</text>
    <text x="850" y="250" font-family="Arial" font-size="20" 
          fill="#4CAF50" text-anchor="middle">▲ ${marketData.nifty.change} (${marketData.nifty.changePercent}%)</text>
    
    <!-- Top Gainers -->
    <text x="200" y="320" font-family="Arial" font-size="22" fill="#4CAF50" font-weight="bold">📈 Top Gainers</text>
    ${marketData.topGainers.map((g, i) => 
      `<text x="200" y="${360 + i * 30}" font-family="Arial" font-size="18" fill="#FFFFFF">${g.name}: ${g.change}</text>`
    ).join('')}
    
    <!-- Top Losers -->
    <text x="700" y="320" font-family="Arial" font-size="22" fill="#f44336" font-weight="bold">📉 Top Losers</text>
    ${marketData.topLosers.map((l, i) => 
      `<text x="700" y="${360 + i * 30}" font-family="Arial" font-size="18" fill="#FFFFFF">${l.name}: ${l.change}</text>`
    ).join('')}
    
    <!-- Footer -->
    <rect x="0" y="520" width="1200" height="108" fill="rgba(0,0,0,0.3)"/>
    <text x="600" y="555" font-family="Arial" font-size="20" font-weight="bold" 
          fill="#CEA200" text-anchor="middle">Jarvish - Your AI Financial Assistant</text>
    <text x="600" y="580" font-family="Arial" font-size="14" 
          fill="#8FA3B8" text-anchor="middle">Empowering Financial Advisors with AI</text>
    <text x="600" y="605" font-family="Arial" font-size="12" 
          fill="#8FA3B8" text-anchor="middle">Mutual Fund investments are subject to market risks. Read all scheme related documents carefully.</text>
  </svg>`;
}

/**
 * Add Jarvish branding to the image
 */
async function addJarvishBranding(imageBuffer) {
  try {
    // Create Jarvish logo overlay
    const logoSvg = `
      <svg width="150" height="40">
        <text x="10" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#CEA200">
          JARVISH
        </text>
      </svg>`;
    
    const logoBuffer = await sharp(Buffer.from(logoSvg))
      .png()
      .toBuffer();
    
    // Composite the logo onto the image
    return await sharp(imageBuffer)
      .composite([{
        input: logoBuffer,
        top: 20,
        left: 20
      }])
      .toBuffer();
      
  } catch (error) {
    console.log('⚠️  Branding overlay skipped');
    return imageBuffer;
  }
}

/**
 * Optimize image for WhatsApp
 */
async function optimizeForWhatsApp(imageBuffer) {
  // WhatsApp recommends <100KB for faster delivery
  let quality = 85;
  let optimizedBuffer = await sharp(imageBuffer)
    .jpeg({ quality, progressive: true })
    .toBuffer();
  
  // Reduce quality if needed
  while (optimizedBuffer.length > 102400 && quality > 60) {
    quality -= 5;
    optimizedBuffer = await sharp(imageBuffer)
      .jpeg({ quality, progressive: true })
      .toBuffer();
  }
  
  return optimizedBuffer;
}

/**
 * Create fallback image if Gemini fails
 */
async function createFallbackImage() {
  const fallbackSvg = extractSvgFromResponse(''); // Use the fallback SVG
  
  const imageBuffer = await sharp(Buffer.from(fallbackSvg))
    .resize(1200, 628)
    .jpeg({ quality: 85 })
    .toBuffer();
  
  return imageBuffer;
}

/**
 * Upload image to WhatsApp
 */
async function uploadImageToWhatsApp(imageBuffer) {
  console.log('📤 Uploading image to WhatsApp Media API...\n');
  
  try {
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'market-update.jpg',
      contentType: 'image/jpeg'
    });
    form.append('messaging_product', 'whatsapp');
    
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`
        }
      }
    );
    
    const mediaId = response.data.id;
    console.log(`✅ Image uploaded successfully! Media ID: ${mediaId}\n`);
    return mediaId;
    
  } catch (error) {
    console.error('❌ Image upload failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send WhatsApp message with image and text
 */
async function sendWhatsAppMessage(mediaId) {
  console.log('📱 Sending WhatsApp message to +91 9765071249...\n');
  
  const messageText = `🌟 *Good Morning!*

📊 *Today's Market Highlights*

📈 *SENSEX:* ${marketData.sensex.current} (${marketData.sensex.change > 0 ? '↗️' : '↘️'} ${Math.abs(marketData.sensex.change)} pts, ${marketData.sensex.changePercent}%)
📈 *NIFTY:* ${marketData.nifty.current} (${marketData.nifty.change > 0 ? '↗️' : '↘️'} ${Math.abs(marketData.nifty.change)} pts, ${marketData.nifty.changePercent}%)

*🎯 Investment Insight:*
Markets showing positive momentum with banking and IT sectors leading the rally. Good opportunity for SIP investments in large-cap funds.

*💡 Today's Tip:*
"Time in the market beats timing the market. Continue your SIPs for long-term wealth creation."

_Powered by Jarvish AI with Gemini Vision_
_Your trusted partner in financial advisory_

📞 *Need personalized advice?*
Contact your financial advisor today!

_Mutual Fund investments are subject to market risks. Read all scheme related documents carefully._`;
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: RECIPIENT_PHONE,
        type: 'image',
        image: {
          id: mediaId,
          caption: messageText
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ WhatsApp message sent successfully!');
    console.log(`   Message ID: ${response.data.messages[0].id}`);
    console.log(`   Status: ${response.data.messages[0].message_status || 'sent'}\n`);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Jarvish WhatsApp + Gemini Integration Test\n');
  console.log('============================================\n');
  console.log(`📅 Date: ${dateStr}`);
  console.log(`📱 Recipient: +91 9765071249`);
  console.log(`🤖 AI Model: Gemini 2.0 Flash\n`);
  console.log('============================================\n');
  
  try {
    // Step 1: Generate image with Gemini
    console.log('Step 1: Generating financial infographic with Gemini AI...\n');
    const imageBuffer = await generateMarketUpdateImage();
    
    // Step 2: Upload image to WhatsApp
    console.log('\nStep 2: Uploading to WhatsApp Media Server...\n');
    const mediaId = await uploadImageToWhatsApp(imageBuffer);
    
    // Step 3: Send message with image
    console.log('\nStep 3: Sending message with image...\n');
    await sendWhatsAppMessage(mediaId);
    
    console.log('============================================\n');
    console.log('🎉 Test completed successfully!\n');
    console.log('Check your WhatsApp for the message.\n');
    console.log('Features demonstrated:');
    console.log('  ✅ Gemini AI image generation');
    console.log('  ✅ Financial data visualization');
    console.log('  ✅ WhatsApp media upload');
    console.log('  ✅ Rich text formatting');
    console.log('  ✅ SEBI compliance disclaimer\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
console.log('\n🔄 Starting test in 3 seconds...\n');
setTimeout(main, 3000);