# 🧪 JARVISH Manual Testing Guide

## 🚀 Quick Start - Testing Setup

### Terminal 1: Development Server (Already Running)
```bash
# Server is already running at http://localhost:3000
# If you need to restart:
cd /Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web
npm run dev
```

### Terminal 2: Run Tests
```bash
cd /Users/shriyavallabh/Desktop/Jarvish/project-one/apps/web

# Run all tests
npm test

# Run specific test suites
npm test -- tests/unit/services/email-verification.test.ts
npm test -- tests/unit/services/mobile-verification.test.ts
npm test -- tests/unit/services/profile-completion.test.ts

# Run with coverage
npm test -- --coverage
```

### Terminal 3: API Testing with cURL
```bash
# Keep this terminal ready for API testing commands below
```

---

## 📱 Manual Testing Flows

### 1. Landing Page
**URL**: http://localhost:3000

**What to Test**:
- ✅ Check Jarvish branding is visible
- ✅ Verify Navy (#0B1F33) and Gold (#CEA200) color scheme
- ✅ Look for SEBI compliance badges
- ✅ Check pricing tiers (₹999/₹2,499/₹4,999)
- ✅ Test responsive design (resize browser)
- ✅ Click "Get Started" button

---

### 2. Admin Dashboard
**URL**: http://localhost:3000/admin

**What to Test**:
- ✅ Premium Professional theme with dark sidebar
- ✅ Elite Admin branding
- ✅ Stats cards showing metrics
- ✅ Content approval table
- ✅ Filter functionality
- ✅ System status in footer

**Visual Elements to Verify**:
- Dark primary color (#0f172a)
- Gold accents (#d4af37)
- Sidebar navigation
- Data table with advisors

---

### 3. Advisor Dashboard
**URL**: http://localhost:3000/advisor/dashboard

**What to Test**:
- ✅ Jarvish Advisor header
- ✅ Quick stats bar
- ✅ Content creation area
- ✅ WhatsApp preview
- ✅ Analytics section
- ✅ Language toggle (English/Hindi)

---

## 🔌 API Testing Commands

### Test Email Verification Flow

#### 1. Send Verification Email
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

#### 2. Verify Email Token
```bash
curl -X GET "http://localhost:3000/api/auth/verify-email?token=YOUR_TOKEN_HERE&email=test@example.com"
```

---

### Test Mobile Verification Flow

#### 1. Generate OTP
```bash
curl -X POST http://localhost:3000/api/auth/mobile-verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "mobile": "+919876543210"
  }'
```

#### 2. Verify OTP
```bash
curl -X PUT http://localhost:3000/api/auth/mobile-verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "otp": "123456"
  }'
```

#### 3. Resend OTP
```bash
curl -X PATCH http://localhost:3000/api/auth/mobile-verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "mobile": "+919876543210"
  }'
```

---

## 🎨 Visual Testing with Playwright

### Run Visual Tests
```bash
# Basic visual test
node test-ui-implementation.js

# Detailed comparison
node playwright-design-comparison.js

# View results
open test-report.html
open screenshots/
```

---

## 🗄️ Database Testing (Mock)

### Check Mock Database State
```bash
# In Node.js REPL
node
```

```javascript
// Load mock database
const { database } = require('./lib/utils/database')

// Check advisors
database.advisors.findMany().then(console.log)

// Check profiles
database.advisorProfiles.findMany().then(console.log)

// Check OTP tokens
database.otpTokens.findMany().then(console.log)
```

---

## 🧩 Component Testing in Browser

### Using React Developer Tools

1. **Install React DevTools Extension**
   - Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

2. **Inspect Components**
   - Open DevTools (F12)
   - Go to "Components" tab
   - Navigate component tree
   - Check props and state

3. **Test Component States**
   - Click buttons and observe state changes
   - Fill forms and validate
   - Toggle language and check updates

---

## 📊 Performance Testing

### Using Chrome DevTools

1. **Open Performance Tab**
   - Press F12 → Performance tab
   - Click record button
   - Perform actions
   - Stop recording

2. **Check Metrics**
   - First Contentful Paint (FCP) < 1.2s
   - Largest Contentful Paint (LCP) < 2.5s
   - Time to Interactive (TTI) < 3.5s

### Using Lighthouse
```bash
# Run Lighthouse test
npx lighthouse http://localhost:3000 --view

# Mobile test
npx lighthouse http://localhost:3000 --emulated-form-factor=mobile --view
```

---

## 🔍 Testing Checklist

### Authentication Flow
- [ ] Sign up with email
- [ ] Verify email
- [ ] Sign in
- [ ] Mobile OTP verification
- [ ] Profile completion
- [ ] Logout

### Profile Management
- [ ] Fill firm details
- [ ] Upload profile photo
- [ ] Upload company logo
- [ ] Select specializations
- [ ] Choose languages
- [ ] Set branding colors
- [ ] Preview profile

### Content Generation (Mock)
- [ ] Select language
- [ ] Choose content type
- [ ] Generate with AI
- [ ] Check compliance score
- [ ] Preview in WhatsApp format
- [ ] Schedule for delivery

### Responsive Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 🐛 Common Issues & Solutions

### Issue: Pages not loading
**Solution**: 
```bash
# Restart dev server
npm run dev
```

### Issue: API calls failing
**Solution**: Check if you're authenticated (Clerk)
```bash
# Check .env.local has Clerk keys
cat .env.local | grep CLERK
```

### Issue: Styles not applying
**Solution**: 
```bash
# Rebuild CSS
npm run build
```

### Issue: Tests failing
**Solution**:
```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

---

## 📝 Test Data Examples

### Valid Indian Mobile Numbers
```
+919876543210
919876543210
9876543210
+917123456789
```

### Valid SEBI Registration Numbers
```
EUIN: E123456
ARN: ARN-12345
RIA: INA123456789
```

### Test Profile Data
```json
{
  "firmName": "ABC Financial Advisors",
  "firmRegistrationNumber": "E123456",
  "experience": 10,
  "clientCount": 150,
  "aum": 50000000,
  "specializations": ["Mutual Funds", "Insurance", "Tax Planning"],
  "languages": ["English", "Hindi"],
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "contactInfo": {
    "businessPhone": "+919876543210",
    "businessEmail": "advisor@abcfinancial.in",
    "website": "https://abcfinancial.in"
  }
}
```

---

## 🚦 Quick Status Check

### Check if everything is running:
```bash
# Check dev server
curl http://localhost:3000/api/health

# Check pages load
curl -I http://localhost:3000
curl -I http://localhost:3000/admin
curl -I http://localhost:3000/advisor/dashboard

# Check test results
ls -la test-results/
ls -la screenshots/
```

---

## 📱 Mobile Testing on Actual Device

### Using ngrok for mobile testing:
```bash
# Install ngrok
brew install ngrok

# Expose localhost
ngrok http 3000

# Use the provided URL on your mobile device
# Example: https://abc123.ngrok.io
```

---

## 🎯 Testing Priorities

### High Priority (Test First)
1. Authentication flow (sign up → verify → login)
2. Profile completion
3. Mobile responsiveness
4. SEBI compliance validation

### Medium Priority
1. Content generation
2. WhatsApp preview
3. Language switching
4. Branding customization

### Low Priority
1. Analytics displays
2. Keyboard shortcuts
3. Print styles
4. Browser compatibility

---

## 📞 Support

If you encounter issues during testing:
1. Check the console for errors (F12 → Console)
2. Review network requests (F12 → Network)
3. Check test output logs
4. Verify all services are running

Happy Testing! 🚀