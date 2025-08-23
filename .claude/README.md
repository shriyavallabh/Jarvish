# Jarvish Playwright MCP Integration

> **Advanced Visual Testing & Design Automation for Financial Services**

This directory contains the complete Playwright MCP (Model Context Protocol) integration for the Jarvish platform, enabling AI-powered visual design iteration, SEBI compliance validation, and automated UI testing.

## 🎯 Overview

Based on advanced workflows from the Claude Code community, this integration gives AI "eyes" to see and iterate on designs, enabling:
- **Visual Design Iteration**: AI can capture screenshots and self-correct designs
- **SEBI Compliance Automation**: Automated checking of financial regulatory requirements
- **Mobile-First Testing**: Comprehensive responsive design validation
- **Professional Financial UI**: Trust-building visual elements for Indian advisors

## 🚀 Quick Start

### 1. Installation Complete ✅
- Playwright package installed and browsers configured
- Custom MCP server ready for Jarvish financial services
- Screenshot directories and permissions set up

### 2. Available Commands

```bash
# Quick visual testing
/visual-test [page] [viewport]

# Comprehensive design review  
/design-review [scope] [--detailed]

# Mobile-specific testing
/mobile-test [device] [journey]

# Setup validation
/test-setup [component]
```

### 3. Agent Integration

```bash
# Invoke the design review agent
@agent playwright-design-reviewer [request]
```

## 📁 File Structure

```
.claude/
├── claude.md                    # Main configuration & context
├── claude_desktop_config.json   # MCP server configuration
├── playwright-mcp-server.js     # Custom Playwright server
├── agents/
│   └── playwright-design-reviewer.md  # Visual design review agent
└── commands/
    ├── visual-test.md           # Quick UI testing
    ├── design-review.md         # Comprehensive review
    ├── mobile-test.md           # Mobile-specific testing
    └── test-setup.md            # Setup validation
```

## 🎨 Key Features

### Visual Design Iteration
- **Screenshot Automation**: Multi-viewport capture (mobile/tablet/desktop)
- **Real-time Feedback**: Console error monitoring and performance tracking
- **Design Comparison**: Before/after visual validation
- **Professional Standards**: Financial services aesthetic enforcement

### SEBI Compliance Testing
- **Required Disclaimers**: "Mutual Fund investments are subject to market risks"
- **EUIN Verification**: Automatic detection of registration numbers
- **Risk Warnings**: Validation of regulatory text visibility
- **Contact Information**: SEBI-registered detail verification

### Mobile-First Validation
- **Indian Advisor Focus**: Optimized for 80% mobile usage patterns
- **Touch Target Testing**: 44px minimum interactive elements
- **Network Optimization**: 3G performance validation
- **Bilingual Support**: Hindi/English content rendering

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS measurement
- **AI Cost Tracking**: Content generation expense monitoring
- **WhatsApp Integration**: API failure detection and handling
- **Accessibility Audits**: WCAG 2.1 AA compliance checking

## 🔧 Configuration

### MCP Server Setup
The custom Playwright server (`playwright-mcp-server.js`) provides:
- Browser automation with financial services context
- SEBI compliance checking algorithms
- Responsive design testing workflows
- Screenshot management and reporting

### Agent Configuration
The design review agent (`playwright-design-reviewer.md`) offers:
- Expert financial services UI knowledge
- SEBI regulatory compliance expertise
- Indian market context and cultural sensitivity
- Professional trust-building design principles

## 🏆 Workflow Examples

### Quick Design Check
```typescript
// 1. Make UI changes to advisor dashboard
// 2. Run quick validation
/visual-test dashboard mobile

// 3. Check results
// Screenshots saved to temp/screenshots/
// Console output shows pass/fail status
```

### Comprehensive Review  
```typescript
// 1. Complete feature development
// 2. Run full design review
@agent playwright-design-reviewer "Review the new content generation flow"

// 3. Receive detailed report
// - Executive summary with A-F grade
// - Critical issues list with screenshots
// - SEBI compliance status
// - Mobile responsiveness validation
// - Performance recommendations
```

### Mobile Testing Workflow
```typescript
// 1. Test advisor mobile workflow
/mobile-test iphone content

// 2. Validate touch interface
// - 44px minimum touch targets
// - Thumb-friendly navigation
// - Portrait/landscape optimization
// - 3G network simulation
```

## 📊 Quality Standards

### Design Grades
- **Grade A (95-100%)**: Production ready, exceeds financial standards
- **Grade B (85-94%)**: Minor improvements, generally solid
- **Grade C (75-84%)**: Moderate issues, focused improvements needed
- **Grade D (65-74%)**: Significant issues, substantial work required  
- **Grade F (<65%)**: Not acceptable, major redesign needed

### Compliance Requirements
- ✅ All SEBI disclaimers visible and readable
- ✅ EUIN registration prominently displayed
- ✅ Risk warnings not truncated on any viewport
- ✅ Professional financial services aesthetic maintained
- ✅ Mobile performance optimized for Indian networks

## 🚨 Critical Validations

### Never Allow
- Missing SEBI compliance disclaimers
- Console errors or JavaScript failures
- Mobile touch targets smaller than 44px
- Unprofessional visual elements
- Performance issues on 3G networks
- Accessibility violations (WCAG 2.1 AA)

### Always Validate
- Cross-viewport responsiveness (375px to 1920px)
- SEBI compliance text visibility and readability
- Professional financial services branding consistency
- AI cost implications of new features
- WhatsApp integration error handling
- Hindi/English bilingual content support

## 🔗 Integration Points

### Development Workflow
- **Pre-commit**: Automated visual validation
- **Pull Requests**: Comprehensive design review
- **Deployment**: Production readiness confirmation
- **Monitoring**: Ongoing compliance verification

### Claude Code Integration
- **Visual Memory**: Screenshots provide design context
- **Iterative Loops**: AI can see and improve designs
- **Professional Standards**: Financial services expertise
- **Regulatory Compliance**: Automated SEBI checking

## 🎥 Inspired by Advanced Workflows

This implementation is based on cutting-edge Claude Code workflows that:
- Give AI visual capabilities through Playwright screenshots
- Enable iterative design improvement loops
- Provide validation against specifications (SEBI compliance)
- Support professional financial services standards
- Optimize for Indian market conditions

## 🛠 Troubleshooting

### Common Issues
```bash
# Browser launch fails
npx playwright install

# MCP connection issues  
# Check claude_desktop_config.json paths

# Screenshot permissions
chmod 755 temp/screenshots

# Development server not running
cd project-one/apps/web && npm run dev
```

### Support
- Review setup with `/test-setup`
- Validate environment with `/visual-test`
- Check agent integration with `@agent playwright-design-reviewer`

## 🎯 Success Metrics

Setup is successful when:
- ✅ All commands execute without errors
- ✅ Screenshots captured across all viewports
- ✅ SEBI compliance checks return valid results
- ✅ Mobile testing covers advisor workflows
- ✅ Design review agent provides actionable feedback
- ✅ Integration with development workflow is seamless

---

**Ready to build world-class financial services UI with AI-powered visual validation!** 🚀

*This integration enables the advanced design iteration workflows that give Jarvish a competitive edge in delivering professional, compliant, and mobile-optimized financial advisory tools.*