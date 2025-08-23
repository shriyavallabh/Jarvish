# Mobile Test Command

## Description
Specialized mobile testing command for Jarvish platform, focusing on advisor mobile workflow optimization and responsive design validation.

## Usage
```
/mobile-test [device] [journey]
```

**Parameters:**
- `device` (optional): iphone|android|tablet|all (default: iphone)
- `journey` (optional): onboarding|content|whatsapp|analytics|full (default: content)

## Device Emulations

### iPhone (Primary Target)
```typescript
{
  name: 'iPhone 13',
  viewport: { width: 390, height: 844 },
  userAgent: 'iPhone Safari',
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true
}
```

### Android (Secondary Target)
```typescript
{
  name: 'Pixel 5',
  viewport: { width: 393, height: 851 },
  userAgent: 'Android Chrome',
  deviceScaleFactor: 2.75,
  isMobile: true,
  hasTouch: true
}
```

### Tablet (Alternative Usage)
```typescript
{
  name: 'iPad',
  viewport: { width: 768, height: 1024 },
  userAgent: 'iPad Safari',
  deviceScaleFactor: 2,
  isMobile: false,
  hasTouch: true
}
```

## User Journey Testing

### Onboarding Journey
Tests the complete advisor signup and setup process:
1. Landing page mobile experience
2. Registration form usability
3. EUIN verification on mobile
4. WhatsApp Business setup
5. First content generation
6. Mobile dashboard tour

### Content Journey (Default)
Core content creation workflow on mobile:
1. Dashboard quick access
2. AI content generation flow
3. Content editing and approval
4. SEBI compliance checking
5. WhatsApp preview and delivery
6. Analytics and engagement tracking

### WhatsApp Journey  
WhatsApp integration testing:
1. Contact import and management
2. Message template selection
3. Bulk message composition
4. Delivery scheduling
5. Status tracking and analytics
6. Error handling and retry flows

### Analytics Journey
Mobile analytics and insights:
1. Dashboard metrics overview
2. Performance charts and graphs
3. Client engagement tracking
4. Peer comparison views
5. Export and sharing features
6. Mobile-optimized data visualization

## Mobile-Specific Validations

### Touch Interface Testing
```typescript
const touchTargets = [
  'buttons >= 44px',
  'form fields >= 44px', 
  'navigation elements >= 44px',
  'interactive cards >= 44px'
];

const gestureTests = [
  'tap accuracy',
  'scroll smoothness',
  'swipe navigation',
  'pinch zoom (where appropriate)',
  'long press actions'
];
```

### Performance Optimization
```typescript
const mobilePerformance = {
  pageLoadTime: '< 3 seconds on 3G',
  timeToInteractive: '< 5 seconds',
  firstContentfulPaint: '< 2 seconds',
  cumulativeLayoutShift: '< 0.1',
  bundleSize: 'optimized for mobile'
};
```

### Mobile UX Patterns
- **Thumb-friendly navigation**: Bottom navigation for primary actions
- **Progressive disclosure**: Collapsible sections for content hierarchy  
- **Offline capability**: Graceful degradation for poor connectivity
- **Portrait orientation**: Primary design focus
- **Landscape support**: Secondary but functional

## SEBI Compliance on Mobile

### Required Mobile Elements
- [ ] Disclaimer text remains readable (min 12px)
- [ ] EUIN clearly visible in header/footer
- [ ] Risk warnings not truncated
- [ ] Contact information accessible
- [ ] Terms and privacy policy linked

### Mobile-Specific Disclaimers
```html
<!-- Compact mobile disclaimer -->
<div class="mobile-disclaimer">
  <p class="text-xs">
    निवेश जोखिमों के अधीन है। EUIN: [NUMBER]
    <a href="/terms" class="underline">पूर्ण नियम</a>
  </p>
</div>
```

## Implementation

