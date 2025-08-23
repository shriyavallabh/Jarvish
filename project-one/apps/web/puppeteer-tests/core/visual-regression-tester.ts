import { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface VisualRegressionResult {
  page: string;
  viewport: string;
  diffPixels: number;
  diffPercentage: number;
  passed: boolean;
  baselineExists: boolean;
  diffImagePath?: string;
}

export class VisualRegressionTester {
  private page: Page;
  private baselineDir: string;
  private currentDir: string;
  private diffDir: string;

  constructor(page: Page) {
    this.page = page;
    const testDir = path.join(process.cwd(), 'puppeteer-tests', 'visual-regression');
    this.baselineDir = path.join(testDir, 'baseline');
    this.currentDir = path.join(testDir, 'current');
    this.diffDir = path.join(testDir, 'diff');
    
    // Create directories if they don't exist
    [this.baselineDir, this.currentDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async captureAndCompare(
    pageName: string,
    options: {
      viewport?: { width: number; height: number };
      threshold?: number;
      hideSelectors?: string[];
      waitForSelector?: string;
      updateBaseline?: boolean;
    } = {}
  ): Promise<VisualRegressionResult> {
    const {
      viewport = { width: 1920, height: 1080 },
      threshold = 0.1,
      hideSelectors = [],
      waitForSelector,
      updateBaseline = false
    } = options;

    // Set viewport
    await this.page.setViewport(viewport);
    
    // Wait for content to load
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector);
    }
    
    // Hide dynamic content
    if (hideSelectors.length > 0) {
      await this.page.evaluate((selectors) => {
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el: any) => {
            el.style.visibility = 'hidden';
          });
        });
      }, hideSelectors);
    }
    
    // Take screenshot
    const screenshotName = `${pageName}-${viewport.width}x${viewport.height}.png`;
    const currentPath = path.join(this.currentDir, screenshotName);
    const baselinePath = path.join(this.baselineDir, screenshotName);
    const diffPath = path.join(this.diffDir, screenshotName);
    
    await this.page.screenshot({ 
      path: currentPath,
      fullPage: true 
    });
    
    // If baseline doesn't exist or we're updating, save current as baseline
    if (!fs.existsSync(baselinePath) || updateBaseline) {
      fs.copyFileSync(currentPath, baselinePath);
      return {
        page: pageName,
        viewport: `${viewport.width}x${viewport.height}`,
        diffPixels: 0,
        diffPercentage: 0,
        passed: true,
        baselineExists: false
      };
    }
    
    // Compare with baseline
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const current = PNG.sync.read(fs.readFileSync(currentPath));
    const { width, height } = baseline;
    const diff = new PNG({ width, height });
    
    const diffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      { threshold }
    );
    
    const totalPixels = width * height;
    const diffPercentage = (diffPixels / totalPixels) * 100;
    
    // Save diff image if there are differences
    if (diffPixels > 0) {
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
    }
    
    return {
      page: pageName,
      viewport: `${viewport.width}x${viewport.height}`,
      diffPixels,
      diffPercentage,
      passed: diffPercentage < 0.5, // Less than 0.5% difference
      baselineExists: true,
      diffImagePath: diffPixels > 0 ? diffPath : undefined
    };
  }

  async testResponsiveDesign(
    pageName: string,
    url: string
  ): Promise<Map<string, VisualRegressionResult>> {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'wide', width: 2560, height: 1440 }
    ];
    
    const results = new Map<string, VisualRegressionResult>();
    
    for (const viewport of viewports) {
      await this.page.goto(url);
      const result = await this.captureAndCompare(
        `${pageName}-${viewport.name}`,
        {
          viewport: { width: viewport.width, height: viewport.height },
          waitForSelector: 'body',
          hideSelectors: ['[data-testid="timestamp"]', '[data-dynamic]']
        }
      );
      results.set(viewport.name, result);
    }
    
    return results;
  }

  async checkLayoutIssues(): Promise<{
    overlapping: Array<{ selector: string; details: string }>;
    overflow: Array<{ selector: string; details: string }>;
    brokenLayouts: Array<{ selector: string; details: string }>;
  }> {
    const issues = await this.page.evaluate(() => {
      const results = {
        overlapping: [] as any[],
        overflow: [] as any[],
        brokenLayouts: [] as any[]
      };
      
      // Check for overlapping elements
      const elements = document.querySelectorAll('*');
      const rects = new Map();
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          rects.set(el, rect);
        }
      });
      
      rects.forEach((rect1, el1) => {
        rects.forEach((rect2, el2) => {
          if (el1 === el2 || el1.contains(el2) || el2.contains(el1)) return;
          
          // Check if rectangles overlap
          if (!(rect1.right < rect2.left || 
                rect2.right < rect1.left || 
                rect1.bottom < rect2.top || 
                rect2.bottom < rect1.top)) {
            const selector1 = el1.className ? `.${el1.className.split(' ')[0]}` : el1.tagName.toLowerCase();
            const selector2 = el2.className ? `.${el2.className.split(' ')[0]}` : el2.tagName.toLowerCase();
            results.overlapping.push({
              selector: `${selector1} overlaps with ${selector2}`,
              details: `Elements overlap at position (${rect1.left}, ${rect1.top})`
            });
          }
        });
      });
      
      // Check for overflow issues
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        
        // Check horizontal overflow
        if (rect.right > window.innerWidth) {
          const selector = el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase();
          results.overflow.push({
            selector,
            details: `Element extends ${rect.right - window.innerWidth}px beyond viewport`
          });
        }
        
        // Check if text is cut off
        if (el.scrollWidth > el.clientWidth && styles.overflow === 'hidden') {
          const selector = el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase();
          results.overflow.push({
            selector,
            details: `Text content is cut off (${el.scrollWidth - el.clientWidth}px hidden)`
          });
        }
      });
      
      // Check for broken layouts
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        
        // Check for elements with height 0 that should have content
        if (el.children.length > 0 && el.clientHeight === 0 && styles.display !== 'none') {
          const selector = el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase();
          results.brokenLayouts.push({
            selector,
            details: 'Container has children but height is 0'
          });
        }
        
        // Check for negative margins causing issues
        const marginTop = parseFloat(styles.marginTop);
        const marginLeft = parseFloat(styles.marginLeft);
        if (marginTop < -50 || marginLeft < -50) {
          const selector = el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase();
          results.brokenLayouts.push({
            selector,
            details: `Large negative margin detected (top: ${marginTop}px, left: ${marginLeft}px)`
          });
        }
      });
      
      return results;
    });
    
    return issues;
  }

  async generateVisualReport(results: Map<string, VisualRegressionResult>): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Regression Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #333; }
    .viewport-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 20px 0; }
    .viewport-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .viewport-card.passed { border-left: 4px solid #28a745; }
    .viewport-card.failed { border-left: 4px solid #dc3545; }
    .viewport-name { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
    .diff-stats { display: flex; justify-content: space-between; margin: 10px 0; }
    .stat { padding: 5px 10px; background: #f8f9fa; border-radius: 4px; }
    .stat.good { background: #d4edda; color: #155724; }
    .stat.bad { background: #f8d7da; color: #721c24; }
    .images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
    .image-container { text-align: center; }
    .image-container img { width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .image-label { font-size: 0.9em; color: #666; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Visual Regression Test Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    <div class="viewport-grid">
      ${Array.from(results.entries()).map(([name, result]) => `
        <div class="viewport-card ${result.passed ? 'passed' : 'failed'}">
          <div class="viewport-name">${result.page} - ${name}</div>
          <div class="diff-stats">
            <span class="stat">Viewport: ${result.viewport}</span>
            <span class="stat ${result.passed ? 'good' : 'bad'}">
              ${result.diffPercentage.toFixed(2)}% difference
            </span>
          </div>
          ${result.baselineExists ? `
            <div class="diff-stats">
              <span class="stat">Pixels changed: ${result.diffPixels}</span>
              <span class="stat ${result.passed ? 'good' : 'bad'}">
                ${result.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          ` : '<p>Baseline created</p>'}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
    
    const reportPath = path.join(this.diffDir, 'visual-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`Visual regression report saved to: ${reportPath}`);
  }
}