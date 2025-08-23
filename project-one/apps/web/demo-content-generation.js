const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function demoContentGeneration() {
  console.log('🤖 Starting Jarvish Content Generation Demo...\n');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'test-results', 'content-generation-demo');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    // Navigate to the landing page first
    console.log('📱 Navigating to Landing Page...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // Check if we have content generation features available
    console.log('🔍 Checking for Content Generation Features...');
    
    // Look for any content generation buttons or links
    const contentButtons = await page.$$('[data-testid*="content"], [aria-label*="content"], button:has-text("Generate"), button:has-text("Create"), a:has-text("Content")');
    console.log(`  → Found ${contentButtons.length} potential content-related elements`);
    
    if (contentButtons.length > 0) {
      console.log('  ✅ Content generation UI elements detected');
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'content-features-available.png'),
        fullPage: true 
      });
    }

    // Test the API directly
    console.log('\n🚀 Testing Content Generation API...');
    
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/ai/generate-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            advisorId: 'demo-advisor',
            contentType: 'educational',
            language: 'en',
            customization: {
              tone: 'professional',
              specialization: 'mutual_funds'
            }
          })
        });
        
        const data = await response.json();
        return {
          status: response.status,
          data: data
        };
      } catch (error) {
        return {
          status: 'error',
          error: error.message
        };
      }
    });

    console.log(`  → API Response Status: ${apiResponse.status}`);
    if (apiResponse.data) {
      console.log(`  → Content Generated: ${apiResponse.data.content?.substring(0, 100)}...`);
      console.log(`  → Compliance Score: ${apiResponse.data.complianceScore || 'N/A'}`);
      console.log(`  → SEBI Compliant: ${apiResponse.data.isCompliant ? '✅' : '❌'}`);
      console.log(`  → Language: ${apiResponse.data.language || 'N/A'}`);
    }

    // Test SEBI compliance features
    console.log('\n🏛️ Testing SEBI Compliance...');
    const sebiFeatures = await page.evaluate(() => {
      const text = document.body.textContent.toLowerCase();
      return {
        hasRiskWarning: text.includes('mutual fund investments are subject to market risks'),
        hasEUIN: text.includes('euin'),
        hasDisclaimer: text.includes('disclaimer'),
        hasSEBI: text.includes('sebi')
      };
    });

    console.log(`  → Risk Warning: ${sebiFeatures.hasRiskWarning ? '✅' : '❌'}`);
    console.log(`  → EUIN Display: ${sebiFeatures.hasEUIN ? '✅' : '❌'}`);
    console.log(`  → Disclaimers: ${sebiFeatures.hasDisclaimer ? '✅' : '❌'}`);
    console.log(`  → SEBI References: ${sebiFeatures.hasSEBI ? '✅' : '❌'}`);

    // Performance check
    console.log('\n⚡ Performance Metrics:');
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domLoad: timing.domContentLoadedEventEnd - timing.navigationStart,
        pageLoad: timing.loadEventEnd - timing.navigationStart,
      };
    });
    console.log(`  → DOM Load: ${metrics.domLoad}ms`);
    console.log(`  → Page Load: ${metrics.pageLoad}ms`);

    // Take final screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'content-generation-demo.png'),
      fullPage: true 
    });

    console.log(`\n✅ Demo complete! Screenshots saved to: ${screenshotsDir}`);
    console.log('\n📊 Content Generation Status:');
    console.log(`  - API Endpoint: ${apiResponse.status === 200 ? 'Working ✅' : `Status ${apiResponse.status} ❌`}`);
    console.log(`  - SEBI Compliance: ${sebiFeatures.hasRiskWarning ? 'Working ✅' : 'Needs Implementation ❌'}`);
    console.log(`  - Performance: ${metrics.pageLoad < 3000 ? 'Excellent ✅' : 'Needs Optimization ❌'}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('  - Fix API integration issues in tests');
    console.log('  - Add content generation UI to advisor dashboard');
    console.log('  - Implement multi-language support');
    console.log('  - Add content preview functionality');

  } catch (error) {
    console.error('❌ Error during demo:', error.message);
  } finally {
    await browser.close();
  }
}

demoContentGeneration().catch(console.error);