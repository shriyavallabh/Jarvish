import OpenAI from 'openai';
import { z } from 'zod';

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-proj-test-key';

// Initialize OpenAI client (lazy initialization to support testing)
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }
  return openai;
}

// Cache for frequently used prompts
const promptCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days

// Cost control limits
export const DAILY_LIMITS = {
  content_generations: 10,
  compliance_checks: 20,
};

// Content generation response schema
export const ContentGenerationSchema = z.object({
  content: z.string(),
  title: z.string(),
  category: z.enum(['market_update', 'investment_tips', 'tax_planning', 'educational']),
  language: z.enum(['en', 'hi']),
  risk_score: z.number().min(0).max(100),
  compliance_notes: z.array(z.string()),
  disclaimers: z.array(z.string()),
  hashtags: z.array(z.string()).optional(),
});

// Compliance check response schema
export const ComplianceCheckSchema = z.object({
  is_compliant: z.boolean(),
  risk_score: z.number().min(0).max(100),
  violations: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    suggestion: z.string(),
  })),
  fixed_content: z.string().optional(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

export class OpenAIService {
  private usageTracker: Map<string, { generations: number; checks: number; date: string }> = new Map();

  constructor() {
    // Initialize usage tracker
    this.resetDailyUsage();
  }

  private resetDailyUsage() {
    const today = new Date().toISOString().split('T')[0];
    this.usageTracker.forEach((usage, advisorId) => {
      if (usage.date !== today) {
        this.usageTracker.set(advisorId, { generations: 0, checks: 0, date: today });
      }
    });
  }

  private checkUsageLimits(advisorId: string, type: 'generation' | 'check'): boolean {
    const today = new Date().toISOString().split('T')[0];
    const usage = this.usageTracker.get(advisorId) || { generations: 0, checks: 0, date: today };
    
    if (usage.date !== today) {
      usage.generations = 0;
      usage.checks = 0;
      usage.date = today;
    }

    if (type === 'generation' && usage.generations >= DAILY_LIMITS.content_generations) {
      return false;
    }
    if (type === 'check' && usage.checks >= DAILY_LIMITS.compliance_checks) {
      return false;
    }

    return true;
  }

  private updateUsage(advisorId: string, type: 'generation' | 'check') {
    const today = new Date().toISOString().split('T')[0];
    const usage = this.usageTracker.get(advisorId) || { generations: 0, checks: 0, date: today };
    
    if (type === 'generation') usage.generations++;
    if (type === 'check') usage.checks++;
    
    this.usageTracker.set(advisorId, usage);
  }

  async generateContent(params: {
    advisorId: string;
    category: 'market_update' | 'investment_tips' | 'tax_planning' | 'educational';
    language: 'en' | 'hi';
    tone?: 'professional' | 'friendly' | 'educational';
    context?: string;
    advisorName?: string;
    euin?: string;
  }): Promise<typeof ContentGenerationSchema._type> {
    // Check usage limits
    if (!this.checkUsageLimits(params.advisorId, 'generation')) {
      throw new Error('Daily content generation limit exceeded');
    }

    const systemPrompt = `You are a SEBI-compliant financial content generator for Indian financial advisors.
    
STRICT RULES:
1. NEVER promise guaranteed returns or use words like "assured", "guaranteed", "risk-free"
2. ALWAYS include appropriate risk disclaimers for investment content
3. ALWAYS mention reading scheme documents for mutual fund content
4. Use educational framing, not direct investment advice
5. Include EUIN: ${params.euin || 'EXXXXX'} where appropriate
6. For Hindi content, use simple Hindi with some English financial terms
7. Keep content under 280 characters for social media optimization

CONTENT GUIDELINES:
- Focus on financial education and awareness
- Use data and facts, not speculation
- Include relevant disclaimers naturally
- Make content engaging but compliant
- Add 2-3 relevant hashtags`;

    const userPrompt = `Generate ${params.category.replace('_', ' ')} content in ${params.language === 'hi' ? 'Hindi' : 'English'}.
Advisor: ${params.advisorName || 'Financial Advisor'}
Tone: ${params.tone || 'professional'}
Context: ${params.context || 'General financial advisory'}

Return a JSON object with:
- content: The main content text
- title: A catchy title (max 60 chars)
- category: The content category
- language: The language code
- risk_score: Compliance risk score (0-100, lower is safer)
- compliance_notes: Array of compliance considerations
- disclaimers: Array of required disclaimers
- hashtags: 2-3 relevant hashtags`;

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Update usage
      this.updateUsage(params.advisorId, 'generation');
      
      // Validate and return
      return ContentGenerationSchema.parse(result);
    } catch (error) {
      console.error('Content generation error:', error);
      // Fallback to template-based generation
      return this.generateFallbackContent(params);
    }
  }

  async checkCompliance(params: {
    advisorId: string;
    content: string;
    contentType: string;
    language: 'en' | 'hi';
  }): Promise<typeof ComplianceCheckSchema._type> {
    // Check usage limits
    if (!this.checkUsageLimits(params.advisorId, 'check')) {
      throw new Error('Daily compliance check limit exceeded');
    }

    // Check cache first
    const cacheKey = `compliance_${params.content}_${params.contentType}_${params.language}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const systemPrompt = `You are a SEBI compliance expert evaluating financial advisory content.

SEBI AD CODE VIOLATIONS TO CHECK:
1. Guaranteed returns or assured profit claims
2. Misleading or exaggerated statements
3. Selective disclosure of performance
4. Missing risk disclaimers
5. Unsubstantiated claims
6. Lack of EUIN/advisor identity
7. Direct stock tips without disclaimer
8. Promise of beating market returns

EVALUATION CRITERIA:
- Risk Score: 0-30 (Low/Green), 31-70 (Medium/Yellow), 71-100 (High/Red)
- Identify specific violations with severity
- Suggest fixes that maintain message intent
- Consider cultural context for ${params.language === 'hi' ? 'Hindi' : 'English'} content`;

    const userPrompt = `Analyze this financial content for SEBI compliance:

Content: "${params.content}"
Type: ${params.contentType}
Language: ${params.language}

Return a JSON object with:
- is_compliant: boolean
- risk_score: 0-100 (lower is safer)
- violations: array of {type, severity, description, suggestion}
- fixed_content: corrected version if violations found
- reasoning: explanation of the analysis
- confidence: 0-1 confidence in assessment`;

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Update usage
      this.updateUsage(params.advisorId, 'check');
      
      // Cache result
      this.setCache(cacheKey, result);
      
      // Validate and return
      return ComplianceCheckSchema.parse(result);
    } catch (error) {
      console.error('Compliance check error:', error);
      // Fallback to rules-based checking
      return this.performRulesBasedCompliance(params);
    }
  }

  async translateContent(params: {
    content: string;
    fromLang: 'en' | 'hi';
    toLang: 'en' | 'hi';
    preserveCompliance: boolean;
  }): Promise<{ translated: string; preserved_disclaimers: string[] }> {
    if (params.fromLang === params.toLang) {
      return { translated: params.content, preserved_disclaimers: [] };
    }

    const systemPrompt = `You are a financial content translator specializing in SEBI-compliant translations.
    
TRANSLATION RULES:
1. Preserve all disclaimers and risk warnings exactly
2. Keep financial terms that are commonly used in English (SIP, NAV, etc.)
3. Maintain the compliance level of the original content
4. Ensure cultural appropriateness
5. Keep EUIN and regulatory numbers unchanged`;

    const userPrompt = `Translate this financial content from ${params.fromLang === 'en' ? 'English to Hindi' : 'Hindi to English'}:

"${params.content}"

Preserve all compliance elements and disclaimers.`;

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const translated = completion.choices[0].message.content || params.content;
      
      // Extract preserved disclaimers
      const disclaimers = this.extractDisclaimers(translated);
      
      return { translated, preserved_disclaimers: disclaimers };
    } catch (error) {
      console.error('Translation error:', error);
      return { translated: params.content, preserved_disclaimers: [] };
    }
  }

  async generateContentSuggestions(params: {
    advisorId: string;
    category?: string;
    recentTopics?: string[];
  }): Promise<Array<{ title: string; description: string; category: string; keywords: string[] }>> {
    const systemPrompt = `Generate SEBI-compliant content ideas for Indian financial advisors.
Focus on educational, informative content that helps investors make informed decisions.`;

    const userPrompt = `Generate 5 content suggestions${params.category ? ` for ${params.category}` : ''}.
${params.recentTopics ? `Avoid these recent topics: ${params.recentTopics.join(', ')}` : ''}

Each suggestion should have:
- title: Engaging title
- description: Brief description
- category: Content category
- keywords: 3-4 relevant keywords`;

    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 600,
      });

      // Parse and structure the suggestions
      const content = completion.choices[0].message.content || '';
      return this.parseSuggestions(content);
    } catch (error) {
      console.error('Suggestions generation error:', error);
      return this.getDefaultSuggestions(params.category);
    }
  }

  async bulkGenerateContent(params: {
    advisorId: string;
    count: number;
    categories: string[];
    language: 'en' | 'hi';
  }): Promise<Array<typeof ContentGenerationSchema._type>> {
    const results: Array<typeof ContentGenerationSchema._type> = [];
    
    for (let i = 0; i < Math.min(params.count, 5); i++) {
      const category = params.categories[i % params.categories.length] as any;
      try {
        const content = await this.generateContent({
          advisorId: params.advisorId,
          category,
          language: params.language,
        });
        results.push(content);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Bulk generation error for item ${i}:`, error);
      }
    }
    
    return results;
  }

  // Helper methods
  private getCached(key: string): any {
    const cached = promptCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  private setCache(key: string, result: any) {
    promptCache.set(key, { result, timestamp: Date.now() });
    
    // Clean old cache entries
    if (promptCache.size > 1000) {
      const sortedEntries = Array.from(promptCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 100; i++) {
        promptCache.delete(sortedEntries[i][0]);
      }
    }
  }

  private generateFallbackContent(params: any): typeof ContentGenerationSchema._type {
    const templates = {
      market_update: {
        en: 'Markets showed mixed trends today. Investors advised to stay focused on long-term goals. Market investments subject to risks.',
        hi: 'आज बाज़ार में मिश्रित रुझान रहे। निवेशकों को दीर्घकालिक लक्ष्यों पर ध्यान देने की सलाह। बाज़ार जोखिम के अधीन।'
      },
      investment_tips: {
        en: 'Start SIP for disciplined investing. Diversification helps manage risk. Read all scheme documents carefully.',
        hi: 'अनुशासित निवेश के लिए SIP शुरू करें। विविधीकरण जोखिम प्रबंधन में मदद करता है। सभी योजना दस्तावेज़ ध्यान से पढ़ें।'
      },
      tax_planning: {
        en: 'Plan taxes early. Explore 80C options like ELSS, PPF. Consult tax advisor for personalized planning.',
        hi: 'समय पर कर योजना बनाएं। ELSS, PPF जैसे 80C विकल्प देखें। व्यक्तिगत योजना के लिए कर सलाहकार से परामर्श लें।'
      },
      educational: {
        en: 'Understanding compound interest helps in wealth creation. Start early, stay invested. Subject to market risks.',
        hi: 'चक्रवृद्धि ब्याज समझना धन सृजन में मदद करता है। जल्दी शुरू करें, निवेशित रहें। बाज़ार जोखिम के अधीन।'
      }
    };

    const category = params.category || 'educational';
    const language = params.language || 'en';
    const content = templates[category]?.[language] || templates.educational.en;

    return {
      content,
      title: `${category.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`,
      category,
      language,
      risk_score: 15,
      compliance_notes: ['Template content', 'Pre-approved'],
      disclaimers: ['Market investments are subject to market risks'],
      hashtags: ['#FinancialLiteracy', '#InvestmentTips', '#WealthCreation']
    };
  }

  private performRulesBasedCompliance(params: any): typeof ComplianceCheckSchema._type {
    const prohibitedTerms = [
      'guaranteed', 'assured', 'risk-free', 'definitely', 'certainly',
      '100% safe', 'no loss', 'double your money', 'get rich quick'
    ];
    
    const violations: any[] = [];
    const contentLower = params.content.toLowerCase();
    
    prohibitedTerms.forEach(term => {
      if (contentLower.includes(term)) {
        violations.push({
          type: 'PROHIBITED_TERM',
          severity: 'high',
          description: `Prohibited term found: "${term}"`,
          suggestion: `Remove or replace "${term}" with compliant language`
        });
      }
    });

    const hasDisclaimer = contentLower.includes('risk') || contentLower.includes('disclaimer');
    if (!hasDisclaimer && contentLower.includes('invest')) {
      violations.push({
        type: 'MISSING_DISCLAIMER',
        severity: 'medium',
        description: 'Missing risk disclaimer',
        suggestion: 'Add "Subject to market risks" disclaimer'
      });
    }

    const riskScore = Math.min(100, violations.length * 25);
    
    return {
      is_compliant: violations.length === 0,
      risk_score: riskScore,
      violations,
      fixed_content: violations.length > 0 ? this.fixContent(params.content, violations) : undefined,
      reasoning: `Rules-based check found ${violations.length} violation(s)`,
      confidence: 0.85
    };
  }

  private fixContent(content: string, violations: any[]): string {
    let fixed = content;
    
    // Simple replacement logic
    const replacements = {
      'guaranteed': 'potential',
      'assured': 'possible',
      'risk-free': 'lower-risk',
      'definitely': 'likely to',
      '100% safe': 'relatively safer'
    };
    
    Object.entries(replacements).forEach(([bad, good]) => {
      fixed = fixed.replace(new RegExp(bad, 'gi'), good);
    });
    
    // Add disclaimer if missing
    if (!fixed.toLowerCase().includes('risk')) {
      fixed += ' | Mutual fund investments are subject to market risks.';
    }
    
    return fixed;
  }

  private extractDisclaimers(content: string): string[] {
    const disclaimerPatterns = [
      /subject to market risk[s]?/gi,
      /read all scheme.+documents/gi,
      /past performance.+future/gi,
      /consult.+advisor/gi
    ];
    
    const found: string[] = [];
    disclaimerPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) found.push(...matches);
    });
    
    return found;
  }

  private parseSuggestions(content: string): Array<{ title: string; description: string; category: string; keywords: string[] }> {
    // Simple parsing logic - in production, use structured output
    const suggestions = [];
    const lines = content.split('\n').filter(l => l.trim());
    
    for (let i = 0; i < lines.length; i += 4) {
      if (i + 3 < lines.length) {
        suggestions.push({
          title: lines[i].replace(/^\d+\.\s*/, '').trim(),
          description: lines[i + 1].trim(),
          category: 'educational',
          keywords: ['finance', 'investment', 'planning']
        });
      }
    }
    
    return suggestions.slice(0, 5);
  }

  private getDefaultSuggestions(category?: string): Array<{ title: string; description: string; category: string; keywords: string[] }> {
    return [
      {
        title: 'Understanding Systematic Investment Plans',
        description: 'How SIPs help in rupee cost averaging',
        category: category || 'educational',
        keywords: ['SIP', 'mutual funds', 'investing']
      },
      {
        title: 'Tax Saving Through ELSS',
        description: 'Maximize 80C benefits with equity funds',
        category: category || 'tax_planning',
        keywords: ['ELSS', '80C', 'tax saving']
      },
      {
        title: 'Portfolio Diversification Strategies',
        description: 'Spread risk across asset classes',
        category: category || 'investment_tips',
        keywords: ['diversification', 'portfolio', 'risk management']
      },
      {
        title: 'Market Volatility and Long-term Investing',
        description: 'Why patience pays in equity markets',
        category: category || 'market_update',
        keywords: ['volatility', 'long-term', 'equity']
      },
      {
        title: 'Emergency Fund Planning',
        description: 'Build financial cushion for uncertainties',
        category: category || 'educational',
        keywords: ['emergency fund', 'financial planning', 'savings']
      }
    ];
  }
}

export default OpenAIService;