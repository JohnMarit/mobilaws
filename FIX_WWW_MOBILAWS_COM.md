# 🔧 Fix www.mobilaws.com Backend Connection

## 🎯 Goal
Make **www.mobilaws.com** connect to the backend properly.

---

## ✅ **Step-by-Step Fix**

### **PART 1: Frontend Configuration (www.mobilaws.com project)**

#### **Step 1: Open Vercel Dashboard**
1. Go to: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find the project that has **www.mobilaws.com** in its domains
3. Click on that project

#### **Step 2: Set Environment Variables**

Go to **Settings** → **Environment Variables**

**Add/Update these REQUIRED variables:**

##### **1. Backend API URL (CRITICAL)**
```
Name:  VITE_API_URL
Value: https://mobilaws-ympe.vercel.app/api
```
✅ Enable for: **Production**, **Preview**, **Development** (all 3)

##### **2. Firebase Configuration (Required)**
```
Name:  VITE_FIREBASE_API_KEY
Value: (your Firebase API key)

Name:  VITE_FIREBASE_AUTH_DOMAIN
Value: (your-project-id).firebaseapp.com

Name:  VITE_FIREBASE_PROJECT_ID
Value: (your-project-id)

Name:  VITE_FIREBASE_STORAGE_BUCKET
Value: (your-project-id).appspot.com

Name:  VITE_FIREBASE_MESSAGING_SENDER_ID
Value: (your sender ID)

Name:  VITE_FIREBASE_APP_ID
Value: (your app ID)

Name:  VITE_FIREBASE_MEASUREMENT_ID
Value: G-XXXXXXXXXX
```
✅ Enable for: **Production**, **Preview**, **Development** (all 3)

**To find your Firebase config:**
- Go to [Firebase Console](https://console.firebase.google.com)
- Select your project
- Click ⚙️ Settings → Project settings
- Scroll to "Your apps" → Web app
- Copy the config values

#### **Step 3: Redeploy Frontend**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"⋯"** → **"Redeploy"**
4. Wait 2-3 minutes

---

### **PART 2: Backend Configuration (mobilaws-ympe project)**

#### **Step 4: Update Backend CORS**

The backend needs to allow requests from www.mobilaws.com.

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find the **BACKEND project** (mobilaws-ympe)
3. Go to **Settings** → **Environment Variables**
4. Find `CORS_ORIGINS`

**Update it to include www.mobilaws.com:**

```
Name:  CORS_ORIGINS
Value: https://www.mobilaws.com,https://mobilaws.com,https://mobilaws.vercel.app,http://localhost:5173,http://localhost:3000
```

**Important:** Include BOTH:
- `https://www.mobilaws.com` (with www)
- `https://mobilaws.com` (without www)

✅ Enable for: **Production**, **Preview**, **Development** (all 3)

#### **Step 5: Redeploy Backend**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"⋯"** → **"Redeploy"**
4. Wait 2-3 minutes

---

## 🧪 **Step 6: Verify the Fix**

### **Test 1: Check Environment Variables**
1. Visit: **https://www.mobilaws.com/config-check.html**
2. You should see:
   - ✅ API URL is configured correctly
   - ✅ Backend is ONLINE
   - ✅ API is working

### **Test 2: Check Browser Console**
1. Visit: **https://www.mobilaws.com**
2. Press **F12** to open console
3. Look for:
   ```
   ✅ Backend connected: https://mobilaws-ympe.vercel.app
   🔧 Backend Service initialized with: https://mobilaws-ympe.vercel.app
   ```

### **Test 3: Test AI Chat**
1. Ask a question in the chat
2. Should get AI response (not "Backend Offline")
3. Green "Backend Connected" indicator should show

### **Test 4: Test CORS**
Run this command:
```powershell
curl -H "Origin: https://www.mobilaws.com" https://mobilaws-ympe.vercel.app/api/search?q=test
```
Should NOT return CORS error.

---

## 📋 **Complete Checklist**

### **Frontend (www.mobilaws.com project)**
- [ ] Opened Vercel Dashboard
- [ ] Found project with www.mobilaws.com
- [ ] Added `VITE_API_URL=https://mobilaws-ympe.vercel.app/api`
- [ ] Added all Firebase environment variables
- [ ] Enabled all variables for Production, Preview, Development
- [ ] Redeployed frontend
- [ ] Waited for deployment to complete

### **Backend (mobilaws-ympe project)**
- [ ] Opened backend project in Vercel
- [ ] Updated `CORS_ORIGINS` to include `https://www.mobilaws.com`
- [ ] Also included `https://mobilaws.com` (without www)
- [ ] Redeployed backend
- [ ] Waited for deployment to complete

### **Verification**
- [ ] Tested https://www.mobilaws.com/config-check.html
- [ ] Checked browser console (F12)
- [ ] Tried AI chat - got response
- [ ] No "Backend Offline" message
- [ ] Green "Backend Connected" indicator shows

---

## 🚨 **Troubleshooting**

### **Still shows "Backend Offline"?**

#### **Check 1: Environment Variables**
- Open https://www.mobilaws.com/config-check.html
- If it says "VITE_API_URL is NOT set", the environment variable wasn't applied
- **Fix:** Make sure you redeployed AFTER adding the variable

#### **Check 2: CORS Error**
- Open browser console (F12)
- Look for red CORS errors
- **Fix:** Make sure `CORS_ORIGINS` in backend includes `https://www.mobilaws.com`

#### **Check 3: Old Deployment**
- Check Vercel deployment logs
- Make sure latest deployment completed successfully
- **Fix:** Redeploy if needed

#### **Check 4: Browser Cache**
- Try incognito/private mode
- Or hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

---

## 📊 **Quick Test Commands**

### **Test Backend Health**
```powershell
curl https://mobilaws-ympe.vercel.app/healthz
```
Expected: `{"ok":true}`

### **Test CORS from www.mobilaws.com**
```powershell
curl -H "Origin: https://www.mobilaws.com" https://mobilaws-ympe.vercel.app/api/search?q=test
```
Should NOT say "CORS error"

### **Test API Search**
```powershell
curl "https://mobilaws-ympe.vercel.app/api/search?q=penal&k=3"
```
Should return JSON with search results

---

## ✅ **Expected Result**

After completing all steps:

1. ✅ www.mobilaws.com shows "Backend Connected" (green indicator)
2. ✅ AI chat responds with answers
3. ✅ Search returns results
4. ✅ No "Backend Offline" warnings
5. ✅ Console shows: `✅ Backend connected: https://mobilaws-ympe.vercel.app`

---

## 🆘 **Need Help?**

If still not working after following all steps:

1. **Take screenshot** of:
   - Vercel environment variables (frontend project)
   - Vercel environment variables (backend project)
   - Browser console errors (F12)
   - https://www.mobilaws.com/config-check.html results

2. **Check deployment logs:**
   - Frontend: Vercel → Deployments → Latest → View Logs
   - Backend: Vercel → mobilaws-ympe → Deployments → Latest → View Logs

3. **Verify DNS:**
   - www.mobilaws.com should point to Vercel
   - Check your domain registrar's DNS settings

---

**Last Updated:** November 20, 2024  
**Status:** Ready to Deploy ✅

