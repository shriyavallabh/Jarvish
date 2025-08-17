# Puppeteer E2E Test Plan

## Overview
This document outlines the comprehensive end-to-end testing strategy using Puppeteer for the AI-first B2B financial content platform. All tests should be automated and integrated into the CI/CD pipeline.

---

## Test Environment Setup

### Prerequisites
```javascript
// package.json dependencies
{
  "devDependencies": {
    "puppeteer": "^21.x",
    "jest": "^29.x",
    "@types/puppeteer": "^7.x",
    "jest-puppeteer": "^9.x",
    "pixelmatch": "^5.x",
    "jest-image-snapshot": "^6.x",
    "puppeteer-screen-recorder": "^3.x"
  }
}
```

### Configuration
```javascript
// jest-puppeteer.config.js
module.exports = {
  launch: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
    devtools: process.env.DEVTOOLS === 'true',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  },
  browserContext: 'incognito',
  server: {
    command: 'npm run dev:test',
    port: 3000,
    launchTimeout: 30000
  }
};
```

---

## Test Suites

### 1. Advisor Onboarding Suite

#### Test Case: Complete MFD Onboarding
```javascript
describe('MFD Advisor Onboarding', () => {
  let page;
  
  beforeAll(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterAll(async () => {
    await page.close();
  });

  test('Should complete full MFD onboarding flow', async () => {
    // Navigate to signup
    await page.goto('http://localhost:3000/signup');
    await page.waitForSelector('[data-testid="signup-form"]');
    
    // Step 1: Email/Phone Entry
    await page.type('[data-testid="email-input"]', 'test.mfd@example.com');
    await page.type('[data-testid="phone-input"]', '9876543210');
    await page.click('[data-testid="send-otp-btn"]');
    
    // Wait for OTP
    await page.waitForSelector('[data-testid="otp-input"]');
    
    // Mock OTP entry (in test mode)
    await page.type('[data-testid="otp-input"]', '123456');
    await page.click('[data-testid="verify-otp-btn"]');
    
    // Step 2: Business Type Selection
    await page.waitForSelector('[data-testid="type-selection"]');
    await page.click('[data-testid="mfd-type-btn"]');
    
    // Step 3: Document Upload
    await page.waitForSelector('[data-testid="document-upload"]');
    
    // Upload ARN certificate
    const arnInput = await page.$('[data-testid="arn-cert-input"]');
    await arnInput.uploadFile('./test-files/arn-certificate.pdf');
    
    // Upload PAN
    const panInput = await page.$('[data-testid="pan-input"]');
    await panInput.uploadFile('./test-files/pan-card.jpg');
    
    // Enter ARN number
    await page.type('[data-testid="arn-number"]', 'ARN-12345');
    
    await page.click('[data-testid="continue-btn"]');
    
    // Step 4: Tier Selection
    await page.waitForSelector('[data-testid="tier-selection"]');
    await page.click('[data-testid="basic-tier-btn"]');

// Verify Founding 100 discount applied
await page.waitForSelector('[data-testid="pricing-summary"]');
const priceText = await page.$eval('[data-testid="pricing-summary"]', el => el.textContent);
expect(priceText).toMatch(/50%/);
    
    // Step 5: Payment
    await page.waitForSelector('[data-testid="payment-form"]');
    await page.click('[data-testid="pay-with-upi"]');
    
    // Mock payment success
await page.waitForSelector('[data-testid="payment-success"]');

// GSTIN collection
await page.waitForSelector('[data-testid="gstin-input"]');
await page.type('[data-testid="gstin-input"]', '27ABCDE1234F1Z5');
await page.click('[data-testid="gstin-validate"]');
await page.waitForSelector('[data-testid="gstin-valid"]');
    
    // Step 6: WhatsApp Connection
    await page.waitForSelector('[data-testid="whatsapp-setup"]');
    await page.click('[data-testid="connect-whatsapp-btn"]');
    
    // Mock WhatsApp verification
    await page.waitForSelector('[data-testid="whatsapp-verified"]');
    
    // Step 7: Preferences
await page.waitForSelector('[data-testid="preferences-form"]');
await page.click('[data-testid="language-hindi"]');
await page.click('[data-testid="send-time-0600"]');
await page.click('[data-testid="weekdays-only-toggle"]');
await page.click('[data-testid="complete-onboarding"]');
    
    // Verify success
    await page.waitForSelector('[data-testid="onboarding-complete"]');
    const successText = await page.$eval('[data-testid="success-message"]', el => el.textContent);
    expect(successText).toContain('pending admin approval');
  });

  test('Should handle save and resume during onboarding', async () => {
    await page.goto('http://localhost:3000/signup');
    
    // Start onboarding
    await page.type('[data-testid="email-input"]', 'resume.test@example.com');
    await page.type('[data-testid="phone-input"]', '9876543211');
    await page.click('[data-testid="send-otp-btn"]');
    
    // Save progress
    await page.click('[data-testid="save-progress-btn"]');
    await page.waitForSelector('[data-testid="progress-saved"]');
    
    // Navigate away
    await page.goto('http://localhost:3000');
    
    // Return and resume
    await page.goto('http://localhost:3000/signup');
    await page.type('[data-testid="email-input"]', 'resume.test@example.com');
    await page.click('[data-testid="resume-btn"]');
    
    // Verify resumed at correct step
    await page.waitForSelector('[data-testid="otp-input"]');
  });
});
```

