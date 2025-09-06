#!/bin/bash

# Jarvish Vercel Deployment Script
# This script prepares and deploys the application to Vercel with Supabase integration

echo "🚀 Jarvish Vercel Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${RED}Error: Please run this script from the project-one directory${NC}"
    exit 1
fi

# Step 1: Check for Vercel CLI
echo -e "\n${YELLOW}Step 1: Checking Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm i -g vercel
else
    echo -e "${GREEN}✓ Vercel CLI is installed${NC}"
fi

# Step 2: Check environment variables
echo -e "\n${YELLOW}Step 2: Checking environment configuration...${NC}"
if [ ! -f "apps/web/.env.production" ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Creating from template..."
    cp apps/web/.env.example apps/web/.env.production
    echo -e "${YELLOW}Please update apps/web/.env.production with your credentials${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Environment configuration found${NC}"

# Step 3: Install dependencies
echo -e "\n${YELLOW}Step 3: Installing dependencies...${NC}"
cd apps/web
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 4: Run type checks
echo -e "\n${YELLOW}Step 4: Running type checks...${NC}"
npm run type-check
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Warning: Type check failed. Fix errors before deploying to production${NC}"
fi

# Step 5: Build the application
echo -e "\n${YELLOW}Step 5: Building the application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Step 6: Create Supabase migration script
echo -e "\n${YELLOW}Step 6: Preparing Supabase migrations...${NC}"
cat << 'EOF' > supabase-setup.md
# Supabase Setup Instructions

## 1. Run Migrations
Go to your Supabase SQL Editor and run the following migrations in order:

1. First, run: `supabase/migrations/001_whatsapp_consent.sql`
2. Then, run: `supabase/migrations/002_jarvish_complete_schema.sql`

## 2. Enable Row Level Security
Run this SQL to enable RLS on all tables:
```sql
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
```

## 3. Get Service Role Key
1. Go to Settings > API in Supabase dashboard
2. Copy the "service_role" key (NOT the anon key)
3. Add it to Vercel environment variables as SUPABASE_SERVICE_ROLE_KEY

## 4. Configure Auth
1. Go to Authentication > Providers
2. Enable Email provider
3. Configure redirect URLs:
   - Site URL: https://your-app.vercel.app
   - Redirect URLs: https://your-app.vercel.app/auth/callback
EOF
echo -e "${GREEN}✓ Supabase setup instructions created${NC}"

# Step 7: Deploy to Vercel
echo -e "\n${YELLOW}Step 7: Deploying to Vercel...${NC}"
echo -e "${YELLOW}Please follow these steps:${NC}"
echo "1. Run: vercel --prod"
echo "2. Follow the prompts to link your project"
echo "3. Select 'Mumbai (bom1)' region when asked"
echo "4. Configure environment variables in Vercel dashboard"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment preparation complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Run 'vercel --prod' to deploy"
echo "2. Configure environment variables in Vercel dashboard:"
echo "   - Copy all variables from apps/web/.env.production"
echo "   - Add SUPABASE_SERVICE_ROLE_KEY from Supabase dashboard"
echo "3. Run Supabase migrations (see supabase-setup.md)"
echo "4. Update webhook URLs:"
echo "   - WhatsApp: https://your-domain.vercel.app/api/webhooks/whatsapp/advanced"
echo "   - Razorpay: https://your-domain.vercel.app/api/webhooks/razorpay"
echo "5. Test the deployment:"
echo "   - Health check: https://your-domain.vercel.app/api/monitoring?type=health"

echo -e "\n${YELLOW}Important URLs:${NC}"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Supabase Dashboard: https://app.supabase.com"
echo "- Production App: https://your-domain.vercel.app"