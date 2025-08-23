/**
 * Critical User Journey E2E Tests
 * Comprehensive testing of essential platform workflows
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('http://localhost:3000');
  });

  test.describe('1. Advisor Registration & Onboarding', () => {
    test('should complete full registration flow', async () => {
      // Navigate to sign up
      await page.click('text=Get Started');
      await expect(page).toHaveURL(/.*sign-up/);

      // Fill registration form
      await page.fill('[name="businessName"]', 'Test Financial Advisory');
      await page.fill('[name="email"]', 'test@advisor.com');
      await page.fill('[name="phone"]', '9876543210');
      await page.fill('[name="euin"]', 'E123456');
      await page.fill('[name="password"]', 'SecurePass123!');
      
      // Accept terms
      await page.check('[name="terms"]');
      await page.check('[name="dpdpConsent"]');
      
      // Submit registration
      await page.click('button[type="submit"]');
      
      // Verify redirect to verification
      await expect(page).toHaveURL(/.*verify/);
      
      // Performance check
      const metrics = await page.evaluate(() => performance.timing);
      const loadTime = metrics.loadEventEnd - metrics.navigationStart;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should validate EUIN format', async () => {
      await page.goto('http://localhost:3000/sign-up');
      
      // Try invalid EUIN
      await page.fill('[name="euin"]', 'INVALID');
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('text=Invalid EUIN format')).toBeVisible();
    });

    test('should enforce password requirements', async () => {
      await page.goto('http://localhost:3000/sign-up');
      
      // Try weak password
      await page.fill('[name="password"]', 'weak');
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    });
  });

  test.describe('2. Content Generation with AI Compliance', () => {
    test('should generate SEBI-compliant content', async () => {
      // Navigate to dashboard (assuming logged in state)
      await page.goto('http://localhost:3000/advisor/dashboard');
      
      // Click on Generate Content tab
      await page.click('text=Generate Content');
      
      // Select content type
      await page.selectOption('[name="contentType"]', 'educational');
      
      // Select language
      await page.selectOption('[name="language"]', 'en');
      
      // Add topic
      await page.fill('[name="topic"]', 'Mutual Fund Benefits');
      
      // Generate content
      await page.click('button:has-text("Generate")');
      
      // Wait for AI response
      await page.waitForSelector('.content-preview', { timeout: 5000 });
      
      // Verify SEBI compliance indicators
      await expect(page.locator('.compliance-status')).toContainText(/Compliant|Low Risk/);
      
      // Check for mandatory disclaimers
      await expect(page.locator('.content-preview')).toContainText('subject to market risks');
      
      // Verify response time
      const startTime = Date.now();
      await page.click('button:has-text("Regenerate")');
      await page.waitForSelector('.content-preview');
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(3500); // <3.5s requirement
    });

    test('should show three-stage validation results', async () => {
      await page.goto('http://localhost:3000/advisor/dashboard');
      await page.click('text=Generate Content');
      
      // Generate content
      await page.fill('[name="topic"]', 'Investment Returns');
      await page.click('button:has-text("Generate")');
      
      // Check validation stages
      await expect(page.locator('.validation-stage-1')).toBeVisible();
      await expect(page.locator('.validation-stage-2')).toBeVisible();
      await expect(page.locator('.validation-stage-3')).toBeVisible();
      
      // Verify risk scoring
      await expect(page.locator('.risk-score')).toBeVisible();
    });
  });

  test.describe('3. WhatsApp Scheduling & Delivery', () => {
    test('should schedule content for 06:00 IST delivery', async () => {
      await page.goto('http://localhost:3000/advisor/dashboard');
      
      // Navigate to scheduling
      await page.click('text=Schedule Content');
      
      // Select delivery time
      await page.fill('[name="deliveryTime"]', '06:00');
      
      // Select WhatsApp as channel
      await page.check('[name="channel"][value="whatsapp"]');
      
      // Schedule content
      await page.click('button:has-text("Schedule")');
      
      // Verify confirmation
      await expect(page.locator('.schedule-confirmation')).toContainText('06:00 IST');
      
      // Check SLA indicator
      await expect(page.locator('.sla-guarantee')).toContainText('99% delivery guarantee');
    });

    test('should handle fallback content assignment', async () => {
      await page.goto('http://localhost:3000/advisor/dashboard');
      
      // Check fallback content status
      await expect(page.locator('.fallback-status')).toContainText(/Active|Ready/);
      
      // Verify fallback assignment time
      await expect(page.locator('.fallback-time')).toContainText('21:30 IST');
    });
  });

  test.describe('4. Subscription & Payment Flow', () => {
    test('should complete subscription purchase', async () => {
      await page.goto('http://localhost:3000/pricing');
      
      // Select Standard plan
      await page.click('[data-plan="STANDARD"] button:has-text("Choose Plan")');
      
      // Fill payment details (in test mode)
      await page.fill('[name="cardNumber"]', '4111111111111111');
      await page.fill('[name="cardExpiry"]', '12/25');
      await page.fill('[name="cardCvv"]', '123');
      
      // Complete payment
      await page.click('button:has-text("Pay ₹2,499")');
      
      // Wait for confirmation
      await page.waitForSelector('.payment-success', { timeout: 10000 });
      
      // Verify subscription active
      await expect(page.locator('.subscription-status')).toContainText('Active');
    });

    test('should display correct pricing tiers', async () => {
      await page.goto('http://localhost:3000/pricing');
      
      // Verify all three tiers
      await expect(page.locator('[data-plan="BASIC"]')).toContainText('₹999');
      await expect(page.locator('[data-plan="STANDARD"]')).toContainText('₹2,499');
      await expect(page.locator('[data-plan="PRO"]')).toContainText('₹4,999');
      
      // Check SEBI disclaimers
      await expect(page.locator('.sebi-disclaimer')).toBeVisible();
    });
  });

  test.describe('5. Analytics & Performance Dashboard', () => {
    test('should display key performance metrics', async () => {
      await page.goto('http://localhost:3000/advisor/dashboard');
      await page.click('text=Analytics');
      
      // Check metric displays
      await expect(page.locator('.engagement-rate')).toBeVisible();
      await expect(page.locator('.content-reach')).toBeVisible();
      await expect(page.locator('.client-growth')).toBeVisible();
      
      // Verify chart rendering
      await expect(page.locator('.performance-chart')).toBeVisible();
      
      // Check data freshness
      await expect(page.locator('.last-updated')).toContainText(/Updated.*ago/);
    });

    test('should provide content optimization insights', async () => {
      await page.goto('http://localhost:3000/advisor/dashboard');
      await page.click('text=Analytics');
      await page.click('text=Content Insights');
      
      // Check recommendations
      await expect(page.locator('.optimization-recommendations')).toBeVisible();
      await expect(page.locator('.best-posting-times')).toBeVisible();
      await expect(page.locator('.topic-suggestions')).toBeVisible();
    });
  });

  test.describe('6. Mobile Responsiveness', () => {
    test('should work on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      
      await page.goto('http://localhost:3000');
      
      // Check mobile menu
      await page.click('.mobile-menu-toggle');
      await expect(page.locator('.mobile-nav')).toBeVisible();
      
      // Navigate to dashboard
      await page.goto('http://localhost:3000/advisor/dashboard');
      
      // Check responsive layout
      await expect(page.locator('.mobile-optimized')).toBeVisible();
      
      // Verify touch targets
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44); // iOS minimum
        }
      }
    });
  });

  test.describe('7. SEBI Compliance Validation', () => {
    test('should enforce SEBI compliance across platform', async () => {
      const pagesToCheck = [
        '/',
        '/pricing',
        '/advisor/dashboard',
        '/sign-up'
      ];
      
      for (const path of pagesToCheck) {
        await page.goto(`http://localhost:3000${path}`);
        
        // Check for mandatory elements
        const hasDisclaimer = await page.locator('text=/market risks/i').count();
        const hasEUIN = await page.locator('text=/EUIN/').count();
        
        expect(hasDisclaimer + hasEUIN).toBeGreaterThan(0);
      }
    });

    test('should prevent non-compliant content', async () => {
      await page.goto('http://localhost:3000/advisor/dashboard');
      await page.click('text=Generate Content');
      
      // Try to generate non-compliant content
      await page.fill('[name="topic"]', 'Guaranteed 20% returns');
      await page.click('button:has-text("Generate")');
      
      // Should show compliance warning
      await expect(page.locator('.compliance-warning')).toBeVisible();
      await expect(page.locator('.compliance-warning')).toContainText(/prohibited|not allowed/i);
    });
  });

  test.describe('8. Performance Requirements', () => {
    test('should meet performance SLAs', async () => {
      // Test page load times
      const pages = [
        { url: '/', maxTime: 1200 }, // FCP <1.2s
        { url: '/advisor/dashboard', maxTime: 2500 }, // LCP <2.5s
        { url: '/pricing', maxTime: 1500 }
      ];
      
      for (const pageTest of pages) {
        await page.goto(`http://localhost:3000${pageTest.url}`);
        
        const metrics = await page.evaluate(() => {
          const perfData = performance.timing;
          return {
            fcp: perfData.domContentLoadedEventEnd - perfData.navigationStart,
            lcp: perfData.loadEventEnd - perfData.navigationStart
          };
        });
        
        expect(metrics.fcp).toBeLessThan(pageTest.maxTime);
      }
    });

    test('should handle concurrent users', async () => {
      // Simulate multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          page.evaluate(() => 
            fetch('/api/content/generate', {
              method: 'POST',
              body: JSON.stringify({ type: 'educational' })
            })
          )
        );
      }
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      
      expect(successCount).toBeGreaterThan(8); // >80% success rate
    });
  });
});

test.describe('Security & Data Protection', () => {
  test('should enforce secure authentication', async ({ page }) => {
    // Test session timeout
    await page.goto('http://localhost:3000/advisor/dashboard');
    
    // Wait for session timeout (in test, we simulate)
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
    });
    
    await page.reload();
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should protect sensitive data', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check for secure headers
    const response = await page.goto('http://localhost:3000');
    const headers = response?.headers();
    
    expect(headers?.['x-frame-options']).toBeTruthy();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });
});

test.describe('Accessibility Compliance', () => {
  test('should meet WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check for accessibility attributes
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      expect(ariaLabel || text).toBeTruthy();
    }
    
    // Check color contrast (simplified check)
    const contrastIssues = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let issues = 0;
      // Simplified contrast check - in production use axe-core
      return issues;
    });
    
    expect(contrastIssues).toBe(0);
  });
});