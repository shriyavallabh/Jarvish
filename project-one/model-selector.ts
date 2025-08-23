/**
 * Dynamic Model Selection System
 * Intelligently selects between Claude Opus, Sonnet, and Haiku based on:
 * - Token limits and usage
 * - Query complexity 
 * - Agent requirements
 * - Cost optimization
 * - Performance targets
 */

interface ModelConfig {
  name: string;
  maxTokens: number;
  costPerToken: number; // USD per 1K tokens
  avgLatency: number; // milliseconds
  strengthAreas: string[];
  weaknesses: string[];
  contextWindow: number;
}

interface QueryAnalysis {
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  estimatedTokens: number;
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresAccuracy: boolean;
  domainSpecific: boolean;
  timeConstraint: 'relaxed' | 'normal' | 'urgent';
}

interface ModelSelectionCriteria {
  agentId: string;
  taskType: string;
  maxBudget?: number;
  maxLatency?: number;
  qualityPriority: 'cost' | 'speed' | 'quality';
  fallbackRequired: boolean;
}

interface TokenUsageMetrics {
  model: string;
  totalTokens: number;
  remainingQuota: number;
  resetTime: Date;
  dailyUsage: number;
  costToDate: number;
}

export class ModelSelector {
  private models: Map<string, ModelConfig> = new Map();
  private tokenUsage: Map<string, TokenUsageMetrics> = new Map();
  private agentModelPreferences: Map<string, string[]> = new Map();
  private quotaLimits: Map<string, number> = new Map();

  constructor() {
    this.initializeModels();
    this.initializeQuotaLimits();
    this.initializeAgentPreferences();
  }

  private initializeModels(): void {
    // Claude Opus - Highest quality, most expensive
    this.models.set('claude-3-opus-20240229', {
      name: 'Claude Opus',
      maxTokens: 4096,
      costPerToken: 0.015, // $15 per 1M input tokens
      avgLatency: 3500,
      strengthAreas: ['complex reasoning', 'creative writing', 'code generation', 'analysis'],
      weaknesses: ['cost', 'speed'],
      contextWindow: 200000
    });

    // Claude Sonnet - Balanced performance
    this.models.set('claude-3-5-sonnet-20241022', {
      name: 'Claude Sonnet',
      maxTokens: 8192,
      costPerToken: 0.003, // $3 per 1M input tokens
      avgLatency: 2000,
      strengthAreas: ['general tasks', 'code', 'analysis', 'balanced performance'],
      weaknesses: ['very complex reasoning'],
      contextWindow: 200000
    });
  }

  private initializeQuotaLimits(): void {
    // Daily token limits (can be configured per deployment)
    this.quotaLimits.set('claude-3-opus-20240229', 1000000); // 1M tokens/day
    this.quotaLimits.set('claude-3-5-sonnet-20241022', 5000000); // 5M tokens/day

    // Initialize usage tracking
    this.models.forEach((_, modelId) => {
      this.tokenUsage.set(modelId, {
        model: modelId,
        totalTokens: 0,
        remainingQuota: this.quotaLimits.get(modelId) || 0,
        resetTime: this.getNextReset(),
        dailyUsage: 0,
        costToDate: 0
      });
    });
  }

  private initializeAgentPreferences(): void {
    // Agent-specific model preferences based on their roles
    
    // High-quality design and compliance agents prefer Opus
    this.agentModelPreferences.set('compliance-ux-researcher', 
      ['claude-3-opus-20240229', 'claude-3-5-sonnet-20241022']
    );
    this.agentModelPreferences.set('fintech-ui-designer', 
      ['claude-3-opus-20240229', 'claude-3-5-sonnet-20241022']
    );
    this.agentModelPreferences.set('sebi-compliance-auditor', 
      ['claude-3-opus-20240229', 'claude-3-5-sonnet-20241022']
    );

    // Engineering agents prefer Sonnet (good code quality, reasonable cost)
    this.agentModelPreferences.set('nextjs-dashboard-developer', 
      ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
    );
    this.agentModelPreferences.set('ai-compliance-engine-dev', 
      ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
    );
    this.agentModelPreferences.set('whatsapp-api-specialist', 
      ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
    );
    this.agentModelPreferences.set('backend-dev', 
      ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
    );

    // Analytics and data agents use Sonnet primarily
    this.agentModelPreferences.set('analytics-intelligence-dev', 
      ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
    );
    this.agentModelPreferences.set('data-modeler', 
      ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
    );

    // All other agents default to Sonnet with Opus fallback
    this.agentModelPreferences.set('whimsy-injector', 
      ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
    );
    this.agentModelPreferences.set('test-runner', 
      ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
    );
  }

