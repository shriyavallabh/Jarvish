/**
 * Real-Time Data Aggregator for Jarvish Research System
 * Manages concurrent data streams from 15-20 sources with intelligent caching
 */

class RealTimeDataAggregator {
  constructor() {
    this.streams = new Map();
    this.cache = new IntelligentCache();
    this.rateLimiter = new AdaptiveRateLimiter();
    this.healthMonitor = new SourceHealthMonitor();
    this.dataValidator = new DataValidationEngine();
  }

  /**
   * WEBSOCKET STREAM MANAGER
   * Handles real-time market data with automatic reconnection
   */
  class WebSocketStreamManager {
    constructor() {
      this.connections = new Map();
      this.reconnectStrategy = new ExponentialBackoff();
      this.messageQueue = new PriorityMessageQueue();
    }

    async connectToExchanges() {
      const exchanges = {
        nse: {
          url: 'wss://stream.nseindia.com/live',
          subscriptions: [
            'NIFTY50', 'BANKNIFTY', 'NIFTYIT', 'NIFTYPHARMA',
            'TOP_GAINERS', 'TOP_LOSERS', 'MOST_ACTIVE'
          ],
          handlers: {
            onTick: (data) => this.processMarketTick(data),
            onDepth: (data) => this.processOrderBook(data),
            onTrade: (data) => this.processTradeData(data)
          },
          reconnect: {
            maxAttempts: 10,
            baseDelay: 1000,
            maxDelay: 30000
          }
        },
        
        bse: {
          url: 'wss://stream.bseindia.com/v2',
          subscriptions: ['SENSEX', 'SENSEX50', 'SMALLCAP', 'MIDCAP'],
          compression: true,
          heartbeat: 30000
        },
        
        currencyFutures: {
          url: 'wss://fx.nseindia.com/stream',
          pairs: ['USDINR', 'EURINR', 'GBPINR', 'JPYINR'],
          depth: 5
        }
      };

      for (const [name, config] of Object.entries(exchanges)) {
        await this.establishConnection(name, config);
      }
    }

    async establishConnection(name, config) {
      const connection = {
        ws: null,
        status: 'connecting',
        reconnectCount: 0,
        lastMessage: null,
        stats: {
          messagesReceived: 0,
          bytesReceived: 0,
          latency: [],
          errors: []
        },
        
        connect: async () => {
          this.ws = new WebSocket(config.url);
          
          this.ws.on('open', () => {
            console.log(`Connected to ${name}`);
            this.status = 'connected';
            this.subscribe(config.subscriptions);
            this.startHeartbeat(config.heartbeat);
          });
          
          this.ws.on('message', (data) => {
            this.processMessage(name, data, config.handlers);
            this.updateStats(data);
          });
          
          this.ws.on('error', (error) => {
            this.handleError(name, error);
          });
          
          this.ws.on('close', () => {
            this.handleDisconnection(name, config);
          });
        },
        
        processMessage: (name, rawData, handlers) => {
          try {
            const data = this.parseMessage(rawData);
            const enriched = this.enrichData(name, data);
            
            // Route to appropriate handler
            if (data.type === 'tick' && handlers.onTick) {
              handlers.onTick(enriched);
            } else if (data.type === 'depth' && handlers.onDepth) {
              handlers.onDepth(enriched);
            } else if (data.type === 'trade' && handlers.onTrade) {
              handlers.onTrade(enriched);
            }
            
            // Store in cache for quick access
            this.cache.store(name, data.symbol, enriched);
            
            // Emit for real-time processors
            this.emit('data', { source: name, data: enriched });
            
          } catch (error) {
            console.error(`Error processing ${name} message:`, error);
            this.stats.errors.push({ time: Date.now(), error });
          }
        }
      };

      this.connections.set(name, connection);
      await connection.connect();
    }
  }

  /**
   * REST API AGGREGATOR
   * Manages polling-based data sources with intelligent scheduling
   */
  class RESTAPIAggregator {
    constructor() {
      this.endpoints = new Map();
      this.scheduler = new IntelligentScheduler();
      this.batchProcessor = new BatchRequestProcessor();
    }

    configureNewsAPIs() {
      return {
        economicTimes: {
          base: 'https://api.economictimes.com/v2',
          endpoints: {
            breaking: '/news/breaking',
            markets: '/news/markets',
            economy: '/news/economy',
            corporate: '/news/corporate'
          },
          rateLimit: { requests: 100, window: 60000 },
          priority: 'high',
          parser: this.parseETNews.bind(this)
        },
        
        mint: {
          base: 'https://api.livemint.com/v1',
          endpoints: {
            latest: '/stories/latest',
            markets: '/stories/markets',
            opinion: '/stories/opinion'
          },
          rateLimit: { requests: 60, window: 60000 },
          authentication: 'bearer-token'
        },
        
        reuters: {
          base: 'https://api.reuters.com/india',
          endpoints: {
            topNews: '/news/top',
            businessNews: '/news/business',
            marketCommentary: '/analysis/markets'
          },
          rateLimit: { requests: 50, window: 60000 },
          caching: { ttl: 300000, strategy: 'lru' }
        }
      };
    }

