const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Color codes from HTML designs
const EXPECTED_COLORS = {
  landing: {
    navy: '#0B1F33',
    gold: '#CEA200',
    cta: '#0C310C'
  },
  admin: {
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#d4af37'
  },
  advisor: {
    primary: '#0f172a',
    gold: '#fbbf24'
  }
};

async function testUIImplementation() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });
  
  const page = await browser.newPage();
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  console.log('🎭 Starting UI Implementation Tests...\n');

  // Test 1: Landing Page
  console.log('📋 Testing Landing Page...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    // Check for Executive Clarity theme elements
    const landingChecks = await page.evaluate(() => {
      const results = {};
      
      // Check for Jarvish branding
      const brand = document.querySelector('h1, .logo-executive, [class*="brand"]');
      results.hasBrand = brand && brand.textContent.includes('Jarvish');
      
      // Check for SEBI badge
      const sebiBadge = Array.from(document.querySelectorAll('span, div')).find(el => 
        el.textContent.toLowerCase().includes('sebi')
      );
      results.hasSebiBadge = !!sebiBadge;
      
      // Check for pricing
      const pricing = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent.includes('999') || el.textContent.includes('2,499') || el.textContent.includes('4,999')
      );
      results.hasPricing = !!pricing;
      
      // Check fonts
      const styles = window.getComputedStyle(document.body);
      results.fontFamily = styles.fontFamily;
      
      return results;
    });
    
    results.tests.push({
      page: 'Landing',
      url: 'http://localhost:3000',
      checks: landingChecks,
      status: landingChecks.hasBrand && landingChecks.hasSebiBadge ? 'PASS' : 'PARTIAL'
    });
    
    console.log('✅ Landing Page:', landingChecks.hasBrand ? 'Brand found' : '❌ Brand missing');
    console.log('✅ SEBI Badge:', landingChecks.hasSebiBadge ? 'Found' : '❌ Missing');
    console.log('✅ Pricing:', landingChecks.hasPricing ? 'Found' : '❌ Missing');
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/landing-test.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Landing page test failed:', error.message);
    results.tests.push({
      page: 'Landing',
      error: error.message,
      status: 'FAIL'
    });
  }

  // Test 2: Admin Dashboard
  console.log('\n📋 Testing Admin Dashboard...');
  try {
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    const adminChecks = await page.evaluate(() => {
      const results = {};
      
      // Check for Elite Admin branding
      const eliteAdmin = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent.includes('Elite Admin')
      );
      results.hasEliteAdmin = !!eliteAdmin;
      
      // Check for sidebar
      const sidebar = document.querySelector('aside, [class*="sidebar"]');
      results.hasSidebar = !!sidebar;
      
      // Check for premium elements
      const premium = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent.toLowerCase().includes('premium')
      );
      results.hasPremium = !!premium;
      
      // Check for stats cards
      const statsCards = document.querySelectorAll('[class*="stat"], [class*="card"]');
      results.hasStats = statsCards.length > 0;
      
      // Check for table
      const table = document.querySelector('table');
      results.hasTable = !!table;
      
      // Check background colors
      if (sidebar) {
        const sidebarStyles = window.getComputedStyle(sidebar);
        results.sidebarBg = sidebarStyles.backgroundColor;
      }
      
      return results;
    });
    
    results.tests.push({
      page: 'Admin Dashboard',
      url: 'http://localhost:3000/admin',
      checks: adminChecks,
      status: adminChecks.hasEliteAdmin && adminChecks.hasSidebar ? 'PASS' : 'PARTIAL'
    });
    
    console.log('✅ Elite Admin:', adminChecks.hasEliteAdmin ? 'Found' : '❌ Missing');
    console.log('✅ Sidebar:', adminChecks.hasSidebar ? 'Found' : '❌ Missing');
    console.log('✅ Premium Theme:', adminChecks.hasPremium ? 'Found' : '❌ Missing');
    console.log('✅ Stats Cards:', adminChecks.hasStats ? 'Found' : '❌ Missing');
    console.log('✅ Data Table:', adminChecks.hasTable ? 'Found' : '❌ Missing');
    
    await page.screenshot({ path: 'screenshots/admin-test.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Admin dashboard test failed:', error.message);
    results.tests.push({
      page: 'Admin Dashboard',
      error: error.message,
      status: 'FAIL'
    });
  }

  // Test 3: Advisor Dashboard
  console.log('\n📋 Testing Advisor Dashboard...');
  try {
    await page.goto('http://localhost:3000/advisor/dashboard', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    const advisorChecks = await page.evaluate(() => {
      const results = {};
      
      // Check for Jarvish Advisor branding
      const jarvishAdvisor = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent.includes('Jarvish')
      );
      results.hasJarvish = !!jarvishAdvisor;
      
      // Check for content generation elements
      const contentArea = document.querySelector('textarea, [class*="content"], [class*="editor"]');
      results.hasContentArea = !!contentArea;
      
      // Check for WhatsApp elements
      const whatsapp = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent.toLowerCase().includes('whatsapp')
      );
      results.hasWhatsApp = !!whatsapp;
      
      // Check for compliance elements
      const compliance = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent.toLowerCase().includes('compliance') || 
        el.textContent.toLowerCase().includes('sebi')
      );
      results.hasCompliance = !!compliance;
      
      // Check header
      const header = document.querySelector('header');
      if (header) {
        const headerStyles = window.getComputedStyle(header);
        results.headerBg = headerStyles.backgroundColor;
      }
      
      return results;
    });
    
    results.tests.push({
      page: 'Advisor Dashboard',
      url: 'http://localhost:3000/advisor/dashboard',
      checks: advisorChecks,
      status: advisorChecks.hasJarvish ? 'PASS' : 'PARTIAL'
    });
    
    console.log('✅ Jarvish Branding:', advisorChecks.hasJarvish ? 'Found' : '❌ Missing');
    console.log('✅ Content Area:', advisorChecks.hasContentArea ? 'Found' : '❌ Missing');
    console.log('✅ WhatsApp Integration:', advisorChecks.hasWhatsApp ? 'Found' : '❌ Missing');
    console.log('✅ Compliance Check:', advisorChecks.hasCompliance ? 'Found' : '❌ Missing');
    
    await page.screenshot({ path: 'screenshots/advisor-test.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Advisor dashboard test failed:', error.message);
    results.tests.push({
      page: 'Advisor Dashboard',
      error: error.message,
      status: 'FAIL'
    });
  }

  // Generate Report
  console.log('\n📊 Generating Test Report...\n');
  
  const summary = {
    total: results.tests.length,
    passed: results.tests.filter(t => t.status === 'PASS').length,
    partial: results.tests.filter(t => t.status === 'PARTIAL').length,
    failed: results.tests.filter(t => t.status === 'FAIL').length
  };
  
  console.log('========================================');
  console.log('📈 UI IMPLEMENTATION TEST RESULTS');
  console.log('========================================');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`⚠️  Partial: ${summary.partial}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log('========================================');
  
  // Save results to JSON
  await fs.writeFile(
    'test-results.json',
    JSON.stringify(results, null, 2)
  );
  
  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>UI Implementation Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #0B1F33;
      border-bottom: 3px solid #CEA200;
      padding-bottom: 10px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    .test-result {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .pass { color: #22c55e; }
    .partial { color: #f59e0b; }
    .fail { color: #ef4444; }
    .screenshot {
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    .screenshot img {
      width: 100%;
      display: block;
    }
  </style>
</head>
<body>
  <h1>🎭 UI Implementation Test Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <div class="stat">
      <div class="stat-value">${summary.total}</div>
      <div class="stat-label">Total Tests</div>
    </div>
    <div class="stat">
      <div class="stat-value pass">${summary.passed}</div>
      <div class="stat-label">Passed</div>
    </div>
    <div class="stat">
      <div class="stat-value partial">${summary.partial}</div>
      <div class="stat-label">Partial</div>
    </div>
    <div class="stat">
      <div class="stat-value fail">${summary.failed}</div>
      <div class="stat-label">Failed</div>
    </div>
  </div>
  
  ${results.tests.map(test => `
    <div class="test-result">
      <h2>${test.page}</h2>
      <p><strong>URL:</strong> ${test.url || 'N/A'}</p>
      <p><strong>Status:</strong> <span class="${test.status.toLowerCase()}">${test.status}</span></p>
      ${test.checks ? `
        <h3>Checks:</h3>
        <ul>
          ${Object.entries(test.checks).map(([key, value]) => 
            `<li>${key}: ${value}</li>`
          ).join('')}
        </ul>
      ` : ''}
      ${test.error ? `<p class="fail">Error: ${test.error}</p>` : ''}
    </div>
  `).join('')}
  
  <h2>Screenshots</h2>
  <p>Check the screenshots folder for visual verification:</p>
  <ul>
    <li>screenshots/landing-test.png</li>
    <li>screenshots/admin-test.png</li>
    <li>screenshots/advisor-test.png</li>
  </ul>
</body>
</html>
  `;
  
  await fs.writeFile('test-report.html', htmlReport);
  console.log('\n✅ Test report saved to test-report.html');
  console.log('✅ Screenshots saved to screenshots folder');
  
  await browser.close();
}

// Run tests
testUIImplementation().catch(console.error);