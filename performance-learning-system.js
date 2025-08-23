/**
 * Performance Learning System
 * Tracks, analyzes, and learns from content performance to improve viral content generation
 */

const { EventEmitter } = require('events');
const tf = require('@tensorflow/tfjs-node');

class PerformanceLearningSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      learningRate: config.learningRate || 0.001,
      batchSize: config.batchSize || 32,
      updateInterval: config.updateInterval || 86400000, // 24 hours
      minDataPoints: config.minDataPoints || 100,
      performanceThreshold: config.performanceThreshold || 0.7,
      ...config
    };

    // Performance data storage
    this.contentPerformance = new Map();
    this.advisorPerformance = new Map();
    this.patternPerformance = new Map();
    this.platformPerformance = new Map();
    
    // Learning models
    this.models = {
      viralPredictor: null,
      engagementPredictor: null,
      timingOptimizer: null,
      contentQualityScorer: null
    };
    
    // Pattern recognition
    this.successPatterns = new Map();
    this.failurePatterns = new Map();
    this.emergingPatterns = new Map();
    
    // A/B test results
    this.abTestResults = new Map();
    this.experimentQueue = [];
    
    this.initialize();
  }

  /**
   * Initialize learning system
   */
  async initialize() {
    await this.initializeModels();
    await this.loadHistoricalData();
    this.startContinuousLearning();
    
    console.log('Performance Learning System initialized');
  }

  /**
   * Track content performance
   */
  async trackPerformance(contentId, metrics) {
    const performance = {
      contentId,
      timestamp: new Date(),
      metrics: {
        views: metrics.views || 0,
        likes: metrics.likes || 0,
        shares: metrics.shares || 0,
        comments: metrics.comments || 0,
        clicks: metrics.clicks || 0,
        forwards: metrics.forwards || 0,
        saves: metrics.saves || 0
      },
      calculated: {
        engagementRate: this.calculateEngagementRate(metrics),
        viralScore: this.calculateViralScore(metrics),
        shareRate: metrics.shares / (metrics.views || 1),
        interactionRate: this.calculateInteractionRate(metrics)
      },
      metadata: metrics.metadata || {}
    };
    
    // Store performance data
    this.contentPerformance.set(contentId, performance);
    
    // Update advisor performance
    if (metrics.advisorId) {
      await this.updateAdvisorPerformance(metrics.advisorId, performance);
    }
    
    // Pattern recognition
    await this.identifyPatterns(performance);
    
    // Update models if enough data
    if (this.contentPerformance.size >= this.config.minDataPoints) {
      await this.updateModels();
    }
    
    // Emit event
    this.emit('performance:tracked', performance);
    
    return performance;
  }

  /**
   * Calculate engagement rate
   */
  calculateEngagementRate(metrics) {
    const engagements = (metrics.likes || 0) + 
                       (metrics.shares || 0) + 
                       (metrics.comments || 0) +
                       (metrics.clicks || 0);
    
    return metrics.views > 0 ? engagements / metrics.views : 0;
  }

  /**
   * Calculate viral score
   */
  calculateViralScore(metrics) {
    const shareWeight = 0.4;
    const forwardWeight = 0.3;
    const commentWeight = 0.2;
    const likeWeight = 0.1;
    
    const views = metrics.views || 1;
    
    const score = (metrics.shares / views) * shareWeight +
                 (metrics.forwards / views) * forwardWeight +
                 (metrics.comments / views) * commentWeight +
                 (metrics.likes / views) * likeWeight;
    
    return Math.min(1, score * 10); // Normalize to 0-1
  }

  /**
   * Calculate interaction rate
   */
  calculateInteractionRate(metrics) {
    const interactions = (metrics.likes || 0) + 
                        (metrics.comments || 0) + 
                        (metrics.clicks || 0);
    
    return metrics.views > 0 ? interactions / metrics.views : 0;
  }

  /**
   * Update advisor performance profile
   */
  async updateAdvisorPerformance(advisorId, performance) {
    if (!this.advisorPerformance.has(advisorId)) {
      this.advisorPerformance.set(advisorId, {
        totalContent: 0,
        avgEngagement: 0,
        avgViralScore: 0,
        topPatterns: [],
        bestPlatforms: [],
        optimalTiming: [],
        strengths: [],
        improvements: []
      });
    }
    
    const profile = this.advisorPerformance.get(advisorId);
    
    // Update averages
    profile.totalContent++;
    profile.avgEngagement = this.updateAverage(
      profile.avgEngagement,
      performance.calculated.engagementRate,
      profile.totalContent
    );
    profile.avgViralScore = this.updateAverage(
      profile.avgViralScore,
      performance.calculated.viralScore,
      profile.totalContent
    );
    
    // Identify patterns
    if (performance.calculated.viralScore > this.config.performanceThreshold) {
      await this.updateTopPatterns(profile, performance);
    }
    
    // Update recommendations
    profile.improvements = await this.generateImprovements(profile);
    profile.strengths = await this.identifyStrengths(profile);
    
    this.advisorPerformance.set(advisorId, profile);
  }

  /**
   * Identify patterns in performance data
   */
  async identifyPatterns(performance) {
    const patterns = [];
    
    // Time-based patterns
    const timePattern = this.identifyTimePattern(performance);
    if (timePattern) patterns.push(timePattern);
    
    // Content-based patterns
    const contentPattern = await this.identifyContentPattern(performance);
    if (contentPattern) patterns.push(contentPattern);
    
    // Engagement patterns
    const engagementPattern = this.identifyEngagementPattern(performance);
    if (engagementPattern) patterns.push(engagementPattern);
    
    // Store patterns
    patterns.forEach(pattern => {
      if (performance.calculated.viralScore > this.config.performanceThreshold) {
        this.recordSuccessPattern(pattern);
      } else if (performance.calculated.viralScore < 0.3) {
        this.recordFailurePattern(pattern);
      }
    });
    
    return patterns;
  }

  /**
   * Record success pattern
   */
  recordSuccessPattern(pattern) {
    const key = this.generatePatternKey(pattern);
    
    if (!this.successPatterns.has(key)) {
      this.successPatterns.set(key, {
        pattern,
        occurrences: 0,
        avgPerformance: 0,
        examples: []
      });
    }
    
    const record = this.successPatterns.get(key);
    record.occurrences++;
    record.examples.push(pattern);
    
    // Keep only recent examples
    if (record.examples.length > 10) {
      record.examples = record.examples.slice(-10);
    }
  }

  /**
   * Initialize ML models
   */
  async initializeModels() {
    // Viral prediction model
    this.models.viralPredictor = this.createModel({
      inputShape: [50],
      layers: [
        { units: 128, activation: 'relu' },
        { units: 64, activation: 'relu', dropout: 0.2 },
        { units: 32, activation: 'relu' },
        { units: 1, activation: 'sigmoid' }
      ]
    });
    
    // Engagement prediction model
    this.models.engagementPredictor = this.createModel({
      inputShape: [40],
      layers: [
        { units: 64, activation: 'relu' },
        { units: 32, activation: 'relu', dropout: 0.2 },
        { units: 16, activation: 'relu' },
        { units: 1, activation: 'linear' }
      ]
    });
    
    // Timing optimization model
    this.models.timingOptimizer = this.createModel({
      inputShape: [30],
      layers: [
        { units: 48, activation: 'relu' },
        { units: 24, activation: 'relu' },
        { units: 24, activation: 'softmax' } // 24 hours
      ]
    });
    
    // Content quality scoring model
    this.models.contentQualityScorer = this.createModel({
      inputShape: [60],
      layers: [
        { units: 128, activation: 'relu' },
        { units: 64, activation: 'relu', dropout: 0.3 },
        { units: 32, activation: 'relu' },
        { units: 3, activation: 'softmax' } // low, medium, high
      ]
    });
  }

  /**
   * Create TensorFlow model
   */
  createModel(config) {
    const model = tf.sequential();
    
    config.layers.forEach((layer, index) => {
      if (index === 0) {
        model.add(tf.layers.dense({
          units: layer.units,
          activation: layer.activation,
          inputShape: config.inputShape
        }));
      } else {
        model.add(tf.layers.dense({
          units: layer.units,
          activation: layer.activation
        }));
      }
      
      if (layer.dropout) {
        model.add(tf.layers.dropout({ rate: layer.dropout }));
      }
    });
    
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: config.layers[config.layers.length - 1].activation === 'softmax' 
        ? 'categoricalCrossentropy' 
        : 'meanSquaredError',
      metrics: ['accuracy']
    });
    
    return model;
  }

  /**
   * Update models with new data
   */
  async updateModels() {
    const trainingData = this.prepareTrainingData();
    
    if (trainingData.viral.x.length >= this.config.minDataPoints) {
      await this.trainModel(
        this.models.viralPredictor,
        trainingData.viral,
        'viral'
      );
    }
    
    if (trainingData.engagement.x.length >= this.config.minDataPoints) {
      await this.trainModel(
        this.models.engagementPredictor,
        trainingData.engagement,
        'engagement'
      );
    }
    
    this.emit('models:updated', {
      timestamp: new Date(),
      dataPoints: trainingData.viral.x.length
    });
  }

  /**
   * Prepare training data from performance history
   */
  prepareTrainingData() {
    const viralData = { x: [], y: [] };
    const engagementData = { x: [], y: [] };
    const timingData = { x: [], y: [] };
    const qualityData = { x: [], y: [] };
    
    for (const [contentId, performance] of this.contentPerformance) {
      // Extract features
      const features = this.extractFeatures(performance);
      
      // Viral prediction data
      viralData.x.push(features.viral);
      viralData.y.push([performance.calculated.viralScore]);
      
      // Engagement prediction data
      engagementData.x.push(features.engagement);
      engagementData.y.push([performance.calculated.engagementRate]);
      
      // Timing data
      if (features.timing) {
        timingData.x.push(features.timing);
        timingData.y.push(this.encodeHour(performance.metadata.publishHour));
      }
      
      // Quality data
      if (features.quality) {
        qualityData.x.push(features.quality);
        qualityData.y.push(this.encodeQuality(performance.calculated.engagementRate));
      }
    }
    
    return {
      viral: viralData,
      engagement: engagementData,
      timing: timingData,
      quality: qualityData
    };
  }

  /**
   * Extract features from performance data
   */
  extractFeatures(performance) {
    const viralFeatures = [
      performance.calculated.shareRate,
      performance.calculated.interactionRate,
      performance.metrics.comments / (performance.metrics.views || 1),
      performance.metadata.contentLength || 0,
      performance.metadata.hasImage ? 1 : 0,
      performance.metadata.hasVideo ? 1 : 0,
      performance.metadata.hasEmoji ? 1 : 0,
      performance.metadata.hasHashtags ? 1 : 0,
      // Add more features up to 50
    ];
    
    const engagementFeatures = [
      performance.metadata.dayOfWeek || 0,
      performance.metadata.hourOfDay || 0,
      performance.metadata.contentType || 0,
      performance.metadata.platform || 0,
      // Add more features up to 40
    ];
    
    return {
      viral: this.padFeatures(viralFeatures, 50),
      engagement: this.padFeatures(engagementFeatures, 40),
      timing: performance.metadata.timingFeatures,
      quality: performance.metadata.qualityFeatures
    };
  }

  /**
   * Train a model with data
   */
  async trainModel(model, data, modelName) {
    const xs = tf.tensor2d(data.x);
    const ys = tf.tensor2d(data.y);
    
    const history = await model.fit(xs, ys, {
      epochs: 50,
      batchSize: this.config.batchSize,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Training ${modelName} - Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      }
    });
    
    xs.dispose();
    ys.dispose();
    
    return history;
  }

  /**
   * Predict viral potential
   */
  async predictViralPotential(content, metadata) {
    const features = this.extractContentFeatures(content, metadata);
    const input = tf.tensor2d([features]);
    
    const prediction = this.models.viralPredictor.predict(input);
    const score = await prediction.data();
    
    input.dispose();
    prediction.dispose();
    
    // Get similar successful content
    const similarSuccess = await this.findSimilarSuccess(features);
    
    return {
      score: score[0],
      confidence: this.calculateConfidence(score[0]),
      similarSuccess,
      recommendations: this.generateRecommendations(score[0], features)
    };
  }

  /**
   * Find similar successful content
   */
  async findSimilarSuccess(features) {
    const successes = [];
    
    for (const [contentId, performance] of this.contentPerformance) {
      if (performance.calculated.viralScore > this.config.performanceThreshold) {
        const similarity = this.calculateSimilarity(
          features,
          this.extractFeatures(performance).viral
        );
        
        if (similarity > 0.7) {
          successes.push({
            contentId,
            similarity,
            viralScore: performance.calculated.viralScore,
            pattern: this.identifyPattern(performance)
          });
        }
      }
    }
    
    return successes.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  /**
   * A/B Testing Framework
   */
  async runABTest(testConfig) {
    const test = {
      id: `test_${Date.now()}`,
      name: testConfig.name,
      variants: testConfig.variants,
      startDate: new Date(),
      endDate: new Date(Date.now() + testConfig.duration * 24 * 60 * 60 * 1000),
      metrics: new Map(),
      status: 'running'
    };
    
    // Initialize metrics for each variant
    testConfig.variants.forEach(variant => {
      test.metrics.set(variant.id, {
        impressions: 0,
        engagements: 0,
        conversions: 0,
        viralScore: 0
      });
    });
    
    this.abTestResults.set(test.id, test);
    
    // Schedule test completion
    setTimeout(() => this.completeABTest(test.id), testConfig.duration * 24 * 60 * 60 * 1000);
    
    return test;
  }

  /**
   * Update A/B test metrics
   */
  updateABTestMetrics(testId, variantId, metrics) {
    const test = this.abTestResults.get(testId);
    if (!test || test.status !== 'running') return;
    
    const variantMetrics = test.metrics.get(variantId);
    if (!variantMetrics) return;
    
    // Update metrics
    variantMetrics.impressions += metrics.impressions || 0;
    variantMetrics.engagements += metrics.engagements || 0;
    variantMetrics.conversions += metrics.conversions || 0;
    
    // Recalculate rates
    variantMetrics.engagementRate = variantMetrics.engagements / (variantMetrics.impressions || 1);
    variantMetrics.conversionRate = variantMetrics.conversions / (variantMetrics.impressions || 1);
    
    // Check for statistical significance
    if (this.checkStatisticalSignificance(test)) {
      this.completeABTest(testId);
    }
  }

  /**
   * Complete A/B test and analyze results
   */
  completeABTest(testId) {
    const test = this.abTestResults.get(testId);
    if (!test) return;
    
    test.status = 'completed';
    test.completedDate = new Date();
    
    // Analyze results
    const analysis = this.analyzeABTestResults(test);
    test.analysis = analysis;
    
    // Learn from results
    this.learnFromABTest(test);
    
    // Emit completion event
    this.emit('abtest:completed', {
      testId,
      winner: analysis.winner,
      improvement: analysis.improvement,
      confidence: analysis.confidence
    });
    
    return analysis;
  }

  /**
   * Analyze A/B test results
   */
  analyzeABTestResults(test) {
    const variants = Array.from(test.metrics.entries());
    
    // Sort by engagement rate
    variants.sort((a, b) => b[1].engagementRate - a[1].engagementRate);
    
    const winner = variants[0];
    const baseline = variants.find(v => v[0] === 'control') || variants[1];
    
    const improvement = baseline ? 
      (winner[1].engagementRate - baseline[1].engagementRate) / baseline[1].engagementRate : 0;
    
    return {
      winner: winner[0],
      winnerMetrics: winner[1],
      improvement: improvement * 100,
      confidence: this.calculateTestConfidence(test),
      insights: this.generateTestInsights(test, winner, baseline)
    };
  }

  /**
   * Generate insights from test results
   */
  generateTestInsights(test, winner, baseline) {
    const insights = [];
    
    // Performance insight
    if (winner[1].engagementRate > baseline[1].engagementRate * 1.2) {
      insights.push({
        type: 'significant_improvement',
        message: `${winner[0]} variant shows ${((winner[1].engagementRate / baseline[1].engagementRate - 1) * 100).toFixed(1)}% improvement`,
        actionable: 'Implement winning variant immediately'
      });
    }
    
    // Pattern insights
    const winnerPattern = this.identifyVariantPattern(winner[0]);
    if (winnerPattern) {
      insights.push({
        type: 'pattern_identified',
        message: `Winning pattern: ${winnerPattern}`,
        actionable: 'Apply pattern to future content'
      });
    }
    
    return insights;
  }

  /**
   * Learn from A/B test results
   */
  learnFromABTest(test) {
    const analysis = test.analysis;
    
    // Update success patterns
    if (analysis.improvement > 10) {
      const pattern = {
        test: test.name,
        winner: analysis.winner,
        improvement: analysis.improvement,
        date: test.completedDate
      };
      
      this.recordSuccessPattern(pattern);
    }
    
    // Update model training data
    this.addTestDataToTraining(test);
  }

  /**
   * Continuous learning system
   */
  startContinuousLearning() {
    // Regular model updates
    setInterval(() => {
      this.updateModels();
    }, this.config.updateInterval);
    
    // Pattern analysis
    setInterval(() => {
      this.analyzeEmergingPatterns();
    }, this.config.updateInterval / 2);
    
    // Performance optimization
    setInterval(() => {
      this.optimizeStrategies();
    }, this.config.updateInterval / 4);
  }

  /**
   * Analyze emerging patterns
   */
  analyzeEmergingPatterns() {
    const recentPerformance = this.getRecentPerformance(7); // Last 7 days
    
    // Identify new patterns
    const patterns = new Map();
    
    recentPerformance.forEach(performance => {
      const pattern = this.identifyPattern(performance);
      if (pattern) {
        const key = this.generatePatternKey(pattern);
        if (!patterns.has(key)) {
          patterns.set(key, { pattern, occurrences: 0, avgScore: 0 });
        }
        
        const record = patterns.get(key);
        record.occurrences++;
        record.avgScore = this.updateAverage(
          record.avgScore,
          performance.calculated.viralScore,
          record.occurrences
        );
      }
    });
    
    // Identify emerging high-performers
    for (const [key, record] of patterns) {
      if (record.occurrences >= 3 && record.avgScore > 0.7) {
        this.emergingPatterns.set(key, {
          ...record,
          identified: new Date(),
          status: 'emerging'
        });
      }
    }
    
    this.emit('patterns:analyzed', {
      emerging: Array.from(this.emergingPatterns.values()),
      timestamp: new Date()
    });
  }

  /**
   * Optimize content strategies based on learning
   */
  optimizeStrategies() {
    const optimizations = [];
    
    // Timing optimization
    const optimalTiming = this.findOptimalTiming();
    if (optimalTiming) {
      optimizations.push({
        type: 'timing',
        recommendation: optimalTiming
      });
    }
    
    // Platform optimization
    const platformOptimization = this.findPlatformOptimization();
    if (platformOptimization) {
      optimizations.push({
        type: 'platform',
        recommendation: platformOptimization
      });
    }
    
    // Content type optimization
    const contentOptimization = this.findContentOptimization();
    if (contentOptimization) {
      optimizations.push({
        type: 'content',
        recommendation: contentOptimization
      });
    }
    
    this.emit('strategies:optimized', optimizations);
    
    return optimizations;
  }

  /**
   * Find optimal timing based on performance data
   */
  findOptimalTiming() {
    const timingPerformance = new Map();
    
    for (const [contentId, performance] of this.contentPerformance) {
      const hour = performance.metadata.publishHour;
      if (hour !== undefined) {
        if (!timingPerformance.has(hour)) {
          timingPerformance.set(hour, { total: 0, avgEngagement: 0 });
        }
        
        const timing = timingPerformance.get(hour);
        timing.total++;
        timing.avgEngagement = this.updateAverage(
          timing.avgEngagement,
          performance.calculated.engagementRate,
          timing.total
        );
      }
    }
    
    // Find best hours
    const hours = Array.from(timingPerformance.entries())
      .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement)
      .slice(0, 3);
    
    if (hours.length > 0) {
      return {
        bestHours: hours.map(h => h[0]),
        avgEngagement: hours[0][1].avgEngagement,
        confidence: Math.min(hours[0][1].total / 10, 1)
      };
    }
    
    return null;
  }

  /**
   * Helper methods
   */
  
  updateAverage(currentAvg, newValue, count) {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }
  
  identifyTimePattern(performance) {
    const hour = performance.metadata.publishHour;
    const day = performance.metadata.publishDay;
    
    if (hour !== undefined && day !== undefined) {
      return {
        type: 'time',
        hour,
        day,
        performance: performance.calculated.viralScore
      };
    }
    
    return null;
  }
  
  async identifyContentPattern(performance) {
    const content = performance.metadata.content;
    if (!content) return null;
    
    const patterns = [];
    
    // Length pattern
    if (content.length < 100) patterns.push('ultra_short');
    else if (content.length < 300) patterns.push('short');
    else if (content.length < 600) patterns.push('medium');
    else patterns.push('long');
    
    // Format pattern
    if (/\d+\./.test(content)) patterns.push('numbered_list');
    if (/\?/.test(content)) patterns.push('question');
    if (/!/.test(content)) patterns.push('exclamation');
    
    // Topic pattern
    if (/tax|saving/i.test(content)) patterns.push('tax_saving');
    if (/investment|mutual fund/i.test(content)) patterns.push('investment');
    if (/insurance/i.test(content)) patterns.push('insurance');
    
    return {
      type: 'content',
      patterns,
      performance: performance.calculated.viralScore
    };
  }
  
  identifyEngagementPattern(performance) {
    const engagement = performance.calculated.engagementRate;
    const viralScore = performance.calculated.viralScore;
    
    if (viralScore > 0.7 && engagement > 0.2) {
      return {
        type: 'high_viral_high_engagement',
        viralScore,
        engagement
      };
    } else if (viralScore > 0.7 && engagement < 0.1) {
      return {
        type: 'high_viral_low_engagement',
        viralScore,
        engagement
      };
    }
    
    return null;
  }
  
  generatePatternKey(pattern) {
    return `${pattern.type}_${JSON.stringify(pattern.patterns || pattern)}`;
  }
  
  recordFailurePattern(pattern) {
    const key = this.generatePatternKey(pattern);
    
    if (!this.failurePatterns.has(key)) {
      this.failurePatterns.set(key, {
        pattern,
        occurrences: 0,
        avgPerformance: 0,
        examples: []
      });
    }
    
    const record = this.failurePatterns.get(key);
    record.occurrences++;
    record.examples.push(pattern);
    
    if (record.examples.length > 10) {
      record.examples = record.examples.slice(-10);
    }
  }
  
  padFeatures(features, targetLength) {
    while (features.length < targetLength) {
      features.push(0);
    }
    return features.slice(0, targetLength);
  }
  
  encodeHour(hour) {
    // One-hot encode hour (0-23)
    const encoded = new Array(24).fill(0);
    if (hour >= 0 && hour < 24) {
      encoded[hour] = 1;
    }
    return encoded;
  }
  
  encodeQuality(engagementRate) {
    // Encode as low, medium, high
    if (engagementRate < 0.1) return [1, 0, 0];
    if (engagementRate < 0.2) return [0, 1, 0];
    return [0, 0, 1];
  }
  
  extractContentFeatures(content, metadata) {
    // Extract features for prediction
    const features = [];
    
    // Text features
    features.push(content.length / 1000);
    features.push((content.match(/\?/g) || []).length);
    features.push((content.match(/!/g) || []).length);
    features.push((content.match(/\d+/g) || []).length);
    
    // Metadata features
    features.push(metadata.hasImage ? 1 : 0);
    features.push(metadata.hasVideo ? 1 : 0);
    features.push(metadata.platform === 'whatsapp' ? 1 : 0);
    features.push(metadata.platform === 'linkedin' ? 1 : 0);
    
    // Pad to required length
    return this.padFeatures(features, 50);
  }
  
  calculateConfidence(score) {
    // Convert score to confidence level
    if (score > 0.8 || score < 0.2) return 0.9;
    if (score > 0.7 || score < 0.3) return 0.7;
    if (score > 0.6 || score < 0.4) return 0.5;
    return 0.3;
  }
  
  calculateSimilarity(features1, features2) {
    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  identifyPattern(performance) {
    // Identify the dominant pattern in performance
    const patterns = [];
    
    if (performance.calculated.viralScore > 0.7) {
      patterns.push('viral');
    }
    
    if (performance.calculated.shareRate > 0.1) {
      patterns.push('highly_shareable');
    }
    
    if (performance.metadata.contentType === 'educational') {
      patterns.push('educational');
    }
    
    return patterns.length > 0 ? patterns.join('_') : null;
  }
  
  generateRecommendations(score, features) {
    const recommendations = [];
    
    if (score < 0.5) {
      recommendations.push('Add more emotional triggers');
      recommendations.push('Include questions to boost engagement');
      recommendations.push('Consider adding visuals');
    } else if (score < 0.7) {
      recommendations.push('Optimize timing for better reach');
      recommendations.push('Enhance shareability factors');
    } else {
      recommendations.push('Content has high viral potential');
      recommendations.push('Focus on distribution strategy');
    }
    
    return recommendations;
  }
  
  checkStatisticalSignificance(test) {
    // Simple significance check
    const variants = Array.from(test.metrics.values());
    
    if (variants.length < 2) return false;
    
    const minImpressions = Math.min(...variants.map(v => v.impressions));
    
    return minImpressions >= 100; // Simplified check
  }
  
  calculateTestConfidence(test) {
    const totalImpressions = Array.from(test.metrics.values())
      .reduce((sum, v) => sum + v.impressions, 0);
    
    // Simple confidence calculation
    return Math.min(totalImpressions / 1000, 1);
  }
  
  identifyVariantPattern(variantId) {
    // Identify pattern from variant ID or characteristics
    if (variantId.includes('emoji')) return 'emoji_usage';
    if (variantId.includes('question')) return 'question_hook';
    if (variantId.includes('number')) return 'numbered_list';
    
    return null;
  }
  
  addTestDataToTraining(test) {
    // Add A/B test results to training data
    for (const [variantId, metrics] of test.metrics) {
      const performance = {
        contentId: `${test.id}_${variantId}`,
        metrics: {
          views: metrics.impressions,
          likes: metrics.engagements * 0.3,
          shares: metrics.engagements * 0.2,
          comments: metrics.engagements * 0.1,
          clicks: metrics.engagements * 0.4
        },
        metadata: {
          variant: variantId,
          test: test.name
        }
      };
      
      this.trackPerformance(performance.contentId, performance.metrics);
    }
  }
  
  getRecentPerformance(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const recent = [];
    
    for (const [contentId, performance] of this.contentPerformance) {
      if (performance.timestamp > cutoff) {
        recent.push(performance);
      }
    }
    
    return recent;
  }
  
  async updateTopPatterns(profile, performance) {
    const pattern = this.identifyPattern(performance);
    if (!pattern) return;
    
    if (!profile.topPatterns.find(p => p.pattern === pattern)) {
      profile.topPatterns.push({
        pattern,
        performance: performance.calculated.viralScore,
        count: 1
      });
    } else {
      const existing = profile.topPatterns.find(p => p.pattern === pattern);
      existing.count++;
      existing.performance = this.updateAverage(
        existing.performance,
        performance.calculated.viralScore,
        existing.count
      );
    }
    
    // Keep only top 5 patterns
    profile.topPatterns.sort((a, b) => b.performance - a.performance);
    profile.topPatterns = profile.topPatterns.slice(0, 5);
  }
  
  async generateImprovements(profile) {
    const improvements = [];
    
    if (profile.avgEngagement < 0.1) {
      improvements.push({
        area: 'engagement',
        suggestion: 'Focus on creating more engaging hooks and questions',
        priority: 'high'
      });
    }
    
    if (profile.avgViralScore < 0.5) {
      improvements.push({
        area: 'virality',
        suggestion: 'Incorporate trending topics and emotional triggers',
        priority: 'high'
      });
    }
    
    return improvements;
  }
  
  async identifyStrengths(profile) {
    const strengths = [];
    
    if (profile.avgEngagement > 0.2) {
      strengths.push('High engagement rate');
    }
    
    if (profile.avgViralScore > 0.7) {
      strengths.push('Strong viral content creation');
    }
    
    if (profile.topPatterns.length > 0) {
      strengths.push(`Successful with ${profile.topPatterns[0].pattern} pattern`);
    }
    
    return strengths;
  }
  
  findPlatformOptimization() {
    const platformPerformance = new Map();
    
    for (const [contentId, performance] of this.contentPerformance) {
      const platform = performance.metadata.platform;
      if (platform) {
        if (!platformPerformance.has(platform)) {
          platformPerformance.set(platform, { total: 0, avgEngagement: 0 });
        }
        
        const platformData = platformPerformance.get(platform);
        platformData.total++;
        platformData.avgEngagement = this.updateAverage(
          platformData.avgEngagement,
          performance.calculated.engagementRate,
          platformData.total
        );
      }
    }
    
    const platforms = Array.from(platformPerformance.entries())
      .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement);
    
    if (platforms.length > 0) {
      return {
        bestPlatform: platforms[0][0],
        performance: platforms[0][1].avgEngagement,
        distribution: platforms.map(p => ({ platform: p[0], engagement: p[1].avgEngagement }))
      };
    }
    
    return null;
  }
  
  findContentOptimization() {
    const contentTypes = new Map();
    
    for (const [contentId, performance] of this.contentPerformance) {
      const contentType = performance.metadata.contentType;
      if (contentType) {
        if (!contentTypes.has(contentType)) {
          contentTypes.set(contentType, { total: 0, avgViralScore: 0 });
        }
        
        const typeData = contentTypes.get(contentType);
        typeData.total++;
        typeData.avgViralScore = this.updateAverage(
          typeData.avgViralScore,
          performance.calculated.viralScore,
          typeData.total
        );
      }
    }
    
    const types = Array.from(contentTypes.entries())
      .sort((a, b) => b[1].avgViralScore - a[1].avgViralScore);
    
    if (types.length > 0) {
      return {
        bestType: types[0][0],
        viralScore: types[0][1].avgViralScore,
        recommendations: this.getTypeRecommendations(types[0][0])
      };
    }
    
    return null;
  }
  
  getTypeRecommendations(contentType) {
    const recommendations = {
      educational: ['Include practical examples', 'Add step-by-step guides'],
      news: ['Be first with analysis', 'Provide unique perspective'],
      opinion: ['Take clear stance', 'Back with data'],
      entertainment: ['Use humor appropriately', 'Include relatable scenarios']
    };
    
    return recommendations[contentType] || ['Focus on value delivery'];
  }
  
  async loadHistoricalData() {
    // In production, load from database
    console.log('Historical performance data loaded');
  }
}

module.exports = PerformanceLearningSystem;