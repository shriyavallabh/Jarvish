/**
 * ML-Powered Content Optimization System
 * Advanced algorithms for content quality, uniqueness, and performance optimization
 * Enhanced with viral content detection and trend analysis
 */

const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const { RandomForestClassifier } = require('ml-random-forest');
const { EventEmitter } = require('events');

class MLContentOptimizer extends EventEmitter {
  constructor(config = {}) {
    this.config = {
      modelPath: config.modelPath || './models',
      updateFrequency: config.updateFrequency || 'daily',
      minTrainingData: config.minTrainingData || 1000,
      performanceThreshold: config.performanceThreshold || 0.5,
      ...config
    };

    this.models = {
      engagement: null,
      uniqueness: null,
      quality: null,
      timing: null,
      personalization: null,
      virality: null,
      trendAlignment: null,
      platformOptimization: null,
      emotionalResonance: null,
      complianceRisk: null
    };

    // Viral content detection systems
    this.viralPatterns = new Map();
    this.trendingTopics = new Map();
    this.platformStrategies = new Map();
    this.emotionalTriggers = new Map();
    this.performanceHistory = new Map();

    this.featureExtractors = new Map();
    this.trainingData = new Map();
    
    this.initializeModels();
  }

  /**
   * Initialize ML models
   */
  async initializeModels() {
    // Load or create engagement prediction model
    this.models.engagement = await this.loadOrCreateModel('engagement', {
      type: 'regression',
      architecture: 'dense',
      layers: [128, 64, 32, 1]
    });

    // Content quality classifier
    this.models.quality = await this.loadOrCreateModel('quality', {
      type: 'classification',
      architecture: 'lstm',
      layers: [128, 64, 3] // low, medium, high quality
    });

    // Uniqueness scorer
    this.models.uniqueness = await this.loadOrCreateModel('uniqueness', {
      type: 'regression',
      architecture: 'dense',
      layers: [64, 32, 1]
    });

    // Optimal timing predictor
    this.models.timing = await this.loadOrCreateModel('timing', {
      type: 'classification',
      architecture: 'dense',
      layers: [48, 24, 24] // 24 hours
    });

    // Personalization model
    this.models.personalization = await this.loadOrCreateModel('personalization', {
      type: 'embedding',
      architecture: 'autoencoder',
      layers: [512, 256, 128, 256, 512]
    });

    // Virality prediction model
    this.models.virality = await this.loadOrCreateModel('virality', {
      type: 'regression',
      architecture: 'dense',
      layers: [256, 128, 64, 32, 1],
      inputShape: 150
    });

    // Trend alignment model
    this.models.trendAlignment = await this.loadOrCreateModel('trendAlignment', {
      type: 'classification',
      architecture: 'lstm',
      layers: [256, 128, 5], // 5 trend categories
      sequenceLength: 100
    });

    // Platform optimization model
    this.models.platformOptimization = await this.loadOrCreateModel('platformOptimization', {
      type: 'multi-output',
      architecture: 'dense',
      layers: [128, 64, 32, 5] // 5 platforms
    });

    // Emotional resonance model
    this.models.emotionalResonance = await this.loadOrCreateModel('emotionalResonance', {
      type: 'classification',
      architecture: 'dense',
      layers: [128, 64, 8] // 8 emotional categories
    });

    // Compliance risk model
    this.models.complianceRisk = await this.loadOrCreateModel('complianceRisk', {
      type: 'classification',
      architecture: 'dense',
      layers: [128, 64, 32, 3] // low, medium, high risk
    });

    // Initialize trend monitoring
    await this.initializeTrendMonitoring();
    await this.loadViralPatterns();
  }

  /**
   * Load or create a TensorFlow model
   */
  async loadOrCreateModel(name, config) {
    const modelPath = `${this.config.modelPath}/${name}`;
    
    try {
      // Try to load existing model
      const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      console.log(`Loaded existing model: ${name}`);
      return model;
    } catch (error) {
      // Create new model
      console.log(`Creating new model: ${name}`);
      return this.createModel(config);
    }
  }

  /**
   * Create a new TensorFlow model
   */
  createModel(config) {
    const model = tf.sequential();
    
    if (config.architecture === 'dense') {
      // Dense network for regression/classification
      config.layers.forEach((units, index) => {
        if (index === 0) {
          model.add(tf.layers.dense({
            units,
            activation: 'relu',
            inputShape: [config.inputShape || 100]
          }));
        } else if (index === config.layers.length - 1) {
          model.add(tf.layers.dense({
            units,
            activation: config.type === 'classification' ? 'softmax' : 'linear'
          }));
        } else {
          model.add(tf.layers.dense({
            units,
            activation: 'relu'
          }));
          model.add(tf.layers.dropout({ rate: 0.2 }));
        }
      });
    } else if (config.architecture === 'lstm') {
      // LSTM for sequence processing
      model.add(tf.layers.lstm({
        units: config.layers[0],
        returnSequences: config.layers.length > 2,
        inputShape: [config.sequenceLength || 50, config.inputDim || 100]
      }));
      
      for (let i = 1; i < config.layers.length - 1; i++) {
        model.add(tf.layers.lstm({
          units: config.layers[i],
          returnSequences: i < config.layers.length - 2
        }));
      }
      
      model.add(tf.layers.dense({
        units: config.layers[config.layers.length - 1],
        activation: 'softmax'
      }));
    } else if (config.architecture === 'autoencoder') {
      // Autoencoder for personalization
      const encoder = config.layers.slice(0, Math.ceil(config.layers.length / 2));
      const decoder = config.layers.slice(Math.ceil(config.layers.length / 2));
      
      encoder.forEach((units, index) => {
        if (index === 0) {
          model.add(tf.layers.dense({
            units,
            activation: 'relu',
            inputShape: [config.inputShape || 512]
          }));
        } else {
          model.add(tf.layers.dense({ units, activation: 'relu' }));
        }
      });
      
      decoder.forEach(units => {
        model.add(tf.layers.dense({ units, activation: 'relu' }));
      });
    }
    
    // Compile model
    const optimizer = config.optimizer || 'adam';
    const loss = config.type === 'classification' ? 'categoricalCrossentropy' : 'meanSquaredError';
    const metrics = config.type === 'classification' ? ['accuracy'] : ['mae'];
    
    model.compile({ optimizer, loss, metrics });
    
    return model;
  }

