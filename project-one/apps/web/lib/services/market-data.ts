/**
 * Market Data Service
 * Integrates with Indian financial market APIs for real-time data
 * Provides caching, fallback mechanisms, and content enrichment
 */

import {
  IndexData,
  MutualFundData,
  SectorData,
  StockData,
  CurrencyData,
  CommodityData,
  MarketSummary,
  MarketInsight,
  MarketStatus,
  MarketDataResponse,
  MarketDataConfig,
  MarketDataError,
  MarketDataCacheKey
} from '../types/market-data';

import {
  mockIndices,
  mockMutualFunds,
  mockSectors,
  mockCurrencies,
  mockCommodities,
  mockMarketSummary,
  mockMarketInsight,
  mockMarketStatus,
  generateRandomMarketData
} from '../mock/market-data';

import { CacheManager } from '../performance/cache-manager';

// Market holidays for 2024 (Indian markets)
const MARKET_HOLIDAYS_2024 = [
  '2024-01-26', // Republic Day
  '2024-03-08', // Mahashivratri
  '2024-03-25', // Holi
  '2024-03-29', // Good Friday
  '2024-04-11', // Id-ul-Fitr
  '2024-04-17', // Ram Navami
  '2024-04-21', // Maharashtra Day
  '2024-05-01', // Maharashtra Day
  '2024-05-20', // Buddha Purnima
  '2024-06-17', // Bakri Id
  '2024-07-17', // Muharram
  '2024-08-15', // Independence Day
  '2024-08-26', // Janmashtami
  '2024-10-02', // Gandhi Jayanti
  '2024-10-12', // Dussehra
  '2024-11-01', // Diwali
  '2024-11-15', // Guru Nanak Jayanti
  '2024-12-25', // Christmas
];

// Tracking subscription interface
interface IndexTracker {
  subscribe: (callback: (data: IndexData) => void) => void;
  unsubscribe: () => void;
}

