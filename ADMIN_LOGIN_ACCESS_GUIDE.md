# ✅ Admin Login Access Guide - www.mobilaws.com/admin/login

## 🎯 **What Was Fixed**

### **1. Fixed API Request Mismatch ✅**
- **Problem:** Frontend was sending `credential` but backend expected `token`
- **Fix:** Updated AdminLogin.tsx to send `token: response.credential`
- **Result:** Backend now receives the correct parameter

### **2. Enhanced Google Sign-In ✅**
- Added fallback button rendering
- Better error handling
- Improved loading states
- Multiple sign-in methods (One Tap + Button)

### **3. Routing Configuration ✅**
- Route is properly configured in `App.tsx`
- Vercel.json has SPA rewrite rules
- All admin routes are protected

---

## 🚀 **How to Access Admin Panel**

### **Step 1: Navigate to Admin Login**
```
https://www.mobilaws.com/admin/login
```

### **Step 2: Sign In with Google**
1. Click "Sign in with Google" button
2. Select your Google account: **thuchabraham42@gmail.com**
3. Complete Google authentication

### **Step 3: Automatic Redirect**
- If email matches: ✅ Redirected to `/admin/dashboard`
- If email doesn't match: ❌ "Access denied" error

---

## ✅ **Required Configuration**

### **Frontend (Vercel - www.mobilaws.com project)**

**Environment Variables:**
```
VITE_API_URL = https://mobilaws-ympe.vercel.app/api
VITE_GOOGLE_CLIENT_ID = your_google_client_id.apps.googleusercontent.com
```

### **Backend (Vercel - mobilaws-ympe project)**

**Environment Variables:**
```
GOOGLE_CLIENT_ID = your_google_client_id.apps.googleusercontent.com
ADMIN_EMAILS = thuchabraham42@gmail.com
CORS_ORIGINS = https://www.mobilaws.com,https://mobilaws.com,https://mobilaws.vercel.app
```

---

## 🔍 **Troubleshooting**

### **Issue: "Google OAuth is not configured"**
**Solution:**
1. Go to Vercel Dashboard → Frontend project
2. Settings → Environment Variables
3. Add: `VITE_GOOGLE_CLIENT_ID = your_client_id`
4. Redeploy frontend

### **Issue: "Access denied" even with correct email**
**Solution:**
1. Go to Vercel Dashboard → Backend project (mobilaws-ympe)
2. Settings → Environment Variables
3. Verify: `ADMIN_EMAILS = thuchabraham42@gmail.com`
4. Redeploy backend

### **Issue: 404 Error on /admin/login**
**Solution:**
1. Verify `vercel.json` has rewrite rules
2. Clear browser cache
3. Try incognito mode
4. Redeploy frontend

### **Issue: CORS Error**
**Solution:**
1. Go to Backend Vercel project
2. Settings → Environment Variables
3. Update: `CORS_ORIGINS = https://www.mobilaws.com,https://mobilaws.com`
4. Redeploy backend

### **Issue: Backend not responding**
**Solution:**
1. Test backend: `https://mobilaws-ympe.vercel.app/healthz`
2. Should return: `{"ok":true}`
3. If not, check backend deployment logs

---

## 📋 **Quick Checklist**

### **Before Accessing Admin:**
- [ ] `VITE_API_URL` is set in frontend Vercel project
- [ ] `VITE_GOOGLE_CLIENT_ID` is set in frontend Vercel project
- [ ] `GOOGLE_CLIENT_ID` is set in backend Vercel project
- [ ] `ADMIN_EMAILS` includes `thuchabraham42@gmail.com` in backend
- [ ] `CORS_ORIGINS` includes `https://www.mobilaws.com` in backend
- [ ] Both frontend and backend are deployed
- [ ] Using Google account: `thuchabraham42@gmail.com`

---

## 🔐 **Security Features**

✅ **Email Whitelist** - Only authorized emails can access  
✅ **Backend Validation** - Server verifies email before allowing access  
✅ **Session Tokens** - Secure token-based authentication  
✅ **Rate Limiting** - Prevents brute force attacks  
✅ **CORS Protection** - Only allowed origins can make requests  

---

## 📝 **What Happens When You Login**

1. **Frontend:** User clicks "Sign in with Google"
2. **Google:** Opens OAuth popup, user authenticates
3. **Frontend:** Sends Google credential token to backend
4. **Backend:** Verifies token with Google
5. **Backend:** Checks if email is in `ADMIN_EMAILS` whitelist
6. **Backend:** If authorized, returns admin user + session token
7. **Frontend:** Stores admin session, redirects to dashboard
8. **Dashboard:** Loads admin panel with full access

---

## 🆘 **Still Having Issues?**

### **Check Browser Console (F12)**
Look for:
- ✅ "Google OAuth initialized for admin login"
- ✅ API request to `/api/auth/admin/google`
- ❌ Any red error messages

### **Check Network Tab (F12)**
1. Click "Sign in with Google"
2. Look for request to: `https://mobilaws-ympe.vercel.app/api/auth/admin/google`
3. Check response status:
   - `200` = Success ✅
   - `403` = Email not authorized ❌
   - `400` = Missing token ❌
   - `500` = Server error ❌

### **Verify Environment Variables**
Run these checks:
```javascript
// In browser console on /admin/login page
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Set' : 'NOT SET');
```

---

**Status:** ✅ Ready to Access  
**Last Updated:** November 20, 2024

