/**
 * Health Checker for JARVISH Platform
 * Comprehensive health checking for all services and dependencies
 */

import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import axios from 'axios';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  message?: string;
  details?: any;
  lastChecked: string;
}

export interface DependencyHealth {
  database: HealthCheck;
  redis: HealthCheck;
  whatsapp: HealthCheck;
  openai: HealthCheck;
  clerk: HealthCheck;
  storage: HealthCheck;
}

class HealthChecker {
  private static instance: HealthChecker;
  private startTime: Date;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  private constructor() {
    this.startTime = new Date();
    this.initializeHealthChecks();
  }
  
  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }
  
  private initializeHealthChecks() {
    // Schedule periodic health checks
    this.scheduleCheck('database', this.checkDatabase.bind(this), 30000);
    this.scheduleCheck('redis', this.checkRedis.bind(this), 20000);
    this.scheduleCheck('whatsapp', this.checkWhatsApp.bind(this), 60000);
    this.scheduleCheck('openai', this.checkOpenAI.bind(this), 60000);
    this.scheduleCheck('clerk', this.checkClerk.bind(this), 60000);
    this.scheduleCheck('storage', this.checkStorage.bind(this), 45000);
  }
  
  private scheduleCheck(
    name: string,
    checkFn: () => Promise<HealthCheck>,
    interval: number
  ) {
    // Run initial check
    checkFn().then(result => this.healthChecks.set(name, result));
    
    // Schedule periodic checks
    const intervalId = setInterval(async () => {
      try {
        const result = await checkFn();
        this.healthChecks.set(name, result);
      } catch (error) {
        this.healthChecks.set(name, {
          name,
          status: 'unhealthy',
          responseTime: 0,
          message: `Health check failed: ${error}`,
          lastChecked: new Date().toISOString()
        });
      }
    }, interval);
    
    this.checkIntervals.set(name, intervalId);
  }
  
  // Database Health Check
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    const check: HealthCheck = {
      name: 'database',
      status: 'healthy',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    };
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      
      // Test query
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
        .single();
      
      check.responseTime = Date.now() - startTime;
      
      if (error) {
        check.status = 'unhealthy';
        check.message = `Database query failed: ${error.message}`;
      } else if (check.responseTime > 2000) {
        check.status = 'degraded';
        check.message = `Database response slow: ${check.responseTime}ms`;
      } else {
        check.message = 'Database connection healthy';
      }
    } catch (error) {
      check.status = 'unhealthy';
      check.responseTime = Date.now() - startTime;
      check.message = `Database connection failed: ${error}`;
    }
    
    return check;
  }
  
  // Redis Health Check
  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    const check: HealthCheck = {
      name: 'redis',
      status: 'healthy',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    };
    
    try {
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      });
      
      // Test ping
      const result = await redis.ping();
      check.responseTime = Date.now() - startTime;
      
      if (result !== 'PONG') {
        check.status = 'unhealthy';
        check.message = 'Redis ping failed';
      } else if (check.responseTime > 1000) {
        check.status = 'degraded';
        check.message = `Redis response slow: ${check.responseTime}ms`;
      } else {
        // Check queue sizes
        const queueSize = await redis.llen('whatsapp:queue');
        check.message = 'Redis connection healthy';
        check.details = { queueSize };
        
        if (queueSize > 1000) {
          check.status = 'degraded';
          check.message = `Queue backlog high: ${queueSize} messages`;
        }
      }
      
      await redis.quit();
    } catch (error) {
      check.status = 'unhealthy';
      check.responseTime = Date.now() - startTime;
      check.message = `Redis connection failed: ${error}`;
    }
    
    return check;
  }
  
  // WhatsApp API Health Check
  private async checkWhatsApp(): Promise<HealthCheck> {
    const startTime = Date.now();
    const check: HealthCheck = {
      name: 'whatsapp',
      status: 'healthy',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    };
    
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          },
          timeout: 5000
        }
      );
      
      check.responseTime = Date.now() - startTime;
      
      if (response.status !== 200) {
        check.status = 'unhealthy';
        check.message = `WhatsApp API returned status ${response.status}`;
      } else if (check.responseTime > 3000) {
        check.status = 'degraded';
        check.message = `WhatsApp API response slow: ${check.responseTime}ms`;
      } else {
        check.message = 'WhatsApp API healthy';
        check.details = {
          accountStatus: response.data.quality_rating,
          messagingLimit: response.data.messaging_limit
        };
      }
    } catch (error: any) {
      check.status = 'unhealthy';
      check.responseTime = Date.now() - startTime;
      check.message = `WhatsApp API check failed: ${error.message}`;
    }
    
    return check;
  }
  
  // OpenAI API Health Check
  private async checkOpenAI(): Promise<HealthCheck> {
    const startTime = Date.now();
    const check: HealthCheck = {
      name: 'openai',
      status: 'healthy',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    };
    
    try {
      const response = await axios.get(
        'https://api.openai.com/v1/models',
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          timeout: 5000
        }
      );
      
      check.responseTime = Date.now() - startTime;
      
      if (response.status !== 200) {
        check.status = 'unhealthy';
        check.message = `OpenAI API returned status ${response.status}`;
      } else if (check.responseTime > 3000) {
        check.status = 'degraded';
        check.message = `OpenAI API response slow: ${check.responseTime}ms`;
      } else {
        check.message = 'OpenAI API healthy';
        check.details = {
          availableModels: response.data.data.length
        };
      }
    } catch (error: any) {
      check.status = 'unhealthy';
      check.responseTime = Date.now() - startTime;
      check.message = `OpenAI API check failed: ${error.message}`;
    }
    
    return check;
  }
  
  // Clerk Auth Health Check
  private async checkClerk(): Promise<HealthCheck> {
    const startTime = Date.now();
    const check: HealthCheck = {
      name: 'clerk',
      status: 'healthy',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    };
    
    try {
      const response = await axios.get(
        `https://api.clerk.com/v1/actor_tokens`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
          },
          timeout: 5000
        }
      );
      
      check.responseTime = Date.now() - startTime;
      
      if (response.status !== 200 && response.status !== 404) {
        check.status = 'unhealthy';
        check.message = `Clerk API returned status ${response.status}`;
      } else if (check.responseTime > 2000) {
        check.status = 'degraded';
        check.message = `Clerk API response slow: ${check.responseTime}ms`;
      } else {
        check.message = 'Clerk Auth healthy';
      }
    } catch (error: any) {
      // 404 is acceptable for this endpoint
      if (error.response?.status === 404) {
        check.status = 'healthy';
        check.responseTime = Date.now() - startTime;
        check.message = 'Clerk Auth healthy';
      } else {
        check.status = 'unhealthy';
        check.responseTime = Date.now() - startTime;
        check.message = `Clerk API check failed: ${error.message}`;
      }
    }
    
    return check;
  }
  
  // Storage Health Check
  private async checkStorage(): Promise<HealthCheck> {
    const startTime = Date.now();
    const check: HealthCheck = {
      name: 'storage',
      status: 'healthy',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    };
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      
      // List buckets to test storage access
      const { data, error } = await supabase.storage.listBuckets();
      
      check.responseTime = Date.now() - startTime;
      
      if (error) {
        check.status = 'unhealthy';
        check.message = `Storage check failed: ${error.message}`;
      } else if (check.responseTime > 2000) {
        check.status = 'degraded';
        check.message = `Storage response slow: ${check.responseTime}ms`;
      } else {
        check.message = 'Storage healthy';
        check.details = {
          buckets: data?.length || 0
        };
      }
    } catch (error) {
      check.status = 'unhealthy';
      check.responseTime = Date.now() - startTime;
      check.message = `Storage check failed: ${error}`;
    }
    
    return check;
  }
  
  // Get comprehensive health status
  async getHealthStatus(): Promise<HealthStatus> {
    // Run all checks in parallel
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkWhatsApp(),
      this.checkOpenAI(),
      this.checkClerk(),
      this.checkStorage()
    ]);
    
    // Calculate summary
    const summary = {
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length
    };
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      checks,
      summary
    };
  }
  
  // Get cached health status (faster)
  getCachedHealthStatus(): HealthStatus {
    const checks = Array.from(this.healthChecks.values());
    
    const summary = {
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length
    };
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      checks,
      summary
    };
  }
  
  // Check if system is ready for traffic
  isSystemReady(): boolean {
    const criticalServices = ['database', 'redis', 'clerk'];
    
    for (const service of criticalServices) {
      const check = this.healthChecks.get(service);
      if (!check || check.status === 'unhealthy') {
        return false;
      }
    }
    
    return true;
  }
  
  // Cleanup intervals on shutdown
  cleanup() {
    this.checkIntervals.forEach(interval => clearInterval(interval));
    this.checkIntervals.clear();
  }
}

export default HealthChecker.getInstance();