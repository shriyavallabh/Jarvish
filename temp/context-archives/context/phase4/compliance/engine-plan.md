# Compliance Engine Implementation Plan 🛡️

## Overview
Comprehensive implementation plan for Project One's 3-stage compliance engine, including rule execution order, AI integration, caching strategies, and SEBI compliance validation pipeline.

## 3-Stage Compliance Pipeline Architecture

### Pipeline Overview
```yaml
compliance_pipeline:
  stage_1_rule_validation:
    purpose: "Fast rule-based filtering of obvious violations"
    execution_time: "<500ms"
    cache_strategy: "aggressive_pattern_matching_cache"
    pass_criteria: "zero_critical_violations"
    
  stage_2_ai_analysis:
    purpose: "Contextual analysis of content tone and implications" 
    execution_time: "<2000ms"
    model: "gpt-4o-mini"
    pass_criteria: "ai_confidence >0.85 AND risk_score <75"
    
  stage_3_final_validation:
    purpose: "Composite scoring and human escalation logic"
    execution_time: "<300ms"
    output: "final_risk_score_0_to_100"
    escalation_triggers: "score >50 OR new_advisor OR pattern_anomalies"
```

### Execution Flow Control
```typescript
// compliance/engines/pipeline-orchestrator.ts
import { Injectable, Logger } from '@nestjs/common'
import { RuleEngine } from './rule-engine'
import { AiEngine } from './ai-engine'
import { ValidationEngine } from './validation-engine'
import { ComplianceCacheService } from '../services/compliance-cache.service'

export interface PipelineContext {
  content: string
  advisorId?: string
  advisorTier?: string
  advisorAge?: number // days since registration
  language: 'en' | 'hi' | 'mr'
  contentType: string
  requestId: string
}

export interface PipelineResult {
  finalRiskScore: number
  status: 'approved' | 'rejected' | 'escalate'
  violations: string[]
  suggestions: string[]
  confidence: number
  executionTimeMs: number
  stagesExecuted: number
  cacheHits: number
}

@Injectable()
export class CompliancePipelineOrchestrator {
  private readonly logger = new Logger(CompliancePipelineOrchestrator.name)

  constructor(
    private ruleEngine: RuleEngine,
    private aiEngine: AiEngine,
    private validationEngine: ValidationEngine,
    private cacheService: ComplianceCacheService,
  ) {}

  async execute(context: PipelineContext): Promise<PipelineResult> {
    const startTime = Date.now()
    const result: Partial<PipelineResult> = {
      violations: [],
      suggestions: [],
      cacheHits: 0,
      stagesExecuted: 0,
    }

    this.logger.log(`Starting compliance pipeline for request ${context.requestId}`)

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(context)
      const cachedResult = await this.cacheService.get(cacheKey)
      if (cachedResult) {
        result.cacheHits = 1
        this.logger.debug(`Cache hit for ${context.requestId}`)
        return { ...cachedResult, executionTimeMs: Date.now() - startTime }
      }

      // Stage 1: Rule-based validation (always executed)
      const stage1Result = await this.executeStage1(context)
      result.stagesExecuted = 1
      result.violations.push(...stage1Result.violations)
      result.suggestions.push(...stage1Result.suggestions)

      this.logger.debug(`Stage 1 complete: ${stage1Result.violations.length} violations, risk: ${stage1Result.riskScore}`)

      // Early exit for high-risk content
      if (stage1Result.riskScore >= 80) {
        const finalResult = {
          finalRiskScore: stage1Result.riskScore,
          status: 'rejected' as const,
          violations: result.violations,
          suggestions: result.suggestions,
          confidence: 1.0, // High confidence in rule-based rejection
          executionTimeMs: Date.now() - startTime,
          stagesExecuted: result.stagesExecuted,
          cacheHits: result.cacheHits,
        }

        await this.cacheService.set(cacheKey, finalResult, 3600) // Cache for 1 hour
        return finalResult
      }

      // Stage 2: AI analysis (conditional execution)
      let stage2Result = null
      if (this.shouldExecuteStage2(stage1Result, context)) {
        stage2Result = await this.executeStage2(context, stage1Result)
        result.stagesExecuted = 2
        
        this.logger.debug(`Stage 2 complete: AI confidence ${stage2Result.confidence}, risk: ${stage2Result.riskScore}`)
      }

      // Stage 3: Final validation and scoring
      const stage3Result = await this.executeStage3(context, stage1Result, stage2Result)
      result.stagesExecuted = Math.max(result.stagesExecuted, 3)

      const finalResult = {
        finalRiskScore: stage3Result.finalRiskScore,
        status: stage3Result.status,
        violations: [...result.violations, ...stage3Result.violations],
        suggestions: [...result.suggestions, ...stage3Result.suggestions],
        confidence: stage3Result.confidence,
        executionTimeMs: Date.now() - startTime,
        stagesExecuted: result.stagesExecuted,
        cacheHits: result.cacheHits,
      }

      // Cache successful results
      if (finalResult.status !== 'escalate') {
        await this.cacheService.set(cacheKey, finalResult, 1800) // Cache for 30 minutes
      }

      this.logger.log(`Pipeline complete for ${context.requestId}: ${finalResult.status} (${finalResult.finalRiskScore}/100)`)
      return finalResult

    } catch (error) {
      this.logger.error(`Pipeline failed for ${context.requestId}: ${error.message}`, error.stack)
      
      return {
        finalRiskScore: 100,
        status: 'escalate',
        violations: ['pipeline_error'],
        suggestions: ['Content could not be validated. Manual review required.'],
        confidence: 0,
        executionTimeMs: Date.now() - startTime,
        stagesExecuted: result.stagesExecuted,
        cacheHits: result.cacheHits,
      }
    }
  }

  private shouldExecuteStage2(stage1Result: any, context: PipelineContext): boolean {
    // Skip AI analysis for very low-risk content
    if (stage1Result.riskScore < 10) return false
    
    // Always run for new advisors (first 30 days)
    if (context.advisorAge && context.advisorAge < 30) return true
    
    // Always run for medium risk content
    if (stage1Result.riskScore >= 25) return true
    
    // Skip for trusted advisors with consistent low-risk content
    return true // Default to running AI analysis
  }

  private generateCacheKey(context: PipelineContext): string {
    const contentHash = require('crypto')
      .createHash('sha256')
      .update(context.content)
      .digest('hex')
      .substring(0, 16)
    
    return `compliance:${contentHash}:${context.language}:${context.contentType}`
  }

  private async executeStage1(context: PipelineContext) {
    return this.ruleEngine.validate(context.content, context.language)
  }

  private async executeStage2(context: PipelineContext, stage1Result: any) {
    return this.aiEngine.analyze(context.content, {
      language: context.language,
      advisorTier: context.advisorTier,
      stage1Violations: stage1Result.violations,
      contentType: context.contentType,
    })
  }

  private async executeStage3(context: PipelineContext, stage1Result: any, stage2Result: any) {
    return this.validationEngine.finalValidation({
      content: context.content,
      advisorId: context.advisorId,
      stage1Result,
      stage2Result,
      context,
    })
  }
}
```

