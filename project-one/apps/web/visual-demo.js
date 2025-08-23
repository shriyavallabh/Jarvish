const { chromium } = require('playwright');

async function captureJarvishScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('📸 Starting JARVISH Platform Visual Testing...\n');

  // 1. Landing Page
  console.log('1️⃣ Testing Landing Page...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ 
    path: 'screenshots/jarvish-landing.png', 
    fullPage: true 
  });
  console.log('   ✅ Landing page captured');

  // 2. Admin Dashboard
  console.log('\n2️⃣ Testing Admin Dashboard...');
  await page.goto('http://localhost:3000/admin/dashboard');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ 
    path: 'screenshots/jarvish-admin-dashboard.png', 
    fullPage: true 
  });
  console.log('   ✅ Admin dashboard captured');

  // 3. Advisor Dashboard
  console.log('\n3️⃣ Testing Advisor Dashboard...');
  await page.goto('http://localhost:3000/advisor/dashboard');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ 
    path: 'screenshots/jarvish-advisor-dashboard.png', 
    fullPage: true 
  });
  console.log('   ✅ Advisor dashboard captured');

  // 4. Mobile Responsiveness - Landing
  console.log('\n4️⃣ Testing Mobile Responsiveness...');
  await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ 
    path: 'screenshots/jarvish-mobile-landing.png', 
    fullPage: true 
  });
  console.log('   ✅ Mobile view captured');

  // 5. SEBI Compliance Check
  console.log('\n5️⃣ Checking SEBI Compliance Elements...');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000');
  
  // Check for mandatory disclaimers
  const disclaimers = await page.$$('text=/disclaimer|risk|sebi|compliance/i');
  console.log(`   ℹ️ Found ${disclaimers.length} compliance-related text elements`);

  // 6. Performance Metrics
  console.log('\n6️⃣ Measuring Performance Metrics...');
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    };
  });
  
  console.log('   📊 Performance Results:');
  console.log(`      • DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
  console.log(`      • Page Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
  console.log(`      • First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);

  // 7. Test Onboarding Flow
  console.log('\n7️⃣ Testing Onboarding Flow...');
  await page.goto('http://localhost:3000/onboarding');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ 
    path: 'screenshots/jarvish-onboarding.png', 
    fullPage: true 
  });
  console.log('   ✅ Onboarding page captured');

  await browser.close();
  
  console.log('\n✨ Visual Testing Complete!');
  console.log('📁 Screenshots saved to screenshots/ directory');
  
  return {
    screenshots: [
      'screenshots/jarvish-landing.png',
      'screenshots/jarvish-admin-dashboard.png',
      'screenshots/jarvish-advisor-dashboard.png',
      'screenshots/jarvish-mobile-landing.png',
      'screenshots/jarvish-onboarding.png'
    ],
    performance: metrics,
    complianceElements: disclaimers.length
  };
}

// Execute the test
captureJarvishScreenshots().catch(console.error);