  // Main model selection method
  selectModel(criteria: ModelSelectionCriteria, queryAnalysis: QueryAnalysis): {
    primaryModel: string;
    fallbackModels: string[];
    reasoning: string;
    estimatedCost: number;
    estimatedLatency: number;
  } {
    console.log(`🧠 Selecting model for ${criteria.agentId} (${queryAnalysis.complexity} complexity)`);

    const agentPreferences = this.agentModelPreferences.get(criteria.agentId) || 
      ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];

    let candidateModels = [...agentPreferences];
    let reasoning = '';

    // Filter by token limits
    candidateModels = candidateModels.filter(modelId => {
      const usage = this.tokenUsage.get(modelId);
      const hasQuota = usage && usage.remainingQuota > queryAnalysis.estimatedTokens;
      if (!hasQuota) {
        reasoning += `❌ ${modelId}: Quota exceeded. `;
      }
      return hasQuota;
    });

    // If no models have quota, use emergency fallback
    if (candidateModels.length === 0) {
      candidateModels = ['claude-3-5-sonnet-20241022']; // Emergency fallback to Sonnet
      reasoning += '🚨 Emergency fallback to Sonnet due to quota limits. ';
    }

    // Apply complexity-based selection
    const selectedModel = this.selectByComplexity(candidateModels, queryAnalysis, criteria);
    reasoning += this.getSelectionReasoning(selectedModel, queryAnalysis, criteria);

    // Prepare fallback chain
    const fallbackModels = candidateModels.filter(m => m !== selectedModel);

    const modelConfig = this.models.get(selectedModel)!;
    const estimatedCost = (queryAnalysis.estimatedTokens / 1000) * modelConfig.costPerToken;