#### Test Case: RIA Onboarding with Document Validation
```javascript
describe('RIA Advisor Onboarding', () => {
  test('Should validate RIA documents correctly', async () => {
    const page = await browser.newPage();
    
    // Navigate through to document upload
    // ... (similar steps as above)
    
    // Test invalid document
    const invalidInput = await page.$('[data-testid="sebi-cert-input"]');
    await invalidInput.uploadFile('./test-files/invalid-file.txt');
    
    await page.waitForSelector('[data-testid="file-error"]');
    const errorText = await page.$eval('[data-testid="file-error"]', el => el.textContent);
    expect(errorText).toContain('Invalid file format');
    
    // Test oversized document
    const oversizedInput = await page.$('[data-testid="sebi-cert-input"]');
    await oversizedInput.uploadFile('./test-files/large-file.pdf'); // >5MB
    
    await page.waitForSelector('[data-testid="size-error"]');
    const sizeError = await page.$eval('[data-testid="size-error"]', el => el.textContent);
    expect(sizeError).toContain('File size must be less than 5MB');
    
    await page.close();
  });
});
```

### 2. Content Creation & Compliance Suite

#### Test Case: AI-Powered Content Creation
```javascript
describe('Content Pack Creation', () => {
  let page;
  
  beforeEach(async () => {
    page = await browser.newPage();
    // Login as advisor
    await loginAsAdvisor(page, 'test.advisor@example.com');
  });

  test('Should create content pack with AI suggestions', async () => {
    await page.goto('http://localhost:3000/advisor/compose');
    
    // Select topic
    await page.click('[data-testid="topic-dropdown"]');
    await page.click('[data-testid="topic-sip"]');
    
    // Select language
    await page.click('[data-testid="language-hindi"]');
    
    // Wait for AI generation
    await page.waitForSelector('[data-testid="ai-variants"]', { timeout: 5000 });
    
    // Verify 2 variants generated
    const variants = await page.$$('[data-testid="variant-card"]');
    expect(variants).toHaveLength(2);
    
    // Select first variant
    await page.click('[data-testid="variant-1"]');
    
    // Verify compliance check runs
    await page.waitForSelector('[data-testid="compliance-score"]');
    const score = await page.$eval('[data-testid="risk-score-value"]', el => parseInt(el.textContent));
    expect(score).toBeLessThan(40); // Green zone
    
    // Edit caption
    await page.click('[data-testid="caption-editor"]');
    await page.keyboard.type(' - Additional info');
    
    // Wait for re-validation
    await page.waitForSelector('[data-testid="revalidation-complete"]');
    
    // Submit for approval
    await page.click('[data-testid="submit-for-approval"]');
    await page.waitForSelector('[data-testid="submission-success"]');
  });

  test('Should detect and flag prohibited content', async () => {
    await page.goto('http://localhost:3000/advisor/compose');
    
    // Manually enter prohibited content
    await page.click('[data-testid="manual-entry-btn"]');
    await page.type('[data-testid="caption-textarea"]', 'Guaranteed returns of 15% assured!');
    
    // Wait for compliance check
    await page.waitForSelector('[data-testid="compliance-error"]');
    
    // Verify high risk score
    const score = await page.$eval('[data-testid="risk-score-value"]', el => parseInt(el.textContent));
    expect(score).toBeGreaterThan(70); // Red zone
    
    // Check for specific violations
    const violations = await page.$$eval('[data-testid="violation-item"]', els => 
      els.map(el => el.textContent)
    );
    expect(violations).toContain('PROHIBITED_TERM');
    expect(violations).toContain('RISK_PERF_PROMISE');
    
    // Click AI suggestion to fix
    await page.click('[data-testid="ai-fix-btn"]');
    await page.waitForSelector('[data-testid="fixed-caption"]');
    
    // Verify fixed caption passes
    const fixedScore = await page.$eval('[data-testid="risk-score-value"]', el => parseInt(el.textContent));
    expect(fixedScore).toBeLessThan(40);
  });

  test('Should enforce character limits and emoji restrictions', async () => {
    await page.goto('http://localhost:3000/advisor/compose');
    
    // Test character limit
    const longText = 'a'.repeat(600);
    await page.click('[data-testid="manual-entry-btn"]');
    await page.type('[data-testid="caption-textarea"]', longText);
    
    // Verify character count warning
    await page.waitForSelector('[data-testid="char-limit-error"]');
    const charCount = await page.$eval('[data-testid="char-count"]', el => el.textContent);
    expect(charCount).toContain('600/500');
    
    // Test emoji limit
    await page.evaluate(() => {
      document.querySelector('[data-testid="caption-textarea"]').value = '';
    });
    await page.type('[data-testid="caption-textarea"]', 'Test 😊😊😊😊 content');
    
    // Verify emoji warning
    await page.waitForSelector('[data-testid="emoji-limit-warning"]');
    const emojiCount = await page.$eval('[data-testid="emoji-count"]', el => el.textContent);
    expect(emojiCount).toContain('4 emojis (max 3)');
  });
});
```

