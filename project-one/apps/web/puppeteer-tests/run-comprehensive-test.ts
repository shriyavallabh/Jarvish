#!/usr/bin/env node

import puppeteer, { Browser, Page } from 'puppeteer';
import { AccessibilityTester } from './core/accessibility-tester';
import { VisualRegressionTester } from './core/visual-regression-tester';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface TestResult {
  category: string;
  issues: any[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

class ComprehensiveUITester {
  private browser!: Browser;
  private results: TestResult[] = [];
  private baseUrl: string = 'http://localhost:3000';

  async initialize() {
    console.log('🚀 Initializing Comprehensive UI Testing Suite...\n');
    
    // Check if Next.js server is running
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        console.log('⚠️  Next.js server not responding. Starting dev server...');
        this.startDevServer();
        await this.waitForServer();
      }
    } catch (error) {
      console.log('⚠️  Next.js server not running. Starting dev server...');
      this.startDevServer();
      await this.waitForServer();
    }

    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
  }

  private startDevServer() {
    console.log('Starting Next.js development server...');
    execSync('npm run dev &', { 
      stdio: 'ignore',
      shell: true
    });
  }

  private async waitForServer(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(this.baseUrl);
        if (response.ok) {
          console.log('✅ Server is ready!\n');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Server failed to start');
  }

  async runAllTests() {
    const pages = [
      { name: 'Landing Page', path: '/' },
      { name: 'Advisor Overview', path: '/overview' },
      { name: 'Admin Approval Queue', path: '/approval-queue' }
    ];

    for (const pageConfig of pages) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📄 Testing: ${pageConfig.name}`);
      console.log('='.repeat(60));
      
      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      try {
        await page.goto(`${this.baseUrl}${pageConfig.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Run all test categories
        await this.testHeaderVisibility(page, pageConfig.name);
        await this.testColorContrast(page, pageConfig.name);
        await this.testSkipLinks(page, pageConfig.name);
        await this.testTypography(page, pageConfig.name);
        await this.testSpacing(page, pageConfig.name);
        await this.testResponsiveness(page, pageConfig.name);
        await this.testAccessibility(page, pageConfig.name);
        await this.testLayoutIssues(page, pageConfig.name);
        
      } catch (error) {
        console.error(`❌ Error testing ${pageConfig.name}:`, error);
      } finally {
        await page.close();
      }
    }

    await this.generateFinalReport();
  }

  async testHeaderVisibility(page: Page, pageName: string) {
    console.log('\n🔍 Testing Header Visibility...');
    
    const issues = await page.evaluate(() => {
      const problems: any[] = [];
      const header = document.querySelector('header, [role="banner"], .header, nav');
      
      if (!header) {
        problems.push({
          type: 'missing-header',
          severity: 'high',
          details: 'No header element found on the page'
        });
        return problems;
      }

      const styles = window.getComputedStyle(header);
      const rect = header.getBoundingClientRect();
      
      // Check visibility
      if (rect.height === 0) {
        problems.push({
          type: 'invisible-header',
          severity: 'critical',
          details: 'Header has zero height'
        });
      }

      // Check background
      let bgColor = styles.backgroundColor;
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        problems.push({
          type: 'transparent-header',
          severity: 'high',
          details: 'Header has transparent background'
        });
      }

      // Check text visibility
      const headerTexts = header.querySelectorAll('a, span, p, h1, h2, h3, button');
      headerTexts.forEach(text => {
        const textStyles = window.getComputedStyle(text);
        const textColor = textStyles.color;
        
        // Get actual background
        let actualBg = bgColor;
        let parent = text.parentElement;
        while (actualBg === 'rgba(0, 0, 0, 0)' && parent) {
          actualBg = window.getComputedStyle(parent).backgroundColor;
          parent = parent.parentElement;
        }
        
        // Simple visibility check
        if (textColor === actualBg) {
          problems.push({
            type: 'invisible-text',
            severity: 'critical',
            element: text.textContent?.substring(0, 30),
            details: `Text color matches background: ${textColor}`
          });
        }
      });

      return problems;
    });

    if (issues.length > 0) {
      this.results.push({
        category: 'Header Visibility',
        issues,
        severity: issues.some(i => i.severity === 'critical') ? 'critical' : 'high'
      });
    }

    console.log(`  Found ${issues.length} header visibility issues`);
  }

  async testColorContrast(page: Page, pageName: string) {
    console.log('\n🎨 Testing Color Contrast...');
    
    const issues = await page.evaluate(() => {
      const problems: any[] = [];
      
      const getLuminance = (rgb: string) => {
        const match = rgb.match(/\d+/g);
        if (!match) return 0;
        const [r, g, b] = match.map(n => parseInt(n) / 255);
        const [rs, gs, bs] = [r, g, b].map(c => 
          c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      const getContrast = (color1: string, color2: string) => {
        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };

      const elements = document.querySelectorAll('*');
      const darkOnDark: any[] = [];
      const lightOnLight: any[] = [];
      
      elements.forEach(el => {
        if (!el.textContent?.trim()) return;
        
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        let bgColor = styles.backgroundColor;
        
        // Find actual background
        let parent = el.parentElement;
        while (bgColor === 'rgba(0, 0, 0, 0)' && parent) {
          bgColor = window.getComputedStyle(parent).backgroundColor;
          parent = parent.parentElement;
        }
        
        if (bgColor === 'rgba(0, 0, 0, 0)') {
          bgColor = 'rgb(255, 255, 255)';
        }
        
        const contrast = getContrast(color, bgColor);
        
        if (contrast < 3) { // Very low contrast
          const colorLum = getLuminance(color);
          const bgLum = getLuminance(bgColor);
          
          if (colorLum < 0.5 && bgLum < 0.5) {
            darkOnDark.push({
              type: 'dark-on-dark',
              element: el.tagName.toLowerCase(),
              text: el.textContent?.substring(0, 30),
              textColor: color,
              bgColor: bgColor,
              contrast: contrast.toFixed(2)
            });
          } else if (colorLum > 0.5 && bgLum > 0.5) {
            lightOnLight.push({
              type: 'light-on-light',
              element: el.tagName.toLowerCase(),
              text: el.textContent?.substring(0, 30),
              textColor: color,
              bgColor: bgColor,
              contrast: contrast.toFixed(2)
            });
          }
        }
      });
      
      return [...darkOnDark.slice(0, 10), ...lightOnLight.slice(0, 10)];
    });

    if (issues.length > 0) {
      this.results.push({
        category: 'Color Contrast',
        issues,
        severity: 'critical'
      });
    }

    console.log(`  Found ${issues.length} color contrast issues`);
  }

  async testSkipLinks(page: Page, pageName: string) {
    console.log('\n🔗 Testing Skip Links...');
    
    const issues = await page.evaluate(() => {
      const problems: any[] = [];
      
      // Look for skip links
      const skipLinks = document.querySelectorAll(
        'a[href="#main"], a[href="#content"], [class*="skip"], a:first-of-type'
      );
      
      skipLinks.forEach(link => {
        if (link.textContent?.toLowerCase().includes('skip')) {
          const styles = window.getComputedStyle(link);
          const rect = link.getBoundingClientRect();
          
          // Check if visible when shouldn't be
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           rect.left >= 0 && rect.top >= 0 &&
                           styles.opacity !== '0' && styles.visibility !== 'hidden';
          
          if (isVisible && !link.matches(':focus')) {
            problems.push({
              type: 'skip-link-visible',
              text: link.textContent,
              position: `(${Math.round(rect.left)}, ${Math.round(rect.top)})`,
              details: 'Skip to main content link is inappropriately visible'
            });
          }
        }
      });
      
      // Check for text that shouldn't be visible
      const allTexts = document.querySelectorAll('*');
      allTexts.forEach(el => {
        if (el.textContent?.toLowerCase().includes('skip to main') && 
            !el.querySelector('a')) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            problems.push({
              type: 'orphaned-skip-text',
              text: el.textContent,
              element: el.tagName.toLowerCase(),
              details: 'Skip text appearing without proper link structure'
            });
          }
        }
      });
      
      return problems;
    });

    if (issues.length > 0) {
      this.results.push({
        category: 'Skip Links',
        issues,
        severity: 'medium'
      });
    }

    console.log(`  Found ${issues.length} skip link issues`);
  }

  async testTypography(page: Page, pageName: string) {
    console.log('\n📝 Testing Typography...');
    
    const issues = await page.evaluate(() => {
      const problems: any[] = [];
      const texts = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li');
      
      texts.forEach(element => {
        const styles = window.getComputedStyle(element);
        const fontSize = parseFloat(styles.fontSize);
        const lineHeight = parseFloat(styles.lineHeight);
        const fontWeight = styles.fontWeight;
        
        // Check readability
        if (fontSize < 12 && element.textContent?.trim()) {
          problems.push({
            type: 'small-font',
            element: element.tagName.toLowerCase(),
            fontSize: `${fontSize}px`,
            text: element.textContent?.substring(0, 30)
          });
        }
        
        // Check line height for paragraphs
        if (element.tagName === 'P' && lineHeight / fontSize < 1.4) {
          problems.push({
            type: 'tight-line-height',
            element: element.tagName.toLowerCase(),
            ratio: (lineHeight / fontSize).toFixed(2),
            text: element.textContent?.substring(0, 30)
          });
        }
        
        // Check font weight consistency
        if (element.tagName.match(/H[1-6]/) && parseInt(fontWeight) < 500) {
          problems.push({
            type: 'weak-heading',
            element: element.tagName.toLowerCase(),
            fontWeight,
            text: element.textContent?.substring(0, 30)
          });
        }
      });
      
      return problems.slice(0, 20); // Limit to top 20 issues
    });

    if (issues.length > 0) {
      this.results.push({
        category: 'Typography',
        issues,
        severity: 'medium'
      });
    }

    console.log(`  Found ${issues.length} typography issues`);
  }

  async testSpacing(page: Page, pageName: string) {
    console.log('\n📏 Testing Spacing...');
    
    const issues = await page.evaluate(() => {
      const problems: any[] = [];
      const containers = document.querySelectorAll('div, section, article, main');
      
      containers.forEach(element => {
        const styles = window.getComputedStyle(element);
        const padding = {
          top: parseFloat(styles.paddingTop),
          right: parseFloat(styles.paddingRight),
          bottom: parseFloat(styles.paddingBottom),
          left: parseFloat(styles.paddingLeft)
        };
        
        // Check for missing padding on content containers
        if (element.children.length > 0 && element.textContent?.trim()) {
          const totalPadding = padding.top + padding.right + padding.bottom + padding.left;
          if (totalPadding === 0) {
            problems.push({
              type: 'no-padding',
              element: element.className || element.tagName.toLowerCase(),
              details: 'Content container has no padding'
            });
          }
        }
        
        // Check for inconsistent spacing
        if (padding.left !== padding.right && Math.abs(padding.left - padding.right) > 5) {
          problems.push({
            type: 'asymmetric-padding',
            element: element.className || element.tagName.toLowerCase(),
            left: `${padding.left}px`,
            right: `${padding.right}px`
          });
        }
      });
      
      return problems.slice(0, 15);
    });

    if (issues.length > 0) {
      this.results.push({
        category: 'Spacing',
        issues,
        severity: 'low'
      });
    }

    console.log(`  Found ${issues.length} spacing issues`);
  }

  async testResponsiveness(page: Page, pageName: string) {
    console.log('\n📱 Testing Responsiveness...');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    const issues: any[] = [];
    
    for (const viewport of viewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.reload({ waitUntil: 'networkidle2' });
      
      const viewportIssues = await page.evaluate((vp) => {
        const problems: any[] = [];
        
        // Check for horizontal overflow
        if (document.documentElement.scrollWidth > window.innerWidth) {
          problems.push({
            type: 'horizontal-overflow',
            viewport: vp.name,
            overflow: `${document.documentElement.scrollWidth - window.innerWidth}px`
          });
        }
        
        // Check for elements outside viewport
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth && rect.width > 0) {
            problems.push({
              type: 'element-overflow',
              viewport: vp.name,
              element: el.className || el.tagName.toLowerCase(),
              overflow: `${rect.right - window.innerWidth}px`
            });
          }
        });
        
        return problems;
      }, viewport);
      
      issues.push(...viewportIssues);
    }
    
    if (issues.length > 0) {
      this.results.push({
        category: 'Responsiveness',
        issues: issues.slice(0, 10),
        severity: 'high'
      });
    }

    console.log(`  Found ${issues.length} responsiveness issues`);
  }

  async testAccessibility(page: Page, pageName: string) {
    console.log('\n♿ Testing Accessibility...');
    
    const accessibilityTester = new AccessibilityTester(page);
    const results = await accessibilityTester.runFullAudit(pageName);
    
    const criticalIssues = results.violations.filter(v => 
      v.impact === 'critical' || v.impact === 'serious'
    );
    
    if (criticalIssues.length > 0) {
      this.results.push({
        category: 'Accessibility',
        issues: criticalIssues.map(v => ({
          type: v.id,
          impact: v.impact,
          description: v.description,
          instances: v.nodes.length
        })),
        severity: 'critical'
      });
    }

    console.log(`  Found ${criticalIssues.length} critical accessibility issues`);
  }

  async testLayoutIssues(page: Page, pageName: string) {
    console.log('\n🔧 Testing Layout...');
    
    const visualTester = new VisualRegressionTester(page);
    const layoutIssues = await visualTester.checkLayoutIssues();
    
    const allIssues = [
      ...layoutIssues.overlapping,
      ...layoutIssues.overflow,
      ...layoutIssues.brokenLayouts
    ];
    
    if (allIssues.length > 0) {
      this.results.push({
        category: 'Layout',
        issues: allIssues.slice(0, 10),
        severity: 'medium'
      });
    }

    console.log(`  Found ${allIssues.length} layout issues`);
  }

  async generateFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));
    
    const criticalIssues = this.results.filter(r => r.severity === 'critical');
    const highIssues = this.results.filter(r => r.severity === 'high');
    const mediumIssues = this.results.filter(r => r.severity === 'medium');
    const lowIssues = this.results.filter(r => r.severity === 'low');
    
    console.log(`\n🔴 Critical Issues: ${criticalIssues.length}`);
    criticalIssues.forEach(result => {
      console.log(`  - ${result.category}: ${result.issues.length} issues`);
    });
    
    console.log(`\n🟠 High Priority Issues: ${highIssues.length}`);
    highIssues.forEach(result => {
      console.log(`  - ${result.category}: ${result.issues.length} issues`);
    });
    
    console.log(`\n🟡 Medium Priority Issues: ${mediumIssues.length}`);
    mediumIssues.forEach(result => {
      console.log(`  - ${result.category}: ${result.issues.length} issues`);
    });
    
    console.log(`\n🟢 Low Priority Issues: ${lowIssues.length}`);
    lowIssues.forEach(result => {
      console.log(`  - ${result.category}: ${result.issues.length} issues`);
    });
    
    // Save detailed report
    const reportDir = path.join(process.cwd(), 'puppeteer-tests', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `comprehensive-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);
    
    // Generate HTML summary
    await this.generateHTMLSummary();
  }

  async generateHTMLSummary() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Test Report - Financial Advisory Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: #f5f7fa;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .severity-critical { border-left: 4px solid #dc3545; }
    .severity-high { border-left: 4px solid #ff9800; }
    .severity-medium { border-left: 4px solid #ffc107; }
    .severity-low { border-left: 4px solid #28a745; }
    .issue-list {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .issue-item {
      padding: 10px;
      margin: 10px 0;
      background: #f8f9fa;
      border-radius: 5px;
    }
    h2 { margin-bottom: 15px; color: #333; }
    .count { font-size: 2em; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 Comprehensive UI Test Report</h1>
    <p>Financial Advisory Platform - ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="summary-grid">
    ${['critical', 'high', 'medium', 'low'].map(severity => {
      const count = this.results.filter(r => r.severity === severity).length;
      return `
        <div class="summary-card severity-${severity}">
          <div class="count">${count}</div>
          <div>${severity.toUpperCase()} Issues</div>
        </div>
      `;
    }).join('')}
  </div>
  
  ${this.results.map(result => `
    <div class="issue-list">
      <h2>${result.category} (${result.severity})</h2>
      ${result.issues.slice(0, 5).map(issue => `
        <div class="issue-item">
          ${JSON.stringify(issue, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}
        </div>
      `).join('')}
      ${result.issues.length > 5 ? `<p>... and ${result.issues.length - 5} more issues</p>` : ''}
    </div>
  `).join('')}
</body>
</html>`;
    
    const htmlPath = path.join(process.cwd(), 'puppeteer-tests', 'reports', `summary-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 HTML summary saved to: ${htmlPath}`);
  }

  async cleanup() {
    await this.browser.close();
  }
}

// Main execution
(async () => {
  const tester = new ComprehensiveUITester();
  
  try {
    await tester.initialize();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
})();