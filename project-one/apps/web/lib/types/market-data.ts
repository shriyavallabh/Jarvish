/**
 * Market Data Types for Indian Financial Markets
 * Focused on NSE/BSE indices, mutual funds, and commodities
 */

// Index Data Types
export interface IndexData {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  volume?: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  lastUpdated: Date;
}

// Mutual Fund Data Types
export interface MutualFundData {
  schemeCode: string;
  schemeName: string;
  nav: number;
  navDate: Date;
  change: number;
  changePercent: number;
  category: string;
  fundHouse: string;
  aum?: number;
  expenseRatio?: number;
  returns: {
    oneDay?: number;
    oneWeek?: number;
    oneMonth?: number;
    threeMonths?: number;
    sixMonths?: number;
    oneYear?: number;
    threeYears?: number;
    fiveYears?: number;
  };
  riskLevel?: 'Low' | 'Moderate' | 'High' | 'Very High';
}

// Sector Data Types
export interface SectorData {
  name: string;
  index: string;
  value: number;
  change: number;
  changePercent: number;
  topGainers: StockData[];
  topLosers: StockData[];
  marketCap?: number;
  peRatio?: number;
}

// Stock Data Types
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  sector?: string;
}

// Currency Data Types
export interface CurrencyData {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  bid?: number;
  ask?: number;
  dayHigh: number;
  dayLow: number;
  lastUpdated: Date;
}

// Commodity Data Types
export interface CommodityData {
  name: string;
  symbol: string;
  price: number;
  unit: string;
  change: number;
  changePercent: number;
  exchange: string;
  lastUpdated: Date;
}

// Market Summary
export interface MarketSummary {
  indices: IndexData[];
  topGainers: StockData[];
  topLosers: StockData[];
  mostActive: StockData[];
  sectors: SectorData[];
  currencies: CurrencyData[];
  commodities: CommodityData[];
  timestamp: Date;
}

// Market Data API Response Types
export interface MarketDataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  cached?: boolean;
  cacheExpiry?: Date;
}

// Market Data Cache Configuration
export interface MarketDataCacheConfig {
  indices: number; // TTL in seconds
  mutualFunds: number;
  sectors: number;
  currencies: number;
  commodities: number;
  default: number;
}

// Market Data Service Configuration
export interface MarketDataConfig {
  apiKeys?: {
    nse?: string;
    bse?: string;
    mfapi?: string;
    alphavantage?: string;
    rapidapi?: string;
  };
  cache: MarketDataCacheConfig;
  fallbackEnabled: boolean;
  mockDataEnabled?: boolean;
}

// Market Insights for Content Generation
export interface MarketInsight {
  type: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  headline: string;
  summary: string;
  keyPoints: string[];
  indices: {
    sensex: IndexData;
    nifty: IndexData;
    bankNifty?: IndexData;
  };
  topPerformers: {
    stocks: StockData[];
    sectors: SectorData[];
    mutualFunds: MutualFundData[];
  };
  marketMood: string;
  recommendations?: string[];
  disclaimer: string;
}

// Error Types
export class MarketDataError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'MarketDataError';
  }
}

// API Provider Types
export type MarketDataProvider = 'nse' | 'bse' | 'mfapi' | 'alphavantage' | 'mock';

// Cache Key Types
export type MarketDataCacheKey = 
  | `index:${string}`
  | `mf:${string}`
  | `sector:${string}`
  | `currency:${string}`
  | `commodity:${string}`
  | `summary:${string}`;

// Market Status
export interface MarketStatus {
  isOpen: boolean;
  nextOpenTime?: Date;
  nextCloseTime?: Date;
  holiday?: string;
  tradingSession?: 'pre-market' | 'regular' | 'post-market' | 'closed';
}

// Validation Schemas (using Zod)
export const IndexDataSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  value: z.number(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number().optional(),
  previousClose: z.number(),
  dayHigh: z.number(),
  dayLow: z.number(),
  yearHigh: z.number(),
  yearLow: z.number(),
  lastUpdated: z.date()
});

export const MutualFundDataSchema = z.object({
  schemeCode: z.string(),
  schemeName: z.string(),
  nav: z.number(),
  navDate: z.date(),
  change: z.number(),
  changePercent: z.number(),
  category: z.string(),
  fundHouse: z.string(),
  aum: z.number().optional(),
  expenseRatio: z.number().optional(),
  returns: z.object({
    oneDay: z.number().optional(),
    oneWeek: z.number().optional(),
    oneMonth: z.number().optional(),
    threeMonths: z.number().optional(),
    sixMonths: z.number().optional(),
    oneYear: z.number().optional(),
    threeYears: z.number().optional(),
    fiveYears: z.number().optional()
  }),
  riskLevel: z.enum(['Low', 'Moderate', 'High', 'Very High']).optional()
});

// Import Zod for validation
import { z } from 'zod';