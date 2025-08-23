#!/usr/bin/env node

/**
 * Script to fix common test issues across the codebase
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common mock patterns that need to be added to tests
const commonMocks = {
  // Mock delay functions to prevent timeouts
  delayMock: `jest.spyOn(global, 'setTimeout').mockImplementation((cb) => { cb(); return 0 as any; });`,
  
  // Mock Redis client
  redisMock: `jest.mock('@/lib/redis', () => ({
    redis: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(false),
      expire: jest.fn().mockResolvedValue(undefined),
      ttl: jest.fn().mockResolvedValue(-1),
      keys: jest.fn().mockResolvedValue([]),
      flushall: jest.fn().mockResolvedValue(undefined),
    }
  }));`,
  
  // Mock Supabase client
  supabaseMock: `jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
          download: jest.fn().mockResolvedValue({ data: Buffer.from('test'), error: null }),
          remove: jest.fn().mockResolvedValue({ data: null, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.jpg' } }),
        })),
      },
    })),
  }));`,
  
  // Mock fetch for API calls
  fetchMock: `global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
    text: async () => 'OK',
  });`,
  
  // Mock console methods to reduce noise
  consoleMock: `const originalError = console.error;
  const originalWarn = console.warn;
  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });`,
};

// Function to add missing mocks to test files
function addMissingMocks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file imports redis and doesn't have redis mock
  if (content.includes("from '@/lib/redis'") && !content.includes("jest.mock('@/lib/redis'")) {
    // Add redis mock after imports
    const importEndIndex = content.lastIndexOf('import');
    const importEndLine = content.indexOf('\n', importEndIndex);
    content = content.slice(0, importEndLine + 1) + '\n' + commonMocks.redisMock + '\n' + content.slice(importEndLine + 1);
    modified = true;
  }
  
  // Check if file uses setTimeout/delay and doesn't mock it
  if ((content.includes('delay') || content.includes('setTimeout')) && !content.includes('jest.spyOn(global, \'setTimeout\')')) {
    // Add delay mock in beforeEach
    const beforeEachIndex = content.indexOf('beforeEach(');
    if (beforeEachIndex !== -1) {
      const beforeEachEnd = content.indexOf('{', beforeEachIndex);
      content = content.slice(0, beforeEachEnd + 1) + '\n    ' + commonMocks.delayMock + content.slice(beforeEachEnd + 1);
      modified = true;
    }
  }
  
  // Add fetch mock if needed
  if (content.includes('fetch(') && !content.includes('global.fetch = jest.fn()')) {
    const describeIndex = content.indexOf('describe(');
    if (describeIndex !== -1) {
      const describeStart = content.indexOf('{', describeIndex);
      content = content.slice(0, describeStart + 1) + '\n  ' + commonMocks.fetchMock + '\n' + content.slice(describeStart + 1);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${path.basename(filePath)}`);
    return true;
  }
  
  return false;
}

// Function to fix service constructor issues
function fixServiceConstructors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix patterns like "new ServiceName()" when the service exports functions
  const serviceConstructorPattern = /new\s+(\w+Service)\(\)/g;
  const matches = content.match(serviceConstructorPattern);
  
  if (matches) {
    matches.forEach(match => {
      const serviceName = match.match(/new\s+(\w+Service)/)[1];
      // Check if this is likely a function-based service
      if (content.includes(`import { ${serviceName} }`)) {
        // Replace with direct function usage
        content = content.replace(new RegExp(`new ${serviceName}\\(\\)`, 'g'), `${serviceName}`);
        modified = true;
      }
    });
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed service constructors in: ${path.basename(filePath)}`);
    return true;
  }
  
  return false;
}

// Main execution
console.log('🔧 Fixing common test issues...\n');

const testFiles = glob.sync('tests/**/*.test.ts', {
  cwd: path.join(__dirname, '..'),
  absolute: true
});

let fixedCount = 0;

testFiles.forEach(file => {
  if (addMissingMocks(file)) fixedCount++;
  if (fixServiceConstructors(file)) fixedCount++;
});

console.log(`\n✅ Fixed ${fixedCount} test files`);
console.log('Run "npm test" to check the results');