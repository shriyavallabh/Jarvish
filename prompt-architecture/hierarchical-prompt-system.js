/**
 * Hierarchical Prompt Architecture for Jarvish Platform
 * 
 * Two-layer prompt system combining stable advisor configuration
 * with dynamic daily market insights for optimal content generation
 */

class HierarchicalPromptSystem {
  constructor() {
    this.systemPrompts = new Map(); // Advisor-specific configurations
    this.assetPrompts = new Map();  // Daily dynamic content
    this.promptCache = new Map();   // Combined prompt cache
    this.performanceMetrics = new Map();
  }

  /**
   * SYSTEM PROMPT LAYER - Stable, advisor-configurable
   * Persists across sessions, updated quarterly or on-demand
   */
  createSystemPrompt(advisorId, config) {
    const systemPrompt = {
      id: `system_${advisorId}_${Date.now()}`,
      advisorId,
      version: '1.0.0',
      createdAt: new Date(),
      
      // Branding Guidelines
      branding: {
        businessName: config.businessName,
        tagline: config.tagline,
        colors: {
          primary: config.primaryColor || '#1E40AF',
          secondary: config.secondaryColor || '#60A5FA',
          accent: config.accentColor || '#F59E0B'
        },
        tone: config.tone || 'professional-friendly', // professional, casual, educational, motivational
        voiceAttributes: config.voiceAttributes || ['trustworthy', 'knowledgeable', 'approachable'],
        languagePreference: config.language || 'hinglish', // english, hindi, hinglish, regional
        emojiUsage: config.emojiUsage || 'moderate' // none, minimal, moderate, frequent
      },

      // Compliance Requirements
      compliance: {
        sebiRegistration: config.sebiNumber,
        mandatoryDisclaimer: config.customDisclaimer || this.getDefaultDisclaimer(),
        prohibitedTerms: [
          'guaranteed returns',
          'risk-free',
          'assured profits',
          'no loss',
          'definite gains'
        ],
        requiredElements: [
          'risk_disclosure',
          'advisor_identity',
          'registration_number',
          'past_performance_caveat'
        ],
        maxEmojiCount: 3,
        minDisclaimerVisibility: 0.8 // 80% prominence
      },

      // Platform Preferences
      platforms: {
        whatsapp: {
          enabled: config.whatsappEnabled !== false,
          formatting: {
            maxLength: 1024,
            boldHeaders: true,
            bulletPoints: '• ',
            lineBreaks: 'double',
            ctaStyle: 'emoji-enhanced' // 📞 Call Now
          },
          preferredPostTime: config.whatsappPostTime || '09:00',
          messageTypes: ['morning_insights', 'market_updates', 'educational']
        },
        linkedin: {
          enabled: config.linkedinEnabled !== false,
          formatting: {
            maxLength: 3000,
            hashtagCount: 5,
            mentionStrategy: 'thought_leaders',
            imageRequirement: true,
            pollIntegration: config.linkedinPolls || false
          },
          preferredPostTime: config.linkedinPostTime || '18:00',
          contentTypes: ['thought_leadership', 'market_analysis', 'success_stories']
        },
        instagram: {
          enabled: config.instagramEnabled || false,
          formatting: {
            captionLength: 2200,
            hashtagCount: 30,
            storyMentions: true,
            reelHooks: true
          }
        }
      },

      // Advisor Signature & Contact
      signature: {
        name: config.advisorName,
        designation: config.designation || 'SEBI Registered Investment Advisor',
        experience: config.yearsExperience || '5+ years',
        specialization: config.specialization || ['Equity', 'Mutual Funds', 'Financial Planning'],
        contact: {
          phone: config.phone,
          email: config.email,
          website: config.website,
          calendlyLink: config.calendlyLink
        },
        achievements: config.achievements || [],
        clientTestimonials: config.testimonials || []
      },

      // Risk & Communication Style
      communication: {
        riskTolerance: config.riskProfile || 'balanced', // conservative, balanced, aggressive
        targetAudience: config.targetAudience || 'retail_investors',
        ageGroup: config.ageGroup || '25-45',
        incomeLevel: config.incomeLevel || 'middle_to_high',
        educationFocus: config.educationFocus || 0.7, // 70% educational content
        promotionalLimit: 0.3, // Max 30% promotional
        
        contentMix: {
          educational: 0.4,
          market_updates: 0.3,
          investment_tips: 0.2,
          success_stories: 0.1
        },
        
        emotionalTriggers: config.emotionalTriggers || [
          'financial_security',
          'wealth_creation',
          'retirement_planning',
          'children_education'
        ]
      },

      // Custom Instructions
      customInstructions: config.customInstructions || [],
      blacklistedTopics: config.blacklistedTopics || [],
      preferredExamples: config.preferredExamples || []
    };

    this.systemPrompts.set(advisorId, systemPrompt);
    return systemPrompt;
  }

