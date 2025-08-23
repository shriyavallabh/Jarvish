// SEBI Compliance Rules Engine
// Implements hard rules for financial advisory content validation

export interface SEBIViolation {
  code: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  category: string;
  suggestion?: string;
}

// Prohibited terms that indicate guaranteed returns or misleading claims
const PROHIBITED_TERMS = {
  // Guarantee Language (Critical)
  GUARANTEES: {
    terms: [
      'guaranteed returns',
      'assured returns',
      'fixed returns',
      'risk-free',
      'no risk',
      'zero risk',
      'safe investment',
      '100% safe',
      'guaranteed profit',
      'sure shot',
      'pakka profit',
      'confirm returns',
      'guaranteed wealth'
    ],
    violation: {
      code: 'SEBI_GUARANTEE_CLAIM',
      severity: 'critical' as const,
      category: 'Performance Promises',
      description: 'Content contains prohibited guarantee language',
      suggestion: 'Remove guarantee language and add "Subject to market risks" disclaimer'
    }
  },

  // Performance Promises (Critical)
  PERFORMANCE_PROMISES: {
    terms: [
      'will double',
      'will triple',
      'multiply your money',
      'become rich',
      'become crorepati',
      'earn lakhs',
      'monthly income guaranteed',
      'assured monthly income',
      'definite returns'
    ],
    violation: {
      code: 'SEBI_PERF_PROMISE',
      severity: 'critical' as const,
      category: 'Performance Promises',
      description: 'Content contains unrealistic performance promises',
      suggestion: 'Replace with "potential returns" and add past performance disclaimer'
    }
  },

  // Misleading Comparisons (High)
  MISLEADING_COMPARISONS: {
    terms: [
      'better than fd',
      'beats fixed deposit',
      'outperform guaranteed',
      'always beats',
      'never loses',
      'only gains'
    ],
    violation: {
      code: 'SEBI_MISLEADING_COMP',
      severity: 'high' as const,
      category: 'Misleading Information',
      description: 'Content contains misleading comparisons',
      suggestion: 'Use factual comparisons with proper disclaimers'
    }
  },

  // Unregistered Advice (Critical)
  UNREGISTERED_ADVICE: {
    terms: [
      'buy now',
      'sell now',
      'invest immediately',
      'last chance',
      'limited time offer',
      'hurry up',
      'don\'t miss'
    ],
    violation: {
      code: 'SEBI_UNREG_ADVICE',
      severity: 'high' as const,
      category: 'Investment Advice',
      description: 'Content appears to provide direct investment advice',
      suggestion: 'Frame as educational content, not direct advice'
    }
  }
};

// Required disclaimers based on content type
const REQUIRED_DISCLAIMERS = {
  MARKET_RISK: {
    patterns: ['invest', 'mutual fund', 'equity', 'stock', 'sip', 'portfolio'],
    disclaimer: 'Mutual fund investments are subject to market risks',
    code: 'SEBI_MISSING_RISK_DISC'
  },
  PAST_PERFORMANCE: {
    patterns: ['returns', 'performance', 'cagr', 'irr', 'profit', 'gain'],
    disclaimer: 'Past performance is not indicative of future results',
    code: 'SEBI_MISSING_PAST_DISC'
  },
  ADVISOR_IDENTITY: {
    patterns: ['advice', 'recommend', 'suggest', 'should invest'],
    disclaimer: 'ARN/RIA registration number',
    code: 'SEBI_MISSING_ADVISOR_ID'
  }
};

// Language-specific prohibited terms
const HINDI_PROHIBITED_TERMS = {
  GUARANTEES: [
    'गारंटी', 'पक्का', 'निश्चित', 'ज़रूर', 'confirm', 
    'पक्का मुनाफा', 'गारंटीड रिटर्न', 'बिना जोखिम'
  ],
  PROMISES: [
    'करोड़पति', 'अमीर बनें', 'पैसा दोगुना', 'तिगुना',
    'लाखों कमाएं', 'मालामाल'
  ]
};

const MARATHI_PROHIBITED_TERMS = {
  GUARANTEES: [
    'हमी', 'खात्री', 'निश्चित', 'पक्का', 'नक्की'
  ],
  PROMISES: [
    'श्रीमंत', 'पैसे दुप्पट', 'कोटीपती', 'लाखो कमवा'
  ]
};

