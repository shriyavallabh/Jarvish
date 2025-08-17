#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

async function testUIIssues() {
  console.log('🔍 Starting UI Issues Detection...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser so you can see what's happening
    args: ['--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Navigate to your app
    console.log('📍 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('📸 Taking screenshots...');
    await page.screenshot({ path: 'landing-page-full.png', fullPage: true });
    
    // Test 1: Check for header visibility issues
    console.log('🔍 Testing Header Visibility...');
    const headerIssues = await page.evaluate(() => {
      const issues = [];
      const headers = document.querySelectorAll('header, .header, nav, .nav');
      
      headers.forEach((header, index) => {
        const styles = window.getComputedStyle(header);
        const rect = header.getBoundingClientRect();
        
        // Check if header is visible
        if (rect.height === 0 || styles.display === 'none' || styles.visibility === 'hidden') {
          issues.push(`Header ${index}: Hidden or zero height`);
        }
        
        // Check background vs text color contrast
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        if (bgColor === textColor || bgColor === 'transparent' && textColor.includes('rgb(0, 0, 0)')) {
          issues.push(`Header ${index}: Poor color contrast - bg: ${bgColor}, text: ${textColor}`);
        }
      });
      
      return issues;
    });
    
    // Test 2: Check for skip link issues
    console.log('🔗 Testing Skip Links...');
    const skipLinkIssues = await page.evaluate(() => {
      const issues = [];
      const skipLinks = document.querySelectorAll('.skip-link, [href="#main-content"], a[href^="#main"]');
      
      skipLinks.forEach((link, index) => {
        const styles = window.getComputedStyle(link);
        const rect = link.getBoundingClientRect();
        
        // Skip links should be hidden until focused
        if (styles.position !== 'absolute' && styles.position !== 'fixed') {
          issues.push(`Skip link ${index}: Not properly positioned (should be absolute/fixed)`);
        }
        
        // Check if visible when it shouldn't be
        if (rect.width > 1 && rect.height > 1 && styles.opacity === '1' && !link.matches(':focus')) {
          issues.push(`Skip link ${index}: Visible when not focused - "${link.textContent}"`);
        }
      });
      
      return issues;
    });
    
    // Test 3: Check for color contrast issues
    console.log('🎨 Testing Color Contrast...');
    const colorIssues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('*');
      
      for (let i = 0; i < Math.min(100, elements.length); i++) {
        const element = elements[i];
        const styles = window.getComputedStyle(element);
        const text = element.textContent?.trim();
        
        if (text && text.length > 0) {
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // Check for same colors
          if (color === backgroundColor) {
            issues.push(`Element "${text.substring(0, 30)}...": Same text and background color (${color})`);
          }
          
          // Check for dark text on dark background
          if (color.includes('rgb(0, 0, 0)') && backgroundColor.includes('rgb(0, 0, 0)')) {
            issues.push(`Element "${text.substring(0, 30)}...": Dark text on dark background`);
          }
          
          // Check for light text on light background  
          if (color.includes('rgb(255, 255, 255)') && backgroundColor.includes('rgb(255, 255, 255)')) {
            issues.push(`Element "${text.substring(0, 30)}...": Light text on light background`);
          }
        }
      }
      
      return issues;
    });
    
    // Test 4: Check typography issues
    console.log('📝 Testing Typography...');
    const typographyIssues = await page.evaluate(() => {
      const issues = [];
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
      
      textElements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const text = element.textContent?.trim();
        
        if (text && text.length > 0) {
          const fontSize = parseFloat(styles.fontSize);
          const lineHeight = parseFloat(styles.lineHeight);
          
          // Check for too small font size
          if (fontSize < 12) {
            issues.push(`Text element ${index}: Font too small (${fontSize}px) - "${text.substring(0, 30)}..."`);
          }
          
          // Check for poor line height
          if (lineHeight && lineHeight < fontSize * 1.2) {
            issues.push(`Text element ${index}: Line height too small (${lineHeight}px for ${fontSize}px font)`);
          }
        }
      });
      
      return issues;
    });
    
    // Test 5: Check for layout issues
    console.log('📏 Testing Layout...');
    const layoutIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check for horizontal overflow
      if (document.documentElement.scrollWidth > window.innerWidth) {
        issues.push(`Horizontal overflow detected: page width ${document.documentElement.scrollWidth}px > viewport ${window.innerWidth}px`);
      }
      
      // Check for overlapping elements
      const elements = document.querySelectorAll('div, section, article');
      for (let i = 0; i < Math.min(50, elements.length); i++) {
        const rect = elements[i].getBoundingClientRect();
        if (rect.left < 0) {
          issues.push(`Element ${i}: Positioned off-screen left (${rect.left}px)`);
        }
        if (rect.right > window.innerWidth) {
          issues.push(`Element ${i}: Extends beyond right edge (${rect.right}px > ${window.innerWidth}px)`);
        }
      }
      
      return issues;
    });
    
    // Compile all results
    const allIssues = {
      headerIssues,
      skipLinkIssues, 
      colorIssues: colorIssues.slice(0, 10), // Limit to first 10
      typographyIssues: typographyIssues.slice(0, 10), // Limit to first 10
      layoutIssues
    };
    
    // Display results
    console.log('\n🔴 CRITICAL ISSUES FOUND:\n');
    console.log('📊 HEADER VISIBILITY ISSUES:');
    allIssues.headerIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    
    console.log('\n🔗 SKIP LINK ISSUES:');
    allIssues.skipLinkIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    
    console.log('\n🎨 COLOR CONTRAST ISSUES (Top 10):');
    allIssues.colorIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    
    console.log('\n📝 TYPOGRAPHY ISSUES (Top 10):');
    allIssues.typographyIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    
    console.log('\n📏 LAYOUT ISSUES:');
    allIssues.layoutIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    
    console.log('\n📊 SUMMARY:');
    console.log(`🔴 Critical Issues: ${allIssues.headerIssues.length + allIssues.colorIssues.length}`);
    console.log(`🟠 High Issues: ${allIssues.skipLinkIssues.length + allIssues.layoutIssues.length}`);
    console.log(`🟡 Medium Issues: ${allIssues.typographyIssues.length}`);
    
    // Save results to file
    fs.writeFileSync('ui-test-results.json', JSON.stringify(allIssues, null, 2));
    console.log('\n💾 Results saved to ui-test-results.json');
    console.log('📸 Screenshot saved to landing-page-full.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testUIIssues().catch(console.error);