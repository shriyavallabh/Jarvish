import puppeteer, { Browser, Page } from 'puppeteer'

describe('E2E: Advisor Registration Flow', () => {
  let browser: Browser
  let page: Page
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
  })

  afterEach(async () => {
    await page.close()
  })

  describe('Complete Registration Journey', () => {
    it.skip('should complete full advisor registration flow', async () => {
      // Navigate to registration page
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Fill in EUIN
      await page.type('[data-testid="euin-input"]', 'E123456789')
      
      // Verify EUIN validation happens
      await page.waitForSelector('[data-testid="euin-validation-success"]', { timeout: 5000 })

      // Fill in personal details
      await page.type('[data-testid="first-name-input"]', 'Rajesh')
      await page.type('[data-testid="last-name-input"]', 'Kumar')
      await page.type('[data-testid="email-input"]', `rajesh.kumar.${Date.now()}@example.com`)
      await page.type('[data-testid="mobile-input"]', '9876543210')
      
      // Fill in password
      await page.type('[data-testid="password-input"]', 'SecurePass123!')
      await page.type('[data-testid="confirm-password-input"]', 'SecurePass123!')
      
      // Select business type
      await page.select('[data-testid="business-type-select"]', 'individual')
      
      // Accept terms and conditions
      await page.click('[data-testid="terms-checkbox"]')
      await page.click('[data-testid="dpdp-checkbox"]')
      
      // Submit registration
      await page.click('[data-testid="register-button"]')
      
      // Wait for success message or redirect
      await page.waitForSelector('[data-testid="registration-success"]', { timeout: 10000 })
      
      // Verify email verification prompt
      const successMessage = await page.$eval('[data-testid="success-message"]', el => el.textContent)
      expect(successMessage).toContain('verification email')
    })

    it.skip('should handle invalid EUIN gracefully', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Enter invalid EUIN
      await page.type('[data-testid="euin-input"]', 'INVALID123')
      await page.keyboard.press('Tab')
      
      // Wait for error message
      await page.waitForSelector('[data-testid="euin-error"]')
      const errorMessage = await page.$eval('[data-testid="euin-error"]', el => el.textContent)
      expect(errorMessage).toContain('Invalid EUIN')
      
      // Verify submit button is disabled
      const isDisabled = await page.$eval('[data-testid="register-button"]', (button: HTMLButtonElement) => button.disabled)
      expect(isDisabled).toBe(true)
    })

    it.skip('should validate mobile number format', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Enter non-Indian mobile number
      await page.type('[data-testid="mobile-input"]', '1234567890')
      await page.keyboard.press('Tab')
      
      // Wait for error message
      await page.waitForSelector('[data-testid="mobile-error"]')
      const errorMessage = await page.$eval('[data-testid="mobile-error"]', el => el.textContent)
      expect(errorMessage).toContain('Indian mobile number')
    })

    it.skip('should enforce password requirements', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Enter weak password
      await page.type('[data-testid="password-input"]', 'weak')
      await page.keyboard.press('Tab')
      
      // Check for password strength indicator
      await page.waitForSelector('[data-testid="password-strength-weak"]')
      
      // Verify error message
      const errorMessage = await page.$eval('[data-testid="password-error"]', el => el.textContent)
      expect(errorMessage).toContain('at least 8 characters')
    })

    it.skip('should require terms acceptance', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Fill all fields except terms
      await page.type('[data-testid="euin-input"]', 'E123456789')
      await page.type('[data-testid="first-name-input"]', 'Test')
      await page.type('[data-testid="last-name-input"]', 'User')
      await page.type('[data-testid="email-input"]', 'test@example.com')
      await page.type('[data-testid="mobile-input"]', '9876543210')
      await page.type('[data-testid="password-input"]', 'SecurePass123!')
      await page.type('[data-testid="confirm-password-input"]', 'SecurePass123!')
      
      // Try to submit without accepting terms
      await page.click('[data-testid="register-button"]')
      
      // Check for error message
      await page.waitForSelector('[data-testid="terms-error"]')
      const errorMessage = await page.$eval('[data-testid="terms-error"]', el => el.textContent)
      expect(errorMessage).toContain('accept the terms')
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 })
    })

    it.skip('should work on mobile devices', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Check if mobile layout is applied
      const isMobileLayout = await page.$eval('[data-testid="registration-form"]', el => {
        return el.classList.contains('mobile-optimized')
      })
      expect(isMobileLayout).toBe(true)

      // Verify all form elements are accessible
      const euinInput = await page.$('[data-testid="euin-input"]')
      expect(euinInput).toBeTruthy()
      
      // Test form interaction on mobile
      await page.type('[data-testid="euin-input"]', 'E123456789')
      await page.type('[data-testid="email-input"]', 'mobile@test.com')
      
      // Verify no horizontal scrolling
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth)
    })

    it.skip('should have touch-friendly form elements', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Check button size (minimum 44px for touch targets)
      const buttonSize = await page.$eval('[data-testid="register-button"]', button => {
        const rect = button.getBoundingClientRect()
        return { width: rect.width, height: rect.height }
      })
      
      expect(buttonSize.height).toBeGreaterThanOrEqual(44)
      
      // Check input field height
      const inputSize = await page.$eval('[data-testid="euin-input"]', input => {
        const rect = input.getBoundingClientRect()
        return { height: rect.height }
      })
      
      expect(inputSize.height).toBeGreaterThanOrEqual(44)
    })
  })

  describe('Performance', () => {
    it.skip('should load registration page within 3 seconds', async () => {
      const startTime = Date.now()
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(3000)
    })

    it.skip('should validate EUIN quickly', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      const startTime = Date.now()
      await page.type('[data-testid="euin-input"]', 'E123456789')
      await page.keyboard.press('Tab')
      await page.waitForSelector('[data-testid="euin-validation-success"], [data-testid="euin-error"]')
      const validationTime = Date.now() - startTime

      expect(validationTime).toBeLessThan(2000)
    })
  })

  describe('Accessibility', () => {
    it.skip('should be keyboard navigable', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Tab through form fields
      await page.keyboard.press('Tab') // Focus first field
      const focusedElement1 = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(focusedElement1).toBe('euin-input')

      await page.keyboard.press('Tab') // Move to next field
      const focusedElement2 = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(focusedElement2).toBe('first-name-input')

      // Continue tabbing through all fields
      const tabOrder = [
        'euin-input',
        'first-name-input',
        'last-name-input',
        'email-input',
        'mobile-input',
        'password-input',
        'confirm-password-input',
        'business-type-select',
        'terms-checkbox',
        'dpdp-checkbox',
        'register-button',
      ]

      // Reset to first field
      await page.focus('[data-testid="euin-input"]')
      
      for (let i = 1; i < tabOrder.length; i++) {
        await page.keyboard.press('Tab')
        const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
        expect(focused).toBe(tabOrder[i])
      }
    })

    it.skip('should have proper ARIA labels', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Check for ARIA labels
      const euinLabel = await page.$eval('[data-testid="euin-input"]', el => el.getAttribute('aria-label'))
      expect(euinLabel).toBeTruthy()

      const submitButton = await page.$eval('[data-testid="register-button"]', el => el.getAttribute('aria-label'))
      expect(submitButton).toBeTruthy()

      // Check for form role
      const formRole = await page.$eval('[data-testid="registration-form"]', el => el.getAttribute('role'))
      expect(formRole).toBe('form')
    })

    it.skip('should announce errors to screen readers', async () => {
      await page.goto(`${baseUrl}/sign-up`)
      await page.waitForSelector('[data-testid="registration-form"]')

      // Trigger an error
      await page.type('[data-testid="euin-input"]', 'INVALID')
      await page.keyboard.press('Tab')

      // Check for ARIA live region
      await page.waitForSelector('[data-testid="euin-error"]')
      const errorAria = await page.$eval('[data-testid="euin-error"]', el => el.getAttribute('aria-live'))
      expect(errorAria).toBe('polite')

      // Check error is associated with input
      const inputAriaDescribedBy = await page.$eval('[data-testid="euin-input"]', el => el.getAttribute('aria-describedby'))
      expect(inputAriaDescribedBy).toContain('euin-error')
    })
  })
})