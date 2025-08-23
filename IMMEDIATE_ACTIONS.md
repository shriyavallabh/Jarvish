# ⚡ IMMEDIATE ACTIONS - Execute Now

## 🚀 DAY 0 ACTIONS (Execute Immediately)

### **STEP 1: Backend Project Setup** (15 minutes)
```bash
# Navigate to project root
cd /Users/shriyavallabh/Desktop/Jarvish/project-one

# Create backend structure
mkdir -p apps/backend
cd apps/backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express cors helmet dotenv morgan bcryptjs jsonwebtoken
npm install @prisma/client prisma postgres redis ioredis
npm install bull bullmq openai axios zod
npm install --save-dev nodemon typescript @types/node @types/express ts-node

# Create basic project structure
mkdir -p src/{routes,controllers,middleware,services,utils,types}
mkdir -p src/{ai,compliance,whatsapp,analytics}
mkdir -p prisma config tests
```

### **STEP 2: Database Infrastructure** (20 minutes)
```bash
# Start PostgreSQL (Docker)
docker run --name jarvish-postgres \
  -e POSTGRES_DB=jarvish_db \
  -e POSTGRES_USER=jarvish_user \
  -e POSTGRES_PASSWORD=secure_password_123 \
  -p 5432:5432 \
  -d postgres:15-alpine

# Start Redis (Docker)
docker run --name jarvish-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# Initialize Prisma
npx prisma init

# Verify connections
docker ps  # Should show both containers running
```

### **STEP 3: Environment Setup** (10 minutes)
```bash
# Create .env file
cat > .env << EOF
# Database
DATABASE_URL="postgresql://jarvish_user:secure_password_123@localhost:5432/jarvish_db"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your_super_secure_jwt_secret_key_here"
JWT_EXPIRE="7d"

# OpenAI
OPENAI_API_KEY="sk-your-openai-key-here"

# WhatsApp Business
WHATSAPP_BUSINESS_API_TOKEN=""
WHATSAPP_BUSINESS_PHONE_ID=""
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your_webhook_verify_token"

# App Config
NODE_ENV="development"
PORT=8000
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window
EOF
```

### **STEP 4: Basic Backend Server** (25 minutes)
```bash
# Create main server file
cat > src/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
app.use('/api/v1', (req, res) => {
  res.json({ message: 'Jarvish API v1 - Coming Soon' });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Jarvish Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
EOF

# Create package.json scripts
npm pkg set scripts.dev="nodemon --exec ts-node src/server.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/server.js"

# Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
```

---

## 🎯 DAY 1 ACTIONS

### **STEP 5: Frontend State Management** (30 minutes)
```bash
# Navigate to frontend
cd ../web

# Install state management dependencies
npm install zustand axios @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install @radix-ui/react-toast sonner

# Create state store
mkdir -p lib/store
cat > lib/store/auth-store.ts << 'EOF'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  tier: 'basic' | 'standard' | 'pro';
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // TODO: Implement API call
          console.log('Login:', email);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({ user: null, token: null });
      },
      
      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
EOF
```

### **STEP 6: API Client Setup** (20 minutes)
```bash
# Create API client
mkdir -p lib/api
cat > lib/api/client.ts << 'EOF'
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
EOF
```

---

## 🔥 DAY 2-3 CRITICAL ACTIONS

### **STEP 7: Database Schema** (45 minutes)
```bash
cd ../backend

# Create Prisma schema
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String
  passwordHash    String
  tier            Tier     @default(BASIC)
  isVerified      Boolean  @default(false)
  arnNumber       String?  // ARN/RIA registration
  companyName     String?
  whatsappNumber  String?
  languagePrefs   String[] @default(["en"])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  contents        Content[]
  analytics       Analytics[]
  subscriptions   Subscription[]
  
  @@map("users")
}

model Content {
  id              String        @id @default(cuid())
  userId          String
  title           String
  body            String
  language        String        @default("en")
  contentType     ContentType   @default(WHATSAPP)
  status          ContentStatus @default(DRAFT)
  complianceScore Float?
  complianceIssues Json?
  scheduledFor    DateTime?
  deliveredAt     DateTime?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  user            User          @relation(fields: [userId], references: [id])
  
  @@map("contents")
}

model Analytics {
  id              String   @id @default(cuid())
  userId          String
  eventType       String   // 'content_created', 'message_sent', 'login', etc.
  eventData       Json
  timestamp       DateTime @default(now())
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  
  @@map("analytics")
}

model Subscription {
  id              String           @id @default(cuid())
  userId          String
  tier            Tier
  status          SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  // Relations
  user            User             @relation(fields: [userId], references: [id])
  
  @@map("subscriptions")
}

enum Tier {
  BASIC
  STANDARD
  PRO
}

enum ContentType {
  WHATSAPP
  STATUS
  LINKEDIN
  EMAIL
}

enum ContentStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SENT
  FAILED
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
}
EOF

# Generate Prisma client and run migrations
npx prisma generate
npx prisma db push
```

### **STEP 8: Start Both Servers** (5 minutes)
```bash
# Terminal 1: Start backend
cd apps/backend
npm run dev

# Terminal 2: Start frontend (already running)
cd apps/web
npm run dev
```

---

## 🎯 CRITICAL CHECKPOINTS

### **End of Day 0 Checklist**:
- [ ] Backend server running on port 8000
- [ ] PostgreSQL + Redis containers running
- [ ] Environment variables configured
- [ ] Basic API health check responding

### **End of Day 1 Checklist**:
- [ ] Frontend state management working
- [ ] API client configured
- [ ] Database schema deployed
- [ ] Both servers communicating

### **End of Day 3 Checklist**:
- [ ] User authentication implemented
- [ ] Content creation API working
- [ ] Basic compliance checking integrated
- [ ] WhatsApp API research completed

---

## 🚨 CRITICAL EXTERNAL SETUPS (Start Immediately)

### **1. WhatsApp Business API Setup**
```bash
# Required accounts:
# 1. Facebook Business Manager account
# 2. WhatsApp Business Account
# 3. Meta Developer Account

# Steps (can take 2-5 days):
1. Create Facebook Business Manager
2. Set up WhatsApp Business Account
3. Apply for WhatsApp Business API access
4. Complete business verification
5. Set up webhook endpoints
```

### **2. OpenAI API Setup**
```bash
# Get API key from: https://platform.openai.com/api-keys
# Add to .env:
OPENAI_API_KEY="sk-your-key-here"

# Test with:
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello"}]}'
```

### **3. AWS Account Setup (ap-south-1)**
```bash
# Required for:
# - Production deployment
# - RDS PostgreSQL
# - ElastiCache Redis  
# - CloudWatch monitoring
# - S3 for file storage

# Estimate: $200-500/month for MVP scale
```

---

## 📞 IMMEDIATE SUPPORT CONTACTS

**Technical Issues**: Claude Code assistance available
**WhatsApp Business**: Meta Business Support
**OpenAI API**: OpenAI Support portal
**AWS Setup**: AWS Support (if needed)

---

This immediate action plan gives you everything needed to start building today. Execute Day 0 actions immediately, then follow the daily progression to have a functional MVP in 6-8 weeks.