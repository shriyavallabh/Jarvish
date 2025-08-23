/**
 * Mock Market Data for Indian Financial Markets
 * Used for testing and fallback scenarios
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
  MarketStatus
} from '../types/market-data';

// Mock Index Data
export const mockIndices: IndexData[] = [
  {
    symbol: 'SENSEX',
    name: 'BSE SENSEX',
    value: 72240.26,
    change: 147.89,
    changePercent: 0.21,
    volume: 285000000,
    previousClose: 72092.37,
    dayHigh: 72445.71,
    dayLow: 72080.15,
    yearHigh: 74245.17,
    yearLow: 57420.23,
    lastUpdated: new Date('2024-01-22T15:30:00.000Z')
  },
  {
    symbol: 'NIFTY',
    name: 'NIFTY 50',
    value: 21737.60,
    change: 38.25,
    changePercent: 0.18,
    volume: 420000000,
    previousClose: 21699.35,
    dayHigh: 21825.30,
    dayLow: 21680.45,
    yearHigh: 22327.85,
    yearLow: 17250.80,
    lastUpdated: new Date('2024-01-22T15:30:00.000Z')
  },
  {
    symbol: 'BANKNIFTY',
    name: 'BANK NIFTY',
    value: 45632.70,
    change: -125.45,
    changePercent: -0.27,
    volume: 180000000,
    previousClose: 45758.15,
    dayHigh: 45890.20,
    dayLow: 45520.35,
    yearHigh: 48125.00,
    yearLow: 41250.50,
    lastUpdated: new Date('2024-01-22T15:30:00.000Z')
  }
];

// Mock Mutual Fund Data
export const mockMutualFunds: MutualFundData[] = [
  {
    schemeCode: 'INF109K01Z62',
    schemeName: 'HDFC Top 100 Fund - Direct Plan - Growth',
    nav: 782.456,
    navDate: new Date('2024-01-22T00:00:00.000Z'),
    change: 2.34,
    changePercent: 0.30,
    category: 'Large Cap',
    fundHouse: 'HDFC Mutual Fund',
    aum: 24567.89,
    expenseRatio: 1.05,
    returns: {
      oneDay: 0.30,
      oneWeek: 1.2,
      oneMonth: 3.5,
      threeMonths: 8.7,
      sixMonths: 15.3,
      oneYear: 22.5,
      threeYears: 14.8,
      fiveYears: 16.2
    },
    riskLevel: 'Moderate'
  },
  {
    schemeCode: 'INF090I01M25',
    schemeName: 'Axis Bluechip Fund - Direct Plan - Growth',
    nav: 45.67,
    navDate: new Date('2024-01-22T00:00:00.000Z'),
    change: 0.15,
    changePercent: 0.33,
    category: 'Large Cap',
    fundHouse: 'Axis Mutual Fund',
    aum: 35678.45,
    expenseRatio: 0.92,
    returns: {
      oneDay: 0.33,
      oneWeek: 1.5,
      oneMonth: 4.2,
      threeMonths: 9.8,
      sixMonths: 16.7,
      oneYear: 24.3,
      threeYears: 15.9,
      fiveYears: 17.8
    },
    riskLevel: 'Moderate'
  },
  {
    schemeCode: 'INF769K01101',
    schemeName: 'Mirae Asset Tax Saver Fund - Direct Plan - Growth',
    nav: 32.456,
    navDate: new Date('2024-01-22T00:00:00.000Z'),
    change: -0.08,
    changePercent: -0.25,
    category: 'ELSS',
    fundHouse: 'Mirae Asset Mutual Fund',
    aum: 12345.67,
    expenseRatio: 0.68,
    returns: {
      oneDay: -0.25,
      oneWeek: 0.8,
      oneMonth: 2.9,
      threeMonths: 7.5,
      sixMonths: 14.2,
      oneYear: 19.8,
      threeYears: 16.5,
      fiveYears: 18.3
    },
    riskLevel: 'High'
  }
];

// Mock Sector Data
export const mockSectors: SectorData[] = [
  {
    name: 'Banking',
    index: 'NIFTY BANK',
    value: 45632.70,
    change: -125.45,
    changePercent: -0.27,
    topGainers: [
      {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank',
        price: 1498.50,
        change: 12.30,
        changePercent: 0.83,
        volume: 5234567,
        sector: 'Banking'
      }
    ],
    topLosers: [
      {
        symbol: 'ICICIBANK',
        name: 'ICICI Bank',
        price: 1025.40,
        change: -8.60,
        changePercent: -0.83,
        volume: 3456789,
        sector: 'Banking'
      }
    ],
    marketCap: 4567890.12,
    peRatio: 18.5
  },
  {
    name: 'Information Technology',
    index: 'NIFTY IT',
    value: 35678.90,
    change: 234.56,
    changePercent: 0.66,
    topGainers: [
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        price: 3567.80,
        change: 45.60,
        changePercent: 1.29,
        volume: 2345678,
        sector: 'IT'
      }
    ],
    topLosers: [
      {
        symbol: 'WIPRO',
        name: 'Wipro',
        price: 412.30,
        change: -3.20,
        changePercent: -0.77,
        volume: 1234567,
        sector: 'IT'
      }
    ],
    marketCap: 3456789.45,
    peRatio: 28.3
  },
  {
    name: 'Pharmaceuticals',
    index: 'NIFTY PHARMA',
    value: 18945.30,
    change: 145.20,
    changePercent: 0.77,
    topGainers: [
      {
        symbol: 'SUNPHARMA',
        name: 'Sun Pharmaceutical',
        price: 1234.50,
        change: 18.90,
        changePercent: 1.56,
        volume: 1876543,
        sector: 'Pharma'
      }
    ],
    topLosers: [
      {
        symbol: 'CIPLA',
        name: 'Cipla',
        price: 1189.70,
        change: -12.30,
        changePercent: -1.02,
        volume: 987654,
        sector: 'Pharma'
      }
    ],
    marketCap: 2345678.90,
    peRatio: 32.7
  }
];

// Mock Currency Data
export const mockCurrencies: CurrencyData[] = [
  {
    pair: 'USD/INR',
    rate: 83.12,
    change: 0.08,
    changePercent: 0.10,
    bid: 83.11,
    ask: 83.13,
    dayHigh: 83.25,
    dayLow: 82.98,
    lastUpdated: new Date('2024-01-22T15:30:00.000Z')
  },
  {
    pair: 'EUR/INR',
    rate: 90.45,
    change: -0.12,
    changePercent: -0.13,
    bid: 90.44,
    ask: 90.46,
    dayHigh: 90.78,
    dayLow: 90.32,
    lastUpdated: new Date('2024-01-22T15:30:00.000Z')
  },
  {
    pair: 'GBP/INR',
    rate: 105.67,
    change: 0.23,
    changePercent: 0.22,
    bid: 105.66,
    ask: 105.68,
    dayHigh: 105.89,
    dayLow: 105.34,
    lastUpdated: new Date('2024-01-22T15:30:00.000Z')
  }
];

// Mock Commodity Data
export const mockCommodities: CommodityData[] = [
  {
    name: 'Gold',
    symbol: 'GOLD',
    price: 62850,
    unit: '10 grams',
    change: 120,
    changePercent: 0.19,
    exchange: 'MCX',
    lastUpdated: new Date('2024-01-22T15:30:00.000Z')
  },
  {
    name: 'Silver',
    symbol: 'SILVER',
    price: 73500,
    unit: 'kg',
    change: -250,
    changePercent: -0.34,
    exchange: 'MCX',
    lastUpdated: new Date('2024-01-22T15:30:00.000Z')
  },
  {
    name: 'Crude Oil',
    symbol: 'CRUDEOIL',
    price: 6234,
    unit: 'barrel',
    change: 45,
    changePercent: 0.73,
    exchange: 'MCX',
    lastUpdated: new Date('2024-01-22T15:30:00.000Z')
  }
];

// Mock Stock Data
export const mockStocks: StockData[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries',
    price: 2456.70,
    change: 34.50,
    changePercent: 1.42,
    volume: 6543210,
    marketCap: 1658943.23,
    peRatio: 27.8,
    sector: 'Oil & Gas'
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    price: 3567.80,
    change: 45.60,
    changePercent: 1.29,
    volume: 2345678,
    marketCap: 1304567.89,
    peRatio: 31.2,
    sector: 'IT'
  },
  {
    symbol: 'INFY',
    name: 'Infosys',
    price: 1423.45,
    change: -12.30,
    changePercent: -0.86,
    volume: 3456789,
    marketCap: 589234.56,
    peRatio: 25.6,
    sector: 'IT'
  }
];

// Mock Market Summary
export const mockMarketSummary: MarketSummary = {
  indices: mockIndices,
  topGainers: mockStocks.filter(s => s.change > 0).slice(0, 5),
  topLosers: mockStocks.filter(s => s.change < 0).slice(0, 5),
  mostActive: mockStocks.sort((a, b) => b.volume - a.volume).slice(0, 5),
  sectors: mockSectors,
  currencies: mockCurrencies,
  commodities: mockCommodities,
  timestamp: new Date('2024-01-22T15:30:00.000Z')
};

// Mock Market Insight
export const mockMarketInsight: MarketInsight = {
  type: 'bullish',
  headline: 'Markets Close Higher Amid Positive Global Cues',
  summary: 'Indian equity markets ended the day on a positive note with SENSEX gaining 147.89 points (0.21%) and NIFTY up by 38.25 points (0.18%). Banking stocks showed mixed trends while IT and Pharma sectors led the gains.',
  keyPoints: [
    'SENSEX closed at 72,240.26, up 0.21% from previous close',
    'NIFTY 50 ended at 21,737.60, gaining 0.18% for the day',
    'IT sector outperformed with 0.66% gains led by TCS',
    'Banking sector remained under pressure with BANK NIFTY down 0.27%',
    'Foreign institutional investors (FIIs) remained net buyers'
  ],
  indices: {
    sensex: mockIndices[0],
    nifty: mockIndices[1],
    bankNifty: mockIndices[2]
  },
  topPerformers: {
    stocks: mockStocks.filter(s => s.change > 0).slice(0, 3),
    sectors: mockSectors.filter(s => s.change > 0).slice(0, 3),
    mutualFunds: mockMutualFunds.filter(m => m.change > 0).slice(0, 3)
  },
  marketMood: 'Cautiously Optimistic',
  recommendations: [
    'Consider accumulating quality large-cap stocks on dips',
    'IT sector shows strength; selective buying recommended',
    'Banking sector may see consolidation; wait for clear trend',
    'Maintain balanced portfolio with focus on domestic consumption themes'
  ],
  disclaimer: 'The above market analysis is for informational purposes only and should not be considered as investment advice. Please consult with your financial advisor before making any investment decisions. Past performance is not indicative of future results.'
};

// Mock Market Status
export const mockMarketStatus: MarketStatus = {
  isOpen: false,
  nextOpenTime: new Date('2024-01-23T09:15:00.000+05:30'),
  nextCloseTime: new Date('2024-01-23T15:30:00.000+05:30'),
  tradingSession: 'closed'
};

// Helper function to generate random market data
export function generateRandomMarketData(): MarketSummary {
  const randomChange = () => (Math.random() - 0.5) * 4; // -2% to +2%
  
  const updatedIndices = mockIndices.map(index => ({
    ...index,
    value: index.value * (1 + randomChange() / 100),
    change: index.value * randomChange() / 100,
    changePercent: randomChange(),
    lastUpdated: new Date()
  }));

  return {
    ...mockMarketSummary,
    indices: updatedIndices,
    timestamp: new Date()
  };
}

// Helper function to get market data with delay (simulating API call)
export async function getMockMarketData(delay: number = 100): Promise<MarketSummary> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateRandomMarketData());
    }, delay);
  });
}

// Helper function to simulate API failure
export async function getMockMarketDataWithError(delay: number = 100): Promise<MarketSummary> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Mock API Error: Unable to fetch market data'));
    }, delay);
  });
}