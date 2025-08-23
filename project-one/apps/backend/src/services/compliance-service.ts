// Three-Stage AI-Powered Compliance Service
// Core compliance engine with SEBI rules, OpenAI integration, and real-time validation

import OpenAI from 'openai';
import { cache } from '../utils/redis';
import sebiRules from '../rules/sebi-rules';
import languageUtils from '../utils/language-utils';
import {
  COMPLIANCE_SYSTEM_PROMPT,
  COMPLIANCE_CHECK_PROMPT,
  selectPromptStrategy,
  estimateTokens
} from '../ai/compliance-prompts';
import crypto from 'crypto';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export interface ComplianceRequest {
  content: string;
  language?: 'en' | 'hi' | 'mr';
  contentType?: 'whatsapp' | 'status' | 'linkedin' | 'email';
  advisorId?: string;
  skipCache?: boolean;
}

export interface ComplianceIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  code?: string;
  location?: string;
}

export interface ComplianceResponse {
  isCompliant: boolean;
  riskScore: number;
  issues: ComplianceIssue[];
  suggestions: string[];
  processingTime: number;
  processedContent?: string;
  aiAnalysis?: any;
  cacheHit?: boolean;
  stagesCompleted: {
    rules: boolean;
    ai: boolean;
    final: boolean;
  };
}

class ComplianceService {
  private readonly MAX_PROCESSING_TIME = 1500; // 1.5 seconds
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly AI_TIMEOUT = 1200; // 1.2 seconds for AI
  
  // Cost control limits
  private dailyUsage = new Map<string, { lints: number; generations: number }>();
  private readonly DAILY_LINT_LIMIT = 20;
  private readonly DAILY_GEN_LIMIT = 10;

  /**
   * Main compliance check endpoint - Three-stage validation
   */
  async checkCompliance(request: ComplianceRequest): Promise<ComplianceResponse> {
    const startTime = Date.now();
    const contentHash = this.generateContentHash(request);
    
    // Check cache first
    if (!request.skipCache) {
      const cached = await this.getCachedResult(contentHash);
      if (cached) {
        return {
          ...cached,
          cacheHit: true,
          processingTime: Date.now() - startTime
        };
      }
    }

    // Initialize response structure
    let response: ComplianceResponse = {
      isCompliant: false,
      riskScore: 0,
      issues: [],
      suggestions: [],
      processingTime: 0,
      stagesCompleted: {
        rules: false,
        ai: false,
        final: false
      }
    };

    try {
      // STAGE 1: Hard Rules Check
      const stage1Result = await this.stage1RulesCheck(request);
      response.stagesCompleted.rules = true;
      
      // Immediate block for critical violations
      if (stage1Result.immediateBlock) {
        response.isCompliant = false;
        response.riskScore = stage1Result.riskScore;
        response.issues = stage1Result.issues;
        response.suggestions = stage1Result.suggestions;
        response.processingTime = Date.now() - startTime;
        
        await this.cacheResult(contentHash, response);
        return response;
      }

      // STAGE 2: AI Semantic Analysis (if needed and under budget)
      if (stage1Result.requiresAI && this.isUnderBudget(request.advisorId)) {
        const stage2Result = await this.stage2AIAnalysis(request, stage1Result);
        if (stage2Result) {
          response.stagesCompleted.ai = true;
          response.aiAnalysis = stage2Result.aiAnalysis;
          
          // Merge AI findings with rules findings
          response.issues = this.mergeIssues(stage1Result.issues, stage2Result.issues);
          response.suggestions = [...new Set([...stage1Result.suggestions, ...stage2Result.suggestions])];
          response.riskScore = Math.max(stage1Result.riskScore, stage2Result.riskScore);
        }
      }

      // STAGE 3: Final Verification
      const stage3Result = this.stage3FinalVerification(response);
      response.stagesCompleted.final = true;
      response.isCompliant = stage3Result.isCompliant;
      response.riskScore = stage3Result.riskScore;

      // Add processed content if compliant with minor issues
      if (response.riskScore < 30 && response.issues.filter(i => i.severity === 'critical').length === 0) {
        response.processedContent = this.autoFixContent(request.content, response.issues);
      }

      response.processingTime = Date.now() - startTime;

      // Cache the result
      await this.cacheResult(contentHash, response);

      // Log for audit
      await this.logComplianceCheck(request, response);

      return response;

    } catch (error) {
      console.error('Compliance check error:', error);
      
      // Fallback to rules-only mode
      const fallbackResult = await this.stage1RulesCheck(request);
      response = {
        isCompliant: fallbackResult.riskScore < 30,
        riskScore: fallbackResult.riskScore,
        issues: fallbackResult.issues,
        suggestions: fallbackResult.suggestions,
        processingTime: Date.now() - startTime,
        stagesCompleted: {
          rules: true,
          ai: false,
          final: true
        }
      };
      
      return response;
    }
  }