```typescript
import { devices, chromium } from 'playwright';

async function runMobileTest(deviceType = 'iphone', journey = 'content') {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 // Simulate realistic touch interaction speed
  });
  
  // Device configuration
  const deviceConfigs = {
    iphone: devices['iPhone 13'],
    android: devices['Pixel 5'],
    tablet: devices['iPad'],
    all: [devices['iPhone 13'], devices['Pixel 5'], devices['iPad']]
  };
  
  const testDevices = deviceType === 'all' 
    ? deviceConfigs.all 
    : [deviceConfigs[deviceType]];
  
  console.log(`📱 Starting mobile test: ${journey} journey`);
  console.log(`🔧 Device(s): ${deviceType}`);
  
  for (const device of testDevices) {
    const context = await browser.newContext({
      ...device,
      // Simulate slower mobile network
      extraHTTPHeaders: {
        'Connection': 'slow-2g'
      }
    });
    
    const page = await context.newPage();
    
    // Monitor network and console
    const networkLogs = [];
    const consoleLogs = [];
    
    page.on('response', response => {
      if (response.status() >= 400) {
        networkLogs.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
    
    try {
      await runJourneyTest(page, journey, device.name);
      
      // Generate mobile-specific report
      await generateMobileReport(page, device.name, {
        networkLogs,
        consoleLogs,
        journey
      });
      
    } catch (error) {
      console.error(`❌ Mobile test failed on ${device.name}:`, error);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
  console.log('🎉 Mobile testing completed!');
}

async function runJourneyTest(page, journey, deviceName) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log(`\n📱 Testing ${journey} journey on ${deviceName}`);
  
  switch (journey) {
    case 'onboarding':
      await testOnboardingJourney(page, baseUrl);
      break;
    case 'content':
      await testContentJourney(page, baseUrl);
      break;
    case 'whatsapp':
      await testWhatsAppJourney(page, baseUrl);
      break;
    case 'analytics':
      await testAnalyticsJourney(page, baseUrl);
      break;
    case 'full':
      await testOnboardingJourney(page, baseUrl);
      await testContentJourney(page, baseUrl);
      await testWhatsAppJourney(page, baseUrl);
      await testAnalyticsJourney(page, baseUrl);
      break;
  }
}

async function testContentJourney(page, baseUrl) {
  const steps = [
    { name: 'Dashboard Load', url: `${baseUrl}/advisor/dashboard` },
    { name: 'Content Generation', action: () => page.click('[data-testid="generate-content"]') },
    { name: 'AI Loading State', wait: 3000 },
    { name: 'Content Preview', verify: '[data-testid="content-preview"]' },
    { name: 'Compliance Check', verify: '[data-testid="compliance-status"]' },
    { name: 'WhatsApp Preview', action: () => page.click('[data-testid="whatsapp-preview"]') },
    { name: 'Send Confirmation', action: () => page.click('[data-testid="send-message"]') }
  ];
  
  for (const step of steps) {
    console.log(`  ⏳ ${step.name}...`);
    
    if (step.url) {
      await page.goto(step.url, { waitUntil: 'networkidle' });
    }
    
    if (step.action) {
      await step.action();
    }
    
    if (step.wait) {
      await page.waitForTimeout(step.wait);
    }
    
    if (step.verify) {
      const element = await page.locator(step.verify).count();
      console.log(`    ${element > 0 ? '✅' : '❌'} Element verified: ${step.verify}`);
    }
    
    // Take screenshot at each key step
    await page.screenshot({ 
      path: `./temp/mobile-${step.name.toLowerCase().replace(/\s+/g, '-')}.png`,
      fullPage: false // Mobile screens are long, focus on viewport
    });
  }
}

// Additional journey test functions...
async function testOnboardingJourney(page, baseUrl) { /* ... */ }
async function testWhatsAppJourney(page, baseUrl) { /* ... */ }
async function testAnalyticsJourney(page, baseUrl) { /* ... */ }

async function generateMobileReport(page, deviceName, logs) {
  const report = {
    device: deviceName,
    timestamp: new Date().toISOString(),
    performance: await collectPerformanceMetrics(page),
    accessibility: await runAccessibilityCheck(page),
    sebiCompliance: await checkSEBICompliance(page),
    touchTargets: await validateTouchTargets(page),
    networkIssues: logs.networkLogs,
    consoleErrors: logs.consoleLogs
  };
  
  console.log(`\n📊 ${deviceName} Test Results:`);
  console.log(`   Performance: ${report.performance.grade}`);
  console.log(`   Accessibility: ${report.accessibility.score}/100`);
  console.log(`   SEBI Compliance: ${report.sebiCompliance.passed ? 'PASS' : 'FAIL'}`);
  console.log(`   Touch Targets: ${report.touchTargets.passed}/${report.touchTargets.total}`);
  console.log(`   Network Issues: ${report.networkIssues.length}`);
  console.log(`   Console Errors: ${report.consoleErrors.length}`);
  
  // Save detailed report
  const fs = require('fs');
  fs.writeFileSync(
    `./temp/mobile-report-${deviceName}-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );
}
```

## Testing Checklist

### ✅ Mobile UX Validation
- [ ] Navigation accessible with thumb
- [ ] Text readable without zooming
- [ ] Forms easy to fill on mobile keyboard
- [ ] Loading states clear and informative
- [ ] Error messages visible and actionable

### ✅ Performance Testing
- [ ] Page loads in <3 seconds on 3G
- [ ] Images optimized for mobile
- [ ] JavaScript bundle size appropriate
- [ ] Smooth scrolling and interactions
- [ ] Battery usage reasonable

### ✅ SEBI Compliance Mobile
- [ ] All disclaimers visible on small screens
- [ ] EUIN displayed prominently
- [ ] Risk warnings not hidden or truncated
- [ ] Contact information easily accessible
- [ ] Privacy policy reachable

### ✅ Indian Market Optimization
- [ ] Hindi text renders correctly
- [ ] Rupee symbol displays properly
- [ ] Local phone number formats supported
- [ ] Cultural imagery appropriate
- [ ] Offline functionality graceful

## Integration with Development

### Pre-commit Hook
```bash
#!/bin/sh
# Run mobile test on UI changes
if git diff --cached --name-only | grep -E '\.(css|tsx?|jsx?)$'; then
  echo "🔍 Running mobile compatibility check..."
  claude-code "/mobile-test iphone content"
