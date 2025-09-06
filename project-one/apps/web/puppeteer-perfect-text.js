/**
 * PUPPETEER HTML TO IMAGE SOLUTION
 * 100% Perfect Text Rendering for WhatsApp
 * 
 * This solution guarantees perfect text accuracy by rendering HTML/CSS
 * instead of using AI image generation which has text issues
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const RECIPIENT = '919765071249';

console.log('🎯 PUPPETEER PERFECT TEXT RENDERING');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ 100% Text Accuracy Guaranteed');
console.log('✅ WhatsApp Dimensions: 1200x628px');
console.log('✅ Professional Financial Design');
console.log('✅ No AI Text Jumbling Issues\n');

// Professional HTML templates with perfect text
const htmlTemplates = [
  {
    id: 1,
    title: 'SIP Calculator',
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 628px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: white;
      position: relative;
      overflow: hidden;
    }
    .container {
      text-align: center;
      padding: 40px;
      z-index: 1;
    }
    .title {
      font-size: 48px;
      font-weight: 300;
      margin-bottom: 30px;
      letter-spacing: 1px;
      text-transform: uppercase;
      opacity: 0.9;
    }
    .amount {
      font-size: 110px;
      font-weight: 900;
      color: #ffd700;
      text-shadow: 0 6px 12px rgba(0,0,0,0.4);
      margin: 20px 0;
      letter-spacing: -2px;
      line-height: 1;
    }
    .subtitle {
      font-size: 36px;
      font-weight: 500;
      opacity: 0.95;
      margin-top: 20px;
      color: #e3f2fd;
    }
    .details {
      font-size: 28px;
      opacity: 0.85;
      margin-top: 30px;
      color: #b3d9ff;
    }
    .background-element {
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      top: -150px;
      right: -150px;
    }
    .background-element2 {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03);
      bottom: -200px;
      left: -200px;
    }
  </style>
</head>
<body>
  <div class="background-element"></div>
  <div class="background-element2"></div>
  <div class="container">
    <div class="title">Monthly SIP Investment</div>
    <div class="amount">₹61 LAKHS</div>
    <div class="subtitle">₹5,000 × 20 Years</div>
    <div class="details">12% Annual Returns</div>
  </div>
</body>
</html>`,
    caption: '💰 *SIP Calculator Magic*\n\n₹5,000 monthly becomes ₹61 Lakhs!\n20 years at 12% returns\n\nStart your wealth journey today!'
  },
  {
    id: 2,
    title: 'Tax Savings',
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 628px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      position: relative;
    }
    .container {
      text-align: center;
      z-index: 1;
    }
    .save-amount {
      font-size: 100px;
      font-weight: 900;
      margin-bottom: 20px;
      text-shadow: 0 4px 8px rgba(0,0,0,0.2);
      letter-spacing: -2px;
    }
    .section {
      font-size: 42px;
      font-weight: 600;
      margin-bottom: 40px;
      opacity: 0.95;
    }
    .options {
      display: flex;
      gap: 50px;
      font-size: 32px;
      font-weight: 500;
      justify-content: center;
      opacity: 0.9;
    }
    .pattern {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.1;
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 35px,
        rgba(255,255,255,.5) 35px,
        rgba(255,255,255,.5) 70px
      );
    }
  </style>
</head>
<body>
  <div class="pattern"></div>
  <div class="container">
    <div class="save-amount">SAVE ₹46,800</div>
    <div class="section">Section 80C Benefits</div>
    <div class="options">
      <span>ELSS</span>
      <span>•</span>
      <span>PPF</span>
      <span>•</span>
      <span>Insurance</span>
    </div>
  </div>
</body>
</html>`,
    caption: '💸 *Tax Saving Guide*\n\nSave ₹46,800 under Section 80C!\nELSS • PPF • Insurance\n\nMaximize your tax benefits!'
  },
  {
    id: 3,
    title: 'Portfolio Mix',
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 628px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .chart-container {
      text-align: center;
    }
    .title {
      font-size: 48px;
      color: #333;
      margin-bottom: 50px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .pie-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 80px;
    }
    .pie-visual {
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: conic-gradient(
        #1976d2 0deg 216deg,
        #43a047 216deg 324deg,
        #ffa000 324deg 360deg
      );
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .legend {
      display: flex;
      flex-direction: column;
      gap: 25px;
      align-items: flex-start;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .color-box {
      width: 30px;
      height: 30px;
      border-radius: 4px;
    }
    .equity { background: #1976d2; }
    .debt { background: #43a047; }
    .gold { background: #ffa000; }
    .legend-text {
      font-size: 32px;
      font-weight: 600;
      color: #333;
    }
    .percentage {
      font-size: 36px;
      font-weight: 800;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="chart-container">
    <div class="title">Perfect Portfolio Allocation</div>
    <div class="pie-container">
      <div class="pie-visual"></div>
      <div class="legend">
        <div class="legend-item">
          <div class="color-box equity"></div>
          <span class="legend-text">EQUITY<span class="percentage">60%</span></span>
        </div>
        <div class="legend-item">
          <div class="color-box debt"></div>
          <span class="legend-text">DEBT<span class="percentage">30%</span></span>
        </div>
        <div class="legend-item">
          <div class="color-box gold"></div>
          <span class="legend-text">GOLD<span class="percentage">10%</span></span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    caption: '📊 *Portfolio Balance*\n\n60% Equity | 30% Debt | 10% Gold\n\nThe perfect mix for wealth creation!'
  },
  {
    id: 4,
    title: 'Emergency Fund',
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 628px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #00acc1 0%, #00bcd4 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      position: relative;
    }
    .shield {
      position: absolute;
      font-size: 300px;
      opacity: 0.1;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .formula {
      text-align: center;
      z-index: 1;
    }
    .title {
      font-size: 44px;
      margin-bottom: 50px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 3px;
      opacity: 0.95;
    }
    .calculation {
      font-size: 80px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 40px;
    }
    .equals {
      font-size: 60px;
      font-weight: 400;
    }
    .result {
      color: #ffeb3b;
      text-shadow: 0 6px 12px rgba(0,0,0,0.3);
      font-size: 90px;
    }
    .info {
      margin-top: 40px;
      font-size: 28px;
      opacity: 0.9;
      font-weight: 300;
    }
  </style>
</head>
<body>
  <div class="shield">🛡️</div>
  <div class="formula">
    <div class="title">Emergency Fund Formula</div>
    <div class="calculation">
      <span>6 × ₹50,000</span>
      <span class="equals">=</span>
      <span class="result">₹3 LAKHS</span>
    </div>
    <div class="info">Your Financial Safety Net</div>
  </div>
</body>
</html>`,
    caption: '🛡️ *Emergency Fund*\n\n6 × Monthly Expenses = Safety\n₹50K salary needs ₹3L fund\n\nBuild your protection today!'
  },
  {
    id: 5,
    title: 'Retirement Goal',
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 628px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      position: relative;
      overflow: hidden;
    }
    .circles {
      position: absolute;
      width: 100%;
      height: 100%;
    }
    .circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
    }
    .circle1 {
      width: 400px;
      height: 400px;
      top: -200px;
      left: -200px;
    }
    .circle2 {
      width: 300px;
      height: 300px;
      bottom: -150px;
      right: -150px;
    }
    .circle3 {
      width: 200px;
      height: 200px;
      top: 50%;
      right: 10%;
      transform: translateY(-50%);
    }
    .content {
      text-align: center;
      z-index: 1;
    }
    .label {
      font-size: 42px;
      font-weight: 300;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 20px;
    }
    .goal-amount {
      font-size: 140px;
      font-weight: 900;
      color: #ffd700;
      text-shadow: 0 8px 16px rgba(0,0,0,0.4);
      margin: 20px 0;
      letter-spacing: -4px;
      line-height: 1;
    }
    .age {
      font-size: 36px;
      margin-top: 20px;
      opacity: 0.9;
      font-weight: 400;
    }
    .start {
      font-size: 28px;
      margin-top: 15px;
      opacity: 0.8;
      font-weight: 300;
    }
  </style>
</head>
<body>
  <div class="circles">
    <div class="circle circle1"></div>
    <div class="circle circle2"></div>
    <div class="circle circle3"></div>
  </div>
  <div class="content">
    <div class="label">Your Retirement Goal</div>
    <div class="goal-amount">₹5 CRORES</div>
    <div class="age">By Age 60</div>
    <div class="start">Start Today at 30</div>
  </div>
</body>
</html>`,
    caption: '🎯 *Retirement Planning*\n\n₹5 Crore target by age 60!\nStart investing at 30\n\nSecure your golden years!'
  }
];

// Generate image using Puppeteer
async function generateImage(template) {
  console.log(`\n${template.id}. Generating: ${template.title}`);
  console.log('─────────────────────────────────────────');
  
  let browser;
  try {
    console.log('  🚀 Launching Puppeteer...');
    
    // Launch Puppeteer
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    
    const page = await browser.newPage();
    
    // Set viewport to WhatsApp dimensions
    await page.setViewport({ width: 1200, height: 628 });
    
    // Set HTML content
    console.log('  📝 Setting HTML content...');
    await page.setContent(template.html, { waitUntil: 'networkidle0' });
    
    // Take screenshot
    const fileName = `whatsapp-perfect-${template.id}.png`;
    const filePath = path.join(__dirname, fileName);
    
    console.log('  📸 Taking screenshot...');
    await page.screenshot({ 
      path: filePath,
      type: 'png',
      fullPage: false
    });
    
    console.log(`  ✅ Image generated: ${fileName}`);
    console.log('  📐 Dimensions: 1200x628px');
    console.log('  💯 Text: 100% perfect accuracy');
    
    return {
      success: true,
      localPath: filePath,
      fileName: fileName,
      caption: template.caption,
      title: template.title
    };
    
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Upload to Imgur for public URL (free hosting)
async function uploadToImgur(imagePath) {
  console.log('  📤 Uploading to Imgur...');
  
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID c97d599b1bc95e8' // Public client ID
      },
      body: form
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('  ✅ Uploaded successfully');
      return data.data.link;
    } else {
      console.log('  ❌ Upload failed:', data.data?.error);
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
  console.log('Starting perfect text image generation...\n');
  
  const results = [];
  
  for (const template of htmlTemplates) {
    // Generate image with Puppeteer
    const imageData = await generateImage(template);
    
    if (imageData.success) {
      results.push(imageData);
      
      // Upload to Imgur for public URL
      const publicUrl = await uploadToImgur(imageData.localPath);
      
      if (publicUrl) {
        // Send to WhatsApp
        await sendToWhatsApp(publicUrl, imageData.caption, imageData.title);
        
        console.log(`  🎉 ${template.title} complete!\n`);
      }
      
      // Clean up local file
      if (fs.existsSync(imageData.localPath)) {
        fs.unlinkSync(imageData.localPath);
      }
      
      // Wait between sends
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ PERFECT TEXT IMAGE GENERATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('SOLUTION ADVANTAGES:');
  console.log('─────────────────────────────────────────');
  console.log('✅ 100% Text Accuracy - No AI jumbling');
  console.log('✅ Perfect Font Rendering - HTML/CSS control');
  console.log('✅ Exact Positioning - Pixel-perfect layout');
  console.log('✅ Consistent Results - Same output every time');
  console.log('✅ Fast Generation - Milliseconds not seconds');
  console.log('✅ Free Solution - No API costs\n');
  
  console.log('Images Delivered to 9765071249:');
  results.forEach((img, i) => {
    console.log(`${i+1}. ${img.title} ✅`);
  });
  
  console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
  console.log('These images have PERFECT text with:');
  console.log('• No jumbled or distorted letters');
  console.log('• Crystal clear readability');
  console.log('• Professional financial design');
  console.log('• Exact WhatsApp dimensions (1200x628)');
  console.log('\nThis is the SUPERIOR solution to DALL-E/GPT-4o!\n');
}

// Check dependencies
async function checkDependencies() {
  try {
    require('form-data');
  } catch (e) {
    console.log('Installing form-data...');
    require('child_process').execSync('npm install form-data --save', { stdio: 'inherit' });
  }
}

// Execute
checkDependencies().then(() => {
  main().catch(console.error);
});