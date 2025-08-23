# Comprehensive Testing Guide

## Overview
Step-by-step guide for testing all implemented features of the AI-powered financial content compliance platform.

## Prerequisites

### System Requirements
- Node.js 18+ installed
- Chrome/Firefox/Safari (latest version)
- 8GB RAM minimum
- Stable internet connection

### Setup Commands
```bash
# Terminal 1 - Frontend
cd apps/web
npm install
npm run dev
# Should start on http://localhost:3000

# Terminal 2 - Backend
npm run dev:backend
# Should start on http://localhost:8001

# Verify both services
curl http://localhost:3000 # Should return HTML
curl http://localhost:8001/health # Should return JSON
```

## Testing Checklist

### ✅ Phase 1: Service Verification

#### 1.1 Frontend Health Check
```
URL: http://localhost:3000
Expected: Landing page loads with gradient background
Test: 
  - Page loads within 2 seconds
  - No console errors
  - Responsive design works
```

#### 1.2 Backend Health Check
```
URL: http://localhost:8001/health
Expected: JSON response with status "ok"
Test:
  curl http://localhost:8001/health
  Response: {
    "status": "ok",
    "timestamp": "...",
    "uptime": 1234
  }
```

#### 1.3 Integration Test Page
```
URL: http://localhost:3000/test-integration
Expected: All three status cards show green/connected
Test:
  - Backend API: Connected
  - Compliance API: Connected
  - Authentication: Working
```

---

### ✅ Phase 2: Advisor Journey Testing

#### 2.1 Advisor Dashboard
```
URL: http://localhost:3000/overview
```

**Test Scenarios:**

##### A. Visual Elements
- [ ] Advisor name displays correctly ("Good Morning, Raj")
- [ ] Tier badge shows (Elite/Premium/Basic)
- [ ] Registration ID visible (ARN-12345)
- [ ] Avatar displays with correct tier indicator
- [ ] Countdown timer updates every second

##### B. Performance Metrics
- [ ] Content Delivered card shows value and trend
- [ ] Compliance Score displays percentage
- [ ] Delivery Rate shows success rate
- [ ] Client Engagement displays open rate

##### C. Interactive Elements
- [ ] "Create Custom Content" button is clickable
- [ ] Preview buttons work on content items
- [ ] Quick Actions buttons are responsive
- [ ] Activity timeline scrolls properly

**Test Commands:**
```javascript
// In browser console
// Check countdown timer
setInterval(() => {
  console.log(document.querySelector('[class*="countdown"]').textContent);
}, 1000);

// Verify metrics cards
document.querySelectorAll('[class*="stats-card"]').length; // Should be 4

// Test activity timeline
document.querySelector('[class*="timeline"]').children.length; // Should have items
```

#### 2.2 Content Creation Flow

**Test Scenario: Create Compliant Content**

##### Step 1: Start Creation
```
Location: Dashboard
Action: Click "Create Custom Content"
Expected: Content Composer appears
```

##### Step 2: Enter Non-Compliant Content
```
Text: "Guaranteed 50% returns in just 30 days! Invest now!"
Type: Promotional
Language: English

Expected Results:
- Risk Score: >70% (Red)
- Status: "High Risk - Compliance review required"
- Flags: "Cannot guarantee returns"
- Suggestions appear
```

##### Step 3: Enter Compliant Content
```
Text: "Mutual funds offer potential for long-term wealth creation. 
      Investments are subject to market risks. 
      Please read all scheme documents carefully."
Type: Educational
Language: English

Expected Results:
- Risk Score: <30% (Green)
- Status: "Low Risk - Ready to send"
- No critical flags
- Submit button enabled
```

##### Step 4: Test Multi-language
```
Switch to Hindi tab
Enter: "म्यूचुअल फंड निवेश बाजार जोखिमों के अधीन हैं"
Expected: Compliance check works in Hindi
```

##### Step 5: Test Auto-save
```
Type any content
Wait 2 seconds
Expected: "Draft saved" badge appears
```

**Validation Scripts:**
```javascript
// Test real-time compliance
const composer = document.querySelector('[class*="composer"]');
const textarea = composer.querySelector('textarea');
const submitBtn = composer.querySelector('button[type="submit"]');

// Simulate typing
textarea.value = "Test content";
textarea.dispatchEvent(new Event('input', { bubbles: true }));

// Check for compliance feedback after 500ms
setTimeout(() => {
  const riskScore = document.querySelector('[class*="risk-score"]');
  console.log('Risk Score:', riskScore?.textContent);
}, 600);
```

---

### ✅ Phase 3: Admin Journey Testing

#### 3.1 Admin Approval Queue
```
URL: http://localhost:3000/approval-queue
```

**Test Scenarios:**

##### A. Header Verification
- [ ] "Content Approval Center" title displays
- [ ] Admin badge shows "Elite Access"
- [ ] Review window shows (20:30 - 21:30 IST)
- [ ] Executive Report button visible