#### Test Case: Translation Validation
```javascript
describe('Content Translation', () => {
  test('Should translate content accurately', async () => {
    const page = await browser.newPage();
    await loginAsAdvisor(page, 'test.advisor@example.com');
    
    await page.goto('http://localhost:3000/advisor/compose');
    
    // Create English content
    await page.click('[data-testid="topic-dropdown"]');
    await page.click('[data-testid="topic-tax"]');
    await page.click('[data-testid="language-english"]');
    
    // Wait for AI generation
    await page.waitForSelector('[data-testid="ai-variants"]');
    await page.click('[data-testid="variant-1"]');
    
    // Add Hindi translation
    await page.click('[data-testid="add-translation"]');
    await page.click('[data-testid="translate-hindi"]');
    
    // Wait for translation
    await page.waitForSelector('[data-testid="hindi-translation"]');
    
    // Verify disclaimer is translated
    const hindiDisclaimer = await page.$eval('[data-testid="hindi-disclaimer"]', el => el.textContent);
    expect(hindiDisclaimer).toContain('म्यूचुअल फंड निवेश बाजार जोखिम के अधीन हैं');
    
    // Verify numbers are in Indian format
    const hindiContent = await page.$eval('[data-testid="hindi-content"]', el => el.textContent);
    expect(hindiContent).toMatch(/₹[\d,]+/); // Indian currency format
    
    await page.close();
  });
});
```

