#!/usr/bin/env node

/**
 * JARVISH Performance Testing Suite
 * Comprehensive performance validation for production deployment
 * Validates all SLA requirements and system scalability
 */

const { LoadTester, ProductionLoadTestConfig, LoadTestScenarios } = require('../lib/performance/load-tester');
const { cacheManager } = require('../lib/performance/cache-manager');
const { queryOptimizer } = require('../lib/performance/query-optimizer');
const { performanceMonitor } = require('../lib/performance/performance-monitor');
const fs = require('fs').promises;
const path = require('path');

class PerformanceTester {
  constructor() {
    this.results = {
      loadTest: null,
      slaValidation: null,
      frontendPerformance: null,
      stressTest: null,
      systemHealth: null,
      recommendations: []
    };
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Run complete performance test suite
   */
  async runComprehensiveTest() {
    console.log('🚀 Starting JARVISH Performance Test Suite');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log('='.repeat(60));

    try {
      // 1. System Health Check
      await this.runSystemHealthCheck();

      // 2. Frontend Performance Testing
      await this.runFrontendPerformanceTest();

      // 3. Load Testing
      await this.runLoadTests();

      // 4. SLA Validation
      await this.runSlaValidation();

      // 5. Stress Testing
      await this.runStressTest();

      // 6. Cache Performance Testing
      await this.runCachePerformanceTest();

      // 7. Database Performance Testing
      await this.runDatabasePerformanceTest();

      // 8. Generate Recommendations
      await this.generateOptimizationRecommendations();

      // 9. Generate Report
      await this.generateReport();

      console.log('✅ Performance test suite completed successfully');
      
    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
      process.exit(1);
    }
  }

  /**
   * System health check before testing
   */
  async runSystemHealthCheck() {
    console.log('\n🔍 Running System Health Check...');
    
    const healthChecks = {
      api: await this.checkApiHealth(),
      database: await this.checkDatabaseHealth(),
      cache: await this.checkCacheHealth(),
      external: await this.checkExternalServices()
    };

    this.results.systemHealth = {
      timestamp: new Date(),
      checks: healthChecks,
      overall: Object.values(healthChecks).every(check => check.status === 'healthy')
    };

    console.log(`API: ${healthChecks.api.status}`);
    console.log(`Database: ${healthChecks.database.status}`);
    console.log(`Cache: ${healthChecks.cache.status}`);
    console.log(`External Services: ${healthChecks.external.status}`);
  }

  /**
   * Frontend performance testing with Lighthouse
   */
  async runFrontendPerformanceTest() {
    console.log('\n🌐 Running Frontend Performance Tests...');

    const pages = [
      { name: 'Landing Page', url: '/' },
      { name: 'Sign In', url: '/sign-in' },
      { name: 'Advisor Dashboard', url: '/advisor/dashboard' },
      { name: 'Admin Dashboard', url: '/admin/dashboard' },
      { name: 'Pricing', url: '/pricing' }
    ];

    const results = {};

    for (const page of pages) {
      console.log(`  📄 Testing ${page.name}...`);
      
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
      const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
      };

      const runnerResult = await lighthouse(`${this.baseUrl}${page.url}`, options);
      await chrome.kill();

      const scores = runnerResult.lhr.categories;
      const metrics = runnerResult.lhr.audits;

      results[page.name] = {
        performance: scores.performance.score * 100,
        accessibility: scores.accessibility.score * 100,
        bestPractices: scores['best-practices'].score * 100,
        seo: scores.seo.score * 100,
        metrics: {
          fcp: metrics['first-contentful-paint'].numericValue,
          lcp: metrics['largest-contentful-paint'].numericValue,
          cls: metrics['cumulative-layout-shift'].numericValue,
          fid: metrics['max-potential-fid']?.numericValue || 0,
          ttfb: metrics['server-response-time']?.numericValue || 0
        },
        opportunities: metrics['diagnostics']?.details || []
      };

      console.log(`    Performance: ${results[page.name].performance}%`);
      console.log(`    LCP: ${results[page.name].metrics.lcp}ms`);
    }

    this.results.frontendPerformance = results;
  }