## Stage 1: Rule Engine Implementation

### Rule Engine Architecture
```typescript
// compliance/engines/rule-engine.ts
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SebiRuleSet } from '../rules/sebi-rule-set'
import { RegexPatternLibrary } from '../rules/regex-pattern-library'
import { LanguageDetector } from '../utils/language-detector'

export interface RuleValidationResult {
  riskScore: number
  violations: Array<{
    type: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    description: string
    suggestion: string
    position?: { start: number; end: number }
  }>
  suggestions: string[]
  executionTimeMs: number
}

@Injectable()
export class RuleEngine {
  private readonly logger = new Logger(RuleEngine.name)
  private sebiRules: SebiRuleSet
  private regexLibrary: RegexPatternLibrary
  private languageDetector: LanguageDetector

  constructor(private configService: ConfigService) {
    this.sebiRules = new SebiRuleSet()
    this.regexLibrary = new RegexPatternLibrary()
    this.languageDetector = new LanguageDetector()
  }

  async validate(content: string, language: string = 'en'): Promise<RuleValidationResult> {
    const startTime = Date.now()
    const violations: RuleValidationResult['violations'] = []
    const suggestions: string[] = []

    this.logger.debug(`Starting rule validation for ${content.length} characters in ${language}`)

    // 1. Critical violations (immediate rejection)
    const criticalViolations = await this.checkCriticalViolations(content, language)
    violations.push(...criticalViolations)

    // 2. Forbidden terms detection
    const forbiddenTerms = await this.checkForbiddenTerms(content, language)
    violations.push(...forbiddenTerms)

    // 3. Required disclosures
    const disclosureViolations = await this.checkRequiredDisclosures(content, language)
    violations.push(...disclosureViolations)

    // 4. Misleading claims detection
    const misleadingClaims = await this.checkMisleadingClaims(content, language)
    violations.push(...misleadingClaims)

    // 5. Tone and language appropriateness
    const toneViolations = await this.checkToneAppropriate(content, language)
    violations.push(...toneViolations)

    // Calculate risk score based on violation severity
    const riskScore = this.calculateRiskScore(violations)

    // Generate suggestions
    suggestions.push(...this.generateSuggestions(violations))

    const executionTimeMs = Date.now() - startTime
    this.logger.debug(`Rule validation complete in ${executionTimeMs}ms, risk score: ${riskScore}`)

    return {
      riskScore,
      violations,
      suggestions,
      executionTimeMs,
    }
  }

  private async checkCriticalViolations(content: string, language: string) {
    const violations = []

    // Check for guarantee language
    const guaranteePatterns = this.regexLibrary.getGuaranteePatterns(language)
    for (const pattern of guaranteePatterns) {
      const matches = content.match(pattern.regex)
      if (matches) {
        violations.push({
          type: 'guarantee_language',
          severity: 'critical' as const,
          description: `Contains guarantee language: "${matches[0]}"`,
          suggestion: pattern.suggestion,
          position: this.findPosition(content, matches[0]),
        })
      }
    }

    // Check for risk-free claims
    const riskFreePatterns = this.regexLibrary.getRiskFreePatterns(language)
    for (const pattern of riskFreePatterns) {
      const matches = content.match(pattern.regex)
      if (matches) {
        violations.push({
          type: 'risk_free_claim',
          severity: 'critical' as const,
          description: `Contains risk-free claim: "${matches[0]}"`,
          suggestion: pattern.suggestion,
          position: this.findPosition(content, matches[0]),
        })
      }
    }

    // Check for specific return promises
    const returnPromisePatterns = this.regexLibrary.getReturnPromisePatterns(language)
    for (const pattern of returnPromisePatterns) {
      const matches = content.match(pattern.regex)
      if (matches) {
        violations.push({
          type: 'return_promise',
          severity: 'critical' as const,
          description: `Contains specific return promise: "${matches[0]}"`,
          suggestion: pattern.suggestion,
          position: this.findPosition(content, matches[0]),
        })
      }
    }

    return violations
  }

  private async checkForbiddenTerms(content: string, language: string) {
    const violations = []
    const forbiddenTermsConfig = this.sebiRules.getForbiddenTerms(language)

    for (const category in forbiddenTermsConfig) {
      const terms = forbiddenTermsConfig[category]
      for (const term of terms) {
        const regex = new RegExp(`\\b${term.pattern}\\b`, 'gi')
        const matches = content.match(regex)
        if (matches) {
          violations.push({
            type: `forbidden_term_${category}`,
            severity: term.severity,
            description: `Contains forbidden term: "${matches[0]}"`,
            suggestion: term.replacement || `Replace "${matches[0]}" with compliant alternative`,
            position: this.findPosition(content, matches[0]),
          })
        }
      }
    }

    return violations
  }

  private async checkRequiredDisclosures(content: string, language: string) {
    const violations = []
    const requiredDisclosures = this.sebiRules.getRequiredDisclosures(language)

    for (const disclosure of requiredDisclosures) {
      const hasDisclosure = disclosure.patterns.some(pattern => 
        new RegExp(pattern, 'i').test(content)
      )

      if (!hasDisclosure && this.contentRequiresDisclosure(content, disclosure.triggers)) {
        violations.push({
          type: `missing_disclosure_${disclosure.type}`,
          severity: disclosure.severity,
          description: `Missing required disclosure: ${disclosure.description}`,
          suggestion: `Add disclosure: "${disclosure.template}"`,
        })
      }
    }

    return violations
  }

  private async checkMisleadingClaims(content: string, language: string) {
    const violations = []
    const misleadingPatterns = this.regexLibrary.getMisleadingClaimPatterns(language)

    for (const pattern of misleadingPatterns) {
      const matches = content.match(pattern.regex)
      if (matches) {
        violations.push({
          type: 'misleading_claim',
          severity: pattern.severity,
          description: `Potentially misleading claim: "${matches[0]}"`,
          suggestion: pattern.suggestion,
          position: this.findPosition(content, matches[0]),
        })
      }
    }

    return violations
  }

  private async checkToneAppropriate(content: string, language: string) {
    const violations = []

    // Check for overly promotional language
    const promotionalPatterns = this.regexLibrary.getPromotionalLanguagePatterns(language)
    let promotionalCount = 0

    for (const pattern of promotionalPatterns) {
      const matches = content.match(pattern.regex)
      if (matches) {
        promotionalCount += matches.length
      }
    }

    if (promotionalCount > 3) {
      violations.push({
        type: 'overly_promotional',
        severity: 'medium' as const,
        description: 'Content contains excessive promotional language',
        suggestion: 'Reduce promotional tone and focus on educational content',
      })
    }

    // Check for urgency language that may pressure clients
    const urgencyPatterns = this.regexLibrary.getUrgencyPatterns(language)
    for (const pattern of urgencyPatterns) {
      const matches = content.match(pattern.regex)
      if (matches) {
        violations.push({
          type: 'pressure_language',
          severity: 'high' as const,
          description: `Contains pressure language: "${matches[0]}"`,
          suggestion: 'Remove urgency language that may pressure clients',
          position: this.findPosition(content, matches[0]),
        })
      }
    }

    return violations
  }

  private calculateRiskScore(violations: RuleValidationResult['violations']): number {
    let score = 0

    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical':
          score += 40
          break
        case 'high':
          score += 25
          break
        case 'medium':
          score += 15
          break
        case 'low':
          score += 5
          break
      }
    }

    return Math.min(score, 100)
  }

  private generateSuggestions(violations: RuleValidationResult['violations']): string[] {
    const suggestions = violations.map(v => v.suggestion).filter(Boolean)
    
    // Add general suggestions based on violation patterns
    const hasGuarantees = violations.some(v => v.type === 'guarantee_language')
    const hasRiskFree = violations.some(v => v.type === 'risk_free_claim')
    const missingDisclosures = violations.filter(v => v.type.startsWith('missing_disclosure'))

    if (hasGuarantees || hasRiskFree) {
      suggestions.unshift('Use words like "potential", "may", or "historically" instead of definitive statements')
    }

    if (missingDisclosures.length > 0) {
      suggestions.push('All investment content must include appropriate risk disclaimers')
    }

    return [...new Set(suggestions)] // Remove duplicates
  }

  private contentRequiresDisclosure(content: string, triggers: string[]): boolean {
    return triggers.some(trigger => new RegExp(trigger, 'i').test(content))
  }

  private findPosition(content: string, term: string): { start: number; end: number } {
    const index = content.toLowerCase().indexOf(term.toLowerCase())
    return index >= 0 ? { start: index, end: index + term.length } : { start: -1, end: -1 }
  }
}
```