##### B. Statistics Cards
- [ ] Pending Reviews shows count
- [ ] Approval Rate shows percentage
- [ ] Avg Processing shows time
- [ ] Quality Score displays

##### C. Content Queue Table
- [ ] Table headers display correctly
- [ ] Content items load in table
- [ ] Advisor avatars and names show
- [ ] Risk scores display with colors
- [ ] Timestamps show relative time

##### D. Filtering System
```
Test each filter:
1. Click "Elite" - only elite advisors show
2. Click "Premium" - only premium advisors show
3. Click "High" risk - only high-risk content shows
4. Click "All" - resets filter
```

##### E. Bulk Operations
```
1. Click checkbox for first item
2. Click checkbox for second item
3. Verify "Approve (2)" button shows count
4. Click "Select All"
5. Verify all items selected
6. Click "Deselect All"
7. Verify all items deselected
```

**Validation Commands:**
```javascript
// Count pending items
document.querySelectorAll('tbody tr').length;

// Test select all
document.querySelector('[aria-label="Select all"]').click();
const selected = document.querySelectorAll('input[type="checkbox"]:checked').length;
console.log(`Selected: ${selected} items`);

// Test filtering
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.includes('Elite')) btn.click();
});
```

#### 3.2 System Status Monitoring
```
Location: Bottom of approval queue page
```

**Tests:**
- [ ] WhatsApp API shows green/operational
- [ ] AI Service shows response time <200ms
- [ ] Rate Limit shows percentage <80%
- [ ] Queue shows job count

---

### ✅ Phase 4: AI Compliance Testing

#### 4.1 Direct API Testing
```bash
# Test 1: High-risk content
curl -X POST http://localhost:8001/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Guaranteed returns! No risk!",
    "contentType": "whatsapp",
    "language": "en"
  }'
# Expected: riskScore > 70

# Test 2: Compliant content
curl -X POST http://localhost:8001/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Mutual funds are subject to market risks",
    "contentType": "whatsapp",
    "language": "en"
  }'
# Expected: riskScore < 30

# Test 3: Response time
time curl -X POST http://localhost:8001/compliance/check \
  -H "Content-Type: application/json" \
  -d '{"content": "Test", "contentType": "whatsapp", "language": "en"}'
# Expected: real time < 0.5s
```

#### 4.2 Compliance Patterns Testing

**Test Various Violations:**

```javascript
// Test guaranteed returns
testContent("100% guaranteed profits", expectedScore > 80);

// Test missing disclaimer
testContent("Invest in mutual funds", expectedScore > 40);

// Test with disclaimer
testContent("Invest in mutual funds. Subject to market risks.", expectedScore < 30);

// Test urgency tactics
testContent("Last chance! Invest today!", expectedScore > 60);

// Test balanced content
testContent("Consider SIPs for disciplined investing. Markets carry risks.", expectedScore < 40);
```

#### 4.3 Multi-language Compliance
```javascript
// Hindi test
const hindiContent = "गारंटीड रिटर्न";
// Expected: High risk detected in Hindi

// Marathi test
const marathiContent = "खात्रीशीर परतावा";
// Expected: High risk detected in Marathi
```

---

### ✅ Phase 5: Performance Testing

#### 5.1 Page Load Times
```javascript
// Run in console
performance.mark('start');
fetch('/overview').then(() => {
  performance.mark('end');
  performance.measure('load', 'start', 'end');
  const measure = performance.getEntriesByName('load')[0];
  console.log(`Page load: ${measure.duration}ms`);
});
```

**Expected Results:**
- Landing page: <1s
- Dashboard: <2s
- Admin queue: <2s
- API responses: <500ms

#### 5.2 Real-time Features
```javascript
// Test countdown timer smoothness
let lastTime = null;
setInterval(() => {
  const timer = document.querySelector('[class*="countdown"]');
  if (timer) {
    const currentTime = timer.textContent;
    if (lastTime && lastTime === currentTime) {
      console.warn('Timer stuck!');
    }
    lastTime = currentTime;
  }
}, 1000);
```

#### 5.3 Concurrent User Simulation
```javascript
// Simulate multiple compliance checks
async function stressTest() {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      fetch('http://localhost:8001/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Test content ${i}`,
          contentType: 'whatsapp',
          language: 'en'
        })
      })
    );
  }
  
  const start = Date.now();
  await Promise.all(promises);
  const duration = Date.now() - start;
  console.log(`10 concurrent requests: ${duration}ms`);
}

