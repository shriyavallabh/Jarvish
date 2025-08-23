/**
 * E2E Test: Advisor Registration Flow
 * Critical Path: Complete advisor registration with SEBI compliance
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Advisor Registration Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/sign-up');
  });

  test('should complete full advisor registration with EUIN validation', async () => {
    // Step 1: Basic Information
    await page.fill('[data-testid="business-name"]', 'Sharma Financial Advisory');
    await page.fill('[data-testid="advisor-name"]', 'Rajesh Sharma');
    await page.fill('[data-testid="euin-number"]', 'E123456');
    await page.fill('[data-testid="email"]', 'rajesh@sharmafinancial.com');
    await page.fill('[data-testid="mobile"]', '9876543210');
    
    // Password with validation
    await page.fill('[data-testid="password"]', 'SecurePass@2024');
    await page.fill('[data-testid="confirm-password"]', 'SecurePass@2024');
    
    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');
    await page.check('[data-testid="sebi-compliance-checkbox"]');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Wait for EUIN validation
    await expect(page.locator('[data-testid="euin-validation-success"]')).toBeVisible({
      timeout: 5000
    });
    
    // Step 2: Email Verification
    await expect(page).toHaveURL('/verify-email');
    await expect(page.locator('text=Verification email sent')).toBeVisible();
    
    // Simulate email verification (in real scenario, would check email)
    const verificationToken = 'test-verification-token';
    await page.goto(`/verify-email?token=${verificationToken}`);
    
    await expect(page.locator('[data-testid="email-verified-success"]')).toBeVisible();
    
    // Step 3: Mobile Verification
    await expect(page).toHaveURL('/verify-mobile');
    
    // Enter OTP
    const otpInputs = page.locator('[data-testid^="otp-input-"]');
    await otpInputs.nth(0).fill('1');
    await otpInputs.nth(1).fill('2');
    await otpInputs.nth(2).fill('3');
    await otpInputs.nth(3).fill('4');
    await otpInputs.nth(4).fill('5');
    await otpInputs.nth(5).fill('6');
    
    await page.click('[data-testid="verify-otp-button"]');
    
    await expect(page.locator('[data-testid="mobile-verified-success"]')).toBeVisible();
    
    // Step 4: Profile Completion
    await expect(page).toHaveURL('/onboarding/profile');
    
    // Business details
    await page.selectOption('[data-testid="business-type"]', 'mfd');
    await page.fill('[data-testid="years-experience"]', '8');
    await page.fill('[data-testid="client-count"]', '250');
    await page.selectOption('[data-testid="primary-location"]', 'mumbai');
    
    // Specializations
    await page.check('[data-testid="specialization-mutual-funds"]');
    await page.check('[data-testid="specialization-insurance"]');
    await page.check('[data-testid="specialization-retirement"]');
    
    await page.click('[data-testid="save-profile-button"]');
    
    // Step 5: Content Preferences
    await expect(page).toHaveURL('/onboarding/preferences');
    
    // Language selection
    await page.check('[data-testid="language-english"]');
    await page.check('[data-testid="language-hindi"]');
    
    // Content types
    await page.check('[data-testid="content-market-updates"]');
    await page.check('[data-testid="content-educational"]');
    await page.check('[data-testid="content-tax-tips"]');
    
    // Delivery time
    await page.selectOption('[data-testid="delivery-time"]', '06:00');
    
    // Target audience
    await page.selectOption('[data-testid="target-audience"]', 'retail');
    
    await page.click('[data-testid="save-preferences-button"]');
    
    // Step 6: WhatsApp Business Setup
    await expect(page).toHaveURL('/onboarding/whatsapp');
    
    await page.fill('[data-testid="whatsapp-number"]', '919876543210');
    await page.click('[data-testid="verify-whatsapp-button"]');
    
    // Wait for WhatsApp verification
    await page.waitForTimeout(2000); // Simulate API call
    
    await expect(page.locator('[data-testid="whatsapp-connected"]')).toBeVisible();
    
    // Step 7: Subscription Selection
    await expect(page).toHaveURL('/onboarding/subscription');
    
    // Select Standard plan
    await page.click('[data-testid="plan-standard"]');
    
    await expect(page.locator('[data-testid="selected-plan-standard"]')).toHaveClass(/selected/);
    
    // Pricing validation
    await expect(page.locator('[data-testid="plan-price"]')).toContainText('₹2,499');
    
    await page.click('[data-testid="proceed-to-payment"]');
    
    // Step 8: Demo Content Generation
    await expect(page).toHaveURL('/onboarding/demo');
    
    await page.click('[data-testid="generate-demo-button"]');
    
    // Wait for AI generation
    await expect(page.locator('[data-testid="demo-content-generated"]')).toBeVisible({
      timeout: 10000
    });
    
    // Verify SEBI compliance indicators
    await expect(page.locator('[data-testid="compliance-passed"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-score"]')).toContainText(/9[5-9]%|100%/);
    
    // Complete onboarding
    await page.click('[data-testid="complete-onboarding"]');
    
    // Final verification - Dashboard access
    await expect(page).toHaveURL('/advisor/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, Rajesh Sharma');
    await expect(page.locator('[data-testid="onboarding-complete-badge"]')).toBeVisible();
  });

  test('should validate EUIN format and show errors', async () => {
    // Invalid EUIN format
    await page.fill('[data-testid="euin-number"]', 'INVALID123');
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="euin-error"]')).toContainText('Invalid EUIN format');
    
    // Duplicate EUIN
    await page.fill('[data-testid="euin-number"]', 'E999999'); // Existing EUIN
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'Password@123');
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="euin-error"]')).toContainText('EUIN already registered');
  });

  test('should enforce password requirements', async () => {
    await page.fill('[data-testid="password"]', 'weak');
    
    // Check password strength indicators
    await expect(page.locator('[data-testid="password-strength"]')).toHaveClass(/weak/);
    
    const requirements = page.locator('[data-testid="password-requirements"] li');
    await expect(requirements).toHaveCount(5);
    
    // Verify specific requirements
    await expect(requirements.nth(0)).toContainText('At least 8 characters');
    await expect(requirements.nth(1)).toContainText('One uppercase letter');
    await expect(requirements.nth(2)).toContainText('One lowercase letter');
    await expect(requirements.nth(3)).toContainText('One number');
    await expect(requirements.nth(4)).toContainText('One special character');
    
    // Strong password
    await page.fill('[data-testid="password"]', 'StrongPass@2024');
    await expect(page.locator('[data-testid="password-strength"]')).toHaveClass(/strong/);
  });

  test('should handle mobile OTP resend and expiry', async () => {
    // Navigate to mobile verification
    await page.goto('/verify-mobile?test=true');
    
    // Test resend functionality
    await page.click('[data-testid="resend-otp-button"]');
    
    await expect(page.locator('[data-testid="otp-sent-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="resend-timer"]')).toContainText('30');
    
    // Wait for timer
    await page.waitForTimeout(30000);
    await expect(page.locator('[data-testid="resend-otp-button"]')).toBeEnabled();
    
    // Test expired OTP
    const expiredOtp = '000000';
    for (let i = 0; i < 6; i++) {
      await page.locator(`[data-testid="otp-input-${i}"]`).fill(expiredOtp[i]);
    }
    
    await page.click('[data-testid="verify-otp-button"]');
    await expect(page.locator('[data-testid="otp-error"]')).toContainText('OTP expired');
  });

  test('should save and resume onboarding progress', async () => {
    // Start registration
    await page.fill('[data-testid="business-name"]', 'Test Advisory');
    await page.fill('[data-testid="email"]', 'test@advisory.com');
    await page.fill('[data-testid="password"]', 'TestPass@2024');
    
    // Save progress
    await page.click('[data-testid="save-progress"]');
    await expect(page.locator('[data-testid="progress-saved"]')).toBeVisible();
    
    // Simulate browser close and return
    await page.reload();
    
    // Check if form data is preserved
    await expect(page.locator('[data-testid="business-name"]')).toHaveValue('Test Advisory');
    await expect(page.locator('[data-testid="email"]')).toHaveValue('test@advisory.com');
    
    // Resume from last step
    const resumeUrl = await page.getAttribute('[data-testid="resume-link"]', 'href');
    expect(resumeUrl).toBeTruthy();
  });

  test('should validate WhatsApp Business API connection', async () => {
    await page.goto('/onboarding/whatsapp');
    
    // Invalid number format
    await page.fill('[data-testid="whatsapp-number"]', '1234567890');
    await page.click('[data-testid="verify-whatsapp-button"]');
    
    await expect(page.locator('[data-testid="whatsapp-error"]')).toContainText('Invalid WhatsApp number');
    
    // Valid number but not business account
    await page.fill('[data-testid="whatsapp-number"]', '919876543210');
    await page.click('[data-testid="verify-whatsapp-button"]');
    
    // Simulate non-business account response
    await page.route('**/api/whatsapp/verify', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Not a WhatsApp Business account' })
      });
    });
    
    await expect(page.locator('[data-testid="whatsapp-error"]')).toContainText('Business account required');
  });

  test('should track onboarding analytics', async () => {
    // Intercept analytics calls
    const analyticsEvents: any[] = [];
    await page.route('**/api/analytics/track', route => {
      analyticsEvents.push(route.request().postDataJSON());
      route.fulfill({ status: 200 });
    });
    
    // Complete registration steps
    await page.fill('[data-testid="email"]', 'analytics@test.com');
    await page.click('[data-testid="register-button"]');
    
    // Verify analytics events
    expect(analyticsEvents).toContainEqual(
      expect.objectContaining({
        event: 'registration_started',
        properties: expect.objectContaining({
          step: 'basic_info'
        })
      })
    );
  });

  test('should handle network errors gracefully', async () => {
    // Simulate network failure
    await page.route('**/api/auth/register', route => {
      route.abort('failed');
    });
    
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'TestPass@2024');
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should show appropriate loading states', async () => {
    // Slow network simulation
    await page.route('**/api/auth/validate-euin', async route => {
      await page.waitForTimeout(3000);
      route.fulfill({ status: 200, body: JSON.stringify({ valid: true }) });
    });
    
    await page.fill('[data-testid="euin-number"]', 'E123456');
    await page.click('[data-testid="validate-euin"]');
    
    // Check loading state
    await expect(page.locator('[data-testid="euin-validating"]')).toBeVisible();
    await expect(page.locator('[data-testid="euin-spinner"]')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('[data-testid="euin-validation-success"]')).toBeVisible({
      timeout: 5000
    });
  });

  test('should be fully accessible with keyboard navigation', async () => {
    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="business-name"]')).toBeFocused();
    
    await page.keyboard.type('Keyboard Test Advisory');
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="advisor-name"]')).toBeFocused();
    
    // Navigate with arrow keys in select dropdown
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space'); // Open dropdown
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Submit with Enter key
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify form submission triggered
    await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
  });
});