# JARVISH PRODUCTION DEPLOYMENT GUIDE
## Complete Step-by-Step Instructions for Production Launch

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **Environment Requirements**
- [ ] **Server**: Ubuntu 22.04 LTS / AWS EC2 t3.xlarge minimum
- [ ] **Node.js**: v18.17.0 or higher
- [ ] **PostgreSQL**: v15.0 with SSL enabled
- [ ] **Redis**: v7.0 for caching and queues
- [ ] **Nginx**: Latest stable for reverse proxy
- [ ] **SSL**: Let's Encrypt certificates configured
- [ ] **Domain**: jarvish.ai configured with DNS

### **Required Accounts & Credentials**
- [ ] **AWS Account**: For hosting and services
- [ ] **WhatsApp Business**: Cloud API access approved
- [ ] **Razorpay**: Production KYC completed
- [ ] **OpenAI**: Production API key with billing
- [ ] **Clerk**: Production instance configured
- [ ] **Supabase**: Production project created
- [ ] **Monitoring**: DataDog/New Relic account

---

## 🚀 **DEPLOYMENT STEPS**

### **Step 1: Server Setup (Day 1)**

```bash
# 1.1 Update system
sudo apt update && sudo apt upgrade -y

# 1.2 Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 1.3 Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 1.4 Install Redis
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 1.5 Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# 1.6 Install PM2 for process management
sudo npm install -g pm2

# 1.7 Install Git
sudo apt install git -y
```

### **Step 2: Database Setup**

```sql
-- 2.1 Create production database
sudo -u postgres psql

CREATE DATABASE jarvish_production;
CREATE USER jarvish_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE jarvish_production TO jarvish_user;
ALTER DATABASE jarvish_production OWNER TO jarvish_user;

-- 2.2 Enable required extensions
\c jarvish_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\q
```

### **Step 3: Application Deployment**

```bash
# 3.1 Clone repository
cd /var/www
sudo git clone https://github.com/your-org/jarvish.git
cd jarvish/project-one

# 3.2 Install dependencies
cd apps/web
npm ci --production
npm run build

cd ../backend
npm ci --production
npm run build

# 3.3 Run database migrations
npx prisma migrate deploy

# 3.4 Seed initial data
npx prisma db seed
```

### **Step 4: Environment Configuration**

Create `/var/www/jarvish/project-one/apps/web/.env.production`:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://jarvish.ai

# Database
DATABASE_URL=postgresql://jarvish_user:password@localhost:5432/jarvish_production
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_ORG_ID=org-xxx
OPENAI_MODEL=gpt-4o-mini

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEW_RELIC_LICENSE_KEY=xxx
DATADOG_API_KEY=xxx

# Security
SESSION_SECRET=xxx
ENCRYPTION_KEY=xxx
JWT_SECRET=xxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_AI_CONTENT=true
ENABLE_WHATSAPP=true
ENABLE_PAYMENTS=true
MAINTENANCE_MODE=false
```

### **Step 5: Nginx Configuration**

Create `/etc/nginx/sites-available/jarvish`:

```nginx
upstream jarvish_web {
    server localhost:3000;
    keepalive 64;
}

upstream jarvish_api {
    server localhost:8000;
    keepalive 64;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

server {
    listen 80;
    server_name jarvish.ai www.jarvish.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jarvish.ai www.jarvish.ai;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/jarvish.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jarvish.ai/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline';" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Logging
    access_log /var/log/nginx/jarvish_access.log;
    error_log /var/log/nginx/jarvish_error.log;

    # Frontend
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://jarvish_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # API
    location /api {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://jarvish_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
    }

    # WhatsApp Webhook
    location /webhook/whatsapp {
        proxy_pass http://jarvish_api/webhook/whatsapp;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### **Step 6: Process Management with PM2**

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'jarvish-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/jarvish/project-one/apps/web',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/jarvish-web-error.log',
      out_file: '/var/log/pm2/jarvish-web-out.log',
      log_file: '/var/log/pm2/jarvish-web-combined.log',
      time: true
    },
    {
      name: 'jarvish-api',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/jarvish/project-one/apps/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      error_file: '/var/log/pm2/jarvish-api-error.log',
      out_file: '/var/log/pm2/jarvish-api-out.log',
      log_file: '/var/log/pm2/jarvish-api-combined.log',
      time: true
    },
    {
      name: 'jarvish-scheduler',
      script: 'npm',
      args: 'run scheduler',
      cwd: '/var/www/jarvish/project-one/apps/backend',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      cron_restart: '0 5 * * *', // Restart daily at 5 AM
      error_file: '/var/log/pm2/jarvish-scheduler-error.log',
      out_file: '/var/log/pm2/jarvish-scheduler-out.log',
      time: true
    }
  ]
};
```

Start applications:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **Step 7: SSL Certificate Setup**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d jarvish.ai -d www.jarvish.ai

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 📊 **MONITORING SETUP**

### **1. Application Monitoring (New Relic)**

```javascript
// Add to app startup
require('newrelic');
```

### **2. Log Aggregation (ELK Stack)**

```bash
# Install Elasticsearch
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
sudo apt-get install elasticsearch logstash kibana -y
```

### **3. Health Checks**

Create `/api/health` endpoint:
```javascript
app.get('/api/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'healthy',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      whatsapp: await checkWhatsApp()
    }
  };
  res.json(health);
});
```

### **4. Alerting Rules**

Configure alerts for:
- CPU usage > 80%
- Memory usage > 90%
- Error rate > 1%
- Response time > 3s
- WhatsApp delivery < 98%

---

## 🔒 **SECURITY HARDENING**

### **1. Firewall Configuration**

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### **2. Fail2ban Setup**

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **3. Database Security**

```sql
-- Restrict connections
ALTER SYSTEM SET listen_addresses = 'localhost';
ALTER SYSTEM SET ssl = on;