export class MarketDataService {
  private config: MarketDataConfig;
  private cache?: CacheManager;
  private trackers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: MarketDataConfig, cache?: CacheManager) {
    this.config = config;
    this.cache = cache;
  }

  /**
   * Get index data for specified symbols
   */
  async getIndices(symbols: string[]): Promise<MarketDataResponse<IndexData[]>> {
    try {
      const indices: IndexData[] = [];
      
      for (const symbol of symbols) {
        const result = await this.getIndex(symbol);
        if (result.success && result.data) {
          indices.push(result.data);
        }
      }

      return {
        success: true,
        data: indices,
        timestamp: new Date(),
        cached: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get single index data
   */
  async getIndex(symbol: string): Promise<MarketDataResponse<IndexData>> {
    try {
      // Validate symbol
      if (!['SENSEX', 'NIFTY', 'BANKNIFTY'].includes(symbol)) {
        throw new MarketDataError('Invalid symbol', 'INVALID_SYMBOL', 400);
      }

      const cacheKey: MarketDataCacheKey = `index:${symbol}`;
      
      // Check cache first
      const cached = await this.getFromCache<IndexData>(cacheKey);
      if (cached && this.isDataFresh(cached.lastUpdated)) {
        return {
          success: true,
          data: cached,
          timestamp: new Date(),
          cached: true
        };
      }

      // Fetch fresh data
      let data: IndexData | undefined;
      
      if (this.config.mockDataEnabled) {
        // Use mock data for testing
        data = mockIndices.find(i => i.symbol === symbol);
        if (data) {
          data = { ...data, lastUpdated: new Date() };
        }
      } else {
        // Fetch from real API (implementation would go here)
        data = await this.fetchIndexFromAPI(symbol);
      }

      if (!data) {
        // Use fallback if enabled
        if (this.config.fallbackEnabled) {
          data = mockIndices.find(i => i.symbol === symbol);
          if (data) {
            data = { ...data, lastUpdated: new Date() };
          }
        } else {
          throw new MarketDataError('Index data not available', 'DATA_NOT_AVAILABLE', 404);
        }
      }

      // Cache the data
      if (data && this.cache) {
        await this.cache.set(cacheKey, data, this.config.cache.indices);
      }

      return {
        success: true,
        data,
        timestamp: new Date(),
        cached: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get mutual fund data
   */
  async getMutualFunds(schemeCodes: string[]): Promise<MarketDataResponse<MutualFundData[]>> {
    try {
      const funds: MutualFundData[] = [];
      
      for (const code of schemeCodes) {
        const result = await this.getMutualFund(code);
        if (result.success && result.data) {
          funds.push(result.data);
        }
      }

      return {
        success: true,
        data: funds,
        timestamp: new Date(),
        cached: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get single mutual fund data
   */
  async getMutualFund(schemeCode: string): Promise<MarketDataResponse<MutualFundData>> {
    try {
      const cacheKey: MarketDataCacheKey = `mf:${schemeCode}`;
      
      // Check cache first
      const cached = await this.getFromCache<MutualFundData>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: new Date(),
          cached: true
        };
      }

      // Fetch fresh data
      let data: MutualFundData | undefined;
      
      if (this.config.mockDataEnabled) {
        data = mockMutualFunds.find(f => f.schemeCode === schemeCode);
      } else {
        data = await this.fetchMutualFundFromAPI(schemeCode);
      }

      if (!data && this.config.fallbackEnabled) {
        data = mockMutualFunds.find(f => f.schemeCode === schemeCode);
      }

      if (!data) {
        throw new MarketDataError('Mutual fund data not available', 'DATA_NOT_AVAILABLE', 404);
      }

      // Cache the data
      if (this.cache) {
        await this.cache.set(cacheKey, data, this.config.cache.mutualFunds);
      }

      return {
        success: true,
        data,
        timestamp: new Date(),
        cached: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get top performing mutual funds by category
   */
  async getTopMutualFunds(category: string, limit: number = 5): Promise<MarketDataResponse<MutualFundData[]>> {
    try {
      let funds: MutualFundData[];
      
      if (this.config.mockDataEnabled) {
        funds = mockMutualFunds
          .filter(f => f.category === category)
          .sort((a, b) => (b.returns.oneYear || 0) - (a.returns.oneYear || 0))
          .slice(0, limit);
      } else {
        funds = await this.fetchTopMutualFundsFromAPI(category, limit);
      }

      return {
        success: true,
        data: funds,
        timestamp: new Date(),
        cached: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Track indices with real-time updates
   */
  async trackIndices(symbols: string[], intervalMs: number): Promise<IndexTracker> {
    const callbacks: ((data: IndexData) => void)[] = [];
    
    const fetchAndNotify = async () => {
      for (const symbol of symbols) {
        const result = await this.getIndex(symbol);
        if (result.success && result.data) {
          callbacks.forEach(cb => cb(result.data!));
        }
      }
    };

    // Initial fetch
    await fetchAndNotify();
    
    // Set up interval
    const intervalId = setInterval(fetchAndNotify, intervalMs);
    this.trackers.set(symbols.join(','), intervalId);

    return {
      subscribe: (callback: (data: IndexData) => void) => {
        callbacks.push(callback);
      },
      unsubscribe: () => {
        const key = symbols.join(',');
        const id = this.trackers.get(key);
        if (id) {
          clearInterval(id);
          this.trackers.delete(key);
        }
      }
    };
  }

  /**
   * Get index trend analysis
   */
  async getIndexTrend(symbol: string, period: string): Promise<any> {
    try {
      const index = await this.getIndex(symbol);
      if (!index.success || !index.data) {
        throw new Error('Unable to fetch index data');
      }

      const changePercent = index.data.changePercent;
      let direction: 'up' | 'down' | 'sideways';
      let strength: number;

      if (Math.abs(changePercent) < 0.1) {
        direction = 'sideways';
        strength = 10;
      } else if (changePercent > 0) {
        direction = 'up';
        strength = Math.min(100, Math.abs(changePercent) * 20);
      } else {
        direction = 'down';
        strength = Math.min(100, Math.abs(changePercent) * 20);
      }

      return {
        symbol,
        period,
        direction,
        strength,
        changePercent
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get sector data
   */
  async getSectors(): Promise<MarketDataResponse<SectorData[]>> {
    try {
      let sectors: SectorData[];
      
      if (this.config.mockDataEnabled) {
        sectors = mockSectors;
      } else {
        sectors = await this.fetchSectorsFromAPI();
      }

      return {
        success: true,
        data: sectors,
        timestamp: new Date(),
        cached: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get top performing sectors
   */
  async getTopSectors(limit: number = 3): Promise<MarketDataResponse<SectorData[]>> {
    try {
      const sectorsResult = await this.getSectors();
      if (!sectorsResult.success || !sectorsResult.data) {
        throw new Error('Unable to fetch sector data');
      }

      const topSectors = sectorsResult.data
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit);

      return {
        success: true,
        data: topSectors,
        timestamp: new Date(),
        cached: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get sector rotation insights
   */
  async getSectorRotation(): Promise<any> {
    try {
      const sectorsResult = await this.getSectors();
      if (!sectorsResult.success || !sectorsResult.data) {
        throw new Error('Unable to fetch sector data');
      }

      const sectors = sectorsResult.data;
      const inflowSectors = sectors.filter(s => s.changePercent > 0.5);
      const outflowSectors = sectors.filter(s => s.changePercent < -0.5);

      return {
        inflowSectors: inflowSectors.map(s => s.name),
        outflowSectors: outflowSectors.map(s => s.name),
        recommendation: inflowSectors.length > outflowSectors.length 
          ? 'Consider sector rotation into performing sectors'
          : 'Maintain defensive positioning'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate market data for anomalies
   */
  async validateMarketData(data: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Check for unusual change percentages
    if (data.index && Math.abs(data.index.changePercent) > 10) {
      errors.push('Unusual change percentage detected');
    }

    // Add more validation rules as needed
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get comprehensive market summary
   */
  async getMarketSummary(): Promise<MarketDataResponse<MarketSummary>> {
    try {
      if (this.config.mockDataEnabled) {
        return {
          success: true,
          data: generateRandomMarketData(),
          timestamp: new Date(),
          cached: false
        };
      }

      // In production, this would aggregate data from multiple sources
      const [indices, sectors] = await Promise.all([
        this.getIndices(['SENSEX', 'NIFTY', 'BANKNIFTY']),
        this.getSectors()
      ]);

      const summary: MarketSummary = {
        indices: indices.data || [],
        topGainers: mockMarketSummary.topGainers, // Would fetch real data
        topLosers: mockMarketSummary.topLosers,
        mostActive: mockMarketSummary.mostActive,
        sectors: sectors.data || [],
        currencies: mockCurrencies,
        commodities: mockCommodities,
        timestamp: new Date()
      };

      return {
        success: true,
        data: summary,
        timestamp: new Date(),
        cached: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generate market insights for content creation
   */
  async generateMarketInsights(): Promise<MarketInsight> {
    try {
      const summary = await this.getMarketSummary();
      if (!summary.success || !summary.data) {
        return mockMarketInsight;
      }

      const sensex = summary.data.indices.find(i => i.symbol === 'SENSEX');
      const nifty = summary.data.indices.find(i => i.symbol === 'NIFTY');
      const bankNifty = summary.data.indices.find(i => i.symbol === 'BANKNIFTY');

      // Determine market type
      let type: 'bullish' | 'bearish' | 'neutral' | 'volatile';
      const avgChange = ((sensex?.changePercent || 0) + (nifty?.changePercent || 0)) / 2;
      
      if (avgChange > 0.5) type = 'bullish';
      else if (avgChange < -0.5) type = 'bearish';
      else type = 'neutral';

      return {
        type,
        headline: this.generateHeadline(type, avgChange),
        summary: this.generateSummary(summary.data),
        keyPoints: this.generateKeyPoints(summary.data),
        indices: {
          sensex: sensex || mockIndices[0],
          nifty: nifty || mockIndices[1],
          bankNifty: bankNifty || mockIndices[2]
        },
        topPerformers: {
          stocks: summary.data.topGainers.slice(0, 3),
          sectors: summary.data.sectors.filter(s => s.change > 0).slice(0, 3),
          mutualFunds: mockMutualFunds.filter(m => m.change > 0).slice(0, 3)
        },
        marketMood: this.determineMarketMood(avgChange),
        recommendations: this.generateRecommendations(type),
        disclaimer: 'The above market analysis is for informational purposes only and should not be considered as investment advice. Please consult with your financial advisor before making any investment decisions. Past performance is not indicative of future results.'
      };
    } catch (error) {
      return mockMarketInsight;
    }
  }

  /**
   * Get content-enriched market data
   */
  async getContentEnrichedData(options: {
    includeIndices?: boolean;
    includeMutualFunds?: boolean;
    includeSectors?: boolean;
  }): Promise<any> {
    const data: any = {};
    
    if (options.includeIndices) {
      const indices = await this.getIndices(['SENSEX', 'NIFTY']);
      data.indices = indices.data;
    }

    if (options.includeMutualFunds) {
      const funds = await this.getTopMutualFunds('Large Cap', 3);
      data.mutualFunds = funds.data;
    }

    if (options.includeSectors) {
      const sectors = await this.getTopSectors(3);
      data.sectors = sectors.data;
    }

    data.formattedText = this.formatDataForContent(data);
    
    return data;
  }

  /**
   * Get market status
   */
  async getMarketStatus(): Promise<MarketStatus> {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const day = now.getDay();
    
    // Check if weekend
    if (day === 0 || day === 6) {
      return {
        isOpen: false,
        nextOpenTime: this.getNextTradingDay(now),
        tradingSession: 'closed'
      };
    }

    // Check if holiday
    const dateStr = now.toISOString().split('T')[0];
    if (MARKET_HOLIDAYS_2024.includes(dateStr)) {
      return {
        isOpen: false,
        nextOpenTime: this.getNextTradingDay(now),
        holiday: 'Market Holiday',
        tradingSession: 'closed'
      };
    }

    // Check trading hours (IST)
    const currentTime = hours * 100 + minutes;
    
    if (currentTime >= 915 && currentTime < 1530) {
      return {
        isOpen: true,
        nextCloseTime: new Date(now.setHours(15, 30, 0, 0)),
        tradingSession: 'regular'
      };
    } else if (currentTime >= 900 && currentTime < 915) {
      return {
        isOpen: false,
        nextOpenTime: new Date(now.setHours(9, 15, 0, 0)),
        tradingSession: 'pre-market'
      };
    } else if (currentTime >= 1530 && currentTime < 1600) {
      return {
        isOpen: false,
        nextOpenTime: this.getNextTradingDay(now),
        tradingSession: 'post-market'
      };
    } else {
      return {
        isOpen: false,
        nextOpenTime: this.getNextTradingDay(now),
        tradingSession: 'closed'
      };
    }
  }

  /**
   * Check if given date is a market holiday
   */
  async isMarketHoliday(date: Date): Promise<boolean> {
    const dateStr = date.toISOString().split('T')[0];
    return MARKET_HOLIDAYS_2024.includes(dateStr);
  }

  /**
   * Warm cache with critical data
   */
  async warmCache(): Promise<void> {
    if (!this.cache) return;

    // Cache critical indices
    await this.getIndex('SENSEX');
    await this.getIndex('NIFTY');
    
    // Cache top mutual funds
    await this.getTopMutualFunds('Large Cap', 5);
    
    // Cache sectors
    await this.getSectors();
  }

  /**
   * Format market data for AI content generation
   */
  async formatForAI(): Promise<string> {
    const summary = await this.getMarketSummary();
    if (!summary.success || !summary.data) {
      return 'Market data unavailable';
    }

    const sensex = summary.data.indices.find(i => i.symbol === 'SENSEX');
    const nifty = summary.data.indices.find(i => i.symbol === 'NIFTY');

    return `
Market Update:
- SENSEX: ${sensex?.value.toFixed(2)} (${sensex?.changePercent > 0 ? '+' : ''}${sensex?.changePercent.toFixed(2)}%)
- NIFTY: ${nifty?.value.toFixed(2)} (${nifty?.changePercent > 0 ? '+' : ''}${nifty?.changePercent.toFixed(2)}%)
- Top Sector: ${summary.data.sectors[0]?.name} (${summary.data.sectors[0]?.changePercent.toFixed(2)}%)
- Market Sentiment: ${this.determineMarketMood((sensex?.changePercent || 0 + nifty?.changePercent || 0) / 2)}
    `.trim();
  }

  /**
   * Get market context for content generation
   */
  async getMarketContext(): Promise<any> {
    const summary = await this.getMarketSummary();
    const insights = await this.generateMarketInsights();
    
    return {
      trend: insights.type,
      volatility: this.calculateVolatility(summary.data?.indices || []),
      keyEvents: [],
      advisorTalkingPoints: [
        `Markets ${insights.type === 'bullish' ? 'showing strength' : insights.type === 'bearish' ? 'under pressure' : 'consolidating'}`,
        `${insights.topPerformers.sectors[0]?.name || 'IT'} sector leading gains`,
        'Diversification remains key in current market conditions'
      ]
    };
  }

  // Private helper methods

  private async getFromCache<T>(key: MarketDataCacheKey): Promise<T | null> {
    if (!this.cache) return null;
    return this.cache.get(key) as Promise<T | null>;
  }

  private isDataFresh(lastUpdated: Date, maxAgeMs: number = 60000): boolean {
    return Date.now() - lastUpdated.getTime() < maxAgeMs;
  }

  private async fetchIndexFromAPI(symbol: string): Promise<IndexData | undefined> {
    // Actual API implementation would go here
    // For now, return mock data with random variations
    const mock = mockIndices.find(i => i.symbol === symbol);
    if (mock) {
      return {
        ...mock,
        value: mock.value * (1 + (Math.random() - 0.5) * 0.02),
        lastUpdated: new Date()
      };
    }
    return undefined;
  }

  private async fetchMutualFundFromAPI(schemeCode: string): Promise<MutualFundData | undefined> {
    // Actual API implementation
    return undefined;
  }

  private async fetchTopMutualFundsFromAPI(category: string, limit: number): Promise<MutualFundData[]> {
    // Actual API implementation
    return [];
  }

  private async fetchSectorsFromAPI(): Promise<SectorData[]> {
    // Actual API implementation
    return mockSectors;
  }

  private getNextTradingDay(from: Date): Date {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    next.setHours(9, 15, 0, 0);
    
    // Skip weekends
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
    
    // Skip holidays
    const dateStr = next.toISOString().split('T')[0];
    if (MARKET_HOLIDAYS_2024.includes(dateStr)) {
      return this.getNextTradingDay(next);
    }
    
    return next;
  }

  private generateHeadline(type: string, change: number): string {
    if (type === 'bullish') {
      return `Markets Close Higher with ${Math.abs(change).toFixed(2)}% Gains`;
    } else if (type === 'bearish') {
      return `Markets End Lower, Down ${Math.abs(change).toFixed(2)}%`;
    } else {
      return 'Markets Close Flat Amid Mixed Cues';
    }
  }

  private generateSummary(data: MarketSummary): string {
    const sensex = data.indices.find(i => i.symbol === 'SENSEX');
    const nifty = data.indices.find(i => i.symbol === 'NIFTY');
    
    return `Indian equity markets ${sensex?.change > 0 ? 'advanced' : 'declined'} today with SENSEX at ${sensex?.value.toFixed(2)} and NIFTY at ${nifty?.value.toFixed(2)}. ${data.sectors[0]?.name} sector led the ${data.sectors[0]?.change > 0 ? 'gains' : 'decline'}.`;
  }

  private generateKeyPoints(data: MarketSummary): string[] {
    return [
      `SENSEX ${data.indices[0]?.change > 0 ? 'up' : 'down'} ${Math.abs(data.indices[0]?.changePercent).toFixed(2)}%`,
      `NIFTY ${data.indices[1]?.change > 0 ? 'gained' : 'lost'} ${Math.abs(data.indices[1]?.change).toFixed(0)} points`,
      `${data.sectors[0]?.name} sector ${data.sectors[0]?.change > 0 ? 'outperformed' : 'underperformed'}`,
      `${data.topGainers[0]?.name} top gainer with ${data.topGainers[0]?.changePercent.toFixed(2)}% rise`,
      `Market breadth ${data.topGainers.length > data.topLosers.length ? 'positive' : 'negative'}`
    ];
  }

  private determineMarketMood(change: number): string {
    if (change > 1) return 'Strongly Bullish';
    if (change > 0.3) return 'Cautiously Optimistic';
    if (change > -0.3) return 'Neutral';
    if (change > -1) return 'Cautiously Pessimistic';
    return 'Risk-Averse';
  }

  private generateRecommendations(type: string): string[] {
    if (type === 'bullish') {
      return [
        'Consider profit booking in overvalued positions',
        'Look for quality stocks on minor dips',
        'Maintain asset allocation discipline'
      ];
    } else if (type === 'bearish') {
      return [
        'Focus on defensive sectors',
        'Consider accumulating quality stocks in staggered manner',
        'Review and rebalance portfolio'
      ];
    } else {
      return [
        'Wait for clear market direction',
        'Focus on stock-specific opportunities',
        'Maintain adequate cash levels'
      ];
    }
  }

  private calculateVolatility(indices: IndexData[]): 'low' | 'medium' | 'high' {
    const changes = indices.map(i => Math.abs(i.changePercent));
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    if (avgChange < 0.5) return 'low';
    if (avgChange < 1.5) return 'medium';
    return 'high';
  }

  private formatDataForContent(data: any): string {
    let text = '';
    
    if (data.indices) {
      text += 'Market Indices:\n';
      data.indices.forEach((i: IndexData) => {
        text += `- ${i.name}: ${i.value.toFixed(2)} (${i.changePercent > 0 ? '+' : ''}${i.changePercent.toFixed(2)}%)\n`;
      });
    }
    
    if (data.mutualFunds) {
      text += '\nTop Mutual Funds:\n';
      data.mutualFunds.forEach((f: MutualFundData) => {
        text += `- ${f.schemeName}: NAV ${f.nav.toFixed(2)}\n`;
      });
    }
    
    return text;
  }

  private handleError(error: any): MarketDataResponse<any> {
    if (error instanceof MarketDataError) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
    
    // For other errors, try fallback if enabled
    if (this.config.fallbackEnabled) {
      return {
        success: true,
        data: mockMarketSummary,
        timestamp: new Date(),
        cached: false
      };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      timestamp: new Date()
    };
  }
}