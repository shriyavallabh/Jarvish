/**
 * Vector Similarity Engine for Content Deduplication
 * High-performance semantic similarity detection using vector embeddings
 */

const { HNSWLib } = require('hnswlib-node');
const OpenAI = require('openai');
const { LRUCache } = require('lru-cache');

class VectorSimilarityEngine {
  constructor(config = {}) {
    this.config = {
      dimensions: config.dimensions || 1536, // OpenAI ada-002 dimensions
      maxElements: config.maxElements || 1000000,
      efConstruction: config.efConstruction || 200,
      m: config.m || 16,
      seed: config.seed || 42,
      cacheSize: config.cacheSize || 10000,
      batchSize: config.batchSize || 100,
      ...config
    };

    // Initialize OpenAI client for embeddings
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });

    // Initialize HNSW index for fast similarity search
    this.index = new HNSWLib('cosine', this.config.dimensions);
    this.index.initIndex(this.config.maxElements, this.config.m, this.config.efConstruction, this.config.seed);

    // Embedding cache to reduce API calls
    this.embeddingCache = new LRUCache({
      max: this.config.cacheSize,
      ttl: 1000 * 60 * 60 * 24 // 24 hours
    });

    // Content metadata storage
    this.metadata = new Map();
    this.advisorIndices = new Map(); // Track content per advisor
    this.currentId = 0;
  }

  /**
   * Generate embedding for content using OpenAI
   */
  async generateEmbedding(content) {
    // Check cache first
    const cacheKey = this.hashContent(content);
    const cached = this.embeddingCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Generate embedding using OpenAI
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: this.preprocessContent(content)
      });

      const embedding = response.data[0].embedding;
      
      // Cache the embedding
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fallback to local embedding generation
      return this.generateLocalEmbedding(content);
    }
  }

  /**
   * Batch generate embeddings for multiple contents
   */
  async batchGenerateEmbeddings(contents) {
    const embeddings = [];
    const uncachedContents = [];
    const uncachedIndices = [];

    // Check cache for each content
    contents.forEach((content, index) => {
      const cacheKey = this.hashContent(content);
      const cached = this.embeddingCache.get(cacheKey);
      if (cached) {
        embeddings[index] = cached;
      } else {
        uncachedContents.push(this.preprocessContent(content));
        uncachedIndices.push(index);
      }
    });

    // Batch process uncached contents
    if (uncachedContents.length > 0) {
      try {
        const batches = [];
        for (let i = 0; i < uncachedContents.length; i += this.config.batchSize) {
          const batch = uncachedContents.slice(i, i + this.config.batchSize);
          batches.push(batch);
        }

        for (const batch of batches) {
          const response = await this.openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: batch
          });

          response.data.forEach((item, batchIndex) => {
            const originalIndex = uncachedIndices[batchIndex];
            const embedding = item.embedding;
            embeddings[originalIndex] = embedding;
            
            // Cache the embedding
            const content = contents[originalIndex];
            const cacheKey = this.hashContent(content);
            this.embeddingCache.set(cacheKey, embedding);
          });
        }
      } catch (error) {
        console.error('Error in batch embedding generation:', error);
        // Fallback for failed items
        for (const index of uncachedIndices) {
          if (!embeddings[index]) {
            embeddings[index] = await this.generateLocalEmbedding(contents[index]);
          }
        }
      }
    }

    return embeddings;
  }

  /**
   * Add content to the vector index
   */
  async addContent(content, advisorId, metadata = {}) {
    const embedding = await this.generateEmbedding(content);
    const contentId = this.currentId++;

    // Add to HNSW index
    this.index.addPoint(embedding, contentId);

    // Store metadata
    this.metadata.set(contentId, {
      content,
      advisorId,
      embedding,
      timestamp: new Date(),
      ...metadata
    });

    // Track by advisor
    if (!this.advisorIndices.has(advisorId)) {
      this.advisorIndices.set(advisorId, new Set());
    }
    this.advisorIndices.get(advisorId).add(contentId);

    return contentId;
  }

  /**
   * Search for similar content
   */
  async searchSimilar(content, options = {}) {
    const {
      advisorId = null,
      threshold = 0.85,
      limit = 10,
      excludeIds = [],
      dateRange = null
    } = options;

    const embedding = await this.generateEmbedding(content);
    
    // Search in HNSW index
    const searchK = Math.min(limit * 3, 100); // Search more to filter later
    const result = this.index.searchKnn(embedding, searchK);

    const matches = [];
    const advisorContent = advisorId ? this.advisorIndices.get(advisorId) : null;

    for (let i = 0; i < result.neighbors.length; i++) {
      const contentId = result.neighbors[i];
      const similarity = 1 - result.distances[i]; // Convert distance to similarity

      // Skip if below threshold
      if (similarity < threshold) continue;

      // Skip excluded IDs
      if (excludeIds.includes(contentId)) continue;

      const metadata = this.metadata.get(contentId);
      if (!metadata) continue;

      // Filter by advisor if specified
      if (advisorId && !advisorContent.has(contentId)) continue;

      // Filter by date range if specified
      if (dateRange) {
        const contentDate = new Date(metadata.timestamp);
        if (dateRange.start && contentDate < dateRange.start) continue;
        if (dateRange.end && contentDate > dateRange.end) continue;
      }

      matches.push({
        contentId,
        similarity,
        content: metadata.content,
        advisorId: metadata.advisorId,
        timestamp: metadata.timestamp,
        metadata: metadata
      });

      if (matches.length >= limit) break;
    }

    return matches;
  }

  /**
   * Find duplicates within advisor's content
   */
  async findDuplicates(advisorId, threshold = 0.9) {
    const advisorContent = this.advisorIndices.get(advisorId);
    if (!advisorContent || advisorContent.size === 0) {
      return [];
    }

    const duplicates = [];
    const contentIds = Array.from(advisorContent);
    
    // Build similarity matrix
    for (let i = 0; i < contentIds.length; i++) {
      const metadata1 = this.metadata.get(contentIds[i]);
      if (!metadata1) continue;

      // Search for similar content
      const similar = await this.searchSimilar(metadata1.content, {
        advisorId,
        threshold,
        excludeIds: [contentIds[i]]
      });

      if (similar.length > 0) {
        duplicates.push({
          original: {
            contentId: contentIds[i],
            content: metadata1.content,
            timestamp: metadata1.timestamp
          },
          duplicates: similar
        });
      }
    }

    return duplicates;
  }

  /**
   * Cluster similar content
   */
  async clusterContent(advisorId, options = {}) {
    const {
      minClusterSize = 2,
      similarityThreshold = 0.8
    } = options;

    const advisorContent = this.advisorIndices.get(advisorId);
    if (!advisorContent || advisorContent.size < minClusterSize) {
      return [];
    }

    const contentIds = Array.from(advisorContent);
    const clusters = [];
    const visited = new Set();

    for (const contentId of contentIds) {
      if (visited.has(contentId)) continue;

      const metadata = this.metadata.get(contentId);
      if (!metadata) continue;

      // Find all similar content
      const similar = await this.searchSimilar(metadata.content, {
        advisorId,
        threshold: similarityThreshold,
        excludeIds: [contentId]
      });

      if (similar.length >= minClusterSize - 1) {
        const cluster = {
          centroid: contentId,
          members: [contentId, ...similar.map(s => s.contentId)],
          avgSimilarity: similar.reduce((sum, s) => sum + s.similarity, 0) / similar.length,
          topic: this.extractClusterTopic([metadata, ...similar])
        };

        clusters.push(cluster);
        cluster.members.forEach(id => visited.add(id));
      }
    }

    return clusters;
  }

  /**
   * Calculate diversity score for advisor's content
   */
  async calculateDiversityScore(advisorId) {
    const advisorContent = this.advisorIndices.get(advisorId);
    if (!advisorContent || advisorContent.size < 2) {
      return 1.0; // Maximum diversity for single or no content
    }

    const contentIds = Array.from(advisorContent);
    let totalSimilarity = 0;
    let comparisons = 0;

    // Sample pairs for large datasets
    const sampleSize = Math.min(contentIds.length, 50);
    const sampledIds = this.sampleArray(contentIds, sampleSize);

    for (let i = 0; i < sampledIds.length; i++) {
      for (let j = i + 1; j < sampledIds.length; j++) {
        const metadata1 = this.metadata.get(sampledIds[i]);
        const metadata2 = this.metadata.get(sampledIds[j]);
        
        if (metadata1 && metadata2) {
          const similarity = this.cosineSimilarity(
            metadata1.embedding,
            metadata2.embedding
          );
          totalSimilarity += similarity;
          comparisons++;
        }
      }
    }

    const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
    const diversityScore = 1 - avgSimilarity; // Higher score = more diverse

    return {
      score: diversityScore,
      interpretation: this.interpretDiversityScore(diversityScore),
      recommendations: this.getDiversityRecommendations(diversityScore)
    };
  }

  /**
   * Semantic deduplication with content modification suggestions
   */
  async semanticDeduplication(content, advisorId) {
    const similar = await this.searchSimilar(content, {
      advisorId,
      threshold: 0.7,
      limit: 5
    });

    if (similar.length === 0) {
      return {
        isDuplicate: false,
        canSend: true,
        similar: []
      };
    }

    const highestSimilarity = similar[0].similarity;
    
    if (highestSimilarity > 0.95) {
      return {
        isDuplicate: true,
        canSend: false,
        similar: similar,
        reason: 'Nearly identical content found',
        suggestions: await this.generateModificationSuggestions(content, similar[0].content)
      };
    } else if (highestSimilarity > 0.85) {
      return {
        isDuplicate: false,
        canSend: true,
        warning: 'High similarity detected',
        similar: similar,
        suggestions: await this.generateVariationSuggestions(content, similar)
      };
    } else {
      return {
        isDuplicate: false,
        canSend: true,
        similar: similar,
        note: 'Content is sufficiently unique'
      };
    }
  }

  /**
   * Generate modification suggestions for duplicate content
   */
  async generateModificationSuggestions(newContent, existingContent) {
    const differences = this.findContentDifferences(newContent, existingContent);
    const suggestions = [];

    if (differences.length < 10) {
      suggestions.push({
        type: 'major_rewrite',
        description: 'Content is too similar. Consider a major rewrite.',
        examples: [
          'Change the main example or case study',
          'Use a different angle or perspective',
          'Add unique insights or data points'
        ]
      });
    }

    // Specific modification suggestions
    if (!newContent.includes('?') && existingContent.includes('?')) {
      suggestions.push({
        type: 'add_engagement',
        description: 'Add questions to increase engagement',
        example: 'End with: "What are your thoughts on this?"'
      });
    }

    if (newContent.length < existingContent.length * 0.8) {
      suggestions.push({
        type: 'expand_content',
        description: 'Expand the content with more details',
        areas: ['Add statistics', 'Include examples', 'Provide context']
      });
    }

    return suggestions;
  }

  /**
   * Generate variation suggestions for similar content
   */
  async generateVariationSuggestions(content, similarContent) {
    const topics = this.extractTopics(content);
    const suggestions = [];

    // Analyze patterns in similar content
    const patterns = this.analyzeContentPatterns(similarContent.map(s => s.content));

    if (patterns.commonOpenings.length > 0) {
      suggestions.push({
        type: 'vary_opening',
        description: 'Use a different opening to stand out',
        avoid: patterns.commonOpenings,
        alternatives: this.generateOpeningAlternatives(content)
      });
    }

    if (patterns.repeatedPhrases.length > 0) {
      suggestions.push({
        type: 'avoid_cliches',
        description: 'Avoid overused phrases',
        phrases: patterns.repeatedPhrases,
        alternatives: this.generatePhraseAlternatives(patterns.repeatedPhrases)
      });
    }

    return suggestions;
  }

  /**
   * Helper methods
   */

  preprocessContent(content) {
    // Normalize and clean content for embedding
    return content
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s₹%]/g, '')
      .trim()
      .substring(0, 8000); // OpenAI token limit
  }

  hashContent(content) {
    const crypto = require('crypto');
    return crypto
      .createHash('md5')
      .update(this.preprocessContent(content))
      .digest('hex');
  }

  /**
   * Fallback local embedding generation
   */
  async generateLocalEmbedding(content) {
    // Simple TF-IDF based embedding as fallback
    const words = content.toLowerCase().split(/\s+/);
    const embedding = new Array(this.config.dimensions).fill(0);
    
    // Generate pseudo-random but deterministic embedding
    for (let i = 0; i < words.length && i < this.config.dimensions; i++) {
      const wordHash = this.hashWord(words[i]);
      embedding[i] = (wordHash % 100) / 100;
    }
    
    return this.normalizeVector(embedding);
  }

  hashWord(word) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }

  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    return dotProduct; // Vectors are already normalized
  }

  sampleArray(array, sampleSize) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  extractClusterTopic(contents) {
    // Extract common theme from clustered content
    const allWords = contents
      .flatMap(c => (c.content || c).toLowerCase().split(/\s+/))
      .filter(word => word.length > 4);
    
    const wordFreq = {};
    allWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
    
    return topWords.join(', ');
  }

  interpretDiversityScore(score) {
    if (score > 0.8) return 'Excellent diversity';
    if (score > 0.6) return 'Good diversity';
    if (score > 0.4) return 'Moderate diversity';
    if (score > 0.2) return 'Low diversity';
    return 'Very low diversity';
  }

  getDiversityRecommendations(score) {
    const recommendations = [];
    
    if (score < 0.4) {
      recommendations.push('Content is too similar. Vary topics and writing styles.');
      recommendations.push('Explore different content categories.');
      recommendations.push('Use diverse examples and case studies.');
    } else if (score < 0.6) {
      recommendations.push('Good start, but more variety would help.');
      recommendations.push('Try different content formats.');
    } else {
      recommendations.push('Maintain current diversity levels.');
    }
    
    return recommendations;
  }

  findContentDifferences(content1, content2) {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const unique1 = Array.from(words1).filter(w => !words2.has(w));
    const unique2 = Array.from(words2).filter(w => !words1.has(w));
    
    return [...unique1, ...unique2];
  }

  analyzeContentPatterns(contents) {
    const openings = contents.map(c => c.substring(0, 50));
    const phrases = {};
    
    // Find common phrases
    contents.forEach(content => {
      const words = content.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length - 2; i++) {
        const phrase = words.slice(i, i + 3).join(' ');
        phrases[phrase] = (phrases[phrase] || 0) + 1;
      }
    });
    
    const repeatedPhrases = Object.entries(phrases)
      .filter(([_, count]) => count > contents.length / 2)
      .map(([phrase]) => phrase);
    
    return {
      commonOpenings: this.findCommonPatterns(openings),
      repeatedPhrases
    };
  }

  findCommonPatterns(strings) {
    const patterns = {};
    strings.forEach(str => {
      const pattern = str.substring(0, 20);
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });
    
    return Object.entries(patterns)
      .filter(([_, count]) => count > 1)
      .map(([pattern]) => pattern);
  }

  generateOpeningAlternatives(content) {
    const alternatives = [
      'Start with a question',
      'Open with a statistic',
      'Begin with a client story',
      'Lead with a market insight',
      'Start with a common misconception'
    ];
    return alternatives;
  }

  generatePhraseAlternatives(phrases) {
    const alternatives = {};
    
    // Common financial phrase alternatives
    const phraseMap = {
      'mutual fund investment': ['diversified portfolio', 'fund allocation', 'investment vehicle'],
      'tax saving': ['tax optimization', 'tax efficiency', 'tax benefits'],
      'financial planning': ['wealth management', 'financial strategy', 'money management']
    };
    
    phrases.forEach(phrase => {
      if (phraseMap[phrase]) {
        alternatives[phrase] = phraseMap[phrase];
      }
    });
    
    return alternatives;
  }

  extractTopics(content) {
    const topics = [];
    const topicKeywords = {
      'SIP': ['sip', 'systematic investment'],
      'Tax': ['tax', 'deduction', '80c'],
      'Insurance': ['insurance', 'term', 'health'],
      'Mutual Funds': ['mutual fund', 'nav', 'equity'],
      'Stocks': ['stock', 'share', 'equity']
    };
    
    const lowerContent = content.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics;
  }

  /**
   * Cleanup and maintenance
   */
  async cleanup(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let removedCount = 0;
    
    for (const [contentId, metadata] of this.metadata) {
      if (metadata.timestamp < cutoffDate) {
        // Remove from metadata
        this.metadata.delete(contentId);
        
        // Remove from advisor index
        const advisorContent = this.advisorIndices.get(metadata.advisorId);
        if (advisorContent) {
          advisorContent.delete(contentId);
        }
        
        removedCount++;
      }
    }
    
    // Rebuild HNSW index if significant content removed
    if (removedCount > this.metadata.size * 0.1) {
      await this.rebuildIndex();
    }
    
    return removedCount;
  }

  async rebuildIndex() {
    // Create new index
    const newIndex = new HNSWLib('cosine', this.config.dimensions);
    newIndex.initIndex(this.config.maxElements, this.config.m, this.config.efConstruction, this.config.seed);
    
    // Re-add all current content
    for (const [contentId, metadata] of this.metadata) {
      newIndex.addPoint(metadata.embedding, contentId);
    }
    
    // Replace old index
    this.index = newIndex;
  }

  /**
   * Export and import for persistence
   */
  async exportIndex(filepath) {
    this.index.writeIndex(filepath);
    
    // Also export metadata
    const metadataPath = filepath.replace('.idx', '_metadata.json');
    const metadataExport = {
      metadata: Array.from(this.metadata.entries()),
      advisorIndices: Array.from(this.advisorIndices.entries()).map(([k, v]) => [k, Array.from(v)]),
      currentId: this.currentId
    };
    
    const fs = require('fs').promises;
    await fs.writeFile(metadataPath, JSON.stringify(metadataExport));
  }

  async importIndex(filepath) {
    this.index.readIndex(filepath);
    
    // Import metadata
    const metadataPath = filepath.replace('.idx', '_metadata.json');
    const fs = require('fs').promises;
    const metadataJson = await fs.readFile(metadataPath, 'utf-8');
    const metadataImport = JSON.parse(metadataJson);
    
    this.metadata = new Map(metadataImport.metadata);
    this.advisorIndices = new Map(
      metadataImport.advisorIndices.map(([k, v]) => [k, new Set(v)])
    );
    this.currentId = metadataImport.currentId;
  }
}

module.exports = VectorSimilarityEngine;