// Multi-language Support Utilities
// Financial terminology mapping and translation helpers

export type SupportedLanguage = 'en' | 'hi' | 'mr';

// Financial terms dictionary
const FINANCIAL_TERMS: Record<string, Record<SupportedLanguage, string>> = {
  // Risk Disclaimers
  'market_risk_disclaimer': {
    en: 'Mutual fund investments are subject to market risks, read all scheme related documents carefully.',
    hi: 'म्यूचुअल फंड निवेश बाजार जोखिमों के अधीन हैं, योजना संबंधी सभी दस्तावेजों को ध्यान से पढ़ें।',
    mr: 'म्युच्युअल फंड गुंतवणूक बाजार जोखमीच्या अधीन आहे, सर्व योजना संबंधित कागदपत्रे काळजीपूर्वक वाचा.'
  },
  'past_performance_disclaimer': {
    en: 'Past performance is not indicative of future results.',
    hi: 'पिछला प्रदर्शन भविष्य के परिणामों का संकेत नहीं है।',
    mr: 'मागील कामगिरी भविष्यातील निकालांचे सूचक नाही.'
  },
  'insurance_disclaimer': {
    en: 'Insurance is the subject matter of solicitation.',
    hi: 'बीमा याचना की विषय वस्तु है।',
    mr: 'विमा ही याचनेची विषयवस्तू आहे.'
  },
  'investment_advice_disclaimer': {
    en: 'This is for educational purposes only and not investment advice.',
    hi: 'यह केवल शैक्षणिक उद्देश्यों के लिए है और निवेश सलाह नहीं है।',
    mr: 'हे केवळ शैक्षणिक उद्देशांसाठी आहे आणि गुंतवणूक सल्ला नाही.'
  },

  // Common Financial Terms
  'mutual_fund': {
    en: 'Mutual Fund',
    hi: 'म्यूचुअल फंड',
    mr: 'म्युच्युअल फंड'
  },
  'sip': {
    en: 'Systematic Investment Plan (SIP)',
    hi: 'व्यवस्थित निवेश योजना (SIP)',
    mr: 'पद्धतशीर गुंतवणूक योजना (SIP)'
  },
  'returns': {
    en: 'Returns',
    hi: 'रिटर्न',
    mr: 'परतावा'
  },
  'risk': {
    en: 'Risk',
    hi: 'जोखिम',
    mr: 'जोखीम'
  },
  'investment': {
    en: 'Investment',
    hi: 'निवेश',
    mr: 'गुंतवणूक'
  },
  'portfolio': {
    en: 'Portfolio',
    hi: 'पोर्टफोलियो',
    mr: 'पोर्टफोलिओ'
  },
  'equity': {
    en: 'Equity',
    hi: 'इक्विटी',
    mr: 'इक्विटी'
  },
  'debt': {
    en: 'Debt',
    hi: 'डेट',
    mr: 'कर्ज'
  },
  'advisor': {
    en: 'Financial Advisor',
    hi: 'वित्तीय सलाहकार',
    mr: 'आर्थिक सल्लागार'
  },
  'disclaimer': {
    en: 'Disclaimer',
    hi: 'अस्वीकरण',
    mr: 'अस्वीकरण'
  }
};

// Common compliance phrases
const COMPLIANCE_PHRASES: Record<string, Record<SupportedLanguage, string>> = {
  'subject_to_market_risks': {
    en: 'subject to market risks',
    hi: 'बाजार जोखिमों के अधीन',
    mr: 'बाजार जोखमीच्या अधीन'
  },
  'read_carefully': {
    en: 'read all documents carefully',
    hi: 'सभी दस्तावेजों को ध्यान से पढ़ें',
    mr: 'सर्व कागदपत्रे काळजीपूर्वक वाचा'
  },
  'consult_advisor': {
    en: 'consult your financial advisor',
    hi: 'अपने वित्तीय सलाहकार से परामर्श करें',
    mr: 'आपल्या आर्थिक सल्लागाराचा सल्ला घ्या'
  },
  'tax_implications': {
    en: 'tax implications may vary',
    hi: 'कर निहितार्थ भिन्न हो सकते हैं',
    mr: 'कर परिणाम बदलू शकतात'
  }
};

export class LanguageUtils {
  /**
   * Detect language from content
   */
  detectLanguage(content: string): SupportedLanguage {
    // Hindi detection
    if (/[\u0900-\u097F]/.test(content)) {
      return 'hi';
    }
    
    // Marathi detection (overlaps with Hindi, so check specific words)
    const marathiIndicators = ['आहे', 'होते', 'करा', 'आणि', 'किंवा'];
    if (marathiIndicators.some(word => content.includes(word))) {
      return 'mr';
    }
    
    // Default to English
    return 'en';
  }

  /**
   * Get disclaimer in specified language
   */
  getDisclaimer(
    type: 'market_risk' | 'past_performance' | 'insurance' | 'investment_advice',
    language: SupportedLanguage
  ): string {
    const key = `${type}_disclaimer`;
    return FINANCIAL_TERMS[key]?.[language] || FINANCIAL_TERMS[key]?.en || '';
  }

