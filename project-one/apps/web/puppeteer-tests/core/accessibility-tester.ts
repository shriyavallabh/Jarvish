import { AxePuppeteer } from '@axe-core/puppeteer';
import { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export interface AccessibilityIssue {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

export interface ColorContrastIssue {
  element: string;
  selector: string;
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  requiredRatio: number;
  level: 'AA' | 'AAA';
  fontSize: string;
  fontWeight: string;
  passed: boolean;
}

export interface VisibilityIssue {
  type: 'low-contrast' | 'invisible-text' | 'overlapping' | 'hidden-content';
  element: string;
  selector: string;
  details: string;
  screenshot?: string;
}

export class AccessibilityTester {
  private page: Page;
  private results: Map<string, any> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  async runFullAudit(pageName: string): Promise<{
    violations: AccessibilityIssue[];
    colorContrast: ColorContrastIssue[];
    visibility: VisibilityIssue[];
    passes: number;
    incomplete: number;
  }> {
    console.log(`Running accessibility audit for: ${pageName}`);
    
    // Run axe-core accessibility tests
    const axeResults = await new AxePuppeteer(this.page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Check color contrast specifically
    const colorContrastIssues = await this.checkColorContrast();
    
    // Check text visibility issues
    const visibilityIssues = await this.checkTextVisibility();
    
    // Store results
    const results = {
      violations: axeResults.violations as AccessibilityIssue[],
      colorContrast: colorContrastIssues,
      visibility: visibilityIssues,
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete.length
    };
    
    this.results.set(pageName, results);
    
    // Generate detailed report
    await this.generateReport(pageName, results);
    
    return results;
  }

  async checkColorContrast(): Promise<ColorContrastIssue[]> {
    const issues: ColorContrastIssue[] = [];
    
    const contrastData = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const results: any[] = [];
      
      elements.forEach((el: Element) => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bgColor = styles.backgroundColor;
        
        // Skip if no text or transparent
        if (!el.textContent?.trim() || color === 'rgba(0, 0, 0, 0)') return;
        
        // Get actual background color (traverse up if transparent)
        let actualBg = bgColor;
        let parent = el.parentElement;
        while (actualBg === 'rgba(0, 0, 0, 0)' && parent) {
          actualBg = window.getComputedStyle(parent).backgroundColor;
          parent = parent.parentElement;
        }
        
        // Calculate contrast ratio
        const getLuminance = (rgb: string) => {
          const match = rgb.match(/\d+/g);
          if (!match) return 0;
          const [r, g, b] = match.map(n => parseInt(n) / 255);
          const [rs, gs, bs] = [r, g, b].map(c => 
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
          );
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const l1 = getLuminance(color);
        const l2 = getLuminance(actualBg);
        const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(fontWeight) >= 700);
        const requiredRatio = isLargeText ? 3 : 4.5;
        
        if (contrast < requiredRatio) {
          results.push({
            element: el.tagName.toLowerCase(),
            selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(),
            foregroundColor: color,
            backgroundColor: actualBg,
            contrastRatio: contrast,
            requiredRatio,
            level: 'AA',
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            passed: false,
            text: el.textContent?.substring(0, 50)
          });
        }
      });
      
      return results;
    });
    
    return contrastData;
  }

  async checkTextVisibility(): Promise<VisibilityIssue[]> {
    const issues: VisibilityIssue[] = [];
    
    const visibilityData = await this.page.evaluate(() => {
      const results: any[] = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach((el: Element) => {
        if (!el.textContent?.trim()) return;
        
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Check for invisible text
        if (styles.opacity === '0' || styles.visibility === 'hidden') {
          results.push({
            type: 'invisible-text',
            element: el.tagName.toLowerCase(),
            selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(),
            details: `Text is hidden (opacity: ${styles.opacity}, visibility: ${styles.visibility})`,
            text: el.textContent?.substring(0, 50)
          });
        }
        
        // Check for text outside viewport
        if (rect.top < 0 || rect.left < 0 || 
            rect.bottom > window.innerHeight || 
            rect.right > window.innerWidth) {
          if (styles.position === 'absolute' || styles.position === 'fixed') {
            results.push({
              type: 'hidden-content',
              element: el.tagName.toLowerCase(),
              selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(),
              details: `Element positioned outside viewport (${rect.left}, ${rect.top})`,
              text: el.textContent?.substring(0, 50)
            });
          }
        }
        
        // Check for overlapping elements
        if (rect.width > 0 && rect.height > 0) {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const elementAtPoint = document.elementFromPoint(centerX, centerY);
          
          if (elementAtPoint && !el.contains(elementAtPoint) && !elementAtPoint.contains(el)) {
            results.push({
              type: 'overlapping',
              element: el.tagName.toLowerCase(),
              selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(),
              details: `Element may be covered by another element`,
              text: el.textContent?.substring(0, 50)
            });
          }
        }
      });
      
      return results;
    });
    
    return visibilityData;
  }

  async generateReport(pageName: string, results: any): Promise<void> {
    const reportDir = path.join(process.cwd(), 'puppeteer-tests', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `${pageName}-${timestamp}.json`);
    
    const report = {
      page: pageName,
      url: this.page.url(),
      timestamp: new Date().toISOString(),
      summary: {
        totalViolations: results.violations.length,
        criticalViolations: results.violations.filter((v: any) => v.impact === 'critical').length,
        seriousViolations: results.violations.filter((v: any) => v.impact === 'serious').length,
        colorContrastIssues: results.colorContrast.length,
        visibilityIssues: results.visibility.length,
        passes: results.passes,
        incomplete: results.incomplete
      },
      violations: results.violations,
      colorContrast: results.colorContrast,
      visibility: results.visibility
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${reportPath}`);
    
    // Generate HTML report
    await this.generateHTMLReport(pageName, report);
  }

  async generateHTMLReport(pageName: string, report: any): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report - ${pageName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
    .stat.critical { border-left-color: #dc3545; }
    .stat.serious { border-left-color: #ff9800; }
    .stat.moderate { border-left-color: #ffc107; }
    .stat.minor { border-left-color: #28a745; }
    .stat-value { font-size: 2em; font-weight: bold; color: #333; }
    .stat-label { color: #666; margin-top: 5px; }
    .violation { background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .violation.critical { background: #f8d7da; border-color: #f5c6cb; }
    .violation.serious { background: #fff3cd; border-color: #ffeeba; }
    .violation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .impact { padding: 3px 8px; border-radius: 3px; color: white; font-size: 0.85em; font-weight: bold; }
    .impact.critical { background: #dc3545; }
    .impact.serious { background: #ff9800; }
    .impact.moderate { background: #ffc107; color: #333; }
    .impact.minor { background: #28a745; }
    .node { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
    .color-issue { display: flex; align-items: center; padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px; }
    .color-sample { width: 40px; height: 40px; margin-right: 15px; border: 1px solid #ddd; border-radius: 3px; }
    .contrast-ratio { font-weight: bold; margin: 0 10px; }
    .failed { color: #dc3545; }
    .passed { color: #28a745; }
    .visibility-issue { background: #e7f3ff; border: 1px solid #b3d7ff; padding: 10px; margin: 5px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Accessibility Report: ${pageName}</h1>
    <p><strong>URL:</strong> ${report.url}</p>
    <p><strong>Tested:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
    
    <h2>Summary</h2>
    <div class="summary">
      <div class="stat critical">
        <div class="stat-value">${report.summary.criticalViolations}</div>
        <div class="stat-label">Critical Issues</div>
      </div>
      <div class="stat serious">
        <div class="stat-value">${report.summary.seriousViolations}</div>
        <div class="stat-label">Serious Issues</div>
      </div>
      <div class="stat moderate">
        <div class="stat-value">${report.summary.colorContrastIssues}</div>
        <div class="stat-label">Color Contrast Issues</div>
      </div>
      <div class="stat minor">
        <div class="stat-value">${report.summary.visibilityIssues}</div>
        <div class="stat-label">Visibility Issues</div>
      </div>
    </div>
    
    <h2>Accessibility Violations (${report.violations.length})</h2>
    ${report.violations.map((v: any) => `
      <div class="violation ${v.impact}">
        <div class="violation-header">
          <strong>${v.description}</strong>
          <span class="impact ${v.impact}">${v.impact.toUpperCase()}</span>
        </div>
        <p>${v.help}</p>
        <p><a href="${v.helpUrl}" target="_blank">Learn more</a></p>
        <details>
          <summary>Affected elements (${v.nodes.length})</summary>
          ${v.nodes.map((n: any) => `
            <div class="node">
              <code>${n.html}</code>
              <p>${n.failureSummary}</p>
            </div>
          `).join('')}
        </details>
      </div>
    `).join('')}
    
    <h2>Color Contrast Issues (${report.colorContrast.length})</h2>
    ${report.colorContrast.map((c: any) => `
      <div class="color-issue">
        <div class="color-sample" style="background: ${c.foregroundColor}"></div>
        <div class="color-sample" style="background: ${c.backgroundColor}"></div>
        <div>
          <strong>${c.element}</strong> ${c.selector}<br>
          Contrast Ratio: <span class="contrast-ratio failed">${c.contrastRatio.toFixed(2)}</span>
          (Required: ${c.requiredRatio})<br>
          Font: ${c.fontSize} / ${c.fontWeight}<br>
          ${c.text ? `Text: "${c.text}..."` : ''}
        </div>
      </div>
    `).join('')}
    
    <h2>Visibility Issues (${report.visibility.length})</h2>
    ${report.visibility.map((v: any) => `
      <div class="visibility-issue">
        <strong>${v.type.replace('-', ' ').toUpperCase()}</strong><br>
        Element: ${v.element} ${v.selector}<br>
        ${v.details}<br>
        ${v.text ? `Text: "${v.text}..."` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
    
    const htmlPath = path.join(process.cwd(), 'puppeteer-tests', 'reports', `${pageName}-${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
    fs.writeFileSync(htmlPath, html);
    console.log(`HTML report saved to: ${htmlPath}`);
  }

  async takeScreenshot(name: string): Promise<void> {
    const screenshotDir = path.join(process.cwd(), 'puppeteer-tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const screenshotPath = path.join(screenshotDir, `${name}-${Date.now()}.png`);
    await this.page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`Screenshot saved to: ${screenshotPath}`);
  }
}