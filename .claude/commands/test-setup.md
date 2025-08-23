# Test Setup Command

## Description
Validates the Playwright MCP setup and runs a comprehensive test of the visual testing infrastructure for Jarvish development.

## Usage
```
/test-setup [component]
```

**Parameters:**
- `component` (optional): specific|full|demo (default: demo)

## What it does
1. Validates Playwright MCP server installation
2. Tests browser launch and navigation
3. Verifies screenshot capture functionality
4. Validates SEBI compliance checking
5. Tests responsive design workflows
6. Generates sample report

## Implementation

This command will:

### 1. Environment Validation
```bash
# Check if Playwright is installed
npx playwright --version

# Check if browsers are installed
npx playwright install --dry-run

# Validate MCP server
node .claude/playwright-mcp-server.js --version
```

### 2. Basic Functionality Test
```bash
# Test screenshot capture
node .claude/playwright-mcp-server.js screenshot http://localhost:3000

# Test responsive design
node .claude/playwright-mcp-server.js responsive-test http://localhost:3000

# Test SEBI compliance
node .claude/playwright-mcp-server.js compliance-check http://localhost:3000
```

### 3. Agent Integration Test
```bash
# Test design review agent
@agent playwright-design-reviewer "Please test the current development setup"
```

### 4. Command Validation
```bash
# Test visual test command
/visual-test dashboard all

# Test mobile test command  
/mobile-test iphone content
```

## Sample Output

### Success Scenario
```
🧪 Testing Playwright MCP Setup for Jarvish...

✅ Environment Validation:
   - Playwright installed: v1.40.0
   - Browsers available: Chromium, Firefox, WebKit
   - MCP server ready: Custom Jarvish integration
   - Screenshots directory: ./temp/screenshots/

✅ Basic Functionality:
   - Browser launch: SUCCESS
   - Navigation: SUCCESS (http://localhost:3000)
   - Screenshot capture: SUCCESS (demo-screenshot.png)
   - Console monitoring: ACTIVE
   - Network tracking: ACTIVE

✅ SEBI Compliance Testing:
   - Disclaimer detection: WORKING
   - EUIN verification: WORKING  
   - Risk warning check: WORKING
   - Contact info validation: WORKING

✅ Responsive Design Testing:
   - Mobile viewport (375x667): SUCCESS
   - Tablet viewport (768x1024): SUCCESS
   - Desktop viewport (1920x1080): SUCCESS
   - Screenshots captured: 3

✅ Agent Integration:
   - Design review agent: READY
   - Playwright MCP connection: ESTABLISHED
   - Command execution: FUNCTIONAL

🎉 Playwright MCP Setup Complete!

📋 Next Steps:
   1. Start your development server (npm run dev)
   2. Use /visual-test to test specific pages
   3. Use @agent playwright-design-reviewer for comprehensive reviews
   4. Use /mobile-test for mobile-specific validation
```

### Error Scenarios
```
❌ Setup Issues Detected:

🔧 Playwright Installation:
   - Status: MISSING
   - Fix: npm install playwright && npx playwright install

🔧 Development Server:
   - Status: NOT RUNNING  
   - Fix: npm run dev (in project-one/apps/web/)

🔧 MCP Configuration:
   - Status: INVALID PATH
   - Fix: Update claude_desktop_config.json paths

🔧 Permissions:
   - Status: MISSING WRITE ACCESS
   - Fix: chmod +x .claude/playwright-mcp-server.js
```

## Troubleshooting Guide

### Common Issues

**1. Browser Launch Fails**
```bash
# Install browsers
npx playwright install

# Check permissions
chmod +x .claude/playwright-mcp-server.js

# Test manually
node .claude/playwright-mcp-server.js screenshot
```

**2. MCP Connection Issues**
```json
// Check claude_desktop_config.json
{
  "mcpServers": {
    "playwright-jarvish": {
      "command": "node",
      "args": ["/absolute/path/to/.claude/playwright-mcp-server.js"]
    }
  }
}
```

**3. Screenshot Directory Missing**
```bash
# Create directory
mkdir -p ./temp/screenshots

# Set permissions
chmod 755 ./temp/screenshots
```

**4. Development Server Not Running**
```bash
# Start Jarvish development servers
cd project-one/apps/web
npm run dev

# Verify it's running
curl http://localhost:3000
```

## Validation Checklist

### ✅ Basic Setup
- [ ] Playwright package installed
- [ ] Browsers downloaded and available
- [ ] MCP server executable and functional
- [ ] Screenshot directory exists and writable
- [ ] Claude Code can access MCP tools

### ✅ Core Functionality  
- [ ] Browser launches successfully
- [ ] Can navigate to local development server
- [ ] Screenshots captured and saved
- [ ] Console logs monitored
- [ ] Network requests tracked

### ✅ Jarvish-Specific Features
- [ ] SEBI compliance checking works
- [ ] Responsive design testing functional
- [ ] Financial services UI validation
- [ ] Hindi/English content detection
- [ ] Mobile-first testing workflows

### ✅ Integration Points
- [ ] Design review agent accessible
- [ ] Slash commands functional
- [ ] Visual testing workflows active
- [ ] Mobile testing capabilities working
- [ ] Comprehensive reporting available

## Example Workflows

### Quick UI Validation
```bash
# 1. Make UI changes
# 2. Test immediately
/visual-test current-page desktop

# 3. Check mobile compatibility  
/mobile-test iphone content

# 4. Review results
cat ./temp/screenshots/latest-report.json
```

### Comprehensive Review
```bash
# 1. Complete design review
@agent playwright-design-reviewer "Review latest changes for SEBI compliance and mobile responsiveness"

# 2. Full responsive testing
/design-review full --detailed

# 3. Generate final report
# (automatic via agent)
```

### Pre-commit Validation
```bash
# 1. Test changed components
/test-setup specific

# 2. Validate critical flows
/visual-test dashboard all
/mobile-test all content

# 3. Compliance check
/design-review pr
```

## Success Metrics

The setup is considered successful when:
- All commands execute without errors
- Screenshots are captured and saved
- SEBI compliance checks return valid results
- Responsive testing covers all viewports
- Agents can successfully use Playwright tools
- Integration with development workflow is seamless

## File Structure After Setup

```
Jarvish/
├── .claude/
│   ├── claude.md (configuration)
│   ├── claude_desktop_config.json (MCP setup)
│   ├── playwright-mcp-server.js (custom MCP)
│   ├── agents/
│   │   └── playwright-design-reviewer.md
│   └── commands/
│       ├── visual-test.md
│       ├── design-review.md
│       ├── mobile-test.md
│       └── test-setup.md
├── temp/
│   └── screenshots/ (auto-created)
└── node_modules/
    └── playwright/ (installed)
```

This setup provides the foundation for the advanced visual testing workflows described in the YouTube video, specifically tailored for Jarvish's financial services compliance requirements.