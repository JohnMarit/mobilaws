# 🔧 Fix Frontend Backend Connection

## ❌ The Problem

Your frontend is trying to connect to:
```
http://localhost:8000
```

But your backend is actually at:
```
https://mobilaws-ympe.vercel.app
```

This is why you see the CORS error and no chat responses.

---

## ✅ The Solution

Set `VITE_API_URL` environment variable in your **FRONTEND** Vercel project.

---

## 📋 Step-by-Step Fix

### Step 1: Go to Vercel Dashboard
https://vercel.com/dashboard

### Step 2: Select FRONTEND Project
**Important:** Select `mobilaws` (your frontend, NOT `mobilaws-ympe`)

### Step 3: Go to Settings
- Click **"Settings"** tab (top menu)
- Click **"Environment Variables"** in left sidebar

### Step 4: Add/Update VITE_API_URL

#### If Variable Exists:
- Find: `VITE_API_URL`
- Click "Edit" (pencil icon)
- Update value to: `https://mobilaws-ympe.vercel.app/api`
- Click "Save"

#### If Variable Doesn't Exist:
- Click **"Add New"**
- **Key:** `VITE_API_URL`
- **Value:** `https://mobilaws-ympe.vercel.app/api`
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

### Step 5: Redeploy Frontend

⚠️ **CRITICAL:** Environment variables don't update automatically!

1. **Go to "Deployments" tab**
2. **Find latest deployment** (top of list)
3. **Click "⋯"** (three dots) on the right
4. **Click "Redeploy"**
5. **Confirm:** Click "Redeploy" again
6. **Wait:** 1-2 minutes for deployment

---

## ✅ Step 6: Verify Fix

After redeployment:

1. **Clear browser cache:**
   - Press `Ctrl + Shift + R` (Windows/Linux)
   - Or `Cmd + Shift + R` (Mac)

2. **Go to your app:**
   - https://mobilaws.vercel.app

3. **Open browser console:**
   - Press `F12`
   - Go to "Console" tab

4. **Check for success:**
   - Should see: `✅ VITE_API_URL is set: https://mobilaws-ympe.vercel.app/api`
   - Should NOT see: `localhost:8000`

5. **Try chatting:**
   - Ask: "What legal information do you have?"
   - Should get a proper response with citations!

---

## 🐛 Troubleshooting

### Still seeing localhost after redeploy?
- **Clear browser cache completely**
- **Try in incognito/private window**
- **Wait 2-3 minutes and try again**

### Frontend shows error after redeploy?
- **Check environment variable is set correctly**
- **Make sure you redeployed the FRONTEND (mobilaws), not backend**
- **Check browser console for new errors**

### "Backend offline" message?
- **Test backend directly:** `https://mobilaws-ympe.vercel.app/healthz`
- **Should return:** `{"ok":true}`
- **If not, backend needs redeployment**

---

## 📊 Summary

**What you're fixing:**
```
Before (Broken):
Frontend → tries localhost:8000 → FAILS ❌

After (Working):
Frontend → https://mobilaws-ympe.vercel.app/api → SUCCESS ✅
```

**Environment variables needed:**

| Project | Variable | Value |
|---------|----------|-------|
| **mobilaws** (frontend) | `VITE_API_URL` | `https://mobilaws-ympe.vercel.app/api` |
| **mobilaws-ympe** (backend) | (already configured) | ✅ |

---

## 🎯 Quick Checklist

- [ ] Go to Vercel Dashboard
- [ ] Select **mobilaws** (frontend project)
- [ ] Settings → Environment Variables
- [ ] Add/Update: `VITE_API_URL=https://mobilaws-ympe.vercel.app/api`
- [ ] Select all environments
- [ ] Save
- [ ] Deployments → Redeploy
- [ ] Wait 2 minutes
- [ ] Clear browser cache
- [ ] Test chat!

---

**Ready?** Go set that environment variable now! 🚀

