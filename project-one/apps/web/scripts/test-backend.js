#!/usr/bin/env node

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8001';
const API_URL = `${BACKEND_URL}/api`;

console.log('🔍 Testing Backend Connection...\n');

async function testBackend() {
  const tests = [];
  
  // Test 1: Health Check
  try {
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health check passed:', health.data);
    tests.push({ test: 'Health Check', status: 'PASS', data: health.data });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    tests.push({ test: 'Health Check', status: 'FAIL', error: error.message });
  }

  // Test 2: Compliance API
  try {
    console.log('\n2. Testing compliance API...');
    const complianceTest = await axios.post(`${API_URL}/compliance/check`, {
      content: "Buy this stock now! Guaranteed 50% returns in just 30 days!",
      contentType: "whatsapp",
      language: "en"
    });
    console.log('✅ Compliance API working:');
    console.log('   Risk Score:', complianceTest.data.riskScore);
    console.log('   Flags:', complianceTest.data.flags?.length || 0);
    tests.push({ test: 'Compliance API', status: 'PASS', data: complianceTest.data });
  } catch (error) {
    console.error('❌ Compliance API failed:', error.message);
    tests.push({ test: 'Compliance API', status: 'FAIL', error: error.message });
  }

  // Test 3: Rules Endpoint
  try {
    console.log('\n3. Testing rules endpoint...');
    const rules = await axios.get(`${API_URL}/compliance/rules`);
    console.log('✅ Rules endpoint working:');
    console.log('   Total rules:', rules.data.rules?.length || 0);
    tests.push({ test: 'Rules Endpoint', status: 'PASS', data: { count: rules.data.rules?.length } });
  } catch (error) {
    console.error('❌ Rules endpoint failed:', error.message);
    tests.push({ test: 'Rules Endpoint', status: 'FAIL', error: error.message });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));
  
  const passed = tests.filter(t => t.status === 'PASS').length;
  const failed = tests.filter(t => t.status === 'FAIL').length;
  
  tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test.test}: ${test.status}`);
  });
  
  console.log('\n' + '-'.repeat(50));
  console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend is fully operational.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please check the backend.`);
    process.exit(1);
  }
}

testBackend().catch(console.error);