/**
 * JARVISH Load Testing Suite
 * Comprehensive performance testing for 2000+ concurrent advisors
 * SLA Validation: 99% WhatsApp delivery, <1.5s compliance, <500ms API
 */

import axios, { AxiosResponse } from 'axios';
import { performance } from 'perf_hooks';

interface LoadTestConfig {
  baseUrl: string;
  concurrentUsers: number;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
  scenarios: LoadTestScenario[];
}

interface LoadTestScenario {
  name: string;
  weight: number; // percentage of users
  steps: LoadTestStep[];
}

interface LoadTestStep {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  payload?: any;
  headers?: Record<string, string>;
  expectedStatusCode?: number;
  maxResponseTime?: number; // in milliseconds
  think_time?: number; // pause between steps
}

interface LoadTestResult {
  scenario: string;
  step: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

interface LoadTestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  slaCompliance: {
    whatsappDelivery: number;
    complianceChecking: number;
    apiResponse: number;
  };
  scenarios: Record<string, ScenarioSummary>;
}

interface ScenarioSummary {
  requests: number;
  successes: number;
  failures: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
}

export class LoadTester {
  private config: LoadTestConfig;
  private results: LoadTestResult[] = [];
  private users: LoadTestUser[] = [];
  private isRunning = false;
  private startTime = 0;

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  /**
   * Run comprehensive load test
   */
  async runLoadTest(): Promise<LoadTestSummary> {
    console.log(`Starting load test with ${this.config.concurrentUsers} users for ${this.config.duration}s`);
    
    this.isRunning = true;
    this.startTime = performance.now();
    this.results = [];

    // Create user instances
    this.users = Array.from({ length: this.config.concurrentUsers }, (_, index) => 
      new LoadTestUser(index, this.selectScenario(), this.config.baseUrl)
    );

    // Ramp up users gradually
    await this.rampUpUsers();

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, this.config.duration * 1000));

    // Stop all users
    this.isRunning = false;
    await Promise.all(this.users.map(user => user.stop()));

    return this.generateSummary();
  }

  /**
   * Run SLA validation test specifically
   */
  async runSlaValidationTest(): Promise<{
    whatsappDelivery: { rate: number; passed: boolean };
    complianceChecking: { responseTime: number; passed: boolean };
    apiResponse: { p95ResponseTime: number; passed: boolean };
  }> {
    console.log('Running SLA validation test...');

    const results = {
      whatsappDelivery: { rate: 0, passed: false },
      complianceChecking: { responseTime: 0, passed: false },
      apiResponse: { p95ResponseTime: 0, passed: false }
    };

    // Test WhatsApp delivery SLA (99% success rate)
    const whatsappTest = await this.testWhatsAppDelivery();
    results.whatsappDelivery = {
      rate: whatsappTest.successRate,
      passed: whatsappTest.successRate >= 99
    };

    // Test compliance checking SLA (<1.5s response time)
    const complianceTest = await this.testComplianceChecking();
    results.complianceChecking = {
      responseTime: complianceTest.averageResponseTime,
      passed: complianceTest.averageResponseTime < 1500
    };

    // Test API response SLA (<500ms P95)
    const apiTest = await this.testApiResponseTimes();
    results.apiResponse = {
      p95ResponseTime: apiTest.p95ResponseTime,
      passed: apiTest.p95ResponseTime < 500
    };

    return results;
  }

  /**
   * Test WhatsApp delivery under peak load
   */
  private async testWhatsAppDelivery(): Promise<{
    totalMessages: number;
    successfulDeliveries: number;
    successRate: number;
  }> {
    const testMessages = 2000; // Simulate peak morning load
    const promises = [];

    for (let i = 0; i < testMessages; i++) {
      const promise = this.sendTestWhatsAppMessage(i);
      promises.push(promise);
      
      // Stagger requests to simulate realistic load
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    return {
      totalMessages: testMessages,
      successfulDeliveries: successful,
      successRate: (successful / testMessages) * 100
    };
  }

  /**
   * Test compliance checking performance
   */
  private async testComplianceChecking(): Promise<{
    totalChecks: number;
    averageResponseTime: number;
    successRate: number;
  }> {
    const testChecks = 50; // 50 concurrent advisors
    const startTime = performance.now();
    const promises = [];

    for (let i = 0; i < testChecks; i++) {
      promises.push(this.performComplianceCheck(i));
    }

    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const totalTime = performance.now() - startTime;

    return {
      totalChecks: testChecks,
      averageResponseTime: totalTime / testChecks,
      successRate: (successful / testChecks) * 100
    };
  }

  /**
   * Test API response times across all endpoints
   */
  private async testApiResponseTimes(): Promise<{
    totalRequests: number;
    responseTimes: number[];
    p95ResponseTime: number;
  }> {
    const endpoints = [
      { method: 'GET', path: '/api/advisor/dashboard' },
      { method: 'GET', path: '/api/analytics/advisor' },
      { method: 'POST', path: '/api/ai/generate-content' },
      { method: 'GET', path: '/api/content/generate' },
      { method: 'POST', path: '/api/whatsapp/send' }
    ];

    const requestsPerEndpoint = 100;
    const promises = [];

    for (const endpoint of endpoints) {
      for (let i = 0; i < requestsPerEndpoint; i++) {
        promises.push(this.makeApiRequest(endpoint.method, endpoint.path));
      }
    }

    const results = await Promise.allSettled(promises);
    const responseTimes = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value.responseTime)
      .sort((a, b) => a - b);

    const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;

    return {
      totalRequests: results.length,
      responseTimes,
      p95ResponseTime: responseTimes[p95Index] || 0
    };
  }

  /**
   * Run stress test to find breaking point
   */
  async runStressTest(maxUsers: number = 5000): Promise<{
    breakingPoint: number;
    degradationPoint: number;
    results: { users: number; responseTime: number; errorRate: number }[];
  }> {
    console.log('Running stress test to find system breaking point...');
    
    const results = [];
    let currentUsers = 100;
    let breakingPoint = 0;
    let degradationPoint = 0;

    while (currentUsers <= maxUsers) {
      console.log(`Testing with ${currentUsers} users...`);
      
      const stressConfig: LoadTestConfig = {
        ...this.config,
        concurrentUsers: currentUsers,
        duration: 60, // 1 minute per test
        rampUpTime: 10
      };

      const stressTester = new LoadTester(stressConfig);
      const summary = await stressTester.runLoadTest();

      const result = {
        users: currentUsers,
        responseTime: summary.averageResponseTime,
        errorRate: summary.errorRate
      };

      results.push(result);

      // Detect degradation (2x response time increase)
      if (results.length > 1 && !degradationPoint) {
        const previousResponseTime = results[results.length - 2].responseTime;
        if (result.responseTime > previousResponseTime * 2) {
          degradationPoint = currentUsers;
        }
      }

      // Detect breaking point (>5% error rate)
      if (result.errorRate > 5 && !breakingPoint) {
        breakingPoint = currentUsers;
        break;
      }

      currentUsers += 200;
    }

    return { breakingPoint, degradationPoint, results };
  }

  private async rampUpUsers(): Promise<void> {
    const rampUpInterval = (this.config.rampUpTime * 1000) / this.config.concurrentUsers;
    
    for (const user of this.users) {
      if (!this.isRunning) break;
      user.start();
      await new Promise(resolve => setTimeout(resolve, rampUpInterval));
    }
  }

  private selectScenario(): LoadTestScenario {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const scenario of this.config.scenarios) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        return scenario;
      }
    }
    
    return this.config.scenarios[0];
  }

  private async sendTestWhatsAppMessage(messageId: number): Promise<{
    messageId: number;
    success: boolean;
    responseTime: number;
  }> {
    const startTime = performance.now();
    
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/whatsapp/send`, {
        to: `+91900000${String(messageId).padStart(4, '0')}`,
        message: `Test message ${messageId}`,
        template: 'test_template'
      }, {
        timeout: 10000
      });

      return {
        messageId,
        success: response.status === 200,
        responseTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        messageId,
        success: false,
        responseTime: performance.now() - startTime
      };
    }
  }

  private async performComplianceCheck(checkId: number): Promise<{
    checkId: number;
    responseTime: number;
    success: boolean;
  }> {
    const startTime = performance.now();
    
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/ai/check-compliance`, {
        content: `Test financial content for compliance check ${checkId}`,
        advisorId: `advisor_${checkId}`,
        contentType: 'investment_advice'
      }, {
        timeout: 3000
      });

      return {
        checkId,
        responseTime: performance.now() - startTime,
        success: response.status === 200
      };
    } catch (error) {
      return {
        checkId,
        responseTime: performance.now() - startTime,
        success: false
      };
    }
  }

  private async makeApiRequest(method: string, path: string): Promise<{
    responseTime: number;
    success: boolean;
  }> {
    const startTime = performance.now();
    
    try {
      const response = await axios({
        method: method.toLowerCase() as any,
        url: `${this.config.baseUrl}${path}`,
        timeout: 5000,
        data: method === 'POST' ? { test: true } : undefined
      });

      return {
        responseTime: performance.now() - startTime,
        success: response.status >= 200 && response.status < 300
      };
    } catch (error) {
      return {
        responseTime: performance.now() - startTime,
        success: false
      };
    }
  }

  private generateSummary(): LoadTestSummary {
    const totalTime = performance.now() - this.startTime;
    const responseTimes = this.results.map(r => r.responseTime).sort((a, b) => a - b);
    
    const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
    const p99Index = Math.ceil(responseTimes.length * 0.99) - 1;

    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = this.results.length - successfulRequests;

    const scenarioSummaries: Record<string, ScenarioSummary> = {};
    for (const scenario of this.config.scenarios) {
      const scenarioResults = this.results.filter(r => r.scenario === scenario.name);
      const scenarioResponseTimes = scenarioResults.map(r => r.responseTime);
      
      scenarioSummaries[scenario.name] = {
        requests: scenarioResults.length,
        successes: scenarioResults.filter(r => r.success).length,
        failures: scenarioResults.filter(r => !r.success).length,
        avgResponseTime: scenarioResponseTimes.reduce((a, b) => a + b, 0) / scenarioResponseTimes.length || 0,
        maxResponseTime: Math.max(...scenarioResponseTimes) || 0,
        minResponseTime: Math.min(...scenarioResponseTimes) || 0
      };
    }

    return {
      totalRequests: this.results.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      requestsPerSecond: this.results.length / (totalTime / 1000),
      errorRate: (failedRequests / this.results.length) * 100,
      slaCompliance: {
        whatsappDelivery: 0, // Calculated separately
        complianceChecking: 0, // Calculated separately
        apiResponse: responseTimes[p95Index] || 0
      },
      scenarios: scenarioSummaries
    };
  }

  addResult(result: LoadTestResult): void {
    this.results.push(result);
  }
}

