# 🔐 Admin Access Guide - www.mobilaws.com

## ✅ **SECURE: Only `thuchabraham42@gmail.com` Can Access**

---

## 🚀 **Quick Start: How to Access Admin Panel**

### **Step 1: Go to Admin Login**
```
https://www.mobilaws.com/admin/login
```

### **Step 2: Sign in with Google**
1. Click **"Sign in with Google"** button
2. Select account: `thuchabraham42@gmail.com`
3. Authorize the app

### **Step 3: Access Dashboard**
- ✅ If successful → Redirected to `/admin/dashboard`
- ❌ If unauthorized → Error message displayed

---

## 🔒 **Security Features**

Your admin panel is protected by **6 layers of security**:

### **1. Google OAuth Verification**
- Only valid Google accounts can attempt login
- Google verifies the OAuth token
- Invalid tokens are rejected immediately

### **2. Email Whitelist**
- Only `thuchabraham42@gmail.com` is authorized
- Email extracted from verified Google token
- Case-insensitive comparison (`THUCHABRAHAM42@GMAIL.COM` = `thuchabraham42@gmail.com`)

### **3. Backend Validation**
- Backend checks email against `ADMIN_EMAILS` environment variable
- Unauthorized emails receive 403 Forbidden
- All attempts logged with IP address

### **4. Session Token**
- Random 64-character token generated on successful login
- Required for all admin API requests
- Stored securely in localStorage

### **5. Request Authentication**
- Every admin API request requires headers:
  - `X-Admin-Email`: Admin email
  - `X-Admin-Token`: Session token
- Missing or invalid credentials → 401/403 error

### **6. Rate Limiting**
- Login attempts are rate-limited
- Prevents brute force attacks
- IP-based throttling

---

## 📋 **Configuration Required**

### **Backend (Vercel - `mobilaws-ympe` project)**

**Environment Variables:**
```bash
ADMIN_EMAILS=thuchabraham42@gmail.com
GOOGLE_CLIENT_ID=843281701937-m1qi0rt6q7r33h45801n0nueu44krod8.apps.googleusercontent.com
CORS_ORIGINS=https://www.mobilaws.com,https://mobilaws.com,https://mobilaws.vercel.app
```

