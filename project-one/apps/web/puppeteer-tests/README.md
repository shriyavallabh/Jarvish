# Puppeteer Automated Testing Suite

## Overview

This comprehensive Puppeteer testing suite is designed to automatically identify and report UI/UX issues in the Next.js financial advisory platform. It performs deep analysis of accessibility, visual design, performance, and user experience.

## Features

### 1. Accessibility Testing
- **WCAG Compliance**: Tests against WCAG 2.1 AA standards
- **Axe-core Integration**: Uses industry-standard accessibility testing
- **Screen Reader Compatibility**: Validates semantic HTML and ARIA attributes
- **Keyboard Navigation**: Ensures all interactive elements are keyboard accessible

### 2. Color Contrast Analysis
- **Dark-on-Dark Detection**: Identifies text that's too dark on dark backgrounds
- **Light-on-Light Detection**: Finds text that's too light on light backgrounds
- **WCAG Contrast Ratios**: Validates minimum contrast requirements (4.5:1 for normal text, 3:1 for large text)
- **Real-time Background Resolution**: Accurately determines actual background colors

### 3. Visual Regression Testing
- **Baseline Comparison**: Compares current screenshots with baseline images
- **Responsive Testing**: Tests across mobile, tablet, and desktop viewports
- **Layout Issue Detection**: Identifies overlapping elements, overflow, and broken layouts
- **Pixel-Perfect Comparison**: Uses pixelmatch for precise visual comparison

### 4. Performance Testing
- **Lighthouse Integration**: Full Lighthouse audits for performance, SEO, and best practices
- **Core Web Vitals**: Measures LCP, FID, and CLS
- **Bundle Size Analysis**: Tracks JavaScript and CSS bundle sizes
- **Memory Leak Detection**: Monitors memory usage during interactions

### 5. Specific Issue Detection

The suite specifically looks for the issues you mentioned:
- **Header Visibility Problems**: Transparent backgrounds, invisible text
- **"Skip to main content" Issues**: Inappropriate visibility of skip links
- **Typography Problems**: Poor font sizes, line heights, and weights
- **Spacing Issues**: Missing padding, inconsistent margins
- **Design Quality**: Validates against expected design patterns

## Installation

```bash
# Install dependencies (already done)
npm install

# Verify installation
npm run test:puppeteer -- --version
```

## Usage

### Quick Start - Run Comprehensive Test

```bash
# Run the comprehensive test suite
cd puppeteer-tests
npx ts-node run-comprehensive-test.ts

# Or from the web directory
npm run test:puppeteer
```

### Individual Test Commands

```bash
# Run all Puppeteer tests
npm run test:puppeteer

# Run tests with visible browser (headed mode)
npm run test:puppeteer:headed

# Debug mode with DevTools
npm run test:puppeteer:debug

# Update visual regression baselines
npm run test:puppeteer:update-baseline

# Run only accessibility tests
npm run test:a11y

# Run only visual regression tests
npm run test:visual

# Run only performance tests
npm run test:perf
```

### Environment Variables

```bash
# Run in headed mode
HEADLESS=false npm run test:puppeteer

# Enable DevTools
DEVTOOLS=true npm run test:puppeteer

# Update visual baselines
UPDATE_BASELINE=true npm run test:visual

# Slow down execution (milliseconds)
SLOWMO=250 npm run test:puppeteer:headed
```

## Test Structure

```
puppeteer-tests/
├── core/                      # Core testing modules
│   ├── accessibility-tester.ts   # Accessibility testing engine
│   └── visual-regression-tester.ts # Visual comparison engine
├── tests/                     # Test suites
│   ├── platform-ui.test.ts      # Main UI tests
│   └── performance.test.ts      # Performance tests
├── reporters/                 # Custom reporters
│   └── accessibility-reporter.js # HTML/JSON report generator
├── reports/                   # Generated reports (gitignored)
├── screenshots/              # Test screenshots (gitignored)
├── visual-regression/        # Visual regression files
│   ├── baseline/            # Baseline images
│   ├── current/            # Current test images
│   └── diff/              # Difference images
└── run-comprehensive-test.ts # Main test runner

```

## Reports

### Generated Reports

After running tests, you'll find detailed reports in the `reports/` directory:

1. **HTML Reports**: Visual, interactive reports viewable in browser
2. **JSON Reports**: Detailed machine-readable results
3. **Accessibility Reports**: Specific WCAG violation details
4. **Visual Reports**: Side-by-side visual comparisons

### Report Locations

- `reports/comprehensive-report-*.json` - Full test results
- `reports/summary-*.html` - Executive summary
- `reports/accessibility-report.html` - Detailed accessibility findings
- `reports/lighthouse-*.html` - Lighthouse audit results
- `visual-regression/diff/visual-report.html` - Visual regression report

## Common Issues Detected

### 1. Header Section Visibility
- Transparent or missing backgrounds
- Text color matching background color
- Zero-height headers
- Missing navigation elements

### 2. Skip Links
- Visible when should be hidden
- Orphaned "Skip to main content" text
- Incorrect positioning
- Missing focus states

### 3. Color Contrast
- Dark text on dark backgrounds
- Light text on light backgrounds
- Insufficient contrast ratios
- Transparent background inheritance issues

### 4. Typography
- Font sizes below 12px
- Line heights below 1.4 for body text
- Weak heading font weights
- Inconsistent letter spacing

### 5. Spacing & Layout
- Missing padding on content containers
- Asymmetric padding
- Horizontal overflow on mobile
- Overlapping elements
- Broken flexbox/grid layouts

## Fixing Common Issues

### Fix Header Visibility
```css
header {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  min-height: 60px;
}

header a, header button {
  color: #333333;
  /* Ensure contrast ratio > 4.5:1 */
}
```

### Fix Skip Links
```css
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 999;
}

.skip-link:focus {
  position: fixed;
  top: 0;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
}
```

### Fix Color Contrast
```css
/* Ensure proper contrast */
.text-primary {
  color: #1a1a1a; /* Dark text */
  background-color: #ffffff; /* Light background */
}

.text-inverse {
  color: #ffffff; /* Light text */
  background-color: #1a1a1a; /* Dark background */
}
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Puppeteer Tests
  run: |
    npm ci
    npm run build
    npm run test:puppeteer
  
- name: Upload Test Reports
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: puppeteer-tests/reports/
```

## Troubleshooting

### Tests Timing Out
- Increase timeout: `jest.setTimeout(60000)`
- Check if dev server is running: `npm run dev`
- Verify network connectivity

### Visual Regression Failures
- Update baselines: `npm run test:puppeteer:update-baseline`
- Check diff images in `visual-regression/diff/`
- Ensure consistent viewport sizes

### Accessibility False Positives
- Review specific WCAG criteria
- Check for dynamic content loading
- Validate against manual testing

## Best Practices

1. **Run tests regularly**: Before each commit or PR
2. **Review all reports**: Don't just check pass/fail
3. **Update baselines carefully**: Only when intentional changes are made
4. **Test multiple viewports**: Mobile-first is crucial
5. **Combine with manual testing**: Automated tests catch ~50% of issues

## Support

For issues or questions:
1. Check the generated reports for detailed error information
2. Review screenshots in the `screenshots/` directory
3. Enable debug mode for step-by-step execution
4. Check the comprehensive test output for specific issue details

## Next Steps

1. Run the comprehensive test: `npx ts-node puppeteer-tests/run-comprehensive-test.ts`
2. Review the generated HTML report
3. Fix identified issues based on severity
4. Re-run tests to verify fixes
5. Integrate into CI/CD pipeline