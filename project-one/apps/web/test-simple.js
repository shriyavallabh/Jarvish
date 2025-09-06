require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function sendSimple() {
  console.log('Sending simple test message...');
  
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
        type: 'text',
        text: {
          body: 'Test message at ' + new Date().toLocaleTimeString('en-IN') + '\n\nIf you receive this, reply YES'
        }
      })
    }
  );
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

sendSimple();
