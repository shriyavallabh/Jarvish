/**
 * Artillery Load Test Processor
 * Helper functions for load testing scenarios
 */

module.exports = {
  /**
   * Generate random string
   */
  $randomString: function(context, events, done) {
    const length = 8;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    context.vars.randomString = result;
    return done();
  },

  /**
   * Generate random full name
   */
  $randomFullName: function(context, events, done) {
    const firstNames = ['Raj', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Arjun', 'Divya'];
    const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Mehta', 'Gupta', 'Reddy', 'Nair'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    context.vars.randomFullName = `${firstName} ${lastName}`;
    return done();
  },

  /**
   * Generate random email
   */
  $randomEmail: function(context, events, done) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    context.vars.randomEmail = `advisor_${timestamp}_${random}@example.com`;
    return done();
  },

  /**
   * Generate random Indian mobile number
   */
  $randomMobile: function(context, events, done) {
    const prefixes = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '89'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    context.vars.randomMobile = prefix + suffix;
    return done();
  },

  /**
   * Before request hook - add authentication headers
   */
  beforeRequest: function(requestParams, context, ee, next) {
    // Add correlation ID for tracking
    requestParams.headers['X-Correlation-ID'] = `load-test-${Date.now()}-${Math.random()}`;
    
    // Add load test identifier
    requestParams.headers['X-Load-Test'] = 'true';
    
    return next();
  },

  /**
   * After response hook - validate response
   */
  afterResponse: function(requestParams, response, context, ee, next) {
    // Track response times
    if (response.timings) {
      const responseTime = response.timings.phases.firstByte;
      
      // Check SLA compliance
      if (requestParams.url.includes('/api/compliance/validate') && responseTime > 1500) {
        ee.emit('counter', 'compliance.sla.violation', 1);
      }
      
      if (requestParams.url.includes('/api/content/generate') && responseTime > 3500) {
        ee.emit('counter', 'generation.sla.violation', 1);
      }
    }
    
    // Track error rates by endpoint
    if (response.statusCode >= 400) {
      const endpoint = requestParams.url.split('?')[0];
      ee.emit('counter', `errors.${response.statusCode}.${endpoint}`, 1);
    }
    
    return next();
  },

  /**
   * Custom function to validate compliance score
   */
  validateComplianceScore: function(context, next) {
    const score = context.vars.complianceScore;
    
    if (score < 95) {
      context.vars.complianceValid = false;
      console.error(`Low compliance score: ${score}`);
    } else {
      context.vars.complianceValid = true;
    }
    
    return next();
  },

  /**
   * Custom function to simulate think time based on user behavior
   */
  dynamicThinkTime: function(context, next) {
    // Simulate variable think time based on operation
    const minThink = 500;
    const maxThink = 3000;
    const thinkTime = Math.floor(Math.random() * (maxThink - minThink) + minThink);
    
    setTimeout(() => {
      return next();
    }, thinkTime);
  },

  /**
   * Generate test content for various scenarios
   */
  generateTestContent: function(context, events, done) {
    const templates = [
      'Mutual funds are subject to market risks. Read all scheme documents carefully before investing.',
      'SIP investments help in rupee cost averaging and power of compounding.',
      'Diversification across asset classes reduces portfolio risk.',
      'Tax benefits under Section 80C available for ELSS investments up to 1.5 lakhs.',
      'Long-term capital gains tax applicable on equity mutual funds held for more than 1 year.'
    ];
    
    context.vars.testContent = templates[Math.floor(Math.random() * templates.length)];
    return done();
  },

  /**
   * Validate WhatsApp delivery SLA
   */
  validateDeliverySLA: function(context, next) {
    const slaRate = context.vars.slaRate;
    
    if (slaRate < 99) {
      console.error(`WhatsApp delivery SLA violation: ${slaRate}%`);
      context.vars.slaViolation = true;
    }
    
    return next();
  },

  /**
   * Generate batch of phone numbers for WhatsApp testing
   */
  generatePhoneNumbers: function(context, events, done) {
    const count = 10;
    const numbers = [];
    
    for (let i = 0; i < count; i++) {
      const prefix = ['98', '97', '96', '95', '94'][Math.floor(Math.random() * 5)];
      const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      numbers.push(prefix + suffix);
    }
    
    context.vars.phoneNumbers = numbers;
    return done();
  },

  /**
   * Track custom metrics
   */
  trackMetrics: function(requestParams, response, context, ee, next) {
    // Track successful content generation
    if (requestParams.url.includes('/api/content/generate') && response.statusCode === 200) {
      ee.emit('counter', 'content.generated.success', 1);
      
      if (response.body && response.body.generation_time) {
        ee.emit('histogram', 'content.generation.time', response.body.generation_time);
      }
    }
    
    // Track compliance checks
    if (requestParams.url.includes('/api/compliance/validate') && response.statusCode === 200) {
      ee.emit('counter', 'compliance.checks.success', 1);
      
      if (response.body && response.body.processing_time) {
        ee.emit('histogram', 'compliance.processing.time', response.body.processing_time);
      }
    }
    
    // Track WhatsApp scheduling
    if (requestParams.url.includes('/api/whatsapp/schedule') && response.statusCode === 200) {
      ee.emit('counter', 'whatsapp.scheduled.success', 1);
      
      if (response.body && response.body.scheduled_count) {
        ee.emit('histogram', 'whatsapp.recipients.count', response.body.scheduled_count);
      }
    }
    
    return next();
  }
};