/**
 * Prompt Combination Algorithm
 * 
 * Intelligent merging of system and asset prompts with
 * context-aware optimization and conflict resolution
 */

class PromptCombinationAlgorithm {
  constructor() {
    this.combinationStrategies = new Map();
    this.conflictResolvers = new Map();
    this.weightCalculators = new Map();
    this.cache = new Map();
    
    this.initializeStrategies();
  }

  /**
   * Initialize combination strategies for different scenarios
   */
  initializeStrategies() {
    // Content type specific strategies
    this.combinationStrategies.set('market_update', new MarketUpdateStrategy());
    this.combinationStrategies.set('educational', new EducationalStrategy());
    this.combinationStrategies.set('promotional', new PromotionalStrategy());
    this.combinationStrategies.set('news_commentary', new NewsCommentaryStrategy());
    
    // Conflict resolution strategies
    this.conflictResolvers.set('tone', new ToneConflictResolver());
    this.conflictResolvers.set('length', new LengthConflictResolver());
    this.conflictResolvers.set('compliance', new ComplianceConflictResolver());
    
    // Weight calculation strategies
    this.weightCalculators.set('time_based', new TimeBasedWeightCalculator());
    this.weightCalculators.set('performance_based', new PerformanceWeightCalculator());
    this.weightCalculators.set('context_based', new ContextWeightCalculator());
  }

