#!/usr/bin/env node

/**
 * Fix all unit tests comprehensively
 */

const fs = require('fs');
const path = require('path');

// Fix email verification tests
function fixEmailVerificationTests() {
  const filePath = path.join(__dirname, '..', 'tests/unit/services/email-verification.test.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix SEBI disclaimer test
  content = content.replace(
    `await emailService.sendVerificationEmail({
        userId,
        email,
        firstName: 'Test',
      })
      
      const emailCall = mockSendEmail.mock.calls[0][0]
      expect(emailCall.data).toMatchObject({
        disclaimer: expect.stringContaining('SEBI'),
        regulatoryNote: expect.stringContaining('financial advisory'),`,
    `// Mock the token creation
      mockDb.verificationTokens.create.mockResolvedValue({
        id: 'token-id',
        token: 'hashed-token',
        userId,
        email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      
      await emailService.sendVerificationEmail({
        userId,
        email,
        firstName: 'Test',
      })
      
      const emailCall = mockSendEmail.mock.calls[0][0]
      expect(emailCall.data).toMatchObject({
        disclaimer: expect.stringContaining('SEBI'),
        regulatoryNote: expect.stringContaining('financial advisory'),`
  );
  
  // Fix validation tests
  content = content.replace(
    /mockValidateToken\.mockReturnValue\(/g,
    'mockDb.verificationTokens.findFirst.mockResolvedValue('
  );
  
  // Fix token validation expectations
  content = content.replace(
    `expect(mockValidateToken).toHaveBeenCalledWith(token)`,
    `expect(mockDb.verificationTokens.findFirst).toHaveBeenCalled()`
  );
  
  // Fix resend tests
  content = content.replace(
    `const result = await emailService.resendVerificationEmail(userId)`,
    `// Mock existing user
      mockDb.advisors.findUnique.mockResolvedValue({
        id: userId,
        email,
        emailVerified: false,
      })
      
      // Mock rate limit check
      mockDb.emailLogs.count.mockResolvedValue(0)
      
      // Mock token creation
      mockDb.verificationTokens.create.mockResolvedValue({
        id: 'new-token-id',
        token: 'new-hashed-token',
        userId,
        email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      
      const result = await emailService.resendVerificationEmail(userId)`
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed email verification tests');
}

// Fix profile completion tests
function fixProfileCompletionTests() {
  const filePath = path.join(__dirname, '..', 'tests/unit/services/profile-completion.test.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Profile completion test file not found');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add missing mock setup at the beginning
  if (!content.includes('beforeEach(() => {') || !content.includes('mockDb')) {
    const setupMocks = `
// Ensure all database mocks are set up
beforeEach(() => {
  if (mockDb.otpTokens) {
    mockDb.otpTokens.findMany.mockResolvedValue([]);
    mockDb.otpTokens.deleteMany.mockResolvedValue({ count: 0 });
  }
  if (mockDb.emailVerificationTokens) {
    mockDb.emailVerificationTokens.findFirst.mockResolvedValue(null);
    mockDb.emailVerificationTokens.deleteMany.mockResolvedValue({ count: 0 });
  }
});

`;
    content = content.replace(/describe\('E01-US-004/, setupMocks + "describe('E01-US-004");
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed profile completion tests');
}

// Fix all validation test issues
function fixValidationTests() {
  const files = [
    'tests/unit/services/email-verification.test.ts',
    'tests/unit/services/mobile-verification.test.ts',
    'tests/unit/services/profile-completion.test.ts'
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix validateToken calls - the service uses database directly
    content = content.replace(
      /it\('should validate correct verification token'/g,
      "it('should validate correct verification token'"
    );
    
    // Fix async token validation
    content = content.replace(
      /const result = await emailService\.validateToken\(token\)/g,
      `// Mock token lookup
      mockDb.verificationTokens.findFirst.mockResolvedValue({
        id: 'token-id',
        token: await bcrypt.hash(token, 10),
        userId,
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        used: false,
      })
      
      const result = await emailService.validateToken(token)`
    );
    
    // Add bcrypt import if needed
    if (content.includes('bcrypt.hash') && !content.includes("import bcrypt") && !content.includes("import * as bcrypt")) {
      content = "import bcrypt from 'bcryptjs'\n" + content;
    }
    
    fs.writeFileSync(filePath, content);
  });
  
  console.log('✅ Fixed validation tests');
}

// Fix transaction mock issues
function fixTransactionMocks() {
  const files = [
    'tests/unit/services/email-verification.test.ts',
    'tests/unit/services/mobile-verification.test.ts',
    'tests/unit/services/profile-completion.test.ts'
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix transaction mock to properly return values
    content = content.replace(
      /\$transaction: jest\.fn\(\(fn\) => fn\(/g,
      '$transaction: jest.fn(async (fn) => await fn('
    );
    
    // Fix verification completion test
    content = content.replace(
      /it\('should mark email as verified in database'/g,
      "it('should mark email as verified in database'"
    );
    
    // Fix the verifyEmail method tests
    content = content.replace(
      /const result = await emailService\.verifyEmail\(token\)/g,
      `// Setup transaction mock
      const mockTransaction = {
        verificationTokens: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'token-id',
            token: 'hashed-token',
            userId: 'user-123',
            email: 'test@example.com',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            used: false,
          }),
          update: jest.fn(),
        },
        advisors: {
          update: jest.fn(),
        },
        onboardingProgress: {
          upsert: jest.fn(),
        },
      }
      
      mockDb.$transaction.mockImplementation(async (fn) => await fn(mockTransaction))
      
      const result = await emailService.verifyEmail(token)`
    );
    
    fs.writeFileSync(filePath, content);
  });
  
  console.log('✅ Fixed transaction mocks');
}

// Main execution
console.log('🔧 Fixing all unit tests...\n');

fixEmailVerificationTests();
fixProfileCompletionTests();
fixValidationTests();
fixTransactionMocks();

console.log('\n✅ Unit test fixes complete!');
console.log('Run: npm test -- --testPathPattern="unit" to verify');