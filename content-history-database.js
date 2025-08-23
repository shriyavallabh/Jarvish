/**
 * Content History Database Schema and Management
 * Scalable storage for millions of advisor content with fast retrieval
 */

const { Pool } = require('pg');
const Redis = require('ioredis');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

class ContentHistoryDatabase {
  constructor(config = {}) {
    this.config = {
      postgres: {
        host: config.postgres?.host || 'localhost',
        port: config.postgres?.port || 5432,
        database: config.postgres?.database || 'jarvish_content',
        user: config.postgres?.user || 'postgres',
        password: config.postgres?.password,
        max: config.postgres?.max || 20
      },
      redis: {
        host: config.redis?.host || 'localhost',
        port: config.redis?.port || 6379,
        password: config.redis?.password,
        db: config.redis?.db || 0
      },
      s3: {
        region: config.s3?.region || 'ap-south-1',
        bucket: config.s3?.bucket || 'jarvish-content-history',
        accessKeyId: config.s3?.accessKeyId,
        secretAccessKey: config.s3?.secretAccessKey
      },
      retention: {
        hotData: config.retention?.hotData || 30, // days in primary storage
        warmData: config.retention?.warmData || 90, // days in secondary storage
        coldData: config.retention?.coldData || 365 // days before archival
      }
    };

    // Initialize connections
    this.initializeConnections();
  }