  /**
   * Main combination method
   */
  async combinePrompts(systemPrompt, assetPrompt, context) {
    const cacheKey = this.generateCacheKey(systemPrompt, assetPrompt, context);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expiry > Date.now()) {
        return cached.prompt;
      }
    }
    
    // Calculate dynamic weights
    const weights = await this.calculateWeights(systemPrompt, assetPrompt, context);
    
    // Get combination strategy
    const strategy = this.combinationStrategies.get(context.contentType) || 
                    new DefaultCombinationStrategy();
    
    // Combine prompts using strategy
    const combinedPrompt = await strategy.combine(
      systemPrompt,
      assetPrompt,
      weights,
      context
    );
    
    // Resolve conflicts
    const resolvedPrompt = await this.resolveConflicts(combinedPrompt, context);
    
    // Optimize final prompt
    const optimizedPrompt = await this.optimizePrompt(resolvedPrompt, context);
    
    // Validate combined prompt
    const validation = await this.validateCombination(optimizedPrompt);
    if (!validation.valid) {
      throw new Error(`Invalid prompt combination: ${validation.errors.join(', ')}`);
    }
    
    // Cache result
    this.cache.set(cacheKey, {
      prompt: optimizedPrompt,
      expiry: Date.now() + (60 * 60 * 1000) // 1 hour
    });
    
    return optimizedPrompt;
  }

  /**
   * Calculate dynamic weights for prompt components
   */
  async calculateWeights(systemPrompt, assetPrompt, context) {
    const weights = {
      system: {},
      asset: {},
      context: {}
    };
    
    // Time-based weights (e.g., tax content weighted higher in Jan-Mar)
    const timeWeights = this.weightCalculators.get('time_based')
      .calculate(context.timestamp);
    
    // Performance-based weights (historical performance of similar content)
    const performanceWeights = await this.weightCalculators.get('performance_based')
      .calculate(context.advisorId, context.contentType);
    
    // Context-based weights (platform, audience, market conditions)
    const contextWeights = this.weightCalculators.get('context_based')
      .calculate(context);
    
    // Combine weights using weighted average
    weights.system = {
      branding: 0.8,          // System branding is usually stable
      compliance: 1.0,        // Compliance always has full weight
      signature: 0.9,         // Signature is important
      style: timeWeights.styleWeight * 0.7
    };
    
    weights.asset = {
      marketData: contextWeights.marketRelevance,
      trending: performanceWeights.trendingWeight,
      educational: timeWeights.educationalWeight,
      seasonal: timeWeights.seasonalWeight
    };
    
    weights.context = {
      urgency: context.urgent ? 1.0 : 0.3,
      personalization: context.personalized ? 0.8 : 0.4,
      automation: context.automated ? 0.6 : 1.0
    };
    
    return weights;
  }

  /**
   * Resolve conflicts between system and asset prompts
   */
  async resolveConflicts(prompt, context) {
    const conflicts = this.detectConflicts(prompt);
    
    for (const conflict of conflicts) {
      const resolver = this.conflictResolvers.get(conflict.type);
      if (resolver) {
        prompt = await resolver.resolve(prompt, conflict, context);
      }
    }
    
    return prompt;
  }

  /**
   * Detect conflicts in combined prompt
   */
  detectConflicts(prompt) {
    const conflicts = [];
    
    // Tone conflicts
    if (prompt.system?.tone && prompt.asset?.suggestedTone) {
      if (this.areTonesDifferent(prompt.system.tone, prompt.asset.suggestedTone)) {
        conflicts.push({
          type: 'tone',
          systemValue: prompt.system.tone,
          assetValue: prompt.asset.suggestedTone
        });
      }
    }
    
    // Length conflicts
    if (prompt.system?.maxLength && prompt.asset?.optimalLength) {
      if (prompt.asset.optimalLength > prompt.system.maxLength) {
        conflicts.push({
          type: 'length',
          systemValue: prompt.system.maxLength,
          assetValue: prompt.asset.optimalLength
        });
      }
    }
    
    // Compliance conflicts
    if (prompt.asset?.suggestedContent) {
      const violations = this.checkComplianceViolations(
        prompt.asset.suggestedContent,
        prompt.system?.compliance
      );
      if (violations.length > 0) {
        conflicts.push({
          type: 'compliance',
          violations
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Optimize the final combined prompt
   */
  async optimizePrompt(prompt, context) {
    const optimizations = [];
    
    // Token optimization
    if (context.platform === 'whatsapp') {
      optimizations.push(this.optimizeForBrevity(prompt));
    }
    
    // Engagement optimization
    if (context.optimizeForEngagement) {
      optimizations.push(this.optimizeForEngagement(prompt));
    }
    
    // Clarity optimization
    optimizations.push(this.optimizeForClarity(prompt));
    
    // Apply optimizations
    let optimized = prompt;
    for (const optimization of optimizations) {
      optimized = await optimization(optimized);
    }
    
    return optimized;
  }

  /**
   * Optimization methods
   */
  optimizeForBrevity(prompt) {
    return async (p) => {
      // Remove redundant instructions
      p.instructions = this.deduplicateInstructions(p.instructions);
      
      // Shorten verbose sections
      if (p.content?.length > 500) {
        p.content = this.summarizeContent(p.content);
      }
      
      return p;
    };
  }

  optimizeForEngagement(prompt) {
    return async (p) => {
      // Add engagement hooks
      if (!p.hooks) {
        p.hooks = this.generateEngagementHooks(p.context);
      }
      
      // Enhance CTA
      if (p.cta) {
        p.cta = this.enhanceCTA(p.cta);
      }
      
      return p;
    };
  }

  optimizeForClarity(prompt) {
    return async (p) => {
      // Structure instructions clearly
      if (p.instructions && Array.isArray(p.instructions)) {
        p.instructions = this.structureInstructions(p.instructions);
      }
      
      // Add examples if missing
      if (!p.examples && p.contentType) {
        p.examples = this.generateExamples(p.contentType);
      }
      
      return p;
    };
  }

  /**
   * Validate the combined prompt
   */
  async validateCombination(prompt) {
    const errors = [];
    
    // Check required fields
    if (!prompt.role) errors.push('Missing role definition');
    if (!prompt.content && !prompt.instructions) errors.push('Missing content or instructions');
    
    // Check compliance requirements
    if (prompt.compliance?.required && !prompt.compliance?.disclaimer) {
      errors.push('Missing required disclaimer');
    }
    
    // Check platform compatibility
    if (prompt.platform && prompt.formatting) {
      const platformErrors = this.validatePlatformFormatting(
        prompt.platform,
        prompt.formatting
      );
      errors.push(...platformErrors);
    }
    
    // Check token limits
    if (prompt.maxTokens && this.estimateTokens(prompt) > prompt.maxTokens) {
      errors.push('Prompt exceeds token limit');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Utility methods
   */
  generateCacheKey(systemPrompt, assetPrompt, context) {
    const key = `${systemPrompt.advisorId}_${context.contentType}_${context.platform}_${assetPrompt.date}`;
    return key;
  }

  areTonesDifferent(tone1, tone2) {
    const toneMap = {
      'professional': ['formal', 'serious', 'authoritative'],
      'friendly': ['casual', 'warm', 'approachable'],
      'educational': ['informative', 'teaching', 'explanatory']
    };
    
    const group1 = Object.entries(toneMap).find(([k, v]) => 
      k === tone1 || v.includes(tone1)
    );
    const group2 = Object.entries(toneMap).find(([k, v]) => 
      k === tone2 || v.includes(tone2)
    );
    
    return group1?.[0] !== group2?.[0];
  }

  checkComplianceViolations(content, compliance) {
    const violations = [];
    
    if (!compliance) return violations;
    
    // Check prohibited terms
    for (const term of compliance.prohibitedTerms || []) {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        violations.push(`Prohibited term: ${term}`);
      }
    }
    
    // Check required elements
    for (const element of compliance.requiredElements || []) {
      if (!content.includes(element)) {
        violations.push(`Missing required: ${element}`);
      }
    }
    
    return violations;
  }

  estimateTokens(prompt) {
    // Rough estimation: 1 token ≈ 4 characters
    const text = JSON.stringify(prompt);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Combination Strategy Classes
 */
class DefaultCombinationStrategy {
  async combine(systemPrompt, assetPrompt, weights, context) {
    return {
      role: 'system',
      content: this.mergeContent(systemPrompt, assetPrompt, weights),
      instructions: this.mergeInstructions(systemPrompt, assetPrompt, weights),
      parameters: this.mergeParameters(systemPrompt, assetPrompt),
      metadata: {
        systemVersion: systemPrompt.version,
        assetVersion: assetPrompt.version,
        combinedAt: new Date(),
        strategy: 'default'
      }
    };
  }

  mergeContent(system, asset, weights) {
    const sections = [];
    
    // System identity (high weight)
    if (weights.system.branding > 0.5) {
      sections.push(system.branding?.description);
    }
    
    // Market context (dynamic weight)
    if (weights.asset.marketData > 0.3) {
      sections.push(asset.market?.summary);
    }
    
    // Compliance (always included)
    sections.push(system.compliance?.requirements);
    
    return sections.filter(Boolean).join('\n\n');
  }

  mergeInstructions(system, asset, weights) {
    const instructions = [];
    
    // System instructions (base)
    instructions.push(...(system.instructions || []));
    
    // Asset instructions (conditional)
    if (weights.asset.trending > 0.5) {
      instructions.push(...(asset.trendingInstructions || []));
    }
    
    return instructions;
  }

  mergeParameters(system, asset) {
    return {
      ...system.parameters,
      ...asset.parameters,
      // System parameters take precedence
      temperature: system.parameters?.temperature || asset.parameters?.temperature || 0.7
    };
  }
}

class MarketUpdateStrategy extends DefaultCombinationStrategy {
  async combine(systemPrompt, assetPrompt, weights, context) {
    const base = await super.combine(systemPrompt, assetPrompt, weights, context);
    
    // Emphasize market data
    base.content = this.prioritizeMarketData(base.content, assetPrompt.market);
    
    // Add real-time data instructions
    base.instructions.push('Include latest market indices and key movers');
    base.instructions.push('Maintain factual accuracy with data');
    
    // Lower creativity for factual content
    base.parameters.temperature = 0.3;
    
    return base;
  }

  prioritizeMarketData(content, marketData) {
    const marketSection = `
Current Market Snapshot:
- Nifty: ${marketData?.indices?.nifty50?.value || 'N/A'}
- Sensex: ${marketData?.indices?.sensex?.value || 'N/A'}
- Market Sentiment: ${marketData?.sentiment || 'neutral'}
    `.trim();
    
    return marketSection + '\n\n' + content;
  }
}

class EducationalStrategy extends DefaultCombinationStrategy {
  async combine(systemPrompt, assetPrompt, weights, context) {
    const base = await super.combine(systemPrompt, assetPrompt, weights, context);
    
    // Emphasize teaching elements
    base.instructions.push('Explain concepts clearly with examples');
    base.instructions.push('Use analogies to simplify complex topics');
    base.instructions.push('Include actionable takeaways');
    
    // Moderate creativity for explanations
    base.parameters.temperature = 0.6;
    
    // Add educational themes
    if (assetPrompt.educational?.themes) {
      base.educationalFocus = assetPrompt.educational.themes[0];
    }
    
    return base;
  }
}

/**
 * Conflict Resolver Classes
 */
class ToneConflictResolver {
  async resolve(prompt, conflict, context) {
    // Platform-based resolution
    if (context.platform === 'linkedin') {
      // Prefer professional tone for LinkedIn
      prompt.tone = 'professional';
    } else if (context.platform === 'whatsapp') {
      // Prefer friendly tone for WhatsApp
      prompt.tone = 'friendly';
    } else {
      // Use system preference as default
      prompt.tone = conflict.systemValue;
    }
    
    return prompt;
  }
}

class LengthConflictResolver {
  async resolve(prompt, conflict, context) {
    // Always respect system maximum
    prompt.maxLength = Math.min(conflict.systemValue, conflict.assetValue);
    
    // Adjust content generation instructions
    if (prompt.maxLength < conflict.assetValue) {
      prompt.instructions.push(`Limit response to ${prompt.maxLength} characters`);
    }
    
    return prompt;
  }
}

class ComplianceConflictResolver {
  async resolve(prompt, conflict, context) {
    // Remove all violations
    for (const violation of conflict.violations) {
      prompt.content = this.removeViolation(prompt.content, violation);
    }
    
    // Add compliance reminder
    prompt.instructions.unshift('Ensure full compliance with SEBI regulations');
    
    // Flag for manual review if needed
    if (conflict.violations.length > 2) {
      prompt.requiresReview = true;
    }
    
    return prompt;
  }

  removeViolation(content, violation) {
    // Implementation to clean content
    return content.replace(violation, '');
  }
}

/**
 * Weight Calculator Classes
 */
class TimeBasedWeightCalculator {
  calculate(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth();
    const hour = date.getHours();
    
    const weights = {
      styleWeight: 1.0,
      educationalWeight: 0.5,
      seasonalWeight: 0.3
    };
    
    // Tax season (Jan-Mar)
    if (month >= 0 && month <= 2) {
      weights.educationalWeight = 0.8; // More tax education
      weights.seasonalWeight = 0.9;    // High seasonal relevance
    }
    
    // Market hours
    if (hour >= 9 && hour <= 15) {
      weights.styleWeight = 0.7; // More formal during market hours
    }
    
    return weights;
  }
}

class PerformanceWeightCalculator {
  async calculate(advisorId, contentType) {
    // Fetch historical performance
    // const performance = await this.getHistoricalPerformance(advisorId, contentType);
    
    return {
      trendingWeight: 0.7,  // Based on past trending content success
      educationalWeight: 0.6 // Based on educational content engagement
    };
  }
}

class ContextWeightCalculator {
  calculate(context) {
    const weights = {
      marketRelevance: 0.5,
      personalization: 0.5
    };
    
    // Increase market relevance during volatility
    if (context.marketVolatility === 'high') {
      weights.marketRelevance = 0.9;
    }
    
    // Increase personalization for premium advisors
    if (context.advisorTier === 'premium') {
      weights.personalization = 0.8;
    }
    
    return weights;
  }
}

module.exports = PromptCombinationAlgorithm;