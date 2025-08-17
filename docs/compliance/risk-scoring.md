# SEBI Compliance Risk Scoring System 🛡️

## Overview
Comprehensive risk scoring methodology for financial content compliance, implementing SEBI Advertisement Code 2024 with uniform application across all advisor tiers.

## Risk Score Calculation Framework

### Base Scoring Model
```yaml
risk_thresholds:
  GREEN: 0-39     # Compliant - Auto-approve
  AMBER: 40-69    # Review Required - Manual review
  RED: 70-100     # Non-compliant - Auto-reject
```

### Weight Factor Distribution
```yaml
weight_factors:
  critical_violations: 40      # Forbidden terms, missing disclaimers
  performance_implications: 30 # Past performance claims, guarantees
  missing_mandatory: 20        # Required elements, identity footer
  tone_issues: 10             # Promotional language, urgency creation
```

## Detailed Scoring Matrix

### Critical Violations (Weight: 40)

#### Forbidden Terms (Score: 35-40 each)
| Violation Type | Score | Examples |
|----------------|-------|----------|
| Guarantee Language | 40 | "guaranteed returns", "sure-shot", "risk-free" |
| Performance Promises | 40 | "double your money", "assured profits" |
| Superlative Claims | 35 | "best scheme", "number one fund" |
| Market Timing Claims | 35 | "perfect time to invest", "ideal opportunity" |

#### Language-Specific Violations
```yaml
hindi_violations:
  - pattern: "गारंटीड रिटर्न"
    score: 40
    english_equivalent: "guaranteed returns"
  
  - pattern: "पक्का फायदा" 
    score: 40
    english_equivalent: "sure profit"
  
  - pattern: "जोखिम मुक्त"
    score: 40
    english_equivalent: "risk-free"

marathi_violations:
  - pattern: "निश्चित नफा"
    score: 40
    english_equivalent: "guaranteed profit"
  
  - pattern: "धोका नसलेला"
    score: 35
    english_equivalent: "no risk"
```

### Performance Implications (Weight: 30)

#### Past Performance as Predictor (Score: 25-30)
| Pattern Type | Score | Risk Rationale |
|--------------|-------|----------------|
| Historical Claims | 30 | "Fund has given 15% returns for 5 years" |
| Track Record Emphasis | 25 | "Consistent outperformance since 2020" |
| Comparative Performance | 25 | "Better than market returns" |
| Cherry-picked Data | 30 | "Best performing fund in category" |

#### Forward-Looking Statements (Score: 20-25)
```yaml
forward_looking_patterns:
  projection_language:
    - pattern: "expected to deliver"
      score: 25
      context: "Performance projection without disclaimers"
    
    - pattern: "will provide returns"
      score: 30
      context: "Definitive future performance claim"
  
  growth_predictions:
    - pattern: "anticipated growth of"
      score: 20
      context: "Growth projection - acceptable with disclaimers"
    
    - pattern: "certain to appreciate"
      score: 30
      context: "Certainty about future performance"
```

### Missing Mandatory Elements (Weight: 20)

#### Disclaimer Requirements (Score: 15-25)
| Missing Element | Score | Advisor Type | Requirement |
|-----------------|-------|--------------|-------------|
| MF Risk Disclaimer | 25 | MFD | "Mutual fund investments are subject to market risks..." |
| Educational Disclaimer | 20 | RIA | "Educational only. No investment advice." |
| Scheme Document Reference | 15 | MFD | "Read all scheme related documents carefully" |
| Risk Warning | 15 | Both | General market risk acknowledgment |

#### Identity Footer Validation (Score: 20-25)
```yaml
identity_requirements:
  RIA_footer:
    pattern: "{{advisor_name}}, SEBI RIA {{registration_number}} — Educational only"
    missing_score: 25
    malformed_score: 15
  
  MFD_footer:
    pattern: "{{advisor_name}}, ARN {{arn_number}} — [Risk disclaimer]"
    missing_score: 25
    malformed_score: 15
```

### Tone and Presentation Issues (Weight: 10)

#### Promotional Language (Score: 5-15)
| Tone Issue | Score | Pattern Examples |
|------------|-------|------------------|
| Urgency Creation | 15 | "Limited time offer", "Act now" |
| Emotional Manipulation | 10 | "Amazing opportunity", "Secret formula" |
| Sales Pressure | 10 | "Call immediately", "Don't miss out" |
| Excessive Enthusiasm | 5 | "Incredible returns!", multiple exclamation marks |

#### Format and Presentation (Score: 5-10)
```yaml
format_violations:
  excessive_caps:
    threshold: 4_consecutive_words
    score: 5
    example: "BEST INVESTMENT OPPORTUNITY AVAILABLE"
  
  emoji_overuse:
    threshold: 4_emojis
    score: 5
    impact: "Reduces professional credibility"
  
  hashtag_spam:
    threshold: 3_hashtags
    score: 5
    example: "#investment #returns #wealth #money"
```

## Risk Score Aggregation Logic