### SEBI Rule Set Implementation
```typescript
// compliance/rules/sebi-rule-set.ts
export class SebiRuleSet {
  private rules = {
    en: {
      forbiddenTerms: {
        guarantees: [
          { pattern: 'guaranteed?', severity: 'critical', replacement: 'potential' },
          { pattern: 'sure.?shot', severity: 'critical', replacement: 'historically strong' },
          { pattern: 'risk.?free', severity: 'critical', replacement: 'lower-risk' },
          { pattern: 'no.?risk', severity: 'critical', replacement: 'managed risk' },
          { pattern: 'safe.?bet', severity: 'high', replacement: 'conservative option' },
        ],
        misleading: [
          { pattern: 'get.?rich.?quick', severity: 'critical' },
          { pattern: 'double.?your.?money', severity: 'critical' },
          { pattern: 'overnight.?success', severity: 'high' },
          { pattern: 'instant.?wealth', severity: 'high' },
        ],
        pressure: [
          { pattern: 'limited.?time', severity: 'high' },
          { pattern: 'act.?now', severity: 'high' },
          { pattern: 'hurry.?up', severity: 'medium' },
          { pattern: 'don.?t.?miss.?out', severity: 'medium' },
        ],
      },
      requiredDisclosures: [
        {
          type: 'mutual_fund_risk',
          description: 'Mutual fund risk disclaimer',
          template: 'Mutual funds are subject to market risks. Please read the scheme documents carefully before investing.',
          triggers: ['mutual.?fund', 'sip', 'systematic.?investment', 'equity', 'debt.?fund'],
          patterns: ['subject.?to.?market.?risks?', 'read.*scheme.*documents?', 'past.?performance.*not.*indicate'],
          severity: 'high',
        },
        {
          type: 'past_performance',
          description: 'Past performance disclaimer',
          template: 'Past performance may not indicate future results.',
          triggers: ['return', 'performance', '\\d+%', 'year.*return'],
          patterns: ['past.?performance.*not.*indicate', 'historical.*not.*guarantee'],
          severity: 'medium',
        },
        {
          type: 'advisor_registration',
          description: 'Advisor SEBI registration',
          template: 'This content is provided by a SEBI registered investment advisor.',
          triggers: ['advice', 'recommend', 'suggest.*invest'],
          patterns: ['sebi.?registered', 'investment.?advisor', 'arn.*\\d+', 'ria.*\\d+'],
          severity: 'medium',
        },
      ],
    },
    hi: {
      forbiddenTerms: {
        guarantees: [
          { pattern: 'गारंटी', severity: 'critical', replacement: 'संभावना' },
          { pattern: 'पक्का', severity: 'critical', replacement: 'आम तौर पर' },
          { pattern: 'जोखिम.?मुक्त', severity: 'critical', replacement: 'कम जोखिम' },
        ],
        misleading: [
          { pattern: 'रातों.?रात.?अमीर', severity: 'critical' },
          { pattern: 'दोगुना.?पैसा', severity: 'critical' },
        ],
      },
      requiredDisclosures: [
        {
          type: 'mutual_fund_risk',
          template: 'म्यूचुअल फंड बाजार जोखिमों के अधीन हैं। निवेश से पहले योजना के दस्तावेजों को ध्यान से पढ़ें।',
          triggers: ['म्यूचुअल.?फंड', 'सिप', 'निवेश', 'इक्विटी'],
          patterns: ['बाजार.?जोखिम', 'दस्तावेज.*पढ़ें', 'पिछला.?प्रदर्शन.*संकेत.*नहीं'],
          severity: 'high',
        },
      ],
    },
    mr: {
      forbiddenTerms: {
        guarantees: [
          { pattern: 'हमी', severity: 'critical', replacement: 'शक्यता' },
          { pattern: 'निश्चित', severity: 'critical', replacement: 'सामान्यतः' },
          { pattern: 'जोखीम.?मुक्त', severity: 'critical', replacement: 'कमी जोखीम' },
        ],
      },
      requiredDisclosures: [
        {
          type: 'mutual_fund_risk',
          template: 'म्यूच्युअल फंड बाजार जोखमींच्या अधीन आहेत. गुंतवणुकीपूर्वी योजनेचे कागदपत्रे काळजीपूर्वक वाचा.',
          triggers: ['म्यूच्युअल.?फंड', 'एसआयपी', 'गुंतवणूक'],
          patterns: ['बाजार.?जोखीम', 'कागदपत्रे.*वाचा'],
          severity: 'high',
        },
      ],
    },
  }

  getForbiddenTerms(language: string) {
    return this.rules[language]?.forbiddenTerms || this.rules.en.forbiddenTerms
  }

  getRequiredDisclosures(language: string) {
    return this.rules[language]?.requiredDisclosures || this.rules.en.requiredDisclosures
  }

  updateRules(newRules: any) {
    this.rules = { ...this.rules, ...newRules }
  }
}
```