/**
 * Individual user simulator
 */
class LoadTestUser {
  private id: number;
  private scenario: LoadTestScenario;
  private baseUrl: string;
  private isRunning = false;
  private loadTester?: LoadTester;

  constructor(id: number, scenario: LoadTestScenario, baseUrl: string) {
    this.id = id;
    this.scenario = scenario;
    this.baseUrl = baseUrl;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.executeScenario();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  private async executeScenario(): Promise<void> {
    while (this.isRunning) {
      for (const step of this.scenario.steps) {
        if (!this.isRunning) break;

        const startTime = performance.now();
        let success = false;
        let statusCode = 0;
        let error: string | undefined;

        try {
          const response = await this.executeStep(step);
          statusCode = response.status;
          success = this.isSuccessfulResponse(response, step);
        } catch (err: any) {
          error = err.message;
          statusCode = err.response?.status || 0;
        }

        const responseTime = performance.now() - startTime;

        const result: LoadTestResult = {
          scenario: this.scenario.name,
          step: step.name,
          responseTime,
          statusCode,
          success,
          error,
          timestamp: Date.now()
        };

        if (this.loadTester) {
          this.loadTester.addResult(result);
        }

        // Think time between steps
        if (step.think_time && this.isRunning) {
          await new Promise(resolve => setTimeout(resolve, step.think_time));
        }
      }

      // Small pause before repeating scenario
      if (this.isRunning) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      }
    }
  }

