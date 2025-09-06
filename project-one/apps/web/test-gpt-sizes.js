require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testSize(size) {
  console.log(`Testing ${size}...`);
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: 'Test image',
      size: size,
      n: 1
    })
  });
  
  const data = await response.json();
  if (data.data && data.data[0]) {
    console.log(`  ✅ ${size} works!`);
    return true;
  } else if (data.error) {
    console.log(`  ❌ ${size} failed:`, data.error.message);
    return false;
  }
}

async function main() {
  console.log('Testing gpt-image-1 supported sizes:\n');
  await testSize('1024x1024');
  await testSize('1024x1536');
  await testSize('1536x1024');
}

main();
