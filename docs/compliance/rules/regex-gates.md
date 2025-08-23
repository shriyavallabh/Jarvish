# SEBI Compliance Regex Gates 🛡️

## Overview
Hard validation rules for Stage 1 compliance checking, implementing SEBI Advertisement Code 2024 requirements through regular expressions and pattern matching.

## Forbidden Terms Detection

### Critical Violations (Risk Score: +40)
```javascript
const FORBIDDEN_TERMS_REGEX = {
  // Performance Guarantees
  guaranteed: /\b(guaranteed?|guarantee[sd]?)\b/gi,
  sureShot: /\b(sure.?shot|sureshot)\b/gi,
  riskFree: /\b(risk.?free|riskfree|no.?risk|zero.?risk)\b/gi,
  
  // Return Promises
  assuredReturns: /\b(assured|confirmed|definite|certain).{0,10}(returns?|profits?|gains?)\b/gi,
  doubleYourMoney: /\b(double|triple|multiply).{0,15}(money|investment|capital)\b/gi,
  multibagger: /\b(multi.?bagger|multibagger)\b/gi,
  
  // Performance Claims
  definiteProfits: /\b(definite|certain|sure).{0,10}(profit|returns?|gains?)\b/gi,
  noLoss: /\b(no.?loss|zero.?loss|loss.?proof)\b/gi
};
```

### Performance Implication Patterns (Risk Score: +30)
```javascript
const PERFORMANCE_PATTERNS = {
  // Past Performance as Future Indicator
  pastAsPredictor: /\b(has|had|previously).{0,20}(given|delivered|provided).{0,15}(\d+%|\d+x|returns?)\b/gi,
  
  // Market Timing Claims
  marketTiming: /\b(best time|perfect time|right time|ideal time).{0,10}(to invest|for investment|to buy)\b/gi,
  
  // Comparative Superiority
  bestScheme: /\b(best|top|number.?one|#1).{0,15}(scheme|fund|investment|option)\b/gi,
  
  // Recommendation Language (Context-Dependent)
  strongRecommend: /\b(strongly.{0,5}recommend|must.{0,5}invest|should.{0,5}invest)\b/gi
};
```

### Hindi/Marathi Forbidden Terms
```javascript
const HINDI_FORBIDDEN = {
  guaranteed: /\b(गारंटीड|गारंटी|पक्का|निश्चित)\b/gi,
  sureReturns: /\b(पक्का.{0,10}रिटर्न|निश्चित.{0,10}फायदा)\b/gi,
  riskFree: /\b(जोखिम.{0,5}मुक्त|बिना.{0,5}जोखिम|सुरक्षित.{0,5}निवेश)\b/gi,
  doubleYourMoney: /\b(दोगुना.{0,10}पैसा|डबल.{0,10}मनी)\b/gi
};

const MARATHI_FORBIDDEN = {
  guaranteed: /\b(गॅरंटीड|निश्चित|पक्का)\b/gi,
  sureReturns: /\b(पक्का.{0,10}नफा|निश्चित.{0,10}फायदा)\b/gi,
  riskFree: /\b(धोका.{0,5}मुक्त|जोखीम.{0,5}नसलेला)\b/gi
};
```

## Mandatory Element Validation

### Disclaimer Requirements
```javascript
const DISCLAIMER_PATTERNS = {
  // Mutual Fund Disclaimer (MFD)
  mfDisclaimer: /mutual.{0,15}fund.{0,15}investments?.{0,15}are.{0,15}subject.{0,15}to.{0,15}market.{0,15}risks/gi,
  
  // Investment Advisory Disclaimer (RIA)
  riaDisclaimer: /educational.{0,10}only.*no.{0,10}investment.{0,10}advice/gi,
  
  // Generic Risk Warning
  riskWarning: /\b(market.{0,10}risks?|investment.{0,10}risks?|financial.{0,10}risks?)\b/gi,
  
  // Scheme Documents Reference
  schemeDocuments: /read.{0,15}all.{0,15}scheme.{0,15}related.{0,15}documents.{0,15}carefully/gi
};
```

### Advisor Identity Footer Validation
```javascript
const IDENTITY_PATTERNS = {
  // RIA Registration Pattern
  riaPattern: /\b[A-Z\s,]+SEBI\s+RIA\s+[A-Z]{3}\/[A-Z]{2}\/\d{4}\/\d{6}\b/gi,
  
  // MFD ARN Pattern  
  arnPattern: /\bARN\s*[-:]?\s*\d{5,6}\b/gi,
  
  // Advisor Name Pattern
  advisorName: /^[A-Za-z\s\.]{2,50}$/,
  
  // Complete Footer Validation
  completeFooter: /^.+,\s+(SEBI\s+RIA\s+[A-Z\/\d]+|ARN\s*[-:]?\s*\d+)\s*[-—]\s*.+$/gi
};
```

## Length and Format Validation

