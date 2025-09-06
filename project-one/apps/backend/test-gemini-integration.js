#!/usr/bin/env node

/**
 * Test script for Gemini image generation integration
 * Run: node test-gemini-integration.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const GEMINI_API_KEY = 'AIzaSyC15ewbSpMcboNAmMJhsj1dZmXA8l8yeGQ';

// Test configurations for different content types
const testCases = [
  {
    name: 'Market Update - English',
    payload: {
      content: 'Sensex surges 850 points to close at 72,500. Banking and IT stocks lead the rally. HDFC Bank up 3.2%, Infosys gains 2.8%.',
      contentType: 'market-update',
      language: 'en',
      format: 'post',
      advisorName: 'Rajesh Kumar, MFD',
      euin: 'E123456',
      includeDisclaimer: true
    }
  },
  {
    name: 'Educational Content - Hindi',
    payload: {
      content: 'SIP के 5 फायदे: 1. छोटी राशि से शुरुआत 2. रुपया कॉस्ट एवरेजिंग 3. कंपाउंडिंग का लाभ 4. अनुशासित निवेश 5. लचीलापन',
      contentType: 'educational',
      language: 'hi',
      format: 'status',
      advisorName: 'प्रिया शर्मा',
      includeDisclaimer: true
    }
  },
  {
    name: 'Tax Planning - English',
    payload: {
      content: 'Save up to ₹46,800 in taxes! Invest in ELSS mutual funds under Section 80C. Deadline: March 31, 2024. Lock-in period: 3 years only.',
      contentType: 'tax-planning',
      language: 'en',
      format: 'linkedin',
      advisorName: 'CA Amit Patel',
      euin: 'E789012',
      includeDisclaimer: true
    }
  },
  {
    name: 'Festival Greeting - Marathi',
    payload: {
      content: 'दिवाळीच्या हार्दिक शुभेच्छा! या दिवाळीत गुंतवणूक करून आपल्या भविष्याला उजळवा. म्युच्युअल फंडमध्ये SIP सुरू करा.',
      contentType: 'festival',
      language: 'mr',
      format: 'status',
      advisorName: 'संजय देशपांडे',
      includeDisclaimer: true
    }
  }
];

// Helper function to save base64 image
function saveBase64Image(base64Data, filename) {
  const buffer = Buffer.from(base64Data, 'base64');
  const outputPath = path.join(__dirname, 'test-outputs', filename);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'test-outputs'))) {
    fs.mkdirSync(path.join(__dirname, 'test-outputs'));
  }
  
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Image saved to: ${outputPath}`);
  return outputPath;
}

// Test direct Gemini API call
async function testDirectGeminiAPI() {
  console.log('\n🔧 Testing Direct Gemini API Connection...\n');
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = 'Generate a simple SVG with text "Gemini Test" in blue color';
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API Connection Successful!');
    console.log('Response preview:', text.substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('❌ Gemini API Connection Failed:', error.message);
    return false;
  }
}

// Test image generation endpoint
async function testImageGeneration() {
  console.log('\n🎨 Testing Image Generation Endpoints...\n');
  
  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    console.log('Payload:', JSON.stringify(testCase.payload, null, 2));
    
    try {
      // Make API call
      const response = await axios.post(
        `${API_BASE_URL}/images/test-gemini`,
        testCase.payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        const { testImage } = response.data;
        const filename = `${testCase.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
        
        // Save the image
        saveBase64Image(testImage.data, filename);
        
        console.log(`✅ Success!`);
        console.log(`   Dimensions: ${testImage.dimensions.width}x${testImage.dimensions.height}`);
        console.log(`   Size: ${testImage.sizeKB.toFixed(2)} KB`);
      }
    } catch (error) {
      console.error(`❌ Failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Test batch generation
async function testBatchGeneration() {
  console.log('\n📦 Testing Batch Generation...\n');
  
  const batchPayload = {
    images: testCases.slice(0, 3).map(tc => tc.payload)
  };
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/images/generate-batch`,
      batchPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          // Add a mock auth token if needed
          'Authorization': 'Bearer test-token'
        }
      }
    );
    
    if (response.data.success) {
      console.log(`✅ Batch generation successful!`);
      console.log(`   Generated ${response.data.count} images`);
      
      // Save batch images
      response.data.images.forEach((image, index) => {
        const filename = `batch-image-${index + 1}.jpg`;
        saveBase64Image(image.data, filename);
      });
    }
  } catch (error) {
    console.error(`❌ Batch generation failed: ${error.response?.data?.message || error.message}`);
  }
}

// Test templates endpoint
async function testTemplates() {
  console.log('\n📋 Testing Templates Endpoint...\n');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/images/templates`,
      {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Available Templates:');
      Object.entries(response.data.templates).forEach(([key, template]) => {
        console.log(`\n   ${template.name}:`);
        console.log(`   - ${template.description}`);
        console.log(`   - Languages: ${template.languages.join(', ')}`);
        console.log(`   - Formats: ${template.formats.join(', ')}`);
      });
    }
  } catch (error) {
    console.error(`❌ Failed to fetch templates: ${error.response?.data?.message || error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Gemini Integration Tests\n');
  console.log('================================\n');
  
  // Test direct API connection first
  const apiWorking = await testDirectGeminiAPI();
  
  if (!apiWorking) {
    console.log('\n⚠️  Direct API connection failed. Checking server integration...\n');
  }
  
  // Run all tests
  await testImageGeneration();
  await testTemplates();
  // await testBatchGeneration(); // Uncomment when auth is properly set up
  
  console.log('\n================================');
  console.log('✅ All tests completed!\n');
  console.log('Check the test-outputs directory for generated images.\n');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});