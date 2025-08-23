/**
 * JARVISH Database Query Optimizer
 * Advanced connection pooling, query optimization, and performance monitoring
 * Target: <100ms P95 for dashboard queries, <500ms for analytics
 */

import { Pool, PoolClient } from 'pg';
import { trackDatabaseQuery, metrics } from '../monitoring/metrics-collector';
import { cacheManager, CacheStrategies, CacheKeys } from './cache-manager';

interface QueryConfig {
  text: string;
  values?: any[];
  name?: string; // For prepared statements
  cache?: {
    key: string;
    ttl: number;
    tags?: string[];
  };
}

interface ConnectionPoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number; // Maximum connections
  min: number; // Minimum connections
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  maxUses: number; // Max uses per connection before cycling
}

interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  averageLatency: number;
  cacheHitRate: number;
  activeConnections: number;
  idleConnections: number;
}

export class QueryOptimizer {
  private primaryPool: Pool;
  private readReplicaPool?: Pool;
  private queryStats = {
    totalQueries: 0,
    slowQueries: 0,
    totalLatency: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
  private preparedStatements = new Map<string, string>();
  private slowQueryThreshold = 1000; // 1 second

  constructor(
    primaryConfig: ConnectionPoolConfig,
    readReplicaConfig?: ConnectionPoolConfig
  ) {
    this.primaryPool = this.createPool(primaryConfig, 'primary');
    
    if (readReplicaConfig) {
      this.readReplicaPool = this.createPool(readReplicaConfig, 'replica');
    }

    this.setupMonitoring();
    this.initializePreparedStatements();
  }

  private createPool(config: ConnectionPoolConfig, type: string): Pool {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max,
      min: config.min,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      maxUses: config.maxUses,
      application_name: `jarvish_${type}`,
    });

    // Pool event listeners
    pool.on('connect', (client) => {
      console.log(`Database ${type} pool connected`);
      this.updatePoolMetrics(pool, type);
    });

    pool.on('error', (err) => {
      console.error(`Database ${type} pool error:`, err);
      metrics.apiErrors.inc({ 
        method: 'database', 
        endpoint: type, 
        error_type: 'connection_error' 
      });
    });

    pool.on('acquire', (client) => {
      this.updatePoolMetrics(pool, type);
    });

    pool.on('release', (client) => {
      this.updatePoolMetrics(pool, type);
    });

