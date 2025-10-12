# 🔧 Fix CORS Error for Admin Login

## ❌ The Error

```
Access to fetch at 'https://mobilaws-backend-9jvks6sdf-johnmarits-projects.vercel.app/api/auth/admin/google' 
from origin 'https://mobilaws.vercel.app' has been blocked by CORS policy
```

## ✅ The Solution

You need to add your frontend URL to the backend's CORS allowed origins.

---

## 📋 Step-by-Step Fix

### Option 1: Using Vercel Dashboard (Recommended)

1. **Go to your backend project on Vercel**
   - Visit: https://vercel.com/dashboard
   - Click on `mobilaws-backend` project

2. **Go to Settings → Environment Variables**

3. **Find or add `CORS_ORIGINS`**
   
   **If it exists:** Edit it to include your frontend URL
   ```
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://mobilaws.vercel.app
   ```
   
   **If it doesn't exist:** Add a new variable
   ```
   Name: CORS_ORIGINS
   Value: http://localhost:5173,http://localhost:3000,https://mobilaws.vercel.app
   ```
   
   ⚠️ **Important:** 
   - Separate multiple URLs with commas (no spaces)
   - Include `https://mobilaws.vercel.app` (your frontend URL)

4. **Redeploy your backend**
   - Go to Deployments tab
   - Click the 3 dots on latest deployment
   - Click "Redeploy"

---

### Option 2: Using Vercel CLI (Faster)

```bash
# Go to backend directory
cd ai-backend

# Add/update the CORS_ORIGINS variable
vercel env rm CORS_ORIGINS production
vercel env add CORS_ORIGINS production

# When prompted, enter:
http://localhost:5173,http://localhost:3000,https://mobilaws.vercel.app

# Redeploy
git add .
git commit -m "Fix CORS for admin login"
git push

# Or force redeploy
vercel --prod
```

---

## 🔍 What Changed in Code

I've updated `ai-backend/src/server.ts` to include admin headers:

**Before:**
```typescript
allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
```

**After:**
```typescript
allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Email', 'X-Admin-Token']
```

**Action Needed:** 
```bash
# Commit and push this change
git add ai-backend/src/server.ts
git commit -m "Add admin headers to CORS config"
git push
```

---

## 🧪 After the Fix

1. **Wait for backend to redeploy** (1-2 minutes)

2. **Clear browser cache**
   - Press `Ctrl + Shift + R` (Windows)
   - Or `Cmd + Shift + R` (Mac)

3. **Try admin login again**
   - Go to: https://mobilaws.vercel.app/admin/login
   - Click "Sign in with Google"
   - Sign in with `thuchabraham42@gmail.com`

4. **Should work now!** ✅

---

## 🔍 Verify CORS Settings

After redeploying, you can test the CORS configuration:

```bash
# Test from command line
curl -X OPTIONS https://mobilaws-backend-9jvks6sdf-johnmarits-projects.vercel.app/api/auth/admin/google \
  -H "Origin: https://mobilaws.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

You should see:
```
Access-Control-Allow-Origin: https://mobilaws.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Admin-Email, X-Admin-Token
```

---

## 📊 Summary of Changes

### Backend Environment Variable
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://mobilaws.vercel.app
```

### Backend Code (server.ts)
- ✅ Added `X-Admin-Email` to allowed headers
- ✅ Added `X-Admin-Token` to allowed headers

### Deployment
- ✅ Commit code changes
- ✅ Push to GitHub
- ✅ Set CORS_ORIGINS in Vercel
- ✅ Redeploy backend

---

## 🎯 Quick Checklist

- [ ] Updated `ai-backend/src/server.ts` (already done)
- [ ] Committed and pushed changes
- [ ] Set `CORS_ORIGINS` in backend Vercel project
- [ ] Redeployed backend
- [ ] Waited for deployment to finish
- [ ] Cleared browser cache
- [ ] Tested admin login

---

## 🐛 If Still Not Working

### Check Backend Logs
```bash
vercel logs mobilaws-backend --follow
```

Look for CORS-related errors or rejected origins.

### Check Browser Console
1. Open browser console (F12)
2. Go to Network tab
3. Try logging in
4. Look at the OPTIONS request (preflight)
5. Check response headers

Should see:
```
access-control-allow-origin: https://mobilaws.vercel.app
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: content-type, authorization, x-api-key, x-admin-email, x-admin-token
```

### Common Issues

**Issue: Still getting CORS error**
- Make sure you redeployed backend after setting CORS_ORIGINS
- Check that CORS_ORIGINS value is correct (no typos)
- Clear browser cache completely

**Issue: Environment variable not taking effect**
- Vercel requires a redeploy after adding/changing env vars
- Make sure you set it for "Production" environment
- Check Vercel deployment logs to confirm variable is loaded

---

## 💡 Understanding CORS

**What is CORS?**
- Cross-Origin Resource Sharing
- Browser security feature
- Prevents websites from accessing APIs on different domains

**Why the error happened:**
- Your frontend: `https://mobilaws.vercel.app`
- Your backend: `https://mobilaws-backend-9jvks6sdf-johnmarits-projects.vercel.app`
- Different domains = CORS check

**The fix:**
- Backend explicitly allows requests from frontend domain
- Set in `CORS_ORIGINS` environment variable
- Backend sends proper CORS headers in response

---

## 🚀 After Everything Works

Once admin login works, you can:
1. ✅ Sign in with `thuchabraham42@gmail.com`
2. ✅ Access admin dashboard
3. ✅ Manage users, subscriptions, support tickets
4. ✅ View statistics

---

**Status:** Ready to fix! Follow Option 1 or Option 2 above.

**Expected Time:** 5 minutes (+ deployment time)

**Result:** Admin login will work in production! 🎉


