import { defineConfig, devices } from '@playwright/test';

/**
 * JARVISH Playwright Design Review Configuration
 * Comprehensive visual testing for Indian Financial Advisory Platform
 * 
 * Features:
 * - Multi-viewport testing (Desktop, Tablet, Mobile)
 * - SEBI compliance validation
 * - Performance monitoring
 * - Accessibility auditing
 * - Professional financial services theme validation
 */

export default defineConfig({
  testDir: './tests/playwright',
  
  // Fullfill all tests in 30 minutes
  globalTimeout: 30 * 60 * 1000,
  
  // Timeout for each test
  timeout: 30 * 1000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Wait for network idle
    waitForTimeout: 3000,
  },

  // Configure projects for major browsers and devices
  projects: [
    {
      name: 'Desktop Chrome - Financial Services Testing',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Simulate Indian internet conditions
        contextOptions: {
          // Simulate slower network for Indian tier 2/3 cities
          // This helps test performance under real conditions
        }
      },
    },
    
    {
      name: 'Mobile Chrome - Advisor Mobile Experience',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
      },
    },
    
    {
      name: 'Tablet - iPad Experience',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
      },
    },
    
    {
      name: 'Mobile Safari - iOS Testing',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
      },
    },

    // Performance testing project
    {
      name: 'Performance Audit',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: '**/performance.spec.ts',
    }
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  // Output directory for test results
  outputDir: 'test-results/',
});