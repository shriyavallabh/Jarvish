const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots-current-state');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function captureUIState() {
  console.log('🎭 Starting visual testing for Hubix UI...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for better visibility
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport for desktop
  await page.setViewport({ width: 1920, height: 1080 });

  const pages = [
    { name: 'Landing Page', url: 'http://localhost:3000', path: 'landing-page' },
    { name: 'Admin Dashboard', url: 'http://localhost:3000/admin', path: 'admin-dashboard' },
    { name: 'Advisor Dashboard', url: 'http://localhost:3000/advisor/dashboard', path: 'advisor-dashboard' },
    { name: 'Sign In', url: 'http://localhost:3000/sign-in', path: 'sign-in' },
    { name: 'Sign Up', url: 'http://localhost:3000/sign-up', path: 'sign-up' },
    { name: 'Onboarding', url: 'http://localhost:3000/onboarding', path: 'onboarding' },
    { name: 'Pricing', url: 'http://localhost:3000/pricing', path: 'pricing' }
  ];

  console.log('📸 Capturing screenshots of all pages...\n');

  for (const pageInfo of pages) {
    try {
      console.log(`🔍 Visiting ${pageInfo.name}: ${pageInfo.url}`);
      
      await page.goto(pageInfo.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait a bit for any animations to complete
      await page.waitForTimeout(2000);

      // Capture full page screenshot
      const screenshotPath = path.join(screenshotsDir, `${pageInfo.path}-desktop.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      console.log(`   ✅ Desktop screenshot saved: ${screenshotPath}`);

      // Also capture mobile view
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      const mobileScreenshotPath = path.join(screenshotsDir, `${pageInfo.path}-mobile.png`);
      await page.screenshot({ 
        path: mobileScreenshotPath,
        fullPage: true 
      });
      console.log(`   ✅ Mobile screenshot saved: ${mobileScreenshotPath}`);

      // Reset to desktop viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Check for key elements and report
      const checks = await performVisualChecks(page, pageInfo.name);
      console.log(`   📊 Visual checks for ${pageInfo.name}:`);
      checks.forEach(check => {
        console.log(`      ${check.passed ? '✅' : '❌'} ${check.name}: ${check.message}`);
      });
      console.log('');

    } catch (error) {
      console.error(`   ❌ Error capturing ${pageInfo.name}: ${error.message}\n`);
    }
  }

  await browser.close();
  
  console.log('\n🎉 Visual testing complete!');
  console.log(`📁 Screenshots saved in: ${screenshotsDir}`);
  
  // Generate HTML report
  generateHTMLReport(screenshotsDir);
}

async function performVisualChecks(page, pageName) {
  const checks = [];

  try {
    // Check for navigation/header
    const hasNavigation = await page.$('nav, header') !== null;
    checks.push({
      name: 'Navigation/Header',
      passed: hasNavigation,
      message: hasNavigation ? 'Present' : 'Missing'
    });

    // Check for main content area
    const hasMainContent = await page.$('main, [role="main"], .main-content') !== null;
    checks.push({
      name: 'Main Content',
      passed: hasMainContent,
      message: hasMainContent ? 'Present' : 'Missing'
    });

    // Check for responsive design
    const hasViewportMeta = await page.$('meta[name="viewport"]') !== null;
    checks.push({
      name: 'Responsive Meta Tag',
      passed: hasViewportMeta,
      message: hasViewportMeta ? 'Present' : 'Missing'
    });

    // Check for Hubix branding
    const pageContent = await page.content();
    const hasHubixBranding = pageContent.toLowerCase().includes('hubix') || 
                            pageContent.toLowerCase().includes('jarvish');
    checks.push({
      name: 'Hubix/Jarvish Branding',
      passed: hasHubixBranding,
      message: hasHubixBranding ? 'Found' : 'Not found'
    });

    // Check for financial advisor related content
    const hasFinancialContent = pageContent.toLowerCase().includes('advisor') || 
                                pageContent.toLowerCase().includes('mfd') ||
                                pageContent.toLowerCase().includes('sebi');
    checks.push({
      name: 'Financial Advisor Content',
      passed: hasFinancialContent,
      message: hasFinancialContent ? 'Found' : 'Not found'
    });

  } catch (error) {
    checks.push({
      name: 'Error',
      passed: false,
      message: error.message
    });
  }

  return checks;
}

function generateHTMLReport(screenshotsDir) {
  const screenshots = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hubix UI Visual Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #0B1F33 0%, #1a3a52 100%);
      color: #fff;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { 
      text-align: center; 
      margin-bottom: 20px;
      font-size: 2.5em;
      background: linear-gradient(90deg, #CEA200, #FFD700);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .timestamp { 
      text-align: center; 
      margin-bottom: 40px;
      opacity: 0.8;
    }
    .page-section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      border: 1px solid rgba(206, 162, 0, 0.3);
    }
    .page-title {
      font-size: 1.8em;
      margin-bottom: 20px;
      color: #CEA200;
      border-bottom: 2px solid rgba(206, 162, 0, 0.3);
      padding-bottom: 10px;
    }
    .screenshots-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .screenshot-container {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 10px;
    }
    .screenshot-label {
      font-size: 0.9em;
      margin-bottom: 10px;
      text-align: center;
      color: #FFD700;
    }
    .screenshot {
      width: 100%;
      height: auto;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      transition: transform 0.3s;
    }
    .screenshot:hover {
      transform: scale(1.02);
    }
    .notes {
      background: rgba(206, 162, 0, 0.1);
      border-left: 4px solid #CEA200;
      padding: 15px;
      margin-top: 20px;
      border-radius: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      margin-left: 10px;
    }
    .status-live { background: #0C310C; color: #90EE90; }
    .status-wip { background: #B8860B; color: #FFD700; }
    .status-pending { background: #8B0000; color: #FFB6C1; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎭 Hubix UI Visual Test Report</h1>
    <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
    
    ${generatePageSections(screenshots)}
    
    <div class="notes">
      <h3>📝 Testing Notes:</h3>
      <ul style="margin-top: 10px; margin-left: 20px;">
        <li>All pages tested on both desktop (1920x1080) and mobile (375x667) viewports</li>
        <li>Screenshots captured after network idle to ensure all content loaded</li>
        <li>Visual checks performed for navigation, content, and branding elements</li>
        <li>Using live credentials for Supabase, OpenAI, WhatsApp, and Clerk integration</li>
      </ul>
    </div>
  </div>
  
  <script>
    // Click to open screenshot in new tab
    document.querySelectorAll('.screenshot').forEach(img => {
      img.addEventListener('click', () => {
        window.open(img.src, '_blank');
      });
    });
  </script>
</body>
</html>
  `;
  
  const reportPath = path.join(screenshotsDir, 'visual-test-report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`\n📄 HTML Report generated: ${reportPath}`);
}

function generatePageSections(screenshots) {
  const pages = [
    { key: 'landing-page', title: 'Landing Page', status: 'live' },
    { key: 'admin-dashboard', title: 'Admin Dashboard', status: 'wip' },
    { key: 'advisor-dashboard', title: 'Advisor Dashboard', status: 'wip' },
    { key: 'sign-in', title: 'Sign In Page', status: 'live' },
    { key: 'sign-up', title: 'Sign Up Page', status: 'live' },
    { key: 'onboarding', title: 'Onboarding Flow', status: 'wip' },
    { key: 'pricing', title: 'Pricing Page', status: 'pending' }
  ];
  
  return pages.map(page => {
    const desktopScreenshot = screenshots.find(s => s.includes(`${page.key}-desktop`));
    const mobileScreenshot = screenshots.find(s => s.includes(`${page.key}-mobile`));
    
    const statusBadge = {
      live: '<span class="status-badge status-live">LIVE</span>',
      wip: '<span class="status-badge status-wip">IN PROGRESS</span>',
      pending: '<span class="status-badge status-pending">PENDING</span>'
    }[page.status];
    
    if (!desktopScreenshot && !mobileScreenshot) return '';
    
    return `
      <div class="page-section">
        <h2 class="page-title">${page.title} ${statusBadge}</h2>
        <div class="screenshots-grid">
          ${desktopScreenshot ? `
            <div class="screenshot-container">
              <div class="screenshot-label">🖥️ Desktop View</div>
              <img src="${desktopScreenshot}" alt="${page.title} Desktop" class="screenshot">
            </div>
          ` : ''}
          ${mobileScreenshot ? `
            <div class="screenshot-container">
              <div class="screenshot-label">📱 Mobile View</div>
              <img src="${mobileScreenshot}" alt="${page.title} Mobile" class="screenshot">
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Run the visual testing
captureUIState().catch(console.error);