**How to Set:**
1. [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **mobilaws-ympe**
3. Settings → Environment Variables
4. Add/Update:
   - `ADMIN_EMAILS` = `thuchabraham42@gmail.com`
   - `GOOGLE_CLIENT_ID` = `843281701937-m1qi0rt6q7r33h45801n0nueu44krod8.apps.googleusercontent.com`
   - `CORS_ORIGINS` = `https://www.mobilaws.com,https://mobilaws.com,https://mobilaws.vercel.app`
5. Apply to: **Production**, **Preview**, **Development**
6. **Save** and **Redeploy**

---

### **Frontend (Vercel - `www.mobilaws.com` project)**

**Environment Variables:**
```bash
VITE_API_URL=https://mobilaws-ympe.vercel.app/api
VITE_GOOGLE_CLIENT_ID=843281701937-m1qi0rt6q7r33h45801n0nueu44krod8.apps.googleusercontent.com
```

**How to Set:**
1. [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project
3. Settings → Environment Variables
4. Add/Update:
   - `VITE_API_URL` = `https://mobilaws-ympe.vercel.app/api`
   - `VITE_GOOGLE_CLIENT_ID` = `843281701937-m1qi0rt6q7r33h45801n0nueu44krod8.apps.googleusercontent.com`
5. Apply to: **Production**, **Preview**, **Development**
6. **Save** and **Redeploy**

---

### **Google Cloud Console**

**OAuth 2.0 Client ID Configuration:**

1. Go to: [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID starting with `843281701937-...`
3. Click to edit

**Authorized JavaScript origins:**
```
https://www.mobilaws.com
https://mobilaws.com
https://mobilaws.vercel.app
```

**Authorized redirect URIs:**
```
https://www.mobilaws.com
https://mobilaws.com
https://mobilaws.vercel.app
```

4. **Save** changes

**OAuth Consent Screen:**

1. Go to: [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. If in "Testing" mode, add test user:
   ```
   thuchabraham42@gmail.com
   ```
3. **Save**

---

## 🧪 **Test Your Admin Access**

### **✅ Test 1: Authorized Access (Should Work)**

1. Go to: https://www.mobilaws.com/admin/login
2. Click "Sign in with Google"
3. Sign in with: `thuchabraham42@gmail.com`

**Expected Result:**
```
✅ Google verifies token
✅ Backend checks email: thuchabraham42@gmail.com
✅ Email found in whitelist
✅ Session token generated
✅ Redirect to /admin/dashboard
```

---

### **❌ Test 2: Unauthorized Access (Should Fail)**

1. Go to: https://www.mobilaws.com/admin/login
2. Click "Sign in with Google"
3. Sign in with: `another.email@gmail.com`

**Expected Result:**
```
✅ Google verifies token
✅ Backend checks email: another.email@gmail.com
❌ Email NOT in whitelist
❌ HTTP 403 Forbidden
⚠️  Backend logs: "Unauthorized admin access attempt: another.email@gmail.com"
```

**Error Message:**
```
"You are not authorized to access the admin panel."
```

---

### **❌ Test 3: Direct API Access (Should Fail)**

```bash
curl https://mobilaws-ympe.vercel.app/api/admin/stats
```

**Expected Result:**
```json
{
  "error": "Authentication required",
  "message": "Admin credentials not provided"
}
```

**Status:** 401 Unauthorized

---

## 🛡️ **Admin Permissions**

Once logged in as `thuchabraham42@gmail.com`, you can access:

### **Dashboard (`/admin/dashboard`)**
- View total users, subscriptions, revenue, support tickets
- View prompt usage statistics
- Real-time analytics

### **User Management (`/admin/users`)**
- View all registered users
- Search users by email/name
- Update user status (active/suspended/banned)
- View user details and subscriptions

### **Subscription Management (`/admin/subscriptions`)**
- View all subscriptions
- Filter by plan type or status
- Update subscription details
- Grant tokens manually to users

### **Support Tickets (`/admin/support`)**
- View all support tickets
- Filter by status (open/in_progress/resolved/closed)
- Respond to tickets
- Update ticket status

### **Grant Tokens**
- Manually grant tokens to users who cannot pay online
- Useful for users paying via mobile money or other methods

---

## 📊 **What Gets Logged**

### **Successful Login:**
```
✅ Admin login successful: thuchabraham42@gmail.com
```

### **Unauthorized Login Attempt:**
```
⚠️  Unauthorized admin access attempt: hacker@example.com
```

### **Unauthorized API Access:**
```
⚠️  Unauthorized admin access attempt from: hacker@example.com (IP: 123.456.789.0)
```

All logs can be viewed in:
- Vercel Deployment Logs
- Backend Runtime Logs

---

## 🚨 **Troubleshooting**

### **Problem 1: "Access denied" for correct email**

**Possible Causes:**
- Environment variable not set or incorrect
- Typo in email address
- Backend not redeployed after setting variable

**Solution:**
1. Check backend environment variable:
   ```bash
   ADMIN_EMAILS=thuchabraham42@gmail.com
   ```
2. Verify no extra spaces or typos
3. Redeploy backend
4. Clear browser cache
5. Try again in incognito mode

---

### **Problem 2: "Google OAuth is not configured"**

**Possible Causes:**
- `GOOGLE_CLIENT_ID` not set in backend
- `VITE_GOOGLE_CLIENT_ID` not set in frontend
- Frontend or backend not redeployed

**Solution:**
1. Check backend:
   ```bash
   GOOGLE_CLIENT_ID=843281701937-m1qi0rt6q7r33h45801n0nueu44krod8.apps.googleusercontent.com
   ```
2. Check frontend:
   ```bash
   VITE_GOOGLE_CLIENT_ID=843281701937-m1qi0rt6q7r33h45801n0nueu44krod8.apps.googleusercontent.com
   ```
3. Redeploy both projects
4. Try again

---

### **Problem 3: Redirect loop or blank page**

**Possible Causes:**
- Browser cache issue
- Conflicting cookies
- Frontend/backend mismatch

**Solution:**
1. Clear browser cache and cookies
2. Try in incognito/private mode
3. Check browser console (F12) for errors
4. Verify both domains point to correct Vercel project
5. Check CORS settings in backend

---

### **Problem 4: "Failed to fetch" or Network Error**

**Possible Causes:**
- Backend is offline
- CORS not configured correctly
- API URL is wrong

**Solution:**
1. Check backend is online:
   ```
   https://mobilaws-ympe.vercel.app/healthz
   ```
   Should return: `{"status": "ok"}`

2. Check frontend `VITE_API_URL`:
   ```bash
   VITE_API_URL=https://mobilaws-ympe.vercel.app/api
   ```

3. Check backend `CORS_ORIGINS`:
   ```bash
   CORS_ORIGINS=https://www.mobilaws.com,https://mobilaws.com,https://mobilaws.vercel.app
   ```

4. Redeploy both projects

---

## 🔐 **Add More Admins (Optional)**

### **Current: Single Admin**
```bash
ADMIN_EMAILS=thuchabraham42@gmail.com
```

### **Add Multiple Admins:**
```bash
ADMIN_EMAILS=thuchabraham42@gmail.com,admin2@example.com,admin3@example.com
```

**Format:**
- Comma-separated
- No spaces (spaces are trimmed automatically)
- Lowercase conversion automatic

**Steps:**
1. Update `ADMIN_EMAILS` in Vercel backend
2. Redeploy backend
3. New admins can now login

---

## 🎯 **Quick Reference**

| Item | Value |
|------|-------|
| **Admin Login URL** | https://www.mobilaws.com/admin/login |
| **Authorized Email** | thuchabraham42@gmail.com |
| **Backend API** | https://mobilaws-ympe.vercel.app/api |
| **Backend Project** | mobilaws-ympe |
| **Frontend Project** | (Your frontend project name) |
| **Google Client ID** | 843281701937-m1qi0rt6q7r33h45801n0nueu44krod8... |

---

## ✅ **Security Status: SECURE**

| Security Layer | Status | Details |
|---------------|--------|---------|
| Email Whitelist | ✅ Active | Only `thuchabraham42@gmail.com` |
| Google OAuth | ✅ Active | Token verification |
| Backend Validation | ✅ Active | Email check on every request |
| Session Tokens | ✅ Active | Required for API access |
| Rate Limiting | ✅ Active | Brute force prevention |
| Audit Logging | ✅ Active | All attempts logged |
| CORS Protection | ✅ Active | Origin restrictions |

---

## 📝 **Summary**

### **✅ What's Protected:**
- Admin login page
- Admin dashboard
- User management endpoints
- Subscription management endpoints
- Support ticket endpoints
- Grant tokens endpoints
- Statistics endpoints

### **✅ Who Can Access:**
- `thuchabraham42@gmail.com` ✅
- Any other email ❌

### **✅ How It's Protected:**
- Google OAuth verification
- Email whitelist check
- Session token requirement
- Rate limiting
- Audit logging
- CORS restrictions

---

**🚀 Ready to access?**

Go to: **https://www.mobilaws.com/admin/login**

Sign in with: **thuchabraham42@gmail.com**

---

**Last Updated:** November 20, 2024  
**Security Status:** ✅ Verified Secure  
**Authorized Admin:** thuchabraham42@gmail.com

🎉 **Your admin panel is fully secured and ready to use!**

