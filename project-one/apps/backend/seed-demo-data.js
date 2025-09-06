#!/usr/bin/env node

/**
 * Jarvish Platform Demo Data Seeder
 * Creates sample data for testing and development
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}📍 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

// Demo data
const demoData = {
  users: [
    {
      email: 'admin@jarvish.ai',
      name: 'Admin User',
      role: 'ADMIN',
      phoneNumber: '919999999901',
      whatsappNumber: '919999999901',
      companyName: 'Jarvish Admin',
      businessType: 'COMPANY'
    },
    {
      email: 'demo.advisor1@jarvish.ai',
      name: 'Rajesh Kumar',
      role: 'SUBSCRIBER',
      phoneNumber: '919999999902',
      whatsappNumber: '919999999902',
      companyName: 'Kumar Financial Services',
      businessType: 'INDIVIDUAL',
      arnNumber: 'ARN-123456'
    },
    {
      email: 'demo.advisor2@jarvish.ai',
      name: 'Priya Sharma',
      role: 'SUBSCRIBER',
      phoneNumber: '919999999903',
      whatsappNumber: '919999999903',
      companyName: 'Sharma Wealth Advisors',
      businessType: 'COMPANY',
      arnNumber: 'ARN-789012'
    },
    {
      email: 'demo.advisor3@jarvish.ai',
      name: 'Amit Patel',
      role: 'SUBSCRIBER',
      phoneNumber: '919999999904',
      whatsappNumber: '919999999904',
      companyName: 'Patel Investment Solutions',
      businessType: 'PARTNERSHIP',
      arnNumber: 'ARN-345678'
    }
  ],
  
  contentTemplates: [
    {
      type: 'WHATSAPP_MESSAGE',
      title: 'Daily Market Update',
      content: 'Good morning! Here\'s your market update:\n\nSensex: {{sensex}}\nNifty: {{nifty}}\n\nTop Gainers: {{gainers}}\n\nMutual funds are subject to market risks. Read all scheme related documents carefully.',
      language: 'EN',
      complianceStatus: 'APPROVED',
      tags: JSON.stringify(['market', 'daily', 'update'])
    },
    {
      type: 'WHATSAPP_MESSAGE',
      title: 'SIP Benefits',
      content: 'Benefits of Systematic Investment Planning (SIP):\n\n1. Rupee Cost Averaging\n2. Power of Compounding\n3. Disciplined Investing\n4. Flexibility\n\nStart your SIP journey today!\n\nDisclaimer: Past performance is not indicative of future results.',
      language: 'EN',
      complianceStatus: 'APPROVED',
      tags: JSON.stringify(['sip', 'education', 'investment'])
    },
    {
      type: 'WHATSAPP_MESSAGE',
      title: 'Tax Planning Reminder',
      content: 'Tax Planning Reminder:\n\nThe financial year is ending soon. Review your tax-saving investments:\n\n• ELSS Mutual Funds\n• PPF\n• NPS\n• Life Insurance\n\nConsult your financial advisor for personalized advice.',
      language: 'EN',
      complianceStatus: 'APPROVED',
      tags: JSON.stringify(['tax', 'planning', 'reminder'])
    },
    {
      type: 'WHATSAPP_IMAGE',
      title: 'Diwali Wishes',
      content: 'Wishing you and your family a prosperous Diwali!\n\nMay this festival of lights illuminate your path to financial prosperity.\n\n- {{advisor_name}}\n{{organization_name}}',
      language: 'EN',
      complianceStatus: 'APPROVED',
      tags: JSON.stringify(['festival', 'greeting', 'diwali'])
    }
  ],
  
  subscriptions: [
    {
      planId: 'basic',
      planName: 'Basic',
      price: 2999,
      billingCycle: 'MONTHLY',
      features: {
        messagesPerMonth: 1000,
        templatesAccess: 'basic',
        aiCompliance: true,
        supportLevel: 'email'
      },
      status: 'ACTIVE'
    },
    {
      planId: 'standard',
      planName: 'Standard',
      price: 5999,
      billingCycle: 'MONTHLY',
      features: {
        messagesPerMonth: 5000,
        templatesAccess: 'premium',
        aiCompliance: true,
        aiGeneration: true,
        supportLevel: 'priority'
      },
      status: 'ACTIVE'
    },
    {
      planId: 'pro',
      planName: 'Professional',
      price: 11999,
      billingCycle: 'MONTHLY',
      features: {
        messagesPerMonth: 'unlimited',
        templatesAccess: 'all',
        aiCompliance: true,
        aiGeneration: true,
        customBranding: true,
        supportLevel: 'dedicated'
      },
      status: 'ACTIVE'
    }
  ]
};

async function clearExistingData() {
  log.header('CLEARING EXISTING DATA');
  
  try {
    // Clear in correct order to respect foreign keys
    await prisma.payment.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.contentTemplate.deleteMany();
    await prisma.user.deleteMany();
    
    log.success('Existing data cleared');
  } catch (error) {
    log.error(`Failed to clear data: ${error.message}`);
  }
}

async function seedUsers() {
  log.header('SEEDING USERS');
  
  for (const userData of demoData.users) {
    try {
      // Hash password (default: 'Demo@123')
      const hashedPassword = await bcrypt.hash('Demo@123', 10);
      
      const user = await prisma.user.create({
        data: {
          ...userData,
          passwordHash: hashedPassword,
          emailVerified: true,
          isVerified: true,
          whatsappVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      log.success(`Created user: ${user.name} (${user.email})`);
    } catch (error) {
      log.error(`Failed to create user ${userData.email}: ${error.message}`);
    }
  }
}

async function seedContentTemplates() {
  log.header('SEEDING CONTENT TEMPLATES');
  
  // Get first subscriber user for ownership
  const advisor = await prisma.user.findFirst({
    where: { role: 'SUBSCRIBER' }
  });
  
  if (!advisor) {
    log.error('No advisor found to assign templates');
    return;
  }
  
  for (const templateData of demoData.contentTemplates) {
    try {
      const template = await prisma.contentTemplate.create({
        data: {
          ...templateData,
          createdById: advisor.id,
          approvedById: advisor.id,
          tags: JSON.parse(templateData.tags),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      log.success(`Created template: ${template.title || template.type}`);
    } catch (error) {
      log.error(`Failed to create template ${templateData.title}: ${error.message}`);
    }
  }
}

async function seedSubscriptions() {
  log.header('SEEDING SUBSCRIPTIONS');
  
  const advisors = await prisma.user.findMany({
    where: { role: 'SUBSCRIBER' }
  });
  
  for (let i = 0; i < advisors.length && i < demoData.subscriptions.length; i++) {
    const advisor = advisors[i];
    const subData = demoData.subscriptions[i];
    
    try {
      const subscription = await prisma.subscription.create({
        data: {
          userId: advisor.id,
          ...subData,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      log.success(`Created ${subscription.planName} subscription for ${advisor.name}`);
      
      // Create a payment record
      await prisma.payment.create({
        data: {
          userId: advisor.id,
          subscriptionId: subscription.id,
          amount: subscription.price,
          currency: 'INR',
          status: 'SUCCESS',
          paymentMethod: 'CARD',
          transactionId: `demo_txn_${Date.now()}_${i}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      log.info(`Payment record created for ${advisor.name}`);
    } catch (error) {
      log.error(`Failed to create subscription for ${advisor.email}: ${error.message}`);
    }
  }
}

async function generateAnalyticsData() {
  log.header('GENERATING ANALYTICS DATA');
  
  try {
    // This would normally be in a separate analytics table
    // For now, we'll just log what would be created
    
    const mockAnalytics = {
      dailyActiveUsers: Math.floor(Math.random() * 100) + 50,
      messagesDelivered: Math.floor(Math.random() * 5000) + 2000,
      complianceChecks: Math.floor(Math.random() * 1000) + 500,
      averageDeliveryTime: '06:02 IST',
      platformUptime: '99.95%'
    };
    
    log.success('Analytics data generated (mock)');
    log.info(`Daily Active Users: ${mockAnalytics.dailyActiveUsers}`);
    log.info(`Messages Delivered: ${mockAnalytics.messagesDelivered}`);
    log.info(`Compliance Checks: ${mockAnalytics.complianceChecks}`);
  } catch (error) {
    log.error(`Failed to generate analytics: ${error.message}`);
  }
}

async function displaySummary() {
  log.header('SEED DATA SUMMARY');
  
  try {
    const userCount = await prisma.user.count();
    const templateCount = await prisma.contentTemplate.count();
    const subscriptionCount = await prisma.subscription.count();
    const paymentCount = await prisma.payment.count();
    
    console.log(`
${colors.bold}Database Statistics:${colors.reset}
  Users: ${userCount}
  Templates: ${templateCount}
  Subscriptions: ${subscriptionCount}
  Payments: ${paymentCount}
  
${colors.bold}Demo Credentials:${colors.reset}
  Admin: admin@jarvish.ai / Demo@123
  Advisor 1: demo.advisor1@jarvish.ai / Demo@123
  Advisor 2: demo.advisor2@jarvish.ai / Demo@123
  Advisor 3: demo.advisor3@jarvish.ai / Demo@123
  
${colors.green}✨ Demo data seeded successfully!${colors.reset}
    `);
  } catch (error) {
    log.error(`Failed to generate summary: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bold}${colors.blue}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   JARVISH PLATFORM DEMO DATA SEEDER
   Creating sample data for testing...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colors.reset}`);
  
  try {
    // Connect to database
    await prisma.$connect();
    log.success('Connected to database');
    
    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('\n⚠️  This will clear existing data. Continue? (y/n): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'y') {
      log.info('Seed operation cancelled');
      process.exit(0);
    }
    
    // Run seeding operations
    await clearExistingData();
    await seedUsers();
    await seedContentTemplates();
    await seedSubscriptions();
    await generateAnalyticsData();
    await displaySummary();
    
  } catch (error) {
    log.error(`Seed operation failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder
main().catch(console.error);