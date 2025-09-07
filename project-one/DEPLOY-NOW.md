# 🚀 Deploy to Vercel - Quick Instructions

## Option 1: Via GitHub (Recommended)

### Step 1: Push to GitHub
```bash
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to: https://vercel.com/new
2. Sign in with email: shriyavallabh.ap@gmail.com
3. Click "Import Git Repository"
4. Select your GitHub repository
5. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: `project-one/apps/web`
   - Build Command: `npm run build`
   - Install Command: `npm install --legacy-peer-deps`

### Step 3: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

```env
# REQUIRED - Already have values
NEXT_PUBLIC_SUPABASE_URL=https://jqvyrtoohlwiivsronzo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdnlydG9vaGx3aWl2c3JvbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTQ2MTYsImV4cCI6MjA3MTE5MDYxNn0.QRiWtn4MKvo5bfDFNlSthz6eYBLaA4qkAEqSn1cmYgY
DATABASE_URL=postgresql://postgres.jqvyrtoohlwiivsronzo:Hubix@316572@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

# GET FROM SUPABASE DASHBOARD
SUPABASE_SERVICE_ROLE_KEY=[Settings → API → service_role key]

# ADD YOUR API KEYS
OPENAI_API_KEY=[Your OpenAI key]
GOOGLE_GEMINI_API_KEY=[Your Gemini key]
WHATSAPP_ACCESS_TOKEN=[Your WhatsApp token]
```

### Step 4: Deploy
Click "Deploy" and wait ~2-3 minutes

---

## Option 2: Via Vercel CLI

### Step 1: Login to Vercel
```bash
vercel login
# Choose: Continue with Email
# Enter: shriyavallabh.ap@gmail.com
# Check email for verification
```

### Step 2: Deploy
```bash
cd project-one/apps/web
vercel --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- What's your project's name? **jarvish-platform**
- In which directory? **./**
- Want to modify settings? **N**

---

## Option 3: Direct Upload

1. Go to: https://vercel.com/import
2. Sign in with: shriyavallabh.ap@gmail.com
3. Drag and drop the `project-one/apps/web` folder
4. Add environment variables from above
5. Deploy

---

## ✅ After Deployment

### 1. Set up Supabase Database
Go to Supabase SQL Editor and run:
1. `/supabase/migrations/001_whatsapp_consent.sql`
2. `/supabase/migrations/002_jarvish_complete_schema.sql`

### 2. Test Your App
- Main: `https://your-app.vercel.app`
- Health: `https://your-app.vercel.app/api/monitoring?type=health`

### 3. Configure Webhooks
- WhatsApp: `https://your-app.vercel.app/api/webhooks/whatsapp/advanced`
- Verify Token: `jarvish_webhook_2024`

---

## 📱 Support
Email: shriyavallabh.ap@gmail.com

**Your app is ready to deploy! The build is already complete in `.next` folder.**