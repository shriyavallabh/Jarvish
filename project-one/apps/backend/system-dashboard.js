#!/usr/bin/env node

/**
 * Jarvish Platform System Status Dashboard
 * Real-time monitoring and status display
 */

const axios = require('axios');
const os = require('os');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma
const prisma = new PrismaClient();

// ANSI colors for terminal
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m'
};

// Status indicators
const status = {
  up: `${colors.green}●${colors.reset}`,
  down: `${colors.red}●${colors.reset}`,
  warning: `${colors.yellow}●${colors.reset}`,
  info: `${colors.blue}●${colors.reset}`
};

// API client
const api = axios.create({
  baseURL: 'http://localhost:8001',
  timeout: 5000
});

// Dashboard data
let dashboardData = {
  system: {},
  services: {},
  database: {},
  api: {},
  business: {},
  errors: []
};

// Check system resources
async function checkSystemResources() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsage = (usedMem / totalMem * 100).toFixed(1);
  
  const cpus = os.cpus();
  const avgLoad = os.loadavg()[0];
  const uptime = Math.floor(os.uptime() / 3600);
  
  dashboardData.system = {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    memory: {
      total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      usage: memUsage + '%',
      status: memUsage > 90 ? 'critical' : memUsage > 75 ? 'warning' : 'healthy'
    },
    cpu: {
      cores: cpus.length,
      model: cpus[0].model,
      load: avgLoad.toFixed(2),
      status: avgLoad > cpus.length * 0.8 ? 'high' : 'normal'
    },
    uptime: uptime + ' hours'
  };
}

// Check service health
async function checkServices() {
  const services = {
    backend: { url: '/health', port: 8001 },
    frontend: { url: '/', port: 3000 },
    database: { check: 'prisma' },
    redis: { check: 'redis' }
  };
  
  // Check backend API
  try {
    const response = await api.get('/health');
    dashboardData.services.backend = {
      status: 'running',
      port: 8001,
      environment: response.data.environment || 'development',
      health: 'healthy'
    };
  } catch (error) {
    dashboardData.services.backend = {
      status: 'down',
      port: 8001,
      error: error.message
    };
  }
  
  // Check frontend
  try {
    await axios.get('http://localhost:3000', { timeout: 5000 });
    dashboardData.services.frontend = {
      status: 'running',
      port: 3000,
      health: 'healthy'
    };
  } catch (error) {
    dashboardData.services.frontend = {
      status: 'down',
      port: 3000,
      error: 'Not responding'
    };
  }
  
  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    const templateCount = await prisma.contentTemplate.count();
    
    dashboardData.services.database = {
      status: 'connected',
      type: 'PostgreSQL',
      users: userCount,
      templates: templateCount,
      health: 'healthy'
    };
  } catch (error) {
    dashboardData.services.database = {
      status: 'disconnected',
      error: error.message
    };
  }
  
  // Check Redis
  try {
    const redis = require('redis');
    const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    dashboardData.services.redis = {
      status: 'connected',
      health: 'healthy'
    };
  } catch (error) {
    dashboardData.services.redis = {
      status: 'disconnected',
      error: 'Redis not available'
    };
  }
}

// Check API endpoints
async function checkAPIEndpoints() {
  const endpoints = [
    { name: 'Compliance', path: '/api/compliance/health' },
    { name: 'WhatsApp', path: '/api/whatsapp/health' },
    { name: 'Billing', path: '/api/billing/health' },
    { name: 'Monitoring', path: '/api/monitoring/health' },
    { name: 'Analytics', path: '/api/analytics/revenue' }
  ];
  
  dashboardData.api.endpoints = [];
  
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await api.get(endpoint.path);
      const responseTime = Date.now() - start;
      
      dashboardData.api.endpoints.push({
        name: endpoint.name,
        path: endpoint.path,
        status: 'up',
        responseTime: responseTime + 'ms',
        statusCode: response.status
      });
    } catch (error) {
      dashboardData.api.endpoints.push({
        name: endpoint.name,
        path: endpoint.path,
        status: 'down',
        error: error.response?.status || 'Error'
      });
    }
  }
}

// Get business metrics
async function getBusinessMetrics() {
  try {
    // Get monitoring metrics
    const metricsResponse = await api.get('/api/monitoring/metrics/business');
    const metrics = metricsResponse.data.data;
    
    dashboardData.business = {
      activeAdvisors: metrics.activeAdvisors || 0,
      messagesDelivered: metrics.messagesDelivered || 0,
      complianceChecks: metrics.complianceChecks || 0,
      deliveryRate: metrics.deliverySuccessRate || '0%',
      avgResponseTime: metrics.averageComplianceTime || 'N/A'
    };
  } catch (error) {
    dashboardData.business = {
      error: 'Unable to fetch business metrics'
    };
  }
}