-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'xxx';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
```

---

## 🔄 **BACKUP & RECOVERY**

### **1. Database Backup Script**

```bash
#!/bin/bash
# /usr/local/bin/backup-jarvish.sh

BACKUP_DIR="/backup/jarvish"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="jarvish_production"

# Database backup
pg_dump -U jarvish_user -d $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Application files backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/jarvish

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://jarvish-backups/db/
aws s3 cp $BACKUP_DIR/app_$DATE.tar.gz s3://jarvish-backups/app/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete
```

### **2. Cron Schedule**

```bash
# Add to crontab
0 2 * * * /usr/local/bin/backup-jarvish.sh
```

---

## 🚦 **DEPLOYMENT VALIDATION**

### **1. Smoke Tests**

```bash
# Test endpoints
curl -I https://jarvish.ai
curl https://jarvish.ai/api/health
curl -X POST https://jarvish.ai/api/auth/register -d '{...}'
```

### **2. Performance Validation**

```bash
# Run load test
artillery run load-tests/production-load-test.yml
```

### **3. Security Scan**

```bash
# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://jarvish.ai
```

---

## 📱 **WHATSAPP WEBHOOK CONFIGURATION**

1. Go to Meta Business Dashboard
2. Navigate to WhatsApp > Configuration
3. Set webhook URL: `https://jarvish.ai/webhook/whatsapp`
4. Set verify token from environment variable
5. Subscribe to messages and message_status events

---

## 💳 **RAZORPAY PRODUCTION SETUP**

1. Complete KYC verification
2. Get production API keys
3. Configure webhook endpoint: `https://jarvish.ai/api/payments/webhook`
4. Set webhook secret in environment
5. Test with ₹1 transaction

---

## 🔄 **ROLLBACK PROCEDURE**

If deployment fails:

```bash
# 1. Stop new version
pm2 stop all

# 2. Restore previous version
cd /var/www/jarvish
git checkout previous-tag

# 3. Restore database if needed
psql -U jarvish_user -d jarvish_production < backup.sql

# 4. Restart services
pm2 restart all

# 5. Verify health
curl https://jarvish.ai/api/health
```

---

## 📞 **SUPPORT & ESCALATION**

### **Monitoring Dashboard**
- URL: https://monitoring.jarvish.ai
- Username: admin
- Password: [secure password]

### **Critical Alerts Go To**
- Primary: DevOps Team
- Secondary: CTO
- Emergency: CEO

### **SLA Commitments**
- Uptime: 99.9%
- Response Time: <1.5s P95
- WhatsApp Delivery: 99% by 06:05 IST

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

- [ ] All health checks passing
- [ ] SSL certificate valid
- [ ] Monitoring dashboard active
- [ ] Backup script running
- [ ] Error tracking configured
- [ ] Rate limiting active
- [ ] Security headers present
- [ ] WhatsApp webhook verified
- [ ] Payment gateway tested
- [ ] Load test passed
- [ ] Documentation updated
- [ ] Team trained
- [ ] Support rotation scheduled

---

**Document Version**: 1.0
**Last Updated**: 2025-08-23
**Next Review**: Post-deployment

---

*This guide should be followed step-by-step for production deployment. Any deviations should be documented and approved by the technical lead.*