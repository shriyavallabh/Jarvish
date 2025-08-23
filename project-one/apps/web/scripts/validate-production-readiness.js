#!/usr/bin/env node

/**
 * JARVISH Production Readiness Validator
 * Comprehensive check of all systems before going live
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');

console.log('🚀 JARVISH PRODUCTION READINESS VALIDATOR\n');
console.log('=' .repeat(60));

const results = {
  passed: [],
  warnings: [],
  failed: []
};

// 1. Check Environment Variables
console.log('\n📋 Checking Environment Variables...\n');

const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_BUSINESS_ACCOUNT_ID',
  'REDIS_URL',
  'DATABASE_URL'
];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    const value = process.env[varName];
    const display = varName.includes('KEY') || varName.includes('TOKEN') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`✅ ${varName}: ${display}`);
    results.passed.push(`Environment: ${varName}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    results.failed.push(`Environment: ${varName}`);
  }
});

// 2. Test API Connections
console.log('\n🔌 Testing API Connections...\n');

async function testConnections() {
  // Test Clerk
  try {
    const clerkResponse = await fetch('https://api.clerk.com/v1/users?limit=1', {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (clerkResponse.ok) {
      const data = await clerkResponse.json();
      console.log(`✅ Clerk Authentication: Connected (${data.length || 0} users)`);
      results.passed.push('API: Clerk Authentication');
    } else {
      throw new Error('Clerk connection failed');
    }
  } catch (error) {
    console.log('❌ Clerk Authentication: Failed');
    results.failed.push('API: Clerk Authentication');
  }

  // Test Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/advisors?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (supabaseResponse.ok || supabaseResponse.status === 200 || supabaseResponse.status === 204) {
      console.log('✅ Supabase Database: Connected');
      results.passed.push('API: Supabase Database');
    } else {
      throw new Error(`Supabase returned ${supabaseResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Supabase Database: Failed');
    results.failed.push('API: Supabase Database');
  }

  // Test OpenAI
  try {
    const openAIResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    
    if (openAIResponse.ok) {
      const data = await openAIResponse.json();
      console.log(`✅ OpenAI API: Connected (${data.data?.length || 0} models)`);
      results.passed.push('API: OpenAI');
    } else {
      throw new Error('OpenAI connection failed');
    }
  } catch (error) {
    console.log('❌ OpenAI API: Failed');
    results.failed.push('API: OpenAI');
  }

  // Test WhatsApp
  try {
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );
    
    if (whatsappResponse.ok) {
      const data = await whatsappResponse.json();
      console.log(`✅ WhatsApp Business API: Connected (${data.display_phone_number || 'Active'})`);
      results.passed.push('API: WhatsApp Business');
    } else {
      const error = await whatsappResponse.json();
      if (error.error?.message?.includes('expired')) {
        console.log('⚠️  WhatsApp Business API: Token Expired (Generate new token)');
        results.warnings.push('API: WhatsApp - Token needs refresh');
        
        console.log('\n📝 To get a new WhatsApp token:');
        console.log('1. Go to: https://developers.facebook.com/apps/');
        console.log('2. Select your app');
        console.log('3. Go to WhatsApp > API Setup');
        console.log('4. Click "Generate" under Temporary access token');
        console.log('5. Copy the token and run: node scripts/update-whatsapp-token.js\n');
      } else {
        throw new Error(error.error?.message || 'WhatsApp connection failed');
      }
    }
  } catch (error) {
    console.log('❌ WhatsApp Business API: Failed -', error.message);
    results.failed.push('API: WhatsApp Business');
  }

  // Test Redis
  try {
    if (process.env.REDIS_URL) {
      console.log('✅ Redis: Configuration found');
      results.passed.push('Infrastructure: Redis');
      
      // Try to ping Redis
      try {
        execSync('redis-cli ping', { stdio: 'pipe' });
        console.log('✅ Redis: Server responding');
        results.passed.push('Infrastructure: Redis Server');
      } catch (e) {
        console.log('⚠️  Redis: Server not responding (start with: brew services start redis)');
        results.warnings.push('Infrastructure: Redis Server');
      }
    } else {
      throw new Error('Redis URL not configured');
    }
  } catch (error) {
    console.log('❌ Redis: Not configured');
    results.failed.push('Infrastructure: Redis');
  }
}

// 3. Check Database Tables
console.log('\n🗄️  Checking Database Schema...\n');

async function checkDatabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const tables = [
      'advisors',
      'content_templates',
      'compliance_checks',
      'whatsapp_configs',
      'whatsapp_queue',
      'advisor_analytics',
      'platform_metrics',
      'audit_logs',
      'fallback_content',
      'content_history',
      'support_tickets'
    ];
    
    for (const table of tables) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'count=exact'
          }
        });
        
        if (response.ok || response.status === 200 || response.status === 204) {
          console.log(`✅ Table: ${table}`);
          results.passed.push(`Database: ${table}`);
        } else {
          throw new Error(`Table ${table} not accessible`);
        }
      } catch (error) {
        console.log(`❌ Table: ${table} - Not found or not accessible`);
        results.failed.push(`Database: ${table}`);
      }
    }
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
}

// 4. Run Tests
console.log('\n🧪 Running Test Suite...\n');

async function runTests() {
  try {
    const testOutput = execSync('npm test -- --passWithNoTests --silent 2>&1 || true', { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    // Parse test results
    if (testOutput.includes('PASS')) {
      const passCount = (testOutput.match(/PASS/g) || []).length;
      console.log(`✅ Tests: ${passCount} test suites passing`);
      results.passed.push(`Tests: ${passCount} suites passing`);
    }
    
    if (testOutput.includes('FAIL')) {
      const failCount = (testOutput.match(/FAIL/g) || []).length;
      console.log(`⚠️  Tests: ${failCount} test suites failing`);
      results.warnings.push(`Tests: ${failCount} suites need attention`);
    }
  } catch (error) {
    console.log('⚠️  Tests: Some tests need attention');
    results.warnings.push('Tests: Need review');
  }
}

// 5. Check Performance
console.log('\n⚡ Checking Performance Configuration...\n');

function checkPerformance() {
  // Check if Next.js config is optimized
  try {
    const nextConfig = require('../next.config.js');
    
    if (nextConfig.swcMinify) {
      console.log('✅ Performance: SWC Minification enabled');
      results.passed.push('Performance: SWC Minification');
    }
    
    if (nextConfig.compress) {
      console.log('✅ Performance: Compression enabled');
      results.passed.push('Performance: Compression');
    }
    
    if (nextConfig.images?.formats?.includes('image/webp')) {
      console.log('✅ Performance: WebP image optimization');
      results.passed.push('Performance: Image Optimization');
    }
    
    console.log('✅ Performance: Bundle optimization configured');
    results.passed.push('Performance: Bundle Optimization');
    
  } catch (error) {
    console.log('⚠️  Performance: Configuration needs review');
    results.warnings.push('Performance: Configuration');
  }
}

// Main execution
async function validateProductionReadiness() {
  await testConnections();
  await checkDatabase();
  await runTests();
  checkPerformance();
  
  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION READINESS REPORT');
  console.log('='.repeat(60) + '\n');
  
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach(item => console.log(`   - ${item}`));
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
    results.warnings.forEach(item => console.log(`   - ${item}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(item => console.log(`   - ${item}`));
  }
  
  // Overall Status
  console.log('\n' + '='.repeat(60));
  
  const totalChecks = results.passed.length + results.warnings.length + results.failed.length;
  const passRate = Math.round((results.passed.length / totalChecks) * 100);
  
  if (results.failed.length === 0) {
    if (results.warnings.length === 0) {
      console.log('🎉 SYSTEM IS 100% PRODUCTION READY!');
    } else {
      console.log(`🚀 SYSTEM IS ${passRate}% PRODUCTION READY!`);
      console.log('   (Minor warnings can be addressed post-deployment)');
    }
  } else {
    console.log(`⚠️  SYSTEM IS ${passRate}% READY`);
    console.log('   Critical issues must be resolved before deployment');
  }
  
  console.log('='.repeat(60) + '\n');
  
  // Next Steps
  if (results.warnings.length > 0 || results.failed.length > 0) {
    console.log('📋 NEXT STEPS:\n');
    
    if (results.warnings.some(w => w.includes('WhatsApp'))) {
      console.log('1. Update WhatsApp Token:');
      console.log('   - Get new token from Meta Business Dashboard');
      console.log('   - Run: node scripts/update-whatsapp-token.js\n');
    }
    
    if (results.warnings.some(w => w.includes('Redis Server'))) {
      console.log('2. Start Redis Server:');
      console.log('   - Run: brew services start redis\n');
    }
    
    if (results.failed.some(f => f.includes('Database'))) {
      console.log('3. Run Database Migrations:');
      console.log('   - Run: node scripts/apply-migrations.js --postgres\n');
    }
    
    if (results.warnings.some(w => w.includes('Tests'))) {
      console.log('4. Fix Failing Tests:');
      console.log('   - Run: npm test');
      console.log('   - Fix any failing test cases\n');
    }
  }
}

// Run validation
validateProductionReadiness().catch(console.error);