### Character Limits
```javascript
const LENGTH_VALIDATION = {
  maxCaptionChars: 500,
  maxDisclaimerChars: 50,
  maxEmojiCount: 3,
  maxHashtagCount: 2,
  
  // Validation Functions
  validateLength: (text) => ({
    caption: text.length <= 500,
    disclaimer: extractDisclaimer(text)?.length <= 50,
    emojis: countEmojis(text) <= 3,
    hashtags: countHashtags(text) <= 2
  })
};
```

### Emoji and Special Character Patterns
```javascript
const FORMAT_PATTERNS = {
  // Emoji Detection (Unicode ranges)
  emojiPattern: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
  
  // Hashtag Detection
  hashtagPattern: /#[a-zA-Z0-9_\u0900-\u097F]+/g,
  
  // Excessive Punctuation
  excessivePunctuation: /[!?.]{3,}/g,
  
  // ALL CAPS Detection (Risk Flag)
  allCapsWords: /\b[A-Z]{4,}\b/g
};
```

## Tone and Sentiment Analysis Patterns

### Educational Tone Indicators (Positive Signals)
```javascript
const EDUCATIONAL_PATTERNS = {
  educationalLanguage: /\b(understand|learn|consider|evaluate|analyze|research|study)\b/gi,
  conditionalLanguage: /\b(may|might|could|potentially|possibly|consider)\b/gi,
  factualPresentation: /\b(data shows|statistics indicate|historically|according to)\b/gi,
  riskAwareness: /\b(important to|remember that|keep in mind|be aware)\b/gi
};
```

### Problematic Tone Patterns (Risk Flags)
```javascript
const TONE_VIOLATIONS = {
  // Urgency Creation
  urgencyLanguage: /\b(hurry|quick|limited time|ending soon|don't miss|act now)\b/gi,
  
  // Emotional Manipulation
  emotionalTriggers: /\b(amazing|incredible|unbelievable|shocking|secret|hidden)\b/gi,
  
  // Fear-Based Marketing
  fearMongers: /\b(crisis|crash|disaster|afraid|scared|worried|panic)\b/gi,
  
  // Overly Promotional
  salesLanguage: /\b(buy now|invest today|call immediately|limited offer)\b/gi
};
```

## Implementation Logic

### Stage 1 Validation Pipeline
```javascript
function stage1HardRules(content, advisorType) {
  const violations = [];
  
  // 1. Forbidden Terms Check
  Object.entries(FORBIDDEN_TERMS_REGEX).forEach(([term, regex]) => {
    if (regex.test(content)) {
      violations.push({
        type: 'FORBIDDEN_TERM',
        term: term,
        severity: 'CRITICAL',
        riskScore: 40
      });
    }
  });
  
  // 2. Mandatory Elements Check
  const hasDisclaimer = checkDisclaimerPresence(content, advisorType);
  if (!hasDisclaimer) {
    violations.push({
      type: 'MISSING_DISCLAIMER',
      severity: 'CRITICAL',
      riskScore: 30
    });
  }
  
  // 3. Length Validation
  const lengthCheck = LENGTH_VALIDATION.validateLength(content);
  Object.entries(lengthCheck).forEach(([check, passed]) => {
    if (!passed) {
      violations.push({
        type: 'LENGTH_VIOLATION',
        check: check,
        severity: 'MODERATE',
        riskScore: 15
      });
    }
  });
  
  return {
    passed: violations.length === 0,
    violations: violations,
    totalRiskScore: violations.reduce((sum, v) => sum + v.riskScore, 0)
  };
}
```

### Multi-Language Support
```javascript
function detectLanguage(text) {
  const hindiChars = /[\u0900-\u097F]/g;
  const marathiIndicators = /[\u0966-\u096F]/g; // Specific Devanagari numerals
  
  const hindiMatches = (text.match(hindiChars) || []).length;
  const totalChars = text.length;
  
  if (hindiMatches / totalChars > 0.3) {
    return marathiIndicators.test(text) ? 'MR' : 'HI';
  }
  return 'EN';
}

function getLanguageSpecificRegex(language) {
  switch(language) {
    case 'HI': return HINDI_FORBIDDEN;
    case 'MR': return MARATHI_FORBIDDEN;
    default: return FORBIDDEN_TERMS_REGEX;
  }
}
```

## Testing and Validation

### Regex Test Suite
```javascript
const REGEX_TEST_CASES = [
  // Should Fail
  { text: "Guaranteed 20% returns!", expected: false },
  { text: "Sure-shot multibagger stock", expected: false },
  { text: "Risk-free investment opportunity", expected: false },
  
  // Should Pass
  { text: "Historical data suggests potential for growth", expected: true },
  { text: "Consider diversified portfolio approach", expected: true },
  { text: "Market risks apply to all investments", expected: true }
];
```

## Performance Optimization

- Pre-compiled regex patterns for faster execution
- Language detection caching to avoid repeated analysis
- Batch processing for multiple content validation
- Early termination on first critical violation for efficiency

## Audit Trail Integration

All regex matches are logged with:
- Matched pattern and position
- Risk score contribution
- Timestamp and content hash
- Advisor ID and content type
- Language detection result