## Stage 2: AI Engine Implementation

### AI Analysis Engine
```typescript
// compliance/engines/ai-engine.ts
import { Injectable, Logger } from '@nestjs/common'
import { AiService } from '../../ai/ai.service'
import { ComplianceCacheService } from '../services/compliance-cache.service'
import { AuditService } from '../../audit/audit.service'

export interface AiAnalysisResult {
  riskScore: number
  confidence: number
  reasoning: string[]
  suggestions: string[]
  tone: 'professional' | 'promotional' | 'misleading' | 'appropriate'
  implications: string[]
  executionTimeMs: number
}

export interface AiAnalysisContext {
  language: string
  advisorTier: string
  stage1Violations: string[]
  contentType: string
}

@Injectable()
export class AiEngine {
  private readonly logger = new Logger(AiEngine.name)

  constructor(
    private aiService: AiService,
    private cacheService: ComplianceCacheService,
    private auditService: AuditService,
  ) {}

  async analyze(content: string, context: AiAnalysisContext): Promise<AiAnalysisResult> {
    const startTime = Date.now()
    
    this.logger.debug(`Starting AI analysis for ${context.language} content, type: ${context.contentType}`)

    try {
      const prompt = this.buildCompliancePrompt(content, context)
      const aiResponse = await this.aiService.analyzeCompliance(prompt, {
        model: 'gpt-4o-mini',
        temperature: 0.1, // Low temperature for consistent compliance analysis
        maxTokens: 1000,
      })

      const parsedResult = this.parseAiResponse(aiResponse)
      
      const result: AiAnalysisResult = {
        ...parsedResult,
        executionTimeMs: Date.now() - startTime,
      }

      // Log AI analysis for audit trail
      await this.auditService.logAiAnalysis({
        model: 'gpt-4o-mini',
        inputTokens: this.estimateTokens(prompt),
        outputTokens: this.estimateTokens(aiResponse),
        processingTimeMs: result.executionTimeMs,
        riskScore: result.riskScore,
        confidence: result.confidence,
      })

      this.logger.debug(`AI analysis complete: risk ${result.riskScore}, confidence ${result.confidence}`)
      return result

    } catch (error) {
      this.logger.error(`AI analysis failed: ${error.message}`, error.stack)
      
      return {
        riskScore: 75, // Moderate risk on AI failure
        confidence: 0,
        reasoning: ['AI analysis failed - manual review recommended'],
        suggestions: ['Content could not be automatically analyzed'],
        tone: 'appropriate',
        implications: [],
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  private buildCompliancePrompt(content: string, context: AiAnalysisContext): string {
    const basePrompt = `
