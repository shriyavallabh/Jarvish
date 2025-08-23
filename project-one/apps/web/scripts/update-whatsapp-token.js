#!/usr/bin/env node

/**
 * WhatsApp Token Update Script
 * Updates the WhatsApp access token in the environment file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_FILE = path.join(__dirname, '../.env.local');

console.log('🔄 WhatsApp Token Update Utility\n');
console.log('To get a new token:');
console.log('1. Go to: https://developers.facebook.com/apps/');
console.log('2. Select your app');
console.log('3. Go to WhatsApp > API Setup');
console.log('4. Generate a new temporary access token\n');

rl.question('Enter your new WhatsApp Access Token (or press Enter to skip): ', (token) => {
  if (!token) {
    console.log('⏭️  Skipping token update');
    
    // Provide instructions for manual token generation
    console.log('\n📋 To generate a permanent token:');
    console.log('1. Use the Graph API Explorer');
    console.log('2. Or use this curl command:\n');
    console.log(`curl -X POST "https://graph.facebook.com/v18.0/oauth/access_token" \\
  -d "grant_type=fb_exchange_token" \\
  -d "client_id=YOUR_APP_ID" \\
  -d "client_secret=YOUR_APP_SECRET" \\
  -d "fb_exchange_token=YOUR_TEMPORARY_TOKEN"\n`);
    
    rl.close();
    return;
  }

  // Read the current .env.local file
  let envContent = '';
  try {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  } catch (error) {
    console.error('❌ Error reading .env.local:', error.message);
    rl.close();
    return;
  }

  // Update the WhatsApp token
  const tokenRegex = /WHATSAPP_ACCESS_TOKEN=.*/;
  if (tokenRegex.test(envContent)) {
    envContent = envContent.replace(tokenRegex, `WHATSAPP_ACCESS_TOKEN=${token}`);
    console.log('✅ Updated existing WhatsApp token');
  } else {
    // Add the token if it doesn't exist
    envContent += `\n# WhatsApp Business API\nWHATSAPP_ACCESS_TOKEN=${token}\n`;
    console.log('✅ Added WhatsApp token to environment');
  }

  // Write back to the file
  try {
    fs.writeFileSync(ENV_FILE, envContent);
    console.log('✅ Environment file updated successfully!');
    
    // Test the token
    console.log('\n🧪 Testing new token...');
    testWhatsAppToken(token);
  } catch (error) {
    console.error('❌ Error writing .env.local:', error.message);
  }

  rl.close();
});

async function testWhatsAppToken(token) {
  try {
    const response = await fetch('https://graph.facebook.com/v18.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token is valid!');
      console.log('   Account:', data.name || 'Unknown');
      console.log('   ID:', data.id);
    } else {
      const error = await response.json();
      console.log('❌ Token validation failed:', error.error?.message || 'Unknown error');
      console.log('\n💡 Tip: Make sure to generate a new token from the WhatsApp Business dashboard');
    }
  } catch (error) {
    console.log('⚠️  Could not validate token:', error.message);
  }
}

// Also provide a function to generate a long-lived token
console.log('\n💡 For a long-lived token (60 days), you can also use our token generator:');
console.log('   node scripts/generate-long-lived-token.js\n');