export class SEBIRulesEngine {
  private contentHash: Map<string, any> = new Map();

  /**
   * Stage 1: Check hard SEBI compliance rules
   */
  checkHardRules(content: string, language: string = 'en'): {
    violations: SEBIViolation[];
    requiresAI: boolean;
    immediateBlock: boolean;
    score: number;
  } {
    const violations: SEBIViolation[] = [];
    const normalizedContent = content.toLowerCase();
    
    // Check prohibited terms
    for (const [category, rule] of Object.entries(PROHIBITED_TERMS)) {
      for (const term of rule.terms) {
        if (normalizedContent.includes(term)) {
          violations.push(rule.violation);
          break; // One violation per category
        }
      }
    }

    // Check language-specific terms
    if (language === 'hi') {
      this.checkHindiTerms(normalizedContent, violations);
    } else if (language === 'mr') {
      this.checkMarathiTerms(normalizedContent, violations);
    }

    // Check for missing disclaimers
    for (const [key, rule] of Object.entries(REQUIRED_DISCLAIMERS)) {
      const hasRelevantContent = rule.patterns.some(pattern => 
        normalizedContent.includes(pattern)
      );
      
      if (hasRelevantContent && !normalizedContent.includes(rule.disclaimer.toLowerCase())) {
        violations.push({
          code: rule.code,
          severity: 'high',
          category: 'Missing Disclaimer',
          description: `Missing required disclaimer: ${rule.disclaimer}`,
          suggestion: `Add disclaimer: "${rule.disclaimer}"`
        });
      }
    }

    // Check for excessive emoji use (>3 money/rocket emojis)
    const emojiPattern = /[💰💵💴💶💷💸🚀📈💎🤑]/g;
    const emojiMatches = content.match(emojiPattern);
    if (emojiMatches && emojiMatches.length > 3) {
      violations.push({
        code: 'SEBI_EXCESS_EMOJI',
        severity: 'medium',
        category: 'Presentation',
        description: 'Excessive use of promotional emojis',
        suggestion: 'Reduce emoji usage to maintain professional tone'
      });
    }

    // Check for ALL CAPS abuse (more than 20% of words)
    const words = content.split(/\s+/);
    const capsWords = words.filter(word => word.length > 2 && word === word.toUpperCase());
    if (capsWords.length / words.length > 0.2) {
      violations.push({
        code: 'SEBI_CAPS_ABUSE',
        severity: 'low',
        category: 'Presentation',
        description: 'Excessive use of capital letters',
        suggestion: 'Use normal case for better readability'
      });
    }

    // Calculate compliance score
    let score = 100;
    violations.forEach(v => {
      switch (v.severity) {
        case 'critical': score -= 40; break;
        case 'high': score -= 25; break;
        case 'medium': score -= 15; break;
        case 'low': score -= 5; break;
      }
    });

    return {
      violations,
      requiresAI: violations.length === 0 || score > 30, // Need AI for subtle issues
      immediateBlock: violations.some(v => v.severity === 'critical'),
      score: Math.max(0, score)
    };
  }

  /**
   * Stage 3: Verify AI-modified content
   */
  verifyFinalContent(content: string, aiSuggestions?: any): {
    passed: boolean;
    remainingIssues: SEBIViolation[];
    score: number;
  } {
    const result = this.checkHardRules(content);
    
    // Final verification is stricter
    const passed = result.score >= 80 && !result.immediateBlock;
    
    return {
      passed,
      remainingIssues: result.violations,
      score: result.score
    };
  }

  /**
   * Check for specific financial products mentioned
   */
  detectFinancialProducts(content: string): string[] {
    const products: string[] = [];
    const productPatterns = {
      'Mutual Funds': /mutual fund|mf|sip|systematic investment|elss|equity fund|debt fund/i,
      'Insurance': /insurance|ulip|term plan|life cover|health cover|policy/i,
      'Stocks': /stock|equity|share|demat|trading|nifty|sensex/i,
      'Fixed Income': /fd|fixed deposit|bond|debenture|ncd|government securities/i,
      'PMS': /portfolio management|pms|discretionary|non-discretionary/i,
      'Real Estate': /real estate|property|realty|reit/i,
      'Gold': /gold|sovereign gold|gold etf|gold fund/i,
      'NPS': /nps|national pension|retirement|pension/i
    };

    for (const [product, pattern] of Object.entries(productPatterns)) {
      if (pattern.test(content)) {
        products.push(product);
      }
    }

    return products;
  }

