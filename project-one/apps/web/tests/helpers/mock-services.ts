
// Auto-generated mock implementations

export const mockEmailService = {
  sendVerificationEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendWelcomeEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve({ success: true })),
};

export const mockSMSService = {
  sendOTP: jest.fn(() => Promise.resolve({ success: true })),
  sendNotification: jest.fn(() => Promise.resolve({ success: true })),
};

export const mockDatabaseOperations = {
  create: jest.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
  findFirst: jest.fn(() => Promise.resolve(null)),
  findMany: jest.fn(() => Promise.resolve([])),
  update: jest.fn((data) => Promise.resolve(data)),
  delete: jest.fn(() => Promise.resolve({ count: 1 })),
  deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
  upsert: jest.fn((data) => Promise.resolve(data)),
};

export function setupAllMocks() {
  // Setup all database mocks
  const tables = ['advisors', 'otpTokens', 'emailVerificationTokens', 'advisorProfiles', 'onboardingProgress'];
  
  tables.forEach(table => {
    if (typeof global.mockDb !== 'undefined' && global.mockDb[table]) {
      Object.assign(global.mockDb[table], mockDatabaseOperations);
    }
  });
}