// Display dashboard
function displayDashboard() {
  // Clear console
  console.clear();
  
  // Header
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════════╗
║              JARVISH PLATFORM SYSTEM STATUS DASHBOARD            ║
╚══════════════════════════════════════════════════════════════════╝${colors.reset}
`);
  
  // Timestamp
  console.log(`${colors.dim}Last Updated: ${new Date().toLocaleString()}${colors.reset}\n`);
  
  // System Resources
  console.log(`${colors.bold}📊 SYSTEM RESOURCES${colors.reset}`);
  console.log(`┌─────────────────────────────────────────────────────────────┐`);
  console.log(`│ Platform:  ${dashboardData.system.platform} (${dashboardData.system.arch})`.padEnd(62) + '│');
  console.log(`│ Node:      ${dashboardData.system.nodeVersion}`.padEnd(62) + '│');
  console.log(`│ Memory:    ${dashboardData.system.memory.used}/${dashboardData.system.memory.total} (${dashboardData.system.memory.usage}) ${getStatusIcon(dashboardData.system.memory.status)}`.padEnd(71) + '│');
  console.log(`│ CPU:       ${dashboardData.system.cpu.cores} cores, Load: ${dashboardData.system.cpu.load} ${getStatusIcon(dashboardData.system.cpu.status)}`.padEnd(71) + '│');
  console.log(`│ Uptime:    ${dashboardData.system.uptime}`.padEnd(62) + '│');
  console.log(`└─────────────────────────────────────────────────────────────┘\n`);
  
  // Services Status
  console.log(`${colors.bold}🔧 SERVICES STATUS${colors.reset}`);
  console.log(`┌─────────────────────────────────────────────────────────────┐`);
  displayService('Backend API', dashboardData.services.backend);
  displayService('Frontend App', dashboardData.services.frontend);
  displayService('PostgreSQL', dashboardData.services.database);
  displayService('Redis Cache', dashboardData.services.redis);
  console.log(`└─────────────────────────────────────────────────────────────┘\n`);
  
  // API Endpoints
  console.log(`${colors.bold}🌐 API ENDPOINTS${colors.reset}`);
  console.log(`┌─────────────────────────────────────────────────────────────┐`);
  if (dashboardData.api.endpoints) {
    dashboardData.api.endpoints.forEach(endpoint => {
      const statusIcon = endpoint.status === 'up' ? status.up : status.down;
      const info = endpoint.responseTime || endpoint.error || '';
      console.log(`│ ${statusIcon} ${endpoint.name.padEnd(15)} ${info}`.padEnd(71) + '│');
    });
  }
  console.log(`└─────────────────────────────────────────────────────────────┘\n`);
  
  // Business Metrics
  if (!dashboardData.business.error) {
    console.log(`${colors.bold}📈 BUSINESS METRICS${colors.reset}`);
    console.log(`┌─────────────────────────────────────────────────────────────┐`);
    console.log(`│ Active Advisors:      ${String(dashboardData.business.activeAdvisors).padEnd(38)}│`);
    console.log(`│ Messages Delivered:   ${String(dashboardData.business.messagesDelivered).padEnd(38)}│`);
    console.log(`│ Compliance Checks:    ${String(dashboardData.business.complianceChecks).padEnd(38)}│`);
    console.log(`│ Delivery Rate:        ${dashboardData.business.deliveryRate.padEnd(38)}│`);
    console.log(`│ Avg Response Time:    ${dashboardData.business.avgResponseTime.padEnd(38)}│`);
    console.log(`└─────────────────────────────────────────────────────────────┘\n`);
  }
  
  // Configuration Status
  console.log(`${colors.bold}⚙️  CONFIGURATION STATUS${colors.reset}`);
  console.log(`┌─────────────────────────────────────────────────────────────┐`);
  displayConfig('OpenAI API', process.env.OPENAI_API_KEY);
  displayConfig('WhatsApp API', process.env.WHATSAPP_ACCESS_TOKEN);
  displayConfig('Razorpay', process.env.RAZORPAY_KEY_ID);
  displayConfig('Database URL', process.env.DATABASE_URL);
  console.log(`└─────────────────────────────────────────────────────────────┘\n`);
  
  // Quick Actions
  console.log(`${colors.bold}⚡ QUICK ACTIONS${colors.reset}`);
  console.log(`┌─────────────────────────────────────────────────────────────┐`);
  console.log(`│ [1] Run Setup Verification    node verify-setup.js         │`);
  console.log(`│ [2] Test API Integration       node test-api-integration.js │`);
  console.log(`│ [3] Test WhatsApp              node test-whatsapp-api.js   │`);
  console.log(`│ [4] Seed Demo Data             node seed-demo-data.js      │`);
  console.log(`│ [Q] Quit Dashboard                                         │`);
  console.log(`└─────────────────────────────────────────────────────────────┘`);
  
  // Footer
  console.log(`\n${colors.dim}Press Ctrl+C to exit. Dashboard refreshes every 5 seconds.${colors.reset}`);
}

// Helper function to display service status
function displayService(name, service) {
  const statusIcon = service?.status === 'running' || service?.status === 'connected' ? status.up : status.down;
  const port = service?.port ? `:${service.port}` : '';
  const extra = service?.users !== undefined ? ` (${service.users} users)` : '';
  const info = `${port}${extra}`;
  console.log(`│ ${statusIcon} ${name.padEnd(15)} ${service?.status || 'unknown'} ${info}`.padEnd(71) + '│');
}

// Helper function to display config status
function displayConfig(name, value) {
  const configured = value && !value.includes('your-');
  const statusIcon = configured ? status.up : status.warning;
  const statusText = configured ? 'Configured' : 'Not configured';
  console.log(`│ ${statusIcon} ${name.padEnd(15)} ${statusText}`.padEnd(71) + '│');
}

// Helper function to get status icon
function getStatusIcon(status) {
  switch(status) {
    case 'healthy':
    case 'normal':
      return `${colors.green}✓${colors.reset}`;
    case 'warning':
      return `${colors.yellow}⚠${colors.reset}`;
    case 'critical':
    case 'high':
      return `${colors.red}✗${colors.reset}`;
    default:
      return '';
  }
}

// Main dashboard loop
async function runDashboard() {
  while (true) {
    try {
      await checkSystemResources();
      await checkServices();
      await checkAPIEndpoints();
      await getBusinessMetrics();
      displayDashboard();
      
      // Wait 5 seconds before refresh
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Dashboard error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down dashboard...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start dashboard
console.log('Starting Jarvish System Dashboard...');
runDashboard().catch(console.error);