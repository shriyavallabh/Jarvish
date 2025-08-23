/**
 * Market Data Display Component
 * Shows real-time Indian market data with compliance-approved formatting
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert } from '../ui/alert';
import {
  IndexData,
  MutualFundData,
  SectorData,
  CurrencyData,
  CommodityData,
  MarketInsight
} from '../../lib/types/market-data';
import { MarketDataService } from '../../lib/services/market-data';
import { CacheManager } from '../../lib/performance/cache-manager';

interface MarketDataDisplayProps {
  showIndices?: boolean;
  showMutualFunds?: boolean;
  showSectors?: boolean;
  showCurrencies?: boolean;
  showCommodities?: boolean;
  showInsights?: boolean;
  refreshInterval?: number; // in seconds
  compactView?: boolean;
  advisorTier?: 'basic' | 'standard' | 'pro';
}

const MarketDataDisplay: React.FC<MarketDataDisplayProps> = ({
  showIndices = true,
  showMutualFunds = false,
  showSectors = false,
  showCurrencies = false,
  showCommodities = false,
  showInsights = true,
  refreshInterval = 60,
  compactView = false,
  advisorTier = 'basic'
}) => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [mutualFunds, setMutualFunds] = useState<MutualFundData[]>([]);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyData[]>([]);
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [insights, setInsights] = useState<MarketInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Initialize market data service
  const marketDataService = new MarketDataService(
    {
      cache: {
        indices: 60,
        mutualFunds: 300,
        sectors: 120,
        currencies: 30,
        commodities: 60,
        default: 60
      },
      fallbackEnabled: true,
      mockDataEnabled: process.env.NODE_ENV === 'development'
    },
    new CacheManager()
  );

  // Fetch market data
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch indices
      if (showIndices) {
        const indicesResult = await marketDataService.getIndices(['SENSEX', 'NIFTY', 'BANKNIFTY']);
        if (indicesResult.success && indicesResult.data) {
          setIndices(indicesResult.data);
        }
      }

      // Fetch mutual funds (Pro tier only)
      if (showMutualFunds && advisorTier === 'pro') {
        const fundsResult = await marketDataService.getTopMutualFunds('Large Cap', 5);
        if (fundsResult.success && fundsResult.data) {
          setMutualFunds(fundsResult.data);
        }
      }

      // Fetch sectors (Standard and Pro tiers)
      if (showSectors && (advisorTier === 'standard' || advisorTier === 'pro')) {
        const sectorsResult = await marketDataService.getSectors();
        if (sectorsResult.success && sectorsResult.data) {
          setSectors(sectorsResult.data.slice(0, 5));
        }
      }

      // Fetch currencies
      if (showCurrencies) {
        const summary = await marketDataService.getMarketSummary();
        if (summary.success && summary.data) {
          setCurrencies(summary.data.currencies);
        }
      }

      // Fetch commodities
      if (showCommodities) {
        const summary = await marketDataService.getMarketSummary();
        if (summary.success && summary.data) {
          setCommodities(summary.data.commodities);
        }
      }

      // Fetch insights
      if (showInsights) {
        const marketInsights = await marketDataService.generateMarketInsights();
        setInsights(marketInsights);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError('Unable to fetch market data. Please try again later.');
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set up refresh interval
  useEffect(() => {
    fetchMarketData();

    const interval = setInterval(() => {
      fetchMarketData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [showIndices, showMutualFunds, showSectors, showCurrencies, showCommodities, showInsights]);

  // Format percentage change
  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  // Format currency
  const formatCurrency = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Get color for change
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <p className="text-red-800">{error}</p>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Insights */}
      {showInsights && insights && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Market Insights</h3>
            <Badge className={`${
              insights.type === 'bullish' ? 'bg-green-100 text-green-800' :
              insights.type === 'bearish' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {insights.marketMood}
            </Badge>
          </div>
          <p className="text-gray-700 mb-3">{insights.headline}</p>
          <p className="text-sm text-gray-600">{insights.summary}</p>
        </Card>
      )}

      {/* Indices */}
      {showIndices && indices.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Indices</h3>
          <div className={`grid ${compactView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
            {indices.map((index) => (
              <div key={index.symbol} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{index.name}</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(index.value)}
                    </p>
                  </div>
                  <Badge className={`${
                    index.change > 0 ? 'bg-green-100 text-green-800' :
                    index.change < 0 ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {formatChange(index.changePercent)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Day Range</span>
                    <span>{formatCurrency(index.dayLow)} - {formatCurrency(index.dayHigh)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>52W Range</span>
                    <span>{formatCurrency(index.yearLow)} - {formatCurrency(index.yearHigh)}</span>
                  </div>
                </div>
                {!compactView && (
                  <div className="mt-3">
                    <Progress 
                      value={(index.value - index.yearLow) / (index.yearHigh - index.yearLow) * 100}
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mutual Funds (Pro tier only) */}
      {showMutualFunds && advisorTier === 'pro' && mutualFunds.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Mutual Funds</h3>
          <div className="space-y-3">
            {mutualFunds.map((fund) => (
              <div key={fund.schemeCode} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{fund.schemeName}</h4>
                    <p className="text-xs text-gray-600 mt-1">{fund.fundHouse} | {fund.category}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-lg font-bold">₹{fund.nav.toFixed(2)}</span>
                      <span className={`text-sm ${getChangeColor(fund.changePercent)}`}>
                        {formatChange(fund.changePercent)}
                      </span>
                    </div>
                  </div>
                  {fund.riskLevel && (
                    <Badge className={`${
                      fund.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                      fund.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {fund.riskLevel} Risk
                    </Badge>
                  )}
                </div>
                {!compactView && fund.returns && (
                  <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                    <div className="text-center">
                      <p className="text-gray-600">1Y</p>
                      <p className={`font-medium ${getChangeColor(fund.returns.oneYear || 0)}`}>
                        {formatChange(fund.returns.oneYear || 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">3Y</p>
                      <p className={`font-medium ${getChangeColor(fund.returns.threeYears || 0)}`}>
                        {formatChange(fund.returns.threeYears || 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">5Y</p>
                      <p className={`font-medium ${getChangeColor(fund.returns.fiveYears || 0)}`}>
                        {formatChange(fund.returns.fiveYears || 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Expense</p>
                      <p className="font-medium">{fund.expenseRatio}%</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sectors */}
      {showSectors && (advisorTier === 'standard' || advisorTier === 'pro') && sectors.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sector Performance</h3>
          <div className="space-y-2">
            {sectors.map((sector) => (
              <div key={sector.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="font-medium text-gray-900">{sector.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{formatCurrency(sector.value)}</span>
                  <Badge className={`${
                    sector.change > 0 ? 'bg-green-100 text-green-800' :
                    sector.change < 0 ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {formatChange(sector.changePercent)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Currencies & Commodities */}
      {(showCurrencies || showCommodities) && (currencies.length > 0 || commodities.length > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Currencies & Commodities</h3>
          <div className="grid grid-cols-2 gap-4">
            {showCurrencies && currencies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Currencies</h4>
                <div className="space-y-2">
                  {currencies.map((currency) => (
                    <div key={currency.pair} className="flex justify-between text-sm">
                      <span className="text-gray-600">{currency.pair}</span>
                      <span className={`font-medium ${getChangeColor(currency.change)}`}>
                        ₹{currency.rate.toFixed(2)} ({formatChange(currency.changePercent)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showCommodities && commodities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Commodities</h4>
                <div className="space-y-2">
                  {commodities.map((commodity) => (
                    <div key={commodity.symbol} className="flex justify-between text-sm">
                      <span className="text-gray-600">{commodity.name}</span>
                      <span className={`font-medium ${getChangeColor(commodity.change)}`}>
                        ₹{formatCurrency(commodity.price)} ({formatChange(commodity.changePercent)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Compliance Disclaimer */}
      <div className="text-xs text-gray-500 text-center mt-4">
        <p>Market data is for informational purposes only. Not investment advice.</p>
        <p>Last updated: {lastUpdated.toLocaleTimeString('en-IN')}</p>
      </div>
    </div>
  );
};

export default MarketDataDisplay;