  /**
   * Predict content engagement
   */
  async predictEngagement(content, advisorId, metadata = {}) {
    const features = await this.extractEngagementFeatures(content, advisorId, metadata);
    const input = tf.tensor2d([features]);
    
    const prediction = this.models.engagement.predict(input);
    const engagementScore = await prediction.data();
    
    input.dispose();
    prediction.dispose();
    
    return {
      score: engagementScore[0],
      confidence: this.calculateConfidence(engagementScore[0]),
      factors: this.explainEngagementFactors(features)
    };
  }

  /**
   * Extract features for engagement prediction
   */
  async extractEngagementFeatures(content, advisorId, metadata) {
    const features = [];
    
    // Text features
    const textFeatures = this.extractTextFeatures(content);
    features.push(...Object.values(textFeatures));
    
    // Temporal features
    const temporalFeatures = this.extractTemporalFeatures(metadata.timestamp);
    features.push(...Object.values(temporalFeatures));
    
    // Historical features
    const historicalFeatures = await this.extractHistoricalFeatures(advisorId);
    features.push(...Object.values(historicalFeatures));
    
    // Topic features
    const topicFeatures = this.extractTopicFeatures(content);
    features.push(...Object.values(topicFeatures));
    
    // Personalization features
    const personalizationFeatures = this.extractPersonalizationFeatures(content);
    features.push(...Object.values(personalizationFeatures));
    
    return features;
  }

