const { toMatchImageSnapshot } = require('jest-image-snapshot');

expect.extend({ toMatchImageSnapshot });

// Global test configuration
global.testTimeout = 30000;
global.baseURL = process.env.TEST_URL || 'http://localhost:3000';

// Custom matchers for accessibility testing
expect.extend({
  toHaveNoAccessibilityViolations(received) {
    const pass = received.violations.length === 0;
    if (pass) {
      return {
        message: () => 'Expected accessibility violations but found none',
        pass: true
      };
    } else {
      return {
        message: () => {
          const violations = received.violations.map(v => 
            `- ${v.description} (${v.impact}): ${v.nodes.length} instances`
          ).join('\n');
          return `Found ${received.violations.length} accessibility violations:\n${violations}`;
        },
        pass: false
      };
    }
  },
  
  toHaveGoodColorContrast(received) {
    const contrastIssues = received.filter(issue => 
      issue.id === 'color-contrast' || 
      issue.id === 'link-color-contrast'
    );
    const pass = contrastIssues.length === 0;
    if (pass) {
      return {
        message: () => 'Expected color contrast issues but found none',
        pass: true
      };
    } else {
      return {
        message: () => {
          const issues = contrastIssues.map(i => 
            `- ${i.description}: ${i.nodes.length} instances`
          ).join('\n');
          return `Found color contrast issues:\n${issues}`;
        },
        pass: false
      };
    }
  }
});