  async initializeConnections() {
    // PostgreSQL connection pool
    this.pgPool = new Pool(this.config.postgres);
    
    // Redis connection for caching
    this.redis = new Redis(this.config.redis);
    
    // S3 client for archival
    this.s3Client = new S3Client({
      region: this.config.s3.region,
      credentials: {
        accessKeyId: this.config.s3.accessKeyId,
        secretAccessKey: this.config.s3.secretAccessKey
      }
    });

    // Initialize database schema
    await this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  async initializeSchema() {
    const client = await this.pgPool.connect();
    
    try {
      // Content history table with partitioning
      await client.query(`
        CREATE TABLE IF NOT EXISTS content_history (
          content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          advisor_id VARCHAR(50) NOT NULL,
          content_hash VARCHAR(64) NOT NULL,
          content_text TEXT NOT NULL,
          content_type VARCHAR(20) NOT NULL,
          language VARCHAR(10),
          topic_tags TEXT[],
          embedding VECTOR(1536),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          sent_at TIMESTAMP WITH TIME ZONE,
          performance_metrics JSONB,
          metadata JSONB,
          
          -- Indexes for fast lookups
          INDEX idx_advisor_id (advisor_id),
          INDEX idx_content_hash (content_hash),
          INDEX idx_created_at (created_at),
          INDEX idx_topic_tags USING GIN (topic_tags),
          INDEX idx_embedding_hnsw ON embedding USING hnsw (embedding vector_cosine_ops)
        ) PARTITION BY RANGE (created_at);
      `);

      // Create monthly partitions
      await this.createMonthlyPartitions(client);

      // Content fingerprints table for fast deduplication
      await client.query(`
        CREATE TABLE IF NOT EXISTS content_fingerprints (
          fingerprint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          advisor_id VARCHAR(50) NOT NULL,
          content_id UUID REFERENCES content_history(content_id),
          hash_exact VARCHAR(64) NOT NULL,
          hash_structural VARCHAR(32) NOT NULL,
          hash_semantic VARCHAR(32) NOT NULL,
          statistical_signature JSONB,
          ngram_signature TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          usage_count INTEGER DEFAULT 1,
          
          -- Composite indexes for multi-level deduplication
          UNIQUE INDEX idx_advisor_hash (advisor_id, hash_exact),
          INDEX idx_structural (advisor_id, hash_structural),
          INDEX idx_semantic (advisor_id, hash_semantic),
          INDEX idx_ngram USING GIN (ngram_signature)
        );
      `);

      // Content performance tracking
      await client.query(`
        CREATE TABLE IF NOT EXISTS content_performance (
          performance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content_id UUID REFERENCES content_history(content_id),
          advisor_id VARCHAR(50) NOT NULL,
          sent_count INTEGER DEFAULT 0,
          delivered_count INTEGER DEFAULT 0,
          read_count INTEGER DEFAULT 0,
          click_count INTEGER DEFAULT 0,
          reply_count INTEGER DEFAULT 0,
          engagement_rate DECIMAL(5,4),
          avg_read_time INTEGER, -- seconds
          sentiment_score DECIMAL(3,2),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_content_performance (content_id),
          INDEX idx_advisor_performance (advisor_id),
          INDEX idx_engagement_rate (engagement_rate DESC)
        );
      `);

      // Content similarity clusters
      await client.query(`
        CREATE TABLE IF NOT EXISTS content_clusters (
          cluster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          advisor_id VARCHAR(50) NOT NULL,
          cluster_name VARCHAR(100),
          centroid_content_id UUID REFERENCES content_history(content_id),
          member_content_ids UUID[],
          avg_similarity DECIMAL(5,4),
          topic VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_advisor_clusters (advisor_id),
          INDEX idx_cluster_topic (topic)
        );
      `);

      // Content templates and variants
      await client.query(`
        CREATE TABLE IF NOT EXISTS content_templates (
          template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          advisor_id VARCHAR(50),
          template_name VARCHAR(100),
          template_text TEXT NOT NULL,
          placeholders TEXT[],
          category VARCHAR(50),
          language VARCHAR(10),
          usage_count INTEGER DEFAULT 0,
          avg_performance DECIMAL(5,4),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_global BOOLEAN DEFAULT FALSE,
          
          INDEX idx_template_category (category),
          INDEX idx_template_performance (avg_performance DESC)
        );
      `);

      // Advisor content preferences
      await client.query(`
        CREATE TABLE IF NOT EXISTS advisor_preferences (
          advisor_id VARCHAR(50) PRIMARY KEY,
          preferred_topics TEXT[],
          preferred_language VARCHAR(10),
          content_frequency VARCHAR(20), -- daily, weekly, etc
          avg_content_length INTEGER,
          best_performing_topics TEXT[],
          worst_performing_topics TEXT[],
          content_style JSONB, -- formal, casual, etc
          personalization_level INTEGER, -- 1-5
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Content audit log
      await client.query(`
        CREATE TABLE IF NOT EXISTS content_audit_log (
          audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          advisor_id VARCHAR(50) NOT NULL,
          content_id UUID,
          action VARCHAR(50) NOT NULL,
          details JSONB,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_audit_advisor (advisor_id),
          INDEX idx_audit_timestamp (timestamp)
        );
      `);

    } finally {
      client.release();
    }
  }

  /**
   * Create monthly partitions for content history
   */
  async createMonthlyPartitions(client) {
    const currentDate = new Date();
    const partitions = [];

    // Create partitions for next 3 months
    for (let i = -1; i <= 3; i++) {
      const partitionDate = new Date(currentDate);
      partitionDate.setMonth(partitionDate.getMonth() + i);
      
      const year = partitionDate.getFullYear();
      const month = String(partitionDate.getMonth() + 1).padStart(2, '0');
      const partitionName = `content_history_${year}_${month}`;
      
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(year, partitionDate.getMonth() + 1, 1);
      const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      partitions.push({
        name: partitionName,
        start: startDate,
        end: endDateStr
      });
    }

    for (const partition of partitions) {
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${partition.name}
          PARTITION OF content_history
          FOR VALUES FROM ('${partition.start}') TO ('${partition.end}');
        `);
      } catch (error) {
        // Partition might already exist
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
  }

  /**
   * Store content in history
   */
  async storeContent(content, advisorId, metadata = {}) {
    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert into content_history
      const contentResult = await client.query(`
        INSERT INTO content_history (
          advisor_id, content_hash, content_text, content_type,
          language, topic_tags, embedding, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING content_id, created_at
      `, [
        advisorId,
        metadata.contentHash,
        content,
        metadata.contentType || 'general',
        metadata.language || 'en',
        metadata.topics || [],
        metadata.embedding || null,
        JSON.stringify(metadata.extra || {})
      ]);

      const contentId = contentResult.rows[0].content_id;
      const createdAt = contentResult.rows[0].created_at;

      // Insert fingerprints
      await client.query(`
        INSERT INTO content_fingerprints (
          advisor_id, content_id, hash_exact, hash_structural,
          hash_semantic, statistical_signature, ngram_signature
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        advisorId,
        contentId,
        metadata.fingerprints?.exact || '',
        metadata.fingerprints?.structural || '',
        metadata.fingerprints?.semantic || '',
        JSON.stringify(metadata.fingerprints?.statistical || {}),
        metadata.fingerprints?.ngrams || []
      ]);

      await client.query('COMMIT');

      // Cache in Redis for fast access
      await this.cacheContent(contentId, {
        advisorId,
        content,
        createdAt,
        metadata
      });

      return contentId;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check content uniqueness with multi-level deduplication
   */
  async checkUniqueness(content, advisorId, fingerprints) {
    const results = {
      isUnique: true,
      exactMatch: null,
      structuralMatches: [],
      semanticMatches: [],
      similarContent: []
    };

    // Level 1: Exact match
    const exactMatch = await this.findExactMatch(advisorId, fingerprints.exact);
    if (exactMatch) {
      results.isUnique = false;
      results.exactMatch = exactMatch;
      return results;
    }

    // Level 2: Structural similarity
    const structuralMatches = await this.findStructuralMatches(
      advisorId,
      fingerprints.structural
    );
    if (structuralMatches.length > 0) {
      results.structuralMatches = structuralMatches;
    }

    // Level 3: Semantic similarity
    const semanticMatches = await this.findSemanticMatches(
      advisorId,
      fingerprints.semantic
    );
    if (semanticMatches.length > 0) {
      results.semanticMatches = semanticMatches;
    }

    // Level 4: Vector similarity search
    if (fingerprints.embedding) {
      const similarContent = await this.findSimilarByEmbedding(
        advisorId,
        fingerprints.embedding,
        0.85
      );
      if (similarContent.length > 0) {
        results.similarContent = similarContent;
      }
    }

    return results;
  }

  /**
   * Find exact content match
   */
  async findExactMatch(advisorId, hashExact) {
    // Check Redis cache first
    const cacheKey = `exact:${advisorId}:${hashExact}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.pgPool.query(`
      SELECT cf.*, ch.content_text, ch.created_at
      FROM content_fingerprints cf
      JOIN content_history ch ON cf.content_id = ch.content_id
      WHERE cf.advisor_id = $1 AND cf.hash_exact = $2
      ORDER BY cf.created_at DESC
      LIMIT 1
    `, [advisorId, hashExact]);

    if (result.rows.length > 0) {
      const match = result.rows[0];
      await this.redis.setex(cacheKey, 3600, JSON.stringify(match));
      return match;
    }

    return null;
  }

  /**
   * Find structurally similar content
   */
  async findStructuralMatches(advisorId, hashStructural) {
    const result = await this.pgPool.query(`
      SELECT cf.*, ch.content_text, ch.created_at,
             cp.engagement_rate
      FROM content_fingerprints cf
      JOIN content_history ch ON cf.content_id = ch.content_id
      LEFT JOIN content_performance cp ON cf.content_id = cp.content_id
      WHERE cf.advisor_id = $1 AND cf.hash_structural = $2
      ORDER BY cf.created_at DESC
      LIMIT 5
    `, [advisorId, hashStructural]);

    return result.rows;
  }

  /**
   * Find semantically similar content
   */
  async findSemanticMatches(advisorId, hashSemantic) {
    const result = await this.pgPool.query(`
      SELECT cf.*, ch.content_text, ch.created_at,
             cp.engagement_rate
      FROM content_fingerprints cf
      JOIN content_history ch ON cf.content_id = ch.content_id
      LEFT JOIN content_performance cp ON cf.content_id = cp.content_id
      WHERE cf.advisor_id = $1 AND cf.hash_semantic = $2
      ORDER BY cf.created_at DESC
      LIMIT 5
    `, [advisorId, hashSemantic]);

    return result.rows;
  }

  /**
   * Find similar content using vector embeddings
   */
  async findSimilarByEmbedding(advisorId, embedding, threshold = 0.85) {
    const result = await this.pgPool.query(`
      SELECT ch.content_id, ch.content_text, ch.created_at,
             1 - (ch.embedding <=> $2::vector) AS similarity,
             cp.engagement_rate
      FROM content_history ch
      LEFT JOIN content_performance cp ON ch.content_id = cp.content_id
      WHERE ch.advisor_id = $1
        AND ch.created_at > NOW() - INTERVAL '90 days'
        AND 1 - (ch.embedding <=> $2::vector) > $3
      ORDER BY similarity DESC
      LIMIT 10
    `, [advisorId, embedding, threshold]);

    return result.rows;
  }

  /**
   * Get content performance analytics
   */
  async getContentPerformance(advisorId, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      limit = 100
    } = options;

    const result = await this.pgPool.query(`
      SELECT 
        ch.content_id,
        ch.content_text,
        ch.topic_tags,
        ch.language,
        ch.created_at,
        cp.sent_count,
        cp.delivered_count,
        cp.read_count,
        cp.engagement_rate,
        cp.avg_read_time,
        cp.sentiment_score
      FROM content_history ch
      JOIN content_performance cp ON ch.content_id = cp.content_id
      WHERE ch.advisor_id = $1
        AND ch.created_at BETWEEN $2 AND $3
      ORDER BY cp.engagement_rate DESC
      LIMIT $4
    `, [advisorId, startDate, endDate, limit]);

    return result.rows;
  }

  /**
   * Update content performance metrics
   */
  async updatePerformance(contentId, metrics) {
    const {
      sent = 0,
      delivered = 0,
      read = 0,
      clicked = 0,
      replied = 0
    } = metrics;

    const engagementRate = sent > 0 ? read / sent : 0;

    await this.pgPool.query(`
      INSERT INTO content_performance (
        content_id, advisor_id, sent_count, delivered_count,
        read_count, click_count, reply_count, engagement_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (content_id) DO UPDATE SET
        sent_count = content_performance.sent_count + $3,
        delivered_count = content_performance.delivered_count + $4,
        read_count = content_performance.read_count + $5,
        click_count = content_performance.click_count + $6,
        reply_count = content_performance.reply_count + $7,
        engagement_rate = (content_performance.read_count + $5) / 
                         NULLIF(content_performance.sent_count + $3, 0),
        updated_at = CURRENT_TIMESTAMP
    `, [contentId, metrics.advisorId, sent, delivered, read, clicked, replied, engagementRate]);

    // Update cache
    await this.redis.del(`perf:${contentId}`);
  }

  /**
   * Archive old content to S3
   */
  async archiveOldContent() {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - this.config.retention.coldData);

    const client = await this.pgPool.connect();
    
    try {
      // Select content to archive
      const result = await client.query(`
        SELECT ch.*, cf.*, cp.*
        FROM content_history ch
        LEFT JOIN content_fingerprints cf ON ch.content_id = cf.content_id
        LEFT JOIN content_performance cp ON ch.content_id = cp.content_id
        WHERE ch.created_at < $1
        LIMIT 1000
      `, [archiveDate]);

      for (const row of result.rows) {
        // Upload to S3
        const key = `archive/${row.advisor_id}/${row.content_id}.json`;
        await this.s3Client.send(new PutObjectCommand({
          Bucket: this.config.s3.bucket,
          Key: key,
          Body: JSON.stringify(row),
          ContentType: 'application/json',
          Metadata: {
            advisorId: row.advisor_id,
            contentId: row.content_id,
            createdAt: row.created_at.toISOString()
          }
        }));

        // Delete from database
        await client.query('DELETE FROM content_history WHERE content_id = $1', [row.content_id]);
      }

      return result.rows.length;

    } finally {
      client.release();
    }
  }

  /**
   * Cache content in Redis
   */
  async cacheContent(contentId, data) {
    const key = `content:${contentId}`;
    await this.redis.setex(key, 3600, JSON.stringify(data));
  }

  /**
   * Get content from cache or database
   */
  async getContent(contentId) {
    // Check cache first
    const cached = await this.redis.get(`content:${contentId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const result = await this.pgPool.query(`
      SELECT ch.*, cp.engagement_rate
      FROM content_history ch
      LEFT JOIN content_performance cp ON ch.content_id = cp.content_id
      WHERE ch.content_id = $1
    `, [contentId]);

    if (result.rows.length > 0) {
      const content = result.rows[0];
      await this.cacheContent(contentId, content);
      return content;
    }

    return null;
  }

  /**
   * Get advisor content statistics
   */
  async getAdvisorStatistics(advisorId) {
    const stats = await this.pgPool.query(`
      SELECT 
        COUNT(DISTINCT ch.content_id) as total_content,
        COUNT(DISTINCT DATE(ch.created_at)) as active_days,
        AVG(cp.engagement_rate) as avg_engagement,
        MAX(cp.engagement_rate) as max_engagement,
        MIN(cp.engagement_rate) as min_engagement,
        ARRAY_AGG(DISTINCT unnest(ch.topic_tags)) as all_topics,
        COUNT(DISTINCT ch.language) as languages_used,
        AVG(LENGTH(ch.content_text)) as avg_content_length
      FROM content_history ch
      LEFT JOIN content_performance cp ON ch.content_id = cp.content_id
      WHERE ch.advisor_id = $1
        AND ch.created_at > NOW() - INTERVAL '90 days'
    `, [advisorId]);

    return stats.rows[0];
  }

  /**
   * Cleanup and maintenance
   */
  async performMaintenance() {
    // Vacuum analyze for query optimization
    await this.pgPool.query('VACUUM ANALYZE content_history');
    await this.pgPool.query('VACUUM ANALYZE content_fingerprints');
    await this.pgPool.query('VACUUM ANALYZE content_performance');

    // Archive old content
    const archivedCount = await this.archiveOldContent();

    // Clear old cache entries
    const cacheKeys = await this.redis.keys('content:*');
    for (const key of cacheKeys) {
      const ttl = await this.redis.ttl(key);
      if (ttl < 0) {
        await this.redis.del(key);
      }
    }

    return {
      archived: archivedCount,
      cacheCleaned: cacheKeys.length
    };
  }

  /**
   * Close connections
   */
  async close() {
    await this.pgPool.end();
    await this.redis.quit();
  }
}

module.exports = ContentHistoryDatabase;