You are a SEBI compliance expert analyzing financial advisory content for regulatory compliance.

CONTENT TO ANALYZE:
"${content}"

ANALYSIS CONTEXT:
- Language: ${context.language}
- Content Type: ${context.contentType}
- Advisor Tier: ${context.advisorTier}
- Previous Rule Violations: ${context.stage1Violations.join(', ') || 'None'}

EVALUATION CRITERIA:
1. SEBI regulations for financial advisors
2. Prohibition of guarantee language
3. Required risk disclosures
4. Professional tone and ethical marketing
5. Potential client misleading implications

REQUIRED OUTPUT FORMAT (JSON):
{
  "riskScore": <0-100 number>,
  "confidence": <0.0-1.0 number>,
  "reasoning": [<array of specific compliance concerns>],
  "suggestions": [<array of specific improvement recommendations>],
  "tone": "<professional|promotional|misleading|appropriate>",
  "implications": [<array of potential client misunderstandings>]
}

ANALYSIS GUIDELINES:
- Risk Score: 0-25 (Excellent), 26-50 (Good), 51-75 (Caution), 76-100 (High Risk)
- Focus on SEBI-specific violations and client protection
- Consider cultural context for Indian financial advisory
- Prioritize clear, actionable suggestions
- High confidence (>0.8) only for clear-cut cases
`

    // Add language-specific context
    if (context.language === 'hi') {
      return basePrompt + `\n\nNOTE: Analyze Hindi content for culturally appropriate financial communication while maintaining SEBI compliance standards.`
    } else if (context.language === 'mr') {
      return basePrompt + `\n\nNOTE: Analyze Marathi content for culturally appropriate financial communication while maintaining SEBI compliance standards.`
    }

    return basePrompt
  }

  private parseAiResponse(response: string): Omit<AiAnalysisResult, 'executionTimeMs'> {
    try {
      // Extract JSON from AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate and sanitize response
      return {
        riskScore: Math.max(0, Math.min(100, parsed.riskScore || 50)),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        tone: ['professional', 'promotional', 'misleading', 'appropriate'].includes(parsed.tone) 
          ? parsed.tone : 'appropriate',
        implications: Array.isArray(parsed.implications) ? parsed.implications : [],
      }

    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`)
      
      return {
        riskScore: 60,
        confidence: 0.3,
        reasoning: ['AI response could not be parsed'],
        suggestions: ['Manual compliance review recommended'],
        tone: 'appropriate',
        implications: [],
      }
    }
  }

  private estimateTokens(text: string): number {
    // Rough token estimation (actual tokenization would be more accurate)
    return Math.ceil(text.length / 4)
  }
}
```

## Stage 3: Final Validation Engine

### Final Validation & Scoring
```typescript
// compliance/engines/validation-engine.ts
import { Injectable, Logger } from '@nestjs/common'
import { AdvisorsService } from '../../advisors/advisors.service'

