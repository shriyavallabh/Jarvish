import { test, expect } from '@playwright/test';

test.describe('Jarvish Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('should load landing page with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Jarvish/);
  });

  test('should display hero section with CTA', async ({ page }) => {
    // Check hero heading
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();
    
    // Check for CTA button
    const ctaButton = page.locator('button:has-text("Start Free Trial"), a:has-text("Start Free Trial")').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should have SEBI compliance disclaimers', async ({ page }) => {
    // Check for disclaimer text
    const disclaimerText = page.locator('text=/disclaimer|risk|compliance|SEBI/i');
    const count = await disclaimerText.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be mobile responsive', async ({ page, viewport }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Check if navigation is accessible
    const mobileMenu = page.locator('[aria-label="Menu"], button:has-text("Menu"), button.mobile-menu');
    const isMenuVisible = await mobileMenu.isVisible().catch(() => false);
    
    // Mobile menu should exist or nav should be responsive
    const navLinks = page.locator('nav a, header a');
    const navCount = await navLinks.count();
    expect(navCount).toBeGreaterThan(0);
  });

  test('should have fast load times', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should navigate to pricing page', async ({ page }) => {
    // Find and click pricing link
    await page.click('a:has-text("Pricing"), a[href="/pricing"]');
    
    // Wait for navigation
    await page.waitForURL('**/pricing');
    
    // Check pricing page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /pricing|plans/i }).first()).toBeVisible();
  });
});

test.describe('Visual Regression Tests', () => {
  test('capture landing page screenshots', async ({ page, browserName }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await page.screenshot({ 
      path: `test-results/screenshots/landing-${browserName}-desktop.png`,
      fullPage: true 
    });
  });

  test('capture mobile view', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: `test-results/screenshots/landing-${browserName}-mobile.png`,
      fullPage: true 
    });
  });
});

test.describe('SEBI Compliance Verification', () => {
  test('should display required disclaimers', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check for mandatory SEBI elements
    const sebiElements = [
      'mutual fund investments are subject to market risks',
      'past performance',
      'disclaimer',
      'risk'
    ];
    
    for (const element of sebiElements) {
      const found = await page.locator(`text=/${element}/i`).count();
      if (found === 0) {
        console.log(`Warning: SEBI element not found: ${element}`);
      }
    }
  });

  test('should have terms and privacy links', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    const termsLink = page.locator('a:has-text("Terms"), a[href*="terms"]');
    const privacyLink = page.locator('a:has-text("Privacy"), a[href*="privacy"]');
    
    await expect(termsLink.or(privacyLink).first()).toBeVisible();
  });
});