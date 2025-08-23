import { test, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * JARVISH Visual Testing Engine
 * 
 * Captures comprehensive screenshots across multiple viewports and validates
 * the visual design of the JARVISH financial advisory platform
 */

interface TestPage {
  name: string;
  url: string;
  waitForSelector?: string;
  description: string;
  criticalElements: string[];
}

const testPages: TestPage[] = [
  {
    name: 'landing-page',
    url: '/',
    description: 'Main landing page with value proposition for Indian financial advisors',
    criticalElements: ['nav', 'main', '[data-testid="hero-section"]', 'footer'],
    waitForSelector: 'main'
  },
  {
    name: 'sign-up',
    url: '/sign-up',
    description: 'Registration form for new advisors with SEBI compliance',
    criticalElements: ['form', '[data-testid="registration-form"]', 'input[type="email"]'],
    waitForSelector: 'form'
  },
  {
    name: 'sign-in',
    url: '/sign-in',
    description: 'Login page for existing advisors',
    criticalElements: ['form', 'input[type="email"]', 'input[type="password"]'],
    waitForSelector: 'form'
  },
  {
    name: 'onboarding',
    url: '/onboarding',
    description: 'Onboarding flow for new advisors',
    criticalElements: ['main', '[data-testid="onboarding-form"]'],
    waitForSelector: 'main'
  },
  {
    name: 'analytics-demo',
    url: '/analytics-demo',
    description: 'Analytics dashboard showcasing platform capabilities',
    criticalElements: ['[data-testid="analytics-dashboard"]', '.chart-container'],
    waitForSelector: '[data-testid="analytics-dashboard"]'
  },
  {
    name: 'pricing',
    url: '/pricing',
    description: 'Pricing plans tailored for Indian financial advisors',
    criticalElements: ['[data-testid="pricing-cards"]', '.pricing-plan'],
    waitForSelector: 'main'
  },
  {
    name: 'advisor-dashboard',
    url: '/advisor/dashboard',
    description: 'Main dashboard for financial advisors (may require auth)',
    criticalElements: ['nav', 'main', '[data-testid="dashboard-content"]'],
    waitForSelector: 'main'
  },
  {
    name: 'admin-dashboard',
    url: '/admin',
    description: 'Admin panel for platform management (may require auth)',
    criticalElements: ['nav', 'main', '[data-testid="admin-panel"]'],
    waitForSelector: 'main'
  }
];

const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 }
];

test.describe('JARVISH Visual Testing Engine', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up error monitoring
    const errors: string[] = [];
    page.on('pageerror', exception => {
      errors.push(exception.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });

    // Store errors for later validation
    (page as any).errors = errors;
  });

  testPages.forEach((testPageInfo) => {
    viewports.forEach((viewport) => {
      
      test(`${testPageInfo.name} - ${viewport.name} screenshot`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize({ 
          width: viewport.width, 
          height: viewport.height 
        });

        try {
          console.log(`📸 Testing ${testPageInfo.name} on ${viewport.name} (${viewport.width}x${viewport.height})`);
          
          // Navigate to page
          await page.goto(testPageInfo.url, { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });

          // Wait for critical element if specified
          if (testPageInfo.waitForSelector) {
            try {
              await page.waitForSelector(testPageInfo.waitForSelector, { 
                timeout: 10000 
              });
            } catch (error) {
              console.log(`⚠️ Could not find ${testPageInfo.waitForSelector} on ${testPageInfo.name}`);
            }
          }

          // Wait for any animations to complete
          await page.waitForTimeout(2000);

          // Validate critical elements exist
          for (const element of testPageInfo.criticalElements) {
            const elementExists = await page.locator(element).count() > 0;
            if (elementExists) {
              console.log(`✅ Found critical element: ${element}`);
            } else {
              console.log(`⚠️ Missing critical element: ${element}`);
            }
          }

          // Check for console errors
          const pageErrors = (page as any).errors || [];
          if (pageErrors.length > 0) {
            console.log(`❌ Console errors detected on ${testPageInfo.name}:`);
            pageErrors.forEach((error: string) => console.log(`   - ${error}`));
          } else {
            console.log(`✅ No console errors on ${testPageInfo.name}`);
          }

          // Take full page screenshot
          const screenshotPath = `screenshots/${testPageInfo.name}-${viewport.name}.png`;
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            animations: 'disabled'
          });

          console.log(`✅ Screenshot saved: ${screenshotPath}`);

          // Validate page loaded successfully (not error page)
          const pageTitle = await page.title();
          expect(pageTitle).not.toContain('404');
          expect(pageTitle).not.toContain('Error');

          // Check for JARVISH/financial advisory content
          const pageContent = await page.content();
          const hasFinancialContent = 
            pageContent.toLowerCase().includes('advisor') ||
            pageContent.toLowerCase().includes('jarvish') ||
            pageContent.toLowerCase().includes('financial') ||
            pageContent.toLowerCase().includes('sebi') ||
            pageContent.toLowerCase().includes('mfd');

          if (hasFinancialContent) {
            console.log(`✅ Financial advisory content found on ${testPageInfo.name}`);
          } else {
            console.log(`⚠️ No financial advisory content detected on ${testPageInfo.name}`);
          }

        } catch (error) {
          console.error(`❌ Error testing ${testPageInfo.name} on ${viewport.name}: ${error.message}`);
          
          // Still try to take a screenshot for debugging
          try {
            await page.screenshot({
              path: `screenshots/error-${testPageInfo.name}-${viewport.name}.png`,
              fullPage: true
            });
          } catch (screenshotError) {
            console.error(`Failed to take error screenshot: ${screenshotError.message}`);
          }
          
          throw error;
        }
      });
    });
  });
});

/**
 * Additional visual validation tests
 */
test.describe('Visual Design Validation', () => {
  
  test('Professional color scheme validation', async ({ page }) => {
    await page.goto('/');
    
    // Check for professional financial services colors
    const styles = await page.evaluate(() => {
      const computedStyle = window.getComputedStyle(document.body);
      return {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color
      };
    });
    
    console.log('🎨 Body styles:', styles);
    
    // Validate professional appearance - no bright/unprofessional colors
    const bodyBg = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    console.log(`🎨 Body background color: ${bodyBg}`);
    
    // Should not be bright colors that are unprofessional for financial services
    expect(bodyBg).not.toContain('255, 0, 0'); // No bright red
    expect(bodyBg).not.toContain('0, 255, 0'); // No bright green
    expect(bodyBg).not.toContain('255, 255, 0'); // No yellow
  });

  test('Typography and readability validation', async ({ page }) => {
    await page.goto('/');
    
    // Check font sizes are readable
    const headingSize = await page.locator('h1').first().evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    console.log(`📝 Main heading font size: ${headingSize}`);
    
    // Heading should be at least 24px for good readability
    const sizeValue = parseInt(headingSize.replace('px', ''));
    expect(sizeValue).toBeGreaterThanOrEqual(24);
  });
});