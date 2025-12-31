# 🔧 Deployment Fix Guide

## Issue 1: White Screen & CSP Violation

The Content Security Policy was blocking inline scripts. This has been fixed by updating `index.html` to allow `'unsafe-inline'` for scripts.

## Issue 2: VITE_API_URL Not Set

The app cannot connect to the backend because `VITE_API_URL` environment variable is not set in production.

### Fix Steps

#### 1. Set Environment Variable in Vercel (Frontend)

Go to your frontend Vercel project:

1. Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.vercel.app/api`
   - **Environment:** Production, Preview, Development (select all)
3. Click "Save"

**Example:**
```
VITE_API_URL=https://mobilaws-ympe.vercel.app/api
```

#### 2. Redeploy Frontend

After setting the environment variable:

```bash
git add .
git commit -m "Fix CSP and add deployment config"
git push
```

Vercel will automatically redeploy with the new environment variable.

#### 3. Verify Backend is Running

Check that your backend is deployed and running:
- Visit: `https://your-backend-url.vercel.app/api/health`
- Should return: `{ "status": "ok" }`

If backend is not deployed:
```bash
cd ai-backend
git add .
git commit -m "Deploy backend"
git push
```

---

## Quick Checklist

### Frontend (mobilaws.vercel.app)
- ✅ CSP updated to allow inline scripts
- ⚠️ Set `VITE_API_URL` in Vercel environment variables
- ⚠️ Redeploy after setting env var

### Backend (mobilaws-ympe.vercel.app/api)
- ✅ Should be deployed and running
- ✅ Test: `/api/health` endpoint
- ✅ Firebase credentials configured

---

## Testing After Deployment

### 1. Check Console (F12)
Open browser console and look for:
- ✅ No CSP errors
- ✅ API URL is correct (not localhost)
- ✅ No connection errors

### 2. Test Features
- ✅ Login works
- ✅ Tutor admin portal loads
- ✅ Learning hub shows published courses
- ✅ Certifications work

### 3. Expected Console Output
```
🔧 API Configuration:
  - Environment: production
  - API Base URL: https://mobilaws-ympe.vercel.app/api
```

If you see `http://localhost:8000/api` in production, the env var is not set correctly.

---

## Common Issues & Solutions

### Issue: Still seeing white screen
**Solution:** 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check console for errors

### Issue: "VITE_API_URL is not set" in console
**Solution:**
1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Add `VITE_API_URL` with your backend URL
4. Redeploy (Settings → Deployments → ... → Redeploy)

### Issue: API calls failing
**Solution:**
1. Check backend is deployed: `https://your-backend.vercel.app/api/health`
2. Check CORS is configured in backend
3. Check Firebase credentials in backend

### Issue: CSP errors still appearing
**Solution:**
1. Check the updated `index.html` was deployed
2. Clear browser cache
3. Check for duplicate CSP headers in `vercel.json`

---

## Environment Variables Needed

### Frontend (.env or Vercel Environment Variables)
```bash
VITE_API_URL=https://mobilaws-ympe.vercel.app/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Backend (Vercel Environment Variables)
```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
OPENAI_API_KEY=sk-...
```

---

## Deployment Commands

### Frontend
```bash
# From root directory
git add .
git commit -m "Fix deployment issues"
git push origin main
```

### Backend
```bash
# From root directory
cd ai-backend
git add .
git commit -m "Update backend"
git push origin main
```

---

## Quick Fix Summary

1. ✅ Updated CSP in `index.html` to allow inline scripts
2. ⚠️ **YOU NEED TO:** Set `VITE_API_URL` in Vercel environment variables
3. ⚠️ **YOU NEED TO:** Redeploy frontend after setting env var
4. ✅ Test that backend is running at `/api/health`

After these steps, your app should work correctly!

