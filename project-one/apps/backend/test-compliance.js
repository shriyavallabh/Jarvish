// Test script for compliance API
const axios = require('axios');

const API_URL = 'http://localhost:8001/api/compliance';

// Test cases
const testCases = [
  {
    name: 'Critical violation - Guaranteed returns',
    data: {
      content: 'Invest in our scheme for guaranteed 20% returns! Risk-free investment opportunity!',
      language: 'en',
      contentType: 'whatsapp'
    }
  },
  {
    name: 'Medium risk - Missing disclaimers',
    data: {
      content: 'SIP investments have historically given good returns. Start your SIP today with just Rs 500.',
      language: 'en',
      contentType: 'whatsapp'
    }
  },
  {
    name: 'Compliant content',
    data: {
      content: 'Mutual funds offer diversification benefits. However, investments are subject to market risks. Past performance does not guarantee future results. Please read scheme documents carefully.',
      language: 'en',
      contentType: 'whatsapp'
    }
  },
  {
    name: 'Hindi content with violations',
    data: {
      content: 'म्यूचुअल फंड में निवेश करें और पक्का मुनाफा कमाएं! गारंटीड रिटर्न!',
      language: 'hi',
      contentType: 'whatsapp'
    }
  },
  {
    name: 'Marathi compliant content',
    data: {
      content: 'म्युच्युअल फंड गुंतवणूक बाजार जोखमीच्या अधीन आहे. कृपया सर्व योजना संबंधित कागदपत्रे काळजीपूर्वक वाचा.',
      language: 'mr',
      contentType: 'whatsapp'
    }
  }
];

async function runTests() {
  console.log('🧪 Running Compliance API Tests\n');
  console.log('=====================================\n');

  for (const test of testCases) {
    console.log(`📝 Test: ${test.name}`);
    console.log(`Content: "${test.data.content.substring(0, 50)}..."`);
    
    try {
      const response = await axios.post(`${API_URL}/check`, test.data);
      const result = response.data.data;
      
      console.log(`✅ Compliant: ${result.isCompliant}`);
      console.log(`📊 Risk Score: ${result.riskScore}/100`);
      console.log(`⚠️  Issues Found: ${result.issues.length}`);
      
      if (result.issues.length > 0) {
        console.log('Issues:');
        result.issues.forEach(issue => {
          console.log(`  - [${issue.severity}] ${issue.description}`);
        });
      }
      
      console.log(`⏱️  Processing Time: ${result.processingTime}ms`);
      console.log(`🔄 Stages: Rules=${result.stagesCompleted.rules}, AI=${result.stagesCompleted.ai}, Final=${result.stagesCompleted.final}`);
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
    
    console.log('\n-------------------------------------\n');
  }

  // Test batch endpoint
  console.log('📦 Testing Batch Compliance Check');
  try {
    const batchResponse = await axios.post(`${API_URL}/batch`, {
      contents: testCases.slice(0, 3).map(t => t.data)
    });
    
    console.log(`✅ Batch processed: ${batchResponse.data.data.length} items`);
    batchResponse.data.data.forEach((result, i) => {
      console.log(`  Item ${i + 1}: Compliant=${result.isCompliant}, Risk=${result.riskScore}`);
    });
  } catch (error) {
    console.error(`❌ Batch test failed: ${error.message}`);
  }

  console.log('\n=====================================');
  console.log('✨ Tests Complete!');
}

// Run the tests
runTests().catch(console.error);