export interface FinalValidationInput {
  content: string
  advisorId?: string
  stage1Result: any
  stage2Result: any
  context: any
}

export interface FinalValidationResult {
  finalRiskScore: number
  status: 'approved' | 'rejected' | 'escalate'
  violations: string[]
  suggestions: string[]
  confidence: number
  escalationReason?: string
  humanReviewRequired: boolean
}

@Injectable()
export class ValidationEngine {
  private readonly logger = new Logger(ValidationEngine.name)

  constructor(private advisorsService: AdvisorsService) {}

  async finalValidation(input: FinalValidationInput): Promise<FinalValidationResult> {
    this.logger.debug(`Starting final validation for advisor ${input.advisorId}`)

    // Get advisor context for risk assessment
    const advisorContext = input.advisorId 
      ? await this.getAdvisorContext(input.advisorId)
      : null

    // Calculate composite risk score
    const compositeScore = this.calculateCompositeScore(
      input.stage1Result, 
      input.stage2Result, 
      advisorContext
    )

    // Apply advisor-specific adjustments
    const adjustedScore = this.applyAdvisorAdjustments(
      compositeScore, 
      advisorContext
    )

    // Determine if human review is required
    const humanReviewRequired = this.requiresHumanReview(
      adjustedScore, 
      input, 
      advisorContext
    )

    // Generate final status
    const status = this.determineFinalStatus(
      adjustedScore, 
      humanReviewRequired
    )

    // Compile all violations and suggestions
    const allViolations = [
      ...(input.stage1Result?.violations || []).map(v => v.type || v),
      ...(input.stage2Result?.reasoning || []),
    ]

    const allSuggestions = [
      ...(input.stage1Result?.suggestions || []),
      ...(input.stage2Result?.suggestions || []),
    ]

    const result: FinalValidationResult = {
      finalRiskScore: adjustedScore,
      status,
      violations: allViolations,
      suggestions: this.prioritizeSuggestions(allSuggestions),
      confidence: this.calculateFinalConfidence(input.stage1Result, input.stage2Result),
      humanReviewRequired,
      escalationReason: humanReviewRequired ? this.getEscalationReason(adjustedScore, advisorContext) : undefined,
    }

    this.logger.debug(`Final validation complete: ${status} (score: ${adjustedScore})`)
    return result
  }

  private calculateCompositeScore(stage1Result: any, stage2Result: any, advisorContext: any): number {
    let score = 0
    let weightSum = 0

    // Stage 1 (rule-based) weight
    if (stage1Result) {
      const stage1Weight = 0.6 // 60% weight for rule-based analysis
      score += stage1Result.riskScore * stage1Weight
      weightSum += stage1Weight
    }

    // Stage 2 (AI-based) weight
    if (stage2Result) {
      const stage2Weight = 0.4 // 40% weight for AI analysis
      const confidenceAdjustedScore = stage2Result.riskScore * stage2Result.confidence
      score += confidenceAdjustedScore * stage2Weight
      weightSum += stage2Weight
    }

    // Normalize score
    return weightSum > 0 ? score / weightSum : 50
  }

