import { z } from 'zod';

// SEBI Compliance Rules Database
export const SEBIComplianceRules = {
  // Critical violations - immediate block
  CRITICAL_VIOLATIONS: {
    GUARANTEED_RETURNS: {
      patterns: [
        /guaranteed\s+returns?/gi,
        /assured\s+profits?/gi,
        /100%\s+safe/gi,
        /risk[\-\s]*free\s+investment/gi,
        /no[\-\s]*loss\s+guarantee/gi,
        /definite\s+gains?/gi,
        /confirmed\s+returns?/gi,
      ],
      message: 'Guaranteed returns or assured profits are strictly prohibited by SEBI',
      severity: 'critical' as const,
      code: 'SEBI_AD_001'
    },
    MISLEADING_CLAIMS: {
      patterns: [
        /double\s+your\s+money/gi,
        /get\s+rich\s+quick/gi,
        /multiply\s+your\s+wealth/gi,
        /become\s+a\s+crorepati/gi,
        /millionaire\s+in\s+\d+\s+days/gi,
      ],
      message: 'Misleading wealth multiplication claims are prohibited',
      severity: 'critical' as const,
      code: 'SEBI_AD_002'
    },
    INSIDER_TRADING: {
      patterns: [
        /insider\s+information/gi,
        /hot\s+tip/gi,
        /inside\s+news/gi,
        /confidential\s+tip/gi,
        /exclusive\s+information/gi,
      ],
      message: 'Claims of insider information are illegal',
      severity: 'critical' as const,
      code: 'SEBI_AD_003'
    }
  },

  // High severity violations
  HIGH_VIOLATIONS: {
    SPECIFIC_RETURNS: {
      patterns: [
        /\d+%\s*(annual|yearly|monthly)?\s*returns?/gi,
        /returns?\s+of\s+\d+%/gi,
        /\d+%\s+profits?/gi,
        /earn\s+\d+%/gi,
      ],
      message: 'Specific return percentages without disclaimers are prohibited',
      severity: 'high' as const,
      code: 'SEBI_AD_004'
    },
    MARKET_BEATING: {
      patterns: [
        /beat\s+the\s+market/gi,
        /outperform\s+the\s+market/gi,
        /better\s+than\s+index/gi,
        /guaranteed\s+to\s+beat/gi,
      ],
      message: 'Claims of beating market returns are misleading',
      severity: 'high' as const,
      code: 'SEBI_AD_005'
    },
    SELECTIVE_DISCLOSURE: {
      patterns: [
        /best\s+performing\s+fund/gi,
        /top\s+returns?\s+last\s+year/gi,
        /highest\s+growth\s+fund/gi,
        /number\s+one\s+fund/gi,
      ],
      message: 'Selective performance disclosure without full context',
      severity: 'high' as const,
      code: 'SEBI_AD_006'
    }
  },

  // Medium severity violations
  MEDIUM_VIOLATIONS: {
    URGENCY_TACTICS: {
      patterns: [
        /limited\s+time\s+offer/gi,
        /act\s+now/gi,
        /hurry\s+up/gi,
        /last\s+chance/gi,
        /expires?\s+soon/gi,
      ],
      message: 'Urgency tactics in financial advice are inappropriate',
      severity: 'medium' as const,
      code: 'SEBI_AD_007'
    },
    UNSUBSTANTIATED_CLAIMS: {
      patterns: [
        /best\s+investment/gi,
        /perfect\s+portfolio/gi,
        /ideal\s+fund/gi,
        /must\s+have\s+investment/gi,
      ],
      message: 'Unsubstantiated superlative claims',
      severity: 'medium' as const,
      code: 'SEBI_AD_008'
    },
    EXCESSIVE_PROMOTION: {
      patterns: [
        /call\s+me\s+now/gi,
        /whatsapp\s+me/gi,
        /dm\s+for\s+details/gi,
        /contact\s+immediately/gi,
      ],
      message: 'Excessive promotional language',
      severity: 'medium' as const,
      code: 'SEBI_AD_009'
    }
  },

  // Required disclaimers
  REQUIRED_DISCLAIMERS: {
    MARKET_RISK: {
      required_for: ['investment', 'mutual fund', 'equity', 'stock', 'portfolio'],
      disclaimer: 'Mutual fund investments are subject to market risks. Please read all scheme related documents carefully.',
      short_form: 'Subject to market risks',
      code: 'SEBI_DISC_001'
    },
    PAST_PERFORMANCE: {
      required_for: ['returns', 'performance', 'growth', 'profit'],
      disclaimer: 'Past performance is not indicative of future results.',
      short_form: 'Past performance ≠ future results',
      code: 'SEBI_DISC_002'
    },
    ADVISOR_DISCLOSURE: {
      required_for: ['advice', 'recommendation', 'suggest', 'should invest'],
      disclaimer: 'Please consult your financial advisor before making investment decisions.',
      short_form: 'Consult your advisor',
      code: 'SEBI_DISC_003'
    },
    TAX_DISCLAIMER: {
      required_for: ['tax', 'tax saving', 'tax benefit', '80C', 'ELSS'],
      disclaimer: 'Tax benefits are subject to changes in tax laws.',
      short_form: 'Tax laws may change',
      code: 'SEBI_DISC_004'
    }
  },

  // Language-specific rules
  HINDI_RULES: {
    CRITICAL_TERMS: [
      'गारंटीड रिटर्न',
      'पक्का मुनाफा',
      'निश्चित लाभ',
      'जोखिम मुक्त',
      'नुकसान नहीं'
    ],
    REQUIRED_DISCLAIMERS: {
      MARKET_RISK: 'म्यूचुअल फंड निवेश बाजार जोखिम के अधीन हैं। योजना संबंधी सभी दस्तावेजों को सावधानीपूर्वक पढ़ें।',
      PAST_PERFORMANCE: 'पिछला प्रदर्शन भविष्य के परिणामों की गारंटी नहीं है।'
    }
  },

  // Content structure rules
  CONTENT_RULES: {
    MAX_LENGTH: 2000,
    MAX_WHATSAPP_LENGTH: 1024,
    MAX_EMOJI_COUNT: 3,
    MIN_LENGTH: 20,
    REQUIRED_ELEMENTS: {
      EUIN_FORMAT: /E\d{6}/,
      MOBILE_FORMAT: /\+91[6-9]\d{9}/,
      EMAIL_FORMAT: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },

  // Risk scoring weights
  RISK_WEIGHTS: {
    critical: 100,
    high: 50,
    medium: 25,
    low: 10,
    missing_disclaimer: 15,
    excessive_emoji: 5,
    length_violation: 10,
    format_issue: 5
  }
};

// Compliance check function
export function checkCompliance(
  content: string,
  language: 'en' | 'hi' = 'en',
  strictMode: boolean = false
): {
  violations: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    code: string;
    position?: number;
  }>;
  missingDisclaimers: string[];
  riskScore: number;
  suggestions: string[];
} {
  const violations: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    code: string;
    position?: number;
  }> = [];
  const missingDisclaimers: string[] = [];
  const suggestions: string[] = [];
  let riskScore = 0;

  const contentLower = content.toLowerCase();

  // Check critical violations
  Object.entries(SEBIComplianceRules.CRITICAL_VIOLATIONS).forEach(([key, rule]) => {
    rule.patterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        violations.push({
          type: key,
          severity: rule.severity,
          message: rule.message,
          code: rule.code,
          position: match.index
        });
        riskScore += SEBIComplianceRules.RISK_WEIGHTS.critical;
      }
    });
  });

  // Check high violations
  Object.entries(SEBIComplianceRules.HIGH_VIOLATIONS).forEach(([key, rule]) => {
    rule.patterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        violations.push({
          type: key,
          severity: rule.severity,
          message: rule.message,
          code: rule.code,
          position: match.index
        });
        riskScore += SEBIComplianceRules.RISK_WEIGHTS.high;
      }
    });
  });

  // Check medium violations
  Object.entries(SEBIComplianceRules.MEDIUM_VIOLATIONS).forEach(([key, rule]) => {
    rule.patterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        violations.push({
          type: key,
          severity: rule.severity,
          message: rule.message,
          code: rule.code,
          position: match.index
        });
        riskScore += SEBIComplianceRules.RISK_WEIGHTS.medium;
      }
    });
  });

  // Check required disclaimers
  Object.entries(SEBIComplianceRules.REQUIRED_DISCLAIMERS).forEach(([key, rule]) => {
    const needsDisclaimer = rule.required_for.some(term => contentLower.includes(term));
    if (needsDisclaimer) {
      const hasDisclaimer = 
        contentLower.includes(rule.disclaimer.toLowerCase()) ||
        contentLower.includes(rule.short_form.toLowerCase()) ||
        contentLower.includes('risk') ||
        contentLower.includes('disclaimer');
      
      if (!hasDisclaimer) {
        missingDisclaimers.push(rule.disclaimer);
        suggestions.push(`Add disclaimer: "${rule.short_form}"`);
        riskScore += SEBIComplianceRules.RISK_WEIGHTS.missing_disclaimer;
      }
    }
  });

  // Check content structure
  if (content.length > SEBIComplianceRules.CONTENT_RULES.MAX_LENGTH) {
    violations.push({
      type: 'LENGTH_VIOLATION',
      severity: 'low',
      message: `Content exceeds maximum length of ${SEBIComplianceRules.CONTENT_RULES.MAX_LENGTH} characters`,
      code: 'STRUCT_001',
    });
    suggestions.push('Shorten content to comply with length limits');
    riskScore += SEBIComplianceRules.RISK_WEIGHTS.length_violation;
  }

  if (content.length < SEBIComplianceRules.CONTENT_RULES.MIN_LENGTH) {
    violations.push({
      type: 'LENGTH_VIOLATION',
      severity: 'low',
      message: `Content is too short (minimum ${SEBIComplianceRules.CONTENT_RULES.MIN_LENGTH} characters)`,
      code: 'STRUCT_002',
    });
    suggestions.push('Expand content with more details');
    riskScore += SEBIComplianceRules.RISK_WEIGHTS.length_violation;
  }

  // Check emoji usage
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > SEBIComplianceRules.CONTENT_RULES.MAX_EMOJI_COUNT) {
    violations.push({
      type: 'EXCESSIVE_EMOJI',
      severity: 'low',
      message: `Too many emojis (${emojiCount} found, max ${SEBIComplianceRules.CONTENT_RULES.MAX_EMOJI_COUNT} allowed)`,
      code: 'STRUCT_003',
    });
    suggestions.push('Reduce emoji usage for professional appearance');
    riskScore += SEBIComplianceRules.RISK_WEIGHTS.excessive_emoji;
  }

  // Hindi-specific checks
  if (language === 'hi') {
    SEBIComplianceRules.HINDI_RULES.CRITICAL_TERMS.forEach(term => {
      if (content.includes(term)) {
        violations.push({
          type: 'HINDI_VIOLATION',
          severity: 'critical',
          message: `Prohibited Hindi term found: "${term}"`,
          code: 'HINDI_001',
        });
        riskScore += SEBIComplianceRules.RISK_WEIGHTS.critical;
      }
    });
  }

  // Generate improvement suggestions
  if (violations.length === 0 && missingDisclaimers.length === 0) {
    suggestions.push('Content appears compliant. Consider adding EUIN for full compliance.');
  } else {
    if (violations.some(v => v.severity === 'critical')) {
      suggestions.push('Remove all guaranteed return language immediately');
    }
    if (violations.some(v => v.type === 'SPECIFIC_RETURNS')) {
      suggestions.push('Replace specific percentages with general performance indicators');
    }
    if (violations.some(v => v.type === 'URGENCY_TACTICS')) {
      suggestions.push('Remove time-pressure language and focus on education');
    }
  }

  // Cap risk score at 100
  riskScore = Math.min(100, riskScore);

  return {
    violations,
    missingDisclaimers,
    riskScore,
    suggestions
  };
}

