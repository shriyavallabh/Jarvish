# Visual Test Command

## Description
Quickly test the visual design and responsiveness of the current application state using Playwright.

## Usage
```
/visual-test [page-name] [viewport]
```

**Parameters:**
- `page-name` (optional): Specific page to test (default: current)
- `viewport` (optional): desktop|mobile|tablet|all (default: all)

## What it does
1. Launches Playwright browser
2. Navigates to specified page or current development server
3. Takes screenshots at different viewport sizes
4. Checks for console errors
5. Validates basic SEBI compliance elements
6. Provides quick visual feedback

## Examples
```bash
/visual-test dashboard mobile
/visual-test landing all
/visual-test content-generation desktop
```

## Implementation

```typescript
import { chromium } from 'playwright';

async function runVisualTest(pageName?: string, viewport?: string) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Define viewports
  const viewports = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  };
  
  const testViewports = viewport === 'all' 
    ? Object.keys(viewports) 
    : [viewport || 'desktop'];
  
  console.log(`🚀 Starting visual test for ${pageName || 'current page'}`);
  console.log(`📱 Testing viewports: ${testViewports.join(', ')}`);
  
  try {
    for (const vp of testViewports) {
      console.log(`\n📏 Testing ${vp} viewport (${viewports[vp].width}x${viewports[vp].height})`);
      
      await page.setViewportSize(viewports[vp]);
      
      // Navigate to page
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const targetUrl = pageName ? `${baseUrl}/${pageName}` : baseUrl;
      
      await page.goto(targetUrl, { waitUntil: 'networkidle' });
      
      // Take screenshot
      const screenshotPath = `./temp/visual-test-${pageName || 'home'}-${vp}-${Date.now()}.png`;
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      
      // Check for console errors
      const logs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });
      
      // Quick SEBI compliance check
      const hasDisclaimer = await page.locator('text=/mutual fund.*market risks/i').count() > 0;
      const hasEUIN = await page.locator('text=/EUIN/i').count() > 0;
      
      console.log(`✅ SEBI Disclaimer found: ${hasDisclaimer}`);
      console.log(`✅ EUIN reference found: ${hasEUIN}`);
      console.log(`🐛 Console errors: ${logs.length}`);
      
      if (logs.length > 0) {
        console.log('❌ Console Errors:', logs);
      }
    }
    
    console.log('\n🎉 Visual test completed successfully!');
    
  } catch (error) {
    console.error('❌ Visual test failed:', error);
  } finally {
    await browser.close();
  }
}

// Export for Claude Code to use
module.exports = { runVisualTest };
```

## Quick Checklist
The command will verify:
- [ ] Page loads without errors
- [ ] Responsive design works across viewports
- [ ] SEBI compliance disclaimers present
- [ ] No JavaScript console errors
- [ ] Screenshots captured for manual review

## Integration with Development Workflow
This command should be run:
- Before committing UI changes
- After updating components
- When testing new features
- Before deploying to staging/production

## Output
- Screenshots saved to `./temp/` directory
- Console log summary of findings
- Quick pass/fail for basic compliance checks