    async fetchWithRetry(url, options = {}, retries = 3) {
      const attempt = async (attemptNum) => {
        try {
          // Check rate limits
          await this.rateLimiter.acquire(url);
          
          // Add timing
          const startTime = Date.now();
          
          const response = await fetch(url, {
            ...options,
            timeout: 10000,
            headers: {
              ...options.headers,
              'User-Agent': 'Jarvish-Research-Bot/1.0'
            }
          });
          
          const duration = Date.now() - startTime;
          this.logPerformance(url, duration, response.status);
          
          if (!response.ok && attemptNum < retries) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          return await response.json();
          
        } catch (error) {
          if (attemptNum < retries) {
            const delay = Math.pow(2, attemptNum) * 1000;
            await this.delay(delay);
            return attempt(attemptNum + 1);
          }
          throw error;
        }
      };
      
      return attempt(0);
    }

    async batchFetch(requests) {
      // Group by domain for connection pooling
      const grouped = this.groupByDomain(requests);
      const results = [];
      
      for (const [domain, domainRequests] of grouped) {
        // Process in chunks to respect rate limits
        const chunks = this.chunkRequests(domainRequests, 5);
        
        for (const chunk of chunks) {
          const promises = chunk.map(req => 
            this.fetchWithRetry(req.url, req.options)
              .then(data => ({ success: true, data, request: req }))
              .catch(error => ({ success: false, error, request: req }))
          );
          
          const chunkResults = await Promise.allSettled(promises);
          results.push(...chunkResults);
          
          // Small delay between chunks
          await this.delay(100);
        }
      }
      
      return this.processResults(results);
    }
  }

  /**
   * INTELLIGENT CACHE SYSTEM
   * Reduces API calls and improves response time
   */
  class IntelligentCache {
    constructor() {
      this.stores = {
        hot: new Map(),      // Frequently accessed, in-memory
        warm: new Map(),     // Recent data, compressed
        cold: null          // Historical, disk-based
      };
      this.accessPatterns = new AccessPatternAnalyzer();
      this.compressionEngine = new DataCompressor();
    }

    async get(key, options = {}) {
      const cacheKey = this.generateKey(key, options);
      
      // Check hot cache first
      if (this.stores.hot.has(cacheKey)) {
        this.accessPatterns.recordHit('hot', cacheKey);
        return this.stores.hot.get(cacheKey);
      }
      
      // Check warm cache
      if (this.stores.warm.has(cacheKey)) {
        const compressed = this.stores.warm.get(cacheKey);
        const data = await this.compressionEngine.decompress(compressed);
        
        // Promote to hot cache if frequently accessed
        if (this.accessPatterns.shouldPromote(cacheKey)) {
          this.stores.hot.set(cacheKey, data);
        }
        
        this.accessPatterns.recordHit('warm', cacheKey);
        return data;
      }
      
      // Check cold storage
      if (this.stores.cold) {
        const data = await this.stores.cold.get(cacheKey);
        if (data) {
          this.accessPatterns.recordHit('cold', cacheKey);
          return data;
        }
      }
      
      this.accessPatterns.recordMiss(cacheKey);
      return null;
    }

    async set(key, value, options = {}) {
      const cacheKey = this.generateKey(key, options);
      const ttl = options.ttl || this.calculateTTL(key, value);
      
      const entry = {
        data: value,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccess: Date.now()
      };
      
      // Determine cache tier based on data characteristics
      if (this.isHotData(key, value)) {
        this.stores.hot.set(cacheKey, entry);
        this.scheduleEviction('hot', cacheKey, ttl);
      } else {
        const compressed = await this.compressionEngine.compress(entry);
        this.stores.warm.set(cacheKey, compressed);
        this.scheduleEviction('warm', cacheKey, ttl);
      }
      
      // Manage cache size
      this.evictIfNeeded();
    }

    calculateTTL(key, value) {
      // Dynamic TTL based on data type and volatility
      const ttlMatrix = {
        'market-tick': 1000,        // 1 second
        'market-depth': 5000,       // 5 seconds
        'news-breaking': 60000,     // 1 minute
        'news-regular': 300000,     // 5 minutes
        'regulatory': 3600000,      // 1 hour
        'economic-data': 86400000,  // 1 day
        'historical': 604800000     // 1 week
      };
      
      const dataType = this.identifyDataType(key);
      return ttlMatrix[dataType] || 300000; // Default 5 minutes
    }

