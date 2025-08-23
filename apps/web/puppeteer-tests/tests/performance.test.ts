import puppeteer, { Browser, Page } from 'puppeteer';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance and Lighthouse Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Lighthouse Audits', () => {
    test('should run comprehensive Lighthouse audit', async () => {
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
      
      const options = {
        logLevel: 'info' as const,
        output: 'html' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port
      };
      
      const runnerResult = await lighthouse('http://localhost:3000', options);
      
      // Save HTML report
      const reportsDir = path.join(process.cwd(), 'puppeteer-tests', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const reportHtml = runnerResult?.report;
      if (typeof reportHtml === 'string') {
        fs.writeFileSync(
          path.join(reportsDir, `lighthouse-${Date.now()}.html`),
          reportHtml
        );
      }
      
      await chrome.kill();
      
      // Check scores
      const scores = {
        performance: runnerResult?.lhr.categories.performance.score || 0,
        accessibility: runnerResult?.lhr.categories.accessibility.score || 0,
        bestPractices: runnerResult?.lhr.categories['best-practices'].score || 0,
        seo: runnerResult?.lhr.categories.seo.score || 0
      };
      
      console.log('Lighthouse Scores:', scores);
      
      // Extract specific accessibility issues
      const a11yAudits = runnerResult?.lhr.audits;
      const colorContrastAudit = a11yAudits?.['color-contrast'];
      
      if (colorContrastAudit && colorContrastAudit.score !== null && colorContrastAudit.score < 1) {
        console.log('Color Contrast Issues Found:');
        console.log(colorContrastAudit.details);
      }
      
      // Minimum score requirements
      expect(scores.accessibility).toBeGreaterThan(0.7); // 70% minimum
    });

    test('should check Core Web Vitals', async () => {
      page = await browser.newPage();
      
      // Enable performance metrics collection
      await page.evaluateOnNewDocument(() => {
        window.addEventListener('load', () => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          (window as any).perfMetrics = {
            FCP: perfData.responseStart,
            LCP: 0,
            FID: 0,
            CLS: 0
          };
          
          // Observe LCP
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            (window as any).perfMetrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Observe CLS
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
                (window as any).perfMetrics.CLS = clsValue;
              }
            }
          }).observe({ entryTypes: ['layout-shift'] });
        });
      });
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Wait a bit for metrics to be collected
      await page.waitForTimeout(3000);
      
      const metrics = await page.evaluate(() => (window as any).perfMetrics);
      
      console.log('Core Web Vitals:', metrics);
      
      // Check against thresholds
      expect(metrics.LCP).toBeLessThan(2500); // Good LCP < 2.5s
      expect(metrics.CLS).toBeLessThan(0.1); // Good CLS < 0.1
    });

    test('should analyze bundle size and performance', async () => {
      page = await browser.newPage();
      
      // Track network requests
      const resources: any[] = [];
      page.on('response', response => {
        const url = response.url();
        const status = response.status();
        const headers = response.headers();
        
        if (url.includes('.js') || url.includes('.css')) {
          resources.push({
            url,
            status,
            size: parseInt(headers['content-length'] || '0'),
            type: url.includes('.js') ? 'javascript' : 'css'
          });
        }
      });
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Calculate total bundle sizes
      const jsBundleSize = resources
        .filter(r => r.type === 'javascript')
        .reduce((sum, r) => sum + r.size, 0);
      
      const cssBundleSize = resources
        .filter(r => r.type === 'css')
        .reduce((sum, r) => sum + r.size, 0);
      
      console.log('Bundle Analysis:', {
        totalJS: `${(jsBundleSize / 1024).toFixed(2)} KB`,
        totalCSS: `${(cssBundleSize / 1024).toFixed(2)} KB`,
        totalResources: resources.length
      });
      
      // Check for oversized bundles
      expect(jsBundleSize).toBeLessThan(1024 * 1024); // JS < 1MB
      expect(cssBundleSize).toBeLessThan(256 * 1024); // CSS < 256KB
    });
  });

  describe('Memory and Performance Profiling', () => {
    test('should check for memory leaks', async () => {
      page = await browser.newPage();
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Get initial memory usage
      const initialMetrics = await page.metrics();
      console.log('Initial memory:', {
        jsHeapUsed: `${(initialMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`,
        documents: initialMetrics.Documents,
        nodes: initialMetrics.Nodes
      });
      
      // Simulate user interactions
      for (let i = 0; i < 5; i++) {
        // Navigate around
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
          window.scrollTo(0, 0);
        });
        
        // Click on interactive elements if they exist
        const buttons = await page.$$('button');
        if (buttons.length > 0) {
          await buttons[0].click().catch(() => {});
        }
        
        await page.waitForTimeout(1000);
      }
      
      // Force garbage collection if possible
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      // Get final memory usage
      const finalMetrics = await page.metrics();
      console.log('Final memory:', {
        jsHeapUsed: `${(finalMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`,
        documents: finalMetrics.Documents,
        nodes: finalMetrics.Nodes
      });
      
      // Check for memory leaks (shouldn't grow more than 50%)
      const memoryGrowth = (finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize) / initialMetrics.JSHeapUsedSize;
      expect(memoryGrowth).toBeLessThan(0.5);
      
      // Check for DOM node leaks
      const nodeGrowth = finalMetrics.Nodes - initialMetrics.Nodes;
      expect(nodeGrowth).toBeLessThan(100);
    });

    test('should measure time to interactive', async () => {
      page = await browser.newPage();
      
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      // Wait for page to be interactive
      await page.waitForSelector('body', { visible: true });
      
      // Check if main interactive elements are ready
      const interactiveTime = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          if (document.readyState === 'complete') {
            resolve(performance.now());
          } else {
            window.addEventListener('load', () => {
              resolve(performance.now());
            });
          }
        });
      });
      
      const tti = Date.now() - startTime;
      console.log(`Time to Interactive: ${tti}ms`);
      
      // TTI should be under 5 seconds
      expect(tti).toBeLessThan(5000);
    });
  });
});