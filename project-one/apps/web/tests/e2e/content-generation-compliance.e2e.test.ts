/**
 * E2E Test: Content Generation with SEBI Compliance
 * Critical Path: Generate, validate, and deliver compliant content
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Content Generation and Compliance Flow', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Login as authenticated advisor
    await page.goto('/sign-in');
    await page.fill('[data-testid="email"]', 'test.advisor@example.com');
    await page.fill('[data-testid="password"]', 'TestPass@2024');
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/advisor/dashboard');
  });

  test('should generate SEBI-compliant content with real-time validation', async () => {
    // Navigate to content generation
    await page.click('[data-testid="create-content-button"]');
    await expect(page).toHaveURL('/advisor/content/create');
    
    // Select content type
    await page.selectOption('[data-testid="content-type"]', 'educational');
    
    // Enter topic
    await page.fill('[data-testid="content-topic"]', 'Mutual Fund SIP Benefits');
    
    // Select target audience
    await page.selectOption('[data-testid="target-audience"]', 'young-professionals');
    
    // Select language
    await page.click('[data-testid="language-hindi"]');
    
    // Advanced options
    await page.click('[data-testid="advanced-options-toggle"]');
    await page.selectOption('[data-testid="tone"]', 'professional');
    await page.fill('[data-testid="max-length"]', '500');
    
    // Generate content
    await page.click('[data-testid="generate-content-button"]');
    
    // Verify loading states
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="generation-step-1"]')).toContainText('Generating content');
    
    // Wait for generation (max 3.5s as per requirement)
    await expect(page.locator('[data-testid="content-generated"]')).toBeVisible({
      timeout: 3500
    });
    
    // Verify three-stage compliance validation
    await expect(page.locator('[data-testid="compliance-stage-1"]')).toHaveClass(/completed/);
    await expect(page.locator('[data-testid="compliance-stage-1-status"]')).toContainText('Rules Check: Passed');
    
    await expect(page.locator('[data-testid="compliance-stage-2"]')).toHaveClass(/completed/);
    await expect(page.locator('[data-testid="compliance-stage-2-status"]')).toContainText('AI Validation: Passed');
    
    await expect(page.locator('[data-testid="compliance-stage-3"]')).toHaveClass(/completed/);
    await expect(page.locator('[data-testid="compliance-stage-3-status"]')).toContainText('Final Verification: Passed');
    
    // Verify compliance score
    const complianceScore = await page.locator('[data-testid="compliance-score"]').textContent();
    expect(parseInt(complianceScore!)).toBeGreaterThanOrEqual(95);
    
    // Verify mandatory disclaimers are present
    const generatedContent = await page.locator('[data-testid="generated-content"]').textContent();
    expect(generatedContent).toContain('म्यूचुअल फंड निवेश बाजार जोखिमों के अधीन हैं');
    expect(generatedContent).toContain('योजना संबंधी सभी दस्तावेजों को ध्यान से पढ़ें');
    
    // Verify advisor identity is included
    expect(generatedContent).toContain('EUIN:');
    
    // Verify response time
    const responseTime = await page.locator('[data-testid="generation-time"]').textContent();
    expect(parseFloat(responseTime!)).toBeLessThan(3.5);
  });

  test('should detect and prevent compliance violations in real-time', async () => {
    await page.goto('/advisor/content/create');
    
    // Enable manual content input
    await page.click('[data-testid="manual-input-toggle"]');
    
    // Type content with violations
    const violatingContent = 'Guaranteed 15% returns on this mutual fund scheme!';
    await page.fill('[data-testid="content-input"]', violatingContent);
    
    // Real-time compliance feedback should appear
    await expect(page.locator('[data-testid="compliance-warning"]')).toBeVisible({
      timeout: 1500 // <1.5s requirement
    });
    
    await expect(page.locator('[data-testid="violation-guaranteed-returns"]')).toBeVisible();
    await expect(page.locator('[data-testid="violation-message"]')).toContainText(
      'Remove guaranteed returns claim'
    );
    
    // Compliance score should be low
    const complianceScore = await page.locator('[data-testid="real-time-compliance-score"]').textContent();
    expect(parseInt(complianceScore!)).toBeLessThan(50);
    
    // Fix the violation
    await page.fill('[data-testid="content-input"]', 
      'Mutual funds have historically delivered good returns. Subject to market risks.'
    );
    
    // Compliance should improve
    await expect(page.locator('[data-testid="compliance-success"]')).toBeVisible({
      timeout: 1500
    });
    
    const updatedScore = await page.locator('[data-testid="real-time-compliance-score"]').textContent();
    expect(parseInt(updatedScore!)).toBeGreaterThan(90);
  });

  test('should handle multi-language content generation', async () => {
    await page.goto('/advisor/content/create');
    
    const languages = ['english', 'hindi', 'marathi'];
    
    for (const language of languages) {
      // Select language
      await page.click(`[data-testid="language-${language}"]`);
      
      // Generate content
      await page.fill('[data-testid="content-topic"]', 'Tax saving with ELSS');
      await page.click('[data-testid="generate-content-button"]');
      
      // Wait for generation
      await expect(page.locator('[data-testid="content-generated"]')).toBeVisible({
        timeout: 3500
      });
      
      // Verify language-specific content
      const content = await page.locator('[data-testid="generated-content"]').textContent();
      
      if (language === 'hindi') {
        expect(content).toMatch(/ईएलएसएस|कर बचत|म्यूचुअल फंड/);
      } else if (language === 'marathi') {
        expect(content).toMatch(/इएलएसएस|कर बचत|म्युच्युअल फंड/);
      } else {
        expect(content).toMatch(/ELSS|tax saving|mutual fund/i);
      }
      
      // Verify compliance in each language
      await expect(page.locator('[data-testid="compliance-passed"]')).toBeVisible();
      
      // Clear for next iteration
      await page.click('[data-testid="clear-content"]');
    }
  });

  test('should personalize content based on advisor profile', async () => {
    await page.goto('/advisor/content/create');
    
    // Enable personalization
    await page.check('[data-testid="enable-personalization"]');
    
    // Generate content
    await page.fill('[data-testid="content-topic"]', 'Investment planning');
    await page.click('[data-testid="generate-content-button"]');
    
    await expect(page.locator('[data-testid="content-generated"]')).toBeVisible();
    
    // Verify personalization elements
    const content = await page.locator('[data-testid="generated-content"]').textContent();
    
    // Should include advisor name and business name
    expect(content).toContain('Test Advisor');
    expect(content).toContain('Test Financial Services');
    
    // Should match advisor's specialization
    expect(content).toMatch(/retirement planning|tax optimization/i);
    
    // Should include advisor's EUIN
    expect(content).toContain('EUIN: E123456');
  });

  test('should schedule content for WhatsApp delivery', async () => {
    await page.goto('/advisor/content/create');
    
    // Generate content
    await page.fill('[data-testid="content-topic"]', 'Market update');
    await page.click('[data-testid="generate-content-button"]');
    
    await expect(page.locator('[data-testid="content-generated"]')).toBeVisible();
    
    // Schedule for delivery
    await page.click('[data-testid="schedule-delivery-button"]');
    
    // Select delivery time (06:00 IST default)
    await expect(page.locator('[data-testid="delivery-time"]')).toHaveValue('06:00');
    
    // Select delivery date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('[data-testid="delivery-date"]', dateString);
    
    // Select recipients
    await page.click('[data-testid="select-all-clients"]');
    
    // Confirm scheduling
    await page.click('[data-testid="confirm-schedule"]');
    
    // Verify scheduling confirmation
    await expect(page.locator('[data-testid="schedule-confirmed"]')).toBeVisible();
    await expect(page.locator('[data-testid="scheduled-count"]')).toContainText('250 clients');
    await expect(page.locator('[data-testid="delivery-eta"]')).toContainText('06:00 IST');
    
    // Verify in scheduled content list
    await page.click('[data-testid="view-scheduled"]');
    await expect(page).toHaveURL('/advisor/content/scheduled');
    
    await expect(page.locator('[data-testid="scheduled-item-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="scheduled-status-1"]')).toContainText('Pending');
  });

  test('should use fallback content when generation fails', async () => {
    await page.goto('/advisor/content/create');
    
    // Simulate AI service failure
    await page.route('**/api/ai/generate', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'AI service unavailable' })
      });
    });
    
    await page.fill('[data-testid="content-topic"]', 'Investment basics');
    await page.click('[data-testid="generate-content-button"]');
    
    // Should show fallback option
    await expect(page.locator('[data-testid="generation-failed"]')).toBeVisible();
    await expect(page.locator('[data-testid="use-fallback-button"]')).toBeVisible();
    
    // Use fallback content
    await page.click('[data-testid="use-fallback-button"]');
    
    // Should show pre-approved fallback content
    await expect(page.locator('[data-testid="fallback-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="fallback-badge"]')).toContainText('Pre-approved');
    
    // Fallback should be compliant
    await expect(page.locator('[data-testid="compliance-passed"]')).toBeVisible();
  });

  test('should track content performance metrics', async () => {
    await page.goto('/advisor/content/analytics');
    
    // View content performance
    await expect(page.locator('[data-testid="content-metrics"]')).toBeVisible();
    
    // Check engagement metrics
    const openRate = await page.locator('[data-testid="whatsapp-open-rate"]').textContent();
    expect(parseFloat(openRate!)).toBeGreaterThan(90); // WhatsApp typically >90%
    
    const clickRate = await page.locator('[data-testid="link-click-rate"]').textContent();
    expect(parseFloat(clickRate!)).toBeGreaterThan(0);
    
    // View best performing content
    await page.click('[data-testid="best-performing-tab"]');
    
    await expect(page.locator('[data-testid="top-content-list"]')).toBeVisible();
    const topContent = page.locator('[data-testid^="top-content-"]');
    await expect(topContent).toHaveCount(10);
    
    // Check content insights
    await topContent.first().click();
    
    await expect(page.locator('[data-testid="content-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-history"]')).toBeVisible();
  });

  test('should export compliant content for regulatory inspection', async () => {
    await page.goto('/advisor/content/history');
    
    // Select date range
    await page.fill('[data-testid="start-date"]', '2024-01-01');
    await page.fill('[data-testid="end-date"]', '2024-12-31');
    
    // Apply filters
    await page.selectOption('[data-testid="compliance-filter"]', 'all');
    
    // Export for audit
    await page.click('[data-testid="export-for-audit"]');
    
    // Select export format
    await page.click('[data-testid="export-format-pdf"]');
    
    // Include compliance certificates
    await page.check('[data-testid="include-compliance-certs"]');
    
    // Generate export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="generate-export"]');
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('compliance-export');
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // Verify export includes required elements
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-summary"]')).toContainText('SEBI-compliant');
  });

  test('should handle bulk content generation efficiently', async () => {
    await page.goto('/advisor/content/bulk');
    
    // Upload client segments
    await page.setInputFiles('[data-testid="segment-file"]', 'tests/fixtures/client-segments.csv');
    
    // Configure bulk generation
    await page.selectOption('[data-testid="content-type"]', 'personalized-tips');
    await page.selectOption('[data-testid="language"]', 'multi'); // Generate in client's preferred language
    
    // Set delivery schedule
    await page.fill('[data-testid="bulk-delivery-date"]', '2024-01-15');
    
    // Start bulk generation
    await page.click('[data-testid="start-bulk-generation"]');
    
    // Monitor progress
    await expect(page.locator('[data-testid="bulk-progress"]')).toBeVisible();
    
    // Should show batch processing
    await expect(page.locator('[data-testid="batch-1-status"]')).toContainText('Processing');
    
    // Wait for completion (with timeout for 250 pieces of content)
    await expect(page.locator('[data-testid="bulk-complete"]')).toBeVisible({
      timeout: 60000 // 1 minute for bulk processing
    });
    
    // Verify results
    const successCount = await page.locator('[data-testid="success-count"]').textContent();
    expect(parseInt(successCount!)).toBeGreaterThan(245); // >98% success rate
    
    // All should be compliant
    const complianceRate = await page.locator('[data-testid="bulk-compliance-rate"]').textContent();
    expect(parseFloat(complianceRate!)).toBeGreaterThanOrEqual(99);
  });

  test('should provide real-time compliance suggestions while typing', async () => {
    await page.goto('/advisor/content/create');
    
    // Enable manual input
    await page.click('[data-testid="manual-input-toggle"]');
    
    const contentInput = page.locator('[data-testid="content-input"]');
    
    // Type content gradually
    await contentInput.type('Invest in our top performing', { delay: 100 });
    
    // Should show suggestion for "top performing"
    await expect(page.locator('[data-testid="suggestion-superlative"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggestion-text"]')).toContainText(
      'Avoid superlative claims'
    );
    
    // Continue typing
    await contentInput.type(' mutual fund scheme', { delay: 100 });
    
    // Add risky phrase
    await contentInput.type(' for assured returns', { delay: 100 });
    
    // Should immediately flag "assured returns"
    await expect(page.locator('[data-testid="violation-assured-returns"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-score"]')).toContainText(/[0-4]\d/); // <50
    
    // Accept AI suggestion to fix
    await page.click('[data-testid="apply-suggestion"]');
    
    // Content should be corrected
    const correctedContent = await contentInput.inputValue();
    expect(correctedContent).not.toContain('assured returns');
    expect(correctedContent).toContain('subject to market risks');
  });
});