  /**
   * Generate compliance suggestions
   */
  generateSuggestions(violations: SEBIViolation[], content: string): string[] {
    const suggestions: string[] = [];
    const products = this.detectFinancialProducts(content);

    // Product-specific suggestions
    if (products.includes('Mutual Funds')) {
      suggestions.push('Add standard mutual fund disclaimer: "Mutual fund investments are subject to market risks, read all scheme related documents carefully."');
    }

    if (products.includes('Insurance')) {
      suggestions.push('Include insurance disclaimer: "Insurance is the subject matter of solicitation."');
    }

    // General suggestions based on violations
    if (violations.some(v => v.code.includes('GUARANTEE'))) {
      suggestions.push('Replace guarantee language with "potential" or "historical" returns');
    }

    if (violations.some(v => v.code.includes('ADVISOR_ID'))) {
      suggestions.push('Include your ARN/RIA registration number for transparency');
    }

    // Add educational framing
    if (violations.some(v => v.category === 'Investment Advice')) {
      suggestions.push('Frame content as educational rather than direct advice');
      suggestions.push('Use phrases like "generally speaking" or "historically"');
    }

    return suggestions;
  }

  private checkHindiTerms(content: string, violations: SEBIViolation[]): void {
    for (const term of HINDI_PROHIBITED_TERMS.GUARANTEES) {
      if (content.includes(term)) {
        violations.push({
          code: 'SEBI_GUARANTEE_CLAIM_HI',
          severity: 'critical',
          category: 'Performance Promises',
          description: `Hindi content contains prohibited term: ${term}`,
          suggestion: 'Remove guarantee language and add risk disclaimer in Hindi'
        });
        break;
      }
    }

    for (const term of HINDI_PROHIBITED_TERMS.PROMISES) {
      if (content.includes(term)) {
        violations.push({
          code: 'SEBI_PERF_PROMISE_HI',
          severity: 'critical',
          category: 'Performance Promises',
          description: `Hindi content contains unrealistic promise: ${term}`,
          suggestion: 'Use realistic language with proper disclaimers'
        });
        break;
      }
    }
  }

  private checkMarathiTerms(content: string, violations: SEBIViolation[]): void {
    for (const term of MARATHI_PROHIBITED_TERMS.GUARANTEES) {
      if (content.includes(term)) {
        violations.push({
          code: 'SEBI_GUARANTEE_CLAIM_MR',
          severity: 'critical',
          category: 'Performance Promises',
          description: `Marathi content contains prohibited term: ${term}`,
          suggestion: 'Remove guarantee language and add risk disclaimer in Marathi'
        });
        break;
      }
    }

    for (const term of MARATHI_PROHIBITED_TERMS.PROMISES) {
      if (content.includes(term)) {
        violations.push({
          code: 'SEBI_PERF_PROMISE_MR',
          severity: 'critical',
          category: 'Performance Promises',
          description: `Marathi content contains unrealistic promise: ${term}`,
          suggestion: 'Use realistic language with proper disclaimers'
        });
        break;
      }
    }
  }

  /**
   * Calculate risk score (0-100)
   */
  calculateRiskScore(violations: SEBIViolation[], aiAnalysis?: any): number {
    let riskScore = 0;

    // Base risk from violations
    violations.forEach(v => {
      switch (v.severity) {
        case 'critical': riskScore += 30; break;
        case 'high': riskScore += 20; break;
        case 'medium': riskScore += 10; break;
        case 'low': riskScore += 5; break;
      }
    });

    // Adjust based on AI analysis if available
    if (aiAnalysis?.riskFactors) {
      riskScore += aiAnalysis.riskFactors * 10;
    }

    return Math.min(100, riskScore);
  }
}

export default new SEBIRulesEngine();