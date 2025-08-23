#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map of services and how they should be instantiated
const servicePatterns = {
  'OpenAIService': 'new',
  'WhatsAppSchedulerService': 'new', 
  'TwoFactorAuthService': 'new',
  'SecurityHardeningService': 'new',
  'BusinessIntelligenceService': 'new',
  'AdvisorInsightsService': 'new',
  'PaymentService': 'new',
  'MobileVerificationService': 'new',
  'FallbackContentService': 'new',
  'ComplianceRulesService': 'new',
  'AdminService': 'new',
  'ContentVersioningService': 'new',
  'ContentPreferencesService': 'new',
  'ProfileCompletionService': 'new',
  'OnboardingProgressService': 'new',
  'OnboardingCompletionService': 'new',
  'EmailVerificationService': 'new',
  'DemoContentService': 'new',
  'DeliverySchedulerService': 'new'
};

// Find all test files
const testFiles = [
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/whatsapp-scheduler.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/two-factor-auth.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/business-intelligence.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/scheduler/whatsapp-scheduler.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/fallback-content.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/ai-content-generation.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/security-hardening.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/admin-service.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/compliance-rules.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/analytics/advisor-insights.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/payment-service.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/profile-completion.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/onboarding-progress.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/onboarding-completion.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/mobile-verification.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/email-verification.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/demo-content.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/delivery-scheduler.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/content-versioning.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/unit/services/content-preferences.test.ts',
  '/Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web/tests/integration/ai-compliance-integration.test.ts'
];

testFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix service instantiation patterns
  Object.keys(servicePatterns).forEach(serviceName => {
    const pattern = new RegExp(`(\\w+)\\s*=\\s*${serviceName};`, 'g');
    const replacement = servicePatterns[serviceName] === 'new' 
      ? `$1 = new ${serviceName}();`
      : `$1 = ${serviceName}();`;
    
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${path.basename(filePath)}`);
  }
});

console.log('Service instantiation fixes complete');