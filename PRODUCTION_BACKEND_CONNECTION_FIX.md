# 🔧 Production Backend Connection Fix

## ❌ **Problem**
Your website www.mobilaws.com shows "Backend Offline" even though:
- ✅ Backend is running at https://mobilaws-ympe.vercel.app
- ✅ VITE_API_URL is set in Vercel

## ✅ **What Was Fixed**

### 1. **Hardcoded Localhost URLs Removed**
Found and fixed hardcoded `localhost:8000` URLs in:
- ✅ `src/contexts/SubscriptionContext.tsx` (line 431)
- ✅ `src/components/MyTickets.tsx` (line 58)
- ✅ `src/components/SupportDialog.tsx` (line 54)

All now use `getApiUrl()` from `@/lib/api.ts` which respects environment variables.

### 2. **Diagnostic Tool Added**
Created `/public/config-check.html` to help diagnose deployment issues.

---

## 🚀 **Next Steps to Deploy**

### **Step 1: Commit and Push Changes**

```powershell
git add .
git commit -m "Fix: Remove hardcoded localhost URLs, add diagnostic tool"
git push origin main
```

### **Step 2: Wait for Auto-Deployment**
Vercel will automatically deploy the changes (2-3 minutes).

### **Step 3: Verify the Fix**

#### Option A: Visit Diagnostic Page
1. Go to: **https://www.mobilaws.com/config-check.html**
2. You should see:
   - ✅ API URL is configured correctly
   - ✅ Backend is ONLINE
   - ✅ API is working

#### Option B: Test Main App
1. Go to: **https://www.mobilaws.com**
2. Open browser console (F12)
3. Look for:
   ```
   ✅ Backend connected!
   🔧 Backend Service initialized with: https://mobilaws-ympe.vercel.app
   ```

---

## 🔍 **If Still Showing "Backend Offline"**

### Check #1: Is VITE_API_URL Set?
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **frontend** project (the one that deploys to www.mobilaws.com)
3. Go to **Settings** → **Environment Variables**
4. Verify you have:
   ```
   Name: VITE_API_URL
   Value: https://mobilaws-ympe.vercel.app/api
   ```
5. Make sure it's set for **Production**, **Preview**, AND **Development**

### Check #2: Did You Redeploy After Setting Env Var?
Environment variables only take effect **after a new deployment**.

To force redeploy:
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **"⋯"** menu → **"Redeploy"**

### Check #3: Is the Domain Pointing to Right Project?
1. Go to your Vercel project settings
2. Click **Domains**
3. Verify **www.mobilaws.com** is listed there
4. If not, click **"Add Domain"** and add it

### Check #4: Backend CORS Configuration
The backend needs to allow requests from www.mobilaws.com.

1. Go to your **backend** Vercel project (mobilaws-ympe)
2. Settings → Environment Variables
3. Find `CORS_ORIGINS`
4. It should include:
   ```
   CORS_ORIGINS=https://www.mobilaws.com,https://mobilaws.com,https://mobilaws.vercel.app
   ```
   (Notice: includes both www and non-www versions)

5. If you update CORS_ORIGINS, redeploy the backend too

---

## 📊 **Quick Test Commands**

### Test Backend Health
```powershell
curl https://mobilaws-ympe.vercel.app/healthz
```
Should return: `{"ok":true}`

### Test CORS from Your Domain
```powershell
curl -H "Origin: https://www.mobilaws.com" https://mobilaws-ympe.vercel.app/api/search?q=test
```
Should NOT return CORS error.

### Test API Search
```powershell
curl "https://mobilaws-ympe.vercel.app/api/search?q=penal&k=3"
```
Should return JSON with search results.

---

## ✅ **Expected Result**

After deployment, your app should:

1. ✅ Show "Backend Connected" indicator (green dot)
2. ✅ AI responses work in chat
3. ✅ Search returns accurate results
4. ✅ No "Backend Offline" warnings
5. ✅ Console shows: `✅ Backend connected: https://mobilaws-ympe.vercel.app`

---

## 🆘 **Still Having Issues?**

Use the diagnostic page: **https://www.mobilaws.com/config-check.html**

It will tell you exactly what's wrong:
- If VITE_API_URL is not set
- If it's pointing to localhost
- If backend is unreachable
- If CORS is blocking requests

Take a screenshot of the diagnostic page and share it for further help.

---

## 📋 **Deployment Checklist**

- [ ] Committed and pushed code changes
- [ ] Waited for Vercel deployment to complete
- [ ] Verified VITE_API_URL is set in Vercel (frontend project)
- [ ] Verified CORS_ORIGINS includes www.mobilaws.com (backend project)
- [ ] Tested https://www.mobilaws.com/config-check.html
- [ ] Opened www.mobilaws.com and checked console (F12)
- [ ] Tried asking a question in the chat
- [ ] Confirmed AI responses are working
- [ ] Backend status shows "Connected" (green dot)

---

**Last Updated:** November 20, 2024  
**Status:** Ready to Deploy ✅