### 3. Admin Approval Queue Suite

#### Test Case: Batch Approval Process
```javascript
describe('Admin Approval Queue', () => {
  let page;
  
  beforeEach(async () => {
    page = await browser.newPage();
    await loginAsAdmin(page, 'admin@example.com');
  });

  test('Should batch approve low-risk content', async () => {
    await page.goto('http://localhost:3000/admin/approval-queue');
    
    // Wait for queue to load
    await page.waitForSelector('[data-testid="approval-queue-table"]');
    
    // Filter by low risk
    await page.click('[data-testid="risk-filter"]');
    await page.click('[data-testid="filter-green"]');
    
    // Select all items
    await page.click('[data-testid="select-all-checkbox"]');
    
    // Verify selection count
    const selectedCount = await page.$eval('[data-testid="selected-count"]', el => el.textContent);
    expect(parseInt(selectedCount)).toBeGreaterThan(0);
    
    // Batch approve
    await page.click('[data-testid="batch-approve-btn"]');
    await page.waitForSelector('[data-testid="confirm-dialog"]');
    await page.click('[data-testid="confirm-approve"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="batch-success"]');
    const successMsg = await page.$eval('[data-testid="success-message"]', el => el.textContent);
    expect(successMsg).toContain('approved successfully');
  });

  test('Should preview and reject with notes', async () => {
    await page.goto('http://localhost:3000/admin/approval-queue');
    
    // Click on first high-risk item
    await page.click('[data-testid="risk-filter"]');
    await page.click('[data-testid="filter-red"]');
    
    await page.waitForSelector('[data-testid="queue-item-0"]');
    await page.click('[data-testid="preview-btn-0"]');
    
    // Wait for preview modal
    await page.waitForSelector('[data-testid="preview-modal"]');
    
    // Verify risk details are shown
    const riskScore = await page.$eval('[data-testid="preview-risk-score"]', el => el.textContent);
    expect(parseInt(riskScore)).toBeGreaterThan(70);
    
    // Check AI suggestions
    const suggestions = await page.$$('[data-testid="ai-suggestion"]');
    expect(suggestions.length).toBeGreaterThan(0);
    
    // Reject with notes
    await page.click('[data-testid="reject-btn"]');
    await page.type('[data-testid="rejection-notes"]', 'Contains guaranteed returns claim');
    await page.click('[data-testid="confirm-reject"]');
    
    // Verify rejection
    await page.waitForSelector('[data-testid="rejection-success"]');
  });
});
```

### 4. WhatsApp Integration Suite

