# 🚀 Complete Vercel Backend Deployment Guide

## ✅ Code Changes Completed

I've updated your backend code to be fully ready for Vercel deployment:

### Changes Made:

1. ✅ **Added users router** to `ai-backend/api/index.ts`
2. ✅ **Updated vercel.json** with proper serverless configuration
3. ✅ **Updated endpoint documentation** in root endpoint

---

## 📋 Step-by-Step Deployment

### Step 1: Verify Code Changes

The following files have been updated:
- ✅ `ai-backend/api/index.ts` - Now includes users router
- ✅ `ai-backend/vercel.json` - Proper Vercel serverless config

### Step 2: Deploy via Vercel Dashboard (Recommended)

#### 2.1: Create New Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"** or **"New Project"**
3. **Import your GitHub repository**
   - Select your `Mobilaws` repository
   - Click **"Import"**

#### 2.2: Configure Project Settings

**IMPORTANT:** Configure these settings:

```
Project Name: mobilaws-backend
  (or any name you prefer)

Framework Preset: Other
  (or leave as "Other")

Root Directory: ai-backend
  ⚠️ CRITICAL: Click "Edit" and set to: ai-backend

Build Command: (leave empty)
  Vercel will auto-detect TypeScript

Output Directory: (leave empty)

Install Command: npm install
  (default is fine)

Development Command: (leave empty)
```

#### 2.3: Add Environment Variables

**Before clicking "Deploy"**, click **"Environment Variables"** and add:

```bash
# Server Configuration
NODE_ENV=production
PORT=8000
TZ=Africa/Juba

# OpenAI (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here

# CORS Configuration (REQUIRED - Use your frontend URL)
FRONTEND_URL=https://mobilaws.vercel.app
CORS_ORIGINS=https://mobilaws.vercel.app

# Admin Configuration (REQUIRED)
ADMIN_EMAILS=thuchabraham42@gmail.com

# Email Service (Optional but recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=thuchabraham42@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@mobilaws.com

# LLM Configuration
LLM_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-large
TEMPERATURE=0.1
MAX_TOKENS=1024

# Vector Store (Optional - defaults to Chroma)
VECTOR_BACKEND=chroma
CHROMA_DIR=./storage/chroma
DOCS_DIR=./storage/documents

# Stripe (Optional - only if using payments)
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

**Important Notes:**
- Replace `your_openai_api_key_here` with your actual OpenAI API key
- Replace `https://mobilaws.vercel.app` with your actual frontend URL
- Replace `your_gmail_app_password` with your Gmail app password (if using email)
- Add all variables for **Production** environment (check the dropdown)

#### 2.4: Deploy

1. Click **"Deploy"** button
2. Wait for deployment to complete (2-5 minutes)
3. Vercel will show you the deployment URL

#### 2.5: Get Your Backend URL

After deployment, you'll see:
```
✅ Deployment successful!
🌐 https://mobilaws-backend.vercel.app
```

**Copy this URL!** You'll need it for the frontend.

---

### Step 3: Update Frontend Configuration

#### 3.1: Go to Frontend Vercel Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **frontend project** (Mobilaws)
3. Go to **Settings** → **Environment Variables**

#### 3.2: Add/Update Backend URL

Add or update this variable:

```
Name: VITE_API_URL
Value: https://mobilaws-backend.vercel.app/api
```

**Important:**
- Use your actual backend URL from Step 2.5
- Make sure it ends with `/api`
- Select **Production** environment
- Click **"Save"**

#### 3.3: Redeploy Frontend

1. Go to **Deployments** tab
2. Click **"⋯"** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger auto-deploy

---

### Step 4: Verify Deployment

#### 4.1: Test Backend Health Check

Open in browser:
```
https://mobilaws-backend.vercel.app/healthz
```

**Expected Response:**
```json
{"status": "ok"}
```

#### 4.2: Test Root Endpoint

Open in browser:
```
https://mobilaws-backend.vercel.app/
```

**Expected Response:**
```json
{
  "name": "Mobilaws AI Backend",
  "version": "1.0.0",
  "status": "running",
  "endpoints": [...]
}
```

#### 4.3: Test User Sync

1. Go to your frontend: `https://mobilaws.vercel.app`
2. Sign in with Google
3. Open browser console (F12)
4. Look for:
   ```
   📡 Syncing user to backend for admin panel: https://mobilaws-backend.vercel.app/api/users/sync
   ✅ User synced to backend successfully!
   ```

#### 4.4: Test Admin Panel

1. Go to: `https://mobilaws.vercel.app/admin/login`
2. Sign in with admin Google account
3. Click **"Users"** tab
4. Users should appear!

---

## 🔧 Alternative: Deploy via CLI

If you prefer using the command line:

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### Step 3: Navigate to Backend Directory

```bash
cd ai-backend
```

### Step 4: Deploy

```bash
vercel --prod
```

**Answer the prompts:**

```
? Set up and deploy "~/Desktop/Mobilaws/ai-backend"? [Y/n] y
? Which scope? (Select your account)
? Link to existing project? [y/N] n
? What's your project's name? mobilaws-backend
? In which directory is your code located? ./
```

