const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create comparison directory
const comparisonDir = path.join(__dirname, 'design-comparison');
if (!fs.existsSync(comparisonDir)) {
  fs.mkdirSync(comparisonDir, { recursive: true });
}

async function compareDesigns() {
  console.log('🎭 Comparing HTML designs with Next.js implementation...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const comparisons = [
    {
      name: 'Landing Page',
      html: 'file://' + path.join('/Users/shriyavallabh/Desktop/Jarvish/temp/theme-alternatives/landing/theme-1-executive-clarity.html'),
      nextjs: 'http://localhost:3000',
      key: 'landing'
    },
    {
      name: 'Admin Dashboard',
      html: 'file://' + path.join('/Users/shriyavallabh/Desktop/Jarvish/temp/theme-alternatives/admin/theme-4-premium-professional.html'),
      nextjs: 'http://localhost:3000/admin',
      key: 'admin'
    },
    {
      name: 'Advisor Dashboard', 
      html: 'file://' + path.join('/Users/shriyavallabh/Desktop/Jarvish/temp/theme-alternatives/advisor/theme-4-premium-professional.html'),
      nextjs: 'http://localhost:3000/advisor/dashboard',
      key: 'advisor'
    }
  ];

  const analysisResults = [];

  for (const comp of comparisons) {
    console.log(`\n📊 Analyzing ${comp.name}...`);
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture HTML version
    console.log(`  📸 Capturing HTML design...`);
    await page.goto(comp.html, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    const htmlScreenshot = path.join(comparisonDir, `${comp.key}-html-design.png`);
    await page.screenshot({ path: htmlScreenshot, fullPage: true });
    
    // Analyze HTML design
    const htmlAnalysis = await analyzeDesign(page, 'HTML');
    
    // Capture Next.js version
    console.log(`  📸 Capturing Next.js implementation...`);
    await page.goto(comp.nextjs, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    const nextjsScreenshot = path.join(comparisonDir, `${comp.key}-nextjs-current.png`);
    await page.screenshot({ path: nextjsScreenshot, fullPage: true });
    
    // Analyze Next.js implementation
    const nextjsAnalysis = await analyzeDesign(page, 'Next.js');
    
    // Compare and report
    const comparison = compareAnalysis(htmlAnalysis, nextjsAnalysis);
    analysisResults.push({
      name: comp.name,
      htmlAnalysis,
      nextjsAnalysis,
      comparison,
      screenshots: {
        html: htmlScreenshot,
        nextjs: nextjsScreenshot
      }
    });
    
    console.log(`\n  🔍 Design Analysis for ${comp.name}:`);
    console.log(`     HTML Design:`);
    console.log(`       - Primary Color: ${htmlAnalysis.primaryColor}`);
    console.log(`       - Secondary Color: ${htmlAnalysis.secondaryColor}`);
    console.log(`       - Font Family: ${htmlAnalysis.fontFamily}`);
    console.log(`       - Has Navigation: ${htmlAnalysis.hasNavigation}`);
    console.log(`       - Branding: ${htmlAnalysis.branding}`);
    
    console.log(`\n     Next.js Implementation:`);
    console.log(`       - Primary Color: ${nextjsAnalysis.primaryColor}`);
    console.log(`       - Secondary Color: ${nextjsAnalysis.secondaryColor}`);
    console.log(`       - Font Family: ${nextjsAnalysis.fontFamily}`);
    console.log(`       - Has Navigation: ${nextjsAnalysis.hasNavigation}`);
    console.log(`       - Branding: ${nextjsAnalysis.branding}`);
    
    console.log(`\n     ⚠️  Differences Found:`);
    comparison.differences.forEach(diff => {
      console.log(`       - ${diff}`);
    });
    
    await page.close();
  }
  
  await browser.close();
  
  // Generate comparison report
  generateComparisonReport(analysisResults);
  
  console.log('\n✅ Design comparison complete!');
  console.log(`📁 Screenshots saved in: ${comparisonDir}`);
  console.log(`📄 Report available at: ${path.join(comparisonDir, 'comparison-report.html')}`);
}

async function analyzeDesign(page, type) {
  return await page.evaluate(() => {
    // Get computed styles from the page
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    
    // Try to detect primary colors
    const rootStyles = window.getComputedStyle(document.documentElement);
    const inkColor = rootStyles.getPropertyValue('--ink').trim() || 
                    rootStyles.getPropertyValue('--primary').trim() || 
                    'not found';
    const goldColor = rootStyles.getPropertyValue('--gold').trim() || 
                     rootStyles.getPropertyValue('--secondary').trim() || 
                     'not found';
    
    // Check for navigation
    const hasNav = document.querySelector('nav') !== null || 
                   document.querySelector('[role="navigation"]') !== null;
    
    // Check for branding
    const pageText = document.body.innerText.toLowerCase();
    const hasJarvish = pageText.includes('jarvish');
    const hasHubix = pageText.includes('hubix');
    
    // Get font family
    const fontFamily = computedStyle.fontFamily;
    
    // Check for specific design elements
    const hasHeroSection = document.querySelector('[class*="hero"]') !== null ||
                          document.querySelector('section')?.classList.contains('hero');
    
    const hasCTAButton = document.querySelector('[class*="cta"]') !== null ||
                        document.querySelector('button[class*="primary"]') !== null;
    
    return {
      primaryColor: inkColor,
      secondaryColor: goldColor,
      fontFamily: fontFamily,
      hasNavigation: hasNav,
      branding: hasJarvish ? 'Jarvish' : (hasHubix ? 'Hubix' : 'None'),
      hasHeroSection,
      hasCTAButton,
      backgroundColor: computedStyle.backgroundColor
    };
  });
}

function compareAnalysis(html, nextjs) {
  const differences = [];
  
  if (html.primaryColor !== nextjs.primaryColor && 
      html.primaryColor !== 'not found') {
    differences.push(`Primary color mismatch: HTML(${html.primaryColor}) vs Next.js(${nextjs.primaryColor})`);
  }
  
  if (html.secondaryColor !== nextjs.secondaryColor && 
      html.secondaryColor !== 'not found') {
    differences.push(`Secondary color mismatch: HTML(${html.secondaryColor}) vs Next.js(${nextjs.secondaryColor})`);
  }
  
  if (!nextjs.fontFamily.includes('Fraunces') && html.fontFamily.includes('Fraunces')) {
    differences.push(`Missing Fraunces font in Next.js implementation`);
  }
  
  if (!nextjs.fontFamily.includes('Poppins') && html.fontFamily.includes('Poppins')) {
    differences.push(`Missing Poppins font in Next.js implementation`);
  }
  
  if (html.hasNavigation && !nextjs.hasNavigation) {
    differences.push(`Navigation missing in Next.js implementation`);
  }
  
  if (html.branding !== nextjs.branding && html.branding !== 'None') {
    differences.push(`Branding mismatch: HTML(${html.branding}) vs Next.js(${nextjs.branding})`);
  }
  
  return {
    matches: differences.length === 0,
    differences
  };
}

function generateComparisonReport(results) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hubix Design Comparison Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { 
      text-align: center; 
      margin-bottom: 30px;
      color: #0B1F33;
      font-size: 2.5em;
    }
    .comparison-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .page-title {
      font-size: 1.8em;
      margin-bottom: 20px;
      color: #0B1F33;
      border-bottom: 2px solid #CEA200;
      padding-bottom: 10px;
    }
    .screenshots-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .screenshot-container {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
    .screenshot-label {
      background: #0B1F33;
      color: white;
      padding: 10px;
      text-align: center;
      font-weight: bold;
    }
    .screenshot {
      width: 100%;
      height: auto;
      display: block;
    }
    .analysis-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }
    .analysis-box {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #CEA200;
    }
    .analysis-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #0B1F33;
    }
    .analysis-item {
      margin: 5px 0;
      font-size: 0.9em;
    }
    .differences {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .difference-item {
      color: #856404;
      margin: 5px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      margin-left: 10px;
    }
    .status-match { background: #d4edda; color: #155724; }
    .status-mismatch { background: #f8d7da; color: #721c24; }
    .recommendations {
      background: #d1ecf1;
      border: 1px solid #bee5eb;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 Hubix Design Comparison Report</h1>
    <p style="text-align: center; color: #666; margin-bottom: 30px;">
      Comparing finalized HTML designs with current Next.js implementation
    </p>
    
    ${results.map(result => `
      <div class="comparison-section">
        <h2 class="page-title">
          ${result.name}
          <span class="status-badge ${result.comparison.matches ? 'status-match' : 'status-mismatch'}">
            ${result.comparison.matches ? '✅ MATCHES' : '⚠️ NEEDS UPDATE'}
          </span>
        </h2>
        
        <div class="screenshots-grid">
          <div class="screenshot-container">
            <div class="screenshot-label">HTML Design (Target)</div>
            <img src="${path.basename(result.screenshots.html)}" alt="${result.name} HTML" class="screenshot">
          </div>
          <div class="screenshot-container">
            <div class="screenshot-label">Next.js Current</div>
            <img src="${path.basename(result.screenshots.nextjs)}" alt="${result.name} Next.js" class="screenshot">
          </div>
        </div>
        
        <div class="analysis-grid">
          <div class="analysis-box">
            <div class="analysis-title">📋 HTML Design Analysis</div>
            <div class="analysis-item">Primary Color: ${result.htmlAnalysis.primaryColor}</div>
            <div class="analysis-item">Secondary Color: ${result.htmlAnalysis.secondaryColor}</div>
            <div class="analysis-item">Font Family: ${result.htmlAnalysis.fontFamily}</div>
            <div class="analysis-item">Navigation: ${result.htmlAnalysis.hasNavigation ? '✅ Present' : '❌ Missing'}</div>
            <div class="analysis-item">Branding: ${result.htmlAnalysis.branding}</div>
          </div>
          
          <div class="analysis-box">
            <div class="analysis-title">⚛️ Next.js Implementation</div>
            <div class="analysis-item">Primary Color: ${result.nextjsAnalysis.primaryColor}</div>
            <div class="analysis-item">Secondary Color: ${result.nextjsAnalysis.secondaryColor}</div>
            <div class="analysis-item">Font Family: ${result.nextjsAnalysis.fontFamily}</div>
            <div class="analysis-item">Navigation: ${result.nextjsAnalysis.hasNavigation ? '✅ Present' : '❌ Missing'}</div>
            <div class="analysis-item">Branding: ${result.nextjsAnalysis.branding}</div>
          </div>
        </div>
        
        ${result.comparison.differences.length > 0 ? `
          <div class="differences">
            <strong>⚠️ Differences Detected:</strong>
            ${result.comparison.differences.map(diff => `
              <div class="difference-item">• ${diff}</div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="recommendations">
          <strong>📝 Recommendations:</strong>
          <ul style="margin-top: 10px; margin-left: 20px;">
            ${result.comparison.differences.length > 0 ? `
              <li>Update Next.js implementation to match HTML design</li>
              <li>Apply Executive Clarity theme colors (#0B1F33, #CEA200)</li>
              <li>Implement Fraunces and Poppins fonts</li>
              <li>Ensure all UI components match the HTML design</li>
            ` : `
              <li>Design implementation matches HTML template ✅</li>
              <li>No changes required</li>
            `}
          </ul>
        </div>
      </div>
    `).join('')}
    
    <div style="text-align: center; margin-top: 40px; color: #666;">
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Tool: Puppeteer Design Comparison</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const reportPath = path.join(comparisonDir, 'comparison-report.html');
  fs.writeFileSync(reportPath, html);
}

// Run the comparison
compareDesigns().catch(console.error);