#### Test Case: Message Delivery Flow
```javascript
describe('WhatsApp Message Delivery', () => {
  test('Should send scheduled messages at 06:00', async () => {
    const page = await browser.newPage();
    
    // Set system time to 05:55 (mock)
    await page.evaluateOnNewDocument(() => {
      Date.now = () => new Date('2024-01-15T00:25:00Z').getTime(); // 05:55 IST
    });
    
    await loginAsAdmin(page, 'admin@example.com');
    await page.goto('http://localhost:3000/admin/system-health');
    
    // Verify pre-render status
await page.waitForSelector('[data-testid="prerender-status"]');
const prerenderStatus = await page.$eval('[data-testid="prerender-complete"]', el => el.textContent);
expect(prerenderStatus).toBe('100%');

// Canary sends check
await page.waitForSelector('[data-testid="canary-status"]');
const canaryStatus = await page.$eval('[data-testid="canary-status"]', el => el.textContent);
expect(canaryStatus).toContain('Sent at 05:50');
    
    // Advance time to 06:00
    await page.evaluate(() => {
      Date.now = () => new Date('2024-01-15T00:30:00Z').getTime(); // 06:00 IST
    });
    
    // Trigger scheduler (in test mode)
    await page.click('[data-testid="trigger-send-test"]');
    
    // Monitor send progress
    await page.waitForSelector('[data-testid="send-progress"]', { timeout: 30000 });
    
    // Verify delivery metrics
await page.waitForSelector('[data-testid="delivery-complete"]', { timeout: 300000 });
const deliveryRate = await page.$eval('[data-testid="delivery-rate"]', el => el.textContent);
expect(parseFloat(deliveryRate)).toBeGreaterThan(98);

// Verify read rate tracking exists
await page.waitForSelector('[data-testid="read-rate"]');
  });

  test('Should handle STOP/START commands', async () => {
    // Mock webhook endpoint
    const response = await fetch('http://localhost:3000/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature': generateHMAC('test-payload')
      },
      body: JSON.stringify({
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '919876543210',
                text: { body: 'STOP' }
              }]
            }
          }]
        }]
      })
    });
    
    expect(response.status).toBe(200);
    
    // Verify opt-out recorded
    const page = await browser.newPage();
    await loginAsAdmin(page, 'admin@example.com');
    await page.goto('http://localhost:3000/admin/advisors');
    
    await page.type('[data-testid="search-advisor"]', '919876543210');
    await page.waitForSelector('[data-testid="advisor-row"]');
    
    const optStatus = await page.$eval('[data-testid="opt-status"]', el => el.textContent);
    expect(optStatus).toBe('Opted Out');
  });
});
```

### 5. Performance Testing Suite

#### Test Case: Load Testing at Scale
```javascript
describe('Performance Tests', () => {
  test('Should handle 1000 concurrent users', async () => {
    const browsers = [];
    const results = [];
    
    // Create 1000 browser instances (batched)
    for (let batch = 0; batch < 10; batch++) {
      const batchPromises = [];
      
      for (let i = 0; i < 100; i++) {
        batchPromises.push(
          puppeteer.launch({ headless: true }).then(async browser => {
            const page = await browser.newPage();
            const startTime = Date.now();
            
            await page.goto('http://localhost:3000/advisor/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');
            
            const loadTime = Date.now() - startTime;
            results.push(loadTime);
            
            browsers.push(browser);
            return loadTime;
          })
        );
      }
      
      await Promise.all(batchPromises);
    }
    
    // Calculate metrics
    const avgLoadTime = results.reduce((a, b) => a + b) / results.length;
    const p95LoadTime = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];
    
    expect(avgLoadTime).toBeLessThan(3000); // 3s average
    expect(p95LoadTime).toBeLessThan(5000); // 5s p95
    
    // Cleanup
    await Promise.all(browsers.map(b => b.close()));
  });

  test('Should maintain AI latency under load', async () => {
    const page = await browser.newPage();
    await loginAsAdvisor(page, 'test.advisor@example.com');
    
    const latencies = [];
    
    // Simulate 50 concurrent AI requests
    for (let i = 0; i < 50; i++) {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/advisor/compose');
      await page.click('[data-testid="topic-dropdown"]');
      await page.click('[data-testid="topic-sip"]');
      
      await page.waitForSelector('[data-testid="ai-variants"]', { timeout: 5000 });
      
      const latency = Date.now() - startTime;
      latencies.push(latency);
    }
    
    const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
    expect(p95Latency).toBeLessThan(3500); // 3.5s p95 for generation
  });
});
```

### 6. Security Testing Suite

