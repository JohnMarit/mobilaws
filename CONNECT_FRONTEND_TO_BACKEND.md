# 🔗 Connect Frontend to Backend - URGENT

## ⚠️ Current Problem

Your backend is **LIVE and working**:
✅ `https://mobilaws-ympe.vercel.app`

But your frontend is still looking for:
❌ `http://localhost:8000`

## 🔧 Fix (5 minutes)

### Step 1: Open Vercel Dashboard

👉 [vercel.com/dashboard](https://vercel.com/dashboard)

### Step 2: Select FRONTEND Project

**NOT** `mobilaws-ympe` (that's the backend)

Select: **`mobilaws`** (your frontend project)

### Step 3: Add Environment Variable

1. Click **Settings** (left sidebar)
2. Click **Environment Variables**
3. Click **Add New**

**Enter these values:**

```
Name:  VITE_API_URL
Value: https://mobilaws-ympe.vercel.app/api
```

⚠️ **IMPORTANT:** 
- Must be EXACTLY `VITE_API_URL` (case-sensitive)
- Must end with `/api`
- Use YOUR backend URL (mobilaws-ympe.vercel.app)

4. Select **Production** environment (check the box)
5. Click **Save**

### Step 4: Redeploy Frontend

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"⋯"** (three dots menu)
4. Click **"Redeploy"**
5. Wait 1-2 minutes

### Step 5: Verify

After redeployment, visit:
```
https://mobilaws.vercel.app
```

Open browser console (F12) and you should see:
```
🔧 API Configuration:
  - API Base URL: https://mobilaws-ympe.vercel.app/api
```

Instead of:
```
  - API Base URL: http://localhost:8000/api
```

## ✅ Expected Result

After these steps:

1. **Sign in with Google** → User syncs to backend
2. **Open Admin Panel** → Users appear in list
3. **Click "Sync from Firestore"** → Previous users imported

---

## 📋 Quick Checklist

- [ ] Opened Vercel Dashboard
- [ ] Selected FRONTEND project (mobilaws)
- [ ] Added `VITE_API_URL=https://mobilaws-ympe.vercel.app/api`
- [ ] Selected Production environment
- [ ] Saved the variable
- [ ] Redeployed frontend
- [ ] Waited for deployment to complete
- [ ] Tested sign-in
- [ ] Checked admin panel

---

## 🆘 Still Not Working?

### Verify Backend is Running

Visit: `https://mobilaws-ympe.vercel.app/healthz`

Should return: `{"status": "ok"}`

### Check Frontend Config

1. Visit your frontend
2. Open console (F12)
3. Look for: `🔧 API Configuration:`
4. Should show your backend URL, not localhost

### Clear Cache

If still showing localhost:
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or try incognito mode

---

## ⚡ Quick Copy

**Environment Variable:**
```
VITE_API_URL=https://mobilaws-ympe.vercel.app/api
```

**Your Backend URL:**
```
https://mobilaws-ympe.vercel.app
```

**Your Frontend URL:**
```
https://mobilaws.vercel.app
```

---

This is the ONLY thing blocking your deployment from working!