fi
```

### CI/CD Integration
```yaml
- name: Mobile Testing
  run: |
    npm install
    claude-code "/mobile-test all full"
  env:
    CI: true
    DEVICE_TESTING: true
```

## Output Examples

### Success Output
```
📱 Starting mobile test: content journey
🔧 Device(s): iphone

📱 Testing content journey on iPhone 13
  ⏳ Dashboard Load...
    ✅ Page loaded in 2.1s
  ⏳ Content Generation...
    ✅ AI generation started
  ⏳ WhatsApp Preview...
    ✅ Message preview rendered

📊 iPhone 13 Test Results:
   Performance: A-
   Accessibility: 96/100
   SEBI Compliance: PASS
   Touch Targets: 12/12
   Network Issues: 0
   Console Errors: 0

🎉 Mobile testing completed!
```

### Issue Detection
```
❌ Issues Found:
   - Touch target too small: Login button (38px, should be ≥44px)
   - Text too small: Disclaimer text (10px, should be ≥12px)
   - Performance: LCP 4.2s exceeds 2.5s threshold
   - Missing: WhatsApp preview not loading on mobile

🔧 Recommended Fixes:
   1. Increase button padding in mobile.css
   2. Update disclaimer font-size for mobile
   3. Optimize image loading for mobile viewport
   4. Debug WhatsApp preview responsive layout
```