    return pool;
  }

  private setupMonitoring(): void {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.updatePoolMetrics(this.primaryPool, 'primary');
      if (this.readReplicaPool) {
        this.updatePoolMetrics(this.readReplicaPool, 'replica');
      }
      this.updateQueryMetrics();
    }, 30000);
  }

  private initializePreparedStatements(): void {
    // Prepare frequently used queries for better performance
    this.preparedStatements.set('get_advisor_profile', `
      SELECT id, name, email, euin_number, phone_number, 
             onboarding_completed, subscription_tier, created_at
      FROM advisors 
      WHERE id = $1 AND deleted_at IS NULL
    `);

    this.preparedStatements.set('get_advisor_content', `
      SELECT id, content_text, content_type, status, 
             created_at, scheduled_for, compliance_status
      FROM advisor_content 
      WHERE advisor_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `);

    this.preparedStatements.set('get_whatsapp_delivery_status', `
      SELECT id, message_id, status, delivered_at, error_message
      FROM whatsapp_deliveries 
      WHERE advisor_id = $1 
      AND created_at >= $2
      ORDER BY created_at DESC
    `);

    this.preparedStatements.set('get_analytics_summary', `
      SELECT 
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        AVG(CASE WHEN delivered_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (delivered_at - created_at)) END) as avg_delivery_time
      FROM whatsapp_deliveries 
      WHERE advisor_id = $1 
      AND created_at >= $2 AND created_at <= $3
    `);

    this.preparedStatements.set('update_content_status', `
      UPDATE advisor_content 
      SET status = $2, updated_at = NOW()
      WHERE id = $1 
      RETURNING id, status, updated_at
    `);
  }

  /**
   * Execute optimized query with automatic read/write routing
   */
  async query<T = any>(config: QueryConfig): Promise<{ rows: T[]; rowCount: number }> {
    const startTime = Date.now();
    const isReadOperation = this.isReadOperation(config.text);
    
    try {
      // Check cache first if cache config provided
      if (config.cache) {
        const cached = await cacheManager.get<T[]>(config.cache.key);
        if (cached) {
          this.queryStats.cacheHits++;
          return { rows: cached, rowCount: cached.length };
        }
        this.queryStats.cacheMisses++;
      }

      // Route to appropriate pool
      const pool = isReadOperation && this.readReplicaPool 
        ? this.readReplicaPool 
        : this.primaryPool;

      // Execute query
      const result = await pool.query(config.text, config.values);
      const latency = Date.now() - startTime;

      // Update statistics
      this.updateQueryStats(config.text, latency, true);

      // Cache result if cache config provided
      if (config.cache && result.rows.length > 0) {
        if (config.cache.tags) {
          await cacheManager.setWithTags(
            config.cache.key,
            result.rows,
            config.cache.tags,
            config.cache.ttl
          );
        } else {
          await cacheManager.set(config.cache.key, result.rows, config.cache.ttl);
        }
      }

      return result;

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateQueryStats(config.text, latency, false);
      
      console.error('Query execution error:', {
        query: config.text.substring(0, 100) + '...',
        error: error.message,
        latency,
      });

      throw error;
    }
  }

  /**
   * Execute prepared statement for better performance
   */
  async queryPrepared<T = any>(
    statementName: string, 
    values: any[] = [], 
    cacheConfig?: { key: string; ttl: number; tags?: string[] }
  ): Promise<{ rows: T[]; rowCount: number }> {
    const query = this.preparedStatements.get(statementName);
    if (!query) {
      throw new Error(`Prepared statement '${statementName}' not found`);
    }

    return this.query<T>({
      text: query,
      values,
      name: statementName,
      cache: cacheConfig,
    });
  }

  /**
   * Execute transaction with automatic retry
   */
  async transaction<T>(
    operations: (client: PoolClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    const client = await this.primaryPool.connect();
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await client.query('BEGIN');
        const result = await operations(client);
        await client.query('COMMIT');
        return result;

      } catch (error) {
        await client.query('ROLLBACK');
        
        // Retry on specific errors (deadlock, serialization failure)
        const isRetryable = error.code === '40001' || error.code === '40P01';
        if (isRetryable && retries < maxRetries - 1) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100 * retries));
          continue;
        }
        
        throw error;
      } finally {
        if (retries === maxRetries - 1 || retries === 0) {
          client.release();
        }
      }
    }
  }

  /**
   * Optimized advisor dashboard queries
   */
  async getAdvisorDashboard(advisorId: string) {
    const cacheKey = CacheKeys.advisorProfile(advisorId);
    
    return this.query({
      text: `
        WITH recent_content AS (
          SELECT 
            COUNT(*) as total_content,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_content,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as weekly_content
          FROM advisor_content 
          WHERE advisor_id = $1
        ),
        delivery_stats AS (
          SELECT 
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
            AVG(CASE WHEN delivered_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (delivered_at - created_at)) END) as avg_delivery_time
          FROM whatsapp_deliveries 
          WHERE advisor_id = $1 
          AND created_at >= NOW() - INTERVAL '30 days'
        )
        SELECT 
          a.*,
          rc.total_content,
          rc.approved_content,
          rc.weekly_content,
          ds.delivered,
          ds.failed,
          ds.avg_delivery_time,
          ROUND((ds.delivered::float / NULLIF(ds.delivered + ds.failed, 0)) * 100, 2) as delivery_rate
        FROM advisors a
        CROSS JOIN recent_content rc
        CROSS JOIN delivery_stats ds
        WHERE a.id = $1
      `,
      values: [advisorId],
      cache: {
        key: cacheKey,
        ttl: CacheStrategies.API_RESPONSE,
        tags: [`advisor:${advisorId}`, 'dashboard']
      }
    });
  }

  /**
   * High-performance content listing with pagination
   */
  async getAdvisorContent(
    advisorId: string, 
    page: number = 1, 
    limit: number = 20,
    filters?: { status?: string; contentType?: string }
  ) {
    const offset = (page - 1) * limit;
    const cacheKey = `content:${advisorId}:${page}:${limit}:${JSON.stringify(filters)}`;

    let whereClause = 'WHERE advisor_id = $1 AND deleted_at IS NULL';
    const values: any[] = [advisorId];
    let paramIndex = 2;

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters?.contentType) {
      whereClause += ` AND content_type = $${paramIndex}`;
      values.push(filters.contentType);
      paramIndex++;
    }

    values.push(limit, offset);

    return this.query({
      text: `
        SELECT 
          id, content_text, content_type, status, 
          created_at, updated_at, scheduled_for, 
          compliance_status, rejection_reason,
          (SELECT COUNT(*) FROM advisor_content ac2 
           ${whereClause.replace('WHERE', 'WHERE')}) as total_count
        FROM advisor_content 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      values,
      cache: {
        key: cacheKey,
        ttl: CacheStrategies.API_RESPONSE,
        tags: [`advisor:${advisorId}`, 'content']
      }
    });
  }

  /**
   * Real-time analytics query optimization
   */
  async getAnalytics(
    advisorId: string, 
    startDate: Date, 
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ) {
    const cacheKey = CacheKeys.analyticsData(
      advisorId, 
      `${granularity}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`
    );

    const dateFormat = {
      hour: 'YYYY-MM-DD HH24:00:00',
      day: 'YYYY-MM-DD',
      week: 'YYYY-WW'
    }[granularity];

    return this.query({
      text: `
        SELECT 
          TO_CHAR(date_trunc('${granularity}', created_at), '${dateFormat}') as period,
          COUNT(*) as total_messages,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          ROUND(AVG(CASE WHEN delivered_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (delivered_at - created_at)) END), 2) as avg_delivery_time,
          ROUND(
            (COUNT(CASE WHEN status = 'delivered' THEN 1 END)::float / COUNT(*)) * 100, 
            2
          ) as delivery_rate
        FROM whatsapp_deliveries 
        WHERE advisor_id = $1 
        AND created_at >= $2 
        AND created_at <= $3
        GROUP BY date_trunc('${granularity}', created_at)
        ORDER BY period DESC
      `,
      values: [advisorId, startDate, endDate],
      cache: {
        key: cacheKey,
        ttl: CacheStrategies.ANALYTICS,
        tags: [`advisor:${advisorId}`, 'analytics']
      }
    });
  }

  /**
   * Bulk operations with optimized performance
   */
  async bulkInsert(
    table: string, 
    columns: string[], 
    values: any[][],
    onConflict?: string
  ): Promise<number> {
    const startTime = Date.now();

    try {
      const placeholders = values.map((row, rowIndex) => {
        const rowPlaceholders = columns.map((_, colIndex) => 
          `$${rowIndex * columns.length + colIndex + 1}`
        ).join(', ');
        return `(${rowPlaceholders})`;
      }).join(', ');

      const flatValues = values.flat();
      const conflictClause = onConflict ? `ON CONFLICT ${onConflict}` : '';

      const query = `
        INSERT INTO ${table} (${columns.join(', ')}) 
        VALUES ${placeholders} 
        ${conflictClause}
        RETURNING id
      `;

      const result = await this.primaryPool.query(query, flatValues);
      
      this.updateQueryStats(query, Date.now() - startTime, true);
      return result.rowCount;

    } catch (error) {
      this.updateQueryStats(`bulk_insert_${table}`, Date.now() - startTime, false);
      throw error;
    }
  }

  /**
   * Query performance analysis
   */
  async analyzeQuery(query: string): Promise<any> {
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
    const result = await this.primaryPool.query(explainQuery);
    return result.rows[0]['QUERY PLAN'][0];
  }

  /**
   * Get query statistics
   */
  getQueryStats(): QueryStats {
    const averageLatency = this.queryStats.totalQueries > 0 
      ? this.queryStats.totalLatency / this.queryStats.totalQueries 
      : 0;

    const cacheHitRate = (this.queryStats.cacheHits + this.queryStats.cacheMisses) > 0
      ? (this.queryStats.cacheHits / (this.queryStats.cacheHits + this.queryStats.cacheMisses)) * 100
      : 0;

    return {
      totalQueries: this.queryStats.totalQueries,
      slowQueries: this.queryStats.slowQueries,
      averageLatency: Math.round(averageLatency),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      activeConnections: this.primaryPool.totalCount - this.primaryPool.idleCount,
      idleConnections: this.primaryPool.idleCount,
    };
  }

  /**
   * Health check for database connections
   */
  async healthCheck(): Promise<{ primary: boolean; replica?: boolean }> {
    const checks = {
      primary: false,
      replica: undefined as boolean | undefined,
    };

    try {
      await this.primaryPool.query('SELECT 1');
      checks.primary = true;
    } catch (error) {
      console.error('Primary database health check failed:', error);
    }

    if (this.readReplicaPool) {
      try {
        await this.readReplicaPool.query('SELECT 1');
        checks.replica = true;
      } catch (error) {
        console.error('Read replica health check failed:', error);
        checks.replica = false;
      }
    }

    return checks;
  }

  private isReadOperation(query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery.startsWith('select') || 
           normalizedQuery.startsWith('with');
  }

  private updateQueryStats(query: string, latency: number, success: boolean): void {
    this.queryStats.totalQueries++;
    this.queryStats.totalLatency += latency;

    if (latency > this.slowQueryThreshold) {
      this.queryStats.slowQueries++;
      console.warn(`Slow query detected (${latency}ms):`, {
        query: query.substring(0, 100) + '...',
        latency,
      });
    }

    const operation = query.trim().toLowerCase().split(' ')[0];
    const table = this.extractTableName(query);

    trackDatabaseQuery(operation, table, latency, success);
  }

  private updatePoolMetrics(pool: Pool, type: string): void {
    metrics.dbConnectionPool.set(
      { state: 'active' },
      pool.totalCount - pool.idleCount
    );
    metrics.dbConnectionPool.set(
      { state: 'idle' },
      pool.idleCount
    );
    metrics.dbConnectionPool.set(
      { state: 'waiting' },
      pool.waitingCount
    );
  }

  private updateQueryMetrics(): void {
    const stats = this.getQueryStats();
    metrics.systemHealth.set({ component: 'database' }, 
      stats.slowQueries / stats.totalQueries > 0.05 ? 75 : 95
    );
  }

  private extractTableName(query: string): string {
    const match = query.toLowerCase().match(/(?:from|into|update|delete from)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    return match ? match[1] : 'unknown';
  }

  async close(): Promise<void> {
    await this.primaryPool.end();
    if (this.readReplicaPool) {
      await this.readReplicaPool.end();
    }
  }
}

// Factory function for creating optimized query instance
export const createQueryOptimizer = () => {
  const primaryConfig: ConnectionPoolConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'jarvish',
    user: process.env.DATABASE_USER || 'jarvish',
    password: process.env.DATABASE_PASSWORD || '',
    max: 20, // Maximum connections
    min: 5,  // Minimum connections
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 5000, // 5 seconds
    maxUses: 7500, // Cycle connections after 7500 uses
  };

  const readReplicaConfig = process.env.READ_REPLICA_HOST ? {
    ...primaryConfig,
    host: process.env.READ_REPLICA_HOST,
    port: parseInt(process.env.READ_REPLICA_PORT || '5432'),
    max: 10, // Fewer connections for read replica
    min: 2,
  } : undefined;

  return new QueryOptimizer(primaryConfig, readReplicaConfig);
};

// Global instance
export const queryOptimizer = createQueryOptimizer();