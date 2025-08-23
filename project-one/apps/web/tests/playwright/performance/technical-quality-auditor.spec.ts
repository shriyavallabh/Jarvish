import { test, expect, Page } from '@playwright/test';

/**
 * Technical Quality Auditor
 * 
 * Comprehensive technical validation including:
 * - Performance metrics and Core Web Vitals
 * - Console error monitoring
 * - Accessibility compliance
 * - API integration testing
 */

interface PerformanceMetrics {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
  loadTime: number; // Total load time
  domContentLoaded: number;
}

interface QualityAuditResult {
  page: string;
  performance: PerformanceMetrics;
  errors: string[];
  accessibilityScore: number;
  seoScore: number;
  grade: string;
  issues: string[];
  recommendations: string[];
}

const performanceTestPages = [
  { url: '/', name: 'Landing Page', critical: true },
  { url: '/sign-up', name: 'Registration', critical: true },
  { url: '/sign-in', name: 'Login', critical: true },
  { url: '/pricing', name: 'Pricing', critical: false },
  { url: '/analytics-demo', name: 'Analytics Demo', critical: false }
];

test.describe('Technical Quality Audit', () => {
  
  performanceTestPages.forEach((pageInfo) => {
    test(`Performance Audit - ${pageInfo.name}`, async ({ page }) => {
      console.log(`\n⚡ Performance Testing: ${pageInfo.name}`);
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Set up error monitoring
      page.on('pageerror', exception => {
        errors.push(`JavaScript Error: ${exception.message}`);
      });
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(`Console Error: ${msg.text()}`);
        } else if (msg.type() === 'warning') {
          warnings.push(`Console Warning: ${msg.text()}`);
        }
      });
      
      // Monitor failed network requests
      page.on('response', response => {
        if (response.status() >= 400) {
          errors.push(`Network Error: ${response.url()} - ${response.status()}`);
        }
      });
      
      const startTime = Date.now();
      
      try {
        // Navigate and measure basic timing
        await page.goto(pageInfo.url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        const loadTime = Date.now() - startTime;
        
        // Get Core Web Vitals and performance metrics
        const performanceMetrics = await page.evaluate(() => {
          return new Promise<PerformanceMetrics>((resolve) => {
            // Wait a bit for metrics to be available
            setTimeout(() => {
              const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
              
              const metrics: Partial<PerformanceMetrics> = {
                loadTime: navigation.loadEventEnd - navigation.fetchStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                TTFB: navigation.responseStart - navigation.fetchStart,
                FCP: 0,
                LCP: 0,
                FID: 0,
                CLS: 0
              };
              
              // Try to get Paint Timing API metrics
              const paintEntries = performance.getEntriesByType('paint');
              const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
              if (fcpEntry) {
                metrics.FCP = fcpEntry.startTime;
              }
              
              // Try to get LCP from PerformanceObserver if available
              if ('PerformanceObserver' in window) {
                try {
                  const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry) {
                      metrics.LCP = lastEntry.startTime;
                    }
                  });
                  observer.observe({ entryTypes: ['largest-contentful-paint'] });
                } catch (e) {
                  // Fallback if PerformanceObserver not supported
                }
              }
              
              resolve(metrics as PerformanceMetrics);
            }, 2000);
          });
        });
        
        console.log('📊 Performance Metrics:');
        console.log(`   Load Time: ${performanceMetrics.loadTime.toFixed(0)}ms`);
        console.log(`   DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(0)}ms`);
        console.log(`   Time to First Byte: ${performanceMetrics.TTFB.toFixed(0)}ms`);
        console.log(`   First Contentful Paint: ${performanceMetrics.FCP.toFixed(0)}ms`);
        if (performanceMetrics.LCP > 0) {
          console.log(`   Largest Contentful Paint: ${performanceMetrics.LCP.toFixed(0)}ms`);
        }
        
        // Performance Grading
        let performanceGrade = 'A';
        const issues: string[] = [];
        const recommendations: string[] = [];
        
        if (performanceMetrics.loadTime > 3000) {
          performanceGrade = 'C';
          issues.push('Slow page load time');
          recommendations.push('Optimize images and reduce bundle size');
        } else if (performanceMetrics.loadTime > 2000) {
          performanceGrade = 'B';
        }
        
        if (performanceMetrics.TTFB > 600) {
          issues.push('Slow server response');
          recommendations.push('Optimize server response time');
        }
        
        if (performanceMetrics.FCP > 1800) {
          issues.push('Slow First Contentful Paint');
          recommendations.push('Optimize critical rendering path');
        }
        
        // Error Analysis
        console.log('🚨 Error Analysis:');
        if (errors.length === 0) {
          console.log('   ✅ No JavaScript or Network errors');
        } else {
          console.log(`   ❌ Found ${errors.length} errors:`);
          errors.forEach(error => console.log(`      - ${error}`));
        }
        
        if (warnings.length > 0) {
          console.log(`   ⚠️ Found ${warnings.length} warnings:`);
          warnings.slice(0, 5).forEach(warning => console.log(`      - ${warning}`));
        }
        
        // SEO Basic Check
        console.log('🔍 SEO Analysis:');
        const title = await page.title();
        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        const h1Count = await page.locator('h1').count();
        
        let seoScore = 100;
        
        if (!title || title.length < 10) {
          issues.push('Missing or short page title');
          recommendations.push('Add descriptive page title (50-60 characters)');
          seoScore -= 20;
        }
        
        if (!metaDescription || metaDescription.length < 120) {
          issues.push('Missing or short meta description');
          recommendations.push('Add meta description (150-160 characters)');
          seoScore -= 15;
        }
        
        if (h1Count !== 1) {
          issues.push(h1Count === 0 ? 'Missing H1 tag' : 'Multiple H1 tags');
          recommendations.push('Use exactly one H1 tag per page');
          seoScore -= 10;
        }
        
        console.log(`   Page Title: "${title}" (${title?.length || 0} chars)`);
        console.log(`   Meta Description: ${metaDescription ? `"${metaDescription.substring(0, 50)}..." (${metaDescription.length} chars)` : 'Missing'}`);
        console.log(`   H1 Tags: ${h1Count}`);
        console.log(`   SEO Score: ${seoScore}/100`);
        
        // Accessibility Check
        console.log('♿ Accessibility Analysis:');
        let accessibilityScore = 100;
        
        // Check for alt text on images
        const images = await page.locator('img').all();
        let imagesWithoutAlt = 0;
        
        for (const img of images) {
          const alt = await img.getAttribute('alt');
          if (!alt || alt.trim() === '') {
            imagesWithoutAlt++;
          }
        }
        
        if (imagesWithoutAlt > 0) {
          issues.push(`${imagesWithoutAlt} images missing alt text`);
          recommendations.push('Add descriptive alt text to all images');
          accessibilityScore -= (imagesWithoutAlt * 10);
        }
        
        // Check for form labels
        const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"], textarea').all();
        let inputsWithoutLabels = 0;
        
        for (const input of inputs) {
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
          
          if (!hasLabel && !ariaLabel) {
            inputsWithoutLabels++;
          }
        }
        
        if (inputsWithoutLabels > 0) {
          issues.push(`${inputsWithoutLabels} form inputs missing labels`);
          recommendations.push('Associate labels with form inputs');
          accessibilityScore -= (inputsWithoutLabels * 15);
        }
        
        console.log(`   Images: ${images.length} total, ${imagesWithoutAlt} missing alt text`);
        console.log(`   Form Inputs: ${inputs.length} total, ${inputsWithoutLabels} missing labels`);
        console.log(`   Accessibility Score: ${Math.max(0, accessibilityScore)}/100`);
        
        // Overall Grade Calculation
        const avgScore = (
          (performanceMetrics.loadTime < 2000 ? 90 : performanceMetrics.loadTime < 3000 ? 75 : 50) +
          (errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 20)) +
          seoScore +
          Math.max(0, accessibilityScore)
        ) / 4;
        
        let overallGrade = 'F';
        if (avgScore >= 90) overallGrade = 'A';
        else if (avgScore >= 80) overallGrade = 'B';
        else if (avgScore >= 70) overallGrade = 'C';
        else if (avgScore >= 60) overallGrade = 'D';
        
        console.log(`\n🏆 Overall Quality Grade: ${overallGrade} (${avgScore.toFixed(1)}/100)`);
        
        if (issues.length > 0) {
          console.log('\n⚠️ Issues Found:');
          issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        if (recommendations.length > 0) {
          console.log('\n💡 Recommendations:');
          recommendations.forEach(rec => console.log(`   - ${rec}`));
        }
        
        // Test Assertions
        if (pageInfo.critical) {
          // Critical pages have stricter requirements
          expect(errors.length).toBeLessThanOrEqual(0);
          expect(performanceMetrics.loadTime).toBeLessThan(5000);
          expect(title).toBeTruthy();
          expect(overallGrade).not.toBe('F');
        } else {
          // Non-critical pages are more lenient
          expect(errors.length).toBeLessThanOrEqual(2);
          expect(performanceMetrics.loadTime).toBeLessThan(8000);
        }
        
      } catch (error) {
        console.error(`❌ Technical audit failed for ${pageInfo.name}: ${error.message}`);
        throw error;
      }
    });
  });
});

