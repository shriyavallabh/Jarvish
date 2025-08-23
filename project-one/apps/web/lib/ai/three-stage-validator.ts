import { OpenAIService, ComplianceCheckSchema } from './openai-service';
import SEBIComplianceValidator from '../validators/sebi-compliance';

export interface ValidationStage {
  stage: number;
  name: string;
  passed: boolean;
  violations: string[];
  suggestions: string[];
  executionTime: number;
}

export interface ThreeStageValidationResult {
  isCompliant: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  colorCode: 'green' | 'yellow' | 'red';
  stages: ValidationStage[];
  finalContent?: string;
  totalExecutionTime: number;
  fallbackUsed: boolean;
  violations: Array<{
    type: string;
    severity: string;
    description: string;
    stage: number;
  }>;
  suggestions: string[];
  auditLog: {
    timestamp: string;
    contentHash: string;
    advisorId: string;
    stages: ValidationStage[];
  };
}

export class ThreeStageValidator {
  private openAIService: OpenAIService;
  private sebiValidator: SEBIComplianceValidator;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    this.openAIService = new OpenAIService();
    this.sebiValidator = new SEBIComplianceValidator();
  }

  async validate(params: {
    content: string;
    contentType: string;
    language: 'en' | 'hi';
    advisorId: string;
    euin?: string;
    strictMode?: boolean;
  }): Promise<ThreeStageValidationResult> {
    const startTime = Date.now();
    const stages: ValidationStage[] = [];
    const allViolations: ThreeStageValidationResult['violations'] = [];
    const allSuggestions: string[] = [];
    let finalContent = params.content;
    let fallbackUsed = false;

    // Stage 1: Hard Rules Engine
    const stage1Start = Date.now();
    const stage1Result = await this.runStage1RulesEngine(params.content, params.language);
    stages.push({
      stage: 1,
      name: 'Hard Rules Engine',
      passed: stage1Result.passed,
      violations: stage1Result.violations,
      suggestions: stage1Result.suggestions,
      executionTime: Date.now() - stage1Start
    });

    // Add stage 1 violations
    stage1Result.violations.forEach(v => {
      allViolations.push({
        type: 'RULE_VIOLATION',
        severity: stage1Result.immediateBlock ? 'critical' : 'high',
        description: v,
        stage: 1
      });
    });
    allSuggestions.push(...stage1Result.suggestions);

    // If critical violations found, stop here
    if (stage1Result.immediateBlock) {
      return this.buildResult({
        isCompliant: false,
        riskScore: 100,
        stages,
        finalContent: undefined,
        totalExecutionTime: Date.now() - startTime,
        fallbackUsed,
        violations: allViolations,
        suggestions: allSuggestions,
        params
      });
    }

    // Stage 2: AI Semantic Analysis
    const stage2Start = Date.now();
    let stage2Result;
    
    try {
      // Set timeout for AI call
      const aiPromise = this.openAIService.checkCompliance({
        advisorId: params.advisorId,
        content: finalContent,
        contentType: params.contentType,
        language: params.language
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI timeout')), 1500)
      );
      
      stage2Result = await Promise.race([aiPromise, timeoutPromise]) as typeof ComplianceCheckSchema._type;
      
      stages.push({
        stage: 2,
        name: 'AI Semantic Analysis',
        passed: stage2Result.is_compliant,
        violations: stage2Result.violations.map(v => v.description),
        suggestions: stage2Result.violations.map(v => v.suggestion),
        executionTime: Date.now() - stage2Start
      });

      // Add AI violations
      stage2Result.violations.forEach(v => {
        allViolations.push({
          type: v.type,
          severity: v.severity,
          description: v.description,
          stage: 2
        });
      });
      allSuggestions.push(...stage2Result.violations.map(v => v.suggestion));

      // Use AI-fixed content if available
      if (stage2Result.fixed_content) {
        finalContent = stage2Result.fixed_content;
      }
    } catch (error) {
      console.error('Stage 2 AI error, using fallback:', error);
      fallbackUsed = true;
      
      // Fallback to enhanced rules checking
      stage2Result = this.performEnhancedRulesCheck(finalContent, params.language);
      stages.push({
        stage: 2,
        name: 'AI Analysis (Fallback)',
        passed: stage2Result.passed,
        violations: stage2Result.violations,
        suggestions: stage2Result.suggestions,
        executionTime: Date.now() - stage2Start
      });
    }

    // Stage 3: Final Verification
    const stage3Start = Date.now();
    const stage3Result = await this.runStage3FinalVerification(
      finalContent, 
      params.language,
      params.euin
    );
    
    stages.push({
      stage: 3,
      name: 'Final Verification',
      passed: stage3Result.passed,
      violations: stage3Result.violations,
      suggestions: stage3Result.suggestions,
      executionTime: Date.now() - stage3Start
    });

    // Add stage 3 violations
    stage3Result.violations.forEach(v => {
      allViolations.push({
        type: 'FINAL_CHECK',
        severity: 'medium',
        description: v,
        stage: 3
      });
    });
    allSuggestions.push(...stage3Result.suggestions);

    // Calculate final risk score
    const riskScore = this.calculateRiskScore(allViolations, stages);

    return this.buildResult({
      isCompliant: allViolations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      riskScore,
      stages,
      finalContent: riskScore < 70 ? finalContent : undefined,
      totalExecutionTime: Date.now() - startTime,
      fallbackUsed,
      violations: allViolations,
      suggestions: [...new Set(allSuggestions)], // Remove duplicates
      params
    });
  }

  private async runStage1RulesEngine(content: string, language: 'en' | 'hi'): Promise<{
    passed: boolean;
    violations: string[];
    suggestions: string[];
    immediateBlock: boolean;
  }> {
    const violations: string[] = [];
    const suggestions: string[] = [];
    const contentLower = content.toLowerCase();

    // Critical prohibited terms (immediate block)
    const criticalTerms = [
      'guaranteed returns',
      'assured profit',
      'no risk',
      'risk free',
      '100% safe',
      'double your money',
      'get rich quick',
      'insider information',
      'hot tip'
    ];

    // Check critical terms
    let immediateBlock = false;
    for (const term of criticalTerms) {
      if (contentLower.includes(term)) {
        violations.push(`Critical violation: "${term}" is strictly prohibited`);
        immediateBlock = true;
      }
    }

    // Moderate violations
    const moderateTerms = [
      { term: 'best returns', suggestion: 'Use "competitive returns" instead' },
      { term: 'highest growth', suggestion: 'Use "strong growth potential" instead' },
      { term: 'no loss', suggestion: 'Use "capital protection focused" instead' },
      { term: 'definitely', suggestion: 'Use "likely" or "potentially" instead' }
    ];

    for (const { term, suggestion } of moderateTerms) {
      if (contentLower.includes(term)) {
        violations.push(`Moderate violation: "${term}" should be avoided`);
        suggestions.push(suggestion);
      }
    }

    // Check for required elements
    const hasInvestmentContent = contentLower.includes('invest') || 
                                 contentLower.includes('mutual fund') ||
                                 contentLower.includes('stock') ||
                                 contentLower.includes('equity');

    if (hasInvestmentContent) {
      // Check for risk disclaimer
      const hasRiskDisclaimer = contentLower.includes('risk') || 
                                contentLower.includes('disclaimer');
      if (!hasRiskDisclaimer) {
        violations.push('Missing required risk disclaimer');
        suggestions.push('Add "Subject to market risks" disclaimer');
      }

      // Check for scheme document mention (for mutual funds)
      if (contentLower.includes('mutual fund')) {
        const hasSchemeDoc = contentLower.includes('scheme') && 
                            contentLower.includes('document');
        if (!hasSchemeDoc) {
          violations.push('Missing scheme document disclaimer');
          suggestions.push('Add "Please read scheme documents carefully"');
        }
      }
    }

    // Check emoji usage (max 3 emojis)
    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 3) {
      violations.push(`Excessive emoji usage (${emojiCount} found, max 3 allowed)`);
      suggestions.push('Reduce emoji usage to maximum 3');
    }

    // Check content length
    if (content.length > 2000) {
      violations.push('Content exceeds maximum length of 2000 characters');
      suggestions.push('Shorten content to under 2000 characters');
    }

    return {
      passed: violations.length === 0,
      violations,
      suggestions,
      immediateBlock
    };
  }

  private performEnhancedRulesCheck(content: string, language: 'en' | 'hi'): any {
    const violations: string[] = [];
    const suggestions: string[] = [];
    const contentLower = content.toLowerCase();

    // Extended prohibited patterns
    const patterns = [
      { regex: /\d+%\s*(return|profit|gain)/gi, violation: 'Specific return percentage mentioned' },
      { regex: /multiply\s+your\s+money/gi, violation: 'Multiplication claims found' },
      { regex: /beat\s+the\s+market/gi, violation: 'Market-beating claims' },
      { regex: /limited\s+time\s+offer/gi, violation: 'Urgency tactics used' }
    ];

    for (const { regex, violation } of patterns) {
      if (regex.test(content)) {
        violations.push(violation);
        suggestions.push('Remove or rephrase performance claims');
      }
    }

    // Check for balanced content
    const hasPositive = /growth|profit|gain|return/gi.test(content);
    const hasRisk = /risk|volatile|loss|caution/gi.test(content);
    
    if (hasPositive && !hasRisk) {
      violations.push('Unbalanced content - missing risk considerations');
      suggestions.push('Add balanced view with risk mentions');
    }

    return {
      passed: violations.length === 0,
      violations,
      suggestions,
      is_compliant: violations.length === 0,
      risk_score: Math.min(100, violations.length * 20),
      confidence: 0.75
    };
  }

  private async runStage3FinalVerification(
    content: string, 
    language: 'en' | 'hi',
    euin?: string
  ): Promise<{
    passed: boolean;
    violations: string[];
    suggestions: string[];
  }> {
    const violations: string[] = [];
    const suggestions: string[] = [];

    // Verify EUIN presence if required
    if (euin && !content.includes(euin)) {
      violations.push('EUIN not present in content');
      suggestions.push(`Add EUIN: ${euin} to the content`);
    }

    // Verify language consistency
    if (language === 'hi') {
      // Check if content has sufficient Hindi text
      const hindiCharPattern = /[\u0900-\u097F]/g;
      const hindiChars = (content.match(hindiCharPattern) || []).length;
      const totalChars = content.length;
      
      if (hindiChars / totalChars < 0.3) {
        violations.push('Insufficient Hindi content for Hindi language selection');
        suggestions.push('Increase Hindi text or switch to English');
      }
    }

    // Final compliance check using existing validator
    const sebiResult = await this.sebiValidator.validateContent(content);
    if (!sebiResult.isCompliant && sebiResult.violations) {
      violations.push(...sebiResult.violations);
    }
    if (sebiResult.recommendations) {
      suggestions.push(...sebiResult.recommendations);
    }

    // Check for proper formatting
    if (content.length < 20) {
      violations.push('Content too short to be meaningful');
      suggestions.push('Expand content with more details');
    }

    // Verify no suspicious patterns
    const suspiciousPatterns = [
      /call\s+now/gi,
      /limited\s+seats/gi,
      /act\s+fast/gi,
      /whatsapp\s+me/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        violations.push('Suspicious call-to-action pattern detected');
        suggestions.push('Remove aggressive call-to-action language');
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      suggestions
    };
  }

  private calculateRiskScore(
    violations: ThreeStageValidationResult['violations'],
    stages: ValidationStage[]
  ): number {
    let score = 0;
    
    // Weight violations by severity
    const severityWeights = {
      critical: 40,
      high: 25,
      medium: 15,
      low: 10
    };

    violations.forEach(v => {
      score += severityWeights[v.severity as keyof typeof severityWeights] || 10;
    });

    // Add penalty for failed stages
    stages.forEach(stage => {
      if (!stage.passed) {
        score += 10;
      }
    });

    // Cap at 100
    return Math.min(100, score);
  }

  private buildResult(data: any): ThreeStageValidationResult {
    const riskScore = data.riskScore;
    let riskLevel: ThreeStageValidationResult['riskLevel'];
    let colorCode: ThreeStageValidationResult['colorCode'];

    if (riskScore <= 30) {
      riskLevel = 'low';
      colorCode = 'green';
    } else if (riskScore <= 70) {
      riskLevel = 'medium';
      colorCode = 'yellow';
    } else if (riskScore <= 90) {
      riskLevel = 'high';
      colorCode = 'red';
    } else {
      riskLevel = 'critical';
      colorCode = 'red';
    }

    // Create content hash for audit
    const contentHash = this.hashContent(data.params.content);

    return {
      isCompliant: data.isCompliant,
      riskScore,
      riskLevel,
      colorCode,
      stages: data.stages,
      finalContent: data.finalContent,
      totalExecutionTime: data.totalExecutionTime,
      fallbackUsed: data.fallbackUsed,
      violations: data.violations,
      suggestions: data.suggestions,
      auditLog: {
        timestamp: new Date().toISOString(),
        contentHash,
        advisorId: data.params.advisorId,
        stages: data.stages
      }
    };
  }

  private hashContent(content: string): string {
    // Simple hash function for demo - use crypto in production
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }

  // Performance tracking
  trackPerformance(advisorId: string, executionTime: number) {
    const metrics = this.performanceMetrics.get(advisorId) || [];
    metrics.push(executionTime);
    
    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    this.performanceMetrics.set(advisorId, metrics);
  }

  getPerformanceMetrics(advisorId: string): {
    avgTime: number;
    p95Time: number;
    totalChecks: number;
  } {
    const metrics = this.performanceMetrics.get(advisorId) || [];
    
    if (metrics.length === 0) {
      return { avgTime: 0, p95Time: 0, totalChecks: 0 };
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    const p95Index = Math.floor(metrics.length * 0.95);
    
    return {
      avgTime: avg,
      p95Time: sorted[p95Index] || sorted[sorted.length - 1],
      totalChecks: metrics.length
    };
  }
}

export default ThreeStageValidator;