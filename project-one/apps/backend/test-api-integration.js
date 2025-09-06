#!/usr/bin/env node

/**
 * Jarvish Platform API Integration Tests
 * Comprehensive testing of all API endpoints
 */

const axios = require('axios');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  white: '\x1b[37m'
};

// Color helper functions
const colorize = {
  green: (text) => `${colors.green}${text}${colors.reset}`,
  red: (text) => `${colors.red}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  bold: (text) => `${colors.bold}${text}${colors.reset}`,
  boldBlue: (text) => `${colors.bold}${colors.blue}${text}${colors.reset}`,
  boldWhite: (text) => `${colors.bold}${colors.white}${text}${colors.reset}`
};

// Configure axios
const api = axios.create({
  baseURL: 'http://localhost:8001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  endpoints: {}
};

// Helper functions
const log = {
  test: (name) => console.log(`\n${colorize.boldBlue(`📝 Testing: ${name}`)}`),
  success: (msg) => console.log(`  ${colorize.green('✅')} ${msg}`),
  error: (msg) => console.log(`  ${colorize.red('❌')} ${msg}`),
  info: (msg) => console.log(`  ${colorize.blue('ℹ️')} ${msg}`),
  warn: (msg) => console.log(`  ${colorize.yellow('⚠️')} ${msg}`)
};

// Test functions
async function testEndpoint(name, method, url, data = null, expectedStatus = 200) {
  testResults.total++;
  
  try {
    const config = {
      method,
      url,
      ...(data && { data })
    };
    
    const response = await api.request(config);
    
    if (response.status === expectedStatus) {
      log.success(`${method} ${url} - Status ${response.status}`);
      testResults.passed++;
      testResults.endpoints[`${method} ${url}`] = 'passed';
      return response.data;
    } else {
      log.error(`${method} ${url} - Expected ${expectedStatus}, got ${response.status}`);
      testResults.failed++;
      testResults.endpoints[`${method} ${url}`] = 'failed';
      return null;
    }
  } catch (error) {
    if (error.response && error.response.status === expectedStatus) {
      log.success(`${method} ${url} - Status ${error.response.status} (expected error)`);
      testResults.passed++;
      testResults.endpoints[`${method} ${url}`] = 'passed';
      return error.response.data;
    } else {
      log.error(`${method} ${url} - ${error.message}`);
      testResults.failed++;
      testResults.endpoints[`${method} ${url}`] = 'failed';
      return null;
    }
  }
}

// Test suites
async function testHealthEndpoints() {
  log.test('Health & Status Endpoints');
  
  await testEndpoint('Main health check', 'GET', '/health');
  await testEndpoint('API version info', 'GET', '/api/v1');
  await testEndpoint('Compliance health', 'GET', '/api/compliance/health');
  await testEndpoint('WhatsApp health', 'GET', '/api/whatsapp/health');
  await testEndpoint('Image health', 'GET', '/api/images/health');
  await testEndpoint('Billing health', 'GET', '/api/billing/health');
  await testEndpoint('Monitoring health', 'GET', '/api/monitoring/health');
  await testEndpoint('Webhook health', 'GET', '/api/webhooks/health');
}

async function testComplianceEndpoints() {
  log.test('Compliance Engine');
  
  // Test compliance checking
  const complianceCheck = await testEndpoint(
    'Compliance check - compliant content',
    'POST',
    '/api/compliance/check',
    {
      content: 'Mutual funds are subject to market risks. Please read all scheme related documents carefully.',
      type: 'marketing'
    }
  );
  
  if (complianceCheck && complianceCheck.data) {
    log.info(`Processing time: ${complianceCheck.data.processingTime}ms`);
    log.info(`Risk score: ${complianceCheck.data.riskScore}`);
  }
  
  // Test non-compliant content
  await testEndpoint(
    'Compliance check - non-compliant content',
    'POST',
    '/api/compliance/check',
    {
      content: 'Guaranteed 25% returns! Zero risk investment opportunity!',
      type: 'marketing'
    }
  );
  
  // Test batch compliance
  await testEndpoint(
    'Batch compliance check',
    'POST',
    '/api/compliance/batch',
    {
      contents: [
        { content: 'Invest wisely in mutual funds', type: 'marketing' },
        { content: 'Assured returns of 15% per annum', type: 'marketing' }
      ]
    }
  );
  
  // Get compliance rules
  await testEndpoint('Get compliance rules', 'GET', '/api/compliance/rules');
  
  // Get compliance stats
  await testEndpoint('Get compliance stats', 'GET', '/api/compliance/stats');
  
  // Test content generation
  await testEndpoint(
    'Generate compliant content',
    'POST',
    '/api/compliance/generate',
    {
      topic: 'mutual fund benefits',
      type: 'educational',
      language: 'en'
    }
  );
  
  // Test compliance fix
  await testEndpoint(
    'Fix non-compliant content',
    'POST',
    '/api/compliance/fix',
    {
      content: 'Guaranteed profits with our investment scheme!',
      type: 'marketing'
    }
  );
}

async function testBillingEndpoints() {
  log.test('Billing & Subscription');
  
  await testEndpoint('Get subscription plans', 'GET', '/api/billing/plans');
  await testEndpoint('Get pricing', 'GET', '/api/billing/pricing');
  await testEndpoint('Get plan comparison', 'GET', '/api/billing/comparison');
  await testEndpoint('Get billing stats', 'GET', '/api/billing/stats');
  
  // Test promo code validation
  await testEndpoint(
    'Validate promo code',
    'POST',
    '/api/billing/validate-promo',
    { code: 'LAUNCH50' }
  );
  
  // Test invoice preview
  await testEndpoint(
    'Generate invoice preview',
    'POST',
    '/api/billing/invoice-preview',
    {
      planId: 'standard',
      billingCycle: 'monthly',
      promoCode: 'LAUNCH50'
    }
  );
  
  // Test usage stats
  await testEndpoint(
    'Get usage statistics',
    'POST',
    '/api/billing/usage',
    { userId: 'test-user-123' }
  );
  
  // Test plan change eligibility
  await testEndpoint(
    'Check plan change eligibility',
    'POST',
    '/api/billing/can-change-plan',
    {
      userId: 'test-user-123',
      currentPlan: 'basic',
      targetPlan: 'standard'
    }
  );
}

async function testImageEndpoints() {
  log.test('Image Processing');
  
  await testEndpoint('Get storage stats', 'GET', '/api/images/storage-stats');
  
  // Test GPT image processing
  await testEndpoint(
    'Process GPT image',
    'POST',
    '/api/images/process-gpt',
    {
      imageUrl: 'https://example.com/test-image.jpg',
      advisorName: 'Test Advisor',
      advisorPhone: '919999999999'
    }
  );
  
  // Test URL image processing
  await testEndpoint(
    'Process image from URL',
    'POST',
    '/api/images/process-url',
    {
      imageUrl: 'https://example.com/test-image.jpg',
      width: 1200,
      height: 628
    }
  );
  
  // Test WhatsApp format generation
  await testEndpoint(
    'Generate WhatsApp formats',
    'POST',
    '/api/images/whatsapp-formats',
    {
      imageUrl: 'https://example.com/test-image.jpg',
      formats: ['story', 'post', 'thumbnail']
    }
  );
  
  // Test batch processing
  await testEndpoint(
    'Batch process images',
    'POST',
    '/api/images/batch-process',
    {
      images: [
        { url: 'https://example.com/image1.jpg', format: 'whatsapp' },
        { url: 'https://example.com/image2.jpg', format: 'whatsapp' }
      ]
    }
  );
  
  // Test cleanup
  await testEndpoint(
    'Clean up old images',
    'POST',
    '/api/images/cleanup',
    { daysOld: 30 }
  );
}

async function testMonitoringEndpoints() {
  log.test('Monitoring & Analytics');
  
  await testEndpoint('Get system metrics', 'GET', '/api/monitoring/metrics/system');
  await testEndpoint('Get business metrics', 'GET', '/api/monitoring/metrics/business');
  await testEndpoint('Get performance metrics', 'GET', '/api/monitoring/metrics/performance');
  await testEndpoint('Get alerts', 'GET', '/api/monitoring/alerts');
  await testEndpoint('Get dashboard data', 'GET', '/api/monitoring/dashboard');
  await testEndpoint('Get daily report', 'GET', '/api/monitoring/reports/daily');
  
  // Test performance logging
  await testEndpoint(
    'Log performance metric',
    'POST',
    '/api/monitoring/log-performance',
    {
      endpoint: '/api/test',
      method: 'GET',
      responseTime: 125,
      statusCode: 200
    }
  );
}

async function testAnalyticsEndpoints() {
  log.test('Analytics & Business Intelligence');
  
  await testEndpoint('Get advisor metrics', 'GET', '/api/analytics/advisors');
  await testEndpoint('Get content analytics', 'GET', '/api/analytics/content');
  await testEndpoint('Get revenue analytics', 'GET', '/api/analytics/revenue');
  await testEndpoint('Get churn prediction', 'GET', '/api/analytics/churn-prediction');
  await testEndpoint('Get platform insights', 'GET', '/api/analytics/platform-insights');
  await testEndpoint('Get BI report', 'GET', '/api/analytics/business-intelligence');
  await testEndpoint('Get analytics dashboard', 'GET', '/api/analytics/dashboard');
  
  // Test export functionality
  await testEndpoint(
    'Export analytics data',
    'POST',
    '/api/analytics/export',
    {
      type: 'advisor-performance',
      format: 'csv',
      dateRange: {
        from: '2025-01-01',
        to: '2025-01-31'
      }
    }
  );
}

async function testWhatsAppEndpoints() {
  log.test('WhatsApp Integration');
  
  // Note: These will fail without proper WhatsApp credentials
  await testEndpoint('Get templates', 'GET', '/api/whatsapp/templates', null, 500);
  await testEndpoint('Get approved templates', 'GET', '/api/whatsapp/templates/approved', null, 500);
  await testEndpoint('Get image templates', 'GET', '/api/whatsapp/templates/image', null, 500);
  
  // Test template creation (will fail without credentials)
  await testEndpoint(
    'Create WhatsApp template',
    'POST',
    '/api/whatsapp/templates',
    {
      name: 'test_template',
      category: 'MARKETING',
      language: 'en',
      bodyText: 'Hello {{1}}, this is a test message'
    },
    500
  );
  
  // Test financial template creation
  await testEndpoint(
    'Create financial template',
    'POST',
    '/api/whatsapp/templates/financial',
    {
      type: 'daily_update',
      variables: {
        advisorName: 'Test Advisor',
        marketSummary: 'Market update text'
      }
    },
    500
  );
}

async function testWebhookEndpoints() {
  log.test('Webhook Endpoints');
  
  // Test WhatsApp webhook verification
  await testEndpoint(
    'WhatsApp webhook verification',
    'GET',
    '/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=jarvish_verify_token_2025&hub.challenge=test123',
    null,
    200
  );
  
  // Test WhatsApp webhook event
  await testEndpoint(
    'WhatsApp webhook event',
    'POST',
    '/api/webhooks/whatsapp',
    {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                messages: [
                  {
                    from: '919999999999',
                    type: 'text',
                    text: { body: 'Test message' }
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  );
  
  // Test Razorpay webhook (will fail without signature)
  await testEndpoint(
    'Razorpay webhook',
    'POST',
    '/api/webhooks/razorpay',
    {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test123',
            amount: 299900
          }
        }
      }
    },
    400
  );
}

// Generate report
function generateReport() {
  console.log('\n' + colorize.boldBlue('═'.repeat(60)));
  console.log(colorize.boldWhite('API INTEGRATION TEST REPORT'));
  console.log(colorize.boldBlue('═'.repeat(60)));
  
  const successRate = testResults.total > 0 
    ? Math.round((testResults.passed / testResults.total) * 100) 
    : 0;
  
  console.log(`\n${colorize.bold('Summary:')}`);
  console.log(`  Total Tests: ${testResults.total}`);
  console.log(`  ${colorize.green(`Passed: ${testResults.passed}`)}`);
  console.log(`  ${colorize.red(`Failed: ${testResults.failed}`)}`);
  console.log(`  Success Rate: ${successRate >= 80 ? colorize.green(successRate + '%') : 
                                 successRate >= 60 ? colorize.yellow(successRate + '%') : 
                                 colorize.red(successRate + '%')}`);
  
  // Show failed endpoints
  const failedEndpoints = Object.entries(testResults.endpoints)
    .filter(([_, status]) => status === 'failed')
    .map(([endpoint, _]) => endpoint);
  
  if (failedEndpoints.length > 0) {
    console.log(`\n${colorize.bold('Failed Endpoints:')}`);
    failedEndpoints.forEach(endpoint => {
      console.log(`  ${colorize.red('•')} ${endpoint}`);
    });
  }
  
  // Recommendations
  console.log(`\n${colorize.bold('Recommendations:')}`);
  
  if (successRate === 100) {
    console.log(`  ${colorize.green('✅')} All API endpoints are working perfectly!`);
  } else {
    console.log(`  ${colorize.yellow('⚠️')} Some endpoints need attention:`);
    
    if (failedEndpoints.some(e => e.includes('whatsapp'))) {
      console.log(`    • Configure WhatsApp Business API credentials`);
    }
    if (failedEndpoints.some(e => e.includes('compliance/generate'))) {
      console.log(`    • Add OpenAI API key for AI features`);
    }
    if (failedEndpoints.some(e => e.includes('razorpay'))) {
      console.log(`    • Configure Razorpay for payment processing`);
    }
  }
  
  console.log('\n' + colorize.boldBlue('═'.repeat(60)));
}

// Main test runner
async function runTests() {
  console.log(colorize.boldBlue('═'.repeat(60)));
  console.log(colorize.boldWhite('JARVISH PLATFORM API INTEGRATION TESTS'));
  console.log(colorize.boldBlue('═'.repeat(60)));
  
  // Check if server is running
  try {
    await api.get('/health');
    log.success('Server is running on port 8001');
  } catch (error) {
    log.error('Server is not running! Start with: npm run dev');
    process.exit(1);
  }
  
  // Run test suites
  await testHealthEndpoints();
  await testComplianceEndpoints();
  await testBillingEndpoints();
  await testImageEndpoints();
  await testMonitoringEndpoints();
  await testAnalyticsEndpoints();
  await testWhatsAppEndpoints();
  await testWebhookEndpoints();
  
  // Generate report
  generateReport();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(colorize.red('\nUnhandled error:'), error);
  process.exit(1);
});

// Run tests
runTests().catch(console.error);