  private applyAdvisorAdjustments(baseScore: number, advisorContext: any): number {
    if (!advisorContext) return baseScore

    let adjustedScore = baseScore

    // New advisor penalty (higher scrutiny for first 30 days)
    if (advisorContext.daysSinceRegistration < 30) {
      adjustedScore = Math.min(adjustedScore + 10, 100)
      this.logger.debug(`Applied new advisor penalty: +10 points`)
    }

    // Trusted advisor bonus (consistent good behavior)
    if (advisorContext.avgComplianceScore < 20 && advisorContext.violationHistory < 2) {
      adjustedScore = Math.max(adjustedScore - 5, 0)
      this.logger.debug(`Applied trusted advisor bonus: -5 points`)
    }

    // Tier-based adjustments
    switch (advisorContext.tier) {
      case 'basic':
        // No adjustment for basic tier
        break
      case 'standard':
        // Slight bonus for standard tier (presumably more experienced)
        adjustedScore = Math.max(adjustedScore - 2, 0)
        break
      case 'pro':
        // Bonus for pro tier (highest level of service)
        adjustedScore = Math.max(adjustedScore - 5, 0)
        break
    }

    return Math.round(adjustedScore)
  }

  private requiresHumanReview(score: number, input: any, advisorContext: any): boolean {
    // Always escalate high-risk content
    if (score >= 50) return true

    // Always review new advisors' content for first 30 days
    if (advisorContext?.daysSinceRegistration < 30) return true

    // Escalate if AI confidence is low
    if (input.stage2Result?.confidence < 0.7) return true

    // Escalate if content contains edge cases
    const hasEdgeCases = input.stage1Result?.violations?.some(v => 
      ['misleading_claim', 'pressure_language'].includes(v.type)
    )
    if (hasEdgeCases) return true

    // Random sampling for quality assurance (5% of approved content)
    if (Math.random() < 0.05) return true

    return false
  }

  private determineFinalStatus(score: number, humanReviewRequired: boolean): 'approved' | 'rejected' | 'escalate' {
    if (humanReviewRequired) return 'escalate'
    if (score >= 75) return 'rejected'
    if (score <= 25) return 'approved'
    return 'escalate'
  }

  private calculateFinalConfidence(stage1Result: any, stage2Result: any): number {
    if (!stage1Result && !stage2Result) return 0

    // High confidence for rule-based rejections
    if (stage1Result?.riskScore >= 80) return 0.95

    // Use AI confidence if available and reliable
    if (stage2Result?.confidence >= 0.8) return stage2Result.confidence

    // Medium confidence for rule-based approvals
    if (stage1Result?.riskScore <= 20) return 0.8

    // Lower confidence for borderline cases
    return 0.6
  }

  private getEscalationReason(score: number, advisorContext: any): string {
    if (score >= 75) return 'High compliance risk detected'
    if (score >= 50) return 'Medium compliance risk requires review'
    if (advisorContext?.daysSinceRegistration < 30) return 'New advisor - mandatory review'
    if (advisorContext?.violationHistory > 0) return 'Advisor has previous violations'
    return 'Content flagged for quality assurance review'
  }

  private prioritizeSuggestions(suggestions: string[]): string[] {
    // Remove duplicates and prioritize by importance
    const unique = [...new Set(suggestions)]
    
    const prioritized = []
    const critical = unique.filter(s => s.includes('guarantee') || s.includes('risk-free'))
    const important = unique.filter(s => s.includes('disclaimer') || s.includes('disclosure'))
    const general = unique.filter(s => !critical.includes(s) && !important.includes(s))
    
    return [...critical, ...important, ...general].slice(0, 5) // Limit to 5 suggestions
  }

