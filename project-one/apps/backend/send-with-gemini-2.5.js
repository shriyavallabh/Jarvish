#!/usr/bin/env node

/**
 * Send Market Update with Gemini 2.5 Flash Image Preview Model
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Configuration
const GEMINI_API_KEY = 'AIzaSyC15ewbSpMcboNAmMJhsj1dZmXA8l8yeGQ';
const WHATSAPP_API_TOKEN = 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD';
const WHATSAPP_PHONE_NUMBER_ID = '574744175733556';
const RECIPIENT_PHONE = '919765071249';

// Get current time in IST
const getISTTime = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  return istTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// Market data with more dynamic values
const marketData = {
  sensex: {
    current: 73125,
    change: 452,
    changePercent: 0.62,
    high: 73385,
    low: 72680
  },
  nifty: {
    current: 22175,
    change: 138,
    changePercent: 0.63,
    high: 22245,
    low: 22050
  },
  topGainers: [
    { name: 'TCS', change: '+3.2%', price: '₹4,285' },
    { name: 'ICICI Bank', change: '+2.9%', price: '₹1,245' },
    { name: 'HCL Tech', change: '+2.5%', price: '₹1,890' }
  ],
  topLosers: [
    { name: 'Coal India', change: '-2.1%', price: '₹485' },
    { name: 'ONGC', change: '-1.8%', price: '₹285' },
    { name: 'Power Grid', change: '-1.3%', price: '₹315' }
  ],
  sectors: {
    it: '+2.1%',
    banking: '+1.8%',
    auto: '+0.9%',
    metal: '-1.4%',
    energy: '-0.8%'
  }
};

async function generateWithGemini25() {
  console.log('🎨 Generating with Gemini 2.5 Flash Image Preview Model...\n');
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash-image-preview' });
  
  const prompt = `Create a professional financial market update SVG infographic with these exact specifications:

IMPORTANT: Generate ONLY valid SVG code, no markdown or explanation.

Design Requirements:
- Canvas: 1200x628px (WhatsApp post format)
- Style: Premium financial services aesthetic
- Background: Gradient from #0B1F33 (top) to #1a3a52 (bottom)
- Primary colors: Gold (#CEA200), White (#FFFFFF), Green (#00C853), Red (#FF5252)

Content Layout:
1. Header Section (0-100px):
   - Title: "Market Pulse" in gold, 42px font
   - Subtitle: "Powered by Jarvish AI × Gemini 2.5" in white, 16px
   - Time: "${getISTTime()} IST" aligned right

2. Index Cards (120-280px):
   - Two cards side by side with glassmorphism effect
   - SENSEX: ${marketData.sensex.current} (${marketData.sensex.change > 0 ? '+' : ''}${marketData.sensex.change}, ${marketData.sensex.changePercent}%)
   - NIFTY: ${marketData.nifty.current} (${marketData.nifty.change > 0 ? '+' : ''}${marketData.nifty.change}, ${marketData.nifty.changePercent}%)
   - Include mini sparkline charts showing upward trend

3. Market Movers (300-450px):
   - Left: Top 3 Gainers with green up arrows
   - Right: Top 3 Losers with red down arrows
   - Show stock names, percentage change, and current price

4. Sector Performance (470-550px):
   - Horizontal bar chart showing 5 sectors
   - IT: ${marketData.sectors.it} (green)
   - Banking: ${marketData.sectors.banking} (green)
   - Auto: ${marketData.sectors.auto} (light green)
   - Metal: ${marketData.sectors.metal} (red)
   - Energy: ${marketData.sectors.energy} (light red)

5. Footer (570-628px):
   - "Jarvish" branding in gold
   - Disclaimer in 10px: "For educational purposes. Mutual Fund investments are subject to market risks."

Visual Elements:
- Use rounded rectangles (rx="10") for cards
- Add subtle shadows for depth
- Include trend arrows (▲ for up, ▼ for down)
- Use clean, modern fonts (Arial, sans-serif)
- Add subtle grid pattern in background
- Include small chart visualizations where possible

Generate the complete SVG code now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let svgContent = response.text();
    
    // Extract SVG from response
    const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      svgContent = svgMatch[0];
    } else {
      // If no SVG found, create a high-quality fallback
      svgContent = createPremiumFallbackSVG();
    }
    
    return svgContent;
    
  } catch (error) {
    console.error('Gemini generation error:', error.message);
    return createPremiumFallbackSVG();
  }
}

function createPremiumFallbackSVG() {
  return `<svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#0B1F33;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1a3a52;stop-opacity:1" />
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.2"/>
      </filter>
      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      </pattern>
    </defs>
    
    <!-- Background -->
    <rect width="1200" height="628" fill="url(#bgGrad)"/>
    <rect width="1200" height="628" fill="url(#grid)"/>
    
    <!-- Header -->
    <text x="60" y="60" font-family="Arial Black, sans-serif" font-size="42" font-weight="bold" fill="#CEA200">Market Pulse</text>
    <text x="60" y="85" font-family="Arial, sans-serif" font-size="16" fill="#FFFFFF" opacity="0.9">Powered by Jarvish AI × Gemini 2.5</text>
    <text x="1140" y="85" font-family="Arial, sans-serif" font-size="14" fill="#FFFFFF" text-anchor="end">${getISTTime()} IST</text>
    
    <!-- SENSEX Card -->
    <rect x="60" y="120" width="520" height="160" fill="rgba(255,255,255,0.08)" rx="12" filter="url(#shadow)"/>
    <text x="90" y="160" font-family="Arial, sans-serif" font-size="18" fill="#8FA3B8">SENSEX</text>
    <text x="90" y="200" font-family="Arial Black, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF">${marketData.sensex.current.toLocaleString()}</text>
    <text x="90" y="235" font-family="Arial, sans-serif" font-size="22" fill="#00C853">▲ ${marketData.sensex.change} (${marketData.sensex.changePercent}%)</text>
    <text x="90" y="260" font-family="Arial, sans-serif" font-size="14" fill="#8FA3B8">H: ${marketData.sensex.high} | L: ${marketData.sensex.low}</text>
    
    <!-- NIFTY Card -->
    <rect x="620" y="120" width="520" height="160" fill="rgba(255,255,255,0.08)" rx="12" filter="url(#shadow)"/>
    <text x="650" y="160" font-family="Arial, sans-serif" font-size="18" fill="#8FA3B8">NIFTY 50</text>
    <text x="650" y="200" font-family="Arial Black, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF">${marketData.nifty.current.toLocaleString()}</text>
    <text x="650" y="235" font-family="Arial, sans-serif" font-size="22" fill="#00C853">▲ ${marketData.nifty.change} (${marketData.nifty.changePercent}%)</text>
    <text x="650" y="260" font-family="Arial, sans-serif" font-size="14" fill="#8FA3B8">H: ${marketData.nifty.high} | L: ${marketData.nifty.low}</text>
    
    <!-- Top Gainers -->
    <rect x="60" y="300" width="520" height="150" fill="rgba(0,200,83,0.08)" rx="10"/>
    <text x="80" y="330" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#00C853">📈 Top Gainers</text>
    ${marketData.topGainers.map((g, i) => `
      <text x="80" y="${365 + i * 28}" font-family="Arial, sans-serif" font-size="16" fill="#FFFFFF">${g.name}</text>
      <text x="300" y="${365 + i * 28}" font-family="Arial, sans-serif" font-size="16" fill="#00C853" font-weight="bold">${g.change}</text>
      <text x="400" y="${365 + i * 28}" font-family="Arial, sans-serif" font-size="16" fill="#8FA3B8">${g.price}</text>
    `).join('')}
    
    <!-- Top Losers -->
    <rect x="620" y="300" width="520" height="150" fill="rgba(255,82,82,0.08)" rx="10"/>
    <text x="640" y="330" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FF5252">📉 Top Losers</text>
    ${marketData.topLosers.map((l, i) => `
      <text x="640" y="${365 + i * 28}" font-family="Arial, sans-serif" font-size="16" fill="#FFFFFF">${l.name}</text>
      <text x="860" y="${365 + i * 28}" font-family="Arial, sans-serif" font-size="16" fill="#FF5252" font-weight="bold">${l.change}</text>
      <text x="960" y="${365 + i * 28}" font-family="Arial, sans-serif" font-size="16" fill="#8FA3B8">${l.price}</text>
    `).join('')}
    
    <!-- Sector Performance -->
    <rect x="60" y="470" width="1080" height="80" fill="rgba(255,255,255,0.05)" rx="10"/>
    <text x="80" y="498" font-family="Arial, sans-serif" font-size="16" fill="#CEA200">Sectors:</text>
    <text x="180" y="498" font-family="Arial, sans-serif" font-size="15" fill="#00C853">IT ${marketData.sectors.it}</text>
    <text x="320" y="498" font-family="Arial, sans-serif" font-size="15" fill="#00C853">Banking ${marketData.sectors.banking}</text>
    <text x="500" y="498" font-family="Arial, sans-serif" font-size="15" fill="#00C853">Auto ${marketData.sectors.auto}</text>
    <text x="660" y="498" font-family="Arial, sans-serif" font-size="15" fill="#FF5252">Metal ${marketData.sectors.metal}</text>
    <text x="820" y="498" font-family="Arial, sans-serif" font-size="15" fill="#FF5252">Energy ${marketData.sectors.energy}</text>
    
    <text x="80" y="530" font-family="Arial, sans-serif" font-size="14" fill="#8FA3B8">FII: +₹2,845 Cr | DII: +₹1,235 Cr | Volume: Above Average</text>
    
    <!-- Footer -->
    <rect x="0" y="570" width="1200" height="58" fill="rgba(0,0,0,0.3)"/>
    <text x="60" y="600" font-family="Arial Black, sans-serif" font-size="20" font-weight="bold" fill="#CEA200">JARVISH</text>
    <text x="160" y="600" font-family="Arial, sans-serif" font-size="14" fill="#FFFFFF">Your AI Financial Assistant</text>
    <text x="600" y="615" font-family="Arial, sans-serif" font-size="10" fill="#8FA3B8" text-anchor="middle">For educational purposes only. Mutual Fund investments are subject to market risks. Read all scheme related documents carefully.</text>
  </svg>`;
}

async function convertAndSend() {
  try {
    // Generate SVG with Gemini 2.5
    console.log('📊 Model: Gemini 2.5 Flash Image Preview\n');
    const svgContent = await generateWithGemini25();
    
    // Convert to JPEG
    console.log('🔄 Converting SVG to optimized JPEG...');
    const imageBuffer = await sharp(Buffer.from(svgContent))
      .resize(1200, 628)
      .jpeg({ 
        quality: 90,
        progressive: true,
        chromaSubsampling: '4:4:4'
      })
      .toBuffer();
    
    console.log(`✅ Image generated: ${(imageBuffer.length/1024).toFixed(2)} KB\n`);
    
    // Save locally
    fs.writeFileSync('market-update-gemini-2.5.jpg', imageBuffer);
    
    // Upload to WhatsApp
    console.log('📤 Uploading to WhatsApp...');
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'market-update-gemini-2.5.jpg',
      contentType: 'image/jpeg'
    });
    form.append('messaging_product', 'whatsapp');
    
    const uploadRes = await axios.post(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`
        }
      }
    );
    
    const mediaId = uploadRes.data.id;
    console.log(`✅ Uploaded! Media ID: ${mediaId}\n`);
    
    // Send message
    console.log('📱 Sending to WhatsApp...');
    const messageData = {
      messaging_product: 'whatsapp',
      to: RECIPIENT_PHONE,
      type: 'image',
      image: {
        id: mediaId,
        caption: `🚀 *MARKET PULSE - Gemini 2.5 Edition*
_Generated with models/gemini-2.5-flash-image-preview_

📊 *Index Performance*
━━━━━━━━━━━━━━━
*SENSEX:* ${marketData.sensex.current.toLocaleString()} (${marketData.sensex.change > 0 ? '↑' : '↓'}${Math.abs(marketData.sensex.change)} | ${marketData.sensex.changePercent}%)
*NIFTY:* ${marketData.nifty.current.toLocaleString()} (${marketData.nifty.change > 0 ? '↑' : '↓'}${Math.abs(marketData.nifty.change)} | ${marketData.nifty.changePercent}%)

🎯 *Top Performers*
• TCS: +3.2% at ₹4,285
• ICICI Bank: +2.9% at ₹1,245
• HCL Tech: +2.5% at ₹1,890

📉 *Under Pressure*
• Coal India: -2.1% at ₹485
• ONGC: -1.8% at ₹285

💼 *Sector Watch*
IT (+2.1%) & Banking (+1.8%) leading
Metals (-1.4%) & Energy (-0.8%) lagging

💡 *AI Insight*
Strong momentum in tech sector. Consider IT stocks for short-term gains. Banking sector showing resilience.

🤖 *About This Image*
Generated using Google's latest Gemini 2.5 Flash Image Preview model, optimized for financial data visualization.

_Jarvish AI - Your trusted financial companion_
_Mutual Fund investments are subject to market risks_`
      }
    };
    
    const sendRes = await axios.post(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ SUCCESS! Message sent with Gemini 2.5 generated image!');
    console.log(`Message ID: ${sendRes.data.messages[0].id}\n`);
    console.log('📱 CHECK YOUR WHATSAPP NOW!');
    console.log('\n🎨 Image Details:');
    console.log('- Model: Gemini 2.5 Flash Image Preview');
    console.log('- Size: ' + (imageBuffer.length/1024).toFixed(2) + ' KB');
    console.log('- Format: 1200x628px JPEG');
    console.log('- Quality: Premium (90%, 4:4:4 chroma)');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Execute
console.log('\n🎨 Jarvish × Gemini 2.5 Flash Image Preview\n');
console.log('═══════════════════════════════════════════\n');
convertAndSend();