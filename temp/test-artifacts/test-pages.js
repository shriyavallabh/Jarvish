/**
 * Simple test script to verify all pages render without errors
 * Run with: node test-pages.js
 */

const http = require('http');

const pages = [
  { path: '/', name: 'Landing Page' },
  { path: '/overview', name: 'Advisor Dashboard' },
  { path: '/approval-queue', name: 'Admin Dashboard' }
];

const testPage = (path, name) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          // Check for key theme elements
          const hasExecutiveClarity = data.includes('landing-page') || data.includes('advisor-dashboard') || data.includes('admin-dashboard');
          const hasProfessionalCard = data.includes('professional-card');
          const hasNoEmojis = !data.includes('🎯') && !data.includes('🚀') && !data.includes('📊');
          
          console.log(`✓ ${name} (${path}):`);
          console.log(`  - Status: ${res.statusCode} OK`);
          console.log(`  - Theme Applied: ${hasExecutiveClarity ? 'Yes' : 'No'}`);
          console.log(`  - Professional Cards: ${hasProfessionalCard ? 'Yes' : 'No'}`);
          console.log(`  - No Emojis: ${hasNoEmojis ? 'Yes' : 'No'}`);
          console.log('');
          
          resolve({ 
            name, 
            path, 
            success: true, 
            themeApplied: hasExecutiveClarity,
            professionalCards: hasProfessionalCard,
            noEmojis: hasNoEmojis
          });
        } else {
          console.log(`✗ ${name} (${path}): Status ${res.statusCode}`);
          resolve({ name, path, success: false, status: res.statusCode });
        }
      });
    });

    req.on('error', (e) => {
      console.error(`✗ ${name} (${path}): ${e.message}`);
      resolve({ name, path, success: false, error: e.message });
    });

    req.end();
  });
};

const runTests = async () => {
  console.log('=================================');
  console.log('EXECUTIVE CLARITY THEME TEST');
  console.log('=================================\n');
  
  console.log('Testing all pages for proper theme implementation...\n');
  
  const results = [];
  
  for (const page of pages) {
    const result = await testPage(page.path, page.name);
    results.push(result);
  }
  
  console.log('=================================');
  console.log('TEST SUMMARY');
  console.log('=================================\n');
  
  const successful = results.filter(r => r.success).length;
  const themeApplied = results.filter(r => r.themeApplied).length;
  const professionalCards = results.filter(r => r.professionalCards).length;
  const noEmojis = results.filter(r => r.noEmojis).length;
  
  console.log(`Pages Tested: ${results.length}`);
  console.log(`Pages Loaded Successfully: ${successful}/${results.length}`);
  console.log(`Pages with Executive Clarity Theme: ${themeApplied}/${results.length}`);
  console.log(`Pages with Professional Cards: ${professionalCards}/${results.length}`);
  console.log(`Pages without Emojis: ${noEmojis}/${results.length}`);
  
  if (successful === results.length && themeApplied === results.length && noEmojis === results.length) {
    console.log('\n✓ All tests passed! Executive Clarity theme is properly implemented.');
  } else {
    console.log('\n✗ Some tests failed. Please review the results above.');
  }
  
  console.log('\n=================================\n');
};

// Check if server is running
const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200 || res.statusCode === 404) {
      runTests();
    }
  });

  req.on('error', (e) => {
    console.log('Server not running on port 3000.');
    console.log('Please run "npm run dev" first, then run this test.');
  });

  req.end();
};

checkServer();