#!/usr/bin/env node

/**
 * Test Gemini 2.5 Flash Image Preview Model
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini25Model() {
  console.log('🚀 Testing Gemini 2.5 Flash Image Preview Model\n');
  console.log('Model: models/gemini-2.5-flash-image-preview\n');
  
  const genAI = new GoogleGenerativeAI('AIzaSyC15ewbSpMcboNAmMJhsj1dZmXA8l8yeGQ');
  
  try {
    // Try the correct model name
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash-image-preview' });
    
    const prompt = `Generate a simple test response to verify the model is working. Just say "Model gemini-2.5-flash-image-preview is working!"`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Model Response:', text);
    console.log('\nModel is configured correctly!');
    
  } catch (error) {
    console.log('❌ Error with gemini-2.5-flash-image-preview:', error.message);
    console.log('\nTrying alternative model names...\n');
    
    // Try alternative model configurations
    const alternatives = [
      'gemini-2.5-flash-exp',
      'gemini-exp-1206', 
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-pro-vision'
    ];
    
    for (const modelName of alternatives) {
      try {
        console.log(`Testing ${modelName}...`);
        const altModel = genAI.getGenerativeModel({ model: modelName });
        const result = await altModel.generateContent('Test');
        console.log(`✅ ${modelName} works!`);
        break;
      } catch (e) {
        console.log(`❌ ${modelName} failed`);
      }
    }
  }
}

testGemini25Model();