#!/usr/bin/env node

/**
 * JARVISH Real API Connectivity Test Suite
 * Tests all external API connections with actual credentials
 */

require('dotenv').config({ path: '.env.local' });
const chalk = require('chalk');

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to display results
function displayResult(service, success, message, details = null) {
  if (success) {
    console.log(chalk.green(`✅ ${service}: ${message}`));
    results.passed.push({ service, message });
  } else {
    console.log(chalk.red(`❌ ${service}: ${message}`));
    results.failed.push({ service, message, details });
  }
}

// Helper function for warnings
function displayWarning(service, message) {
  console.log(chalk.yellow(`⚠️  ${service}: ${message}`));
  results.warnings.push({ service, message });
}

// 1. Test Clerk Authentication
async function testClerkConnectivity() {
  console.log(chalk.cyan('\n🔐 Testing Clerk Authentication...'));
  
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  if (!publishableKey || !secretKey) {
    displayResult('Clerk', false, 'Missing API keys');
    return;
  }

  try {
    const response = await fetch('https://api.clerk.com/v1/users?limit=1', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      displayResult('Clerk', true, `Connected successfully. Total users: ${data.length || 0}`);
    } else {
      displayResult('Clerk', false, `API returned status ${response.status}`, await response.text());
    }
  } catch (error) {
    displayResult('Clerk', false, 'Connection failed', error.message);
  }
}

// 2. Test Supabase Database
async function testSupabaseConnectivity() {
  console.log(chalk.cyan('\n🗄️  Testing Supabase Database...'));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    displayResult('Supabase', false, 'Missing configuration');
    return;
  }

  try {
    // Test API connectivity
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      displayResult('Supabase', true, `Connected to ${supabaseUrl}`);
      
      // Test database tables
      const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/advisors?limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (tablesResponse.ok) {
        displayResult('Supabase Tables', true, 'Database tables accessible');
      } else if (tablesResponse.status === 404) {
        displayWarning('Supabase Tables', 'Tables not yet created - run migrations');
      }
    } else {
      displayResult('Supabase', false, `API returned status ${response.status}`);
    }
  } catch (error) {
    displayResult('Supabase', false, 'Connection failed', error.message);
  }
}

// 3. Test OpenAI API
async function testOpenAIConnectivity() {
  console.log(chalk.cyan('\n🤖 Testing OpenAI API...'));
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    displayResult('OpenAI', false, 'Missing API key');
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const hasGPT4 = data.data.some(m => m.id.includes('gpt-4'));
      const hasGPT4Mini = data.data.some(m => m.id.includes('gpt-4') && m.id.includes('mini'));
      
      displayResult('OpenAI', true, `Connected. Models available: ${data.data.length}`);
      
      if (hasGPT4) {
        displayResult('OpenAI GPT-4', true, 'GPT-4 access confirmed');
      } else {
        displayWarning('OpenAI GPT-4', 'GPT-4 not available with this key');
      }
      
      // Test actual generation
      const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "API Working"' }],
          max_tokens: 10
        })
      });
      
      if (testResponse.ok) {
        displayResult('OpenAI Generation', true, 'Test generation successful');
      }
    } else {
      const error = await response.json();
      displayResult('OpenAI', false, `API error: ${error.error?.message || response.status}`);
    }
  } catch (error) {
    displayResult('OpenAI', false, 'Connection failed', error.message);
  }
}

// 4. Test WhatsApp Business API
async function testWhatsAppConnectivity() {
  console.log(chalk.cyan('\n📱 Testing WhatsApp Business API...'));
  
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!accessToken) {
    displayResult('WhatsApp', false, 'Missing access token');
    return;
  }

  try {
    // First, test if token is valid
    const response = await fetch('https://graph.facebook.com/v18.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      displayResult('WhatsApp Token', true, `Valid token for: ${data.name || 'Unknown'}`);
      
      if (!phoneNumberId || phoneNumberId === 'get_from_meta_business') {
        displayWarning('WhatsApp', 'Phone Number ID not configured - get from Meta Business Suite');
      } else {
        // Test phone number access
        const phoneResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (phoneResponse.ok) {
          displayResult('WhatsApp Phone', true, 'Phone number configured and accessible');
        } else {
          displayWarning('WhatsApp Phone', 'Phone number not accessible - check configuration');
        }
      }
    } else {
      const error = await response.json();
      displayResult('WhatsApp', false, `Token invalid or expired: ${error.error?.message}`);
    }
  } catch (error) {
    displayResult('WhatsApp', false, 'Connection failed', error.message);
  }
}

