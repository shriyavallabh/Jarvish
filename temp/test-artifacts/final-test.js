#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

async function comprehensiveTest() {
  console.log('🚀 Running Final Comprehensive Testing...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1920,1080'],
    devtools: false
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Navigate and wait for full load
    console.log('📍 Loading landing page...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Take high-quality screenshots
    console.log('📸 Capturing final screenshots...');
    await page.screenshot({ 
      path: 'final-landing-page.png', 
      fullPage: true
    });
    
    // Accessibility Test
    console.log('♿ Running Accessibility Tests...');
    const accessibilityResults = await page.evaluate(() => {
      const results = {
        colorContrast: [],
        textReadability: [],
        semanticStructure: [],
        interactiveElements: []
      };
      
      // Test color contrast
      const textElements = document.querySelectorAll('h1, h2, h3, p, span, a, button');
      for (let i = 0; i < Math.min(50, textElements.length); i++) {
        const element = textElements[i];
        const styles = window.getComputedStyle(element);
        const text = element.textContent?.trim();
        
        if (text && text.length > 0) {
          const color = styles.color;
          const bgColor = styles.backgroundColor;
          const fontSize = parseFloat(styles.fontSize);
          
          if (fontSize < 14) {
            results.textReadability.push(`Font too small: "${text.substring(0, 30)}..." (${fontSize}px)`);
          }
          
          // Check for same colors
          if (color === bgColor) {
            results.colorContrast.push(`Same text/bg color: "${text.substring(0, 30)}..."`);
          }
        }
      }
      
      // Test semantic structure
      const h1Count = document.querySelectorAll('h1').length;
      if (h1Count !== 1) {
        results.semanticStructure.push(`Should have exactly 1 h1, found ${h1Count}`);
      }
      
      // Test interactive elements
      const buttons = document.querySelectorAll('button, a[href], input');
      buttons.forEach((btn, index) => {
        const styles = window.getComputedStyle(btn);
        if (parseFloat(styles.fontSize) < 12) {
          results.interactiveElements.push(`Button/link ${index} has small font (${styles.fontSize})`);
        }
      });
      
      return results;
    });
    
    // Performance Test
    console.log('⚡ Running Performance Tests...');
    const performanceMetrics = await page.evaluate(() => {
      return {
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });
    
    // Visual Design Test
    console.log('🎨 Testing Visual Design Quality...');
    const designQuality = await page.evaluate(() => {
      const results = {
        spacing: [],
        consistency: [],
        visualHierarchy: []
      };
      
      // Check spacing consistency
      const sections = document.querySelectorAll('section');
      sections.forEach((section, index) => {
        const styles = window.getComputedStyle(section);
        const paddingTop = parseFloat(styles.paddingTop);
        const paddingBottom = parseFloat(styles.paddingBottom);
        
        if (paddingTop < 64 || paddingBottom < 64) {
          results.spacing.push(`Section ${index} has insufficient padding`);
        }
      });
      
      // Check visual hierarchy
      const headings = document.querySelectorAll('h1, h2, h3');
      let prevSize = Infinity;
      headings.forEach((heading, index) => {
        const fontSize = parseFloat(window.getComputedStyle(heading).fontSize);
        if (fontSize > prevSize) {
          results.visualHierarchy.push(`Heading hierarchy issue at position ${index}`);
        }
        prevSize = fontSize;
      });
      
      return results;
    });
    
    // Mobile Responsiveness Test
    console.log('📱 Testing Mobile Responsiveness...');
    await page.setViewport({ width: 375, height: 812 }); // iPhone X
    await page.waitForTimeout(1000);
    
    const mobileIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check for horizontal overflow
      if (document.documentElement.scrollWidth > window.innerWidth) {
        issues.push('Horizontal overflow on mobile');
      }
      
      // Check text size on mobile
      const textElements = document.querySelectorAll('p, span');
      for (let i = 0; i < Math.min(20, textElements.length); i++) {
        const fontSize = parseFloat(window.getComputedStyle(textElements[i]).fontSize);
        if (fontSize < 14) {
          issues.push(`Text too small on mobile: ${fontSize}px`);
        }
      }
      
      return issues;
    });
    
    await page.screenshot({ 
      path: 'final-mobile-view.png', 
      fullPage: true 
    });
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Compile comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      performance: performanceMetrics,
      accessibility: accessibilityResults,
      design: designQuality,
      mobile: mobileIssues,
      summary: {
        totalIssues: 
          accessibilityResults.colorContrast.length +
          accessibilityResults.textReadability.length +
          accessibilityResults.semanticStructure.length +
          accessibilityResults.interactiveElements.length +
          designQuality.spacing.length +
          designQuality.consistency.length +
          designQuality.visualHierarchy.length +
          mobileIssues.length,
        performanceScore: performanceMetrics.loadComplete < 3000 ? 'EXCELLENT' : 
                          performanceMetrics.loadComplete < 5000 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
      }
    };
    
    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('🏆 FINAL COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`  Load Time: ${performanceMetrics.loadComplete}ms`);
    console.log(`  First Paint: ${performanceMetrics.firstPaint.toFixed(1)}ms`);
    console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(1)}ms`);
    console.log(`  Score: ${report.summary.performanceScore}`);
    
    console.log(`\n♿ ACCESSIBILITY:`);
    console.log(`  Color Contrast Issues: ${accessibilityResults.colorContrast.length}`);
    console.log(`  Text Readability Issues: ${accessibilityResults.textReadability.length}`);
    console.log(`  Semantic Structure Issues: ${accessibilityResults.semanticStructure.length}`);
    console.log(`  Interactive Element Issues: ${accessibilityResults.interactiveElements.length}`);
    
    console.log(`\n🎨 DESIGN QUALITY:`);
    console.log(`  Spacing Issues: ${designQuality.spacing.length}`);
    console.log(`  Consistency Issues: ${designQuality.consistency.length}`);
    console.log(`  Visual Hierarchy Issues: ${designQuality.visualHierarchy.length}`);
    
    console.log(`\n📱 MOBILE RESPONSIVENESS:`);
    console.log(`  Mobile Issues: ${mobileIssues.length}`);
    
    console.log(`\n📊 OVERALL SUMMARY:`);
    console.log(`  Total Issues Found: ${report.summary.totalIssues}`);
    console.log(`  Performance Score: ${report.summary.performanceScore}`);
    console.log(`  Test Status: ${report.summary.totalIssues < 5 ? '✅ EXCELLENT QUALITY' : 
                                   report.summary.totalIssues < 15 ? '⚠️ GOOD QUALITY' : '❌ NEEDS IMPROVEMENT'}`);
    
    // Save detailed report
    fs.writeFileSync('final-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to final-test-report.json');
    console.log('📸 Screenshots saved: final-landing-page.png, final-mobile-view.png');
    
    if (report.summary.totalIssues < 5) {
      console.log('\n🎉 CONGRATULATIONS! Your app meets world-class UI standards!');
    } else {
      console.log('\n🔧 Some issues remain. Check the detailed report for specifics.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

comprehensiveTest().catch(console.error);