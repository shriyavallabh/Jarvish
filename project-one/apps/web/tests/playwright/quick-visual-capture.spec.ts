import { test, expect } from '@playwright/test';

/**
 * Quick Visual Capture for JARVISH Platform
 * 
 * Focused on capturing screenshots of accessible pages
 */

const accessiblePages = [
  { name: 'landing-page', url: '/', description: 'Main landing page' },
  { name: 'pricing', url: '/pricing', description: 'Pricing page' }
];

const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'mobile', width: 375, height: 667 }
];

test.describe('Quick Visual Capture', () => {
  
  accessiblePages.forEach((pageInfo) => {
    viewports.forEach((viewport) => {
      
      test(`Capture ${pageInfo.name} - ${viewport.name}`, async ({ page }) => {
        console.log(`📸 Capturing ${pageInfo.description} on ${viewport.name}`);
        
        // Set viewport
        await page.setViewportSize({ 
          width: viewport.width, 
          height: viewport.height 
        });
        
        try {
          // Navigate with shorter timeout
          await page.goto(pageInfo.url, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
          });
          
          // Wait for basic content
          await page.waitForTimeout(3000);
          
          // Take screenshot
          const screenshotPath = `screenshots/${pageInfo.name}-${viewport.name}.png`;
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            animations: 'disabled'
          });
          
          console.log(`✅ Screenshot saved: ${screenshotPath}`);
          
          // Basic validation
          const title = await page.title();
          expect(title).toBeTruthy();
          expect(title).not.toContain('404');
          
          console.log(`   Title: "${title}"`);
          
        } catch (error) {
          console.error(`❌ Failed to capture ${pageInfo.name}: ${error.message}`);
          throw error;
        }
      });
    });
  });
});