### Base Calculation
```javascript
function calculateRiskScore(violations) {
  let totalScore = 0;
  
  // Critical Violations (Max 40 per violation, cap at 80)
  const criticalScore = Math.min(
    violations.critical.reduce((sum, v) => sum + v.score, 0),
    80
  );
  
  // Performance Implications (Max 30 per violation, cap at 60)
  const performanceScore = Math.min(
    violations.performance.reduce((sum, v) => sum + v.score, 0),
    60
  );
  
  // Missing Mandatory (Max 25 per violation, cap at 45)
  const mandatoryScore = Math.min(
    violations.mandatory.reduce((sum, v) => sum + v.score, 0),
    45
  );
  
  // Tone Issues (Max 15 per violation, cap at 25)
  const toneScore = Math.min(
    violations.tone.reduce((sum, v) => sum + v.score, 0),
    25
  );
  
  return Math.min(criticalScore + performanceScore + mandatoryScore + toneScore, 100);
}
```

### Context-Aware Adjustments

#### Content Type Modifiers
```yaml
content_type_modifiers:
  market_update:
    base_tolerance: +5
    rationale: "Educational market information"
  
  scheme_announcement:
    base_tolerance: 0
    rationale: "Promotional content requires strict compliance"
  
  risk_education:
    base_tolerance: +10
    rationale: "Risk education content naturally compliant"
  
  performance_report:
    base_tolerance: -5
    rationale: "Performance data requires extra caution"
```

#### Advisor Experience Modifiers
```yaml
experience_modifiers:
  new_advisor:
    # <6 months experience
    adjustment: 0
    rationale: "No leniency for new advisors - learning period"
  
  experienced_advisor:
    # >2 years, good compliance record
    adjustment: 0
    rationale: "No advisor-specific leniency per policy.yaml"
  
  compliance_history:
    good_record: 0
    violation_history: +5  # Stricter scoring for repeat offenders
```

## AI-Enhanced Risk Assessment

### Stage 2 AI Evaluation Integration
```yaml
ai_enhancement_factors:
  nuanced_tone_analysis:
    weight: 15
    description: "GPT-4o-mini semantic analysis for subtle implications"
  
  cultural_sensitivity:
    weight: 10
    description: "Indian market cultural appropriateness"
  
  bias_detection:
    weight: 5
    description: "Gender, age, socioeconomic bias identification"
  
  context_understanding:
    weight: 10
    description: "Contextual interpretation of potentially problematic phrases"
```

### AI Risk Scoring Prompt Template
```
Analyze the following financial advisory content for SEBI compliance risk:

Content: "{content}"
Advisor Type: {advisor_type}
Language: {detected_language}

Evaluate for:
1. Subtle performance implications (0-30 points)
2. Tone appropriateness for financial advice (0-15 points)  
3. Cultural sensitivity for Indian market (0-10 points)
4. Potential investor misleading factors (0-20 points)

Provide structured JSON response with reasoning.
```

## Risk Score Communication

### Client-Facing Risk Messages
```yaml
risk_messaging:
  GREEN (0-39):
    message: "Content approved - complies with SEBI guidelines"
    color: "#10B981"
    action: "auto_approve"
  
  AMBER (40-69):
    message: "Review required - potential compliance concerns identified"
    color: "#F59E0B" 
    action: "manual_review"
    guidance: "Address highlighted issues for faster approval"
  
  RED (70-100):
    message: "Content rejected - significant compliance violations"
    color: "#EF4444"
    action: "auto_reject"
    guidance: "Major revision required before resubmission"
```

### Detailed Violation Feedback
```yaml
violation_explanations:
  FORBIDDEN_TERM:
    template: "'{term}' violates SEBI guidelines prohibiting guarantee language"
    remediation: "Replace with conditional language like 'potential for' or 'may provide'"
  
  MISSING_DISCLAIMER:
    template: "Required {disclaimer_type} disclaimer missing"
    remediation: "Add mandatory disclaimer: '{required_text}'"
  
  PERFORMANCE_IMPLICATION:
    template: "Content implies future performance based on past results"
    remediation: "Add disclaimer that past performance doesn't guarantee future results"
```

## Audit and Monitoring

### Risk Score Analytics
```yaml
monitoring_metrics:
  daily_risk_distribution:
    - green_percentage
    - amber_percentage  
    - red_percentage
    - average_risk_score
  
  advisor_compliance_trends:
    - improvement_rate
    - violation_patterns
    - repeat_offender_identification
  
  content_category_analysis:
    - highest_risk_content_types
    - common_violation_patterns
    - seasonal_compliance_trends
```

### Regulatory Reporting
- Weekly risk score distribution reports
- Monthly violation pattern analysis
- Quarterly compliance improvement metrics
- Annual regulatory compliance audit trail

## Performance Optimization

### Caching Strategy
- Pre-calculated scores for common violation patterns
- Language-specific regex compilation caching
- AI model response caching for similar content

### Scalability Considerations
- Batch risk scoring for high-volume periods
- Parallel processing for multi-language content
- Real-time risk score updates with WebSocket integration

## Compliance Validation Testing
- Automated testing with known compliant/non-compliant content
- A/B testing of risk threshold adjustments
- Regular calibration with SEBI guideline updates
- Cross-validation with manual compliance expert reviews