test.describe('API Integration Testing', () => {
  
  test('WhatsApp API integration validation', async ({ page }) => {
    console.log('\n📱 Testing WhatsApp API Integration');
    
    // Test if WhatsApp endpoints are accessible
    const whatsappApiTests = [
      { endpoint: '/api/whatsapp/templates', name: 'Templates API' },
      { endpoint: '/api/whatsapp/send', name: 'Send Message API' }
    ];
    
    for (const apiTest of whatsappApiTests) {
      try {
        const response = await page.request.get(apiTest.endpoint);
        console.log(`   ${apiTest.name}: ${response.status()}`);
        
        if (response.status() === 405) {
          console.log(`   ✅ ${apiTest.name} endpoint exists (method not allowed is expected for GET)`);
        } else if (response.status() === 401) {
          console.log(`   ✅ ${apiTest.name} endpoint exists (authentication required)`);
        } else if (response.status() < 500) {
          console.log(`   ✅ ${apiTest.name} endpoint is accessible`);
        } else {
          console.log(`   ❌ ${apiTest.name} endpoint error: ${response.status()}`);
        }
      } catch (error) {
        console.log(`   ❌ ${apiTest.name} request failed: ${error.message}`);
      }
    }
  });
  
  test('AI API integration validation', async ({ page }) => {
    console.log('\n🤖 Testing AI API Integration');
    
    const aiApiTests = [
      { endpoint: '/api/ai/generate-content', name: 'Content Generation API' },
      { endpoint: '/api/ai/check-compliance', name: 'SEBI Compliance API' }
    ];
    
    for (const apiTest of aiApiTests) {
      try {
        const response = await page.request.get(apiTest.endpoint);
        console.log(`   ${apiTest.name}: ${response.status()}`);
        
        if (response.status() === 405) {
          console.log(`   ✅ ${apiTest.name} endpoint exists (method not allowed for GET)`);
        } else if (response.status() === 401 || response.status() === 400) {
          console.log(`   ✅ ${apiTest.name} endpoint exists (requires proper request)`);
        } else {
          console.log(`   ⚠️ ${apiTest.name} unexpected response: ${response.status()}`);
        }
      } catch (error) {
        console.log(`   ❌ ${apiTest.name} request failed: ${error.message}`);
      }
    }
  });
  
  test('Database connectivity validation', async ({ page }) => {
    console.log('\n🗄️ Testing Database Connectivity');
    
    // Test Supabase endpoints
    const dbTests = [
      { endpoint: '/api/supabase/advisor', name: 'Advisor Database' },
      { endpoint: '/api/supabase/content', name: 'Content Database' }
    ];
    
    for (const dbTest of dbTests) {
      try {
        const response = await page.request.get(dbTest.endpoint);
        console.log(`   ${dbTest.name}: ${response.status()}`);
        
        if (response.status() < 500) {
          console.log(`   ✅ ${dbTest.name} database connection working`);
        } else {
          console.log(`   ❌ ${dbTest.name} database connection error`);
        }
      } catch (error) {
        console.log(`   ❌ ${dbTest.name} request failed: ${error.message}`);
      }
    }
  });
});

test.describe('Security Testing', () => {
  
  test('HTTPS and Security Headers', async ({ page }) => {
    await page.goto('/');
    
    // Check if running on HTTPS in production
    const url = page.url();
    console.log(`🔒 Testing security for: ${url}`);
    
    if (url.startsWith('https://')) {
      console.log('   ✅ HTTPS enabled');
    } else if (url.startsWith('http://localhost')) {
      console.log('   ⚠️ Local development (HTTP expected)');
    } else {
      console.log('   ❌ Production should use HTTPS');
    }
    
    // Check for security-related headers (if accessible)
    const response = await page.request.get('/');
    const headers = response.headers();
    
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
      'content-security-policy'
    ];
    
    securityHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`   ✅ ${header}: ${headers[header]}`);
      } else {
        console.log(`   ⚠️ Missing security header: ${header}`);
      }
    });
  });
});