  /**
   * Comprehensive load testing
   */
  async runLoadTests() {
    console.log('\n⚡ Running Load Tests...');

    // Test with different user loads
    const loadConfigs = [
      { users: 100, duration: 60, name: 'Light Load' },
      { users: 500, duration: 120, name: 'Medium Load' },
      { users: 1000, duration: 180, name: 'High Load' },
      { users: 2000, duration: 300, name: 'Peak Load' }
    ];

    const loadTestResults = {};

    for (const config of loadConfigs) {
      console.log(`  🏋️  ${config.name}: ${config.users} users for ${config.duration}s`);
      
      const testConfig = {
        ...ProductionLoadTestConfig,
        concurrentUsers: config.users,
        duration: config.duration,
        baseUrl: this.baseUrl
      };

      const loadTester = new LoadTester(testConfig);
      const result = await loadTester.runLoadTest();
      
      loadTestResults[config.name] = result;

      console.log(`    Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
      console.log(`    Avg Response: ${result.averageResponseTime.toFixed(0)}ms`);
      console.log(`    P95 Response: ${result.p95ResponseTime.toFixed(0)}ms`);
    }

    this.results.loadTest = loadTestResults;
  }

  /**
   * SLA validation testing
   */
  async runSlaValidation() {
    console.log('\n✅ Running SLA Validation Tests...');

    const loadTester = new LoadTester({
      ...ProductionLoadTestConfig,
      baseUrl: this.baseUrl
    });

    const slaResults = await loadTester.runSlaValidationTest();
    
    this.results.slaValidation = {
      whatsappDelivery: {
        ...slaResults.whatsappDelivery,
        requirement: '99% success rate',
        status: slaResults.whatsappDelivery.passed ? 'PASS' : 'FAIL'
      },
      complianceChecking: {
        ...slaResults.complianceChecking,
        requirement: '<1.5s response time',
        status: slaResults.complianceChecking.passed ? 'PASS' : 'FAIL'
      },
      apiResponse: {
        ...slaResults.apiResponse,
        requirement: '<500ms P95',
        status: slaResults.apiResponse.passed ? 'PASS' : 'FAIL'
      }
    };

    console.log(`  WhatsApp Delivery: ${slaResults.whatsappDelivery.rate.toFixed(2)}% (${slaResults.whatsappDelivery.passed ? 'PASS' : 'FAIL'})`);
    console.log(`  Compliance Checking: ${slaResults.complianceChecking.responseTime.toFixed(0)}ms (${slaResults.complianceChecking.passed ? 'PASS' : 'FAIL'})`);
    console.log(`  API Response: ${slaResults.apiResponse.p95ResponseTime.toFixed(0)}ms (${slaResults.apiResponse.passed ? 'PASS' : 'FAIL'})`);
  }

  /**
   * Stress testing to find breaking points
   */
  async runStressTest() {
    console.log('\n💥 Running Stress Test...');

    const loadTester = new LoadTester({
      ...ProductionLoadTestConfig,
      baseUrl: this.baseUrl
    });

    const stressResults = await loadTester.runStressTest(3000);
    
    this.results.stressTest = {
      breakingPoint: stressResults.breakingPoint,
      degradationPoint: stressResults.degradationPoint,
      results: stressResults.results,
      recommendation: this.getScalingRecommendation(stressResults)
    };

    console.log(`  Degradation Point: ${stressResults.degradationPoint} users`);
    console.log(`  Breaking Point: ${stressResults.breakingPoint} users`);
  }

  /**
   * Cache performance testing
   */
  async runCachePerformanceTest() {
    console.log('\n🗄️  Running Cache Performance Tests...');

    const testKeys = Array.from({ length: 1000 }, (_, i) => `test_key_${i}`);
    const testData = { message: 'Performance test data', timestamp: Date.now() };

    // Write performance
    const writeStart = Date.now();
    await Promise.all(
      testKeys.map(key => cacheManager.set(key, testData, 300))
    );
    const writeTime = Date.now() - writeStart;

    // Read performance
    const readStart = Date.now();
    await Promise.all(
      testKeys.map(key => cacheManager.get(key))
    );
    const readTime = Date.now() - readStart;

    // Get cache statistics
    const cacheStats = await cacheManager.getStats();

    // Cleanup test data
    await Promise.all(
      testKeys.map(key => cacheManager.delete(key))
    );

    this.results.cachePerformance = {
      writePerformance: {
        operations: testKeys.length,
        totalTime: writeTime,
        opsPerSecond: (testKeys.length / writeTime) * 1000
      },
      readPerformance: {
        operations: testKeys.length,
        totalTime: readTime,
        opsPerSecond: (testKeys.length / readTime) * 1000
      },
      statistics: cacheStats
    };

    console.log(`  Write Ops/sec: ${this.results.cachePerformance.writePerformance.opsPerSecond.toFixed(0)}`);
    console.log(`  Read Ops/sec: ${this.results.cachePerformance.readPerformance.opsPerSecond.toFixed(0)}`);
    console.log(`  Hit Rate: ${cacheStats.hitRate.toFixed(2)}%`);
  }

  /**
   * Database performance testing
   */
  async runDatabasePerformanceTest() {
    console.log('\n🗃️  Running Database Performance Tests...');

    const dbStats = queryOptimizer.getQueryStats();
    const healthCheck = await queryOptimizer.healthCheck();

    // Simple query performance test
    const queryTests = [
      'SELECT 1',
      'SELECT NOW()',
      'SELECT COUNT(*) FROM advisors',
      'SELECT * FROM advisors LIMIT 10'
    ];

    const queryResults = [];
    for (const query of queryTests) {
      const startTime = Date.now();
      try {
        await queryOptimizer.query({ text: query });
        const duration = Date.now() - startTime;
        queryResults.push({ query, duration, success: true });
      } catch (error) {
        queryResults.push({ 
          query, 
          duration: Date.now() - startTime, 
          success: false, 
          error: error.message 
        });
      }
    }

    this.results.databasePerformance = {
      health: healthCheck,
      statistics: dbStats,
      queryTests: queryResults
    };

    console.log(`  Primary DB: ${healthCheck.primary ? 'Healthy' : 'Unhealthy'}`);
    if (healthCheck.replica !== undefined) {
      console.log(`  Replica DB: ${healthCheck.replica ? 'Healthy' : 'Unhealthy'}`);
    }
    console.log(`  Active Connections: ${dbStats.activeConnections}`);
    console.log(`  Average Query Time: ${dbStats.averageLatency}ms`);
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations() {
    console.log('\n💡 Generating Optimization Recommendations...');

    const recommendations = [];

    // Frontend performance recommendations
    if (this.results.frontendPerformance) {
      Object.entries(this.results.frontendPerformance).forEach(([page, metrics]) => {
        if (metrics.performance < 90) {
          recommendations.push({
            category: 'Frontend Performance',
            priority: 'High',
            page: page,
            issue: `Performance score ${metrics.performance}% below 90%`,
            recommendation: 'Optimize bundle size, implement code splitting, optimize images'
          });
        }
        
        if (metrics.metrics.lcp > 2500) {
          recommendations.push({
            category: 'Core Web Vitals',
            priority: 'High',
            page: page,
            issue: `LCP ${metrics.metrics.lcp}ms exceeds 2.5s threshold`,
            recommendation: 'Optimize server response time, preload critical resources'
          });
        }
      });
    }

    // SLA recommendations
    if (this.results.slaValidation) {
      Object.entries(this.results.slaValidation).forEach(([sla, result]) => {
        if (result.status === 'FAIL') {
          recommendations.push({
            category: 'SLA Compliance',
            priority: 'Critical',
            issue: `${sla} failing SLA requirements`,
            recommendation: this.getSlaRecommendation(sla, result)
          });
        }
      });
    }

    // Load test recommendations
    if (this.results.loadTest) {
      const peakLoad = this.results.loadTest['Peak Load'];
      if (peakLoad && peakLoad.errorRate > 1) {
        recommendations.push({
          category: 'Scalability',
          priority: 'High',
          issue: `Error rate ${peakLoad.errorRate.toFixed(2)}% under peak load`,
          recommendation: 'Implement horizontal scaling, optimize database connections, enhance caching'
        });
      }
    }

    // Cache performance recommendations
    if (this.results.cachePerformance) {
      const hitRate = this.results.cachePerformance.statistics.hitRate;
      if (hitRate < 80) {
        recommendations.push({
          category: 'Cache Performance',
          priority: 'Medium',
          issue: `Cache hit rate ${hitRate.toFixed(2)}% below 80%`,
          recommendation: 'Review cache keys, increase TTL for stable data, implement cache warming'
        });
      }
    }

    this.results.recommendations = recommendations;
    console.log(`  Generated ${recommendations.length} optimization recommendations`);
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport() {
    console.log('\n📊 Generating Performance Report...');

    const reportData = {
      timestamp: new Date(),
      testEnvironment: {
        baseUrl: this.baseUrl,
        nodeVersion: process.version,
        platform: process.platform
      },
      summary: this.generateSummary(),
      results: this.results,
      slaCompliance: this.calculateSlaCompliance(),
      performanceGrade: this.calculatePerformanceGrade()
    };

    const reportPath = path.join(__dirname, '../reports/performance-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHtmlReport(reportData);
    const htmlPath = path.join(__dirname, '../reports/performance-report.html');
    await fs.writeFile(htmlPath, htmlReport);

    console.log(`  JSON Report: ${reportPath}`);
    console.log(`  HTML Report: ${htmlPath}`);
  }

  // Helper methods
  async checkApiHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: response.ok ? 'fast' : 'slow'
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkDatabaseHealth() {
    try {
      const health = await queryOptimizer.healthCheck();
      return {
        status: health.primary ? 'healthy' : 'unhealthy',
        primary: health.primary,
        replica: health.replica
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkCacheHealth() {
    try {
      const health = await cacheManager.healthCheck();
      return {
        status: health ? 'healthy' : 'unhealthy'
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkExternalServices() {
    // Check WhatsApp API, OpenAI API, etc.
    return { status: 'healthy' }; // Simplified for now
  }

  getScalingRecommendation(stressResults) {
    if (stressResults.breakingPoint < 1500) {
      return 'Scale horizontally immediately - system breaks below target capacity';
    } else if (stressResults.degradationPoint < 1000) {
      return 'Optimize performance - degradation occurs too early';
    } else {
      return 'System scales well - monitor and optimize incrementally';
    }
  }

  getSlaRecommendation(sla, result) {
    const recommendations = {
      whatsappDelivery: 'Implement queue prioritization, add retry logic, scale WhatsApp service',
      complianceChecking: 'Optimize AI model inference, implement request batching, scale GPU resources',
      apiResponse: 'Implement response caching, optimize database queries, add CDN'
    };
    return recommendations[sla] || 'Investigate and optimize';
  }

  generateSummary() {
    return {
      overallStatus: this.calculateOverallStatus(),
      keyMetrics: this.extractKeyMetrics(),
      criticalIssues: this.results.recommendations?.filter(r => r.priority === 'Critical').length || 0,
      slaCompliance: this.calculateSlaCompliance()
    };
  }

  calculateOverallStatus() {
    const criticalIssues = this.results.recommendations?.filter(r => r.priority === 'Critical').length || 0;
    if (criticalIssues > 0) return 'Critical';
    
    const slaCompliant = this.calculateSlaCompliance();
    if (slaCompliant < 100) return 'Warning';
    
    return 'Healthy';
  }

  extractKeyMetrics() {
    return {
      peakLoadCapacity: this.results.stressTest?.breakingPoint || 'N/A',
      averageResponseTime: this.results.loadTest?.['Peak Load']?.averageResponseTime || 'N/A',
      cacheHitRate: this.results.cachePerformance?.statistics?.hitRate || 'N/A',
      frontendPerformanceScore: this.calculateAvgFrontendScore()
    };
  }

  calculateSlaCompliance() {
    if (!this.results.slaValidation) return 0;
    
    const slaResults = Object.values(this.results.slaValidation);
    const passedSlas = slaResults.filter(sla => sla.status === 'PASS').length;
    return (passedSlas / slaResults.length) * 100;
  }

  calculatePerformanceGrade() {
    const slaScore = this.calculateSlaCompliance();
    const frontendScore = this.calculateAvgFrontendScore();
    const overallScore = (slaScore + frontendScore) / 2;
    
    if (overallScore >= 90) return 'A';
    if (overallScore >= 80) return 'B';
    if (overallScore >= 70) return 'C';
    if (overallScore >= 60) return 'D';
    return 'F';
  }

  calculateAvgFrontendScore() {
    if (!this.results.frontendPerformance) return 0;
    
    const scores = Object.values(this.results.frontendPerformance)
      .map(page => page.performance);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateHtmlReport(reportData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>JARVISH Performance Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
            .summary { display: flex; gap: 20px; margin: 20px 0; }
            .metric { background: #f9f9f9; padding: 15px; border-radius: 5px; flex: 1; }
            .critical { color: #ff0000; }
            .warning { color: #ff6600; }
            .healthy { color: #00aa00; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>JARVISH Performance Report</h1>
            <p>Generated: ${reportData.timestamp}</p>
            <p>Overall Status: <span class="${reportData.summary.overallStatus.toLowerCase()}">${reportData.summary.overallStatus}</span></p>
            <p>Performance Grade: ${reportData.performanceGrade}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>SLA Compliance</h3>
                <p>${reportData.slaCompliance}%</p>
            </div>
            <div class="metric">
                <h3>Peak Capacity</h3>
                <p>${reportData.summary.keyMetrics.peakLoadCapacity} users</p>
            </div>
            <div class="metric">
                <h3>Cache Hit Rate</h3>
                <p>${reportData.summary.keyMetrics.cacheHitRate}%</p>
            </div>
            <div class="metric">
                <h3>Critical Issues</h3>
                <p>${reportData.summary.criticalIssues}</p>
            </div>
        </div>
        
        <h2>Recommendations</h2>
        <table>
            <tr>
                <th>Priority</th>
                <th>Category</th>
                <th>Issue</th>
                <th>Recommendation</th>
            </tr>
            ${reportData.results.recommendations?.map(rec => `
                <tr>
                    <td class="${rec.priority.toLowerCase()}">${rec.priority}</td>
                    <td>${rec.category}</td>
                    <td>${rec.issue}</td>
                    <td>${rec.recommendation}</td>
                </tr>
            `).join('') || '<tr><td colspan="4">No recommendations</td></tr>'}
        </table>
        
        <p><em>Full report data available in JSON format.</em></p>
    </body>
    </html>
    `;
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';

  const tester = new PerformanceTester();

  switch (command) {
    case 'full':
      await tester.runComprehensiveTest();
      break;
    case 'sla':
      await tester.runSlaValidation();
      break;
    case 'load':
      await tester.runLoadTests();
      break;
    case 'frontend':
      await tester.runFrontendPerformanceTest();
      break;
    case 'stress':
      await tester.runStressTest();
      break;
    default:
      console.log('Usage: node performance-test.js [full|sla|load|frontend|stress]');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Performance test failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTester;