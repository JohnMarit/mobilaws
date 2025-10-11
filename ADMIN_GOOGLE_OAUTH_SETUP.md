# 🔐 Admin Google OAuth Authentication Setup

## ✅ What's Been Implemented

I've successfully implemented **Google OAuth authentication with email whitelist** for the admin dashboard. This replaces the magic link system with a more secure and user-friendly solution.

### Key Features:
- ✅ **Google OAuth Sign-In** - One-click authentication with Google
- ✅ **Email Whitelist** - Only authorized emails can access admin dashboard
- ✅ **Secure Backend Validation** - Backend verifies Google credentials and checks whitelist
- ✅ **Dynamic API URLs** - Frontend works in both development and production
- ✅ **Protected Admin Routes** - All admin endpoints require valid authentication

---

## 📋 Setup Instructions

### **Step 1: Free Up Disk Space** ⚠️

Your system is running low on disk space. Before continuing:

```powershell
# Clean up temporary files
Remove-Item -Recurse -Force $env:TEMP\*

# Clean npm cache
npm cache clean --force

# Check available space
Get-PSDrive C
```

### **Step 2: Install Backend Dependencies**

```bash
cd ai-backend
npm install google-auth-library
```

### **Step 3: Set Up Environment Variables**

#### **Backend Environment Variables** (ai-backend/.env or Vercel):

```env
# Admin Configuration
ADMIN_EMAILS=thuchabraham42@gmail.com
GOOGLE_CLIENT_ID=your_google_client_id_here

# Other existing variables...
NODE_ENV=production
PORT=8000
OPENAI_API_KEY=your_key
# ... etc
```

#### **Frontend Environment Variables** (.env or Vercel):

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend API (for production)
VITE_API_URL=https://your-backend.vercel.app/api
```

### **Step 4: Get Google OAuth Credentials**

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create or Select a Project**

3. **Enable Google+ API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Mobilaws Admin"
   
5. **Configure Authorized JavaScript Origins:**
   ```
   http://localhost:5173
   https://mobilaws.vercel.app
   ```

6. **Configure Authorized Redirect URIs:**
   ```
   http://localhost:5173
   https://mobilaws.vercel.app
   ```

7. **Copy the Client ID** - You'll need this for both frontend and backend

---

## 🚀 Deployment Guide

### **Option 1: Deploy Backend to Vercel** (Recommended)

#### A. Create Separate Backend Project:

```bash
cd ai-backend
rm -rf .vercel  # PowerShell: Remove-Item -Recurse -Force .vercel
vercel --prod
```

When prompted:
```
? Set up and deploy? yes
? Which scope? [your-account]
? Link to existing project? no
? What's your project's name? mobilaws-backend
? In which directory is your code located? ./
? Want to override settings? N
```

#### B. Set Environment Variables in Vercel:

Go to: `https://vercel.com/[your-account]/mobilaws-backend/settings/environment-variables`

Add all variables from Step 3 (Backend).

#### C. Redeploy:
```bash
vercel --prod
```

Copy the production URL (e.g., `https://mobilaws-backend-xxx.vercel.app`)

### **Option 2: Deploy Backend to Railway** (Alternative)

```bash
cd ai-backend

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

Set environment variables in Railway dashboard.

---

## 🔧 Configure Frontend

### Update Frontend Environment Variables:

In Vercel dashboard for **mobilaws** (frontend):

```
VITE_API_URL = https://mobilaws-backend-xxx.vercel.app/api
VITE_GOOGLE_CLIENT_ID = your_google_client_id
```

### Redeploy Frontend:

```bash
# From root directory
vercel --prod
```

---

## 🧪 Testing

### **Local Testing:**

1. **Start Backend:**
   ```bash
   cd ai-backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   # In new terminal, from root
   npm run dev
   ```

3. **Test Admin Login:**
   - Go to: `http://localhost:5173/admin/login`
   - Click "Sign in with Google"
   - Use authorized email: `thuchabraham42@gmail.com`
   - Should redirect to admin dashboard

### **Production Testing:**

1. Go to: `https://mobilaws.vercel.app/admin/login`
2. Click "Sign in with Google"
3. Sign in with `thuchabraham42@gmail.com`
4. Should redirect to admin dashboard

