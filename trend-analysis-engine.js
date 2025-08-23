/**
 * Real-time Trend Analysis Engine
 * Monitors, analyzes, and predicts viral financial content trends
 */

const { EventEmitter } = require('events');
const natural = require('natural');
const axios = require('axios');

class TrendAnalysisEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      updateInterval: config.updateInterval || 900000, // 15 minutes
      trendThreshold: config.trendThreshold || 0.6,
      predictionWindow: config.predictionWindow || 7, // days
      sentimentAnalysis: config.sentimentAnalysis !== false,
      ...config
    };

    // Trend storage
    this.currentTrends = new Map();
    this.historicalTrends = new Map();
    this.trendPredictions = new Map();
    this.viralPatterns = new Map();
    
    // Analytics
    this.trendMetrics = new Map();
    this.performanceData = new Map();
    this.successPatterns = new Map();
    
    // Initialize components
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
    
    this.initialize();
  }

  /**
   * Initialize trend monitoring
   */
  async initialize() {
    await this.loadHistoricalData();
    await this.identifyViralPatterns();
    this.startMonitoring();
    
    console.log('Trend Analysis Engine initialized');
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring() {
    // Update trends at regular intervals
    setInterval(() => this.updateTrends(), this.config.updateInterval);
    
    // Initial update
    this.updateTrends();
  }

  /**
   * Update all trend sources
   */
  async updateTrends() {
    try {
      const sources = await Promise.all([
        this.fetchFinancialNews(),
        this.fetchSocialMediaTrends(),
        this.fetchMarketData(),
        this.fetchSearchTrends(),
        this.fetchRegulatoryUpdates()
      ]);
      
      // Aggregate and analyze
      const aggregatedTrends = this.aggregateTrendData(sources);
      const analyzedTrends = await this.analyzeTrends(aggregatedTrends);
      const predictions = await this.predictTrendTrajectory(analyzedTrends);
      
      // Update storage
      this.updateTrendStorage(analyzedTrends, predictions);
      
      // Emit update event
      this.emit('trends:updated', {
        trends: Array.from(this.currentTrends.values()),
        predictions: Array.from(this.trendPredictions.values()),
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error updating trends:', error);
      this.emit('trends:error', error);
    }
  }

  /**
   * Fetch financial news trends
   */
  async fetchFinancialNews() {
    // In production, integrate with news APIs
    const mockData = [
      {
        topic: 'Union Budget 2024',
        mentions: 125000,
        sentiment: 0.65,
        keywords: ['budget', 'tax', 'fiscal deficit', 'capital expenditure'],
        sources: ['economic times', 'business standard', 'mint'],
        category: 'policy'
      },
      {
        topic: 'Nifty Record High',
        mentions: 98000,
        sentiment: 0.82,
        keywords: ['nifty', 'sensex', 'all-time high', 'bull market'],
        sources: ['moneycontrol', 'cnbc', 'bloomberg'],
        category: 'market'
      },
      {
        topic: 'RBI Rate Decision',
        mentions: 76000,
        sentiment: 0.45,
        keywords: ['rbi', 'repo rate', 'inflation', 'monetary policy'],
        sources: ['rbi', 'reuters', 'economic times'],
        category: 'policy'
      },
      {
        topic: 'Gold Investment Surge',
        mentions: 54000,
        sentiment: 0.72,
        keywords: ['gold', 'sovereign gold bond', 'safe haven', 'investment'],
        sources: ['goodreturns', 'economic times', 'business line'],
        category: 'investment'
      },
      {
        topic: 'IPO Frenzy',
        mentions: 43000,
        sentiment: 0.78,
        keywords: ['ipo', 'listing gains', 'subscription', 'grey market'],
        sources: ['chittorgarh', 'moneycontrol', 'business standard'],
        category: 'market'
      }
    ];
    
    return mockData.map(item => ({
      ...item,
      source: 'financial_news',
      timestamp: new Date(),
      velocity: this.calculateVelocity(item.mentions)
    }));
  }

  /**
   * Fetch social media trends
   */
  async fetchSocialMediaTrends() {
    // In production, integrate with social media APIs
    const trends = [
      {
        topic: '#BudgetMemes',
        mentions: 45000,
        engagement: 0.12,
        platform: 'twitter',
        sentiment: 0.68
      },
      {
        topic: 'Tax Saving Tips',
        mentions: 38000,
        engagement: 0.18,
        platform: 'linkedin',
        sentiment: 0.75
      },
      {
        topic: 'Crypto Regulation',
        mentions: 32000,
        engagement: 0.15,
        platform: 'twitter',
        sentiment: 0.42
      },
      {
        topic: 'SIP vs Lumpsum',
        mentions: 28000,
        engagement: 0.22,
        platform: 'youtube',
        sentiment: 0.65
      },
      {
        topic: 'NPS Benefits',
        mentions: 21000,
        engagement: 0.19,
        platform: 'facebook',
        sentiment: 0.71
      }
    ];
    
    return trends.map(trend => ({
      ...trend,
      source: 'social_media',
      timestamp: new Date(),
      viralPotential: this.calculateViralPotential(trend)
    }));
  }

  /**
   * Fetch market data trends
   */
  async fetchMarketData() {
    // In production, integrate with market data APIs
    return [
      {
        topic: 'Banking Sector Rally',
        change: 3.5,
        volume: 'high',
        momentum: 0.78,
        sectors: ['banking', 'financial services']
      },
      {
        topic: 'IT Sector Correction',
        change: -2.1,
        volume: 'moderate',
        momentum: 0.35,
        sectors: ['it', 'technology']
      },
      {
        topic: 'Small Cap Surge',
        change: 4.2,
        volume: 'very high',
        momentum: 0.85,
        sectors: ['small cap', 'mid cap']
      }
    ].map(item => ({
      ...item,
      source: 'market_data',
      timestamp: new Date(),
      tradingOpportunity: this.assessTradingOpportunity(item)
    }));
  }

  /**
   * Aggregate trend data from all sources
   */
  aggregateTrendData(sources) {
    const aggregated = new Map();
    
    sources.flat().forEach(trend => {
      const key = this.normalizeTrendTopic(trend.topic);
      
      if (aggregated.has(key)) {
        const existing = aggregated.get(key);
        existing.mentions += trend.mentions || 0;
        existing.sources.push(trend.source);
        existing.dataPoints.push(trend);
      } else {
        aggregated.set(key, {
          topic: trend.topic,
          normalizedTopic: key,
          mentions: trend.mentions || 0,
          sources: [trend.source],
          dataPoints: [trend],
          firstSeen: new Date()
        });
      }
    });
    
    return Array.from(aggregated.values());
  }

  /**
   * Analyze trends for insights
   */
  async analyzeTrends(trends) {
    const analyzed = [];
    
    for (const trend of trends) {
      const analysis = {
        ...trend,
        momentum: this.calculateMomentum(trend),
        sentiment: this.analyzeSentiment(trend),
        category: this.categorizeTrend(trend),
        lifecycle: this.determineTrendLifecycle(trend),
        viralScore: await this.calculateViralScore(trend),
        relevance: this.assessFinancialRelevance(trend),
        competition: await this.assessCompetitionLevel(trend),
        opportunity: this.identifyOpportunity(trend)
      };
      
      analyzed.push(analysis);
    }
    
    // Sort by opportunity score
    analyzed.sort((a, b) => b.opportunity.score - a.opportunity.score);
    
    return analyzed;
  }

  /**
   * Calculate trend momentum
   */
  calculateMomentum(trend) {
    const currentMentions = trend.mentions;
    const historicalData = this.getHistoricalData(trend.normalizedTopic);
    
    if (!historicalData || historicalData.length === 0) {
      return 0.5; // Neutral for new trends
    }
    
    const avgHistorical = historicalData.reduce((sum, d) => sum + d.mentions, 0) / historicalData.length;
    const growthRate = (currentMentions - avgHistorical) / avgHistorical;
    
    // Normalize to 0-1 scale
    return Math.max(0, Math.min(1, 0.5 + growthRate));
  }

  /**
   * Analyze sentiment across sources
   */
  analyzeSentiment(trend) {
    const sentiments = trend.dataPoints
      .filter(dp => dp.sentiment !== undefined)
      .map(dp => dp.sentiment);
    
    if (sentiments.length === 0) {
      return { score: 0.5, label: 'neutral' };
    }
    
    const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
    
    return {
      score: avgSentiment,
      label: this.getSentimentLabel(avgSentiment),
      distribution: this.getSentimentDistribution(sentiments)
    };
  }

  /**
   * Determine trend lifecycle stage
   */
  determineTrendLifecycle(trend) {
    const momentum = trend.momentum || 0.5;
    const age = Date.now() - new Date(trend.firstSeen).getTime();
    const ageInDays = age / (24 * 60 * 60 * 1000);
    
    if (ageInDays < 1 && momentum > 0.7) {
      return { stage: 'emerging', timeToAct: 'immediate' };
    } else if (ageInDays < 3 && momentum > 0.6) {
      return { stage: 'growing', timeToAct: '1-2 days' };
    } else if (ageInDays < 7 && momentum > 0.5) {
      return { stage: 'peak', timeToAct: '2-3 days' };
    } else if (momentum < 0.3) {
      return { stage: 'declining', timeToAct: 'past peak' };
    } else {
      return { stage: 'mature', timeToAct: '3-5 days' };
    }
  }

  /**
   * Calculate viral score
   */
  async calculateViralScore(trend) {
    const factors = {
      momentum: trend.momentum || 0.5,
      sentiment: trend.sentiment?.score || 0.5,
      mentions: Math.min(1, trend.mentions / 100000),
      sources: Math.min(1, trend.sources.length / 5),
      engagement: this.calculateEngagement(trend)
    };
    
    // Weighted calculation
    const weights = {
      momentum: 0.3,
      sentiment: 0.2,
      mentions: 0.2,
      sources: 0.15,
      engagement: 0.15
    };
    
    let score = 0;
    for (const [factor, value] of Object.entries(factors)) {
      score += value * weights[factor];
    }
    
    return {
      score,
      factors,
      prediction: score > 0.7 ? 'high viral potential' : score > 0.5 ? 'moderate potential' : 'low potential'
    };
  }

  /**
   * Identify opportunity in trend
   */
  identifyOpportunity(trend) {
    const opportunities = [];
    
    // Content opportunity
    if (trend.momentum > 0.6 && trend.competition < 0.5) {
      opportunities.push({
        type: 'content',
        description: 'Create content before saturation',
        urgency: 'high'
      });
    }
    
    // Educational opportunity
    if (trend.sentiment?.score < 0.5) {
      opportunities.push({
        type: 'educational',
        description: 'Address confusion or concerns',
        urgency: 'medium'
      });
    }
    
    // Viral opportunity
    if (trend.viralScore?.score > 0.7) {
      opportunities.push({
        type: 'viral',
        description: 'High shareability potential',
        urgency: 'immediate'
      });
    }
    
    const score = opportunities.reduce((sum, opp) => 
      sum + (opp.urgency === 'immediate' ? 1 : opp.urgency === 'high' ? 0.7 : 0.4), 0
    ) / 3;
    
    return {
      score,
      opportunities,
      recommendation: this.generateRecommendation(trend, opportunities)
    };
  }

  /**
   * Predict trend trajectory
   */
  async predictTrendTrajectory(trends) {
    const predictions = [];
    
    for (const trend of trends) {
      const historical = this.getHistoricalData(trend.normalizedTopic);
      const prediction = {
        topic: trend.topic,
        currentMomentum: trend.momentum,
        predictions: {}
      };
      
      // Predict for next 7 days
      for (let day = 1; day <= this.config.predictionWindow; day++) {
        prediction.predictions[`day_${day}`] = {
          momentum: this.predictMomentum(trend, day),
          mentions: this.predictMentions(trend, day),
          viralProbability: this.predictViralProbability(trend, day),
          confidence: this.calculatePredictionConfidence(trend, day)
        };
      }
      
      // Identify peak
      const peakDay = this.identifyPeakDay(prediction.predictions);
      prediction.peakDay = peakDay;
      prediction.recommendation = this.generateTimingRecommendation(prediction);
      
      predictions.push(prediction);
    }
    
    return predictions;
  }

  /**
   * Identify viral patterns from historical data
   */
  async identifyViralPatterns() {
    const patterns = [
      {
        name: 'controversy_driven',
        indicators: ['high sentiment variance', 'debate keywords', 'opposing views'],
        avgViralScore: 0.82,
        examples: ['old vs new tax regime', 'active vs passive investing']
      },
      {
        name: 'fear_driven',
        indicators: ['negative sentiment', 'urgency keywords', 'loss aversion'],
        avgViralScore: 0.78,
        examples: ['market crash predictions', 'tax deadline warnings']
      },
      {
        name: 'opportunity_driven',
        indicators: ['positive sentiment', 'gain keywords', 'limited time'],
        avgViralScore: 0.75,
        examples: ['ipo opportunities', 'tax saving tips']
      },
      {
        name: 'education_driven',
        indicators: ['how-to keywords', 'explanation', 'simplification'],
        avgViralScore: 0.71,
        examples: ['budget explainers', 'investment guides']
      },
      {
        name: 'news_driven',
        indicators: ['breaking keywords', 'announcement', 'official'],
        avgViralScore: 0.85,
        examples: ['rbi announcements', 'budget highlights']
      }
    ];
    
    patterns.forEach(pattern => {
      this.viralPatterns.set(pattern.name, pattern);
    });
  }

  /**
   * Match trend to viral patterns
   */
  matchViralPatterns(trend) {
    const matches = [];
    
    for (const [name, pattern] of this.viralPatterns) {
      const matchScore = this.calculatePatternMatch(trend, pattern);
      if (matchScore > 0.5) {
        matches.push({
          pattern: name,
          score: matchScore,
          expectedViralScore: pattern.avgViralScore,
          strategy: this.getPatternStrategy(pattern)
        });
      }
    }
    
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate content recommendations based on trends
   */
  generateContentRecommendations(trends, advisorProfile) {
    const recommendations = [];
    
    for (const trend of trends.slice(0, 10)) {
      const patterns = this.matchViralPatterns(trend);
      const timing = this.calculateOptimalTiming(trend);
      
      recommendations.push({
        trend: trend.topic,
        urgency: trend.lifecycle.timeToAct,
        viralScore: trend.viralScore.score,
        patterns: patterns.slice(0, 2),
        contentIdeas: this.generateContentIdeas(trend, patterns),
        timing,
        platform: this.recommendPlatform(trend),
        hooks: this.generateHooks(trend),
        visuals: this.recommendVisuals(trend),
        expectedEngagement: this.predictEngagement(trend, advisorProfile)
      });
    }
    
    return recommendations;
  }

  /**
   * Generate content ideas for trend
   */
  generateContentIdeas(trend, patterns) {
    const ideas = [];
    
    // Pattern-based ideas
    patterns.forEach(pattern => {
      ideas.push(...this.getPatternContentIdeas(pattern, trend));
    });
    
    // Trend-specific ideas
    if (trend.category === 'policy') {
      ideas.push({
        type: 'explainer',
        title: `${trend.topic}: What It Means for You`,
        angle: 'simplification'
      });
      ideas.push({
        type: 'comparison',
        title: `Before vs After: ${trend.topic} Changes`,
        angle: 'visual comparison'
      });
    }
    
    if (trend.category === 'market') {
      ideas.push({
        type: 'analysis',
        title: `Is ${trend.topic} Sustainable? Expert View`,
        angle: 'contrarian perspective'
      });
      ideas.push({
        type: 'guide',
        title: `How to Benefit from ${trend.topic}`,
        angle: 'actionable advice'
      });
    }
    
    return ideas.slice(0, 5);
  }

  /**
   * Generate viral hooks for trend
   */
  generateHooks(trend) {
    const hooks = [];
    
    // Question hooks
    hooks.push(`Did you know about ${trend.topic}?`);
    hooks.push(`Why is everyone talking about ${trend.topic}?`);
    
    // Number hooks
    if (trend.mentions > 50000) {
      hooks.push(`${Math.floor(trend.mentions/1000)}K people are discussing ${trend.topic}`);
    }
    
    // Urgency hooks
    if (trend.lifecycle.stage === 'emerging') {
      hooks.push(`Breaking: ${trend.topic} - Act Now`);
    }
    
    // Controversy hooks
    if (trend.sentiment?.distribution?.negative > 0.3) {
      hooks.push(`The Truth About ${trend.topic} Nobody Tells You`);
    }
    
    return hooks;
  }

  /**
   * Helper methods
   */
  
  calculateVelocity(mentions) {
    // Calculate rate of change
    return Math.min(1, mentions / 100000);
  }
  
  calculateViralPotential(trend) {
    return trend.engagement * 0.4 + 
           (trend.mentions / 50000) * 0.3 + 
           trend.sentiment * 0.3;
  }
  
  assessTradingOpportunity(marketData) {
    if (Math.abs(marketData.change) > 3 && marketData.momentum > 0.7) {
      return 'high';
    } else if (Math.abs(marketData.change) > 2 && marketData.momentum > 0.5) {
      return 'moderate';
    }
    return 'low';
  }
  
  normalizeTrendTopic(topic) {
    return topic.toLowerCase()
      .replace(/[#@]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }
  
  categorizeTrend(trend) {
    const categories = {
      policy: ['budget', 'rbi', 'sebi', 'regulation', 'tax'],
      market: ['nifty', 'sensex', 'stock', 'ipo', 'trading'],
      investment: ['mutual fund', 'sip', 'gold', 'real estate', 'crypto'],
      personal_finance: ['saving', 'loan', 'insurance', 'retirement']
    };
    
    const topic = trend.topic.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => topic.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }
  
  assessFinancialRelevance(trend) {
    const relevanceFactors = {
      hasFinancialKeywords: 0,
      hasNumbers: 0,
      hasOfficialSource: 0,
      impactsInvestors: 0
    };
    
    // Check keywords
    const financialKeywords = ['investment', 'tax', 'market', 'savings', 'returns'];
    if (financialKeywords.some(k => trend.topic.toLowerCase().includes(k))) {
      relevanceFactors.hasFinancialKeywords = 1;
    }
    
    // Check for numbers/percentages
    if (/\d+%|\d+ crore|\d+ lakh/i.test(trend.topic)) {
      relevanceFactors.hasNumbers = 1;
    }
    
    // Check sources
    const officialSources = ['rbi', 'sebi', 'nse', 'bse', 'finance ministry'];
    if (trend.sources.some(s => officialSources.some(os => s.includes(os)))) {
      relevanceFactors.hasOfficialSource = 1;
    }
    
    // Calculate score
    const score = Object.values(relevanceFactors).reduce((sum, val) => sum + val, 0) / 4;
    
    return {
      score,
      factors: relevanceFactors,
      category: score > 0.7 ? 'highly relevant' : score > 0.4 ? 'relevant' : 'marginal'
    };
  }
  
  async assessCompetitionLevel(trend) {
    // Simulate competition assessment
    const mentions = trend.mentions || 0;
    
    if (mentions > 100000) {
      return 0.9; // Very high competition
    } else if (mentions > 50000) {
      return 0.7; // High competition
    } else if (mentions > 20000) {
      return 0.5; // Moderate competition
    } else if (mentions > 5000) {
      return 0.3; // Low competition
    }
    
    return 0.1; // Very low competition
  }
  
  calculateEngagement(trend) {
    const engagementData = trend.dataPoints
      .filter(dp => dp.engagement !== undefined)
      .map(dp => dp.engagement);
    
    if (engagementData.length === 0) return 0.5;
    
    return engagementData.reduce((sum, e) => sum + e, 0) / engagementData.length;
  }
  
  getSentimentLabel(score) {
    if (score > 0.7) return 'very positive';
    if (score > 0.5) return 'positive';
    if (score > 0.3) return 'neutral';
    if (score > 0.1) return 'negative';
    return 'very negative';
  }
  
  getSentimentDistribution(sentiments) {
    const distribution = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    sentiments.forEach(sentiment => {
      if (sentiment > 0.6) distribution.positive++;
      else if (sentiment > 0.4) distribution.neutral++;
      else distribution.negative++;
    });
    
    const total = sentiments.length;
    
    return {
      positive: distribution.positive / total,
      neutral: distribution.neutral / total,
      negative: distribution.negative / total
    };
  }
  
  getHistoricalData(normalizedTopic) {
    return this.historicalTrends.get(normalizedTopic) || [];
  }
  
  updateTrendStorage(trends, predictions) {
    // Update current trends
    trends.forEach(trend => {
      this.currentTrends.set(trend.normalizedTopic, trend);
      
      // Add to historical
      if (!this.historicalTrends.has(trend.normalizedTopic)) {
        this.historicalTrends.set(trend.normalizedTopic, []);
      }
      this.historicalTrends.get(trend.normalizedTopic).push({
        ...trend,
        timestamp: new Date()
      });
    });
    
    // Update predictions
    predictions.forEach(prediction => {
      this.trendPredictions.set(prediction.topic, prediction);
    });
  }
  
  generateRecommendation(trend, opportunities) {
    if (opportunities.length === 0) {
      return 'Monitor for changes';
    }
    
    const primary = opportunities[0];
    
    if (primary.type === 'viral') {
      return `Create viral content immediately - ${trend.topic} has high share potential`;
    } else if (primary.type === 'content') {
      return `Publish content within 24 hours to capitalize on growing trend`;
    } else if (primary.type === 'educational') {
      return `Create educational content to address confusion around ${trend.topic}`;
    }
    
    return 'Consider creating content if relevant to audience';
  }
  
  predictMomentum(trend, daysAhead) {
    const currentMomentum = trend.momentum;
    const lifecycle = trend.lifecycle.stage;
    
    // Simple decay/growth model based on lifecycle
    if (lifecycle === 'emerging') {
      return Math.min(1, currentMomentum * Math.pow(1.15, daysAhead));
    } else if (lifecycle === 'growing') {
      return Math.min(1, currentMomentum * Math.pow(1.08, daysAhead));
    } else if (lifecycle === 'peak') {
      return currentMomentum * Math.pow(0.95, daysAhead);
    } else if (lifecycle === 'declining') {
      return currentMomentum * Math.pow(0.85, daysAhead);
    }
    
    return currentMomentum * Math.pow(0.98, daysAhead);
  }
  
  predictMentions(trend, daysAhead) {
    const momentum = this.predictMomentum(trend, daysAhead);
    return Math.floor(trend.mentions * momentum);
  }
  
  predictViralProbability(trend, daysAhead) {
    const momentum = this.predictMomentum(trend, daysAhead);
    const currentViral = trend.viralScore?.score || 0.5;
    
    return currentViral * momentum;
  }
  
  calculatePredictionConfidence(trend, daysAhead) {
    // Confidence decreases with time
    const baseConfidence = 0.9;
    const decay = 0.1 * daysAhead;
    
    return Math.max(0.3, baseConfidence - decay);
  }
  
  identifyPeakDay(predictions) {
    let peakDay = 1;
    let maxMomentum = 0;
    
    for (const [day, prediction] of Object.entries(predictions)) {
      if (prediction.momentum > maxMomentum) {
        maxMomentum = prediction.momentum;
        peakDay = parseInt(day.split('_')[1]);
      }
    }
    
    return peakDay;
  }
  
  generateTimingRecommendation(prediction) {
    if (prediction.peakDay <= 2) {
      return 'Publish immediately - trend peaking soon';
    } else if (prediction.peakDay <= 4) {
      return `Optimal publishing in ${prediction.peakDay - 1} days`;
    } else {
      return 'Monitor trend development before publishing';
    }
  }
  
  calculateOptimalTiming(trend) {
    const lifecycle = trend.lifecycle.stage;
    const momentum = trend.momentum;
    
    if (lifecycle === 'emerging' && momentum > 0.7) {
      return { window: 'immediate', reason: 'Capitalize on emerging trend' };
    } else if (lifecycle === 'growing') {
      return { window: '1-2 days', reason: 'Join growing conversation' };
    } else if (lifecycle === 'peak') {
      return { window: '2-3 days', reason: 'Differentiate in saturated topic' };
    }
    
    return { window: '3+ days', reason: 'Wait for better opportunity' };
  }
  
  recommendPlatform(trend) {
    const platforms = {
      whatsapp: 0,
      linkedin: 0,
      twitter: 0,
      instagram: 0
    };
    
    // Score based on trend characteristics
    if (trend.category === 'policy' || trend.category === 'market') {
      platforms.linkedin += 0.3;
      platforms.twitter += 0.2;
    }
    
    if (trend.sentiment?.score > 0.7) {
      platforms.whatsapp += 0.3;
      platforms.instagram += 0.2;
    }
    
    if (trend.viralScore?.score > 0.7) {
      platforms.twitter += 0.3;
      platforms.whatsapp += 0.2;
    }
    
    // Educational content
    if (trend.category === 'personal_finance') {
      platforms.linkedin += 0.2;
      platforms.instagram += 0.3;
    }
    
    // Select highest scoring platform
    const recommended = Object.entries(platforms)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    return recommended;
  }
  
  recommendVisuals(trend) {
    const visuals = [];
    
    if (trend.category === 'market') {
      visuals.push('chart', 'graph', 'candlestick');
    }
    
    if (trend.category === 'policy') {
      visuals.push('infographic', 'comparison table', 'timeline');
    }
    
    if (trend.sentiment?.distribution?.negative > 0.3) {
      visuals.push('pros and cons', 'myth vs fact');
    }
    
    if (/\d+%|\d+ crore/i.test(trend.topic)) {
      visuals.push('number highlight', 'statistics visual');
    }
    
    return visuals.slice(0, 3);
  }
  
  predictEngagement(trend, advisorProfile) {
    // Simple engagement prediction
    const baseEngagement = advisorProfile?.avgEngagement || 0.05;
    const trendBoost = trend.viralScore?.score || 0.5;
    const relevanceBoost = trend.relevance?.score || 0.5;
    
    const predicted = baseEngagement * (1 + trendBoost) * (1 + relevanceBoost);
    
    return {
      rate: Math.min(0.3, predicted),
      confidence: 0.7,
      factors: ['trend momentum', 'audience relevance', 'timing']
    };
  }
  
  calculatePatternMatch(trend, pattern) {
    let matchScore = 0;
    let matches = 0;
    
    pattern.indicators.forEach(indicator => {
      if (this.checkIndicator(trend, indicator)) {
        matches++;
      }
    });
    
    matchScore = matches / pattern.indicators.length;
    
    return matchScore;
  }
  
  checkIndicator(trend, indicator) {
    // Check if trend matches indicator
    const indicatorChecks = {
      'high sentiment variance': () => {
        const dist = trend.sentiment?.distribution;
        return dist && Math.abs(dist.positive - dist.negative) > 0.3;
      },
      'debate keywords': () => /vs|versus|debate|controversial/i.test(trend.topic),
      'urgency keywords': () => /urgent|deadline|last|hurry|now/i.test(trend.topic),
      'how-to keywords': () => /how to|guide|tips|steps/i.test(trend.topic),
      'breaking keywords': () => /breaking|just in|announced/i.test(trend.topic)
    };
    
    const checkFn = indicatorChecks[indicator];
    return checkFn ? checkFn() : false;
  }
  
  getPatternStrategy(pattern) {
    const strategies = {
      controversy_driven: 'Take a clear stance and invite discussion',
      fear_driven: 'Provide reassurance and actionable solutions',
      opportunity_driven: 'Emphasize benefits and urgency',
      education_driven: 'Simplify complex topics with examples',
      news_driven: 'Be first with analysis and implications'
    };
    
    return strategies[pattern.name] || 'Create relevant, timely content';
  }
  
  getPatternContentIdeas(pattern, trend) {
    const ideas = {
      controversy_driven: [
        { title: `The ${trend.topic} Debate: My Take`, angle: 'opinion piece' },
        { title: `${trend.topic}: Pros vs Cons`, angle: 'balanced analysis' }
      ],
      fear_driven: [
        { title: `${trend.topic}: What You Really Need to Know`, angle: 'myth-busting' },
        { title: `Protecting Yourself from ${trend.topic}`, angle: 'actionable guide' }
      ],
      opportunity_driven: [
        { title: `How to Benefit from ${trend.topic}`, angle: 'opportunity guide' },
        { title: `${trend.topic}: Act Now or Miss Out`, angle: 'urgency driver' }
      ],
      education_driven: [
        { title: `${trend.topic} Explained Simply`, angle: 'beginner-friendly' },
        { title: `Everything About ${trend.topic} in 5 Minutes`, angle: 'quick guide' }
      ],
      news_driven: [
        { title: `${trend.topic}: What It Means for You`, angle: 'personal impact' },
        { title: `${trend.topic}: Expert Analysis`, angle: 'deep dive' }
      ]
    };
    
    return ideas[pattern.pattern] || [];
  }
  
  async loadHistoricalData() {
    // In production, load from database
    console.log('Historical trend data loaded');
  }
}

module.exports = TrendAnalysisEngine;