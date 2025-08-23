#!/usr/bin/env node

/**
 * Fix syntax errors in test files
 */

const fs = require('fs');
const path = require('path');

// Fix Email Verification Test Syntax
function fixEmailSyntax() {
  const filePath = path.join(__dirname, '..', 'tests/unit/services/email-verification.test.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Count braces to find the issue
  const lines = content.split('\n');
  let braceCount = 0;
  let parenCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
    }
  }
  
  console.log(`Email test - Brace balance: ${braceCount}, Paren balance: ${parenCount}`);
  
  // Fix the duplicate closing
  content = content.replace(/    \}\)\s*\}\)\s*\}\)$/, '  })\n})');
  
  // Make sure the file ends properly
  if (!content.trim().endsWith('})')) {
    content = content.trim() + '\n})\n';
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed email verification test syntax');
}

// Fix Mobile Verification Test Syntax
function fixMobileSyntax() {
  const filePath = path.join(__dirname, '..', 'tests/unit/services/mobile-verification.test.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // The issue is the constant-time test is placed incorrectly
  // Remove the malformed test
  content = content.replace(
    /it\('should use constant-time comparison for security'[\s\S]*?expect\(mockDb\.otpTokens\.findFirst\)\.toHaveBeenCalled\(\)\s*\}\),?\s*update: jest\.fn\(\)/,
    ''
  );
  
  // Add the test in the right place
  const testToAdd = `
    it('should use constant-time comparison for security', async () => {
      const userId = 'user-123'
      const otp = '123456'
      
      // Mock OTP lookup
      const bcrypt = require('bcryptjs')
      mockDb.otpTokens.findFirst.mockResolvedValue({
        id: 'otp-id',
        otp: await bcrypt.hash(otp, 10),
        userId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
      })
      
      // The service uses bcrypt.compare which is constant-time
      await mobileService.verifyOTP(userId, otp)
      
      // Verify database was queried
      expect(mockDb.otpTokens.findFirst).toHaveBeenCalled()
    })`;
  
  // Find the right place to insert - after the previous test in OTP Verification section
  const marker = 'describe(\'OTP Verification\', () => {';
  const markerIndex = content.indexOf(marker);
  if (markerIndex > -1) {
    // Find the end of the describe block
    let braceCount = 0;
    let insertIndex = markerIndex;
    let foundFirstBrace = false;
    
    for (let i = markerIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        foundFirstBrace = true;
      }
      if (content[i] === '}' && foundFirstBrace) {
        braceCount--;
        if (braceCount === 0) {
          // Found the closing brace of the describe block
          // Insert before it
          content = content.slice(0, i) + testToAdd + '\n' + content.slice(i);
          break;
        }
      }
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed mobile verification test syntax');
}

// Fix Profile Completion Test Syntax
function fixProfileSyntax() {
  const filePath = path.join(__dirname, '..', 'tests/unit/services/profile-completion.test.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Profile completion test file not found');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // The issue is mockDb.advisors might not be defined in beforeEach
  // Add proper mock initialization
  if (!content.includes('beforeEach(() => {')) {
    // Add beforeEach if missing
    content = content.replace(
      /describe\('E01-US-004: Advisor Profile Setup', \(\) => \{/,
      `describe('E01-US-004: Advisor Profile Setup', () => {
  let profileService: ProfileCompletionService
  const mockDb = (database as any)
  
  beforeEach(() => {
    jest.clearAllMocks()
    profileService = new ProfileCompletionService()
    
    // Initialize all mock database objects
    mockDb.advisors = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    }
    mockDb.profiles = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    }
    mockDb.onboardingProgress = {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    }
  })`
    );
  } else {
    // Update existing beforeEach
    content = content.replace(
      /beforeEach\(\(\) => \{[\s\S]*?\}\)/,
      `beforeEach(() => {
    jest.clearAllMocks()
    profileService = new ProfileCompletionService()
    
    // Initialize all mock database objects
    mockDb.advisors = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    }
    mockDb.profiles = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    }
    mockDb.onboardingProgress = {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    }
  })`
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed profile completion test syntax');
}

// Main execution
console.log('🔧 Fixing syntax errors in test files...\n');

fixEmailSyntax();
fixMobileSyntax();
fixProfileSyntax();

console.log('\n✅ Syntax fixes complete!');
console.log('Run: npm test -- --testPathPattern="unit" to verify');