#### Test Case: Tenant Isolation
```javascript
describe('Security Tests', () => {
  test('Should enforce tenant isolation', async () => {
    // Login as Advisor A
    const pageA = await browser.newPage();
    await loginAsAdvisor(pageA, 'advisorA@example.com');
    
    // Get advisor A's content
    await pageA.goto('http://localhost:3000/advisor/packs');
    const contentA = await pageA.$$eval('[data-testid="pack-item"]', els => els.length);
    
    // Login as Advisor B in different context
    const contextB = await browser.createIncognitoBrowserContext();
    const pageB = await contextB.newPage();
    await loginAsAdvisor(pageB, 'advisorB@example.com');
    
    // Try to access Advisor A's content via API
    const response = await pageB.evaluate(async () => {
      return await fetch('/api/v1/packs?advisorId=advisorA-id', {
        credentials: 'include'
      }).then(r => ({ status: r.status, data: r.json() }));
    });
    
    expect(response.status).toBe(403);
    
    // Verify Advisor B sees only their content
    await pageB.goto('http://localhost:3000/advisor/packs');
    const contentB = await pageB.$$eval('[data-testid="pack-item"]', els => 
      els.map(el => el.getAttribute('data-advisor-id'))
    );
    
    contentB.forEach(id => {
      expect(id).toBe('advisorB-id');
    });
    
    await contextB.close();
  });

  test('Should prevent XSS attacks', async () => {
    const page = await browser.newPage();
    await loginAsAdvisor(page, 'test.advisor@example.com');
    
    await page.goto('http://localhost:3000/advisor/compose');
    
    // Try XSS in caption
    const xssPayload = '<script>alert("XSS")</script>';
    await page.click('[data-testid="manual-entry-btn"]');
    await page.type('[data-testid="caption-textarea"]', xssPayload);
    
    // Submit and check rendering
    await page.click('[data-testid="preview-btn"]');
    await page.waitForSelector('[data-testid="preview-content"]');
    
    // Verify script is escaped
    const renderedContent = await page.$eval('[data-testid="preview-content"]', el => el.innerHTML);
    expect(renderedContent).not.toContain('<script>');
    expect(renderedContent).toContain('&lt;script&gt;');
    
    // Verify no alert was triggered
    const alerts = [];
    page.on('dialog', dialog => alerts.push(dialog.message()));
    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  });
});
```

### 7. Mobile Responsiveness Suite

#### Test Case: Mobile Dashboard
```javascript
describe('Mobile Responsiveness', () => {
  test('Should render correctly on mobile devices', async () => {
    const page = await browser.newPage();
    
    // Set mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
      isMobile: true,
      hasTouch: true
    });
    
    await loginAsAdvisor(page, 'test.advisor@example.com');
    await page.goto('http://localhost:3000/advisor/dashboard');
    
    // Verify mobile menu
    await page.waitForSelector('[data-testid="mobile-menu-btn"]');
    await page.click('[data-testid="mobile-menu-btn"]');
    
    // Verify drawer opens
    await page.waitForSelector('[data-testid="mobile-drawer"]');
    
    // Test touch scrolling
    await page.evaluate(() => {
      document.querySelector('[data-testid="content-area"]').scrollTop = 100;
    });
    
    // Take screenshot for visual regression
    await page.screenshot({ 
      path: './screenshots/mobile-dashboard.png',
      fullPage: true 
    });
    
    // Verify key elements are visible
    const isPackVisible = await page.isVisible('[data-testid="todays-pack"]');
    const isHealthVisible = await page.isVisible('[data-testid="wa-health"]');
    
    expect(isPackVisible).toBe(true);
    expect(isHealthVisible).toBe(true);
  });
});
```

---

## Helper Functions

```javascript
// helpers/auth.js
export async function loginAsAdvisor(page, email) {
  await page.goto('http://localhost:3000/login');
  await page.type('[data-testid="email-input"]', email);
  await page.type('[data-testid="password-input"]', 'test-password');
  await page.click('[data-testid="login-btn"]');
  await page.waitForSelector('[data-testid="advisor-dashboard"]');
}

export async function loginAsAdmin(page, email) {
  await page.goto('http://localhost:3000/admin/login');
  await page.type('[data-testid="email-input"]', email);
  await page.type('[data-testid="password-input"]', 'admin-password');
  await page.click('[data-testid="login-btn"]');
  
  // Handle 2FA
  await page.waitForSelector('[data-testid="2fa-input"]');
  await page.type('[data-testid="2fa-input"]', '123456');
  await page.click('[data-testid="verify-2fa"]');
  
  await page.waitForSelector('[data-testid="admin-dashboard"]');
}

// helpers/utils.js
export function generateHMAC(payload) {
  // Mock HMAC generation for tests
  return 'test-hmac-signature';
}

export async function waitForNetworkIdle(page) {
  await page.waitForLoadState('networkidle');
}

export async function takeScreenshot(page, name) {
  await page.screenshot({
    path: `./screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}