---

## 👥 Managing Admin Users

### **Add New Admin Email:**

#### Backend (.env or Vercel):
```env
ADMIN_EMAILS=thuchabraham42@gmail.com,newadmin@example.com,another@example.com
```

#### Frontend (AdminLogin.tsx - line 165):
```typescript
Current authorized emails:
- thuchabraham42@gmail.com
- newadmin@example.com
- another@example.com
```

### **Remove Admin Access:**

Simply remove the email from `ADMIN_EMAILS` and redeploy.

---

## 🔒 Security Features

### ✅ Implemented Security:

1. **Email Whitelist** - Only pre-approved emails can access admin
2. **Google OAuth Verification** - Backend verifies Google credentials
3. **Protected Routes** - All admin API routes check email whitelist
4. **Session Tokens** - Secure session management
5. **HTTPS Only** - Production uses HTTPS

### 🔐 Additional Security (Recommended):

1. **JWT Tokens** - Replace UUID tokens with JWT
2. **Rate Limiting** - Add rate limiting to admin endpoints
3. **Audit Logging** - Log all admin actions
4. **2FA** - Add two-factor authentication

---

## 📁 Files Modified

### **Backend:**
- ✅ `ai-backend/src/env.ts` - Added ADMIN_EMAILS and GOOGLE_CLIENT_ID
- ✅ `ai-backend/src/routes/auth.ts` - Added Google OAuth admin endpoint
- ✅ `ai-backend/src/routes/admin.ts` - Updated verifyAdmin middleware

### **Frontend:**
- ✅ `src/pages/AdminLogin.tsx` - Replaced magic link with Google OAuth
- ✅ `src/pages/AdminVerify.tsx` - Simplified redirect page
- ✅ `src/contexts/AdminContext.tsx` - Updated API calls to use dynamic URLs
- ✅ `src/lib/api.ts` - Already configured for dynamic backend URL

---

## 🐛 Troubleshooting

### **"Google OAuth is not configured"**
- Check that `VITE_GOOGLE_CLIENT_ID` is set in frontend environment
- Redeploy frontend after adding environment variables

### **"Access denied. Your email is not authorized"**
- Verify email is in `ADMIN_EMAILS` in backend environment
- Make sure backend has been redeployed after updating environment

### **"Failed to fetch" or Connection Refused**
- Check that backend is running (local) or deployed (production)
- Verify `VITE_API_URL` is correctly set in frontend
- Check Content Security Policy in `index.html`

### **Google Sign-In Button Not Showing**
- Check browser console for errors
- Verify Google Client ID is correct
- Ensure JavaScript origins are configured in Google Cloud Console

### **ENOSPC Error (Disk Space)**
- Free up disk space (see Step 1)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

---

## 📊 Admin Dashboard Features

Once logged in, admins can:

1. **User Management**
   - View all users
   - Update user status (active/suspended)
   - Search users

2. **Subscription Management**
   - View all subscriptions
   - Update subscription plans
   - Manage tokens

3. **Support Management**
   - View support tickets
   - Respond to tickets
   - Update ticket status

4. **Statistics**
   - Total users, subscriptions
   - Revenue metrics
   - Support ticket stats

---

## 🎯 Next Steps

1. **Free up disk space** on your system
2. **Install google-auth-library** package
3. **Get Google OAuth credentials**
4. **Deploy backend to Vercel/Railway**
5. **Configure environment variables**
6. **Test admin login**
7. **Add more admin emails** if needed

---

## 💡 Tips

- **Keep admin emails list updated** - Remove access immediately for ex-admins
- **Use environment variables** - Never hardcode credentials
- **Monitor admin access** - Check backend logs regularly
- **Test in incognito** - Ensure OAuth flow works for new users
- **Backup admin data** - Implement regular backups for production

---

## 📞 Support

If you encounter issues:

1. Check backend logs: `vercel logs mobilaws-backend`
2. Check frontend logs: Browser DevTools (F12) > Console
3. Verify environment variables are set
4. Ensure Google OAuth is configured correctly
5. Check that backend is accessible from frontend

---

**Implementation Status:** ✅ Complete (pending `google-auth-library` installation)

**Ready for Production:** Yes (after completing setup steps above)

