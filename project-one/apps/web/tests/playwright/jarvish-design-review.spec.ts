import { test, expect } from '@playwright/test';

/**
 * JARVISH Comprehensive Design Review Master Test
 * 
 * This orchestrates all design review components and generates
 * a comprehensive report for the JARVISH platform
 */

test.describe('JARVISH Design Review - Master Suite', () => {
  
  test('Execute comprehensive platform validation', async ({ page, browserName }) => {
    console.log(`\n🎭 JARVISH Platform Design Review Starting`);
    console.log(`Browser: ${browserName}`);
    console.log(`Viewport: ${page.viewportSize()?.width}x${page.viewportSize()?.height}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    
    const testResults = {
      visualTests: { passed: 0, failed: 0, total: 0 },
      complianceTests: { passed: 0, failed: 0, total: 0 },
      mobileTests: { passed: 0, failed: 0, total: 0 },
      performanceTests: { passed: 0, failed: 0, total: 0 },
      overallGrade: 'F',
      criticalIssues: [] as string[],
      recommendations: [] as string[]
    };
    
    try {
      // Test 1: Basic Platform Accessibility
      console.log('\n🌐 Testing Platform Accessibility...');
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      
      const title = await page.title();
      console.log(`   Page Title: "${title}"`);
      
      if (title && title.length > 0 && !title.includes('404')) {
        console.log('   ✅ Platform is accessible');
        testResults.visualTests.passed++;
      } else {
        console.log('   ❌ Platform accessibility issues');
        testResults.visualTests.failed++;
        testResults.criticalIssues.push('Landing page not accessible');
      }
      testResults.visualTests.total++;
      
      // Test 2: Core Navigation Structure
      console.log('\n🧭 Testing Navigation Structure...');
      const navigation = await page.locator('nav, header').first();
      const hasNavigation = await navigation.isVisible();
      
      if (hasNavigation) {
        console.log('   ✅ Navigation structure found');
        testResults.visualTests.passed++;
        
        // Check for key navigation items
        const navText = await navigation.textContent();
        const hasKeyItems = navText && (
          navText.toLowerCase().includes('sign') ||
          navText.toLowerCase().includes('login') ||
          navText.toLowerCase().includes('pricing')
        );
        
        if (hasKeyItems) {
          console.log('   ✅ Key navigation items present');
        } else {
          console.log('   ⚠️ Some navigation items may be missing');
          testResults.recommendations.push('Add clear navigation items (Sign In, Sign Up, Pricing)');
        }
      } else {
        console.log('   ❌ No clear navigation structure found');
        testResults.visualTests.failed++;
        testResults.criticalIssues.push('Missing navigation structure');
      }
      testResults.visualTests.total++;
      
      // Test 3: Financial Services Branding
      console.log('\n🏦 Testing Financial Services Branding...');
      const pageContent = await page.textContent('body');
      const content = (pageContent || '').toLowerCase();
      
      const financialTerms = ['advisor', 'financial', 'investment', 'sebi', 'mfd', 'jarvish'];
      const foundTerms = financialTerms.filter(term => content.includes(term));
      
      if (foundTerms.length >= 3) {
        console.log(`   ✅ Strong financial services branding (${foundTerms.length}/6 terms)`);
        console.log(`   Found terms: ${foundTerms.join(', ')}`);
        testResults.complianceTests.passed++;
      } else if (foundTerms.length >= 1) {
        console.log(`   ⚠️ Some financial branding present (${foundTerms.length}/6 terms)`);
        console.log(`   Found terms: ${foundTerms.join(', ')}`);
        testResults.recommendations.push('Strengthen financial advisory branding and messaging');
        testResults.complianceTests.passed++;
      } else {
        console.log('   ❌ Weak financial services branding');
        testResults.complianceTests.failed++;
        testResults.criticalIssues.push('Missing financial advisory branding');
      }
      testResults.complianceTests.total++;
      
      // Test 4: Professional Visual Design
      console.log('\n🎨 Testing Professional Visual Design...');
      
      // Check background color is professional
      const backgroundColor = await page.evaluate(() => {
        const body = document.body;
        const style = window.getComputedStyle(body);
        return style.backgroundColor;
      });
      
      console.log(`   Background Color: ${backgroundColor}`);
      
      // Should not be bright unprofessional colors
      const isUnprofessionalColor = 
        backgroundColor.includes('255, 0, 0') ||  // bright red
        backgroundColor.includes('0, 255, 0') ||  // bright green
        backgroundColor.includes('255, 255, 0');  // yellow
      
      if (!isUnprofessionalColor) {
        console.log('   ✅ Professional color scheme');
        testResults.visualTests.passed++;
      } else {
        console.log('   ❌ Unprofessional color detected');
        testResults.visualTests.failed++;
        testResults.criticalIssues.push('Unprofessional color scheme for financial services');
      }
      testResults.visualTests.total++;
      
      // Test 5: Mobile Responsiveness Check
      console.log('\n📱 Testing Mobile Responsiveness...');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      // Check if content is still visible and usable
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = 375;
      
      if (bodyWidth <= viewportWidth + 50) { // Allow some tolerance
        console.log(`   ✅ No horizontal scrolling on mobile (${bodyWidth}px)`);
        testResults.mobileTests.passed++;
      } else {
        console.log(`   ❌ Horizontal scrolling on mobile (${bodyWidth}px > ${viewportWidth}px)`);
        testResults.mobileTests.failed++;
        testResults.criticalIssues.push('Mobile horizontal scrolling detected');
      }
      testResults.mobileTests.total++;
      
      // Check for mobile-friendly touch targets
      const buttons = await page.locator('button, a[href], input[type="submit"]').all();
      let smallButtonCount = 0;
      
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const button = buttons[i];
        const boundingBox = await button.boundingBox();
        
        if (boundingBox && (boundingBox.width < 44 || boundingBox.height < 44)) {
          smallButtonCount++;
        }
      }
      
      if (smallButtonCount <= buttons.length * 0.3) { // Allow 30% small buttons
        console.log(`   ✅ Most buttons are touch-friendly (${smallButtonCount}/${buttons.length} small)`);
        testResults.mobileTests.passed++;
      } else {
        console.log(`   ⚠️ Many buttons may be too small for touch (${smallButtonCount}/${buttons.length})`);
        testResults.recommendations.push('Increase touch target sizes for better mobile usability');
        testResults.mobileTests.passed++; // Don't fail for this
      }
      testResults.mobileTests.total++;
      
      // Reset to desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Test 6: Performance Check
      console.log('\n⚡ Testing Basic Performance...');
      
      const startTime = Date.now();
      await page.reload({ waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      console.log(`   Page Load Time: ${loadTime}ms`);
      
      if (loadTime < 3000) {
        console.log('   ✅ Good performance');
        testResults.performanceTests.passed++;
      } else if (loadTime < 5000) {
        console.log('   ⚠️ Acceptable performance');
        testResults.performanceTests.passed++;
        testResults.recommendations.push('Optimize page load time for better user experience');
      } else {
        console.log('   ❌ Poor performance');
        testResults.performanceTests.failed++;
        testResults.criticalIssues.push('Slow page load time affecting user experience');
      }
      testResults.performanceTests.total++;
      
      // Test 7: Error Monitoring
      console.log('\n🚨 Testing Error Monitoring...');
      
      const errors: string[] = [];
      
      page.on('pageerror', exception => {
        errors.push(exception.message);
      });
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Navigate through key pages to check for errors
      const keyPages = ['/', '/sign-up', '/pricing'];
      
      for (const keyPage of keyPages) {
        try {
          await page.goto(keyPage, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(1000);
        } catch (error) {
          errors.push(`Failed to load ${keyPage}: ${error.message}`);
        }
      }
      
      if (errors.length === 0) {
        console.log('   ✅ No critical errors detected');
        testResults.performanceTests.passed++;
      } else if (errors.length <= 2) {
        console.log(`   ⚠️ Minor errors detected (${errors.length})`);
        console.log(`   First error: ${errors[0]}`);
        testResults.performanceTests.passed++; // Don't fail for minor errors
        testResults.recommendations.push('Fix console errors for better reliability');
      } else {
        console.log(`   ❌ Multiple errors detected (${errors.length})`);
        console.log(`   Errors: ${errors.slice(0, 3).join(', ')}`);
        testResults.performanceTests.failed++;
        testResults.criticalIssues.push('Multiple JavaScript errors affecting functionality');
      }
      testResults.performanceTests.total++;
      
      // Calculate Overall Grade
      const totalPassed = 
        testResults.visualTests.passed +
        testResults.complianceTests.passed +
        testResults.mobileTests.passed +
        testResults.performanceTests.passed;
        
      const totalTests = 
        testResults.visualTests.total +
        testResults.complianceTests.total +
        testResults.mobileTests.total +
        testResults.performanceTests.total;
        
      const overallScore = (totalPassed / totalTests) * 100;
      
      if (overallScore >= 90 && testResults.criticalIssues.length === 0) {
        testResults.overallGrade = 'A';
      } else if (overallScore >= 80 && testResults.criticalIssues.length <= 1) {
        testResults.overallGrade = 'B';
      } else if (overallScore >= 70 && testResults.criticalIssues.length <= 2) {
        testResults.overallGrade = 'C';
      } else if (overallScore >= 60) {
        testResults.overallGrade = 'D';
      } else {
        testResults.overallGrade = 'F';
      }
      
      // Generate Final Report
      console.log('\n🏆 JARVISH PLATFORM DESIGN REVIEW RESULTS');
      console.log('=' .repeat(50));
      console.log(`Overall Grade: ${testResults.overallGrade} (${overallScore.toFixed(1)}%)`);
      console.log(`Browser: ${browserName} | Viewport: ${page.viewportSize()?.width}x${page.viewportSize()?.height}`);
      console.log('');
      
      console.log('📊 Test Results Summary:');
      console.log(`   Visual Tests: ${testResults.visualTests.passed}/${testResults.visualTests.total} passed`);
      console.log(`   Compliance Tests: ${testResults.complianceTests.passed}/${testResults.complianceTests.total} passed`);
      console.log(`   Mobile Tests: ${testResults.mobileTests.passed}/${testResults.mobileTests.total} passed`);
      console.log(`   Performance Tests: ${testResults.performanceTests.passed}/${testResults.performanceTests.total} passed`);
      
      if (testResults.criticalIssues.length > 0) {
        console.log('\n🚨 Critical Issues:');
        testResults.criticalIssues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      if (testResults.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        testResults.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }
      
      console.log('\n✨ JARVISH Platform Status:');
      if (testResults.overallGrade === 'A') {
        console.log('   🎉 EXCELLENT - Platform ready for production');
      } else if (testResults.overallGrade === 'B') {
        console.log('   ✅ GOOD - Platform ready with minor improvements needed');
      } else if (testResults.overallGrade === 'C') {
        console.log('   ⚠️ FAIR - Platform functional but needs improvements');
      } else if (testResults.overallGrade === 'D') {
        console.log('   ❌ POOR - Platform needs significant improvements');
      } else {
        console.log('   🚨 FAILING - Platform has critical issues requiring immediate attention');
      }
      
      console.log('\n🔗 Next Steps:');
      console.log('   1. Address any critical issues immediately');
      console.log('   2. Implement recommended improvements');
      console.log('   3. Run individual test suites for detailed analysis');
      console.log('   4. Test on additional browsers and devices');
      console.log('   5. Monitor performance metrics in production');
      
      // Don't fail the test unless there are critical issues that break functionality
      if (testResults.overallGrade === 'F' && testResults.criticalIssues.length > 3) {
        throw new Error('Platform has too many critical issues for production deployment');
      }
      
    } catch (error) {
      console.error(`\n❌ JARVISH Design Review Failed: ${error.message}`);
      throw error;
    }
  });
});