    return {
      primaryModel: selectedModel,
      fallbackModels,
      reasoning,
      estimatedCost,
      estimatedLatency: modelConfig.avgLatency
    };
  }

  private selectByComplexity(candidates: string[], query: QueryAnalysis, criteria: ModelSelectionCriteria): string {
    // For expert-level complexity, prefer Opus if available
    if (query.complexity === 'expert' && candidates.includes('claude-3-opus-20240229')) {
      return 'claude-3-opus-20240229';
    }

    // For complex tasks requiring high accuracy, prefer Opus or Sonnet
    if (query.complexity === 'complex' && query.requiresAccuracy) {
      if (candidates.includes('claude-3-opus-20240229')) {
        return 'claude-3-opus-20240229';
      }
      if (candidates.includes('claude-3-5-sonnet-20241022')) {
        return 'claude-3-5-sonnet-20241022';
      }
    }

    // For urgent tasks, prefer Sonnet (faster than Opus)
    if (query.timeConstraint === 'urgent') {
      if (candidates.includes('claude-3-5-sonnet-20241022')) {
        return 'claude-3-5-sonnet-20241022';
      }
    }

    // For cost-sensitive tasks, prefer Sonnet (more economical than Opus)
    if (criteria.qualityPriority === 'cost' && candidates.includes('claude-3-5-sonnet-20241022')) {
      return 'claude-3-5-sonnet-20241022';
    }

    // For quality-sensitive tasks, prefer Opus
    if (criteria.qualityPriority === 'quality' && candidates.includes('claude-3-opus-20240229')) {
      return 'claude-3-opus-20240229';
    }

    // Default to Sonnet for balanced performance
    if (candidates.includes('claude-3-5-sonnet-20241022')) {
      return 'claude-3-5-sonnet-20241022';
    }

    // Fallback to first available
    return candidates[0];
  }

  private getSelectionReasoning(model: string, query: QueryAnalysis, criteria: ModelSelectionCriteria): string {
    const modelConfig = this.models.get(model)!;
    let reasoning = `Selected ${modelConfig.name}: `;

    if (query.complexity === 'expert') {
      reasoning += 'Expert-level complexity requires highest capability. ';
    } else if (query.complexity === 'simple') {
      reasoning += 'Simple task suitable for efficient model. ';
    }

    if (query.timeConstraint === 'urgent') {
      reasoning += 'Urgent timing favors faster model. ';
    }

    if (criteria.qualityPriority === 'cost') {
      reasoning += 'Cost optimization prioritized. ';
    } else if (criteria.qualityPriority === 'quality') {
      reasoning += 'Quality maximization prioritized. ';
    }

    return reasoning;
  }

  // Analyze query to determine complexity
  analyzeQuery(prompt: string, context: string = '', agentType: string = ''): QueryAnalysis {
    const combinedText = `${prompt} ${context}`.toLowerCase();
    const tokenEstimate = this.estimateTokens(prompt + context);

    // Complexity indicators
    const complexKeywords = ['architecture', 'system design', 'compliance', 'regulatory', 'sebi', 'audit'];
    const creativityKeywords = ['design', 'creative', 'brand', 'visual', 'aesthetic', 'innovative'];
    const reasoningKeywords = ['analyze', 'compare', 'evaluate', 'reasoning', 'logic', 'complex'];
    const accuracyKeywords = ['compliance', 'legal', 'regulatory', 'precise', 'accurate', 'validation'];

    const hasComplexKeywords = complexKeywords.some(k => combinedText.includes(k));
    const hasCreativityKeywords = creativityKeywords.some(k => combinedText.includes(k));
    const hasReasoningKeywords = reasoningKeywords.some(k => combinedText.includes(k));
    const hasAccuracyKeywords = accuracyKeywords.some(k => combinedText.includes(k));

    // Determine complexity
    let complexity: QueryAnalysis['complexity'] = 'moderate';
    
    if (tokenEstimate > 100000 || hasComplexKeywords && hasReasoningKeywords) {
      complexity = 'expert';
    } else if (tokenEstimate > 50000 || hasComplexKeywords || hasReasoningKeywords) {
      complexity = 'complex';
    } else if (tokenEstimate < 10000 && !hasCreativityKeywords && !hasReasoningKeywords) {
      complexity = 'simple';
    }

    // Time constraint based on agent type
    const urgentAgents = ['whatsapp-api-specialist', 'test-runner', 'whimsy-injector'];
    const timeConstraint = urgentAgents.includes(agentType) ? 'urgent' : 'normal';

    return {
      complexity,
      estimatedTokens: tokenEstimate,
      requiresReasoning: hasReasoningKeywords,
      requiresCreativity: hasCreativityKeywords,
      requiresAccuracy: hasAccuracyKeywords,
      domainSpecific: combinedText.includes('sebi') || combinedText.includes('financial'),
      timeConstraint
    };
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }

  // Record token usage after API call
  recordUsage(modelId: string, tokensUsed: number): void {
    const usage = this.tokenUsage.get(modelId);
    if (!usage) return;

    usage.totalTokens += tokensUsed;
    usage.remainingQuota -= tokensUsed;
    usage.dailyUsage += tokensUsed;

    const modelConfig = this.models.get(modelId)!;
    usage.costToDate += (tokensUsed / 1000) * modelConfig.costPerToken;

    console.log(`📊 ${modelConfig.name}: ${tokensUsed} tokens used, ${usage.remainingQuota} remaining`);

    // Alert if quota running low
    if (usage.remainingQuota < 100000) { // Less than 100K tokens remaining
      console.warn(`⚠️ ${modelConfig.name} quota running low: ${usage.remainingQuota} tokens remaining`);
    }
  }

  // Get usage statistics
  getUsageStats(): Map<string, TokenUsageMetrics> {
    return new Map(this.tokenUsage);
  }

  // Reset daily quotas (called by scheduler)
  resetDailyQuotas(): void {
    const now = new Date();
    
    this.tokenUsage.forEach((usage, modelId) => {
      usage.remainingQuota = this.quotaLimits.get(modelId) || 0;
      usage.dailyUsage = 0;
      usage.resetTime = this.getNextReset();
    });

    console.log(`🔄 Daily quotas reset at ${now.toISOString()}`);
  }

  private getNextReset(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  // Emergency fallback when all models exhausted
  getEmergencyFallback(): string {
    return 'claude-3-5-sonnet-20241022'; // Always fall back to Sonnet
  }

  // Check if model is available
  isModelAvailable(modelId: string, requiredTokens: number = 1000): boolean {
    const usage = this.tokenUsage.get(modelId);
    return usage ? usage.remainingQuota >= requiredTokens : false;
  }

  // Get cost estimate for task
  estimateCost(modelId: string, estimatedTokens: number): number {
    const modelConfig = this.models.get(modelId);
    if (!modelConfig) return 0;
    
    return (estimatedTokens / 1000) * modelConfig.costPerToken;
  }

  // Update agent preferences based on performance
  updateAgentPreference(agentId: string, modelId: string, performance: 'good' | 'poor'): void {
    const preferences = this.agentModelPreferences.get(agentId) || [];
    
    if (performance === 'good') {
      // Move successful model up in preference list
      const index = preferences.indexOf(modelId);
      if (index > 0) {
        preferences.splice(index, 1);
        preferences.splice(Math.max(0, index - 1), 0, modelId);
      }
    } else if (performance === 'poor') {
      // Move poor-performing model down
      const index = preferences.indexOf(modelId);
      if (index >= 0 && index < preferences.length - 1) {
        preferences.splice(index, 1);
        preferences.splice(index + 1, 0, modelId);
      }
    }

    this.agentModelPreferences.set(agentId, preferences);
    console.log(`📈 Updated ${agentId} model preferences based on ${performance} performance`);
  }
}

// Global model selector instance
export const globalModelSelector = new ModelSelector();