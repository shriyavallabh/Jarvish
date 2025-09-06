#!/usr/bin/env node

/**
 * Jarvish Platform Setup Verification Script
 * This script validates all external integrations and configurations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

const success = (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`);
const error = (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`);
const warning = (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
const info = (msg) => console.log(`${colors.blue}📍 ${msg}${colors.reset}`);
const header = (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`);

let totalChecks = 0;
let passedChecks = 0;
let criticalErrors = [];

// Load environment variables
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function checkEnvironmentVariables() {
  header('1. ENVIRONMENT VARIABLES');
  
  const requiredVars = [
    { name: 'DATABASE_URL', critical: true, description: 'PostgreSQL connection string' },
    { name: 'OPENAI_API_KEY', critical: true, description: 'OpenAI API key for content generation' },
    { name: 'WHATSAPP_PHONE_NUMBER_ID', critical: true, description: 'WhatsApp Business phone number ID' },
    { name: 'WHATSAPP_ACCESS_TOKEN', critical: true, description: 'WhatsApp Business API access token' },
    { name: 'WHATSAPP_BUSINESS_ACCOUNT_ID', critical: true, description: 'WhatsApp Business account ID' },
    { name: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', critical: false, description: 'Webhook verification token' },
    { name: 'RAZORPAY_KEY_ID', critical: false, description: 'Razorpay API key' },
    { name: 'RAZORPAY_KEY_SECRET', critical: false, description: 'Razorpay API secret' },
    { name: 'REDIS_URL', critical: false, description: 'Redis connection URL' },
    { name: 'NODE_ENV', critical: false, description: 'Node environment (development/production)' }
  ];

  for (const envVar of requiredVars) {
    totalChecks++;
    const value = process.env[envVar.name];
    
    if (value && value !== `your-${envVar.name.toLowerCase().replace(/_/g, '-')}`) {
      success(`${envVar.name}: ${envVar.description}`);
      passedChecks++;
    } else if (envVar.critical) {
      error(`${envVar.name}: Missing or placeholder value - ${envVar.description}`);
      criticalErrors.push(`Missing critical environment variable: ${envVar.name}`);
    } else {
      warning(`${envVar.name}: Missing or placeholder value - ${envVar.description}`);
    }
  }
}

async function checkDatabaseConnection() {
  header('2. DATABASE CONNECTION');
  totalChecks++;
  
  try {
    // Check if PostgreSQL is running
    execSync('pg_isready', { stdio: 'ignore' });
    info('PostgreSQL service is running');
    
    // Test Prisma connection
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    success('Successfully connected to PostgreSQL database');
    
    // Check if schema is up to date
    const userCount = await prisma.user.count().catch(() => null);
    if (userCount !== null) {
      success(`Database schema is initialized (${userCount} users found)`);
    } else {
      warning('Database schema might not be fully initialized');
    }
    
    await prisma.$disconnect();
    passedChecks++;
  } catch (err) {
    if (err.message.includes('pg_isready')) {
      error('PostgreSQL is not running. Start it with: brew services start postgresql');
      criticalErrors.push('PostgreSQL service not running');
    } else if (err.message.includes('P1001')) {
      error('Cannot connect to database. Check DATABASE_URL in .env');
      criticalErrors.push('Database connection failed');
    } else {
      error(`Database connection error: ${err.message}`);
      criticalErrors.push('Database connection error');
    }
  }
}

async function checkWhatsAppAPI() {
  header('3. WHATSAPP BUSINESS API');
  totalChecks++;
  
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!phoneNumberId || !accessToken || 
      phoneNumberId.includes('your-') || accessToken.includes('your-')) {
    warning('WhatsApp API credentials not configured - skipping validation');
    info('To configure WhatsApp:');
    info('  1. Create a Meta Business account');
    info('  2. Set up WhatsApp Business API');
    info('  3. Get credentials from developers.facebook.com');
    return;
  }
  
  try {
    // Test WhatsApp API connection
    const response = await axios.get(
      `https://graph.facebook.com/v17.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (response.data) {
      success(`WhatsApp API connected: ${response.data.display_phone_number || 'Phone configured'}`);
      passedChecks++;
      
      // Check for templates
      const templatesResponse = await axios.get(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      const templates = templatesResponse.data.data || [];
      if (templates.length > 0) {
        success(`Found ${templates.length} WhatsApp templates`);
        templates.slice(0, 3).forEach(t => {
          info(`  - ${t.name} (${t.status})`);
        });
      } else {
        warning('No WhatsApp templates found. Create templates in Meta Business Suite');
      }
    }
  } catch (err) {
    if (err.response?.status === 401) {
      error('WhatsApp API authentication failed - check access token');
    } else if (err.response?.status === 400) {
      error('Invalid WhatsApp phone number ID');
    } else {
      error(`WhatsApp API error: ${err.message}`);
    }
  }
}

async function checkOpenAIAPI() {
  header('4. OPENAI API');
  totalChecks++;
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey.includes('your-')) {
    error('OpenAI API key not configured');
    criticalErrors.push('Missing OpenAI API key');
    return;
  }
  
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.data) {
      success('OpenAI API connected successfully');
      passedChecks++;
      
      // Check for required models
      const models = response.data.data || [];
      const requiredModels = ['gpt-4o-mini', 'gpt-4'];
      const availableModels = models.map(m => m.id);
      
      requiredModels.forEach(model => {
        if (availableModels.some(m => m.includes(model))) {
          info(`  Model available: ${model}`);
        } else {
          warning(`  Model not found: ${model}`);
        }
      });
    }
  } catch (err) {
    if (err.response?.status === 401) {
      error('OpenAI API authentication failed - invalid API key');
      criticalErrors.push('Invalid OpenAI API key');
    } else {
      error(`OpenAI API error: ${err.message}`);
      criticalErrors.push('OpenAI API connection failed');
    }
  }
}

async function checkRedisConnection() {
  header('5. REDIS CONNECTION');
  totalChecks++;
  
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    // Try to connect to Redis
    const redis = require('redis');
    const client = redis.createClient({ url: redisUrl });
    
    await client.connect();
    await client.ping();
    
    success('Redis connection successful');
    passedChecks++;
    
    await client.disconnect();
  } catch (err) {
    warning('Redis not connected - job queue features will be limited');
    info('To install Redis: brew install redis && brew services start redis');
  }
}

async function checkFileStructure() {
  header('6. FILE STRUCTURE');
  
  const requiredFiles = [
    { path: 'prisma/schema.prisma', description: 'Database schema' },
    { path: 'src/simple-server.ts', description: 'Main server file' },
    { path: 'src/config/whatsapp.config.ts', description: 'WhatsApp configuration' },
    { path: 'src/services/whatsapp-api.service.ts', description: 'WhatsApp service' },
    { path: 'src/routes/compliance.ts', description: 'Compliance routes' },
    { path: 'src/routes/webhooks.routes.ts', description: 'Webhook routes' },
    { path: 'package.json', description: 'Package configuration' }
  ];
  
  for (const file of requiredFiles) {
    totalChecks++;
    if (fs.existsSync(path.join(__dirname, file.path))) {
      success(`${file.description}: ${file.path}`);
      passedChecks++;
    } else {
      error(`Missing: ${file.path} - ${file.description}`);
    }
  }
}

async function checkNodeModules() {
  header('7. DEPENDENCIES');
  totalChecks++;
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const installedModules = fs.existsSync('node_modules');
    
    if (!installedModules) {
      error('Node modules not installed. Run: npm install');
      criticalErrors.push('Dependencies not installed');
      return;
    }
    
    // Check critical dependencies
    const criticalDeps = [
      'express', '@prisma/client', 'axios', 'winston', 
      'dotenv', 'cors', 'helmet', 'bullmq'
    ];
    
    let allInstalled = true;
    for (const dep of criticalDeps) {
      if (!fs.existsSync(path.join('node_modules', dep))) {
        warning(`Missing dependency: ${dep}`);
        allInstalled = false;
      }
    }
    
    if (allInstalled) {
      success('All critical dependencies installed');
      passedChecks++;
    } else {
      error('Some dependencies missing. Run: npm install');
    }
  } catch (err) {
    error(`Dependency check failed: ${err.message}`);
  }
}

async function checkServerHealth() {
  header('8. SERVER HEALTH CHECK');
  totalChecks++;
  
  try {
    const response = await axios.get('http://localhost:8001/health', {
      timeout: 5000
    });
    
    if (response.data.status === 'OK') {
      success(`Server is running on port 8001`);
      passedChecks++;
      
      // Check API endpoints
      const apiResponse = await axios.get('http://localhost:8001/api/v1');
      if (apiResponse.data.version) {
        info(`  API Version: ${apiResponse.data.version}`);
        info(`  Environment: ${response.data.environment || 'development'}`);
      }
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      warning('Server not running. Start with: npm run dev');
    } else {
      warning(`Server health check failed: ${err.message}`);
    }
  }
}

async function generateSetupReport() {
  header('SETUP VERIFICATION REPORT');
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`\n${colors.bold}Setup Status:${colors.reset}`);
  console.log(`  Total Checks: ${totalChecks}`);
  console.log(`  Passed: ${colors.green}${passedChecks}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${totalChecks - passedChecks}${colors.reset}`);
  console.log(`  Success Rate: ${percentage >= 70 ? colors.green : colors.yellow}${percentage}%${colors.reset}`);
  
  if (criticalErrors.length > 0) {
    console.log(`\n${colors.red}${colors.bold}Critical Issues to Resolve:${colors.reset}`);
    criticalErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }
  
  console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
  
  if (percentage < 50) {
    console.log('  1. Configure environment variables in .env.local');
    console.log('  2. Run setup-database.sh to initialize PostgreSQL');
    console.log('  3. Install dependencies with npm install');
  } else if (percentage < 80) {
    console.log('  1. Complete WhatsApp Business API setup');
    console.log('  2. Configure OpenAI API credentials');
    console.log('  3. Set up Redis for job processing (optional)');
  } else {
    console.log('  1. Create WhatsApp message templates');
    console.log('  2. Configure webhook URLs in Meta Business');
    console.log('  3. Test end-to-end message delivery');
  }
  
  if (percentage === 100) {
    console.log(`\n${colors.green}${colors.bold}🎉 All systems operational! Platform is ready for deployment.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}Run this script again after fixing issues: node verify-setup.js${colors.reset}`);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.blue}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JARVISH PLATFORM SETUP VERIFICATION
   Checking all external integrations...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colors.reset}`);
  
  try {
    await checkEnvironmentVariables();
    await checkFileStructure();
    await checkNodeModules();
    await checkDatabaseConnection();
    await checkOpenAIAPI();
    await checkWhatsAppAPI();
    await checkRedisConnection();
    await checkServerHealth();
  } catch (err) {
    console.error(`\n${colors.red}Verification failed: ${err.message}${colors.reset}`);
  }
  
  await generateSetupReport();
}

// Run verification
main().catch(console.error);