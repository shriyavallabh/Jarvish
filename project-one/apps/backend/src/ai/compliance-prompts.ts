// AI Compliance Prompts for GPT-4o-mini
// SEBI-aware prompts for semantic analysis

export const COMPLIANCE_SYSTEM_PROMPT = `You are a SEBI-compliant financial content analyzer for Indian financial advisors.

Your role is to:
1. Identify subtle compliance issues that rule-based systems might miss
2. Evaluate context and intent behind financial content
3. Detect misleading implications even if explicit terms aren't used
4. Assess cultural sensitivity and language appropriateness
5. Identify potential bias or discrimination

Key SEBI regulations to enforce:
- No guaranteed/assured returns language
- Mandatory risk disclosures for investment products
- Past performance disclaimers when discussing returns
- Advisor identification (ARN/RIA) when giving advice
- Educational framing vs direct investment advice
- Balanced presentation of risks and rewards

You must be strict but fair, understanding that advisors need to educate while staying compliant.`;

export const COMPLIANCE_CHECK_PROMPT = (content: string, language: string, contentType: string) => `
Analyze this ${contentType} content in ${language} for SEBI compliance issues:

"${content}"

Evaluate for:
1. **Guarantee Language**: Any implied promises of returns or safety
2. **Missing Disclaimers**: Required risk warnings or disclosures
3. **Misleading Claims**: Exaggerations or selective information
4. **Pressure Tactics**: Creating urgency or FOMO
5. **Unbalanced Presentation**: Only showing positives without risks
6. **Cultural Appropriateness**: Language and examples suitable for Indian investors
7. **Target Audience**: Ensuring content is appropriate for retail investors

Provide response in this exact JSON format:
{
  "riskScore": <0-100>,
  "violations": [
    {
      "type": "<violation type>",
      "severity": "critical|high|medium|low",
      "description": "<specific issue>",
      "location": "<where in content>",
      "suggestion": "<how to fix>"
    }
  ],
  "culturalSensitivity": "appropriate|needs_review|inappropriate",
  "biasDetected": <true|false>,
  "reasoning": "<brief explanation of overall assessment>",
  "suggestions": ["<improvement 1>", "<improvement 2>"],
  "requiresManualReview": <true|false>
}`;

export const CONTENT_IMPROVEMENT_PROMPT = (content: string, violations: any[]) => `
Rewrite this financial content to be SEBI compliant while maintaining its educational value:

Original: "${content}"

Issues found:
${violations.map(v => `- ${v.description}`).join('\n')}

Requirements:
1. Remove all guarantee/assured returns language
2. Add necessary risk disclaimers
3. Frame as education, not direct advice
4. Maintain engaging tone without being promotional
5. Include balanced risk presentation
6. Keep it concise and clear

Provide the improved content that addresses all compliance issues while keeping the core message.`;

export const MULTI_LANGUAGE_PROMPT = (content: string, fromLang: string, toLang: string) => `
Translate this SEBI-compliant financial content from ${fromLang} to ${toLang}:

"${content}"

Requirements:
1. Maintain all disclaimers and risk warnings
2. Use appropriate financial terminology in target language
3. Preserve the educational tone
4. Ensure cultural appropriateness
5. Don't add or remove any compliance elements

Provide only the translated text, maintaining the same structure and compliance elements.`;

export const RISK_ASSESSMENT_PROMPT = (content: string, productType: string) => `
Assess the regulatory risk level of this ${productType} content:

"${content}"

Consider:
1. Severity of any compliance violations
2. Likelihood of regulatory action
3. Potential investor harm
4. Clarity of disclaimers
5. Overall tone and intent

Provide a risk assessment:
{
  "overallRisk": "low|medium|high|critical",
  "riskFactors": [
    {
      "factor": "<specific risk>",
      "impact": "low|medium|high",
      "mitigation": "<how to reduce>"
    }
  ],
  "regulatoryExposure": <0-100>,
  "investorProtection": <0-100>,
  "recommendedAction": "approve|modify|reject|escalate"
}`;

// Specialized prompts for different content types
export const WHATSAPP_COMPLIANCE_PROMPT = `
This is a WhatsApp message for financial advisory. Check for:
- Brevity without losing required disclaimers
- Appropriate use of formatting (bold, italic)
- No excessive emojis or casual language
- Clear advisor identification
- Mobile-friendly disclaimer format
`;

export const LINKEDIN_COMPLIANCE_PROMPT = `
This is a LinkedIn post for professional financial content. Check for:
- Professional tone and language
- Thought leadership vs investment advice
- Appropriate hashtag usage
- Clear professional credentials
- Engagement without promotion
`;

export const EMAIL_COMPLIANCE_PROMPT = `
This is an email for client communication. Check for:
- Formal disclaimer placement
- Clear unsubscribe options
- Professional signature with credentials
- Balanced content presentation
- Appropriate subject line
`;

// Hindi-specific compliance prompt
export const HINDI_COMPLIANCE_PROMPT = `
यह हिंदी वित्तीय सामग्री है। जांचें:
- गारंटी या आश्वासन की भाषा
- जोखिम संबंधी चेतावनी
- सलाहकार पंजीकरण विवरण
- शैक्षणिक बनाम प्रत्यक्ष सलाह
- सांस्कृतिक उपयुक्तता
`;

// Marathi-specific compliance prompt
export const MARATHI_COMPLIANCE_PROMPT = `
ही मराठी आर्थिक सामग्री आहे. तपासा:
- हमी किंवा खात्री भाषा
- जोखीम संबंधी सूचना
- सल्लागार नोंदणी तपशील
- शैक्षणिक विरुद्ध थेट सल्ला
- सांस्कृतिक योग्यता
`;

// Cost optimization: Cached prompt templates
export const CACHED_PROMPTS = {
  MUTUAL_FUND_CHECK: 'Check mutual fund content for SEBI compliance including risk disclaimers',
  INSURANCE_CHECK: 'Check insurance content for IRDAI compliance and mis-selling',
  STOCK_ADVICE_CHECK: 'Check equity content for investment advice vs education',
  GENERAL_FINANCE_CHECK: 'Check general financial content for compliance'
};

// Prompt token estimation for cost control
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// Select appropriate prompt based on content
export function selectPromptStrategy(
  content: string,
  contentType: string,
  hasViolations: boolean
): {
  prompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
} {
  const contentLength = content.length;
  const estimatedTokens = estimateTokens(content);

  // Use lighter model for simple checks
  if (contentLength < 280 && !hasViolations) {
    return {
      prompt: CACHED_PROMPTS.GENERAL_FINANCE_CHECK,
      model: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.1
    };
  }

  // Use detailed prompt for complex content
  if (hasViolations || contentLength > 1000) {
    return {
      prompt: COMPLIANCE_CHECK_PROMPT(content, 'en', contentType),
      model: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.2
    };
  }

  // Default strategy
  return {
    prompt: COMPLIANCE_CHECK_PROMPT(content, 'en', contentType),
    model: 'gpt-4o-mini',
    maxTokens: 750,
    temperature: 0.15
  };
}