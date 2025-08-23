#!/usr/bin/env node

/**
 * Custom Playwright MCP Server for Claude Code
 * Provides browser automation and visual testing capabilities
 */

const { chromium, firefox, webkit, devices } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class PlaywrightMCPServer {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.screenshots = [];
    this.consoleLogs = [];
    
    // Default configuration
    this.config = {
      browser: 'chromium',
      headless: false,
      viewport: { width: 1920, height: 1080 },
      slowMo: 500,
      screenshotDir: './temp/screenshots'
    };
  }

  async initialize() {
    try {
      // Ensure screenshot directory exists
      await fs.mkdir(this.config.screenshotDir, { recursive: true });
      console.log('🎭 Playwright MCP Server initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Playwright MCP Server:', error);
      return false;
    }
  }

  async launchBrowser(options = {}) {
    try {
      const browserType = options.browser || this.config.browser;
      const launchOptions = {
        headless: options.headless ?? this.config.headless,
        slowMo: options.slowMo ?? this.config.slowMo,
        args: options.args || []
      };

      // Launch browser
      switch (browserType) {
        case 'firefox':
          this.browser = await firefox.launch(launchOptions);
          break;
        case 'webkit':
          this.browser = await webkit.launch(launchOptions);
          break;
        default:
          this.browser = await chromium.launch(launchOptions);
      }

      // Create context
      const contextOptions = {
        viewport: options.viewport || this.config.viewport,
        deviceScaleFactor: options.deviceScaleFactor || 1,
        isMobile: options.isMobile || false,
        hasTouch: options.hasTouch || false,
        ...options.contextOptions
      };

      this.context = await this.browser.newContext(contextOptions);
      this.page = await this.context.newPage();

      // Set up console logging
      this.page.on('console', msg => {
        const logEntry = {
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        };
        this.consoleLogs.push(logEntry);
        
        if (msg.type() === 'error') {
          console.log(`🐛 Console Error: ${msg.text()}`);
        }
      });

      // Set up network monitoring
      this.page.on('response', response => {
        if (response.status() >= 400) {
          console.log(`🌐 Network Error: ${response.status()} ${response.url()}`);
        }
      });

      console.log(`🚀 Browser launched: ${browserType}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to launch browser:', error);
      return false;
    }
  }

  async navigateToUrl(url, options = {}) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }

    try {
      const waitUntil = options.waitUntil || 'networkidle';
      await this.page.goto(url, { waitUntil, timeout: 30000 });
      console.log(`📍 Navigated to: ${url}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to navigate to ${url}:`, error);
      return false;
    }
  }

  async takeScreenshot(options = {}) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = options.filename || `screenshot-${timestamp}.png`;
      const fullPath = path.join(this.config.screenshotDir, filename);
      
      const screenshotOptions = {
        path: fullPath,
        fullPage: options.fullPage !== false, // Default to full page
        quality: options.quality || 90,
        type: options.type || 'png'
      };

      await this.page.screenshot(screenshotOptions);
      
      const screenshotInfo = {
        filename,
        path: fullPath,
        timestamp,
        url: this.page.url(),
        viewport: await this.page.viewportSize()
      };
      
      this.screenshots.push(screenshotInfo);
      console.log(`📸 Screenshot saved: ${filename}`);
      return screenshotInfo;
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error);
      return null;
    }
  }

  async setViewport(width, height) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }

    try {
      await this.page.setViewportSize({ width, height });
      console.log(`📏 Viewport set to: ${width}x${height}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to set viewport to ${width}x${height}:`, error);
      return false;
    }
  }

  async clickElement(selector) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }

    try {
      await this.page.click(selector);
      console.log(`👆 Clicked: ${selector}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to click ${selector}:`, error);
      return false;
    }
  }

  async fillInput(selector, text) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }

    try {
      await this.page.fill(selector, text);
      console.log(`✏️ Filled input ${selector}: ${text}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to fill ${selector}:`, error);
      return false;
    }
  }

  async getConsoleLogs() {
    return this.consoleLogs;
  }

  async getScreenshots() {
    return this.screenshots;
  }

  async runSEBIComplianceCheck() {
    if (!this.page) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }

    try {
      const checks = {
        disclaimer: false,
        euin: false,
        riskWarning: false,
        contactInfo: false
      };

      // Check for mutual fund disclaimer
      const disclaimerText = await this.page.locator('text=/mutual fund.*market risks/i').count();
      checks.disclaimer = disclaimerText > 0;

      // Check for EUIN
      const euinText = await this.page.locator('text=/EUIN/i').count();
      checks.euin = euinText > 0;

      // Check for risk warning
      const riskText = await this.page.locator('text=/risk|जोखिम/i').count();
      checks.riskWarning = riskText > 0;

      // Check for contact information
      const contactText = await this.page.locator('text=/contact|संपर्क/i').count();
      checks.contactInfo = contactText > 0;

      const passed = Object.values(checks).every(check => check);
      
      console.log('⚖️ SEBI Compliance Check:');
      console.log(`   Disclaimer: ${checks.disclaimer ? '✅' : '❌'}`);
      console.log(`   EUIN: ${checks.euin ? '✅' : '❌'}`);
      console.log(`   Risk Warning: ${checks.riskWarning ? '✅' : '❌'}`);
      console.log(`   Contact Info: ${checks.contactInfo ? '✅' : '❌'}`);
      console.log(`   Overall: ${passed ? 'PASS' : 'FAIL'}`);

      return { checks, passed };
    } catch (error) {
      console.error('❌ SEBI compliance check failed:', error);
      return { checks: {}, passed: false };
    }
  }

  async runResponsiveTest(url) {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    const results = [];

    for (const viewport of viewports) {
      try {
        await this.setViewport(viewport.width, viewport.height);
        await this.navigateToUrl(url);
        
        const screenshot = await this.takeScreenshot({
          filename: `responsive-${viewport.name.toLowerCase()}-${Date.now()}.png`
        });

        const sebiCheck = await this.runSEBIComplianceCheck();
        
        results.push({
          viewport: viewport.name,
          dimensions: `${viewport.width}x${viewport.height}`,
          screenshot: screenshot?.filename,
          sebiCompliant: sebiCheck.passed,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ ${viewport.name} test completed`);
      } catch (error) {
        console.error(`❌ ${viewport.name} test failed:`, error);
        results.push({
          viewport: viewport.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      screenshots: this.screenshots,
      consoleLogs: this.consoleLogs.filter(log => log.type === 'error'),
      summary: {
        totalScreenshots: this.screenshots.length,
        totalErrors: this.consoleLogs.filter(log => log.type === 'error').length,
        testDuration: Date.now()
      }
    };

    const reportPath = path.join(this.config.screenshotDir, `test-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Test report saved: ${reportPath}`);
    return report;
  }

  async close() {
    try {
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      console.log('🔒 Browser closed');
      return true;
    } catch (error) {
      console.error('❌ Failed to close browser:', error);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const server = new PlaywrightMCPServer();
  await server.initialize();

  try {
    switch (command) {
      case 'screenshot':
        const url = args[1] || 'http://localhost:3000';
        await server.launchBrowser();
        await server.navigateToUrl(url);
        await server.takeScreenshot();
        break;

      case 'responsive-test':
        const testUrl = args[1] || 'http://localhost:3000';
        await server.launchBrowser();
        const results = await server.runResponsiveTest(testUrl);
        console.log('\n📊 Responsive Test Results:', results);
        break;

      case 'compliance-check':
        const complianceUrl = args[1] || 'http://localhost:3000';
        await server.launchBrowser();
        await server.navigateToUrl(complianceUrl);
        await server.runSEBIComplianceCheck();
        break;

      default:
        console.log('🎭 Playwright MCP Server');
        console.log('Usage:');
        console.log('  node playwright-mcp-server.js screenshot [url]');
        console.log('  node playwright-mcp-server.js responsive-test [url]');
        console.log('  node playwright-mcp-server.js compliance-check [url]');
    }
  } catch (error) {
    console.error('❌ Command failed:', error);
  } finally {
    await server.close();
  }
}

// Export for use in other modules
module.exports = PlaywrightMCPServer;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}