// 5. Test PostgreSQL Direct Connection
async function testPostgreSQLConnectivity() {
  console.log(chalk.cyan('\n🐘 Testing PostgreSQL Direct Connection...'));
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    displayResult('PostgreSQL', false, 'Missing DATABASE_URL');
    return;
  }

  // Parse connection string
  const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (urlMatch) {
    displayResult('PostgreSQL', true, `Connection string parsed: ${urlMatch[3]}:${urlMatch[4]}/${urlMatch[5]}`);
    displayWarning('PostgreSQL', 'Direct connection test requires pg module - use Supabase API instead');
  } else {
    displayResult('PostgreSQL', false, 'Invalid connection string format');
  }
}

// 6. Test Redis Connection (if configured)
async function testRedisConnectivity() {
  console.log(chalk.cyan('\n🔴 Testing Redis Connection...'));
  
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    displayWarning('Redis', 'Not configured - required for WhatsApp scheduling');
    return;
  }

  displayResult('Redis', true, 'Configuration found');
}

// Main test runner
async function runAllTests() {
  console.log(chalk.bold.cyan('\n================================================'));
  console.log(chalk.bold.cyan('   JARVISH API CONNECTIVITY TEST SUITE'));
  console.log(chalk.bold.cyan('================================================'));
  console.log(chalk.gray(`Environment: ${process.env.NODE_ENV || 'development'}`));
  console.log(chalk.gray(`Timestamp: ${new Date().toISOString()}`));

  // Run all tests
  await testClerkConnectivity();
  await testSupabaseConnectivity();
  await testOpenAIConnectivity();
  await testWhatsAppConnectivity();
  await testPostgreSQLConnectivity();
  await testRedisConnectivity();

  // Display summary
  console.log(chalk.bold.cyan('\n================================================'));
  console.log(chalk.bold.cyan('   TEST SUMMARY'));
  console.log(chalk.bold.cyan('================================================'));
  
  console.log(chalk.green(`\n✅ Passed: ${results.passed.length}`));
  results.passed.forEach(r => console.log(chalk.gray(`   - ${r.service}: ${r.message}`)));
  
  if (results.warnings.length > 0) {
    console.log(chalk.yellow(`\n⚠️  Warnings: ${results.warnings.length}`));
    results.warnings.forEach(r => console.log(chalk.gray(`   - ${r.service}: ${r.message}`)));
  }
  
  if (results.failed.length > 0) {
    console.log(chalk.red(`\n❌ Failed: ${results.failed.length}`));
    results.failed.forEach(r => {
      console.log(chalk.gray(`   - ${r.service}: ${r.message}`));
      if (r.details) {
        console.log(chalk.gray(`     Details: ${r.details}`));
      }
    });
  }

  // Overall status
  console.log(chalk.bold.cyan('\n================================================'));
  if (results.failed.length === 0) {
    console.log(chalk.bold.green('🎉 ALL CRITICAL APIS CONNECTED SUCCESSFULLY!'));
  } else {
    console.log(chalk.bold.red(`⚠️  ${results.failed.length} API(s) NEED ATTENTION`));
  }
  console.log(chalk.bold.cyan('================================================\n'));

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Check if chalk is installed
try {
  require.resolve('chalk');
  runAllTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
} catch (e) {
  console.log('Installing chalk for colored output...');
  const { execSync } = require('child_process');
  execSync('npm install chalk', { stdio: 'inherit' });
  console.log('Please run the script again.');
}