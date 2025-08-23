# Design Review Command

## Description
Initiates a comprehensive design review using the Playwright Design Review Agent for thorough UI/UX validation.

## Usage
```
/design-review [scope] [--detailed]
```

**Parameters:**
- `scope` (optional): specific|full|pr|component (default: specific)
- `--detailed`: Include detailed performance and accessibility analysis

## Scope Options

### `specific`
Reviews current working changes only
- Analyzes git diff for changed files
- Tests only affected pages/components
- Quick turnaround (5-10 minutes)

### `full` 
Complete platform review
- Tests all major user journeys
- Comprehensive compliance audit
- Full responsive testing
- Extended analysis (20-30 minutes)

### `pr`
Pull request focused review
- Reviews all files in current PR
- Validates against acceptance criteria
- Includes before/after comparisons
- Suitable for pre-merge validation

### `component`
Single component deep dive
- Isolated component testing
- Storybook integration if available
- Accessibility focused analysis
- Design system compliance check

## What it does

1. **Launches Design Review Agent**
   - Invokes the `@agent playwright-design-reviewer`
   - Provides current context and scope
   - Sets up proper testing environment

2. **Automated Testing Workflow**
   - Browser automation with Playwright
   - Multi-viewport screenshot capture
   - Console error monitoring
   - Performance metrics collection

3. **SEBI Compliance Validation**
   - Required disclaimer verification
   - EUIN display checking
   - Risk warning validation
   - Data privacy compliance

4. **Professional Design Assessment**
   - Brand guideline adherence
   - Financial services aesthetic
   - Indian market appropriateness
   - Trust-building elements

5. **Comprehensive Reporting**
   - Detailed findings report
   - Prioritized issue list
   - Visual evidence with screenshots
   - Actionable recommendations

## Examples

```bash
# Quick review of current changes
/design-review specific

# Full platform audit before release
/design-review full --detailed

# Pre-merge PR validation
/design-review pr

# Component-focused analysis
/design-review component --detailed
```

## Implementation Flow

```mermaid
graph TD
    A[/design-review command] --> B[Parse scope & options]
    B --> C[Launch Playwright Design Review Agent]
    C --> D[Setup browser & viewport]
    D --> E[Navigate & capture screenshots]
    E --> F[Run compliance checks]
    F --> G[Analyze performance metrics]
    G --> H[Generate comprehensive report]
    H --> I[Provide actionable recommendations]
```

## Agent Integration

The command automatically:

1. **Provides Context**
   ```typescript
   const context = {
     scope: scope,
     projectType: 'financial-services-platform',
     compliance: 'SEBI-required',
     target: 'indian-financial-advisors',
     priority: 'professional-trust-building'
   };
   ```

2. **Sets Testing Parameters**
   ```typescript
   const testConfig = {
     viewports: ['mobile', 'tablet', 'desktop'],
     browsers: ['chromium'],
     compliance: ['SEBI', 'DPDP', 'accessibility'],
     performance: detailed ? 'comprehensive' : 'standard'
   };
   ```

3. **Defines Success Criteria**
   ```typescript
   const criteria = {
     minGrade: 'B',
     maxConsoleErrors: 0,
     requiredCompliance: ['disclaimer', 'EUIN', 'risk-warning'],
     performanceThresholds: {
       LCP: 2.5,
       FID: 100,
       CLS: 0.1
     }
   };
   ```

## Expected Output

### Console Output
```
🎨 Starting Jarvish Design Review...
📊 Scope: specific changes
🔍 Agent: Playwright Design Review Agent
📱 Testing viewports: mobile, tablet, desktop
⚖️ Compliance check: SEBI + DPDP Act
🚀 Launching browser automation...

✅ Screenshots captured: 12
✅ Console errors: 0
✅ SEBI compliance: PASS
✅ Performance metrics: GOOD
✅ Accessibility score: 94/100

📋 Review Report Generated
🎯 Overall Grade: A-
📁 Report saved to: ./temp/design-review-[timestamp].md
```

### Generated Report
- Executive summary with letter grade
- Critical issues requiring immediate attention
- High/medium priority improvements
- SEBI compliance checklist
- Performance benchmarks
- Visual evidence (screenshots)
- Specific code recommendations

## Quality Gates

The review enforces these quality standards:
- **Grade A**: Production ready, exceeds standards
- **Grade B**: Minor improvements, generally solid
- **Grade C**: Moderate issues, focused improvements needed
- **Grade D**: Significant issues, substantial work required
- **Grade F**: Not acceptable, major redesign needed

## Integration Points

### Git Hooks
Can be integrated with pre-commit hooks:
```bash
# .git/hooks/pre-commit
#!/bin/sh
if git diff --cached --name-only | grep -E '\.(tsx?|jsx?)$'; then
  echo "Running design review on changed components..."
  claude-code "/design-review specific"
fi
```

### CI/CD Pipeline
Suitable for automated testing:
```yaml
# .github/workflows/design-review.yml
- name: Run Design Review
  run: |
    claude-code "/design-review pr --detailed"
    if [ $? -ne 0 ]; then
      echo "Design review failed - blocking merge"
      exit 1
    fi
```

### Development Workflow
Recommended usage:
1. **During Development**: `/design-review specific` for quick checks
2. **Before PR**: `/design-review pr` for comprehensive validation
3. **Before Release**: `/design-review full --detailed` for complete audit
4. **Component Updates**: `/design-review component` for focused analysis

## Configuration

The command respects settings in `.claude/claude.md`:
- Design principles and guidelines
- SEBI compliance requirements
- Performance benchmarks
- Brand and accessibility standards

## Troubleshooting

Common issues and solutions:
- **Browser launch fails**: Check Playwright installation
- **Screenshots missing**: Verify write permissions in temp/
- **Compliance checks fail**: Update SEBI disclaimer text
- **Performance issues**: Check network connectivity and server status