// Export compliance check schema
export const ComplianceCheckRequestSchema = z.object({
  content: z.string().min(1).max(2000),
  language: z.enum(['en', 'hi']).default('en'),
  contentType: z.enum(['market_update', 'investment_tips', 'tax_planning', 'educational']),
  advisorId: z.string(),
  euin: z.string().optional(),
  strictMode: z.boolean().default(false)
});

export const ComplianceCheckResponseSchema = z.object({
  isCompliant: z.boolean(),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  colorCode: z.enum(['green', 'yellow', 'red']),
  violations: z.array(z.object({
    type: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    message: z.string(),
    code: z.string(),
    position: z.number().optional()
  })),
  missingDisclaimers: z.array(z.string()),
  suggestions: z.array(z.string()),
  fixedContent: z.string().optional(),
  auditHash: z.string()
});

// Helper function to fix common violations
export function autoFixContent(
  content: string,
  violations: Array<{ type: string; severity: string }>,
  missingDisclaimers: string[]
): string | null {
  // Only auto-fix if no critical violations
  if (violations.some(v => v.severity === 'critical')) {
    return null;
  }

  let fixed = content;

  // Simple replacements for high/medium violations
  const replacements: Record<string, string> = {
    'guaranteed returns': 'potential returns',
    'assured profit': 'possible profit',
    'risk-free': 'lower-risk',
    'definitely': 'potentially',
    'best performing': 'well-performing',
    'highest growth': 'strong growth',
    'limited time offer': 'current opportunity',
    'act now': 'consider this',
    'must have': 'worth considering'
  };

  Object.entries(replacements).forEach(([bad, good]) => {
    fixed = fixed.replace(new RegExp(bad, 'gi'), good);
  });

  // Add missing disclaimers
  if (missingDisclaimers.length > 0 && !fixed.includes('risk')) {
    const shortDisclaimer = ' | Market risks apply. Read documents carefully.';
    if (fixed.length + shortDisclaimer.length <= SEBIComplianceRules.CONTENT_RULES.MAX_WHATSAPP_LENGTH) {
      fixed += shortDisclaimer;
    }
  }

  return fixed;
}

export default SEBIComplianceRules;