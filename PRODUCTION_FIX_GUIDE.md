# Production Error Fix Guide

## 🎯 Summary of Fixes Applied

All critical production errors have been fixed in the codebase:

### ✅ Fixed Issues

1. **Stripe CSP Violation** - Added Stripe domains to Content Security Policy
2. **useAuth Provider Error** - Removed duplicate AuthContext.tsx file
3. **Import Conflicts** - Updated all components to use FirebaseAuthContext

### 🔧 Remaining Configuration (Required)

You need to configure your **Vercel environment variables** for the production deployment to work:

---

## 🚀 Vercel Environment Setup

### Step 1: Access Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **Mobilaws** project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Required Environment Variables

Add the following variables:

#### Backend API URL (CRITICAL - Required)

```
Name: VITE_API_URL
Value: https://your-backend-url.railway.app/api
```

**Important:** Replace `your-backend-url.railway.app` with your actual backend URL:
- If using Railway: `https://mobilaws-production.up.railway.app/api`
- If using Heroku: `https://mobilaws-backend.herokuapp.com/api`
- If using Render: `https://mobilaws-backend.onrender.com/api`

#### Firebase Configuration (Required)

```
Name: VITE_FIREBASE_API_KEY
Value: your_firebase_api_key

Name: VITE_FIREBASE_AUTH_DOMAIN
Value: your-project.firebaseapp.com

Name: VITE_FIREBASE_PROJECT_ID
Value: your-project-id

Name: VITE_FIREBASE_STORAGE_BUCKET
Value: your-project.appspot.com

Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: your_sender_id

Name: VITE_FIREBASE_APP_ID
Value: your_app_id

Name: VITE_FIREBASE_MEASUREMENT_ID
Value: G-XXXXXXXXXX
```

#### Stripe Configuration (Optional - Only if using payments)

```
Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_live_your_publishable_key
```

#### Google OAuth (Optional - Only if using fallback OAuth)

```
Name: VITE_GOOGLE_CLIENT_ID
Value: your_google_client_id.apps.googleusercontent.com
```

### Step 3: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **⋯ (three dots)** → **Redeploy**
4. OR push a new commit to trigger automatic redeployment

---

## 🖥️ Backend Deployment (If Not Already Done)

If you haven't deployed your backend yet, you MUST do this first:

### Option 1: Railway (Recommended - Free Tier Available)

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. **IMPORTANT:** Set **Root Directory** to `ai-backend`
5. Add these environment variables in Railway:

```bash
NODE_ENV=production
PORT=8000
OPENAI_API_KEY=your_openai_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@mobilaws.com
FRONTEND_URL=https://mobilaws.vercel.app
CORS_ORIGINS=https://mobilaws.vercel.app
```

6. Copy your Railway URL (e.g., `https://mobilaws-production.up.railway.app`)
7. Use this URL in Vercel's `VITE_API_URL` (add `/api` at the end)

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Set **Root Directory** to `ai-backend`
5. Add the same environment variables as above
6. Copy your Render URL and use it in Vercel

---

## 🔍 How to Find Your Firebase Config

If you don't have your Firebase config:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ (gear icon) → **Project settings**
4. Scroll down to **"Your apps"**
5. Click on your web app or click **"Add app"** if you haven't created one
6. Copy all the config values

---

## 📊 How to Verify the Fix

After redeploying with the correct environment variables, open your browser console on your production site and check:

### ✅ Should see:
```
✅ Firebase initialized successfully
✅ User authenticated
✅ Backend connected
✅ Chatbot initialized successfully
```

### ❌ Should NOT see:
```
❌ useAuth must be used within an AuthProvider
❌ Failed to load Stripe.js
❌ Backend not connected
❌ CORS policy error
```

---

## 🆘 Troubleshooting

### Still seeing "Backend not connected"?

**Problem:** `VITE_API_URL` is not set or incorrect

**Solution:**
1. Check that `VITE_API_URL` is set in Vercel environment variables
2. Verify the backend URL is correct and ends with `/api`
3. Make sure your backend is actually running (visit the URL in browser)
4. Redeploy Vercel after adding the variable

### Still seeing "Failed to fetch"?

**Problem:** Backend is not deployed or CORS is blocking requests

**Solution:**
1. Deploy your backend to Railway/Render/Heroku
2. In backend environment variables, set:
   ```
   FRONTEND_URL=https://mobilaws.vercel.app
   CORS_ORIGINS=https://mobilaws.vercel.app
   ```
3. Restart your backend service

### Still seeing "useAuth" errors?

**Problem:** Browser cache is loading old JavaScript

**Solution:**
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Try in incognito/private mode

### Stripe not loading?

**Problem:** `VITE_STRIPE_PUBLISHABLE_KEY` is not set

**Solution:**
1. Get your Stripe publishable key from [Stripe Dashboard](https://dashboard.stripe.com)
2. Add it to Vercel environment variables
3. Redeploy

---

## 📝 Quick Checklist

Before going live, make sure you have:

- [ ] ✅ Fixed CSP errors (already done in code)
- [ ] ✅ Removed duplicate AuthContext (already done in code)
- [ ] 🔧 Set `VITE_API_URL` in Vercel
- [ ] 🔧 Deployed backend to Railway/Render/Heroku
- [ ] 🔧 Added all Firebase config variables to Vercel
- [ ] 🔧 Added Stripe key to Vercel (if using payments)
- [ ] 🔧 Redeployed Vercel after adding variables
- [ ] ✅ Verified production site works without errors

---

## 🎉 Expected Result

After following all steps, your production site should:

1. ✅ Load without CSP errors
2. ✅ Allow users to sign in with Google
3. ✅ Connect to backend successfully
4. ✅ Display user profile and subscription info
5. ✅ Process Stripe payments (if configured)
6. ✅ Show no console errors

---

## Need Help?

If you're still seeing errors after following this guide:

1. Check browser console for specific error messages
2. Verify all environment variables are spelled correctly (they're case-sensitive)
3. Make sure you redeployed after adding variables
4. Try the backend URL directly in your browser to confirm it's running

All code fixes have been applied. The remaining steps are configuration-only and require access to your Vercel dashboard and backend hosting service.