  /**
   * ASSET PROMPT LAYER - Dynamic, daily-updated
   * Refreshed every 24 hours with market data and trends
   */
  generateDailyAssetPrompt() {
    const assetPrompt = {
      id: `asset_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      version: '1.0.0',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      
      // Current Market Insights
      marketInsights: {
        indices: {
          nifty50: { value: 0, change: 0, trend: 'neutral' },
          sensex: { value: 0, change: 0, trend: 'neutral' },
          bankNifty: { value: 0, change: 0, trend: 'neutral' }
        },
        topGainers: [],
        topLosers: [],
        sectorPerformance: {},
        globalMarkets: {},
        vixLevel: 0,
        marketSentiment: 'neutral', // bearish, neutral, bullish
        keyEvents: [],
        economicIndicators: {
          inflation: 0,
          gdpGrowth: 0,
          interestRate: 0,
          dollarRate: 0
        }
      },

      // Trending Topics & Viral Patterns
      trending: {
        topics: [
          { topic: 'Budget 2024 Impact', engagement: 0.85, sentiment: 'positive' },
          { topic: 'ELSS Tax Benefits', engagement: 0.72, sentiment: 'neutral' },
          { topic: 'Gold vs Equity', engagement: 0.68, sentiment: 'mixed' }
        ],
        viralFormats: [
          { format: 'carousel_tips', platform: 'instagram', effectiveness: 0.89 },
          { format: 'market_wrap', platform: 'whatsapp', effectiveness: 0.76 },
          { format: 'myth_busters', platform: 'linkedin', effectiveness: 0.81 }
        ],
        hashtagPerformance: {},
        competitorContent: [],
        audienceQuestions: [] // From comments/DMs
      },

      // Educational Themes
      educationalThemes: {
        beginnerTopics: [
          'What is SIP?',
          'Understanding Risk vs Return',
          'Power of Compounding',
          'Asset Allocation Basics'
        ],
        intermediateTopics: [
          'Portfolio Rebalancing',
          'Tax Loss Harvesting',
          'Sector Rotation Strategy',
          'Reading Financial Statements'
        ],
        advancedTopics: [
          'Options Strategies',
          'Global Diversification',
          'Alternative Investments',
          'Estate Planning'
        ],
        currentFocus: 'tax_planning', // Seasonal focus
        explainerSeries: [],
        caseStudies: []
      },

      // Investment Tips & Strategies
      investmentTips: {
        timelessWisdom: [
          'Start early, stay consistent',
          'Diversification is key',
          'Time in market beats timing the market'
        ],
        currentOpportunities: [],
        sectorRecommendations: [],
        riskWarnings: [],
        portfolioIdeas: {
          conservative: {},
          balanced: {},
          aggressive: {}
        }
      },

      // Seasonal & Event-Based Content
      seasonal: {
        currentSeason: this.getCurrentSeason(),
        upcomingEvents: [
          { event: 'Budget', date: '2024-02-01', contentIdeas: [] },
          { event: 'Tax Planning', date: '2024-03-31', contentIdeas: [] }
        ],
        festivals: [],
        marketHolidays: [],
        ipoCalendar: [],
        earningsCalendar: []
      },

      // Performance Optimized Strategies
      performanceStrategies: {
        highEngagementWords: [
          'revealed', 'mistakes', 'secret', 'simple', 'proven',
          'warning', 'opportunity', 'exclusive', 'limited'
        ],
        optimalPostLength: {
          whatsapp: 150,
          linkedin: 500,
          instagram: 125
        },
        bestPerformingCTAs: [
          'Share if you found this helpful',
          'Save for later reference',
          'Tag someone who needs this',
          'Book a free consultation'
        ],
        emotionalHooks: [
          'Are you making this costly mistake?',
          'What successful investors do differently',
          'The strategy that changed everything'
        ]
      },

      // Content Templates
      templates: {
        marketUpdate: '',
        educationalPost: '',
        tipOfTheDay: '',
        mythBuster: '',
        successStory: '',
        warningAlert: ''
      }
    };

    // Store with daily key
    const dateKey = new Date().toISOString().split('T')[0];
    this.assetPrompts.set(dateKey, assetPrompt);
    
    return assetPrompt;
  }

  /**
   * PROMPT COMBINATION ALGORITHM
   * Merges system and asset prompts intelligently
   */
  combinePrompts(advisorId, contentType, platform) {
    const cacheKey = `${advisorId}_${contentType}_${platform}_${new Date().toISOString().split('T')[0]}`;
    
    // Check cache first
    if (this.promptCache.has(cacheKey)) {
      const cached = this.promptCache.get(cacheKey);
      if (cached.expiresAt > Date.now()) {
        return cached.prompt;
      }
    }

    const systemPrompt = this.systemPrompts.get(advisorId);
    const assetPrompt = this.assetPrompts.get(new Date().toISOString().split('T')[0]);

    if (!systemPrompt || !assetPrompt) {
      throw new Error('Missing required prompts for combination');
    }

    // Intelligent merge based on content type
    const combinedPrompt = {
      role: 'system',
      content: this.buildCombinedPromptContent(systemPrompt, assetPrompt, contentType, platform),
      
      // Merge parameters with priority
      parameters: {
        temperature: this.getOptimalTemperature(contentType),
        max_tokens: this.getMaxTokens(platform),
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      },

      // Validation rules
      validation: {
        ...systemPrompt.compliance,
        platformRules: systemPrompt.platforms[platform],
        performanceTargets: assetPrompt.performanceStrategies
      },

      // Metadata for tracking
      metadata: {
        advisorId,
        systemVersion: systemPrompt.version,
        assetVersion: assetPrompt.version,
        contentType,
        platform,
        generatedAt: new Date()
      }
    };

    // Cache the combined prompt
    this.promptCache.set(cacheKey, {
      prompt: combinedPrompt,
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour cache
    });

    return combinedPrompt;
  }

  buildCombinedPromptContent(systemPrompt, assetPrompt, contentType, platform) {
    const sections = [];

    // Core identity section
    sections.push(`You are creating content for ${systemPrompt.signature.name}, a ${systemPrompt.signature.designation}.`);
    
    // Brand voice section
    sections.push(`Brand Voice: ${systemPrompt.branding.tone} tone with ${systemPrompt.branding.voiceAttributes.join(', ')} characteristics.`);
    
    // Platform-specific formatting
    const platformConfig = systemPrompt.platforms[platform];
    sections.push(`Platform: ${platform.toUpperCase()} - Max length: ${platformConfig.formatting.maxLength} characters.`);
    
    // Current market context
    sections.push(`Market Context: ${assetPrompt.marketInsights.marketSentiment} sentiment.`);
    
    // Content-specific instructions
    sections.push(this.getContentTypeInstructions(contentType, assetPrompt));
    
    // Compliance requirements
    sections.push(`Compliance: Include SEBI registration ${systemPrompt.compliance.sebiRegistration}. Avoid prohibited terms.`);
    
    // Performance optimization
    sections.push(`Optimization: Use engagement words like ${assetPrompt.performanceStrategies.highEngagementWords.slice(0, 3).join(', ')}.`);

    return sections.join('\n\n');
  }

  getContentTypeInstructions(contentType, assetPrompt) {
    const instructions = {
      'market_update': `Create a market update focusing on: ${JSON.stringify(assetPrompt.marketInsights.indices)}`,
      'educational': `Create educational content on: ${assetPrompt.educationalThemes.currentFocus}`,
      'investment_tip': `Share investment wisdom: ${assetPrompt.investmentTips.timelessWisdom[0]}`,
      'myth_buster': 'Bust a common investment myth with facts and examples',
      'success_story': 'Share a client success story (anonymized) demonstrating value'
    };
    
    return instructions[contentType] || 'Create engaging financial content';
  }

  getOptimalTemperature(contentType) {
    const temperatures = {
      'market_update': 0.3,  // Factual, low creativity
      'educational': 0.5,    // Balanced
      'investment_tip': 0.6, // Slightly creative
      'myth_buster': 0.7,    // More creative
      'success_story': 0.8   // Most creative
    };
    return temperatures[contentType] || 0.5;
  }

  getMaxTokens(platform) {
    const tokens = {
      'whatsapp': 300,
      'linkedin': 800,
      'instagram': 400,
      'twitter': 100
    };
    return tokens[platform] || 500;
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'tax_planning';
    if (month >= 3 && month <= 5) return 'portfolio_review';
    if (month >= 6 && month <= 8) return 'monsoon_investing';
    return 'year_end_planning';
  }

  getDefaultDisclaimer() {
    return 'Investments are subject to market risks. Please read all scheme-related documents carefully before investing. Past performance is not indicative of future results.';
  }

  /**
   * Track performance metrics for prompt combinations
   */
  trackPerformance(promptId, metrics) {
    this.performanceMetrics.set(promptId, {
      ...metrics,
      timestamp: new Date()
    });
  }

  /**
   * Get performance insights for optimization
   */
  getPerformanceInsights(advisorId, period = 7) {
    const cutoff = Date.now() - (period * 24 * 60 * 60 * 1000);
    const relevantMetrics = Array.from(this.performanceMetrics.entries())
      .filter(([id, data]) => data.timestamp.getTime() > cutoff)
      .map(([id, data]) => data);

    return {
      averageEngagement: this.calculateAverage(relevantMetrics, 'engagement'),
      topPerformingContent: this.getTopPerformers(relevantMetrics),
      optimalPostTimes: this.analyzePostTimes(relevantMetrics),
      recommendedAdjustments: this.generateRecommendations(relevantMetrics)
    };
  }

  calculateAverage(metrics, field) {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + (m[field] || 0), 0) / metrics.length;
  }

  getTopPerformers(metrics) {
    return metrics
      .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
      .slice(0, 5);
  }

  analyzePostTimes(metrics) {
    // Group by hour and analyze engagement
    const hourlyEngagement = {};
    metrics.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      if (!hourlyEngagement[hour]) {
        hourlyEngagement[hour] = [];
      }
      hourlyEngagement[hour].push(m.engagement || 0);
    });

    // Calculate average for each hour
    const hourlyAverages = {};
    Object.keys(hourlyEngagement).forEach(hour => {
      hourlyAverages[hour] = this.calculateAverage(
        hourlyEngagement[hour].map(e => ({ engagement: e })), 
        'engagement'
      );
    });

    return hourlyAverages;
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    const avgEngagement = this.calculateAverage(metrics, 'engagement');
    if (avgEngagement < 0.5) {
      recommendations.push('Consider increasing emotional hooks in content');
      recommendations.push('Test more trending topics from daily assets');
    }

    return recommendations;
  }
}

module.exports = HierarchicalPromptSystem;