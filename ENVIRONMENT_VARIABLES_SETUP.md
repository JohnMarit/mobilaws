# Environment Variables Setup Guide

## 📋 Overview

You need to set up environment variables in **TWO places**:

1. **Local Development** → `.env` file in `ai-backend/` folder
2. **Production (Vercel)** → Vercel Dashboard → Environment Variables

---

## 🖥️ Local Development Setup

### Step 1: Create `.env` File

Create a file called `.env` in the `ai-backend/` folder:

```bash
# Navigate to backend folder
cd ai-backend

# Create .env file (Windows PowerShell)
New-Item -Path .env -ItemType File

# Or create it manually in your code editor
```

### Step 2: Add Environment Variables

Copy this template into your `.env` file and fill in your values:

```bash
# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=development
PORT=8000
TZ=Africa/Juba

# ===========================================
# OPENAI API (REQUIRED)
# ===========================================
OPENAI_API_KEY=sk-proj-your_actual_openai_key_here
LLM_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-large
TEMPERATURE=0.1
MAX_TOKENS=1024

# ===========================================
# VECTOR STORE
# ===========================================
VECTOR_BACKEND=chroma
CHROMA_DIR=./storage/chroma
DOCS_DIR=./storage/documents

# ===========================================
# CORS ORIGINS (Local Development)
# ===========================================
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ===========================================
# DODO PAYMENTS (TEST MODE for Local)
# ===========================================
# Use TEST mode for local development!
DODO_PAYMENTS_ENVIRONMENT=test
DODO_PAYMENTS_API_KEY=dodo_test_your_test_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here

# Test Product IDs (from Dodo dashboard - TEST mode)
DODO_PAYMENTS_PRODUCT_BASIC=prod_test_basic_id
DODO_PAYMENTS_PRODUCT_STANDARD=prod_test_standard_id
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_test_premium_id

# ===========================================
# FRONTEND URL (Local Development)
# ===========================================
FRONTEND_URL=http://localhost:5173

# ===========================================
# ADMIN CONFIGURATION
# ===========================================
ADMIN_EMAILS=thuchabraham42@gmail.com

# ===========================================
# LLM PARAMETERS
# ===========================================
TOP_K=5
CHUNK_SIZE=1000
CHUNK_OVERLAP=150
```

### Step 3: Get Your Test Credentials

For **local development**, use **TEST mode** credentials:

1. Go to https://dashboard.dodopayments.com
2. Switch to **Test Mode** (toggle in dashboard)
3. Get your **Test API Key** (starts with `dodo_test_`)
4. Get your **Test Product IDs** (create test products if needed)
5. Get your **Test Webhook Secret**

---

## ☁️ Production Setup (Vercel)

### Step 1: Go to Vercel Dashboard

1. Visit https://vercel.com/dashboard
2. Find your **backend project** (not frontend)
3. Click **Settings** → **Environment Variables**

### Step 2: Add Production Environment Variables

Add these variables (use **LIVE mode** values):

```bash
# Server
NODE_ENV=production
PORT=8000
TZ=Africa/Juba

# OpenAI (same as local)
OPENAI_API_KEY=sk-proj-your_actual_openai_key_here
LLM_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-large
TEMPERATURE=0.1
MAX_TOKENS=1024

# Vector Store
VECTOR_BACKEND=chroma
CHROMA_DIR=./storage/chroma
DOCS_DIR=./storage/documents

# CORS (Production URLs)
CORS_ORIGINS=https://mobilaws.com,https://www.mobilaws.com

# DODO PAYMENTS (LIVE MODE for Production)
DODO_PAYMENTS_ENVIRONMENT=live
DODO_PAYMENTS_API_KEY=dodo_live_your_live_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here

# Production Product IDs (from Dodo dashboard - LIVE mode)
DODO_PAYMENTS_PRODUCT_BASIC=prod_live_basic_id
DODO_PAYMENTS_PRODUCT_STANDARD=prod_live_standard_id
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_live_premium_id

# Frontend URL (Production)
FRONTEND_URL=https://mobilaws.com

# Admin
ADMIN_EMAILS=thuchabraham42@gmail.com

# LLM Parameters
TOP_K=5
CHUNK_SIZE=1000
CHUNK_OVERLAP=150
```

### Step 3: Select Environments

For each variable, select:
- ✅ **Production**
- ✅ **Preview** (optional)
- ✅ **Development** (optional)

### Step 4: Redeploy

After adding variables, **redeploy** your backend:
- Go to **Deployments** tab
- Click **"..."** on latest deployment
- Click **"Redeploy"**

---

## 🔑 Key Differences: Local vs Production

| Setting | Local Development (.env) | Production (Vercel) |
|---------|-------------------------|---------------------|
| **Dodo Environment** | `test` | `live` |
| **Dodo API Key** | `dodo_test_...` | `dodo_live_...` |
| **Product IDs** | Test product IDs | Live product IDs |
| **Frontend URL** | `http://localhost:5173` | `https://mobilaws.com` |
| **CORS Origins** | `http://localhost:5173` | `https://mobilaws.com` |
| **Node Environment** | `development` | `production` |

---

## ✅ Quick Checklist

### Local Development
- [ ] Created `.env` file in `ai-backend/` folder
- [ ] Added all required variables
- [ ] Using **TEST mode** for Dodo Payments
- [ ] Using `localhost` URLs
- [ ] `.env` file is in `.gitignore` (never commit it!)

### Production (Vercel)
- [ ] Added all environment variables in Vercel dashboard
- [ ] Using **LIVE mode** for Dodo Payments
- [ ] Using production URLs (`https://mobilaws.com`)
- [ ] Selected "Production" environment for all variables
- [ ] Redeployed backend after adding variables

---

## 🚨 Important Security Notes

1. **NEVER commit `.env` file** to Git
   - It should be in `.gitignore`
   - Only commit `.env.example` (template with no real secrets)

2. **Use different keys for test vs production**
   - Test keys: Safe to use locally
   - Live keys: Only in Vercel, never in code

3. **Rotate keys if exposed**
   - If you accidentally commit a key, rotate it immediately
   - Generate new keys in Dodo Payments dashboard

---

## 🆘 Troubleshooting

### "OPENAI_API_KEY is required"
→ Add `OPENAI_API_KEY` to your `.env` file

### "Dodo Payments API key not configured"
→ Add `DODO_PAYMENTS_API_KEY` to your `.env` (test mode) or Vercel (live mode)

### "Product ID not configured"
→ Add `DODO_PAYMENTS_PRODUCT_BASIC/STANDARD/PREMIUM` to environment variables

### "CORS error" in production
→ Update `CORS_ORIGINS` in Vercel to include your production domain

---

## 📚 Related Documentation

- `QUICK_DEPLOYMENT_GUIDE.md` - Quick production setup
- `DODO_PAYMENTS_LIVE_MODE_SETUP.md` - Detailed Dodo Payments setup
- `PAYMENT_IMPLEMENTATION_COMPLETE.md` - Complete payment system docs

---

**Need help?** Check your backend logs or Vercel deployment logs for specific error messages!

