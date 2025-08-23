/**
 * E2E Test: WhatsApp Delivery System
 * Critical Path: 06:00 IST delivery with 99% SLA
 */

import { test, expect, Page } from '@playwright/test';

test.describe('WhatsApp Delivery System', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      timezone: 'Asia/Kolkata' // IST timezone
    });
    page = await context.newPage();
    
    // Login as advisor
    await page.goto('/sign-in');
    await page.fill('[data-testid="email"]', 'advisor@example.com');
    await page.fill('[data-testid="password"]', 'Password@123');
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/advisor/dashboard');
  });

  test('should schedule content for 06:00 IST delivery', async () => {
    await page.goto('/advisor/delivery/schedule');
    
    // Create new scheduled delivery
    await page.click('[data-testid="new-schedule"]');
    
    // Verify default time is 06:00 IST
    const defaultTime = await page.locator('[data-testid="delivery-time"]').inputValue();
    expect(defaultTime).toBe('06:00');
    
    // Select content
    await page.click('[data-testid="select-content"]');
    await page.click('[data-testid="content-item-latest"]');
    
    // Select recipients
    await page.click('[data-testid="recipient-selection"]');
    await page.click('[data-testid="select-all-active"]');
    
    const recipientCount = await page.locator('[data-testid="recipient-count"]').textContent();
    expect(parseInt(recipientCount!)).toBeGreaterThan(0);
    
    // Schedule for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('[data-testid="schedule-date"]', dateString);
    
    // Confirm scheduling
    await page.click('[data-testid="confirm-schedule"]');
    
    // Verify scheduling confirmation
    await expect(page.locator('[data-testid="schedule-success"]')).toBeVisible();
    
    // Check scheduled queue
    await page.goto('/advisor/delivery/queue');
    
    await expect(page.locator('[data-testid="queue-item-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="queue-status-1"]')).toContainText('Scheduled');
    await expect(page.locator('[data-testid="queue-time-1"]')).toContainText('06:00 IST');
  });

  test('should monitor real-time delivery status', async () => {
    await page.goto('/advisor/delivery/monitor');
    
    // Check delivery dashboard
    await expect(page.locator('[data-testid="delivery-dashboard"]')).toBeVisible();
    
    // Verify SLA metrics
    const slaRate = await page.locator('[data-testid="current-sla"]').textContent();
    expect(parseFloat(slaRate!)).toBeGreaterThanOrEqual(99);
    
    // Check delivery statistics
    const delivered = await page.locator('[data-testid="messages-delivered"]').textContent();
    const failed = await page.locator('[data-testid="messages-failed"]').textContent();
    const pending = await page.locator('[data-testid="messages-pending"]').textContent();
    
    // Calculate success rate
    const deliveredCount = parseInt(delivered!);
    const failedCount = parseInt(failed!);
    const successRate = (deliveredCount / (deliveredCount + failedCount)) * 100;
    
    expect(successRate).toBeGreaterThanOrEqual(99);
    
    // Check delivery time performance
    const avgDeliveryTime = await page.locator('[data-testid="avg-delivery-time"]').textContent();
    expect(parseFloat(avgDeliveryTime!)).toBeLessThan(5); // Within 5 minutes of 06:00
    
    // View real-time updates
    await page.click('[data-testid="live-view-toggle"]');
    
    // Should show live delivery feed
    await expect(page.locator('[data-testid="live-feed"]')).toBeVisible();
    
    // Wait for a delivery update (mock or real)
    await expect(page.locator('[data-testid^="delivery-update-"]')).toBeVisible({
      timeout: 10000
    });
  });

  test('should handle fallback content assignment at 21:30 IST', async () => {
    // Set time to 21:30 IST (mock)
    await page.evaluate(() => {
      const mockDate = new Date();
      mockDate.setHours(21, 30, 0, 0);
      Date.now = () => mockDate.getTime();
    });
    
    await page.goto('/advisor/delivery/fallback');
    
    // Check advisors without content
    await expect(page.locator('[data-testid="advisors-without-content"]')).toBeVisible();
    
    const needsFallback = await page.locator('[data-testid="needs-fallback-count"]').textContent();
    
    if (parseInt(needsFallback!) > 0) {
      // Trigger fallback assignment
      await page.click('[data-testid="assign-fallback"]');
      
      // Verify fallback selection
      await expect(page.locator('[data-testid="fallback-selecting"]')).toBeVisible();
      
      // Wait for assignment
      await expect(page.locator('[data-testid="fallback-assigned"]')).toBeVisible({
        timeout: 5000
      });
      
      // Verify all advisors now have content
      const assigned = await page.locator('[data-testid="fallback-assigned-count"]').textContent();
      expect(assigned).toBe(needsFallback);
      
      // Verify fallback content is pre-approved
      await page.click('[data-testid="view-fallback-content"]');
      await expect(page.locator('[data-testid="pre-approved-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="compliance-score"]')).toContainText('100%');
    }
  });

  test('should rotate between multiple WhatsApp numbers', async () => {
    await page.goto('/advisor/settings/whatsapp');
    
    // View configured numbers
    await expect(page.locator('[data-testid="whatsapp-numbers-list"]')).toBeVisible();
    
    const numbers = page.locator('[data-testid^="whatsapp-number-"]');
    const numberCount = await numbers.count();
    
    expect(numberCount).toBeGreaterThanOrEqual(2); // At least 2 numbers for rotation
    
    // Check quality ratings
    for (let i = 0; i < numberCount; i++) {
      const quality = await numbers.nth(i).locator('[data-testid="quality-rating"]').textContent();
      expect(['GREEN', 'YELLOW', 'RED']).toContain(quality);
      
      // Verify GREEN quality numbers are prioritized
      if (quality === 'GREEN') {
        const priority = await numbers.nth(i).locator('[data-testid="priority"]').textContent();
        expect(parseInt(priority!)).toBeLessThanOrEqual(2);
      }
    }
    
    // Test number rotation in delivery
    await page.goto('/advisor/delivery/test');
    
    // Send test messages
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="send-test-message"]');
      await page.waitForTimeout(1000);
      
      // Check which number was used
      const usedNumber = await page.locator('[data-testid="last-used-number"]').textContent();
      expect(usedNumber).toBeTruthy();
    }
    
    // Verify rotation happened
    const usageStats = await page.locator('[data-testid="number-usage-stats"]').textContent();
    expect(usageStats).toContain('distributed');
  });

  test('should handle delivery failures and retry logic', async () => {
    await page.goto('/advisor/delivery/monitor');
    
    // Find a failed delivery (if any)
    const failedDeliveries = page.locator('[data-testid^="failed-delivery-"]');
    const failedCount = await failedDeliveries.count();
    
    if (failedCount > 0) {
      // Click on first failed delivery
      await failedDeliveries.first().click();
      
      // View failure details
      await expect(page.locator('[data-testid="failure-modal"]')).toBeVisible();
      
      const failureReason = await page.locator('[data-testid="failure-reason"]').textContent();
      expect(failureReason).toBeTruthy();
      
      // Check retry attempts
      const retryAttempts = await page.locator('[data-testid="retry-attempts"]').textContent();
      expect(parseInt(retryAttempts!)).toBeLessThanOrEqual(3);
      
      // Manual retry
      await page.click('[data-testid="manual-retry"]');
      
      await expect(page.locator('[data-testid="retry-initiated"]')).toBeVisible();
      
      // Wait for retry result
      await expect(page.locator('[data-testid="retry-result"]')).toBeVisible({
        timeout: 10000
      });
    }
  });

  test('should track WhatsApp template quality ratings', async () => {
    await page.goto('/advisor/whatsapp/templates');
    
    // View template list
    await expect(page.locator('[data-testid="templates-list"]')).toBeVisible();
    
    const templates = page.locator('[data-testid^="template-"]');
    const templateCount = await templates.count();
    
    expect(templateCount).toBeGreaterThan(0);
    
    // Check each template's quality
    for (let i = 0; i < Math.min(templateCount, 5); i++) {
      const template = templates.nth(i);
      
      const status = await template.locator('[data-testid="template-status"]').textContent();
      expect(['APPROVED', 'PENDING', 'REJECTED']).toContain(status);
      
      if (status === 'APPROVED') {
        const quality = await template.locator('[data-testid="template-quality"]').textContent();
        expect(['GREEN', 'YELLOW', 'RED', 'UNKNOWN']).toContain(quality);
        
        // GREEN quality templates should be preferred
        if (quality === 'GREEN') {
          const usageCount = await template.locator('[data-testid="usage-count"]').textContent();
          expect(parseInt(usageCount!)).toBeGreaterThan(0);
        }
      }
    }
    
    // Create new template
    await page.click('[data-testid="create-template"]');
    
    await page.fill('[data-testid="template-name"]', 'test_daily_tip');
    await page.fill('[data-testid="template-content"]', 
      '{{1}}, here\'s your daily investment tip: {{2}}. ' +
      'Mutual funds are subject to market risks. Read all scheme documents carefully.'
    );
    
    await page.selectOption('[data-testid="template-category"]', 'MARKETING');
    await page.selectOption('[data-testid="template-language"]', 'en');
    
    // Submit for approval
    await page.click('[data-testid="submit-template"]');
    
    await expect(page.locator('[data-testid="template-submitted"]')).toBeVisible();
    await expect(page.locator('[data-testid="approval-status"]')).toContainText('PENDING');
  });

  test('should provide delivery analytics and insights', async () => {
    await page.goto('/advisor/analytics/delivery');
    
    // Check delivery metrics
    await expect(page.locator('[data-testid="delivery-analytics"]')).toBeVisible();
    
    // Daily delivery stats
    const dailyDelivered = await page.locator('[data-testid="daily-delivered"]').textContent();
    expect(parseInt(dailyDelivered!)).toBeGreaterThan(0);
    
    // Peak delivery time analysis
    const peakTime = await page.locator('[data-testid="peak-delivery-time"]').textContent();
    expect(peakTime).toContain('06:');
    
    // Client engagement metrics
    const readRate = await page.locator('[data-testid="message-read-rate"]').textContent();
    expect(parseFloat(readRate!)).toBeGreaterThan(90); // WhatsApp typically >90%
    
    // Response rate
    const responseRate = await page.locator('[data-testid="client-response-rate"]').textContent();
    expect(parseFloat(responseRate!)).toBeGreaterThan(0);
    
    // View trends
    await page.click('[data-testid="view-trends"]');
    
    // Should show delivery trend chart
    await expect(page.locator('[data-testid="delivery-trend-chart"]')).toBeVisible();
    
    // Check for SLA compliance over time
    await page.click('[data-testid="sla-compliance-tab"]');
    
    const slaHistory = page.locator('[data-testid^="sla-day-"]');
    const historyCount = await slaHistory.count();
    
    let slaMetDays = 0;
    for (let i = 0; i < historyCount; i++) {
      const daySlA = await slaHistory.nth(i).textContent();
      if (parseFloat(daySlA!) >= 99) {
        slaMetDays++;
      }
    }
    
    // Should meet SLA most days
    expect(slaMetDays / historyCount).toBeGreaterThan(0.95);
  });

  test('should handle bulk WhatsApp delivery efficiently', async () => {
    await page.goto('/advisor/delivery/bulk');
    
    // Upload recipient list
    await page.setInputFiles('[data-testid="recipient-file"]', 'tests/fixtures/bulk-recipients.csv');
    
    // Verify recipient count
    const recipientCount = await page.locator('[data-testid="uploaded-count"]').textContent();
    expect(parseInt(recipientCount!)).toBe(250); // Test file has 250 recipients
    
    // Select content
    await page.click('[data-testid="select-bulk-content"]');
    await page.click('[data-testid="content-approved-latest"]');
    
    // Configure delivery
    await page.selectOption('[data-testid="delivery-speed"]', 'optimized'); // Rate-limited delivery
    
    // Start bulk send
    await page.click('[data-testid="start-bulk-delivery"]');
    
    // Monitor progress
    await expect(page.locator('[data-testid="bulk-progress-bar"]')).toBeVisible();
    
    // Should show batching (25 messages per batch due to rate limits)
    await expect(page.locator('[data-testid="current-batch"]')).toBeVisible();
    const batchInfo = await page.locator('[data-testid="batch-info"]').textContent();
    expect(batchInfo).toContain('25'); // Batch size
    
    // Wait for some progress
    await page.waitForTimeout(5000);
    
    // Check delivery rate
    const deliveryRate = await page.locator('[data-testid="delivery-rate"]').textContent();
    expect(parseFloat(deliveryRate!)).toBeLessThanOrEqual(25); // Max 25 per second
    
    // Verify no rate limit errors
    const rateLimitErrors = await page.locator('[data-testid="rate-limit-errors"]').textContent();
    expect(parseInt(rateLimitErrors!)).toBe(0);
  });

  test('should provide emergency delivery controls', async () => {
    await page.goto('/advisor/delivery/emergency');
    
    // Emergency pause button should be visible
    await expect(page.locator('[data-testid="emergency-pause"]')).toBeVisible();
    
    // Test emergency pause
    await page.click('[data-testid="emergency-pause"]');
    
    // Confirm dialog
    await page.click('[data-testid="confirm-pause"]');
    
    // Verify all deliveries paused
    await expect(page.locator('[data-testid="delivery-status"]')).toContainText('PAUSED');
    await expect(page.locator('[data-testid="pause-reason"]')).toBeVisible();
    
    // Check queue status
    await page.goto('/advisor/delivery/queue');
    await expect(page.locator('[data-testid="queue-paused-banner"]')).toBeVisible();
    
    // Resume deliveries
    await page.goto('/advisor/delivery/emergency');
    await page.click('[data-testid="resume-delivery"]');
    
    // Add resume reason
    await page.fill('[data-testid="resume-reason"]', 'Issue resolved');
    await page.click('[data-testid="confirm-resume"]');
    
    // Verify resumed
    await expect(page.locator('[data-testid="delivery-status"]')).toContainText('ACTIVE');
    
    // Check if catch-up delivery is offered
    await expect(page.locator('[data-testid="catch-up-option"]')).toBeVisible();
    
    // Enable catch-up for missed deliveries
    await page.check('[data-testid="enable-catch-up"]');
    await page.click('[data-testid="start-catch-up"]');
    
    await expect(page.locator('[data-testid="catch-up-progress"]')).toBeVisible();
  });
});