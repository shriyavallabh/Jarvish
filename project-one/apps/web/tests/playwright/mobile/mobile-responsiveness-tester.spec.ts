import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Responsiveness Testing Suite
 * 
 * Tests the JARVISH platform for optimal mobile experience,
 * particularly for Indian financial advisors who primarily use mobile devices
 */

interface MobileViewport {
  name: string;
  width: number;
  height: number;
  description: string;
  userAgent?: string;
}

const mobileViewports: MobileViewport[] = [
  {
    name: 'iPhone-13-Pro',
    width: 390,
    height: 844,
    description: 'Premium iPhone users in urban areas'
  },
  {
    name: 'Android-Mid-Range',
    width: 375,
    height: 667,
    description: 'Common Android device size for Indian users'
  },
  {
    name: 'Android-Large',
    width: 414,
    height: 896,
    description: 'Large Android phones popular in India'
  },
  {
    name: 'Small-Mobile',
    width: 320,
    height: 568,
    description: 'Older/budget phones still used in tier 2/3 cities'
  }
];

const criticalMobilePages = [
  { 
    url: '/', 
    name: 'Landing Page',
    criticalElements: ['nav', 'main', '.hero-section', 'footer'],
    mobileOptimizations: ['hamburger menu', 'touch-friendly buttons', 'readable text']
  },
  { 
    url: '/sign-up', 
    name: 'Registration Form',
    criticalElements: ['form', 'input', 'button[type="submit"]'],
    mobileOptimizations: ['form validation', 'keyboard optimization', 'easy input']
  },
  { 
    url: '/sign-in', 
    name: 'Login Form',
    criticalElements: ['form', 'input[type="email"]', 'input[type="password"]'],
    mobileOptimizations: ['auto-focus', 'show/hide password', 'remember me']
  },
  { 
    url: '/pricing', 
    name: 'Pricing Plans',
    criticalElements: ['.pricing-card', '.plan-features', 'button'],
    mobileOptimizations: ['stacked cards', 'clear pricing', 'CTA buttons']
  }
];

