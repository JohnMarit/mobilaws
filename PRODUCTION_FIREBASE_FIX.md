# 🔧 Fix: Firebase Not Available in Production

## Problem
You're getting this error after deploying:
```
❌ Firebase login failed: Error: Firebase auth not available
```

This happens because **Firebase environment variables are not set in your production environment**.

---

## ✅ Solution (for Vercel)

### Step 1: Get Your Firebase Configuration

Your app needs these environment variables (from Firebase Console):

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Step 2: Add Environment Variables to Vercel

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable one by one:
   - **Key**: `VITE_FIREBASE_API_KEY`
   - **Value**: Your Firebase API key
   - **Environment**: Check all (Production, Preview, Development)
5. Click **Save**
6. Repeat for all Firebase variables

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add VITE_FIREBASE_API_KEY
# Paste your API key when prompted
# Select: Production, Preview, Development

# Repeat for all variables
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID
vercel env add VITE_GOOGLE_CLIENT_ID
```

### Step 3: Redeploy Your Application

After adding environment variables:

```bash
# Option 1: Push to trigger auto-deploy
git commit --allow-empty -m "Trigger redeploy"
git push

# Option 2: Redeploy via Vercel CLI
vercel --prod

# Option 3: Redeploy via Vercel Dashboard
# Go to Deployments → Click "..." → Redeploy
```

---

## 🔍 How to Find Your Firebase Configuration

### From Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the **⚙️ Settings** icon → **Project settings**
4. Scroll to **Your apps** section
5. Select your web app or create one
6. You'll see the Firebase SDK configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-app.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-app.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123:web:abc...",
     measurementId: "G-ABC..."
   };
   ```

### For Google OAuth Client ID:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Copy the **Client ID** (looks like: `123-abc.apps.googleusercontent.com`)

---

## 🎯 Verify It's Working

After redeploying, check your browser console:
- ✅ **Success**: `Firebase initialized successfully (Auth + Firestore)`
- ❌ **Still failing**: Check if all environment variables are set correctly

### Quick Debug:
Open browser console on your production site and run:
```javascript
// Check if Firebase is initialized
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'
});
```

---

## 📱 Alternative: Use Google OAuth Fallback

If you don't want to use Firebase in production, the app has a fallback Google OAuth option:

1. Keep Firebase for development
2. In production, only set `VITE_GOOGLE_CLIENT_ID`
3. The app will automatically use the fallback OAuth flow

However, this means you'll lose:
- Firestore database integration
- User data persistence
- Subscription tracking in the cloud

---

## 🚨 Common Issues

### Issue 1: "Firebase auth not available"
**Cause**: Environment variables not set or not prefixed with `VITE_`
**Fix**: All Vite environment variables MUST start with `VITE_`

### Issue 2: Variables not updating
**Cause**: Vercel cached the old build
**Fix**: Go to Settings → Clear Build Cache → Redeploy

### Issue 3: "Unauthorized domain"
**Cause**: Your production domain is not authorized in Firebase
**Fix**: 
1. Firebase Console → Authentication → Settings
2. Add your Vercel domain to **Authorized domains**
   - Example: `your-app.vercel.app`

---

## 📋 Checklist

- [ ] All Firebase environment variables added to Vercel
- [ ] Environment variables use `VITE_` prefix
- [ ] Variables are set for Production environment
- [ ] Application redeployed after adding variables
- [ ] Production domain added to Firebase authorized domains
- [ ] Google OAuth domain added to authorized JavaScript origins
- [ ] Verified in browser console that Firebase initializes

---

## 💡 Need Help?

If you're still having issues:
1. Check Vercel deployment logs for errors
2. Verify Firebase project is active
3. Check that billing is enabled on Firebase (if using paid features)
4. Ensure Google OAuth consent screen is configured

---

**Last Updated**: October 2025

