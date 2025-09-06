require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function sendImage() {
  console.log('Sending test image...');
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '919765071249',
        type: 'image',
        image: {
          link: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
          caption: 'Test image: Google logo\nTime: ' + new Date().toLocaleTimeString('en-IN')
        }
      })
    }
  );
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

sendImage();
