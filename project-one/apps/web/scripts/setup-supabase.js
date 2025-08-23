#!/usr/bin/env node

/**
 * Supabase Quick Setup Script for Jarvish MVP
 * Run this after creating your Supabase project
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Jarvish Supabase Setup - 3-Day MVP Sprint');
console.log('============================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env.local created. Please update with your Supabase credentials.\n');
  } else {
    console.log('❌ env.example not found. Please create .env.local manually.\n');
  }
} else {
  console.log('✅ .env.local already exists\n');
}

console.log('📋 SETUP INSTRUCTIONS:');
console.log('======================\n');

console.log('1. CREATE SUPABASE PROJECT:');
console.log('   - Go to https://app.supabase.com');
console.log('   - Create new project (select Mumbai region for India)');
console.log('   - Note your project URL and anon key\n');

console.log('2. RUN DATABASE MIGRATIONS:');
console.log('   - Go to SQL Editor in Supabase dashboard');
console.log('   - Copy contents from:');
console.log('     • supabase/migrations/001_initial_schema.sql');
console.log('     • supabase/migrations/002_rls_policies.sql');
console.log('   - Execute in order\n');

console.log('3. UPDATE ENVIRONMENT VARIABLES:');
console.log('   Edit .env.local with:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL=<your-project-url>');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
console.log('   - SUPABASE_SERVICE_ROLE_KEY=<your-service-key>\n');

console.log('4. ENABLE REALTIME:');
console.log('   In Supabase Dashboard > Database > Replication:');
console.log('   - Enable realtime for tables: advisors, content, content_delivery\n');

console.log('5. CONFIGURE AUTHENTICATION:');
console.log('   - Keep Clerk as primary auth');
console.log('   - Supabase will sync via clerk_user_id\n');

console.log('6. QUICK TEST ENDPOINTS:');
console.log('   After setup, test these endpoints:');
console.log('   - POST /api/supabase/advisor - Create advisor profile');
console.log('   - GET /api/supabase/advisor - Get advisor profile');
console.log('   - POST /api/supabase/content - Create content');
console.log('   - GET /api/supabase/content - List content\n');

console.log('7. WEBHOOK CONFIGURATION:');
console.log('   Configure webhooks in production:');
console.log('   - WhatsApp: /api/webhooks/whatsapp');
console.log('   - Razorpay: /api/webhooks/razorpay\n');

console.log('📱 MOBILE RESPONSIVE:');
console.log('   All components use Tailwind responsive classes');
console.log('   Test on mobile devices before launch\n');

console.log('⚡ PERFORMANCE TARGETS:');
console.log('   - API Response: <2 seconds');
console.log('   - Dashboard Load: <3 seconds');
console.log('   - Real-time Updates: <500ms\n');

console.log('🎯 MVP CHECKLIST:');
console.log('   [ ] Supabase project created');
console.log('   [ ] Database migrations executed');
console.log('   [ ] Environment variables configured');
console.log('   [ ] Realtime enabled for tables');
console.log('   [ ] Test advisor registration flow');
console.log('   [ ] Test content creation flow');
console.log('   [ ] Verify WhatsApp integration');
console.log('   [ ] Test on mobile devices');
console.log('   [ ] Deploy to production\n');

console.log('💡 QUICK TIPS:');
console.log('   - Use Supabase Dashboard for quick data checks');
console.log('   - Monitor API logs in Supabase for debugging');
console.log('   - Test with 5-10 advisors first before scaling');
console.log('   - Keep compliance score threshold at 80% for MVP\n');

console.log('🚨 IMPORTANT REMINDERS:');
console.log('   - Enable Row Level Security (RLS) - already in migrations');
console.log('   - Set up daily backups in Supabase dashboard');
console.log('   - Configure rate limiting for production');
console.log('   - Add monitoring (Supabase has built-in metrics)\n');

console.log('✨ Ready to launch in 72 hours! Let\'s go! 🚀\n');

// Create a quick test file
const testFilePath = path.join(__dirname, 'test-supabase.js');
const testFileContent = `// Quick Supabase Connection Test
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('advisors')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
    }
  } catch (err) {
    console.error('❌ Connection error:', err);
  }
}

testConnection();
`;

fs.writeFileSync(testFilePath, testFileContent);
console.log(`📝 Test script created: scripts/test-supabase.js`);
console.log('   Run: node scripts/test-supabase.js (after setup)\n');