  /**
   * Stage 1: Hard Rules Check
   */
  private async stage1RulesCheck(request: ComplianceRequest): Promise<{
    issues: ComplianceIssue[];
    suggestions: string[];
    riskScore: number;
    requiresAI: boolean;
    immediateBlock: boolean;
  }> {
    const { content, language = 'en' } = request;
    
    // Check SEBI rules
    const rulesResult = sebiRules.checkHardRules(content, language);
    
    // Convert violations to issues
    const issues: ComplianceIssue[] = rulesResult.violations.map(v => ({
      severity: v.severity,
      description: v.description,
      suggestion: v.suggestion || '',
      code: v.code
    }));

    // Generate suggestions
    const suggestions = sebiRules.generateSuggestions(rulesResult.violations, content);

    // Calculate risk score
    const riskScore = sebiRules.calculateRiskScore(rulesResult.violations);

    return {
      issues,
      suggestions,
      riskScore,
      requiresAI: rulesResult.requiresAI,
      immediateBlock: rulesResult.immediateBlock
    };
  }

  /**
   * Stage 2: AI Semantic Analysis
   */
  private async stage2AIAnalysis(
    request: ComplianceRequest,
    stage1Result: any
  ): Promise<{
    issues: ComplianceIssue[];
    suggestions: string[];
    riskScore: number;
    aiAnalysis: any;
  } | null> {
    try {
      // Select appropriate prompt strategy
      const strategy = selectPromptStrategy(
        request.content,
        request.contentType || 'whatsapp',
        stage1Result.issues.length > 0
      );

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI timeout')), this.AI_TIMEOUT)
      );

      // Call OpenAI API with timeout
      const aiPromise = openai.chat.completions.create({
        model: strategy.model,
        messages: [
          { role: 'system', content: COMPLIANCE_SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: COMPLIANCE_CHECK_PROMPT(
              request.content,
              request.language || 'en',
              request.contentType || 'whatsapp'
            )
          }
        ],
        temperature: strategy.temperature,
        max_tokens: strategy.maxTokens,
        response_format: { type: 'json_object' }
      });

      const completion = await Promise.race([aiPromise, timeoutPromise]) as any;
      
      // Parse AI response
      const aiResponse = JSON.parse(completion.choices[0].message.content);
      
      // Convert AI violations to issues
      const issues: ComplianceIssue[] = (aiResponse.violations || []).map((v: any) => ({
        severity: v.severity,
        description: v.description,
        suggestion: v.suggestion,
        location: v.location
      }));

      // Track usage
      this.trackUsage(request.advisorId, 'lint');

      return {
        issues,
        suggestions: aiResponse.suggestions || [],
        riskScore: aiResponse.riskScore || 0,
        aiAnalysis: {
          culturalSensitivity: aiResponse.culturalSensitivity,
          biasDetected: aiResponse.biasDetected,
          reasoning: aiResponse.reasoning,
          requiresManualReview: aiResponse.requiresManualReview
        }
      };

    } catch (error: any) {
      console.error('AI analysis error:', error.message);
      return null; // Fallback to rules-only
    }
  }

  /**
   * Stage 3: Final Verification
   */
  private stage3FinalVerification(response: ComplianceResponse): {
    isCompliant: boolean;
    riskScore: number;
  } {
    // Count critical and high severity issues
    const criticalCount = response.issues.filter(i => i.severity === 'critical').length;
    const highCount = response.issues.filter(i => i.severity === 'high').length;

    // Determine compliance status
    let isCompliant = false;
    let finalRiskScore = response.riskScore;

    if (criticalCount > 0) {
      isCompliant = false;
      finalRiskScore = Math.max(finalRiskScore, 80);
    } else if (highCount > 2) {
      isCompliant = false;
      finalRiskScore = Math.max(finalRiskScore, 60);
    } else if (finalRiskScore < 30) {
      isCompliant = true;
    }

    // Additional check for AI-detected bias or manual review requirement
    if (response.aiAnalysis?.biasDetected || response.aiAnalysis?.requiresManualReview) {
      isCompliant = false;
      finalRiskScore = Math.max(finalRiskScore, 50);
    }

    return {
      isCompliant,
      riskScore: finalRiskScore
    };
  }

  /**
   * Auto-fix minor compliance issues
   */
  private autoFixContent(content: string, issues: ComplianceIssue[]): string {
    let fixed = content;

    // Add missing disclaimers
    const missingDisclaimers = issues.filter(i => i.code?.includes('MISSING'));
    if (missingDisclaimers.length > 0) {
      // Detect language
      const language = languageUtils.detectLanguage(content);
      
      // Add market risk disclaimer if missing
      if (missingDisclaimers.some(d => d.code?.includes('RISK'))) {
        fixed = languageUtils.addDisclaimer(fixed, 'market_risk', language);
      }
      
      // Add past performance disclaimer if missing
      if (missingDisclaimers.some(d => d.code?.includes('PAST'))) {
        fixed = languageUtils.addDisclaimer(fixed, 'past_performance', language);
      }
    }

    // Remove excessive emojis
    if (issues.some(i => i.code === 'SEBI_EXCESS_EMOJI')) {
      // Keep only first 2 emojis
      let emojiCount = 0;
      fixed = fixed.replace(/[💰💵💴💶💷💸🚀📈💎🤑]/g, (match) => {
        emojiCount++;
        return emojiCount <= 2 ? match : '';
      });
    }

    return fixed;
  }

  /**
   * Merge issues from different stages
   */
  private mergeIssues(rulesIssues: ComplianceIssue[], aiIssues: ComplianceIssue[]): ComplianceIssue[] {
    const merged: ComplianceIssue[] = [...rulesIssues];
    
    // Add AI issues that don't duplicate rules issues
    aiIssues.forEach(aiIssue => {
      const isDuplicate = rulesIssues.some(ruleIssue => 
        ruleIssue.description.toLowerCase().includes(aiIssue.description.toLowerCase().substring(0, 20))
      );
      
      if (!isDuplicate) {
        merged.push(aiIssue);
      }
    });

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    merged.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return merged;
  }

  /**
   * Generate content hash for caching
   */
  private generateContentHash(request: ComplianceRequest): string {
    const data = `${request.content}_${request.language}_${request.contentType}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get cached result
   */
  private async getCachedResult(hash: string): Promise<ComplianceResponse | null> {
    return await cache.get(`compliance:${hash}`);
  }

  /**
   * Cache result
   */
  private async cacheResult(hash: string, response: ComplianceResponse): Promise<void> {
    await cache.set(`compliance:${hash}`, response, this.CACHE_TTL);
  }

  /**
   * Check if advisor is under daily budget
   */
  private isUnderBudget(advisorId?: string): boolean {
    if (!advisorId) return true;

    const usage = this.dailyUsage.get(advisorId) || { lints: 0, generations: 0 };
    return usage.lints < this.DAILY_LINT_LIMIT;
  }

  /**
   * Track API usage for cost control
   */
  private trackUsage(advisorId: string | undefined, type: 'lint' | 'generation'): void {
    if (!advisorId) return;

    const usage = this.dailyUsage.get(advisorId) || { lints: 0, generations: 0 };
    
    if (type === 'lint') {
      usage.lints++;
    } else {
      usage.generations++;
    }

    this.dailyUsage.set(advisorId, usage);
  }

  /**
   * Log compliance check for audit
   */
  private async logComplianceCheck(request: ComplianceRequest, response: ComplianceResponse): Promise<void> {
    try {
      const auditLog = {
        timestamp: new Date().toISOString(),
        advisorId: request.advisorId,
        contentHash: this.generateContentHash(request),
        contentType: request.contentType,
        language: request.language,
        riskScore: response.riskScore,
        isCompliant: response.isCompliant,
        issueCount: response.issues.length,
        processingTime: response.processingTime,
        stagesCompleted: response.stagesCompleted,
        aiUsed: response.stagesCompleted.ai
      };

      // Store in Redis with 5-year TTL for compliance
      await cache.set(
        `audit:compliance:${Date.now()}`,
        auditLog,
        5 * 365 * 24 * 3600 // 5 years
      );

    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  /**
   * Reset daily usage (should be called by a cron job)
   */
  resetDailyUsage(): void {
    this.dailyUsage.clear();
  }

  /**
   * Get compliance statistics
   */
  async getStats(advisorId?: string): Promise<any> {
    const usage = advisorId ? this.dailyUsage.get(advisorId) : null;
    
    return {
      dailyUsage: usage || { lints: 0, generations: 0 },
      limits: {
        lints: this.DAILY_LINT_LIMIT,
        generations: this.DAILY_GEN_LIMIT
      },
      remainingLints: usage ? this.DAILY_LINT_LIMIT - usage.lints : this.DAILY_LINT_LIMIT,
      remainingGenerations: usage ? this.DAILY_GEN_LIMIT - usage.generations : this.DAILY_GEN_LIMIT
    };
  }
}

export default new ComplianceService();