    evictIfNeeded() {
      const maxHotSize = 1000;
      const maxWarmSize = 10000;
      
      // LRU eviction for hot cache
      if (this.stores.hot.size > maxHotSize) {
        const sorted = Array.from(this.stores.hot.entries())
          .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        
        const toEvict = sorted.slice(0, sorted.length - maxHotSize);
        for (const [key, value] of toEvict) {
          // Demote to warm cache
          this.stores.warm.set(key, value);
          this.stores.hot.delete(key);
        }
      }
      
      // FIFO eviction for warm cache
      if (this.stores.warm.size > maxWarmSize) {
        const toRemove = this.stores.warm.size - maxWarmSize;
        const keys = Array.from(this.stores.warm.keys()).slice(0, toRemove);
        keys.forEach(key => this.stores.warm.delete(key));
      }
    }
  }

  /**
   * 3:30 PM MARKET CLOSE HANDLER
   * Special processing for market closing time
   */
  class MarketCloseProcessor {
    constructor() {
      this.scheduler = new CronScheduler();
      this.pipeline = new DataPipeline();
      this.alerts = new AlertSystem();
    }

    initialize() {
      // Schedule daily market close processing
      this.scheduler.schedule('30 15 * * 1-5', () => {
        this.processMarketClose();
      });
      
      // Pre-close preparation (3:25 PM)
      this.scheduler.schedule('25 15 * * 1-5', () => {
        this.prepareForClose();
      });
      
      // Post-close analysis (3:35 PM)
      this.scheduler.schedule('35 15 * * 1-5', () => {
        this.postCloseAnalysis();
      });
    }

    async prepareForClose() {
      // Ensure all connections are stable
      await this.verifyDataStreams();
      
      // Pre-allocate resources
      await this.allocateProcessingPower();
      
      // Clear caches for fresh data
      await this.cache.clearVolatile();
      
      // Alert team
      await this.alerts.notify('market-close-preparation', {
        time: '5 minutes to close',
        status: 'systems ready'
      });
    }

    async processMarketClose() {
      const startTime = Date.now();
      
      const tasks = [
        // Parallel data capture
        this.captureClosingPrices(),
        this.captureVolumeData(),
        this.captureOrderBookSnapshot(),
        this.captureSectorPerformance(),
        this.captureDerivativePositions(),
        
        // News and sentiment
        this.fetchClosingNews(),
        this.analyzeSocialSentiment(),
        
        // Technical analysis
        this.calculateTechnicalIndicators(),
        this.identifyPatterns(),
        this.generateSignals()
      ];
      
      const results = await Promise.allSettled(tasks);
      
      // Aggregate results
      const marketData = this.aggregateResults(results);
      
      // Generate insights
      const insights = await this.generateInsights(marketData);
      
      // Create content
      const content = await this.createMarketWrap(insights);
      
      // Distribute to advisors
      await this.distributeContent(content);
      
      const processingTime = Date.now() - startTime;
      console.log(`Market close processed in ${processingTime}ms`);
      
      return {
        success: true,
        processingTime,
        insightsGenerated: insights.length,
        advisorsNotified: content.recipients.length
      };
    }

    async captureClosingPrices() {
      const indices = ['NIFTY', 'SENSEX', 'BANKNIFTY'];
      const prices = {};
      
      for (const index of indices) {
        prices[index] = {
          close: await this.getIndexClose(index),
          change: await this.getIndexChange(index),
          percentChange: await this.getIndexPercentChange(index),
          volume: await this.getIndexVolume(index),
          advanceDecline: await this.getAdvanceDecline(index)
        };
      }
      
      return prices;
    }

    async generateInsights(data) {
      const insights = [];
      
      // Market overview
      insights.push({
        type: 'overview',
        title: 'Market Closes Mixed',
        content: this.generateOverview(data),
        priority: 'high'
      });
      
      // Top movers
      if (data.topGainers.length > 0) {
        insights.push({
          type: 'gainers',
          title: 'Top Gainers',
          stocks: data.topGainers.slice(0, 5),
          analysis: this.analyzeGainers(data.topGainers)
        });
      }
      
      // Sector performance
      insights.push({
        type: 'sectors',
        title: 'Sector Roundup',
        performance: data.sectorPerformance,
        recommendation: this.recommendSectors(data.sectorPerformance)
      });
      
      // Technical signals
      if (data.signals.length > 0) {
        insights.push({
          type: 'technical',
          title: 'Technical Signals',
          signals: data.signals,
          interpretation: this.interpretSignals(data.signals)
        });
      }
      
      return insights;
    }
  }
}

// Export the aggregator
module.exports = {
  RealTimeDataAggregator,
  WebSocketStreamManager: RealTimeDataAggregator.WebSocketStreamManager,
  RESTAPIAggregator: RealTimeDataAggregator.RESTAPIAggregator,
  IntelligentCache: RealTimeDataAggregator.IntelligentCache,
  MarketCloseProcessor: RealTimeDataAggregator.MarketCloseProcessor
};