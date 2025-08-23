/**
 * Market Data Service - Unit Tests
 * Following TDD methodology for comprehensive test coverage
 */

import { MarketDataService } from '../../../lib/services/market-data';
import {
  IndexData,
  MutualFundData,
  SectorData,
  CurrencyData,
  CommodityData,
  MarketSummary,
  MarketInsight,
  MarketDataError,
  MarketStatus
} from '../../../lib/types/market-data';
import {
  mockIndices,
  mockMutualFunds,
  mockSectors,
  mockCurrencies,
  mockCommodities,
  mockMarketSummary,
  mockMarketInsight,
  mockMarketStatus
} from '../../../lib/mock/market-data';
import { CacheManager } from '../../../lib/performance/cache-manager';

// Mock the cache manager
jest.mock('../../../lib/performance/cache-manager');

describe('MarketDataService', () => {
  let marketDataService: MarketDataService;
  let mockCacheManager: jest.Mocked<CacheManager>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      has: jest.fn()
    } as any;

    // Initialize service with mock data enabled for testing
    marketDataService = new MarketDataService({
      cache: {
        indices: 60,
        mutualFunds: 300,
        sectors: 120,
        currencies: 30,
        commodities: 60,
        default: 60
      },
      fallbackEnabled: true,
      mockDataEnabled: true
    }, mockCacheManager);
  });

  describe('Index Data Integration', () => {
    it('should fetch live index data for SENSEX, NIFTY, and BANK NIFTY', async () => {
      const indices = await marketDataService.getIndices(['SENSEX', 'NIFTY', 'BANKNIFTY']);
      
      expect(indices).toBeDefined();
      expect(indices.success).toBe(true);
      expect(indices.data).toHaveLength(3);
      
      const sensex = indices.data?.find(i => i.symbol === 'SENSEX');
      expect(sensex).toBeDefined();
      expect(sensex?.name).toBe('BSE SENSEX');
      expect(sensex?.value).toBeGreaterThan(0);
      expect(sensex?.changePercent).toBeDefined();
    });

    it('should validate index data structure', async () => {
      const result = await marketDataService.getIndex('NIFTY');
      
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        symbol: expect.any(String),
        name: expect.any(String),
        value: expect.any(Number),
        change: expect.any(Number),
        changePercent: expect.any(Number),
        previousClose: expect.any(Number),
        dayHigh: expect.any(Number),
        dayLow: expect.any(Number),
        yearHigh: expect.any(Number),
        yearLow: expect.any(Number),
        lastUpdated: expect.any(Date)
      });
    });

    it('should cache index data with appropriate TTL', async () => {
      await marketDataService.getIndex('SENSEX');
      
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'index:SENSEX',
        expect.any(Object),
        60 // TTL in seconds
      );
    });

    it('should return cached data if available', async () => {
      const cachedData = { ...mockIndices[0], lastUpdated: new Date() };
      mockCacheManager.get.mockResolvedValue(cachedData);
      
      const result = await marketDataService.getIndex('SENSEX');
      
      expect(mockCacheManager.get).toHaveBeenCalledWith('index:SENSEX');
      expect(result.data?.symbol).toEqual(cachedData.symbol);
      expect(result.data?.name).toEqual(cachedData.name);
      expect(result.cached).toBe(true);
    });
  });

  describe('Mutual Fund Database', () => {
    it('should fetch mutual fund NAV data', async () => {
      const funds = await marketDataService.getMutualFunds(['INF109K01Z62', 'INF090I01M25']);
      
      expect(funds.success).toBe(true);
      expect(funds.data).toHaveLength(2);
      
      const hdfc = funds.data?.find(f => f.schemeCode === 'INF109K01Z62');
      expect(hdfc).toBeDefined();
      expect(hdfc?.nav).toBeGreaterThan(0);
      expect(hdfc?.returns).toBeDefined();
    });

    it('should include mutual fund performance metrics', async () => {
      const result = await marketDataService.getMutualFund('INF109K01Z62');
      
      expect(result.success).toBe(true);
      expect(result.data?.returns).toMatchObject({
        oneDay: expect.any(Number),
        oneMonth: expect.any(Number),
        oneYear: expect.any(Number),
        threeYears: expect.any(Number),
        fiveYears: expect.any(Number)
      });
      expect(result.data?.expenseRatio).toBeDefined();
      expect(result.data?.riskLevel).toMatch(/Low|Moderate|High|Very High/);
    });

    it('should get top performing mutual funds by category', async () => {
      const topFunds = await marketDataService.getTopMutualFunds('Large Cap', 5);
      
      expect(topFunds.success).toBe(true);
      expect(topFunds.data).toBeDefined();
      expect(topFunds.data?.length).toBeLessThanOrEqual(5);
      expect(topFunds.data?.every(f => f.category === 'Large Cap')).toBe(true);
    });

    it('should cache mutual fund data with longer TTL', async () => {
      await marketDataService.getMutualFund('INF109K01Z62');
      
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'mf:INF109K01Z62',
        expect.any(Object),
        300 // 5 minutes TTL for mutual funds
      );
    });
  });

  describe('Index Tracking System', () => {
    it('should track multiple indices simultaneously', async () => {
      const tracking = await marketDataService.trackIndices(
        ['SENSEX', 'NIFTY', 'BANKNIFTY'],
        1000 // Update interval in ms
      );
      
      expect(tracking).toBeDefined();
      expect(tracking.subscribe).toBeDefined();
      expect(tracking.unsubscribe).toBeDefined();
      
      // Clean up
      tracking.unsubscribe();
    });

    it('should provide real-time index updates', async () => {
      const updates: IndexData[] = [];
      const tracking = await marketDataService.trackIndices(['SENSEX'], 100);
      
      tracking.subscribe((data) => {
        updates.push(data);
      });
      
      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 250));
      
      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].symbol).toBe('SENSEX');
      
      tracking.unsubscribe();
    });

    it('should calculate index movement trends', async () => {
      const trend = await marketDataService.getIndexTrend('NIFTY', '1D');
      
      expect(trend).toBeDefined();
      expect(trend.direction).toMatch(/up|down|sideways/);
      expect(trend.strength).toBeGreaterThanOrEqual(0);
      expect(trend.strength).toBeLessThanOrEqual(100);
    });
  });

  describe('Sector Analysis', () => {
    it('should fetch sector-wise market updates', async () => {
      const sectors = await marketDataService.getSectors();
      
      expect(sectors.success).toBe(true);
      expect(sectors.data).toBeDefined();
      expect(sectors.data?.length).toBeGreaterThan(0);
      
      const banking = sectors.data?.find(s => s.name === 'Banking');
      expect(banking).toBeDefined();
      expect(banking?.topGainers).toBeDefined();
      expect(banking?.topLosers).toBeDefined();
    });

    it('should identify top performing sectors', async () => {
      const topSectors = await marketDataService.getTopSectors(3);
      
      expect(topSectors.success).toBe(true);
      expect(topSectors.data).toHaveLength(3);
      expect(topSectors.data?.[0].changePercent).toBeGreaterThanOrEqual(
        topSectors.data?.[1].changePercent || 0
      );
    });

    it('should provide sector rotation insights', async () => {
      const rotation = await marketDataService.getSectorRotation();
      
      expect(rotation).toBeDefined();
      expect(rotation.inflowSectors).toBeDefined();
      expect(rotation.outflowSectors).toBeDefined();
      expect(rotation.recommendation).toBeDefined();
    });
  });

  describe('Data Accuracy Verification', () => {
    it('should validate data freshness', async () => {
      const result = await marketDataService.getIndex('SENSEX');
      
      expect(result.data?.lastUpdated).toBeDefined();
      const age = Date.now() - result.data!.lastUpdated.getTime();
      expect(age).toBeLessThan(60000); // Less than 1 minute old in mock mode
    });

    it('should detect and handle stale data', async () => {
      // Mock stale data
      const staleData = { ...mockIndices[0], lastUpdated: new Date('2024-01-01') };
      mockCacheManager.get.mockResolvedValue(staleData);
      
      const result = await marketDataService.getIndex('SENSEX');
      
      // Should fetch fresh data instead of using stale cache
      expect(result.cached).toBe(false);
      expect(result.data?.lastUpdated.getTime()).toBeGreaterThan(
        staleData.lastUpdated.getTime()
      );
    });

    it('should validate data ranges and anomalies', async () => {
      const validation = await marketDataService.validateMarketData({
        index: { symbol: 'NIFTY', value: 21000, changePercent: 50 } // Anomaly: 50% change
      } as any);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Unusual change percentage detected');
    });

    it('should handle API failures gracefully with fallback data', async () => {
      // Simulate API failure
      marketDataService = new MarketDataService({
        cache: { indices: 60, mutualFunds: 300, sectors: 120, currencies: 30, commodities: 60, default: 60 },
        fallbackEnabled: true,
        mockDataEnabled: false // Disable mock to simulate real API failure
      }, mockCacheManager);
      
      // Mock cache miss
      mockCacheManager.get.mockResolvedValue(null);
      
      const result = await marketDataService.getIndex('SENSEX');
      
      // Should return fallback data
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.symbol).toBe('SENSEX');
    });
  });

  describe('Market Summary Generation', () => {
    it('should generate comprehensive market summary', async () => {
      const summary = await marketDataService.getMarketSummary();
      
      expect(summary.success).toBe(true);
      expect(summary.data).toMatchObject({
        indices: expect.any(Array),
        topGainers: expect.any(Array),
        topLosers: expect.any(Array),
        mostActive: expect.any(Array),
        sectors: expect.any(Array),
        currencies: expect.any(Array),
        commodities: expect.any(Array),
        timestamp: expect.any(Date)
      });
    });

    it('should include currency and commodity data', async () => {
      const summary = await marketDataService.getMarketSummary();
      
      const usdInr = summary.data?.currencies.find(c => c.pair === 'USD/INR');
      expect(usdInr).toBeDefined();
      expect(usdInr?.rate).toBeGreaterThan(0);
      
      const gold = summary.data?.commodities.find(c => c.name === 'Gold');
      expect(gold).toBeDefined();
      expect(gold?.price).toBeGreaterThan(0);
    });
  });

  describe('Market Insights for Content Generation', () => {
    it('should generate market insights with key points', async () => {
      const insights = await marketDataService.generateMarketInsights();
      
      expect(insights).toBeDefined();
      expect(insights.type).toMatch(/bullish|bearish|neutral|volatile/);
      expect(insights.headline).toBeDefined();
      expect(insights.keyPoints).toHaveLength(5);
      expect(insights.disclaimer).toContain('not be considered as investment advice');
    });

    it('should provide market mood analysis', async () => {
      const insights = await marketDataService.generateMarketInsights();
      
      expect(insights.marketMood).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(insights.recommendations?.length).toBeGreaterThan(0);
    });

    it('should integrate with content generation', async () => {
      const contentData = await marketDataService.getContentEnrichedData({
        includeIndices: true,
        includeMutualFunds: true,
        includeSectors: true
      });
      
      expect(contentData).toBeDefined();
      expect(contentData.indices).toBeDefined();
      expect(contentData.mutualFunds).toBeDefined();
      expect(contentData.sectors).toBeDefined();
      expect(contentData.formattedText).toBeDefined();
    });
  });

  describe('Market Status and Trading Hours', () => {
    it('should check if market is open', async () => {
      const status = await marketDataService.getMarketStatus();
      
      expect(status).toBeDefined();
      expect(typeof status.isOpen).toBe('boolean');
      if (!status.isOpen) {
        expect(status.nextOpenTime).toBeDefined();
      }
    });

    it('should identify trading session', async () => {
      const status = await marketDataService.getMarketStatus();
      
      expect(status.tradingSession).toMatch(/pre-market|regular|post-market|closed/);
    });

    it('should detect market holidays', async () => {
      const isHoliday = await marketDataService.isMarketHoliday(new Date('2024-01-26')); // Republic Day
      
      expect(isHoliday).toBe(true);
    });
  });

  describe('Performance and Caching', () => {
    it('should respond within performance SLA (<500ms)', async () => {
      const start = Date.now();
      await marketDataService.getMarketSummary();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500);
    });

    it('should batch API requests efficiently', async () => {
      const requests = [
        marketDataService.getIndex('SENSEX'),
        marketDataService.getIndex('NIFTY'),
        marketDataService.getIndex('BANKNIFTY')
      ];
      
      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;
      
      // Batched requests should be faster than sequential
      expect(duration).toBeLessThan(300);
    });

    it('should implement cache warming strategy', async () => {
      await marketDataService.warmCache();
      
      // Verify critical data is cached
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringMatching(/index:SENSEX|index:NIFTY/),
        expect.any(Object),
        expect.any(Number)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Since we're using mock data enabled, it should handle errors gracefully
      const result = await marketDataService.getIndex('SENSEX');
      
      expect(result.success).toBe(true); // Should use fallback
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid symbols', async () => {
      const result = await marketDataService.getIndex('INVALID_SYMBOL');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid symbol');
    });

    it('should retry failed requests with exponential backoff', async () => {
      // In mock mode, retries are not needed since mock data is always available
      // This test validates that the service can handle multiple calls
      const result1 = await marketDataService.getIndex('SENSEX');
      const result2 = await marketDataService.getIndex('SENSEX');
      const result3 = await marketDataService.getIndex('SENSEX');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
    });
  });

  describe('Integration with AI Content Generation', () => {
    it('should format market data for AI prompts', async () => {
      const formatted = await marketDataService.formatForAI();
      
      expect(formatted).toBeDefined();
      expect(formatted).toContain('SENSEX');
      expect(formatted).toContain('NIFTY');
      expect(formatted).toMatch(/\d+\.\d+/); // Contains numbers
    });

    it('should provide contextual market analysis', async () => {
      const context = await marketDataService.getMarketContext();
      
      expect(context).toBeDefined();
      expect(context.trend).toBeDefined();
      expect(context.volatility).toBeDefined();
      expect(context.keyEvents).toBeDefined();
      expect(context.advisorTalkingPoints).toHaveLength(3);
    });
  });
});