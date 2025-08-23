/**
 * Content Uniqueness & History Tracking System
 * Ensures content freshness and prevents duplication across advisors
 */

const crypto = require('crypto');
const natural = require('natural');
const { EventEmitter } = require('events');

class ContentUniquenessEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      similarityThreshold: config.similarityThreshold || 0.85,
      fingerprintAlgorithm: config.fingerprintAlgorithm || 'sha256',
      embeddingDimensions: config.embeddingDimensions || 768,
      deduplicationWindow: config.deduplicationWindow || 90, // days
      performanceThreshold: config.performanceThreshold || 0.3, // min engagement rate
      ...config
    };

    this.fingerprints = new Map();
    this.contentHistory = new Map();
    this.performanceMetrics = new Map();
    this.vectorIndex = null;
  }

  /**
   * Generate content fingerprint using multiple algorithms
   */
  generateFingerprint(content) {
    const fingerprint = {
      // Exact match fingerprint
      hash: this.generateHash(content),
      
      // Structural fingerprint (ignores minor variations)
      structural: this.generateStructuralHash(content),
      
      // Semantic fingerprint (meaning-based)
      semantic: this.generateSemanticHash(content),
      
      // Statistical fingerprint
      statistical: this.generateStatisticalFingerprint(content),
      
      // Timestamp
      createdAt: new Date(),
      
      // Content metadata
      metadata: this.extractMetadata(content)
    };

    return fingerprint;
  }

  /**
   * Generate cryptographic hash for exact matching
   */
  generateHash(content) {
    const normalizedContent = this.normalizeContent(content);
    return crypto
      .createHash(this.config.fingerprintAlgorithm)
      .update(normalizedContent)
      .digest('hex');
  }

  /**
   * Generate structural hash (ignores whitespace, punctuation variations)
   */
  generateStructuralHash(content) {
    const structural = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return crypto
      .createHash('md5')
      .update(structural)
      .digest('hex');
  }

  /**
   * Generate semantic hash using NLP techniques
   */
  generateSemanticHash(content) {
    // Extract key concepts and entities
    const concepts = this.extractConcepts(content);
    const entities = this.extractEntities(content);
    
    // Create semantic signature
    const semanticSignature = {
      concepts: concepts.sort(),
      entities: entities.sort(),
      topics: this.extractTopics(content),
      sentiment: this.analyzeSentiment(content)
    };
    
    return crypto
      .createHash('md5')
      .update(JSON.stringify(semanticSignature))
      .digest('hex');
  }

  /**
   * Generate statistical fingerprint for fuzzy matching
   */
  generateStatisticalFingerprint(content) {
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    
    return {
      wordCount: words.length,
      uniqueWordCount: uniqueWords.size,
      avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      lexicalDiversity: uniqueWords.size / words.length,
      sentenceCount: content.split(/[.!?]+/).length - 1,
      paragraphCount: content.split(/\n\n+/).length,
      characterDistribution: this.getCharacterDistribution(content),
      nGramSignature: this.generateNGramSignature(content)
    };
  }

  /**
   * Extract n-gram signature for similarity detection
   */
  generateNGramSignature(content, n = 3) {
    const words = content.toLowerCase().split(/\s+/);
    const ngrams = new Map();
    
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(' ');
      ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1);
    }
    
    // Return top N most frequent n-grams as signature
    return Array.from(ngrams.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([ngram]) => ngram);
  }

  /**
   * Check content uniqueness using multiple algorithms
   */
  async checkUniqueness(content, advisorId, options = {}) {
    const fingerprint = this.generateFingerprint(content);
    const results = {
      isUnique: true,
      duplicates: [],
      similar: [],
      lowPerforming: [],
      recommendations: []
    };

    // 1. Exact duplicate check
    const exactDuplicate = await this.checkExactDuplicate(fingerprint.hash, advisorId);
    if (exactDuplicate) {
      results.isUnique = false;
      results.duplicates.push(exactDuplicate);
    }

    // 2. Structural similarity check
    const structuralMatches = await this.checkStructuralSimilarity(
      fingerprint.structural,
      advisorId
    );
    if (structuralMatches.length > 0) {
      results.similar.push(...structuralMatches);
    }

    // 3. Semantic similarity check using embeddings
    const semanticMatches = await this.checkSemanticSimilarity(
      content,
      advisorId,
      options.similarityThreshold || this.config.similarityThreshold
    );
    if (semanticMatches.length > 0) {
      results.similar.push(...semanticMatches);
    }

    // 4. Performance-based filtering
    const performanceIssues = await this.checkPerformanceHistory(
      fingerprint,
      advisorId
    );
    if (performanceIssues.length > 0) {
      results.lowPerforming.push(...performanceIssues);
    }

    // 5. Generate recommendations
    if (!results.isUnique || results.similar.length > 0) {
      results.recommendations = await this.generateContentRecommendations(
        content,
        results,
        advisorId
      );
    }

    // Store fingerprint if unique
    if (results.isUnique && options.store !== false) {
      await this.storeFingerprint(fingerprint, content, advisorId);
    }

    return results;
  }

  /**
   * Check for exact duplicates
   */
  async checkExactDuplicate(hash, advisorId) {
    const key = `${advisorId}:${hash}`;
    const existing = this.fingerprints.get(key);
    
    if (existing) {
      return {
        type: 'exact',
        matchedAt: existing.createdAt,
        contentId: existing.contentId,
        advisorId: existing.advisorId,
        performance: this.performanceMetrics.get(existing.contentId)
      };
    }
    
    return null;
  }

  /**
   * Check structural similarity
   */
  async checkStructuralSimilarity(structuralHash, advisorId) {
    const matches = [];
    const recentWindow = new Date();
    recentWindow.setDate(recentWindow.getDate() - this.config.deduplicationWindow);
    
    for (const [key, fingerprint] of this.fingerprints) {
      if (fingerprint.structural === structuralHash &&
          fingerprint.createdAt > recentWindow &&
          fingerprint.advisorId === advisorId) {
        matches.push({
          type: 'structural',
          similarity: 0.95, // High structural similarity
          matchedAt: fingerprint.createdAt,
          contentId: fingerprint.contentId,
          performance: this.performanceMetrics.get(fingerprint.contentId)
        });
      }
    }
    
    return matches;
  }

  /**
   * Check semantic similarity using vector embeddings
   */
  async checkSemanticSimilarity(content, advisorId, threshold) {
    // Generate embedding for new content
    const embedding = await this.generateEmbedding(content);
    
    // Search vector index for similar content
    const similarContent = await this.searchVectorIndex(
      embedding,
      advisorId,
      threshold
    );
    
    return similarContent.map(match => ({
      type: 'semantic',
      similarity: match.score,
      matchedAt: match.createdAt,
      contentId: match.contentId,
      content: match.content,
      performance: this.performanceMetrics.get(match.contentId)
    }));
  }

  /**
   * Generate vector embedding for content
   */
  async generateEmbedding(content) {
    // In production, use OpenAI embeddings or similar
    // This is a simplified example using TF-IDF
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(content);
    
    const embedding = new Array(this.config.embeddingDimensions).fill(0);
    tfidf.listTerms(0).forEach((term, index) => {
      if (index < this.config.embeddingDimensions) {
        embedding[index] = term.tfidf;
      }
    });
    
    return this.normalizeVector(embedding);
  }

  /**
   * Search vector index for similar content
   */
  async searchVectorIndex(embedding, advisorId, threshold) {
    // In production, use a vector database like Pinecone or Weaviate
    const matches = [];
    const recentWindow = new Date();
    recentWindow.setDate(recentWindow.getDate() - this.config.deduplicationWindow);
    
    for (const [contentId, data] of this.contentHistory) {
      if (data.advisorId === advisorId && data.createdAt > recentWindow) {
        const similarity = this.cosineSimilarity(embedding, data.embedding);
        if (similarity >= threshold) {
          matches.push({
            contentId,
            score: similarity,
            ...data
          });
        }
      }
    }
    
    return matches.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  /**
   * Calculate cosine similarity between vectors
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Check performance history to avoid repeating low-performing content
   */
  async checkPerformanceHistory(fingerprint, advisorId) {
    const lowPerforming = [];
    
    // Check if similar content has performed poorly
    for (const [contentId, metrics] of this.performanceMetrics) {
      if (metrics.advisorId === advisorId &&
          metrics.engagementRate < this.config.performanceThreshold) {
        // Check if content is similar
        const similarity = await this.calculateContentSimilarity(
          fingerprint,
          metrics.fingerprint
        );
        
        if (similarity > 0.7) {
          lowPerforming.push({
            contentId,
            similarity,
            performance: metrics,
            reason: `Similar content had low engagement (${(metrics.engagementRate * 100).toFixed(1)}%)`
          });
        }
      }
    }
    
    return lowPerforming;
  }

  /**
   * Generate content recommendations based on uniqueness check
   */
  async generateContentRecommendations(content, checkResults, advisorId) {
    const recommendations = [];
    
    // If exact duplicate found
    if (checkResults.duplicates.length > 0) {
      recommendations.push({
        type: 'avoid_duplicate',
        message: 'This exact content was sent before',
        suggestion: 'Modify the message or choose different content',
        alternatives: await this.suggestAlternatives(content, advisorId)
      });
    }
    
    // If similar content found
    if (checkResults.similar.length > 0) {
      const highestSimilarity = Math.max(...checkResults.similar.map(s => s.similarity));
      recommendations.push({
        type: 'high_similarity',
        message: `Content is ${(highestSimilarity * 100).toFixed(0)}% similar to previous content`,
        suggestion: 'Consider adding more unique insights or different examples',
        modifications: this.suggestModifications(content, checkResults.similar[0])
      });
    }
    
    // If low-performing similar content found
    if (checkResults.lowPerforming.length > 0) {
      recommendations.push({
        type: 'performance_warning',
        message: 'Similar content had low engagement previously',
        suggestion: 'Try a different approach or topic',
        topPerforming: await this.getTopPerformingTopics(advisorId)
      });
    }
    
    return recommendations;
  }

  /**
   * Store content fingerprint and history
   */
  async storeFingerprint(fingerprint, content, advisorId) {
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store fingerprint
    const key = `${advisorId}:${fingerprint.hash}`;
    this.fingerprints.set(key, {
      ...fingerprint,
      contentId,
      advisorId
    });
    
    // Store content history with embedding
    const embedding = await this.generateEmbedding(content);
    this.contentHistory.set(contentId, {
      content,
      embedding,
      fingerprint,
      advisorId,
      createdAt: new Date()
    });
    
    // Emit event for tracking
    this.emit('content:stored', {
      contentId,
      advisorId,
      fingerprint
    });
    
    return contentId;
  }

  /**
   * Update content performance metrics
   */
  updatePerformanceMetrics(contentId, metrics) {
    this.performanceMetrics.set(contentId, {
      ...metrics,
      updatedAt: new Date()
    });
    
    // Emit event for analytics
    this.emit('performance:updated', {
      contentId,
      metrics
    });
  }

  /**
   * Content lifecycle management
   */
  async archiveOldContent() {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - this.config.deduplicationWindow);
    
    let archivedCount = 0;
    
    // Archive old fingerprints
    for (const [key, fingerprint] of this.fingerprints) {
      if (fingerprint.createdAt < archiveDate) {
        // Move to archive storage (S3, cold storage, etc.)
        await this.archiveFingerprint(key, fingerprint);
        this.fingerprints.delete(key);
        archivedCount++;
      }
    }
    
    // Archive old content history
    for (const [contentId, data] of this.contentHistory) {
      if (data.createdAt < archiveDate) {
        await this.archiveContent(contentId, data);
        this.contentHistory.delete(contentId);
      }
    }
    
    this.emit('archive:completed', {
      archivedCount,
      archiveDate
    });
    
    return archivedCount;
  }

  /**
   * Helper methods
   */
  
  normalizeContent(content) {
    return content
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }
  
  extractConcepts(content) {
    // Extract key concepts using NLP
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an']);
    
    return words
      .filter(word => !stopWords.has(word) && word.length > 3)
      .slice(0, 10);
  }
  
  extractEntities(content) {
    // Extract named entities (simplified)
    const patterns = {
      money: /₹[\d,]+/g,
      percentage: /\d+%/g,
      date: /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g
    };
    
    const entities = [];
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern);
      if (matches) {
        entities.push(...matches.map(m => ({ type, value: m })));
      }
    }
    
    return entities;
  }
  
  extractTopics(content) {
    // Extract financial topics
    const topics = [];
    const topicKeywords = {
      'SIP': ['sip', 'systematic investment', 'monthly investment'],
      'Tax': ['tax', 'deduction', '80c', 'income tax'],
      'Insurance': ['insurance', 'term plan', 'health cover'],
      'Mutual Funds': ['mutual fund', 'nav', 'equity', 'debt fund'],
      'Market': ['market', 'nifty', 'sensex', 'stocks']
    };
    
    const lowerContent = content.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics;
  }
  
  analyzeSentiment(content) {
    // Simple sentiment analysis
    const sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(content);
    
    return sentiment.getSentiment(tokens);
  }
  
  getCharacterDistribution(content) {
    const distribution = {};
    for (const char of content.toLowerCase()) {
      if (/[a-z]/.test(char)) {
        distribution[char] = (distribution[char] || 0) + 1;
      }
    }
    return distribution;
  }
  
  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }
  
  async calculateContentSimilarity(fingerprint1, fingerprint2) {
    // Weighted similarity calculation
    const weights = {
      structural: 0.3,
      semantic: 0.4,
      statistical: 0.3
    };
    
    let similarity = 0;
    
    // Structural similarity
    if (fingerprint1.structural === fingerprint2.structural) {
      similarity += weights.structural;
    }
    
    // Semantic similarity
    if (fingerprint1.semantic === fingerprint2.semantic) {
      similarity += weights.semantic;
    }
    
    // Statistical similarity
    const statSim = this.calculateStatisticalSimilarity(
      fingerprint1.statistical,
      fingerprint2.statistical
    );
    similarity += weights.statistical * statSim;
    
    return similarity;
  }
  
  calculateStatisticalSimilarity(stats1, stats2) {
    const features = ['wordCount', 'uniqueWordCount', 'avgWordLength', 'lexicalDiversity'];
    let similarity = 0;
    
    for (const feature of features) {
      const diff = Math.abs(stats1[feature] - stats2[feature]);
      const avg = (stats1[feature] + stats2[feature]) / 2;
      similarity += 1 - (diff / avg);
    }
    
    return similarity / features.length;
  }
  
  async suggestAlternatives(content, advisorId) {
    // Suggest alternative content based on performance
    const topPerforming = await this.getTopPerformingContent(advisorId, 5);
    
    return topPerforming.map(item => ({
      topic: item.topics[0],
      template: item.template,
      performance: item.engagementRate,
      lastUsed: item.lastUsed
    }));
  }
  
  suggestModifications(content, similarContent) {
    // Suggest specific modifications to make content unique
    const modifications = [];
    
    // Compare and suggest changes
    if (content.length < similarContent.content.length * 0.8) {
      modifications.push('Add more detail or examples to expand the content');
    }
    
    if (!content.includes('?') && similarContent.content.includes('?')) {
      modifications.push('Consider adding engaging questions');
    }
    
    // Check for missing personalization
    if (!content.includes('{name}') && !content.includes('{client}')) {
      modifications.push('Add personalization tokens like client name');
    }
    
    return modifications;
  }
  
  async getTopPerformingTopics(advisorId) {
    const topicPerformance = new Map();
    
    for (const [contentId, metrics] of this.performanceMetrics) {
      if (metrics.advisorId === advisorId) {
        const topics = metrics.topics || [];
        for (const topic of topics) {
          if (!topicPerformance.has(topic)) {
            topicPerformance.set(topic, {
              topic,
              totalSent: 0,
              totalEngagement: 0
            });
          }
          
          const perf = topicPerformance.get(topic);
          perf.totalSent++;
          perf.totalEngagement += metrics.engagementRate;
        }
      }
    }
    
    return Array.from(topicPerformance.values())
      .map(perf => ({
        topic: perf.topic,
        avgEngagement: perf.totalEngagement / perf.totalSent,
        volume: perf.totalSent
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);
  }
  
  async getTopPerformingContent(advisorId, limit = 10) {
    const content = [];
    
    for (const [contentId, metrics] of this.performanceMetrics) {
      if (metrics.advisorId === advisorId && metrics.engagementRate > 0.5) {
        const history = this.contentHistory.get(contentId);
        if (history) {
          content.push({
            contentId,
            template: history.content.substring(0, 100),
            topics: history.fingerprint.metadata.topics,
            engagementRate: metrics.engagementRate,
            lastUsed: history.createdAt
          });
        }
      }
    }
    
    return content
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, limit);
  }
  
  async archiveFingerprint(key, fingerprint) {
    // Archive to S3 or cold storage
    console.log(`Archiving fingerprint: ${key}`);
    // Implementation would store to S3/cold storage
  }
  
  async archiveContent(contentId, data) {
    // Archive content history
    console.log(`Archiving content: ${contentId}`);
    // Implementation would store to S3/cold storage
  }
}

module.exports = ContentUniquenessEngine;