### Step 5: Set Environment Variables

```bash
vercel env add OPENAI_API_KEY production
# Paste your OpenAI API key when prompted

vercel env add FRONTEND_URL production
# Enter: https://mobilaws.vercel.app

vercel env add CORS_ORIGINS production
# Enter: https://mobilaws.vercel.app

vercel env add ADMIN_EMAILS production
# Enter: thuchabraham42@gmail.com

# Add more variables as needed...
```

### Step 6: Get Deployment URL

After deployment, Vercel will show:
```
✅ Production: https://mobilaws-backend.vercel.app
```

---

## ⚠️ Important Notes

### Vercel Serverless Limitations

1. **Function Timeout:**
   - Hobby plan: 10 seconds
   - Pro plan: 60 seconds
   - ⚠️ Long-running AI operations may timeout

2. **No Persistent Storage:**
   - In-memory storage (Map) resets on cold start
   - ⚠️ Users will need to re-sync after cold starts
   - 💡 Solution: Use "Sync from Firestore" button

3. **Cold Starts:**
   - First request after inactivity may be slow (2-5 seconds)
   - Subsequent requests are fast

4. **File Upload Limits:**
   - 4.5 MB limit on Hobby plan
   - 50 MB limit on Pro plan

### For Production Use

**Consider these alternatives for better performance:**

1. **Railway** - Better for long-running processes
2. **Render** - Good balance of features
3. **Fly.io** - Fast cold starts
4. **AWS/GCP** - Full control

**But Vercel works great for:**
- ✅ User sync
- ✅ Admin panel
- ✅ API endpoints
- ✅ Quick deployments

---

## 🐛 Troubleshooting

### Issue 1: "Module not found" Error

**Problem:** TypeScript imports not resolving

**Solution:**
1. Check `tsconfig.json` includes `api/**/*`
2. Verify all dependencies in `package.json`
3. Check Vercel build logs

### Issue 2: "CORS Error"

**Problem:** Frontend can't connect to backend

**Solution:**
1. Verify `CORS_ORIGINS` includes your frontend URL
2. Check `FRONTEND_URL` is set correctly
3. Make sure URLs match exactly (no trailing slashes)

### Issue 3: "Environment variable not found"

**Problem:** Missing required env vars

**Solution:**
1. Check all required variables are set in Vercel
2. Make sure they're set for **Production** environment
3. Redeploy after adding variables

### Issue 4: "Function timeout"

**Problem:** Request takes too long

**Solution:**
1. Upgrade to Vercel Pro (60s timeout)
2. Optimize your code
3. Consider using Railway for long operations

### Issue 5: "Users not syncing"

**Problem:** User sync endpoint not working

**Solution:**
1. Check backend URL is correct in `VITE_API_URL`
2. Verify backend is deployed and accessible
3. Check browser console for errors
4. Test backend directly: `https://your-backend.vercel.app/healthz`

---

## 📊 Deployment Checklist

### Before Deployment:

- [ ] ✅ Code updated (users router added)
- [ ] ✅ vercel.json configured
- [ ] ✅ GitHub repository connected
- [ ] ✅ All environment variables ready

### During Deployment:

- [ ] ✅ Root directory set to `ai-backend`
- [ ] ✅ All environment variables added
- [ ] ✅ Deployment successful
- [ ] ✅ Backend URL copied

### After Deployment:

- [ ] ✅ Health check works (`/healthz`)
- [ ] ✅ Root endpoint works (`/`)
- [ ] ✅ Frontend `VITE_API_URL` updated
- [ ] ✅ Frontend redeployed
- [ ] ✅ User sync tested
- [ ] ✅ Admin panel tested

---

## 🎯 Quick Reference

### Backend URL Format:
```
https://mobilaws-backend.vercel.app
```

### Frontend Environment Variable:
```
VITE_API_URL=https://mobilaws-backend.vercel.app/api
```

### Test Endpoints:
```
Health: https://your-backend.vercel.app/healthz
Root: https://your-backend.vercel.app/
Users Sync: https://your-backend.vercel.app/api/users/sync
```

---

## 🎉 Success!

After completing all steps:

✅ **Backend deployed to Vercel**  
✅ **Frontend connected to backend**  
✅ **User sync working**  
✅ **Admin panel functional**  
✅ **All previous users can be synced**  

**Your app is now fully deployed!** 🚀

---

## 📚 Related Guides

- **BULK_USER_SYNC_GUIDE.md** - How to sync previous users
- **PRODUCTION_FIX_GUIDE.md** - General deployment guide
- **USER_SYNC_COMPLETE_GUIDE.md** - User tracking overview

---

## 🆘 Need Help?

If deployment fails:

1. Check Vercel build logs
2. Verify all environment variables
3. Test backend URL directly
4. Check browser console for errors
5. Review troubleshooting section above

**Common Issues:**
- Missing environment variables
- Wrong root directory
- CORS configuration
- TypeScript compilation errors

---

**Ready to deploy? Follow the steps above!** 🚀