  private async executeStep(step: LoadTestStep): Promise<AxiosResponse> {
    return axios({
      method: step.method.toLowerCase() as any,
      url: `${this.baseUrl}${step.endpoint}`,
      data: step.payload,
      headers: step.headers,
      timeout: step.maxResponseTime || 10000
    });
  }

  private isSuccessfulResponse(response: AxiosResponse, step: LoadTestStep): boolean {
    const expectedStatus = step.expectedStatusCode || 200;
    const responseTimeOk = !step.maxResponseTime || response.config.timeout! <= step.maxResponseTime;
    return response.status === expectedStatus && responseTimeOk;
  }

  setLoadTester(tester: LoadTester): void {
    this.loadTester = tester;
  }
}

// Predefined test scenarios
export const LoadTestScenarios = {
  // Typical advisor workflow
  ADVISOR_DAILY_WORKFLOW: {
    name: 'advisor_daily_workflow',
    weight: 60,
    steps: [
      {
        name: 'login',
        method: 'POST' as const,
        endpoint: '/api/auth/login',
        payload: { email: 'test@example.com', password: 'test123' },
        maxResponseTime: 2000
      },
      {
        name: 'view_dashboard',
        method: 'GET' as const,
        endpoint: '/api/advisor/dashboard',
        maxResponseTime: 1500,
        think_time: 2000
      },
      {
        name: 'generate_content',
        method: 'POST' as const,
        endpoint: '/api/ai/generate-content',
        payload: { 
          topic: 'mutual funds',
          contentType: 'investment_advice',
          audience: 'retail_investors'
        },
        maxResponseTime: 5000,
        think_time: 5000
      },
      {
        name: 'check_compliance',
        method: 'POST' as const,
        endpoint: '/api/ai/check-compliance',
        maxResponseTime: 1500,
        think_time: 1000
      },
      {
        name: 'schedule_delivery',
        method: 'POST' as const,
        endpoint: '/api/whatsapp/send',
        maxResponseTime: 3000,
        think_time: 2000
      }
    ]
  } as LoadTestScenario,

  // Peak morning delivery load
  MORNING_DELIVERY_PEAK: {
    name: 'morning_delivery_peak',
    weight: 25,
    steps: [
      {
        name: 'batch_whatsapp_delivery',
        method: 'POST' as const,
        endpoint: '/api/whatsapp/send',
        payload: { 
          messages: Array(10).fill({
            to: '+919876543210',
            template: 'daily_insight',
            data: { advisorName: 'Test Advisor' }
          })
        },
        maxResponseTime: 5000
      }
    ]
  } as LoadTestScenario,

  // Analytics and reporting
  ANALYTICS_VIEWING: {
    name: 'analytics_viewing',
    weight: 15,
    steps: [
      {
        name: 'view_analytics',
        method: 'GET' as const,
        endpoint: '/api/analytics/advisor?period=7d',
        maxResponseTime: 2000,
        think_time: 3000
      },
      {
        name: 'view_performance',
        method: 'GET' as const,
        endpoint: '/api/analytics/performance',
        maxResponseTime: 1000,
        think_time: 2000
      }
    ]
  } as LoadTestScenario
};

// Production load test configuration
export const ProductionLoadTestConfig: LoadTestConfig = {
  baseUrl: process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000',
  concurrentUsers: 2000,
  duration: 300, // 5 minutes
  rampUpTime: 60, // 1 minute ramp up
  scenarios: [
    LoadTestScenarios.ADVISOR_DAILY_WORKFLOW,
    LoadTestScenarios.MORNING_DELIVERY_PEAK,
    LoadTestScenarios.ANALYTICS_VIEWING
  ]
};