  private async getAdvisorContext(advisorId: string) {
    try {
      const advisor = await this.advisorsService.findOne(advisorId)
      const complianceHistory = await this.advisorsService.getComplianceHistory(advisorId, 90) // Last 90 days
      
      return {
        tier: advisor.tier,
        daysSinceRegistration: Math.floor((Date.now() - advisor.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        avgComplianceScore: complianceHistory.avgRiskScore || 50,
        violationHistory: complianceHistory.violationCount || 0,
        healthScore: advisor.healthScore || 0,
      }
    } catch (error) {
      this.logger.warn(`Could not fetch advisor context: ${error.message}`)
      return null
    }
  }
}
```

## Caching Strategy & Performance Optimization

### Redis-based Compliance Cache
```typescript
// compliance/services/compliance-cache.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '@nestjs-modules/ioredis'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ComplianceCacheService {
  private readonly logger = new Logger(ComplianceCacheService.name)
  private readonly cachePrefix = 'compliance:'
  private readonly defaultTtl = 1800 // 30 minutes

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedValue = await this.redisService.get(`${this.cachePrefix}${key}`)
      if (cachedValue) {
        this.logger.debug(`Cache hit for key: ${key}`)
        return JSON.parse(cachedValue)
      }
      return null
    } catch (error) {
      this.logger.error(`Cache get failed for key ${key}: ${error.message}`)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTtl): Promise<void> {
    try {
      await this.redisService.setex(
        `${this.cachePrefix}${key}`,
        ttl,
        JSON.stringify(value)
      )
      this.logger.debug(`Cache set for key: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      this.logger.error(`Cache set failed for key ${key}: ${error.message}`)
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redisService.keys(`${this.cachePrefix}${pattern}`)
      if (keys.length > 0) {
        await this.redisService.del(...keys)
        this.logger.log(`Invalidated ${keys.length} cache entries matching: ${pattern}`)
      }
    } catch (error) {
      this.logger.error(`Cache invalidation failed for pattern ${pattern}: ${error.message}`)
    }
  }

  // Smart cache key generation
  generateContentKey(content: string, language: string, advisorTier?: string): string {
    const contentHash = require('crypto')
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16)
    
    return `content:${contentHash}:${language}:${advisorTier || 'default'}`
  }

  // Advisor-specific cache invalidation
  async invalidateAdvisorCache(advisorId: string): Promise<void> {
    await this.invalidate(`*:advisor:${advisorId}:*`)
  }

  // Rule update cache invalidation
  async invalidateRuleCache(): Promise<void> {
    await this.invalidate('rule:*')
    await this.invalidate('pattern:*')
  }
}
```

### Cache Key Strategy
```yaml
cache_key_patterns:
  content_analysis:
    pattern: "content:{content_hash}:{language}:{advisor_tier}"
    ttl: 1800 # 30 minutes
    example: "content:a7b3c9d1e4f2:en:pro"
    
  rule_patterns:
    pattern: "rule:{language}:{rule_type}:{version}"
    ttl: 3600 # 1 hour
    example: "rule:hi:forbidden_terms:v2.1.3"
    
  advisor_context:
    pattern: "advisor:{advisor_id}:context:{date}"
    ttl: 900 # 15 minutes
    example: "advisor:uuid123:context:2024-12-01"
    
  ai_analysis:
    pattern: "ai:{model}:{content_hash}:{context_hash}"
    ttl: 7200 # 2 hours
    example: "ai:gpt-4o-mini:d4e8f2b5:c9a1x3z7"
    
cache_invalidation_triggers:
  rule_updates:
    action: "invalidate_all_rule_cache"
    pattern: "rule:*"
    
  advisor_tier_change:
    action: "invalidate_advisor_specific_cache"
    pattern: "content:*:advisor:{advisor_id}:*"
    
  model_version_update:
    action: "invalidate_ai_cache"
    pattern: "ai:{model}:*"
```

## Performance Monitoring & Optimization

### Compliance Engine Metrics
```typescript
// compliance/services/compliance-metrics.service.ts
import { Injectable } from '@nestjs/common'
import { PrometheusService } from '@willsoto/nestjs-prometheus'
import { Counter, Histogram, Gauge } from 'prom-client'

@Injectable()
export class ComplianceMetricsService {
  private readonly complianceChecksTotal: Counter<string>
  private readonly complianceCheckDuration: Histogram<string>
  private readonly aiAnalysisLatency: Histogram<string>
  private readonly cacheHitRate: Gauge<string>
  private readonly queueDepth: Gauge<string>

  constructor(private prometheusService: PrometheusService) {
    this.complianceChecksTotal = new Counter({
      name: 'compliance_checks_total',
      help: 'Total number of compliance checks performed',
      labelNames: ['stage', 'status', 'advisor_tier', 'language'],
    })

    this.complianceCheckDuration = new Histogram({
      name: 'compliance_check_duration_seconds',
      help: 'Duration of compliance checks',
      labelNames: ['stage', 'advisor_tier'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    })

    this.aiAnalysisLatency = new Histogram({
      name: 'ai_analysis_latency_seconds', 
      help: 'AI analysis latency',
      buckets: [0.5, 1, 2, 5, 10, 15],
    })

    this.cacheHitRate = new Gauge({
      name: 'compliance_cache_hit_rate',
      help: 'Cache hit rate for compliance checks',
    })

    this.queueDepth = new Gauge({
      name: 'compliance_queue_depth',
      help: 'Current depth of compliance processing queue',
    })
  }

  recordComplianceCheck(stage: string, status: string, duration: number, advisorTier?: string, language?: string) {
    this.complianceChecksTotal.labels(stage, status, advisorTier || 'unknown', language || 'en').inc()
    this.complianceCheckDuration.labels(stage, advisorTier || 'unknown').observe(duration)
  }

  recordAiAnalysis(duration: number) {
    this.aiAnalysisLatency.observe(duration)
  }

  updateCacheHitRate(rate: number) {
    this.cacheHitRate.set(rate)
  }

  updateQueueDepth(depth: number) {
    this.queueDepth.set(depth)
  }
}
```

This comprehensive compliance engine implementation plan provides a robust, scalable, and culturally sensitive system for ensuring SEBI compliance while maintaining optimal performance through intelligent caching and monitoring.