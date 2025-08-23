#!/usr/bin/env node

/**
 * WhatsApp Business API Setup Script
 * Run this script to initialize WhatsApp integration
 * Usage: node scripts/setup-whatsapp.js
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('========================================');
console.log('WhatsApp Business API Setup Wizard');
console.log('========================================\n');

async function setup() {
  try {
    // Step 1: Check prerequisites
    console.log('Step 1: Prerequisites Check');
    console.log('---------------------------');
    console.log('Before proceeding, ensure you have:');
    console.log('✓ GST Certificate (for Indian businesses)');
    console.log('✓ Business website with privacy policy');
    console.log('✓ Facebook Business Manager account');
    console.log('✓ 3-5 spare phone numbers not on WhatsApp');
    console.log('✓ Business bank statements (last 3 months)\n');
    
    const ready = await question('Are you ready to proceed? (yes/no): ');
    if (ready.toLowerCase() !== 'yes') {
      console.log('\nPlease gather the required documents and run this script again.');
      process.exit(0);
    }
    
    // Step 2: Business Information
    console.log('\nStep 2: Business Information');
    console.log('----------------------------');
    const businessInfo = {
      name: await question('Business Name (as per GST): '),
      gst: await question('GST Number: '),
      website: await question('Business Website URL: '),
      category: await question('Business Category (finance/education/other): '),
      email: await question('Business Email: '),
      phone: await question('Business Phone (landline): ')
    };
    
    // Step 3: Facebook Business Setup
    console.log('\nStep 3: Facebook Business Manager');
    console.log('----------------------------------');
    console.log('Visit: https://business.facebook.com');
    console.log('1. Create or access your Business Manager account');
    console.log('2. Go to Business Settings > Business Info');
    console.log('3. Start business verification process');
    console.log('4. Upload GST certificate and other documents\n');
    
    const fbBusinessId = await question('Enter your Facebook Business ID (or "skip" to do later): ');
    
    // Step 4: WhatsApp Phone Numbers
    console.log('\nStep 4: WhatsApp Phone Numbers');
    console.log('-------------------------------');
    console.log('You need 3-5 phone numbers for:');
    console.log('- Primary messaging (2 numbers)');
    console.log('- Backup/quality protection (1-3 numbers)\n');
    
    const phoneNumbers = [];
    let addMore = true;
    while (addMore) {
      const number = await question('Enter phone number (with country code, e.g., 919999999999): ');
      const purpose = await question('Purpose (primary/backup): ');
      phoneNumbers.push({ number, purpose });
      
      const another = await question('Add another number? (yes/no): ');
      addMore = another.toLowerCase() === 'yes';
    }
    
    // Step 5: BSP Selection
    console.log('\nStep 5: Business Solution Provider (BSP)');
    console.log('-----------------------------------------');
    console.log('Recommended BSPs for India:');
    console.log('1. AiSensy - Best for bulk messaging');
    console.log('2. MSG91 - Good API documentation');
    console.log('3. Interakt - Streamlined approval');
    console.log('4. Direct API - Use Meta\'s API directly\n');
    
    const bspChoice = await question('Select BSP (1-4): ');
    const bspMap = {
      '1': 'aisensy',
      '2': 'msg91',
      '3': 'interakt',
      '4': 'direct'
    };
    const selectedBsp = bspMap[bspChoice] || 'direct';
    
    // Step 6: Template Planning
    console.log('\nStep 6: Message Templates');
    console.log('-------------------------');
    const templates = [];
    
    console.log('Creating daily content template...');
    const templateLanguages = await question('Languages needed (comma-separated, e.g., en_US,hi_IN,mr_IN): ');
    
    templates.push({
      name: 'daily_insight_v1',
      category: 'UTILITY',
      languages: templateLanguages.split(',').map(l => l.trim()),
      body: 'Good morning {{1}}! Your daily market insight for {{2}} is ready. {{3}}'
    });
    
    // Step 7: Delivery Configuration
    console.log('\nStep 7: Delivery Configuration');
    console.log('-------------------------------');
    const deliveryConfig = {
      time: await question('Daily delivery time in IST (default 06:00): ') || '06:00',
      advisorCount: await question('Initial number of advisors (150-300): '),
      tier: await question('Service tier focus (basic/pro/premium): ')
    };
    
    // Step 8: Generate Configuration
    console.log('\nStep 8: Generating Configuration');
    console.log('---------------------------------');
    
    const config = {
      business: businessInfo,
      facebook: {
        businessId: fbBusinessId !== 'skip' ? fbBusinessId : null
      },
      whatsapp: {
        numbers: phoneNumbers,
        bsp: selectedBsp
      },
      templates: templates,
      delivery: deliveryConfig,
      setupDate: new Date().toISOString()
    };
    
    // Save configuration
    const configPath = path.join(__dirname, '..', 'whatsapp-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`✓ Configuration saved to: ${configPath}`);
    
    // Generate action items
    console.log('\n========================================');
    console.log('IMMEDIATE ACTION ITEMS');
    console.log('========================================\n');
    
    const actionItems = generateActionItems(config);
    actionItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item}`);
    });
    
    // Create setup tracking file
    const trackingPath = path.join(__dirname, '..', 'whatsapp-setup-tracking.md');
    await createTrackingFile(trackingPath, config, actionItems);
    console.log(`\n✓ Setup tracking file created: ${trackingPath}`);
    
    // Step 9: Next Steps
    console.log('\n========================================');
    console.log('NEXT STEPS');
    console.log('========================================\n');
    
    console.log('1. URGENT: Complete Facebook Business verification (2-5 days)');
    console.log('2. Register with selected BSP using the configuration');
    console.log('3. Submit message templates for approval (3-5 days)');
    console.log('4. Configure webhook endpoints in your application');
    console.log('5. Test with small group before full rollout');
    
    console.log('\n✓ Setup wizard completed successfully!');
    console.log('⚠️  Remember: Business verification is your critical path!');
    
  } catch (error) {
    console.error('\nError during setup:', error.message);
  } finally {
    rl.close();
  }
}

function generateActionItems(config) {
  const items = [];
  
  // Business verification
  if (!config.facebook.businessId) {
    items.push('Complete Facebook Business Manager verification with GST certificate');
  }
  
  // BSP registration
  if (config.whatsapp.bsp === 'direct') {
    items.push('Apply for WhatsApp Cloud API access at developers.facebook.com');
  } else {
    items.push(`Register with ${config.whatsapp.bsp.toUpperCase()} as your BSP`);
  }
  
  // Phone number verification
  config.whatsapp.numbers.forEach(num => {
    items.push(`Verify phone number ${num.number} for WhatsApp Business`);
  });
  
  // Template submission
  items.push('Submit message templates for approval (allow 3-5 days)');
  
  // Technical setup
  items.push('Configure webhook endpoints at localhost:8001');
  items.push('Set up Redis for message queue management');
  items.push('Implement delivery scheduler for 06:00 IST');
  
  // Testing
  items.push('Create test advisor accounts for initial rollout');
  items.push('Implement quality monitoring dashboard');
  
  return items;
}

async function createTrackingFile(filePath, config, actionItems) {
  const content = `# WhatsApp Business API Setup Tracking
Generated: ${new Date().toISOString()}

## Business Information
- Name: ${config.business.name}
- GST: ${config.business.gst}
- Website: ${config.business.website}

## Configuration
- BSP: ${config.whatsapp.bsp}
- Phone Numbers: ${config.whatsapp.numbers.length}
- Target Advisors: ${config.delivery.advisorCount}
- Delivery Time: ${config.delivery.time} IST

## Setup Checklist

### Week 1 (Immediate)
${actionItems.slice(0, 5).map(item => `- [ ] ${item}`).join('\n')}

### Week 2
${actionItems.slice(5, 10).map(item => `- [ ] ${item}`).join('\n')}

### Week 3
- [ ] Test with 10 internal users
- [ ] Monitor quality ratings
- [ ] Gradual rollout to 50 advisors
- [ ] Implement SLA monitoring
- [ ] Scale to ${config.delivery.advisorCount} advisors

## Important Dates
- Setup Started: ${config.setupDate}
- Business Verification ETA: ${new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Template Approval ETA: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- Go-Live Target: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

## Contact Information
- Facebook Business Support: https://www.facebook.com/business/help
- WhatsApp Business API Docs: https://developers.facebook.com/docs/whatsapp
- BSP Support: Check ${config.whatsapp.bsp} documentation

## Notes
- Business verification is the critical path (2-5 days)
- Template approval takes 3-5 days
- Start with 50 advisors and scale gradually
- Monitor quality ratings closely during rollout
`;
  
  await fs.writeFile(filePath, content);
}

// Run setup
setup().catch(console.error);