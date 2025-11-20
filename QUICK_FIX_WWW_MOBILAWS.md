# ⚡ Quick Fix: www.mobilaws.com Backend Connection

## 🎯 **The Problem**
- ✅ mobilaws.vercel.app → Backend works
- ❌ www.mobilaws.com → Backend offline

**Why?** Different Vercel projects with different configurations!

---

## 🔧 **THE FIX (5 Minutes)**

### **Step 1: Frontend Project (www.mobilaws.com)**

1. **Go to:** [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Find:** Project with `www.mobilaws.com` domain
3. **Click:** Settings → Environment Variables
4. **Add/Update:**
   ```
   VITE_API_URL = https://mobilaws-ympe.vercel.app/api
   ```
5. **Check:** Production ✅ Preview ✅ Development ✅
6. **Click:** Save
7. **Go to:** Deployments → Redeploy

---

### **Step 2: Backend Project (mobilaws-ympe)**

1. **Go to:** [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Find:** Project `mobilaws-ympe` (your backend)
3. **Click:** Settings → Environment Variables
4. **Find:** `CORS_ORIGINS`
5. **Update to:**
   ```
   https://www.mobilaws.com,https://mobilaws.com,https://mobilaws.vercel.app,http://localhost:5173
   ```
6. **Check:** Production ✅ Preview ✅ Development ✅
7. **Click:** Save
8. **Go to:** Deployments → Redeploy

---

## ✅ **Verify (2 Minutes)**

1. **Wait** 2-3 minutes for deployments
2. **Visit:** https://www.mobilaws.com/config-check.html
3. **Should see:** ✅ All green checkmarks
4. **Visit:** https://www.mobilaws.com
5. **Open console:** Press F12
6. **Should see:** `✅ Backend connected`

---

## 🚨 **Still Not Working?**

### **Check 1: Did you redeploy?**
Environment variables only work after redeployment!

### **Check 2: Browser cache?**
- Try incognito mode
- Or hard refresh: **Ctrl+Shift+R**

### **Check 3: Wrong project?**
Make sure you're editing the project that has `www.mobilaws.com` in its domains list!

---

## 📋 **What You Need**

### **Frontend Project:**
```
VITE_API_URL = https://mobilaws-ympe.vercel.app/api
```

### **Backend Project:**
```
CORS_ORIGINS = https://www.mobilaws.com,https://mobilaws.com,https://mobilaws.vercel.app
```

**That's it!** 🎉