```

---

## CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup test database
        run: npm run db:test:setup
        
      - name: Build application
        run: npm run build:test
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          HEADLESS: true
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/test
          
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: screenshots/
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## Test Data Management

```javascript
// test-data/seeds.js
export const testAdvisors = [
  {
    email: 'test.mfd@example.com',
    phone: '9876543210',
    type: 'MFD',
    arn: 'ARN-12345',
    tier: 'basic',
    status: 'approved'
  },
  {
    email: 'test.ria@example.com',
    phone: '9876543211',
    type: 'RIA',
    sebiRegNo: 'INA000012345',
    tier: 'pro',
    status: 'approved'
  }
];

export const testContentPacks = [
  {
    topic: 'SIP',
    caption: 'Start your wealth creation journey with SIP',
    language: 'EN',
    riskScore: 25,
    status: 'approved'
  },
  {
    topic: 'Tax',
    caption: 'Save taxes with ELSS mutual funds',
    language: 'HI',
    riskScore: 30,
    status: 'pending'
  }
];

// Database seeding for tests
export async function seedTestData() {
  // Implementation to seed test database
}

export async function cleanupTestData() {
  // Implementation to clean test database
}
```

---

## Visual Regression Testing

```javascript
// visual-regression/config.js
module.exports = {
  testDir: './visual-regression',
  expect: {
    toMatchSnapshot: {
      maxDiffPixels: 100,
      threshold: 0.2
    }
  },
  use: {
    // Consistent rendering
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
    javascriptEnabled: true,
    timezoneId: 'Asia/Kolkata',
    locale: 'en-IN',
    
    // Mask dynamic content
    maskSelectors: [
      '[data-testid="timestamp"]',
      '[data-testid="random-id"]'
    ]
  }
};

// visual-regression/dashboard.spec.js
describe('Visual Regression - Dashboard', () => {
  test('Advisor dashboard appearance', async () => {
    const page = await browser.newPage();
    await loginAsAdvisor(page, 'test.advisor@example.com');
    
    await page.goto('http://localhost:3000/advisor/dashboard');
    await page.waitForSelector('[data-testid="dashboard-loaded"]');
    
    // Hide dynamic elements
    await page.evaluate(() => {
      document.querySelectorAll('[data-dynamic]').forEach(el => {
        el.style.visibility = 'hidden';
      });
    });
    
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: 'advisor-dashboard'
    });
  });
});
```

---

## Reporting

```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'E2E Test Report',
      outputPath: 'test-results/e2e-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true
    }],
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage/e2e'
};
```

---

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on state from other tests
2. **Test Data**: Use dedicated test data that can be easily reset between runs
3. **Waits**: Use explicit waits (`waitForSelector`) instead of arbitrary timeouts
4. **Screenshots**: Capture screenshots on failures for debugging
5. **Parallel Execution**: Run tests in parallel where possible, but be mindful of resource constraints
6. **Flaky Tests**: Mark and fix flaky tests immediately; use retry mechanisms sparingly
7. **Performance**: Monitor test execution time and optimize slow tests
8. **Maintenance**: Keep selectors up-to-date and use data-testid attributes

---

## Test Execution Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific suite
npm run test:e2e -- --testNamePattern="Advisor Onboarding"

# Run with UI (headed mode)
npm run test:e2e:headed

# Run with debugging
npm run test:e2e:debug

# Run visual regression tests
npm run test:visual

# Update visual snapshots
npm run test:visual:update

# Run performance tests
npm run test:performance

# Generate coverage report
npm run test:e2e:coverage
``` 