  /**
   * Translate financial term
   */
  translateTerm(term: string, targetLanguage: SupportedLanguage): string {
    const normalizedTerm = term.toLowerCase().replace(/\s+/g, '_');
    return FINANCIAL_TERMS[normalizedTerm]?.[targetLanguage] || term;
  }

  /**
   * Add language-appropriate disclaimer to content
   */
  addDisclaimer(
    content: string,
    disclaimerType: string,
    language: SupportedLanguage
  ): string {
    const disclaimer = this.getDisclaimer(disclaimerType as any, language);
    
    if (!disclaimer) return content;

    // Add disclaimer with appropriate formatting
    const separator = language === 'en' ? '\n\n' : '\n\n';
    const prefix = language === 'en' ? '📋 ' : '';
    
    return `${content}${separator}${prefix}${disclaimer}`;
  }

  /**
   * Check if content has required disclaimer
   */
  hasDisclaimer(content: string, disclaimerType: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Check in all languages
    const languages: SupportedLanguage[] = ['en', 'hi', 'mr'];
    
    for (const lang of languages) {
      const disclaimer = this.getDisclaimer(disclaimerType as any, lang);
      if (disclaimer && lowerContent.includes(disclaimer.toLowerCase().substring(0, 20))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Format number in Indian numbering system
   */
  formatIndianNumber(num: number, language: SupportedLanguage = 'en'): string {
    const formatter = new Intl.NumberFormat('en-IN');
    const formatted = formatter.format(num);
    
    if (language === 'hi' || language === 'mr') {
      // Add lakh/crore labels
      if (num >= 10000000) {
        return `${(num / 10000000).toFixed(2)} करोड़`;
      } else if (num >= 100000) {
        return `${(num / 100000).toFixed(2)} लाख`;
      }
    }
    
    return formatted;
  }

  /**
   * Clean content for compliance checking
   */
  normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\u0900-\u097F\u0964\u0965]/g, '') // Keep Hindi/Devanagari chars
      .trim();
  }

  /**
   * Extract financial amounts from content
   */
  extractAmounts(content: string): Array<{ amount: number; context: string }> {
    const amounts: Array<{ amount: number; context: string }> = [];
    
    // Pattern for Indian currency format
    const patterns = [
      /₹\s*([\d,]+(?:\.\d{2})?)/g,
      /Rs\.?\s*([\d,]+(?:\.\d{2})?)/gi,
      /([\d,]+(?:\.\d{2})?)\s*(?:rupees?|rs)/gi,
      /([\d,]+)\s*(?:lakh|lac|crore|cr)/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const value = match[1].replace(/,/g, '');
        const amount = parseFloat(value);
        
        if (!isNaN(amount)) {
          // Get context (20 chars before and after)
          const start = Math.max(0, match.index - 20);
          const end = Math.min(content.length, match.index + match[0].length + 20);
          const context = content.substring(start, end);
          
          amounts.push({ amount, context });
        }
      }
    });
    
    return amounts;
  }

  /**
   * Generate language-specific compliance suggestions
   */
  getComplianceSuggestions(
    violations: any[],
    language: SupportedLanguage
  ): string[] {
    const suggestions: string[] = [];
    
    const templates = {
      en: {
        addDisclaimer: 'Add disclaimer: ',
        removePhrase: 'Remove phrase: ',
        replaceWith: 'Replace with: ',
        addIdentity: 'Include advisor ARN/RIA number'
      },
      hi: {
        addDisclaimer: 'अस्वीकरण जोड़ें: ',
        removePhrase: 'वाक्यांश हटाएं: ',
        replaceWith: 'इससे बदलें: ',
        addIdentity: 'सलाहकार ARN/RIA नंबर शामिल करें'
      },
      mr: {
        addDisclaimer: 'अस्वीकरण जोडा: ',
        removePhrase: 'वाक्य काढा: ',
        replaceWith: 'याने बदला: ',
        addIdentity: 'सल्लागार ARN/RIA क्रमांक समाविष्ट करा'
      }
    };
    
    const lang = templates[language] || templates.en;
    
    violations.forEach(violation => {
      if (violation.code?.includes('MISSING_DISC')) {
        suggestions.push(lang.addDisclaimer + this.getDisclaimer('market_risk', language));
      }
      if (violation.code?.includes('GUARANTEE')) {
        suggestions.push(lang.removePhrase + '"guaranteed returns"');
      }
      if (violation.code?.includes('ADVISOR_ID')) {
        suggestions.push(lang.addIdentity);
      }
    });
    
    return suggestions;
  }

  /**
   * Check for language mixing (code-mixing)
   */
  detectCodeMixing(content: string): {
    hasCodeMixing: boolean;
    languages: SupportedLanguage[];
  } {
    const languages: Set<SupportedLanguage> = new Set();
    
    // Check for English
    if (/[a-zA-Z]{3,}/.test(content)) {
      languages.add('en');
    }
    
    // Check for Hindi/Devanagari
    if (/[\u0900-\u097F]/.test(content)) {
      languages.add('hi');
      // Could also be Marathi, need deeper analysis
    }
    
    return {
      hasCodeMixing: languages.size > 1,
      languages: Array.from(languages)
    };
  }
}

export default new LanguageUtils();