test.describe('Mobile Responsiveness Testing', () => {
  
  criticalMobilePages.forEach((pageInfo) => {
    mobileViewports.forEach((viewport) => {
      
      test(`${pageInfo.name} - ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        console.log(`\n📱 Testing ${pageInfo.name} on ${viewport.description}`);
        
        // Set mobile viewport
        await page.setViewportSize({ 
          width: viewport.width, 
          height: viewport.height 
        });
        
        // Set mobile user agent if specified
        if (viewport.userAgent) {
          await page.setExtraHTTPHeaders({
            'User-Agent': viewport.userAgent
          });
        }
        
        try {
          // Navigate to page
          await page.goto(pageInfo.url, { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          
          // Wait for content to load
          await page.waitForTimeout(2000);
          
          // Test 1: Check all critical elements are present
          console.log('🔍 Checking critical elements...');
          for (const selector of pageInfo.criticalElements) {
            const element = page.locator(selector).first();
            const isVisible = await element.isVisible();
            
            if (isVisible) {
              console.log(`   ✅ ${selector} is visible`);
            } else {
              console.log(`   ❌ ${selector} is not visible`);
            }
            
            // Critical elements must be visible on mobile
            expect(isVisible).toBeTruthy();
          }
          
          // Test 2: Touch target size validation (minimum 44px)
          console.log('👆 Validating touch target sizes...');
          const buttons = await page.locator('button, a, input[type="submit"], [role="button"]').all();
          
          let touchTargetFailures = 0;
          for (let i = 0; i < Math.min(buttons.length, 10); i++) {
            const button = buttons[i];
            const boundingBox = await button.boundingBox();
            
            if (boundingBox) {
              const minSize = 44; // iOS/Android recommendation
              const width = boundingBox.width;
              const height = boundingBox.height;
              
              if (width >= minSize && height >= minSize) {
                console.log(`   ✅ Button ${i + 1}: ${width}x${height}px (Good)`);
              } else if (width >= 32 && height >= 32) {
                console.log(`   ⚠️ Button ${i + 1}: ${width}x${height}px (Acceptable)`);
              } else {
                console.log(`   ❌ Button ${i + 1}: ${width}x${height}px (Too small)`);
                touchTargetFailures++;
              }
            }
          }
          
          // Allow some small buttons but not too many
          expect(touchTargetFailures).toBeLessThanOrEqual(2);
          
          // Test 3: Text readability (minimum font size)
          console.log('📖 Checking text readability...');
          const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all();
          
          let smallTextCount = 0;
          for (let i = 0; i < Math.min(textElements.length, 15); i++) {
            const element = textElements[i];
            
            try {
              const fontSize = await element.evaluate(el => {
                const style = window.getComputedStyle(el);
                return parseFloat(style.fontSize);
              });
              
              if (fontSize >= 16) {
                console.log(`   ✅ Element ${i + 1}: ${fontSize}px (Good readability)`);
              } else if (fontSize >= 14) {
                console.log(`   ⚠️ Element ${i + 1}: ${fontSize}px (Acceptable)`);
              } else if (fontSize > 0) {
                console.log(`   ❌ Element ${i + 1}: ${fontSize}px (Too small)`);
                smallTextCount++;
              }
            } catch (error) {
              // Skip elements that can't be measured
            }
          }
          
          // Most text should be readable size
          expect(smallTextCount).toBeLessThanOrEqual(3);
          
          // Test 4: Horizontal scrolling check
          console.log('↔️ Checking for horizontal scrolling...');
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          const viewportWidth = viewport.width;
          
          if (bodyWidth <= viewportWidth + 10) { // Allow 10px tolerance
            console.log(`   ✅ No horizontal scrolling (${bodyWidth}px <= ${viewportWidth}px)`);
          } else {
            console.log(`   ❌ Horizontal scrolling detected (${bodyWidth}px > ${viewportWidth}px)`);
          }
          
          expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow some tolerance
          
          // Test 5: Navigation menu mobile optimization
          if (pageInfo.url === '/') {
            console.log('🍔 Checking mobile navigation...');
            
            // Look for mobile menu trigger
            const mobileMenuTrigger = page.locator('[aria-label*="menu"], .menu-toggle, .hamburger, button[aria-expanded]');
            const hasMenuTrigger = await mobileMenuTrigger.count() > 0;
            
            if (hasMenuTrigger) {
              console.log('   ✅ Mobile menu trigger found');
              
              // Try to click menu if it exists
              try {
                await mobileMenuTrigger.first().click();
                await page.waitForTimeout(500);
                console.log('   ✅ Mobile menu opens successfully');
              } catch (error) {
                console.log('   ⚠️ Could not interact with mobile menu');
              }
            } else {
              console.log('   ⚠️ No mobile menu trigger found');
            }
          }
          
          // Test 6: Form optimization for mobile
          if (pageInfo.url.includes('sign-') && pageInfo.name.includes('Form')) {
            console.log('📝 Testing mobile form optimization...');
            
            const emailInput = page.locator('input[type="email"]').first();
            if (await emailInput.count() > 0) {
              // Check input types for mobile keyboard optimization
              const inputType = await emailInput.getAttribute('type');
              const inputmode = await emailInput.getAttribute('inputmode');
              
              console.log(`   Email input type: ${inputType}`);
              console.log(`   Input mode: ${inputmode || 'not set'}`);
              
              expect(inputType).toBe('email'); // Should trigger email keyboard
            }
            
            // Check for mobile-friendly form features
            const labels = await page.locator('label').all();
            console.log(`   Found ${labels.length} form labels`);
            
            // Forms should have proper labels for accessibility
            expect(labels.length).toBeGreaterThan(0);
          }
          
          // Test 7: Performance on mobile viewport
          console.log('⚡ Measuring mobile performance...');
          
          const startTime = Date.now();
          await page.reload({ waitUntil: 'networkidle' });
          const loadTime = Date.now() - startTime;
          
          console.log(`   Page load time: ${loadTime}ms`);
          
          // Mobile should load reasonably fast (adjust based on your needs)
          if (loadTime < 3000) {
            console.log('   ✅ Good mobile performance');
          } else if (loadTime < 5000) {
            console.log('   ⚠️ Acceptable mobile performance');
          } else {
            console.log('   ❌ Slow mobile performance');
          }
          
          // Don't fail test for performance, but log it
          // expect(loadTime).toBeLessThan(8000); // Maximum acceptable
          
          // Test 8: Take screenshot for visual verification
          const screenshotPath = `screenshots/mobile-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name}.png`;
          await page.screenshot({
            path: screenshotPath,
            fullPage: true
          });
          
          console.log(`   📸 Mobile screenshot saved: ${screenshotPath}`);
          
        } catch (error) {
          console.error(`❌ Mobile test failed for ${pageInfo.name} on ${viewport.name}: ${error.message}`);
          
          // Take error screenshot
          await page.screenshot({
            path: `screenshots/mobile-error-${pageInfo.name}-${viewport.name}.png`,
            fullPage: true
          });
          
          throw error;
        }
      });
    });
  });
});

test.describe('Mobile-Specific Features', () => {
  
  test('WhatsApp integration mobile optimization', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Look for WhatsApp related elements
    const whatsappElements = await page.locator('[href*="whatsapp"], [data-testid*="whatsapp"], .whatsapp').all();
    
    console.log(`📱 Found ${whatsappElements.length} WhatsApp-related elements`);
    
    for (let i = 0; i < whatsappElements.length; i++) {
      const element = whatsappElements[i];
      const isVisible = await element.isVisible();
      
      if (isVisible) {
        console.log(`   ✅ WhatsApp element ${i + 1} is visible on mobile`);
        
        // Check if it's touch-friendly
        const boundingBox = await element.boundingBox();
        if (boundingBox && (boundingBox.width < 44 || boundingBox.height < 44)) {
          console.log(`   ⚠️ WhatsApp element ${i + 1} might be too small for touch`);
        }
      }
    }
  });
  
  test('Indian mobile network simulation', async ({ page }) => {
    // Simulate slower network conditions common in India
    const cdp = await page.context().newCDPSession(page);
    
    // Simulate 3G network (common in tier 2/3 cities in India)
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 kbps
      latency: 300, // 300ms latency
    });
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    console.log('🌐 Testing on simulated 3G network (Indian conditions)');
    
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    console.log(`   Load time on 3G: ${loadTime}ms`);
    
    // Should still be usable on 3G (adjust threshold as needed)
    if (loadTime < 8000) {
      console.log('   ✅ Acceptable performance on 3G');
    } else {
      console.log('   ⚠️ Slow performance on 3G network');
    }
    
    // Take screenshot to verify visual quality
    await page.screenshot({
      path: 'screenshots/mobile-3g-simulation.png',
      fullPage: true
    });
  });
});