stressTest();
```

---

### ✅ Phase 6: Accessibility Testing

#### 6.1 Keyboard Navigation
```
Test without mouse:
1. Press Tab - focus should move logically
2. Press Enter on buttons - should activate
3. Press Escape in modals - should close
4. Arrow keys in tables - should navigate
```

#### 6.2 Screen Reader Testing
```
Using NVDA or JAWS:
1. Navigate to dashboard
2. Verify all buttons have labels
3. Check form fields have descriptions
4. Verify error messages are announced
```

#### 6.3 Color Contrast
```javascript
// Run Lighthouse audit
// In Chrome DevTools:
// 1. Open DevTools (F12)
// 2. Go to Lighthouse tab
// 3. Run Accessibility audit
// Expected: Score > 90
```

---

### ✅ Phase 7: Mobile Testing

#### 7.1 Responsive Design
```
Chrome DevTools Device Mode:
1. Press F12
2. Click device toggle (Ctrl+Shift+M)
3. Select iPhone 12
4. Test each page:
   - Landing page
   - Dashboard
   - Admin queue
   - Content composer
```

#### 7.2 Touch Interactions
```
In mobile mode:
1. Test button tap targets (should be 44x44px minimum)
2. Test swipe on tables
3. Test dropdown menus
4. Test form inputs
```

---

## Automated Testing Scripts

### Run All Tests
```bash
# Create test script
cat > run-tests.sh << 'EOF'
#!/bin/bash

echo "🧪 Starting Comprehensive Tests..."

# 1. Check services
echo "✓ Checking Frontend..."
curl -s http://localhost:3000 > /dev/null && echo "Frontend OK" || echo "Frontend ERROR"

echo "✓ Checking Backend..."
curl -s http://localhost:8001/health | grep -q "ok" && echo "Backend OK" || echo "Backend ERROR"

# 2. Test compliance API
echo "✓ Testing Compliance API..."
response=$(curl -s -X POST http://localhost:8001/compliance/check \
  -H "Content-Type: application/json" \
  -d '{"content":"Test","contentType":"whatsapp","language":"en"}')
  
if echo $response | grep -q "riskScore"; then
  echo "Compliance API OK"
else
  echo "Compliance API ERROR"
fi

# 3. Performance test
echo "✓ Testing Response Time..."
time curl -s http://localhost:8001/health > /dev/null

echo "✅ All tests complete!"
EOF

chmod +x run-tests.sh
./run-tests.sh
```

### Browser Automation Test
```javascript
// Save as test-automation.js
// Run with: node test-automation.js

const puppeteer = require('puppeteer');

async function runTests() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Test 1: Dashboard loads
  await page.goto('http://localhost:3000/overview');
  await page.waitForSelector('[class*="dashboard"]');
  console.log('✅ Dashboard loaded');
  
  // Test 2: Content composer works
  await page.click('button:has-text("Create Custom Content")');
  await page.type('textarea', 'Test content');
  await page.waitForTimeout(600); // Wait for compliance check
  const riskScore = await page.$eval('[class*="risk"]', el => el.textContent);
  console.log(`✅ Compliance check: ${riskScore}`);
  
  // Test 3: Admin queue loads
  await page.goto('http://localhost:3000/approval-queue');
  await page.waitForSelector('table');
  const rows = await page.$$('tbody tr');
  console.log(`✅ Admin queue: ${rows.length} items`);
  
  await browser.close();
}

runTests().catch(console.error);
```

## Troubleshooting Common Issues

### Issue 1: Backend Not Responding
```bash
# Check if port is in use
lsof -i :8001

# Kill process if needed
kill -9 <PID>

# Restart backend
npm run dev:backend
```

### Issue 2: Compliance Check Timeout
```javascript
// Increase timeout in use-compliance.ts
const TIMEOUT = 5000; // Increase from 3000

// Or check backend logs
tail -f backend.log
```

### Issue 3: State Not Updating
```javascript
// Clear all storage
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

### Issue 4: Styles Not Loading
```bash
# Rebuild CSS
npm run build:css

# Clear Next.js cache
rm -rf .next
npm run dev
```

## Test Report Template

```markdown
## Test Execution Report
Date: [DATE]
Tester: [NAME]
Environment: Development

### Summary
- Total Tests: 50
- Passed: 48
- Failed: 2
- Blocked: 0

### Failed Tests
1. [Test Name] - [Reason]
2. [Test Name] - [Reason]

### Performance Metrics
- Page Load: [X]ms
- API Response: [X]ms
- Compliance Check: [X]ms

### Notes
[Any observations or recommendations]

### Sign-off
[ ] Frontend Functional
[ ] Backend Operational
[ ] AI Compliance Working
[ ] Performance Acceptable
[ ] Ready for Production
```

## Continuous Testing

### Set up monitoring
```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
  clear
  echo "🔍 System Monitor - $(date)"
  echo "------------------------"
  
  # Check frontend
  curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000
  
  # Check backend
  curl -s http://localhost:8001/health | jq -r '"Backend: " + .status'
  
  # Check compliance
  response=$(curl -s -X POST http://localhost:8001/compliance/check \
    -H "Content-Type: application/json" \
    -d '{"content":"Test","contentType":"whatsapp","language":"en"}')
  echo "Compliance: $(echo $response | jq -r .riskScore)%"
  
  sleep 5
done
EOF

chmod +x monitor.sh
./monitor.sh
```

This testing guide ensures comprehensive validation of all implemented features with clear, actionable steps and expected results.