  /**
   * Extract text-based features
   */
  extractTextFeatures(content) {
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    const paragraphs = content.split(/\n\n+/);
    
    return {
      wordCount: words.length,
      avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      sentenceCount: sentences.length,
      avgSentenceLength: words.length / sentences.length,
      paragraphCount: paragraphs.length,
      readabilityScore: this.calculateReadability(content),
      lexicalDiversity: new Set(words.map(w => w.toLowerCase())).size / words.length,
      questionCount: (content.match(/\?/g) || []).length,
      exclamationCount: (content.match(/!/g) || []).length,
      emojiCount: (content.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length,
      numberCount: (content.match(/\d+/g) || []).length,
      currencyMentions: (content.match(/₹|Rs\.|INR/g) || []).length,
      percentageMentions: (content.match(/\d+%/g) || []).length,
      callToActionPresent: /click|tap|swipe|reply|contact|call|visit/i.test(content) ? 1 : 0
    };
  }

  /**
   * Calculate readability score (Flesch-Kincaid)
   */
  calculateReadability(content) {
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    
    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, score / 100));
  }

  /**
   * Count syllables in a word
   */
  countSyllables(word) {
    word = word.toLowerCase();
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = /[aeiou]/.test(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e')) count--;
    
    // Ensure at least one syllable
    return Math.max(1, count);
  }

  /**
   * Extract temporal features
   */
  extractTemporalFeatures(timestamp = new Date()) {
    const date = new Date(timestamp);
    
    return {
      hourOfDay: date.getHours() / 23,
      dayOfWeek: date.getDay() / 6,
      dayOfMonth: date.getDate() / 31,
      monthOfYear: date.getMonth() / 11,
      isWeekend: date.getDay() === 0 || date.getDay() === 6 ? 1 : 0,
      isBusinessHours: date.getHours() >= 9 && date.getHours() <= 18 ? 1 : 0,
      isMorning: date.getHours() >= 6 && date.getHours() < 12 ? 1 : 0,
      isEvening: date.getHours() >= 18 && date.getHours() < 22 ? 1 : 0
    };
  }

  /**
   * Extract historical performance features
   */
  async extractHistoricalFeatures(advisorId) {
    // In production, fetch from database
    // This is a simplified example
    return {
      avgEngagementRate: 0.65,
      totalContentSent: 150,
      daysActive: 45,
      avgContentLength: 120,
      preferredTopics: 0.7, // match score
      bestPerformingHour: 10 / 23,
      contentFrequency: 7, // messages per week
      lastContentDaysAgo: 2
    };
  }

  /**
   * Extract topic features
   */
  extractTopicFeatures(content) {
    const topics = {
      sip: /sip|systematic investment/i.test(content) ? 1 : 0,
      tax: /tax|deduction|80c|income tax/i.test(content) ? 1 : 0,
      insurance: /insurance|term plan|health cover/i.test(content) ? 1 : 0,
      mutualFunds: /mutual fund|nav|equity|debt fund/i.test(content) ? 1 : 0,
      market: /market|nifty|sensex|stocks/i.test(content) ? 1 : 0,
      retirement: /retirement|pension|senior citizen/i.test(content) ? 1 : 0,
      goals: /goal|planning|future|dream/i.test(content) ? 1 : 0,
      education: /education|child|college|fees/i.test(content) ? 1 : 0
    };
    
    const topicCount = Object.values(topics).reduce((sum, val) => sum + val, 0);
    
    return {
      ...topics,
      topicCount,
      topicDiversity: topicCount > 0 ? topicCount / Object.keys(topics).length : 0
    };
  }

  /**
   * Extract personalization features
   */
  extractPersonalizationFeatures(content) {
    return {
      hasNamePlaceholder: /{name}|{client}/i.test(content) ? 1 : 0,
      hasAmountPlaceholder: /{amount}|{value}/i.test(content) ? 1 : 0,
      hasDatePlaceholder: /{date}|{deadline}/i.test(content) ? 1 : 0,
      personalizationLevel: this.calculatePersonalizationLevel(content),
      hasGreeting: /dear|hello|hi|good morning/i.test(content) ? 1 : 0,
      hasSignoff: /regards|thanks|sincerely|best/i.test(content) ? 1 : 0
    };
  }

  /**
   * Calculate personalization level
   */
  calculatePersonalizationLevel(content) {
    let level = 0;
    
    if (/{name}|{client}/i.test(content)) level += 0.3;
    if (/{amount}|{value}|{portfolio}/i.test(content)) level += 0.2;
    if (/{date}|{deadline}|{anniversary}/i.test(content)) level += 0.2;
    if (/you|your/i.test(content)) level += 0.15;
    if (/we|our|us/i.test(content)) level += 0.15;
    
    return Math.min(1, level);
  }

  /**
   * Calculate prediction confidence
   */
  calculateConfidence(score) {
    // Convert score to confidence based on distance from 0.5
    const distance = Math.abs(score - 0.5);
    return Math.min(1, distance * 2);
  }

  /**
   * Explain engagement factors
   */
  explainEngagementFactors(features) {
    const factors = [];
    
    // Analyze feature importance
    if (features[0] > 150) { // word count
      factors.push({ factor: 'length', impact: 'negative', message: 'Content may be too long' });
    }
    
    if (features[5] < 0.5) { // readability
      factors.push({ factor: 'readability', impact: 'negative', message: 'Content may be difficult to read' });
    }
    
    if (features[7] > 0) { // questions
      factors.push({ factor: 'engagement', impact: 'positive', message: 'Contains engaging questions' });
    }
    
    if (features[13] > 0) { // CTA
      factors.push({ factor: 'action', impact: 'positive', message: 'Contains clear call-to-action' });
    }
    
    return factors;
  }

  /**
   * Score content quality
   */
  async scoreContentQuality(content) {
    const features = this.extractQualityFeatures(content);
    const scores = {
      grammar: await this.checkGrammar(content),
      readability: this.calculateReadability(content),
      completeness: this.checkCompleteness(content),
      relevance: await this.checkRelevance(content),
      originality: await this.checkOriginality(content),
      compliance: await this.checkCompliance(content)
    };
    
    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    
    return {
      overall: overallScore,
      breakdown: scores,
      recommendations: this.generateQualityRecommendations(scores)
    };
  }

  /**
   * Extract quality features
   */
  extractQualityFeatures(content) {
    return {
      hasProperStructure: this.checkStructure(content),
      hasFactualClaims: this.checkFactualClaims(content),
      hasSources: this.checkSources(content),
      toneConsistency: this.checkToneConsistency(content),
      errorCount: this.countErrors(content)
    };
  }

  /**
   * Check grammar using NLP
   */
  async checkGrammar(content) {
    // In production, use a grammar checking API
    // This is a simplified example
    const errors = [];
    
    // Check for common errors
    if (/\s{2,}/.test(content)) errors.push('Multiple spaces');
    if (/[.!?]{2,}/.test(content)) errors.push('Multiple punctuation');
    if (!/^[A-Z]/.test(content)) errors.push('Missing capital letter');
    
    return Math.max(0, 1 - errors.length * 0.1);
  }

  /**
   * Check content completeness
   */
  checkCompleteness(content) {
    let score = 1;
    
    if (content.length < 50) score -= 0.3;
    if (!/[.!?]$/.test(content.trim())) score -= 0.1;
    if (!/{name}|dear|hello/i.test(content)) score -= 0.1;
    if (!/regards|thanks|sincerely/i.test(content)) score -= 0.1;
    
    return Math.max(0, score);
  }

  /**
   * Check content relevance
   */
  async checkRelevance(content) {
    // Check if content contains financial/advisory terms
    const relevantTerms = [
      'investment', 'savings', 'financial', 'planning', 'insurance',
      'tax', 'mutual fund', 'sip', 'portfolio', 'wealth'
    ];
    
    const termCount = relevantTerms.filter(term => 
      new RegExp(term, 'i').test(content)
    ).length;
    
    return Math.min(1, termCount / 3);
  }

  /**
   * Check content originality
   */
  async checkOriginality(content) {
    // In production, check against content database
    // This is a placeholder
    return 0.85;
  }

  /**
   * Check compliance
   */
  async checkCompliance(content) {
    const violations = [];
    
    // Check for prohibited terms
    const prohibited = ['guaranteed returns', '100% safe', 'no risk', 'assured profit'];
    prohibited.forEach(term => {
      if (new RegExp(term, 'i').test(content)) {
        violations.push(term);
      }
    });
    
    // Check for required disclaimers
    if (/past performance/i.test(content) && !/not indicative/i.test(content)) {
      violations.push('Missing disclaimer');
    }
    
    return Math.max(0, 1 - violations.length * 0.2);
  }

  /**
   * Generate quality recommendations
   */
  generateQualityRecommendations(scores) {
    const recommendations = [];
    
    if (scores.grammar < 0.8) {
      recommendations.push({
        area: 'grammar',
        priority: 'high',
        suggestion: 'Review grammar and punctuation'
      });
    }
    
    if (scores.readability < 0.6) {
      recommendations.push({
        area: 'readability',
        priority: 'medium',
        suggestion: 'Simplify language and shorten sentences'
      });
    }
    
    if (scores.relevance < 0.5) {
      recommendations.push({
        area: 'relevance',
        priority: 'high',
        suggestion: 'Add more financial/advisory specific content'
      });
    }
    
    if (scores.compliance < 1) {
      recommendations.push({
        area: 'compliance',
        priority: 'critical',
        suggestion: 'Review compliance requirements and add disclaimers'
      });
    }
    
    return recommendations;
  }

  /**
   * Optimize content for uniqueness
   */
  async optimizeForUniqueness(content, similarContent) {
    const modifications = [];
    
    // Analyze differences
    const differences = this.analyzeDifferences(content, similarContent);
    
    // Generate variations
    if (differences.similarity > 0.8) {
      modifications.push({
        type: 'rewrite',
        suggestion: await this.generateRewrite(content),
        impact: 'high'
      });
    }
    
    if (differences.structuralSimilarity > 0.7) {
      modifications.push({
        type: 'restructure',
        suggestion: this.suggestRestructuring(content),
        impact: 'medium'
      });
    }
    
    if (differences.topicOverlap > 0.9) {
      modifications.push({
        type: 'topic_variation',
        suggestion: this.suggestTopicVariation(content),
        impact: 'medium'
      });
    }
    
    return {
      originalUniqueness: 1 - differences.similarity,
      modifications,
      estimatedUniqueness: this.estimatePostModificationUniqueness(modifications)
    };
  }

  /**
   * Analyze differences between contents
   */
  analyzeDifferences(content1, content2) {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const jaccardSimilarity = intersection.size / union.size;
    
    // Structural similarity
    const structure1 = content1.replace(/[^\s.!?]/g, '');
    const structure2 = content2.replace(/[^\s.!?]/g, '');
    const structuralSimilarity = this.calculateStringSimilarity(structure1, structure2);
    
    // Topic overlap
    const topics1 = this.extractTopicFeatures(content1);
    const topics2 = this.extractTopicFeatures(content2);
    const topicOverlap = this.calculateTopicOverlap(topics1, topics2);
    
    return {
      similarity: jaccardSimilarity,
      structuralSimilarity,
      topicOverlap
    };
  }

  /**
   * Calculate string similarity
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate topic overlap
   */
  calculateTopicOverlap(topics1, topics2) {
    let overlap = 0;
    let count = 0;
    
    for (const topic in topics1) {
      if (typeof topics1[topic] === 'number' && typeof topics2[topic] === 'number') {
        if (topics1[topic] > 0 && topics2[topic] > 0) {
          overlap++;
        }
        count++;
      }
    }
    
    return count > 0 ? overlap / count : 0;
  }

  /**
   * Generate rewritten content
   */
  async generateRewrite(content) {
    // In production, use GPT or similar
    // This is a simplified example
    const suggestions = [
      'Start with a different opening',
      'Use alternative examples',
      'Change the narrative perspective',
      'Add unique insights or data',
      'Restructure the content flow'
    ];
    
    return suggestions;
  }

  /**
   * Suggest content restructuring
   */
  suggestRestructuring(content) {
    const sentences = content.split(/[.!?]+/);
    
    return {
      original: 'Current structure',
      suggestions: [
        'Move key point to beginning',
        'Add section breaks',
        'Use bullet points for lists',
        'Combine short sentences',
        'Split long paragraphs'
      ]
    };
  }

  /**
   * Suggest topic variation
   */
  suggestTopicVariation(content) {
    const currentTopics = this.extractTopicFeatures(content);
    const activeTopics = Object.entries(currentTopics)
      .filter(([k, v]) => v === 1 && k !== 'topicCount' && k !== 'topicDiversity')
      .map(([k]) => k);
    
    const allTopics = ['sip', 'tax', 'insurance', 'mutualFunds', 'market', 'retirement', 'goals', 'education'];
    const unusedTopics = allTopics.filter(t => !activeTopics.includes(t));
    
    return {
      current: activeTopics,
      suggested: unusedTopics.slice(0, 2),
      message: 'Consider incorporating different topics for variety'
    };
  }

  /**
   * Estimate post-modification uniqueness
   */
  estimatePostModificationUniqueness(modifications) {
    let uniquenessBoost = 0;
    
    modifications.forEach(mod => {
      if (mod.impact === 'high') uniquenessBoost += 0.3;
      else if (mod.impact === 'medium') uniquenessBoost += 0.15;
      else uniquenessBoost += 0.05;
    });
    
    return Math.min(1, 0.5 + uniquenessBoost);
  }

  /**
   * Predict optimal sending time
   */
  async predictOptimalTime(advisorId, content) {
    const features = await this.extractTimingFeatures(advisorId, content);
    const input = tf.tensor2d([features]);
    
    const prediction = this.models.timing.predict(input);
    const probabilities = await prediction.data();
    
    input.dispose();
    prediction.dispose();
    
    // Find best hours
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({
        hour: i,
        probability: probabilities[i],
        label: this.getTimeLabel(i)
      });
    }
    
    hours.sort((a, b) => b.probability - a.probability);
    
    return {
      bestTime: hours[0],
      topTimes: hours.slice(0, 3),
      avoidTimes: hours.slice(-3),
      dayRecommendation: await this.getDayRecommendation(advisorId)
    };
  }

  /**
   * Extract timing features
   */
  async extractTimingFeatures(advisorId, content) {
    // In production, fetch from database
    const historicalData = {
      avgOpenTime: 10,
      bestDayOfWeek: 2,
      clientTimezone: 'Asia/Kolkata'
    };
    
    const contentFeatures = this.extractTextFeatures(content);
    const topicFeatures = this.extractTopicFeatures(content);
    
    return [
      ...Object.values(historicalData),
      contentFeatures.wordCount / 100,
      contentFeatures.questionCount,
      topicFeatures.topicCount
    ];
  }

  /**
   * Get time label
   */
  getTimeLabel(hour) {
    if (hour >= 6 && hour < 9) return 'Early Morning';
    if (hour >= 9 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 15) return 'Afternoon';
    if (hour >= 15 && hour < 18) return 'Late Afternoon';
    if (hour >= 18 && hour < 21) return 'Evening';
    if (hour >= 21 || hour < 6) return 'Night';
  }

  /**
   * Get day recommendation
   */
  async getDayRecommendation(advisorId) {
    // In production, analyze historical data
    return {
      bestDay: 'Tuesday',
      reason: 'Highest engagement rates',
      avoidDays: ['Sunday', 'Monday'],
      flexibility: 'Can shift ±1 day without significant impact'
    };
  }

  /**
   * Train models with new data
   */
  async trainModels(trainingData) {
    for (const [modelName, data] of Object.entries(trainingData)) {
      if (data.length < this.config.minTrainingData) {
        console.log(`Insufficient data for ${modelName}: ${data.length} samples`);
        continue;
      }
      
      const model = this.models[modelName];
      if (!model) continue;
      
      // Prepare training data
      const xs = tf.tensor2d(data.map(d => d.features));
      const ys = tf.tensor2d(data.map(d => d.labels));
      
      // Train model
      await model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`${modelName} - Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
            }
          }
        }
      });
      
      // Clean up tensors
      xs.dispose();
      ys.dispose();
      
      // Save model
      await this.saveModel(modelName, model);
    }
  }

  /**
   * Save model to disk
   */
  async saveModel(name, model) {
    const modelPath = `${this.config.modelPath}/${name}`;
    await model.save(`file://${modelPath}`);
    console.log(`Model saved: ${name}`);
  }

  /**
   * Helper methods
   */
  
  checkStructure(content) {
    const hasGreeting = /dear|hello|hi/i.test(content);
    const hasBody = content.length > 50;
    const hasClosing = /regards|thanks|sincerely/i.test(content);
    
    return (hasGreeting ? 0.33 : 0) + (hasBody ? 0.34 : 0) + (hasClosing ? 0.33 : 0);
  }
  
  checkFactualClaims(content) {
    return /\d+%|\d+ years|₹\d+|statistics|research|study/i.test(content) ? 1 : 0;
  }
  
  checkSources(content) {
    return /according to|source:|reference:|as per/i.test(content) ? 1 : 0;
  }
  
  checkToneConsistency(content) {
    const formalWords = (content.match(/hereby|whereas|furthermore|moreover/gi) || []).length;
    const casualWords = (content.match(/hey|cool|awesome|yeah/gi) || []).length;
    
    if (formalWords > 0 && casualWords > 0) return 0.5; // Mixed tone
    return 1; // Consistent tone
  }
  
  countErrors(content) {
    let errors = 0;
    
    // Check for common errors
    if (/\s{2,}/.test(content)) errors++;
    if (/[.!?]{2,}/.test(content)) errors++;
    if (!/^[A-Z]/.test(content)) errors++;
    if (/[a-z][A-Z]/.test(content)) errors++; // Missing space
    
    return errors;
  }
}

  /**
   * Predict viral potential of content
   */
  async predictViralPotential(content, metadata = {}) {
    const features = await this.extractViralFeatures(content, metadata);
    const input = tf.tensor2d([features]);
    
    const prediction = this.models.virality.predict(input);
    const viralScore = await prediction.data();
    
    input.dispose();
    prediction.dispose();
    
    const factors = this.analyzeViralFactors(features);
    const improvements = await this.suggestViralImprovements(content, factors);
    
    return {
      score: viralScore[0],
      probability: this.calculateViralProbability(viralScore[0]),
      factors,
      improvements,
      benchmarks: await this.getViralBenchmarks(metadata.category),
      predictedReach: this.estimateReach(viralScore[0], metadata)
    };
  }

  /**
   * Extract features for viral prediction
   */
  async extractViralFeatures(content, metadata) {
    const features = [];
    
    // Emotional triggers
    const emotionalFeatures = this.extractEmotionalTriggers(content);
    features.push(...Object.values(emotionalFeatures));
    
    // Hook strength
    const hookFeatures = this.analyzeHookStrength(content);
    features.push(...Object.values(hookFeatures));
    
    // Shareability factors
    const shareabilityFeatures = this.analyzeShareability(content);
    features.push(...Object.values(shareabilityFeatures));
    
    // Trend alignment
    const trendFeatures = await this.analyzeTrendAlignment(content);
    features.push(...Object.values(trendFeatures));
    
    // Visual appeal indicators
    const visualFeatures = this.analyzeVisualPotential(content);
    features.push(...Object.values(visualFeatures));
    
    // Controversy/discussion potential
    const discussionFeatures = this.analyzeDiscussionPotential(content);
    features.push(...Object.values(discussionFeatures));
    
    // Platform-specific signals
    const platformFeatures = this.extractPlatformSignals(content, metadata.platform);
    features.push(...Object.values(platformFeatures));
    
    return features;
  }

  /**
   * Extract emotional triggers that drive virality
   */
  extractEmotionalTriggers(content) {
    const emotions = {
      curiosity: 0,
      surprise: 0,
      fear: 0,
      urgency: 0,
      aspiration: 0,
      outrage: 0,
      humor: 0,
      inspiration: 0
    };
    
    // Curiosity triggers
    const curiosityPatterns = [
      /did you know/i, /secret/i, /revealed/i, /hidden/i,
      /truth about/i, /what .+ don't tell you/i
    ];
    emotions.curiosity = curiosityPatterns.filter(p => p.test(content)).length / curiosityPatterns.length;
    
    // Surprise elements
    const surprisePatterns = [
      /shocking/i, /unexpected/i, /can't believe/i, /mind-blowing/i,
      /!/g, /\?!/g
    ];
    emotions.surprise = surprisePatterns.filter(p => p.test(content)).length / surprisePatterns.length;
    
    // Fear/FOMO triggers
    const fearPatterns = [
      /miss out/i, /losing/i, /risk/i, /danger/i,
      /before it's too late/i, /last chance/i
    ];
    emotions.fear = fearPatterns.filter(p => p.test(content)).length / fearPatterns.length;
    
    // Urgency indicators
    const urgencyPatterns = [
      /now/i, /today/i, /limited time/i, /act fast/i,
      /don't wait/i, /deadline/i
    ];
    emotions.urgency = urgencyPatterns.filter(p => p.test(content)).length / urgencyPatterns.length;
    
    // Aspirational content
    const aspirationPatterns = [
      /success/i, /achieve/i, /dream/i, /goal/i,
      /millionaire/i, /financial freedom/i
    ];
    emotions.aspiration = aspirationPatterns.filter(p => p.test(content)).length / aspirationPatterns.length;
    
    return emotions;
  }

  /**
   * Analyze hook strength (first 10 words impact)
   */
  analyzeHookStrength(content) {
    const firstWords = content.split(/\s+/).slice(0, 10).join(' ');
    
    return {
      hasNumber: /\d+/.test(firstWords) ? 1 : 0,
      hasQuestion: /\?/.test(firstWords) ? 1 : 0,
      wordCount: firstWords.split(/\s+/).length / 10,
      hasEmoji: /[\u{1F600}-\u{1F6FF}]/gu.test(firstWords) ? 1 : 0,
      hasPowerWord: this.containsPowerWords(firstWords),
      readabilityScore: this.calculateReadability(firstWords)
    };
  }

  /**
   * Check for power words that increase engagement
   */
  containsPowerWords(text) {
    const powerWords = [
      'free', 'proven', 'guaranteed', 'easy', 'instant',
      'secret', 'exclusive', 'limited', 'breakthrough', 'revolutionary'
    ];
    const lowerText = text.toLowerCase();
    return powerWords.filter(word => lowerText.includes(word)).length / powerWords.length;
  }

  /**
   * Analyze shareability factors
   */
  analyzeShareability(content) {
    return {
      hasStatistics: (content.match(/\d+%|₹[\d,]+|\d+ crore|\d+ lakh/g) || []).length / 10,
      hasQuotable: this.findQuotableSentences(content).length / 5,
      controversyLevel: this.assessControversy(content),
      educationalValue: this.assessEducationalValue(content),
      practicalValue: this.assessPracticalValue(content),
      relatability: this.assessRelatability(content)
    };
  }

  /**
   * Find quotable sentences
   */
  findQuotableSentences(content) {
    const sentences = content.split(/[.!?]+/);
    return sentences.filter(s => {
      const words = s.trim().split(/\s+/);
      return words.length >= 5 && words.length <= 20 && 
             (s.includes('"') || /always|never|every|best|worst/i.test(s));
    });
  }

  /**
   * Analyze trend alignment
   */
  async analyzeTrendAlignment(content) {
    const currentTrends = await this.getCurrentTrends();
    const alignment = {};
    
    currentTrends.forEach(trend => {
      alignment[trend.topic] = this.calculateTrendMatch(content, trend.keywords);
    });
    
    return {
      trendScore: Math.max(...Object.values(alignment)),
      matchedTrends: Object.keys(alignment).filter(k => alignment[k] > 0.5).length,
      topTrendMatch: Object.entries(alignment).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
    };
  }

  /**
   * Get current trending topics
   */
  async getCurrentTrends() {
    // In production, fetch from trend monitoring service
    return [
      { topic: 'budget2024', keywords: ['budget', 'tax slab', 'new regime'] },
      { topic: 'nifty_high', keywords: ['nifty', 'all-time high', 'market rally'] },
      { topic: 'gold_investment', keywords: ['gold', 'sovereign bond', 'digital gold'] },
      { topic: 'startup_ipo', keywords: ['ipo', 'listing', 'grey market'] },
      { topic: 'crypto_regulation', keywords: ['crypto', 'bitcoin', 'digital currency'] }
    ];
  }

  /**
   * Calculate trend match score
   */
  calculateTrendMatch(content, keywords) {
    const lowerContent = content.toLowerCase();
    const matches = keywords.filter(keyword => lowerContent.includes(keyword.toLowerCase()));
    return matches.length / keywords.length;
  }

  /**
   * Analyze visual potential
   */
  analyzeVisualPotential(content) {
    return {
      hasNumbers: (content.match(/\d+/g) || []).length / 10,
      hasList: /\n\d+\.|\n-|\n•/g.test(content) ? 1 : 0,
      hasComparison: /vs\.|versus|compared to|better than/i.test(content) ? 1 : 0,
      infographicPotential: this.assessInfographicPotential(content),
      chartPotential: this.assessChartPotential(content)
    };
  }

  /**
   * Assess infographic potential
   */
  assessInfographicPotential(content) {
    let score = 0;
    if (/step \d|\d+\./gm.test(content)) score += 0.3;
    if ((content.match(/\d+%/g) || []).length > 2) score += 0.3;
    if (/before|after|vs\.|versus/i.test(content)) score += 0.2;
    if (content.split('\n').length > 5) score += 0.2;
    return Math.min(1, score);
  }

  /**
   * Assess chart potential
   */
  assessChartPotential(content) {
    let score = 0;
    if (/growth|increase|decrease|trend/i.test(content)) score += 0.3;
    if ((content.match(/₹[\d,]+/g) || []).length > 2) score += 0.3;
    if (/year|month|quarter/i.test(content)) score += 0.2;
    if (/comparison|compare/i.test(content)) score += 0.2;
    return Math.min(1, score);
  }

  /**
   * Analyze discussion potential
   */
  analyzeDiscussionPotential(content) {
    return {
      hasQuestion: (content.match(/\?/g) || []).length / 3,
      hasOpinion: /i think|i believe|in my opinion|should|shouldn't/i.test(content) ? 1 : 0,
      hasCallToAction: /comment|share|let me know|what do you think/i.test(content) ? 1 : 0,
      controversyScore: this.assessControversy(content),
      debateWorthiness: this.assessDebateWorthiness(content)
    };
  }

  /**
   * Assess controversy level
   */
  assessControversy(content) {
    const controversialTopics = [
      /crypto|bitcoin/i, /active vs passive/i, /term insurance vs endowment/i,
      /rent vs buy/i, /debt is good/i, /debt is bad/i
    ];
    return controversialTopics.filter(t => t.test(content)).length / controversialTopics.length;
  }

  /**
   * Assess debate worthiness
   */
  assessDebateWorthiness(content) {
    let score = 0;
    if (/which is better/i.test(content)) score += 0.3;
    if (/myth|misconception|wrong/i.test(content)) score += 0.3;
    if (/always|never|must|should/i.test(content)) score += 0.2;
    if (/unpopular opinion/i.test(content)) score += 0.2;
    return Math.min(1, score);
  }

  /**
   * Extract platform-specific signals
   */
  extractPlatformSignals(content, platform = 'whatsapp') {
    const signals = {
      whatsapp: {
        length: content.length < 300 ? 1 : content.length < 500 ? 0.7 : 0.3,
        hasEmoji: (content.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length / 5,
        hasGreeting: /good morning|hello|dear/i.test(content) ? 1 : 0,
        forwardability: this.assessForwardability(content)
      },
      linkedin: {
        professional: this.assessProfessionalism(content),
        hasHashtags: (content.match(/#\w+/g) || []).length / 5,
        thoughtLeadership: this.assessThoughtLeadership(content),
        length: content.length > 500 && content.length < 1300 ? 1 : 0.5
      },
      twitter: {
        threadPotential: content.length > 280 ? 1 : 0,
        hasHashtags: (content.match(/#\w+/g) || []).length / 3,
        retweetability: this.assessRetweetability(content),
        length: content.length <= 280 ? 1 : 0.3
      },
      instagram: {
        visualAppeal: this.analyzeVisualPotential(content).infographicPotential,
        hasHashtags: (content.match(/#\w+/g) || []).length / 10,
        storyWorthiness: this.assessStoryWorthiness(content),
        captionQuality: content.length > 50 && content.length < 200 ? 1 : 0.5
      }
    };
    
    return signals[platform] || signals.whatsapp;
  }

  /**
   * Multi-platform content optimization
   */
  async optimizeForPlatform(content, targetPlatform) {
    const platformStrategies = {
      whatsapp: {
        maxLength: 500,
        style: 'conversational',
        formatting: 'simple',
        cta: 'forward to friends',
        visual: 'minimal'
      },
      linkedin: {
        maxLength: 1300,
        style: 'professional',
        formatting: 'structured',
        cta: 'share your thoughts',
        visual: 'infographic'
      },
      twitter: {
        maxLength: 280,
        style: 'punchy',
        formatting: 'thread',
        cta: 'retweet if you agree',
        visual: 'image or gif'
      },
      instagram: {
        maxLength: 200,
        style: 'visual-first',
        formatting: 'caption',
        cta: 'save for later',
        visual: 'carousel or reel'
      }
    };
    
    const strategy = platformStrategies[targetPlatform];
    const optimized = await this.applyPlatformStrategy(content, strategy);
    
    return {
      original: content,
      optimized,
      platform: targetPlatform,
      changes: this.documentChanges(content, optimized),
      projectedEngagement: await this.projectPlatformEngagement(optimized, targetPlatform)
    };
  }

  /**
   * Apply platform-specific optimization strategy
   */
  async applyPlatformStrategy(content, strategy) {
    let optimized = content;
    
    // Length optimization
    if (content.length > strategy.maxLength) {
      optimized = this.smartTruncate(content, strategy.maxLength);
    }
    
    // Style adaptation
    optimized = this.adaptStyle(optimized, strategy.style);
    
    // Formatting adjustment
    optimized = this.adjustFormatting(optimized, strategy.formatting);
    
    // Add platform-specific CTA
    if (!optimized.includes(strategy.cta)) {
      optimized = this.addPlatformCTA(optimized, strategy.cta);
    }
    
    return optimized;
  }

  /**
   * Smart truncation preserving meaning
   */
  smartTruncate(content, maxLength) {
    if (content.length <= maxLength) return content;
    
    const sentences = content.split(/[.!?]+/);
    let truncated = '';
    
    for (const sentence of sentences) {
      if ((truncated + sentence).length <= maxLength - 20) {
        truncated += sentence + '. ';
      } else {
        break;
      }
    }
    
    return truncated.trim() + '...';
  }

  /**
   * Initialize trend monitoring system
   */
  async initializeTrendMonitoring() {
    // Set up real-time trend tracking
    this.trendSources = [
      { name: 'financial_news', weight: 0.3 },
      { name: 'social_media', weight: 0.25 },
      { name: 'google_trends', weight: 0.2 },
      { name: 'platform_analytics', weight: 0.25 }
    ];
    
    // Update trends periodically
    setInterval(() => this.updateTrends(), 3600000); // Every hour
    await this.updateTrends();
  }

  /**
   * Update trending topics
   */
  async updateTrends() {
    const trends = await this.fetchTrendsFromSources();
    
    trends.forEach(trend => {
      this.trendingTopics.set(trend.id, {
        ...trend,
        timestamp: new Date(),
        momentum: this.calculateMomentum(trend)
      });
    });
    
    this.emit('trends:updated', Array.from(this.trendingTopics.values()));
  }

  /**
   * Load viral patterns from successful content
   */
  async loadViralPatterns() {
    // In production, load from database of viral content
    const viralPatterns = [
      {
        pattern: 'number_hook',
        example: '5 Tax-Saving Mistakes...',
        avgEngagement: 0.82
      },
      {
        pattern: 'question_opener',
        example: 'Did you know that...',
        avgEngagement: 0.78
      },
      {
        pattern: 'myth_buster',
        example: 'The biggest myth about...',
        avgEngagement: 0.85
      },
      {
        pattern: 'urgency_driver',
        example: 'Last 3 days to...',
        avgEngagement: 0.79
      }
    ];
    
    viralPatterns.forEach(pattern => {
      this.viralPatterns.set(pattern.pattern, pattern);
    });
  }

  /**
   * Generate viral content suggestions
   */
  async generateViralContentIdeas(advisorProfile, count = 10) {
    const ideas = [];
    const trends = Array.from(this.trendingTopics.values())
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, 5);
    
    for (const trend of trends) {
      const viralPattern = this.selectViralPattern(trend);
      const idea = await this.createContentIdea(trend, viralPattern, advisorProfile);
      ideas.push(idea);
    }
    
    // Add evergreen viral ideas
    const evergreenIdeas = await this.generateEvergreenViralIdeas(advisorProfile);
    ideas.push(...evergreenIdeas);
    
    return ideas.slice(0, count).map((idea, index) => ({
      ...idea,
      rank: index + 1,
      estimatedViralScore: this.estimateViralScore(idea),
      complianceCheck: this.quickComplianceCheck(idea.content)
    }));
  }

  /**
   * Create content idea combining trend and viral pattern
   */
  async createContentIdea(trend, pattern, advisorProfile) {
    const idea = {
      topic: trend.topic,
      pattern: pattern.pattern,
      headline: this.generateHeadline(trend, pattern),
      content: await this.generateContentSkeleton(trend, pattern),
      platform: this.recommendPlatform(trend, advisorProfile),
      timing: this.recommendTiming(trend),
      visuals: this.recommendVisuals(trend, pattern),
      engagement_hooks: this.generateEngagementHooks(trend)
    };
    
    return idea;
  }

  /**
   * Educational vs Sales balance optimizer
   */
  async optimizeEducationalSalesBalance(content, targetRatio = 0.7) {
    const analysis = this.analyzeContentBalance(content);
    
    if (Math.abs(analysis.educationalRatio - targetRatio) < 0.1) {
      return {
        content,
        balanced: true,
        ratio: analysis.educationalRatio
      };
    }
    
    const optimized = analysis.educationalRatio < targetRatio
      ? await this.increaseEducationalContent(content, analysis)
      : await this.increaseSalesContent(content, analysis);
    
    return {
      original: content,
      optimized,
      balanced: true,
      ratio: targetRatio,
      changes: this.documentChanges(content, optimized)
    };
  }

  /**
   * Analyze educational vs sales content balance
   */
  analyzeContentBalance(content) {
    const sentences = content.split(/[.!?]+/);
    let educational = 0;
    let sales = 0;
    
    const educationalPatterns = [
      /learn|understand|know|explain|how|why|what/i,
      /tip|advice|guide|insight|fact|study/i,
      /research|data|statistics|analysis/i
    ];
    
    const salesPatterns = [
      /buy|invest|purchase|sign up|register/i,
      /offer|discount|limited|exclusive|free/i,
      /contact|call|visit|click|download/i
    ];
    
    sentences.forEach(sentence => {
      if (educationalPatterns.some(p => p.test(sentence))) educational++;
      if (salesPatterns.some(p => p.test(sentence))) sales++;
    });
    
    const total = educational + sales || 1;
    
    return {
      educationalRatio: educational / total,
      salesRatio: sales / total,
      educational,
      sales,
      total: sentences.length
    };
  }

  /**
   * Helper methods for virality and optimization
   */
  
  assessEducationalValue(content) {
    let score = 0;
    if (/learn|understand|explain/i.test(content)) score += 0.3;
    if (/how to|guide|tips/i.test(content)) score += 0.3;
    if (/example|case study/i.test(content)) score += 0.2;
    if ((content.match(/\d+\.|step/gi) || []).length > 2) score += 0.2;
    return Math.min(1, score);
  }
  
  assessPracticalValue(content) {
    let score = 0;
    if (/save money|save tax|reduce cost/i.test(content)) score += 0.3;
    if (/calculator|formula|tool/i.test(content)) score += 0.2;
    if (/checklist|template/i.test(content)) score += 0.2;
    if (/actionable|practical|implement/i.test(content)) score += 0.3;
    return Math.min(1, score);
  }
  
  assessRelatability(content) {
    let score = 0;
    if (/you|your/gi.test(content)) score += 0.2;
    if (/common|everyone|most people/i.test(content)) score += 0.2;
    if (/mistake|problem|challenge/i.test(content)) score += 0.2;
    if (/story|experience|example/i.test(content)) score += 0.2;
    if (/middle class|salaried|working professional/i.test(content)) score += 0.2;
    return Math.min(1, score);
  }
  
  assessForwardability(content) {
    let score = 0;
    if (content.length < 500) score += 0.3;
    if (/important|useful|helpful/i.test(content)) score += 0.2;
    if (/share|forward/i.test(content)) score += 0.2;
    if ((content.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length > 0) score += 0.15;
    if (/\n\d+\.|\n-/g.test(content)) score += 0.15;
    return Math.min(1, score);
  }
  
  assessProfessionalism(content) {
    let score = 1;
    if (/lol|omg|wtf/i.test(content)) score -= 0.3;
    if ((content.match(/!!+|\?\?+/g) || []).length > 0) score -= 0.2;
    if (!/[A-Z]/.test(content[0])) score -= 0.1;
    if ((content.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length > 3) score -= 0.2;
    return Math.max(0, score);
  }
  
  assessThoughtLeadership(content) {
    let score = 0;
    if (/i believe|in my experience|i've observed/i.test(content)) score += 0.3;
    if (/trend|future|prediction|forecast/i.test(content)) score += 0.2;
    if (/insight|perspective|analysis/i.test(content)) score += 0.2;
    if (content.length > 800) score += 0.3;
    return Math.min(1, score);
  }
  
  assessRetweetability(content) {
    let score = 0;
    if (content.length <= 280) score += 0.3;
    if (/RT if|Retweet if/i.test(content)) score += 0.2;
    if ((content.match(/@\w+/g) || []).length > 0) score += 0.1;
    if ((content.match(/#\w+/g) || []).length > 0 && (content.match(/#\w+/g) || []).length <= 3) score += 0.2;
    if (/breaking|just in|announcement/i.test(content)) score += 0.2;
    return Math.min(1, score);
  }
  
  assessStoryWorthiness(content) {
    let score = 0;
    if (/behind the scenes|journey|story/i.test(content)) score += 0.3;
    if (/before.*after|transformation/i.test(content)) score += 0.3;
    if (this.analyzeVisualPotential(content).infographicPotential > 0.5) score += 0.4;
    return Math.min(1, score);
  }
  
  calculateViralProbability(score) {
    // Sigmoid function to convert score to probability
    return 1 / (1 + Math.exp(-10 * (score - 0.5)));
  }
  
  estimateReach(viralScore, metadata) {
    const baseReach = metadata.followerCount || 100;
    const multiplier = 1 + (viralScore * 10); // Up to 11x reach for highly viral content
    return Math.floor(baseReach * multiplier);
  }
  
  analyzeViralFactors(features) {
    const factors = [];
    
    // Analyze each feature category
    if (features[0] > 0.7) factors.push({ factor: 'emotional_trigger', strength: 'high' });
    if (features[5] > 0.5) factors.push({ factor: 'hook_strength', strength: 'moderate' });
    if (features[10] > 0.6) factors.push({ factor: 'shareability', strength: 'high' });
    if (features[15] > 0.7) factors.push({ factor: 'trend_alignment', strength: 'high' });
    
    return factors;
  }
  
  async suggestViralImprovements(content, factors) {
    const improvements = [];
    
    // Check for missing viral elements
    if (!factors.find(f => f.factor === 'emotional_trigger')) {
      improvements.push({
        type: 'add_emotion',
        suggestion: 'Add emotional triggers like curiosity or urgency',
        example: 'Start with "Did you know..." or "Warning: This could affect your..."'
      });
    }
    
    if (!factors.find(f => f.factor === 'hook_strength')) {
      improvements.push({
        type: 'strengthen_hook',
        suggestion: 'Improve the opening hook',
        example: 'Use numbers, questions, or surprising facts in the first line'
      });
    }
    
    return improvements;
  }
  
  async getViralBenchmarks(category) {
    // Return benchmarks for the category
    const benchmarks = {
      tax: { avgViralScore: 0.65, topPerformers: 0.85 },
      investment: { avgViralScore: 0.70, topPerformers: 0.90 },
      insurance: { avgViralScore: 0.55, topPerformers: 0.75 },
      market: { avgViralScore: 0.75, topPerformers: 0.92 }
    };
    
    return benchmarks[category] || { avgViralScore: 0.60, topPerformers: 0.80 };
  }
}

module.exports = MLContentOptimizer;