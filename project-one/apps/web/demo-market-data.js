/**
 * Market Data Integration Demo
 * Demonstrates the market data service integration with AI content generation
 */

const { MarketDataService } = require('./lib/services/market-data');
const { AIContentGenerationService } = require('./lib/services/ai-content-generation');

async function demoMarketDataIntegration() {
  console.log('='.repeat(60));
  console.log('JARVISH - Market Data Integration Demo');
  console.log('='.repeat(60));

  // Initialize services
  const marketService = new MarketDataService({
    cache: {
      indices: 60,
      mutualFunds: 300,
      sectors: 120,
      currencies: 30,
      commodities: 60,
      default: 60
    },
    fallbackEnabled: true,
    mockDataEnabled: true // Using mock data for demo
  });

  const aiService = new AIContentGenerationService();

  console.log('\n📊 Fetching Live Market Data...\n');

  // 1. Get Index Data
  const indices = await marketService.getIndices(['SENSEX', 'NIFTY', 'BANKNIFTY']);
  if (indices.success && indices.data) {
    console.log('Market Indices:');
    indices.data.forEach(index => {
      const arrow = index.change > 0 ? '↑' : '↓';
      const color = index.change > 0 ? '\x1b[32m' : '\x1b[31m';
      console.log(`  ${index.name}: ${index.value.toFixed(2)} ${color}${arrow} ${index.changePercent.toFixed(2)}%\x1b[0m`);
    });
  }

  // 2. Get Top Sectors
  console.log('\n📈 Top Performing Sectors:');
  const sectors = await marketService.getTopSectors(3);
  if (sectors.success && sectors.data) {
    sectors.data.forEach((sector, i) => {
      console.log(`  ${i + 1}. ${sector.name}: ${sector.changePercent > 0 ? '+' : ''}${sector.changePercent.toFixed(2)}%`);
    });
  }

  // 3. Get Market Insights
  console.log('\n💡 Market Insights:');
  const insights = await marketService.generateMarketInsights();
  console.log(`  Type: ${insights.type.toUpperCase()}`);
  console.log(`  Mood: ${insights.marketMood}`);
  console.log(`  Headline: ${insights.headline}`);
  
  console.log('\n📝 Key Points:');
  insights.keyPoints.slice(0, 3).forEach(point => {
    console.log(`  • ${point}`);
  });

  // 4. Generate AI Content with Market Data
  console.log('\n\n🤖 Generating AI Content with Market Data...\n');
  
  const contentParams = {
    advisorId: 'demo-advisor',
    contentType: 'market_updates',
    language: 'en',
    advisorProfile: {
      name: 'Demo Advisor',
      euin: 'E123456',
      specialization: 'Equity Markets',
      experience: 10,
      tier: 'pro'
    },
    platform: 'whatsapp',
    includeMarketData: true,
    marketDataOptions: {
      includeIndices: true,
      includeSectors: true,
      includeTopPerformers: true
    }
  };

  try {
    const generatedContent = await aiService.generateContent(contentParams);
    
    console.log('Generated Content:');
    console.log('-'.repeat(40));
    console.log(generatedContent.content);
    console.log('-'.repeat(40));
    
    if (generatedContent.marketData?.included) {
      console.log('\n✅ Market Data Successfully Integrated');
      console.log(`   Data Points: ${generatedContent.marketData.dataPoints?.length || 0}`);
      console.log(`   Last Updated: ${generatedContent.marketData.lastUpdated}`);
    }
    
    console.log('\n📊 Content Metrics:');
    console.log(`   Compliance Score: ${generatedContent.complianceScore}%`);
    console.log(`   Risk Score: ${generatedContent.riskScore}`);
    console.log(`   Generation Time: ${generatedContent.performanceMetrics?.generationTime}ms`);
    
  } catch (error) {
    console.error('Error generating content:', error.message);
  }

  // 5. Market Status Check
  console.log('\n\n🕐 Market Status:');
  const status = await marketService.getMarketStatus();
  console.log(`   Market Open: ${status.isOpen ? 'Yes' : 'No'}`);
  console.log(`   Trading Session: ${status.tradingSession}`);
  if (status.nextOpenTime) {
    console.log(`   Next Open: ${status.nextOpenTime.toLocaleString('en-IN')}`);
  }

  // 6. Performance Test
  console.log('\n\n⚡ Performance Test:');
  const startTime = Date.now();
  const [summaryResult, insightsResult, contextResult] = await Promise.all([
    marketService.getMarketSummary(),
    marketService.generateMarketInsights(),
    marketService.getMarketContext()
  ]);
  const duration = Date.now() - startTime;
  
  console.log(`   Fetched market summary, insights, and context`);
  console.log(`   Total time: ${duration}ms`);
  console.log(`   ✅ Performance SLA: ${duration < 500 ? 'PASSED' : 'FAILED'} (Target: <500ms)`);

  console.log('\n' + '='.repeat(60));
  console.log('Demo Complete!');
  console.log('='.repeat(60));
}

// Run the demo
if (require.main === module) {
  demoMarketDataIntegration().catch(console.error);
}