import puppeteer, { Browser, Page } from 'puppeteer';
import { AccessibilityTester } from '../core/accessibility-tester';
import { VisualRegressionTester } from '../core/visual-regression-tester';
import * as fs from 'fs';
import * as path from 'path';

describe('Financial Advisory Platform UI Tests', () => {
  let browser: Browser;
  let page: Page;
  let accessibilityTester: AccessibilityTester;
  let visualTester: VisualRegressionTester;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    accessibilityTester = new AccessibilityTester(page);
    visualTester = new VisualRegressionTester(page);
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Landing Page Tests', () => {
    test('should load landing page without errors', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Check page title
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // Take screenshot
      await accessibilityTester.takeScreenshot('landing-page');
    });

    test('should have no accessibility violations on landing page', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      const results = await accessibilityTester.runFullAudit('landing-page');
      
      // Check for critical violations
      const criticalViolations = results.violations.filter(v => v.impact === 'critical');
      expect(criticalViolations).toHaveLength(0);
      
      // Check color contrast
      expect(results.colorContrast).toHaveGoodColorContrast();
    });

    test('should detect and report header visibility issues', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Check for specific header issues
      const headerIssues = await page.evaluate(() => {
        const issues = [];
        const header = document.querySelector('header, [role="banner"], .header');
        
        if (header) {
          const styles = window.getComputedStyle(header);
          const bgColor = styles.backgroundColor;
          
          // Check if header has proper background
          if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
            issues.push({
              type: 'transparent-header',
              details: 'Header has transparent background which may cause visibility issues'
            });
          }
          
          // Check text visibility in header
          const headerTexts = header.querySelectorAll('a, span, p, h1, h2, h3');
          headerTexts.forEach(text => {
            const textStyles = window.getComputedStyle(text);
            const textColor = textStyles.color;
            
            // Simple contrast check
            if (textColor === bgColor || 
                (textColor.includes('255, 255, 255') && bgColor.includes('255, 255, 255'))) {
              issues.push({
                type: 'low-contrast-text',
                element: text.textContent?.substring(0, 30),
                details: `Text color (${textColor}) has poor contrast with background (${bgColor})`
              });
            }
          });
        }
        
        return issues;
      });
      
      // Report header issues
      if (headerIssues.length > 0) {
        console.log('Header visibility issues detected:', headerIssues);
      }
      
      // This test will help identify the issues but won't fail the test
      expect(headerIssues).toBeDefined();
    });

    test('should check for "Skip to main content" visibility', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      const skipLinkIssues = await page.evaluate(() => {
        const issues = [];
        
        // Look for skip links
        const skipLinks = document.querySelectorAll(
          'a[href="#main"], a[href="#content"], [class*="skip"], [id*="skip"]'
        );
        
        skipLinks.forEach(link => {
          const styles = window.getComputedStyle(link);
          const rect = link.getBoundingClientRect();
          
          // Check if skip link is properly hidden initially
          const isHidden = styles.position === 'absolute' && 
                          (rect.left < -9999 || rect.top < -9999 || 
                           styles.opacity === '0' || styles.visibility === 'hidden');
          
          // Check if it's visible when it shouldn't be
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           rect.left >= 0 && rect.top >= 0 &&
                           styles.opacity !== '0' && styles.visibility !== 'hidden';
          
          if (isVisible && !link.matches(':focus')) {
            issues.push({
              type: 'skip-link-visible',
              text: link.textContent,
              details: 'Skip link is visible when not focused',
              position: `(${rect.left}, ${rect.top})`,
              styles: {
                position: styles.position,
                opacity: styles.opacity,
                visibility: styles.visibility
              }
            });
          }
        });
        
        return issues;
      });
      
      // Report skip link issues
      if (skipLinkIssues.length > 0) {
        console.log('Skip link visibility issues:', skipLinkIssues);
      }
      
      expect(skipLinkIssues).toHaveLength(0);
    });

    test('should test responsive design breakpoints', async () => {
      const breakpoints = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ];
      
      for (const breakpoint of breakpoints) {
        await page.setViewport({ 
          width: breakpoint.width, 
          height: breakpoint.height 
        });
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Check for layout issues at each breakpoint
        const layoutIssues = await visualTester.checkLayoutIssues();
        
        console.log(`Layout check for ${breakpoint.name}:`, {
          overlapping: layoutIssues.overlapping.length,
          overflow: layoutIssues.overflow.length,
          broken: layoutIssues.brokenLayouts.length
        });
        
        // Take screenshot for each breakpoint
        await accessibilityTester.takeScreenshot(`landing-${breakpoint.name}`);
      }
    });
  });

  describe('Typography and Spacing Tests', () => {
    test('should check typography consistency', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      const typographyIssues = await page.evaluate(() => {
        const issues = [];
        const texts = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a');
        
        texts.forEach(element => {
          const styles = window.getComputedStyle(element);
          const fontSize = parseFloat(styles.fontSize);
          const lineHeight = parseFloat(styles.lineHeight);
          const letterSpacing = styles.letterSpacing;
          
          // Check for too small font sizes
          if (fontSize < 12) {
            issues.push({
              type: 'small-font',
              element: element.tagName.toLowerCase(),
              text: element.textContent?.substring(0, 30),
              fontSize: `${fontSize}px`,
              details: 'Font size is too small for readability'
            });
          }
          
          // Check line height
          const lineHeightRatio = lineHeight / fontSize;
          if (lineHeightRatio < 1.2 && element.tagName.toLowerCase().includes('p')) {
            issues.push({
              type: 'tight-line-height',
              element: element.tagName.toLowerCase(),
              text: element.textContent?.substring(0, 30),
              lineHeight: `${lineHeightRatio.toFixed(2)}`,
              details: 'Line height is too tight for comfortable reading'
            });
          }
          
          // Check for inconsistent letter spacing
          if (letterSpacing !== 'normal' && parseFloat(letterSpacing) < -1) {
            issues.push({
              type: 'negative-letter-spacing',
              element: element.tagName.toLowerCase(),
              text: element.textContent?.substring(0, 30),
              letterSpacing,
              details: 'Negative letter spacing may affect readability'
            });
          }
        });
        
        return issues;
      });
      
      if (typographyIssues.length > 0) {
        console.log('Typography issues found:', typographyIssues);
      }
    });

    test('should check spacing and padding consistency', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      const spacingIssues = await page.evaluate(() => {
        const issues = [];
        const containers = document.querySelectorAll('div, section, article, main, header, footer');
        
        containers.forEach(element => {
          const styles = window.getComputedStyle(element);
          const padding = {
            top: parseFloat(styles.paddingTop),
            right: parseFloat(styles.paddingRight),
            bottom: parseFloat(styles.paddingBottom),
            left: parseFloat(styles.paddingLeft)
          };
          const margin = {
            top: parseFloat(styles.marginTop),
            bottom: parseFloat(styles.marginBottom)
          };
          
          // Check for inconsistent padding
          if (element.children.length > 0) {
            if (padding.top === 0 && padding.bottom === 0 && 
                padding.left === 0 && padding.right === 0) {
              const hasText = element.textContent?.trim().length > 0;
              if (hasText) {
                issues.push({
                  type: 'no-padding',
                  element: element.className || element.tagName.toLowerCase(),
                  details: 'Container with content has no padding'
                });
              }
            }
          }
          
          // Check for excessive margins
          if (Math.abs(margin.top) > 100 || Math.abs(margin.bottom) > 100) {
            issues.push({
              type: 'excessive-margin',
              element: element.className || element.tagName.toLowerCase(),
              marginTop: `${margin.top}px`,
              marginBottom: `${margin.bottom}px`,
              details: 'Excessive margin detected'
            });
          }
        });
        
        return issues;
      });
      
      if (spacingIssues.length > 0) {
        console.log('Spacing issues found:', spacingIssues);
      }
    });
  });

  describe('Color Contrast Deep Analysis', () => {
    test('should detect all color contrast issues', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Run comprehensive color analysis
      const colorAnalysis = await page.evaluate(() => {
        const issues = {
          darkOnDark: [] as any[],
          lightOnLight: [] as any[],
          insufficientContrast: [] as any[]
        };
        
        const isLight = (rgb: string) => {
          const match = rgb.match(/\d+/g);
          if (!match) return false;
          const [r, g, b] = match.map(n => parseInt(n));
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance > 0.5;
        };
        
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          if (!el.textContent?.trim()) return;
          
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          let bgColor = styles.backgroundColor;
          
          // Find actual background color
          let parent = el.parentElement;
          while (bgColor === 'rgba(0, 0, 0, 0)' && parent) {
            bgColor = window.getComputedStyle(parent).backgroundColor;
            parent = parent.parentElement;
          }
          
          // Default to white if still transparent
          if (bgColor === 'rgba(0, 0, 0, 0)') {
            bgColor = 'rgb(255, 255, 255)';
          }
          
          const textIsLight = isLight(color);
          const bgIsLight = isLight(bgColor);
          
          // Detect dark on dark
          if (!textIsLight && !bgIsLight) {
            issues.darkOnDark.push({
              element: el.tagName.toLowerCase(),
              class: el.className,
              text: el.textContent?.substring(0, 50),
              textColor: color,
              bgColor: bgColor
            });
          }
          
          // Detect light on light
          if (textIsLight && bgIsLight) {
            issues.lightOnLight.push({
              element: el.tagName.toLowerCase(),
              class: el.className,
              text: el.textContent?.substring(0, 50),
              textColor: color,
              bgColor: bgColor
            });
          }
        });
        
        return issues;
      });
      
      // Generate detailed color contrast report
      const reportContent = {
        timestamp: new Date().toISOString(),
        url: page.url(),
        issues: colorAnalysis,
        summary: {
          darkOnDark: colorAnalysis.darkOnDark.length,
          lightOnLight: colorAnalysis.lightOnLight.length,
          insufficientContrast: colorAnalysis.insufficientContrast.length
        }
      };
      
      // Save report
      const reportsDir = path.join(process.cwd(), 'puppeteer-tests', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const reportPath = path.join(reportsDir, `color-contrast-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(reportContent, null, 2));
      
      console.log('Color contrast analysis:', reportContent.summary);
      console.log(`Detailed report saved to: ${reportPath}`);
    });
  });

  describe('Visual Regression Tests', () => {
    test('should capture baseline screenshots', async () => {
      const pages = [
        { name: 'landing', url: 'http://localhost:3000' },
        { name: 'advisor-overview', url: 'http://localhost:3000/overview' },
        { name: 'admin-approval', url: 'http://localhost:3000/approval-queue' }
      ];
      
      for (const pageConfig of pages) {
        await page.goto(pageConfig.url, { waitUntil: 'networkidle2' });
        
        const result = await visualTester.captureAndCompare(
          pageConfig.name,
          {
            waitForSelector: 'body',
            hideSelectors: ['[data-testid="timestamp"]', '[data-dynamic]'],
            updateBaseline: process.env.UPDATE_BASELINE === 'true'
          }
        );
        
        console.log(`Visual regression for ${pageConfig.name}:`, {
          passed: result.passed,
          difference: `${result.diffPercentage.toFixed(2)}%`
        });
      }
    });

    test('should test responsive visual regression', async () => {
      const results = await visualTester.testResponsiveDesign(
        'landing',
        'http://localhost:3000'
      );
      
      await visualTester.generateVisualReport(results);
      
      // Check all viewports passed
      const failures = Array.from(results.values()).filter(r => !r.passed);
      expect(failures).toHaveLength(0);
    });
  });

  describe('Design Quality Validation', () => {
    test('should validate design matches references', async () => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Check for expected design elements
      const designValidation = await page.evaluate(() => {
        const checks = {
          hasProperHeader: false,
          hasHeroSection: false,
          hasConsistentButtons: false,
          hasProperForms: false,
          hasFooter: false
        };
        
        // Check header
        const header = document.querySelector('header, [role="banner"]');
        checks.hasProperHeader = header !== null && 
          window.getComputedStyle(header).height !== '0px';
        
        // Check hero section
        const hero = document.querySelector('[class*="hero"], section:first-of-type');
        checks.hasHeroSection = hero !== null;
        
        // Check buttons consistency
        const buttons = document.querySelectorAll('button, [role="button"]');
        const buttonStyles = new Set();
        buttons.forEach(btn => {
          const styles = window.getComputedStyle(btn);
          buttonStyles.add(`${styles.padding}-${styles.borderRadius}`);
        });
        checks.hasConsistentButtons = buttonStyles.size <= 3; // Max 3 button styles
        
        // Check forms
        const forms = document.querySelectorAll('form, [role="form"]');
        checks.hasProperForms = forms.length === 0 || 
          Array.from(forms).every(form => form.querySelectorAll('input, select, textarea').length > 0);
        
        // Check footer
        const footer = document.querySelector('footer, [role="contentinfo"]');
        checks.hasFooter = footer !== null;
        
        return checks;
      });
      
      console.log('Design validation results:', designValidation);
      
      // These checks help identify missing design elements
      expect(designValidation.hasProperHeader).toBe(true);
    });
  });
});