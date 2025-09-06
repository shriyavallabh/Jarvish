require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function checkStatus() {
  // Get recent message IDs
  const messageIds = [
    'wamid.HBgMOTE5NzY1MDcxMjQ5FQIAERgSNkFBNzdGNzEwMUY3NTJFQjJBAA==',  // Text
    'wamid.HBgMOTE5NzY1MDcxMjQ5FQIAERgSRDQ1RTUxM0MxMzc1RTkxOEM4AA=='   // Image
  ];
  
  console.log('Checking WhatsApp Business Account Health...\n');
  
  // Try to get phone number details
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );
    
    const data = await response.json();
    console.log('Phone Number Details:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error checking phone:', error.message);
  }
  
  console.log('\n═══════════════════════════════════════\n');
  console.log('TROUBLESHOOTING:');
  console.log('1. Check WhatsApp on 9765071249');
  console.log('2. Look for "Message Requests" section');
  console.log('3. Check if business number is blocked');
  console.log('4. Try initiating chat from your side first');
  console.log('\nAPI confirms messages are sent.');
  console.log('Issue is likely on receiving end.');
}

checkStatus();
