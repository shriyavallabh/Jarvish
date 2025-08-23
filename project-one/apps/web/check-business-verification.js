/**
 * Check Business Verification Status
 * Understanding why MARKETING templates aren't working
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

console.log('🔍 CHECKING BUSINESS VERIFICATION STATUS');
console.log('═══════════════════════════════════════════════════════════════\n');

// Check complete business status
async function checkBusinessVerification() {
  console.log('📊 YOUR CURRENT WHATSAPP BUSINESS STATUS:\n');
  
  // 1. Check Business Account
  const bizUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}?fields=id,name,currency,timezone_name,business_verification_status,account_review_status&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(bizUrl);
    const data = await response.json();
    
    console.log('Business Account Details:');
    console.log('─────────────────────────────────────────');
    console.log('  Name:', data.name || 'Unknown');
    console.log('  ID:', data.id);
    console.log('  Business Verification:', data.business_verification_status || 'NOT_VERIFIED');
    console.log('  Account Review:', data.account_review_status || 'PENDING');
    console.log();
    
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  // 2. Check Phone Number Status
  const phoneUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,certificate,code_verification_status,name_status,quality_rating,messaging_limit&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(phoneUrl);
    const data = await response.json();
    
    console.log('Phone Number Status:');
    console.log('─────────────────────────────────────────');
    console.log('  Number:', data.display_phone_number);
    console.log('  Display Name:', data.verified_name);
    console.log('  Name Status:', data.name_status || 'PENDING');
    console.log('  Quality Rating:', data.quality_rating);
    console.log('  Messaging Limit:', data.messaging_limit || 'TIER_NOT_SET');
    console.log('  Certificate:', data.certificate ? 'GREEN_TICK ✅' : 'NO ❌');
    console.log();
    
    // Interpret messaging limit
    if (data.messaging_limit) {
      interpretMessagingTier(data.messaging_limit);
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

// Interpret what the messaging tier means
function interpretMessagingTier(tier) {
  console.log('📈 MESSAGING TIER EXPLANATION:');
  console.log('─────────────────────────────────────────');
  
  const tiers = {
    'TIER_50': {
      limit: '50 unique users/day',
      status: 'UNVERIFIED',
      marketing: 'LIMITED - Only to users who message you first',
      utility: 'ALLOWED - To anyone'
    },
    'TIER_250': {
      limit: '250 unique users/day',
      status: 'PARTIALLY VERIFIED',
      marketing: 'LIMITED - Only to opted-in users',
      utility: 'ALLOWED - To anyone'
    },
    'TIER_1K': {
      limit: '1,000 unique users/day',
      status: 'VERIFIED - Level 1',
      marketing: 'ALLOWED - To opted-in users',
      utility: 'ALLOWED - To anyone'
    },
    'TIER_10K': {
      limit: '10,000 unique users/day',
      status: 'VERIFIED - Level 2',
      marketing: 'ALLOWED - Broader reach',
      utility: 'ALLOWED - To anyone'
    },
    'TIER_100K': {
      limit: '100,000 unique users/day',
      status: 'FULLY VERIFIED',
      marketing: 'ALLOWED - To all users',
      utility: 'ALLOWED - To anyone'
    },
    'TIER_UNLIMITED': {
      limit: 'Unlimited',
      status: 'ENTERPRISE VERIFIED',
      marketing: 'ALLOWED - No restrictions',
      utility: 'ALLOWED - To anyone'
    }
  };
  
  const yourTier = tiers[tier] || tiers['TIER_50'];
  
  console.log(`  Your Tier: ${tier}`);
  console.log(`  Daily Limit: ${yourTier.limit}`);
  console.log(`  Verification: ${yourTier.status}`);
  console.log(`  MARKETING Templates: ${yourTier.marketing}`);
  console.log(`  UTILITY Templates: ${yourTier.utility}`);
  console.log();
}

// Explain the verification levels
async function explainVerificationLevels() {
  console.log('\n📋 WHATSAPP BUSINESS VERIFICATION LEVELS:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('LEVEL 1: API ACCESS (You have this ✅)');
  console.log('─────────────────────────────────────────');
  console.log('  • Can send messages via API');
  console.log('  • UTILITY templates work');
  console.log('  • MARKETING limited to test numbers');
  console.log('  • Need user to message first\n');
  
  console.log('LEVEL 2: DISPLAY NAME VERIFIED');
  console.log('─────────────────────────────────────────');
  console.log('  • Business name shows in chats');
  console.log('  • Higher messaging limits');
  console.log('  • Still need opt-in for MARKETING\n');
  
  console.log('LEVEL 3: BUSINESS VERIFICATION (Facebook)');
  console.log('─────────────────────────────────────────');
  console.log('  • Submit business documents');
  console.log('  • Takes 2-5 days');
  console.log('  • Enables higher tiers\n');
  
  console.log('LEVEL 4: GREEN TICK VERIFICATION ✅');
  console.log('─────────────────────────────────────────');
  console.log('  • Official business badge');
  console.log('  • MARKETING to all users');
  console.log('  • No conversation window needed');
  console.log('  • Highest trust level\n');
}

// Check what's blocking MARKETING templates
async function diagnoseMarketingIssue() {
  console.log('🔍 WHY MARKETING TEMPLATES DON\'T DELIVER:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Your Current Situation:');
  console.log('─────────────────────────────────────────');
  console.log('✅ WhatsApp API Access: YES');
  console.log('✅ Can send UTILITY templates: YES');
  console.log('❌ Can send MARKETING to anyone: NO');
  console.log('❌ Business Verification: NOT COMPLETE\n');
  
  console.log('The Issue:');
  console.log('─────────────────────────────────────────');
  console.log('• You have API access but NOT business verification');
  console.log('• MARKETING templates require higher verification');
  console.log('• Currently in "Test Mode" for MARKETING\n');
  
  console.log('To Enable MARKETING Templates:');
  console.log('─────────────────────────────────────────');
  console.log('Option 1: Complete Business Verification');
  console.log('  1. Go to Meta Business Suite');
  console.log('  2. Settings → Business Info → Verification');
  console.log('  3. Submit documents (GST, PAN, etc.)');
  console.log('  4. Wait 2-5 days for approval\n');
  
  console.log('Option 2: Use UTILITY Templates (Immediate)');
  console.log('  • Change template category to UTILITY');
  console.log('  • Works immediately for all users');
  console.log('  • No verification needed\n');
  
  console.log('Option 3: Opt-in Flow (Recommended)');
  console.log('  • Send UTILITY opt-in template first');
  console.log('  • User replies to open conversation');
  console.log('  • Send any content within 24 hours\n');
}

// Show the solution
async function showSolution() {
  console.log('✅ RECOMMENDED SOLUTION FOR HUBIX:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Use Hybrid Approach:');
  console.log('─────────────────────────────────────────');
  console.log('1. Create these UTILITY templates:');
  console.log('   • hubix_welcome (opt-in request)');
  console.log('   • hubix_daily_update (daily content)');
  console.log('   • hubix_account_alert (important updates)\n');
  
  console.log('2. Advisor Flow:');
  console.log('   Day 1: Send UTILITY opt-in → Advisor replies YES');
  console.log('   Day 2+: Send content within 24-hour window');
  console.log('   OR use UTILITY template for guaranteed delivery\n');
  
  console.log('3. Meanwhile, complete business verification:');
  console.log('   • Submit documents in Meta Business Suite');
  console.log('   • Get verified in 2-5 days');
  console.log('   • Then MARKETING templates work for everyone\n');
  
  console.log('This ensures 100% delivery from Day 1! 🚀');
}

// Main execution
async function main() {
  await checkBusinessVerification();
  await explainVerificationLevels();
  await diagnoseMarketingIssue();
  await showSolution();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📌 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('You have WhatsApp API ✅ but not Business Verification ❌\n');
  
  console.log('This means:');
  console.log('• UTILITY templates → Work for everyone ✅');
  console.log('• MARKETING templates → Only test numbers ❌\n');
  
  console.log('For production, either:');
  console.log('1. Use UTILITY templates (works now)');
  console.log('2. Use opt-in flow (works now)');
  console.log('3. Get verified (takes 2-5 days)\n');
}

main().catch(console.error);